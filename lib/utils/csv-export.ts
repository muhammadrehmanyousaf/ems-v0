import type { Table } from "@tanstack/react-table";
import { formatColumnId } from "@/lib/utils";
import { escapeCsv } from "@/lib/utils/csv-escape";

export function exportTableToCSV<TData>(
  table: Table<TData>,
  filename: string = "export"
) {
  const columns = table
    .getAllColumns()
    .filter(
      (col) =>
        col.getIsVisible() && col.id !== "select" && col.id !== "actions"
    );

  const headers = columns.map((col) => {
    const header = col.columnDef.header;
    if (typeof header === "string") return header;
    return formatColumnId(col.id);
  });

  // WWL-123 — escapeCsv also neutralises leading formula triggers, which the
  // inline escaping here used to let straight through into the vendor's Excel.
  /**
   * WWL-381 — every row on the reviews table carries a checkbox and the footer
   * counts "0 of 8 row(s) selected", and NOTHING consumed
   * `getSelectedRowModel()`: no bulk delete (a business cannot delete a review
   * written about it — WWL-356), no bulk reply, and no export-selected. A
   * control that changes a counter and nothing else is a promise the screen
   * cannot keep.
   *
   * Export is the action a selection was always for. When rows are ticked the
   * file is those rows; otherwise it stays the whole filtered set, so nothing
   * changes for anyone who never touches a checkbox.
   */
  const selected = table.getSelectedRowModel().rows;
  const source = selected.length > 0 ? selected : table.getFilteredRowModel().rows;
  const rows = source.map((row) => columns.map((col) => escapeCsv(row.getValue(col.id))));

  const csv = [headers.map(escapeCsv).join(","), ...rows.map((row) => row.join(","))].join(
    "\n"
  );

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}${selected.length > 0 ? "-selected" : ""}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
