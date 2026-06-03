import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Info, Database, Mail, Brain, Server, HardDrive, Shield, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface SearchParams { success?: string; error?: string; email?: string; detail?: string }
interface Props { searchParams: Promise<SearchParams> }

function EnvRow({ label, envKey, value, hint }: { label: string; envKey: string; value?: string; hint?: string }) {
  const configured = !!value
  return (
    <div className="flex items-start justify-between py-2.5 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground font-mono">{envKey}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <div className="flex items-center gap-2 ml-4 shrink-0">
        {configured ? (
          <>
            <span className="text-xs text-muted-foreground font-mono">{value!.slice(0, 6)}••••</span>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </>
        ) : (
          <>
            <span className="text-xs text-muted-foreground">Not set</span>
            <XCircle className="h-4 w-4 text-red-500" />
          </>
        )}
      </div>
    </div>
  )
}

function EnvLabel({ label, value, hint }: { label: string; value?: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <span className="text-xs font-mono text-muted-foreground ml-4 shrink-0">{value || '—'}</span>
    </div>
  )
}

function SectionStatus({ configured, total }: { configured: number; total: number }) {
  const allGood = configured === total
  return (
    <Badge className={allGood
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-yellow-100 text-yellow-700 border-yellow-200'}>
      {configured}/{total} configured
    </Badge>
  )
}

export default async function SettingsPage({ searchParams }: Props) {
  const sp = await searchParams

  const db         = process.env.DATABASE_URL
  const anthropic  = process.env.ANTHROPIC_API_KEY
  const gmailId    = process.env.GOOGLE_CLIENT_ID
  const gmailSec   = process.env.GOOGLE_CLIENT_SECRET
  const monitorLabel    = process.env.GMAIL_MONITOR_LABEL    || 'Payroll-Incoming'
  const processedLabel  = process.env.GMAIL_PROCESSED_LABEL  || 'Payroll-Processed'
  const smbHost    = process.env.SMB_HOST
  const smbUser    = process.env.SMB_USERNAME
  const smbPass    = process.env.SMB_PASSWORD
  const smbShare   = process.env.SMB_SHARE
  const sftpHost   = process.env.SFTP_HOST
  const sftpUser   = process.env.SFTP_USERNAME
  const sftpPass   = process.env.SFTP_PASSWORD
  const storage    = process.env.STORAGE_TYPE
  const blobToken  = process.env.BLOB_READ_WRITE_TOKEN
  const delivType  = process.env.FILE_DELIVERY_TYPE
  const webhookSec = process.env.WEBHOOK_SECRET
  const cronSec    = process.env.CRON_SECRET
  const model      = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'

  // Read Gmail connection state from DB
  let gmailConnectedEmail: string | null = null
  let gmailRefreshInDb = false
  try {
    const [emailRecord, tokenRecord] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: 'GOOGLE_CONNECTED_EMAIL' } }),
      prisma.systemConfig.findUnique({ where: { key: 'GOOGLE_REFRESH_TOKEN' } }),
    ])
    gmailConnectedEmail = emailRecord?.value || null
    gmailRefreshInDb    = !!tokenRecord?.value
  } catch { /* DB might not be ready */ }

  const gmailOAuthReady  = !!(gmailId && gmailSec)
  const gmailConnected   = gmailRefreshInDb || !!process.env.GOOGLE_REFRESH_TOKEN
  const gmailOAuthCount  = [gmailId, gmailSec].filter(Boolean).length
  const smbConfigured    = [smbHost, smbUser, smbPass, smbShare].filter(Boolean).length
  const sftpConfigured   = [sftpHost, sftpUser, sftpPass].filter(Boolean).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Platform configuration and integration status</p>
      </div>

      {/* OAuth success / error banners */}
      {sp.success === 'google_connected' && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Gmail connected successfully as <strong className="ml-1">{sp.email}</strong>. The cron job will start polling within 5 minutes.
        </div>
      )}
      {sp.error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-red-800 text-sm">
          <XCircle className="h-4 w-4 shrink-0" />
          Gmail connection failed: {sp.detail || sp.error}. Check your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars.
        </div>
      )}

      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Most settings live in <strong>Vercel Project Settings → Environment Variables</strong>.
              After adding vars, redeploy to activate them.
              Gmail OAuth tokens are stored securely in the database — no redeploy needed after connecting.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">

        {/* Database */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <CardTitle>Database</CardTitle>
              </div>
              <SectionStatus configured={db ? 1 : 0} total={1} />
            </div>
            <CardDescription>PostgreSQL on Neon.tech</CardDescription>
          </CardHeader>
          <CardContent>
            <EnvRow label="Database URL" envKey="DATABASE_URL" value={db} hint="PostgreSQL connection string" />
          </CardContent>
        </Card>

        {/* AI */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                <CardTitle>AI — Anthropic Claude</CardTitle>
              </div>
              <SectionStatus configured={anthropic ? 1 : 0} total={1} />
            </div>
            <CardDescription>Payroll data extraction model: <strong>{model}</strong></CardDescription>
          </CardHeader>
          <CardContent>
            <EnvRow label="API Key" envKey="ANTHROPIC_API_KEY" value={anthropic} hint="Get from console.anthropic.com" />
            <EnvRow label="Model override" envKey="ANTHROPIC_MODEL" value={process.env.ANTHROPIC_MODEL} hint="Default: claude-sonnet-4-6" />
          </CardContent>
        </Card>

        {/* Gmail — spans full width */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <CardTitle>Gmail Integration</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {gmailConnected ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected{gmailConnectedEmail ? ` — ${gmailConnectedEmail}` : ''}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">
                    Not connected
                  </Badge>
                )}
                <SectionStatus configured={gmailOAuthCount} total={2} />
              </div>
            </div>
            <CardDescription>
              OAuth2 polling — monitors the <strong>{monitorLabel}</strong> label every 5 minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-0 md:grid-cols-2 md:gap-x-8">
              <div>
                <EnvRow label="Client ID"     envKey="GOOGLE_CLIENT_ID"     value={gmailId}  hint="Google Cloud Console → OAuth 2.0 Client ID" />
                <EnvRow label="Client Secret" envKey="GOOGLE_CLIENT_SECRET"  value={gmailSec} hint="Google Cloud Console → OAuth 2.0 Client Secret" />
                <EnvRow label="Redirect URI"  envKey="GOOGLE_REDIRECT_URI"   value={process.env.GOOGLE_REDIRECT_URI}
                  hint={`Should be: ${process.env.NEXT_PUBLIC_APP_URL || 'https://yourapp.vercel.app'}/api/auth/google/callback`} />
              </div>
              <div>
                <EnvLabel label="Monitor label"   value={monitorLabel}   hint="Emails moved here trigger processing" />
                <EnvLabel label="Processed label" value={processedLabel} hint="Successfully processed emails moved here" />
                <EnvLabel label="Monitor email"   value={process.env.GMAIL_MONITOR_EMAIL} hint="Optional: restrict to specific inbox" />
              </div>
            </div>

            {/* Connect / Reconnect button */}
            <div className="mt-4 pt-4 border-t flex items-center gap-3">
              {gmailOAuthReady ? (
                <>
                  <Link href="/api/auth/google">
                    <Button variant={gmailConnected ? 'outline' : 'default'} size="sm">
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      {gmailConnected ? 'Reconnect Gmail' : 'Connect Gmail Account'}
                    </Button>
                  </Link>
                  {gmailConnected && (
                    <p className="text-xs text-muted-foreground">
                      Refresh token stored in database. The cron job polls every 5 minutes automatically.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-yellow-700">
                  Set <code className="font-mono text-xs">GOOGLE_CLIENT_ID</code> and{' '}
                  <code className="font-mono text-xs">GOOGLE_CLIENT_SECRET</code> in Vercel env vars first, then redeploy.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                <CardTitle>File Storage</CardTitle>
              </div>
              <Badge variant="outline">{storage || 'local'}</Badge>
            </div>
            <CardDescription>Where email attachments are stored</CardDescription>
          </CardHeader>
          <CardContent>
            <EnvRow label="Storage Type"      envKey="STORAGE_TYPE"         value={storage}   hint="local | vercel-blob | s3" />
            <EnvRow label="Vercel Blob Token" envKey="BLOB_READ_WRITE_TOKEN" value={blobToken} hint="Required when STORAGE_TYPE=vercel-blob" />
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Security</CardTitle>
              </div>
              <SectionStatus configured={[cronSec, webhookSec].filter(Boolean).length} total={2} />
            </div>
            <CardDescription>Cron and webhook authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <EnvRow label="Cron Secret"     envKey="CRON_SECRET"        value={cronSec}    hint="Vercel auto-sends this on cron calls" />
            <EnvRow label="Webhook Secret"  envKey="WEBHOOK_SECRET"     value={webhookSec} hint="Validates incoming Gmail push notifications" />
            <EnvRow label="File Delivery"   envKey="FILE_DELIVERY_TYPE" value={delivType}  hint="smb | sftp | none" />
          </CardContent>
        </Card>

        {/* SMB */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                <CardTitle>SMB File Delivery</CardTitle>
              </div>
              <SectionStatus configured={smbConfigured} total={4} />
            </div>
            <CardDescription>Upload spreadsheets to a Windows server share</CardDescription>
          </CardHeader>
          <CardContent>
            <EnvRow label="Host"     envKey="SMB_HOST"     value={smbHost}  hint="Server IP or hostname" />
            <EnvRow label="Share"    envKey="SMB_SHARE"    value={smbShare} hint="e.g. AI-Processed" />
            <EnvRow label="Username" envKey="SMB_USERNAME" value={smbUser} />
            <EnvRow label="Password" envKey="SMB_PASSWORD" value={smbPass} />
          </CardContent>
        </Card>

        {/* SFTP */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                <CardTitle>SFTP File Delivery</CardTitle>
              </div>
              <SectionStatus configured={sftpConfigured} total={3} />
            </div>
            <CardDescription>Alternative: upload spreadsheets via SFTP</CardDescription>
          </CardHeader>
          <CardContent>
            <EnvRow label="Host"     envKey="SFTP_HOST"     value={sftpHost} />
            <EnvRow label="Username" envKey="SFTP_USERNAME" value={sftpUser} />
            <EnvRow label="Password" envKey="SFTP_PASSWORD" value={sftpPass} />
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
