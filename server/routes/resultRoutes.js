// routes/resultRoutes.js
const express = require("express");
const router = express.Router();
const { 
  storeStudentResult, 
  getStudentResults, 
  getAllResults, 
  getResultStatistics 
} = require("../services/resultStorageService");

// Get all stored results with pagination
// GET /api/results?page=1&limit=20
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({ 
        error: "Invalid pagination parameters. Page must be >= 1, limit must be 1-100" 
      });
    }

    const results = await getAllResults(page, limit);
    res.json(results);
  } catch (error) {
    console.error("Error fetching results:", error.message);
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

// Get results for a specific student
// GET /api/results/student/:regNo?limit=10
router.get("/student/:regNo", async (req, res) => {
  try {
    const { regNo } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    if (!regNo) {
      return res.status(400).json({ error: "Registration number is required" });
    }

    if (limit < 1 || limit > 50) {
      return res.status(400).json({ 
        error: "Limit must be between 1 and 50" 
      });
    }

    const results = await getStudentResults(regNo, limit);
    
    if (results.length === 0) {
      return res.status(404).json({ 
        message: "No results found for this student",
        regNo: regNo
      });
    }

    res.json({
      regNo: regNo,
      totalResults: results.length,
      results: results
    });
  } catch (error) {
    console.error("Error fetching student results:", error.message);
    res.status(500).json({ error: "Failed to fetch student results" });
  }
});

// Get statistics about stored results
// GET /api/results/statistics
router.get("/statistics", async (req, res) => {
  try {
    const stats = await getResultStatistics();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching statistics:", error.message);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Get results by date range
// GET /api/results/date-range?startDate=2024-01-01&endDate=2024-12-31&page=1&limit=20
router.get("/date-range", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: "Both startDate and endDate are required (YYYY-MM-DD format)" 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        error: "Invalid date format. Use YYYY-MM-DD format" 
      });
    }

    if (start > end) {
      return res.status(400).json({ 
        error: "Start date cannot be after end date" 
      });
    }

    // Set end date to end of day
    end.setHours(23, 59, 59, 999);

    const Result = require("../models/Result");
    
    const skip = (page - 1) * limit;
    const results = await Result.find({
      notificationTimestamp: { $gte: start, $lte: end }
    })
      .sort({ notificationTimestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Result.countDocuments({
      notificationTimestamp: { $gte: start, $lte: end }
    });

    res.json({
      results,
      totalResults: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      dateRange: {
        startDate: startDate,
        endDate: endDate
      },
      hasNext: page * limit < total,
      hasPrev: page > 1
    });
  } catch (error) {
    console.error("Error fetching results by date range:", error.message);
    res.status(500).json({ error: "Failed to fetch results by date range" });
  }
});

module.exports = router;