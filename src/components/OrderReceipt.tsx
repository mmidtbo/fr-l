import { Printer, WashingMachine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { Order } from '@/lib/types'
import { SERVICE_TYPE_LABELS, formatRupiah, getUnitLabel } from '@/lib/types'

interface OrderReceiptProps {
  order: Order
}

export function OrderReceipt({ order }: OrderReceiptProps) {
  const estimatedDate = order.estimated_done
    ? new Date(order.estimated_done).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      })
    : '-'

  const createdDate = new Date(order.created_at).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-4">
      <div className="print:block border rounded-lg p-6 bg-white text-foreground text-sm" id="receipt-content">
        {/* Header */}
        <div className="text-center space-y-1 mb-4">
          <div className="flex items-center justify-center gap-2">
            <WashingMachine className="size-6 text-primary" />
            <h2 className="text-xl font-bold">Gresik Laundry</h2>
          </div>
          <p className="text-muted-foreground text-xs">Jl. Raya Gresik, Gresik, Jawa Timur</p>
          <p className="text-muted-foreground text-xs">Telp: 0812-3456-7890</p>
        </div>

        <Separator />

        {/* Order Code */}
        <div className="my-3 text-center">
          <p className="text-xs text-muted-foreground">Kode Order</p>
          <p className="text-lg font-bold tracking-widest font-mono">{order.order_code}</p>
          <p className="text-xs text-muted-foreground mt-1">{createdDate}</p>
        </div>

        <Separator />

        {/* Customer Info */}
        <div className="my-3 space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pelanggan</span>
            <span className="font-medium">{order.customer?.name ?? '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">No. HP</span>
            <span className="font-medium">{order.customer?.phone ?? '-'}</span>
          </div>
        </div>

        <Separator />

        {/* Service Detail */}
        <div className="my-3 space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jenis Layanan</span>
            <span className="font-medium">{SERVICE_TYPE_LABELS[order.service_type]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jumlah</span>
            <span className="font-medium">
              {order.quantity} {getUnitLabel(order.service_type)}
            </span>
          </div>
          {order.is_express && (
            <div className="flex justify-between text-amber-600">
              <span>Express (+50%)</span>
              <span>+{formatRupiah(order.express_surcharge)}</span>
            </div>
          )}
          {order.needs_weight_label && (
            <div className="text-xs text-amber-600 font-medium mt-1">
              ⚠ Cucian berat (&gt;10kg) - perlu label berat
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
            <span className="font-medium text-right max-w-[180px]">{estimatedDate}</span>
          </div>
        </div>

        {/* Condition Notes */}
        {order.condition_notes && (
          <>
            <Separator />
            <div className="my-3">
              <p className="text-muted-foreground text-xs mb-1">Catatan Kondisi</p>
              <p className="text-sm">{order.condition_notes}</p>
            </div>
          </>
        )}

        <Separator />

        {/* Disclaimer */}
        <div className="mt-3 text-center text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Catatan Penting</p>
          <p>Mohon simpan nota ini sebagai bukti pengambilan.</p>
          <p>Gresik Laundry tidak bertanggung jawab atas kerusakan yang sudah ada sebelumnya.</p>
          <p>Pakaian yang tidak diambil lebih dari 30 hari menjadi tanggung jawab pelanggan.</p>
          <p className="font-medium mt-2">Terima kasih sudah mempercayakan cucian Anda kepada kami!</p>
        </div>
      </div>

      <Button onClick={handlePrint} className="w-full gap-2">
        <Printer className="size-4" />
        Cetak Nota
      </Button>
    </div>
  )
}
