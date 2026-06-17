import { DataTable } from "@/components/demo-pages/order-data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api/axios";
import type { Customer, Order, PaymentStatus, ServicePrice } from "@/lib/types";
import { CUSTOMERS, ORDERS, STATUS_NEXT, fetchOrdersData } from "@/lib/types";
import { Plus, RefreshCw, Search, X } from "lucide-react";
import * as React from "react";

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
  }, [statusFilter, dateFilter]);

  async function fetchAll(): Promise<void> {
    setLoading(true);
    try {
      const { ordersData, customersData, pricesData } = await fetchOrdersData(
        statusFilter,
        dateFilter,
      );
      setOrders(ordersData);
      setCustomers(customersData);
      setPrices(pricesData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function onUpdateStatus(order: Order) {
    const next = STATUS_NEXT[order.status];

    if (!next) return;

    try {
      await api.put(`${ORDERS}/${order.id}`, {
        status: next,
      });

      await fetchAll();
    } catch (err) {
      console.error(err);
    }
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
        is_express: isExpress ? true : false,
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
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.order_code.toLowerCase().includes(q) ||
          o.customers?.name?.toLowerCase().includes(q) ||
          o.customers?.phone?.includes(q),
      );
    }
    return result;
  }, [orders, dateFilter, search]);

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
            resetForm();
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
              onClick={fetchAll}
              title="Refresh"
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Dialog orders*/}
      <Dialog
        open={showNew}
        onOpenChange={(open) => {
          if (!open) resetForm();
          setShowNew(open);
        }}
      >
        <DialogContent>
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
      <DataTable
        data={filteredOrders}
        onUpdateStatus={onUpdateStatus}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />
    </div>
  );
}
