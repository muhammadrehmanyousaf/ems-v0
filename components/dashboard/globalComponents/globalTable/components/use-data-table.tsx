import * as React from "react";
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  Table,
  PaginationState,
} from "@tanstack/react-table";
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { parseAsInteger, useQueryState } from "nuqs";

type UseDataTableOptions<TData extends object, TValue = unknown> = {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  totalItems: number;
};

export type PaginationStateTypes = {
  pageIndex: number;
  pageSize: number;
};

type NuqsSetter = (
  v: number | ((old: number) => number | null) | null,
  options?: any
) => Promise<URLSearchParams>;

type UseDataTableReturn<TData extends object> = {
  table: Table<TData>;
  rowSelection: Record<string, unknown>;
  setRowSelection: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  columnVisibility: VisibilityState;
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>;
  columnFilters: ColumnFiltersState;
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;
  sorting: SortingState;
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>;
  paginationState: PaginationStateTypes;
  currentPage: number;
  pageSizeValue: number;
  setCurrentPage: NuqsSetter;
  setPageSizeValue: NuqsSetter;
};

export function useDataTable<TData extends object, TValue = unknown>(
  opts: UseDataTableOptions<TData, TValue>
): UseDataTableReturn<TData> {
  const { data, columns, totalItems } = opts;

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const [currentPage, setCurrentPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ shallow: false, history: "push" })
  );
  const [pageSizeValue, setPageSizeValue] = useQueryState(
    "limit",
    parseAsInteger.withDefault(10).withOptions({ shallow: false, history: "push" })
  );

  const pageCount = Math.max(1, Math.ceil((totalItems ?? 0) / (pageSizeValue || 10)));

  const paginationState: PaginationStateTypes = {
    pageIndex: (currentPage || 1) - 1,
    pageSize: pageSizeValue || 10,
  };

  const handlePaginationChange = (
    next: PaginationState | ((old: PaginationState) => PaginationState)
  ) => {
    const val = typeof next === "function" ? next(paginationState) : next;
    setCurrentPage(val.pageIndex + 1);
    setPageSizeValue(val.pageSize);
  };

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      pagination: paginationState,
      columnFilters,
    },
    manualPagination: true, // server-side pagination
    onPaginationChange: handlePaginationChange,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // When page-size changes, snap to first page (avoid empty page)
  React.useEffect(() => {
    table.setPageIndex(0);
  }, [pageSizeValue]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    table,
    rowSelection,
    setRowSelection,
    columnVisibility,
    setColumnVisibility,
    columnFilters,
    setColumnFilters,
    sorting,
    setSorting,
    paginationState,
    currentPage: currentPage || 1,
    pageSizeValue: pageSizeValue || 10,
    setCurrentPage,
    setPageSizeValue,
  };
}
