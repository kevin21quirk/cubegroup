# Cube Group Payroll Automation Platform

**Developed by AI Bridge Solutions**

A production-grade, multi-tenant payroll workflow automation platform for UK umbrella payroll broker operations.

## Features

- 🔐 **Multi-tenant Architecture** - Support for multiple client companies and umbrella payroll providers
- 📧 **Email Ingestion** - Automated Gmail integration for payroll submission intake
- 🤖 **AI Document Extraction** - Intelligent parsing of PDFs, Word docs, Excel, and scanned images
- 📊 **Spreadsheet Generation** - Automated Excel template population with ExcelJS
- 💰 **Invoice Management** - Dual invoice generation for clients and umbrella companies
- 💳 **Payment Reconciliation** - Track payments and match to invoices
- 🔄 **Workflow Engine** - Automated state management and processing pipeline
- 📈 **CRM Module** - Comprehensive company, contact, and worker management
- 🎯 **Dashboard Analytics** - Real-time metrics, revenue tracking, and KPIs
- 🔒 **Enterprise Security** - RBAC, audit logging, and GDPR compliance

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first styling
- **shadcn/ui** - Modern component library
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Primary database (Neon.tech)

### Authentication
- **Clerk** - User authentication and management
- **RBAC** - Role-based access control

### AI & Document Processing
- **OpenAI GPT-4** - Document extraction and normalization
- **Tesseract.js** - OCR for scanned documents
- **pdf-parse** - PDF text extraction
- **mammoth** - Word document parsing
- **ExcelJS** - Excel generation and parsing

### Storage & Email
- **Vercel Blob** - File storage (AWS S3 compatible)
- **Gmail API** - Email integration

### Deployment
- **Vercel** - Hosting and deployment
- **AWS Migration Ready** - Architecture supports future AWS migration

## Getting Started

### Prerequisites

- Node.js 18.17.0 or higher
- PostgreSQL database (Neon.tech recommended)
- Clerk account
- OpenAI API key
- Google Cloud project (for Gmail API)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd CubeGroup
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials.

4. Set up the database:
```bash
npm run db:push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses a comprehensive Prisma schema with the following core models:

- **Users & Permissions** - User management and RBAC
- **Companies** - Client company management
- **Workers** - Contractor/employee records
- **UmbrellaCompanies** - Payroll provider management
- **PayrollSubmissions** - Incoming payroll data
- **Invoices** - Client and umbrella invoicing
- **Payments** - Payment tracking and reconciliation
- **Documents** - File storage and metadata
- **EmailImports** - Email ingestion records
- **AuditLogs** - Complete audit trail
- **WorkflowStates** - Process automation

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Dashboard-specific components
│   ├── crm/              # CRM module components
│   └── shared/           # Shared components
├── lib/                   # Core libraries
│   ├── services/         # Business logic services
│   ├── repositories/     # Data access layer
│   ├── ai/               # AI service abstraction
│   ├── email/            # Email service abstraction
│   ├── storage/          # Storage service abstraction
│   └── utils/            # Utility functions
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom React hooks
└── middleware.ts          # Next.js middleware
```

## User Roles

- **Super Admin** - Full system access
- **Cube Admin** - Cube Group administrative access
- **Payroll Operator** - Process payroll submissions
- **Finance User** - Invoice and payment management
- **Read-only User** - View-only access

## Workflow States

1. Email Received
2. Processing
3. Awaiting Validation
4. Ready for Invoice
5. Invoice Sent
6. Awaiting Payment
7. Payment Received
8. Umbrella Invoice Sent
9. Completed
10. Failed

## API Routes

- `/api/auth/*` - Authentication endpoints
- `/api/companies/*` - Company management
- `/api/workers/*` - Worker management
- `/api/payroll/*` - Payroll processing
- `/api/invoices/*` - Invoice generation
- `/api/documents/*` - Document upload/download
- `/api/email/*` - Email integration
- `/api/webhooks/*` - External webhooks (Zapier, etc.)

## Security Features

- ✅ Role-based access control (RBAC)
- ✅ Encrypted environment variables
- ✅ Secure file upload validation
- ✅ Comprehensive audit logging
- ✅ GDPR-compliant data handling
- ✅ Session security with Clerk
- ✅ Rate limiting on API routes

## Future AWS Migration

The codebase is architected for easy migration to AWS:

- **Storage**: Vercel Blob → AWS S3
- **AI**: OpenAI → AWS Bedrock / SageMaker
- **OCR**: Tesseract.js → AWS Textract
- **Hosting**: Vercel → AWS Amplify
- **Database**: Neon → AWS RDS

All services use abstraction layers to minimize migration effort.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## License

Proprietary - Cube Group / AI Bridge Solutions

## Support

For support, contact AI Bridge Solutions.
