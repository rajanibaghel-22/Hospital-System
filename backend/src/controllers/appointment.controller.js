
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import asyncHandler from "../utils/asyncHandler.js";
import calculateFee from "../utils/calculateFee.js";
import { getNextToken, updateQueue } from "../utils/tokenNumber.js";
import {
  isValidDate,
  todayString,
  getSlotsForDate,
} from "../utils/generateSlots.js";

// Is this user the owner of the appointment, or an admin?
const canAccess = (appointment, user) =>
  user.role === "admin" || appointment.patient.equals(user._id);

// POST /api/appointments
// Body: { doctorId, date, timeSlot, mode, reason, questionnaire }
const createAppointment = asyncHandler(async (req, res) => {
  const {
    doctorId,
    date,
    timeSlot,
    mode = "in-person",
    reason,
    questionnaire = {},
  } = req.body;

  if (!doctorId || !date || !timeSlot) {
    res.status(400);
    throw new Error("doctorId, date and timeSlot are required");
  }

  if (!isValidDate(date)) {
    res.status(400);
    throw new Error("Date must be in YYYY-MM-DD format");
  }

  if (date < todayString()) {
    res.status(400);
    throw new Error("Cannot book an appointment in the past");
  }

  const doctor = await Doctor.findById(doctorId);

  if (!doctor) {
    res.status(404);
    throw new Error("Doctor not found");
  }

  if (doctor.availabilityStatus === "on-leave") {
    res.status(400);
    throw new Error("Doctor is on leave");
  }

  if (!doctor.consultationModes.includes(mode)) {
    res.status(400);
    throw new Error(`Doctor does not offer ${mode} consultation`);
  }

  // Check whether the selected slot is valid.
  const validSlots = getSlotsForDate(doctor, date);

  if (!validSlots.includes(timeSlot)) {
    res.status(400);
    throw new Error("This time slot is not available for the doctor");
  }

  // Calculate consultation fee.
  const { total } = calculateFee(doctor.consultationFee, mode);

  const tokenNumber = await getNextToken(doctor._id, date);

  // Safely prepare questionnaire fields.
  const healthQuestionnaire = {
    symptoms:
      typeof questionnaire?.symptoms === "string"
        ? questionnaire.symptoms.trim().slice(0, 500)
        : "",
    duration:
      typeof questionnaire?.duration === "string"
        ? questionnaire.duration.trim().slice(0, 100)
        : "",
    allergies:
      typeof questionnaire?.allergies === "string"
        ? questionnaire.allergies.trim().slice(0, 300)
        : "",
    medicalHistory:
      typeof questionnaire?.medicalHistory === "string"
        ? questionnaire.medicalHistory.trim().slice(0, 500)
        : "",
    currentMedicines:
      typeof questionnaire?.currentMedicines === "string"
        ? questionnaire.currentMedicines.trim().slice(0, 300)
        : "",
  };

  let appointment;

  try {
    appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctor._id,
      department: doctor.department,
      date,
      timeSlot,
      mode,
      reason:
        typeof reason === "string" ? reason.trim().slice(0, 500) : "",
      questionnaire: healthQuestionnaire,
      fee: total,
      tokenNumber,
    });
  } catch (error) {
    // Duplicate active booking for the same slot.
    if (error.code === 11000) {
      res.status(409);
      throw new Error(
        "This slot was just booked. Please choose another one"
      );
    }

    throw error;
  }

  await updateQueue(doctor._id, date);

  // Fetch appointment again with updated queue position.
  const saved = await Appointment.findById(appointment._id)
    .populate("doctor", "name specialization")
    .populate("department", "name floor block");

  res.status(201).json({
    success: true,
    message: "Appointment booked successfully",
    appointment: saved,
  });
});

// GET /api/appointments/my?status=
const getMyAppointments = asyncHandler(async (req, res) => {
  const filter = { patient: req.user._id };

  if (req.query.status) {
    filter.status = String(req.query.status);
  }

  const appointments = await Appointment.find(filter)
    .populate("doctor", "name specialization image")
    .populate("department", "name floor block")
    .sort({ date: -1, timeSlot: -1 });

  res.json({
    success: true,
    count: appointments.length,
    appointments,
  });
});

// GET /api/appointments/:id
const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate("doctor", "name specialization image consultationFee")
    .populate("department", "name floor block");

  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }

  if (!canAccess(appointment, req.user)) {
    res.status(403);
    throw new Error("You are not allowed to view this appointment");
  }

  res.json({ success: true, appointment });
});

// PATCH /api/appointments/:id/cancel
const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }

  if (!canAccess(appointment, req.user)) {
    res.status(403);
    throw new Error("You are not allowed to cancel this appointment");
  }

  if (appointment.status !== "booked") {
    res.status(400);
    throw new Error(
      `Cannot cancel an appointment that is ${appointment.status}`
    );
  }

  appointment.status = "cancelled";
  appointment.cancelledAt = new Date();
  appointment.cancelReason = req.body.cancelReason;
  appointment.queuePosition = undefined;

  await appointment.save();
  await updateQueue(appointment.doctor, appointment.date);

  res.json({
    success: true,
    message: "Appointment cancelled",
    appointment,
  });
});

// GET /api/appointments/queue/:doctorId?date=YYYY-MM-DD
const getDoctorQueue = asyncHandler(async (req, res) => {
  const date = req.query.date || todayString();

  if (!isValidDate(date)) {
    res.status(400);
    throw new Error("Date must be in YYYY-MM-DD format");
  }

  const doctor = await Doctor.findById(req.params.doctorId).select(
    "name specialization"
  );

  if (!doctor) {
    res.status(404);
    throw new Error("Doctor not found");
  }

  const appointments = await Appointment.find({
    doctor: doctor._id,
    date,
    status: "booked",
  })
    .sort({ timeSlot: 1 })
    .select("tokenNumber timeSlot queuePosition patient");

  const queue = appointments.map((appointment) => ({
    tokenNumber: appointment.tokenNumber,
    timeSlot: appointment.timeSlot,
    queuePosition: appointment.queuePosition,
    isYours: appointment.patient.equals(req.user._id),
  }));

  res.json({
    success: true,
    doctor,
    date,
    totalWaiting: queue.length,
    nextToken: queue.length > 0 ? queue[0].tokenNumber : null,
    queue,
  });
});

// GET /api/appointments?status=&doctor=&date=&page=&limit= (admin)
const getAllAppointments = asyncHandler(async (req, res) => {
  const { status, doctor, date, page = 1, limit = 20 } = req.query;

  const filter = {};

  if (status) filter.status = String(status);
  if (doctor) filter.doctor = String(doctor);
  if (date) filter.date = String(date);

  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate("patient", "name email phone")
      .populate("doctor", "name specialization")
      .sort({ date: -1, timeSlot: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Appointment.countDocuments(filter),
  ]);

  res.json({
    success: true,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    appointments,
  });
});

// PATCH /api/appointments/:id/status (admin)
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ["completed", "no-show", "cancelled"];

  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${allowed.join(", ")}`);
  }

  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }

  if (appointment.status !== "booked") {
    res.status(400);
    throw new Error(`Appointment is already ${appointment.status}`);
  }

  appointment.status = status;
  appointment.queuePosition = undefined;

  if (status === "cancelled") {
    appointment.cancelledAt = new Date();
  }

  await appointment.save();
  await updateQueue(appointment.doctor, appointment.date);

  res.json({ success: true, appointment });
});

export {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
  getDoctorQueue,
  getAllAppointments,
  updateAppointmentStatus,
};
