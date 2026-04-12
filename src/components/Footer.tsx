import Link from 'next/link'

const cols = [
  {
    title: 'Producto',
    links: ['Features', 'Precios', 'Integraciones'],
  },
  {
    title: 'Compañía',
    links: ['Blog', 'Sobre'],
  },
  {
    title: 'Legal',
    links: ['Terms', 'Privacy'],
  },
  {
    title: 'Soporte',
    links: ['Docs', 'Support'],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-edge bg-base">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-5 gap-10">
        {/* Brand */}
        <div className="md:col-span-1">
          <p className="font-black text-white text-lg mb-2">CitasWassap</p>
          <p className="text-xs text-muted leading-relaxed">
            © 2024 CitasWassap. Intelligent Flow for Modern Salons. Elevating the management of beauty to an art digital.
          </p>
        </div>

        {/* Link columns */}
        {cols.map((col) => (
          <div key={col.title}>
            <p className="text-xs font-bold text-white uppercase tracking-widest mb-4">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l}>
                  <Link href="#" className="text-sm text-muted hover:text-white transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-edge">
        <p className="max-w-7xl mx-auto px-6 py-4 text-[10px] text-muted uppercase tracking-widest">
          Powered by Vercel / Supabase
        </p>
      </div>
    </footer>
  )
}