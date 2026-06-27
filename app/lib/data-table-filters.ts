import type { ColumnFiltersState, Row } from "@tanstack/react-table";

import { dataTableConfig } from "~/config/data-table";
import type { DataTableFilterVariant } from "~/types/data-table";
import type { ExtendedColumnFilter, FilterOperator } from "~/types/data-table";

export function getFilterOperators(variant: DataTableFilterVariant) {
  const operatorMap: Record<DataTableFilterVariant, { label: string; value: FilterOperator }[]> = {
    text: [...dataTableConfig.textOperators],
    number: [...dataTableConfig.numericOperators],
    range: [...dataTableConfig.numericOperators],
    date: [...dataTableConfig.dateOperators],
    dateRange: [...dataTableConfig.dateOperators],
    boolean: [...dataTableConfig.booleanOperators],
    select: [...dataTableConfig.selectOperators],
    multiSelect: [...dataTableConfig.multiSelectOperators],
  };

  return operatorMap[variant] ?? [...dataTableConfig.textOperators];
}

export function getDefaultFilterOperator(variant: DataTableFilterVariant): FilterOperator {
  const operators = getFilterOperators(variant);
  return operators[0]?.value ?? "iLike";
}

/** Maps advanced filter rows to TanStack `columnFilters` (client-side; AND between columns; last row wins per column id). */
export function extendedFiltersToColumnFilters<TData>(
  filters: ExtendedColumnFilter<TData>[],
): ColumnFiltersState {
  const byId = new Map<string, { id: string; value: unknown }>();
  for (const f of filters) {
    const id = String(f.id);
    byId.set(id, { id, value: toTanStackFilterValue(f) });
  }
  return [...byId.values()];
}

function toTanStackFilterValue<TData>(f: ExtendedColumnFilter<TData>): unknown {
  switch (f.variant) {
    case "text":
    case "number":
      if (f.operator === "isEmpty") {
        return { __client: "scalar" as const, variant: f.variant, op: "isEmpty" as const };
      }
      if (f.operator === "isNotEmpty") {
        return { __client: "scalar" as const, variant: f.variant, op: "isNotEmpty" as const };
      }
      return {
        __client: "scalar" as const,
        variant: f.variant,
        op: f.operator,
        value: String(f.value ?? ""),
      };
    case "multiSelect":
      return {
        __client: "multi" as const,
        op: f.operator,
        value: Array.isArray(f.value) ? f.value : [],
      };
    case "select":
      return {
        __client: "select" as const,
        op: f.operator,
        value: typeof f.value === "string" ? f.value : "",
      };
    case "boolean":
      return { __client: "bool" as const, op: f.operator, value: String(f.value) };
    default:
      return f.value;
  }
}

export type ScalarFilterPayload = {
  __client: "scalar";
  variant: "text" | "number";
  op: FilterOperator;
  value?: string;
};

export type MultiFilterPayload = {
  __client: "multi";
  op: FilterOperator;
  value: string[];
};

export function clientScalarFilter<T>(row: Row<T>, columnId: string, filterValue: unknown) {
  if (filterValue == null || filterValue === "") return true;
  const cell = String(row.getValue(columnId) ?? "");

  if (typeof filterValue === "object" && filterValue && "__client" in filterValue) {
    const p = filterValue as
      | ScalarFilterPayload
      | { __client: "scalar"; op: "isEmpty" | "isNotEmpty" };
    if (p.__client === "scalar") {
      if (p.op === "isEmpty") return cell === "";
      if (p.op === "isNotEmpty") return cell !== "";
      const payload = p as ScalarFilterPayload;
      const v = payload.value ?? "";
      const vl = v.toLowerCase();
      const cl = cell.toLowerCase();
      if (payload.variant === "number") {
        const numCell = Number(cell);
        const numVal = Number(v);
        if (payload.op === "eq") return !Number.isNaN(numCell) && numCell === numVal;
        if (payload.op === "ne") return Number.isNaN(numCell) || numCell !== numVal;
        if (payload.op === "lt")
          return !Number.isNaN(numCell) && !Number.isNaN(numVal) && numCell < numVal;
        if (payload.op === "lte")
          return !Number.isNaN(numCell) && !Number.isNaN(numVal) && numCell <= numVal;
        if (payload.op === "gt")
          return !Number.isNaN(numCell) && !Number.isNaN(numVal) && numCell > numVal;
        if (payload.op === "gte")
          return !Number.isNaN(numCell) && !Number.isNaN(numVal) && numCell >= numVal;
        return true;
      }
      if (payload.op === "eq") return cl === vl;
      if (payload.op === "ne") return cl !== vl;
      if (payload.op === "iLike") return cl.includes(vl);
      if (payload.op === "notILike") return !cl.includes(vl);
      return true;
    }
  }

  if (typeof filterValue === "string") {
    return cell.toLowerCase().includes(filterValue.toLowerCase());
  }
  return true;
}

export function clientMultiSelectFilter<T>(row: Row<T>, columnId: string, filterValue: unknown) {
  const cell = String(row.getValue(columnId) ?? "");

  if (filterValue && typeof filterValue === "object" && "__client" in filterValue) {
    const p = filterValue as MultiFilterPayload;
    const arr = p.value ?? [];
    if (p.op === "isEmpty") return cell === "";
    if (p.op === "isNotEmpty") return cell !== "";
    if (p.op === "inArray") return arr.length === 0 || arr.includes(cell);
    if (p.op === "notInArray") return arr.length === 0 || !arr.includes(cell);
    return true;
  }

  if (Array.isArray(filterValue)) {
    return filterValue.length === 0 || filterValue.includes(cell);
  }
  return true;
}
