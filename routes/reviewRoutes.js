const express = require("express");
const {
  getAllReviews,
  createReview,
  updateReview,
  deleteReview,
  getReview,
} = require("../controllers/reviewController");
const { isAuthenticatedUser } = require("../utils/authenticate");
const router = express.Router({ mergeParams: true });

router.route("/").get(getAllReviews).post(isAuthenticatedUser, createReview);
router
  .route("/:id")
  .get(getReview)
  .patch(isAuthenticatedUser, updateReview)
  .delete(isAuthenticatedUser, deleteReview);

module.exports = router;
