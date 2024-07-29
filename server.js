const mongoose = require("mongoose");
const path = require("path");

// ENV Variables Configuration
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "/config.env") });

const app = require("./app");

// DB Connection
let DBstring = null;
if (process.env.NODE_ENV === "developement") {
  DBstring = process.env.LOCAL_DB;
} else {
  DBstring = process.env.ONLINE_DB;
}

let DB = mongoose.connect(DBstring).then(() => {
  console.log(`DB Connected successfully!`);
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Server is running on ${port} on ${process.env.NODE_ENV}`);
});

process.on("unhandledRejection", (err) => {
  console.log(`Unhandled Rejection! Shutting Down.`);
  console.log(err.name, err.message);
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});

process.on("uncaughtExceptin", (err) => {
  console.log(`Uncaught Exception! Shutting Down.`);
  console.log(err.name, err.message);
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
