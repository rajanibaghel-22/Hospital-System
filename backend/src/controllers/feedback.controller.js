import Feedback from "../models/Feedback.js";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import asyncHandler from "../utils/asyncHandler.js";

// Recalculates a doctor's average rating from all their feedback
const updateDoctorRating = async (doctorId) => {
  const result = await Feedback.aggregate([
    { $match: { doctor: doctorId } },
    { $group: { _id: "$doctor", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const averageRating = result.length ? Math.round(result[0].avg * 10) / 10 : 0;
  const totalReviews = result.length ? result[0].count : 0;

  await Doctor.findByIdAndUpdate(doctorId, { averageRating, totalReviews });
};

// POST /api/feedback    body: { appointmentId, rating, comment }
const createFeedback = asyncHandler(async (req, res) => {
  const { appointmentId, rating, comment } = req.body;

  if (!appointmentId || !rating) {
    res.status(400);
    throw new Error("appointmentId and rating are required");
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }
  if (!appointment.patient.equals(req.user._id)) {
    res.status(403);
    throw new Error("This is not your appointment");
  }
  // Only patients who actually visited can review
  if (appointment.status !== "completed") {
    res.status(400);
    throw new Error("You can only review a completed appointment");
  }

  const existing = await Feedback.findOne({ appointment: appointmentId });
  if (existing) {
    res.status(409);
    throw new Error("You have already reviewed this appointment");
  }

  const feedback = await Feedback.create({
    patient: req.user._id,
    doctor: appointment.doctor,
    appointment: appointmentId,
    rating,
    comment,
  });

  await updateDoctorRating(appointment.doctor);

  res.status(201).json({ success: true, feedback });
});

// GET /api/feedback/doctor/:doctorId
const getDoctorFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.find({ doctor: req.params.doctorId })
    .populate("patient", "name")
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ success: true, count: feedback.length, feedback });
});

export { createFeedback, getDoctorFeedback };
