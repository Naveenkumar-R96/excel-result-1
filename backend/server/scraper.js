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
    if (await page.$("iframe") === null) {
      console.log(`❌ Login failed or no result for ${studentName}`);
      return null;
    }
    if (!frame) {
      console.log("❌ Could not get content from iframe");
      await browser.close();
      return null;
    }

    console.log("📄 Extracting rows...");
    
    // 🔍 DEBUG: First, let's see what's actually on the page
    const debugInfo = await frame.evaluate(() => {
      const tables = document.querySelectorAll("table");
      const targetTable = document.querySelector("table.tblBRDefault");
      
      return {
        totalTables: tables.length,
        hasTargetTable: !!targetTable,
        tableClasses: Array.from(tables).map(t => t.className),
        tableRowCounts: Array.from(tables).map(t => t.querySelectorAll("tr").length),
        // Get first few rows of data to see structure
        sampleData: targetTable ? Array.from(targetTable.querySelectorAll("tr")).slice(0, 5).map(row => {
          return Array.from(row.querySelectorAll("td, th")).map(cell => cell.innerText.trim());
        }) : null
      };
    });
    

    const allRows = await frame.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("table.tblBRDefault tr"));
      console.log(`Found ${rows.length} total rows`);
      
      return rows.slice(1).map((row, index) => {
        const cols = row.querySelectorAll("td");
        const rowData = {
          rowIndex: index,
          totalCols: cols.length,
          sem: cols[0]?.innerText.trim() || "",
          code: cols[1]?.innerText.trim() || "",
          subject: cols[2]?.innerText.trim() || "",
          credit: cols[3]?.innerText.trim() || "",
          grade: cols[4]?.innerText.trim() || "",
          point: cols[5]?.innerText.trim() || "",
          result: cols[6]?.innerText.trim() || "",
          // Debug: get all cell contents
          allCells: Array.from(cols).map(cell => cell.innerText.trim())
        };
        
        // Log first few rows for debugging
        if (index < 3) {
          console.log(`Row ${index}:`, rowData);
        }
        
        return rowData;
      });
    });

    console.log(`📊 Extracted ${allRows.length} data rows for ${studentName}`);
    

    // 🔍 Better semester parsing with debugging
    const availableSems = allRows
      .map((r, index) => {
        const semStr = r.sem;
        const semNum = parseInt(semStr);
        return semNum;
      })
      .filter(sem => !isNaN(sem)); // Filter out NaN values

    console.log(`📊 Available semesters for ${studentName}:`, availableSems);
    
    const maxSem = availableSems.length > 0 ? Math.max(...availableSems) : NaN;
    console.log(`📊 Max available semester: ${maxSem}, Expected: ${expectedSem}`);

    if (isNaN(maxSem)) {
      console.log(`⚠️  No valid semester data found for ${studentName}`);
      console.log(`📋 Sample rows:`, allRows.slice(0, 3));
      await browser.close();
      return null;
    }
    if (maxSem < expectedSem) {
      console.log(`📭 Semester ${expectedSem} not yet published for ${studentName}`);
      await browser.close();
      
      // ✅ Return a specific object to indicate "semester not published yet"
      return {
        status: 'not_published',
        message: `Semester ${expectedSem} not yet published`,
        maxAvailableSem: maxSem,
        expectedSem: expectedSem
      };
    }

    // ✅ Only include results up to expected semester
    let semesterRows = [];

    // check if the expected sem exists in the rows
    const hasExpected = allRows.some(r => parseInt(r.sem) === expectedSem);
    
    if (hasExpected) {
      // only then include all up to that sem
      semesterRows = allRows.filter(r => !isNaN(parseInt(r.sem)) && parseInt(r.sem) <= maxSem);
    }
    
    console.log(`✅ Found ${semesterRows.length} rows for semesters 1-${expectedSem}`);
    
    // Group by semester
    const semesters = {};
    semesterRows.forEach(r => {
      const sem = parseInt(r.sem);
      if (!isNaN(sem)) {
        if (!semesters[sem]) semesters[sem] = [];
        semesters[sem].push(r);
      }
    });

    console.log(`📚 Grouped into semesters:`, Object.keys(semesters).map(s => `Sem ${s}: ${semesters[s].length} subjects`));

    // Calculate CGPA per semester + overall
    const semesterCGPAs = {};
    let overallPoints = 0;
    let overallCredits = 0;

    for (const sem in semesters) {
      const semResults = semesters[sem];

      const validRows = semResults.filter(r =>
        !isNaN(parseFloat(r.credit)) &&
        !isNaN(parseFloat(r.point))
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
      
      console.log(`📊 Semester ${sem}: ${validRows.length} valid subjects, CGPA: ${semCGPA}`);
    }

    const overallCGPA = overallCredits === 0 ? null : (overallPoints / overallCredits).toFixed(2);
    console.log(`🎯 Overall CGPA for ${studentName}: ${overallCGPA}`);

    await browser.close();

    return {
      semesterWiseCGPA: semesterCGPAs,
      overallCGPA,
      allSemesters: semesters, // grouped results
    };
  } catch (err) {
    console.error(`❌ Scraper failed for ${studentName}:`, err.message);
    await browser.close();
    return {
      status: 'error',
      message: err.message
    };
  }
}

module.exports = fetchResult;