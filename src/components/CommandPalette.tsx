'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, User, Scissors, Users, X } from 'lucide-react'

type Resultado = { tipo: 'cliente' | 'servicio' | 'barbero'; id: string; titulo: string; sub?: string; seccion: string }

export default function CommandPalette({ empresaId, open, onClose, onNavigate }: {
  empresaId: string
  open: boolean
  onClose: () => void
  onNavigate: (seccion: string) => void
}) {
  const [q, setQ] = useState('')
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) { setQ(''); setResultados([]); setTimeout(() => inputRef.current?.focus(), 30) }
  }, [open])

  const buscar = useCallback(async (texto: string) => {
    const t = texto.trim()
    if (!t) { setResultados([]); return }
    setLoading(true)
    const like = `%${t}%`
    const [{ data: cl }, { data: sv }, { data: bb }] = await Promise.all([
      supabase.from('clientes').select('id, nombre, telefono').eq('empresa_id', empresaId).or(`nombre.ilike.${like},telefono.ilike.${like}`).limit(6),
      supabase.from('servicios').select('id, nombre, precio').eq('empresa_id', empresaId).ilike('nombre', like).limit(6),
      supabase.from('barberos').select('id, nombre').eq('empresa_id', empresaId).ilike('nombre', like).limit(6),
    ])
    const res: Resultado[] = [
      ...(cl || []).map((c: any) => ({ tipo: 'cliente' as const, id: String(c.id), titulo: c.nombre || 'Sin nombre', sub: c.telefono || undefined, seccion: 'citas' })),
      ...(sv || []).map((s: any) => ({ tipo: 'servicio' as const, id: String(s.id), titulo: s.nombre, sub: s.precio != null ? `${s.precio} €` : undefined, seccion: 'servicios' })),
      ...(bb || []).map((b: any) => ({ tipo: 'barbero' as const, id: String(b.id), titulo: b.nombre, seccion: 'equipo' })),
    ]
    setResultados(res)
    setLoading(false)
  }, [empresaId])

  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => buscar(q), 220)
    return () => clearTimeout(id)
  }, [q, open, buscar])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const iconFor = { cliente: User, servicio: Scissors, barbero: Users }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] bg-overlay/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg mx-4 bg-surface border border-line rounded-2xl shadow-[var(--shadow-2)] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 px-4 border-b border-line">
          <Search size={16} className="text-fg4 flex-shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar clientes, servicios, profesionales…"
            className="flex-1 py-3.5 bg-transparent text-[14px] text-fg placeholder:text-fg4 focus:outline-none"
          />
          <button type="button" onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-md text-fg4 hover:text-fg hover:bg-hover transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-2">
          {!q.trim() ? (
            <p className="px-4 py-6 text-center text-[12.5px] text-fg4">Escribe para buscar en tu negocio.</p>
          ) : loading ? (
            <p className="px-4 py-6 text-center text-[12.5px] text-fg4">Buscando…</p>
          ) : resultados.length === 0 ? (
            <p className="px-4 py-6 text-center text-[12.5px] text-fg4">Sin resultados para «{q}».</p>
          ) : (
            resultados.map(r => {
              const Icon = iconFor[r.tipo]
              return (
                <button
                  key={`${r.tipo}-${r.id}`}
                  type="button"
                  onClick={() => { onNavigate(r.seccion); onClose() }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-hover transition-colors"
                >
                  <span className="w-7 h-7 rounded-lg bg-hover flex items-center justify-center flex-shrink-0 text-fg3">
                    <Icon size={14} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-medium text-fg truncate">{r.titulo}</span>
                    {r.sub && <span className="block text-[11.5px] text-fg4 truncate">{r.sub}</span>}
                  </span>
                  <span className="text-[10.5px] uppercase tracking-wide text-fg4 font-semibold">{r.tipo}</span>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
