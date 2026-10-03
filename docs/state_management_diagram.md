# Scan Page State Management Diagram

This diagram visualizes the complex state machine inside `Scan.jsx`. It determines what screen the employee sees after they scan their QR code.

```mermaid
stateDiagram-v2
    [*] --> loading : Page Opens (URL has ?token=...)
    
    loading --> not_found : Token invalid or missing
    
    loading --> Evaluate : Token valid, fetch today's record
    
    state Evaluate {
        [*] --> CheckInRequired : No attendance record today
        [*] --> CheckOutRequired : Check-in exists, but no check-out
        [*] --> done : Both exist (Day is complete)
    }
    
    Evaluate --> checkin_on_time : Employee clicks "Check-in" & Time < Grace
    Evaluate --> checkin_late : Employee clicks "Check-in" & Time > Grace
    
    Evaluate --> too_soon : Time since check-in < 2 Hours
    
    Evaluate --> checkout_free : Time since end_shift < 30 mins
    Evaluate --> checkout_early : Time is earlier than shift end
    
    checkin_on_time --> success_in : Submit
    checkin_late --> success_in : Submit (with reason)
    
    checkout_free --> success_out : Submit
    checkout_early --> success_out : Submit (with reason)
    
    success_in --> [*]
    success_out --> [*]
    not_found --> [*]
    done --> [*]
```

## 📝 Detailed Explanation
- **`loading` state:** A loading spinner is shown while Supabase checks the `token`.
- **`Evaluate` step:** This is the core logic. It asks the database: "Has this person checked in today?".
- **Check-in Logic:** If they are late (past `start_time` + `grace_mins`), the state becomes `checkin_late` and forces them to provide a reason. Otherwise, it is `checkin_on_time`.
- **Check-out Logic:** 
    - `too_soon`: If they checked in less than 2 hours ago, check-out is locked to prevent accidental double-scans.
    - `checkout_early`: If they try to leave before their shift ends, they must provide a reason.
    - `checkout_free`: If they leave at the correct time, no reason is needed.
