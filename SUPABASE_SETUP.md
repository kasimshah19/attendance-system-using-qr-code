# ScanShift Attendance Portal — Supabase Setup Guide

Follow these steps in ORDER. Do not skip any step.

---

## STEP 1 — Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click **New Project**
3. Name it: `scanshift-attendance`
4. Set a strong database password (save it)
5. Choose a region closest to Pakistan (e.g., Singapore)
6. Wait for the project to finish provisioning (~2 minutes)

---

## STEP 2 — Run the Database Schema

Go to **SQL Editor** in your Supabase dashboard and run the following SQL **in one go**:

```sql
-- ════════════════════════════════════════════════════
--  ScanShift ATTENDANCE — DATABASE SCHEMA
--  Start Date: May 2026
-- ════════════════════════════════════════════════════

-- ── 1. PROFILES (Admin / Manager accounts) ──────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name    TEXT NOT NULL,
  role    TEXT NOT NULL CHECK (role IN ('admin', 'manager')) DEFAULT 'manager',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. EMPLOYEES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employees (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT    NOT NULL,
  start_time       TIME    NOT NULL,   -- e.g. 09:00:00
  end_time         TIME    NOT NULL,   -- e.g. 18:00:00
  late_grace_mins  INTEGER NOT NULL DEFAULT 30
                           CHECK (late_grace_mins >= 0 AND late_grace_mins <= 120),
  qr_token         TEXT    UNIQUE NOT NULL,
  created_by       UUID    REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_times CHECK (end_time > start_time)
);

-- ── 3. ATTENDANCE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id            UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date                   DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Check-in
  check_in_time          TIMESTAMPTZ,
  check_in_status        TEXT CHECK (check_in_status IN ('on_time', 'late')),
  late_reason            TEXT,

  -- Check-out
  check_out_time         TIMESTAMPTZ,
  check_out_status       TEXT CHECK (check_out_status IN ('on_time', 'early')),
  early_checkout_reason  TEXT,

  created_at             TIMESTAMPTZ DEFAULT NOW(),

  -- One record per employee per day
  UNIQUE(employee_id, date),

  -- Logical constraints
  CONSTRAINT chk_checkout_after_checkin
    CHECK (check_out_time IS NULL OR check_in_time IS NULL OR check_out_time > check_in_time),
  CONSTRAINT chk_late_reason
    CHECK (check_in_status != 'late' OR late_reason IS NOT NULL),
  CONSTRAINT chk_early_reason
    CHECK (check_out_status != 'early' OR early_checkout_reason IS NOT NULL)
);

-- ── 4. INDEXES ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_employees_qr_token   ON public.employees(qr_token);
CREATE INDEX IF NOT EXISTS idx_attendance_emp_date  ON public.attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date       ON public.attendance(date);
```

---

## STEP 3 — Enable Row Level Security + Policies

Run this SQL in the SQL Editor:

```sql
-- ════════════════════════════════════════════════════
--  ROW LEVEL SECURITY POLICIES
-- ════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- ── PROFILES policies ─────────────────────────────────
-- Users can only see and edit their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- ── EMPLOYEES policies ────────────────────────────────
-- Public (anon) can READ employees — needed for QR scan page
CREATE POLICY "employees_select_all"
  ON public.employees FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only authenticated (admin/manager) can INSERT employees
CREATE POLICY "employees_insert_auth"
  ON public.employees FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated can UPDATE employees
CREATE POLICY "employees_update_auth"
  ON public.employees FOR UPDATE
  TO authenticated
  USING (true);

-- Only authenticated can DELETE employees
CREATE POLICY "employees_delete_auth"
  ON public.employees FOR DELETE
  TO authenticated
  USING (true);

-- ── ATTENDANCE policies ───────────────────────────────
-- Anyone (anon + authenticated) can READ attendance — needed for scan state check
CREATE POLICY "attendance_select_all"
  ON public.attendance FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can INSERT attendance (employee QR scan creates the record)
CREATE POLICY "attendance_insert_all"
  ON public.attendance FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Anyone can UPDATE attendance (employee scans again to check out)
CREATE POLICY "attendance_update_all"
  ON public.attendance FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Only authenticated (admin/manager) can DELETE attendance records
CREATE POLICY "attendance_delete_auth"
  ON public.attendance FOR DELETE
  TO authenticated
  USING (true);
```

---

## STEP 4 — Auto-Create Profile on Signup (Trigger)

Run this SQL to automatically create a profile row when a new user signs up:

```sql
-- ════════════════════════════════════════════════════
--  TRIGGER: Auto-create profile on user signup
-- ════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'manager')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## STEP 5 — Create Admin and Manager Accounts

### Option A — Via Supabase Dashboard (Recommended)

1. Go to **Authentication → Users** in your Supabase dashboard
2. Click **Add User → Create new user**

**Create Admin (Zuhair Raza):**
- Email: `zuhair@ScanShiftmedia.com` (or any email you prefer)
- Password: Set a strong password
- Click **Create User**

**Create Manager (Hanzala Ajmeri):**
- Email: `hanzala@ScanShiftmedia.com` (or any email you prefer)
- Password: Set a strong password
- Click **Create User**

3. After creating both users, run this SQL to set their names and roles correctly:

```sql
-- ════════════════════════════════════════════════════
--  Set Admin & Manager profiles
--  Replace the emails below if you used different ones
-- ════════════════════════════════════════════════════

-- Set Zuhair Raza as ADMIN
UPDATE public.profiles
SET name = 'Zuhair Raza', role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'zuhair@ScanShiftmedia.com' LIMIT 1
);

-- Set Hanzala Ajmeri as MANAGER
UPDATE public.profiles
SET name = 'Hanzala Ajmeri', role = 'manager'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'hanzala@ScanShiftmedia.com' LIMIT 1
);

-- Verify (should return 2 rows)
SELECT p.name, p.role, u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id;
```

### Option B — Via SQL (Alternative)

If you prefer to create users via SQL directly, use the Supabase dashboard
**Authentication → Users → Add User** — SQL insertion into `auth.users` is not
supported directly; always use the Dashboard UI or the Admin API.

---

## STEP 6 — Get Your API Keys

1. Go to **Settings → API** in Supabase dashboard
2. Copy:
   - **Project URL** → this is your `VITE_SUPABASE_URL`
   - **anon public key** → this is your `VITE_SUPABASE_ANON_KEY`

---

## STEP 7 — Configure the App

In the project root, copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then fill in your values:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...your-anon-key...
VITE_APP_URL=http://localhost:5173
```

> ⚠ `VITE_APP_URL` is used to generate QR code URLs.
> In production, set it to your actual domain (e.g., `https://attendance.ScanShiftmedia.com`).

---

## STEP 8 — Install & Run

```bash
cd scanshift-attendance
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

---

## STEP 9 — First Login & Setup

1. Open the app and log in with Zuhair (admin) or Hanzala (manager)
2. Go to **Employees** → click **Add Employee**
3. Enter name, start time, end time → Save
4. Click the **QR** button on the employee row
5. Click **Print QR** to print and hand it to the employee

---



---

## UPDATE — If you already ran the old schema (add flexible grace column)

If you set up the database before this update, run this one-time migration:

```sql
-- Add late_grace_mins to existing employees table
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS late_grace_mins INTEGER NOT NULL DEFAULT 30
  CHECK (late_grace_mins >= 0 AND late_grace_mins <= 120);
```

---

## Schema Reference

### `profiles`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | References auth.users |
| name | TEXT | Full name |
| role | TEXT | `admin` or `manager` |
| created_at | TIMESTAMPTZ | Timestamp |

### `employees`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Full name |
| start_time | TIME | Shift start e.g. `09:00:00` |
| end_time | TIME | Shift end e.g. `18:00:00` |
| late_grace_mins | INTEGER | Grace period before marking late (0–120 mins, default 30) |
| end_time | TIME | Shift end e.g. `18:00:00` |
| qr_token | TEXT | Unique UUID used in QR URL |
| created_by | UUID | Creator's auth user ID |
| created_at | TIMESTAMPTZ | When added |

### `attendance`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| employee_id | UUID | FK → employees |
| date | DATE | The calendar date |
| check_in_time | TIMESTAMPTZ | Full timestamp of check-in |
| check_in_status | TEXT | `on_time` or `late` |
| late_reason | TEXT | Required if status = `late` |
| check_out_time | TIMESTAMPTZ | Full timestamp of check-out |
| check_out_status | TEXT | `on_time` or `early` |
| early_checkout_reason | TEXT | Required if status = `early` |
| created_at | TIMESTAMPTZ | Record creation time |

---

## Business Rules Summary

| Rule | Value |
|------|-------|
| Late grace period | 30 minutes after start_time |
| Checkout lock (min time in office) | 2 hours after check-in |
| Early checkout threshold | 30 minutes before end_time |
| QR code expiry | Never (unless employee is deleted) |
| Attendance period starts | May 2026 |
| Records per employee per day | Max 1 (unique constraint) |

---

## Troubleshooting

**QR scan shows "Invalid QR Code"**
→ Make sure `VITE_APP_URL` is set correctly in `.env`

**Login fails**
→ Check Supabase Auth is enabled (Authentication → Settings → Enable email provider)

**Profile not found after login**
→ Run the trigger SQL again (Step 4), then re-create the user

**RLS blocking reads**
→ Verify all policies in Step 3 were applied. Go to Supabase → Table Editor → employees → Policies

**For production deployment (Vercel / Netlify)**
→ Set `VITE_APP_URL` to your production URL in the platform's environment variables
→ Update Supabase → Authentication → URL Configuration with your production domain
