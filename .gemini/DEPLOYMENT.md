# Production Deployment Guide

## 🚀 Quick Deploy

### Prerequisites
- Node.js 18+ installed
- MongoDB database (local or Atlas)
- Environment variables configured

---

## 📦 Frontend Deployment

### Step 1: Build
```bash
cd /path/to/foodie-dash-front
npm install
npm run build
```

### Step 2: Deploy Options

#### Option A: Static Hosting (Netlify, Vercel, etc.)
1. Connect your Git repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables in hosting dashboard

#### Option B: Nginx Server
```bash
# Copy dist folder to server
scp -r dist/ user@server:/var/www/foodie-dash

# Nginx configuration
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/foodie-dash;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (if serving both from same domain)
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Option C: Apache Server
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /var/www/foodie-dash

    <Directory /var/www/foodie-dash>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        # Enable URL rewriting for SPA
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

---

## 🖥️ Backend Deployment

### Step 1: Setup Server
```bash
# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install tsx globally
npm install -g tsx pm2

# Clone or upload project
cd /path/to/server
npm install
```

### Step 2: Configure Environment
```bash
# Create .env file
nano .env

# Add required variables (see .env.example)
```

### Step 3: Deploy Options

#### Option A: PM2 (Recommended for Production)
```bash
# Start with PM2
pm2 start npm --name "foodie-dash-api" -- start

# Or directly with tsx
pm2 start "tsx src/index.ts" --name "foodie-dash-api"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Monitor
pm2 monit

# View logs
pm2 logs foodie-dash-api

# Restart
pm2 restart foodie-dash-api
```

#### Option B: Systemd Service
```bash
# Create service file
sudo nano /etc/systemd/system/foodie-dash.service
```

```ini
[Unit]
Description=Foodie Dash API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/server
Environment=NODE_ENV=production
ExecStart=/usr/bin/tsx src/index.ts
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable foodie-dash
sudo systemctl start foodie-dash
sudo systemctl status foodie-dash

# View logs
sudo journalctl -u foodie-dash -f
```

#### Option C: Docker
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t foodie-dash-api ./server
docker run -d -p 5000:5000 --env-file ./server/.env foodie-dash-api
```

---

## 🔐 Environment Variables

### Frontend (.env)
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_GOOGLE_MAPS_API_KEY=your-maps-api-key
```

### Backend (server/.env)
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/foodie-dash

# Server
PORT=5000
NODE_ENV=production

# Security
JWT_SECRET=your-strong-random-secret-minimum-32-characters

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id

# CORS
FRONTEND_URL=https://yourdomain.com

# Admin Account (for initial setup)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=change-this-secure-password
```

---

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)
1. Create account at mongodb.com/cloud/atlas
2. Create a new cluster
3. Add database user
4. Whitelist IP address (0.0.0.0/0 for any IP, or specific IPs)
5. Get connection string
6. Add to `MONGODB_URI` in .env

### Local MongoDB
```bash
# Install MongoDB
sudo apt-get install mongodb

# Start service
sudo systemctl start mongodb

# Use in .env
MONGODB_URI=mongodb://localhost:27017/foodie-dash
```

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Use strong JWT_SECRET (32+ characters, random)
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure strict CORS (only allow your domain)
- [ ] Add helmet middleware (see security guide)
- [ ] Add rate limiting
- [ ] Remove .env files from Git
- [ ] Set NODE_ENV=production
- [ ] Disable verbose error messages
- [ ] Keep dependencies updated

---

## 🌐 SSL/HTTPS Setup

### Using Let's Encrypt (Free)
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

---

## 🧪 Testing Production Deployment

### Frontend
```bash
# Test locally first
npm run preview

# Visit http://localhost:4173
# Verify all features work
```

### Backend
```bash
# Test health endpoint
curl https://api.yourdomain.com/api/health

# Expected response
{"status":"OK","message":"Server is running"}
```

### Full Integration Test
1. Open frontend in browser
2. Try to login
3. Browse menu items
4. Add items to cart
5. Place an order
6. Check admin panel
7. Verify real-time updates

---

## 📊 Monitoring & Logs

### PM2 Monitoring
```bash
pm2 monit              # Real-time monitoring
pm2 logs               # View logs
pm2 status             # Status of all apps
```

### Basic Server Monitoring
```bash
# Check disk space
df -h

# Check memory
free -h

# Check CPU
top

# Check Node process
ps aux | grep node
```

---

## 🔄 Updates & Maintenance

### Frontend Updates
```bash
# Pull latest code
git pull origin main

# Rebuild
npm install
npm run build

# Deploy new build
# (copy dist/ to server or redeploy to hosting)
```

### Backend Updates
```bash
# Pull latest code
git pull origin main

# Install new dependencies
npm install

# Restart service
pm2 restart foodie-dash-api
```

---

## 🆘 Troubleshooting

### Frontend Issues
**Problem**: Blank page after deployment
- Check browser console for errors
- Verify API_URL is correct
- Check network tab for failed requests

**Problem**: 404 on refresh
- Configure server for SPA routing
- Add URL rewrite rules

### Backend Issues
**Problem**: Server won't start
- Check logs: `pm2 logs`
- Verify environment variables
- Check MongoDB connection

**Problem**: CORS errors
- Update FRONTEND_URL in .env
- Restart backend server

**Problem**: Socket.IO not working
- Verify WebSocket support in proxy
- Check firewall rules

---

## 📞 Support Resources

- MongoDB Atlas: https://docs.atlas.mongodb.com
- PM2 Documentation: https://pm2.keymetrics.io/docs
- Let's Encrypt: https://letsencrypt.org/docs
- Nginx: https://nginx.org/en/docs

---

## ✅ Deployment Checklist

- [ ] Frontend built successfully
- [ ] Backend dependencies installed
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] SSL certificate installed
- [ ] DNS records configured
- [ ] Firewall configured
- [ ] PM2/Service configured
- [ ] Logs accessible
- [ ] Monitoring setup
- [ ] Backup strategy defined
- [ ] Team has access credentials

---

**Ready to Deploy!** 🚀
