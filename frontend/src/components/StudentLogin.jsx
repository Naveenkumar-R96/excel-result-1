import React, { useState } from 'react';

const StudentLogin = ({ setShowStudentLogin }) => {
  const [formData, setFormData] = useState({
    regNumber: '',
    dob: ''
  });
  const [studentResult, setStudentResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL ='https://excel-result-1.onrender.com' || 'http://localhost:5000';
console.log('API_BASE_URL:', API_BASE_URL);
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    if (!formData.regNumber || !formData.dob) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Fetch student result data from your Result collection
      const response = await fetch(
        `${API_BASE_URL}/api/results/student/${formData.regNumber}`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.studentRegNo) {
          // Validate DOB (basic validation - you might want to enhance this)
          const inputDOB = formData.dob.trim();
          const storedDOB = data.studentDOB;
          
          if (storedDOB && storedDOB !== inputDOB) {
            setError('Invalid date of birth for this registration number');
            return;
          }
          
          setStudentResult(data);
        } else {
          setError('No results found for this student.');
        }
      } else if (response.status === 404) {
        setError('Student not found in the system');
      } else {
        setError('Error fetching results. Please try again.');
      }
    } catch (err) {
      console.error('API Error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Render student result
  if (studentResult) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Your Academic Results</h2>
          <button
            onClick={() => {
              setStudentResult(null);
              setFormData({ regNumber: '', dob: '' });
            }}
            className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded bg-blue-50"
          >
            ← Back to Login
          </button>
        </div>

        {/* Student Info Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 text-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Name:</strong> {studentResult.studentName}</p>
              <p><strong>Registration No:</strong> {studentResult.studentRegNo}</p>
              <p><strong>Email:</strong> {studentResult.studentEmail || 'Not provided'}</p>
            </div>
            <div>
              <p><strong>Year:</strong> {studentResult.studentYear || 'N/A'}</p>
              <p><strong>Section:</strong> {studentResult.studentSection || 'N/A'}</p>
              <p><strong>Overall CGPA:</strong> <span className="text-green-600 font-bold text-lg">{studentResult.overallCGPA}</span></p>
            </div>
          </div>
        </div>

        {/* Semester Results */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-800">Semester-wise Results</h3>
          
          {studentResult.semesters && studentResult.semesters.length > 0 ? (
            studentResult.semesters
              .sort((a, b) => a.semesterNumber - b.semesterNumber)
              .map((semester) => (
                <div key={semester.semesterNumber} className="bg-white rounded-lg shadow-lg p-6 text-gray-800">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold">Semester {semester.semesterNumber}</h4>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                      SGPA: {semester.cgpa}
                    </span>
                  </div>

                  <div className="overflow-x-auto text-gray-800">
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
                                subject.grade === 'O' ? 'bg-green-100 text-green-800' :
                                subject.grade === 'A+' ? 'bg-green-100 text-green-800' :
                                subject.grade === 'A' ? 'bg-green-100 text-green-800' :
                                subject.grade === 'B+' ? 'bg-green-100 text-green-800' :
                                subject.grade === 'C' ? 'bg-green-100 text-green-800' :
                                subject.grade === 'U' ? 'bg-orange-100 text-orange-800' :
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
        {studentResult.notificationHistory && studentResult.notificationHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6 text-gray-800">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Notification History</h3>
            <div className="space-y-2">
              {studentResult.notificationHistory
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map((notification, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Semester {notification.semesterDetected} result notification sent</span>
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

  // Login form
  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Student Result Portal
      </h2>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="regNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Registration Number
            </label>
            <input
              type="text"
              id="regNumber"
              name="regNumber"
              value={formData.regNumber}
              onChange={handleInputChange}
              placeholder="Enter your registration number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          <div>
            <label
              htmlFor="dob"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date of Birth
            </label>
            <input
              type="text"
              id="dob"
              name="dob"
              value={formData.dob}
              onChange={handleInputChange}
              placeholder="DD-MM-YYYY"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Fetching Results...' : 'Get Results'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;