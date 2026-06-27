import type { ColumnDef } from "@tanstack/react-table";
import { Building2, Ellipsis, FileText } from "lucide-react";

import type { Submission } from "~/lib/db.server";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { clientMultiSelectFilter, clientScalarFilter } from "~/lib/data-table-filters";
import type { DataTableOption } from "~/types/data-table";
import "~/types/data-table";

const STATUS_OPTIONS: DataTableOption[] = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const TYPE_OPTIONS: DataTableOption[] = [
  { label: "Café", value: "café" },
  { label: "Coworking", value: "coworking" },
];

function statusBadge(status: Submission["status"]) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
          Pending
        </Badge>
      );
    case "approved":
      return (
        <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50">
          Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">
          Rejected
        </Badge>
      );
  }
}

export function submissionsColumns({
  cityOptions,
  onApprove,
  onReject,
}: {
  cityOptions: DataTableOption[];
  onApprove: (sub: Submission) => void;
  onReject: (id: number) => void;
}): ColumnDef<Submission>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all on page"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          className="translate-y-0.5"
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          className="translate-y-0.5"
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-foreground">{row.original.name}</p>
          {row.original.notes && (
            <p className="text-xs text-muted-foreground/70 italic truncate max-w-48">
              "{row.original.notes}"
            </p>
          )}
        </div>
      ),
      meta: {
        label: "Name",
        placeholder: "Search submissions…",
        variant: "text",
        icon: FileText,
      },
      enableColumnFilter: true,
      enableSorting: true,
      enableHiding: true,
      filterFn: clientScalarFilter,
    },
    {
      id: "city",
      accessorKey: "city",
      header: ({ column }) => <DataTableColumnHeader column={column} title="City" />,
      cell: ({ row }) => row.original.city,
      meta: {
        label: "City",
        variant: "multiSelect",
        icon: Building2,
        options: cityOptions,
      },
      filterFn: clientMultiSelectFilter,
      enableColumnFilter: true,
      enableSorting: true,
      enableHiding: true,
    },
    {
      id: "type",
      accessorKey: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => (
        <Badge variant={row.original.type === "coworking" ? "default" : "secondary"}>
          {row.original.type}
        </Badge>
      ),
      meta: {
        label: "Type",
        variant: "multiSelect",
        options: TYPE_OPTIONS,
      },
      filterFn: clientMultiSelectFilter,
      enableColumnFilter: true,
      enableSorting: true,
      enableHiding: true,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => statusBadge(row.original.status),
      meta: {
        label: "Status",
        variant: "multiSelect",
        options: STATUS_OPTIONS,
      },
      filterFn: clientMultiSelectFilter,
      enableColumnFilter: true,
      enableSorting: true,
      enableHiding: true,
    },
    {
      id: "submittedAt",
      accessorKey: "submittedAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Submitted" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">{row.original.submittedAt}</span>
      ),
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: false,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const sub = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Open row menu"
                className="flex size-8 p-0 data-[state=open]:bg-muted"
                variant="ghost"
              >
                <Ellipsis aria-hidden className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {sub.status === "pending" && (
                <>
                  <DropdownMenuGroup>
                    <DropdownMenuItem onSelect={() => onApprove(sub)}>Approve</DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onSelect={() => onReject(sub.id)}>
                      Reject
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => {
                    if (sub.mapsUrl) window.open(sub.mapsUrl, "_blank");
                  }}
                  disabled={!sub.mapsUrl}
                >
                  Maps link
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableHiding: false,
      enableSorting: false,
      size: 40,
    },
  ];
}
