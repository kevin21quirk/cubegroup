import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createUmbrellaCompany } from '@/app/actions/umbrella-companies'

export default function NewUmbrellaCompanyPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/umbrella-companies">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Add Umbrella Company</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Company Details</CardTitle></CardHeader>
        <CardContent>
          <form action={createUmbrellaCompany} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium">Company Name *</label>
                <Input id="name" name="name" required placeholder="e.g. Paystream Ltd" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="contactEmail" className="text-sm font-medium">Contact Email * <span className="text-muted-foreground text-xs">(CSV will be sent here)</span></label>
                <Input id="contactEmail" name="contactEmail" type="email" required placeholder="payroll@umbrellacompany.co.uk" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="contactPhone" className="text-sm font-medium">Phone</label>
                <Input id="contactPhone" name="contactPhone" type="tel" placeholder="+44 20 1234 5678" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="address" className="text-sm font-medium">Address</label>
                <Input id="address" name="address" placeholder="123 Example Street" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="city" className="text-sm font-medium">City</label>
                <Input id="city" name="city" placeholder="London" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="postcode" className="text-sm font-medium">Postcode</label>
                <Input id="postcode" name="postcode" placeholder="EC1A 1BB" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit">Create Umbrella Company</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
