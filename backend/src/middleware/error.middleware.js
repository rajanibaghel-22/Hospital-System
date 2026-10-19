// Runs when no route matched the URL
export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`));
};

// Catches every error thrown in the app and sends a clean JSON response.
// Express knows it's an error handler because it has 4 parameters.
export const errorHandler = (err, req, res, next) => {
  // If a controller threw without setting a status, it's a server error
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Broken JSON sent in the request body
  if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON in request body";
  }

  // Invalid MongoDB id, e.g. /api/doctors/abc
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose validation failed (missing required field, wrong enum, etc.)
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // Duplicate value for a unique field, e.g. same email twice
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "value";
    message = `${field} already exists`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Show the stack trace only while developing
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};