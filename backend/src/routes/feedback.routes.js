import express from "express";
const router = express.Router();
import {
  createFeedback,
  getDoctorFeedback,
} from "../controllers/feedback.controller.js";
import { protect } from "../middleware/auth.middleware.js";

router.post("/", protect, createFeedback);
router.get("/doctor/:doctorId", getDoctorFeedback); // public

export default router;
