const { chromium } = require("playwright");

let browser; // 🔥 Global browser instance

// ✅ Launch browser once and reuse
async function getBrowser() {
  if (!browser) {
    const isRender = process.env.RENDER !== undefined;

    browser = await chromium.launch({
      headless: true,
      ...(isRender
        ? {} // On Render, use bundled Chromium
        : {
          executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Local Windows Chrome
        }),
    });

    console.log("🚀 Browser launched");
  }
  return browser;
}

async function fetchResult(registerNo, dob, expectedSem, studentName) {
  const browser = await getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("🌐 Navigating to homepage...");
    await page.goto("http://103.105.40.112/students", { timeout: 60000 });
    console.log("✅ Student Page loaded");

    console.log("📝 Logging in...");
    await page.fill("#txtLoginId", registerNo);
    await page.fill("#txtPassword", dob);
    await page.click('input[value="Login"]');

    console.log("🧭 Waiting for iframe to appear...");
    const frameHandle = await page.waitForSelector("iframe", { timeout: 15000 });
    if (!frameHandle) {
      console.log("❌ No iframe found, skipping this student");
      return null;
    }

    const frame = await frameHandle.contentFrame();
    if (!frame) {
      console.log("❌ Could not get content from iframe");
      return null;
    }

    console.log("📄 Extracting rows...");
    const allRows = await frame.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("table.tblBRDefault tr"));
      return rows.slice(1).map((row, index) => {
        const cols = row.querySelectorAll("td");
        return {
          rowIndex: index,
          sem: cols[0]?.innerText.trim() || "",
          code: cols[1]?.innerText.trim() || "",
          subject: cols[2]?.innerText.trim() || "",
          credit: cols[3]?.innerText.trim() || "",
          grade: cols[4]?.innerText.trim() || "",
          point: cols[5]?.innerText.trim() || "",
          result: cols[6]?.innerText.trim() || "",
        };
      });
    });

    console.log(`📊 Extracted ${allRows.length} data rows for ${studentName}`);

    const availableSems = allRows
      .map(r => parseInt(r.sem))
      .filter(sem => !isNaN(sem));

    const maxSem = availableSems.length > 0 ? Math.max(...availableSems) : NaN;
    console.log(`📊 Max available semester: ${maxSem}, Expected: ${expectedSem}`);

    if (isNaN(maxSem)) {
      console.log(`⚠️  No valid semester data found for ${studentName}`);
      return null;
    }
    if (maxSem < expectedSem) {
      console.log(`📭 Semester ${expectedSem} not yet published for ${studentName}`);
      return {
        status: "not_published",
        message: `Semester ${expectedSem} not yet published`,
        maxAvailableSem: maxSem,
        expectedSem: expectedSem,
      };
    }

    // ✅ Only include results up to expected semester
    const semesterRows = allRows.filter(
      r => !isNaN(parseInt(r.sem)) && parseInt(r.sem) <= maxSem
    );

    // Group by semester
    const semesters = {};
    semesterRows.forEach(r => {
      const sem = parseInt(r.sem);
      if (!semesters[sem]) semesters[sem] = [];
      semesters[sem].push(r);
    });

    // Calculate CGPA
    const semesterCGPAs = {};
    let overallPoints = 0;
    let overallCredits = 0;

    for (const sem in semesters) {
      const semResults = semesters[sem];
      const validRows = semResults.filter(
        r => !isNaN(parseFloat(r.credit)) && !isNaN(parseFloat(r.point))
      );

      const semPoints = validRows.reduce(
        (acc, row) => acc + parseFloat(row.credit) * parseFloat(row.point),
        0
      );
      const semCredits = validRows.reduce(
        (acc, row) => acc + parseFloat(row.credit),
        0
      );

      const semCGPA = semCredits === 0 ? null : (semPoints / semCredits).toFixed(2);
      semesterCGPAs[sem] = semCGPA;

      overallPoints += semPoints;
      overallCredits += semCredits;
    }

    const sumOfSemCGPAs = Object.values(semesterCGPAs)
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v))
      .reduce((a, b) => a + b, 0);

    const overallCGPA =
      maxSem === 0 ? null : (sumOfSemCGPAs / maxSem).toFixed(2);
    console.log(`🎉 Successfully calculated CGPA for ${studentName} : ${overallCGPA}`);
    return {
      semesterWiseCGPA: semesterCGPAs,
      overallCGPA,
      allSemesters: semesters,
    };
  } catch (err) {
    console.error(`❌ Scraper failed for ${studentName}:`, err.message);
    return { status: "error", message: err.message };
  } finally {
    // ✅ Clean up
    await page.close().catch(() => { });
    await context.close().catch(() => { });
  }
}

module.exports = fetchResult;
