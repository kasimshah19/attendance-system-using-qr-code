# Early Check-out Logic Flowchart

This flowchart explains the logic used in `Scan.jsx` to determine if an employee is leaving their shift early.

```mermaid
flowchart TD
    Start([Employee Scans QR]) --> CheckDB{Already Checked In?}
    
    CheckDB -- Yes --> CheckLock{Time since check-in < 120 mins?}
    
    CheckLock -- Yes --> Locked[Status = 'too_soon']
    Locked --> ShowError[UI: 'You just checked in. Please wait.']
    
    CheckLock -- No --> FetchShift[Fetch Employee's end_time]
    
    FetchShift --> CheckEarly{Is Current Time < end_time?}
    
    CheckEarly -- Yes --> IsEarly[Status = 'early']
    CheckEarly -- No --> OnTime[Status = 'on_time']
    
    IsEarly --> AskReason[Prompt UI: 'Leaving early. Reason required.']
    OnTime --> AllowCheckOut[Prompt UI: 'Check Out']
    
    AskReason --> Submit[Employee hits Submit]
    AllowCheckOut --> Submit
    
    Submit --> DB[(Update row in DB)]
```

## 📝 Detailed Explanation
- **Anti-Spam Lock:** The `120 mins` check prevents employees from accidentally scanning twice in the morning and checking out immediately by mistake.
- **Early Detection:** If their `end_time` is 18:00 and they scan at 17:30, they are leaving early.
- **Mandatory Reason:** Just like late arrivals, early departures enforce accountability by forcing the employee to type a reason before the Check-Out button unlocks.
