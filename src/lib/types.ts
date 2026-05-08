export type UserRole = 'owner' | 'karyawan'

export type ServiceType = 'kiloan' | 'satuan' | 'express' | 'meter'

export type OrderStatus = 'received' | 'washing' | 'ready' | 'picked_up'

export interface Profile {
  id: string
  name: string
  role: UserRole
  created_at: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  address: string
  created_at: string
}

export interface ServicePrice {
  id: string
  service_type: 'kiloan' | 'satuan' | 'meter'
  price_per_unit: number
  unit_label: string
  updated_at: string
}

export interface Order {
  id: string
  order_code: string
  customer_id: string
  customer?: Customer
  service_type: ServiceType
  quantity: number
  is_express: boolean
  base_price: number
  express_surcharge: number
  total_price: number
  status: OrderStatus
  is_overdue: boolean
  needs_weight_label: boolean
  condition_notes: string
  notes: string
  estimated_done: string | null
  created_by: string
  created_at: string
  updated_at: string
  picked_up_at: string | null
}

export interface OrderAuditLog {
  id: string
  order_id: string
  user_id: string
  old_status: string | null
  new_status: string
  notes: string
  created_at: string
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  kiloan: 'Kiloan',
  satuan: 'Satuan',
  express: 'Express',
  meter: 'Meter',
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  received: 'Diterima',
  washing: 'Dicuci',
  ready: 'Siap Diambil',
  picked_up: 'Sudah Diambil',
}

export const STATUS_NEXT: Record<OrderStatus, OrderStatus | null> = {
  received: 'washing',
  washing: 'ready',
  ready: 'picked_up',
  picked_up: null,
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function generateOrderCode(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `GRS-${year}${month}${day}-${rand}`
}

export function getUnitLabel(serviceType: ServiceType): string {
  switch (serviceType) {
    case 'kiloan': return 'kg'
    case 'satuan': return 'item'
    case 'express': return 'kg'
    case 'meter': return 'meter'
  }
}
