
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import asyncHandler from "../utils/asyncHandler.js";

// Send safe user fields (never send password)
const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  age: user.age,
  gender: user.gender,
  bloodGroup: user.bloodGroup,
  role: user.role,
});

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, age, gender, bloodGroup } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email and password are required");
  }

  const exists = await User.findOne({ email: email.toLowerCase() });

  if (exists) {
    res.status(409);
    throw new Error("Email is already registered");
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    phone,
    age,
    gender,
    bloodGroup,
  });

  res.status(201).json({
    success: true,
    token: generateToken(user._id),
    user: userResponse(user),
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
  }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  res.json({
    success: true,
    token: generateToken(user._id),
    user: userResponse(user),
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: userResponse(req.user),
  });
});

// PUT /api/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const { name, phone, age, gender, bloodGroup } = req.body;

  if (name !== undefined) {
    if (!name.trim()) {
      res.status(400);
      throw new Error("Name cannot be empty");
    }

    user.name = name.trim();
  }

  if (phone !== undefined) user.phone = phone;
  if (age !== undefined) user.age = age;
  if (gender !== undefined) user.gender = gender;
  if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;

  const updatedUser = await user.save();

  res.json({
    success: true,
    message: "Profile updated successfully",
    user: userResponse(updatedUser),
  });
});

export { register, login, getMe, updateProfile };
