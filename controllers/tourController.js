const multer = require("multer");
const Tour = require("../models/tourModel");
const APIFeatues = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// Storeing Tour Images For 2 FIELDS with Image Resizeing
// Tour Image Storage
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "public/tours";
    if (file.fieldname === "imageCover") {
      folder = "public/tours/imageCover";
    } else if (file.fieldname === "images") {
      folder = "public/tours/images";
    }

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];

    let preFileName = "public/tours";
    if (file.fieldname === "imageCover") {
      preFileName = `tourCoverImage-${Date.now()}.${ext}`;
    } else if (file.fieldname === "images") {
      preFileName = `tourImage-${Date.now()}.${ext}`;
    }

    cb(null, preFileName);
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourFiles = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 5 }, // Adjust maxCount based on your requirements
]);

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,difficulty";
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  const features = new APIFeatues(Tour.find(), req.query)
    .search()
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // used for examine how query performance working on "executionStats" -> "nReturned", "totalDocsExamined"
  // const tours = await features.query.explain();

  const tours = await features.query;

  res.status(200).json({
    status: "success",
    data: {
      tours,
    },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id).populate("reviews");

  if (!tour) {
    return next(new AppError("Tour not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  const updateRequestBody = req.body;

  if (req.files.imageCover) {
    updateRequestBody.imageCover = `${process.env.BASE_URL}tours/${req.files.imageCover[0].filename}`;
  }

  if (req.files.images) {
    updateRequestBody.images = req.files.images.map(
      (file) => `${process.env.BASE_URL}tours/${file.filename}`
    );
  }
  const newTour = await Tour.create(updateRequestBody);

  res.status(201).json({
    status: "success",
    data: {
      tour: newTour,
    },
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const specificTour = await Tour.findById(req.params.id);
  const clearImage = req.body.clearAllImages ? true : false;
  const updateRequestBody = req.body;

  if (req.files.imageCover) {
    updateRequestBody.imageCover = `${process.env.BASE_URL}tours/${req.files.imageCover[0].filename}`;
  }

  if (req.files.images) {
    if (clearImage == true) {
      updateRequestBody.images = req.files.images.map(
        (file) => `${process.env.BASE_URL}tours/${file.filename}`
      );
    } else {
      const existingImages = specificTour.images || [];
      const newImages = req.files.images.map(
        (file) => `${process.env.BASE_URL}tours/${file.filename}`
      );

      updateRequestBody.images = [...existingImages, ...newImages];
    }
  }

  const tour = await Tour.findByIdAndUpdate(req.params.id, updateRequestBody, {
    new: true,
    runValidators: true,
  });

  if (!tour) {
    return next(new AppError("No tour found.", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError("Tour not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: null,
  });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: "$difficulty" },
        numTour: { $sum: 1 },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    {
      $project: {
        _id: 1,
        numTours: 1,
        numRatings: 1,
        avgRating: 1,
        avgPrice: { $round: ["$avgPrice", 2] },
        minPrice: 1,
        maxPrice: 1,
      },
    },
    // {
    //   $match: { _id: { $ne: "EASY" } },
    // },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    { $unwind: "$startDates" },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numOfTourStarts: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numOfTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      plan,
    },
  });
});
