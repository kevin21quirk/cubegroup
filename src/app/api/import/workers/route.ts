/**
 * /api/import/workers
 *
 * GET  → stream a workers import template (.xlsx)
 * POST → multipart/form-data with file field "file" → import rows, return JSON results
 *
 * Company resolution: column "company name" is matched case-insensitively to existing companies.
 * Workers are deduplicated by NI number (if provided).
 */
import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { prisma } from '@/lib/prisma'
import { parseFile, normHeader } from '@/lib/import/parseFile'

export const dynamic = 'force-dynamic'

// ── Column map ────────────────────────────────────────────────────────────────

const COL: Record<string, string> = {
  companyname:          'companyName',
  company:              'companyName',
  title:                'title',
  salutation:           'title',
  firstname:            'firstName',
  forename:             'firstName',
  middlenames:          'middleNames',
  middlename:           'middleNames',
  lastname:             'lastName',
  surname:              'lastName',
  familyname:           'lastName',
  gender:               'gender',
  sex:                  'gender',
  dateofbirth:          'dateOfBirth',
  dob:                  'dateOfBirth',
  birthdate:            'dateOfBirth',
  nationality:          'nationality',
  mobile:               'mobile',
  mobilenumber:         'mobile',
  phone:                'phone',
  telephone:            'phone',
  email:                'email',
  emailaddress:         'email',
  addressline1:         'addressLine1',
  address1:             'addressLine1',
  address:              'addressLine1',
  addressline2:         'addressLine2',
  address2:             'addressLine2',
  town:                 'town',
  city:                 'town',
  county:               'county',
  postcode:             'postCode',
  postalcode:           'postCode',
  zip:                  'postCode',
  country:              'livingCountry',
  livingcountry:        'livingCountry',
  ninumber:             'nationalInsurance',
  nationalinsurance:    'nationalInsurance',
  nino:                 'nationalInsurance',
  ni:                   'nationalInsurance',
  taxcode:              'taxCode',
  nicategory:           'niCategory',
  startdate:            'startDate',
  payfrequency:         'payFrequency',
  frequency:            'payFrequency',
  product:              'product',
  paymenttype:          'product',
  agency:               'agency',
  agencyname:           'agency',
  branch:               'branch',
  agencyref:            'agencyRef',
  jobdescription:       'jobDescription',
  jobtitle:             'jobDescription',
  cisstatus:            'cisStatus',
  cis:                  'cisStatus',
  utrnumber:            'utrNumber',
  utr:                  'utrNumber',
  paymentmethod:        'paymentMethod',
  employeenumber:       'employeeNumber',
  empno:                'employeeNumber',
  department:           'department',
  bankname:             'bankName',
  bankaccountnumber:    'bankAccountNumber',
  accountnumber:        'bankAccountNumber',
  banksortcode:         'bankSortCode',
  sortcode:             'bankSortCode',
  nameonbankaccount:    'nameOnBankAccount',
  accountname:          'nameOnBankAccount',
}

// ── Template definition ───────────────────────────────────────────────────────

const TEMPLATE_COLS = [
  { header: 'company name *',      key: 'companyName',       width: 28, note: 'Must match an existing company name exactly' },
  { header: 'title',               key: 'title',             width: 10, note: 'Mr / Mrs / Ms / Dr / Miss' },
  { header: 'first name *',        key: 'firstName',         width: 18 },
  { header: 'middle names',        key: 'middleNames',       width: 18 },
  { header: 'last name *',         key: 'lastName',          width: 18 },
  { header: 'gender',              key: 'gender',            width: 10, note: 'Male / Female / Other' },
  { header: 'date of birth',       key: 'dateOfBirth',       width: 14, note: 'YYYY-MM-DD' },
  { header: 'nationality',         key: 'nationality',       width: 16 },
  { header: 'mobile',              key: 'mobile',            width: 16 },
  { header: 'phone',               key: 'phone',             width: 16 },
  { header: 'email',               key: 'email',             width: 28 },
  { header: 'address line 1',      key: 'addressLine1',      width: 28 },
  { header: 'address line 2',      key: 'addressLine2',      width: 24 },
  { header: 'town',                key: 'town',              width: 18 },
  { header: 'county',              key: 'county',            width: 18 },
  { header: 'postcode',            key: 'postCode',          width: 12 },
  { header: 'country',             key: 'country',           width: 18 },
  { header: 'ni number',           key: 'nationalInsurance', width: 14, note: 'e.g. AB123456C' },
  { header: 'tax code',            key: 'taxCode',           width: 12 },
  { header: 'ni category',         key: 'niCategory',        width: 14, note: 'A / B / C / H / J / M / Z' },
  { header: 'start date',          key: 'startDate',         width: 14, note: 'YYYY-MM-DD' },
  { header: 'pay frequency',       key: 'payFrequency',      width: 16, note: 'Weekly / Fortnightly / Monthly' },
  { header: 'product',             key: 'product',           width: 14, note: 'PAYE / CIS / Umbrella' },
  { header: 'agency',              key: 'agency',            width: 24 },
  { header: 'branch',              key: 'branch',            width: 18 },
  { header: 'agency ref',          key: 'agencyRef',         width: 14 },
  { header: 'job description',     key: 'jobDescription',    width: 28 },
  { header: 'cis status',          key: 'cisStatus',         width: 14, note: 'Gross / Net / NotRegistered' },
  { header: 'utr number',          key: 'utrNumber',         width: 14 },
  { header: 'payment method',      key: 'paymentMethod',     width: 16, note: 'BACS / CHAPS / Cheque / Cash' },
  { header: 'bank name',           key: 'bankName',          width: 20 },
  { header: 'account name',        key: 'nameOnBankAccount', width: 24 },
  { header: 'bank account number', key: 'bankAccountNumber', width: 20 },
  { header: 'sort code',           key: 'bankSortCode',      width: 12 },
  { header: 'employee number',     key: 'employeeNumber',    width: 16 },
  { header: 'department',          key: 'department',        width: 18 },
]

const SAMPLE_ROW = {
  companyName: 'Acme Staffing Ltd',
  title: 'Mr',
  firstName: 'John',
  middleNames: '',
  lastName: 'Smith',
  gender: 'Male',
  dateOfBirth: '1985-04-15',
  nationality: 'British',
  mobile: '07700 900123',
  phone: '',
  email: 'john.smith@example.com',
  addressLine1: '10 Main Street',
  addressLine2: '',
  town: 'London',
  county: 'Greater London',
  postCode: 'W1A 1AA',
  country: 'United Kingdom',
  nationalInsurance: 'AB123456C',
  taxCode: '1257L',
  niCategory: 'A',
  startDate: '2024-01-08',
  payFrequency: 'Weekly',
  product: 'PAYE',
  agency: 'Acme Agency',
  branch: 'London',
  agencyRef: 'ACM001',
  jobDescription: 'Site Labourer',
  cisStatus: '',
  utrNumber: '',
  paymentMethod: 'BACS',
  bankName: 'HSBC',
  nameOnBankAccount: 'J Smith',
  bankAccountNumber: '12345678',
  bankSortCode: '40-47-84',
  employeeNumber: 'EMP001',
  department: 'Operations',
}

// ── GET — download template ───────────────────────────────────────────────────

export async function GET() {
  const workbook  = new ExcelJS.Workbook()
  workbook.creator = 'CubeGroup'
  const ws = workbook.addWorksheet('Workers')

  ws.columns = TEMPLATE_COLS.map(c => ({ header: c.header, key: c.key, width: c.width }))

  // Style header row
  const headerRow = ws.getRow(1)
  headerRow.font  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
  headerRow.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } }
  headerRow.height = 20
  headerRow.alignment = { vertical: 'middle' }

  // Notes on specific cells
  TEMPLATE_COLS.forEach((col, idx) => {
    if ((col as { note?: string }).note) {
      ws.getRow(1).getCell(idx + 1).note = (col as { note?: string }).note!
    }
  })

  // Sample row
  const sampleRow = ws.addRow(SAMPLE_ROW)
  sampleRow.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } }

  ws.views = [{ state: 'frozen', ySplit: 1 }]

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="workers_import_template.xlsx"',
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

  // Build company name → id map up-front to avoid N+1 queries
  const companies = await prisma.company.findMany({ select: { id: true, name: true } })
  const companyMap = new Map(companies.map(c => [c.name.toLowerCase(), c.id]))

  function mapRow(raw: Record<string, string>): Record<string, string> {
    const mapped: Record<string, string> = {}
    for (const [rawKey, rawVal] of Object.entries(raw)) {
      const key = COL[normHeader(rawKey)]
      if (key) mapped[key] = rawVal
    }
    return mapped
  }

  function parseDate(s: string): Date | undefined {
    if (!s?.trim()) return undefined
    const d = new Date(s.trim())
    return isNaN(d.getTime()) ? undefined : d
  }

  const results = { created: 0, skipped: 0, failed: 0, errors: [] as { row: number; error: string }[] }

  for (let i = 0; i < rows.length; i++) {
    const mapped  = mapRow(rows[i])
    const rowNum  = i + 2

    const firstName = mapped.firstName?.trim()
    const lastName  = mapped.lastName?.trim()

    if (!firstName || !lastName) {
      results.errors.push({ row: rowNum, error: 'Missing required fields: first name and/or last name' })
      results.failed++
      continue
    }

    // Resolve company
    const companyRaw = mapped.companyName?.trim()
    if (!companyRaw) {
      results.errors.push({ row: rowNum, error: 'Missing required field: company name' })
      results.failed++
      continue
    }
    const companyId = companyMap.get(companyRaw.toLowerCase())
    if (!companyId) {
      results.errors.push({ row: rowNum, error: `Company "${companyRaw}" not found — create the company first` })
      results.failed++
      continue
    }

    try {
      const niNumber = mapped.nationalInsurance?.trim() || undefined

      // Skip if worker with same NI number already exists in this company
      if (niNumber) {
        const existing = await prisma.worker.findFirst({
          where: { companyId, nationalInsurance: niNumber },
          select: { id: true },
        })
        if (existing) {
          results.errors.push({ row: rowNum, error: `Worker with NI ${niNumber} already exists — skipped` })
          results.skipped++
          continue
        }
      }

      await prisma.worker.create({
        data: {
          companyId,
          title:              mapped.title?.trim()             || undefined,
          firstName,
          middleNames:        mapped.middleNames?.trim()       || undefined,
          lastName,
          gender:             mapped.gender?.trim()            || undefined,
          dateOfBirth:        parseDate(mapped.dateOfBirth),
          nationality:        mapped.nationality?.trim()       || undefined,
          mobile:             mapped.mobile?.trim()            || undefined,
          phone:              mapped.phone?.trim()             || undefined,
          email:              mapped.email?.trim()             || undefined,
          addressLine1:       mapped.addressLine1?.trim()      || undefined,
          addressLine2:       mapped.addressLine2?.trim()      || undefined,
          town:               mapped.town?.trim()              || undefined,
          county:             mapped.county?.trim()            || undefined,
          postCode:           mapped.postCode?.trim()          || undefined,
          livingCountry:      mapped.livingCountry?.trim()     || 'United Kingdom',
          nationalInsurance:  niNumber,
          taxCode:            mapped.taxCode?.trim()           || undefined,
          niCategory:         mapped.niCategory?.trim()        || undefined,
          startDate:          parseDate(mapped.startDate),
          payFrequency:       mapped.payFrequency?.trim()      || undefined,
          product:            mapped.product?.trim()           || undefined,
          agency:             mapped.agency?.trim()            || undefined,
          branch:             mapped.branch?.trim()            || undefined,
          agencyRef:          mapped.agencyRef?.trim()         || undefined,
          jobDescription:     mapped.jobDescription?.trim()    || undefined,
          cisStatus:          mapped.cisStatus?.trim()         || undefined,
          utrNumber:          mapped.utrNumber?.trim()         || undefined,
          paymentMethod:      mapped.paymentMethod?.trim()     || undefined,
          bankName:           mapped.bankName?.trim()          || undefined,
          nameOnBankAccount:  mapped.nameOnBankAccount?.trim() || undefined,
          bankAccountNumber:  mapped.bankAccountNumber?.trim() || undefined,
          bankSortCode:       mapped.bankSortCode?.trim()      || undefined,
          employeeNumber:     mapped.employeeNumber?.trim()    || undefined,
          department:         mapped.department?.trim()        || undefined,
          isActive: true,
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
