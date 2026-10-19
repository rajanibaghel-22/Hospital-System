// Combines all routes in one place so app.js stays clean
import express from "express";
import authRoutes from "./auth.routes.js";
import doctorRoutes from "./doctor.routes.js";
import departmentRoutes from "./department.routes.js";
import serviceRoutes from "./service.routes.js";
import hospitalRoutes from "./hospital.routes.js";
import appointmentRoutes from "./appointment.routes.js";
import questionnaireRoutes from "./questionnaire.routes.js";
import feedbackRoutes from "./feedback.routes.js";
import dashboardRoutes from "./dashboard.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/doctors", doctorRoutes);
router.use("/departments", departmentRoutes);
router.use("/services", serviceRoutes);
router.use("/hospital", hospitalRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/questionnaire", questionnaireRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
