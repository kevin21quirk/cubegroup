export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {children}
      <footer className="border-t mt-16 px-6 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Cube Group · <a href="/privacy" className="underline">Privacy Policy</a> · <a href="/terms" className="underline">Terms of Service</a>
      </footer>
    </div>
  )
}
