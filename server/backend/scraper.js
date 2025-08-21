const { chromium } = require("playwright");

async function fetchResult(registerNo, dob, expectedSem, studentName) {
  const isRender = process.env.RENDER !== undefined;

  const browser = await chromium.launch({
    headless: true,
    ...(isRender
      ? {} // On Render, use bundled Chromium (no executablePath)
      : {
          executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Windows local Chrome
        }),
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("🌐 Navigating to homepage...");
    await page.goto("http://103.105.40.112", { timeout: 60000 });
    console.log("✅ Homepage loaded");

    console.log(`🔐 Clicking Student Login... for ${studentName}`);
    await page.click('a[href="/students/"]');
    await page.waitForLoadState("domcontentloaded");

    console.log("📝 Logging in...");
    await page.fill("#txtLoginId", registerNo);
    await page.fill("#txtPassword", dob);
    await page.click('input[value="Login"]');

    console.log("🧭 Waiting for iframe to appear...");
    const frameHandle = await page.waitForSelector("iframe", { timeout: 15000 });
    if (!frameHandle) {
      console.log("❌ No iframe found, skipping this student");
      await browser.close();
      return null;
    }

    const frame = await frameHandle.contentFrame();
    if (!frame) {
      console.log("❌ Could not get content from iframe");
      await browser.close();
      return null;
    }

    console.log("📄 Extracting rows...");
    const allRows = await frame.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("table.tblBRDefault tr"));
      return rows.slice(1).map(row => {
        const cols = row.querySelectorAll("td");
        return {
          sem: cols[0]?.innerText.trim(),
          code: cols[1]?.innerText.trim(),
          subject: cols[2]?.innerText.trim(),
          credit: cols[3]?.innerText.trim(),
          grade: cols[4]?.innerText.trim(),
          point: cols[5]?.innerText.trim(),
          result: cols[6]?.innerText.trim()
        };
      });
    });

    // Clean valid rows
    const subjectRows = allRows.filter(r =>
      r.subject && r.code && r.grade &&
      !isNaN(parseFloat(r.credit)) &&
      !isNaN(parseFloat(r.point))
    );

    // Filter only up to expected semester
    const filteredResults = subjectRows.filter(
      r => parseInt(r.sem) <= parseInt(expectedSem)
    );

    if (filteredResults.length === 0) {
      console.log(`📭 Semester ${expectedSem} result not yet published for ${studentName}`);
      await browser.close();
      return null;
    }

    // Group by semester
    const semesters = {};
    filteredResults.forEach(r => {
      const sem = parseInt(r.sem);
      if (!semesters[sem]) semesters[sem] = [];
      semesters[sem].push(r);
    });

    // Calculate CGPA per semester + overall
    const semesterCGPAs = {};
    let overallPoints = 0;
    let overallCredits = 0;

    for (const sem in semesters) {
      const semResults = semesters[sem];
      const semPoints = semResults.reduce(
        (acc, row) => acc + parseFloat(row.credit) * parseFloat(row.point),
        0
      );
      const semCredits = semResults.reduce(
        (acc, row) => acc + parseFloat(row.credit),
        0
      );

      const semCGPA = semCredits === 0 ? 0 : (semPoints / semCredits).toFixed(2);
      semesterCGPAs[sem] = semCGPA;

      overallPoints += semPoints;
      overallCredits += semCredits;
    }

    const overallCGPA = overallCredits === 0 ? 0 : (overallPoints / overallCredits).toFixed(2);

    await browser.close();

    return {
      semesterWiseCGPA: semesterCGPAs,
      overallCGPA,
      allSemesters: semesters
    };

  } catch (err) {
    console.error("❌ Scraper failed:", err.message);
    await browser.close();
    return null;
  }
}

module.exports = fetchResult;
