import Appointment from "../models/Appointment.js";

// Next token for a doctor on a date: 1, 2, 3 ...
// Cancelled appointments keep their token, so numbers are never reused.
const getNextToken = async (doctorId, date) => {
  const last = await Appointment.findOne({ doctor: doctorId, date })
    .sort({ tokenNumber: -1 })
    .select("tokenNumber");

  return (last?.tokenNumber || 0) + 1;
};

// Re-numbers the queue (1, 2, 3 ...) for all active appointments of a
// doctor on a date, ordered by time slot.
// Call it after booking, cancelling or completing an appointment.
const updateQueue = async (doctorId, date) => {
  const active = await Appointment.find({
    doctor: doctorId,
    date,
    status: "booked",
  })
    .sort({ timeSlot: 1 })
    .select("_id");

  const operations = active.map((appointment, index) => ({
    updateOne: {
      filter: { _id: appointment._id },
      update: { queuePosition: index + 1 },
    },
  }));

  if (operations.length > 0) await Appointment.bulkWrite(operations);
};

export { getNextToken, updateQueue };
