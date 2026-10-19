import Questionnaire from "../models/Questionnaire.js";
import Appointment from "../models/Appointment.js";
import asyncHandler from "../utils/asyncHandler.js";

// POST /api/questionnaire
// body: { appointmentId, symptoms, symptomDuration, hasAllergies, allergies,
//         currentMedications, existingConditions, additionalNotes }
const submitQuestionnaire = asyncHandler(async (req, res) => {
  const {
    appointmentId,
    symptoms,
    symptomDuration,
    hasAllergies,
    allergies,
    currentMedications,
    existingConditions,
    additionalNotes,
  } = req.body;

  if (!appointmentId) {
    res.status(400);
    throw new Error("appointmentId is required");
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
  if (appointment.status !== "booked") {
    res.status(400);
    throw new Error("Questionnaire can only be filled for a booked appointment");
  }

  const existing = await Questionnaire.findOne({ appointment: appointmentId });
  if (existing) {
    res.status(409);
    throw new Error("Questionnaire already submitted for this appointment");
  }

  // We pick each field ourselves instead of passing req.body straight in
  const questionnaire = await Questionnaire.create({
    appointment: appointmentId,
    patient: req.user._id,
    symptoms,
    symptomDuration,
    hasAllergies,
    allergies,
    currentMedications,
    existingConditions,
    additionalNotes,
  });

  res.status(201).json({ success: true, questionnaire });
});

// GET /api/questionnaire/appointment/:appointmentId
const getQuestionnaireByAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.appointmentId);
  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }

  const isOwner = appointment.patient.equals(req.user._id);
  if (!isOwner && req.user.role !== "admin") {
    res.status(403);
    throw new Error("You are not allowed to view this questionnaire");
  }

  const questionnaire = await Questionnaire.findOne({
    appointment: appointment._id,
  });
  if (!questionnaire) {
    res.status(404);
    throw new Error("No questionnaire submitted for this appointment");
  }

  res.json({ success: true, questionnaire });
});

export { submitQuestionnaire, getQuestionnaireByAppointment };
