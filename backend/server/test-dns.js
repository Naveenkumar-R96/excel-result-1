// backend/index.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("../routes/userRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ Connection error:", err.message));

// Routes
app.use("/api/users", userRoutes);

app.get("/", (_, res) => res.send("🎯 Backend running"));

app.listen(3001, () => console.log("🚀 Server running on port 3001"));
