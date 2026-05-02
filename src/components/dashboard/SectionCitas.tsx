'use client'
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Filter, Download, Plus } from "lucide-react";
import { fechaHoy, fechaSemana, fechaMes, fechaAgendaLabel, formatEUR, formatFechaCorta } from "./utils";
import { Spinner, Empty, KpiStrip, Avatar, Badge } from "./ui";

type CitaVista = "hoy" | "semana" | "mes";
const PER_PAGE = 15;

export default function SectionCitas({ toast, empresaId }: { toast: (m: string, t?: string) => void; empresaId: string }) {
  const [vista, setVista] = useState<CitaVista>("hoy");
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [ocultarCanceladas, setOcultarCanceladas] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setPage(0);
    const { inicio, fin } = vista === "hoy"
      ? { inicio: fechaHoy(), fin: fechaHoy() }
      : vista === "semana" ? fechaSemana() : fechaMes();
    const { data } = await supabase
      .from("citas")
      .select("id, fecha, hora, estado, clientes(nombre, telefono), servicios(nombre, precio, duracion_minutos), barberos(nombre)")
      .eq("empresa_id", empresaId)
      .gte("fecha", inicio).lte("fecha", fin)
      .order("fecha", { ascending: true }).order("hora", { ascending: true });
    setCitas(data || []);
    setLoading(false);
  }, [vista, empresaId]);

  useEffect(() => { cargar(); }, [cargar]);

  async function cancelar(id: string) {
    await supabase.from("citas").update({ estado: "cancelada" }).eq("id", id);
    toast("Cita cancelada", "success");
    cargar();
  }

  const confirmadas = citas.filter(c => c.estado === "confirmada");
  const pendientes  = citas.filter(c => c.estado === "pendiente");
  const canceladas  = citas.filter(c => c.estado === "cancelada");
  const proxima     = confirmadas[0];
  const ingresos    = confirmadas.reduce((a, c) => a + parseFloat(c.servicios?.precio || 0), 0);
  const ocupacion   = citas.length > 0 ? Math.round((confirmadas.length / citas.length) * 100) : 0;

  const citasFiltradas = ocultarCanceladas ? citas.filter(c => c.estado !== "cancelada") : citas;
  const totalPages = Math.max(1, Math.ceil(citasFiltradas.length / PER_PAGE));
  const pageCitas  = citasFiltradas.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const estadoMap: Record<string, { label: string; variant: "success"|"warning"|"danger"|"info"|"neutral" }> = {
    confirmada: { label: "Confirmada", variant: "success" },
    pendiente:  { label: "Pendiente",  variant: "warning" },
    cancelada:  { label: "Cancelada",  variant: "neutral" },
    en_curso:   { label: "En curso",   variant: "info"    },
  };

  return (
    <div className="px-4 sm:px-6 py-5 sm:py-7 max-w-[1200px] mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-semibold text-fg font-display leading-tight">Citas</h1>
          <p className="text-[12.5px] sm:text-[13px] text-fg3 mt-0.5">
            {fechaAgendaLabel()} · {citas.length} reservas · {confirmadas.length} confirmadas
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button type="button" className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg border border-line bg-surface text-fg2 text-[12.5px] sm:text-[13px] font-medium hover:bg-hover transition-colors">
            <Filter size={13} /> <span className="hidden sm:inline">Filtros</span>
          </button>
          <button type="button" className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg border border-line bg-surface text-fg2 text-[12.5px] sm:text-[13px] font-medium hover:bg-hover transition-colors">
            <Download size={13} /> <span className="hidden sm:inline">Exportar</span>
          </button>
          <button type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accentfg text-[12.5px] sm:text-[13px] font-semibold hover:bg-accent/90 transition-colors whitespace-nowrap">
            <Plus size={13} /> Nueva cita
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <KpiStrip items={[
        {
          label: "Próxima cita",
          value: proxima ? (
            <span className="font-mono font-semibold">{proxima.hora?.substring(0, 5) ?? "—"}</span>
          ) : "—",
          sub: proxima ? `${proxima.clientes?.nombre ?? proxima.clientes?.telefono ?? "—"} · ${proxima.servicios?.nombre ?? "—"}` : "Sin citas confirmadas",
          accent: true,
        },
        {
          label: "Confirmadas",
          value: confirmadas.length,
          sub: `de ${citas.length} totales · ${ocupacion}% ocupación`,
        },
        {
          label: "Pendientes",
          value: pendientes.length,
          sub: pendientes.length > 0 ? "esperan confirmación" : "Sin pendientes",
        },
        {
          label: "Ingresos previstos",
          value: <span className="font-mono">{formatEUR(ingresos)} €</span>,
          sub: `${canceladas.length > 0 ? `${canceladas.length} cancelada${canceladas.length !== 1 ? "s" : ""} hoy` : "Sin cancelaciones"}`,
        },
      ]} />

      {/* Agenda toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
        <div>
          <h2 className="text-[15px] font-semibold text-fg">Agenda</h2>
          <p className="text-[12px] text-fg4 mt-0.5">{citasFiltradas.length} citas · vista por hora y barbero</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer select-none text-[12px] sm:text-[12.5px] text-fg3">
            <button
              type="button"
              role="switch"
              aria-checked={ocultarCanceladas ? "true" : "false"}
              aria-label="Ocultar citas canceladas"
              onClick={() => setOcultarCanceladas(v => !v)}
              className={`relative w-8 h-[18px] rounded-full transition-colors flex-shrink-0 ${ocultarCanceladas ? "bg-accent" : "bg-line"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${ocultarCanceladas ? "translate-x-3.5" : ""}`} />
            </button>
            Ocultar canceladas
          </label>
          <div className="flex rounded-lg border border-line overflow-hidden bg-surface">
            {(["hoy", "semana", "mes"] as CitaVista[]).map((v, i) => (
              <button
                key={v}
                type="button"
                onClick={() => setVista(v)}
                className={`px-3 sm:px-3.5 py-1.5 text-[12px] sm:text-[12.5px] font-medium transition-colors ${
                  vista === v ? "bg-selected text-fg" : "text-fg3 hover:text-fg hover:bg-hover"
                } ${i > 0 ? "border-l border-line" : ""}`}
              >
                {v === "hoy" ? "Hoy" : v === "semana" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cita cards */}
      {loading ? (
        <Spinner />
      ) : citasFiltradas.length === 0 ? (
        <Empty msg="No hay citas para este período" />
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {pageCitas.map((c) => {
            const cancelada = c.estado === "cancelada";
            const st = estadoMap[c.estado] ?? { label: c.estado, variant: "neutral" as const };
            const precio = parseFloat(c.servicios?.precio || 0);
            return (
              <div
                key={c.id}
                className={`bg-surface border border-line rounded-xl px-4 py-3.5 shadow-[var(--shadow-1)] group hover:border-line2 hover:shadow-[var(--shadow-2)] transition-all ${cancelada ? "opacity-55" : ""}`}
              >
                {/* Mobile: hora + precio en top row */}
                <div className="flex items-center justify-between mb-2.5 sm:hidden">
                  <div>
                    <p className="text-[15px] font-mono font-semibold text-fg tabular leading-none">
                      {c.hora?.substring(0, 5) ?? "—"}
                    </p>
                    <p className="text-[11px] text-fg4 mt-0.5 tabular">
                      {formatFechaCorta(c.fecha)}{c.servicios?.duracion_minutos ? ` · ${c.servicios.duracion_minutos} min` : ""}
                    </p>
                  </div>
                  <span className="text-[13px] font-mono font-semibold text-fg tabular">
                    {formatEUR(precio)} <span className="text-fg4 font-normal">€</span>
                  </span>
                </div>
                <div className="h-px bg-line2 mb-2.5 sm:hidden" />

                {/* Main row */}
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Time — desktop only */}
                  <div className="hidden sm:block flex-shrink-0 w-[4rem]">
                    <p className="text-[16px] font-mono font-semibold text-fg tabular leading-none">
                      {c.hora?.substring(0, 5) ?? "—"}
                    </p>
                    <p className="text-[11px] text-fg4 mt-0.5 tabular">{formatFechaCorta(c.fecha)}</p>
                    {c.servicios?.duracion_minutos && (
                      <p className="text-[11px] text-fg4 tabular">{c.servicios.duracion_minutos} min</p>
                    )}
                  </div>

                  {/* Vertical divider — desktop only */}
                  <div className="hidden sm:block w-px self-stretch bg-line2 flex-shrink-0" />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-fg truncate">{c.servicios?.nombre ?? "—"}</p>
                    <p className="text-[12px] text-fg3 mt-0.5 truncate">
                      {c.clientes?.nombre ?? "—"}{c.clientes?.telefono ? ` · ${c.clientes.telefono}` : ""}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Avatar name={c.barberos?.nombre ?? "?"} size="xs" />
                        <span className="text-[12px] text-fg3">{c.barberos?.nombre ?? "—"}</span>
                      </div>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                  </div>

                  {/* Price — desktop only */}
                  <div className="hidden sm:block flex-shrink-0 min-w-[5rem] text-right">
                    <span className="text-[13px] font-mono font-semibold text-fg tabular">
                      {formatEUR(precio)} <span className="text-fg4 font-normal">€</span>
                    </span>
                  </div>

                  {/* Actions */}

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[12px] text-fg4">{citasFiltradas.length} resultados</span>
          <div className="flex items-center gap-1">
            <button type="button" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-[12px] text-fg3 hover:bg-hover disabled:opacity-40 transition-colors border border-line bg-surface">Anterior</button>
            <span className="px-3 text-[12px] text-fg3">{page + 1} / {totalPages}</span>
            <button type="button" disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-[12px] text-fg3 hover:bg-hover disabled:opacity-40 transition-colors border border-line bg-surface">Siguiente</button>
          </div>
        </div>
      )}
    </div>
  );
}
