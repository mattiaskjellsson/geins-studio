/**
 * Lightweight RFC 4180 CSV parser.
 * Handles quoted fields (including fields with commas, newlines, and escaped quotes).
 * Returns an array of objects keyed by the header row, plus any validation errors.
 */
export function parseCsv<T extends Record<string, string> = Record<string, string>>(
  raw: string,
): { headers: string[]; rows: T[]; errors: string[] } {
  const errors: string[] = [];

  if (!raw || !raw.trim()) {
    return { headers: [], rows: [], errors: ['empty_file'] };
  }

  const lines = splitCsvLines(raw);
  if (lines.length === 0) {
    return { headers: [], rows: [], errors: ['empty_file'] };
  }

  const headerLine = lines[0];
  if (!headerLine) {
    return { headers: [], rows: [], errors: ['no_header'] };
  }

  const delimiter = detectDelimiter(headerLine);
  const headers = parseCsvLine(headerLine, delimiter);

  if (headers.length <= 1) {
    errors.push('single_column');
  }

  if (lines.length < 2) {
    errors.push('no_data_rows');
  }

  // If structural errors found, return early
  if (errors.length > 0) {
    return { headers, rows: [], errors };
  }

  const rows: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const values = parseCsvLine(line, delimiter);
    if (values.length === 0 || (values.length === 1 && values[0] === '')) {
      continue; // skip empty lines
    }
    const row = {} as Record<string, string>;
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j];
      if (key) {
        row[key] = (values[j] ?? '').trim();
      }
    }
    rows.push(row as T);
  }

  return { headers, rows, errors };
}

function splitCsvLines(raw: string): string[] {
  const lines: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
      current += char;
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && raw[i + 1] === '\n') {
        i++; // skip \r\n pair
      }
      if (current.length > 0) {
        lines.push(current);
      }
      current = '';
    } else {
      current += char;
    }
  }
  if (current.length > 0) {
    lines.push(current);
  }
  return lines;
}

/**
 * Detect the delimiter used in a CSV header line.
 * Checks for semicolons, tabs, and pipes before defaulting to comma.
 */
function detectDelimiter(headerLine: string): string {
  // Count candidate delimiters outside quoted sections
  const candidates = [';', '\t', '|'];
  for (const d of candidates) {
    let count = 0;
    let inQuotes = false;
    for (const char of headerLine) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === d && !inQuotes) count++;
    }
    if (count > 0) return d;
  }
  return ',';
}

function parseCsvLine(line: string, delimiter = ','): string[] {
  const fields: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (insideQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          insideQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === delimiter) {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  fields.push(current);
  return fields;
}
