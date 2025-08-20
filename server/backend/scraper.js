const { chromium } = require("playwright");
const playwright = require("playwright");

async function fetchResult(registerNo, dob, expectedSem) {
  browser = await playwright.chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" // Windows path
  }); // <- simple
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("🌐 Navigating to homepage...");
    await page.goto("http://103.105.40.112", { timeout: 60000 });
    console.log("✅ Homepage loaded");

    console.log("🔐 Clicking Student Login...");
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
    
    const frame = await frameHandle.contentFrame(); // initialize AFTER frameHandle exists
    if (!frame) {
      console.log("❌ Could not get content from iframe");
      await browser.close();
      return null;
    }
    
    // Now frame is safe to use
    console.log(await frame.content()); 

 

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

    const subjectRows = allRows.filter(r =>
      r.subject && r.code && r.grade &&
      !isNaN(parseFloat(r.credit)) &&
      !isNaN(parseFloat(r.point))
    );

    const expectedResults = subjectRows.filter(r => parseInt(r.sem) === parseInt(expectedSem));

    if (expectedResults.length === 0) {
      console.log(`📭 Semester ${expectedSem} result not yet published.`);
      await browser.close();
      return null;
    }

    const totalPoints = expectedResults.reduce((acc, row) => acc + parseFloat(row.credit) * parseFloat(row.point), 0);
    const totalCredits = expectedResults.reduce((acc, row) => acc + parseFloat(row.credit), 0);
    const cgpa = totalCredits === 0 ? 0 : (totalPoints / totalCredits).toFixed(2);

    console.log(`🎓 CGPA for Semester ${expectedSem}: ${cgpa}`);

    await browser.close();
    return {
      cgpa,
      semester: expectedSem,
      subjects: expectedResults
    };

  } catch (err) {
    console.error("❌ Scraper failed:", err.message);
    await browser.close();
    return null;
  }
}

module.exports = fetchResult;
