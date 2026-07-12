import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { apiSafe } from "@/lib/api/axios";
import type { Orders } from "@/lib/types";
import { formatRupiah, PAYMENTS, STATUS_LABELS } from "@/lib/types";
import { Printer, WashingMachine } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface OrderReceiptProps {
  order: Orders;
  onPaymentSuccess?: () => void;
}

export function OrderReceipt({ order, onPaymentSuccess }: OrderReceiptProps) {
  const [paying, setPaying] = React.useState(false);
  const [payMethod, setPayMethod] = React.useState("cash");
  const [payAmount, setPayAmount] = React.useState(order.total_price);
  const [payError, setPayError] = React.useState("");

  const isUnpaid = order.payment_status !== "lunas";

  const dateStr = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const estimatedDate = dateStr(order.estimated_done);
  const createdDate = dateStr(order.created_at);
  const pickedUpDate = dateStr(order.picked_up_at);

  const handlePay = async () => {
    if (!payAmount || payAmount <= 0) {
      setPayError("Jumlah pembayaran harus lebih dari 0");
      return;
    }
    if (paying) return;
    setPaying(true);
    setPayError("");

    const res = await apiSafe.post(PAYMENTS, {
      order_id: order.id,
      method: payMethod,
      amount: payAmount,
      paid_by: order.customers?.id,
    });

    if (res.error) {
      setPayError(res.error);
      toast.error(res.error);
      setPaying(false);
      return;
    }

    toast.success("Pembayaran berhasil dicatat.");
    setPaying(false);
    onPaymentSuccess?.();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div
        className="print:block border rounded-lg p-6 bg-white dark:bg-slate-900 text-foreground text-sm"
        id="receipt-content"
      >
        {/* Header */}
        <div className="text-center space-y-1 mb-4">
          <div className="flex items-center justify-center gap-2">
            <WashingMachine className="size-6 text-primary" />
            <h2 className="text-xl font-bold">Gresik Laundry</h2>
          </div>
          <p className="text-muted-foreground text-xs">
            Jl. Raya Gresik, Gresik, Jawa Timur
          </p>
          <p className="text-muted-foreground text-xs">Telp: 0812-3456-7890</p>
        </div>

        <Separator />

        {/* Order Code */}
        <div className="my-3 text-center">
          <p className="text-xs text-muted-foreground">Kode Order</p>
          <p className="text-lg font-bold tracking-widest font-mono">
            {order.order_code}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{createdDate}</p>
        </div>

        <Separator />

        {/* Customer Info */}
        <div className="my-3 space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pelanggan</span>
            <span className="font-medium">{order.customers?.name ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">No. HP</span>
            <span className="font-medium">{order.customers?.phone ?? "-"}</span>
          </div>
        </div>

        <Separator />

        {/* Service Detail */}
        <div className="my-3 space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jenis Layanan</span>
            <span className="font-medium">
              {order.service_prices?.name ?? "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jumlah</span>
            <span className="font-medium">
              {order.quantity} {order.service_prices?.unit_label ?? ""}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium">{STATUS_LABELS[order.status]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pembayaran</span>
            <span className="font-medium capitalize">
              {order.payment_status === "lunas"
                ? "Lunas"
                : order.payment_status === "cicilan"
                  ? "Cicilan"
                  : "Pending"}
            </span>
          </div>
          {order.is_express && (
            <div className="flex justify-between text-amber-600">
              <span>Express (+100%)</span>
              <span>+{formatRupiah(order.express_surcharge)}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Pricing */}
        <div className="my-3 space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Harga Dasar</span>
            <span>{formatRupiah(order.base_price)}</span>
          </div>
          {(order.express_surcharge ?? 0) > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Biaya Express</span>
              <span>{formatRupiah(order.express_surcharge)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-1 border-t">
            <span>Total</span>
            <span>{formatRupiah(order.total_price)}</span>
          </div>
        </div>

        <Separator />

        {/* Estimated Done / Pickup Time */}
        <div className="my-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {order.status === "picked_up"
                ? "Diambil Pada"
                : "Estimasi Selesai"}
            </span>
            <span className="font-medium text-right max-w-[180px]">
              {order.status === "picked_up" ? pickedUpDate : estimatedDate}
            </span>
          </div>
        </div>

        {/* Condition Notes */}
        {order.condition_notes && (
          <>
            <Separator />
            <div className="my-3">
              <p className="text-muted-foreground text-xs mb-1">
                Catatan Kondisi
              </p>
              <p className="text-sm">{order.condition_notes}</p>
            </div>
          </>
        )}

        {/* Notes */}
        {order.notes && (
          <>
            <Separator />
            <div className="my-3">
              <p className="text-muted-foreground text-xs mb-1">
                Catatan Internal
              </p>
              <p className="text-sm">{order.notes}</p>
            </div>
          </>
        )}

        <Separator />

        {/* Disclaimer */}
        <div className="mt-3 text-center text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Catatan Penting</p>
          <p className="text-start">
            1. Mohon simpan nota ini sebagai bukti pengambilan.
          </p>
          <p className="text-start">
            2. Gresik Laundry tidak bertanggung jawab atas kerusakan yang sudah
            ada sebelumnya.
          </p>
          <p className="font-medium mt-4">
            Terima kasih sudah mempercayakan cucian Anda kepada kami!
          </p>
        </div>
      </div>

      {/* Payment Section */}
      {isUnpaid && (
        <div className="border rounded-lg p-4 mt-4 space-y-3">
          <p className="text-sm font-medium">Pembayaran</p>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Metode
            </label>
            <Select value={payMethod} onValueChange={setPayMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="qris">QRIS</SelectItem>
                <SelectItem value="ewallet">E-Wallet</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label
              htmlFor="pay-amount"
              className="text-xs text-muted-foreground mb-1 block"
            >
              Jumlah Dibayar
            </label>
            <input
              id="pay-amount"
              type="number"
              min={0}
              step="any"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.valueAsNumber || 0)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
            />
          </div>
          {payError && <p className="text-xs text-red-500">{payError}</p>}
          <Button
            className="w-full gap-2"
            onClick={handlePay}
            disabled={paying}
          >
            {paying ? "Memproses..." : "Bayar Sekarang"}
          </Button>
        </div>
      )}

      <Button
        onClick={handlePrint}
        variant="outline"
        className="w-full gap-2 mt-4"
      >
        <Printer className="size-4" />
        Cetak Nota
      </Button>
    </div>
  );
}
