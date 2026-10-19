import express from "express";
const router = express.Router();
import { getHospital, saveHospital } from "../controllers/hospital.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

router.get("/", getHospital);                                // public
router.put("/", protect, authorize("admin"), saveHospital);  // create or update

export default router;
