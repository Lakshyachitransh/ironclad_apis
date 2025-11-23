// src/utils/csv-parser.ts
import { parse } from 'csv-parse/sync';

export interface ParsedRow {
  email: string;
  password?: string;
  displayName?: string;
  roles?: string; // raw cell
}

export function parseCsvBuffer(buf: Buffer, options?: { skip_empty_lines?: boolean }) {
  const text = buf.toString('utf8');
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    ...options,
  }) as ParsedRow[];
  return records;
}
