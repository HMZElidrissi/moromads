import type { ColumnDef } from "@tanstack/react-table";
import { Building2, Ellipsis, MapPin, Star, Wifi } from "lucide-react";
import { Link } from "react-router";

import type { Place } from "~/components/place-directory";
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

const TYPE_OPTIONS: DataTableOption[] = [
  { label: "Café", value: "café" },
  { label: "Coworking", value: "coworking" },
];

export function spotsColumns({
  cityOptions,
  onDelete,
}: {
  cityOptions: DataTableOption[];
  onDelete: (slug: string) => void;
}): ColumnDef<Place>[] {
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
          <Link
            to={`/spots/${row.original.slug}`}
            target="_blank"
            className="font-medium text-foreground hover:text-primary hover:underline transition-colors"
          >
            {row.original.name}
          </Link>
          <p className="text-xs text-muted-foreground">/spots/{row.original.slug}</p>
        </div>
      ),
      meta: {
        label: "Name",
        placeholder: "Search spots…",
        variant: "text",
        icon: MapPin,
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
      id: "wifiMbps",
      accessorKey: "wifiMbps",
      header: ({ column }) => <DataTableColumnHeader column={column} title="WiFi" />,
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Wifi className="size-3" aria-hidden />
          {row.original.wifiMbps} Mbps
        </span>
      ),
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: false,
    },
    {
      id: "rating",
      accessorKey: "rating",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rating" />,
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Star className="size-3" aria-hidden />
          {row.original.rating.toFixed(1)}
        </span>
      ),
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: false,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
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
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={() => window.open(`/spots/${row.original.slug}`, "_blank")}
              >
                View
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => row.toggleExpanded()}>
                {row.getIsExpanded() ? "Close edit" : "Edit"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  if (window.confirm(`Delete "${row.original.name}"? This cannot be undone.`)) {
                    onDelete(row.original.slug);
                  }
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableHiding: false,
      enableSorting: false,
      size: 40,
    },
  ];
}
