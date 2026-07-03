'use client'
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { ChevronLeft, ChevronRight, Plus, Download } from "lucide-react";
import {
  toISO, parseISO, addDays, startOfWeek, startOfMonth, isSameDay,
  horaAMin, minAHora, layoutDia, diaCorto, diaLargo, mesLargo,
  fmtHora12, fmtRango12, fmtGutter,
  formatEUR, avColor,
} from "./utils";
import { Spinner, KpiStrip, Badge, Modal, FormInput, FormSelect } from "./ui";

type Vista = "dia" | "semana" | "mes";
const HOUR_H = 56;            // alto de una hora en px

const VISTAS: { id: Vista; label: string }[] = [
  { id: "dia",    label: "Día"    },
  { id: "semana", label: "Semana" },
  { id: "mes",    label: "Mes"    },
];

const estadoMap: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" }> = {
  confirmada: { label: "Confirmada", variant: "success" },
  pendiente:  { label: "Pendiente",  variant: "warning" },
  cancelada:  { label: "Cancelada",  variant: "neutral" },
  en_curso:   { label: "En curso",   variant: "info"    },
};

type Cita = {
  id: string;
  fecha: string;
  hora: string;
  estado: string;
  clientes?: { nombre?: string; telefono?: string } | null;
  servicios?: { nombre?: string; precio?: number; duracion_minutos?: number } | null;
  barberos?: { nombre?: string } | null;
};

export default function SectionCitas({ toast, empresaId }: { toast: (m: string, t?: string) => void; empresaId: string }) {
  const [vista, setVista] = useState<Vista>("semana");
  const [anchor, setAnchor] = useState<Date>(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(false);
  const [ocultarCanceladas, setOcultarCanceladas] = useState(false);
  const [sel, setSel] = useState<Cita | null>(null);

  // Listas para crear citas + modal "Nueva cita"
  const [listas, setListas] = useState<{ servicios: any[]; barberos: any[]; clientes: any[] }>({ servicios: [], barberos: [], clientes: [] });
  const [modalNueva, setModalNueva] = useState(false);
  const [nuevaForm, setNuevaForm] = useState({ clienteId: "nuevo", nuevoNombre: "", nuevoTel: "", servicioId: "", barberoId: "", fecha: "", hora: "", estado: "confirmada" });

  const cargarListas = useCallback(async () => {
    const [{ data: sv }, { data: bb }, { data: cl }] = await Promise.all([
      supabase.from("servicios").select("id, nombre, precio, duracion_minutos").eq("empresa_id", empresaId).order("nombre"),
      supabase.from("barberos").select("id, nombre, activo").eq("empresa_id", empresaId).order("nombre"),
      supabase.from("clientes").select("id, nombre, telefono").eq("empresa_id", empresaId).order("nombre"),
    ]);
    setListas({ servicios: sv || [], barberos: bb || [], clientes: cl || [] });
  }, [empresaId]);
  useEffect(() => { cargarListas(); }, [cargarListas]);

  // Días visibles según la vista
  const dias = useMemo<Date[]>(() => {
    if (vista === "dia") return [anchor];
    if (vista === "semana") { const ini = startOfWeek(anchor); return Array.from({ length: 7 }, (_, i) => addDays(ini, i)); }
    // mes: rejilla completa de semanas (lunes a domingo)
    const ini = startOfWeek(startOfMonth(anchor));
    const finMes = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    const total = Math.ceil((((finMes.getTime() - ini.getTime()) / 86400000) + 1) / 7) * 7;
    return Array.from({ length: total }, (_, i) => addDays(ini, i));
  }, [vista, anchor]);

  const rango = useMemo(() => ({ inicio: toISO(dias[0]), fin: toISO(dias[dias.length - 1]) }), [dias]);

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("citas")
      .select("id, fecha, hora, estado, clientes(nombre, telefono), servicios(nombre, precio, duracion_minutos), barberos(nombre)")
      .eq("empresa_id", empresaId)
      .gte("fecha", rango.inicio).lte("fecha", rango.fin)
      .order("fecha", { ascending: true }).order("hora", { ascending: true });
    setCitas((data as Cita[]) || []);
    setLoading(false);
  }, [empresaId, rango.inicio, rango.fin]);

  useEffect(() => { cargar(); }, [cargar]);

  async function cancelar(id: string) {
    await supabase.from("citas").update({ estado: "cancelada" }).eq("id", id);
    toast("Cita cancelada", "success");
    setSel(null);
    cargar();
  }

  function abrirNueva(prefill?: { fecha?: string; hora?: string }) {
    const activos = listas.barberos.filter(b => b.activo !== false);
    setNuevaForm({
      clienteId: "nuevo", nuevoNombre: "", nuevoTel: "",
      servicioId: listas.servicios[0]?.id?.toString() ?? "",
      barberoId: (activos[0] ?? listas.barberos[0])?.id?.toString() ?? "",
      fecha: prefill?.fecha ?? toISO(anchor),
      hora: prefill?.hora ?? "10:00",
      estado: "confirmada",
    });
    setModalNueva(true);
  }

  async function guardarCita() {
    const f = nuevaForm;
    if (!f.servicioId || !f.barberoId || !f.fecha || !f.hora) { toast("Completa servicio, profesional, fecha y hora", "error"); return; }
    let clienteId: string | null = f.clienteId === "nuevo" ? null : f.clienteId;
    if (f.clienteId === "nuevo") {
      if (!f.nuevoNombre.trim() && !f.nuevoTel.trim()) { toast("Indica nombre o teléfono del cliente", "error"); return; }
      const { data, error } = await supabase.from("clientes")
        .insert({ nombre: f.nuevoNombre.trim() || null, telefono: f.nuevoTel.trim() || null, empresa_id: empresaId })
        .select("id").single();
      if (error || !data) { toast("No se pudo crear el cliente", "error"); return; }
      clienteId = (data as any).id;
    }
    const { error } = await supabase.from("citas").insert({
      empresa_id: empresaId, cliente_id: clienteId,
      servicio_id: Number(f.servicioId), barbero_id: Number(f.barberoId),
      fecha: f.fecha, hora: f.hora.length === 5 ? `${f.hora}:00` : f.hora, estado: f.estado,
    });
    if (error) { toast("No se pudo crear la cita", "error"); return; }
    toast("Cita creada", "success");
    setModalNueva(false);
    cargar();
    if (f.clienteId === "nuevo") cargarListas();
  }

  function exportarCSV() {
    if (!citas.length) { toast("No hay citas que exportar en este período", "error"); return; }
    const cab = ["Fecha", "Hora", "Cliente", "Teléfono", "Servicio", "Profesional", "Precio (€)", "Estado"];
    const filas = [...citas]
      .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
      .map(c => [
        c.fecha, c.hora?.substring(0, 5) ?? "",
        c.clientes?.nombre ?? "", c.clientes?.telefono ?? "",
        c.servicios?.nombre ?? "", c.barberos?.nombre ?? "",
        c.servicios?.precio != null ? String(c.servicios.precio) : "",
        estadoMap[c.estado]?.label ?? c.estado,
      ]);
    const csv = [cab, ...filas].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `citas-${rango.inicio}_a_${rango.fin}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast("CSV exportado", "success");
  }

  const visibles = ocultarCanceladas ? citas.filter(c => c.estado !== "cancelada") : citas;

  // KPIs sobre el rango visible
  const confirmadas = citas.filter(c => c.estado === "confirmada");
  const pendientes  = citas.filter(c => c.estado === "pendiente");
  const canceladas  = citas.filter(c => c.estado === "cancelada");
  const ingresos    = confirmadas.reduce((a, c) => a + (Number(c.servicios?.precio) || 0), 0);
  const ocupacion   = citas.length > 0 ? Math.round((confirmadas.length / citas.length) * 100) : 0;
  const proxima     = [...confirmadas].sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))[0];

  // Navegación
  const paso = vista === "dia" ? 1 : vista === "semana" ? 7 : 0;
  function navegar(dir: -1 | 1) {
    setAnchor(prev => vista === "mes" ? new Date(prev.getFullYear(), prev.getMonth() + dir, 1) : addDays(prev, dir * paso));
  }
  function hoy() { const d = new Date(); d.setHours(0, 0, 0, 0); setAnchor(d); }
  function irADia(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); setAnchor(x); setVista("dia"); }

  // Etiqueta del período
  const periodo = useMemo(() => {
    if (vista === "dia") return `${diaLargo(anchor)}, ${anchor.getDate()} de ${mesLargo(anchor)} ${anchor.getFullYear()}`;
    if (vista === "mes") return `${mesLargo(anchor).charAt(0).toUpperCase() + mesLargo(anchor).slice(1)} ${anchor.getFullYear()}`;
    const a = dias[0], b = dias[dias.length - 1];
    const mismoMes = a.getMonth() === b.getMonth();
    return mismoMes
      ? `${a.getDate()} – ${b.getDate()} de ${mesLargo(a)} ${a.getFullYear()}`
      : `${a.getDate()} ${mesLargo(a)} – ${b.getDate()} ${mesLargo(b)} ${b.getFullYear()}`;
  }, [vista, anchor, dias]);

  return (
    <div className="px-4 sm:px-6 py-5 sm:py-7 max-w-[1200px] mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-semibold text-fg font-display leading-tight">Citas</h1>
          <p className="text-[12.5px] sm:text-[13px] text-fg3 mt-0.5">
            {citas.length} reservas · {confirmadas.length} confirmadas en el período
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 self-start">
          <button type="button" onClick={exportarCSV}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg border border-line bg-surface text-fg2 text-[12.5px] sm:text-[13px] font-medium hover:bg-hover transition-colors">
            <Download size={13} /> <span className="hidden sm:inline">Exportar</span>
          </button>
          <button type="button" onClick={() => abrirNueva()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accentfg text-[12.5px] sm:text-[13px] font-semibold hover:bg-accent/90 transition-colors whitespace-nowrap">
            <Plus size={13} /> Nueva cita
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <KpiStrip items={[
        {
          label: "Próxima cita",
          value: proxima ? <span className="font-mono font-semibold">{proxima.hora?.substring(0, 5) ?? "—"}</span> : "—",
          sub: proxima ? `${proxima.clientes?.nombre ?? proxima.clientes?.telefono ?? "—"} · ${proxima.servicios?.nombre ?? "—"}` : "Sin citas confirmadas",
          accent: true,
        },
        { label: "Confirmadas", value: confirmadas.length, sub: `de ${citas.length} totales · ${ocupacion}% ocupación` },
        { label: "Pendientes", value: pendientes.length, sub: pendientes.length > 0 ? "esperan confirmación" : "Sin pendientes" },
        { label: "Ingresos previstos", value: <span className="font-mono">{formatEUR(ingresos)} €</span>, sub: canceladas.length > 0 ? `${canceladas.length} cancelada${canceladas.length !== 1 ? "s" : ""}` : "Sin cancelaciones" },
      ]} />

      {/* Calendar toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-line overflow-hidden bg-surface">
            <button type="button" onClick={() => navegar(-1)} aria-label="Anterior" className="px-2 py-1.5 text-fg3 hover:text-fg hover:bg-hover transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button type="button" onClick={hoy} className="px-3 py-1.5 text-[12.5px] font-medium text-fg2 hover:bg-hover transition-colors border-x border-line">Hoy</button>
            <button type="button" onClick={() => navegar(1)} aria-label="Siguiente" className="px-2 py-1.5 text-fg3 hover:text-fg hover:bg-hover transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
          <h2 className="text-[14px] sm:text-[15px] font-semibold text-fg capitalize">{periodo}</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer select-none text-[12px] sm:text-[12.5px] text-fg3">
            <button
              type="button" role="switch" aria-checked={ocultarCanceladas ? "true" : "false"} aria-label="Ocultar citas canceladas"
              onClick={() => setOcultarCanceladas(v => !v)}
              className={`relative w-8 h-[18px] rounded-full transition-colors flex-shrink-0 ${ocultarCanceladas ? "bg-accent" : "bg-line"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${ocultarCanceladas ? "translate-x-3.5" : ""}`} />
            </button>
            Ocultar canceladas
          </label>
          <div className="flex rounded-lg border border-line overflow-hidden bg-surface">
            {VISTAS.map((v, i) => (
              <button
                key={v.id} type="button" onClick={() => setVista(v.id)}
                className={`px-2.5 sm:px-3.5 py-1.5 text-[12px] sm:text-[12.5px] font-medium transition-colors ${
                  vista === v.id ? "bg-selected text-fg" : "text-fg3 hover:text-fg hover:bg-hover"
                } ${i > 0 ? "border-l border-line" : ""}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar body */}
      {loading ? (
        <Spinner />
      ) : vista === "mes" ? (
        <VistaMes dias={dias} mesActual={anchor.getMonth()} citas={visibles} onSelect={setSel} onDay={irADia} />
      ) : (
        <VistaTiempo dias={dias} citas={visibles} onSelect={setSel} onDay={irADia} unicoDia={vista === "dia"} onCreate={(fecha, hora) => abrirNueva({ fecha, hora })} />
      )}

      {/* Detalle de cita */}
      {sel && <DetalleCita cita={sel} onClose={() => setSel(null)} onCancelar={cancelar} />}

      {/* Modal Nueva cita */}
      <Modal open={modalNueva} onClose={() => setModalNueva(false)} title="Nueva cita">
        <div className="space-y-3.5">
          <FormSelect label="Cliente" value={nuevaForm.clienteId} onChange={e => setNuevaForm(f => ({ ...f, clienteId: e.target.value }))}>
            <option value="nuevo">➕ Nuevo cliente…</option>
            {listas.clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre || c.telefono || "Sin nombre"}</option>
            ))}
          </FormSelect>
          {nuevaForm.clienteId === "nuevo" && (
            <div className="grid grid-cols-2 gap-3">
              <FormInput label="Nombre" value={nuevaForm.nuevoNombre} onChange={e => setNuevaForm(f => ({ ...f, nuevoNombre: e.target.value }))} placeholder="Nombre del cliente" />
              <FormInput label="Teléfono" value={nuevaForm.nuevoTel} onChange={e => setNuevaForm(f => ({ ...f, nuevoTel: e.target.value }))} placeholder="600 000 000" />
            </div>
          )}
          <FormSelect label="Servicio" value={nuevaForm.servicioId} onChange={e => setNuevaForm(f => ({ ...f, servicioId: e.target.value }))}>
            {listas.servicios.length === 0 && <option value="">Sin servicios</option>}
            {listas.servicios.map(s => (
              <option key={s.id} value={s.id}>{s.nombre}{s.precio != null ? ` · ${formatEUR(Number(s.precio))} €` : ""}</option>
            ))}
          </FormSelect>
          <FormSelect label="Profesional" value={nuevaForm.barberoId} onChange={e => setNuevaForm(f => ({ ...f, barberoId: e.target.value }))}>
            {listas.barberos.length === 0 && <option value="">Sin profesionales</option>}
            {listas.barberos.map(b => (
              <option key={b.id} value={b.id}>{b.nombre}{b.activo === false ? " (inactivo)" : ""}</option>
            ))}
          </FormSelect>
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Fecha" type="date" value={nuevaForm.fecha} onChange={e => setNuevaForm(f => ({ ...f, fecha: e.target.value }))} />
            <FormInput label="Hora" type="time" value={nuevaForm.hora} onChange={e => setNuevaForm(f => ({ ...f, hora: e.target.value }))} />
          </div>
          <FormSelect label="Estado" value={nuevaForm.estado} onChange={e => setNuevaForm(f => ({ ...f, estado: e.target.value }))}>
            <option value="confirmada">Confirmada</option>
            <option value="pendiente">Pendiente</option>
          </FormSelect>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setModalNueva(false)} className="flex-1 py-2.5 rounded-lg border border-line text-fg3 text-[13px] font-medium hover:bg-hover transition-colors">Cancelar</button>
            <button type="button" onClick={guardarCita} className="flex-1 py-2.5 rounded-lg bg-accent text-accentfg text-[13px] font-semibold hover:bg-accent/90 transition-colors">Crear cita</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ── Vista de tiempo (Día / Días / Semana) ─────────────── */

function VistaTiempo({ dias, citas, onSelect, onDay, unicoDia, onCreate }: {
  dias: Date[]; citas: Cita[]; onSelect: (c: Cita) => void; onDay: (d: Date) => void; unicoDia: boolean;
  onCreate: (fecha: string, hora: string) => void;
}) {
  // Límites horarios: 8–21 por defecto, ampliados si hay citas fuera
  const { startH, endH } = useMemo(() => {
    let min = 8 * 60, max = 21 * 60;
    for (const c of citas) {
      const s = horaAMin(c.hora);
      const e = s + (Number(c.servicios?.duracion_minutos) || 30);
      min = Math.min(min, s); max = Math.max(max, e);
    }
    return { startH: Math.max(0, Math.floor(min / 60)), endH: Math.min(24, Math.ceil(max / 60)) };
  }, [citas]);

  const horas = Array.from({ length: endH - startH }, (_, i) => startH + i);
  const altoTotal = (endH - startH) * HOUR_H;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll a las 8:00 (o al inicio) al montar
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = Math.max(0, (8 - startH)) * HOUR_H - 8; }, [startH]);

  const ahora = new Date();
  const minAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const gutterW = "w-14 sm:w-16";

  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden shadow-[var(--shadow-1)]">
      {/* Cabecera de días */}
      <div className="flex border-b border-line sticky top-0 z-10 bg-surface">
        <div className={`${gutterW} flex-shrink-0 border-r border-line flex items-end justify-end pr-1.5 pb-1`}>
          <span className="text-[9px] text-fg4 tabular">GMT{fmtGMT()}</span>
        </div>
        {dias.map((d) => {
          const hoy = isSameDay(d, ahora);
          return (
            <button
              key={toISO(d)} type="button" onClick={() => onDay(d)}
              className={`flex-1 min-w-0 text-center py-2 hover:bg-hover transition-colors ${!unicoDia ? "border-l border-line first:border-l-0" : ""}`}
            >
              <p className={`text-[10.5px] uppercase tracking-wide font-semibold ${hoy ? "text-accent" : "text-fg4"}`}>{diaCorto(d)}</p>
              <p className={`text-[18px] font-normal mt-1 leading-none inline-flex items-center justify-center w-9 h-9 rounded-full ${hoy ? "bg-accent text-accentfg" : "text-fg2"}`}>
                {d.getDate()}
              </p>
            </button>
          );
        })}
      </div>

      {/* Rejilla con scroll */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: "min(640px, calc(100vh - 300px))" }}>
        <div className="flex" style={{ height: altoTotal }}>
          {/* Columna de horas */}
          <div className={`${gutterW} flex-shrink-0 border-r border-line relative`}>
            {horas.map((h, i) => (
              <div key={h} className="absolute right-2 text-[10px] text-fg4 -translate-y-1/2" style={{ top: i * HOUR_H }}>
                {i === 0 ? "" : fmtGutter(h)}
              </div>
            ))}
          </div>

          {/* Columnas de días */}
          {dias.map((d) => {
            const delDia = citas.filter(c => c.fecha === toISO(d));
            const eventos = layoutDia(delDia.map(c => {
              const start = horaAMin(c.hora);
              return { ...c, start, end: start + (Number(c.servicios?.duracion_minutos) || 30) };
            }));
            const hoy = isSameDay(d, ahora);
            const crearEnClic = (e: React.MouseEvent<HTMLDivElement>) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const yPix = e.clientY - rect.top;
              const min = startH * 60 + (yPix / HOUR_H) * 60;
              const redondeada = Math.max(startH * 60, Math.round(min / 30) * 30);
              onCreate(toISO(d), minAHora(redondeada));
            };
            return (
              <div key={toISO(d)} onClick={crearEnClic} title="Clic para crear una cita"
                className={`flex-1 min-w-0 relative cursor-pointer ${!unicoDia ? "border-l border-line first:border-l-0" : ""}`}>
                {/* Líneas de hora */}
                {horas.map((h, i) => (
                  <div key={h} className="absolute left-0 right-0 border-t border-line/70" style={{ top: i * HOUR_H }} />
                ))}
                {/* Línea de "ahora" */}
                {hoy && minAhora >= startH * 60 && minAhora <= endH * 60 && (
                  <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: ((minAhora - startH * 60) / 60) * HOUR_H }}>
                    <div className="h-[2px] bg-danger" />
                    <div className="w-3 h-3 rounded-full bg-danger -mt-[7px] -ml-1.5" />
                  </div>
                )}
                {/* Eventos */}
                {eventos.map((ev) => {
                  const top = ((ev.start - startH * 60) / 60) * HOUR_H;
                  const height = Math.max(22, ((ev.end - ev.start) / 60) * HOUR_H - 2);
                  const left = (ev.lane / ev.lanes) * 100;
                  const width = 100 / ev.lanes;
                  const cancelada = ev.estado === "cancelada";
                  const { bg, text } = avColor(ev.barberos?.nombre ?? "?");
                  return (
                    <button
                      key={ev.id} type="button" onClick={(e) => { e.stopPropagation(); onSelect(ev); }}
                      className={`absolute rounded-lg px-2 py-1 overflow-hidden text-left ring-1 ring-black/5 transition-shadow hover:z-30 hover:shadow-[var(--shadow-2)] ${bg} ${text} ${cancelada ? "opacity-50 line-through" : ""}`}
                      style={{ top, height, left: `calc(${left}% + 1px)`, width: `calc(${width}% - 2px)` }}
                      title={`${fmtRango12(ev.start, ev.end)} · ${ev.servicios?.nombre ?? ""} · ${ev.clientes?.nombre ?? ""}`}
                    >
                      <p className="text-[11px] font-semibold leading-tight truncate">{ev.servicios?.nombre ?? "Cita"}{ev.clientes?.nombre ? `: ${ev.clientes.nombre}` : ""}</p>
                      {height > 28 && <p className="text-[10.5px] leading-tight truncate opacity-90">{fmtRango12(ev.start, ev.end)}</p>}
                      {height > 50 && ev.barberos?.nombre && <p className="text-[10px] leading-tight truncate opacity-80 mt-0.5">{ev.barberos.nombre}</p>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function fmtGMT() {
  const off = -new Date().getTimezoneOffset() / 60;
  const sign = off >= 0 ? "+" : "-";
  return `${sign}${String(Math.abs(off)).padStart(2, "0")}`;
}

/* ── Vista de mes ──────────────────────────────────────── */

function VistaMes({ dias, mesActual, citas, onSelect, onDay }: {
  dias: Date[]; mesActual: number; citas: Cita[]; onSelect: (c: Cita) => void; onDay: (d: Date) => void;
}) {
  const ahora = new Date();
  const porDia = useMemo(() => {
    const m = new Map<string, Cita[]>();
    for (const c of citas) { const k = c.fecha; if (!m.has(k)) m.set(k, []); m.get(k)!.push(c); }
    return m;
  }, [citas]);
  const MAX = 3;

  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden shadow-[var(--shadow-1)]">
      {/* Cabecera días de la semana */}
      <div className="grid grid-cols-7 border-b border-line">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
          <div key={d} className="text-center py-2 text-[10.5px] uppercase tracking-wide text-fg4 font-semibold">{d}</div>
        ))}
      </div>
      {/* Rejilla */}
      <div className="grid grid-cols-7" style={{ gridAutoRows: "minmax(96px, 1fr)" }}>
        {dias.map((d) => {
          const iso = toISO(d);
          const delDia = (porDia.get(iso) || []).sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
          const fueraMes = d.getMonth() !== mesActual;
          const hoy = isSameDay(d, ahora);
          return (
            <div key={iso} className={`border-l border-t border-line first:border-l-0 [&:nth-child(7n+1)]:border-l-0 p-1.5 min-h-[96px] ${fueraMes ? "bg-bg/40" : ""}`}>
              <button type="button" onClick={() => onDay(d)} className="block mb-1">
                <span className={`text-[12px] font-semibold inline-flex items-center justify-center leading-none ${hoy ? "bg-accent text-accentfg w-5 h-5 rounded-full" : fueraMes ? "text-fg4" : "text-fg2"}`}>
                  {d.getDate()}
                </span>
              </button>
              <div className="space-y-0.5">
                {delDia.slice(0, MAX).map((c) => {
                  const cancelada = c.estado === "cancelada";
                  const { bg } = avColor(c.barberos?.nombre ?? "?");
                  return (
                    <button
                      key={c.id} type="button" onClick={() => onSelect(c)}
                      className={`w-full flex items-center gap-1 px-1 py-[2px] rounded hover:bg-hover text-left ${cancelada ? "opacity-50 line-through" : ""}`}
                      title={`${fmtHora12(horaAMin(c.hora))} · ${c.servicios?.nombre ?? ""}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${bg}`} />
                      <span className="text-[10.5px] font-semibold text-fg2 tabular flex-shrink-0">{fmtHora12(horaAMin(c.hora))}</span>
                      <span className="text-[10.5px] text-fg3 truncate">{c.servicios?.nombre ?? c.clientes?.nombre ?? "—"}</span>
                    </button>
                  );
                })}
                {delDia.length > MAX && (
                  <button type="button" onClick={() => onDay(d)} className="text-[10.5px] text-fg3 hover:text-fg font-medium px-1">
                    +{delDia.length - MAX} más
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Panel de detalle de una cita ──────────────────────── */

function DetalleCita({ cita, onClose, onCancelar }: { cita: Cita; onClose: () => void; onCancelar: (id: string) => void }) {
  const st = estadoMap[cita.estado] ?? { label: cita.estado, variant: "neutral" as const };
  const precio = Number(cita.servicios?.precio) || 0;
  const fecha = parseISO(cita.fecha);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface border border-line rounded-2xl w-full max-w-sm mx-4 p-6 shadow-[var(--shadow-2)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-fg text-[16px] leading-tight">{cita.servicios?.nombre ?? "Cita"}</h3>
            <p className="text-[12.5px] text-fg3 mt-0.5 capitalize">
              {diaLargo(fecha)}, {fecha.getDate()} de {mesLargo(fecha)} · {cita.hora?.substring(0, 5)}
            </p>
          </div>
          <Badge variant={st.variant}>{st.label}</Badge>
        </div>
        <div className="space-y-2.5 text-[13px] border-t border-line pt-4">
          <Fila k="Cliente" v={cita.clientes?.nombre ?? "—"} />
          <Fila k="Teléfono" v={cita.clientes?.telefono ?? "—"} />
          <Fila k="Profesional" v={cita.barberos?.nombre ?? "—"} />
          <Fila k="Duración" v={cita.servicios?.duracion_minutos ? `${cita.servicios.duracion_minutos} min` : "—"} />
          <Fila k="Precio" v={`${formatEUR(precio)} €`} />
        </div>
        {cita.estado !== "cancelada" && (
          <div className="flex gap-2 mt-5">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-line text-fg2 text-[13px] font-medium hover:bg-hover transition-colors">Cerrar</button>
            <button type="button" onClick={() => onCancelar(cita.id)} className="flex-1 py-2.5 rounded-lg bg-danger2 text-danger border border-danger/20 text-[13px] font-semibold hover:bg-danger/10 transition-colors">Cancelar cita</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Fila({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-fg4">{k}</span>
      <span className="text-fg font-medium text-right truncate">{v}</span>
    </div>
  );
}
