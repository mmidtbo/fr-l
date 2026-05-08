import * as React from 'react'
import { Save, RefreshCw, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import type { ServicePrice } from '@/lib/types'
import { formatRupiah } from '@/lib/types'

const SERVICE_INFO: Record<string, { label: string; desc: string; unit: string }> = {
  kiloan: { label: 'Laundry Kiloan', desc: 'Harga per kilogram cucian', unit: 'kg' },
  satuan: { label: 'Laundry Satuan', desc: 'Harga per helai/item pakaian', unit: 'item' },
  meter: { label: 'Laundry Meter', desc: 'Harga per meter (untuk gordyn, karpet, dll)', unit: 'meter' },
}

export function SettingsPage() {
  const [prices, setPrices] = React.useState<ServicePrice[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [editValues, setEditValues] = React.useState<Record<string, string>>({})
  const [saveMsg, setSaveMsg] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null)

  React.useEffect(() => { fetchPrices() }, [])

  async function fetchPrices() {
    setLoading(true)
    const { data } = await supabase.from('service_prices').select('*')
    const priceList = data ?? []
    setPrices(priceList)
    const vals: Record<string, string> = {}
    priceList.forEach(p => { vals[p.service_type] = String(p.price_per_unit) })
    setEditValues(vals)
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaveMsg(null)
    try {
      for (const [type, val] of Object.entries(editValues)) {
        const numVal = parseFloat(val)
        if (isNaN(numVal) || numVal < 0) continue
        await supabase
          .from('service_prices')
          .update({ price_per_unit: numVal, updated_at: new Date().toISOString() })
          .eq('service_type', type)
      }
      setSaveMsg({ type: 'success', text: 'Harga berhasil diperbarui!' })
      await fetchPrices()
    } catch {
      setSaveMsg({ type: 'error', text: 'Gagal menyimpan harga. Coba lagi.' })
    }
    setSaving(false)
    setTimeout(() => setSaveMsg(null), 3000)
  }

  const expressPrice = React.useMemo(() => {
    const kiloanPrice = parseFloat(editValues['kiloan'] ?? '0')
    return isNaN(kiloanPrice) ? 0 : kiloanPrice * 1.5
  }, [editValues])

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola harga layanan laundry</p>
      </div>

      {/* Pricing Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
              <Settings className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base">Harga Layanan</CardTitle>
              <CardDescription>Atur harga untuk setiap jenis layanan laundry</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : (
            <>
              {['kiloan', 'satuan', 'meter'].map(type => {
                const info = SERVICE_INFO[type]
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">{info.label}</Label>
                        <p className="text-xs text-muted-foreground">{info.desc}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Rp</span>
                        <Input
                          type="number"
                          min="0"
                          step="500"
                          className="w-32 text-right"
                          value={editValues[type] ?? ''}
                          onChange={e => setEditValues(prev => ({ ...prev, [type]: e.target.value }))}
                        />
                        <span className="text-sm text-muted-foreground w-10">/{info.unit}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      Preview: {formatRupiah(parseFloat(editValues[type] ?? '0') || 0)} per {info.unit}
                    </div>
                  </div>
                )
              })}

              <Separator />

              {/* Express Info */}
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      Layanan Express (Otomatis)
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                      Dihitung otomatis: Harga Kiloan + 50% biaya tambahan
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-800 dark:text-amber-300">
                      {formatRupiah(expressPrice)}/kg
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-500">
                      = {formatRupiah(parseFloat(editValues['kiloan'] ?? '0') || 0)} + 50%
                    </p>
                  </div>
                </div>
              </div>

              {saveMsg && (
                <p className={`text-sm font-medium ${saveMsg.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
                  {saveMsg.text}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={fetchPrices} disabled={saving}>
                  <RefreshCw className="size-4 mr-2" />
                  Reset
                </Button>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {saving ? 'Menyimpan...' : 'Simpan Harga'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Price Preview Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tabel Harga Contoh</CardTitle>
          <CardDescription>Estimasi biaya berdasarkan harga saat ini</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Layanan</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">1</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">3</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">5</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">10</th>
                </tr>
              </thead>
              <tbody>
                {prices.map(p => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 font-medium">{SERVICE_INFO[p.service_type]?.label}</td>
                    {[1, 3, 5, 10].map(qty => (
                      <td key={qty} className="text-right py-2 text-muted-foreground">
                        {formatRupiah(p.price_per_unit * qty)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-amber-50/50 dark:bg-amber-950/10">
                  <td className="py-2 font-medium text-amber-700 dark:text-amber-400">Express</td>
                  {[1, 3, 5, 10].map(qty => (
                    <td key={qty} className="text-right py-2 text-amber-700 dark:text-amber-400">
                      {formatRupiah(expressPrice * qty)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
