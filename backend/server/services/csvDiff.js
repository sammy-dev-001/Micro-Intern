const fs = require('fs');
const { parse } = require('csv-parse/sync');

/**
 * Compares an input CSV and output CSV for data cleaning verification.
 * Returns { passed: boolean, report: object }
 */
async function compareCSVs(inputFilePath, outputFilePath) {
  if (!fs.existsSync(inputFilePath)) {
    return {
      passed: false,
      report: { error: `Input source file not found at ${inputFilePath}` }
    };
  }

  if (!fs.existsSync(outputFilePath)) {
    return {
      passed: false,
      report: { error: `Deliverable output file not found at ${outputFilePath}` }
    };
  }

  const inputContent = fs.readFileSync(inputFilePath, 'utf8');
  const outputContent = fs.readFileSync(outputFilePath, 'utf8');

  let inputRecords, outputRecords;

  try {
    inputRecords = parse(inputContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  } catch (err) {
    return {
      passed: false,
      report: { error: `Failed to parse input CSV: ${err.message}` }
    };
  }

  try {
    outputRecords = parse(outputContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  } catch (err) {
    return {
      passed: false,
      report: { error: `Failed to parse output CSV: ${err.message}` }
    };
  }

  const inputRowCount = inputRecords.length;
  const outputRowCount = outputRecords.length;

  const inputHeaders = inputRecords.length > 0 ? Object.keys(inputRecords[0]) : [];
  const outputHeaders = outputRecords.length > 0 ? Object.keys(outputRecords[0]) : [];

  // Check headers
  const missingHeaders = inputHeaders.filter(h => !outputHeaders.includes(h));
  const addedHeaders = outputHeaders.filter(h => !inputHeaders.includes(h));

  // Check duplicates in input vs output (ignore id column if present for content deduplication)
  const countDuplicates = (records) => {
    const seen = new Set();
    let dupes = 0;
    for (const row of records) {
      const filtered = {};
      for (const [k, v] of Object.entries(row)) {
        if (k.toLowerCase() !== 'id' && k.toLowerCase() !== '_id') {
          filtered[k] = String(v).trim().toLowerCase();
        }
      }
      const key = Object.keys(filtered).length > 0 ? JSON.stringify(filtered) : JSON.stringify(row);
      if (seen.has(key)) {
        dupes++;
      } else {
        seen.add(key);
      }
    }
    return dupes;
  };

  const inputDuplicates = countDuplicates(inputRecords);
  const outputDuplicates = countDuplicates(outputRecords);

  // Email and Phone validation checks
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

  let totalEmailsChecked = 0;
  let validEmailsCount = 0;
  let totalPhonesChecked = 0;
  let validPhonesCount = 0;

  for (const row of outputRecords) {
    for (const [col, val] of Object.entries(row)) {
      const colLower = col.toLowerCase();
      const strVal = String(val).trim();
      if (!strVal) continue;

      if (colLower.includes('email')) {
        totalEmailsChecked++;
        if (emailRegex.test(strVal)) validEmailsCount++;
      } else if (colLower.includes('phone') || colLower.includes('mobile') || colLower.includes('tel')) {
        totalPhonesChecked++;
        if (phoneRegex.test(strVal.replace(/\s+/g, ''))) validPhonesCount++;
      }
    }
  }

  const emailConformance = totalEmailsChecked > 0 ? Math.round((validEmailsCount / totalEmailsChecked) * 100) : null;
  const phoneConformance = totalPhonesChecked > 0 ? Math.round((validPhonesCount / totalPhonesChecked) * 100) : null;

  // Determination:
  // - Output must have > 0 rows (unless input was 0)
  // - Output duplicates should be 0 (or significantly reduced from input)
  // - Missing essential headers should be 0
  let passed = true;
  const issues = [];

  if (outputRowCount === 0 && inputRowCount > 0) {
    passed = false;
    issues.push('Cleaned file contains no records.');
  }

  if (missingHeaders.length > 0) {
    // Missing headers might be intentional if columns were dropped, but note it
    if (outputHeaders.length === 0) {
      passed = false;
      issues.push('Cleaned file is missing all headers.');
    }
  }

  if (outputDuplicates > 0 && outputDuplicates >= inputDuplicates && inputDuplicates > 0) {
    passed = false;
    issues.push(`Duplicate records were not cleaned (${outputDuplicates} duplicates remain).`);
  }

  const report = {
    summary: passed ? 'Automated check passed' : 'Automated check flagged potential issues',
    input_row_count: inputRowCount,
    output_row_count: outputRowCount,
    duplicates_removed: Math.max(0, inputDuplicates - outputDuplicates),
    remaining_duplicates: outputDuplicates,
    headers: {
      input: inputHeaders,
      output: outputHeaders,
      missing: missingHeaders,
      added: addedHeaders
    },
    formatting_conformance: {
      emails: emailConformance !== null ? `${emailConformance}% valid (${validEmailsCount}/${totalEmailsChecked})` : 'N/A',
      phones: phoneConformance !== null ? `${phoneConformance}% valid (${validPhonesCount}/${totalPhonesChecked})` : 'N/A'
    },
    issues
  };

  return { passed, report };
}

module.exports = {
  compareCSVs
};
