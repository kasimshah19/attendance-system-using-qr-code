# User Flow Diagrams

These diagrams explain how different types of users interact with the ScanShift system.

## 1. Manager / Admin Flow

This diagram shows how a manager adds a new employee and gets the QR code.

```mermaid
sequenceDiagram
    actor Manager as 👨‍💼 Manager
    participant Dashboard as 📊 Web Dashboard
    participant Supabase as 🗄️ Supabase DB
    
    Manager->>Dashboard: 1. Logs into the system
    Dashboard->>Supabase: 2. Authenticates credentials
    Supabase-->>Dashboard: 3. Returns Session Token
    Manager->>Dashboard: 4. Navigates to "Employees" Tab
    Manager->>Dashboard: 5. Fills "Add Employee" form (Name, Shift time)
    Dashboard->>Supabase: 6. Inserts Employee & Generates Unique Token
    Supabase-->>Dashboard: 7. Returns Employee ID & Token
    Dashboard-->>Manager: 8. Displays Employee Row
    Manager->>Dashboard: 9. Clicks "View QR"
    Dashboard-->>Manager: 10. Shows printable QR Code containing token URL
```

### 📝 Detailed Explanation (Manager Flow)
1. **Login & Security:** The manager must authenticate. Without authentication, they cannot access the dashboard or insert an employee.
2. **Employee Creation:** When creating an employee, the dashboard automatically generates a completely unique UUID (Universal Unique Identifier) called `qr_token`.
3. **QR Generation:** The dashboard takes the `qr_token` and creates a URL (e.g., `scanshift.com/scan/1234-abcd`). It then turns this URL into a scannable QR image for the manager to print.

---

## 2. Employee Scan Flow (Check-In)

This diagram shows what happens when an employee scans the QR code.

```mermaid
sequenceDiagram
    actor Employee as 👨‍💻 Employee
    participant Phone as 📱 Phone Browser
    participant App as 🌐 Scan Page UI
    participant Supabase as 🗄️ Supabase DB
    
    Employee->>Phone: 1. Scans QR Code using camera
    Phone->>App: 2. Opens URL containing secret token
    App->>Supabase: 3. Fetches employee info using token
    Supabase-->>App: 4. Returns employee details & today's attendance status
    
    alt If not checked in today
        App-->>Employee: 5a. Shows "Tap to Check In"
        Employee->>App: 6a. Taps "Check In"
        App->>Supabase: 7a. Inserts new attendance record with timestamp
        Supabase-->>App: 8a. Confirm success
        App-->>Employee: 9a. Shows "Checked In Successfully"
    else If already checked in
        App-->>Employee: 5b. Shows "Already Checked In / Ready to Check Out"
    end
```

### 📝 Detailed Explanation (Employee Flow)
1. **Frictionless Entry:** The employee doesn't type a URL or enter a password. Their native camera app decodes the URL and opens the browser automatically.
2. **Identity Verification:** The frontend extracts the `token` from the URL and securely asks the database, "Who does this token belong to?". The database returns the employee details.
3. **State Management:** The frontend checks the database to see if this person already has a record for *today*. 
    - If no record exists, it prompts for **Check-In**.
    - If a record exists but check-out is empty, it prompts for **Check-Out** (unless the 2-hour safety lock is active).
    - If both exist, it shows **Done for today**.
