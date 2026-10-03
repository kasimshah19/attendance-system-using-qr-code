# API & Data Flow Diagram

This diagram visualizes how data flows between the user interfaces and the database tables.

```mermaid
graph LR
    subgraph Client Interfaces
        AdminUI[Admin Dashboard]
        EmployeeUI[Scan Interface]
    end

    subgraph Supabase APIs
        AuthAPI[Auth Endpoint /v1]
        RestAPI[PostgREST API /rest/v1]
    end

    subgraph Database Tables
        Profiles[(profiles)]
        Employees[(employees)]
        Attendance[(attendance)]
    end

    AdminUI -- "Login" --> AuthAPI
    AdminUI -- "Fetch Stats" --> RestAPI
    EmployeeUI -- "Submit Record" --> RestAPI

    RestAPI -- "Read/Write" --> Profiles
    RestAPI -- "Read/Write" --> Employees
    RestAPI -- "Read/Write" --> Attendance

    Employees -- "1:M" --> Attendance
    Profiles -- "1:M" --> Employees
```

## 📝 Detailed Explanation
- **PostgREST API:** Supabase automatically turns the PostgreSQL database into a REST API. We don't have to write backend Node.js or Python code.
- **Relational Integrity:** The `attendance` table relies entirely on the `employees` table. Without an employee ID, an attendance record cannot exist.
- **Decoupled Architecture:** The client UI only knows how to talk to the API. It has no direct database connection string, ensuring security and modularity.
