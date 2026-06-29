import { useMemo } from "react";
import { useFetcher } from "react-router";
import { AlertCircle } from "lucide-react";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableToolbar } from "~/components/data-table/data-table-toolbar";
import { spotsColumns } from "~/components/data-table/spots-columns";
import { useUrlDataTable } from "~/hooks/use-url-data-table";
import type { DataTableOption } from "~/types/data-table";
import type { Place } from "~/components/place-directory";
import { Card } from "~/components/ui/card";
import { SpotEditForm } from "./spot-edit-form";

export type SpotsTableProps = { spots: Place[] };

export function SpotsTable({ spots }: SpotsTableProps) {
  const deleteFetcher = useFetcher();
  const draftFetcher = useFetcher();

  const cityOptions = useMemo<DataTableOption[]>(
    () => [...new Set(spots.map((s) => s.city))].sort().map((c) => ({ label: c, value: c })),
    [spots],
  );

  const columns = useMemo(
    () =>
      spotsColumns({
        cityOptions,
        onDelete: (slug) =>
          deleteFetcher.submit({ intent: "delete-spot", slug }, { method: "post" }),
        onToggleDraft: (slug, isDraft) =>
          draftFetcher.submit(
            { intent: "toggle-draft", slug, is_draft: isDraft ? "1" : "0" },
            { method: "post" },
          ),
      }),
    [cityOptions, deleteFetcher, draftFetcher],
  );

  const table = useUrlDataTable({
    data: spots,
    columns,
    getRowId: (row) => row.slug,
    prefix: "s_",
    defaultSorting: [{ id: "rating", desc: true }],
    columnPinning: { right: ["actions"] },
  });

  if (spots.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <AlertCircle className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No spots yet. Add one from the "Add Spot" tab.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2.5 overflow-auto">
      <DataTableToolbar table={table} />
      <DataTable
        pageSizeOptions={[5, 10, 20, 50]}
        table={table}
        renderSubComponent={({ row }) => (
          <SpotEditForm spot={row.original} onClose={() => row.toggleExpanded(false)} />
        )}
      />
    </div>
  );
}
