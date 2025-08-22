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

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err.message));

app.use("/api/users", userRoutes);

let isCronRunning = false;
let processingQueue = [];

// ✅ OPTIMIZED: Every minute
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
      return;
    }

    console.log(`👥 Found ${students.length} students to check`);

    const BATCH_SIZE = 3;
    let processedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      const batch = students.slice(i, i + BATCH_SIZE);
      console.log(`🔍 Checking batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.map(s => s.name).join(', ')}`);

      const batchResults = await Promise.allSettled(
        batch.map(async (student) => {
          try {
            if (!student.regNo || !student.dob || !student.name) {
              throw new Error('Invalid student data');
            }

            // ✅ NEW LOGIC: Calculate expected semester from notifiedSemesters
            const lastNotifiedSem = student.notifiedSemesters && student.notifiedSemesters.length > 0 
              ? Math.max(...student.notifiedSemesters) 
              : 0;
            const expectedSem = lastNotifiedSem + 1; // Next semester to check

            console.log(`🎯 ${student.name}: Last notified sem = ${lastNotifiedSem}, checking for sem = ${expectedSem}`);

            if (processingQueue.find(s => s.student.regNo === student.regNo)) {
              return { status: 'skipped', reason: 'in_queue' };
            }

            // ✅ OPTIMIZED: 45 second timeout
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
              throw new Error(result.message);
            }

            // ✅ NEW LOGIC: Check if the expected semester is available in results
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

      // ✅ OPTIMIZED: 500ms delay
      if (i + BATCH_SIZE < students.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Process queued students
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

// ✅ NEW LOGIC: Enhanced processBatchParallel without currentSem field
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

      if (Object.keys(result.allSemesters).length === 0) {
        throw new Error('Invalid result structure: empty allSemesters');
      }

      // ✅ NEW LOGIC: Get all available published semesters
      const publishedSemesters = Object.keys(result.allSemesters)
        .map(s => parseInt(s))
        .filter(s => !isNaN(s))
        .sort((a, b) => a - b);

      const maxPublishedSem = Math.max(...publishedSemesters);
      
      console.log(`📊 Published semesters for ${student.name}: ${publishedSemesters.join(', ')}`);
      console.log(`📊 Max published semester: ${maxPublishedSem}, New semester detected: ${expectedSem}`);

      // ✅ NEW LOGIC: Send ALL semesters from 1 to max (complete result)
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

      // ✅ Send notifications
      const notificationResults = await Promise.allSettled([
        (async () => {
          try {
            await sendTelegramMessage(message);
            console.log(`✅ Telegram sent for ${student.name}`);
            return { type: 'telegram', status: 'success' };
          } catch (err) {
            console.error(`❌ Telegram failed for ${student.name}:`, err.message);
            return { type: 'telegram', status: 'failed', error: err.message };
          }
        })(),
        
        (async () => {
          try {
            if (!student.email) {
              throw new Error('No email address provided');
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(student.email)) {
              throw new Error('Invalid email format');
            }

            const emailHtml = require("./emialHtml")(result);
            await sendEmail(student.email, "🎓 Your Result is Published", emailHtml);
            console.log(`✅ Email sent for ${student.name}`);
            return { type: 'email', status: 'success' };
          } catch (err) {
            console.error(`❌ Email failed for ${student.name}:`, err.message);
            return { type: 'email', status: 'failed', error: err.message };
          }
        })()
      ]);

      const successful = notificationResults.filter(r => 
        r.status === 'fulfilled' && r.value.status === 'success'
      );

      if (successful.length === 0) {
        throw new Error('All notification methods failed');
      }

      // ✅ NEW LOGIC: Update database without currentSem field
      console.log(`📝 Updating notified semesters to: ${publishedSemesters.join(', ')}`);

      const updateResult = await User.updateOne(
        { regNo: student.regNo },
        {
          $set: {
            lastNotified: new Date(),
            notifiedSemesters: publishedSemesters // ✅ Store ALL semesters 1 to max
          }
        }
      );

      if (updateResult.matchedCount === 0) {
        throw new Error('Student not found in database during update');
      }

      console.log(`✅ Updated notified semesters for ${student.name}: ${publishedSemesters.join(', ')}`);
      console.log(`✅ Next check will look for semester ${maxPublishedSem + 1}`);
      console.log(`✅ Notification process completed for ${student.name}`);

    } catch (err) {
      console.error(`❌ Error processing ${student.name}:`, err.message);
    }
  });

  const results = await Promise.allSettled(promises);
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`✅ Batch of ${batch.length} students completed: ${successful} successful, ${failed} failed`);
}

// ✅ Enhanced test endpoint without currentSem
app.post("/test-student", async (req, res) => {
  try {
    const { regNo } = req.body;
    
    if (!regNo) {
      return res.status(400).json({ error: "Registration number is required" });
    }

    const student = await User.findOne({ regNo }).catch(err => {
      console.error('Database query error:', err.message);
      throw new Error('Database query failed');
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    
    // ✅ NEW LOGIC: Calculate expected semester
    const lastNotifiedSem = student.notifiedSemesters && student.notifiedSemesters.length > 0 
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
    
    res.json({ 
      student: student.name, 
      regNo: student.regNo,
      lastNotifiedSem: lastNotifiedSem,
      expectedSem: expectedSem,
      notifiedSemesters: student.notifiedSemesters || [],
      result, 
      hasResult: !!result,
      hasExpectedSem: result?.allSemesters?.[expectedSem] ? true : false,
      availableSemesters: result?.availableSemesters || [],
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Test endpoint error:', err.message);
    res.status(500).json({ 
      error: err.message,
      timestamp: new Date()
    });
  }
});

// ✅ Enhanced self-ping
let consecutivePingFailures = 0;
const MAX_PING_FAILURES = 3;

setInterval(() => {
  const pingUrl = process.env.SELF_PING_URL || "http://localhost:3001";
  
  fetch(pingUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});