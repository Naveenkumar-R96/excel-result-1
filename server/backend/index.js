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

let notified = {}; // { regNo: true }

// ✅ Cron job every 2 minutes
cron.schedule("*/2 * * * *", async () => {
  console.log(`[${new Date().toLocaleString()}] 🕒 🟢 Cron job running...`);

  const students = await User.find();

  for (const student of students) {
    try {
      console.log(`🔍 Checking result for ${student.name} (${student.regNo})`);

      if (notified[student.regNo]) {
        console.log(`🧠 Skipping ${student.name} - already notified`);
        continue;
      }

      // 🔑 Call scraper
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
      console.error(`❌ Error for ${student.name}:`, err.message);
    }

    console.log(`⏳ Waiting before next student...`);
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
});

// ✅ Self-ping (for later when you deploy, safe to leave it)
setInterval(() => {
  fetch("http://localhost:3001") // local dev
    .then(() => console.log("🔁 Self-ping sent to keep service awake"))
    .catch((err) => console.error("⚠️ Self-ping failed:", err.message));
}, 5 * 60 * 1000);

app.get("/", (_, res) => res.send("✅ Result checker is running"));
app.listen(3001, () => console.log("🚀 Backend running on port 3001"));
