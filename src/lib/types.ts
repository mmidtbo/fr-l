import { apiSafe } from "./api/axios";

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
export const REFRESH = `${URL}/token/refresh`;
export const STATS = `${URL}/dashboard/stats`;
export const LINE_CHART = `${URL}/dashboard/orderweek`;
export const BAR_CHART = `${URL}/dashboard/servicecount`;
export const PERCENTAGE_DIFF = `${URL}/orders/percentage`;
export const ORDERS_COUNT = `${URL}/orders/countorders`;
export const ORDERS_EXPRESS = `${URL}/orders/express`;
export const PAYMENTS = `${URL}/payments`;

export type SignOutResponse = {
  data: string;
  status_code: number;
};

export type User = {
  id: string;
  email: string;
  role: string;
  first_name?: string | null;
  last_name?: string | null;
};

export type UserResponse = {
  data: {
    id: string;
    email: string;
    role: string;
    first_name?: string | null;
    last_name?: string | null;
  };
};

export interface Customer {
  id: string;
  name: string;
  phone: string;
  total_orders: number | null;
  address: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CustomerMetadata {
  page: number | undefined;
  take: number | undefined;
  total: number | undefined;
}

export interface CustomersRaw {
  data: {
    id: string;
    name: string;
    phone: string;
    total_orders: number;
    address: string;
    created_at: string;
    updated_at: string;
  }[];
  page: number;
  status_code: number;
  take: number;
  total: number;
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
  default_turnaround_hours: number | null;
  is_active: boolean;
  updated_at: string | null;
};

export interface Order {
  id: string;
  order_code: string;
  customers: {
    id: string;
    name: string;
    phone: string;
  };
  service_prices: {
    id: string;
    name: string;
    unit_label: string;
    pricing_type: "per_kg" | "per_pcs" | "fixed" | "range";
    price_min: string;
    price_max: string | null;
  };
  is_express: boolean | null;
  quantity: number;
  total_price: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  estimated_done: string | null;
  base_price: number;
  express_surcharge: number | null;
  created_at: string | null;
  condition_notes: string | null;
  notes: string | null;
  picked_up_at: string | null;
}

export interface OrdersRaw {
  data: {
    id: string;
    order_code: string;
    customers: {
      id: string;
      name: string;
      phone: string;
    };
    service_prices: {
      id: string;
      name: string;
      unit_label: string;
      pricing_type: "per_kg" | "per_pcs" | "fixed" | "range";
      price_min: string;
      price_max: string | null;
    };
    is_express: boolean | null;
    quantity: number;
    total_price: number;
    status: OrderStatus;
    payment_status: PaymentStatus;
    estimated_done: string | null;
    base_price: number;
    express_surcharge: number | null;
    created_at: string | null;
    condition_notes: string | null;
    notes: string | null;
    picked_up_at: string | null;
  }[];
  page: number;
  take: number;
  total: number;
}

export interface Income {
  data: {
    income: string;
  };
}

export interface AvgDay {
  data: {
    avg_day: string;
  };
}

export interface IncomeService {
  data: {
    id: string;
    service_name: string;
    total_order: number;
    total_revenue: string;
  }[];
}

export interface DailyRevenue {
  data: {
    date: string;
    revenue: number;
    orders: number;
  }[];
}

export interface IncomeServiceTable {
  id: string;
  service_name: string;
  total_order: number;
  total_revenue: string;
}

export interface OrdersCountDay {
  data: {
    order_day: string;
    customer_id: string;
  }[];
  total: string;
}

// Alias untuk kompatibilitas — struktur identik dengan Order.
export type Orders = Order;

export interface DashboardRecentOrders {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  service_name: string;
  is_express: boolean | undefined;
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
  expressOrders: number;
}

export interface DashboardResponseRaw {
  data: {
    stats: {
      todayOrders: number;
      todayRevenue: number;
      pendingPickup: number;
      overdueOrders: number;
    };
    recentOrders: {
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
    }[];
  };
}

export type PercentageDiffRaw = {
  data: {
    percentage_diff: number;
  };
};

// export interface Income {
export const STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Diterima",
  proses: "Diproses",
  cuci: "Dicuci",
  jemur: "Dijemur",
  setrika: "Disetrika",
  ready: "Siap Diambil",
  picked_up: "Sudah Diambil",
};

// Surcharge express: +100% dari harga normal (dikenakan pada order per_kg).
// Backend adalah sumber kebenaran total_price; konstanta ini hanya untuk estimasi UI.
export const EXPRESS_SURCHARGE_RATE = 1; // +100%
export const EXPRESS_MULTIPLIER = 1 + EXPRESS_SURCHARGE_RATE; // ×2

export const STATUS_NEXT: Record<OrderStatus, OrderStatus | null> = {
  received: "proses",
  proses: "cuci",
  cuci: "jemur",
  jemur: "setrika",
  setrika: "ready",
  ready: "picked_up",
  picked_up: null,
};

export function formatRupiah(amount: number | null | undefined): string {
  const value = Number(amount);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export async function fetchOrdersData(
  page?: number,
  take?: number,
  status?: string,
  date?: string,
) {
  const params = new URLSearchParams();
  if (status && status !== "all") {
    params.set("status", status);
  }
  if (date && date !== "all") {
    params.set("day", date);
  }

  const queryStr = params.toString();
  const ordersPromise = queryStr
    ? apiSafe.get<OrdersRaw>(
        `${ORDERS_BY_STATUS}?${queryStr}&page=${page}&take=${take}`,
      )
    : apiSafe.get<OrdersRaw>(`${ORDERS_ALL}?page=${page}&take=${take}`);

  const [ordersRes, serviceRes, customersRes] = await Promise.all([
    ordersPromise,
    apiSafe.get<ServiceRaw>(SERVICE),
    apiSafe.get<CustomersRaw>(`${CUSTOMERS}?page=${page}&take=${take}`),
  ]);

  const order_metadata = {
    page: ordersRes.data?.page,
    take: ordersRes.data?.take,
    total: ordersRes.data?.total,
  };
  const ordersData = ordersRes.data?.data;

  const customer_metadata = {
    page: customersRes.data?.page,
    take: customersRes.data?.take,
    total: customersRes.data?.total,
  };

  const customersData = customersRes.data?.data;
  const pricesData = serviceRes.data?.data;

  return {
    ordersData,
    order_metadata,
    customersData,
    customer_metadata,
    pricesData,
  };
}

export async function CustomersPaginationrequest(page?: number, take?: number) {
  const data = await apiSafe.get<CustomersRaw>(
    `${CUSTOMERS}?page=${page}&take=${take}`,
  );
  return data;
}

export type LineChart = {
  data: {
    date: string;
    count: string;
  };
};

export type BarChart = {
  data: {
    service_name: string;
    jumlah: string;
  };
};

export interface ServiceRaw {
  data: {
    id: string;
    name: string;
    category: "basic_wash" | "full_service" | "ironing" | "item_based";
    pricing_type: "per_kg" | "per_pcs" | "fixed" | "range";
    price_min: number;
    price_max: number | null;
    unit_label: string;
    default_turnaround_hours: number | null;
    is_active: boolean;
    updated_at: string | null;
  }[];
}
