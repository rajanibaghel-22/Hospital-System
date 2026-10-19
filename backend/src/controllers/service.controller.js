import Service from "../models/Service.js";
import asyncHandler from "../utils/asyncHandler.js";
import escapeRegex from "../utils/escapeRegex.js";

// GET /api/services?search=&department=
const getServices = asyncHandler(async (req, res) => {
  const { search, department } = req.query;
  const filter = { isAvailable: true };

  if (search) {
    const regex = new RegExp(escapeRegex(String(search)), "i");
    filter.$or = [{ name: regex }, { description: regex }];
  }
  if (department) filter.department = String(department);

  const services = await Service.find(filter)
    .populate("department", "name floor block")
    .sort({ name: 1 });

  res.json({ success: true, count: services.length, services });
});

// POST /api/services   (admin)
const createService = asyncHandler(async (req, res) => {
  const service = await Service.create(req.body);
  res.status(201).json({ success: true, service });
});

// PUT /api/services/:id   (admin)
const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!service) {
    res.status(404);
    throw new Error("Service not found");
  }

  res.json({ success: true, service });
});

// DELETE /api/services/:id   (admin)
const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id);

  if (!service) {
    res.status(404);
    throw new Error("Service not found");
  }

  res.json({ success: true, message: "Service deleted" });
});

export { getServices, createService, updateService, deleteService };
