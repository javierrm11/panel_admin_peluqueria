'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Calendar, Users, Scissors, Clock, Umbrella, BarChart2,
  Bell, Settings, HelpCircle, ChevronDown, LogOut,
  MessageCircle, Search, MoreHorizontal, X,
} from 'lucide-react'

// ── Nav structure ──────────────────────────────────────────────────────────────

const NAV_OPERACION = [
  { id: 'citas',     label: 'Citas',     Icon: Calendar  },
  { id: 'equipo',    label: 'Equipo',    Icon: Users     },
  { id: 'servicios', label: 'Servicios', Icon: Scissors  },
  { id: 'horarios',  label: 'Horarios',  Icon: Clock     },
  { id: 'ausencias', label: 'Ausencias', Icon: Umbrella  },
  { id: 'analitica', label: 'Analítica', Icon: BarChart2 },
]

const NAV_HERRAMIENTAS = [
  { id: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle },
  { id: 'ajustes',  label: 'Ajustes',  Icon: Settings      },
]

const MOBILE_NAV = [
  { id: 'citas',     label: 'Citas',     Icon: Calendar  },
  { id: 'equipo',    label: 'Equipo',    Icon: Users     },
  { id: 'servicios', label: 'Servicios', Icon: Scissors  },
  { id: 'analitica', label: 'Analítica', Icon: BarChart2 },
]

const SECTION_LABEL: Record<string, string> = {
  citas: 'Citas', equipo: 'Equipo', servicios: 'Servicios',
  horarios: 'Horarios', ausencias: 'Ausencias', analitica: 'Analítica',
  whatsapp: 'WhatsApp', ajustes: 'Ajustes',
}

// ── Nav item ──────────────────────────────────────────────────────────────────

function NavItem({ id, label, Icon, active, badge, onClick }: {
  id: string; label: string; Icon: React.ElementType; active: boolean;
  badge?: number; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-all text-left group focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 ${
        active
          ? 'bg-selected text-fg'
          : 'text-fg3 hover:bg-hover hover:text-fg'
      }`}
    >
      <span className={`w-[17px] h-[17px] flex items-center justify-center flex-shrink-0 ${
        active ? 'text-accent' : 'text-fg4 group-hover:text-fg3'
      }`}>
        <Icon size={15} strokeWidth={1.75} />
      </span>
      <span className="flex-1 truncate">{label}</span>
      {badge != null && badge > 0 && (
        <span className="text-[11px] font-semibold tabular text-fg3 bg-hover px-1.5 py-0.5 rounded-md leading-none">
          {badge}
        </span>
      )}
    </button>
  )
}

// ── Sidebar content ───────────────────────────────────────────────────────────

interface SidebarProps {
  seccion: string
  onSeccionChange: (s: string) => void
  orgName: string
  user: { name: string } | null
  onClose?: () => void
}

function SidebarContent({ seccion, onSeccionChange, orgName, user, onClose }: SidebarProps) {
  function initials(name: string) {
    return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="flex flex-col h-full bg-bg">

      {/* Logo + close */}
      <div className="px-3 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-accent text-accentfg">
            <Scissors size={14} strokeWidth={2} />
          </div>
          <span className="font-bold text-[13.5px] tracking-tight text-fg font-display">
            CitasWassap
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors text-fg3 hover:text-fg hover:bg-hover"
            aria-label="Cerrar menú"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Org switcher */}
      <div className="px-3 pb-3">
        <button
          type="button"
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border border-line bg-surface text-left hover:bg-hover transition-colors"
        >
          <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-black bg-accent2 text-accent">
            {orgName[0]?.toUpperCase() ?? 'N'}
          </div>
          <span className="flex-1 text-[12.5px] font-medium truncate text-fg">
            {orgName}
          </span>
          <ChevronDown size={13} className="text-fg4 flex-shrink-0" />
        </button>
      </div>

      {/* Divisor */}
      <div className="mx-3 mb-3 h-px bg-line2" />

      {/* Nav */}
      <nav className="flex-1 px-2 overflow-y-auto">
        <p className="px-2.5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-fg4">
          Operación
        </p>
        <div className="space-y-0.5">
          {NAV_OPERACION.map(({ id, label, Icon }) => (
            <NavItem
              key={id} id={id} label={label} Icon={Icon}
              active={seccion === id}
              onClick={() => { onSeccionChange(id); onClose?.() }}
            />
          ))}
        </div>

        <div className="my-3 mx-0.5 h-px bg-line2" />

        <p className="px-2.5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-fg4">
          Herramientas
        </p>
        <div className="space-y-0.5">
          {NAV_HERRAMIENTAS.map(({ id, label, Icon }) => (
            <NavItem
              key={id} id={id} label={label} Icon={Icon}
              active={seccion === id}
              onClick={() => { onSeccionChange(id); onClose?.() }}
            />
          ))}
        </div>
      </nav>

      {/* User footer */}
      <div className="mx-2 mb-2 px-2.5 py-2.5 rounded-xl border border-line2 bg-surface">
        {user ? (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 bg-accent2 text-accent">
              {initials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold leading-tight truncate text-fg">
                {user.name.replace(/\b\w/g, c => c.toUpperCase())}
              </p>
              <p className="text-[11px] leading-tight truncate text-fg4">
                Encargada · Centro
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-6 h-6 flex items-center justify-center rounded-md transition-colors text-fg4 hover:text-fg hover:bg-hover flex-shrink-0"
              title="Cerrar sesión"
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <div className="h-8 rounded-md animate-pulse bg-hover" />
        )}
      </div>
    </div>
  )
}

// ── Bottom nav (mobile) ───────────────────────────────────────────────────────

function BottomNav({ seccion, onSeccionChange, onMoreClick }: {
  seccion: string
  onSeccionChange: (s: string) => void
  onMoreClick: () => void
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-surface border-t border-line">
      <div className="flex items-center h-14 px-2">
        {MOBILE_NAV.map(({ id, label, Icon }) => {
          const active = seccion === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSeccionChange(id)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors ${
                active ? 'text-accent' : 'text-fg3'
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2 : 1.75} />
              <span className="text-[9.5px] font-semibold">{label}</span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={onMoreClick}
          className="flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors text-fg3"
        >
          <MoreHorizontal size={18} strokeWidth={1.75} />
          <span className="text-[9.5px] font-semibold">Más</span>
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
  empresaId: string
}

export default function AdminShell({ children, seccion, onSeccionChange, empresaId }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<{ name: string } | null>(null)
  const [orgName, setOrgName] = useState('Mi Negocio')

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

  useEffect(() => {
    if (!empresaId) return
    supabase
      .from('empresas')
      .select('nombre')
      .eq('id', empresaId)
      .single()
      .then(({ data }) => {
        if (data?.nombre) setOrgName(data.nombre)
      })
  }, [empresaId])

  const sectionLabel = SECTION_LABEL[seccion] ?? seccion

  return (
    <div className="flex min-h-screen bg-bg">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-52 shrink-0 sticky top-0 h-screen border-r border-line2">
        <SidebarContent seccion={seccion} onSeccionChange={onSeccionChange} orgName={orgName} user={user} />
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-overlay/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 lg:hidden border-r border-line transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent
          seccion={seccion} onSeccionChange={onSeccionChange}
          orgName={orgName} user={user}
          onClose={() => setMobileOpen(false)}
        />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 lg:px-6 h-[52px] bg-bg border-b border-line2">

          {/* Mobile: menu trigger */}
          <button
            type="button"
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-fg3 hover:text-fg hover:bg-hover"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <MoreHorizontal size={18} />
          </button>

          {/* Breadcrumb — desktop */}
          <div className="hidden lg:flex items-center gap-1.5 text-[13px] text-fg3">
            <span>Centro</span>
            <span className="text-fg4">/</span>
            <span className="font-medium text-fg">{sectionLabel}</span>
          </div>

          {/* Section title — mobile */}
          <span className="lg:hidden font-semibold text-[14px] text-fg">{sectionLabel}</span>

          {/* Search — desktop */}
          <div className="hidden lg:flex items-center gap-2 ml-auto flex-shrink-0 cursor-text rounded-lg px-3 py-1.5 bg-surface border border-line hover:border-line min-w-[220px]">
            <Search size={13} className="text-fg4 flex-shrink-0" />
            <span className="text-[12.5px] flex-1 text-fg4">
              Buscar citas, clientes, servicios...
            </span>
            <kbd className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-hover text-fg4 border border-line font-mono">
              ⌘K
            </kbd>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-auto lg:ml-3">
            <button
              type="button"
              className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-fg3 hover:text-fg hover:bg-hover"
              aria-label="Notificaciones"
            >
              <Bell size={16} strokeWidth={1.75} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-danger" />
            </button>

            <button
              type="button"
              className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg transition-colors text-fg3 hover:text-fg hover:bg-hover"
              aria-label="Ayuda"
            >
              <HelpCircle size={16} strokeWidth={1.75} />
            </button>

            <div className="hidden lg:block w-px h-5 mx-1 bg-line" />

            {user && (
              <div className="hidden lg:flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 bg-accent2 text-accent">
                  {user.name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-16 lg:pb-0">
          {children}
        </main>
      </div>

      <BottomNav
        seccion={seccion}
        onSeccionChange={onSeccionChange}
        onMoreClick={() => setMobileOpen(true)}
      />
    </div>
  )
}
