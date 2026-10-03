# 🧪 ScanShift Attendance System - Testing Guide

Welcome to the testing guide for the ScanShift Attendance System. Below you will find the necessary credentials and steps to test the application features.

## 🔐 Test Credentials

Use the following credentials to log in to the admin/manager portal:

| Role | Email Address | Password |
| :--- | :--- | :--- |
| **Admin** | `kasimshah998@gmail.com` | `Kasim@2003` |
| **Manager** | `manager@scanshift.com` | `[Aapne jo rakha tha]` |

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
Employees **do not** have login access to the dashboard. They interact with the system only via scanning.
- **Scan Access:** Can only scan their printed QR code using a mobile phone.
- **Check-in / Check-out:** Scanning the code opens a secure web page where they tap a button to mark their attendance.
- **Rules Applied:** The system automatically calculates if they are `on_time`, `late`, or checking out `early` based on their assigned shift timings and grace period.
