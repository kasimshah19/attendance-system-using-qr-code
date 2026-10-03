# Component Hierarchy Diagram

This diagram visualizes the React component structure for the ScanShift Attendance System.

```mermaid
graph TD
    App["App.jsx (React Router)"]
    
    %% Main Pages
    App --> Login["Login.jsx"]
    App --> Scan["Scan.jsx"]
    App --> AdminLayout["AdminLayout.jsx (Protected)"]
    
    %% Admin Routes
    AdminLayout --> Dashboard["Dashboard.jsx"]
    AdminLayout --> Employees["Employees.jsx"]
    AdminLayout --> Attendance["Attendance.jsx"]
    
    %% Dashboard Components
    Dashboard --> StatCard["StatCard (Reusable)"]
    Dashboard --> LateTable["Late Arrivals Table"]
    Dashboard --> LiveFeed["Today's Activity Feed"]
    
    %% Scan Page Sub-Components
    Scan --> ScannerState["State: Loading / Done / Check-In / Check-Out"]
    Scan --> LiveClock["LiveClock"]
    Scan --> SuccessModal["SuccessCheckIn / SuccessCheckOut"]
    
    %% Employee Management
    Employees --> EmployeeModal["Add/Edit Employee Modal"]
    Employees --> QRModal["QR Code Viewer Modal"]
    
    %% Styling
    classDef page fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    classDef layout fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff
    classDef comp fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    
    App:::page
    AdminLayout:::layout
    Login:::page
    Scan:::page
    Dashboard:::page
    Employees:::page
    Attendance:::page
    StatCard:::comp
    EmployeeModal:::comp
    QRModal:::comp
    ScannerState:::comp
```

## 📝 Detailed Explanation
- **Routing Level (`App.jsx`):** Handles all browser URLs. Unauthenticated users can only view `Login` or `Scan`.
- **Admin Layout (`AdminLayout.jsx`):** Acts as a wrapper. It checks if a valid Supabase session exists. If not, it kicks the user back to the login page. It also holds the Sidebar navigation.
- **Scan Page (`Scan.jsx`):** It is deeply dynamic and contains many smaller sub-components (like `LiveClock` and `SuccessCheckIn`) that render conditionally based on the scan's context.
