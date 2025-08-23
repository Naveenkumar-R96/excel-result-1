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

const resultSchema = new mongoose.Schema({
  studentRegNo: { 
    type: String, 
    required: true,
    index: true 
  },
  studentName: { 
    type: String, 
    required: true 
  },
  studentEmail: { 
    type: String 
  },
  semesters: [semesterSchema],
  overallCGPA: { 
    type: String, 
    default: "N/A" 
  },
  newSemesterDetected: { 
    type: Number, 
    required: true 
  },
  notificationSent: {
    telegram: { type: Boolean, default: false },
    email: { type: Boolean, default: false }
  },
  notificationTimestamp: { 
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
resultSchema.index({ studentRegNo: 1, newSemesterDetected: 1 });
resultSchema.index({ notificationTimestamp: -1 });

const Result = mongoose.model("Result", resultSchema);

module.exports = Result;