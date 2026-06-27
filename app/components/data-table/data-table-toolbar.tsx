"use client";

import type { Column, Table } from "@tanstack/react-table";
import { useCallback, useMemo, type ComponentProps } from "react";
import { X } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

import { DataTableAdvancedToolbar } from "./data-table-advanced-toolbar";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";

interface DataTableToolbarProps<TData> extends ComponentProps<
  typeof DataTableAdvancedToolbar<TData>
> {
  table: Table<TData>;
}

/** Column meta filters + reset, inside the advanced toolbar wrapper. */
export function DataTableToolbar<TData>({
  table,
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const columns = useMemo(
    () => table.getAllColumns().filter((column) => column.getCanFilter()),
    [table],
  );

  const onReset = useCallback(() => {
    table.resetColumnFilters();
  }, [table]);

  return (
    <DataTableAdvancedToolbar className={className} table={table} {...props}>
      {columns.map((column) => (
        <DataTableToolbarFilter column={column} key={column.id} />
      ))}
      {isFiltered ? (
        <Button
          aria-label="Reset filters"
          className="border-dashed"
          onClick={onReset}
          size="sm"
          variant="outline"
        >
          <X />
          Reset
        </Button>
      ) : null}
      {children}
    </DataTableAdvancedToolbar>
  );
}

interface DataTableToolbarFilterProps<TData> {
  column: Column<TData>;
}

function DataTableToolbarFilter<TData>({ column }: DataTableToolbarFilterProps<TData>) {
  const columnMeta = column.columnDef.meta;

  if (!columnMeta?.variant) return null;

  switch (columnMeta.variant) {
    case "text":
      return (
        <Input
          className="h-8 w-40 lg:w-56"
          onChange={(event) => column.setFilterValue(event.target.value)}
          placeholder={columnMeta.placeholder ?? columnMeta.label}
          value={(column.getFilterValue() as string) ?? ""}
        />
      );

    case "number":
      return (
        <div className="relative">
          <Input
            className={cn("h-8 w-[120px]", columnMeta.unit && "pr-8")}
            inputMode="numeric"
            onChange={(event) => column.setFilterValue(event.target.value)}
            placeholder={columnMeta.placeholder ?? columnMeta.label}
            type="number"
            value={(column.getFilterValue() as string) ?? ""}
          />
          {columnMeta.unit ? (
            <span className="absolute top-0 right-0 bottom-0 flex items-center rounded-r-md bg-accent px-2 text-muted-foreground text-sm">
              {columnMeta.unit}
            </span>
          ) : null}
        </div>
      );

    case "select":
    case "multiSelect":
      return (
        <DataTableFacetedFilter
          column={column}
          multiple={columnMeta.variant === "multiSelect"}
          options={columnMeta.options ?? []}
          title={columnMeta.label ?? column.id}
        />
      );

    default:
      return null;
  }
}
