import Department from "../models/Department.js";
import Doctor from "../models/Doctor.js";
import asyncHandler from "../utils/asyncHandler.js";
import escapeRegex from "../utils/escapeRegex.js";

// GET /api/departments?search=
const getDepartments = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = { isActive: true };

  if (search) filter.name = new RegExp(escapeRegex(String(search)), "i");

  const departments = await Department.find(filter).sort({ name: 1 });
  res.json({ success: true, count: departments.length, departments });
});

// GET /api/departments/:id
const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    res.status(404);
    throw new Error("Department not found");
  }

  // Doctors working in this department
  const doctors = await Doctor.find({ department: department._id }).select(
    "name specialization image averageRating availabilityStatus"
  );

  res.json({ success: true, department, doctors });
});

// POST /api/departments   (admin)
const createDepartment = asyncHandler(async (req, res) => {
  const department = await Department.create(req.body);
  res.status(201).json({ success: true, department });
});

// PUT /api/departments/:id   (admin)
const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!department) {
    res.status(404);
    throw new Error("Department not found");
  }

  res.json({ success: true, department });
});

// DELETE /api/departments/:id   (admin)
const deleteDepartment = asyncHandler(async (req, res) => {
  const doctorCount = await Doctor.countDocuments({
    department: req.params.id,
  });

  if (doctorCount > 0) {
    res.status(400);
    throw new Error("Cannot delete a department that still has doctors");
  }

  const department = await Department.findByIdAndDelete(req.params.id);

  if (!department) {
    res.status(404);
    throw new Error("Department not found");
  }

  res.json({ success: true, message: "Department deleted" });
});

export {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
