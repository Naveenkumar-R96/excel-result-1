// models/Result.js
const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  code: { type: String, required: true },
  subject: { type: String, required: true },
  credit: { type: String, required: true },
  grade: { type: String, required: true },
  point: { type: String, required: true },
  result: { type: String, required: true }
});

const semesterSchema = new mongoose.Schema({
  semesterNumber: { type: Number, required: true },
  subjects: [subjectSchema],
  cgpa: { type: String, default: "N/A" }
});

// Notification history sub-schema
const notificationHistorySchema = new mongoose.Schema({
  semesterDetected: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  notificationStatus: {
    telegram: { type: Boolean, default: false },
    email: { type: Boolean, default: false }
  },
  overallCGPAAtTime: { type: String }
});

const resultSchema = new mongoose.Schema({
  studentRegNo: { 
    type: String, 
    required: true,
    unique: true, // One document per student
    index: true 
  },
  studentName: { 
    type: String, 
    required: true 
  },
  studentEmail: { 
    type: String 
  },
  // ✅ ADD MISSING FIELDS
  studentYear: { 
    type: String 
  },
  studentSection: { 
    type: String 
  },
  studentDOB: { 
    type: String 
  },
  
  semesters: [semesterSchema],
  overallCGPA: { 
    type: String, 
    default: "N/A" 
  },
  
  // ✅ TRACK CURRENT STATE
  currentMaxSemester: { 
    type: Number, 
    default: 0 
  },
  lastNotificationSemester: { 
    type: Number, 
    default: 0 
  },
  
  // ✅ NOTIFICATION HISTORY (instead of single notification)
  notificationHistory: [notificationHistorySchema],
  
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  },
  
  // Store the complete result data for future reference
  rawResultData: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for faster queries
resultSchema.index({ studentRegNo: 1 }, { unique: true });
resultSchema.index({ lastUpdated: -1 });
resultSchema.index({ currentMaxSemester: 1 });

const Result = mongoose.model("Result", resultSchema);

module.exports = Result;