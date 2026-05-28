import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Info, Database, Mail, Brain, Server, HardDrive, Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'

function EnvRow({ label, envKey, value, hint }: { label: string; envKey: string; value?: string; hint?: string }) {
  const configured = !!value
  return (
    <div className="flex items-start justify-between py-2.5 border-b last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground font-mono">{envKey}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <div className="flex items-center gap-2 ml-4">
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

export default function SettingsPage() {
  const db         = process.env.DATABASE_URL
  const anthropic  = process.env.ANTHROPIC_API_KEY
  const gmailId    = process.env.GOOGLE_CLIENT_ID
  const gmailSec   = process.env.GOOGLE_CLIENT_SECRET
  const gmailRef   = process.env.GOOGLE_REFRESH_TOKEN
  const gmailEmail = process.env.GMAIL_ADDRESS
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
  const model      = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'

  const gmailConfigured  = [gmailId, gmailSec, gmailRef, gmailEmail].filter(Boolean).length
  const smbConfigured    = [smbHost, smbUser, smbPass, smbShare].filter(Boolean).length
  const sftpConfigured   = [sftpHost, sftpUser, sftpPass].filter(Boolean).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Platform configuration and integration status</p>
      </div>

      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              All settings are configured via <strong>Vercel Project Settings → Environment Variables</strong>. 
              This page shows the live status of each variable. Add or update values in Vercel and redeploy to activate.
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
            <EnvRow label="Model Override" envKey="ANTHROPIC_MODEL" value={process.env.ANTHROPIC_MODEL} hint="Default: claude-sonnet-4-6" />
          </CardContent>
        </Card>

        {/* Gmail */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <CardTitle>Gmail Integration</CardTitle>
              </div>
              <SectionStatus configured={gmailConfigured} total={4} />
            </div>
            <CardDescription>OAuth2 credentials for inbox monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <EnvRow label="Client ID"      envKey="GOOGLE_CLIENT_ID"      value={gmailId}    hint="From Google Cloud Console → OAuth 2.0" />
            <EnvRow label="Client Secret"  envKey="GOOGLE_CLIENT_SECRET"   value={gmailSec}   hint="From Google Cloud Console → OAuth 2.0" />
            <EnvRow label="Refresh Token"  envKey="GOOGLE_REFRESH_TOKEN"   value={gmailRef}   hint="Generated via OAuth consent flow" />
            <EnvRow label="Gmail Address"  envKey="GMAIL_ADDRESS"          value={gmailEmail} hint="The inbox to monitor e.g. payroll@cube.co.uk" />
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
            <CardDescription>Where attachments are stored</CardDescription>
          </CardHeader>
          <CardContent>
            <EnvRow label="Storage Type"      envKey="STORAGE_TYPE"          value={storage}   hint="local | vercel-blob | s3" />
            <EnvRow label="Vercel Blob Token" envKey="BLOB_READ_WRITE_TOKEN"  value={blobToken} hint="Required when STORAGE_TYPE=vercel-blob" />
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
            <CardDescription>Upload spreadsheets to Windows server share</CardDescription>
          </CardHeader>
          <CardContent>
            <EnvRow label="Host"     envKey="SMB_HOST"     value={smbHost} hint="Server IP or hostname" />
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
            <CardDescription>Alternative: upload via SFTP</CardDescription>
          </CardHeader>
          <CardContent>
            <EnvRow label="Host"     envKey="SFTP_HOST"     value={sftpHost} />
            <EnvRow label="Username" envKey="SFTP_USERNAME" value={sftpUser} />
            <EnvRow label="Password" envKey="SFTP_PASSWORD" value={sftpPass} />
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
              <SectionStatus configured={webhookSec ? 1 : 0} total={1} />
            </div>
            <CardDescription>Webhook and API security</CardDescription>
          </CardHeader>
          <CardContent>
            <EnvRow label="Webhook Secret"  envKey="WEBHOOK_SECRET"   value={webhookSec} hint="Used to verify Gmail push notifications" />
            <EnvRow label="File Delivery"   envKey="FILE_DELIVERY_TYPE" value={delivType} hint="smb | sftp" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
