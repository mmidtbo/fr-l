
/*
  # Gresik Laundry - Sistem Informasi Manajemen Laundry

  ## Tabel Baru
  - `profiles` - Data profil pengguna (owner/karyawan)
  - `customers` - Data pelanggan laundry
  - `service_prices` - Daftar harga layanan
  - `orders` - Transaksi cucian
  - `order_audit_log` - Riwayat perubahan status order

  ## Detail Tabel

  ### profiles
  - `id` (uuid, pk, ref auth.users)
  - `name` (text) - nama lengkap
  - `role` (text) - 'owner' atau 'karyawan'

  ### customers
  - `id`, `name`, `phone`, `address`, `created_at`

  ### service_prices
  - `service_type` - kiloan, satuan, meter
  - `price_per_unit` - harga per satuan
  - `unit_label` - label satuan (kg, item, meter)

  ### orders
  - `order_code` - kode unik (e.g. GRS-20260001)
  - `service_type` - kiloan, satuan, express, meter
  - `quantity`, `is_express`, `base_price`, `express_surcharge`, `total_price`
  - `status` - received, washing, ready, picked_up
  - `is_overdue`, `needs_weight_label`
  - `condition_notes`, `notes`, `estimated_done`
  - `created_by` (ref profiles)

  ### order_audit_log
  - Mencatat perubahan status oleh siapa dan kapan

  ## Keamanan
  - RLS diaktifkan di semua tabel
  - Pengguna terautentikasi bisa baca/input
  - Owner bisa akses semua; karyawan dibatasi

  ## Data Awal
  - Harga default: kiloan Rp7.000/kg, satuan Rp5.000/item, meter Rp15.000/meter
*/

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'karyawan' CHECK (role IN ('owner', 'karyawan')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna bisa lihat profil sendiri"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Pengguna bisa update profil sendiri"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Pengguna bisa insert profil sendiri"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Owner bisa lihat semua profil"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'owner'
    )
  );

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  address text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna terautentikasi bisa lihat pelanggan"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pengguna terautentikasi bisa tambah pelanggan"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Pengguna terautentikasi bisa update pelanggan"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- SERVICE PRICES
-- ============================================================
CREATE TABLE IF NOT EXISTS service_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type text UNIQUE NOT NULL CHECK (service_type IN ('kiloan', 'satuan', 'meter')),
  price_per_unit numeric NOT NULL DEFAULT 0,
  unit_label text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Semua pengguna bisa lihat harga"
  ON service_prices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owner bisa update harga"
  ON service_prices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id),
  service_type text NOT NULL CHECK (service_type IN ('kiloan', 'satuan', 'express', 'meter')),
  quantity numeric NOT NULL DEFAULT 0,
  is_express boolean DEFAULT false,
  base_price numeric NOT NULL DEFAULT 0,
  express_surcharge numeric DEFAULT 0,
  total_price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'washing', 'ready', 'picked_up')),
  is_overdue boolean DEFAULT false,
  needs_weight_label boolean DEFAULT false,
  condition_notes text DEFAULT '',
  notes text DEFAULT '',
  estimated_done timestamptz,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  picked_up_at timestamptz
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna terautentikasi bisa lihat order"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pengguna terautentikasi bisa buat order"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Pengguna terautentikasi bisa update order"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- ORDER AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS order_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  old_status text,
  new_status text NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna terautentikasi bisa lihat log"
  ON order_audit_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pengguna terautentikasi bisa tambah log"
  ON order_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- FUNCTION: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNCTION: Auto-update status berdasarkan waktu
-- ============================================================
CREATE OR REPLACE FUNCTION check_order_overdue()
RETURNS void AS $$
BEGIN
  -- Auto set ready setelah 2 hari
  UPDATE orders
  SET status = 'ready', updated_at = now()
  WHERE status = 'washing'
    AND created_at < now() - interval '2 days';

  -- Auto set overdue setelah 30 hari dari ready/received
  UPDATE orders
  SET is_overdue = true, updated_at = now()
  WHERE status IN ('received', 'washing', 'ready')
    AND created_at < now() - interval '30 days';

  -- Auto set needs_weight_label jika > 10kg
  UPDATE orders
  SET needs_weight_label = true
  WHERE service_type IN ('kiloan', 'express')
    AND quantity > 10
    AND needs_weight_label = false;
END;
$$ language 'plpgsql';

-- ============================================================
-- SEED: Harga default layanan
-- ============================================================
INSERT INTO service_prices (service_type, price_per_unit, unit_label) VALUES
  ('kiloan', 7000, 'kg'),
  ('satuan', 5000, 'item'),
  ('meter', 15000, 'meter')
ON CONFLICT (service_type) DO NOTHING;

-- ============================================================
-- SEED: Data demo pelanggan
-- ============================================================
INSERT INTO customers (name, phone, address) VALUES
  ('Budi Santoso', '08123456789', 'Jl. Raya Gresik No. 12'),
  ('Siti Aminah', '08234567890', 'Jl. Sunan Giri No. 45'),
  ('Ahmad Fauzi', '08345678901', 'Jl. Veteran No. 78'),
  ('Dewi Rahayu', '08456789012', 'Jl. Kartini No. 23'),
  ('Hendra Wijaya', '08567890123', 'Jl. Diponegoro No. 56'),
  ('Ratna Sari', '08678901234', 'Jl. Pemuda No. 89'),
  ('Eko Prasetyo', '08789012345', 'Jl. Merdeka No. 34'),
  ('Fitri Handayani', '08890123456', 'Jl. Pahlawan No. 67')
ON CONFLICT DO NOTHING;
