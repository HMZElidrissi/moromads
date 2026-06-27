import type { RowData } from "@tanstack/react-table";
import type * as React from "react";

import type { dataTableConfig } from "~/config/data-table";

export type FilterOperator = (typeof dataTableConfig.operators)[number];
export type JoinOperator = (typeof dataTableConfig.joinOperators)[number];

export type DataTableFilterVariant =
  | "text"
  | "number"
  | "range"
  | "date"
  | "dateRange"
  | "boolean"
  | "select"
  | "multiSelect";

export interface ExtendedColumnFilter<_TData = unknown> {
  id: string;
  value: string | string[];
  variant: DataTableFilterVariant;
  operator: FilterOperator;
  filterId: string;
}

export interface DataTableOption {
  label: string;
  value: string;
  count?: number;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string;
    placeholder?: string;
    variant?: DataTableFilterVariant;
    options?: DataTableOption[];
    range?: [number, number];
    unit?: string;
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }
}
