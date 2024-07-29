const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  photo: String,
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same!",
    },
    select: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// Password Hashing
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

// Token Createing
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_TIME,
  });
};

// Verifying Password
userSchema.methods.isValidPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Get Reset Token For FORGOT PASSWORD
userSchema.methods.getResetToken = function () {
  //Generate Token
  const token = crypto.randomBytes(20).toString("hex");

  //Generate Hash and set to resetPasswordToken
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  //Set token expire time
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000;

  return token;
};

const userModel = mongoose.model("User", userSchema);
module.exports = userModel;
