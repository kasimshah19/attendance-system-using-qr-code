# Authentication Flow Diagram

This diagram explains how Admin login works using Supabase Auth (GoTrue).

```mermaid
sequenceDiagram
    actor Admin
    participant Frontend as React App
    participant Auth as Supabase Auth
    participant Profiles as DB (profiles table)
    
    Admin->>Frontend: Enters Email & Password
    Frontend->>Auth: POST /auth/v1/token (grant_type=password)
    
    alt Invalid Credentials
        Auth-->>Frontend: 400 Bad Request
        Frontend-->>Admin: Shows "Invalid login credentials" error
    else Valid Credentials
        Auth-->>Frontend: 200 OK (Returns Access Token & Refresh Token)
        Frontend->>Profiles: Fetches Role based on User ID
        Profiles-->>Frontend: Returns "role: admin"
        Frontend->>Frontend: Saves session in LocalStorage
        Frontend-->>Admin: Redirects to /dashboard
    end
```

## 📝 Detailed Explanation
1. **Email/Password Submission:** The admin types their credentials on the `/login` page.
2. **Supabase Auth API:** React sends this directly to the Supabase Authentication server.
3. **Session Management:** If successful, Supabase returns an Access Token (JWT) which the browser automatically saves. This token is attached to every future database request to prove the user's identity.
4. **Role Check:** The frontend then queries the `profiles` table to get the user's name and role to display in the sidebar.
