import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createCompany } from '@/app/actions/companies'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const sel = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

function Field({ label, name, type = 'text', placeholder, required }: {
  label: string; name: string; type?: string; placeholder?: string; required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">{label}{required && ' *'}</label>
      <Input id={name} name={name} type={type} placeholder={placeholder} required={required} />
    </div>
  )
}

export default async function NewCompanyPage() {
  const umbrellaCompanies = await prisma.umbrellaCompany.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/companies">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Company (Agency)</h1>
          <p className="text-muted-foreground">Create a new client agency / company</p>
        </div>
      </div>

      <form action={createCompany} className="space-y-6">
        {/* Core Details */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Company Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Company Name" name="name" placeholder="Acme Recruitment Ltd" required />
              <Field label="Registration Number" name="registrationNumber" placeholder="12345678" />
              <Field label="VAT Number" name="vatNumber" placeholder="GB123456789" />
              <div className="space-y-1.5">
                <label htmlFor="companyType" className="text-sm font-medium">Company Type</label>
                <select id="companyType" name="companyType" className={sel}>
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
                <select id="industry" name="industry" className={sel}>
                  <option value="">Select industry...</option>
                  <option>Construction</option>
                  <option>Agriculture</option>
                  <option>Healthcare</option>
                  <option>Hospitality</option>
                  <option>IT &amp; Technology</option>
                  <option>Manufacturing</option>
                  <option>Retail</option>
                  <option>Transportation</option>
                  <option>Warehousing</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="payrollFrequency" className="text-sm font-medium">Payroll Frequency</label>
                <select id="payrollFrequency" name="payrollFrequency" className={sel}>
                  <option value="Weekly">Weekly</option>
                  <option value="Fortnightly">Fortnightly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="4-Weekly">4-Weekly</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payroll Company */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Payroll Company</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="umbrellaCompanyId" className="text-sm font-medium">Payroll / Umbrella Company</label>
                <select id="umbrellaCompanyId" name="umbrellaCompanyId" className={sel}>
                  <option value="">— None —</option>
                  {umbrellaCompanies.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">When an invoice is marked as paid, the payroll spreadsheet will be emailed to this company.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Primary Contact</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Contact Email" name="email" type="email" placeholder="contact@agency.com" required />
              <Field label="Contact Phone" name="phone" type="tel" placeholder="01234 567890" />
            </div>
          </CardContent>
        </Card>

        {/* Billing Address */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Billing Address</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Address Line 1" name="billingAddress" placeholder="123 Business St" />
              <Field label="City / Town" name="billingCity" placeholder="London" />
              <Field label="Postcode" name="billingPostcode" placeholder="EC1A 1BB" />
              <div className="space-y-1.5">
                <label htmlFor="billingCountry" className="text-sm font-medium">Country</label>
                <select id="billingCountry" name="billingCountry" className={sel}>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Ireland">Ireland</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <Field label="Invoice Email" name="invoiceEmail" type="email" placeholder="accounts@agency.com" />
              <Field label="Payment Terms (days)" name="paymentTerms" type="number" placeholder="30" />
            </div>
          </CardContent>
        </Card>

        {/* Agency / Branch */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Agency &amp; Branch Reference</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Agency Name" name="agencyName" placeholder="Cube Recruitment" />
              <Field label="Agency Branch" name="agencyBranch" placeholder="London Branch" />
              <Field label="Agency Reference" name="agencyRef" />
            </div>
          </CardContent>
        </Card>

        {/* CIS Registration */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">CIS Registration (if applicable)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Unique Tax Reference (UTR)" name="uniqueTaxRef" placeholder="1234567890" />
              <Field label="Verification Number" name="verificationNumber" />
              <div className="flex items-center gap-2 mt-5">
                <input type="checkbox" id="cisRegistered" name="cisRegistered" value="true" className="h-4 w-4 rounded border-gray-300" />
                <label htmlFor="cisRegistered" className="text-sm font-medium">CIS Registered</label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accounting System */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Accounting System</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <label htmlFor="accountingSystem" className="text-sm font-medium">System used by this company</label>
                <select id="accountingSystem" name="accountingSystem" className={sel}>
                  <option value="None">None / Not set</option>
                  <option value="Xero">Xero</option>
                  <option value="QuickBooks">QuickBooks</option>
                  <option value="BrightPay">BrightPay (manual export)</option>
                  <option value="MoneySoft">MoneySoft (manual export)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Once created, go to Edit Company to connect Xero / QuickBooks via OAuth.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Processing */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Email Processing Config</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="emailDomains" className="text-sm font-medium">Email Domains (comma separated)</label>
                <Input id="emailDomains" name="emailDomains" placeholder="agency.com, contractor.co.uk" />
                <p className="text-xs text-muted-foreground">Used to auto-match incoming emails to this company</p>
              </div>
              <Field label="Remote Folder" name="remoteFolder" placeholder="\\SERVER\AI-Processed\AgencyName" />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 pt-2">
          <Button type="submit" size="lg">Create Company</Button>
          <Link href="/dashboard/companies"><Button type="button" variant="outline" size="lg">Cancel</Button></Link>
        </div>
      </form>
    </div>
  )
}
