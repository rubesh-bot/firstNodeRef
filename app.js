const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");

const globalErrorHandler = require("./controllers/errorController");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const AppError = require("./utils/appError");

const app = express();

// GLOBAL middleware
// 1) Set http headers
app.use(helmet());

// 2) Developement third party middleware
if (process.env.NODE_ENV === "developement") {
  app.use(morgan("dev"));
}

// 3) request limiting same IP
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

// body parser//
app.use(express.json({ limmit: "1mb" }));

// 4) Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// 5) Data sanitization against XSS
app.use(xss());

// 6) Prevent parameter pollution on API Features
// eg: /api/v1/tours?sort=duration&sort=price
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

// cookie parser
app.use(cookieParser());

// server static files
app.use(express.static(`${__dirname}/public`));

// Routes
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/review", reviewRouter);

// 404 apis
app.all("*", (req, res, next) => {
  next(
    new AppError(
      `can't find requeted URL: ${req.originalUrl} onthis server`,
      404
    )
  );
});

app.use(globalErrorHandler);

module.exports = app;
