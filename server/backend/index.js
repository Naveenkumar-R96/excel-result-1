require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const fetchResult = require("./scraper");
const sendTelegramMessage = require("./telegram");
const sendEmail = require("./mailer");
const mongoose = require("mongoose");
const userRoutes = require("../routes/userRoutes");
const User = require("../models/User");
const fetch = require("node-fetch"); // for self-ping

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err.message));

app.use("/api/users", userRoutes);

// ✅ Keep track of notified students
let notified = {}; // { regNo: true }

// ✅ Queue for students to process
let processingQueue = [];

// ✅ Function to process a batch of students in parallel safely
async function processBatchParallel(batch) {
  console.log(`🚀 Processing batch of ${batch.length} students in parallel`);

  const promises = batch.map(async (student) => {
    try {
      console.log(`🔍 Processing ${student.name} (${student.regNo})`);

      const result = await fetchResult(student.regNo, student.dob, student.currentSem);

      if (result && result.subjects?.length) {
        const formatted = result.subjects.map(r =>
          `${r.sem} | ${r.code} | ${r.subject} | ${r.grade} (${r.result})`
        ).join("\n");

        const message = `🎓 RESULT PUBLISHED\n👤 ${student.name} (${student.regNo})\n📘 Semester: ${student.currentSem}\n📊 CGPA: ${result.cgpa}\n\n${formatted}`;

        await sendTelegramMessage(message);

        const emailHtml = require("./emialHtml")(result);
        await sendEmail(student.email, "🎓 Your Result is Published", emailHtml);

        notified[student.regNo] = true;
        console.log(`✅ Notification sent for ${student.name}`);
      } else {
        console.log(`⏳ No result for ${student.name}`);
      }

    } catch (err) {
      console.error(`❌ Error processing ${student.name}:`, err.message);
    }
  });

  // Run all student promises and wait for all to settle
  await Promise.allSettled(promises);
  console.log(`✅ Batch of ${batch.length} students completed`);
}

// ✅ Cron job: check every 2 minutes for new results
cron.schedule("*/2 * * * *", async () => {
  console.log(`[${new Date().toLocaleString()}] 🕒 Cron job running...`);

  const students = await User.find();

  // Quick check: filter students not notified and not already in queue
  for (const student of students) {
    if (notified[student.regNo] || processingQueue.includes(student)) {
      continue;
    }

    try {
      const result = await fetchResult(student.regNo, student.dob, student.currentSem);

      if (result && result.subjects?.length) {
        processingQueue.push(student);
      }
    } catch (err) {
      console.error(`❌ Quick check failed for ${student.name}:`, err.message);
    }
  }

  // Process queue in parallel batches of 5–10
  while (processingQueue.length > 0) {
    const batch = processingQueue.splice(0, 5); // 5 students per batch
    await processBatchParallel(batch);
  }
});

// ✅ Self-ping to keep service awake
setInterval(() => {
  fetch("http://localhost:3001")
    .then(() => console.log("🔁 Self-ping sent"))
    .catch(err => console.error("⚠️ Self-ping failed:", err.message));
}, 5 * 60 * 1000);

app.get("/", (_, res) => res.send("✅ Result checker is running"));
app.listen(3001, () => console.log("🚀 Backend running on port 3001"));
