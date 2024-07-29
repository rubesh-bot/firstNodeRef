const express = require("express");
const path = require("path");
const {
  getAllUsers,
  updateProfile,
  deleteMe,
  uploadUserPhoto,
} = require("../controllers/userController");
const {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  changePassword,
} = require("../controllers/authController");
const { isAuthenticatedUser } = require("../utils/authenticate");

const router = express.Router();

router.route("/signup").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(logoutUser);
router.route("/forgotpassword").post(forgotPassword);
router.route("/resetPassword/:token").post(resetPassword);
router.route("/changePassword").post(isAuthenticatedUser, changePassword);
router.route("/deleteMe").delete(isAuthenticatedUser, deleteMe);
router
  .route("/updateProfile")
  .post(isAuthenticatedUser, uploadUserPhoto, updateProfile);

// Admin Users Routes
router.route("/").get(getAllUsers);

module.exports = router;
