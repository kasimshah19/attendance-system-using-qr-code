# 🧪 ScanShift Attendance System - Testing Guide

Welcome to the testing guide for the ScanShift Attendance System. Below you will find the necessary credentials and steps to test the application features.

## 🔐 Test Credentials

Use the following credentials to log in to the admin/manager portal:

| Role | Email Address | Password |
| :--- | :--- | :--- |
| **Admin** | `kasimshah998@gmail.com` | `Kasim@2003` |
| **Manager** | `manager@scanshift.com` | `Manager@2026` |

---

## 🚀 How to Test

1. **Open the Live URL:** Go to [https://scanshift-attendance-system.netlify.app](https://scanshift-attendance-system.netlify.app)
2. **Login:** Enter the Admin email and password provided in the table above.
3. **Dashboard:** Once logged in, you will see the main dashboard with statistics.
4. **Manage Employees:** Navigate to the 'Employees' section to add, edit, or remove staff members.
5. **QR Code:** Generate or view the QR code that employees will scan to mark their attendance.
6. **Attendance Records:** Check the 'Attendance' tab to see logs of scanned entries.

> **Note:** If you face any login issues, ensure that the above user exists in your Supabase Authentication dashboard and has the appropriate role.

---

## 👥 Roles & Permissions

Here is the exact breakdown of what each role does and what permissions they have:

### 1. 👑 Admin & Manager (Authenticated Users)
In the current system, **Admin** and **Manager** both have identical full access to the portal.
- **Login:** Can log in to the web dashboard.
- **Dashboard View:** Can view total employees, today's attendance, on-time, and late statistics.
- **Manage Employees:** Can **Add**, **Edit**, and **Delete** employees.
- **Generate QR Code:** Can view and print the unique QR code for any employee.
- **Manage Attendance:** Can view all attendance logs, and have the permission to manually delete a record if needed.

### 2. 👨‍💻 Employee (Unauthenticated / Scanner)
Employees **do not** have login access to the dashboard, nor do they need to download any application. They interact with the system entirely without needing passwords or accounts.

#### How the App-Less Workflow Operates:
- **No App or Signup Required:** The biggest advantage of this system is that staff do not need to download a mobile app, sign up, or remember passwords.
- **Unique QR Generation:** Whenever an admin/manager adds a new employee on the dashboard, the system automatically generates a unique QR code for them. This QR code holds a secure, encrypted token.
- **Distribution:** The manager can print this QR code and paste it on the employee's ID card, their work desk, or simply share it via WhatsApp.
- **Daily Scanning:** To mark attendance, the employee simply opens their standard smartphone camera (or any generic QR scanner) and scans their assigned QR code.
- **One-Tap Attendance:** Scanning the code opens a secure web link tailored specifically for that employee. The system automatically identifies the employee via the secret token in the URL. They just tap "Check In" or "Check Out", and their attendance is instantly logged on the manager's live dashboard.
- **Rules Applied:** The system automatically calculates if they are `on_time`, `late`, or checking out `early` based on their assigned shift timings and grace period.

---

## 🌍 Geolocation Security (Fake Attendance Prevention)

### The Loophole
Because the system is app-less and relies entirely on scanning a printed QR code containing a secure token, an employee could theoretically take a picture of their ID card and scan it from home or while commuting to mark "fake attendance."

### The Solution: GPS Map Restriction
To prevent off-site check-ins, we implemented **Geolocation Tracking** leveraging the HTML5 Geolocation API and the **Haversine formula**.

#### How it works:
1. **Coordinates & Radius:** The system administrator defines the exact office GPS coordinates (`VITE_OFFICE_LAT`, `VITE_OFFICE_LNG`) and an allowable scanning radius (`VITE_OFFICE_RADIUS`, e.g., 100 meters) inside the environment variables (`.env`).
2. **Permission Request:** When an employee scans their code and taps "Check In", their phone prompts for Location Permission.
3. **Distance Calculation:** If allowed, the web app captures their current GPS coordinates and calculates the exact distance between the employee and the office using the mathematical Haversine formula (which accounts for the Earth's curvature).
4. **Validation:** 
   - If the distance is **within** the allowed 100-meter radius, attendance is successfully marked.
   - If the distance is **outside** the radius, check-in is blocked with an error: *"You are [X] meters away. You must be inside the office."*
   - If GPS permission is denied, check-in is completely blocked.

This effectively forces physical presence at the office without needing a complex biometric device.
