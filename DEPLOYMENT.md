# 🚀 Deployment Guide for SwipeRush

This guide covers deploying SwipeRush (React + Node.js + PostgreSQL) to popular hosting platforms.

## 📋 Project Overview

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Features**: Real-time updates, file uploads, authentication

---

## 🚂 Option 1: Railway (Recommended)

**Best for**: Easy deployment, good balance of features and cost

### Prerequisites
- Railway account ([railway.app](https://railway.app))
- GitHub account (optional but recommended)

### Deployment Steps

#### 1. Database Setup

1. Create a new project on Railway
2. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. Copy the connection string from the database service

#### 2. Backend Deployment

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository
3. **IMMEDIATELY** after creating the service, set the **Root Directory**:
   - Click on the newly created service
   - Go to **Settings** → **Variables** tab
   - Scroll down to find **Root Directory**
   - Enter: `backend`
   - Click **"Deploy"** button at top right or wait for auto-deploy
4. Railway will now detect it's a Node.js project in the backend folder
5. Configure environment variables in the service settings:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
CORS_ORIGIN=https://your-frontend-domain.com
PORT=5000
```

6. Railway will automatically detect the build and start commands from `package.json`

7. Add persistent storage for uploads:
   - Settings → **Volumes** → Add `/app/uploads`

8. Deploy the database migrations:
   - Go to **Deployments** → Click on the deployment
   - Go to **Command** tab
   - Run: `npx prisma migrate deploy`

9. Optional: Seed the database:
   - In the same **Command** tab, run: `npm run db:seed`

#### 3. Frontend Deployment

1. In Railway, click **"+ New"** → **"Static Site"**
2. Connect your GitHub repo
3. Configure build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Root Directory**: `./` (root of repo)

4. Configure environment variables:
```env
VITE_API_URL=https://your-backend-url.railway.app/api
```

5. Deploy!

#### 4. Custom Domains

- Railway provides free `.railway.app` domains
- For custom domains, add them in project settings
- SSL is automatically handled

### Costs
- **Free tier**: $5 in credits/month (good for testing)
- **Paid**: ~$5-20/month depending on usage

---

## 🎨 Option 2: Render

**Best for**: Free tier testing, straightforward setup

### Deployment Steps

#### 1. Database Setup

1. Create account at [render.com](https://render.com)
2. **"New +"** → **"PostgreSQL"**
3. Choose **Free** plan (or paid for production)
4. Copy the internal database URL

#### 2. Backend Deployment

1. **"New +"** → **"Web Service"**
2. Connect GitHub repository
3. Configure:
   - **Name**: swipe-rush-backend
   - **Region**: Choose closest to users
   - **Branch**: main
   - **Root Directory**: backend
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   
4. Add environment variables:
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=...
# ... (same as Railway)
```

5. Add persistent disk:
   - **"Advanced"** → **"Add Persistent Disk"**
   - Path: `/opt/render/project/src/uploads`
   - Size: 10GB (adjust as needed)

6. **Create Web Service**

7. Run migrations (one-time):
   - Go to **"Shell"** tab
   - Run: `npm run db:migrate`

#### 3. Frontend Deployment

1. **"New +"** → **"Static Site"**
2. Connect GitHub repo
3. Configure:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Root Directory**: `./`

4. Add environment variable:
```env
VITE_API_URL=https://your-backend.onrender.com/api
```

5. **Create Static Site**

### Costs
- **Free tier**: Limited, spins down after 15 min inactivity
- **Paid**: $19+/month for always-on

---

## 🪶 Option 3: Fly.io

**Best for**: Global edge deployment, best performance

### Prerequisites
- Fly.io account ([fly.io](https://fly.io))
- Fly CLI installed

### Setup

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login**:
   ```bash
   fly auth login
   ```

3. **Database Setup** (using Supabase or Neon):
   - Option A: [Supabase](https://supabase.com) - Free PostgreSQL
   - Option B: [Neon](https://neon.tech) - Serverless PostgreSQL

4. **Backend Setup**:
   ```bash
   cd backend
   fly launch
   ```

5. **Create `fly.toml`**:
   ```toml
   app = "swipe-rush-backend"
   primary_region = "iad"

   [build]
     builder = "paketobuildpacks/builder:base"

   [http_service]
     internal_port = 5000
     force_https = true

   [[vm]]
     memory_mb = 512
   ```

6. **Add secrets**:
   ```bash
   fly secrets set DATABASE_URL="..." JWT_SECRET="..."
   ```

7. **Deploy**:
   ```bash
   fly deploy
   ```

8. **Frontend**: Deploy to Vercel or Netlify (easier for static sites)

### Costs
- **Free tier**: 3 shared VMs, good for testing
- **Paid**: ~$5-15/month

---

## 🌐 Option 4: Vercel + Supabase (Split Hosting)

**Best for**: Free tier, serverless architecture

### Setup

1. **Frontend on Vercel**:
   - [vercel.com](https://vercel.com)
   - Import GitHub repo
   - Root directory: `./`
   - Build: `npm run build`
   - Framework preset: Vite
   - Add env: `VITE_API_URL=https://your-backend.vercel.app/api`

2. **Backend on Vercel**:
   - Same project
   - Add serverless function (may require refactoring for Express)

3. **Database**: [Supabase](https://supabase.com)
   - Free PostgreSQL
   - Copy connection string
   - Add to Vercel env vars

### Note
This requires significant refactoring to use Vercel serverless functions instead of Express.

---

## 🐳 Option 5: Docker + VPS (DigitalOcean, Linode, etc.)

**Best for**: Full control, best for scaling

### Setup

1. **Create `Dockerfile` for backend**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

2. **Create `docker-compose.yml`**:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: swipe_rush
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://user:password@postgres:5432/swipe_rush
      # ... other vars
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      VITE_API_URL: http://backend:5000/api
```

3. **Deploy to VPS**:
   - DigitalOcean Droplet ($6-12/month)
   - Setup Docker & Docker Compose
   - Clone repo
   - Run: `docker-compose up -d`

---

## ✅ Post-Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] File upload storage working
- [ ] CORS configured for frontend domain
- [ ] SSL/HTTPS enabled
- [ ] Database seeded (optional)
- [ ] Error logging configured
- [ ] Monitoring setup (optional)
- [ ] Backup strategy in place

---

## 🎯 Recommended for Your Project

**For Development/Testing**: **Render** (free tier)  
**For Production**: **Railway** ($5-15/month)  
**For Scale**: **Fly.io + Supabase** (edge deployment)

---

## 📚 Additional Resources

- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Fly.io Docs](https://fly.io/docs)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)

---

## 🆘 Troubleshooting

### Database Connection Issues
- Check DATABASE_URL format
- Ensure database allows connections from your IP
- Run migrations: `npx prisma migrate deploy`

### Upload Issues
- Ensure persistent storage is configured
- Check file permissions
- Verify UPLOAD_DIR path

### CORS Errors
- Set CORS_ORIGIN to your frontend domain
- Include credentials: true in backend CORS

### Build Failures
- Check Node version (should be 18+)
- Clear cache: `npm cache clean --force`
- Check disk space

---

**Need help?** Open an issue or check platform-specific documentation.

