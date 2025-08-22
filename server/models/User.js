
// backend/models/User.js
const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: String,
  regNo: { type: String, required: true, unique: true },
  dob: String,
  email: String,
  telegramId: String,
  
  notifiedSemesters: { type: [Number], default: [] } // instead of notifiedUpto
});


module.exports = mongoose.model("User", userSchema);
