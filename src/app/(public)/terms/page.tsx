export const metadata = {
  title: 'Terms of Service – Cube Group Payroll Platform',
}

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 space-y-8 text-sm leading-relaxed">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: June 2025</p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Overview</h2>
        <p>
          These Terms govern access to and use of the Cube Group Payroll Automation Platform
          ("<strong>the Platform</strong>"). The Platform is an internal business tool operated by Cube Group
          and is not available to the general public.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Authorised users</h2>
        <p>
          Access is restricted to staff and administrators explicitly authorised by Cube Group.
          Unauthorised access is strictly prohibited.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Gmail integration</h2>
        <p>
          Users who connect a Gmail account grant the Platform permission to read, label, and
          modify messages within the <code>Payroll-Incoming</code> Gmail label solely for payroll
          processing purposes. This access can be revoked at any time via Google Account settings.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Acceptable use</h2>
        <p>Users must not:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Share login credentials with unauthorised parties</li>
          <li>Use the Platform to process data unrelated to Cube Group payroll operations</li>
          <li>Attempt to circumvent access controls or security measures</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Limitation of liability</h2>
        <p>
          The Platform is provided "as is" for internal operational use. Cube Group accepts no
          liability for data loss resulting from third-party service outages (Google, Vercel, Neon).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Changes</h2>
        <p>
          These Terms may be updated at any time. Continued use of the Platform constitutes
          acceptance of the updated Terms.
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
