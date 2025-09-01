// routes/resultRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getStudentResults, 
  getAllResults, 
  getResultStatistics,
  getStudentNotificationHistory 
} = require('../services/resultStorageService');

// Get individual student result by registration number
router.get('/student/:regNo', async (req, res) => {
  try {
    const { regNo } = req.params;
    
    if (!regNo) {
      return res.status(400).json({ error: 'Registration number is required' });
    }

    const result = await getStudentResults(regNo);
    
    if (!result) {
      return res.status(404).json({ error: 'Student results not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching student result:', error.message);
    res.status(500).json({ error: 'Failed to fetch student result' });
  }
});

// Get all results with pagination and filtering
router.get('/all', async (req, res) => {
  try {
    
    const year = req.query.year;
    const section = req.query.section;

    let results = await getAllResults();
    
    // Apply year and section filters if provided
    if (year || section) {
      results.results = results.results.filter(student => {
        let matches = true;
        if (year && student.studentYear !== parseInt(year)) {
          matches = false;
        }
        if (section && student.studentSection !== section) {
          matches = false;
        }
        return matches;
      });
    }

    res.json(results);
  } catch (error) {
    console.error('Error fetching all results:', error.message);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// Get students by year and section
router.get('/students', async (req, res) => {
  try {
    const { year, section } = req.query;
    
    if (!year || !section) {
      return res.status(400).json({ error: 'Year and section are required' });
    }

    const results = await getAllResults(1, 200); // Get more records for filtering
    
    const filteredStudents = results.results
      .filter(student => 
        student.studentYear === parseInt(year) && 
        student.studentSection === section
      )
      .map(student => ({
        studentRegNo: student.studentRegNo,
        studentName: student.studentName,
        studentYear: student.studentYear,
        studentSection: student.studentSection,
        overallCGPA: student.overallCGPA || 'N/A',
        currentMaxSemester: student.currentMaxSemester,
        lastNotificationSemester: student.lastNotificationSemester,
        lastUpdated: student.lastUpdated
      }));

    res.json(filteredStudents);
  } catch (error) {
    console.error('Error fetching students by class:', error.message);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get notification history for a student
router.get('/student/:regNo/notifications', async (req, res) => {
  try {
    const { regNo } = req.params;
    
    const history = await getStudentNotificationHistory(regNo);
    
    if (!history) {
      return res.status(404).json({ error: 'Student notification history not found' });
    }

    res.json(history);
  } catch (error) {
    console.error('Error fetching notification history:', error.message);
    res.status(500).json({ error: 'Failed to fetch notification history' });
  }
});

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await getResultStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error.message);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Search students by name or registration number
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = await getAllResults(1, 200);
    
    const filteredStudents = results.results.filter(student => 
      student.studentName.toLowerCase().includes(query.toLowerCase()) ||
      student.studentRegNo.toLowerCase().includes(query.toLowerCase())
    );

    res.json({
      query,
      totalResults: filteredStudents.length,
      results: filteredStudents
    });
  } catch (error) {
    console.error('Error searching students:', error.message);
    res.status(500).json({ error: 'Failed to search students' });
  }
});

module.exports = router;