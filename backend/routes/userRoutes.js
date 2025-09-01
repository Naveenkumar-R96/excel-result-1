// backend/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");

// POST /api/users - Create new user
router.post("/", async (req, res) => {
  try {
    console.log("=== RECEIVED DATA ===");
    console.log("Full req.body:", req.body);
    
    // Extract ALL required fields including year and section
    const { name, regNo, dob, email, telegramId, year, section } = req.body;
    


    // Validate required fields
    if (!name || !regNo || !dob || !email || !year || !section) {
      return res.status(400).json({ 
        error: "Missing required fields",
        received: { name: !!name, regNo: !!regNo, dob: !!dob, email: !!email, year: !!year, section: !!section }
      });
    }

    // Check for duplicate register number
    const existing = await User.findOne({ regNo });
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create user with all fields
    const userData = {
      name,
      regNo,
      dob,
      email,
      year: Number(year), // Ensure it's a number
      section
    };

    // Add telegramId only if provided
    if (telegramId) {
      userData.telegramId = telegramId;
    }

    console.log("Creating user with data:", userData);

    const newUser = await User.create(userData);
    
    console.log("✅ User created successfully:", newUser);

    res.status(201).json({ 
      message: "✅ User registered successfully", 
      user: newUser 
    });

  } catch (err) {
    console.error("❌ Error creating user:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users - Fetch all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;