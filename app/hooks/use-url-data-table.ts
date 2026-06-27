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
  type VisibilityState,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";
import { useSearchParams } from "react-router";

interface UseUrlDataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  getRowId?: (originalRow: TData, index: number) => string;
  /** Prefix for URL params — avoids conflicts when multiple tables share the page. */
  prefix?: string;
  defaultSorting?: SortingState;
  defaultFilters?: ColumnFiltersState;
  defaultPageSize?: number;
  columnPinning?: ColumnPinningState;
}

function encodeFilters(filters: ColumnFiltersState, prefix: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of filters) {
    const val = f.value;
    if (Array.isArray(val) && val.length > 0) {
      // m_ prefix → always decoded as string[]
      out[`${prefix}m_${f.id}`] = (val as string[]).join(",");
    } else if (typeof val === "string" && val.length > 0) {
      // f_ prefix → always decoded as string
      out[`${prefix}f_${f.id}`] = val;
    }
  }
  return out;
}

function decodeFilters(params: URLSearchParams, prefix: string): ColumnFiltersState {
  const filters: ColumnFiltersState = [];
  for (const [key, raw] of params.entries()) {
    if (key.startsWith(`${prefix}m_`)) {
      const id = key.slice(`${prefix}m_`.length);
      filters.push({ id, value: raw.split(",").filter(Boolean) });
    } else if (key.startsWith(`${prefix}f_`)) {
      const id = key.slice(`${prefix}f_`.length);
      filters.push({ id, value: raw });
    }
  }
  return filters;
}

function encodeSorting(sorting: SortingState, prefix: string): Record<string, string> {
  if (sorting.length === 0) return {};
  const s = sorting[0];
  return { [`${prefix}sort`]: `${s.id}:${s.desc ? "desc" : "asc"}` };
}

function decodeSorting(params: URLSearchParams, prefix: string): SortingState {
  const raw = params.get(`${prefix}sort`);
  if (!raw) return [];
  const [id, dir] = raw.split(":");
  if (!id) return [];
  return [{ id, desc: dir === "desc" }];
}

/** TanStack table whose column filters and sorting are persisted in the URL. */
export function useUrlDataTable<TData>({
  data,
  columns,
  getRowId,
  prefix = "",
  defaultSorting = [],
  defaultFilters = [],
  defaultPageSize = 10,
  columnPinning: initialColumnPinning = {},
}: UseUrlDataTableProps<TData>) {
  const [searchParams, setSearchParams] = useSearchParams();

  const columnFilters = React.useMemo(
    () => decodeFilters(searchParams, prefix),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.toString(), prefix],
  );

  const sorting = React.useMemo(
    () => {
      const s = decodeSorting(searchParams, prefix);
      return s.length > 0 ? s : defaultSorting;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.toString(), prefix],
  );

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });
  const [columnPinning] = React.useState<ColumnPinningState>(initialColumnPinning);

  function setColumnFilters(
    updater: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState),
  ) {
    const next = typeof updater === "function" ? updater(columnFilters) : updater;
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        // clear old filter params for this prefix
        for (const key of [...p.keys()]) {
          if (key.startsWith(`${prefix}f_`) || key.startsWith(`${prefix}m_`)) p.delete(key);
        }
        for (const [k, v] of Object.entries(encodeFilters(next, prefix))) {
          p.set(k, v);
        }
        return p;
      },
      { replace: true },
    );
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }

  function setSorting(updater: SortingState | ((prev: SortingState) => SortingState)) {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.delete(`${prefix}sort`);
        for (const [k, v] of Object.entries(encodeSorting(next, prefix))) {
          p.set(k, v);
        }
        return p;
      },
      { replace: true },
    );
  }

  // Seed default filters into URL on first render if nothing is set yet
  React.useEffect(() => {
    if (defaultFilters.length === 0) return;
    const existing = decodeFilters(searchParams, prefix);
    if (existing.length > 0) return;
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(encodeFilters(defaultFilters, prefix))) {
          p.set(k, v);
        }
        return p;
      },
      { replace: true },
    );
    // only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useReactTable({
    data,
    columns,
    defaultColumn: { enableColumnFilter: false },
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
