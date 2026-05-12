# Cube Group Payroll Platform - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.17.0 or higher
- **npm** or **yarn** package manager
- **Git** for version control
- **PostgreSQL** database (or Neon.tech account)

## Step 1: Install Dependencies

Navigate to the project directory and install all dependencies:

```bash
cd CubeGroup
npm install
```

This will install all required packages including:
- Next.js 15
- Prisma ORM
- Clerk authentication
- OpenAI SDK
- Document processing libraries
- UI components

## Step 2: Set Up Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` and configure the following variables:

### Database Configuration

Sign up for a free PostgreSQL database at [Neon.tech](https://neon.tech):

```env
DATABASE_URL="postgresql://user:password@host.neon.tech/cubegroup?sslmode=require"
```

### Clerk Authentication

Sign up at [Clerk.com](https://clerk.com) and create a new application:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### OpenAI API

Get your API key from [OpenAI Platform](https://platform.openai.com):

```env
OPENAI_API_KEY=sk-xxxxx
```

### Vercel Blob Storage

Sign up at [Vercel](https://vercel.com) and create a Blob store:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxx
```

### Gmail API (Optional - for email integration)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs

```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### Application Settings

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Step 3: Initialize the Database

Run Prisma migrations to create the database schema:

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push
```

To view and manage your database with Prisma Studio:

```bash
npm run db:studio
```

## Step 4: Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Step 5: Create Your First User

1. Navigate to [http://localhost:3000](http://localhost:3000)
2. Click "Sign Up" to create a new account
3. Complete the Clerk registration flow
4. You'll be redirected to the dashboard

## Step 6: Configure User Roles

By default, new users have `READ_ONLY` role. To grant admin access:

1. Open Prisma Studio: `npm run db:studio`
2. Navigate to the `User` table
3. Find your user and change `role` to `SUPER_ADMIN`
4. Save changes and refresh your browser

## Project Structure

```
CubeGroup/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/           # Authentication pages
│   │   ├── (dashboard)/      # Protected dashboard routes
│   │   ├── api/              # API routes
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/           # React components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── ui/               # shadcn/ui components
│   │   └── theme-provider.tsx
│   ├── lib/                  # Core libraries
│   │   ├── services/         # Business logic
│   │   │   ├── ai/          # AI providers
│   │   │   ├── storage/     # Storage providers
│   │   │   ├── email/       # Email integration
│   │   │   ├── document/    # Document processing
│   │   │   ├── spreadsheet/ # Excel generation
│   │   │   ├── invoice/     # Invoice generation
│   │   │   ├── workflow/    # Workflow engine
│   │   │   └── validation/  # Validation rules
│   │   ├── prisma.ts        # Prisma client
│   │   └── utils.ts         # Utility functions
│   ├── types/               # TypeScript types
│   └── middleware.ts        # Next.js middleware
├── .env                     # Environment variables
├── .env.example            # Example environment file
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
└── tailwind.config.ts      # Tailwind config
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Features Overview

### 1. Authentication & Authorization
- Clerk-based authentication
- Role-based access control (RBAC)
- 5 user roles: Super Admin, Cube Admin, Payroll Operator, Finance User, Read-only

### 2. CRM Module
- Company management
- Contact management
- Worker/contractor tracking
- Document storage
- Activity timeline

### 3. Email Integration
- Gmail API integration
- Automatic payroll email detection
- Attachment processing
- Email archiving

### 4. AI Document Extraction
- PDF parsing
- Word document parsing
- OCR for scanned images
- Excel/CSV support
- AI-powered data normalization

### 5. Workflow Automation
- 10-state workflow engine
- Automatic state transitions
- Validation rules
- Exception handling
- Audit logging

### 6. Invoice Management
- Client invoice generation
- Umbrella company invoicing
- VAT calculation
- Payment tracking
- PDF generation (to be implemented)

### 7. Spreadsheet Generation
- Excel template population
- Formula preservation
- CSV export
- Automated payroll sheets

### 8. Dashboard & Analytics
- Real-time metrics
- Revenue tracking
- Workflow queue visualization
- Recent submissions
- Payment status

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Verify your `DATABASE_URL` is correct
2. Ensure your database is accessible
3. Check firewall settings
4. Try running `npm run db:push` again

### Clerk Authentication Issues

If authentication isn't working:

1. Verify Clerk keys are correct
2. Check that redirect URLs match your configuration
3. Ensure you're using the correct environment (development/production)

### Module Not Found Errors

If you see "Cannot find module" errors:

1. Delete `node_modules` and `.next` folders
2. Run `npm install` again
3. Run `npm run dev`

## Next Steps

### Immediate Tasks

1. **Configure Clerk Roles**: Set up role mapping in Clerk dashboard
2. **Add Sample Data**: Create test companies and workers
3. **Test Email Integration**: Connect Gmail and test email parsing
4. **Configure Storage**: Set up Vercel Blob or AWS S3

### Development Roadmap

1. **Implement PDF Generation**: Add invoice PDF generation with pdfkit
2. **Build CRM Pages**: Create company and worker management pages
3. **Add Email Inbox UI**: Build email inbox interface
4. **Implement Reports**: Create revenue and analytics reports
5. **Add Payment Reconciliation**: Integrate Open Banking
6. **Build Mobile UI**: Optimize for mobile devices

### Production Deployment

When ready to deploy to production:

1. **Set up Vercel Project**:
   ```bash
   vercel
   ```

2. **Configure Environment Variables** in Vercel dashboard

3. **Set up Production Database** (Neon.tech or AWS RDS)

4. **Run Database Migrations**:
   ```bash
   npm run db:migrate
   ```

5. **Deploy**:
   ```bash
   vercel --prod
   ```

### AWS Migration Path

To migrate to AWS infrastructure:

1. **Database**: Neon → AWS RDS PostgreSQL
2. **Storage**: Vercel Blob → AWS S3
3. **AI**: OpenAI → AWS Bedrock
4. **OCR**: Tesseract.js → AWS Textract
5. **Hosting**: Vercel → AWS Amplify

All services use abstraction layers for easy migration.

## Support

For issues or questions:

- Check the README.md for detailed documentation
- Review the code comments for implementation details
- Contact AI Bridge Solutions for enterprise support

## License

Proprietary - Cube Group / AI Bridge Solutions

---

**Built with ❤️ by AI Bridge Solutions**
