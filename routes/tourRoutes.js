const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  resizeTourImages,
  uploadTourImages,
  uploadTourFiles,
} = require("../controllers/tourController");
const {
  isAuthenticatedUser,
  authorizeRoles,
} = require("../utils/authenticate");
const reviewRouter = require("./../routes/reviewRoutes");

const router = express.Router();

// Nested Routes
// eg: POST /tours/234fad4/review
router.use("/:tourId/review", reviewRouter);

// alias routes in top only
router.route("/top-five-tours").get(aliasTopTours, getAllTours);
router.route("/tour-stats").get(getTourStats);
router.route("/monthly-plan/:year").get(getMonthlyPlan);

// general routes
router.route("/").get(getAllTours);
router
  .route("/")
  .post(
    isAuthenticatedUser,
    authorizeRoles("admin"),
    uploadTourFiles,
    createTour
  );
router
  .route("/:id")
  .get(getTour)
  .patch(
    isAuthenticatedUser,
    authorizeRoles("admin"),
    uploadTourFiles,
    updateTour
  )
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteTour);

module.exports = router;
