# ScanShift Comprehensive Test Cases

This document outlines the end-to-end test cases for the ScanShift Attendance System. It covers Authentication, Dashboard Management, and the Employee QR Scanning workflow.

---

## 1. Authentication & Security (Admin)

| Test ID | Scenario | Steps to Reproduce | Expected Result | Pass/Fail |
|---------|----------|--------------------|-----------------|-----------|
| **AUTH-01** | Valid Login | 1. Go to `/login`<br>2. Enter correct email & password.<br>3. Click Login. | Redirected to `/dashboard`. Session is saved in browser. | [ ] |
| **AUTH-02** | Invalid Login | 1. Go to `/login`<br>2. Enter incorrect password.<br>3. Click Login. | Error message "Invalid login credentials". Not redirected. | [ ] |
| **AUTH-03** | Route Protection | 1. Open an incognito window.<br>2. Navigate directly to `/dashboard`. | Automatically redirected back to `/login`. | [ ] |
| **AUTH-04** | Logout | 1. While logged in, click "Sign Out" in the sidebar.<br>2. Try navigating back to `/dashboard`. | Session cleared, redirected to `/login`. Direct navigation blocked. | [ ] |

---

## 2. Dashboard & Employee Management

| Test ID | Scenario | Steps to Reproduce | Expected Result | Pass/Fail |
|---------|----------|--------------------|-----------------|-----------|
| **EMP-01** | Add New Employee | 1. Go to `/employees`.<br>2. Click "Add Employee".<br>3. Fill name, start time (09:00), end time (18:00), grace (30).<br>4. Click Save. | Employee appears in the list instantly. Real-time sync works. | [ ] |
| **EMP-02** | View QR Code | 1. Click the QR code icon next to a newly added employee. | A modal opens displaying the QR Code and the underlying URL. | [ ] |
| **EMP-03** | Delete Employee | 1. Click the trash icon next to an employee.<br>2. Confirm deletion. | Employee is removed from the list and database. | [ ] |
| **DASH-01** | Live Feed Updates | 1. Keep Dashboard open on PC.<br>2. Scan an employee's QR on phone. | Dashboard "Today's Activity" table updates instantly without refresh. | [ ] |

---

## 3. QR Scan Workflow (Check-In)

*Pre-requisite: Add an employee with Start Time: 09:00, End Time: 18:00, Grace: 30.*

| Test ID | Scenario | Steps to Reproduce | Expected Result | Pass/Fail |
|---------|----------|--------------------|-----------------|-----------|
| **SCAN-IN-01** | On-Time Check-In | 1. Set phone clock to **09:15 AM**.<br>2. Scan QR.<br>3. Click "Check-In". | Success modal appears. Status logged as `on_time`. No reason asked. | [ ] |
| **SCAN-IN-02** | Late Check-In | 1. Set phone clock to **09:45 AM** (past grace).<br>2. Scan QR. | UI prompts "You are late. Reason required." | [ ] |
| **SCAN-IN-03** | Late Check-In Submission | 1. Continue from SCAN-IN-02.<br>2. Enter reason.<br>3. Submit. | Success modal appears. Status logged as `late` with the given reason. | [ ] |
| **SCAN-IN-04** | Invalid QR Token | 1. Manually open `scanshift.com/scan/invalid-uuid`. | UI shows "Invalid or Expired QR Code". | [ ] |

---

## 4. QR Scan Workflow (Check-Out)

*Pre-requisite: Employee must already have a Check-In record for today.*

| Test ID | Scenario | Steps to Reproduce | Expected Result | Pass/Fail |
|---------|----------|--------------------|-----------------|-----------|
| **SCAN-OUT-01** | Too Soon Lock (Anti-spam) | 1. Scan QR just 5 minutes after checking in. | UI shows "Too early to check out. Please wait 2 hours." Button is disabled. | [ ] |
| **SCAN-OUT-02** | Early Check-Out | 1. Check in at 09:00 AM.<br>2. Set phone clock to **16:00 (4:00 PM)**.<br>3. Scan QR. | UI prompts "Leaving early. Reason required." | [ ] |
| **SCAN-OUT-03** | Early Check-Out Submission | 1. Continue from SCAN-OUT-02.<br>2. Enter reason.<br>3. Submit. | Success modal appears. Status logged as `early` with the reason. | [ ] |
| **SCAN-OUT-04** | On-Time Check-Out | 1. Check in at 09:00 AM.<br>2. Set phone clock to **18:05 (6:05 PM)**.<br>3. Scan QR. | UI allows free check-out. Status logged as `on_time`. | [ ] |

---

## 5. Edge Cases & Constraints

| Test ID | Scenario | Steps to Reproduce | Expected Result | Pass/Fail |
|---------|----------|--------------------|-----------------|-----------|
| **EDGE-01** | Double Scan (Day Complete) | 1. Complete a Check-In and Check-Out.<br>2. Scan the QR code a 3rd time on the same day. | UI shows "You have already completed your shift for today. Have a great day!" | [ ] |
| **EDGE-02** | Next Day Reset | 1. Complete a shift on Monday.<br>2. Scan the same QR code on Tuesday morning. | System correctly identifies it's a new day and prompts for a fresh Check-In. | [ ] |
| **EDGE-03** | Missing Token | 1. Open `/scan` without any query parameters. | UI safely handles it and shows the Invalid QR screen instead of crashing. | [ ] |
| **EDGE-04** | Network Disconnect | 1. Scan QR.<br>2. Turn off internet (Airplane mode).<br>3. Click Check-In. | System gracefully catches the Supabase error and shows an alert "Network error, please try again." | [ ] |
