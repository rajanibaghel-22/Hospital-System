import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./src/config/db.js";
import Department from "./src/models/Department.js";
import Doctor from "./src/models/Doctor.js";

const seedData = async () => {
  try {
    await connectDB();

    const departmentData = [
      {
        name: "Cardiology",
        description: "Heart care department",
        floor: "1st Floor",
        block: "Block A",
      },
      {
        name: "Dermatology",
        description: "Skin care department",
        floor: "2nd Floor",
        block: "Block A",
      },
      {
        name: "Orthopedics",
        description: "Bone and joint care department",
        floor: "2nd Floor",
        block: "Block B",
      },
      {
        name: "Pediatrics",
        description: "Child health department",
        floor: "1st Floor",
        block: "Block B",
      },
    ];

    const departments = {};

    for (const item of departmentData) {
      departments[item.name] = await Department.findOneAndUpdate(
        { name: item.name },
        { $set: item },
        { new: true, upsert: true, runValidators: true }
      );
    }

    const doctorData = [
      {
        name: "Dr. Amit Sharma",
        specialization: "Cardiologist",
        department: departments.Cardiology._id,
        qualification: "MBBS, MD",
        experience: 10,
        consultationFee: 500,
        consultationModes: ["in-person", "online"],
        availabilityStatus: "available",
        workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        startTime: "09:00",
        endTime: "17:00",
        slotDuration: 30,
      },
      {
        name: "Dr. Priya Patil",
        specialization: "Dermatologist",
        department: departments.Dermatology._id,
        qualification: "MBBS, MD",
        experience: 7,
        consultationFee: 400,
        consultationModes: ["in-person", "online"],
        availabilityStatus: "available",
        workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        startTime: "10:00",
        endTime: "16:00",
        slotDuration: 30,
      },
      {
        name: "Dr. Rahul Deshmukh",
        specialization: "Orthopedic",
        department: departments.Orthopedics._id,
        qualification: "MBBS, MS",
        experience: 8,
        consultationFee: 450,
        consultationModes: ["in-person"],
        availabilityStatus: "available",
        workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        startTime: "09:00",
        endTime: "15:00",
        slotDuration: 30,
      },
      {
        name: "Dr. Sneha Joshi",
        specialization: "Pediatrician",
        department: departments.Pediatrics._id,
        qualification: "MBBS, MD",
        experience: 6,
        consultationFee: 350,
        consultationModes: ["in-person", "online"],
        availabilityStatus: "available",
        workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        startTime: "10:00",
        endTime: "17:00",
        slotDuration: 30,
      },
    ];

    for (const item of doctorData) {
      await Doctor.findOneAndUpdate(
        { name: item.name },
        { $set: item },
        { new: true, upsert: true, runValidators: true }
      );
    }

    console.log("Departments and sample doctors added successfully!");
    console.log("Departments:", await Department.countDocuments());
    console.log("Doctors:", await Doctor.countDocuments());
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedData();