/**
 * CSV writer for exports opened in Excel or Sheets. Values that start with
 * = + - @ or a tab/carriage return are prefixed with an apostrophe so a
 * customer-supplied name can never run as a spreadsheet formula (CSV
 * injection). Everything is quoted.
 */
export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
