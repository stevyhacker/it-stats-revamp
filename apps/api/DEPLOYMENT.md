# API Deployment Guide

## Free Deployment Options

### 1. Railway (Recommended)
**Free Tier:** $5 credit monthly

1. **Setup:**
   ```bash
   npm install -g @railway/cli
   railway login
   railway init
   ```

2. **Deploy:**
   ```bash
   npm run deploy:railway
   ```

3. **Environment Variables:**
   - `DATABASE_URL`
   - `NODE_ENV=production`

### 2. Fly.io
**Free Tier:** 3 small VMs, 160GB outbound data transfer

1. **Setup:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   fly auth login
   fly launch --copy-config --name it-stats-api
   ```

2. **Deploy:**
   ```bash
   npm run deploy:fly
   ```

3. **Set Secrets:**
   ```bash
   fly secrets set DATABASE_URL=your_database_url
   ```

### 3. Render
**Free Tier:** 750 hours/month

1. Connect your GitHub repo to Render
2. Use the provided `render.yaml` configuration
3. Add environment variables in Render dashboard

## Database Options

### Free Database Services:
- **Neon** (PostgreSQL) - 512MB free
- **PlanetScale** (MySQL) - 5GB free  
- **Railway** - PostgreSQL with your deployment
- **Supabase** - PostgreSQL with 500MB free

## Required Environment Variables

```bash
DATABASE_URL=your_database_url_here
NODE_ENV=production
```

## Post-Deployment Steps

1. Update your frontend API URL to point to the deployed endpoint
2. Update Clerk dashboard with your new API domain
3. Run database migrations if needed:
   ```bash
   cd packages/db && npm run db:push
   ```

## Monitoring

- Railway: Built-in metrics and logs
- Fly.io: `fly logs` command
- Render: Dashboard logs and metrics 