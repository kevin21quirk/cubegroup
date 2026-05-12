# Cube Group Platform - Architecture Documentation

## System Overview

The Cube Group Payroll Automation Platform is a multi-tenant SaaS application designed to automate the entire payroll workflow for UK umbrella payroll brokers.

## Architecture Principles

### 1. **Separation of Concerns**
- Clear separation between UI, business logic, and data access
- Service layer pattern for reusable business logic
- Repository pattern for data access (via Prisma)

### 2. **Provider Abstraction**
- AI services abstracted to support multiple providers (OpenAI, AWS Bedrock)
- Storage abstracted to support Vercel Blob and AWS S3
- Email services abstracted for future providers

### 3. **Type Safety**
- Strongly typed TypeScript throughout
- Prisma-generated types for database entities
- Zod schemas for runtime validation

### 4. **Scalability**
- Stateless architecture for horizontal scaling
- Database connection pooling
- Async processing for heavy operations

## Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first styling
- **shadcn/ui**: Component library built on Radix UI
- **React Hook Form**: Form management
- **Zod**: Schema validation

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Prisma ORM**: Type-safe database access
- **PostgreSQL**: Relational database

### Authentication
- **Clerk**: User authentication and management
- **RBAC**: Role-based access control

### AI & Processing
- **OpenAI GPT-4**: Document extraction and normalization
- **Tesseract.js**: OCR for scanned documents
- **pdf-parse**: PDF text extraction
- **mammoth**: Word document parsing
- **ExcelJS**: Excel generation and parsing

### Storage & Email
- **Vercel Blob**: File storage (AWS S3 compatible)
- **Gmail API**: Email integration

## Data Model

### Core Entities

```
User
├── Role (enum)
├── AuditLogs
├── Notes
└── Activities

Company
├── CompanyContacts
├── Workers
├── PayrollSubmissions
├── Invoices
├── FeeStructures
├── Documents
└── UmbrellaCompany (relation)

PayrollSubmission
├── Company (relation)
├── EmailImport (relation)
├── PayrollEntries
├── Invoices
├── Documents
├── Tasks
├── Notes
└── WorkflowState (enum)

Invoice
├── InvoiceType (enum)
├── Company/UmbrellaCompany (relation)
├── PayrollSubmission (relation)
├── InvoiceItems
├── Payments
└── Status (enum)
```

## Service Architecture

### AI Service Layer

```typescript
interface AIProvider {
  extractPayrollData(text: string): Promise<DocumentExtractionResult>
  normalizeData(data: any): Promise<PayrollEntryData[]>
}
```

**Implementations:**
- `OpenAIProvider`: Uses GPT-4 for extraction
- `BedrockProvider`: AWS Bedrock (future)

**Usage:**
```typescript
const aiProvider = getAIProvider() // Returns configured provider
const result = await aiProvider.extractPayrollData(documentText)
```

### Storage Service Layer

```typescript
interface StorageProvider {
  upload(file: Buffer, path: string, mimeType: string): Promise<string>
  download(path: string): Promise<Buffer>
  delete(path: string): Promise<void>
  getUrl(path: string): string
}
```

**Implementations:**
- `VercelBlobProvider`: Vercel Blob storage
- `S3Provider`: AWS S3 (future)

### Email Service Layer

```typescript
interface EmailProvider {
  connect(): Promise<void>
  fetchMessages(options?: EmailFetchOptions): Promise<EmailMessage[]>
  watchInbox(callback: (message: EmailMessage) => void): Promise<void>
  sendEmail(to: string, subject: string, body: string): Promise<void>
}
```

**Implementation:**
- `GmailProvider`: Gmail API integration

### Document Processing Pipeline

```
Email/Upload → DocumentProcessor → AI Extraction → Validation → Normalization → Database
```

**Flow:**
1. Document received via email or upload
2. `DocumentProcessor` extracts text (PDF/Word/Image/CSV)
3. AI provider extracts structured data
4. `PayrollValidator` validates entries
5. Data normalized to standard schema
6. Stored in database with audit trail

### Workflow Engine

**States:**
```
EMAIL_RECEIVED → PROCESSING → AWAITING_VALIDATION → READY_FOR_INVOICE
→ INVOICE_SENT → AWAITING_PAYMENT → PAYMENT_RECEIVED
→ UMBRELLA_INVOICE_SENT → COMPLETED
```

**Features:**
- State transition validation
- Automatic progression
- Activity logging
- Rollback support

### Invoice Generation

```typescript
InvoiceGenerator
├── generateInvoice(data: InvoiceGenerationData)
├── generatePDF(invoiceId: string)
├── markAsSent(invoiceId: string)
└── markAsPaid(invoiceId: string, amount: number)
```

**Process:**
1. Calculate totals and VAT
2. Create invoice record
3. Generate invoice items
4. Create PDF (future)
5. Send via email
6. Track payment status

### Spreadsheet Generation

```typescript
SpreadsheetGenerator
├── generatePayrollSpreadsheet(entries: PayrollEntryData[])
├── populateTemplate(templatePath: string, data: any)
└── generateCSV(entries: PayrollEntryData[])
```

**Features:**
- Template-based generation
- Formula preservation
- Styling and formatting
- Multiple export formats

## API Architecture

### Route Structure

```
/api/
├── auth/
│   └── google/callback
├── companies/
│   ├── GET /api/companies
│   ├── POST /api/companies
│   ├── GET /api/companies/[id]
│   ├── PUT /api/companies/[id]
│   └── DELETE /api/companies/[id]
├── workers/
├── payroll/
├── invoices/
├── documents/
├── email/
└── webhooks/
```

### Authentication Flow

```
Request → Middleware → Clerk Auth Check → Route Handler
```

**Middleware:**
- Validates Clerk session
- Protects all routes except public ones
- Injects user context

### Error Handling

```typescript
try {
  // Business logic
} catch (error) {
  console.error('Error:', error)
  return NextResponse.json(
    { error: 'Error message' },
    { status: 500 }
  )
}
```

## Security Architecture

### Authentication
- Clerk handles all authentication
- JWT tokens for API requests
- Session management

### Authorization
- Role-based access control (RBAC)
- 5 roles with different permissions
- Route-level protection

### Data Security
- Environment variables for secrets
- Encrypted database connections
- Secure file upload validation
- Audit logging for all actions

### GDPR Compliance
- User data deletion support
- Data export functionality
- Consent management
- Activity tracking

## Deployment Architecture

### Development
```
Local Machine → Next.js Dev Server → Neon Database
```

### Production (Vercel)
```
User → Vercel Edge Network → Next.js App → Neon Database
                           ↓
                    Vercel Blob Storage
                           ↓
                    External APIs (OpenAI, Gmail)
```

### Future AWS Architecture
```
User → CloudFront → AWS Amplify → RDS PostgreSQL
                        ↓
                    S3 Storage
                        ↓
                    Bedrock (AI)
                        ↓
                    Textract (OCR)
```

## Performance Optimization

### Database
- Connection pooling via Prisma
- Indexed columns for fast queries
- Selective field loading
- Pagination for large datasets

### Caching
- React Server Components caching
- Static generation where possible
- API response caching (future)

### Code Splitting
- Dynamic imports for heavy components
- Route-based code splitting
- Lazy loading for modals and dialogs

## Monitoring & Logging

### Application Logging
- Console logging in development
- Structured logging in production
- Error tracking (future: Sentry)

### Audit Trail
- All user actions logged
- Database changes tracked
- Workflow transitions recorded

### Analytics
- Dashboard metrics
- Revenue tracking
- Usage statistics

## Testing Strategy

### Unit Tests (Future)
- Service layer tests
- Utility function tests
- Validation logic tests

### Integration Tests (Future)
- API endpoint tests
- Database integration tests
- External service mocks

### E2E Tests (Future)
- Critical user flows
- Payment processing
- Invoice generation

## Migration Strategy

### Database Migrations
```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply to production
npx prisma migrate deploy
```

### Data Migrations
- Use Prisma scripts for data transformations
- Backup before major changes
- Test on staging environment

### Provider Migrations
- AI: OpenAI → Bedrock (change env var)
- Storage: Vercel Blob → S3 (change env var)
- Minimal code changes due to abstraction

## Scalability Considerations

### Horizontal Scaling
- Stateless application design
- Database connection pooling
- Serverless functions

### Vertical Scaling
- Database optimization
- Query performance tuning
- Index management

### Background Jobs (Future)
- Queue system for heavy processing
- Async email sending
- Batch invoice generation

## Future Enhancements

### Phase 2
- Mobile app (React Native)
- Advanced reporting
- Open Banking integration
- Automated payment reconciliation

### Phase 3
- Multi-currency support
- International payroll
- Advanced analytics with ML
- Custom workflow builder

### Phase 4
- White-label solution
- API for third-party integrations
- Marketplace for extensions
- Advanced automation rules

---

**Architecture designed and implemented by AI Bridge Solutions**
