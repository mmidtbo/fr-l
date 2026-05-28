export type UserRole = "owner" | "karyawan";

export type PaymentStatus = "pending" | "lunas" | "cicilan";

export type OrderStatus =
  | "received"
  | "proses"
  | "cuci"
  | "jemur"
  | "setrika"
  | "ready"
  | "picked_up";

export const URL = import.meta.env.VITE_URL;
export const AUTH_ME = `${URL}/auth/me`;
export const LOGIN = `${URL}/auth/login`;
export const REGISTER = `${URL}/auth`;
export const LOGOUT = `${URL}/auth/current`;
export const SERVICE = `${URL}/services`;
export const ORDERS = `${URL}/orders`;
export const CUSTOMERS = `${URL}/customers`;

export type SignOutResponse = {
  message: string;
  status_code: number;
};

export type ApiResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export type User = {
  id: string;
  email: string;
  role: string;
};

export type UserResponse = {
  data: {
    id: string;
    email: string;
    role: string;
  };
};

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  created_at: string;
}

export type CustomerResponse = {
  data: {
    id: string;
    name: string;
    phone: string;
    address?: string | null;
    total_orders: number | null;
    created_at: Date | null;
    updated_at: Date | null;
  };
  status_code: number;
};

export type ServicePrice = {
  id: string;
  name: string;
  category: "basic_wash" | "full_service" | "ironing" | "item_based";
  pricing_type: "per_kg" | "per_pcs" | "fixed" | "range";
  price_min: number;
  price_max: number | null;
  unit_label: string;
  default_turnaround_hours: number;
  is_active: number;
  updated_at: string;
};

export interface Order {
  id: string;
  order_code: string;
  customer_id: string;
  customer?: Customer;
  service_price_id: string;
  service_price?: ServicePrice;
  quantity: number;
  is_express: boolean;
  base_price: number;
  express_surcharge: number;
  total_price: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  is_overdue: boolean;
  needs_weight_label: boolean;
  condition_notes: string;
  notes: string;
  estimated_done: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  picked_up_at: string | null;
}

export interface OrderAuditLog {
  id: string;
  order_id: string;
  user_id: string;
  old_status: string | null;
  new_status: string;
  notes: string;
  created_at: string;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Diterima",
  proses: "Diproses",
  cuci: "Dicuci",
  jemur: "Dijemur",
  setrika: "Disetrika",
  ready: "Siap Diambil",
  picked_up: "Sudah Diambil",
};

export const STATUS_NEXT: Record<OrderStatus, OrderStatus | null> = {
  received: "proses",
  proses: "cuci",
  cuci: "jemur",
  jemur: "setrika",
  setrika: "ready",
  ready: "picked_up",
  picked_up: null,
};

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  lunas: "Lunas",
  cicilan: "Cicilan",
};

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function generateOrderCode(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `GRS-${year}${month}${day}-${rand}`;
}
