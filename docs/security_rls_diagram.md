# Security & Row Level Security (RLS) Diagram

This diagram explains how Supabase secures data so that the public Scan Page can write data, but cannot read sensitive data or delete records.

```mermaid
graph TD
    %% Request Types
    PublicScan["📱 Public Scan Page (No Login)"]
    AdminDash["📊 Admin Dashboard (Logged In)"]
    
    %% Policies
    subgraph RLS ["PostgreSQL Row Level Security (RLS)"]
        InsertPolicy{"Policy: Insert Attendance"}
        SelectPolicy{"Policy: Read Attendance"}
        DeletePolicy{"Policy: Delete Attendance"}
    end
    
    %% Database Table
    DB[(Attendance Table)]
    
    %% Scan Page rules
    PublicScan -- "Tries to INSERT" --> InsertPolicy
    InsertPolicy -- "Allowed (Public)" --> DB
    
    PublicScan -- "Tries to SELECT all" --> SelectPolicy
    SelectPolicy -- "Denied (Not authenticated)" --> x1[Blocked]
    
    %% Admin rules
    AdminDash -- "Tries to SELECT" --> SelectPolicy
    SelectPolicy -- "Allowed (Authenticated)" --> DB
    
    AdminDash -- "Tries to DELETE" --> DeletePolicy
    DeletePolicy -- "Allowed (Authenticated)" --> DB
    
    classDef block fill:#ef4444,color:white
    classDef allow fill:#22c55e,color:white
    x1:::block
    DB:::allow
```

## 📝 Detailed Explanation
- **Row Level Security (RLS)** is a feature of PostgreSQL that checks permissions on a row-by-row basis before executing a query.
- **The Public Problem:** Because the QR code is scanned on personal phones without login, the API key must be public. If a hacker got the API key, could they download all employee records?
- **The RLS Solution:** We wrote strict policies. The policy for inserting is public (so anyone with a valid QR token can insert a record). However, the policy for reading the whole table requires a valid JWT token from a logged-in admin. Therefore, the data is completely safe from public extraction.
