import React, { useState } from 'react';
import { Search, User, Calendar, Award, AlertCircle, BookOpen, TrendingUp } from 'lucide-react';

const StudentResultLookup = () => {
  const [formData, setFormData] = useState({
    regNo: '',
    dob: ''
  });
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.regNo.trim() || !formData.dob.trim()) {
      setError('Please enter both registration number and date of birth');
      return;
    }

    setLoading(true);
    setError('');
    setStudentData(null);

    try {
      const response = await fetch('/api/student-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regNo: formData.regNo.trim(),
          dob: formData.dob.trim()
        }),
      });
      const result = await response.json();

      if (!result.success) {
        setError(result.error || result.message || 'Failed to fetch results');
        return;
      }

      setStudentData(result.data);
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade === 'U') return 'text-red-600 bg-red-50';
    if (grade === 'O') return 'text-green-600 bg-green-50';
    if (grade === 'A+' || grade === 'A') return 'text-blue-600 bg-blue-50';
    if (grade === 'B+' || grade === 'B') return 'text-purple-600 bg-purple-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getCGPAColor = (cgpa) => {
    if (cgpa >= 9) return 'text-green-600';
    if (cgpa >= 8) return 'text-blue-600';
    if (cgpa >= 7) return 'text-purple-600';
    if (cgpa >= 6) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <BookOpen className="text-blue-600" />
            Student Result Lookup
          </h1>
          <p className="text-gray-600">Enter your credentials to view your academic results</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-center">
            <input
              type="text"
              name="regNo"
              placeholder="Enter Reg No"
              value={formData.regNo}
              onChange={handleInputChange}
              className="flex-1 border rounded p-2"
            />
            <input
              type="text"
              name="dob"
              placeholder="DD-MM-YYYY"
              value={formData.dob}
              onChange={handleInputChange}
              className="flex-1 border rounded p-2"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Get Results
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Results Display */}
        {studentData && (
          <div className="space-y-6">
            {/* Student Info */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <User className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-800">{studentData.studentName}</h3>
                <p className="text-sm text-gray-600">{studentData.regNo}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-800">Overall CGPA</h3>
                <p className={`text-2xl font-bold ${getCGPAColor(studentData.overallCGPA)}`}>
                  {studentData.overallCGPA?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-800">Completed Semesters</h3>
                <p className="text-2xl font-bold text-purple-600">{studentData.maxSemester}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-800">Failed Subjects</h3>
                <p className="text-2xl font-bold text-red-600">{studentData.totalFailedSubjects}</p>
              </div>
            </div>

            {/* Semester-wise Results */}
            {studentData.completedSemesters?.map((semester) => {
              const subjects = studentData.subjectsBySemester[semester] || [];
              const semesterCGPA = studentData.semesterWiseCGPA[semester];

              return (
                <div key={semester} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
                    <h3 className="text-xl font-bold">Semester {semester}</h3>
                    <div className="text-right">
                      <p className="text-sm opacity-90">CGPA</p>
                      <p className="text-2xl font-bold">{semesterCGPA?.toFixed(2) || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Credits</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Grade</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Points</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {subjects.map((subject, index) => (
                          <tr key={index} className={subject.grade === 'U' ? 'bg-red-25' : 'hover:bg-gray-50'}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{subject.code}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{subject.subject}</td>
                            <td className="px-4 py-3 text-sm text-center font-medium">{subject.credit}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(subject.grade)}`}>
                                {subject.grade}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-center font-medium">{subject.point}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                subject.result === 'PASS' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
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
              );
            })}

            <div className="text-center text-sm text-gray-500 mt-8">
              Last updated: {new Date(studentData.lastUpdated).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentResultLookup;
