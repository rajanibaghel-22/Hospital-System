import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    image: { type: String, default: "" },
    specialization: { type: String, required: true, trim: true },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    qualification: { type: String, trim: true },  // e.g. "MBBS, MD"
    experience: { type: Number, default: 0 },     // years
    about: { type: String, trim: true },
    languages: [String],

    // Consultation
    consultationFee: { type: Number, required: true, min: 0 },
    consultationModes: {
      type: [String],
      enum: ["in-person", "online", "phone"],
      default: ["in-person"],
    },

    // Availability
    availabilityStatus: {
      type: String,
      enum: ["available", "busy", "on-leave"],
      default: "available",
    },
    workingDays: {
      type: [String],
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      default: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    },
    startTime: { type: String, default: "09:00" }, // 24h format
    endTime: { type: String, default: "17:00" },
    slotDuration: { type: Number, default: 30 },   // minutes

    // Updated whenever a new feedback is added
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Lets you search doctors by name or specialization
doctorSchema.index({ name: "text", specialization: "text" });

export default mongoose.model("Doctor", doctorSchema);
