# System Architecture Diagram

This diagram represents the high-level architecture of the ScanShift Attendance System, showing how the frontend interacts with the Supabase backend and authentication.

```mermaid
graph TD
    %% Define styles
    classDef frontend fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff,rx:8px,ry:8px;
    classDef backend fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff,rx:8px,ry:8px;
    classDef actor fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff,rx:20px,ry:20px;
    
    %% Actors
    Admin["👨‍💼 Admin / Manager"]:::actor
    Employee["👨‍💻 Employee"]:::actor
    
    %% Frontend Components
    subgraph Frontend ["Frontend App (React + Vite + Netlify)"]
        Dashboard["📊 Admin Dashboard (React)"]:::frontend
        ScanPage["📱 QR Scan Page (React)"]:::frontend
    end
    
    %% Backend Services (Supabase)
    subgraph Supabase ["Supabase Backend (BaaS)"]
        Auth["🔑 Authentication (GoTrue)"]:::backend
        DB["🗄️ PostgreSQL Database"]:::backend
        Realtime["⚡ Real-Time Sync (WebSockets)"]:::backend
    end
    
    %% Relationships
    Admin -- "Logs in via" --> Auth
    Admin -- "Manages Data" --> Dashboard
    Employee -- "Scans QR Code" --> ScanPage
    
    Dashboard -- "CRUD Operations" --> DB
    Dashboard -- "Subscribes to updates" --> Realtime
    
    ScanPage -- "Inserts/Updates Attendance" --> DB
    
    DB -- "Triggers changes" --> Realtime
```

## 📝 Detailed Explanation

### 1. Frontend Layer (React + Vite)
- **Admin Dashboard:** This is a protected route. Only authenticated Admins and Managers can access this. It communicates with the database to fetch employee lists, generate QR codes, and view real-time attendance logs.
- **QR Scan Page:** This is a public-facing page that does NOT require authentication. When an employee scans their unique QR code, it loads this page with their secure token to process their check-in/check-out.

### 2. Backend Layer (Supabase)
- **Authentication:** Handles Admin/Manager logins. Ensures that unauthorized people cannot access the dashboard or delete attendance records.
- **PostgreSQL Database:** The core of the system. It stores profiles, employees, and attendance records securely using Row Level Security (RLS). RLS guarantees that the public scan page can only insert attendance records but cannot view the full list of employees or delete records.
- **Real-Time Sync:** When an employee scans a QR code and inserts a record into the DB, Supabase sends a real-time WebSocket event. The Admin Dashboard listens to this and updates the screen instantly without needing a page refresh.
