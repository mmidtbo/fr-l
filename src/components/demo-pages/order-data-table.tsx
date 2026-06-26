import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchOrdersData,
  formatDate,
  formatRupiah,
  STATUS_LABELS,
  STATUS_NEXT,
} from "@/lib/types";
import {
  IconCash,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconClock,
  IconDotsVertical,
  IconFlameFilled,
  IconLayoutColumns,
  IconReceipt,
} from "@tabler/icons-react";
import { OrderReceipt } from "../OrderReceipt";

export const schema = z.object({
  id: z.string(),
  order_code: z.string(),
  customers: z.object({
    id: z.string(),
    name: z.string(),
    phone: z.string(),
  }),
  service_prices: z.object({
    id: z.string(),
    name: z.string(),
    pricing_type: z.enum(["per_kg", "per_pcs", "fixed", "range"]),
    price_min: z.string(),
    price_max: z.string().nullable(),
    unit_label: z.string().default("pcs"),
  }),
  quantity: z.number(),
  is_express: z.boolean().nullable(),
  total_price: z.number(),
  status: z.enum([
    "received",
    "proses",
    "cuci",
    "jemur",
    "setrika",
    "ready",
    "picked_up",
  ]),
  payment_status: z.enum(["pending", "lunas", "cicilan"]),
  estimated_done: z.string().nullable(),
  base_price: z.number(),
  express_surcharge: z.number(),
  created_at: z.string(),
  condition_notes: z.string(),
  notes: z.string(),
  picked_up_at: z.string().nullable(),
});

export type Order = z.infer<typeof schema>;

const statusLabel: Record<string, string> = {
  received: "Baru Masuk",
  proses: "Diproses",
  cuci: "Dicuci",
  jemur: "Dijemur",
  setrika: "Disetrika",
  ready: "Siap Diambil",
  picked_up: "Selesai",
};

const paymentLabel: Record<string, string> = {
  lunas: "Lunas",
  belum: "Belum",
  cicilan: "cicilan",
};

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

type DataTableProps = {
  data: Order[];
  onUpdateStatus: (order: Order) => Promise<void>;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  metadata: any;
  userId?: string;
  onPaymentSuccess?: () => void;
};

export function DataTable({
  data,
  onUpdateStatus,
  statusFilter,
  onStatusFilterChange,
  pagination,
  setPagination,
  metadata,
  userId,
  onPaymentSuccess,
}: DataTableProps) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [showReceipt, setShowReceipt] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<Order>();
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );

  console.log(metadata);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  React.useEffect(() => {
    getOrders();
  }, [pagination.pageIndex, pagination.pageSize]);

  async function getOrders() {
    const response = await fetchOrdersData(
      pagination.pageIndex + 1,
      pagination.pageSize,
    );
    return response.ordersData;
  }

  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data],
  );

  const columns: ColumnDef<z.infer<typeof schema>>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "order_code",
      header: "Kode Order",
      cell: ({ row }) => (
        <div className="font-mono font-semibold">{row.original.order_code}</div>
      ),
    },
    {
      accessorKey: "customer_name",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.customers.name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.customers.phone}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "service_name",
      header: "Layanan",
      cell: ({ row }) => (
        <div className="w-32">
          <Badge variant="outline" className="px-1.5 text-muted-foreground">
            {row.original.service_prices.name}

            {row.original.is_express ? (
              <IconFlameFilled className="fill-green-500 dark:fill-green-400" />
            ) : (
              ""
            )}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => (
        <div className="tabular-nums">
          {row.original.quantity} {row.original.service_prices.unit_label}
        </div>
      ),
    },
    {
      accessorKey: "total_price",
      header: "Total",
      cell: ({ row }) => (
        <div className="font-medium tabular-nums">
          {formatRupiah(row.original.total_price)}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status;
        // console.log(s)
        return (
          <Badge variant="outline" className="px-1.5 text-muted-foreground">
            {s === "picked_up" ? (
              <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
            ) : (
              <IconClock className="mr-1 size-3" />
            )}
            {statusLabel[s] ?? s}
          </Badge>
        );
      },
    },
    {
      accessorKey: "payment_status",
      header: "Pembayaran",
      cell: ({ row }) => {
        const ps = row.original.payment_status;
        return (
          <Badge variant="outline" className="px-1.5 text-muted-foreground">
            {ps === "lunas" ? (
              <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
            ) : (
              <IconClock className="mr-1 size-3" />
            )}
            {paymentLabel[ps] ?? ps}
          </Badge>
        );
      },
    },
    {
      accessorKey: "estimated_done",
      header: "Estimasi Selesai",
      cell: ({ row }) => {
        const s = row.original.status;
        const date =
          s === "picked_up"
            ? row.original.picked_up_at
            : row.original.estimated_done;
        return (
          <div className="text-sm text-muted-foreground">
            {formatDate(date)}
            {s === "picked_up" && (
              <div className="text-[11px] text-muted-foreground/60">
                Diambil
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "nota",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center justify-start gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setSelectedOrder({
                  id: row.original.id,
                  order_code: row.original.order_code,
                  customers: row.original.customers,
                  service_prices: row.original.service_prices,
                  quantity: row.original.quantity,
                  is_express: row.original.is_express,
                  total_price: row.original.total_price,
                  status: row.original.status,
                  payment_status: row.original.payment_status,
                  estimated_done: row.original.estimated_done,
                  base_price: row.original.base_price,
                  express_surcharge: row.original.express_surcharge,
                  created_at: row.original.created_at,
                  condition_notes: row.original.condition_notes,
                  notes: row.original.notes,
                  picked_up_at: row.original.picked_up_at,
                });
                setShowReceipt(true);
              }}
              title="Lihat Nota"
            >
              <IconReceipt className="size-3.5" />
            </Button>
            {STATUS_NEXT[row.original.status] && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs h-7"
                onClick={(): Promise<void> => onUpdateStatus(row.original)}
              >
                {STATUS_LABELS[STATUS_NEXT[row.original.status]!]}
                <IconChevronRight className="size-3" />
              </Button>
            )}
            {!STATUS_NEXT[row.original.status] &&
              row.original.payment_status !== "lunas" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs h-7"
                  onClick={() => {
                    setSelectedOrder({ ...row.original });
                    setShowReceipt(true);
                  }}
                >
                  <IconCash className="size-3" />
                  Bayar
                </Button>
              )}
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      cell: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem>Detail</DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Hapus</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    pageCount: Math.ceil((metadata?.total ?? 0) / pagination.pageSize),
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <>
      <Tabs
        value={statusFilter}
        onValueChange={onStatusFilterChange}
        className="w-full flex-col justify-start gap-6"
      >
        <div className="flex items-center justify-between px-4 lg:px-6">
          <Label htmlFor="view-selector" className="sr-only">
            View
          </Label>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger
              className="flex w-fit @4xl/main:hidden"
              size="sm"
              id="view-selector"
            >
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="received">Baru Masuk</SelectItem>
              <SelectItem value="proses">Diproses</SelectItem>
              <SelectItem value="cuci">Dicuci</SelectItem>
              <SelectItem value="jemur">Dijemur</SelectItem>
              <SelectItem value="setrika">Disetrika</SelectItem>
              <SelectItem value="ready">Siap Diambil</SelectItem>
              <SelectItem value="picked_up">Selesai</SelectItem>
            </SelectContent>
          </Select>
          <TabsList className="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger value="all">
              Semua <Badge variant="secondary">3</Badge>
            </TabsTrigger>
            <TabsTrigger value="received">
              Baru Masuk <Badge variant="secondary">2</Badge>
            </TabsTrigger>
            <TabsTrigger value="proses">Diproses</TabsTrigger>
            <TabsTrigger value="cuci">Dicuci</TabsTrigger>
            <TabsTrigger value="jemur">Dijemur</TabsTrigger>
            <TabsTrigger value="setrika">Disetrika</TabsTrigger>
            <TabsTrigger value="ready">Siap Diambil</TabsTrigger>
            <TabsTrigger value="picked_up">Selesai</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconLayoutColumns />
                  <span className="hidden lg:inline">Customize Columns</span>
                  <span className="lg:hidden">Columns</span>
                  <IconChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== "undefined" &&
                      column.getCanHide(),
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <TabsContent
          value={statusFilter}
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <div className="overflow-hidden rounded-lg border">
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              sensors={sensors}
              id={sortableId}
            >
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id} colSpan={header.colSpan}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                  {table.getRowModel().rows?.length ? (
                    <SortableContext
                      items={dataIds}
                      strategy={verticalListSortingStrategy}
                    >
                      {table.getRowModel().rows.map((row) => (
                        <DraggableRow key={row.id} row={row} />
                      ))}
                    </SortableContext>
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>
          <div className="flex items-center justify-between px-4">
            <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="rows-per-page" className="text-sm font-medium">
                  Rows per page
                </Label>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                    <SelectValue
                      placeholder={table.getState().pagination.pageSize}
                    />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-fit items-center justify-center text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </div>
              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to first page</span>
                  <IconChevronsLeft />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to previous page</span>
                  <IconChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to next page</span>
                  <IconChevronRight />
                </Button>
                <Button
                  variant="outline"
                  className="hidden size-8 lg:flex"
                  size="icon"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to last page</span>
                  <IconChevronsRight />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-sm max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle></DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <OrderReceipt
              order={selectedOrder}
              userId={userId}
              onPaymentSuccess={() => {
                setShowReceipt(false);
                onPaymentSuccess?.();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
