'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconCalendar() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" strokeLinecap="round" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" />
    </svg>
  )
}

function IconScissors() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" strokeLinecap="round" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconSun() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
    </svg>
  )
}

function IconChart() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M3 20h18M7 20V10M12 20V4M17 20v-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  )
}

function IconBell() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
}

function IconDots() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  )
}

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV = [
  { id: 'citas',        label: 'Citas',        Icon: IconCalendar },
  { id: 'barberos',     label: 'Barberos',     Icon: IconUsers    },
  { id: 'servicios',    label: 'Servicios',    Icon: IconScissors },
  { id: 'horarios',     label: 'Horarios',     Icon: IconClock    },
  { id: 'vacaciones',   label: 'Vacaciones',   Icon: IconSun      },
  { id: 'estadisticas', label: 'Estadísticas', Icon: IconChart    },
]

// Bottom nav primary tabs (mobile)
const MOBILE_NAV = [
  { id: 'citas',        label: 'Citas',     Icon: IconCalendar },
  { id: 'barberos',     label: 'Barberos',  Icon: IconScissors },
  { id: 'servicios',    label: 'Servicios', Icon: IconUsers    },
  { id: 'estadisticas', label: 'Stats',     Icon: IconChart    },
]

// ── Sidebar content ───────────────────────────────────────────────────────────

interface SidebarProps {
  seccion: string
  onSeccionChange: (s: string) => void
  onClose?: () => void
}

function SidebarContent({ seccion, onSeccionChange, onClose }: SidebarProps) {
  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 pt-5 pb-2.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center flex-shrink-0 text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="6" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" strokeLinecap="round" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-black text-sm tracking-tight leading-none">CitasWassap</p>
            <p className="text-[9px] text-muted uppercase tracking-widest mt-0.5">Premium Dashboard</p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar menú"
              className="text-muted hover:text-white transition-colors p-1 flex-shrink-0"
            >
              <IconClose />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ id, label, Icon }) => {
          const active = seccion === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => { onSeccionChange(id); onClose?.() }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                active
                  ? 'bg-surface-3 text-white'
                  : 'text-muted-light hover:bg-surface-2 hover:text-white'
              }`}

            >
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                active ? 'bg-brand text-white' : 'text-muted'
              }`}>
                <Icon />
              </span>
              {label}
            </button>
          )
        })}
      </nav>

      {/* Nueva Cita CTA */}
      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={() => { onSeccionChange('citas'); onClose?.() }}
          className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white py-2.5 px-4 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-brand-glow"
        >
          <IconPlus />
          Nueva Cita
        </button>
      </div>

      {/* Bottom */}
      <div className="px-3 pb-4 pt-3 border-t border-edge space-y-1">
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 bg-online/10 hover:bg-online/20 text-online border border-online/20 text-xs font-bold py-2 px-3 rounded-xl transition-colors"
        >
          <span className="text-sm">💬</span>
          Connect WhatsApp
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full text-xs text-muted hover:text-white transition-colors py-2"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

// ── Bottom navigation (mobile) ─────────────────────────────────────────────────

function BottomNav({ seccion, onSeccionChange, onMoreClick }: {
  seccion: string
  onSeccionChange: (s: string) => void
  onMoreClick: () => void
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-edge lg:hidden">
      <div className="flex items-center justify-around h-16 px-1">
        {MOBILE_NAV.map(({ id, label, Icon }) => {
          const active = seccion === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSeccionChange(id)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors ${
                active ? 'text-brand' : 'text-muted hover:text-muted-light'
              }`}
            >
              <Icon />
              <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={onMoreClick}
          className="flex flex-col items-center justify-center gap-1 flex-1 py-2 text-muted hover:text-muted-light transition-colors"
        >
          <IconDots />
          <span className="text-[9px] font-bold uppercase tracking-wide">Más</span>
        </button>
      </div>
    </nav>
  )
}

// ── Shell ─────────────────────────────────────────────────────────────────────

interface AdminShellProps {
  children: React.ReactNode
  seccion: string
  onSeccionChange: (s: string) => void
}

export default function AdminShell({ children, seccion, onSeccionChange }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<{ name: string } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const email = data.user.email ?? ''
        const name =
          data.user.user_metadata?.full_name ||
          email.split('@')[0].replace(/[._-]/g, ' ')
        setUser({ name })
      }
    })
  }, [])

  function initials(name: string) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  function toTitleCase(str: string) {
    return str.replace(/\b\w/g, c => c.toUpperCase())
  }

  return (
    <div className="flex min-h-screen bg-base">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-base sticky top-0 h-screen">
        <SidebarContent seccion={seccion} onSeccionChange={onSeccionChange} />
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-overlay/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer (for "Más" section) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-edge flex flex-col lg:hidden transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent
          seccion={seccion}
          onSeccionChange={onSeccionChange}
          onClose={() => setMobileOpen(false)}
        />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-base sticky top-0 z-30 border-b border-edge/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center flex-shrink-0 text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="6" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-white font-black text-sm tracking-tight leading-none">Atelier</p>
              <p className="text-[9px] text-muted uppercase tracking-widest">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-online rounded-full animate-pulse" />
              <span className="text-xs text-online font-semibold hidden xs:block">WhatsApp</span>
            </div>
            <button
              type="button"
              aria-label="Notificaciones"
              className="w-8 h-8 flex items-center justify-center text-muted hover:text-white hover:bg-surface-2 rounded-xl transition-colors relative"
            >
              <IconBell />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand rounded-full" />
            </button>
          </div>
        </header>

        {/* Desktop topbar */}
        <header className="hidden lg:flex items-center gap-4 px-6 py-3 bg-base sticky top-0 z-30">
          {/* Search */}
          <div className="flex items-center gap-2.5 bg-surface-2 border border-edge hover:border-edge-light rounded-xl px-4 py-2 flex-1 max-w-sm transition-colors">
            <span className="text-muted flex-shrink-0"><IconSearch /></span>
            <input
              type="text"
              placeholder="Buscar citas, clientes..."
              className="bg-transparent text-sm text-white placeholder:text-muted focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              aria-label="Notificaciones"
              className="w-9 h-9 flex items-center justify-center text-muted hover:text-white hover:bg-surface-2 rounded-xl transition-colors relative"
            >
              <IconBell />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-brand rounded-full" />
            </button>
            <button
              type="button"
              aria-label="Configuración"
              className="w-9 h-9 flex items-center justify-center text-muted hover:text-white hover:bg-surface-2 rounded-xl transition-colors"
            >
              <IconSettings />
            </button>

            <div className="w-px h-6 bg-edge mx-1" />

            {user && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                  {initials(user.name)}
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-none">{toTitleCase(user.name)}</p>
                  <p className="text-[9px] text-muted uppercase tracking-widest mt-0.5">Salon Manager</p>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-16 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav
        seccion={seccion}
        onSeccionChange={onSeccionChange}
        onMoreClick={() => setMobileOpen(true)}
      />
    </div>
  )
}
