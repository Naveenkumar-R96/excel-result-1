import React, { useState } from 'react';
import process from 'process';
const FacultyLogin = ({ setShowFacultyLogin }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dashboardStats, setDashboardStats] = useState(null);

 
  const years = ['1', '2', '3', '4'];
  const sections = ['A', 'B', 'C', 'D'];

  
  const API_URL='https://excel-result-1.onrender.com' || 'http://localhost:5000';
 console.log('API_URL:', API_URL);
  const handlePasswordSubmit = async () => {
    if (password === "faculty@ece") {
      setIsAuthenticated(true);
      setError('');
      
      // Fetch dashboard stats after authentication
      try {
        const response = await fetch(`${API_URL}/api/dashboard/stats`);
        if (response.ok) {
          const stats = await response.json();
          setDashboardStats(stats);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      }
    } else {
      setError('Invalid password. Contact admin for access.');
    }
  };

  const fetchStudentsList = async () => {
    if (!selectedYear || !selectedSection) return;

    setLoading(true);
    setError('');
    
    try {
      // Fetch all results and filter by year and section
      const response = await fetch(`${API_URL}/api/results/all`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Filter students by year and section
        const filteredStudents = data.results.filter(student => 
          student.studentYear === selectedYear && 
          student.studentSection === selectedSection
        );
        console.log(filteredStudents);
        
        setStudentsList(filteredStudents);
      } else {
        setError('Failed to fetch students list');
      }
    } catch (err) {
      console.error('API Error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = async (studentRegNo) => {
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/results/student/${studentRegNo}`);
      
      if (response.ok) {
        const data = await response.json();
        setSelectedStudent(data);
      } else {
        setError('Failed to fetch student details');
      }
    } catch (err) {
      console.error('API Error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const resetToClassSelection = () => {
    setSelectedStudent(null);
    setStudentsList([]);
    setSelectedYear('');
    setSelectedSection('');
  };

  const resetToStudentsList = () => {
    setSelectedStudent(null);
  };

  // Password input screen
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Faculty Login</h2>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Faculty Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter faculty password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <button
              onClick={handlePasswordSubmit}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Student result view
  if (selectedStudent) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Student Result Details</h2>
          <div className="flex gap-2">
            <button
              onClick={resetToStudentsList}
              className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded bg-blue-50 cursor-pointer"
            >
              ← Back to Students
            </button>
            <button
              onClick={resetToClassSelection}
              className="text-gray-600 hover:text-gray-800 px-3 py-1 rounded bg-gray-50"
            >
              Class Selection
            </button>
          </div>
        </div>

        {/* Student Info Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 text-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p><strong>Name:</strong> {selectedStudent.studentName}</p>
              <p><strong>Registration No:</strong> {selectedStudent.studentRegNo}</p>
              <p><strong>Section:</strong> {selectedStudent.studentSection || 'N/A'}</p>
              <p><strong>Email:</strong> {selectedStudent.studentEmail || 'Not provided'}</p>
            </div>
            <div>
              <p><strong>Year:</strong> {selectedStudent.studentYear || 'N/A'}</p>
              <p><strong>Date of Birth:</strong> {selectedStudent.studentDOB || 'N/A'}</p>
              <p><strong>Overall CGPA:</strong> <span className="text-green-600 font-bold text-lg">{selectedStudent.overallCGPA}</span></p>
              <p><strong>Last Updated:</strong> {formatDate(selectedStudent.lastUpdated)}</p>
            </div>
          </div>
        </div>

        {/* Semester Results */}
        <div className="space-y-6 text-gray-800">
          <h3 className="text-xl font-semibold text-gray-800">Semester-wise Performance</h3>
          
          {selectedStudent.semesters && selectedStudent.semesters.length > 0 ? (
            selectedStudent.semesters
              .sort((a, b) => a.semesterNumber - b.semesterNumber)
              .map((semester) => (
                <div key={semester.semesterNumber} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold">Semester {semester.semesterNumber}</h4>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                      SGPA: {semester.cgpa}
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border p-2 text-left">Course Code</th>
                          <th className="border p-2 text-left">Subject</th>
                          <th className="border p-2 text-center">Credits</th>
                          <th className="border p-2 text-center">Grade</th>
                          <th className="border p-2 text-center">Points</th>
                          <th className="border p-2 text-center">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {semester.subjects.map((subject, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border p-2 font-mono text-sm">{subject.code}</td>
                            <td className="border p-2">{subject.subject}</td>
                            <td className="border p-2 text-center">{subject.credit}</td>
                            <td className="border p-2 text-center">
                              <span className={`px-2 py-1 rounded text-sm font-medium ${
                                subject.grade === 'A+' ? 'bg-green-100 text-green-800' :
                                subject.grade === 'A' ? 'bg-blue-100 text-blue-800' :
                                subject.grade === 'B+' ? 'bg-yellow-100 text-yellow-800' :
                                subject.grade === 'B' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {subject.grade}
                              </span>
                            </td>
                            <td className="border p-2 text-center">{subject.point}</td>
                            <td className="border p-2 text-center">
                              <span className={`px-2 py-1 rounded text-sm ${
                                subject.result === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {subject.result}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6 text-center text-gray-500">
              No semester results available
            </div>
          )}
        </div>

        {/* Notification History */}
        {selectedStudent.notificationHistory && selectedStudent.notificationHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6 text-gray-800">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Notification History</h3>
            <div className="space-y-2">
              {selectedStudent.notificationHistory
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map((notification, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <span>Semester {notification.semesterDetected} result notified</span>
                      <div className="text-sm text-gray-500">
                        Telegram: {notification.notificationStatus.telegram ? '✅' : '❌'} | 
                        Email: {notification.notificationStatus.email ? '✅' : '❌'}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span>CGPA: {notification.overallCGPAAtTime}</span>
                      <span className="ml-4">{formatDate(notification.timestamp)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Students list view
  if (selectedYear && selectedSection && studentsList.length > 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Year {selectedYear} - Section {selectedSection} Students ({studentsList.length})
          </h2>
          <button
            onClick={resetToClassSelection}
            className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded bg-blue-50 cursor-pointer"
          >
            ← Back to Class Selection
          </button>
        </div>

        <div className="grid gap-4">
          {studentsList.map((student) => (

            <div 
              key={student.studentRegNo}
              className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-blue-500 hover:border-blue-600"
              onClick={() => handleStudentSelect(student.studentRegNo)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{student.studentName}</h3>
                  <p className="text-gray-600">Reg No: {student.studentRegNo}</p>
                  <p className="text-sm text-gray-500">
                    Last Semester: {student.currentMaxSemester} 
                  </p>
                </div>
            {console.log(student)}
                <div className="text-right">
                  <p className="text-sm text-gray-500">Overall CGPA</p>
                  <p className="text-xl font-bold text-green-600">{student.overallCGPA}</p>
                  <p className="text-xs text-gray-400">{formatDate(student.lastUpdated)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="text-lg">Loading student details...</div>
          </div>
        )}
      </div>
    );
  }

  // Class selection view
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Faculty Dashboard</h2>
        <button
          onClick={() => {
            setIsAuthenticated(false);
            setPassword('');
            setDashboardStats(null);
          }}
          className="text-red-600 hover:text-red-800 px-3 py-1 rounded bg-red-50 cursor-pointer"
        >
          Logout
        </button>
      </div>

      {/* Dashboard Stats */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Students</p>
            <p className="text-2xl font-bold text-blue-600">{dashboardStats.totalStudents}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Notifications</p>
            <p className="text-2xl font-bold text-green-600">{dashboardStats.totalNotifications}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Telegram Sent</p>
            <p className="text-2xl font-bold text-purple-600">{dashboardStats.telegramSent}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Email Sent</p>
            <p className="text-2xl font-bold text-orange-600">{dashboardStats.emailSent}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Class</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
            <div className="grid grid-cols-4 gap-2">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`p-3 rounded-md border-2 transition-colors text-gray-800 cursor-pointer ${
                    selectedYear === year 
                      ? 'border-green-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
            <div className="grid grid-cols-4 gap-2">
              {sections.map((section) => (
                <button
                  key={section}
                  onClick={() => setSelectedSection(section)}
                  className={`p-3 rounded-md border-2 transition-colors text-gray-800 ${
                    selectedSection === section 
                      ? 'border-green-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {section}
                </button>
              ))}
            </div>
          </div>

          {selectedYear && selectedSection && (
            <button
              onClick={fetchStudentsList}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading Students...' : `View Year ${selectedYear} Section ${selectedSection} Students`}
            </button>
          )}
{/* 
          {selectedYear && selectedSection && studentsList.length === 0 && !loading && (
            <div className="text-center text-gray-500 py-4">
              No students found for Year {selectedYear} Section {selectedSection}
            </div>
          )} */}

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyLogin;