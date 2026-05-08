/*
  # Fix RLS Policies

  1. Problem
    - "Owner bisa lihat semua profil" policy on profiles table uses a self-referencing
      subquery (SELECT FROM profiles WHERE...) which causes infinite recursion when
      fetching a user's own profile, resulting in null profile being returned.
    - customers and orders SELECT policies use USING (true) allowing unauthenticated access.

  2. Changes
    - Drop the recursive profiles SELECT policy (self-referencing)
    - The existing "Pengguna bisa lihat profil sendiri" (auth.uid() = id) is sufficient
    - Fix customers SELECT to require authentication
    - Fix orders SELECT to require authentication
    - Fix order_audit_log SELECT to require authentication
*/

-- Drop the self-referencing recursive policy on profiles
DROP POLICY IF EXISTS "Owner bisa lihat semua profil" ON profiles;

-- Fix customers SELECT - require authentication instead of true
DROP POLICY IF EXISTS "Pengguna terautentikasi bisa lihat pelanggan" ON customers;
CREATE POLICY "Pengguna terautentikasi bisa lihat pelanggan"
  ON customers FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix orders SELECT - require authentication
DROP POLICY IF EXISTS "Pengguna terautentikasi bisa lihat order" ON orders;
CREATE POLICY "Pengguna terautentikasi bisa lihat order"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix order_audit_log SELECT - require authentication
DROP POLICY IF EXISTS "Pengguna terautentikasi bisa lihat log" ON order_audit_log;
CREATE POLICY "Pengguna terautentikasi bisa lihat log"
  ON order_audit_log FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);
