# MZR Media — Attendance Portal

A dark-themed, QR-based employee attendance management system built with **React + Vite + Supabase**.

## Features

- 🔐 **Admin & Manager login** (Supabase Auth)
- 👥 **Employee management** — Add, edit, delete, view QR
- 📱 **QR Code generation** — Print or download per employee
- ⏱ **Smart check-in logic** — On-time / Late (with reason)
- 🚪 **Smart check-out logic** — Normal / Early (with reason)
- 📅 **Day & Month views** — Filter and export attendance CSV
- 🚫 **2-hour checkout lock** — Prevents accidental re-scans
- 📊 **Dashboard** — Live stats, today's activity feed

## Business Rules

| Rule | Setting |
|------|---------|
| Late threshold | 30 mins after shift start |
| Checkout lock | 2 hours after check-in |
| Free checkout window | Within 30 mins of shift end |
| QR code validity | Permanent (until employee deleted) |

## Tech Stack

- **Frontend**: React 18, Vite 5, Framer Motion, React Router v6
- **QR Codes**: qrcode.react
- **Dates**: date-fns
- **Backend**: Supabase (PostgreSQL + Auth + RLS)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Fill in your Supabase URL and anon key

# 3. Set up Supabase (see SUPABASE_SETUP.md)

# 4. Run development server
npm run dev
```

See **SUPABASE_SETUP.md** for the complete backend setup guide.

## Project Structure

```
src/
├── context/
│   └── AuthContext.jsx     # Auth state & signIn/signOut
├── components/
│   ├── Layout.jsx          # Sidebar + main shell
│   ├── ProtectedRoute.jsx  # Auth guard
│   └── QRModal.jsx         # QR viewer + print/download
├── pages/
│   ├── Login.jsx           # Admin/Manager sign-in
│   ├── Dashboard.jsx       # Stats + today's activity
│   ├── Employees.jsx       # CRUD + QR generation
│   ├── Attendance.jsx      # Records table (day/month)
│   └── Scan.jsx            # Public QR scan page
└── lib/
    └── supabase.js         # Supabase client
```

## Accounts

| Name | Role |
|------|------|
| Zuhair Raza | Admin |
| Hanzala Ajmeri | Manager |

Set up via Supabase Auth dashboard — see `SUPABASE_SETUP.md` Step 5.
