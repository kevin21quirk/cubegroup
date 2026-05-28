import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createWorker } from '@/app/actions/workers'
import { getCompanies } from '@/app/actions/companies'

export const dynamic = 'force-dynamic'

const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

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

function CheckField({ label, name }: { label: string; name: string }) {
  return (
    <div className="flex items-center gap-2">
      <input type="checkbox" id={name} name={name} value="true" className="h-4 w-4 rounded border-gray-300" />
      <label htmlFor={name} className="text-sm font-medium">{label}</label>
    </div>
  )
}

function SelectField({ label, name, options, required }: {
  label: string; name: string; options: string[]; required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">{label}{required && ' *'}</label>
      <select id={name} name={name} className={selectClass} required={required}>
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {children}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function NewWorkerPage() {
  const companies = await getCompanies()

  if (companies.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/workers"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <h1 className="text-3xl font-bold tracking-tight">Add New Worker</h1>
        </div>
        <Card><CardContent className="pt-6 text-center py-12">
          <p className="font-medium">No companies available</p>
          <p className="text-sm text-muted-foreground mt-1">Create a company first</p>
          <Link href="/dashboard/companies/new"><Button className="mt-4">Create Company</Button></Link>
        </CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/workers"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Worker / Contractor</h1>
          <p className="text-muted-foreground">Complete the contractor import form</p>
        </div>
      </div>

      <form action={createWorker} className="space-y-6">
        {/* Company assignment */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Assignment</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="companyId" className="text-sm font-medium">Company *</label>
                <select id="companyId" name="companyId" className={selectClass} required>
                  <option value="">Select a company...</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <SelectField label="Contractor Type" name="contractorType" options={['PAYE', 'CIS', 'Umbrella']} />
              <SelectField label="Product" name="product" options={['PAYE', 'CIS', 'Umbrella', 'Self-Employed']} />
              <Field label="Employee / Payroll Number" name="employeeNumber" placeholder="EMP001" />
            </div>
          </CardContent>
        </Card>

        {/* Personal Details */}
        <Section title="Personal Details">
          <SelectField label="Title" name="title" options={['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Rev']} />
          <Field label="First Name" name="firstName" placeholder="John" required />
          <Field label="Middle Names" name="middleNames" placeholder="William" />
          <Field label="Surname" name="lastName" placeholder="Smith" required />
          <SelectField label="Gender" name="gender" options={['Male', 'Female', 'Other', 'Prefer not to say']} />
          <Field label="Date of Birth" name="dateOfBirth" type="date" />
          <Field label="Nationality" name="nationality" placeholder="British" />
        </Section>

        {/* Contact & Address */}
        <Section title="Contact &amp; Address">
          <Field label="Mobile" name="mobile" type="tel" placeholder="07700 900000" />
          <Field label="Phone" name="phone" type="tel" placeholder="01234 567890" />
          <Field label="Email Address" name="email" type="email" placeholder="john@example.com" />
          <Field label="Address Line 1" name="addressLine1" placeholder="123 High Street" />
          <Field label="Address 2" name="addressLine2" placeholder="Flat 2" />
          <Field label="Address 3" name="addressLine3" />
          <Field label="Town" name="town" placeholder="London" />
          <Field label="County" name="county" placeholder="Greater London" />
          <Field label="Post Code" name="postCode" placeholder="SW1A 1AA" />
          <SelectField label="Living Country" name="livingCountry" options={['United Kingdom', 'Ireland', 'Other EU', 'Non-EU']} />
        </Section>

        {/* Banking */}
        <Section title="Bank Account Details">
          <Field label="Name on Bank Account" name="nameOnBankAccount" placeholder="John W Smith" />
          <Field label="Bank Name" name="bankName" placeholder="Barclays" />
          <Field label="Account No." name="bankAccountNumber" placeholder="12345678" />
          <Field label="Sort Code" name="bankSortCode" placeholder="00-00-00" />
          <Field label="Building Society No." name="buildingSocietyNo" />
          <div className="flex items-end pb-1">
            <CheckField label="Non UK Bank" name="nonUkBank" />
          </div>
        </Section>

        {/* Third Party Bank */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Third Party Bank Account</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <CheckField label="Use Third Party Bank Account" name="thirdPartyBankAccount" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="3rd Party Account Name" name="thirdPartyAccountName" />
              <Field label="3rd Party Address 1" name="thirdPartyAddress1" />
              <Field label="3rd Party Town" name="thirdPartyTown" />
              <Field label="3rd Party Postcode" name="thirdPartyPostcode" />
              <Field label="3rd Party Country" name="thirdPartyCountry" />
              <Field label="3rd Party Relationship" name="thirdPartyRelationship" placeholder="Spouse/Parent/Other" />
              <Field label="3rd Party Contact No." name="thirdPartyContactNo" type="tel" />
              <Field label="3rd Party DOB" name="thirdPartyDob" type="date" />
            </div>
          </CardContent>
        </Card>

        {/* Tax & Employment */}
        <Section title="Tax &amp; Employment">
          <Field label="NI Number" name="nationalInsurance" placeholder="AB123456C" />
          <SelectField label="NI Category" name="niCategory" options={['A', 'B', 'C', 'H', 'J', 'M', 'Z']} />
          <Field label="Tax Code" name="taxCode" placeholder="1257L" />
          <SelectField label="Tax Basis" name="taxBasis" options={['Cumulative', 'Week1/Month1']} />
          <SelectField label="Starter Declaration" name="starterDeclaration" options={['A', 'B', 'C']} />
          <Field label="P45 Gross for Tax" name="p45GrossForTax" type="number" placeholder="0.00" />
          <Field label="P45 Tax Deducted" name="p45TaxDeducted" type="number" placeholder="0.00" />
          <Field label="Start Date" name="startDate" type="date" />
          <SelectField label="Pay Frequency" name="payFrequency" options={['Weekly', 'Fortnightly', 'Monthly', '4-Weekly']} />
        </Section>

        {/* Commercial / Agency */}
        <Section title="Commercial &amp; Agency">
          <Field label="Agency" name="agency" placeholder="Agency name" />
          <Field label="Branch" name="branch" placeholder="Branch name" />
          <Field label="Agency Ref" name="agencyRef" />
          <Field label="Job Description" name="jobDescription" placeholder="Labourer / Electrician / etc." />
          <SelectField label="Holiday Pay Rule" name="holidayPayRule" options={['Accrued', 'Rolled-up', 'None']} />
          <Field label="Service Used" name="serviceUsed" />
          <Field label="PAYE Amount" name="payeAmount" type="number" placeholder="0.00" />
          <SelectField label="Payment Terms" name="paymentTerms" options={['7 days', '14 days', '30 days', '60 days']} />
          <SelectField label="Payment Method" name="paymentMethod" options={['BACS', 'CHAPS', 'Cheque', 'Cash']} />
          <Field label="Loan Plan" name="loanPlan" />
          <Field label="Minimum Margin Charge" name="minimumMarginCharge" type="number" placeholder="0.00" />
          <Field label="Agency Margin Rule" name="agencyMarginRule" />
          <div className="flex flex-col gap-3 mt-1 col-span-full md:col-span-1">
            <CheckField label="Apply Holiday Employment Costs" name="applyHolidayEmploymentCosts" />
            <CheckField label="Derogation Contract" name="derogationContract" />
            <CheckField label="Derogation Spread" name="derogationSpread" />
          </div>
        </Section>

        {/* CIS */}
        <Section title="CIS Details (if applicable)">
          <Field label="UTR Number" name="utrNumber" placeholder="1234567890" />
          <SelectField label="CIS Status" name="cisStatus" options={['Gross', 'Net', 'Not Registered']} />
          <Field label="Trading Name" name="tradingName" placeholder="Smith Contracting Ltd" />
        </Section>

        {/* Compliance */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Compliance &amp; Settings</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <CheckField label="Pension Applicable" name="pensionApplicable" />
              <CheckField label="Apprenticeship Levy" name="apprenticeshipLevy" />
              <CheckField label="GDPR Consent" name="gdpr" />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 pt-2">
          <Button type="submit" size="lg">Create Worker</Button>
          <Link href="/dashboard/workers"><Button type="button" variant="outline" size="lg">Cancel</Button></Link>
        </div>
      </form>
    </div>
  )
}
