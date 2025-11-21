# Quick Start: Forgot Password Feature

## ✅ What Was Implemented

A complete password recovery system with:
- Email-based password reset
- 6-digit reset code (valid for 30 minutes)
- Secure token validation
- Password update in database
- User-friendly UI

## 🔧 To Enable Email Sending

### Step 1: Get Gmail App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Enable 2-Factor Authentication first
3. Select "Mail" and "Windows Computer"
4. Copy the 16-character password

### Step 2: Update `.env` File
```bash
# In: backend/.env

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_char_password
FRONTEND_URL=http://localhost:3000
```

## 🚀 How Users Recover Their Password

### Method 1: Via Login Page
1. Click **"Forgot Password?"** link on login page
2. Enter email → Get reset code in email
3. Enter code + new password → Password reset!
4. Login with new password

### Method 2: Direct URL
If user has token & email, they can go directly to:
```
http://localhost:3000/reset-password?token=ABC123&email=user@example.com
```

## 📧 What Users Receive

Email contains:
- 6-digit reset code (easy to copy)
- Direct reset link with code pre-filled
- Expiration time (30 minutes)

## 🔐 Security Features

- Tokens expire after 30 minutes
- Tokens are cleared after use
- Passwords are hashed with bcrypt
- Email verification prevents unauthorized resets
- Ready for rate limiting (to prevent spam)

## 📝 Frontend Pages

- **Login Page**: Added "Forgot Password?" link
- **Forgot Password Page**: `/forgot-password` - Request reset code
- **Reset Password Page**: `/reset-password` - Enter new password

## 🛠️ Backend Endpoints

### Request Password Reset
```
POST /api/users/forgot-password
{
  "email": "user@example.com"
}
```

### Reset Password
```
POST /api/users/reset-password
{
  "email": "user@example.com",
  "token": "ABC123",
  "newPassword": "newPassword123"
}
```

## 🧪 Testing Steps

1. ✅ Setup email credentials in `.env` (optional for testing without email)
2. ✅ Go to login page
3. ✅ Click "Forgot Password?"
4. ✅ Enter your email
5. ✅ Check email for reset code
6. ✅ Enter reset code and new password
7. ✅ Login with new password

## ⚡ Without Email Setup?

For testing/demo without Gmail:
- The reset code is still generated and stored
- You can check MongoDB to see the resetToken
- Manually enter the token in the reset form
- Password will still be updated

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| Email not sending | Check EMAIL_USER and EMAIL_PASS in `.env` |
| Gmail auth fails | Use App Password, not regular Gmail password |
| Token expired | Tokens are valid for 30 minutes only |
| Can't find email | Check spam folder or resend code |

## 📂 Files Modified/Created

**New Files:**
- `frontend/src/components/ForgotPassword.js`
- `frontend/src/components/ResetPassword.js`
- `FORGOT_PASSWORD_GUIDE.md` (detailed guide)

**Modified Files:**
- `backend/server.js` (added endpoints & schema fields)
- `frontend/src/App.js` (added routes)
- `frontend/src/components/Login.js` (added link)
- `frontend/src/components/Auth.css` (updated styling)
- `backend/.env` (added email config)

## 🎯 Next Steps

1. Update `.env` with your Gmail credentials
2. Test the flow on your app
3. (Optional) Add rate limiting to prevent abuse
4. (Optional) Add SMS verification option

---

**The system is fully functional and ready to use!** 🎉
