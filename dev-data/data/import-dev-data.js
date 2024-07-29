const tours = require("./tours.json");
const users = require("./users.json");
const reviews = require("./reviews.json");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Tour = require("../../models/tourModel");
const User = require("../../models/userModel");
const Review = require("../../models/reviewModel");

dotenv.config({ path: "./config.env" });

// DB Connection
mongoose
  .connect(process.env.LOCAL_DB)
  .then(() => console.log("DB connection successful!"));

// Seeding Tours
const seedTours = async () => {
  try {
    await Tour.deleteMany();
    console.log("Tours deleted!");
    await Tour.insertMany(tours);
    console.log("All Tours added!");
  } catch (error) {
    console.log(error.message);
  }
  process.exit();
};

// seedTours();

// Seeding Users
const seedUsers = async () => {
  try {
    await User.deleteMany();
    console.log("Users deleted!");
    await User.insertMany(users);
    console.log("All Users added!");
  } catch (error) {
    console.log(error.message);
  }
  process.exit();
};

//  seedUsers();

// Seeding Reviews
const seedReviews = async () => {
  try {
    await Review.deleteMany();
    console.log("Reviews deleted!");
    await Review.insertMany(reviews);
    console.log("All Reviews added!");
  } catch (error) {
    console.log(error.message);
  }
  process.exit();
};

//  seedReviews();
