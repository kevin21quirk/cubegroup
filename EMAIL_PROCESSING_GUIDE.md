# Email Processing Pipeline - Implementation Guide

## Overview

This document describes the AI-powered email ingestion and payroll processing pipeline built for Cube Group's umbrella payroll automation platform.

## Architecture Components

### 1. Database Schema (Prisma)

**New Models Added:**
- `Attachment` - Email attachment storage and processing tracking
- `ValidationError` - Payroll validation error tracking
- `GeneratedSpreadsheet` - Generated spreadsheet tracking
- `WorkflowLog` - Workflow state transition logging

**Enhanced Models:**
- `EmailImport` - Added processing status, retry logic, error tracking
- `PayrollSubmission` - Added validation errors and generated spreadsheet relations
- `Company` - Added email mapping and template configuration fields

**New Enums:**
- `ProcessingStatus` - Email processing states
- `AttachmentStatus` - Attachment processing states
- `WorkflowState` - Enhanced with new states (ATTACHMENT_DOWNLOADED, AI_PROCESSING, VALIDATION_FAILED, AWAITING_REVIEW, SPREADSHEET_GENERATED, SAVED_TO_SERVER)

### 2. Service Architecture

#### Storage Service (`/src/services/storage/`)
- **Purpose**: Abstract storage layer for file management
- **Providers**: Local, Vercel Blob (future), S3 (future)
- **Interface**: `StorageProvider`
- **Methods**: upload, download, exists, delete, getUrl

#### File Delivery Service (`/src/services/delivery/`)
- **Purpose**: Upload generated spreadsheets to remote Windows server
- **Providers**: SMB, SFTP
- **Interface**: `FileDeliveryProvider`
- **Methods**: upload, move, exists, list
- **Helpers**: uploadToProcessed, uploadToExceptions, moveToProcessed

#### AI Extraction Service (`/src/services/ai/`)
- **Purpose**: Extract payroll data from documents using Anthropic Claude
- **Model**: Claude 3.5 Sonnet (configurable)
- **Input**: Document content + file type
- **Output**: Normalized payroll data in universal schema
- **Features**: 
  - Handles inconsistent layouts
  - Tolerates missing data
  - Returns confidence scores
  - JSON-structured responses

#### Validation Service (`/src/services/validation/`)
- **Purpose**: Validate extracted payroll data
- **Checks**:
  - Duplicate workers
  - Missing required fields
  - Invalid rates (below minimum wage)
  - Abnormal hours (>168 hours/week)
  - Gross pay calculation mismatches
  - Negative values
- **Output**: Validation result with errors and warnings

#### Spreadsheet Service (`/src/services/spreadsheet/`)
- **Purpose**: Generate Excel spreadsheets from payroll data
- **Library**: ExcelJS
- **Features**:
  - Load master templates
  - Preserve formatting and formulas
  - Dynamic row insertion
  - Currency formatting
  - Automatic totals calculation
- **Filename Format**: `CompanyName_WeekEnding_YYYY-MM-DD.xlsx`

#### Workflow Service (`/src/services/workflow/`)
- **Purpose**: Manage workflow state transitions
- **Features**:
  - State machine with valid transitions
  - Workflow logging
  - Timeline tracking
  - Retry logic
  - Failure handling

#### Email Processing Service (`/src/services/email/`)
- **Purpose**: Orchestrate the entire email-to-spreadsheet pipeline
- **Pipeline Steps**:
  1. Download attachments
  2. Extract payroll data (AI)
  3. Validate data
  4. Create payroll submission
  5. Generate spreadsheet
  6. Upload to remote server
  7. Update workflow state

### 3. API Endpoints

#### Gmail Webhook (`/api/webhooks/gmail`)
- **Method**: POST
- **Purpose**: Receive incoming email notifications
- **Payload**:
  ```json
  {
    "messageId": "string",
    "threadId": "string",
    "from": "string",
    "to": "string",
    "subject": "string",
    "bodyText": "string",
    "bodyHtml": "string",
    "receivedAt": "ISO date",
    "attachments": [
      {
        "filename": "string",
        "size": number,
        "mimeType": "string"
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "emailImportId": "string",
    "message": "Email received and queued for processing"
  }
  ```

### 4. Type Definitions

#### Universal Payroll Schema (`/src/types/payroll.ts`)
```typescript
interface NormalizedPayrollData {
  companyName: string
  payrollWeek: string
  workerName: string
  hoursWorked: number
  hourlyRate: number
  grossPay: number
  umbrellaCompany: string
  department: string
  site: string
  notes: string
}
```

#### Storage Interfaces (`/src/types/storage.ts`)
- `StorageProvider` - File storage abstraction
- `FileDeliveryProvider` - Remote file delivery abstraction
- Configuration types for SMB and SFTP

## Workflow States

1. **EMAIL_RECEIVED** - Email ingested into system
2. **ATTACHMENT_DOWNLOADED** - Attachments downloaded
3. **AI_PROCESSING** - AI extracting payroll data
4. **VALIDATION_FAILED** - Validation errors found
5. **AWAITING_REVIEW** - Manual review required
6. **SPREADSHEET_GENERATED** - Excel file created
7. **SAVED_TO_SERVER** - Uploaded to remote server
8. **READY_FOR_INVOICE** - Ready for invoice generation
9. **COMPLETED** - Processing complete
10. **FAILED** - Processing failed

## Environment Variables

```env
# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Storage
STORAGE_TYPE=local|vercel-blob|s3
LOCAL_STORAGE_PATH=./storage

# File Delivery
FILE_DELIVERY_TYPE=smb|sftp

# SMB Configuration
SMB_HOST=192.168.1.100
SMB_SHARE_NAME=ShareName
SMB_DOMAIN=WORKGROUP
SMB_USERNAME=username
SMB_PASSWORD=password

# SFTP Configuration
SFTP_HOST=192.168.1.100
SFTP_PORT=22
SFTP_USERNAME=username
SFTP_PASSWORD=password
```

## Remote Folder Structure

```
Desktop/
  AI-Incoming/      # Incoming files (future use)
  AI-Processed/     # Successfully processed spreadsheets
  AI-Exceptions/    # Validation failures or errors
```

## MVP Workflow

The first working flow achieves:

1. Email arrives → Gmail webhook triggers
2. POST to `/api/webhooks/gmail`
3. Email import record created
4. Attachments downloaded
5. AI extracts payroll data
6. Data validated
7. Payroll submission created
8. Excel spreadsheet generated
9. Spreadsheet uploaded to `Desktop/AI-Processed/`
10. Workflow state updated to COMPLETED

## Next Steps

### Immediate Implementation Needed:
1. **Gmail API Integration** - Actual attachment download from Gmail
2. **File Content Extraction** - Read XLSX/CSV/PDF content for AI processing
3. **SMB/SFTP Implementation** - Complete the file delivery providers
4. **UI Pages** - Build dashboard pages for email inbox, workflow, etc.
5. **Testing** - End-to-end testing of the pipeline

### Future Enhancements:
1. **AWS Migration** - Replace services with AWS equivalents
   - S3 for storage
   - Textract for document extraction
   - Bedrock for AI
   - SageMaker for custom models
2. **Queue System** - Add job queue (Bull, BullMQ) for async processing
3. **Monitoring** - Add logging, metrics, and alerts
4. **Error Recovery** - Enhanced retry logic and manual intervention workflows

## Database Migration

To apply the schema changes:

```bash
npx prisma migrate dev --name add_email_processing_models
npx prisma generate
```

## Testing the Pipeline

1. Send a test POST request to `/api/webhooks/gmail`:
```bash
curl -X POST http://localhost:3000/api/webhooks/gmail \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "test-123",
    "from": "client@example.com",
    "to": "payroll@cubegroup.com",
    "subject": "Payroll Week Ending 2024-01-15",
    "bodyText": "Please find attached payroll",
    "attachments": [
      {
        "filename": "payroll.xlsx",
        "size": 50000,
        "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }
    ]
  }'
```

2. Check the database for created records:
```sql
SELECT * FROM "EmailImport" ORDER BY "createdAt" DESC LIMIT 1;
SELECT * FROM "Attachment" WHERE "emailImportId" = 'xxx';
SELECT * FROM "WorkflowLog" WHERE "emailImportId" = 'xxx';
```

## Architecture Principles

1. **Modularity** - Each service is independent and replaceable
2. **Cloud-Agnostic** - Easy migration between providers
3. **Type Safety** - Full TypeScript coverage
4. **Error Handling** - Comprehensive error tracking and logging
5. **Scalability** - Designed for async processing and queues
6. **Testability** - Services can be mocked and tested independently

## File Structure

```
src/
├── services/
│   ├── ai/
│   │   └── AIExtractionService.ts
│   ├── delivery/
│   │   ├── FileDeliveryService.ts
│   │   └── providers/
│   │       ├── SMBProvider.ts
│   │       └── SFTPProvider.ts
│   ├── email/
│   │   └── EmailProcessingService.ts
│   ├── spreadsheet/
│   │   └── SpreadsheetService.ts
│   ├── storage/
│   │   ├── StorageService.ts
│   │   └── providers/
│   │       └── LocalStorageProvider.ts
│   ├── validation/
│   │   └── ValidationService.ts
│   └── workflow/
│       └── WorkflowService.ts
├── types/
│   ├── payroll.ts
│   └── storage.ts
└── app/
    └── api/
        └── webhooks/
            └── gmail/
                └── route.ts
```

---

**Built by AI Bridge Solutions for Cube Group**
**Version**: 1.0.0
**Last Updated**: 2024
