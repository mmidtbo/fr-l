import { Printer, WashingMachine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Order } from "@/lib/types";
import { formatRupiah, STATUS_LABELS } from "@/lib/types";

interface OrderReceiptProps {
  order: Order;
}

export function OrderReceipt({ order }: OrderReceiptProps) {
  const estimatedDate = order.estimated_done
    ? new Date(order.estimated_done).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  const createdDate = new Date(order.created_at).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

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
          {order.express_surcharge > 0 && (
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

        {/* Estimated Done */}
        <div className="my-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimasi Selesai</span>
            <span className="font-medium text-right max-w-[180px]">
              {estimatedDate}
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
          {/* <p> */}
          {/*   Pakaian yang tidak diambil lebih dari 30 hari menjadi tanggung jawab */}
          {/*   pelanggan. */}
          {/* </p> */}
          <p className="font-medium mt-4">
            Terima kasih sudah mempercayakan cucian Anda kepada kami!
          </p>
        </div>
      </div>

      <Button onClick={handlePrint} className="w-full gap-2 mt-4">
        <Printer className="size-4" />
      </Button>
    </div>
  );
}
