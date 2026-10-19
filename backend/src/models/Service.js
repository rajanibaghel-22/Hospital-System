import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "MRI Scan"
    description: { type: String, trim: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    price: { type: Number, min: 0 },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Lets you search services by name
serviceSchema.index({ name: "text", description: "text" });

export default mongoose.model("Service", serviceSchema);
