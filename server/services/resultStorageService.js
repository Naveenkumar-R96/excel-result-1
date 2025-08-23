// services/resultStorageService.js
const Result = require("../models/Result");

/**
 * Store student result data when notification is sent
 * @param {Object} student - Student object from User model
 * @param {Object} result - Result data from scraper
 * @param {Number} newSemester - The newly detected semester number
 * @param {Object} notificationStatus - Status of sent notifications
 * @returns {Promise<Object>} - Stored result document
 */
async function storeStudentResult(student, result, newSemester, notificationStatus = {}) {
  try {
    console.log(`💾 Storing result data for ${student.name} (semester ${newSemester})`);

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

    const resultDocument = new Result({
      studentRegNo: student.regNo,
      studentName: student.name,
      studentEmail: student.email || null,
      semesters: semesters,
      overallCGPA: result.overallCGPA || "N/A",
      newSemesterDetected: newSemester,
      notificationSent: {
        telegram: notificationStatus.telegram || false,
        email: notificationStatus.email || false
      },
      rawResultData: result // Store complete raw data for reference
    });

    const savedResult = await resultDocument.save();
    console.log(`✅ Result data stored successfully for ${student.name} - Document ID: ${savedResult._id}`);

    return savedResult;
  } catch (error) {
    console.error(`❌ Failed to store result data for ${student.name}:`, error.message);
    throw error;
  }
}

/**
 * Get stored results for a student
 * @param {String} regNo - Student registration number
 * @param {Number} limit - Number of results to return (default: 10)
 * @returns {Promise<Array>} - Array of stored results
 */
async function getStudentResults(regNo, limit = 10) {
  try {
    const results = await Result.find({ studentRegNo: regNo })
      .sort({ notificationTimestamp: -1 })
      .limit(limit)
      .lean();
    
    return results;
  } catch (error) {
    console.error(`❌ Failed to fetch results for ${regNo}:`, error.message);
    throw error;
  }
}

/**
 * Get all stored results with pagination
 * @param {Number} page - Page number (default: 1)
 * @param {Number} limit - Results per page (default: 20)
 * @returns {Promise<Object>} - Paginated results
 */
async function getAllResults(page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;
    const results = await Result.find({})
      .sort({ notificationTimestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Result.countDocuments({});
    
    return {
      results,
      totalResults: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      hasNext: page * limit < total,
      hasPrev: page > 1
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
    const totalNotifications = await Result.countDocuments({});
    const telegramSent = await Result.countDocuments({ 'notificationSent.telegram': true });
    const emailSent = await Result.countDocuments({ 'notificationSent.email': true });
    const uniqueStudents = await Result.distinct('studentRegNo').then(arr => arr.length);
    
    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivity = await Result.countDocuments({
      notificationTimestamp: { $gte: sevenDaysAgo }
    });

    return {
      totalNotifications,
      telegramSent,
      emailSent,
      uniqueStudents,
      recentActivity,
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
  getAllResults,
  getResultStatistics
};