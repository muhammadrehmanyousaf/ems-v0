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
  const rows = table
    .getFilteredRowModel()
    .rows.map((row) => columns.map((col) => escapeCsv(row.getValue(col.id))));

  const csv = [headers.map(escapeCsv).join(","), ...rows.map((row) => row.join(","))].join(
    "\n"
  );

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
