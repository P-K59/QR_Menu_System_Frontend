# Email Template for Password Reset

## Email Subject
```
Password Reset Request - QR Menu
```

## Email Body (HTML)
```html
<h2>Password Reset Request</h2>
<p>You requested to reset your password. Your reset code is:</p>
<h3 style="color: #2196F3; font-size: 24px; letter-spacing: 2px;">ABC123</h3>
<p>This code will expire in 30 minutes.</p>
<p>Or click the link below:</p>
<a href="http://localhost:3000/reset-password?token=ABC123&email=user@example.com" style="color: #2196F3;">Reset Password</a>
<p>If you didn't request this, please ignore this email.</p>
```

## What Users See

### Email View:
```
┌─────────────────────────────────────┐
│   Password Reset Request            │
├─────────────────────────────────────┤
│                                     │
│ You requested to reset your         │
│ password. Your reset code is:       │
│                                     │
│ ┌──────────────────────┐           │
│ │     ABC123           │           │
│ └──────────────────────┘           │
│                                     │
│ This code will expire in 30 min    │
│                                     │
│ Or click link:                      │
│ [Reset Password Link]               │
│                                     │
│ If you didn't request, ignore       │
│                                     │
└─────────────────────────────────────┘
```

## Reset Code Format
- **Length**: 6 characters
- **Format**: Uppercase letters and numbers (A-Z, 0-9)
- **Example**: ABC123, XY1234, Z9K8L7
- **Validity**: 30 minutes from request

## Email Sending Configuration

The email is sent via:
- **Service**: Gmail SMTP
- **Port**: 587 (TLS)
- **Sender**: Your Gmail account

### Email Configuration in Code
```javascript
const mailOptions = {
  from: process.env.EMAIL_USER,           // Your Gmail
  to: email,                               // User's email
  subject: 'Password Reset Request - QR Menu',
  html: `...html template...`
};

await transporter.sendMail(mailOptions);
```

## Customizing Email Template

To change the email template, edit `server.js` in the `/api/users/forgot-password` endpoint:

```javascript
const mailOptions = {
  from: process.env.EMAIL_USER,
  to: email,
  subject: 'Your Custom Subject',
  html: `
    <h2>Your Custom Title</h2>
    <p>Your custom message here</p>
    <h3>${resetToken}</h3>
    <p>More custom content...</p>
  `
};
```

## Testing Email Delivery

### Without Actual Email:
1. Backend generates reset code
2. Code is stored in MongoDB
3. Check database: `db.users.findOne({email: "user@email.com"})`
4. Copy the `resetToken` value
5. Use it in reset password form

### With Real Email:
1. Ensure `.env` has correct credentials
2. Check spam/promotional folder
3. Gmail may delay emails by 1-2 minutes
4. Check "Sent Mail" in Gmail account to verify sending

## Email Security

✅ **No passwords in email** - Only reset code
✅ **Time-limited tokens** - Expire after 30 minutes  
✅ **One-time use** - Token cleared after reset
✅ **Email verification** - Proves user owns email address
✅ **Secure transport** - Uses TLS encryption

## Troubleshooting Email Issues

### Email Not Received
- Check spam/promotional folders
- Verify EMAIL_USER is correct in `.env`
- Verify EMAIL_PASS is the app password (not regular password)
- Try resending code
- Wait 1-2 minutes (Gmail can be slow)

### Email Sending Error
- Check if Gmail credentials are valid
- Verify 2FA is enabled on Gmail
- Verify app password was created
- Check internet connection
- Check MongoDB is running

### Email Format Issues
- Try different email client
- Clear browser cache
- Try different browser
- Check if HTML is rendering

## Advanced: Email Rate Limiting

To prevent spam, add this to backend (optional):

```javascript
// Add to forgot-password endpoint
const lastRequest = user.lastPasswordResetRequest;
const now = new Date();
const timeDiff = (now - lastRequest) / (1000 * 60); // minutes

if (lastRequest && timeDiff < 5) {
  return res.status(429).json({ 
    message: 'Please wait 5 minutes before requesting another reset' 
  });
}

// ... rest of code ...

// After sending email:
user.lastPasswordResetRequest = new Date();
await user.save();
```

## Advanced: Custom Email Templates

For professional email design, you can use:
- **Mjml** (Mailjet Markup Language)
- **Email template builders** (Stripo, Dyspatch)
- **HTML/CSS email frameworks**

Example professional template:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; background: #f5f5f5;">
  <table width="100%" style="background: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" style="background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <h2 style="color: #2196F3; margin: 0 0 20px 0;">QR Menu</h2>
              <h3 style="color: #333;">Password Reset Request</h3>
              <p>You requested to reset your password.</p>
              <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #999; font-size: 14px;">Your Reset Code:</p>
                <h2 style="color: #2196F3; letter-spacing: 4px; margin: 10px 0 0 0;">${resetToken}</h2>
              </div>
              <p style="color: #999; font-size: 12px;">Valid for 30 minutes</p>
              <a href="${resetLink}" style="display: inline-block; background: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px;">Reset Password</a>
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 40px 0;">
              <p style="color: #999; font-size: 12px;">Didn't request this? Ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

**Current Implementation**: Using simple HTML template ✅
**Can be upgraded**: To professional template as shown above 📧
