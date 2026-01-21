import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./.env",
});

// Connect to Database
connectDB()
  .then(() => {})
  .catch((err) => {
    console.error("MongoDB connection error", err);
    process.exit(1);
  });

const PORT = process.env.PORT || 8000;
