
import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },

    date: {
      type: String,
      required: true,
    },

    timeSlot: {
      type: String,
      required: true,
    },

    mode: {
      type: String,
      enum: ["in-person", "online", "phone"],
      default: "in-person",
    },

    reason: {
      type: String,
      trim: true,
    },

    // Pre-Appointment Health Questionnaire
    questionnaire: {
      symptoms: {
        type: String,
        trim: true,
        maxlength: 500,
        default: "",
      },

      duration: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "",
      },

      allergies: {
        type: String,
        trim: true,
        maxlength: 300,
        default: "",
      },

      medicalHistory: {
        type: String,
        trim: true,
        maxlength: 500,
        default: "",
      },

      currentMedicines: {
        type: String,
        trim: true,
        maxlength: 300,
        default: "",
      },
    },

    status: {
      type: String,
      enum: ["booked", "cancelled", "completed", "no-show"],
      default: "booked",
    },

    // Token and queue
    tokenNumber: {
      type: Number,
    },

    queuePosition: {
      type: Number,
    },

    fee: {
      type: Number,
      required: true,
    },

    cancelledAt: Date,

    cancelReason: String,
  },
  { timestamps: true }
);

// Prevent duplicate active bookings for the same doctor,
// date and time slot.
appointmentSchema.index(
  { doctor: 1, date: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "booked" },
  }
);

export default mongoose.model("Appointment", appointmentSchema);
