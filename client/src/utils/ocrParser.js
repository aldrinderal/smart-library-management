/**
 * Intelligent regex and heuristic extractor for college Student ID Cards.
 * Optimized specifically for standard ID format:
 * - NAME
 * - COURSE
 * - REG.NO (or REG NO / REGISTER NO)
 * - YEAR (e.g. 2024-2028, I / II / III / IV, etc.)
 */
export const parseIdCardText = (rawText) => {
  if (!rawText) {
    return {
      name: '',
      course: '',
      department: '',
      registerNumber: '',
      year: '',
      startYear: '',
      endYear: '',
    };
  }

  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let name = '';
  let course = '';
  let registerNumber = '';
  let year = '';
  let startYear = '';
  let endYear = '';

  // 1. REG.NO extraction (e.g. "REG.NO: 721924104026", "REG.NO : ...", "REG. NO: ...", "REG NO: ...", "REGISTER NO: ...")
  const regNoMatch = rawText.match(
    /(?:REG\.?\s*NO(?:\.|:)?|REGISTER\s*(?:NO(?:\.|:)?|NUMBER:?)|ROLL\s*NO(?:\.|:)?|ID\s*NO(?:\.|:)?)\s*[:\-]?\s*([A-Za-z0-9]+)/i
  );

  if (regNoMatch && regNoMatch[1]) {
    registerNumber = regNoMatch[1].trim().toUpperCase();
  } else {
    // Look for typical Anna University / college 10-12 digit roll number
    const standaloneDigits = rawText.match(/\b(7\d{11}|\d{10,12})\b/);
    if (standaloneDigits) {
      registerNumber = standaloneDigits[1];
    }
  }

  // 2. NAME extraction (e.g. "NAME: Aldrin Deral", "NAME : ...", "STUDENT NAME: ...")
  const nameMatch = rawText.match(/(?:STUDENT\s*NAME|NAME)\s*[:\-]?\s*([A-Za-z\s\.\,\'\-]+)/i);
  if (nameMatch && nameMatch[1]) {
    // Take the matched line, strip out trailing keywords like COURSE, REG, etc. if merged
    let candidate = nameMatch[1].split(/\n|\r/)[0].trim();
    candidate = candidate.replace(/\b(COURSE|REG|REG\.NO|YEAR|DEPT)\b.*$/i, '').trim();
    // Clean leading/trailing punctuation
    name = candidate.replace(/^[:\-\s]+|[:\-\s]+$/g, '');
  }

  // 3. COURSE extraction (e.g. "COURSE: B.E. CSE", "COURSE : ...", "BRANCH: ...", "DEPARTMENT: ...")
  const courseMatch = rawText.match(
    /(?:COURSE|BRANCH|DEPARTMENT|DEPT)\s*[:\-]?\s*([A-Za-z0-9\s\.\&\/\-]+)/i
  );
  if (courseMatch && courseMatch[1]) {
    let candidate = courseMatch[1].split(/\n|\r/)[0].trim();
    candidate = candidate.replace(/\b(REG|REG\.NO|YEAR|NAME)\b.*$/i, '').trim();
    course = candidate.replace(/^[:\-\s]+|[:\-\s]+$/g, '');
  }

  // If course not found through label, check common known college course patterns
  if (!course) {
    const commonCourses = [
      'B.E. CSE',
      'B.E - CSE',
      'B.E. COMPUTER SCIENCE',
      'CSE',
      'B.Tech IT',
      'B.TECH - IT',
      'Information Technology',
      'B.Tech AI & DS',
      'AI & DS',
      'B.E. ECE',
      'ECE',
      'B.E. EEE',
      'EEE',
      'B.E. Mechanical',
      'Mechanical',
      'B.E. Civil',
      'Civil',
      'MBA',
      'MCA',
    ];
    for (const c of commonCourses) {
      if (new RegExp(`\\b${c.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(rawText)) {
        course = c;
        break;
      }
    }
  }

  // 4. YEAR extraction (e.g. "YEAR: 2024-2028", "YEAR: 2024–2028", "YEAR: IV", "YEAR: 1st Year", "BATCH: ...")
  const yearMatch = rawText.match(
    /(?:ACADEMIC\s*YEAR|YEAR|BATCH)\s*[:\-]?\s*([A-Za-z0-9\s\–\-\to\/]+)/i
  );
  if (yearMatch && yearMatch[1]) {
    let candidate = yearMatch[1].split(/\n|\r/)[0].trim();
    candidate = candidate.replace(/\b(NAME|COURSE|REG|REG\.NO)\b.*$/i, '').trim();
    year = candidate.replace(/^[:\-\s]+|[:\-\s]+$/g, '');
  }

  // Check if year contains standard 4-digit span like 2024-2028 or 2024 - 2028
  const spanMatch = (year || rawText).match(/\b(202\d)\s*[\–\-\to\/]\s*(202\d|203\d)\b/);
  if (spanMatch) {
    startYear = spanMatch[1];
    endYear = spanMatch[2];
    if (!year || !year.includes(spanMatch[1])) {
      year = `${spanMatch[1]}–${spanMatch[2]}`;
    }
  } else if (!year) {
    // Check roman numerals or ordinal years (I Year, II Year, III Year, IV Year)
    const romanYear = rawText.match(/\b(I|II|III|IV)\s*(?:YEAR)?\b/i);
    if (romanYear) {
      year = `${romanYear[1].toUpperCase()} Year`;
    }
  }

  // Fallback for Name if still empty: pick first non-empty line that looks like a person's name
  if (!name) {
    for (const line of lines) {
      if (
        line.length > 2 &&
        line.length < 35 &&
        /^[A-Za-z\s\.\,\'\-]+$/.test(line) &&
        !/college|university|institute|identity|student|card|library|course|reg|year|dept/i.test(line)
      ) {
        name = line.trim();
        break;
      }
    }
  }

  return {
    name,
    course,
    department: course,
    registerNumber,
    year,
    startYear,
    endYear,
  };
};
