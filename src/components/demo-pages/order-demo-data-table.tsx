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
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Separator } from "@/components/ui/separator";
import { OrderReceipt } from "@/components/OrderReceipt";
import type { Order, PaymentStatus } from "@/lib/types";
import {
  STATUS_LABELS,
  STATUS_NEXT,
  PAYMENT_LABELS,
  formatRupiah,
  formatDate,
} from "@/lib/types";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  Clock,
  Columns,
  Receipt,
  Flame,
  MoreVertical,
  AlertTriangle,
  Loader2,
  Trash2,
  Pencil,
  Eye,
} from "lucide-react";

interface DataTableProps {
  data: Order[];
  onUpdateStatus: (order: Order) => Promise<void>;
  onUpdatePayment: (
    orderId: string,
    paymentStatus: PaymentStatus,
  ) => Promise<void>;
  onDelete: (order: Order) => Promise<void>;
}

function DraggableRow({ row }: { row: Row<Order> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() ? "selected" : undefined}
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

export function DataTable({
  data,
  onUpdateStatus,
  onUpdatePayment,
  onDelete,
}: DataTableProps) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Dialog state
  const [receiptOrder, setReceiptOrder] = React.useState<Order | null>(null);
  const [detailOrder, setDetailOrder] = React.useState<Order | null>(null);
  const [editOrder, setEditOrder] = React.useState<Order | null>(null);
  const [deleteOrder, setDeleteOrder] = React.useState<Order | null>(null);
  const [confirmStatusOrder, setConfirmStatusOrder] =
    React.useState<Order | null>(null);

  // Action loading state
  const [actionLoading, setActionLoading] = React.useState(false);

  // Edit form state
  const [editPayment, setEditPayment] =
    React.useState<PaymentStatus>("pending");

  function openEdit(order: Order) {
    setEditPayment(order.payment_status);
    setEditOrder(order);
  }

  async function handleStatusAdvance() {
    if (!confirmStatusOrder) return;
    setActionLoading(true);
    try {
      await onUpdateStatus(confirmStatusOrder);
    } finally {
      setActionLoading(false);
      setConfirmStatusOrder(null);
    }
  }

  async function handleSavePayment() {
    if (!editOrder) return;
    setActionLoading(true);
    try {
      await onUpdatePayment(editOrder.id, editPayment);
    } finally {
      setActionLoading(false);
      setEditOrder(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteOrder) return;
    setActionLoading(true);
    try {
      await onDelete(deleteOrder);
    } finally {
      setActionLoading(false);
      setDeleteOrder(null);
    }
  }

  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) ?? [],
    [data],
  );

  const columns: ColumnDef<Order>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
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
        <div className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {row.original.order_code}
        </div>
      ),
    },
    {
      accessorKey: "customer_name",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
            {row.original.customers?.name}
          </div>
          <div className="text-xs text-zinc-500">
            {row.original.customers?.phone}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "service_name",
      header: "Layanan",
      cell: ({ row }) => (
        <Badge variant="outline" className="gap-1">
          {row.original.service_prices?.name}
          {row.original.is_express && (
            <Flame className="size-3 text-orange-500 fill-orange-500" />
          )}
        </Badge>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => (
        <span className="tabular-nums text-sm">
          {row.original.quantity} {row.original.service_prices?.unit_label}
        </span>
      ),
    },
    {
      accessorKey: "total_price",
      header: "Total",
      cell: ({ row }) => (
        <span className="font-medium tabular-nums text-sm">
          {formatRupiah(row.original.total_price)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status;
        const isDone = s === "picked_up";
        return (
          <Badge
            variant="outline"
            className={`gap-1 ${row.original.is_overdue && !isDone ? "border-red-300 dark:border-red-700 text-red-600 dark:text-red-400" : ""}`}
          >
            {isDone ? (
              <CheckCircle2 className="size-3 text-emerald-500 fill-emerald-500" />
            ) : row.original.is_overdue ? (
              <AlertTriangle className="size-3 text-red-500" />
            ) : (
              <Clock className="size-3" />
            )}
            {STATUS_LABELS[s]}
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
          <Badge variant="outline" className="gap-1">
            {ps === "lunas" ? (
              <CheckCircle2 className="size-3 text-emerald-500 fill-emerald-500" />
            ) : (
              <Clock className="size-3" />
            )}
            {PAYMENT_LABELS[ps]}
          </Badge>
        );
      },
    },
    {
      accessorKey: "estimated_done",
      header: "Estimasi Selesai",
      cell: ({ row }) => (
        <span className="text-xs text-zinc-500">
          {formatDate(row.original.estimated_done)}
        </span>
      ),
    },
    {
      id: "aksi",
      header: "Aksi",
      cell: ({ row }) => {
        const order = row.original;
        const nextStatus = STATUS_NEXT[order.status];
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setReceiptOrder(order)}
              title="Lihat Nota"
            >
              <Receipt className="size-3.5" />
            </Button>
            {nextStatus && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs h-7 whitespace-nowrap"
                onClick={() => setConfirmStatusOrder(order)}
              >
                {STATUS_LABELS[nextStatus]}
                <ChevronRight className="size-3" />
              </Button>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="text-zinc-500">
                <MoreVertical className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setDetailOrder(order)}>
                <Eye className="size-3.5 mr-2" />
                Detail
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEdit(order)}>
                <Pencil className="size-3.5 mr-2" />
                Edit Pembayaran
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteOrder(order)}
              >
                <Trash2 className="size-3.5 mr-2" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
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
      <div className="space-y-3">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-1">
          <div className="text-xs text-zinc-500">
            {table.getFilteredSelectedRowModel().rows.length} dari{" "}
            {table.getFilteredRowModel().rows.length} baris dipilih
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Columns className="size-3.5" />
                Kolom
                <ChevronDown className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {table
                .getAllColumns()
                .filter(
                  (col) =>
                    typeof col.accessorFn !== "undefined" && col.getCanHide(),
                )
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="capitalize"
                    checked={col.getIsVisible()}
                    onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  >
                    {col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
                {table.getHeaderGroups().map((hg) => (
                  <TableRow
                    key={hg.id}
                    className="hover:bg-transparent border-zinc-200 dark:border-zinc-700"
                  >
                    {hg.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
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
                      className="h-24 text-center text-zinc-500"
                    >
                      Tidak ada data.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Label htmlFor="rows-per-page" className="text-xs text-zinc-500">
              Baris per halaman
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger className="h-7 w-16 text-xs" id="rows-per-page">
                <SelectValue
                  placeholder={`${table.getState().pagination.pageSize}`}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 50].map((s) => (
                  <SelectItem key={s} value={`${s}`}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-zinc-500 mr-2">
              Hal. {table.getState().pagination.pageIndex + 1} /{" "}
              {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── DIALOG: Nota / Receipt ────────────────────────── */}
      <Dialog
        open={!!receiptOrder}
        onOpenChange={(open) => {
          if (!open) setReceiptOrder(null);
        }}
      >
        <DialogContent
          className="max-w-sm max-h-[90vh] overflow-y-auto"
          onClose={() => setReceiptOrder(null)}
        >
          <DialogHeader>
            <DialogTitle>Nota Digital</DialogTitle>
            <DialogDescription>
              Detail transaksi untuk dicetak atau disimpan.
            </DialogDescription>
          </DialogHeader>
          {receiptOrder && <OrderReceipt order={receiptOrder} />}
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: Detail Order ─────────────────────────── */}
      <Dialog
        open={!!detailOrder}
        onOpenChange={(open) => {
          if (!open) setDetailOrder(null);
        }}
      >
        <DialogContent
          className="max-w-md max-h-[90vh] overflow-y-auto"
          onClose={() => setDetailOrder(null)}
        >
          <DialogHeader>
            <DialogTitle>Detail Pesanan</DialogTitle>
            {detailOrder && (
              <DialogDescription>{detailOrder.order_code}</DialogDescription>
            )}
          </DialogHeader>
          {detailOrder && <OrderDetail order={detailOrder} />}
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: Edit Pembayaran ───────────────────────── */}
      <Dialog
        open={!!editOrder}
        onOpenChange={(open) => {
          if (!open) setEditOrder(null);
        }}
      >
        <DialogContent className="max-w-sm" onClose={() => setEditOrder(null)}>
          <DialogHeader>
            <DialogTitle>Edit Status Pembayaran</DialogTitle>
            {editOrder && (
              <DialogDescription>
                Ubah status pembayaran untuk order{" "}
                <span className="font-mono font-semibold">
                  {editOrder.order_code}
                </span>
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="payment-status-select">Status Pembayaran</Label>
            <Select
              value={editPayment}
              onValueChange={(v) => setEditPayment(v as PaymentStatus)}
            >
              <SelectTrigger id="payment-status-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="lunas">Lunas</SelectItem>
                <SelectItem value="cicilan">Cicilan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOrder(null)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleSavePayment}
              disabled={actionLoading}
              className="gap-2"
            >
              {actionLoading && <Loader2 className="size-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: Konfirmasi Lanjut Status ────────────── */}
      <Dialog
        open={!!confirmStatusOrder}
        onOpenChange={(open) => {
          if (!open) setConfirmStatusOrder(null);
        }}
      >
        <DialogContent
          className="max-w-sm"
          onClose={() => setConfirmStatusOrder(null)}
        >
          <DialogHeader>
            <DialogTitle>Lanjutkan Status?</DialogTitle>
            {confirmStatusOrder && (
              <DialogDescription>
                Order{" "}
                <span className="font-mono font-semibold">
                  {confirmStatusOrder.order_code}
                </span>{" "}
                akan diubah ke status{" "}
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {STATUS_LABELS[STATUS_NEXT[confirmStatusOrder.status]!]}
                </span>
                .
              </DialogDescription>
            )}
          </DialogHeader>
          {confirmStatusOrder?.status === "ready" && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              Order akan ditandai sebagai sudah diambil pelanggan.
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmStatusOrder(null)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleStatusAdvance}
              disabled={actionLoading}
              className="gap-2"
            >
              {actionLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ChevronRight className="size-4" />
              )}
              {actionLoading ? "Menyimpan..." : "Ya, Lanjutkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: Konfirmasi Hapus ─────────────────────── */}
      <Dialog
        open={!!deleteOrder}
        onOpenChange={(open) => {
          if (!open) setDeleteOrder(null);
        }}
      >
        <DialogContent
          className="max-w-sm"
          onClose={() => setDeleteOrder(null)}
        >
          <DialogHeader>
            <DialogTitle>Hapus Pesanan?</DialogTitle>
            {deleteOrder && (
              <DialogDescription>
                Order{" "}
                <span className="font-mono font-semibold">
                  {deleteOrder.order_code}
                </span>{" "}
                atas nama{" "}
                <span className="font-semibold">
                  {deleteOrder.customers?.name}
                </span>{" "}
                akan dihapus secara permanen. Tindakan ini tidak dapat
                dibatalkan.
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            Data yang dihapus tidak dapat dipulihkan.
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOrder(null)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={actionLoading}
              className="gap-2"
            >
              {actionLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {actionLoading ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Order Detail View ────────────────────────────────────────
function OrderDetail({ order }: { order: Order }) {
  return (
    <div className="space-y-4 text-sm">
      {/* Status row */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className="gap-1">
          <Clock className="size-3" />
          {STATUS_LABELS[order.status]}
        </Badge>
        {order.is_express && (
          <Badge
            variant="outline"
            className="gap-1 text-orange-600 border-orange-300"
          >
            <Flame className="size-3 fill-orange-500 text-orange-500" />
            Express
          </Badge>
        )}
        {order.is_overdue && order.status !== "picked_up" && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="size-3" />
            Terlambat
          </Badge>
        )}
      </div>

      <Separator />

      {/* Customer */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Pelanggan
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          <span className="text-zinc-500">Nama</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {order.customers?.name}
          </span>
          <span className="text-zinc-500">No. HP</span>
          <span className="text-zinc-900 dark:text-zinc-100">
            {order.customers?.phone}
          </span>
          {order.customers?.address && (
            <>
              <span className="text-zinc-500">Alamat</span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {order.customers.address}
              </span>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* Order details */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Detail Pesanan
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          <span className="text-zinc-500">Layanan</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {order.service_prices?.name}
          </span>
          <span className="text-zinc-500">Jumlah</span>
          <span className="text-zinc-900 dark:text-zinc-100">
            {order.quantity} {order.service_prices?.unit_label}
          </span>
          <span className="text-zinc-500">Harga Dasar</span>
          <span className="text-zinc-900 dark:text-zinc-100">
            {formatRupiah(order.base_price)}
          </span>
          {order.express_surcharge > 0 && (
            <>
              <span className="text-zinc-500">Surcharge</span>
              <span className="text-orange-600">
                +{formatRupiah(order.express_surcharge)}
              </span>
            </>
          )}
          <span className="text-zinc-500 font-medium">Total</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {formatRupiah(order.total_price)}
          </span>
        </div>
      </div>

      <Separator />

      {/* Timeline */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Waktu
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          <span className="text-zinc-500">Masuk</span>
          <span className="text-zinc-900 dark:text-zinc-100">
            {formatDate(order.created_at)}
          </span>
          <span className="text-zinc-500">Est. Selesai</span>
          <span
            className={`${order.is_overdue && order.status !== "picked_up" ? "text-red-600 dark:text-red-400 font-medium" : "text-zinc-900 dark:text-zinc-100"}`}
          >
            {formatDate(order.estimated_done)}
          </span>
          {order.picked_up_at && (
            <>
              <span className="text-zinc-500">Diambil</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {formatDate(order.picked_up_at)}
              </span>
            </>
          )}
        </div>
      </div>

      {order.condition_notes && (
        <>
          <Separator />
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Catatan Kondisi
            </p>
            <p className="text-zinc-700 dark:text-zinc-300 text-xs leading-relaxed bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
              {order.condition_notes}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
