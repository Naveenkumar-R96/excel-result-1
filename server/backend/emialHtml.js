const createEmailHTML = (result) => {
    return `
      <h2>🎓 Result Published</h2>
      <p><strong>📘 Semester:</strong> ${result.semester}</p>
      <p><strong>📊 CGPA:</strong> ${result.cgpa}</p>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; margin-top: 15px; width: 100%;">
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
          ${result.subjects.map(subject => `
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
    `;
};

module.exports = createEmailHTML;
