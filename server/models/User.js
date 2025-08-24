// backend/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  regNo: { type: String, required: true, unique: true },
  dob: { type: String, required: true },
  email: { type: String, required: true },
  telegramId: { type: String }, // removed comma
  year: { type: Number, required: true }, // make it required and remove default
  section: {
    type: String,
    enum: ["A", "B", "C", "D"], // added "D" and removed "Not Provided"
    required: true // make it required
  },
  notifiedSemesters: { type: [Number], default: [] }
}, {
  timestamps: true // optional: adds createdAt and updatedAt
});

module.exports = mongoose.model("User", userSchema);


/* 
GET http://localhost:3001/api/results
GET http://localhost:3001/api/results/student/730923106077
GET http://localhost:3001/api/results/statistics */