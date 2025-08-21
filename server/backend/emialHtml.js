const createEmailHTML = (result) => {
  return `
    <h2>🎓 Result Published</h2>
    <p><strong>👤 Student:</strong> ${result.name} (${result.regNo})</p>
    
    ${result.allSemesters.map(sem => `
      <h3>📘 Semester ${sem.semester}</h3>
      <p><strong>📊 CGPA:</strong> ${sem.cgpa}</p>
      <table border="1" cellpadding="8" cellspacing="0" 
        style="border-collapse: collapse; margin-top: 15px; width: 100%;">
        <thead>
          <tr style="background-color:rgb(124, 247, 153); text-align: left;">
            <th>Subject Code</th>
            <th>Subject Name</th>
            <th>Credits</th>
            <th>Grade</th>
            <th>Grade Point</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          ${sem.subjects.map(subject => `
            <tr>
              <td>${subject.code}</td>
              <td>${subject.subject}</td>
              <td>${subject.credit}</td>
              <td>${subject.grade}</td>
              <td>${subject.point}</td>
              <td>${subject.result}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `).join("<br/>")}
     <hr/>
    <h3>🏆 Overall CGPA: ${result.overallCGPA}</h3>
  `;
};

module.exports = createEmailHTML;
