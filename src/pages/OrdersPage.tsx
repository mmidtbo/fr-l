import { DataTable } from "@/components/demo-pages/order-data-table";
import { OrderDialog } from "@/components/order-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpinnerEmpty } from "@/components/ui/spinner-empty";
import { apiSafe } from "@/lib/api/axios";
import type { Order } from "@/lib/types";
import {
  ORDERS,
  STATUS_LABELS,
  STATUS_NEXT,
  fetchOrdersData,
} from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

export function OrdersPage() {
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [showNew, setShowNew] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [dateFilter, setDateFilter] = React.useState("all");
  const [statusUpdateOrder, setStatusUpdateOrder] =
    React.useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = React.useState(false);
  const [deleteOrder, setDeleteOrder] = React.useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = React.useState(false);
  const [selectedOrders, setSelectedOrders] = React.useState<Record<string, boolean>>({});
  const [bulkStatusTarget, setBulkStatusTarget] = React.useState<string | null>(null);
  const [bulkUpdating, setBulkUpdating] = React.useState(false);
  const [reOrder, setReOrder] = React.useState<Order | null>(null);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        setShowNew(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const queryClient = useQueryClient();

  const ordersResponse = useQuery({
    queryKey: ["orders_data", statusFilter, dateFilter, pagination.pageIndex],
    queryFn: async () => {
      const response = await fetchOrdersData(
        pagination.pageIndex + 1,
        pagination.pageSize,
        statusFilter,
        dateFilter,
      );
      let orders;
      if (response?.ordersData) {
        orders = response.ordersData;
      }
      const customers = response.customersData;
      const prices = response.pricesData;
      const order_metadata = response.order_metadata;
      const customer_metadata = response.customer_metadata;

      return {
        orders,
        customers,
        prices,
        order_metadata,
        customer_metadata,
      };
    },
  });

  const filteredOrders = React.useMemo(() => {
    const result = ordersResponse.data?.orders ?? [];
    if (!search) return result;
    const q = search.toLowerCase();
    return result.filter(
      (o) =>
        o.order_code.toLowerCase().includes(q) ||
        o.customers?.name?.toLowerCase().includes(q) ||
        o.customers?.phone?.includes(q),
    );
  }, [ordersResponse.data?.orders, search]);

  const reOrderInitialData = React.useMemo(
    () =>
      reOrder
        ? {
            customerId: reOrder.customers.id,
            servicePriceId: reOrder.service_prices.id,
            quantity: reOrder.quantity,
            isExpress: reOrder.is_express,
            conditionNotes: reOrder.condition_notes ?? "",
            notes: reOrder.notes ?? "",
          }
        : undefined,
    [reOrder],
  );

  if (ordersResponse.isPending) {
    return <SpinnerEmpty />;
  }

  if (ordersResponse.isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center lg:px-6">
        <p className="text-sm text-muted-foreground">
          Gagal memuat data pesanan.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => ordersResponse.refetch()}
        >
          Coba Lagi
        </Button>
      </div>
    );
  }

  function onUpdateStatus(order: Order) {
    const next = STATUS_NEXT[order.status];
    if (!next) return;
    setStatusUpdateOrder(order);
  }

  async function confirmUpdateStatus() {
    const order = statusUpdateOrder;
    if (!order) return;

    const next = STATUS_NEXT[order.status];
    if (!next) return;

    setUpdatingStatus(true);
    const res = await apiSafe.put(`${ORDERS}/${order.id}`, {
      status: next,
    });

    if (res.error) {
      toast.error(res.error);
    } else {
      queryClient.invalidateQueries({ queryKey: ["orders_data"] });
      toast.success(
        `Status pesanan ${order.order_code} berhasil diperbarui ke "${STATUS_LABELS[next] ?? next}".`,
      );
    }
    setUpdatingStatus(false);
    setStatusUpdateOrder(null);
  }

  async function confirmDeleteOrder() {
    const order = deleteOrder;
    if (!order) return;

    setDeletingOrder(true);
    const res = await apiSafe.delete(`${ORDERS}/${order.id}`);

    if (res.error) {
      toast.error(res.error);
    } else {
      queryClient.invalidateQueries({ queryKey: ["orders_data"] });
      toast.success(`Pesanan ${order.order_code} berhasil dihapus.`);
    }
    setDeletingOrder(false);
    setDeleteOrder(null);
  }

  function onOrderCreated() {
    queryClient.invalidateQueries({ queryKey: ["orders_data"] });
    toast.success("Pesanan baru berhasil dibuat.");
  }

  const selectedCount = Object.keys(selectedOrders).length;

  async function confirmBulkStatusUpdate() {
    const targetStatus = bulkStatusTarget;
    if (!targetStatus || !ordersResponse.data?.orders) return;

    setBulkUpdating(true);
    const selectedIds = Object.keys(selectedOrders);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      const res = await apiSafe.put(`${ORDERS}/${id}`, { status: targetStatus });
      if (res.error) failCount++;
      else successCount++;
    }

    if (successCount > 0) {
      queryClient.invalidateQueries({ queryKey: ["orders_data"] });
      toast.success(`${successCount} pesanan berhasil diupdate.`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} pesanan gagal diupdate.`);
    }

    setBulkUpdating(false);
    setBulkStatusTarget(null);
    setSelectedOrders({});
  }

  return (
    <div className="space-y-6">
      <AlertDialog
        open={!!statusUpdateOrder}
        onOpenChange={(open) => !open && setStatusUpdateOrder(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <RefreshCw className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle>Konfirmasi Update Status</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin mengubah status pesanan{" "}
              <strong>{statusUpdateOrder?.order_code}</strong> ke{" "}
              <strong>
                {statusUpdateOrder
                  ? STATUS_LABELS[STATUS_NEXT[statusUpdateOrder.status]!]
                  : ""}
              </strong>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updatingStatus}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              variant="default"
              onClick={confirmUpdateStatus}
              disabled={updatingStatus}
            >
              {updatingStatus ? "Menyimpan..." : "Ya, Update"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteOrder}
        onOpenChange={() => {
          if (!deletingOrder) setDeleteOrder(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Data pesanan <strong>{deleteOrder?.order_code}</strong> akan
              dihapus permanen. Lanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingOrder}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDeleteOrder}
              disabled={deletingOrder}
            >
              {deletingOrder ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex flex-col mx-4 lg:mx-6 gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pesanan</h1>
          <p className="text-muted-foreground">
            Kelola seluruh transaksi laundry
          </p>
        </div>
        <Button
          onClick={() => {
            setShowNew(true);
          }}
        >
          <Plus />
          Pesanan Baru
        </Button>
      </div>
      {/* Filters day */}
      <Card className="mx-4 lg:mx-6">
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Cari kode order atau nama pelanggan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter tanggal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Waktu</SelectItem>
                <SelectItem value="1">Hari Ini</SelectItem>
                <SelectItem value="7">7 Hari Terakhir</SelectItem>
                <SelectItem value="30">30 Hari Terakhir</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => ordersResponse.refetch()}
              title="Refresh"
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="mx-4 lg:mx-6 flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2">
          <span className="text-sm text-muted-foreground">
            {selectedCount} pesanan terpilih
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Select value={bulkStatusTarget ?? ""} onValueChange={setBulkStatusTarget}>
              <SelectTrigger className="w-44 h-8 text-sm">
                <SelectValue placeholder="Update Status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <AlertDialog
              open={!!bulkStatusTarget}
              onOpenChange={(open) => {
                if (!open && !bulkUpdating) setBulkStatusTarget(null);
              }}
            >
              <AlertDialogTrigger asChild>
                <Button size="sm" disabled={!bulkStatusTarget}>
                  <RefreshCw className="size-3.5" />
                  Simpan
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogMedia>
                    <RefreshCw className="size-5" />
                  </AlertDialogMedia>
                  <AlertDialogTitle>Konfirmasi Update Massal</AlertDialogTitle>
                  <AlertDialogDescription>
                    Update status {selectedCount} pesanan menjadi{" "}
                    "{bulkStatusTarget ? STATUS_LABELS[bulkStatusTarget as keyof typeof STATUS_LABELS] ?? bulkStatusTarget : ""}"?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={bulkUpdating}>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    variant="default"
                    onClick={confirmBulkStatusUpdate}
                    disabled={bulkUpdating}
                  >
                    {bulkUpdating ? "Menyimpan..." : "Ya, Update"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedOrders({})}
            >
              <X className="size-3.5" />
              Batal
            </Button>
          </div>
        </div>
      )}

      <OrderDialog
        open={showNew || !!reOrder}
        onOpenChange={(open) => {
          if (!open) { setShowNew(false); setReOrder(null); }
        }}
        onSuccess={onOrderCreated}
        customer={ordersResponse.data?.customers ?? []}
        price={ordersResponse.data?.prices ?? []}
        initialData={reOrderInitialData}
      />

      <DataTable
        data={filteredOrders}
        onUpdateStatus={onUpdateStatus}
        onDelete={setDeleteOrder}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        pagination={pagination}
        setPagination={setPagination}
        metadata={ordersResponse.data?.order_metadata}
        onPaymentSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ["orders_data"] })
        }
        selectedRowIds={selectedOrders}
        onSelectedRowIdsChange={setSelectedOrders}
        onReOrder={setReOrder}
      />
    </div>
  );
}
