const crypto = require("crypto");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const sendToken = require("../utils/jwt");
const sendEmail = require("../utils/email");
const AppError = require("../utils/appError");

//Register User
exports.registerUser = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    passwordConfirm,
  });

  sendToken(user, 201, res);
});

//Login User
exports.loginUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please enter email & password", 400));
  }

  //finding the user database
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new AppError("Invalid email or password", 401));
  }

  if (!(await user.isValidPassword(password))) {
    return next(new AppError("Invalid email or password", 401));
  }

  sendToken(user, 200, res);
});

//Logout
exports.logoutUser = (req, res, next) => {
  res
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .status(200)
    .json({
      success: true,
      message: "Loggedout",
    });
};

//Forgot Password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError("User not found with this email", 404));
  }

  const resetToken = user.getResetToken();
  await user.save({ validateBeforeSave: false });

  let BASE_URL = process.env.BASE_URL;

  //Create reset url
  const resetUrl = `${BASE_URL}api/v1/users/resetPassword/${resetToken}`;

  const message = `Your password reset url is as follows \n\n 
      ${resetUrl} \n\n If you have not requested this email, then ignore it.`;

  try {
    sendEmail({
      email: user.email,
      subject: "Your password reset URL (valid for 10 min)",
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email}`,
    });
  } catch (error) {
    console.log(error);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError(error.message), 500);
  }
});

//Reset Password
exports.resetPassword = catchAsync(async (req, res, next) => {
  const passwordResetToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpires: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    return next(new AppError("Password reset token is invalid or expired"));
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new AppError("Password does not match"));
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save({ validateBeforeSave: false });
  sendToken(user, 201, res);
});

//Change Password
exports.changePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");
  //check old password
  if (!(await user.isValidPassword(req.body.oldPassword))) {
    return next(new AppError("Old password is incorrect", 401));
  }

  //assigning new password
  user.password = req.body.password;
  await user.save();
  res.status(200).json({
    success: true,
  });
});
