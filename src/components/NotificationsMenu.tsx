'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Clock, CheckCircle2, XCircle } from 'lucide-react'

type Noti = { id: string; icon: 'pending' | 'upcoming' | 'cancel'; texto: string; hora: string }

export default function NotificationsMenu({ empresaId, onClose }: { empresaId: string; onClose: () => void }) {
  const [notis, setNotis] = useState<Noti[]>([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    const hoy = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('citas')
      .select('id, hora, estado, clientes(nombre), servicios(nombre)')
      .eq('empresa_id', empresaId)
      .eq('fecha', hoy)
      .order('hora', { ascending: true })

    const ahora = new Date().getHours() * 60 + new Date().getMinutes()
    const toMin = (h: string) => { const [hh, mm] = (h || '').split(':').map(Number); return (hh || 0) * 60 + (mm || 0) }
    const list: Noti[] = []
    ;(data as any[] || []).forEach(c => {
      const quien = c.clientes?.nombre || 'Cliente'
      const serv = c.servicios?.nombre || 'cita'
      const hora = (c.hora || '').substring(0, 5)
      if (c.estado === 'pendiente') list.push({ id: c.id, icon: 'pending', texto: `${quien} · ${serv} pendiente de confirmar`, hora })
      else if (c.estado === 'cancelada') list.push({ id: c.id, icon: 'cancel', texto: `${quien} canceló ${serv}`, hora })
      else if (c.estado === 'confirmada' && toMin(c.hora) >= ahora) list.push({ id: c.id, icon: 'upcoming', texto: `Próxima: ${quien} · ${serv}`, hora })
    })
    // pendientes primero, luego próximas, luego canceladas
    const orden = { pending: 0, upcoming: 1, cancel: 2 }
    list.sort((a, b) => orden[a.icon] - orden[b.icon] || a.hora.localeCompare(b.hora))
    setNotis(list)
    setLoading(false)
  }, [empresaId])

  useEffect(() => { cargar() }, [cargar])

  const Icono = { pending: Clock, upcoming: CheckCircle2, cancel: XCircle }
  const colorIcono = { pending: 'text-warning', upcoming: 'text-success', cancel: 'text-danger' }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] z-50 bg-surface border border-line rounded-xl shadow-[var(--shadow-2)] overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex items-center justify-between">
          <p className="text-[13px] font-semibold text-fg">Notificaciones</p>
          <span className="text-[11px] text-fg4">Hoy</span>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <p className="px-4 py-6 text-center text-[12.5px] text-fg4">Cargando…</p>
          ) : notis.length === 0 ? (
            <p className="px-4 py-8 text-center text-[12.5px] text-fg4">Sin novedades por hoy 🎉</p>
          ) : (
            notis.map(n => {
              const Icon = Icono[n.icon]
              return (
                <div key={n.id} className="flex items-start gap-3 px-4 py-3 border-b border-line2 last:border-b-0">
                  <Icon size={16} className={`mt-0.5 flex-shrink-0 ${colorIcono[n.icon]}`} />
                  <p className="flex-1 text-[12.5px] text-fg2 leading-snug">{n.texto}</p>
                  <span className="text-[11px] font-mono text-fg4 tabular flex-shrink-0">{n.hora}</span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
