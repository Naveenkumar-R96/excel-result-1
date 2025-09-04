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
const fetch = require("node-fetch");
const { storeStudentResult } = require("../services/resultStorageService");
const resultRoutes = require("../routes/resultRoutes");
const app = express();
const Result = require("../models/Result");

app.use(cors());
app.use(cors({
  origin: "https://excel-result-1.onrender.com"
}));
app.use(express.json());

// ----------------- Helpers -----------------
function getCurrentYearFromMaxPublishedSem(maxPublishedSem) {
  // normalize
  let m = Number(maxPublishedSem) || 0;
  if (m < 0) m = 0;

  // after results, student moves to next sem
  const nextSemester = Math.min(8, m + 1);

  // compute current year (cap at 4th year)
  const year = Math.min(4, Math.ceil(nextSemester / 2));

  // graduation case: if 8th sem already published, they’re done
  const graduated = m >= 8;

  return { year, nextSemester: graduated ? null : nextSemester, graduated };
}

// ----------------- DB Connect -----------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err.message));

// ----------------- Routes -----------------
app.use("/api/users", userRoutes);
app.use("/api/results", resultRoutes);
// dashboard alias
app.use("/api/dashboard", resultRoutes);

app.get("/", (req, res) => {
  res.send("🎓 Excel Result Notifier Backend is running");
})
// Enhanced test endpoint with result storage
app.post("/test-student", async (req, res) => {
  try {
    const { regNo } = req.body;
    if (!regNo) return res.status(400).json({ error: "Registration number is required" });

    const student = await User.findOne({ regNo }).catch(err => {
      console.error('Database query error:', err.message);
      throw new Error('Database query failed');
    });

    if (!student) return res.status(404).json({ error: "Student not found" });

    const lastNotifiedSem = (student.notifiedSemesters && student.notifiedSemesters.length > 0)
      ? Math.max(...student.notifiedSemesters)
      : 0;
    const expectedSem = lastNotifiedSem + 1;

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Test timeout')), 60 * 1000)
    );

    console.log(`🧪 Testing ${student.name}, last notified: ${lastNotifiedSem}, checking for: ${expectedSem}`);

    const result = await Promise.race([
      fetchResult(student.regNo, student.dob, expectedSem, student.name),
      timeout
    ]);

    // If result is found and has the expected semester, optionally store it
    let storedResult = null;
    if (result?.allSemesters?.[expectedSem]) {
      try {
        // storeStudentResult should persist result details; we still update Result/User later in cron logic
        storedResult = await storeStudentResult(student, result, expectedSem, { telegram: false, email: false });
        console.log(`💾 Test result stored with ID: ${storedResult._id}`);
      } catch (storageError) {
        console.error('Failed to store test result:', storageError.message);
      }
    }

    res.json({
      student: student.name,
      regNo: student.regNo,
      lastNotifiedSem,
      expectedSem,
      notifiedSemesters: student.notifiedSemesters || [],
      result,
      hasResult: !!result,
      hasExpectedSem: !!(result?.allSemesters?.[expectedSem]),
      availableSemesters: result?.availableSemesters || [],
      storedResultId: storedResult?._id || null,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Test endpoint error:', err.message);
    res.status(500).json({ error: err.message, timestamp: new Date() });
  }
});

// Get stored results for a specific student
app.get("/api/student/:regNo/results", async (req, res) => {
  try {
    const { regNo } = req.params;
    const limit = parseInt(req.query.limit) || 5;
    const { getStudentResults } = require("../services/resultStorageService");
    const results = await getStudentResults(regNo, limit);
    res.json({ regNo, totalResults: results.length, results });
  } catch (error) {
    console.error("Failed to fetch student results:", error.message);
    res.status(500).json({ error: "Failed to fetch student results" });
  }
});

// ----------------- Cron job -----------------
let isCronRunning = false;
let processingQueue = [];

cron.schedule("*/2 * * * *", async () => {
  if (isCronRunning) {
    console.log("⏸️ Previous cron still running, skipping this run");
    return;
  }
  isCronRunning = true;

  const startTime = Date.now();
  console.log(`[${new Date().toLocaleString()}] 🕒 Cron job starting...`);

  try {
    const cronTimeout = setTimeout(() => {
      console.error('⏰ Cron job timeout - taking too long!');
    }, 2 * 60 * 1000);

    const students = await User.find().catch(err => {
      console.error('❌ Failed to fetch students from database:', err.message);
      throw new Error('Database query failed');
    });

    if (!students || students.length === 0) {
      console.log('👥 No students found in database');
      clearTimeout(cronTimeout);
      isCronRunning = false;
      return;
    }

    console.log(`👥 Found ${students.length} students to check`);

    const BATCH_SIZE = 7;
    let processedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      const batch = students.slice(i, i + BATCH_SIZE);
      console.log(`🔍 Checking batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.map(s => s.name).join(', ')}`);

      await Promise.allSettled(
        batch.map(async (student) => {
          try {
            if (!student.regNo || !student.dob || !student.name) {
              throw new Error('Invalid student data');
            }

            const lastNotifiedSem = (student.notifiedSemesters && student.notifiedSemesters.length > 0)
              ? Math.max(...student.notifiedSemesters)
              : 0;
            const expectedSem = lastNotifiedSem + 1;

            console.log(`🎯 ${student.name}: Last notified sem = ${lastNotifiedSem}, checking for sem = ${expectedSem}`);

            if (processingQueue.find(s => s.student.regNo === student.regNo)) {
              return { status: 'skipped', reason: 'in_queue' };
            }

            const fetchTimeout = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Student fetch timeout')), 45 * 1000)
            );

            console.log(`🔍 Checking if semester ${expectedSem} is published for ${student.name}...`);

            const result = await Promise.race([
              fetchResult(student.regNo, student.dob, expectedSem, student.name),
              fetchTimeout
            ]);

            if (result && result.status === 'not_published') {
              console.log(`📭 Semester ${expectedSem} not yet published for ${student.name}`);
              return { status: 'not_published' };
            }

            if (result && result.status === 'error') {
              throw new Error(result.message || 'scraper error');
            }

            if (result && result.allSemesters && result.allSemesters[expectedSem]) {
              console.log(`✅ NEW semester ${expectedSem} found for ${student.name}! Adding to queue...`);
              processingQueue.push({ student, result, expectedSem });
              return { status: 'queued' };
            } else {
              console.log(`📭 Semester ${expectedSem} not available for ${student.name}`);
              return { status: 'not_published' };
            }

          } catch (err) {
            errorCount++;
            console.error(`❌ Error fetching result for ${student.name}:`, err.message);
            return { status: 'error', error: err.message };
          }
        })
      );

      processedCount += batch.length;

      if (i + BATCH_SIZE < students.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Process queued students in parallel batches
    while (processingQueue.length > 0) {
      const queueBatch = processingQueue.splice(0, BATCH_SIZE);
      try {
        await processBatchParallel(queueBatch);
      } catch (err) {
        console.error('❌ Error processing queue batch:', err.message);
        errorCount++;
      }
    }

    clearTimeout(cronTimeout);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Cron job completed in ${duration}s: ${processedCount} students checked, ${errorCount} errors`);

  } catch (err) {
    console.error("❌ Cron job fatal error:", err.message);
  } finally {
    isCronRunning = false;
  }
});

// ----------------- Batch processor -----------------
async function processBatchParallel(batch) {
  console.log(`🚀 Processing batch of ${batch.length} students in parallel`);

  if (!batch || batch.length === 0) {
    console.log('📭 Empty batch provided to processBatchParallel');
    return;
  }

  const promises = batch.map(async ({ student, result, expectedSem }) => {
    if (!student || !result) {
      console.error(`❌ Invalid batch item: missing student or result`);
      return;
    }

    try {
      console.log(`🔍 Processing ${student.name} (${student.regNo}) - new semester ${expectedSem} found!`);

      if (!result.allSemesters || typeof result.allSemesters !== 'object') {
        throw new Error('Invalid result structure: missing allSemesters');
      }

      const publishedSemesters = Object.keys(result.allSemesters || {})
        .map(s => parseInt(s))
        .filter(s => !isNaN(s))
        .sort((a, b) => a - b);

      if (publishedSemesters.length === 0) {
        throw new Error('No published semesters found');
      }

      const maxPublishedSem = Math.max(...publishedSemesters);

      console.log(`📊 Published semesters for ${student.name}: ${publishedSemesters.join(', ')}`);
      console.log(`📊 Max published semester: ${maxPublishedSem}, New semester detected: ${expectedSem}`);

      // Build message
      const formattedSubjects = publishedSemesters.map(sem => {
        const subjects = result.allSemesters[sem];
        if (!Array.isArray(subjects)) {
          return `📘 Semester ${sem}\n   No valid subjects found\n   CGPA: ${result.semesterWiseCGPA?.[sem] || "N/A"}\n`;
        }
        const subjectLines = subjects.map(r => {
          const code = r?.code || 'N/A';
          const subject = r?.subject || 'N/A';
          const grade = r?.grade || 'N/A';
          const resultStatus = r?.result || 'N/A';
          return `   ${code} | ${subject} | ${grade} (${resultStatus})`;
        }).join("\n");
        return `📘 Semester ${sem}\n${subjectLines}\n   CGPA: ${result.semesterWiseCGPA?.[sem] || "N/A"}\n`;
      }).join("\n");

      const message = `🎓 RESULT PUBLISHED - NEW SEMESTER ${expectedSem}!\n👤 ${student.name} (${student.regNo})\n\n${formattedSubjects}\n📊 Overall CGPA: ${result.overallCGPA || 'N/A'}`;

      console.log(`📤 Sending notifications for ${student.name}...`);

      const notificationStatus = { telegram: false, email: false };

      // Send notifications
      const notificationResults = await Promise.allSettled([
        (async () => {
          try {
            await sendTelegramMessage(message);
            console.log(`✅ Telegram sent for ${student.name}`);
            notificationStatus.telegram = true;
            return { type: 'telegram', status: 'success' };
          } catch (err) {
            console.error(`❌ Telegram failed for ${student.name}:`, err.message);
            return { type: 'telegram', status: 'failed', error: err.message };
          }
        })(),
        (async () => {
          try {
            if (!student.email) throw new Error('No email address provided');
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(student.email)) throw new Error('Invalid email format');
            const emailHtml = require("./emialHtml")(result);
            await sendEmail(student.email, "🎓 Your Result is Published", emailHtml);
            console.log(`✅ Email sent for ${student.name}`);
            notificationStatus.email = true;
            return { type: 'email', status: 'success' };
          } catch (err) {
            console.error(`❌ Email failed for ${student.name}:`, err.message);
            return { type: 'email', status: 'failed', error: err.message };
          }
        })()
      ]);

      const successful = notificationResults.filter(r => r.status === 'fulfilled' && r.value.status === 'success');
      if (successful.length === 0) {
        throw new Error('All notification methods failed');
      }

       // STORE RESULT DATA IN NEW DATABASE (service) — keep after DB updates
       try {
        await storeStudentResult(student, result, expectedSem, notificationStatus);
        console.log(`💾 storeStudentResult succeeded for ${student.name}`);
      } catch (storageError) {
        console.error(`❌ storeStudentResult failed for ${student.name}:`, storageError.message);
      }

      console.log(`✅ Notification & storage process completed for ${student.name}`);

      // Determine student year
      const { year: currentYear, nextSemester, graduated } = getCurrentYearFromMaxPublishedSem(maxPublishedSem);

      // Update or insert into Result collection (upsert)
      try {
        const resultUpdate = await Result.updateOne(
          { studentRegNo: student.regNo },
          {
            $set: {
              studentName: student.name,
              studentEmail: student.email,
              currentMaxSemester: maxPublishedSem,
              studentYear: String(currentYear),
              overallCGPA: result.overallCGPA || "N/A",
              lastUpdated: new Date(),
              rawResultData: result
            },
            $setOnInsert: { createdAt: new Date() }
          },
          { upsert: true }
        );
        console.log(`💾 Result collection updated for ${student.regNo} (matched: ${resultUpdate.matchedCount}, upsertedId: ${resultUpdate.upsertedId || 'none'})`);
      } catch (err) {
        console.error(`❌ Failed to update Result for ${student.regNo}:`, err.message);
        // continue — we still try to store into resultStorageService and update User below
      }

      // Update User with year + notified semesters (single update to avoid overwrite)
      try {
        const userUpdate = await User.updateOne(
          { regNo: student.regNo },
          {
            $set: {
              year: currentYear,
              lastNotified: new Date(),
              notifiedSemesters: publishedSemesters
            },
            $setOnInsert: { createdAt: new Date() }
          },
          { upsert: false }
        );

        if (userUpdate.matchedCount === 0) {
          console.warn(`⚠️ User not found when updating User collection for ${student.regNo}`);
        } else {
          console.log(`✅ User collection updated for ${student.regNo} (studentYear=${currentYear})`);
        }
      } catch (err) {
        console.error(`❌ Failed to update User for ${student.regNo}:`, err.message);
      }

      // STORE RESULT DATA IN NEW DATABASE (service) — keep after DB updates
      try {
        await storeStudentResult(student, result, expectedSem, notificationStatus);
        console.log(`💾 storeStudentResult succeeded for ${student.name}`);
      } catch (storageError) {
        console.error(`❌ storeStudentResult failed for ${student.name}:`, storageError.message);
      }

      console.log(`✅ Notification & storage process completed for ${student.name}`);

    } catch (err) {
      console.error(`❌ Error processing student ${student?.name || 'unknown'}:`, err.message);
      throw err;
    }
  });

  const settled = await Promise.allSettled(promises);
  const successful = settled.filter(r => r.status === 'fulfilled').length;
  const failed = settled.filter(r => r.status === 'rejected').length;

  console.log(`✅ Batch of ${batch.length} students completed: ${successful} successful, ${failed} failed`);
}

// ----------------- Self-ping -----------------
let consecutivePingFailures = 0;
const MAX_PING_FAILURES = 3;

setInterval(() => {
  const pingUrl = 'https://excel-result-1.onrender.com' ;

  fetch(pingUrl)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      console.log("🔁 Self-ping sent successfully");
      consecutivePingFailures = 0;
    })
    .catch(err => {
      consecutivePingFailures++;
      console.error(`⚠️ Self-ping failed (${consecutivePingFailures}/${MAX_PING_FAILURES}):`, err.message);
      if (consecutivePingFailures >= MAX_PING_FAILURES) {
        console.error('🚨 Too many consecutive ping failures - service may be unhealthy');
      }
    });
}, 5 * 60 * 1000);

// ----------------- Start server -----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
