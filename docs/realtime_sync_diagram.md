# Real-Time WebSocket Sync Diagram

This diagram explains how the admin dashboard updates instantly when an employee checks in, without the admin needing to refresh the page.

```mermaid
sequenceDiagram
    participant ScanPage as Employee Phone (Scan.jsx)
    participant DB as Supabase PostgreSQL
    participant Realtime as Supabase Realtime (WebSockets)
    participant Dashboard as Admin PC (Dashboard.jsx)
    
    Dashboard->>Realtime: 1. Subscribes to 'attendance' table changes on load
    
    ScanPage->>DB: 2. Employee clicks "Check-in" (INSERT record)
    DB->>Realtime: 3. Database Trigger fires on INSERT
    Realtime-->>Dashboard: 4. Pushes new record data via WebSocket
    
    Dashboard->>Dashboard: 5. React updates State
    Dashboard-->>Dashboard: 6. UI Re-renders with new employee row instantly
```

## 📝 Detailed Explanation
1. **Subscription:** When the Admin opens the dashboard, the React app uses the Supabase client to open a continuous WebSocket connection to the server, saying "tell me if anything changes in the `attendance` table".
2. **Action:** An employee far away scans their code and checks in.
3. **Database Event:** The PostgreSQL database successfully saves the row.
4. **Broadcast:** Supabase's built-in Realtime engine detects the database change and immediately broadcasts a JSON payload to all connected WebSocket clients (the admin dashboard).
5. **UI Update:** The React app receives the payload, adds the new record to its local array, and the screen updates instantly.
