const mongoose = require("mongoose");
const Tour = require("./tourModel");
const AppError = require("../utils/appError");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can not be empty!"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour."],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // });

  this.populate({
    path: "user",
    select: "name photo",
  });
  next();
});

// calculateing averageRating & save in Review and Tour MODEL
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);
  // console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// User can't post more then 1 review for one tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Middleware to handle duplicate key errors by "createing more then 1 review of 1 tour"
reviewSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    next(new AppError("You already posted a review.", 400));
  } else {
    next(error);
  }
});

// when the new review is posting, calculateing averageRating by tourID
// pre middleware only have a next argument NOT for post middleware
reviewSchema.post("save", function () {
  // this points to current review & used "constructor" because of selecting the "model" before its initilization
  this.constructor.calcAverageRatings(this.tour);
});

// updateing if rewiew is update or deleted need to update "AverageRatings"
// findByIdAndUpdate & findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // get the current review document.
  this.currentReview = await this.model.findOne(this.getQuery()).clone();
  next();
});

reviewSchema.post(/^findOneAnd/, async function (res) {
  // The query has already executed and the document is passed as `res`
  if (res) {
    await res.constructor.calcAverageRatings(res.tour);
  }
});

const reviewModel = mongoose.model("Review", reviewSchema);

module.exports = reviewModel;
