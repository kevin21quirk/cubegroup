import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Building2, Mail, Phone, Users } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getUmbrellaCompany, updateUmbrellaCompany, deleteUmbrellaCompany } from '@/app/actions/umbrella-companies'
import { DeleteButton } from '@/components/ui/delete-button'

export const dynamic = 'force-dynamic'

export default async function UmbrellaCompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const company = await getUmbrellaCompany(id)
  if (!company) notFound()

  const update = updateUmbrellaCompany.bind(null, id)

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/umbrella-companies">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
            <Users className="h-3.5 w-3.5" />{company._count.payrollEntries} payroll entries linked
          </p>
        </div>
        <Badge variant={company.isActive ? 'default' : 'secondary'}>
          {company.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Quick contact info */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{company.contactEmail}</span>
        {company.contactPhone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{company.contactPhone}</span>}
      </div>

      <Card>
        <CardHeader><CardTitle>Edit Details</CardTitle></CardHeader>
        <CardContent>
          <form action={update} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium">Company Name *</label>
                <Input id="name" name="name" required defaultValue={company.name} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="contactEmail" className="text-sm font-medium">
                  Contact Email * <span className="text-muted-foreground text-xs">(CSV will be sent here on payment)</span>
                </label>
                <Input id="contactEmail" name="contactEmail" type="email" required defaultValue={company.contactEmail} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="contactPhone" className="text-sm font-medium">Phone</label>
                <Input id="contactPhone" name="contactPhone" type="tel" defaultValue={company.contactPhone ?? ''} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="processingFee" className="text-sm font-medium">Processing Fee (£/worker)</label>
                <Input id="processingFee" name="processingFee" type="number" step="0.01" min="0" defaultValue={company.processingFee} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="address" className="text-sm font-medium">Address</label>
                <Input id="address" name="address" defaultValue={company.address ?? ''} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="city" className="text-sm font-medium">City</label>
                <Input id="city" name="city" defaultValue={company.city ?? ''} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="postcode" className="text-sm font-medium">Postcode</label>
                <Input id="postcode" name="postcode" defaultValue={company.postcode ?? ''} />
              </div>
              <input type="hidden" name="isActive" value={String(company.isActive)} />
            </div>
            <div className="flex items-center justify-between pt-2">
              <DeleteButton
                action={async () => { 'use server'; await deleteUmbrellaCompany(id) }}
                label="Delete Company"
                description={`Permanently delete ${company.name}? This cannot be undone.`}
                redirectTo="/dashboard/umbrella-companies"
              />
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
