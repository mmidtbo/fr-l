import api from "./api/axios";

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
export const ORDERS_ALL = `${URL}/orders/all`;
export const ORDERS_BY_STATUS = `${URL}/orders/status`;
export const CUSTOMERS = `${URL}/customers`;
export const REFRESH = `${URL}/refresh`;
export const STATS = `${URL}/dashboard/stats`;
export const INCOME = `${URL}/dashboard/income?day=`;
export const INCOME_TEST = `${URL}/dashboard/income?day=30`;
export const PERCENTAGE_DIFF = `${URL}/orders/percentage`;
export const ORDERS_COUNT = `${URL}/orders/countorders`;

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
  total_orders: number;
  address: string;
  created_at: string;
  updated_at: string;
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
  unit_label: string | "pcs";
  default_turnaround_hours: number | 48;
  is_active: number | 1;
  updated_at: string;
};

export interface Order {
  id: string;
  order_code: string;
  customer_id: string;
  customers?: Customer;
  service_price_id: string;
  service_prices?: ServicePrice;
  quantity: number;
  is_express: boolean;
  base_price: number;
  express_surcharge: number;
  total_price: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  is_overdue: boolean;
  condition_notes: string;
  notes: string;
  estimated_done: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  picked_up_at: string | null;
}

export interface DashboardRecentOrders {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  service_name: string;
  is_express: boolean;
  service_category: string;
  quantity: number;
  total_price: number;
  status: string;
  payment_status: string;
  estimated_done: string;
  picked_up_at: string;
  created_at: string;
}

export interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  pendingPickup: number;
  overdueOrders: number;
  percentageDiff: number;
  ordersCount: number;
}

export interface DashboardStatsResponse {
  stats: {
    todayOrders: number;
    todayRevenue: number;
    pendingPickup: number;
    overdueOrders: number;
  };
  recentOrders: Order[];
}

export interface Income {
  income: number | 0;
}

export interface Avgday {
  avg_day: number | 0;
}

export interface IncomeService {
  id: string;
  service_name: string;
  total_order: number;
  total_revenue: number;
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

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateStr));
}

export function generateOrderCode(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `GRS-${year}${month}${day}-${rand}`;
}

export interface FetchOrdersResult {
  ordersData: Order[];
  customersData: Customer[];
  pricesData: ServicePrice[];
}

export async function fetchOrdersData(
  status?: string,
  date?: string,
): Promise<FetchOrdersResult> {
  const params = new URLSearchParams();
  if (status && status !== "all") {
    params.set("status", status);
  }
  if (date && date !== "all") {
    params.set("day", date);
  }

  const queryStr = params.toString();
  const ordersPromise = queryStr
    ? api.get(`${ORDERS_BY_STATUS}?${queryStr}`)
    : api.get(ORDERS_ALL);

  const [ordersRes, serviceRes, customersRes] = await Promise.all([
    ordersPromise,
    api.get(SERVICE),
    api.get(CUSTOMERS),
  ]);

  const ordersData =
    ordersRes.data.filter((order: Order): boolean => {
      return order.customers?.name !== undefined;
    }) ?? [];

  const customersData = customersRes.data;

  return {
    ordersData,
    customersData,
    pricesData: serviceRes.data,
  };
}

export async function handleUpdateStatus(order: Order): Promise<void> {
  const next = STATUS_NEXT[order.status];
  if (!next) return;
  try {
    await api.put(`${ORDERS}/${order.id}`, { status: next });
    await fetchOrdersData();
  } catch {
    // silent
  }
}

export type DataTableProps = {
  data: Order[];
  onUpdateStatus: (order: Order) => Promise<void>;
};
