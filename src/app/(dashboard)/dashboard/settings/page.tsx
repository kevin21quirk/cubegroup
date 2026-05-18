import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Settings as SettingsIcon, Save, Info } from 'lucide-react'
import { Settings, Database, Mail, Key, Palette, Bell } from 'lucide-react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your platform settings and integrations
        </p>
      </div>

      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-blue-900 dark:text-blue-100">Environment Configuration</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            For security reasons, API keys and sensitive credentials must be configured in your <strong>Vercel Project Settings → Environment Variables</strong>. 
            The fields below are read-only and show the current configuration status. 
            To update settings, add or edit environment variables in your Vercel dashboard and redeploy.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Database Configuration</CardTitle>
            </div>
            <CardDescription>Configure your PostgreSQL database connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Database URL</label>
              <Input 
                type="password" 
                placeholder="postgresql://user:password@host/database"
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Add DATABASE_URL in Vercel Environment Variables
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                Not Configured
              </Badge>
              <span className="text-sm text-muted-foreground">
                Configure in Vercel Environment Variables
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <CardTitle>Authentication</CardTitle>
            </div>
            <CardDescription>Clerk authentication configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Publishable Key</label>
              <Input 
                type="password" 
                placeholder="pk_test_xxxxx"
                disabled
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Secret Key</label>
              <Input 
                type="password" 
                placeholder="sk_test_xxxxx"
                disabled
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                Disabled (Demo Mode)
              </Badge>
              <span className="text-sm text-muted-foreground">
                Sign up at clerk.com and add keys to Vercel Environment Variables
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Email Integration</CardTitle>
            </div>
            <CardDescription>Gmail API configuration for email processing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Google Client ID</label>
              <Input 
                type="text" 
                placeholder="xxxxx.apps.googleusercontent.com"
                disabled
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Google Client Secret</label>
              <Input 
                type="password" 
                placeholder="GOCSPX-xxxxx"
                disabled
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                Not Connected
              </Badge>
              <span className="text-sm text-muted-foreground">
                Configure Google Cloud Console OAuth credentials
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <CardTitle>AI Configuration</CardTitle>
            </div>
            <CardDescription>Anthropic Claude API for document extraction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Anthropic API Key</label>
              <Input 
                type="password" 
                placeholder="sk-ant-xxxxx"
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Used for AI-powered payroll data extraction with Claude
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <Input 
                type="text" 
                placeholder="claude-sonnet-4-6"
                disabled
                value="claude-sonnet-4-6"
              />
              <p className="text-xs text-muted-foreground">
                Claude Sonnet 4.6 (latest) - Best for structured data extraction
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                Not Configured
              </Badge>
              <span className="text-sm text-muted-foreground">
                Get API key from console.anthropic.com
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>Customize the look and feel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">Toggle between light and dark mode</p>
              </div>
              <Badge variant="outline">Use theme toggle in header</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Logo</p>
                <p className="text-sm text-muted-foreground">Cube Group branding</p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Configured
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Workflow Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified of workflow changes</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
