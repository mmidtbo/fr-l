import * as React from "react";
import {
  Plus,
  Search,
  Receipt,
  ChevronRight,
  Weight,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { OrderReceipt } from "@/components/OrderReceipt";
import type { Order, Customer, ServicePrice, PaymentStatus } from "@/lib/types";
import {
  CUSTOMERS,
  ORDERS,
  SERVICE,
  STATUS_LABELS,
  STATUS_NEXT,
  PAYMENT_LABELS,
  formatRupiah,
} from "@/lib/types";
import api from "@/lib/api/axios";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "received", label: "Diterima" },
  { value: "proses", label: "Diproses" },
  { value: "cuci", label: "Dicuci" },
  { value: "jemur", label: "Dijemur" },
  { value: "setrika", label: "Disetrika" },
  { value: "ready", label: "Siap Diambil" },
  { value: "picked_up", label: "Sudah Diambil" },
];

export function OrdersPage() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";

  const [orders, setOrders] = React.useState<Order[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [prices, setPrices] = React.useState<ServicePrice[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [dateFilter, setDateFilter] = React.useState("all");

  const [showNew, setShowNew] = React.useState(false);
  const [showReceipt, setShowReceipt] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // New order form
  const [custMode, setCustMode] = React.useState<"existing" | "new">(
    "existing",
  );
  const [selectedCustId, setSelectedCustId] = React.useState("");
  const [newCustName, setNewCustName] = React.useState("");
  const [newCustPhone, setNewCustPhone] = React.useState("");
  const [newCustAddress, setNewCustAddress] = React.useState("");
  const [selectedServicePriceId, setSelectedServicePriceId] =
    React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [isExpress, setIsExpress] = React.useState(false);
  const [paymentStatus, setPaymentStatus] =
    React.useState<PaymentStatus>("pending");
  const [conditionNotes, setConditionNotes] = React.useState("");
  const [formError, setFormError] = React.useState("");

  React.useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [ordersRes, customersRes, servicesRes] = await Promise.all([
        api.get(ORDERS),
        api.get(CUSTOMERS),
        api.get(SERVICE),
      ]);
      const ordersData: Order[] = ordersRes.data ?? [];
      const customersData: Customer[] = customersRes.data ?? [];
      const servicesData: ServicePrice[] = servicesRes.data ?? [];

      const enriched: Order[] = ordersData.map((o) => ({
        ...o,
        quantity: Number(o.quantity) || 0,
        base_price: Number(o.base_price) || 0,
        express_surcharge: Number(o.express_surcharge) || 0,
        total_price: Number(o.total_price) || 0,
        is_express: Boolean(o.is_express),
        is_overdue: Boolean(o.is_overdue),
        needs_weight_label: Boolean(o.needs_weight_label),
        customer: customersData.find((c) => c.id === o.customer_id),
        service_price: servicesData.find((s) => s.id === o.service_price_id),
      }));
      setOrders(enriched);
      setCustomers(customersData);
      setPrices(servicesData.filter((s) => s.is_active));
    } catch {
      // silent
    }
    setLoading(false);
  }

  const selectedService = React.useMemo(
    () => prices.find((p) => p.id === selectedServicePriceId),
    [prices, selectedServicePriceId],
  );

  const qty = parseFloat(quantity) || 0;

  async function handleSubmitOrder() {
    setFormError("");
    if (custMode === "existing" && !selectedCustId) {
      setFormError("Pilih pelanggan terlebih dahulu.");
      return;
    }
    if (custMode === "new" && !newCustName.trim()) {
      setFormError("Nama pelanggan tidak boleh kosong.");
      return;
    }
    if (custMode === "new" && !newCustPhone.trim()) {
      setFormError("Nomor HP tidak boleh kosong.");
      return;
    }
    if (!selectedServicePriceId) {
      setFormError("Pilih layanan terlebih dahulu.");
      return;
    }
    if (!quantity || qty <= 0) {
      setFormError("Jumlah/berat tidak boleh kosong.");
      return;
    }

    setSubmitting(true);
    try {
      let custId = selectedCustId;
      if (custMode === "new") {
        const res = await api.post(CUSTOMERS, {
          name: newCustName.trim(),
          phone: newCustPhone.trim(),
          address: newCustAddress.trim(),
        });
        custId = (res as any).data?.id ?? (res as any).id;
      }

      await api.post(ORDERS, {
        customer_id: custId,
        service_price_id: selectedServicePriceId,
        quantity: qty,
        is_express: isExpress ? 1 : 0,
        condition_notes: conditionNotes,
      });

      setShowNew(false);
      resetForm();
      await fetchAll();
    } catch (err: any) {
      setFormError(err.message || "Gagal menyimpan pesanan.");
    }
    setSubmitting(false);
  }

  async function handleUpdateStatus(order: Order) {
    const next = STATUS_NEXT[order.status];
    if (!next) return;
    try {
      await api.put(`${ORDERS}/${order.id}`, { status: next });
      await fetchAll();
    } catch {
      // silent
    }
  }

  function resetForm() {
    setCustMode("existing");
    setSelectedCustId("");
    setNewCustName("");
    setNewCustPhone("");
    setNewCustAddress("");
    setSelectedServicePriceId("");
    setQuantity("");
    setIsExpress(false);
    setPaymentStatus("pending");
    setConditionNotes("");
    setFormError("");
  }

  const filteredOrders = React.useMemo(() => {
    let result = orders;
    if (statusFilter !== "all")
      result = result.filter((o) => o.status === statusFilter);
    if (dateFilter !== "all") {
      const now = new Date();
      const cutoff = new Date(now);
      if (dateFilter === "today") cutoff.setHours(0, 0, 0, 0);
      else if (dateFilter === "week") cutoff.setDate(cutoff.getDate() - 7);
      else if (dateFilter === "month") cutoff.setDate(cutoff.getDate() - 30);
      result = result.filter((o) => new Date(o.created_at) >= cutoff);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.order_code.toLowerCase().includes(q) ||
          o.customer?.name?.toLowerCase().includes(q) ||
          o.customer?.phone?.includes(q),
      );
    }
    return result;
  }, [orders, statusFilter, dateFilter, search]);

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    });
    return counts;
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pesanan</h1>
          <p className="text-muted-foreground">
            Kelola seluruh transaksi laundry
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowNew(true);
          }}
          className="gap-2 shrink-0"
        >
          <Plus className="size-4" />
          Pesanan Baru
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
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
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="week">7 Hari Terakhir</SelectItem>
                <SelectItem value="month">30 Hari Terakhir</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchAll}
              title="Refresh"
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="flex-wrap h-auto gap-1 bg-muted p-1">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              {tab.label}
              {statusCounts[tab.value] !== undefined && (
                <Badge
                  variant="secondary"
                  className="text-xs px-1.5 py-0 h-4 min-w-4"
                >
                  {statusCounts[tab.value]}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="size-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">
                Tidak ada pesanan ditemukan
              </p>
              <p className="text-sm text-muted-foreground">
                Coba ubah filter atau tambah pesanan baru
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Order</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Layanan</TableHead>
                    <TableHead>Jumlah</TableHead>
                    {isOwner && (
                      <TableHead className="text-center">Total</TableHead>
                    )}
                    <TableHead>Status</TableHead>
                    {isOwner && (
                      <TableHead className="text-center">Bayar</TableHead>
                    )}
                    <TableHead>Tanggal Masuk</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className={
                        order.is_overdue && order.status !== "picked_up"
                          ? "bg-red-50/50 dark:bg-red-950/10"
                          : ""
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-1.5 justify-center">
                          <span className="font-mono text-sm font-semibold">
                            {order.order_code}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {order.customer?.name ?? "-"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.customer?.phone ?? "-"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {order.service_price?.name ?? "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.quantity} {order.service_price?.unit_label ?? ""}
                      </TableCell>
                      {isOwner && (
                        <TableCell className="text-center font-medium text-sm">
                          {formatRupiah(order.total_price)}
                        </TableCell>
                      )}
                      <TableCell>
                        <StatusBadge
                          status={order.status}
                          isOverdue={order.is_overdue}
                        />
                      </TableCell>
                      {isOwner && (
                        <TableCell className="text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              order.payment_status === "lunas"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : order.payment_status === "cicilan"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {PAYMENT_LABELS[order.payment_status]}
                          </span>
                        </TableCell>
                      )}
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "2-digit",
                          },
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowReceipt(true);
                            }}
                            title="Lihat Nota"
                          >
                            <Receipt className="size-3.5" />
                          </Button>
                          {STATUS_NEXT[order.status] && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-xs h-7"
                              onClick={() => handleUpdateStatus(order)}
                            >
                              {STATUS_LABELS[STATUS_NEXT[order.status]!]}
                              <ChevronRight className="size-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Order Dialog */}
      <Dialog
        open={showNew}
        onOpenChange={(open) => {
          if (!open) resetForm();
          setShowNew(open);
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pesanan Baru</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Customer Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold">Data Pelanggan</Label>
                <div className="flex gap-1">
                  <Button
                    variant={custMode === "existing" ? "default" : "outline"}
                    size="xs"
                    onClick={() => setCustMode("existing")}
                  >
                    Pilih
                  </Button>
                  <Button
                    variant={custMode === "new" ? "default" : "outline"}
                    size="xs"
                    onClick={() => setCustMode("new")}
                  >
                    + Baru
                  </Button>
                </div>
              </div>

              {custMode === "existing" ? (
                <Select
                  value={selectedCustId}
                  onValueChange={setSelectedCustId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih pelanggan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} — {c.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Nama lengkap pelanggan"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                  />
                  <Input
                    placeholder="Nomor HP (cth: 0812xxxxxxxx)"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                  />
                  <Input
                    placeholder="Alamat (opsional)"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Service Section */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Pilih Layanan</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {prices.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedServicePriceId(p.id);
                      if (p.pricing_type !== "per_kg") setIsExpress(false);
                    }}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      selectedServicePriceId === p.id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.pricing_type === "per_kg"
                        ? `Rp${p.price_min}/${p.unit_label}`
                        : p.pricing_type === "per_pcs"
                          ? `Rp${p.price_min}/${p.unit_label}`
                          : p.pricing_type === "fixed"
                            ? `Rp${p.price_min} (fixed)`
                            : `Rp${p.price_min} - Rp${p.price_max}`}
                    </p>
                    {p.pricing_type === "per_kg" && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Express +50%
                      </p>
                    )}
                  </button>
                ))}
              </div>

              {/* Express toggle for per_kg */}
              {selectedService?.pricing_type === "per_kg" && (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">
                      Tambah Layanan Express
                    </p>
                    <p className="text-xs text-muted-foreground">
                      +50% dari harga normal
                    </p>
                  </div>
                  <Switch checked={isExpress} onCheckedChange={setIsExpress} />
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-1.5">
                <Label htmlFor="qty">
                  Jumlah ({selectedService?.unit_label ?? ""})
                </Label>
                <Input
                  id="qty"
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder={`Masukkan ${selectedService?.unit_label ?? "jumlah"}`}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              {/* Payment Status */}
              <div className="space-y-1.5">
                <Label htmlFor="payment">Status Pembayaran</Label>
                <Select
                  value={paymentStatus}
                  onValueChange={(v) => setPaymentStatus(v as PaymentStatus)}
                >
                  <SelectTrigger id="payment" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="lunas">Lunas</SelectItem>
                    <SelectItem value="cicilan">Cicilan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Condition Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="condition">Catatan Kondisi Pakaian</Label>
              <Textarea
                id="condition"
                placeholder="Misal: ada noda di kerah, kancing lepas, dsb."
                value={conditionNotes}
                onChange={(e) => setConditionNotes(e.target.value)}
                className="resize-none"
                rows={2}
              />
            </div>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setShowNew(false);
              }}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitOrder}
              disabled={submitting}
              className="gap-2"
            >
              {submitting ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {submitting ? "Menyimpan..." : "Simpan & Cetak Nota"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nota Digital</DialogTitle>
          </DialogHeader>
          {selectedOrder && <OrderReceipt order={selectedOrder} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
