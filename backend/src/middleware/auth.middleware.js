import jwt from "jsonwebtoken";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

// Checks that the request comes from a logged-in user.
// The frontend must send:  Authorization: Bearer <token>
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not logged in. Please provide a token");
  }

  const token = header.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    res.status(401);
    throw new Error("Invalid or expired token. Please log in again");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(401);
    throw new Error("The user for this token no longer exists");
  }

  // Controllers after this can use req.user
  req.user = user;
  next();
});

// Allows only certain roles:  authorize("admin")
// Always use it AFTER protect, because it needs req.user.
export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error("You do not have permission to do this");
    }
    next();
  };