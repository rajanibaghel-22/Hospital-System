
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "./src/config/db.js";
import User from "./src/models/User.js";

const createAdmin = async () => {
  try {
    await connectDB();

    const email = "admin@careplus.com";
    const password = "Admin@12345";

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      existingAdmin.role = "admin";
      existingAdmin.password = password;
      await existingAdmin.save();

      console.log("Existing account updated to Admin.");
    } else {
      await User.create({
        name: "CarePlus Admin",
        email,
        password,
        role: "admin",
      });

      console.log("Admin account created successfully!");
    }

    console.log("Admin Email:", email);
    console.log("Admin Password:", password);
  } catch (error) {
    console.error("Error creating Admin:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
