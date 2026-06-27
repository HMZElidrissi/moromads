import { useState, useEffect, useRef, useMemo } from "react";
import { useFetcher, useNavigation } from "react-router";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableToolbar } from "~/components/data-table/data-table-toolbar";
import { submissionsColumns } from "~/components/data-table/submissions-columns";
import { useUrlDataTable } from "~/hooks/use-url-data-table";
import type { DataTableOption } from "~/types/data-table";
import type { Submission } from "~/lib/db.server";
import { Card } from "~/components/ui/card";
import { ApprovalForm } from "./approval-form";

export type SubmissionsTableProps = {
  pending: Submission[];
  approved: Submission[];
  rejected: Submission[];
};

export function SubmissionsTable({ pending, approved, rejected }: SubmissionsTableProps) {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  const rejectFetcher = useFetcher();
  const [approvingSub, setApprovingSub] = useState<Submission | null>(null);
  const prevNavState = useRef(navigation.state);

  useEffect(() => {
    if (prevNavState.current !== "idle" && navigation.state === "idle") {
      setApprovingSub(null);
    }
    prevNavState.current = navigation.state;
  }, [navigation.state]);

  const allSubs = useMemo(
    () => [...pending, ...approved, ...rejected],
    [pending, approved, rejected],
  );

  const cityOptions = useMemo<DataTableOption[]>(
    () => [...new Set(allSubs.map((s) => s.city))].sort().map((c) => ({ label: c, value: c })),
    [allSubs],
  );

  const columns = useMemo(
    () =>
      submissionsColumns({
        cityOptions,
        onApprove: (sub) => setApprovingSub(sub),
        onReject: (id) =>
          rejectFetcher.submit({ intent: "reject", id: String(id) }, { method: "post" }),
      }),
    [cityOptions, rejectFetcher],
  );

  const table = useUrlDataTable({
    data: allSubs,
    columns,
    getRowId: (row) => String(row.id),
    prefix: "x_",
    defaultSorting: [{ id: "submittedAt", desc: true }],
    defaultFilters: [{ id: "status", value: ["pending"] }],
    columnPinning: { right: ["actions"] },
  });

  return (
    <div className="flex w-full flex-col gap-2.5 overflow-auto">
      <DataTableToolbar table={table} />
      <DataTable pageSizeOptions={[5, 10, 20, 50]} table={table} />
      {approvingSub && (
        <Card className="mt-2 overflow-hidden p-0 gap-0">
          <div className="px-5 py-4 border-b border-border/70">
            <p className="text-sm font-semibold text-foreground">Approve: {approvingSub.name}</p>
          </div>
          <ApprovalForm sub={approvingSub} onClose={() => setApprovingSub(null)} busy={busy} />
        </Card>
      )}
    </div>
  );
}
