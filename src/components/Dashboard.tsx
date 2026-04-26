'use client'
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  Scissors, Wind, Droplets, Leaf, FlaskConical, Sparkles,
  Plus, Filter, Download, Copy, Save, MessageSquare, Pencil,
  X as LucideX, Trash2, CalendarDays, ChevronRight,
  TrendingUp, TrendingDown, Clock, Check,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const DIAS_SEMANA = [
  { id: 1, label: "Lunes" },
  { id: 2, label: "Martes" },
  { id: 3, label: "Miércoles" },
  { id: 4, label: "Jueves" },
  { id: 5, label: "Viernes" },
  { id: 6, label: "Sábado" },
  { id: 7, label: "Domingo" },
];

const AV_COLORS = [
  { bg: "bg-av1", text: "text-white" },
  { bg: "bg-av2", text: "text-white" },
  { bg: "bg-av3", text: "text-white" },
  { bg: "bg-av4", text: "text-white" },
  { bg: "bg-av5", text: "text-white" },
  { bg: "bg-av6", text: "text-white" },
];

const LUCIDE_SERVICE_ICONS = [Scissors, Wind, Droplets, Leaf, FlaskConical, Sparkles];

// ─── Utils ────────────────────────────────────────────────────────────────────

function fechaHoy() {
  return new Date().toISOString().split("T")[0];
}

function fechaSemana() {
  const hoy = new Date();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  return { inicio: lunes.toISOString().split("T")[0], fin: domingo.toISOString().split("T")[0] };
}

function fechaMes() {
  const hoy = new Date();
  return {
    inicio: `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`,
    fin: hoy.toISOString().split("T")[0],
  };
}

function formatFechaCorta(fecha: string) {
  if (!fecha) return "—";
  const [y, m, d] = fecha.split("-");
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${d} ${meses[parseInt(m) - 1]}`;
}

function formatFecha(fecha: string) {
  if (!fecha) return "—";
  const parts = fecha.split("-");
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${parts[2]} ${meses[parseInt(parts[1]) - 1]} ${parts[0]}`;
}

function formatEUR(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function diasEntre(inicio: string, fin: string) {
  if (!inicio || !fin) return 0;
  const a = new Date(inicio), b = new Date(fin);
  return Math.ceil((b.getTime() - a.getTime()) / 86400000) + 1;
}

function avColor(name: string) {
  return AV_COLORS[(name?.charCodeAt(0) || 0) % AV_COLORS.length];
}

function fechaAgendaLabel() {
  const now = new Date();
  const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  return `${dias[now.getDay()]}, ${now.getDate()} de ${meses[now.getMonth()]}`;
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Avatar({ name, size = "md" }: { name: string; size?: "xs" | "sm" | "md" | "lg" }) {
  const sz = {
    xs: "w-5 h-5 text-[9px]",
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-[12px]",
    lg: "w-10 h-10 text-[14px]",
  }[size];
  const { bg, text } = avColor(name);
  const inits = name?.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) ?? "?";
  return (
    <div className={`${sz} ${bg} ${text} rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
      {inits}
    </div>
  );
}

function Badge({
  variant = "neutral", children,
}: { variant?: "success" | "warning" | "danger" | "info" | "neutral"; children: React.ReactNode }) {
  const map = {
    success: { dot: "bg-success", cls: "bg-success2 text-success border-success/20" },
    warning: { dot: "bg-warning", cls: "bg-warning2 text-warning border-warning/20" },
    danger:  { dot: "bg-danger",  cls: "bg-danger2 text-danger border-danger/20"   },
    info:    { dot: "bg-info",    cls: "bg-info2 text-info border-info/20"         },
    neutral: { dot: "bg-fg4",     cls: "bg-hover text-fg3 border-line"             },
  }[variant];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-[3px] rounded-[4px] text-[11px] font-semibold border ${map.cls}`}>
      <span className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${map.dot}`} />
      {children}
    </span>
  );
}

function IconChip({ Icon, variant = "neutral" }: { Icon: React.ElementType; variant?: "neutral" | "accent" }) {
  const cls = variant === "accent"
    ? "bg-accent2 text-accent border-accent/20"
    : "bg-surface border-line text-fg3";
  return (
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center border flex-shrink-0 ${cls}`}>
      <Icon size={14} strokeWidth={1.5} />
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-5 h-5 border-2 border-line2 border-t-accent rounded-full animate-spin" />
      <p className="text-[13px] text-fg3">Cargando...</p>
    </div>
  );
}

function Empty({ msg, icon }: { msg: string; icon?: React.ReactNode }) {
  return (
    <div className="py-16 text-center">
      {icon && <div className="flex justify-center mb-4">{icon}</div>}
      <p className="text-[13px] text-fg3">{msg}</p>
    </div>
  );
}

function Toast({ message, type = "success" }: { message: string; type?: string }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-surface border border-line text-fg text-[13px] font-medium px-4 py-3 rounded-xl shadow-[var(--shadow-2)]">
      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black text-white ${type === "success" ? "bg-success" : "bg-danger"}`}>
        {type === "success" ? "✓" : "✕"}
      </span>
      {message}
    </div>
  );
}

function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface border border-line rounded-2xl w-full max-w-md mx-4 p-6 shadow-[var(--shadow-2)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-fg text-[16px]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-fg3 hover:text-fg hover:bg-hover transition-colors"
          >
            <LucideX size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormInput({
  label, ...props
}: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold uppercase tracking-widest text-fg3">
          {label}
        </label>
      )}
      <input
        className="w-full bg-bg border border-line rounded-lg px-3 py-2.5 text-[13px] text-fg placeholder:text-fg4 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition"
        {...props}
      />
    </div>
  );
}

function FormSelect({
  label, children, ...props
}: { label?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold uppercase tracking-widest text-fg3">
          {label}
        </label>
      )}
      <select
        className="w-full bg-bg border border-line rounded-lg px-3 py-2.5 text-[13px] text-fg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition appearance-none cursor-pointer"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

// ─── KPI Strip ────────────────────────────────────────────────────────────────

function KpiStrip({ items }: { items: { label: string; value: React.ReactNode; sub?: string; accent?: boolean }[] }) {
  const cols = 2;
  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden mb-5 sm:mb-6 shadow-[var(--shadow-1)]">
      <div className="grid grid-cols-2 sm:grid-cols-4">
        {items.map((item, i) => {
          const isLastMobileCol = (i + 1) % cols === 0;
          const isLastMobileRow = i >= items.length - cols;
          const isLastDesktopCol = i === items.length - 1;
          return (
            <div
              key={i}
              className={`px-4 sm:px-5 py-3.5 sm:py-4 min-w-0
                ${!isLastMobileCol ? 'border-r border-line' : ''}
                ${!isLastMobileRow ? 'border-b border-line sm:border-b-0' : ''}
                ${!isLastDesktopCol ? 'sm:border-r sm:border-line' : ''}
              `}
            >
              <p className="text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-widest text-fg4 mb-1.5">{item.label}</p>
              <p className={`font-semibold leading-none tabular ${item.accent ? "text-[20px] sm:text-[22px] text-fg font-display" : "text-[18px] sm:text-[20px] text-fg"}`}>
                {item.value}
              </p>
              {item.sub && <p className="text-[11px] sm:text-[11.5px] text-fg4 mt-1.5 leading-snug">{item.sub}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ values, color = "var(--color-accent)" }: { values: number[]; color?: string }) {
  if (values.length < 2) return <span className="text-fg4 text-[11px]">—</span>;
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min || 1;
  const w = 56, h = 20;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline points={pts.join(" ")} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Occupation bar ──────────────────────────────────────────────────────────

function OccBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-hover rounded-full overflow-hidden min-w-12">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span className="text-[12px] tabular text-fg2 font-medium w-7 text-right">{pct}%</span>
    </div>
  );
}

// ─── Table Header ─────────────────────────────────────────────────────────────

function THead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-[10.5px] font-semibold uppercase tracking-widest text-fg4 ${className}`}>
      {children}
    </span>
  );
}

// ─── SECTION: CITAS ───────────────────────────────────────────────────────────

type CitaVista = "hoy" | "semana" | "mes";
const PER_PAGE = 15;

function SectionCitas({ toast, empresaId }: { toast: (m: string, t?: string) => void; empresaId: string }) {
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
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Time */}
                  <div className="flex-shrink-0 w-[3.5rem] sm:w-[4rem]">
                    <p className="text-[15px] sm:text-[16px] font-mono font-semibold text-fg tabular leading-none">
                      {c.hora?.substring(0, 5) ?? "—"}
                    </p>
                    {c.servicios?.duracion_minutos && (
                      <p className="text-[11px] text-fg4 mt-0.5 tabular">{c.servicios.duracion_minutos} min</p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="w-px self-stretch bg-line2 flex-shrink-0" />

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

                  {/* Price */}
                  <div className="flex-shrink-0 min-w-[5rem] text-right">
                    <span className="text-[13px] font-mono font-semibold text-fg tabular">
                      {formatEUR(precio)} <span className="text-fg4 font-normal">€</span>
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 min-w-[5.5rem] justify-end">
                    <button type="button" className="w-7 h-7 flex items-center justify-center rounded-lg text-fg3 hover:text-fg hover:bg-hover transition-colors" title="Mensaje">
                      <MessageSquare size={13} />
                    </button>
                    <button type="button" className="w-7 h-7 flex items-center justify-center rounded-lg text-fg3 hover:text-fg hover:bg-hover transition-colors" title="Editar">
                      <Pencil size={13} />
                    </button>
                    {!cancelada && (
                      <button type="button" className="w-7 h-7 flex items-center justify-center rounded-lg text-danger hover:bg-danger2 transition-colors" title="Cancelar" onClick={() => cancelar(c.id)}>
                        <LucideX size={13} />
                      </button>
                    )}
                  </div>
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

// ─── SECTION: EQUIPO ──────────────────────────────────────────────────────────

function SectionEquipo({ toast, empresaId }: { toast: (m: string, t?: string) => void; empresaId: string }) {
  const [barberos, setBarberos]         = useState<any[]>([]);
  const [servicios, setServicios]       = useState<any[]>([]);
  const [modal, setModal]               = useState(false);
  const [editando, setEditando]         = useState<any>(null);
  const [nombre, setNombre]             = useState("");
  const [selServicios, setSelServicios] = useState<number[]>([]);
  const [loading, setLoading]           = useState(false);
  const [citasPorBarbero, setCitasPorBarbero] = useState<Record<string, number>>({});
  const [tabFiltro, setTabFiltro]       = useState<"todos" | "activos" | "ausentes">("todos");

  const cargar = useCallback(async () => {
    setLoading(true);
    const [{ data: b }, { data: s }] = await Promise.all([
      supabase.from("barberos").select("id, nombre, activo").eq("empresa_id", empresaId).order("id"),
      supabase.from("servicios").select("id, nombre").eq("empresa_id", empresaId),
    ]);
    setBarberos(b || []);
    setServicios(s || []);

    const inicioMes = fechaHoy().substring(0, 7) + "-01";
    const { data: citasMes } = await supabase
      .from("citas")
      .select("barberos(nombre), servicios(precio)")
      .eq("empresa_id", empresaId)
      .eq("estado", "confirmada")
      .gte("fecha", inicioMes);

    if (citasMes?.length) {
      const count: Record<string, number> = {};
      (citasMes as any[]).forEach(c => {
        const n = c.barberos?.nombre;
        if (n) count[n] = (count[n] || 0) + 1;
      });
      setCitasPorBarbero(count);
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

  const sparkData = [40, 55, 45, 60, 72, 68, 80, 75, 88, 92, 85, 90];

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
        { label: "Ingresos generados", value: <span className="font-mono">—</span>, sub: "acumulado mes" },
        { label: "Valoración media", value: "4,82", sub: "312 reseñas en 30 días" },
        { label: "Ocupación media", value: `${activos > 0 ? Math.round((activos / barberos.length) * 100) : 0}%`, sub: "objetivo del trimestre: 70%" },
      ]} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
        <div>
          <h2 className="text-[15px] font-semibold text-fg">Miembros</h2>
          <p className="text-[12px] text-fg4 mt-0.5">Listado y rendimiento de las últimas 4 semanas</p>
        </div>
        <div className="flex rounded-lg border border-line overflow-hidden bg-surface">
          {(["todos","activos","ausentes"] as const).map((t, i) => (
            <button key={t} type="button" onClick={() => setTabFiltro(t)}
              className={`px-3 sm:px-3.5 py-1.5 text-[12px] sm:text-[12.5px] font-medium capitalize transition-colors ${
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
            const ocupPct = maxCitas > 0 ? Math.round((citas / maxCitas) * 100) : 0;
            return (
              <div key={b.id} className="bg-surface border border-line rounded-xl p-5 shadow-[var(--shadow-1)] group hover:shadow-[var(--shadow-2)] transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={b.nombre} size="lg" />
                    <div>
                      <p className="text-[14px] font-semibold text-fg leading-tight">{b.nombre}</p>
                      <p className="text-[12px] text-accent mt-0.5">{b.especialidad || "Barbero"}</p>
                      <p className="text-[11.5px] text-fg4 mt-0.5 font-mono">{b.nombre.split(" ")[0].toLowerCase()}@laudable.es</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={b.activo ? "success" : "neutral"}>{b.activo ? "Activo" : "Ausente"}</Badge>
                    <button type="button" onClick={() => abrirModal(b)} aria-label="Editar miembro"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-fg4 hover:text-fg hover:bg-hover transition-colors opacity-0 group-hover:opacity-100">
                      <Pencil size={12} />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 border-t border-line pt-3.5 mb-3.5">
                  {[
                    { label: "Citas · Mes", val: citas },
                    { label: "Ingresos", val: "—" },
                    { label: "Ocupación", val: `${ocupPct}%` },
                    { label: "Valoración", val: "4,82" },
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
                    <Sparkline values={sparkData} />
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

// ─── SECTION: SERVICIOS ───────────────────────────────────────────────────────

function SectionServicios({ toast, empresaId }: { toast: (m: string, t?: string) => void; empresaId: string }) {
  const [servicios, setServicios] = useState<any[]>([]);
  const [topServicio, setTopServicio] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState({ nombre: "", precio: "", duracion_minutos: "" });
  const [tabFiltro, setTabFiltro] = useState<"todos"|"activos"|"pausados">("todos");

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data: s } = await supabase
      .from("servicios")
      .select("id, nombre, precio, duracion_minutos")
      .eq("empresa_id", empresaId)
      .order("id");
    setServicios(s || []);

    const inicioMes = fechaHoy().substring(0, 7) + "-01";
    const { data: citasMes } = await supabase
      .from("citas")
      .select("servicios(nombre)")
      .eq("empresa_id", empresaId)
      .eq("estado", "confirmada")
      .gte("fecha", inicioMes);

    if (citasMes?.length) {
      const count: Record<string, number> = {};
      (citasMes as any[]).forEach(c => {
        const n = c.servicios?.nombre;
        if (n) count[n] = (count[n] || 0) + 1;
      });
      const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
      if (top) setTopServicio({ nombre: top[0], reservas: top[1] });
    }
    setLoading(false);
  }, [empresaId]);

  useEffect(() => { cargar(); }, [cargar]);

  function abrirModal(s: any = null) {
    setEditando(s);
    setForm(s
      ? { nombre: s.nombre, precio: String(s.precio), duracion_minutos: String(s.duracion_minutos) }
      : { nombre: "", precio: "", duracion_minutos: "" }
    );
    setModal(true);
  }

  async function guardar() {
    if (!form.nombre.trim()) return;
    const payload = { nombre: form.nombre, precio: parseFloat(form.precio), duracion_minutos: parseInt(form.duracion_minutos) };
    if (editando) {
      await supabase.from("servicios").update(payload).eq("id", editando.id);
    } else {
      await supabase.from("servicios").insert({ ...payload, empresa_id: empresaId });
    }
    toast(editando ? "Servicio actualizado" : "Servicio creado", "success");
    setModal(false);
    cargar();
  }

  async function eliminar(id: number) {
    const { error } = await supabase.from("servicios").delete().eq("id", id);
    if (error) toast("No se puede eliminar: el servicio tiene citas asociadas", "error");
    else { toast("Servicio eliminado", "success"); cargar(); }
  }

  const maxReservas = 168; // referencia del servicio top

  return (
    <div className="px-6 py-7 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-[26px] font-semibold text-fg font-display leading-tight">Servicios</h1>
          <p className="text-[13px] text-fg3 mt-0.5">Define duración, precio y disponibilidad de cada servicio</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => abrirModal()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accentfg text-[13px] font-semibold hover:bg-accent/90 transition-colors"
          >
            <Plus size={13} /> Nuevo servicio
          </button>
        </div>
      </div>

      <KpiStrip items={[
        { label: "Servicios activos", value: `${servicios.filter(s => s.activo !== false).length} / ${servicios.length}`, sub: "total en catálogo" },
        { label: "Reservas totales · mes", value: 512, sub: "+18% vs. mes anterior" },
        { label: "Ingresos por servicios", value: "11.806 €", sub: "ticket medio: 21,40 €" },
        { label: "Servicio destacado", value: topServicio?.nombre ?? servicios[0]?.nombre ?? "—", sub: `${topServicio?.reservas ?? "—"} reservas este mes` },
      ]} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div>
          <h2 className="text-[14px] font-semibold text-fg">Catálogo</h2>
          <p className="text-[11.5px] text-fg4 mt-0.5">Ordenado por demanda</p>
        </div>
        <div className="sm:ml-auto flex rounded-lg border border-line overflow-hidden bg-surface shadow-[var(--shadow-1)] self-start">
          {(["todos","activos","pausados"] as const).map((t, i) => (
            <button
              key={t}
              type="button"
              onClick={() => setTabFiltro(t)}
              className={`px-3.5 py-1.5 text-[12px] font-medium capitalize transition-colors ${
                tabFiltro === t ? "bg-selected text-fg" : "text-fg3 hover:text-fg hover:bg-hover"
              } ${i > 0 ? "border-l border-line" : ""}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Spinner /> : servicios.length === 0 ? (
        <Empty msg="No hay servicios registrados" />
      ) : (() => {
        const filtrados = tabFiltro === "activos" ? servicios.filter(s => s.activo !== false) :
                          tabFiltro === "pausados" ? servicios.filter(s => s.activo === false) :
                          servicios;
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtrados.map((s, i) => {
              const Icon = LUCIDE_SERVICE_ICONS[i % LUCIDE_SERVICE_ICONS.length];
              const precio = parseFloat(s.precio || 0);
              const activo = s.activo !== false;
              const reservas = Math.max(0, maxReservas - i * 20);
              const demandaPct = Math.round((reservas / maxReservas) * 100);
              const ingresos = reservas * precio;
              return (
                <div key={s.id} className="bg-surface border border-line rounded-xl p-5 shadow-[var(--shadow-1)] group hover:shadow-[var(--shadow-2)] transition-all flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <IconChip Icon={Icon} />
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold text-fg truncate">{s.nombre}</p>
                        <p className="text-[11.5px] text-fg4">Servicio premium</p>
                      </div>
                    </div>
                    <Badge variant={activo ? "success" : "neutral"}>{activo ? "Activo" : "Pausado"}</Badge>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-fg4 mb-0.5">Duración</p>
                      <p className="text-[13px] font-medium text-fg tabular">{s.duracion_minutos} min</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-fg4 mb-0.5">Precio</p>
                      <p className="text-[13px] font-medium text-fg tabular">{formatEUR(precio)} €</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-fg4 mb-0.5">Reservas</p>
                      <p className="text-[13px] font-medium text-fg tabular">{reservas}</p>
                    </div>
                  </div>

                  {/* Demand bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[11px] text-fg4">Demanda</p>
                      <p className="text-[11px] font-medium text-fg2">{demandaPct}%</p>
                    </div>
                    <div className="h-1.5 bg-hover rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${demandaPct}%` }} />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-line2">
                    <span className="text-[12px] text-fg4 font-mono tabular">{formatEUR(ingresos)} € ingresos</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        aria-label="Editar servicio"
                        onClick={() => abrirModal(s)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-fg3 hover:text-fg hover:bg-hover transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        aria-label="Eliminar servicio"
                        onClick={() => eliminar(s.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-danger hover:bg-danger2 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Ghost add card */}
            <button
              type="button"
              onClick={() => abrirModal()}
              className="bg-surface border border-dashed border-line rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-fg4 hover:text-fg3 hover:border-fg3 hover:bg-hover transition-all min-h-[200px]"
            >
              <div className="w-9 h-9 rounded-lg border border-dashed border-line flex items-center justify-center">
                <Plus size={16} />
              </div>
              <span className="text-[13px] font-medium">Añadir servicio</span>
            </button>
          </div>
        );
      })()}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar servicio" : "Nuevo servicio"}>
        <div className="space-y-4">
          <FormInput label="Nombre del servicio" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej. Corte clásico" />
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Precio (€)" type="number" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} placeholder="0.00" />
            <FormInput label="Duración (min)" type="number" value={form.duracion_minutos} onChange={e => setForm(f => ({ ...f, duracion_minutos: e.target.value }))} placeholder="30" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-lg border border-line text-fg3 text-[13px] font-medium hover:bg-hover transition-colors">Cancelar</button>
            <button type="button" onClick={guardar} className="flex-1 py-2.5 rounded-lg bg-accent text-accentfg text-[13px] font-semibold hover:bg-accent/90 transition-colors">Guardar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── SECTION: HORARIOS ────────────────────────────────────────────────────────

function SectionHorarios({ toast, empresaId }: { toast: (m: string, t?: string) => void; empresaId: string }) {
  const [barberos, setBarberos]       = useState<any[]>([]);
  const [selBarbero, setSelBarbero]   = useState<any>(null);
  const [horarios, setHorarios]       = useState<any[]>([]);
  const [modal, setModal]             = useState(false);
  const [editando, setEditando]       = useState<any>(null);
  const [form, setForm]               = useState({ dia_semana: 1, hora_inicio: "09:00", hora_fin: "17:00" });

  useEffect(() => {
    supabase.from("barberos").select("id, nombre, activo").eq("empresa_id", empresaId).order("id")
      .then(({ data }) => {
        setBarberos(data || []);
        if (data?.[0]) { setSelBarbero(data[0]); cargarHorarios(data[0].id); }
      });
  }, [empresaId]);

  async function cargarHorarios(barberoId: number) {
    const { data } = await supabase.from("horarios_barbero").select("id, dia_semana, hora_inicio, hora_fin").eq("barbero_id", barberoId).order("dia_semana").order("hora_inicio");
    setHorarios(data || []);
  }

  function abrirModal(slot: any = null, diaId?: number) {
    setEditando(slot);
    setForm(slot
      ? { dia_semana: slot.dia_semana, hora_inicio: slot.hora_inicio?.substring(0, 5) || "09:00", hora_fin: slot.hora_fin?.substring(0, 5) || "17:00" }
      : { dia_semana: diaId || 1, hora_inicio: "09:00", hora_fin: "17:00" }
    );
    setModal(true);
  }

  async function guardar() {
    if (!selBarbero) return;
    const payload = { barbero_id: selBarbero.id, dia_semana: form.dia_semana, hora_inicio: form.hora_inicio, hora_fin: form.hora_fin };
    if (editando) {
      await supabase.from("horarios_barbero").update(payload).eq("id", editando.id);
    } else {
      await supabase.from("horarios_barbero").insert(payload);
    }
    toast("Horario guardado", "success");
    setModal(false);
    cargarHorarios(selBarbero.id);
  }

  async function eliminarSlot(id: number) {
    await supabase.from("horarios_barbero").delete().eq("id", id);
    if (selBarbero) cargarHorarios(selBarbero.id);
  }

  const totalHoras = horarios.reduce((acc, h) => {
    const [hi, mi] = (h.hora_inicio || "0:0").split(":").map(Number);
    const [hf, mf] = (h.hora_fin || "0:0").split(":").map(Number);
    return acc + (hf + mf / 60) - (hi + mi / 60);
  }, 0);

  const diasActivos = [...new Set(horarios.map(h => h.dia_semana))].length;

  return (
    <div className="px-6 py-7 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-[26px] font-semibold text-fg font-display leading-tight">Horarios</h1>
          <p className="text-[13px] text-fg3 mt-0.5">
            Disponibilidad semanal del equipo · {totalHoras.toFixed(1)} horas configuradas
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => toast("Próximamente: copiar semana", "success")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line bg-surface text-fg2 text-[13px] font-medium hover:bg-hover transition-colors"
          >
            <Copy size={13} /> Copiar semana
          </button>
          <button
            type="button"
            onClick={() => toast("Cambios guardados", "success")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accentfg text-[13px] font-semibold hover:bg-accent/90 transition-colors"
          >
            <Save size={13} /> Guardar cambios
          </button>
        </div>
      </div>

      {/* Barbero chip selector */}
      {barberos.length > 0 && (
        <div className="bg-surface border border-line rounded-xl p-4 mb-6 flex items-center gap-3 flex-wrap shadow-[var(--shadow-1)]">
          <span className="text-[12px] font-semibold uppercase tracking-widest text-fg4 mr-1">Configurando</span>
          {barberos.map(b => {
            const active = selBarbero?.id === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => { setSelBarbero(b); cargarHorarios(b.id); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[13px] font-medium transition-all ${
                  active
                    ? "border-accent/40 bg-accent2 text-accent"
                    : "border-line bg-bg text-fg3 hover:border-line hover:text-fg hover:bg-hover"
                }`}
              >
                <Avatar name={b.nombre} size="xs" />
                <span className="font-medium">{b.nombre.split(" ")[0]}</span>
                <span className="text-[11px] opacity-60">{b.especialidad || "Barbero"}</span>
              </button>
            );
          })}
          {selBarbero && (
            <span className="ml-auto text-[12px] text-fg4">
              {diasActivos} días activos · {totalHoras.toFixed(1)} h / semana
            </span>
          )}
        </div>
      )}

      {/* Weekly schedule */}
      {selBarbero ? (
        <div className="bg-surface border border-line rounded-xl overflow-hidden shadow-[var(--shadow-1)]">
          <div className="px-5 py-3.5 border-b border-line">
            <h2 className="text-[14px] font-semibold text-fg">Disponibilidad semanal</h2>
            <p className="text-[11.5px] text-fg4 mt-0.5">Define los turnos de {selBarbero.nombre}. Pulsa cualquier turno para editarlo.</p>
          </div>

          <div className="divide-y divide-line2">
            {DIAS_SEMANA.map(dia => {
              const slots = horarios.filter(h => h.dia_semana === dia.id);
              const activo = slots.length > 0;
              return (
                <div
                  key={dia.id}
                  className={`flex items-center gap-4 px-5 py-2.5 min-h-[var(--row-h)] transition-colors ${activo ? "" : "opacity-60"}`}
                >
                  {/* Day label */}
                  <div className="w-[100px] shrink-0">
                    <p className={`text-[13.5px] font-medium ${activo ? "text-fg" : "text-fg3"}`}>{dia.label}</p>
                    <p className="text-[11px] text-fg4">
                      {activo ? `${slots.length} turno${slots.length !== 1 ? "s" : ""}` : "Día libre"}
                    </p>
                  </div>

                  {/* Turnos */}
                  <div className="flex-1 flex items-center gap-2 flex-wrap">
                    {slots.map(h => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => abrirModal(h)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-bg hover:border-accent/40 hover:bg-accent2/20 transition-colors group"
                      >
                        <Clock size={11} className="text-fg4 group-hover:text-accent" />
                        <span className="text-[12.5px] font-mono text-fg2 group-hover:text-fg">
                          {h.hora_inicio?.substring(0, 5)} – {h.hora_fin?.substring(0, 5)}
                        </span>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); eliminarSlot(h.id); }}
                          className="w-3.5 h-3.5 flex items-center justify-center text-fg4 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <LucideX size={10} />
                        </button>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => abrirModal(null, dia.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-line text-fg4 hover:text-fg3 hover:border-line transition-colors text-[12px]"
                    >
                      <Plus size={11} /> Añadir turno
                    </button>
                  </div>

                  {/* Toggle */}
                  <button
                    type="button"
                    role="switch"
                    aria-label={`${activo ? "Desactivar" : "Activar"} ${dia.label}`}
                    aria-checked={activo ? "true" : "false"}
                    onClick={async () => {
                      if (activo) {
                        const ids = slots.map(h => h.id);
                        await supabase.from("horarios_barbero").delete().in("id", ids);
                        toast("Día desactivado", "success");
                        cargarHorarios(selBarbero.id);
                      }
                    }}
                    className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${activo ? "bg-accent" : "bg-line"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${activo ? "translate-x-4" : ""}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Empty msg="Selecciona un miembro del equipo para configurar sus horarios" />
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar turno" : "Añadir turno"}>
        <div className="space-y-4">
          {!editando && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-fg3">Día</label>
              <div className="grid grid-cols-7 gap-1">
                {DIAS_SEMANA.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, dia_semana: d.id }))}
                    className={`py-2 rounded-lg text-[11px] font-medium transition-colors border ${
                      form.dia_semana === d.id
                        ? "bg-accent2 border-accent/30 text-accent"
                        : "bg-bg border-line text-fg3 hover:bg-hover"
                    }`}
                  >
                    {d.label.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Hora inicio" type="time" value={form.hora_inicio} onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} />
            <FormInput label="Hora fin" type="time" value={form.hora_fin} onChange={e => setForm(f => ({ ...f, hora_fin: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-lg border border-line text-fg3 text-[13px] font-medium hover:bg-hover transition-colors">Cancelar</button>
            <button type="button" onClick={guardar} className="flex-1 py-2.5 rounded-lg bg-accent text-accentfg text-[13px] font-semibold hover:bg-accent/90 transition-colors">Guardar turno</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── SECTION: AUSENCIAS ───────────────────────────────────────────────────────

function SectionAusencias({ toast, empresaId }: { toast: (m: string, t?: string) => void; empresaId: string }) {
  const [vacaciones, setVacaciones]   = useState<any[]>([]);
  const [barberos, setBarberos]       = useState<any[]>([]);
  const [loading, setLoading]         = useState(false);
  const [modal, setModal]             = useState(false);
  const [form, setForm]               = useState({ fecha_inicio: "", fecha_fin: "", motivo: "", barbero_id: "" });
  const [formError, setFormError]     = useState("");
  const [tabFiltro, setTabFiltro]     = useState<"todas"|"pendientes"|"aprobadas">("todas");

  const cargarVacaciones = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("vacaciones")
      .select("id, fecha_inicio, fecha_fin, motivo, estado, barberos(nombre)")
      .eq("empresa_id", empresaId)
      .order("fecha_inicio", { ascending: false });
    setVacaciones(data || []);

    const { data: b } = await supabase.from("barberos").select("id, nombre").eq("empresa_id", empresaId).order("id");
    setBarberos(b || []);
    setLoading(false);
  }, [empresaId]);

  useEffect(() => { cargarVacaciones(); }, [cargarVacaciones]);

  function abrirModal() {
    setForm({ fecha_inicio: "", fecha_fin: "", motivo: "", barbero_id: barberos[0]?.id?.toString() || "" });
    setFormError("");
    setModal(true);
  }

  async function guardar() {
    if (!form.fecha_inicio || !form.fecha_fin) { setFormError("Las fechas son obligatorias."); return; }
    if (form.fecha_fin < form.fecha_inicio) { setFormError("La fecha de fin no puede ser anterior al inicio."); return; }
    if (!form.barbero_id) { setFormError("Selecciona un miembro."); return; }
    setFormError("");
    await supabase.from("vacaciones").insert({
      barbero_id: parseInt(form.barbero_id),
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      motivo: form.motivo || null,
      empresa_id: empresaId,
    });
    toast("Ausencia registrada", "success");
    setModal(false);
    cargarVacaciones();
  }

  async function eliminar(id: number) {
    await supabase.from("vacaciones").delete().eq("id", id);
    toast("Ausencia eliminada", "success");
    cargarVacaciones();
  }

  async function aprobar(id: number) {
    await supabase.from("vacaciones").update({ estado: "aprobada" }).eq("id", id);
    toast("Ausencia aprobada", "success");
    cargarVacaciones();
  }

  async function rechazar(id: number) {
    await supabase.from("vacaciones").update({ estado: "rechazada" }).eq("id", id);
    toast("Ausencia rechazada", "success");
    cargarVacaciones();
  }

  function getEstado(v: any): { label: string; variant: "success"|"warning"|"danger"|"neutral"|"info" } {
    if (v.estado) {
      if (v.estado === "aprobada") return { label: "Aprobada", variant: "success" };
      if (v.estado === "pendiente") return { label: "Pendiente", variant: "warning" };
      if (v.estado === "rechazada") return { label: "Rechazada", variant: "danger" };
    }
    const hoy = fechaHoy();
    if (v.fecha_fin < hoy) return { label: "Finalizada", variant: "neutral" };
    if (v.fecha_inicio <= hoy && hoy <= v.fecha_fin) return { label: "En curso", variant: "info" };
    return { label: "Aprobada", variant: "success" };
  }

  const hoy = fechaHoy();
  const aprobadas  = vacaciones.filter(v => v.fecha_inicio > hoy).length;
  const pendientes = vacaciones.filter(v => v.fecha_inicio <= hoy && v.fecha_fin >= hoy).length;
  const totalDias  = vacaciones.filter(v => v.fecha_inicio > hoy).reduce((acc, v) => acc + diasEntre(v.fecha_inicio, v.fecha_fin), 0);

  const filtradas = vacaciones.filter(v => {
    const st = getEstado(v);
    if (tabFiltro === "pendientes") return st.variant === "warning" || st.variant === "info";
    if (tabFiltro === "aprobadas") return st.variant === "success";
    return true;
  });

  return (
    <div className="px-6 py-7 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-[26px] font-semibold text-fg font-display leading-tight">Ausencias</h1>
          <p className="text-[13px] text-fg3 mt-0.5">Vacaciones, asuntos personales y bajas del equipo</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={abrirModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accentfg text-[13px] font-semibold hover:bg-accent/90 transition-colors"
          >
            <Plus size={13} /> Nueva ausencia
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <KpiStrip items={[
        { label: "Aprobadas", value: aprobadas, sub: "próximos 90 días" },
        { label: "Pendientes", value: <span className="text-warning">{pendientes}</span>, sub: pendientes > 0 ? "requiere tu aprobación" : "Sin pendientes" },
        { label: "Días planificados", value: totalDias, sub: "en lo que queda de año" },
        { label: "Cobertura mínima", value: `${barberos.length > 0 ? Math.max(0, barberos.length - pendientes) : 0} / ${barberos.length}`, sub: "miembros disponibles" },
      ]} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div>
          <h2 className="text-[14px] font-semibold text-fg">Solicitudes y planificación</h2>
          <p className="text-[11.5px] text-fg4 mt-0.5">Filtra por estado y aprueba en bloque</p>
        </div>
        <div className="sm:ml-auto flex rounded-lg border border-line overflow-hidden bg-surface shadow-[var(--shadow-1)] self-start">
          {(["todas","pendientes","aprobadas"] as const).map((t, i) => (
            <button
              key={t}
              type="button"
              onClick={() => setTabFiltro(t)}
              className={`px-3.5 py-1.5 text-[12px] font-medium capitalize transition-colors ${
                tabFiltro === t ? "bg-selected text-fg" : "text-fg3 hover:text-fg hover:bg-hover"
              } ${i > 0 ? "border-l border-line" : ""}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Spinner /> : filtradas.length === 0 ? (
        <Empty
          msg="Sin ausencias registradas"
          icon={
            <div className="w-14 h-14 rounded-full bg-hover border border-line flex items-center justify-center">
              <CalendarDays size={24} className="text-fg4" />
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtradas.map(v => {
            const nombre = v.barberos?.nombre ?? "—";
            const st = getEstado(v);
            const dias = diasEntre(v.fecha_inicio, v.fecha_fin);
            const isPending = st.variant === "warning";
            return (
              <div key={v.id} className="bg-surface border border-line rounded-xl p-5 shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)] transition-all flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={nombre} size="md" />
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold text-fg truncate">{nombre}</p>
                      <p className="text-[11.5px] text-fg4">{v.barberos?.especialidad ?? "Barbero"}</p>
                    </div>
                  </div>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>

                {/* Period + days */}
                <div className="flex items-center gap-3 bg-bg rounded-lg px-3 py-2 border border-line2">
                  <CalendarDays size={13} className="text-fg4 flex-shrink-0" />
                  <div className="flex items-center gap-1 text-[12.5px] font-mono text-fg2 flex-1">
                    <span>{formatFechaCorta(v.fecha_inicio)}</span>
                    <ChevronRight size={11} className="text-fg4" />
                    <span>{formatFechaCorta(v.fecha_fin)}</span>
                  </div>
                  <span className="text-[11.5px] font-semibold text-fg3 tabular">{dias} días</span>
                </div>

                {/* Motivo */}
                {v.motivo && (
                  <p className="text-[12.5px] text-fg3 leading-snug">{v.motivo}</p>
                )}

                {/* Actions */}
                <div className="mt-auto flex items-center justify-between pt-2 border-t border-line2">
                  <button
                    type="button"
                    aria-label="Eliminar ausencia"
                    onClick={() => eliminar(v.id)}
                    className="flex items-center gap-1 text-[12px] text-danger hover:text-danger hover:bg-danger2 px-2 py-1 rounded-md transition-colors"
                  >
                    <Trash2 size={12} /> Eliminar
                  </button>
                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => rechazar(v.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-line text-fg3 text-[12px] font-medium hover:bg-hover transition-colors"
                      >
                        Rechazar
                      </button>
                      <button
                        type="button"
                        onClick={() => aprobar(v.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20 text-success text-[12px] font-semibold hover:bg-success/20 transition-colors"
                      >
                        <Check size={12} /> Aprobar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Registrar ausencia">
        <div className="space-y-4">
          <FormSelect label="Miembro" value={form.barbero_id} onChange={e => setForm(f => ({ ...f, barbero_id: e.target.value }))}>
            <option value="">Seleccionar miembro...</option>
            {barberos.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </FormSelect>
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Fecha inicio" type="date" value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} />
            <FormInput label="Fecha fin" type="date" value={form.fecha_fin} onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} />
          </div>
          <FormInput label="Motivo (opcional)" type="text" value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} placeholder="Ej. Vacaciones anuales" />
          {formError && <p className="text-[12px] text-danger bg-danger2 border border-danger/20 rounded-lg px-3 py-2">{formError}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-lg border border-line text-fg3 text-[13px] font-medium hover:bg-hover transition-colors">Cancelar</button>
            <button type="button" onClick={guardar} className="flex-1 py-2.5 rounded-lg bg-accent text-accentfg text-[13px] font-semibold hover:bg-accent/90 transition-colors">Guardar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── SECTION: ANALÍTICA ───────────────────────────────────────────────────────

function SectionAnalitica({ empresaId }: { empresaId: string }) {
  const [stats, setStats]     = useState<any>(null);
  const [periodo, setPeriodo] = useState<"1m"|"3m"|"6m"|"12m">("6m");

  useEffect(() => {
    async function cargar() {
      const hoy = fechaHoy();
      const inicioMes = hoy.substring(0, 7) + "-01";
      const now = new Date();
      const inicio12m = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString().split('T')[0];

      const [{ data: citasMes }, { data: serviciosTop }, { data: barberoStats }, { data: clientes }, { data: citasHistorico }] = await Promise.all([
        supabase.from("citas").select("estado, servicios(precio), fecha").eq("empresa_id", empresaId).gte("fecha", inicioMes).eq("estado", "confirmada"),
        supabase.from("citas").select("servicios(nombre)").eq("empresa_id", empresaId).eq("estado", "confirmada").gte("fecha", inicioMes),
        supabase.from("citas").select("barberos(nombre), servicios(precio)").eq("empresa_id", empresaId).eq("estado", "confirmada").gte("fecha", inicioMes),
        supabase.from("clientes").select("id").eq("empresa_id", empresaId),
        supabase.from("citas").select("fecha, servicios(precio)").eq("empresa_id", empresaId).eq("estado", "confirmada").gte("fecha", inicio12m),
      ]);

      const ingresosMes = (citasMes || []).reduce((acc: number, c: any) => acc + parseFloat(c.servicios?.precio || 0), 0);
      const countCitas = citasMes?.length || 0;
      const ticketPromedio = countCitas > 0 ? ingresosMes / countCitas : 0;

      const countServicios: Record<string, number> = {};
      (serviciosTop || []).forEach((c: any) => {
        const n = c.servicios?.nombre; if (n) countServicios[n] = (countServicios[n] || 0) + 1;
      });

      const barberoData: Record<string, { count: number; revenue: number }> = {};
      (barberoStats || []).forEach((c: any) => {
        const n = c.barberos?.nombre;
        if (n) {
          if (!barberoData[n]) barberoData[n] = { count: 0, revenue: 0 };
          barberoData[n].count++;
          barberoData[n].revenue += parseFloat(c.servicios?.precio || 0);
        }
      });

      const totalServicios = Object.values(countServicios).reduce((a, b) => a + b, 0);
      const sortedServicios = Object.entries(countServicios).sort((a, b) => b[1] - a[1]) as [string, number][];

      // Tendencia: agrupar ingresos por mes (últimos 12)
      const MESES_CORTOS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
      const trendLabels12m: string[] = [];
      const monthlyRevenue: Record<string, number> = {};
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyRevenue[key] = 0;
        trendLabels12m.push(MESES_CORTOS[d.getMonth()]);
      }
      (citasHistorico || []).forEach((c: any) => {
        const key = c.fecha?.substring(0, 7);
        if (key && key in monthlyRevenue) {
          monthlyRevenue[key] += parseFloat(c.servicios?.precio || 0);
        }
      });
      const trendData12m = Object.values(monthlyRevenue);

      setStats({ ingresosMes, countCitas, ticketPromedio, nuevosClientes: clientes?.length || 0, countServicios, sortedServicios, totalServicios, barberoData, trendLabels12m, trendData12m });
    }
    cargar();
  }, [empresaId]);

  if (!stats) return <div className="px-6 py-7"><Spinner /></div>;

  const sortedBarberos = Object.entries(stats.barberoData)
    .sort((a: any, b: any) => b[1].revenue - a[1].revenue) as [string, { count: number; revenue: number }][];

  const monthsToShow = periodo === "1m" ? 1 : periodo === "3m" ? 3 : periodo === "6m" ? 6 : 12;
  const chartNums = stats.trendData12m.slice(-monthsToShow) as number[];
  const chartLabels = stats.trendLabels12m.slice(-monthsToShow) as string[];

  const chartMax = Math.max(...chartNums, 1);
  const chartW = 600, chartH = 160;
  const pts = chartNums.map((v, i) => {
    const x = chartNums.length === 1 ? chartW / 2 : (i / (chartNums.length - 1)) * chartW;
    const y = chartH - (v / chartMax) * (chartH - 20) - 4;
    return [x, y];
  });
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length-1][0]} ${chartH} L ${pts[0][0]} ${chartH} Z`;
  const lastPt = pts[pts.length - 1];

  // Donut
  const donutColors = [
    "var(--color-accent)", "var(--color-success)", "var(--color-warning)",
    "var(--color-info)", "var(--color-fg3)",
  ];
  const r = 52, cxy = 68, strokeW = 14;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const donutTotal = stats.totalServicios || 1;
  const donutSlices = stats.sortedServicios.slice(0, 5).map(([nombre, count]: [string, number], i: number) => {
    const pct = count / donutTotal;
    const slice = { nombre, count, pct, dashOffset: offset, color: donutColors[i] };
    offset += pct * circ;
    return slice;
  });

  const sparkVals = [40, 55, 48, 62, 70, 65, 80, 75, 88, 92, 85, 90];

  return (
    <div className="px-4 sm:px-6 py-5 sm:py-7 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-semibold text-fg font-display leading-tight">Analítica</h1>
          <p className="text-[13px] text-fg3 mt-0.5">Rendimiento del centro · últimos 6 meses</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          <button type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line bg-surface text-fg2 text-[12.5px] sm:text-[13px] font-medium hover:bg-hover transition-colors whitespace-nowrap">
            <CalendarDays size={13} className="flex-shrink-0" /> <span className="hidden xs:inline">Personalizar </span>periodo
          </button>
          <button type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line bg-surface text-fg2 text-[12.5px] sm:text-[13px] font-medium hover:bg-hover transition-colors whitespace-nowrap">
            <Download size={13} className="flex-shrink-0" /> <span className="hidden xs:inline">Descargar </span>informe
          </button>
        </div>
      </div>

      {/* KPI hero + secundarios */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
        {/* Hero — ingresos */}
        <div
          className="col-span-2 lg:col-span-1 bg-surface border border-line rounded-xl p-4 sm:p-5 shadow-[var(--shadow-2)]"
        >
          <p className="text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-widest text-fg4 mb-2">Ingresos · mes en curso</p>
          <p className="font-semibold text-fg font-display tabular text-[28px] leading-[1.1]">
            {formatEUR(stats.ingresosMes)} <span className="text-fg4 text-[18px]">€</span>
          </p>
          <div className="flex items-center gap-1.5 mt-2 mb-3 flex-wrap">
            <TrendingUp size={13} className="text-success flex-shrink-0" />
            <span className="text-[12px] font-semibold text-success">+8,6%</span>
            <span className="text-[11.5px] text-fg4">vs. marzo · obj. 16.200 €</span>
          </div>
          <div className="h-px bg-line2 mb-3" />
          <div className="grid grid-cols-3 gap-1 text-center">
            <div>
              <p className="text-[10px] sm:text-[11px] text-fg4">Ticket</p>
              <p className="text-[11.5px] sm:text-[12.5px] font-mono font-medium text-fg2 tabular">{formatEUR(stats.ticketPromedio)} €</p>
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] text-fg4">Citas</p>
              <p className="text-[11.5px] sm:text-[12.5px] font-medium text-fg2 tabular">{stats.countCitas}</p>
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] text-fg4">Retención</p>
              <p className="text-[11.5px] sm:text-[12.5px] font-medium text-fg2">72%</p>
            </div>
          </div>
        </div>

        {/* Citas del mes */}
        <div className="bg-surface border border-line rounded-xl p-4 sm:p-5 shadow-[var(--shadow-1)]">
          <p className="text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-widest text-fg4 mb-2">Citas del mes</p>
          <p className="text-[26px] sm:text-[28px] font-semibold text-fg tabular">{stats.countCitas}</p>
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            <TrendingUp size={12} className="text-success flex-shrink-0" />
            <span className="text-[12px] text-success">+12%</span>
            <span className="text-[11.5px] text-fg4 ml-1">{Math.round(stats.countCitas * 0.06)} nuevas</span>
          </div>
        </div>

        {/* Clientes nuevos */}
        <div className="bg-surface border border-line rounded-xl p-4 sm:p-5 shadow-[var(--shadow-1)]">
          <p className="text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-widest text-fg4 mb-2">Clientes nuevos</p>
          <p className="text-[26px] sm:text-[28px] font-semibold text-fg tabular">{stats.nuevosClientes}</p>
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            <TrendingUp size={12} className="text-success flex-shrink-0" />
            <span className="text-[12px] text-success">+4</span>
            <span className="text-[11.5px] text-fg4 ml-1">vs. 22 en marzo</span>
          </div>
        </div>

        {/* Tasa de cancelación */}
        <div className="bg-surface border border-line rounded-xl p-4 sm:p-5 shadow-[var(--shadow-1)]">
          <p className="text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-widest text-fg4 mb-2">Tasa de cancelación</p>
          <p className="text-[26px] sm:text-[28px] font-semibold text-fg tabular">3,2%</p>
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            <TrendingDown size={12} className="text-success flex-shrink-0" />
            <span className="text-[12px] text-success">-0,8 pp</span>
            <span className="text-[11.5px] text-fg4 ml-1">obj. &lt; 5%</span>
          </div>
        </div>
      </div>

      {/* Chart + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5 mb-4 sm:mb-5">
        {/* Tendencia de ingresos */}
        <div className="lg:col-span-3 bg-surface border border-line rounded-xl p-4 sm:p-5 shadow-[var(--shadow-1)]">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-[14px] font-semibold text-fg">Tendencia de ingresos</h2>
              <p className="hidden sm:block text-[11.5px] text-fg4 mt-0.5">Línea sólida = periodo actual · Punteada = mismo periodo año anterior</p>
            </div>
            <div className="flex rounded-lg border border-line overflow-hidden bg-bg">
              {(["1m","3m","6m","12m"] as const).map((p, i) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriodo(p)}
                  className={`px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                    periodo === p ? "bg-selected text-fg" : "text-fg3 hover:text-fg hover:bg-hover"
                  } ${i > 0 ? "border-l border-line" : ""}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* SVG chart */}
          <div className="relative rounded-lg" style={{ height: chartH + 24 }}>
            {/* Y-axis labels — flex h-0 trick: items at 0px height so justify-between places
                centers at exact grid-line intervals (top=16px, span=140px, gap=35px each) */}
            <div className="absolute top-4 left-0 h-[140px] flex flex-col justify-between pointer-events-none">
              {[100, 75, 50, 25, 0].map(pct => {
                const val = chartMax * pct / 100;
                const label = val >= 1000
                  ? `${(val / 1000).toFixed(val >= 10000 ? 0 : 1).replace(/\.0$/, '')}k`
                  : Math.round(val).toString();
                return (
                  <span key={pct} className="h-0 overflow-visible -translate-y-1/2 text-[9px] font-mono text-fg4 leading-none whitespace-nowrap">
                    {label}
                  </span>
                );
              })}
            </div>

            {/* Chart area (offset right to leave room for Y labels) */}
            <div className="absolute inset-0 left-9">
              <svg width="100%" height={chartH + 24} viewBox={`0 0 ${chartW} ${chartH + 24}`} preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map(pct => {
                  const y = chartH - (pct / 100) * (chartH - 20) - 4;
                  return (
                    <line key={pct} x1={0} y1={y} x2={chartW} y2={y}
                      stroke="var(--color-line2)" strokeWidth="1" strokeDasharray="4 4" />
                  );
                })}
                {/* Area fill */}
                <path d={areaPath} fill="var(--color-accent)" fillOpacity="0.07" />
                {/* Trend line */}
                <path d={linePath} stroke="var(--color-accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                {/* Last point annotation */}
                {lastPt && (
                  <>
                    <circle cx={lastPt[0]} cy={lastPt[1]} r="4" fill="var(--color-accent)" />
                    <circle cx={lastPt[0]} cy={lastPt[1]} r="7" fill="var(--color-accent)" fillOpacity="0.2" />
                  </>
                )}
              </svg>

              {/* X-axis labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
                {chartLabels.map((l: string, i: number) => (
                  <span key={i} className="text-[10px] font-mono text-fg4">{l}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mix de servicios */}
        <div className="lg:col-span-2 bg-surface border border-line rounded-xl p-4 sm:p-5 shadow-[var(--shadow-1)]">
          <h2 className="text-[14px] font-semibold text-fg mb-1">Mix de servicios</h2>
          <p className="text-[11.5px] text-fg4 mb-4">Reservas del mes en curso</p>

          {donutSlices.length === 0 ? (
            <Empty msg="Sin datos este mes" />
          ) : (
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Donut SVG */}
              <div className="relative flex-shrink-0">
                <svg width="120" height="120" viewBox="0 0 136 136">
                  <circle cx={cxy} cy={cxy} r={r} fill="none" stroke="var(--color-line2)" strokeWidth={strokeW} />
                  {donutSlices.map((s: any, i: number) => (
                    <circle
                      key={i}
                      cx={cxy} cy={cxy} r={r}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={strokeW}
                      strokeDasharray={`${s.pct * circ} ${circ}`}
                      strokeDashoffset={-s.dashOffset}
                      transform={`rotate(-90 ${cxy} ${cxy})`}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-[18px] font-semibold text-fg tabular">{donutTotal}</p>
                  <p className="text-[10px] text-fg4">reservas</p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-2">
                {donutSlices.map((s: any, i: number) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      <span className="text-[12px] text-fg2 truncate">{s.nombre}</span>
                    </div>
                    <span className="text-[12px] font-medium text-fg2 tabular flex-shrink-0">
                      {s.count} <span className="text-fg4">{Math.round(s.pct * 100)}%</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rendimiento por barbero */}
      <div className="bg-surface border border-line rounded-xl overflow-hidden shadow-[var(--shadow-1)]">
        <div className="px-4 sm:px-5 py-3.5 border-b border-line">
          <h2 className="text-[14px] font-semibold text-fg">Rendimiento por barbero</h2>
          <p className="text-[11.5px] text-fg4 mt-0.5">Comparativa frente al mes anterior</p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[520px]">
            <div className="grid grid-cols-[2rem_1fr_6rem_8rem_7rem_7rem] px-4 sm:px-5 py-2.5 border-b border-line bg-bg2">
              <THead>#</THead>
              <THead>Miembro</THead>
              <THead>Citas</THead>
              <THead>Ingresos</THead>
              <THead>Δ mes ant.</THead>
              <THead>Tendencia</THead>
            </div>

            {sortedBarberos.length === 0 ? (
              <Empty msg="Sin datos este mes" />
            ) : (
              sortedBarberos.map(([nombre, data], i) => {
                const delta = [+75, +50, +30, +10][i] ?? 0;
                return (
                  <div
                    key={nombre}
                    className="grid grid-cols-[2rem_1fr_6rem_8rem_7rem_7rem] min-h-[var(--row-h)] px-4 sm:px-5 items-center border-b border-line2 last:border-b-0 hover:bg-hover transition-colors"
                  >
                    <span className="text-[12px] font-mono text-fg4 tabular">{i + 1}</span>

                    <div className="flex items-center gap-2.5">
                      <Avatar name={nombre} size="sm" />
                      <span className="text-[13px] font-medium text-fg truncate">{nombre}</span>
                    </div>

                    <span className="text-[13px] tabular text-fg2">{data.count}</span>

                    <span className="text-[13px] font-mono tabular text-fg2">
                      {formatEUR(data.revenue)} <span className="text-fg4">€</span>
                    </span>

                    <span className={`text-[13px] font-medium tabular ${delta >= 0 ? "text-success" : "text-danger"}`}>
                      {delta >= 0 ? "+" : ""}{delta},0%
                    </span>

                    <Sparkline values={sparkVals.slice(0, 8 + i * 2)} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function Dashboard({ empresaId, seccion }: { empresaId: string; seccion: string }) {
  const [toastState, setToastState] = useState({ msg: "", type: "success" });

  function showToast(msg: string, type = "success") {
    setToastState({ msg, type });
    setTimeout(() => setToastState({ msg: "", type: "success" }), 3000);
  }

  return (
    <div style={{ fontFamily: 'var(--font-ui)' }}>
      {seccion === "citas"     && <SectionCitas     toast={showToast} empresaId={empresaId} />}
      {seccion === "equipo"    && <SectionEquipo    toast={showToast} empresaId={empresaId} />}
      {seccion === "servicios" && <SectionServicios toast={showToast} empresaId={empresaId} />}
      {seccion === "horarios"  && <SectionHorarios  toast={showToast} empresaId={empresaId} />}
      {seccion === "ausencias" && <SectionAusencias toast={showToast} empresaId={empresaId} />}
      {seccion === "analitica" && <SectionAnalitica empresaId={empresaId} />}
      <Toast message={toastState.msg} type={toastState.type} />
    </div>
  );
}
