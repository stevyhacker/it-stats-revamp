# Local Deployment Guide

## Prerequisites

1. **Bun** - Already installed ✓
2. **PostgreSQL** - Required for database
3. **Node.js** (optional) - For pnpm if preferred over bun

## Setup Instructions

### 1. Database Setup

#### Option A: Docker (Recommended)
```bash
# Install Docker if not present
# Then run:
docker compose up -d
```

#### Option B: Local PostgreSQL
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql

# Create database
createdb itstats
```

#### Option C: Supabase (Cloud - Free Tier)
1. Sign up at https://supabase.com
2. Create a new project
3. Copy the connection string to `.env`

### 2. Environment Configuration

Create `.env` files:

```bash
# Root .env
cp .env.example .env
# Edit with your database URL

# Database package .env
echo "DATABASE_URL=your_connection_string" > packages/db/.env
```

### 3. Install Dependencies

```bash
bun install
```

### 4. Database Migration & Seeding

```bash
# Generate and run migrations
bun run db:migrate

# Seed database with initial data
bun --filter db run seed
```

### 5. Start Development Servers

```bash
# Start both frontend and API
bun run dev

# Or individually:
bun --filter web run dev  # Frontend at http://localhost:5173
bun --filter api run dev  # API at http://localhost:3000
```

## Alternative: Run Without Database

For UI-only testing without database:

1. Comment out API calls in frontend components
2. Use mock data in `apps/web/src/components/Dashboard.tsx`
3. Run only the frontend:
   ```bash
   bun --filter web run dev
   ```

## Troubleshooting

- **Database connection issues**: Verify PostgreSQL is running and credentials are correct
- **Port conflicts**: Change ports in `.env` if 3000 or 5173 are in use
- **Build errors**: Run `bun run lint` to check for issues
- **Missing dependencies**: Clear node_modules and reinstall: `rm -rf node_modules && bun install`