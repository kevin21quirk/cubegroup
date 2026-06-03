/**
 * /api/import/companies
 *
 * GET  → stream a companies import template (.xlsx)
 * POST → multipart/form-data with file field "file" → import rows, return JSON results
 */
import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { prisma } from '@/lib/prisma'
import { parseFile, normHeader } from '@/lib/import/parseFile'

export const dynamic = 'force-dynamic'

// ── Column map: normalised header → structured key ───────────────────────────

const COL: Record<string, string> = {
  name:                'name',
  companyname:         'name',
  registrationnumber:  'registrationNumber',
  regno:               'registrationNumber',
  vatnumber:           'vatNumber',
  vat:                 'vatNumber',
  industry:            'industry',
  companytype:         'companyType',
  type:                'companyType',
  billingaddress:      'billingAddress',
  address:             'billingAddress',
  addressline1:        'billingAddress',
  billingcity:         'billingCity',
  city:                'billingCity',
  billingpostcode:     'billingPostcode',
  postcode:            'billingPostcode',
  billingcountry:      'billingCountry',
  country:             'billingCountry',
  paymentterms:        'paymentTerms',
  paymenttermsdays:    'paymentTerms',
  payrollfrequency:    'payrollFrequency',
  frequency:           'payrollFrequency',
  agencyname:          'agencyName',
  agencybranch:        'agencyBranch',
  agencyref:           'agencyRef',
  cisregistered:       'cisRegistered',
  cis:                 'cisRegistered',
  utr:                 'uniqueTaxRef',
  uniquetaxref:        'uniqueTaxRef',
  emaildomains:        'emailDomains',
  domains:             'emailDomains',
  contactemail:        'contactEmail',
  email:               'contactEmail',
  contactphone:        'contactPhone',
  phone:               'contactPhone',
  accountingsystem:    'accountingSystem',
  accounting:          'accountingSystem',
}

// ── GET — download template ───────────────────────────────────────────────────

const TEMPLATE_COLS = [
  { header: 'name *',               key: 'name',              width: 30 },
  { header: 'registration number',  key: 'registrationNumber', width: 20 },
  { header: 'vat number',           key: 'vatNumber',          width: 15 },
  { header: 'industry',             key: 'industry',           width: 20 },
  { header: 'company type',         key: 'companyType',        width: 18, note: 'SoleTrader / Partnership / LimitedCompany / Public' },
  { header: 'billing address',      key: 'billingAddress',     width: 30 },
  { header: 'billing city',         key: 'billingCity',        width: 18 },
  { header: 'billing postcode',     key: 'billingPostcode',    width: 14 },
  { header: 'billing country',      key: 'billingCountry',     width: 18 },
  { header: 'payment terms (days)', key: 'paymentTerms',       width: 20 },
  { header: 'payroll frequency',    key: 'payrollFrequency',   width: 18, note: 'Weekly / Monthly / Fortnightly' },
  { header: 'agency name',          key: 'agencyName',         width: 24 },
  { header: 'agency branch',        key: 'agencyBranch',       width: 18 },
  { header: 'agency ref',           key: 'agencyRef',          width: 14 },
  { header: 'cis registered',       key: 'cisRegistered',      width: 14, note: 'TRUE or FALSE' },
  { header: 'utr',                  key: 'utr',                width: 14 },
  { header: 'email domains',        key: 'emailDomains',       width: 28, note: 'Comma-separated, e.g. agency.com, payroll.co.uk' },
  { header: 'contact email',        key: 'contactEmail',       width: 28 },
  { header: 'contact phone',        key: 'contactPhone',       width: 16 },
  { header: 'accounting system',    key: 'accountingSystem',   width: 20, note: 'None / Xero / QuickBooks / BrightPay / MoneySoft' },
]

const SAMPLE_ROW = {
  name: 'Acme Staffing Ltd',
  registrationNumber: '12345678',
  vatNumber: 'GB123456789',
  industry: 'Construction',
  companyType: 'LimitedCompany',
  billingAddress: '1 Business Park',
  billingCity: 'London',
  billingPostcode: 'EC1A 1BB',
  billingCountry: 'United Kingdom',
  paymentTerms: '30',
  payrollFrequency: 'Weekly',
  agencyName: 'Acme Agency',
  agencyBranch: 'London',
  agencyRef: 'ACM001',
  cisRegistered: 'FALSE',
  utr: '',
  emailDomains: 'acme.co.uk, acmestaffing.com',
  contactEmail: 'payroll@acme.co.uk',
  contactPhone: '020 1234 5678',
  accountingSystem: 'None',
}

export async function GET() {
  const workbook  = new ExcelJS.Workbook()
  workbook.creator = 'CubeGroup'
  const ws = workbook.addWorksheet('Companies')

  ws.columns = TEMPLATE_COLS.map(c => ({ header: c.header, key: c.key, width: c.width }))

  // Style header row
  const headerRow = ws.getRow(1)
  headerRow.font  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
  headerRow.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } }
  headerRow.height = 20
  headerRow.alignment = { vertical: 'middle' }

  // Add notes to specific cells
  TEMPLATE_COLS.forEach((col, idx) => {
    if (col.note) {
      const cell = ws.getRow(1).getCell(idx + 1)
      cell.note = col.note
    }
  })

  // Sample row
  const sampleRow = ws.addRow(SAMPLE_ROW)
  sampleRow.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } }

  // Freeze header
  ws.views = [{ state: 'frozen', ySplit: 1 }]

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="companies_import_template.xlsx"',
    },
  })
}

// ── POST — process import ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  let rows
  try {
    rows = await parseFile(file)
  } catch (err) {
    return NextResponse.json({ error: `Could not parse file: ${err instanceof Error ? err.message : err}` }, { status: 400 })
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No data rows found. Check the file has a header row followed by data.' }, { status: 400 })
  }

  // Normalise row keys using the column map
  function mapRow(raw: Record<string, string>): Record<string, string> {
    const mapped: Record<string, string> = {}
    for (const [rawKey, rawVal] of Object.entries(raw)) {
      const key = COL[normHeader(rawKey)]
      if (key) mapped[key] = rawVal
    }
    return mapped
  }

  // Need a user to set as creator
  const firstUser = await prisma.user.findFirst()
  if (!firstUser) return NextResponse.json({ error: 'No users in system' }, { status: 500 })

  const results = { created: 0, skipped: 0, failed: 0, errors: [] as { row: number; error: string }[] }

  for (let i = 0; i < rows.length; i++) {
    const mapped = mapRow(rows[i])
    const rowNum = i + 2 // 1-based, +1 for header

    const name = mapped.name?.trim()
    if (!name) {
      results.errors.push({ row: rowNum, error: 'Missing required field: name' })
      results.failed++
      continue
    }

    try {
      // Skip if a company with same name already exists (case-insensitive)
      const existing = await prisma.company.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } },
        select: { id: true },
      })
      if (existing) {
        results.errors.push({ row: rowNum, error: `Company "${name}" already exists — skipped` })
        results.skipped++
        continue
      }

      const emailDomains = mapped.emailDomains
        ? mapped.emailDomains.split(',').map((d: string) => d.trim()).filter(Boolean)
        : []

      const contactEmail  = mapped.contactEmail?.trim() || `contact@${name.replace(/\s+/g, '').toLowerCase()}.com`
      const contactPhone  = mapped.contactPhone?.trim() || undefined

      await prisma.company.create({
        data: {
          name,
          registrationNumber: mapped.registrationNumber?.trim() || undefined,
          vatNumber:          mapped.vatNumber?.trim()          || undefined,
          industry:           mapped.industry?.trim()           || undefined,
          companyType:        mapped.companyType?.trim()        || undefined,
          billingAddress:     mapped.billingAddress?.trim()     || undefined,
          billingCity:        mapped.billingCity?.trim()        || undefined,
          billingPostcode:    mapped.billingPostcode?.trim()    || undefined,
          billingCountry:     mapped.billingCountry?.trim()     || 'United Kingdom',
          paymentTerms:       parseInt(mapped.paymentTerms || '30', 10) || 30,
          payrollFrequency:   mapped.payrollFrequency?.trim()   || 'Weekly',
          agencyName:         mapped.agencyName?.trim()         || undefined,
          agencyBranch:       mapped.agencyBranch?.trim()       || undefined,
          agencyRef:          mapped.agencyRef?.trim()          || undefined,
          cisRegistered:      /^(true|yes|1)$/i.test(mapped.cisRegistered || ''),
          uniqueTaxRef:       mapped.uniqueTaxRef?.trim()       || undefined,
          emailDomains,
          accountingSystem:   mapped.accountingSystem?.trim()   || 'None',
          isActive: true,
          createdById: firstUser.id,
          contacts: {
            create: {
              firstName: 'Primary',
              lastName:  'Contact',
              email:     contactEmail,
              phone:     contactPhone,
              isPrimary: true,
            },
          },
        },
      })

      results.created++
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      results.errors.push({ row: rowNum, error: msg })
      results.failed++
    }
  }

  return NextResponse.json({ success: true, total: rows.length, ...results })
}
