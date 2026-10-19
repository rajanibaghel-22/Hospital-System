import express from "express";
const router = express.Router();
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "../controllers/service.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

// Public
router.get("/", getServices); // ?search=&department=

// Admin only
router.post("/", protect, authorize("admin"), createService);
router.put("/:id", protect, authorize("admin"), updateService);
router.delete("/:id", protect, authorize("admin"), deleteService);

export default router;
