import type { Table } from "@tanstack/react-table";
import { formatColumnId } from "@/lib/utils";

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

  const rows = table.getFilteredRowModel().rows.map((row) =>
    columns.map((col) => {
      const value = row.getValue(col.id);
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
  );

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
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
