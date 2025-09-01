// emialHtml.js - Fixed version
module.exports = (result) => {
  // Convert the object to array format for easier processing
  const semesterEntries = Object.entries(result.allSemesters).map(([sem, subjects]) => ({
    semester: sem,
    subjects: subjects
  }));

  // Generate HTML for each semester
  const semesterHtml = semesterEntries.map(({ semester, subjects }) => {
    const subjectRows = subjects.map(subject => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${subject.code}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${subject.subject}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${subject.grade}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${subject.result}</td>
      </tr>
    `).join('');

    return `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #2c3e50; margin-bottom: 10px;">📘 Semester ${semester}</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; border: 1px solid #ddd;">Subject Code</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Subject Name</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Grade</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Result</th>
            </tr>
          </thead>
          <tbody>
            ${subjectRows}
          </tbody>
        </table>
        <p style="margin: 10px 0; font-weight: bold;">
          Semester CGPA: ${result.semesterWiseCGPA[semester] || "N/A"}
        </p>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Result Published</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #27ae60; margin: 0;">🎓 Result Published!</h1>
          <p style="color: #666; margin: 10px 0;">Your academic results are now available</p>
        </div>

        ${semesterHtml}

        <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; text-align: center; margin-top: 30px;">
          <h2 style="color: #2c3e50; margin: 0 0 10px 0;">📊 Overall CGPA</h2>
          <div style="font-size: 36px; font-weight: bold; color: #27ae60;">${result.overallCGPA}</div>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            Congratulations on your academic achievement! 🎉<br>
            Keep up the great work!
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
};


