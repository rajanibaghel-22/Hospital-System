import express from "express";
const router = express.Router();
import {
  submitQuestionnaire,
  getQuestionnaireByAppointment,
} from "../controllers/questionnaire.controller.js";
import { protect } from "../middleware/auth.middleware.js";

router.use(protect);

router.post("/", submitQuestionnaire);
router.get("/appointment/:appointmentId", getQuestionnaireByAppointment);

export default router;
