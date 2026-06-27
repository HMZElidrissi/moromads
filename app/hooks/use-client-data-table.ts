"use client";

import {
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnPinningState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableState,
  type VisibilityState,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";

interface UseClientDataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  getRowId?: (originalRow: TData, index: number) => string;
  initialState?: Partial<
    Omit<
      TableState,
      | "columnFilters"
      | "pagination"
      | "rowSelection"
      | "sorting"
      | "columnVisibility"
      | "columnPinning"
    > & {
      columnFilters?: ColumnFiltersState;
      pagination?: PaginationState;
      rowSelection?: RowSelectionState;
      sorting?: SortingState;
      columnVisibility?: VisibilityState;
      columnPinning?: ColumnPinningState;
    }
  >;
}

/** Client-only TanStack table (standard row models; no URL sync). */
export function useClientDataTable<TData>({
  data,
  columns,
  getRowId,
  initialState,
}: UseClientDataTableProps<TData>) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    initialState?.rowSelection ?? {},
  );
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    initialState?.columnVisibility ?? {},
  );
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    initialState?.columnFilters ?? [],
  );
  const [sorting, setSorting] = React.useState<SortingState>(initialState?.sorting ?? []);
  const [pagination, setPagination] = React.useState<PaginationState>(
    initialState?.pagination ?? { pageIndex: 0, pageSize: 10 },
  );
  const [columnPinning] = React.useState<ColumnPinningState>(
    initialState?.columnPinning ?? { left: [], right: [] },
  );

  return useReactTable({
    data,
    columns,
    initialState,
    defaultColumn: {
      enableColumnFilter: false,
    },
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
      columnPinning,
    },
    enableRowSelection: true,
    getRowId,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
  });
}
