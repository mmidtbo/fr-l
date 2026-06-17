# Alur Filter Orders

## Sebelum (Gemuk)

```
[Tab Status] ──► statusFilter ──► filteredOrders (client-side filter)
                                      │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
              filter status      filter tanggal      filter search
              (client-side)      (client-side)       (client-side)

API ──► fetchOrdersData() ──► ORDERS_ALL ──► semua data dikirim ke frontend
                                               ↑
                                          BLOAT! Semua order
                                          tanpa filter apapun
```

## Sesudah (Ramping)

```
[Tab Status] ──► statusFilter ──► useEffect ──► fetchAll()
                                                     │
                                                     ▼
                                           fetchOrdersData(statusFilter)
                                                     │
                          ┌──────────────────────────┼──────────────────┐
                          ▼                          ▼                  ▼
                   status="all"              status="received"    status="proses"...
                          │                          │                  │
                          ▼                          ▼                  ▼
                   ORDERS_ALL                /orders/status?     /orders/status?
                   (semua data)              ?status=received    ?status=proses
                                                     │
                                                     ▼
                                              setOrders(data)
                                              (data uda difilter backend)
                                                     │
                                                     ▼
                                           filteredOrders (useMemo)
                                                     │
                              ┌──────────────────────┼──────────────────────┐
                              ▼                      ▼                      ▼
                        filter tanggal         filter search          sisa = kirim
                        (client-side)          (client-side)          ke DataTable
                                                                             │
                                                                             ▼
                                                                       <DataTable
                                                                         data={filteredOrders}
                                                                       />
```

## Kenapa Ini Lebih Baik

| Sebelum                                        | Sesudah                                         |
| ---------------------------------------------- | ----------------------------------------------- |
| Backend kirim **semua** order (1000+ baris)    | Backend kirim **cuma** order sesuai status tab  |
| Frontend filter status sendiri (boros RAM/CPU) | Frontend tinggal render, status sudah sesuai    |
| Search & date filter tetap client-side         | Search & date filter tetap client-side (ringan) |
| Kalau ganti tab, cuma filter ulang data yg ada | Kalau ganti tab, request baru ke backend        |

## File yang Terlibat

### `src/lib/types.ts`

```ts
export const ORDERS_BY_STATUS = `${URL}/orders/status`;

export async function fetchOrdersData(status?: string) {
  // KALAU status dipilih (misal "received"), panggil endpoint filtered
  // KALAU "all" atau tidak ada, panggil ORDERS_ALL
  const ordersPromise =
    status && status !== "all"
      ? api.get(`${ORDERS_BY_STATUS}?status=${status}`)
      : api.get(ORDERS_ALL);

  const [ordersRes, serviceRes] = await Promise.all([
    ordersPromise,
    api.get(SERVICE),
  ]);
  // ...return ordersData, customersData, pricesData
}
```

### `src/components/demo-pages/OrdersDemoPage.tsx`

**useEffect — refetch saat tab status berubah:**

```tsx
React.useEffect(() => {
  fetchAll();
}, [statusFilter]); // <-- dependency: ganti tab = refetch
```

**fetchAll — kirim statusFilter ke backend:**

```tsx
async function fetchAll() {
  const { ordersData } = await fetchOrdersData(statusFilter);
  setOrders(ordersData);
}
```

**filteredOrders — hanya untuk search & date:**

```tsx
const filteredOrders = React.useMemo(() => {
  let result = orders; // <-- orders uda sesuai status dari backend
  if (dateFilter !== "all") {
    // filter tanggal client-side
  }
  if (search) {
    // filter search client-side
  }
  return result;
}, [orders, dateFilter, search]); // <-- statusFilter tidak perlu lagi
```

**DataTable — pakai filteredOrders:**

```tsx
<DataTable data={filteredOrders} onUpdateStatus={onUpdateStatus} />
```

## Ringkasan

```
User klik tab "Diproses"
  → statusFilter = "proses"
  → useEffect trigger fetchAll()
  → fetchOrdersData("proses")
  → GET /api/orders/status?status=proses
  → Backend return cuma order dgn status "proses"
  → setOrders(data_proses)
  → filteredOrders = data_proses + filter search + filter tanggal
  → DataTable render filteredOrders
```

Gunakan 1 endpoint dengan 2 query params:
GET /api/orders/status?status=proses&date=today
Cukup ubah sedikit di fetchOrdersData:
export async function fetchOrdersData(status?: string, date?: string): Promise<FetchOrdersResult> {
const params = new URLSearchParams();
if (status && status !== "all") params.set("status", status);
if (date && date !== "all") params.set("date", date);

const queryStr = params.toString();
const ordersPromise = queryStr
? api.get(`${ORDERS_BY_STATUS}?${queryStr}`)
: api.get(ORDERS_ALL);

// ... sisanya sama
}
Trus di OrdersDemoPage.tsx:

- await fetchOrdersData(statusFilter);

- await fetchOrdersData(statusFilter, dateFilter);
  Hapus filter tanggal dari filteredOrders (mirip seperti status dulu), dan tambah dateFilter ke dependency useEffect:
  React.useEffect(() => {
  fetchAll();
  }, [statusFilter, dateFilter]);
  Kesimpulan:

- ✅ 1 endpoint, 2 query params — backend tinggal nambah logic baca date
- ✅ Search tetap client-side (gak perlu backend)
- ✅ Frontend makin ramping, semua filter berat pindah ke backend
- ✅ filteredOrders nantinya cuma untuk search doang
  Mau pakai pendekatan ini? Atau kamu prefer bikin endpoint baru sendiri (/api/orders/filter)?
