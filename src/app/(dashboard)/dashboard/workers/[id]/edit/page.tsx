import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getWorker, updateWorker } from '@/app/actions/workers'

export const dynamic = 'force-dynamic'

const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

function Field({ label, name, type = 'text', placeholder, required, defaultValue }: {
  label: string; name: string; type?: string; placeholder?: string; required?: boolean; defaultValue?: string | number | null
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">{label}{required && ' *'}</label>
      <Input
        id={name} name={name} type={type} placeholder={placeholder} required={required}
        defaultValue={defaultValue ?? ''}
      />
    </div>
  )
}

function CheckField({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <input type="checkbox" id={name} name={name} value="true" defaultChecked={defaultChecked} className="h-4 w-4 rounded border-gray-300" />
      <label htmlFor={name} className="text-sm font-medium">{label}</label>
    </div>
  )
}

function SelectField({ label, name, options, required, defaultValue }: {
  label: string; name: string; options: string[]; required?: boolean; defaultValue?: string | null
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">{label}{required && ' *'}</label>
      <select id={name} name={name} className={selectClass} required={required} defaultValue={defaultValue ?? ''}>
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{children}</div>
      </CardContent>
    </Card>
  )
}

export default async function EditWorkerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const worker = await getWorker(id)
  if (!worker) notFound()

  const w = worker as any
  const action = updateWorker.bind(null, id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/workers/${id}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Worker</h1>
          <p className="text-muted-foreground">{worker.firstName} {worker.lastName}</p>
        </div>
      </div>

      <form action={action} className="space-y-6">
        {/* Status */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Status &amp; Assignment</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Company</label>
                <div className="flex h-10 items-center px-3 rounded-md border bg-muted text-sm text-muted-foreground">
                  {worker.company.name}
                </div>
              </div>
              <SelectField label="Contractor Type" name="contractorType" options={['PAYE', 'CIS', 'Umbrella']} defaultValue={w.contractorType} />
              <SelectField label="Product" name="product" options={['PAYE', 'CIS', 'Umbrella', 'Self-Employed']} defaultValue={w.product} />
              <Field label="Employee / Payroll Number" name="employeeNumber" placeholder="EMP001" defaultValue={w.employeeNumber} />
              <div className="flex items-end pb-1">
                <CheckField label="Active" name="isActive" defaultChecked={w.isActive !== false} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Details */}
        <Section title="Personal Details">
          <SelectField label="Title" name="title" options={['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Rev']} defaultValue={w.title} />
          <Field label="First Name" name="firstName" placeholder="John" required defaultValue={worker.firstName} />
          <Field label="Middle Names" name="middleNames" placeholder="William" defaultValue={w.middleNames} />
          <Field label="Surname" name="lastName" placeholder="Smith" required defaultValue={worker.lastName} />
          <SelectField label="Gender" name="gender" options={['Male', 'Female', 'Other', 'Prefer not to say']} defaultValue={w.gender} />
          <Field label="Date of Birth" name="dateOfBirth" type="date" defaultValue={w.dateOfBirth ? new Date(w.dateOfBirth).toISOString().split('T')[0] : ''} />
          <Field label="Nationality" name="nationality" placeholder="British" defaultValue={w.nationality} />
        </Section>

        {/* Contact & Address */}
        <Section title="Contact &amp; Address">
          <Field label="Mobile" name="mobile" type="tel" placeholder="07700 900000" defaultValue={w.mobile} />
          <Field label="Phone" name="phone" type="tel" placeholder="01234 567890" defaultValue={w.phone} />
          <Field label="Email Address" name="email" type="email" placeholder="john@example.com" defaultValue={worker.email} />
          <Field label="Address Line 1" name="addressLine1" placeholder="123 High Street" defaultValue={w.addressLine1} />
          <Field label="Address 2" name="addressLine2" placeholder="Flat 2" defaultValue={w.addressLine2} />
          <Field label="Address 3" name="addressLine3" defaultValue={w.addressLine3} />
          <Field label="Town" name="town" placeholder="London" defaultValue={w.town} />
          <Field label="County" name="county" placeholder="Greater London" defaultValue={w.county} />
          <Field label="Post Code" name="postCode" placeholder="SW1A 1AA" defaultValue={w.postCode} />
          <SelectField label="Living Country" name="livingCountry" options={['United Kingdom', 'Ireland', 'Other EU', 'Non-EU']} defaultValue={w.livingCountry} />
        </Section>

        {/* Banking */}
        <Section title="Bank Account Details">
          <Field label="Name on Bank Account" name="nameOnBankAccount" defaultValue={w.nameOnBankAccount} />
          <Field label="Bank Name" name="bankName" placeholder="Barclays" defaultValue={w.bankName} />
          <Field label="Account No." name="bankAccountNumber" defaultValue={w.bankAccountNumber} />
          <Field label="Sort Code" name="bankSortCode" placeholder="00-00-00" defaultValue={w.bankSortCode} />
          <Field label="Building Society No." name="buildingSocietyNo" defaultValue={w.buildingSocietyNo} />
          <div className="flex items-end pb-1">
            <CheckField label="Non UK Bank" name="nonUkBank" defaultChecked={w.nonUkBank} />
          </div>
        </Section>

        {/* Third Party Bank */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Third Party Bank Account</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <CheckField label="Use Third Party Bank Account" name="thirdPartyBankAccount" defaultChecked={w.thirdPartyBankAccount} />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="3rd Party Account Name" name="thirdPartyAccountName" defaultValue={w.thirdPartyAccountName} />
              <Field label="3rd Party Address 1" name="thirdPartyAddress1" defaultValue={w.thirdPartyAddress1} />
              <Field label="3rd Party Town" name="thirdPartyTown" defaultValue={w.thirdPartyTown} />
              <Field label="3rd Party Postcode" name="thirdPartyPostcode" defaultValue={w.thirdPartyPostcode} />
              <Field label="3rd Party Country" name="thirdPartyCountry" defaultValue={w.thirdPartyCountry} />
              <Field label="3rd Party Relationship" name="thirdPartyRelationship" placeholder="Spouse/Parent/Other" defaultValue={w.thirdPartyRelationship} />
              <Field label="3rd Party Contact No." name="thirdPartyContactNo" type="tel" defaultValue={w.thirdPartyContactNo} />
              <Field label="3rd Party DOB" name="thirdPartyDob" type="date" defaultValue={w.thirdPartyDob ? new Date(w.thirdPartyDob).toISOString().split('T')[0] : ''} />
            </div>
          </CardContent>
        </Card>

        {/* Tax & Employment */}
        <Section title="Tax &amp; Employment">
          <Field label="NI Number" name="nationalInsurance" placeholder="AB123456C" defaultValue={w.nationalInsurance} />
          <SelectField label="NI Category" name="niCategory" options={['A', 'B', 'C', 'H', 'J', 'M', 'Z']} defaultValue={w.niCategory} />
          <Field label="Tax Code" name="taxCode" placeholder="1257L" defaultValue={w.taxCode} />
          <SelectField label="Tax Basis" name="taxBasis" options={['Cumulative', 'Week1/Month1']} defaultValue={w.taxBasis} />
          <SelectField label="Starter Declaration" name="starterDeclaration" options={['A', 'B', 'C']} defaultValue={w.starterDeclaration} />
          <Field label="P45 Gross for Tax" name="p45GrossForTax" type="number" placeholder="0.00" defaultValue={w.p45GrossForTax} />
          <Field label="P45 Tax Deducted" name="p45TaxDeducted" type="number" placeholder="0.00" defaultValue={w.p45TaxDeducted} />
          <Field label="Start Date" name="startDate" type="date" defaultValue={w.startDate ? new Date(w.startDate).toISOString().split('T')[0] : ''} />
          <SelectField label="Pay Frequency" name="payFrequency" options={['Weekly', 'Fortnightly', 'Monthly', '4-Weekly']} defaultValue={w.payFrequency} />
        </Section>

        {/* Commercial / Agency */}
        <Section title="Commercial &amp; Agency">
          <Field label="Agency" name="agency" placeholder="Agency name" defaultValue={w.agency} />
          <Field label="Branch" name="branch" placeholder="Branch name" defaultValue={w.branch} />
          <Field label="Agency Ref" name="agencyRef" defaultValue={w.agencyRef} />
          <Field label="Job Description" name="jobDescription" placeholder="Labourer / Electrician / etc." defaultValue={w.jobDescription} />
          <SelectField label="Holiday Pay Rule" name="holidayPayRule" options={['Accrued', 'Rolled-up', 'None']} defaultValue={w.holidayPayRule} />
          <Field label="Service Used" name="serviceUsed" defaultValue={w.serviceUsed} />
          <Field label="PAYE Amount" name="payeAmount" type="number" placeholder="0.00" defaultValue={w.payeAmount} />
          <SelectField label="Payment Terms" name="paymentTerms" options={['7 days', '14 days', '30 days', '60 days']} defaultValue={w.paymentTerms} />
          <SelectField label="Payment Method" name="paymentMethod" options={['BACS', 'CHAPS', 'Cheque', 'Cash']} defaultValue={w.paymentMethod} />
          <Field label="Loan Plan" name="loanPlan" defaultValue={w.loanPlan} />
          <Field label="Minimum Margin Charge" name="minimumMarginCharge" type="number" placeholder="0.00" defaultValue={w.minimumMarginCharge} />
          <Field label="Agency Margin Rule" name="agencyMarginRule" defaultValue={w.agencyMarginRule} />
          <div className="flex flex-col gap-3 mt-1 col-span-full md:col-span-1">
            <CheckField label="Apply Holiday Employment Costs" name="applyHolidayEmploymentCosts" defaultChecked={w.applyHolidayEmploymentCosts} />
            <CheckField label="Derogation Contract" name="derogationContract" defaultChecked={w.derogationContract} />
            <CheckField label="Derogation Spread" name="derogationSpread" defaultChecked={w.derogationSpread} />
          </div>
        </Section>

        {/* CIS */}
        <Section title="CIS Details (if applicable)">
          <Field label="UTR Number" name="utrNumber" placeholder="1234567890" defaultValue={w.utrNumber} />
          <SelectField label="CIS Status" name="cisStatus" options={['Gross', 'Net', 'Not Registered']} defaultValue={w.cisStatus} />
          <Field label="Trading Name" name="tradingName" placeholder="Smith Contracting Ltd" defaultValue={w.tradingName} />
        </Section>

        {/* Compliance */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Compliance &amp; Settings</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <CheckField label="Pension Applicable" name="pensionApplicable" defaultChecked={w.pensionApplicable} />
              <CheckField label="Apprenticeship Levy" name="apprenticeshipLevy" defaultChecked={w.apprenticeshipLevy} />
              <CheckField label="GDPR Consent" name="gdpr" defaultChecked={w.gdpr} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 pt-2">
          <Button type="submit" size="lg">Save Changes</Button>
          <Link href={`/dashboard/workers/${id}`}>
            <Button type="button" variant="outline" size="lg">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
