export const metadata = {
  title: 'Privacy Policy – Cube Group Payroll Platform',
}

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 space-y-8 text-sm leading-relaxed">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: June 2025</p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Who we are</h2>
        <p>
          Cube Group operates a payroll automation platform ("<strong>the Platform</strong>") used internally
          to manage payroll submissions, invoice generation, and umbrella company communications.
          The Platform is not a public consumer product.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Data we collect</h2>
        <p>The Platform processes the following categories of data:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Payroll-related emails received by authorised Gmail accounts (sender, subject, attachments)</li>
          <li>Worker names, NI numbers, hours worked, and pay details contained in submitted spreadsheets</li>
          <li>Company and invoice information for billing purposes</li>
          <li>User login credentials for authorised staff accounts</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. How we use Gmail data</h2>
        <p>
          With the explicit consent of the Gmail account holder, the Platform uses the Gmail API to:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Read emails from the <code>Payroll-Incoming</code> label to extract payroll spreadsheet attachments</li>
          <li>Move processed emails to the <code>Payroll-Processed</code> label to prevent duplicate processing</li>
          <li>Mark processed emails as read</li>
        </ul>
        <p>
          Gmail data is used solely for payroll processing and is never shared with third parties, used for
          advertising, or retained beyond operational necessity. The Platform adheres to
          Google's <a href="https://developers.google.com/terms/api-services-user-data-policy" className="underline" target="_blank" rel="noopener">API Services User Data Policy</a>,
          including the Limited Use requirements.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Data storage</h2>
        <p>
          Data is stored in a secure PostgreSQL database hosted on Neon.tech (EU region) and file
          attachments in Vercel Blob storage. No data is stored outside the EEA without adequate safeguards.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Data retention</h2>
        <p>
          Email and payroll data is retained for the duration required by UK payroll regulations (minimum 3 years).
          Data can be deleted on request.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Your rights</h2>
        <p>
          Under UK GDPR you have the right to access, correct, or delete personal data held about you.
          Contact us at <a href="mailto:kevin.s.quirk@gmail.com" className="underline">kevin.s.quirk@gmail.com</a> to exercise these rights.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">7. Contact</h2>
        <p>
          Cube Group<br />
          Email: <a href="mailto:kevin.s.quirk@gmail.com" className="underline">kevin.s.quirk@gmail.com</a>
        </p>
      </section>
    </main>
  )
}
