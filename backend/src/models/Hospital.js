import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: String,
    pincode: String,
    phone: String,
    emergencyNumber: String,
    email: String,
    // For showing the hospital on a map
    location: {
      latitude: Number,
      longitude: Number,
    },
    openingHours: { type: String, default: "Mon-Sat, 9:00 AM - 6:00 PM" },
    facilities: [String], // e.g. ["Parking", "Pharmacy", "Cafeteria"]
  },
  { timestamps: true }
);

export default mongoose.model("Hospital", hospitalSchema);
