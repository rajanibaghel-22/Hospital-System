// Wraps async controllers so any error is passed to the error middleware.
// Without this you would need try/catch in every controller.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
