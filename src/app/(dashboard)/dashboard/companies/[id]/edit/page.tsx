import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { getCompany, updateCompany } from '@/app/actions/companies'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const selectClass = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

interface EditCompanyPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string>>
}

export default async function EditCompanyPage({ params, searchParams }: EditCompanyPageProps) {
  const { id } = await params
  const sp = await searchParams
  const company = await getCompany(id)
  if (!company) notFound()

  const updateCompanyWithId = updateCompany.bind(null, id)

  const xeroConnected = !!(company as any).xeroTenantId
  const qbConnected   = !!(company as any).quickbooksRealmId

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/companies/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Company</h1>
          <p className="text-muted-foreground">Update company details, accounting integration and settings</p>
        </div>
      </div>

      {sp.success && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm">
          <CheckCircle2 className="h-4 w-4" />
          {sp.success === 'xero_connected' ? 'Xero account connected successfully.' : ''}
          {sp.success === 'qb_connected' ? 'QuickBooks account connected successfully.' : ''}
        </div>
      )}
      {sp.error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-red-800 text-sm">
          <XCircle className="h-4 w-4" />
          Connection failed. Please try again or check your app credentials.
        </div>
      )}

      {/* ── Core Details ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>Edit the company information</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateCompanyWithId} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Company Name *</label>
                <Input id="name" name="name" defaultValue={company.name} required />
              </div>
              <div className="space-y-2">
                <label htmlFor="industry" className="text-sm font-medium">Industry</label>
                <select id="industry" name="industry" defaultValue={company.industry || ''} className={selectClass}>
                  <option value="">Select industry...</option>
                  {['Construction','Agriculture','Healthcare','Hospitality','IT & Technology','Manufacturing','Retail','Transportation','Warehousing','Other'].map(i => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="billingAddress" className="text-sm font-medium">Billing Address</label>
                <Input id="billingAddress" name="billingAddress" defaultValue={company.billingAddress || ''} placeholder="123 Business St" />
              </div>
              <div className="space-y-2">
                <label htmlFor="billingCity" className="text-sm font-medium">City</label>
                <Input id="billingCity" name="billingCity" defaultValue={(company as any).billingCity || ''} placeholder="London" />
              </div>
              <div className="space-y-2">
                <label htmlFor="billingPostcode" className="text-sm font-medium">Postcode</label>
                <Input id="billingPostcode" name="billingPostcode" defaultValue={company.billingPostcode || ''} placeholder="SW1A 1AA" />
              </div>
              <div className="space-y-2">
                <label htmlFor="paymentTerms" className="text-sm font-medium">Payment Terms (days)</label>
                <Input id="paymentTerms" name="paymentTerms" type="number" defaultValue={company.paymentTerms ?? 30} />
              </div>
              <div className="space-y-2">
                <label htmlFor="isActive" className="text-sm font-medium">Status</label>
                <select id="isActive" name="isActive" defaultValue={company.isActive ? 'true' : 'false'} className={selectClass}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="accountingSystem" className="text-sm font-medium">Accounting System</label>
                <select id="accountingSystem" name="accountingSystem" defaultValue={(company as any).accountingSystem || 'None'} className={selectClass}>
                  <option value="None">None</option>
                  <option value="Xero">Xero</option>
                  <option value="QuickBooks">QuickBooks</option>
                  <option value="BrightPay">BrightPay</option>
                  <option value="MoneySoft">MoneySoft</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit">Save Changes</Button>
              <Link href={`/dashboard/companies/${id}`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Accounting Integration ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Accounting Integration</CardTitle>
          <CardDescription>
            Connect this company to Xero or QuickBooks. Payroll invoices and bills will be pushed automatically when emails are processed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Xero */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#13B5EA]/10">
                <span className="text-xs font-bold text-[#13B5EA]">XERO</span>
              </div>
              <div>
                <p className="font-medium">Xero</p>
                <p className="text-sm text-muted-foreground">
                  {xeroConnected ? `Connected – tenant ${(company as any).xeroTenantId?.slice(0, 8)}…` : 'Not connected'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {xeroConnected && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              <Link href={`/api/auth/xero/connect?companyId=${id}`}>
                <Button variant={xeroConnected ? 'outline' : 'default'} size="sm">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  {xeroConnected ? 'Reconnect' : 'Connect Xero'}
                </Button>
              </Link>
            </div>
          </div>

          {/* QuickBooks */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#2CA01C]/10">
                <span className="text-xs font-bold text-[#2CA01C]">QB</span>
              </div>
              <div>
                <p className="font-medium">QuickBooks</p>
                <p className="text-sm text-muted-foreground">
                  {qbConnected ? `Connected – realm ${(company as any).quickbooksRealmId?.slice(0, 8)}…` : 'Not connected'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {qbConnected && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              <Link href={`/api/auth/quickbooks/connect?companyId=${id}`}>
                <Button variant={qbConnected ? 'outline' : 'default'} size="sm">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  {qbConnected ? 'Reconnect' : 'Connect QuickBooks'}
                </Button>
              </Link>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Note: Connecting will redirect you to the provider's authorisation page. Ensure your API credentials are set in the environment variables (<code>XERO_CLIENT_ID</code>, <code>XERO_CLIENT_SECRET</code>, <code>QUICKBOOKS_CLIENT_ID</code>, <code>QUICKBOOKS_CLIENT_SECRET</code>).
          </p>
        </CardContent>
      </Card>

      {/* ── Data Exports ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Data Exports</CardTitle>
          <CardDescription>Download CSV/XLSX files for use in BrightPay, MoneySoft or other systems</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <a href={`/api/export/contractor-import?companyId=${id}`} download>
            <Button variant="outline" size="sm">Contractor Import CSV</Button>
          </a>
          <a href={`/api/export/cis-subcontractors?companyId=${id}`} download>
            <Button variant="outline" size="sm">CIS Subcontractor CSV</Button>
          </a>
          <a href={`/api/export/cis-transactions?companyId=${id}`} download>
            <Button variant="outline" size="sm">CIS Transaction CSV</Button>
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
