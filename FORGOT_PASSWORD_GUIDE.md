# Forgot Password Feature - Implementation Guide

## Overview
A complete password recovery system has been implemented for your QR Menu restaurant system. Users can now securely reset their forgotten passwords using email-based recovery with a 6-digit reset code.

## How It Works

### User Flow:
1. User clicks "Forgot Password?" link on the login page
2. User enters their email address
3. Backend generates a 6-digit reset code (valid for 30 minutes)
4. Email is sent to user with the reset code
5. User enters reset code, email, and new password
6. Password is updated in the database
7. User can login with new password

## Components Added

### Backend Changes:

#### 1. **Updated User Schema** (`server.js`)
```javascript
const userSchema = new mongoose.Schema({
  // ... existing fields ...
  resetToken: String,           // Stores the 6-digit reset code
  resetTokenExpiry: Date        // Token expiration time
});
```

#### 2. **POST /api/users/forgot-password**
- **Purpose**: Generate reset token and send email
- **Request**: `{ email: "user@example.com" }`
- **Response**: `{ message: "Password reset email sent" }`
- **What it does**:
  - Validates email exists
  - Generates 6-digit reset code
  - Sets token expiry to 30 minutes
  - Sends email with reset code and link

#### 3. **POST /api/users/reset-password**
- **Purpose**: Validate reset token and update password
- **Request**: 
  ```json
  {
    "email": "user@example.com",
    "token": "ABC123",
    "newPassword": "newPassword123"
  }
  ```
- **Response**: `{ message: "Password reset successfully" }`
- **Validation**:
  - Checks if token is correct
  - Checks if token is not expired
  - Password must be at least 6 characters
  - Clears reset token after successful reset

### Frontend Components:

#### 1. **ForgotPassword.js** (NEW)
- Form to request password reset
- Enter email address
- Shows success/error messages
- Redirects to reset password page on success

#### 2. **ResetPassword.js** (NEW)
- Form to enter reset code and new password
- Fields:
  - Email address (pre-filled from URL params)
  - Reset code (6-digit code from email)
  - New password
  - Confirm password
- Password visibility toggle
- Validation:
  - Passwords must match
  - Password minimum 6 characters
  - Reset code must be valid and not expired

#### 3. **Updated Login.js**
- Added "Forgot Password?" link
- Takes user to forgot password page

## Routes Added

### Frontend Routes:
- `GET /forgot-password` → ForgotPassword component
- `GET /reset-password` → ResetPassword component (with email & token params)

### Backend Routes:
- `POST /api/users/forgot-password` → Send reset email
- `POST /api/users/reset-password` → Reset password with token

## Environment Variables

Add these to your `.env` file in the backend:

```dotenv
# Email Configuration
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password_here

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

### Setting Up Gmail:
1. Enable 2-Factor Authentication on your Gmail account
2. Go to: https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer"
4. Copy the 16-character password
5. Paste it as `EMAIL_PASS` in `.env`

## Security Features

✅ **Temporary Reset Tokens**: Tokens expire after 30 minutes
✅ **One-Time Use**: Token is cleared after successful reset
✅ **Email Verification**: User must verify they own the email
✅ **Secure Password Hashing**: Passwords hashed with bcrypt
✅ **Rate Limiting Ready**: Can add rate limiting to prevent abuse
✅ **Token Format**: Uses random 6-digit code (easy to copy from email)

## Testing the Feature

### Step 1: Request Password Reset
1. Go to login page: `http://localhost:3000/login`
2. Click "Forgot Password?" link
3. Enter your registered email
4. Click "Send Reset Code"

### Step 2: Check Email
1. Check your email for the reset code
2. The email contains:
   - 6-digit reset code
   - Direct link to reset password page
   - Expiration time (30 minutes)

### Step 3: Reset Password
1. On the reset password page, enter:
   - Email address
   - 6-digit code from email
   - New password
   - Confirm password
2. Click "Reset Password"
3. You'll be redirected to login
4. Login with your new password

## Troubleshooting

### Email Not Sending
- Check `EMAIL_USER` and `EMAIL_PASS` are correct in `.env`
- Verify Gmail App Password was created (not regular password)
- Check internet connection
- Gmail may block unusual login attempts

### Reset Token Expired
- Token is valid for 30 minutes
- If expired, user must request new code
- User will get error message "Reset token has expired"

### Invalid Reset Token
- Token must match exactly (case-sensitive)
- Check for typos when entering code
- Request new code if incorrect multiple times

## Future Enhancements

- [ ] Rate limiting on forgot-password endpoint (prevent spam)
- [ ] SMS verification option
- [ ] Security questions option
- [ ] Recovery codes backup
- [ ] Reset password via OTP (One-Time Password)
- [ ] Email verification on registration
- [ ] Account recovery using phone number

## File Changes Summary

**Backend:**
- `server.js` - Added schema fields, 2 new endpoints

**Frontend:**
- `ForgotPassword.js` - NEW component
- `ResetPassword.js` - NEW component
- `Login.js` - Added forgot password link
- `App.js` - Added new routes
- `Auth.css` - Updated styling for new form elements
- `.env` - Added email configuration

## API Documentation

### Forgot Password Request
```bash
POST /api/users/forgot-password
Content-Type: application/json

{
  "email": "restaurant@example.com"
}

Response: 200 OK
{
  "message": "Password reset email sent"
}
```

### Reset Password
```bash
POST /api/users/reset-password
Content-Type: application/json

{
  "email": "restaurant@example.com",
  "token": "ABC123",
  "newPassword": "newPassword123"
}

Response: 200 OK
{
  "message": "Password reset successfully"
}
```

## Current Implementation Status

✅ Backend endpoints implemented
✅ Frontend components created
✅ Routes configured
✅ Email service configured (nodemailer)
✅ Password validation
✅ Token expiration
✅ Error handling
✅ User feedback (success/error messages)

The forgot password feature is now fully functional and ready for use!
