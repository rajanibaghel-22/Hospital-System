import mongoose from "mongoose";

const questionnaireSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true, // one questionnaire per appointment
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    symptoms: [String],
    symptomDuration: String,   // e.g. "3 days"
    hasAllergies: { type: Boolean, default: false },
    allergies: String,
    currentMedications: String,
    existingConditions: String,
    additionalNotes: String,
  },
  { timestamps: true }
);

export default mongoose.model("Questionnaire", questionnaireSchema);
