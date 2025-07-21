# Railway Deployment Guide

## Setup Complete ✅

Your ITStats.me application is now configured for Railway deployment with the following setup:

### Services Created
- **it-stats-api**: Hono/Bun backend API service
- **it-stats-web**: Next.js frontend service  
- **Postgres**: PostgreSQL database service

### Service URLs
- **API**: https://it-stats-api-production.up.railway.app
- **Frontend**: https://it-stats-web-production.up.railway.app

### Environment Variables Configured

#### API Service (it-stats-api)
- `DATABASE_URL`: Connected to Postgres service
- `NODE_ENV=production`

#### Web Service (it-stats-web)  
- `NEXT_PUBLIC_API_URL`: Connected to API service
- `NODE_ENV=production`

## Deployment Commands

### Deploy Both Services
```bash
# From project root
pnpm run deploy:api    # Deploy API service
pnpm run deploy:web    # Deploy web service
```

### Deploy Individual Services
```bash
# API only (from root)
railway up --service it-stats-api

# Frontend only  
cd apps/web && railway up --service it-stats-web
```

### Fixed Deployment Issue
- API now deploys from root directory using `Dockerfile.api`
- Web service deploys from `apps/web` directory using Nixpacks

## Configuration Files
- `apps/api/railway.json`: API service configuration (Dockerfile-based)
- `apps/web/railway.json`: Frontend service configuration (Nixpacks-based)

## Database Setup
Your PostgreSQL database is ready. To run migrations:
```bash
pnpm db:push
```

## Monitoring
- View logs: `railway logs` (switch services with `railway service <name>`)
- Project dashboard: `railway open`
- Monitor deployments via provided build log URLs

## Next Steps
1. Both services should be deploying now
2. Check deployment status at: `railway open`  
3. Test API endpoint: https://it-stats-api-production.up.railway.app
4. Test frontend: https://it-stats-web-production.up.railway.app
5. Run database migrations if needed: `pnpm db:push`

## Troubleshooting
- Check service logs: `railway logs`
- Switch between services: `railway service it-stats-api` or `railway service it-stats-web`
- Redeploy: `railway up --service <service-name>`