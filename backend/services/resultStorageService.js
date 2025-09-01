// services/resultStorageService.js
const Result = require("../models/Result");

/**
 * Store/Update student result data when notification is sent (EFFICIENT VERSION)
 * @param {Object} student - Student object from User model
 * @param {Object} result - Result data from scraper
 * @param {Number} newSemester - The newly detected semester number
 * @param {Object} notificationStatus - Status of sent notifications
 * @returns {Promise<Object>} - Stored/updated result document
 */
async function storeStudentResult(student, result, newSemester, notificationStatus = {}) {
  try {
    console.log(`💾 Storing/updating result data for ${student.name} (semester ${newSemester})`);

    // Transform the result data to match our schema
    const semesters = [];
    
    if (result.allSemesters) {
      for (const [semNum, subjects] of Object.entries(result.allSemesters)) {
        const semesterNumber = parseInt(semNum);
        if (!isNaN(semesterNumber) && Array.isArray(subjects)) {
          semesters.push({
            semesterNumber: semesterNumber,
            subjects: subjects.map(subject => ({
              code: subject.code || 'N/A',
              subject: subject.subject || 'N/A',
              credit: subject.credit || 'N/A',
              grade: subject.grade || 'N/A',
              point: subject.point || 'N/A',
              result: subject.result || 'N/A'
            })),
            cgpa: result.semesterWiseCGPA?.[semNum] || "N/A"
          });
        }
      }
    }

    // Sort semesters by semester number
    semesters.sort((a, b) => a.semesterNumber - b.semesterNumber);
    const maxSemester = semesters.length > 0 ? Math.max(...semesters.map(s => s.semesterNumber)) : 0;

    // ✅ UPDATE OR CREATE - One document per student
    const savedResult = await Result.findOneAndUpdate(
      { studentRegNo: student.regNo }, // Find by registration number
      {
        $set: {
          // ✅ Basic student info with missing fields
          studentName: student.name,
          studentEmail: student.email || null,
          studentYear: student.year || null,
          studentSection: student.section || null, 
          studentDOB: student.dob || null,
          
          // ✅ Complete semester data (replaces old with latest)
          semesters: semesters,
          overallCGPA: result.overallCGPA || "N/A",
          
          // ✅ Current state tracking
          currentMaxSemester: maxSemester,
          lastNotificationSemester: newSemester,
          lastUpdated: new Date(),
          
          // ✅ Raw data for reference
          rawResultData: result
        },
        $push: {
          // ✅ Add to notification history (keeps track of each notification)
          notificationHistory: {
            semesterDetected: newSemester,
            timestamp: new Date(),
            notificationStatus: {
              telegram: notificationStatus.telegram || false,
              email: notificationStatus.email || false
            },
            overallCGPAAtTime: result.overallCGPA || "N/A"
          }
        }
      },
      { 
        new: true, // Return updated document
        upsert: true, // Create if doesn't exist
        runValidators: true
      }
    );

    console.log(`✅ Result data updated successfully for ${student.name} - Document ID: ${savedResult._id}`);
    console.log(`📊 Total semesters stored: ${semesters.length}, Notification history: ${savedResult.notificationHistory.length} entries`);

    return savedResult;
  } catch (error) {
    console.error(`❌ Failed to store/update result data for ${student.name}:`, error.message);
    throw error;
  }
}

/**
 * Get notification history for a student
 * @param {String} regNo - Student registration number
 * @returns {Promise<Object>} - Student result with notification history
 */
async function getStudentNotificationHistory(regNo) {
  try {
    const studentResult = await Result.findOne({ studentRegNo: regNo })
      .select('studentName studentRegNo notificationHistory currentMaxSemester lastNotificationSemester')
      .lean();
    
    if (!studentResult) {
      return null;
    }

    return {
      student: {
        name: studentResult.studentName,
        regNo: studentResult.studentRegNo
      },
      currentMaxSemester: studentResult.currentMaxSemester,
      lastNotificationSemester: studentResult.lastNotificationSemester,
      totalNotifications: studentResult.notificationHistory.length,
      notificationHistory: studentResult.notificationHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    };
  } catch (error) {
    console.error(`❌ Failed to fetch notification history for ${regNo}:`, error.message);
    throw error;
  }
}

/**
 * Get current result data for a student
 * @param {String} regNo - Student registration number
 * @returns {Promise<Object>} - Current student result data
 */
async function getStudentResults(regNo) {
  try {
    const result = await Result.findOne({ studentRegNo: regNo }).lean();
    return result;
  } catch (error) {
    console.error(`❌ Failed to fetch results for ${regNo}:`, error.message);
    throw error;
  }
}

/**
 * Get all students with their latest result info
 * - Results per page (default: 20)
 * @returns {Promise<Object>} - Paginated results
 */
async function getAllResults() {
  try {
   
    const results = await Result.find({})
      .sort({ lastUpdated: -1 })
      
      .select('studentRegNo studentName studentYear studentSection currentMaxSemester lastNotificationSemester lastUpdated notificationHistory overallCGPA')
      .lean();

      console.log(results);
    
    const total = await Result.countDocuments({});
    
    return {
      results,
      totalResults: total,
    };
  } catch (error) {
    console.error(`❌ Failed to fetch all results:`, error.message);
    throw error;
  }
}

/**
 * Get statistics about stored results
 * @returns {Promise<Object>} - Statistics object
 */
async function getResultStatistics() {
  try {
    const totalStudents = await Result.countDocuments({});
    
    // Count total notifications sent (sum of all notification history entries)
    const notificationStats = await Result.aggregate([
      { $unwind: "$notificationHistory" },
      {
        $group: {
          _id: null,
          totalNotifications: { $sum: 1 },
          telegramSent: {
            $sum: { $cond: ["$notificationHistory.notificationStatus.telegram", 1, 0] }
          },
          emailSent: {
            $sum: { $cond: ["$notificationHistory.notificationStatus.email", 1, 0] }
          }
        }
      }
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivity = await Result.countDocuments({
      lastUpdated: { $gte: sevenDaysAgo }
    });

    // Get semester distribution
    const semesterStats = await Result.aggregate([
      {
        $group: {
          _id: "$currentMaxSemester",
          studentCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const stats = notificationStats[0] || { totalNotifications: 0, telegramSent: 0, emailSent: 0 };

    return {
      totalStudents,
      totalNotifications: stats.totalNotifications,
      telegramSent: stats.telegramSent,
      emailSent: stats.emailSent,
      recentActivity,
      semesterDistribution: semesterStats,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error(`❌ Failed to get statistics:`, error.message);
    throw error;
  }
}

module.exports = {
  storeStudentResult,
  getStudentResults,
  getStudentNotificationHistory,
  getAllResults,
  getResultStatistics
};