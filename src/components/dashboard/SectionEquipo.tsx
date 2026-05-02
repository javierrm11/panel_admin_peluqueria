'use client'
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Filter, Plus, Pencil } from "lucide-react";
import { fechaHoy, formatEUR } from "./utils";
import { Spinner, Empty, KpiStrip, Avatar, Badge, Sparkline, Modal, FormInput } from "./ui";

export default function SectionEquipo({ toast, empresaId }: { toast: (m: string, t?: string) => void; empresaId: string }) {
  const [barberos, setBarberos]         = useState<any[]>([]);
  const [servicios, setServicios]       = useState<any[]>([]);
  const [modal, setModal]               = useState(false);
  const [editando, setEditando]         = useState<any>(null);
  const [nombre, setNombre]             = useState("");
  const [selServicios, setSelServicios] = useState<number[]>([]);
  const [loading, setLoading]           = useState(false);
  const [citasPorBarbero, setCitasPorBarbero]       = useState<Record<string, number>>({});
  const [ingresosPorBarbero, setIngresosPorBarbero] = useState<Record<string, number>>({});
  const [sparkPorBarbero, setSparkPorBarbero]       = useState<Record<string, number[]>>({});
  const [tabFiltro, setTabFiltro]       = useState<"todos" | "activos" | "ausentes">("todos");

  const cargar = useCallback(async () => {
    setLoading(true);
    const [{ data: b }, { data: s }] = await Promise.all([
      supabase.from("barberos").select("id, nombre, activo, telefono").eq("empresa_id", empresaId).order("id"),
      supabase.from("servicios").select("id, nombre").eq("empresa_id", empresaId),
    ]);
    setBarberos(b || []);
    setServicios(s || []);

    const hoy = new Date();
    const inicioMes = fechaHoy().substring(0, 7) + "-01";
    const inicio12sem = new Date(hoy); inicio12sem.setDate(hoy.getDate() - 83);
    const inicio12semStr = inicio12sem.toISOString().split('T')[0];

    const { data: citas12sem } = await supabase
      .from("citas")
      .select("barberos(nombre), servicios(precio), fecha")
      .eq("empresa_id", empresaId)
      .eq("estado", "confirmada")
      .gte("fecha", inicio12semStr);

    if (citas12sem?.length) {
      const count: Record<string, number> = {};
      const ingresos: Record<string, number> = {};
      const spark: Record<string, number[]> = {};

      (citas12sem as any[]).forEach(c => {
        const n = c.barberos?.nombre;
        if (!n) return;

        // Monthly stats (current month only)
        if (c.fecha >= inicioMes) {
          count[n] = (count[n] || 0) + 1;
          ingresos[n] = (ingresos[n] || 0) + parseFloat(c.servicios?.precio || 0);
        }

        // Weekly sparkline (12 weeks)
        if (!spark[n]) spark[n] = Array(12).fill(0);
        const daysDiff = Math.floor((new Date(c.fecha).getTime() - inicio12sem.getTime()) / 86400000);
        const weekIdx = Math.min(Math.max(Math.floor(daysDiff / 7), 0), 11);
        spark[n][weekIdx]++;
      });

      setCitasPorBarbero(count);
      setIngresosPorBarbero(ingresos);
      setSparkPorBarbero(spark);
    }
    setLoading(false);
  }, [empresaId]);

  useEffect(() => { cargar(); }, [cargar]);

  async function abrirModal(barbero: any = null) {
    setEditando(barbero);
    setNombre(barbero?.nombre || "");
    if (barbero) {
      const { data } = await supabase.from("barbero_servicios").select("servicio_id").eq("barbero_id", barbero.id);
      setSelServicios((data || []).map((r: any) => r.servicio_id));
    } else {
      setSelServicios([]);
    }
    setModal(true);
  }

  async function guardar() {
    if (!nombre.trim()) return;
    let barberoId = editando?.id;
    if (editando) {
      await supabase.from("barberos").update({ nombre }).eq("id", barberoId);
    } else {
      const { data } = await supabase.from("barberos").insert({ nombre, empresa_id: empresaId }).select().single();
      barberoId = data.id;
    }
    await supabase.from("barbero_servicios").delete().eq("barbero_id", barberoId);
    if (selServicios.length > 0) {
      await supabase.from("barbero_servicios").insert(selServicios.map(sid => ({ barbero_id: barberoId, servicio_id: sid })));
    }
    toast(editando ? "Miembro actualizado" : "Miembro añadido", "success");
    setModal(false);
    cargar();
  }

  const activos = barberos.filter(b => b.activo).length;
  const maxCitas = Math.max(...Object.values(citasPorBarbero), 1);

  const filtrados = barberos.filter(b => {
    if (tabFiltro === "activos") return b.activo;
    if (tabFiltro === "ausentes") return !b.activo;
    return true;
  });


  return (
    <div className="px-4 sm:px-6 py-5 sm:py-7 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-semibold text-fg font-display leading-tight">Equipo</h1>
          <p className="text-[12.5px] sm:text-[13px] text-fg3 mt-0.5">{barberos.length} miembros · {activos} disponibles esta semana</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button type="button" className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg border border-line bg-surface text-fg2 text-[12.5px] sm:text-[13px] font-medium hover:bg-hover transition-colors">
            <Filter size={13} /> <span className="hidden sm:inline">Filtros</span>
          </button>
          <button type="button" onClick={() => abrirModal()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accentfg text-[12.5px] sm:text-[13px] font-semibold hover:bg-accent/90 transition-colors whitespace-nowrap">
            <Plus size={13} /> Añadir miembro
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <KpiStrip items={[
        { label: "Citas del equipo · mes", value: Object.values(citasPorBarbero).reduce((a, b) => a + b, 0), sub: "vs. mes anterior" },
        { label: "Ingresos generados", value: <span className="font-mono">{formatEUR(Object.values(ingresosPorBarbero).reduce((a, b) => a + b, 0))} €</span>, sub: "acumulado mes" },
        { label: "Ocupación media", value: `${activos > 0 ? Math.round((activos / barberos.length) * 100) : 0}%`, sub: "objetivo del trimestre: 70%" },
      ]} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
        <div>
          <h2 className="text-[15px] font-semibold text-fg">Miembros</h2>
          <p className="text-[12px] text-fg4 mt-0.5">Listado y rendimiento de las últimas 4 semanas</p>
        </div>
        <div className="grid grid-cols-3 sm:flex w-full sm:w-auto rounded-lg border border-line overflow-hidden bg-surface shadow-[var(--shadow-1)]">
          {(["todos","activos","ausentes"] as const).map((t, i) => (
            <button key={t} type="button" onClick={() => setTabFiltro(t)}
              className={`py-2 sm:py-1.5 sm:px-3.5 text-[12px] sm:text-[12.5px] font-medium text-center transition-colors ${
                tabFiltro === t ? "bg-selected text-fg" : "text-fg3 hover:text-fg hover:bg-hover"
              } ${i > 0 ? "border-l border-line" : ""}`}>
              {t === "todos" ? "Todos" : t === "activos" ? "Activos" : "En ausencia"}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      {loading ? <Spinner /> : filtrados.length === 0 ? (
        <Empty msg="No hay miembros en este filtro" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtrados.map(b => {
            const citas = citasPorBarbero[b.nombre] ?? 0;
            const ingresos = ingresosPorBarbero[b.nombre] ?? 0;
            const ocupPct = maxCitas > 0 ? Math.round((citas / maxCitas) * 100) : 0;
            return (
              <div key={b.id} className="bg-surface border border-line rounded-xl p-5 shadow-[var(--shadow-1)] group hover:shadow-[var(--shadow-2)] transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-4 min-h-[3.5rem]">
                  <div className="flex items-center gap-3">
                    <Avatar name={b.nombre} size="lg" />
                    <div>
                      <p className="text-[14px] font-semibold text-fg leading-tight">{b.nombre}</p>
                      <p className="text-[12px] text-accent mt-0.5">{b.especialidad || "Barbero"}</p>
                      {b.telefono && <p className="text-[11.5px] text-fg4 mt-0.5 font-mono">{b.telefono}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={b.activo ? "success" : "neutral"}>{b.activo ? "Activo" : "Ausente"}</Badge>
                    <button type="button" onClick={() => abrirModal(b)} aria-label="Editar miembro"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-fg4 hover:text-fg hover:bg-hover transition-colors">
                      <Pencil size={12} />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 border-t border-line pt-3.5 mb-3.5">
                  {[
                    { label: "Citas · Mes", val: citas },
                    { label: "Ingresos", val: ingresos > 0 ? `${formatEUR(ingresos)} €` : "—" },
                    { label: "Ocupación", val: `${ocupPct}%` },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <p className="text-[9.5px] font-semibold uppercase tracking-wider text-fg4 leading-tight">{label}</p>
                      <p className="text-[14px] font-semibold text-fg tabular mt-0.5 leading-none">{val}</p>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-line pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-fg4">Tendencia 12 sem.</span>
                    <Sparkline values={sparkPorBarbero[b.nombre] ?? []} />
                  </div>
                  <span className="text-[12px] text-accent font-medium">Ver perfil →</span>
                </div>
              </div>
            );
          })}

          {/* Ghost add card */}
          <button type="button" aria-label="Añadir nuevo miembro" onClick={() => abrirModal()}
            className="bg-bg border border-dashed border-line rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-fg4 hover:text-fg3 hover:border-line hover:bg-hover transition-all min-h-[180px]">
            <Plus size={20} />
            <span className="text-[13px] font-medium">Añadir nuevo miembro</span>
          </button>
        </div>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar miembro" : "Añadir miembro"}>
        <div className="space-y-4">
          <FormInput
            label="Nombre"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Nombre completo"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-fg3">Servicios que realiza</label>
            <div className="flex flex-wrap gap-2">
              {servicios.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelServicios(prev =>
                    prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                  )}
                  className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium border transition-colors ${
                    selServicios.includes(s.id)
                      ? "bg-accent2 text-accent border-accent/30"
                      : "bg-bg border-line text-fg3 hover:bg-hover"
                  }`}
                >
                  {s.nombre}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModal(false)}
              className="flex-1 py-2.5 rounded-lg border border-line text-fg3 text-[13px] font-medium hover:bg-hover transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              className="flex-1 py-2.5 rounded-lg bg-accent text-accentfg text-[13px] font-semibold hover:bg-accent/90 transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
