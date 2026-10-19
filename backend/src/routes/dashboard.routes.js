import express from "express";
const router = express.Router();
import { getPatientDashboard } from "../controllers/dashboard.controller.js";
import { protect } from "../middleware/auth.middleware.js";

router.get("/", protect, getPatientDashboard);

export default router;
