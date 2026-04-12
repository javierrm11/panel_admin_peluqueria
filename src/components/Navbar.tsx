import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-edge bg-base/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="font-black text-white text-lg tracking-tight">
          CitasWassap
        </Link>

        {/* Links - desktop */}
        <div className="hidden md:flex items-center gap-8 text-sm text-muted-light">
          <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/showcase" className="hover:text-white transition-colors">Showcase</Link>
          <Link href="#" className="hover:text-white transition-colors">Docs</Link>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:block text-sm text-muted-light hover:text-white transition-colors"
          >
            Login
          </Link>
          <Link
            href="/login"
            className="bg-brand hover:bg-brand-hover text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  )
}