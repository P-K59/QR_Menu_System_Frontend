# QR Menu System - Deployment Guide

## Prerequisites
- Node.js v14+ installed
- MongoDB instance (local or cloud)
- Git installed
- Environment variables configured

## 1. Local Build & Test

### Build Frontend (Production)
```bash
cd frontend
npm install
npm run build
```
This creates a `build/` folder with optimized static files (~200KB gzipped).

### Test Frontend Build Locally
```bash
# Install serve globally (optional)
npm install -g serve

# Serve the build folder
serve -s build -l 3000
```

### Backend Setup
```bash
cd backend
npm install
# Create .env file with:
# MONGODB_URI=mongodb://localhost:27017/qr-menu
# JWT_SECRET=your_secret_key
# EMAIL_USER=your_email@gmail.com
# EMAIL_PASS=your_app_password
npm start
```

## 2. Build Artifacts

After running `npm run build` in frontend folder, you'll have:
```
frontend/build/
├── index.html          (main entry point)
├── static/
│   ├── js/             (minified JavaScript)
│   ├── css/            (minified CSS)
│   └── media/          (images, fonts)
└── manifest.json       (PWA manifest)
```

## 3. Deployment Options

### Option A: Deploy to Heroku

#### Frontend + Backend on Same Dyno

1. **Create `server.js` at root (if not exists)**
   - Use backend/server.js as the main server
   - Serve frontend build as static files

2. **Update backend server.js to serve frontend:**
```javascript
// At top of server.js, after middleware setup:
const path = require('path');
app.use(express.static(path.join(__dirname, 'frontend/build')));

// At bottom, before server.listen():
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});
```

3. **Create Procfile in project root:**
```
web: node backend/server.js
```

4. **Create .env file locally for testing:**
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/qr-menu
JWT_SECRET=your_super_secret_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
PORT=5000
```

5. **Deploy to Heroku:**
```bash
heroku login
heroku create your-app-name
heroku config:set MONGODB_URI="mongodb+srv://..."
heroku config:set JWT_SECRET="your_secret"
git push heroku main
heroku logs --tail
```

### Option B: Deploy Frontend to Vercel/Netlify

#### Vercel (Recommended for React)
```bash
npm install -g vercel
cd frontend
vercel --prod
```

**vercel.json:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "env": {
    "REACT_APP_API_URL": "https://your-backend.herokuapp.com"
  }
}
```

Update `frontend/src/components/*.js` to use:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
// Then use: axios.get(`${API_URL}/api/menu`)
```

#### Netlify
1. Connect GitHub repo to Netlify
2. Set build command: `cd frontend && npm run build`
3. Set publish directory: `frontend/build`
4. Add environment variable: `REACT_APP_API_URL=your-backend-url`

### Option C: Docker Deployment

#### Create Dockerfile for Backend
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ .
EXPOSE 5000
CMD ["node", "server.js"]
```

#### Create Dockerfile for Frontend
```dockerfile
FROM node:16-alpine as build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### docker-compose.yml
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      MONGODB_URI: mongodb://mongo:27017/qr-menu
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - mongo

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  mongo:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

### Option D: AWS EC2 / DigitalOcean / Linode

1. **SSH into server**
2. **Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Install MongoDB:**
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

4. **Clone repo and build:**
```bash
git clone https://github.com/yourname/QR_Menu_System.git
cd QR_Menu_System
npm install --prefix backend
npm run build --prefix frontend
```

5. **Set up environment:**
```bash
cd backend
nano .env  # Add MONGODB_URI, JWT_SECRET, etc.
```

6. **Use PM2 for process management:**
```bash
npm install -g pm2
pm2 start server.js --name "qr-menu"
pm2 save
pm2 startup
```

7. **Set up Nginx reverse proxy:**
```bash
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/default
```

Add:
```nginx
upstream backend {
  server localhost:5000;
}

server {
  listen 80;
  server_name your-domain.com;

  location /api {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
  }

  location / {
    root /home/user/QR_Menu_System/frontend/build;
    try_files $uri /index.html;
  }
}
```

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 4. Environment Variables Checklist

**Backend (.env):**
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=random_secure_key_at_least_32_chars
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
PORT=5000
```

**Frontend (.env):**
```
REACT_APP_API_URL=https://your-backend-domain.com
```

## 5. Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Frontend build tested locally
- [ ] Backend runs without errors
- [ ] MongoDB connection string works
- [ ] CORS configured correctly in backend
- [ ] JWT secret is strong and random
- [ ] No console.log() statements in production code
- [ ] Git repo cleaned (no node_modules in commits)
- [ ] .env files are in .gitignore
- [ ] HTTPS enabled (self-signed cert or Let's Encrypt)

## 6. Quick Start - All-in-One Deployment

### Heroku (Recommended - Free tier available)

```bash
# 1. Install Heroku CLI
npm install -g heroku

# 2. Login
heroku login

# 3. Create app
heroku create qr-menu-app

# 4. Add MongoDB Atlas URI
heroku config:set MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/qr-menu"

# 5. Set JWT secret
heroku config:set JWT_SECRET="your-random-secret-key"

# 6. Deploy
git push heroku main

# 7. View logs
heroku logs --tail
```

## 7. Monitoring & Maintenance

### Check logs:
```bash
heroku logs --tail              # Heroku
pm2 logs qr-menu               # PM2/EC2
```

### Update code:
```bash
git pull origin main
npm run build --prefix frontend
pm2 restart qr-menu
```

### Backup MongoDB:
```bash
mongodump --uri "mongodb+srv://..." --out ./backup
```

## Support & Troubleshooting

- **Frontend not loading**: Check CORS headers in backend
- **API calls fail**: Verify REACT_APP_API_URL environment variable
- **MongoDB connection error**: Check connection string and network whitelist
- **Port already in use**: `lsof -i :5000` (macOS/Linux) or `netstat -ano | findstr :5000` (Windows)

---

**Recommended Stack for Production:**
- Frontend: Vercel or Netlify
- Backend: Heroku or DigitalOcean App Platform
- Database: MongoDB Atlas (cloud-hosted)
- Domain: Namecheap or GoDaddy
- Email: SendGrid or AWS SES

