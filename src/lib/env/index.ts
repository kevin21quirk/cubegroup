/**
 * Typed, validated environment variables.
 * Uses Zod to parse process.env at runtime with safe defaults.
 * Import `env` instead of using `process.env` directly.
 */
import { z } from 'zod'

const envSchema = z.object({
  // ── Core ────────────────────────────────────────────────────────────────
  DATABASE_URL:                      z.string().min(1).default(''),
  NODE_ENV:                          z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL:               z.string().default('http://localhost:3000'),

  // ── Auth (Clerk) ─────────────────────────────────────────────────────────
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY:                  z.string().optional(),

  // ── AI (Anthropic Claude) ─────────────────────────────────────────────────
  ANTHROPIC_API_KEY:                 z.string().optional(),
  ANTHROPIC_MODEL:                   z.string().default('claude-sonnet-4-5'),

  // ── Google / Gmail ────────────────────────────────────────────────────────
  GOOGLE_CLIENT_ID:                  z.string().optional(),
  GOOGLE_CLIENT_SECRET:              z.string().optional(),
  GOOGLE_REDIRECT_URI:               z.string().optional(),
  // Stored in DB (SystemConfig) after OAuth – can also be set as env fallback
  GOOGLE_REFRESH_TOKEN:              z.string().optional(),

  // Label to monitor for incoming payroll emails
  GMAIL_MONITOR_LABEL:               z.string().default('Payroll-Incoming'),
  // Label to apply after successful processing
  GMAIL_PROCESSED_LABEL:             z.string().default('Payroll-Processed'),
  // Optional: restrict monitoring to a specific inbox address
  GMAIL_MONITOR_EMAIL:               z.string().optional(),

  // ── Xero ────────────────────────────────────────────────────────────────
  XERO_CLIENT_ID:                    z.string().optional(),
  XERO_CLIENT_SECRET:                z.string().optional(),
  XERO_REDIRECT_URI:                 z.string().optional(),
  XERO_DEFAULT_INCOME_ACCOUNT:       z.string().default('200'),
  XERO_DEFAULT_EXPENSE_ACCOUNT:      z.string().default('400'),

  // ── QuickBooks ───────────────────────────────────────────────────────────
  QUICKBOOKS_CLIENT_ID:              z.string().optional(),
  QUICKBOOKS_CLIENT_SECRET:          z.string().optional(),
  QUICKBOOKS_REDIRECT_URI:           z.string().optional(),
  QUICKBOOKS_ENV:                    z.enum(['sandbox', 'production']).default('sandbox'),
  QB_DEFAULT_EXPENSE_ACCOUNT:        z.string().default('63'),

  // ── Storage ──────────────────────────────────────────────────────────────
  STORAGE_TYPE:                      z.enum(['local', 'vercel-blob', 's3']).default('local'),
  BLOB_READ_WRITE_TOKEN:             z.string().optional(),
  AWS_REGION:                        z.string().optional(),
  AWS_ACCESS_KEY_ID:                 z.string().optional(),
  AWS_SECRET_ACCESS_KEY:             z.string().optional(),
  AWS_S3_BUCKET:                     z.string().optional(),

  // ── File delivery ────────────────────────────────────────────────────────
  FILE_DELIVERY_TYPE:                z.enum(['smb', 'sftp', 'none']).default('none'),
  SMB_HOST:                          z.string().optional(),
  SMB_USERNAME:                      z.string().optional(),
  SMB_PASSWORD:                      z.string().optional(),
  SMB_SHARE:                         z.string().optional(),
  SFTP_HOST:                         z.string().optional(),
  SFTP_USERNAME:                     z.string().optional(),
  SFTP_PASSWORD:                     z.string().optional(),

  // ── Security ─────────────────────────────────────────────────────────────
  // Vercel sets this automatically on cron requests when CRON_SECRET is defined
  CRON_SECRET:                       z.string().optional(),
  WEBHOOK_SECRET:                    z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

/** Parsed, typed environment variables with defaults applied. */
export const env: Env = (() => {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    // Log warnings but don't crash – many vars are optional
    if (typeof console !== 'undefined') {
      console.warn('[env] Some environment variables are misconfigured:',
        result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`))
    }
    // Fall back to defaults so the app still boots
    return envSchema.parse({})
  }
  return result.data
})()

// ── Convenience status checkers (server-side only) ──────────────────────────

export const isGmailConfigured    = () => !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
export const isAnthropicConfigured = () => !!env.ANTHROPIC_API_KEY
export const isXeroConfigured      = () => !!(env.XERO_CLIENT_ID   && env.XERO_CLIENT_SECRET)
export const isQuickBooksConfigured = () => !!(env.QUICKBOOKS_CLIENT_ID && env.QUICKBOOKS_CLIENT_SECRET)
export const isStorageConfigured   = () =>
  env.STORAGE_TYPE === 'local' ||
  (env.STORAGE_TYPE === 'vercel-blob' && !!env.BLOB_READ_WRITE_TOKEN) ||
  (env.STORAGE_TYPE === 's3' && !!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY))

/** Returns a list of missing critical variables as human-readable strings. */
export function getMissingCriticalVars(): string[] {
  const missing: string[] = []
  if (!env.DATABASE_URL)         missing.push('DATABASE_URL')
  if (!env.ANTHROPIC_API_KEY)    missing.push('ANTHROPIC_API_KEY')
  if (!env.GOOGLE_CLIENT_ID)     missing.push('GOOGLE_CLIENT_ID')
  if (!env.GOOGLE_CLIENT_SECRET) missing.push('GOOGLE_CLIENT_SECRET')
  return missing
}
