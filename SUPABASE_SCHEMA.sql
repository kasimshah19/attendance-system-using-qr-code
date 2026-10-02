-- ============================================================
-- MZR MEDIA ATTENDANCE PORTAL - SUPABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: users (admin & manager accounts)
-- These are synced with Supabase Auth
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: employees
-- ============================================================
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  department TEXT,
  position TEXT,
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: employee_qr_codes
-- One QR per employee, permanent until deleted
-- ============================================================
CREATE TABLE IF NOT EXISTS public.employee_qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  scan_url TEXT NOT NULL,
  qr_image TEXT, -- base64 data URL of QR image
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_qr_per_employee UNIQUE (employee_id)
);

-- ============================================================
-- TABLE: attendance_logs
-- One log per employee per day
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  status TEXT CHECK (status IN ('on_time', 'late', 'early_checkout', 'checked_out')),
  late_reason TEXT,
  early_checkout_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast date-range queries
CREATE INDEX IF NOT EXISTS idx_attendance_logs_employee_date
  ON public.attendance_logs(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_date
  ON public.attendance_logs(date);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_check_in
  ON public.attendance_logs(check_in_time);

-- ============================================================
-- UPDATED_AT triggers
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER attendance_logs_updated_at
  BEFORE UPDATE ON public.attendance_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- users: only authenticated users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- employees: authenticated users (admin/manager) can CRUD
CREATE POLICY "Authenticated users can read employees"
  ON public.employees FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert employees"
  ON public.employees FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update employees"
  ON public.employees FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete employees"
  ON public.employees FOR DELETE
  USING (auth.role() = 'authenticated');

-- employee_qr_codes: authenticated users can CRUD; anonymous can read (for scan)
CREATE POLICY "Authenticated users can manage QR codes"
  ON public.employee_qr_codes FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can read QR codes (for scan page)"
  ON public.employee_qr_codes FOR SELECT
  USING (true);

-- attendance_logs: authenticated users can CRUD; anonymous can insert+update (for scan)
CREATE POLICY "Authenticated users can read all logs"
  ON public.attendance_logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert logs"
  ON public.attendance_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update logs"
  ON public.attendance_logs FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Allow anonymous scan (QR scan page doesn't log in)
CREATE POLICY "Anyone can insert attendance log"
  ON public.attendance_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update attendance log"
  ON public.attendance_logs FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can read today's log"
  ON public.attendance_logs FOR SELECT
  USING (true);

-- employees read for scan page
CREATE POLICY "Anyone can read active employees"
  ON public.employees FOR SELECT
  USING (true);

-- ============================================================
-- SEED DATA: Admin and Manager users
-- Step 1: Create users in Supabase Auth Dashboard (Authentication > Users)
--   Admin:   email: zuhair@mzrmedia.com   password: Admin@MZR2026
--   Manager: email: hanzala@mzrmedia.com  password: Manager@MZR2026
--
-- Step 2: After creating auth users, run this INSERT with their actual UUIDs
-- Replace 'ADMIN_UUID_HERE' and 'MANAGER_UUID_HERE' with real UUIDs from auth.users
-- ============================================================

-- INSERT INTO public.users (id, email, full_name, role) VALUES
--   ('ADMIN_UUID_HERE', 'zuhair@mzrmedia.com', 'Zuhair Raza', 'admin'),
--   ('MANAGER_UUID_HERE', 'hanzala@mzrmedia.com', 'Hanzala Ajmeri', 'manager');

-- ============================================================
-- SAMPLE EMPLOYEES (optional - uncomment to add test data)
-- ============================================================

-- INSERT INTO public.employees (name, email, department, position, start_time, end_time) VALUES
--   ('Ali Hassan', 'ali@mzrmedia.com', 'Design', 'UI Designer', '09:00', '18:00'),
--   ('Sara Ahmed', 'sara@mzrmedia.com', 'Marketing', 'Content Writer', '09:00', '18:00'),
--   ('Bilal Khan', 'bilal@mzrmedia.com', 'Engineering', 'Developer', '10:00', '19:00'),
--   ('Fatima Malik', 'fatima@mzrmedia.com', 'Operations', 'Project Manager', '09:00', '18:00');

-- ============================================================
-- HELPFUL VIEWS
-- ============================================================

-- Today's attendance summary view
CREATE OR REPLACE VIEW today_attendance AS
SELECT
  e.id AS employee_id,
  e.name,
  e.department,
  e.position,
  e.start_time,
  e.end_time,
  al.id AS log_id,
  al.check_in_time,
  al.check_out_time,
  al.status,
  al.late_reason,
  al.early_checkout_reason,
  CASE WHEN al.id IS NULL THEN 'absent' ELSE al.status END AS today_status
FROM public.employees e
LEFT JOIN public.attendance_logs al
  ON al.employee_id = e.id AND al.date = CURRENT_DATE
WHERE e.is_active = true
ORDER BY e.name;

-- Monthly attendance summary view
CREATE OR REPLACE VIEW monthly_attendance_summary AS
SELECT
  e.id AS employee_id,
  e.name,
  e.department,
  DATE_TRUNC('month', al.date) AS month,
  COUNT(*) AS total_days,
  COUNT(*) FILTER (WHERE al.status = 'on_time') AS on_time_days,
  COUNT(*) FILTER (WHERE al.status = 'late') AS late_days,
  COUNT(*) FILTER (WHERE al.status IN ('early_checkout')) AS early_checkout_days
FROM public.employees e
JOIN public.attendance_logs al ON al.employee_id = e.id
GROUP BY e.id, e.name, e.department, DATE_TRUNC('month', al.date)
ORDER BY month DESC, e.name;
