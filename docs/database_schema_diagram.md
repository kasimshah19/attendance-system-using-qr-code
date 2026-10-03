# Database Schema Diagram

This Entity-Relationship (ER) diagram visualizes the Supabase PostgreSQL database structure.

```mermaid
erDiagram
    PROFILES ||--|| AUTH_USERS : "extends"
    PROFILES {
        uuid id PK "Matches auth.users id"
        text name "Full name of admin/manager"
        text role "Role: admin or manager"
        timestamptz created_at
    }

    EMPLOYEES ||--o{ ATTENDANCE : "has many"
    EMPLOYEES }|--|| AUTH_USERS : "created by"
    EMPLOYEES {
        uuid id PK "Primary Key"
        text name "Employee Name"
        time start_time "Expected shift start"
        time end_time "Expected shift end"
        int late_grace_mins "Grace period in minutes"
        text qr_token UK "Unique secret token for QR URL"
        uuid created_by FK "Admin/Manager who added this"
        timestamptz created_at
    }

    ATTENDANCE {
        uuid id PK "Primary Key"
        uuid employee_id FK "References EMPLOYEES"
        date date "Attendance Calendar Date"
        
        timestamptz check_in_time "Exact time of check in"
        text check_in_status "Enum: 'on_time' or 'late'"
        text late_reason "Provided if late"
        
        timestamptz check_out_time "Exact time of check out"
        text check_out_status "Enum: 'on_time' or 'early'"
        text early_checkout_reason "Provided if early"
        
        timestamptz created_at
    }
```

## 📝 Detailed Explanation

### 1. `profiles` Table
- **Purpose:** Enhances the built-in Supabase `auth.users` table. While `auth.users` handles secure passwords and emails, `profiles` stores the user's readable name and role (Admin vs Manager).
- **Security:** RLS ensures only logged-in users can read their own profile.

### 2. `employees` Table
- **Purpose:** Stores the core data of the staff members who will be scanning QR codes.
- **Key Columns:** 
  - `start_time` and `end_time` define the specific shift hours for the employee.
  - `late_grace_mins` provides a flexible buffer (e.g., 30 mins) before the system marks them as "Late".
  - `qr_token` is the highly sensitive unique identifier. It is mathematically random (UUID) so it cannot be guessed by outsiders.
- **Relationships:** It links to the `auth.users` table so we know which manager created the employee profile.

### 3. `attendance` Table
- **Purpose:** The transactional table that logs daily activity.
- **Constraints:**
  - A `UNIQUE` constraint on `(employee_id, date)` ensures that an employee can only have **one attendance record per day**.
  - A `CHECK` constraint guarantees that `check_out_time` cannot be earlier than `check_in_time`.
  - Conditional constraints ensure that if the status is marked as 'late', a `late_reason` **must** be provided.
- **Flexibility:** It separates the `date` (used for grouping and charting) from the precise `check_in_time` (used for calculating exactly how late someone was).
