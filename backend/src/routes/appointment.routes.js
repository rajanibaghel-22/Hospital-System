import express from "express";
const router = express.Router();
import {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
  getDoctorQueue,
  getAllAppointments,
  updateAppointmentStatus,
} from "../controllers/appointment.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

// Every appointment route needs a logged-in user
router.use(protect);

// Patient
router.post("/", createAppointment);
router.get("/my", getMyAppointments);
router.get("/queue/:doctorId", getDoctorQueue); // ?date=YYYY-MM-DD

// Admin
router.get("/", authorize("admin"), getAllAppointments);
router.patch("/:id/status", authorize("admin"), updateAppointmentStatus);

// Keep routes with "/:id" BELOW the fixed ones like "/my" and "/queue"
router.get("/:id", getAppointmentById);
router.patch("/:id/cancel", cancelAppointment);

export default router;
