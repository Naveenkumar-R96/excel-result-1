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
notified = {}
 // { regNo: true }

// ✅ Queue for students to process
let processingQueue = [];

// ✅ Function to process a batch of students in parallel safely
async function processBatchParallel(batch) {
  console.log(`🚀 Processing batch of ${batch.length} students in parallel`);

  const promises = batch.map(async ({ student, result }) => {
    try {
      console.log(`🔍 Processing ${student.name} (${student.regNo})`);

      if (result && result.subjects?.length) {
        // Format result details
        const formatted = result.subjects.map(r =>
          `${r.sem} | ${r.code} | ${r.subject} | ${r.grade} (${r.result})`
        ).join("\n");

        const message = `🎓 RESULT PUBLISHED\n👤 ${student.name} (${student.regNo})\n📘 Semester: ${student.currentSem}\n📊 CGPA: ${result.cgpa}\n\n${formatted}`;

        // Send Telegram notification
        await sendTelegramMessage(message);

        // Send Email
        const emailHtml = require("./emialHtml")(result);
        await sendEmail(student.email, "🎓 Your Result is Published", emailHtml);

        const key = `${student.regNo}_${student.currentSem}`;
        notified[key] = true;

        console.log(`✅ Notification sent for ${student.name}`);
      } else {
        console.log(`⏳ No result for ${student.name}`);
      }

    } catch (err) {
      console.error(`❌ Error processing ${student.name}:`, err.message);
    }
  });

  // Wait until all students in this batch are processed
  await Promise.allSettled(promises);
  console.log(`✅ Batch of ${batch.length} students completed`);
}

// ✅ Cron job: check every 2 minutes for new results
cron.schedule("*/2 * * * *", async () => {
  console.log(`[${new Date().toLocaleString()}] 🕒 Cron job running...`);

  const students = await User.find();

  // ✅ Quick check in parallel batches of 5
  const BATCH_SIZE = 5;

  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const batch = students.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (student) => {
        const key = `${student.regNo}_${student.currentSem}`;

        if (notified[key] || processingQueue.find((s) => `${s.student.regNo}_${s.student.currentSem}` === key)) {
          return; // already processed or queued for this sem
        }

        try {
          const result = await fetchResult(
            student.regNo,
            student.dob,
            student.currentSem
          );

          if (result && result.subjects?.length) {
            processingQueue.push({ student, result }); // ✅ store both

            if (student.currentSem < 8) {
              await User.updateOne(
                { regNo: student.regNo },
                { $set: { currentSem: student.currentSem + 1 } }
              );
            }
          }
        } catch (err) {
          console.error(`❌ Quick check failed for ${student.name}:`, err.message);
        }
      })
    );
  }

  // ✅ Process queue in parallel batches of 5
  while (processingQueue.length > 0) {
    const batch = processingQueue.splice(0, BATCH_SIZE);
    await processBatchParallel(batch); // your existing function
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
