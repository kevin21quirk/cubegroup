import Link from 'next/link'
import { Mail, FileSpreadsheet, FileText, CheckCircle2, Building2, Shield } from 'lucide-react'

export const metadata = {
  title: 'Cube Group – Payroll Automation Platform',
  description:
    'Cube Group is a payroll automation platform that processes timesheets via email, generates invoices, and coordinates payroll with umbrella companies.',
}

const features = [
  {
    icon: Mail,
    title: 'Email-to-Payroll Ingestion',
    body: 'Payroll spreadsheets sent to a monitored Gmail label are automatically detected, parsed, and imported — no manual uploading required.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Automated Data Extraction',
    body: 'Claude AI reads timesheet attachments, extracts worker hours, rates, and expenses, and builds structured payroll entries ready for approval.',
  },
  {
    icon: FileText,
    title: 'Invoice Generation',
    body: 'Management-fee invoices are generated per payroll period, emailed to the client company, and tracked through to payment with partial-payment reconciliation.',
  },
  {
    icon: Building2,
    title: 'Umbrella Company Coordination',
    body: 'Once an invoice is paid, a payroll CSV is automatically emailed to the linked umbrella payroll company so workers can be paid on time.',
  },
  {
    icon: CheckCircle2,
    title: 'Workflow Pipeline',
    body: 'Every payroll period moves through a clear 5-step pipeline: Timesheet → Data Processing → Payslips → Invoice → Payment, with live status tracking.',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    body: 'Super-admin and staff roles ensure each user only sees the companies and data they are authorised to manage.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">

      {/* ── Nav ── */}
      <header className="border-b px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">C</div>
          <span className="font-semibold text-lg">Cube Group</span>
        </div>
        <Link
          href="/login"
          className="rounded-md bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700 transition-colors"
        >
          Sign In
        </Link>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 px-4 py-1.5 text-sm text-blue-700 dark:text-blue-300 font-medium">
          Internal Payroll Platform
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
          Payroll automation for Cube Group
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          An end-to-end payroll workflow platform that ingests timesheets via email, processes
          worker data with AI, generates client invoices, and coordinates payments with umbrella
          payroll companies — all in one place.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/login"
            className="rounded-md bg-blue-600 text-white font-medium px-6 py-3 hover:bg-blue-700 transition-colors"
          >
            Sign In to Platform
          </Link>
          <Link
            href="/privacy"
            className="rounded-md border px-6 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            Privacy Policy
          </Link>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border p-6 space-y-3 hover:shadow-sm transition-shadow">
              <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Gmail note (addresses the "explain Gmail usage" requirement) ── */}
      <section className="border-t bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6 py-12 text-center space-y-3">
          <Mail className="h-8 w-8 text-blue-600 mx-auto" />
          <h2 className="text-xl font-semibold">Gmail Integration</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            The platform connects to a single authorised Gmail account to monitor a
            dedicated <strong>Payroll-Incoming</strong> label. Emails are read solely to extract
            payroll spreadsheet attachments. After processing, messages are moved to
            <strong> Payroll-Processed</strong> and marked as read. No email content is shared
            with third parties or used for any purpose other than payroll processing.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t px-6 py-8 text-center text-xs text-gray-400 space-x-4">
        <span>© {new Date().getFullYear()} Cube Group</span>
        <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        <Link href="/terms" className="hover:underline">Terms of Service</Link>
      </footer>
    </div>
  )
}
