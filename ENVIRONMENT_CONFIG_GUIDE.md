# Environment Configuration Guide

## Backend Environment Setup

### File Location
`backend/.env`

### Current Configuration
```dotenv
MONGODB_URI=mongodb://localhost:27017/qr-menu
PORT=5000
JWT_SECRET=your_secret_key_here
FRONTEND_URL=http://localhost:3000
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password_here
```

### Configuration for Different Environments

#### Development (Local)
```dotenv
MONGODB_URI=mongodb://localhost:27017/qr-menu
PORT=5000
JWT_SECRET=dev_secret_key_12345_change_before_production
FRONTEND_URL=http://localhost:3000
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password
```

#### Production (AWS/Heroku/DigitalOcean)
```dotenv
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/qr-menu
PORT=5000
JWT_SECRET=generate_strong_random_string_here_at_least_32_chars
FRONTEND_URL=https://yourdomain.com
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your_app_password
```

#### Staging (Testing)
```dotenv
MONGODB_URI=mongodb://staging-db:27017/qr-menu-staging
PORT=5000
JWT_SECRET=staging_secret_key_change_regularly
FRONTEND_URL=https://staging.yourdomain.com
EMAIL_USER=staging@yourdomain.com
EMAIL_PASS=your_app_password
```

---

## Configuration Details

### MONGODB_URI
**Purpose**: Database connection string

**Local MongoDB:**
```
mongodb://localhost:27017/qr-menu
```

**MongoDB Atlas (Cloud):**
```
mongodb+srv://username:password@cluster.mongodb.net/qr-menu
```

**Steps to set up MongoDB Atlas:**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a project
4. Create a cluster (M0 free tier)
5. Get connection string
6. Add username and password
7. Whitelist your IP address
8. Copy connection string to .env

**Common Issues:**
- IP not whitelisted: Add "0.0.0.0/0" for all IPs (not recommended for production)
- Wrong credentials: Double-check username and password
- Network error: Check MongoDB service is running

---

### PORT
**Purpose**: Server listening port

**Recommended Values:**
- Development: 5000 (default)
- Production: 5000 or 3000 (change in reverse proxy)

**Change if:**
- Port 5000 is already in use
- Running multiple services on same machine

**Check if port is in use:**
```bash
# Windows
netstat -ano | findstr :5000

# Mac/Linux
lsof -i :5000
```

---

### JWT_SECRET
**Purpose**: Secret key for signing JWT tokens

**Requirements:**
- Minimum 32 characters recommended
- Unique and random
- Never share or commit to version control
- Change regularly

**Generate a secure JWT_SECRET:**

**Option 1: Using Node.js**
```javascript
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2: Using OpenSSL**
```bash
openssl rand -base64 32
```

**Option 3: Using Online Tool**
https://www.uuidgenerator.net/ (generate and use first 32 chars)

**Example:**
```
JWT_SECRET=a3f5k9m2p8w1q4r7t6y0u3i9o5e2s3d
```

**Security Notes:**
- Store securely (use AWS Secrets Manager, HashiCorp Vault)
- Rotate regularly
- Never log or expose
- Different secret per environment

---

### FRONTEND_URL
**Purpose**: Frontend domain for password reset email links

**For Development:**
```
http://localhost:3000
```

**For Production:**
```
https://yourdomain.com
https://app.yourdomain.com
```

**Used in:**
- Password reset email links
- CORS origin verification (if implemented)

**Example Email Link:**
```
https://yourdomain.com/reset-password?token=ABC123&email=user@example.com
```

---

### EMAIL_USER
**Purpose**: Sender email address for password reset emails

**Gmail:**
```
your_email@gmail.com
```

**Custom Domain:**
```
noreply@yourdomain.com
support@yourdomain.com
```

**If using Gmail:**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Copy the 16-character app password
4. Use in EMAIL_PASS (not your regular password)

**If using Custom Domain:**
- Ensure email server is configured
- Use SMTP settings if needed
- Test email delivery

---

### EMAIL_PASS
**Purpose**: Email account password or app password

**Gmail App Password (Recommended):**
```
abcd efgh ijkl mnop
```
(Copy as-is, don't include spaces)

**Regular Email Password:**
- Not recommended (security risk)
- Requires less secure app access enabled

**Custom Domain:**
- Use SMTP credentials
- Store securely

**Never:**
- Hardcode production credentials in code
- Commit to version control
- Share with team members
- Use in public repositories

---

## Secure Configuration Management

### Using Environment Variables

**Heroku:**
```bash
heroku config:set JWT_SECRET=your_secret_here
heroku config:set MONGODB_URI=your_mongo_uri
```

**AWS Lambda/Elastic Beanstalk:**
```bash
aws elasticbeanstalk create-environment-resources \
  --environment-name production \
  --option-settings Namespace=aws:ec2:general,OptionName=JwtSecret,Value=your_secret
```

**DigitalOcean App Platform:**
- Set environment variables in dashboard
- Use .env file locally, don't commit

### Using Secrets Management

**AWS Secrets Manager:**
```javascript
const AWS = require('aws-sdk');
const client = new AWS.SecretsManager();

const secret = await client.getSecretValue({ 
  SecretId: 'qr-menu/jwt-secret' 
}).promise();
```

**HashiCorp Vault:**
```javascript
const vault = require('node-vault')({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN
});

const secret = await vault.read('secret/data/qr-menu/jwt');
```

---

## Pre-Deployment Configuration Checklist

- [ ] Generate strong JWT_SECRET
- [ ] Configure MongoDB connection
  - [ ] Local: MongoDB running
  - [ ] Cloud: MongoDB Atlas configured
- [ ] Set FRONTEND_URL to production domain
- [ ] Configure email credentials
  - [ ] Gmail: App password generated
  - [ ] Custom: SMTP tested
- [ ] Test all endpoints with production values
- [ ] Verify email sending works
- [ ] Test password reset flow
- [ ] Verify CORS settings
- [ ] Test WebSocket connection
- [ ] Run security tests
- [ ] Document all configuration changes

---

## Troubleshooting Configuration

### "Cannot connect to MongoDB"
- Check MONGODB_URI syntax
- Verify MongoDB service is running
- Check if database exists
- Verify credentials (for Atlas)
- Check firewall/security groups
- Test with MongoDB client first

### "JWT verification failed"
- Verify JWT_SECRET is set
- Check if secret changed between environments
- Ensure token format is correct
- Check token expiry (7 days)

### "Email not sending"
- Verify EMAIL_USER is correct
- Check EMAIL_PASS (use app password, not regular password)
- Verify Gmail 2FA is enabled
- Check app password was generated
- Verify firewall allows SMTP port 587
- Test with telnet: `telnet smtp.gmail.com 587`

### "Reset links not working"
- Check FRONTEND_URL matches actual domain
- Verify token is being passed in URL
- Check email client isn't modifying links
- Test URL manually in browser
- Check for special characters in email

### "WebSocket connection failed"
- Verify backend is running
- Check CORS configuration
- Verify Socket.io port is accessible
- Check firewall allows WebSocket
- Test with different network
- Check browser console for errors

---

## Environment Variables Reference Table

| Variable | Required | Type | Example | Notes |
|----------|----------|------|---------|-------|
| MONGODB_URI | Yes | String | `mongodb://...` | Change for each environment |
| PORT | No | Number | 5000 | Optional, default 5000 |
| JWT_SECRET | Yes | String | Random 32+ chars | Unique per environment |
| FRONTEND_URL | No | String | `https://...` | For email links |
| EMAIL_USER | No | String | `email@gmail.com` | If email needed |
| EMAIL_PASS | No | String | App password | If email needed |

---

## File Structure

```
QR_menu/
├── backend/
│   ├── .env                 ← ENVIRONMENT CONFIGURATION
│   ├── .env.example         ← TEMPLATE (commit this)
│   ├── server.js
│   ├── package.json
│   └── node_modules/
├── frontend/
│   ├── .env                 ← OPTIONAL (for API URL)
│   ├── .env.production      ← PRODUCTION API URL
│   ├── src/
│   ├── package.json
│   └── build/               ← PRODUCTION BUILD
└── README.md
```

---

## Creating .env.example Template

**Purpose**: Version control safe template for team members

**File: backend/.env.example**
```dotenv
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/qr-menu

# Server
PORT=5000

# JWT Authentication
JWT_SECRET=your_secret_key_here

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# Email Configuration
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password_here
```

**Instructions:**
1. Commit .env.example to version control
2. Don't commit .env
3. Team members copy .env.example to .env
4. Each person fills in their own values
5. .env stays in .gitignore

---

## Best Practices

✅ **Do:**
- Use strong, random JWT_SECRET
- Use different secrets per environment
- Store secrets securely
- Use .env for development
- Document all environment variables
- Rotate secrets regularly
- Use HTTPS in production
- Validate all inputs from environment

❌ **Don't:**
- Hardcode secrets in code
- Commit .env to version control
- Use same secret everywhere
- Share credentials in chat/email
- Use weak/predictable secrets
- Log sensitive environment variables
- Store credentials in code comments
- Use development secrets in production

---

## Next Steps

1. Copy .env.example to .env
2. Fill in your configuration values
3. Test database connection
4. Test email sending
5. Run the application
6. Monitor logs for any configuration issues

Questions? Check error messages and logs in your backend terminal.
