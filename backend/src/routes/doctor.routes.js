import express from "express";
const router = express.Router();
import {
  getDoctors,
  getDoctorById,
  getDoctorSlots,
  getConsultationFee,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  updateAvailability,
} from "../controllers/doctor.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

// Public
router.get("/", getDoctors);                 // ?search=&department=&mode=&status=
router.get("/:id", getDoctorById);
router.get("/:id/slots", getDoctorSlots);    // ?date=YYYY-MM-DD
router.get("/:id/fee", getConsultationFee);  // ?mode=online

// Admin only
router.post("/", protect, authorize("admin"), createDoctor);
router.put("/:id", protect, authorize("admin"), updateDoctor);
router.delete("/:id", protect, authorize("admin"), deleteDoctor);
router.patch("/:id/availability", protect, authorize("admin"), updateAvailability);

export default router;
