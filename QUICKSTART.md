# Cube Group Platform - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will get you up and running with the Cube Group Payroll Automation Platform.

## Prerequisites Checklist

- [ ] Node.js 18.17.0+ installed
- [ ] npm or yarn installed
- [ ] Git installed

## Step-by-Step Setup

### 1. Install Dependencies (2 minutes)

```bash
cd CubeGroup
npm install
```

### 2. Set Up Database (1 minute)

**Option A: Use Neon.tech (Recommended)**

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string

**Option B: Local PostgreSQL**

```bash
# Install PostgreSQL locally
# Then create a database:
createdb cubegroup
```

### 3. Configure Environment (1 minute)

```bash
# Copy example file
cp .env.example .env

# Edit .env and add your database URL
# Minimum required for testing:
DATABASE_URL="your-database-url-here"
```

### 4. Initialize Database (30 seconds)

```bash
npm run db:push
```

### 5. Run the Application (30 seconds)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## Quick Configuration

### Enable Authentication (Optional)

1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Add to `.env`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

### Enable AI Features (Optional)

1. Get API key from [platform.openai.com](https://platform.openai.com)
2. Add to `.env`:

```env
OPENAI_API_KEY=sk-xxxxx
```

### Enable File Storage (Optional)

1. Sign up at [vercel.com](https://vercel.com)
2. Create a Blob store
3. Add to `.env`:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxx
```

## Testing the Platform

### 1. Access the Dashboard

Navigate to [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

### 2. View Database

```bash
npm run db:studio
```

This opens Prisma Studio at [http://localhost:5555](http://localhost:5555)

### 3. Create Test Data

Use Prisma Studio to create:
- A test company
- A test worker
- A test umbrella company

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:generate     # Generate Prisma Client
npm run db:push         # Push schema to database
npm run db:studio       # Open database GUI

# Code Quality
npm run lint            # Run ESLint
```

## Project Structure Quick Reference

```
src/
├── app/                    # Pages and routes
│   ├── (auth)/            # Login/signup
│   ├── (dashboard)/       # Main application
│   └── api/               # API endpoints
├── components/            # React components
│   ├── dashboard/         # Dashboard UI
│   └── ui/                # Base UI components
├── lib/                   # Core logic
│   ├── services/          # Business logic
│   └── prisma.ts          # Database client
└── types/                 # TypeScript types
```

## Key Features to Explore

### 1. Dashboard
- View payroll submissions
- Track workflow states
- Monitor revenue

### 2. CRM (Coming Soon)
- Manage companies
- Track workers
- Store documents

### 3. Email Integration (Coming Soon)
- Connect Gmail
- Auto-process payroll emails
- Extract attachments

### 4. Invoice Generation (Coming Soon)
- Create client invoices
- Generate umbrella invoices
- Track payments

## Troubleshooting

### "Cannot connect to database"
- Check your `DATABASE_URL` in `.env`
- Ensure database is running
- Try `npm run db:push` again

### "Module not found"
- Delete `node_modules` and `.next`
- Run `npm install` again

### "Port 3000 already in use"
- Change port: `PORT=3001 npm run dev`
- Or kill the process using port 3000

### TypeScript Errors
- These are expected before running `npm install`
- Run `npm install` to resolve all dependencies
- Run `npm run db:generate` to generate Prisma types

## Next Steps

1. **Read SETUP.md** for detailed configuration
2. **Read ARCHITECTURE.md** to understand the system
3. **Explore the code** in `src/` directory
4. **Build features** based on your requirements

## Getting Help

- Check `README.md` for overview
- Check `SETUP.md` for detailed setup
- Check `ARCHITECTURE.md` for technical details
- Review code comments for implementation details

## Production Deployment

When ready to deploy:

```bash
# Deploy to Vercel
vercel

# Or build locally
npm run build
npm run start
```

See `SETUP.md` for full deployment instructions.

---

**You're all set! Start building amazing payroll automation features! 🎉**

For questions or support, contact AI Bridge Solutions.
