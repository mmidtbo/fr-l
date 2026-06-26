import { DataTable } from "@/components/demo-pages/order-data-table";
import { OrderDialog } from "@/components/order-dialog";
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
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api/axios";
import type { Order } from "@/lib/types";
import { ORDERS, STATUS_NEXT, fetchOrdersData } from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Search, X } from "lucide-react";
import * as React from "react";

export function OrdersPage() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";

  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [showNew, setShowNew] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [dateFilter, setDateFilter] = React.useState("all");

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

  console.log(ordersResponse.data?.orders);

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

  if (ordersResponse.isPending) {
    return <SpinnerEmpty />;
  }

  async function onUpdateStatus(order: Order) {
    const next = STATUS_NEXT[order.status];

    if (!next) return;

    try {
      await api.put(`${ORDERS}/${order.id}`, {
        status: next,
      });

      queryClient.invalidateQueries({ queryKey: ["orders_data"] });
    } catch (err) {
      console.error(err);
    }
  }

  function onOrderCreated() {
    queryClient.invalidateQueries({ queryKey: ["orders_data"] });
  }

  return (
    <div className="space-y-6">
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

      <OrderDialog
        open={showNew}
        onOpenChange={setShowNew}
        onSuccess={onOrderCreated}
        customer={ordersResponse.data?.customers ?? []}
        price={ordersResponse.data?.prices ?? []}
      />

      <DataTable
        data={filteredOrders}
        onUpdateStatus={onUpdateStatus}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        pagination={pagination}
        setPagination={setPagination}
        metadata={ordersResponse.data?.order_metadata}
        userId={user?.id}
        onPaymentSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ["orders_data"] })
        }
      />
    </div>
  );
}
