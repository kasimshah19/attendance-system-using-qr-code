# Late Arrival Logic Flowchart

This flowchart explains the mathematical logic used in `Scan.jsx` to determine if an employee is late.

```mermaid
flowchart TD
    Start([Employee Scans QR]) --> Fetch[Fetch Employee's Shift Data]
    Fetch --> Data{Has start_time & late_grace_mins?}
    
    Data -- Yes --> CalcShift[Create Date object for today's start_time]
    Data -- No --> Error[System Error]
    
    CalcShift --> AddGrace[Add late_grace_mins to start_time to get 'Late Threshold']
    
    AddGrace --> CheckTime{Is Current Time > Late Threshold?}
    
    CheckTime -- Yes --> IsLate[Status = 'late']
    CheckTime -- No --> OnTime[Status = 'on_time']
    
    IsLate --> AskReason[Prompt UI: 'You are late. Reason required.']
    OnTime --> AllowCheckIn[Prompt UI: 'Check In']
    
    AskReason --> Submit[Employee hits Submit]
    AllowCheckIn --> Submit
    
    Submit --> DB[(Save to DB)]
```

## 📝 Detailed Explanation
- **Custom Shifts:** Every employee can have a different `start_time` (e.g., 09:00 vs 10:00).
- **Grace Period:** `late_grace_mins` (e.g., 30 mins) gives employees a buffer.
- **The Math:** If a shift starts at 09:00 with a 30 min grace period, the `Late Threshold` is 09:30. If the employee scans at 09:31, they are late and must provide a text reason before the system allows them to check in.
