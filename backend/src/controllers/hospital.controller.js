import Hospital from "../models/Hospital.js";
import asyncHandler from "../utils/asyncHandler.js";

// GET /api/hospital
const getHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findOne();

  if (!hospital) {
    res.status(404);
    throw new Error("Hospital details have not been added yet");
  }

  res.json({ success: true, hospital });
});

// PUT /api/hospital   (admin)
// There is only one hospital, so this creates it the first time
// and updates it every time after that.
const saveHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findOneAndUpdate({}, req.body, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  });

  res.json({ success: true, hospital });
});

export { getHospital, saveHospital };
