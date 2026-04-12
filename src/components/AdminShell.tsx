'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconCalendar() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" strokeLinecap="round" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" />
    </svg>
  )
}

function IconScissors() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" strokeLinecap="round" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconSun() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
    </svg>
  )
}

function IconChart() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M3 20h18M7 20V10M12 20V4M17 20v-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconMenu() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
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

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV = [
  { id: 'citas',        label: 'Citas',        Icon: IconCalendar },
  { id: 'barberos',     label: 'Barberos',     Icon: IconUsers    },
  { id: 'servicios',    label: 'Servicios',    Icon: IconScissors },
  { id: 'horarios',     label: 'Horarios',     Icon: IconClock    },
  { id: 'vacaciones',   label: 'Vacaciones',   Icon: IconSun      },
  { id: 'estadisticas', label: 'Estadísticas', Icon: IconChart    },
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
      <div className="px-5 pt-6 pb-5 border-b border-edge">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-black text-sm tracking-tight">CitasWassap</p>
            <p className="text-[9px] text-muted uppercase tracking-widest mt-0.5">Premium Salon Admin</p>
          </div>
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Cerrar menú" className="text-muted hover:text-white transition-colors p-1">
              <IconClose />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ id, label, Icon }) => {
          const active = seccion === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => { onSeccionChange(id); onClose?.() }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                active
                  ? 'bg-brand/20 text-brand'
                  : 'text-muted-light hover:bg-surface-3 hover:text-white'
              }`}
            >
              <Icon />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5 space-y-2 border-t border-edge pt-4">
        <button type="button" className="w-full flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 text-xs font-bold py-2.5 px-3 rounded-xl transition-colors">
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

// ── Shell ─────────────────────────────────────────────────────────────────────

interface AdminShellProps {
  children: React.ReactNode
  seccion: string
  onSeccionChange: (s: string) => void
}

export default function AdminShell({ children, seccion, onSeccionChange }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const activeLabel = NAV.find(n => n.id === seccion)?.label ?? ''

  return (
    <div className="flex min-h-screen bg-base">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-surface border-r border-edge sticky top-0 h-screen">
        <SidebarContent seccion={seccion} onSeccionChange={onSeccionChange} />
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
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
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 border-b border-edge bg-surface sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="text-muted-light hover:text-white transition-colors"
          >
            <IconMenu />
          </button>
          <p className="font-black text-white text-sm">{activeLabel}</p>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-400 font-semibold">WhatsApp Online</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}