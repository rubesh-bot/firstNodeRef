const User = require("../models/userModel");
const AppError = require("./appError");
const catchAsync = require("./catchAsync");
const jwt = require("jsonwebtoken");

exports.isAuthenticatedUser = catchAsync(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new AppError("Login first to handle this resource", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id);
  next();
});

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Role ${req.user.role} is not allowed`, 401));
    }
    next();
  };
};
