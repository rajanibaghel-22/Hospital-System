import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import asyncHandler from "../utils/asyncHandler.js";
import escapeRegex from "../utils/escapeRegex.js";
import calculateFee from "../utils/calculateFee.js";
import {
  isValidDate,
  todayString,
  getSlotsForDate,
} from "../utils/generateSlots.js";

// GET /api/doctors?search=&department=&mode=&status=&page=&limit=
const getDoctors = asyncHandler(async (req, res) => {
  const { search, department, mode, status, page = 1, limit = 10 } = req.query;

  const filter = {};

  if (search) {
    const regex = new RegExp(escapeRegex(String(search)), "i");
    filter.$or = [{ name: regex }, { specialization: regex }];
  }
  if (department) filter.department = String(department);
  if (mode) filter.consultationModes = String(mode);
  if (status) filter.availabilityStatus = String(status);

  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.min(Math.max(Number(limit) || 10, 1), 50);

  const [doctors, total] = await Promise.all([
    Doctor.find(filter)
      .populate("department", "name floor block")
      .sort({ averageRating: -1, name: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Doctor.countDocuments(filter),
  ]);

  res.json({
    success: true,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    count: doctors.length,
    doctors,
  });
});

// GET /api/doctors/:id
const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate(
    "department",
    "name floor block"
  );

  if (!doctor) {
    res.status(404);
    throw new Error("Doctor not found");
  }

  res.json({ success: true, doctor });
});

// GET /api/doctors/:id/slots?date=YYYY-MM-DD
const getDoctorSlots = asyncHandler(async (req, res) => {
  const { date } = req.query;

  if (!date || !isValidDate(date)) {
    res.status(400);
    throw new Error("Please provide a valid date as YYYY-MM-DD");
  }
  if (date < todayString()) {
    res.status(400);
    throw new Error("Cannot view slots for a past date");
  }

  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    res.status(404);
    throw new Error("Doctor not found");
  }

  if (doctor.availabilityStatus === "on-leave") {
    return res.json({
      success: true,
      date,
      message: "Doctor is on leave",
      slots: [],
    });
  }

  const allSlots = getSlotsForDate(doctor, date);

  const booked = await Appointment.find({
    doctor: doctor._id,
    date,
    status: "booked",
  }).select("timeSlot");
  const bookedTimes = new Set(booked.map((a) => a.timeSlot));

  const slots = allSlots.map((time) => ({
    time,
    available: !bookedTimes.has(time),
  }));

  res.json({
    success: true,
    doctorId: doctor._id,
    date,
    totalSlots: slots.length,
    availableCount: slots.filter((s) => s.available).length,
    slots,
  });
});

// GET /api/doctors/:id/fee?mode=online   (no mode = fee for every mode)
const getConsultationFee = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    res.status(404);
    throw new Error("Doctor not found");
  }

  const { mode } = req.query;

  if (mode) {
    if (!doctor.consultationModes.includes(mode)) {
      res.status(400);
      throw new Error(`Doctor does not offer ${mode} consultation`);
    }
    return res.json({
      success: true,
      doctor: doctor.name,
      fee: calculateFee(doctor.consultationFee, mode),
    });
  }

  res.json({
    success: true,
    doctor: doctor.name,
    fees: doctor.consultationModes.map((m) =>
      calculateFee(doctor.consultationFee, m)
    ),
  });
});

// POST /api/doctors   (admin)
const createDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.create(req.body);
  res.status(201).json({ success: true, doctor });
});

// PUT /api/doctors/:id   (admin)
const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!doctor) {
    res.status(404);
    throw new Error("Doctor not found");
  }

  res.json({ success: true, doctor });
});

// DELETE /api/doctors/:id   (admin)
const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndDelete(req.params.id);

  if (!doctor) {
    res.status(404);
    throw new Error("Doctor not found");
  }

  res.json({ success: true, message: "Doctor deleted" });
});

// PATCH /api/doctors/:id/availability   (admin)   body: { availabilityStatus }
const updateAvailability = asyncHandler(async (req, res) => {
  const { availabilityStatus } = req.body;

  if (!availabilityStatus) {
    res.status(400);
    throw new Error("availabilityStatus is required");
  }

  const doctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    { availabilityStatus },
    { new: true, runValidators: true }
  );

  if (!doctor) {
    res.status(404);
    throw new Error("Doctor not found");
  }

  res.json({ success: true, doctor });
});

export {
  getDoctors,
  getDoctorById,
  getDoctorSlots,
  getConsultationFee,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  updateAvailability,
};
