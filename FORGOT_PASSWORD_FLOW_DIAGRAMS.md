# Forgot Password - Flow Diagrams & Examples

## 📊 User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     LOGIN PAGE                                  │
│                                                                 │
│  ┌─────────────────────────────┐                               │
│  │  Forgot your password?       │                               │
│  │  Click: [Forgot Password?]   │←── NEW LINK ADDED            │
│  └─────────────────────────────┘                               │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────────────────────────┐
│              FORGOT PASSWORD PAGE                               │
│  http://localhost:3000/forgot-password                          │
│                                                                 │
│  Email: [user@example.com]                                      │
│  Button: [Send Reset Code]                                      │
│                                                                 │
│  "Check your email for reset code"                              │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ↓
        [Send to Backend]
        POST /api/users/forgot-password
        {email: "user@example.com"}
              │
              ├─→ ✅ Generate 6-digit code
              ├─→ ✅ Set expiry (30 min from now)
              ├─→ ✅ Store in database
              ├─→ ✅ Send email with code
              │
              ↓
        ┌──────────────────────────┐
        │ USER CHECKS EMAIL        │
        │                          │
        │ Subject:                 │
        │ Password Reset Request   │
        │ - QR Menu               │
        │                          │
        │ Reset Code: ABC123      │
        │ Expires: 30 min         │
        │ [Reset Password Link]   │
        └──────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────────────────────────┐
│           RESET PASSWORD PAGE                                   │
│  http://localhost:3000/reset-password?token=ABC123&...         │
│                                                                 │
│  Email: [user@example.com]  (pre-filled)                       │
│  Code:  [ABC123]            (from email or URL)                │
│  Password: [••••••••]        (minimum 6 chars)                  │
│  Confirm:  [••••••••]        (must match)                       │
│  ☑ Show passwords                                               │
│                                                                 │
│  Button: [Reset Password]                                       │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ↓
        [Send to Backend]
        POST /api/users/reset-password
        {
          email: "user@example.com",
          token: "ABC123",
          newPassword: "newPass123"
        }
              │
              ├─→ ✅ Validate email exists
              ├─→ ✅ Check token is correct
              ├─→ ✅ Check token not expired
              ├─→ ✅ Hash new password
              ├─→ ✅ Update in database
              ├─→ ✅ Clear reset token
              │
              ↓
        ✅ Password Reset Successfully!
        → Redirect to Login
              │
              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    LOGIN PAGE                                   │
│                                                                 │
│  Email:    [user@example.com]                                  │
│  Password: [new password]                                       │
│                                                                 │
│  ✅ Successfully logged in!                                     │
│  → Redirect to Dashboard                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Backend Flow Diagram

```
REQUEST: POST /api/users/forgot-password
{email: "user@example.com"}
│
├─→ [Validate] Email is required?
│   │ NO → Return Error 400
│   └─ YES → Continue
│
├─→ [Database] Find user by email
│   │ NOT FOUND → Return Error 400
│   └─ FOUND → Continue
│
├─→ [Generate] Reset token
│   │ Create 6-digit code: ABC123
│   └─ Continue
│
├─→ [Set] Expiry time
│   │ Current time + 30 minutes
│   └─ Continue
│
├─→ [Update] User in database
│   │ {
│   │   resetToken: "ABC123",
│   │   resetTokenExpiry: 2024-11-20 14:30:00
│   │ }
│   └─ Continue
│
├─→ [Email] Send via nodemailer
│   │ To: user@example.com
│   │ Subject: Password Reset Request - QR Menu
│   │ Body: HTML template with code
│   │ Success? → Continue
│   │ Fail? → Return Error 500
│   └─ Continue
│
└─→ RESPONSE: 200 OK
   {message: "Password reset email sent"}


REQUEST: POST /api/users/reset-password
{
  email: "user@example.com",
  token: "ABC123",
  newPassword: "newPassword123"
}
│
├─→ [Validate] All fields provided?
│   │ NO → Return Error 400
│   └─ YES → Continue
│
├─→ [Database] Find user by email
│   │ NOT FOUND → Return Error 404
│   └─ FOUND → Continue
│
├─→ [Check] Is token correct?
│   │ MISMATCH → Return Error 400 "Invalid token"
│   └─ MATCH → Continue
│
├─→ [Check] Is token expired?
│   │ EXPIRED → Return Error 400 "Token expired"
│   └─ VALID → Continue
│
├─→ [Hash] New password with bcrypt
│   │ bcrypt.hash(newPassword, 10)
│   └─ Continue
│
├─→ [Update] User password in database
│   │ user.password = hashed_password
│   │ user.resetToken = null
│   │ user.resetTokenExpiry = null
│   │ user.save()
│   └─ Continue
│
└─→ RESPONSE: 200 OK
   {message: "Password reset successfully"}
```

---

## 📨 Email Sending Diagram

```
Backend Server
│
├─→ [nodemailer] Configure transport
│   │ Service: Gmail
│   │ Auth:
│   │   - user: process.env.EMAIL_USER
│   │   - pass: process.env.EMAIL_PASS
│   └─ Continue
│
├─→ [Compose] Email message
│   │ From: your_email@gmail.com
│   │ To: user@example.com
│   │ Subject: Password Reset Request - QR Menu
│   │ HTML: Professional template
│   │   - Heading: "Password Reset Request"
│   │   - Code: ABC123 (large, blue)
│   │   - Expiry: "Valid for 30 minutes"
│   │   - Link: Reset button with pre-filled code
│   │   - Notice: "If not requested, ignore"
│   └─ Continue
│
├─→ [Send] Via Gmail SMTP
│   │ Connection: TLS encrypted
│   │ Port: 587
│   │ 1-2 seconds: Normal delivery
│   │ Few minutes: Slow delivery (normal)
│   │ Error: Returns error message
│   └─ Continue
│
├─→ [Receive] User's Gmail account
│   │ From: Your Restaurant <your_email@gmail.com>
│   │ Subject: Password Reset Request - QR Menu
│   │ Body: HTML formatted email
│   │ Check: Inbox or Promotions folder
│   └─ User opens email
│
└─→ [Action] User clicks:
    1. Copy code and paste in reset form
    2. Or click reset link (code pre-filled)
```

---

## 📊 Database Changes Diagram

```
BEFORE (User Collection):
┌─────────────────────────────────────────────┐
│ {                                           │
│   _id: ObjectId(...),                       │
│   email: "user@example.com",                │
│   password: "$2a$10$hashedPassword...",     │
│   restaurantName: "My Restaurant",          │
│   tables: [1, 2, 3],                        │
│   profilePicture: "url...",                 │
│   bannerImage: "url..."                     │
│ }                                           │
└─────────────────────────────────────────────┘

AFTER (User Collection):
┌─────────────────────────────────────────────┐
│ {                                           │
│   _id: ObjectId(...),                       │
│   email: "user@example.com",                │
│   password: "$2a$10$hashedPassword...",     │
│   restaurantName: "My Restaurant",          │
│   tables: [1, 2, 3],                        │
│   profilePicture: "url...",                 │
│   bannerImage: "url...",                    │
│   resetToken: "ABC123",          ← NEW     │
│   resetTokenExpiry: Date(...)    ← NEW     │
│ }                                           │
└─────────────────────────────────────────────┘

DURING RESET REQUEST:
┌─────────────────────────────────────────────┐
│ {                                           │
│   ...existing fields...,                    │
│   resetToken: "ABC123",                     │
│   resetTokenExpiry: 2024-11-20 14:30:00     │
│ }                                           │
└─────────────────────────────────────────────┘
        ↓ (Email sent)
    ┌────────────┐
    │User Opens  │
    │Email & Gets│
    │Code: ABC123│
    └────────────┘
        ↓
    ┌────────────────────────────────┐
    │User submits reset form:        │
    │- Email                         │
    │- Token: ABC123                 │
    │- New Password                  │
    └────────────────────────────────┘

AFTER PASSWORD RESET:
┌─────────────────────────────────────────────┐
│ {                                           │
│   ...existing fields...,                    │
│   password: "$2a$10$newHashedPassword...",  │
│   resetToken: null,           ← CLEARED   │
│   resetTokenExpiry: null,     ← CLEARED   │
│ }                                           │
└─────────────────────────────────────────────┘
```

---

## 🔐 Security Flow Diagram

```
PASSWORD RESET SECURITY CHAIN:

1. REQUEST PASSWORD RESET
   │
   ├─→ ✅ Email Validation
   │   └─ Only registered emails can reset
   │
   └─→ Backend: Generate Reset Token
       └─ Random 6-digit code (not guessable)

2. EMAIL DELIVERY
   │
   ├─→ ✅ Encrypted Transport (TLS)
   │   └─ Gmail → User's email (secure)
   │
   └─→ ✅ Reset Code in Email (not password)
       └─ Email doesn't contain password

3. TOKEN STORAGE
   │
   ├─→ ✅ Stored in Database
   │   └─ Hashed or plain 6-digit code
   │
   └─→ ✅ Time-Limited Expiry
       └─ Valid for 30 minutes only

4. PASSWORD RESET SUBMISSION
   │
   ├─→ ✅ Token Validation
   │   └─ Code must match exactly
   │
   ├─→ ✅ Expiry Check
   │   └─ Code must not be expired
   │
   ├─→ ✅ Password Hashing
   │   └─ bcrypt with salt (10 rounds)
   │
   └─→ ✅ Token Cleanup
       └─ Token deleted after use (one-time)

5. FINAL STATE
   │
   ├─→ ✅ Password Changed
   │   └─ New password is hashed
   │
   ├─→ ✅ Old Password Invalid
   │   └─ Cannot login with old password
   │
   ├─→ ✅ Token Cleared
   │   └─ Cannot reuse same token
   │
   └─→ ✅ Ready to Login
       └─ User can login with new password
```

---

## 🧪 Test Scenarios Diagram

```
SCENARIO 1: Happy Path (Success)
┌─────────────────────────────────────────┐
│ 1. Click "Forgot Password?"             │
│ 2. Enter email                          │
│ 3. Receive email with code              │
│ 4. Enter code in reset form             │
│ 5. Enter new password                   │
│ 6. Password successfully reset          │
│ 7. Login with new password ✅           │
└─────────────────────────────────────────┘

SCENARIO 2: Invalid Email
┌─────────────────────────────────────────┐
│ 1. Enter unregistered email             │
│ 2. Backend checks: Email not found      │
│ 3. Error: "Email not found" ❌          │
│ 4. User tries again with correct email  │
│ 5. Success ✅                           │
└─────────────────────────────────────────┘

SCENARIO 3: Wrong Reset Code
┌─────────────────────────────────────────┐
│ 1. Receive email with code: ABC123      │
│ 2. Enter wrong code: XYZ789             │
│ 3. Backend validates: Code mismatch     │
│ 4. Error: "Invalid reset token" ❌      │
│ 5. User tries again with correct code   │
│ 6. Success ✅                           │
└─────────────────────────────────────────┘

SCENARIO 4: Expired Token
┌─────────────────────────────────────────┐
│ 1. Request reset at 2:00 PM             │
│ 2. Receive email with code              │
│ 3. Wait 30+ minutes                     │
│ 4. Try to reset at 2:31 PM              │
│ 5. Backend checks: Token expired        │
│ 6. Error: "Reset token expired" ❌      │
│ 7. User requests new code               │
│ 8. Success ✅                           │
└─────────────────────────────────────────┘

SCENARIO 5: Password Mismatch
┌─────────────────────────────────────────┐
│ 1. Enter new password: Pass123          │
│ 2. Enter confirm: Pass456               │
│ 3. Frontend validates: Mismatch         │
│ 4. Error: "Passwords don't match" ❌    │
│ 5. User re-enters matching passwords    │
│ 6. Success ✅                           │
└─────────────────────────────────────────┘

SCENARIO 6: Password Too Short
┌─────────────────────────────────────────┐
│ 1. Enter new password: abc              │
│ 2. Frontend validates: < 6 characters   │
│ 3. Error: "Minimum 6 characters" ❌     │
│ 4. User enters longer password          │
│ 5. Success ✅                           │
└─────────────────────────────────────────┘
```

---

## 🌐 API Request/Response Examples

### Successful Password Reset

```
REQUEST:
├─ Endpoint: http://localhost:5000/api/users/forgot-password
├─ Method: POST
├─ Headers: Content-Type: application/json
└─ Body:
   {
     "email": "restaurant@example.com"
   }

RESPONSE (Success):
├─ Status: 200 OK
├─ Headers: Content-Type: application/json
└─ Body:
   {
     "message": "Password reset email sent"
   }

RESPONSE (Error - Email not found):
├─ Status: 400 Bad Request
└─ Body:
   {
     "message": "Email not found"
   }


REQUEST:
├─ Endpoint: http://localhost:5000/api/users/reset-password
├─ Method: POST
├─ Headers: Content-Type: application/json
└─ Body:
   {
     "email": "restaurant@example.com",
     "token": "ABC123",
     "newPassword": "secureNewPassword123"
   }

RESPONSE (Success):
├─ Status: 200 OK
└─ Body:
   {
     "message": "Password reset successfully"
   }

RESPONSE (Error - Invalid token):
├─ Status: 400 Bad Request
└─ Body:
   {
     "message": "Invalid reset token"
   }

RESPONSE (Error - Token expired):
├─ Status: 400 Bad Request
└─ Body:
   {
     "message": "Reset token has expired"
   }
```

---

## 📱 User Interface Flow

```
┌──────────────────────────────────────┐
│         LOGIN PAGE                   │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ Email: [_______________]       │  │
│ │ Password: [____________]       │  │
│ │                                │  │
│ │ [Login Button]                 │  │
│ │                                │  │
│ │ [Forgot Password?] ← NEW       │  │
│ │ Don't have account? [Register] │  │
│ └────────────────────────────────┘  │
└──────────────────────────────────────┘
        ↓ Click "Forgot Password?"
┌──────────────────────────────────────┐
│    FORGOT PASSWORD PAGE              │
│                                      │
│ Forgot Password                      │
│ Enter your email to receive a        │
│ password reset code                  │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ Email: [_______________]       │  │
│ │                                │  │
│ │ [Send Reset Code]              │  │
│ │                                │  │
│ │ [Remember password? Login]     │  │
│ └────────────────────────────────┘  │
│                                      │
│ ✅ Email sent! Check your inbox.    │
│    Redirecting to reset page...     │
└──────────────────────────────────────┘
        ↓ Get code from email
┌──────────────────────────────────────┐
│     RESET PASSWORD PAGE              │
│                                      │
│ Reset Password                       │
│ Enter your reset code and new        │
│ password                             │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ Email:                         │  │
│ │ [restaurant@example.com]       │  │
│ │                                │  │
│ │ Reset Code:                    │  │
│ │ [ABC123]                       │  │
│ │ Check your email for the code  │  │
│ │                                │  │
│ │ New Password:                  │  │
│ │ [••••••••••••]                 │  │
│ │                                │  │
│ │ Confirm Password:              │  │
│ │ [••••••••••••]                 │  │
│ │                                │  │
│ │ ☑ Show passwords               │  │
│ │                                │  │
│ │ [Reset Password]               │  │
│ │                                │  │
│ │ [Remember password? Login]     │  │
│ └────────────────────────────────┘  │
│                                      │
│ ✅ Password reset successfully!     │
│    Redirecting to login...          │
└──────────────────────────────────────┘
        ↓ Login with new password
┌──────────────────────────────────────┐
│         LOGIN PAGE                   │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ Email: [restaurant@example.com]│  │
│ │ Password: [••••••••••]         │  │
│ │                                │  │
│ │ [Login Button]                 │  │
│ │                                │  │
│ │ [Forgot Password?]             │  │
│ │ Don't have account? [Register] │  │
│ └────────────────────────────────┘  │
│                                      │
│ ✅ Successfully logged in!          │
│    Redirecting to dashboard...      │
└──────────────────────────────────────┘
        ↓
    [DASHBOARD]
```

---

This completes the visual representation of the forgot password feature flow!
