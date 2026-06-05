'use client'

import { useRouter } from 'next/navigation'
import { Building2 } from 'lucide-react'

interface Company { id: string; name: string }

export function WorkersCompanyFilter({
  companies,
  selectedId,
}: {
  companies: Company[]
  selectedId?: string
}) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
      <select
        value={selectedId ?? ''}
        onChange={e => router.push(e.target.value ? `/dashboard/workers?companyId=${e.target.value}` : '/dashboard/workers')}
        className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <option value="">Select a company…</option>
        {companies.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  )
}
