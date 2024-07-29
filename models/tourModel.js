const mongoose = require("mongoose");
const slugify = require("slugify");

const tourSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tour name is required"],
      unique: true,
      trim: true,
      maxLength: [40, "A tour name must have less or equal then 40 characters"],
      minLength: [
        5,
        "A tour name must have greather or equal then 5 characters",
      ],
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, "A tour must have a Duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have Group size."],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a Difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy, medium, difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be Below 5.0"],
      set: (val) => Math.round(val * 10) / 10, // 4.666666, 46.6666, 47, 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a Price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message:
          "Discount price mustbe ({VALUE}) should be below regular price.",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a Summary"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image."],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      selet: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    guides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtual: true },
  }
);

// Indexing for Performance
tourSchema.index({ price: 1 });
tourSchema.index({ slug: 1 });

// eg: of compound Indexing
// tourSchema.index({ price: 1, ratingsAverage: -1 });

// Virtual Fields
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

// Virtual populate
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});

// Doccument Middleware "RUNs before save"
tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Query Middleware "RUNs before query"
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

tourSchema.pre(/^find/, function (next) {
  //used for populateing embeded data
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt",
  });

  next();
});

// Aggregation Middleware "RUNs before aggregation"
tourSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
