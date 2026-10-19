import Appointment from "../models/Appointment.js";
import Questionnaire from "../models/Questionnaire.js";
import asyncHandler from "../utils/asyncHandler.js";
import { todayString } from "../utils/generateSlots.js";

// GET /api/dashboard
const getPatientDashboard = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const today = todayString();

  // Run all four queries at the same time
  const [upcoming, recentVisits, statusCounts, recentHealthInfo] =
    await Promise.all([
      Appointment.find({
        patient: patientId,
        status: "booked",
        date: { $gte: today },
      })
        .sort({ date: 1, timeSlot: 1 })
        .limit(5)
        .populate("doctor", "name specialization image")
        .populate("department", "name floor block"),

      Appointment.find({ patient: patientId, status: "completed" })
        .sort({ date: -1, timeSlot: -1 })
        .limit(5)
        .populate("doctor", "name specialization"),

      Appointment.aggregate([
        { $match: { patient: patientId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      Questionnaire.find({ patient: patientId })
        .sort({ createdAt: -1 })
        .limit(3)
        .select(
          "symptoms symptomDuration allergies currentMedications existingConditions createdAt"
        ),
    ]);

  const stats = { booked: 0, completed: 0, cancelled: 0, "no-show": 0 };
  statusCounts.forEach((item) => {
    stats[item._id] = item.count;
  });

  res.json({
    success: true,
    profile: {
      name: req.user.name,
      age: req.user.age,
      gender: req.user.gender,
      bloodGroup: req.user.bloodGroup,
    },
    stats,
    nextAppointment: upcoming[0] || null,
    upcomingAppointments: upcoming,
    recentVisits,
    recentHealthInfo,
  });
});

export { getPatientDashboard };
