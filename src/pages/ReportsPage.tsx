import * as React from 'react'
import { TrendingUp, ShoppingBag, Users, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from '@/components/ui/chart'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import type { Order } from '@/lib/types'
import { formatRupiah, SERVICE_TYPE_LABELS } from '@/lib/types'

interface DailySummary {
  date: string
  label: string
  orders: number
  revenue: number
}

export function ReportsPage() {
  const [orders, setOrders] = React.useState<Order[]>([])
  const [loading, setLoading] = React.useState(true)
  const [period, setPeriod] = React.useState('30')

  React.useEffect(() => { fetchData() }, [period])

  async function fetchData() {
    setLoading(true)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - parseInt(period))

    const { data } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', cutoff.toISOString())
      .order('created_at', { ascending: true })

    setOrders(data ?? [])
    setLoading(false)
  }

  const dailyData = React.useMemo((): DailySummary[] => {
    const days: DailySummary[] = []
    const count = parseInt(period)
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      const dayOrders = orders.filter(o => {
        const t = new Date(o.created_at)
        return t >= d && t < next
      })
      days.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((s, o) => s + o.total_price, 0),
      })
    }
    return days
  }, [orders, period])

  const totalRevenue = orders.reduce((s, o) => s + o.total_price, 0)
  const avgPerDay = orders.length > 0 ? totalRevenue / parseInt(period) : 0
  const uniqueCustomers = new Set(orders.map(o => o.customer_id)).size

  const serviceBreakdown = React.useMemo(() => {
    const groups: Record<string, { count: number; revenue: number }> = {}
    orders.forEach(o => {
      if (!groups[o.service_type]) groups[o.service_type] = { count: 0, revenue: 0 }
      groups[o.service_type].count++
      groups[o.service_type].revenue += o.total_price
    })
    return Object.entries(groups)
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [orders])

  const chartConfig = {
    revenue: { label: 'Pendapatan', color: 'var(--chart-1)' },
    orders: { label: 'Pesanan', color: 'var(--chart-2)' },
  }

  // Show last N days in chart (max 30 for readability)
  const chartData = dailyData.filter((_, i, arr) => {
    if (arr.length <= 14) return true
    return i % Math.ceil(arr.length / 14) === 0 || i === arr.length - 1
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan</h1>
          <p className="text-muted-foreground">Analisis omzet dan transaksi Gresik Laundry</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 Hari Terakhir</SelectItem>
            <SelectItem value="14">14 Hari Terakhir</SelectItem>
            <SelectItem value="30">30 Hari Terakhir</SelectItem>
            <SelectItem value="90">90 Hari Terakhir</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: 'Total Pendapatan',
            value: loading ? null : formatRupiah(totalRevenue),
            sub: `dalam ${period} hari terakhir`,
            icon: TrendingUp,
            color: 'text-green-600',
            bg: 'bg-green-50 dark:bg-green-950/30',
          },
          {
            label: 'Total Pesanan',
            value: loading ? null : orders.length.toString(),
            sub: 'transaksi masuk',
            icon: ShoppingBag,
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-950/30',
          },
          {
            label: 'Rata-rata/Hari',
            value: loading ? null : formatRupiah(Math.round(avgPerDay)),
            sub: 'pendapatan harian',
            icon: BarChart3,
            color: 'text-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-950/30',
          },
          {
            label: 'Pelanggan Aktif',
            value: loading ? null : uniqueCustomers.toString(),
            sub: 'pelanggan unik',
            icon: Users,
            color: 'text-purple-600',
            bg: 'bg-purple-50 dark:bg-purple-950/30',
          },
        ].map(card => (
          <Card key={card.label}>
            <CardContent className="pt-5">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-7 w-20" />
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="text-xl font-bold mt-1">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
                  </div>
                  <div className={`rounded-lg p-2 ${card.bg}`}>
                    <card.icon className={`size-4 ${card.color}`} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tren Pendapatan Harian</CardTitle>
          <CardDescription>Total omzet per hari dalam periode yang dipilih</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <ChartContainer config={chartConfig} className="h-56 w-full">
              <LineChart data={chartData} accessibilityLayer>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}rb`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [formatRupiah(Number(value)), 'Pendapatan']}
                    />
                  }
                />
                <Line
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Orders Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Volume Pesanan Harian</CardTitle>
          <CardDescription>Jumlah transaksi masuk per hari</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ChartContainer config={chartConfig} className="h-48 w-full">
              <BarChart data={chartData} accessibilityLayer>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="orders" fill="var(--color-orders)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Service Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Breakdown per Jenis Layanan</CardTitle>
          <CardDescription>Perbandingan pendapatan dan volume per layanan</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : serviceBreakdown.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Belum ada data untuk periode ini
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jenis Layanan</TableHead>
                  <TableHead className="text-right">Jumlah Pesanan</TableHead>
                  <TableHead className="text-right">Total Pendapatan</TableHead>
                  <TableHead className="text-right">% dari Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceBreakdown.map(row => (
                  <TableRow key={row.type}>
                    <TableCell className="font-medium">{SERVICE_TYPE_LABELS[row.type as keyof typeof SERVICE_TYPE_LABELS]}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                    <TableCell className="text-right font-medium">{formatRupiah(row.revenue)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {totalRevenue > 0 ? ((row.revenue / totalRevenue) * 100).toFixed(1) : 0}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
