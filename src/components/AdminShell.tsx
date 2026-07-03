'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Calendar, Users, Scissors, Clock, Umbrella, BarChart2,
  Bell, HelpCircle, ChevronDown, LogOut,
  Search, MoreHorizontal, X, Check, MessageCircle, Mail,
} from 'lucide-react'
import CommandPalette from './CommandPalette'
import NotificationsMenu from './NotificationsMenu'
import { Modal } from './dashboard/ui'

// ── Nav structure ──────────────────────────────────────────────────────────────

const NAV_OPERACION = [
  { id: 'citas',     label: 'Citas',     Icon: Calendar  },
  { id: 'equipo',    label: 'Equipo',    Icon: Users     },
  { id: 'servicios', label: 'Servicios', Icon: Scissors  },
  { id: 'horarios',  label: 'Horarios',  Icon: Clock     },
  { id: 'ausencias', label: 'Ausencias', Icon: Umbrella  },
  { id: 'analitica', label: 'Analítica', Icon: BarChart2 },
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
  empresas: { id: string; nombre: string }[]
  currentEmpresaId: string
  onSwitchEmpresa: (id: string) => void
}

function SidebarContent({ seccion, onSeccionChange, orgName, user, onClose, empresas, currentEmpresaId, onSwitchEmpresa }: SidebarProps) {
  const [orgOpen, setOrgOpen] = useState(false)

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
      <div className="px-3 pb-3 relative">
        <button
          type="button"
          onClick={() => setOrgOpen(o => !o)}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border border-line bg-surface text-left hover:bg-hover transition-colors"
        >
          <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-black bg-accent2 text-accent">
            {orgName[0]?.toUpperCase() ?? 'N'}
          </div>
          <span className="flex-1 text-[12.5px] font-medium truncate text-fg">
            {orgName}
          </span>
          <ChevronDown size={13} className={`text-fg4 flex-shrink-0 transition-transform ${orgOpen ? 'rotate-180' : ''}`} />
        </button>
        {orgOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOrgOpen(false)} />
            <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-surface border border-line rounded-lg shadow-[var(--shadow-2)] overflow-hidden py-1">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-fg4">Tus negocios</p>
              {(empresas.length ? empresas : [{ id: currentEmpresaId, nombre: orgName }]).map(e => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => { onSwitchEmpresa(e.id); setOrgOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-hover transition-colors"
                >
                  <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-black bg-accent2 text-accent">
                    {e.nombre[0]?.toUpperCase() ?? 'N'}
                  </div>
                  <span className="flex-1 text-[12.5px] font-medium truncate text-fg">{e.nombre}</span>
                  {e.id === currentEmpresaId && <Check size={13} className="text-accent flex-shrink-0" />}
                </button>
              ))}
            </div>
          </>
        )}
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
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [orgName, setOrgName] = useState('Mi Negocio')
  const [empresas, setEmpresas] = useState<{ id: string; nombre: string }[]>([])

  // Overlays de la topbar
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [orgOpen, setOrgOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const email = data.user.email ?? ''
        const name =
          data.user.user_metadata?.full_name ||
          email.split('@')[0].replace(/[._-]/g, ' ')
        setUser({ name, email })
        setUserId(data.user.id)
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

  // Empresas del usuario (para el conmutador de organización)
  useEffect(() => {
    if (!userId) return
    supabase
      .from('perfiles')
      .select('empresa_id, empresas(nombre)')
      .eq('user_id', userId)
      .then(({ data }) => {
        const list = (data as any[] || [])
          .map(r => ({ id: r.empresa_id as string, nombre: (r.empresas?.nombre as string) || 'Negocio' }))
          .filter(e => e.id)
        if (list.length) setEmpresas(list)
      })
  }, [userId])

  // Contador de notificaciones (pendientes/próximas de hoy) para el punto rojo
  useEffect(() => {
    if (!empresaId) return
    const hoy = new Date().toISOString().split('T')[0]
    supabase
      .from('citas')
      .select('estado', { count: 'exact', head: false })
      .eq('empresa_id', empresaId)
      .eq('fecha', hoy)
      .neq('estado', 'cancelada')
      .then(({ data }) => setNotifCount((data as any[] || []).length))
  }, [empresaId, seccion])

  // Atajo de teclado ⌘K / Ctrl+K para el buscador
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function cambiarEmpresa(id: string) {
    if (id === empresaId) { setOrgOpen(false); return }
    localStorage.setItem('cw_empresa_id', id)
    window.location.reload()
  }

  const sectionLabel = SECTION_LABEL[seccion] ?? seccion

  return (
    <div className="flex min-h-screen bg-bg">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-52 shrink-0 sticky top-0 h-screen border-r border-line2">
        <SidebarContent seccion={seccion} onSeccionChange={onSeccionChange} orgName={orgName} user={user}
          empresas={empresas} currentEmpresaId={empresaId} onSwitchEmpresa={cambiarEmpresa} />
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
          empresas={empresas} currentEmpresaId={empresaId} onSwitchEmpresa={cambiarEmpresa}
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
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden lg:flex items-center gap-2 ml-auto flex-shrink-0 cursor-text rounded-lg px-3 py-1.5 bg-surface border border-line hover:border-line2 transition-colors min-w-[220px] text-left"
          >
            <Search size={13} className="text-fg4 flex-shrink-0" />
            <span className="text-[12.5px] flex-1 text-fg4">
              Buscar citas, clientes, servicios...
            </span>
            <kbd className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-hover text-fg4 border border-line font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-auto lg:ml-3">
            {/* Búsqueda — móvil */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-fg3 hover:text-fg hover:bg-hover"
              aria-label="Buscar"
            >
              <Search size={16} strokeWidth={1.75} />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen(o => !o)}
                className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-fg3 hover:text-fg hover:bg-hover"
                aria-label="Notificaciones"
              >
                <Bell size={16} strokeWidth={1.75} />
                {notifCount > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-danger" />}
              </button>
              {notifOpen && <NotificationsMenu empresaId={empresaId} onClose={() => setNotifOpen(false)} />}
            </div>

            <button
              type="button"
              onClick={() => setHelpOpen(true)}
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

      {/* Buscador ⌘K */}
      <CommandPalette
        empresaId={empresaId}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={onSeccionChange}
      />

      {/* Ayuda */}
      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Ayuda y soporte">
        <div className="space-y-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-fg3 mb-2">Atajos</p>
            <div className="flex items-center justify-between text-[13px] text-fg2 py-1">
              <span>Abrir el buscador</span>
              <kbd className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-hover text-fg3 border border-line font-mono">⌘K / Ctrl K</kbd>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-fg3 mb-2">Primeros pasos</p>
            <ul className="text-[12.5px] text-fg3 space-y-1.5 list-disc pl-4">
              <li>Añade tu equipo y sus horarios en <b>Equipo</b> y <b>Horarios</b>.</li>
              <li>Crea tus <b>Servicios</b> con precio y duración.</li>
              <li>Gestiona reservas en <b>Citas</b> (crear, cancelar, exportar).</li>
              <li>Descarga el informe mensual en <b>Analítica</b>.</li>
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-fg3 mb-2">Contactar con soporte</p>
            <div className="flex flex-col gap-2">
              <a href="https://wa.me/34600000000" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-line hover:bg-hover transition-colors text-[13px] text-fg2">
                <MessageCircle size={15} className="text-success" /> Escríbenos por WhatsApp
              </a>
              <a href="mailto:soporte@citaswassap.com"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-line hover:bg-hover transition-colors text-[13px] text-fg2">
                <Mail size={15} className="text-accent" /> soporte@citaswassap.com
              </a>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
