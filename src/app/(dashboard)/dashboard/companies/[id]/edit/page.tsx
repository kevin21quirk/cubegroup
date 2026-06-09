import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { getCompany, updateCompany } from '@/app/actions/companies'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const sel = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

function Field({ label, name, type = 'text', placeholder, defaultValue, required }: {
  label: string; name: string; type?: string; placeholder?: string; defaultValue?: string | number; required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">{label}{required && ' *'}</label>
      <Input id={name} name={name} type={type} placeholder={placeholder} defaultValue={defaultValue ?? ''} required={required} />
    </div>
  )
}

interface EditCompanyPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string>>
}

export default async function EditCompanyPage({ params, searchParams }: EditCompanyPageProps) {
  const { id } = await params
  const sp = await searchParams
  const company = await getCompany(id)
  if (!company) notFound()

  const c = company as any
  const updateCompanyWithId = updateCompany.bind(null, id)
  const xeroConnected = !!c.xeroTenantId
  const qbConnected   = !!c.quickbooksRealmId

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/companies/${id}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Company</h1>
          <p className="text-muted-foreground">Update all company details, accounting integration and settings</p>
        </div>
      </div>

      {sp.success && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm">
          <CheckCircle2 className="h-4 w-4" />
          {sp.success === 'xero_connected' && 'Xero account connected successfully.'}
          {sp.success === 'qb_connected'   && 'QuickBooks account connected successfully.'}
        </div>
      )}
      {sp.error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-red-800 text-sm">
          <XCircle className="h-4 w-4" />
          Connection failed. Please try again or check your app credentials.
        </div>
      )}

      <form action={updateCompanyWithId} className="space-y-6">

        {/* ── Company Details ── */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Company Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Company Name" name="name" defaultValue={company.name} required />
              <Field label="Registration Number" name="registrationNumber" defaultValue={c.registrationNumber} placeholder="12345678" />
              <Field label="VAT Number" name="vatNumber" defaultValue={c.vatNumber} placeholder="GB123456789" />
              <div className="space-y-1.5">
                <label htmlFor="companyType" className="text-sm font-medium">Company Type</label>
                <select id="companyType" name="companyType" defaultValue={c.companyType || ''} className={sel}>
                  <option value="">Select...</option>
                  <option value="SoleTrader">Sole Trader</option>
                  <option value="Partnership">Partnership</option>
                  <option value="LimitedCompany">Limited Company</option>
                  <option value="Public">Public Limited Company</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="industry" className="text-sm font-medium">Industry</label>
                <select id="industry" name="industry" defaultValue={company.industry || ''} className={sel}>
                  <option value="">Select industry...</option>
                  {['Construction','Agriculture','Healthcare','Hospitality','IT & Technology','Manufacturing','Retail','Transportation','Warehousing','Other'].map(i => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="payrollFrequency" className="text-sm font-medium">Payroll Frequency</label>
                <select id="payrollFrequency" name="payrollFrequency" defaultValue={c.payrollFrequency || 'Weekly'} className={sel}>
                  <option value="Weekly">Weekly</option>
                  <option value="Fortnightly">Fortnightly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="4-Weekly">4-Weekly</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="isActive" className="text-sm font-medium">Status</label>
                <select id="isActive" name="isActive" defaultValue={company.isActive ? 'true' : 'false'} className={sel}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Billing Address ── */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Billing Address</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Address Line 1" name="billingAddress" defaultValue={company.billingAddress ?? undefined} placeholder="123 Business St" />
              <Field label="City / Town" name="billingCity" defaultValue={c.billingCity} placeholder="London" />
              <Field label="Postcode" name="billingPostcode" defaultValue={company.billingPostcode ?? undefined} placeholder="EC1A 1BB" />
              <div className="space-y-1.5">
                <label htmlFor="billingCountry" className="text-sm font-medium">Country</label>
                <select id="billingCountry" name="billingCountry" defaultValue={c.billingCountry || 'United Kingdom'} className={sel}>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Ireland">Ireland</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <Field label="Invoice Email" name="invoiceEmail" type="email" defaultValue={c.invoiceEmail ?? undefined} placeholder="accounts@agency.com" />
              <Field label="Payment Terms (days)" name="paymentTerms" type="number" defaultValue={company.paymentTerms ?? 30} />
            </div>
          </CardContent>
        </Card>

        {/* ── Agency & Branch ── */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Agency &amp; Branch Reference</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Agency Name" name="agencyName" defaultValue={c.agencyName} placeholder="Cube Recruitment" />
              <Field label="Agency Branch" name="agencyBranch" defaultValue={c.agencyBranch} placeholder="London Branch" />
              <Field label="Agency Reference" name="agencyRef" defaultValue={c.agencyRef} />
            </div>
          </CardContent>
        </Card>

        {/* ── CIS Registration ── */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">CIS Registration (if applicable)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Unique Tax Reference (UTR)" name="uniqueTaxRef" defaultValue={c.uniqueTaxRef} placeholder="1234567890" />
              <Field label="Verification Number" name="verificationNumber" defaultValue={c.verificationNumber} />
              <div className="flex items-center gap-2 mt-5">
                <input
                  type="checkbox" id="cisRegistered" name="cisRegistered" value="true"
                  defaultChecked={!!c.cisRegistered}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="cisRegistered" className="text-sm font-medium">CIS Registered</label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Accounting System ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Accounting System</CardTitle>
            <CardDescription>Select which accounting system this company uses. After saving, use the connect buttons below to authorise the OAuth link.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <label htmlFor="accountingSystem" className="text-sm font-medium">System</label>
                <select id="accountingSystem" name="accountingSystem" defaultValue={c.accountingSystem || 'None'} className={sel}>
                  <option value="None">None</option>
                  <option value="Xero">Xero</option>
                  <option value="QuickBooks">QuickBooks</option>
                  <option value="BrightPay">BrightPay (manual export)</option>
                  <option value="MoneySoft">MoneySoft (manual export)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Email Processing ── */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Email Processing Config</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="emailDomains" className="text-sm font-medium">Email Domains (comma separated)</label>
                <Input
                  id="emailDomains" name="emailDomains"
                  defaultValue={(c.emailDomains || []).join(', ')}
                  placeholder="agency.com, contractor.co.uk"
                />
                <p className="text-xs text-muted-foreground">Auto-matches incoming emails to this company</p>
              </div>
              <Field label="Remote Folder" name="remoteFolder" defaultValue={c.remoteFolder} placeholder="\\SERVER\AI-Processed\AgencyName" />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 pt-2">
          <Button type="submit" size="lg">Save Changes</Button>
          <Link href={`/dashboard/companies/${id}`}>
            <Button type="button" variant="outline" size="lg">Cancel</Button>
          </Link>
        </div>
      </form>

      {/* ── OAuth Connect (outside form, needs company ID) ── */}
      <Card>
        <CardHeader>
          <CardTitle>Accounting OAuth Connection</CardTitle>
          <CardDescription>
            Authorise Cube to push invoices and bills directly into Xero or QuickBooks for this company.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#13B5EA]/10">
                <span className="text-xs font-bold text-[#13B5EA]">XERO</span>
              </div>
              <div>
                <p className="font-medium">Xero</p>
                <p className="text-sm text-muted-foreground">
                  {xeroConnected ? `Connected – tenant ${c.xeroTenantId?.slice(0, 8)}…` : 'Not connected'}
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

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#2CA01C]/10">
                <span className="text-xs font-bold text-[#2CA01C]">QB</span>
              </div>
              <div>
                <p className="font-medium">QuickBooks</p>
                <p className="text-sm text-muted-foreground">
                  {qbConnected ? `Connected – realm ${c.quickbooksRealmId?.slice(0, 8)}…` : 'Not connected'}
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
            Credentials required: <code>XERO_CLIENT_ID</code>, <code>XERO_CLIENT_SECRET</code>,{' '}
            <code>QUICKBOOKS_CLIENT_ID</code>, <code>QUICKBOOKS_CLIENT_SECRET</code> — see <code>.env.example</code>.
          </p>
        </CardContent>
      </Card>

      {/* ── Data Exports ── */}
      <Card>
        <CardHeader>
          <CardTitle>Data Exports</CardTitle>
          <CardDescription>Download CSV/XLSX files for BrightPay, MoneySoft or other systems</CardDescription>
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
