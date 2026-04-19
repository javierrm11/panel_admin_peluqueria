'use client'
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

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

const AVATAR_COLORS = [
  "bg-avatar-1", "bg-avatar-2", "bg-avatar-3",
  "bg-avatar-4", "bg-avatar-5", "bg-avatar-6",
];

const SERVICIO_ICONS = ["✂️", "🪒", "💆", "🧴", "💈", "🪮"];

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
  return {
    inicio: lunes.toISOString().split("T")[0],
    fin: domingo.toISOString().split("T")[0],
  };
}

function formatFecha(fecha: string) {
  if (!fecha) return "";
  const [y, m, d] = fecha.split("-");
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${d} ${meses[parseInt(m) - 1]}, ${y}`;
}

function avatarColor(name: string) {
  return AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
      {children}
    </p>
  );
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sz = { sm: "w-6 h-6 text-[10px]", md: "w-9 h-9 text-sm", lg: "w-11 h-11 text-base" }[size];
  return (
    <div className={`${sz} ${avatarColor(name)} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {name?.[0] ?? "?"}
    </div>
  );
}

function StatusBadge({ estado }: { estado: string }) {
  return estado === "confirmada" ? (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-success/15 text-success border border-success/20">
      Confirmada
    </span>
  ) : (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-danger/15 text-danger border border-danger/20">
      Cancelada
    </span>
  );
}

function ActiveBadge({ activo }: { activo: boolean }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
      activo
        ? "bg-success/15 text-success border-success/20"
        : "bg-surface-3 text-muted border-edge"
    }`}>
      {activo ? "Activo" : "Inactivo"}
    </span>
  );
}

function Input({
  label, suffix, className = "", ...props
}: { label?: string; suffix?: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <Label>{label}</Label>}
      <div className="relative">
        <input
          className="w-full bg-surface-3 border border-edge rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition"
          {...props}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-xs font-bold">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function Modal({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface-2 border border-edge rounded-3xl shadow-2xl w-full max-w-md mx-4 p-7"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-white text-xl">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-white hover:bg-surface-3 transition text-lg leading-none"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Toast({ message, type = "success" }: { message: string; type?: string }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-surface-2 border border-edge text-white text-sm font-semibold px-5 py-3.5 rounded-2xl shadow-2xl">
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
        type === "success" ? "bg-success" : "bg-danger"
      }`}>
        {type === "success" ? "✓" : "✕"}
      </span>
      {message}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-6 h-6 border-2 border-edge border-t-brand rounded-full animate-spin" />
      <p className="text-sm text-muted">Cargando...</p>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="py-20 text-center text-muted text-sm">{msg}</div>
  );
}

// ─── TABLE HEADER CELL ────────────────────────────────────────────────────────

function TH({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-[10px] font-bold text-muted uppercase tracking-widest ${className}`}>
      {children}
    </span>
  );
}

// ─── SECTION: CITAS ───────────────────────────────────────────────────────────

type CitaVista = "hoy" | "semana" | "mes";

function fechaMes() {
  const hoy = new Date();
  const inicio = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
  return { inicio, fin: hoy.toISOString().split("T")[0] };
}

function formatHora12(hora: string) {
  if (!hora) return { time: "—", period: "" };
  const [h, m] = hora.split(":");
  const hour = parseInt(h);
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return { time: `${String(h12).padStart(2, "0")}:${m}`, period };
}

function fechaAgendaLabel() {
  const now = new Date();
  const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  return `${dias[now.getDay()]}, ${now.getDate()} ${meses[now.getMonth()].toUpperCase()}`;
}

function CitaStatusPill({ estado }: { estado: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    confirmada: { label: "Confirmada", cls: "bg-success/15 text-success border-success/20" },
    pendiente:  { label: "Pendiente",  cls: "bg-surface-3 text-muted border-edge" },
    cancelada:  { label: "Cancelada",  cls: "bg-danger/15 text-danger border-danger/20" },
  };
  const s = map[estado] ?? { label: estado, cls: "bg-surface-3 text-muted border-edge" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${s.cls}`}>
      {s.label}
    </span>
  );
}

const VISTAS_CITAS: { id: CitaVista; label: string }[] = [
  { id: "hoy",    label: "Hoy" },
  { id: "semana", label: "Esta semana" },
  { id: "mes",    label: "Este mes" },
];

const PER_PAGE = 10;

function SectionCitas({ toast, empresaId }: { toast: (m: string, t?: string) => void; empresaId: string }) {
  const [vista, setVista] = useState<CitaVista>("hoy");
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

  const cargar = useCallback(async () => {
    setLoading(true);
    setPage(0);
    const { inicio, fin } = vista === "hoy"
      ? { inicio: fechaHoy(), fin: fechaHoy() }
      : vista === "semana"
      ? fechaSemana()
      : fechaMes();
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
    toast("Cita cancelada correctamente", "success");
    cargar();
  }

  const confirmadas = citas.filter(c => c.estado === "confirmada");
  const canceladas  = citas.filter(c => c.estado === "cancelada");
  const proxima     = confirmadas[0];
  const ocupacion   = citas.length > 0 ? Math.round((confirmadas.length / citas.length) * 100) : 0;
  const totalPages  = Math.max(1, Math.ceil(citas.length / PER_PAGE));
  const pageCitas   = citas.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h2 className="text-3xl font-black text-white">Gestión de Citas</h2>
          <p className="text-sm text-muted mt-1">Administra el flujo de trabajo de hoy y visualiza las reservas de la semana.</p>
        </div>
        <div className="flex bg-surface-2 border border-edge rounded-2xl p-1 gap-0.5">
          {VISTAS_CITAS.map(v => (
            <button
              type="button"
              key={v.id}
              onClick={() => setVista(v.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
                vista === v.id
                  ? "bg-brand text-white shadow"
                  : "text-muted hover:text-white"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Next appointment */}
        <div className="bg-surface-2 border border-edge rounded-2xl p-5 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Label>Próxima Cita</Label>
            <div className="mt-3">
              {proxima ? (
                <>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-3xl font-black text-white leading-none">
                      {formatHora12(proxima.hora).time}
                    </p>
                    <span className="text-sm font-bold text-muted">{formatHora12(proxima.hora).period}</span>
                  </div>
                  <p className="text-xs text-muted mt-2 truncate">
                    {proxima.servicios?.nombre} — {proxima.barberos?.nombre}
                  </p>
                </>
              ) : (
                <p className="text-3xl font-black text-muted leading-none">—</p>
              )}
            </div>
          </div>
          <div className="w-10 h-10 bg-surface-3 border border-edge rounded-xl flex items-center justify-center text-muted flex-shrink-0 ml-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Confirmed */}
        <div className="bg-surface-2 border border-edge rounded-2xl p-5 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Label>Confirmadas</Label>
            <p className="text-4xl font-black text-white mt-3 leading-none">{confirmadas.length}</p>
            <p className="text-xs text-muted mt-2">{ocupacion}% de ocupación</p>
          </div>
          <div className="w-10 h-10 bg-success/15 border border-success/20 rounded-xl flex items-center justify-center text-success flex-shrink-0 ml-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Cancelled */}
        <div className="bg-surface-2 border border-edge rounded-2xl p-5 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Label>Canceladas</Label>
            <p className="text-4xl font-black text-white mt-3 leading-none">{canceladas.length}</p>
            <p className="text-xs text-muted mt-2">
              {citas.length > 0 ? `${Math.round((canceladas.length / citas.length) * 100)}% del total` : "Sin citas"}
            </p>
          </div>
          <div className="w-10 h-10 bg-danger/15 border border-danger/20 rounded-xl flex items-center justify-center text-danger flex-shrink-0 ml-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-2 border border-edge rounded-2xl overflow-hidden">
        {/* Table title */}
        <div className="px-6 py-4 border-b border-edge flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Agenda Detallada</h3>
            <p className="text-[10px] text-muted uppercase tracking-widest mt-0.5">{fechaAgendaLabel()}</p>
          </div>
        </div>

        {/* Headers */}
        <div className="grid px-6 py-3 border-b border-edge" style={{ gridTemplateColumns: "7rem 1fr 9rem 10rem 8rem 6rem" }}>
          <TH>Hora</TH>
          <TH>Servicio</TH>
          <TH>Barbero</TH>
          <TH>Cliente</TH>
          <TH>Estado</TH>
          <TH className="text-center">Acción</TH>
        </div>

        {loading ? <Spinner /> : citas.length === 0 ? (
          <Empty msg="No hay citas para este período" />
        ) : (
          <>
            {pageCitas.map((c, i) => {
              const cancelada = c.estado === "cancelada";
              const { time, period } = formatHora12(c.hora);
              const duracion = c.servicios?.duracion_minutos;
              const clienteNombre = c.clientes?.nombre || c.clientes?.telefono || "—";
              return (
                <div
                  key={c.id}
                  className={`grid px-6 py-4 items-center transition-colors hover:bg-surface-3/40 ${
                    i < pageCitas.length - 1 ? "border-b border-edge/50" : ""
                  } ${cancelada ? "opacity-50" : ""}`}
                  style={{ gridTemplateColumns: "7rem 1fr 9rem 10rem 8rem 6rem" }}
                >
                  {/* TIME */}
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-sm font-bold text-white ${cancelada ? "line-through" : ""}`}>{time}</span>
                      <span className="text-[10px] text-muted font-semibold">{period}</span>
                    </div>
                    {duracion && (
                      <p className="text-[10px] text-muted mt-0.5">{duracion} min</p>
                    )}
                  </div>

                  {/* SERVICE */}
                  <div className="flex items-center gap-2.5 pr-4 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-surface-3 border border-edge flex items-center justify-center text-base flex-shrink-0">
                      {SERVICIO_ICONS[0]}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold text-white truncate ${cancelada ? "line-through" : ""}`}>
                        {c.servicios?.nombre}
                      </p>
                      <p className="text-[10px] text-muted mt-0.5">{c.servicios?.precio} €</p>
                    </div>
                  </div>

                  {/* BARBER */}
                  <div className="flex items-center gap-2">
                    <Avatar name={c.barberos?.nombre || "?"} size="sm" />
                    <p className="text-sm text-muted-light font-medium truncate">{c.barberos?.nombre}</p>
                  </div>

                  {/* CLIENT */}
                  <div>
                    <p className={`text-sm font-semibold text-white truncate ${cancelada ? "line-through" : ""}`}>
                      {clienteNombre}
                    </p>
                    {c.clientes?.nombre && (
                      <p className="text-[10px] text-muted mt-0.5">{c.clientes?.telefono}</p>
                    )}
                  </div>

                  {/* STATUS */}
                  <div>
                    <CitaStatusPill estado={c.estado} />
                  </div>

                  {/* ACTIONS */}
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      title="Editar"
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-3 border border-edge text-muted hover:text-white hover:border-edge-light transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {cancelada ? (
                      <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-3 border border-edge text-muted cursor-not-allowed">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                        </svg>
                      </div>
                    ) : (
                      <button
                        type="button"
                        title="Cancelar cita"
                        onClick={() => cancelar(c.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-edge">
              <p className="text-xs text-muted">
                Mostrando {citas.length === 0 ? 0 : page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, citas.length)} de {citas.length} citas
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 0}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-3 border border-edge text-muted hover:text-white hover:border-edge-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages - 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-3 border border-edge text-muted hover:text-white hover:border-edge-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── SECTION: BARBEROS ────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative w-10 h-[22px] rounded-full transition-colors flex-shrink-0 ${
        checked ? "bg-brand" : "bg-surface-3 border border-edge"
      }`}
    >
      <span className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
        checked ? "translate-x-[18px]" : "translate-x-0"
      }`} />
    </button>
  );
}

const BARBERO_GRADIENTS: [string, string][] = [
  ["#7c3aed", "#2d1060"],
  ["#2563eb", "#0c2461"],
  ["#059669", "#022c22"],
  ["#d97706", "#451a03"],
  ["#e11d48", "#4c0519"],
  ["#0d9488", "#042f2e"],
];

function barberoGradient(nombre: string): [string, string] {
  return BARBERO_GRADIENTS[(nombre?.charCodeAt(0) || 0) % BARBERO_GRADIENTS.length];
}

function BarberoCard({
  barbero,
  onEdit,
  onToggle,
}: {
  barbero: any;
  onEdit: (b: any) => void;
  onToggle: (b: any) => void;
}) {
  const [from, to] = barberoGradient(barbero.nombre);
  const initials = barbero.nombre
    .split(" ")
    .map((w: string) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-surface-2 border border-edge rounded-2xl overflow-hidden flex flex-col">
      {/* Image / gradient avatar area */}
      <div
        className="relative h-48 flex items-center justify-center flex-shrink-0"
        style={{ background: `linear-gradient(145deg, ${from} 0%, ${to} 100%)` }}
      >
        <span className="text-6xl font-black select-none" style={{ color: "rgba(255,255,255,0.15)" }}>
          {initials}
        </span>
        {/* Status badge */}
        <div className={`absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm border ${
          barbero.activo
            ? "bg-success/20 border-success/30 text-success"
            : "bg-surface-3/70 border-edge text-muted"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${barbero.activo ? "bg-success" : "bg-muted"}`} />
          {barbero.activo ? "Active" : "Inactive"}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1">
        <p className="font-bold text-white text-[15px] leading-tight">{barbero.nombre}</p>
        <p className="text-xs text-muted mt-0.5">Barbero Profesional</p>

        {/* Actions */}
        <div className="flex items-center gap-1.5 mt-4">
          <button
            type="button"
            onClick={() => onEdit(barbero)}
            title="Editar"
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-3 border border-edge text-muted hover:text-white hover:border-edge-light transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            title="Historial"
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-3 border border-edge text-muted hover:text-white hover:border-edge-light transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="ml-auto">
            <Toggle checked={barbero.activo} onChange={() => onToggle(barbero)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionBarberos({ toast, empresaId }: { toast: (m: string, t?: string) => void; empresaId: string }) {
  const [barberos, setBarberos]         = useState<any[]>([]);
  const [servicios, setServicios]       = useState<any[]>([]);
  const [modal, setModal]               = useState(false);
  const [editando, setEditando]         = useState<any>(null);
  const [nombre, setNombre]             = useState("");
  const [selServicios, setSelServicios] = useState<number[]>([]);
  const [loading, setLoading]           = useState(false);
  const [topBarbero, setTopBarbero]     = useState<string | null>(null);

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
      .select("barberos(nombre)")
      .eq("empresa_id", empresaId)
      .eq("estado", "confirmada")
      .gte("fecha", inicioMes);
    if (citasMes?.length) {
      const count: Record<string, number> = {};
      (citasMes as any[]).forEach(c => {
        const n = c.barberos?.nombre;
        if (n) count[n] = (count[n] || 0) + 1;
      });
      const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
      setTopBarbero(top?.[0] ?? null);
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

  function toggleServicio(id: number) {
    setSelServicios(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
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
      await supabase.from("barbero_servicios").insert(
        selServicios.map(sid => ({ barbero_id: barberoId, servicio_id: sid }))
      );
    }
    toast(editando ? "Barbero actualizado" : "Barbero creado", "success");
    setModal(false);
    cargar();
  }

  async function toggleActivo(b: any) {
    await supabase.from("barberos").update({ activo: !b.activo }).eq("id", b.id);
    toast(`Barbero ${b.activo ? "desactivado" : "activado"}`, "success");
    cargar();
  }

  const activos = barberos.filter(b => b.activo).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <Label>Gestión de Personal</Label>
          <h2 className="text-3xl font-black text-white mt-1">Nuestros Maestros</h2>
        </div>
        <button
          type="button"
          onClick={() => abrirModal()}
          className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-4 py-2.5 rounded-2xl text-sm font-semibold transition shadow-lg shadow-brand-glow"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M12 3a4 4 0 110 8 4 4 0 010-8zM19 8v6M22 11h-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Nuevo Barbero
        </button>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* Card grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {barberos.map(b => (
              <BarberoCard key={b.id} barbero={b} onEdit={abrirModal} onToggle={toggleActivo} />
            ))}
            {/* Add new member */}
            <button
              type="button"
              onClick={() => abrirModal()}
              className="bg-surface-2 border border-dashed border-edge-light rounded-2xl flex flex-col items-center justify-center gap-3 p-6 hover:border-brand/40 hover:bg-surface-3/50 transition-colors min-h-[240px]"
            >
              <div className="w-12 h-12 rounded-full bg-surface-3 border border-edge flex items-center justify-center text-muted group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest text-center leading-relaxed">
                Agregar Nuevo<br />Miembro
              </p>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Performance summary */}
            <div className="bg-surface-2 border border-edge rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Resumen de Desempeño</p>
                <button type="button" className="text-muted hover:text-white transition-colors text-lg leading-none tracking-widest">⋯</button>
              </div>
              <div className="space-y-4">
                {topBarbero ? (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex-shrink-0" style={{ background: `linear-gradient(135deg, ${barberoGradient(topBarbero)[0]}, ${barberoGradient(topBarbero)[1]})` }}>
                      <div className="w-full h-full flex items-center justify-center text-xs font-black text-white/60">
                        {topBarbero.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{topBarbero}</p>
                      <p className="text-[10px] text-muted uppercase tracking-wide mt-0.5">Top Citas del Mes</p>
                    </div>
                    <span className="text-xs font-bold text-success flex-shrink-0">↑ Top</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted">Sin datos este mes</p>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-surface-3 border border-edge rounded-lg flex items-center justify-center flex-shrink-0 text-base">
                    ⭐
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">Equipo Activo</p>
                    <p className="text-[10px] text-muted uppercase tracking-wide mt-0.5">
                      {activos} de {barberos.length} disponibles
                    </p>
                  </div>
                  <span className="text-xs font-bold text-muted flex-shrink-0">
                    {barberos.length > 0 ? Math.round((activos / barberos.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Total members */}
            <div className="bg-surface-2 border border-edge rounded-2xl p-5">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Total Miembros del Equipo</p>
              <div className="flex items-baseline gap-2 mt-3">
                <p className="text-5xl font-black text-white">{barberos.length}</p>
                {activos > 0 && (
                  <span className="text-sm font-bold text-success">+{activos} Activos</span>
                )}
              </div>
              <p className="text-xs text-muted mt-3 leading-relaxed">
                {barberos.length === 0
                  ? "Aún no hay barberos registrados. ¡Agrega el primero!"
                  : `${activos} barbero${activos !== 1 ? "s" : ""} disponible${activos !== 1 ? "s" : ""} para recibir citas. Mantén tu equipo optimizado.`
                }
              </p>
            </div>
          </div>
        </>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar Barbero" : "Nuevo Barbero"}>
        <div className="space-y-5">
          <Input
            label="Nombre Completo"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej. Carlos Ruiz"
          />
          <div>
            <Label>Servicios Disponibles</Label>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {servicios.map(s => {
                const sel = selServicios.includes(s.id);
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleServicio(s.id)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium transition text-left border ${
                      sel
                        ? "bg-brand/20 border-brand/40 text-white"
                        : "bg-surface-3 border-edge text-muted-light hover:border-edge-light hover:text-white"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center ${
                      sel ? "border-brand bg-brand" : "border-muted"
                    }`}>
                      {sel && <span className="text-white text-[9px] font-black leading-none">✓</span>}
                    </span>
                    {s.nombre}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={guardar}
              className="flex-1 bg-brand hover:bg-brand-hover text-white py-3 rounded-2xl text-sm font-bold transition"
            >
              Guardar Perfil
            </button>
            <button
              type="button"
              onClick={() => setModal(false)}
              className="flex-1 border border-edge text-muted-light py-3 rounded-2xl text-sm font-semibold hover:bg-surface-3 hover:text-white transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── SECTION: SERVICIOS ───────────────────────────────────────────────────────

const SERVICE_VISUAL = [
  { icon: "✂️", from: "#7c3aed", to: "#2d1060" },
  { icon: "🪒", from: "#2563eb", to: "#0c2461" },
  { icon: "💆", from: "#059669", to: "#022c22" },
  { icon: "🧴", from: "#d97706", to: "#451a03" },
  { icon: "💈", from: "#e11d48", to: "#4c0519" },
  { icon: "🪮", from: "#0d9488", to: "#042f2e" },
];

function SectionServicios({ toast, empresaId }: { toast: (m: string, t?: string) => void; empresaId: string }) {
  const [servicios, setServicios]           = useState<any[]>([]);
  const [modal, setModal]                   = useState(false);
  const [editando, setEditando]             = useState<any>(null);
  const [form, setForm]                     = useState({ nombre: "", precio: "", duracion_minutos: "" });
  const [topServicio, setTopServicio]       = useState<{ nombre: string; count: number } | null>(null);
  const [rankingServicios, setRankingServicios] = useState<[string, number][]>([]);

  const cargar = useCallback(async () => {
    const { data } = await supabase.from("servicios").select("*").eq("empresa_id", empresaId).order("id");
    setServicios(data || []);

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
      const sorted = Object.entries(count).sort((a, b) => b[1] - a[1]) as [string, number][];
      setTopServicio(sorted[0] ? { nombre: sorted[0][0], count: sorted[0][1] } : null);
      setRankingServicios(sorted.slice(0, 3));
    }
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
    const payload = {
      nombre: form.nombre,
      precio: parseFloat(form.precio),
      duracion_minutos: parseInt(form.duracion_minutos),
    };
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
    if (error) {
      toast("No se puede eliminar: el servicio tiene citas asociadas", "error");
    } else {
      toast("Servicio eliminado", "success");
      cargar();
    }
  }

  const RANK_COLORS = ["bg-brand", "bg-success", "bg-warn"];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h2 className="text-4xl font-black text-white italic">Carta de Servicios</h2>
          <p className="text-sm text-muted mt-2 max-w-md leading-relaxed">
            Define y gestiona la experiencia premium que ofreces a tus clientes. Ajusta tiempos, precios y estilos con precisión.
          </p>
        </div>
        <button
          type="button"
          onClick={() => abrirModal()}
          className="flex items-center gap-2 border border-brand text-brand hover:bg-brand hover:text-white px-5 py-2.5 rounded-2xl text-sm font-semibold transition flex-shrink-0"
        >
          + Nuevo Servicio
        </button>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-5 items-start">
        {/* Main list */}
        <div className="flex-1 min-w-0">
          <div className="bg-surface-2 border border-edge rounded-2xl overflow-hidden">
            {/* Table header */}
            <div
              className="grid px-5 py-3 border-b border-edge items-center"
              style={{ gridTemplateColumns: "1fr 6.5rem 7rem 5rem" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs">✂️</span>
                <TH>Nombre del Servicio</TH>
              </div>
              <TH>Duración</TH>
              <TH>Precio</TH>
              <TH>Acciones</TH>
            </div>

            {servicios.length === 0 ? (
              <Empty msg="No hay servicios registrados" />
            ) : (
              servicios.map((s, i) => {
                const visual = SERVICE_VISUAL[i % SERVICE_VISUAL.length];
                return (
                  <div
                    key={s.id}
                    className={`grid px-5 py-4 items-center hover:bg-surface-3/40 transition-colors ${
                      i < servicios.length - 1 ? "border-b border-edge/50" : ""
                    }`}
                    style={{ gridTemplateColumns: "1fr 6.5rem 7rem 5rem" }}
                  >
                    {/* Name + icon */}
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${visual.from}, ${visual.to})` }}
                      >
                        {visual.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{s.nombre}</p>
                        <p className="text-xs text-muted mt-0.5">Servicio premium</p>
                      </div>
                    </div>

                    {/* Duration badge */}
                    <div>
                      <span className="text-[10px] font-bold bg-surface-3 border border-edge text-muted px-2.5 py-1 rounded-full whitespace-nowrap">
                        {s.duracion_minutos} MIN
                      </span>
                    </div>

                    {/* Price */}
                    <p className="text-xl font-black text-white">
                      {Number(s.precio).toFixed(2)} €
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => abrirModal(s)}
                        title="Editar"
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-3 border border-edge text-muted hover:text-white hover:border-edge-light transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminar(s.id)}
                        title="Eliminar"
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-52 flex-shrink-0 space-y-4">
          {/* Servicio estrella */}
          <div className="bg-surface-2 border border-edge rounded-2xl p-5">
            <p className="text-[10px] font-bold text-brand uppercase tracking-widest">Servicio Estrella</p>
            {topServicio ? (
              <>
                <h3 className="text-xl font-black text-white mt-2 leading-tight">{topServicio.nombre}</h3>
                <p className="text-xs text-muted mt-2 leading-relaxed">
                  El servicio más solicitado este mes. Considera destacarlo para clientes VIP.
                </p>
                <div className="flex items-center gap-1.5 mt-4">
                  <span className="text-xs font-bold text-success">↑ {topServicio.count}</span>
                  <span className="text-xs text-muted">citas este mes</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted mt-3">Sin datos este mes</p>
            )}
          </div>

          {/* Ranking */}
          <div className="bg-surface-2 border border-edge rounded-2xl p-5">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4">Más Populares</p>
            {rankingServicios.length > 0 ? (
              <div className="space-y-3">
                {rankingServicios.map(([nombre, count], idx) => (
                  <div key={nombre} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${RANK_COLORS[idx]}`} />
                      <span className="text-xs text-white truncate">{nombre}</span>
                    </div>
                    <span className="text-[10px] text-muted flex-shrink-0 font-semibold">{count} citas</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">Sin datos disponibles</p>
            )}
          </div>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar Servicio" : "Nuevo Servicio"}>
        <div className="space-y-4">
          <Input
            label="Nombre del Servicio"
            value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            placeholder="Corte Clásico"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Precio (€)"
              type="number"
              value={form.precio}
              onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
              placeholder="18.00"
              suffix="€"
            />
            <Input
              label="Duración (min)"
              type="number"
              value={form.duracion_minutos}
              onChange={e => setForm(f => ({ ...f, duracion_minutos: e.target.value }))}
              placeholder="30"
              suffix="MIN"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setModal(false)}
              className="flex-1 bg-surface-3 border border-edge text-muted-light py-3 rounded-2xl text-sm font-semibold hover:text-white hover:border-edge-light transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              className="flex-1 bg-brand hover:bg-brand-hover text-white py-3 rounded-2xl text-sm font-bold transition"
            >
              Guardar cambios
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── SECTION: HORARIOS ────────────────────────────────────────────────────────

function SlotTime({ h, onEdit, onDelete }: { h: any; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-surface-3 border border-edge rounded-lg px-3 py-2 group">
      <svg className="w-3.5 h-3.5 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
        <path strokeLinecap="round" d="M12 6v6l4 2" strokeWidth="1.5" />
      </svg>
      <span
        className="text-white text-sm font-mono font-semibold cursor-pointer hover:text-brand transition"
        onClick={onEdit}
      >
        {h.hora_inicio?.substring(0,5)}
      </span>
      <span className="text-muted text-sm mx-0.5">—</span>
      <span
        className="text-white text-sm font-mono font-semibold cursor-pointer hover:text-brand transition"
        onClick={onEdit}
      >
        {h.hora_fin?.substring(0,5)}
      </span>
      <button
        type="button"
        onClick={onDelete}
        className="ml-1 w-5 h-5 flex items-center justify-center text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition text-xs"
      >
        ✕
      </button>
    </div>
  );
}

function SectionHorarios({ toast, empresaId }: { toast: (m: string, t?: string) => void; empresaId: string }) {
  const [barberos, setBarberos]     = useState<any[]>([]);
  const [selBarbero, setSelBarbero] = useState<any>(null);
  const [horarios, setHorarios]     = useState<any[]>([]);
  const [modal, setModal]           = useState(false);
  const [editando, setEditando]     = useState<any>(null);
  const [form, setForm]             = useState({ dia_semana: 1, hora_inicio: "09:00", hora_fin: "18:00" });

  useEffect(() => {
    supabase.from("barberos").select("id, nombre").eq("activo", true).eq("empresa_id", empresaId).order("id")
      .then(({ data }) => {
        setBarberos(data || []);
        if (data?.length) setSelBarbero(data[0]);
      });
  }, [empresaId]);

  const cargarHorarios = useCallback(async (barberoId: number) => {
    const { data } = await supabase
      .from("horarios_barbero").select("*")
      .eq("barbero_id", barberoId)
      .order("dia_semana").order("hora_inicio");
    setHorarios(data || []);
  }, []);

  useEffect(() => {
    if (selBarbero) cargarHorarios(selBarbero.id);
  }, [selBarbero, cargarHorarios]);

  function abrirModal(h: any = null, diaPreset?: number) {
    setEditando(h?.id ? h : null);
    setForm(h?.id
      ? { dia_semana: h.dia_semana, hora_inicio: h.hora_inicio?.substring(0,5), hora_fin: h.hora_fin?.substring(0,5) }
      : { dia_semana: diaPreset ?? h?.dia_semana ?? 1, hora_inicio: "09:00", hora_fin: "18:00" }
    );
    setModal(true);
  }

  async function guardar() {
    const payload = { ...form, barbero_id: selBarbero.id, activo: true };
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
    cargarHorarios(selBarbero.id);
  }

  async function eliminarDia(diaId: number) {
    const ids = horarios.filter(h => h.dia_semana === diaId).map(h => h.id);
    if (!ids.length) return;
    await supabase.from("horarios_barbero").delete().in("id", ids);
    toast("Día eliminado", "success");
    cargarHorarios(selBarbero.id);
  }

  function copiarSemana() {
    toast("Próximamente: copiar semana", "info");
  }

  function guardarCambios() {
    toast("Cambios guardados", "success");
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-black tracking-widest text-white uppercase">
          Configuración de Horarios
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copiarSemana}
            className="flex items-center gap-2 bg-surface-2 border border-edge text-muted-light hover:text-white hover:border-edge-light px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeWidth="1.5" />
            </svg>
            Copiar semana
          </button>
          <button
            type="button"
            onClick={guardarCambios}
            className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-brand-glow"
          >
            Guardar cambios
          </button>
        </div>
      </div>

      {/* Barbero selector */}
      {barberos.length > 0 && (
        <div className="mb-8">
          <Label>Seleccionar Barbero</Label>
          <div className="flex gap-3 flex-wrap mt-3">
            {barberos.map(b => (
              <button
                type="button"
                key={b.id}
                onClick={() => setSelBarbero(b)}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition w-24 ${
                  selBarbero?.id === b.id
                    ? "border-brand bg-brand/10"
                    : "border-edge bg-surface-2 hover:border-edge-light"
                }`}
              >
                <div className="relative">
                  <Avatar name={b.nombre} size="lg" />
                  {selBarbero?.id === b.id && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full border-2 border-base" />
                  )}
                </div>
                <span className="text-[11px] font-bold text-white text-center leading-tight">{b.nombre}</span>
                <span className="text-[9px] text-brand uppercase font-bold tracking-wide leading-tight">
                  {b.especialidad || "Barbero"}
                </span>
              </button>
            ))}
            <button
              type="button"
              className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-dashed border-edge w-24 hover:border-edge-light transition"
            >
              <div className="w-11 h-11 rounded-full border-2 border-dashed border-edge flex items-center justify-center text-muted text-lg">
                +
              </div>
              <span className="text-[11px] text-muted">Añadir</span>
            </button>
          </div>
        </div>
      )}

      {/* Weekly availability */}
      {selBarbero && (
        <>
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-2xl font-black text-white">Disponibilidad Semanal</h2>
              <p className="text-sm text-muted mt-1">
                Configura los turnos y descansos para {selBarbero.nombre}.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {DIAS_SEMANA.map(dia => {
              const slots = horarios.filter(h => h.dia_semana === dia.id);
              const activo = slots.length > 0;

              return (
                <div
                  key={dia.id}
                  className={`flex items-center gap-4 border rounded-xl px-5 py-3.5 transition ${
                    activo
                      ? "bg-surface-2 border-edge"
                      : "bg-surface-2/50 border-edge/50"
                  }`}
                >
                  {/* Day label */}
                  <div className={`w-32 flex-shrink-0 pl-3 border-l-2 ${activo ? "border-brand" : "border-edge/40"}`}>
                    <p className={`text-sm font-bold ${activo ? "text-white" : "text-muted"}`}>
                      {dia.label}
                    </p>
                    {activo ? (
                      <p className="text-[10px] text-success font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-success" />
                        Activo
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted" />
                        Inactivo
                      </p>
                    )}
                  </div>

                  {/* Slots */}
                  <div className="flex-1 flex items-center gap-2 flex-wrap min-h-[36px]">
                    {activo ? (
                      <>
                        {slots.map(h => (
                          <SlotTime
                            key={h.id}
                            h={h}
                            onEdit={() => abrirModal(h)}
                            onDelete={() => eliminarSlot(h.id)}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={() => abrirModal(null, dia.id)}
                          className="text-xs text-muted hover:text-white font-semibold uppercase tracking-wider flex items-center gap-1 transition px-2 py-1"
                        >
                          + Añadir turno
                        </button>
                      </>
                    ) : (
                      <span className="text-sm text-muted italic">Consultor / Día libre</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!activo ? (
                      <button
                        type="button"
                        onClick={() => abrirModal(null, dia.id)}
                        className="text-[11px] text-brand border border-brand/30 bg-brand/10 px-3 py-1.5 rounded-lg hover:bg-brand/20 transition font-bold uppercase tracking-wider"
                      >
                        Habilitar
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => abrirModal(null, dia.id)}
                          className="w-8 h-8 bg-brand border border-brand/60 rounded-lg flex items-center justify-center text-white text-base hover:bg-brand-hover transition"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarDia(dia.id)}
                          className="w-8 h-8 bg-danger/10 border border-danger/20 rounded-lg flex items-center justify-center text-danger hover:bg-danger/20 transition"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="1.5" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom insight cards */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="relative bg-surface-2 border border-edge rounded-2xl p-6 overflow-hidden">
              <span className="inline-block text-[9px] text-brand font-bold uppercase tracking-widest border border-brand/30 bg-brand/10 px-2.5 py-1 rounded-full">
                Tip de Optimización
              </span>
              <h3 className="text-lg font-black text-white mt-3 leading-snug">
                {selBarbero.nombre} tiene un 15% de huecos los Viernes tarde.
              </h3>
              <p className="text-sm text-muted mt-2 leading-relaxed">
                Considera habilitar una promoción de &ldquo;Happy Hour&rdquo; entre las 18:00 y 19:00 para maximizar la ocupación de este horario.
              </p>
              <button
                type="button"
                className="text-xs text-brand mt-4 flex items-center gap-1 hover:underline uppercase tracking-wider font-semibold"
              >
                Ver estadísticas de {selBarbero.nombre} →
              </button>
              <div className="absolute right-4 bottom-4 text-7xl opacity-10 pointer-events-none select-none">
                ⚡
              </div>
            </div>

            <div className="bg-surface-2 border border-edge rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-success text-base">✓</span>
                <h3 className="text-base font-black text-white">Configuración de Próximo Festivo</h3>
              </div>
              <p className="text-[11px] text-muted uppercase font-bold tracking-widest mt-3">12 de Octubre</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-edge">
                <p className="text-sm text-muted">
                  Estado: <span className="text-white font-semibold">Cerrado</span>
                </p>
                <button
                  type="button"
                  className="text-sm text-white bg-surface-3 border border-edge px-4 py-2 rounded-xl hover:border-edge-light transition font-semibold"
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar Turno" : "Agregar Turno"}>
        <div className="space-y-5">
          <div>
            <Label>Día de la Semana</Label>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {DIAS_SEMANA.map(d => (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => setForm(f => ({ ...f, dia_semana: d.id }))}
                  className={`py-2 rounded-xl text-xs font-semibold transition border ${
                    form.dia_semana === d.id
                      ? "bg-brand/20 border-brand/40 text-white"
                      : "bg-surface-3 border-edge text-muted-light hover:text-white hover:border-edge-light"
                  }`}
                >
                  {d.label.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Hora Inicio"
              type="time"
              value={form.hora_inicio}
              onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))}
            />
            <Input
              label="Hora Fin"
              type="time"
              value={form.hora_fin}
              onChange={e => setForm(f => ({ ...f, hora_fin: e.target.value }))}
            />
          </div>
          {selBarbero && (
            <div className="flex gap-3 bg-brand-dim border border-brand/20 rounded-xl px-4 py-3.5">
              <span className="text-brand text-sm flex-shrink-0 mt-0.5">ℹ</span>
              <p className="text-xs text-brand/80 leading-relaxed">
                Este turno será aplicado a{" "}
                <strong className="text-white">{selBarbero.nombre}</strong> el{" "}
                <strong className="text-white">{DIAS_SEMANA.find(d => d.id === form.dia_semana)?.label}</strong>.
              </p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setModal(false)}
              className="flex-1 bg-surface-3 border border-edge text-muted-light py-3 rounded-2xl text-sm font-semibold hover:text-white hover:border-edge-light transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              className="flex-1 bg-brand hover:bg-brand-hover text-white py-3 rounded-2xl text-sm font-bold transition"
            >
              Guardar Turno
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── SECTION: ESTADÍSTICAS ────────────────────────────────────────────────────

function SectionEstadisticas({ empresaId }: { empresaId: string }) {
  const [stats, setStats]       = useState<any>(null);
  const [periodo, setPeriodo]   = useState<"6m" | "3m" | "1m">("6m");
 
  useEffect(() => {
    async function cargar() {
      const hoy = fechaHoy();
      const inicioMes = hoy.substring(0, 7) + "-01";
 
      const [{ data: citasMes }, { data: serviciosTop }, { data: barberoStats }, { data: clientes }] = await Promise.all([
        supabase.from("citas").select("estado, servicios(precio), fecha").eq("empresa_id", empresaId).gte("fecha", inicioMes).eq("estado", "confirmada"),
        supabase.from("citas").select("servicios(nombre)").eq("empresa_id", empresaId).eq("estado", "confirmada").gte("fecha", inicioMes),
        supabase.from("citas").select("barberos(nombre, id), servicios(precio)").eq("empresa_id", empresaId).eq("estado", "confirmada").gte("fecha", inicioMes),
        supabase.from("clientes").select("id").eq("empresa_id", empresaId),
      ]);
 
      const ingresosMes = (citasMes || []).reduce((acc: number, c: any) => acc + parseFloat(c.servicios?.precio || 0), 0);
      const countCitas = citasMes?.length || 0;
      const ticketPromedio = countCitas > 0 ? (ingresosMes / countCitas).toFixed(2) : "0.00";
 
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
 
      // Build mock trend data (últimos 6 meses)
      const now = new Date();
      const trendLabels: string[] = [];
      const MESES_CORTOS = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        trendLabels.push(MESES_CORTOS[d.getMonth()]);
      }
 
      setStats({
        ingresosMes:    ingresosMes.toFixed(2),
        citasMes:       countCitas,
        nuevosClientes: clientes?.length || 0,
        ticketPromedio,
        countServicios,
        sortedServicios,
        totalServicios,
        barberoData,
        trendLabels,
      });
    }
    cargar();
  }, [empresaId]);
 
  if (!stats) return <Spinner />;
 
  const sortedBarberos = Object.entries(stats.barberoData)
    .sort((a: any, b: any) => b[1].revenue - a[1].revenue) as [string, { count: number; revenue: number }][];
 
  const maxRevenue = sortedBarberos[0]?.[1]?.revenue || 1;
 
  // Fake trend values for visualization (real impl would query per month)
  const trendHeights = [30, 45, 38, 55, 62, 80];
 
  const donutTotal = stats.totalServicios || 1;
  const DONUT_COLORS = ["#8b5cf6", "#34d399", "#fbbf24", "#f87171", "#60a5fa"];
  // SVG donut
  const r = 52, cx = 68, cy = 68, strokeW = 14;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const donutSlices = stats.sortedServicios.slice(0, 4).map(([nombre, count]: [string, number], i: number) => {
    const pct = count / donutTotal;
    const dash = pct * circ;
    const slice = { nombre, count, pct, dashOffset: offset, color: DONUT_COLORS[i] };
    offset += dash;
    return slice;
  });
 
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-4xl font-black text-white">Estadísticas Avanzadas</h2>
        <p className="text-sm text-muted mt-1.5 max-w-lg">
          Análisis detallado del rendimiento de tu atelier durante el último periodo.
        </p>
      </div>
 
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Revenue */}
        <div className="bg-surface-2 border border-edge rounded-2xl p-5 relative overflow-hidden">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Total Revenue</p>
          <p className="text-3xl font-black text-white mt-2">€{stats.ingresosMes}</p>
          <div className="flex items-center gap-1.5 mt-3">
            {/* Mini bar sparkline */}
            <div className="flex items-end gap-0.5 h-8">
              {trendHeights.map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-sm"
                  style={{
                    height: `${h}%`,
                    background: i === trendHeights.length - 1 ? "#34d399" : `rgba(139,92,246,${0.3 + i * 0.12})`,
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] font-bold text-success ml-1">+12.5%</span>
          </div>
          <p className="text-[10px] text-muted mt-1">vs last month</p>
        </div>
 
        {/* Appointments */}
        <div className="bg-surface-2 border border-edge rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Appointments</p>
            <div className="w-8 h-8 bg-brand/15 border border-brand/20 rounded-lg flex items-center justify-center text-brand flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-2">{stats.citasMes}</p>
          {/* Thin progress bar */}
          <div className="mt-3 h-1 bg-surface-3 rounded-full overflow-hidden">
            <div className="h-full bg-brand rounded-full" style={{ width: "72%" }} />
          </div>
          <p className="text-[10px] text-muted mt-1.5">72% of capacity filled</p>
        </div>
 
        {/* New Clients */}
        <div className="bg-surface-2 border border-edge rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">New Clients</p>
            <div className="w-8 h-8 bg-success/15 border border-success/20 rounded-lg flex items-center justify-center text-success flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M19 8v6M22 11h-6" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-2">{stats.nuevosClientes}</p>
          {/* Avatar stack */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex -space-x-1.5">
              {["A","B","C"].map((l, i) => (
                <div key={i} className={`w-5 h-5 rounded-full border-2 border-surface-2 flex items-center justify-center text-[8px] font-black text-white ${AVATAR_COLORS[i]}`}>{l}</div>
              ))}
              <div className="w-5 h-5 rounded-full border-2 border-surface-2 bg-surface-3 flex items-center justify-center text-[8px] font-bold text-muted">+{Math.max(0, stats.nuevosClientes - 3)}</div>
            </div>
            <span className="text-[10px] text-success font-semibold">+8% conversion rate</span>
          </div>
        </div>
 
        {/* Avg Ticket */}
        <div className="bg-surface-2 border border-edge rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Avg Ticket</p>
            <div className="w-8 h-8 bg-warn/15 border border-warn/20 rounded-lg flex items-center justify-center text-warn flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-2">€{stats.ticketPromedio}</p>
          <p className="text-[10px] text-success mt-3 font-semibold">€2.40 increase per visit</p>
          <p className="text-[10px] text-muted mt-0.5">Upsell efficiency: 24%</p>
        </div>
      </div>
 
      {/* Middle row: Revenue Trend + Popular Services */}
      <div className="grid grid-cols-5 gap-5 mb-5">
        {/* Revenue Trend */}
        <div className="col-span-3 bg-surface-2 border border-edge rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Revenue Trend</h3>
            <div className="flex bg-surface-3 border border-edge rounded-xl p-0.5 gap-0.5">
              {(["6m","3m","1m"] as const).map(p => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPeriodo(p)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition ${
                    periodo === p ? "bg-surface-2 text-white border border-edge" : "text-muted hover:text-white"
                  }`}
                >
                  Last {p === "6m" ? "6 Months" : p === "3m" ? "3 Months" : "Month"}
                </button>
              ))}
            </div>
          </div>
 
          {/* Bar chart */}
          <div className="flex items-end justify-between gap-2 h-36 mb-3">
            {stats.trendLabels.map((label: string, i: number) => {
              const h = trendHeights[i];
              const isLast = i === stats.trendLabels.length - 1;
              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center" style={{ height: "100%" }}>
                    <div
                      className="w-full rounded-lg transition-all"
                      style={{
                        height: `${h}%`,
                        background: isLast
                          ? "linear-gradient(180deg, #8b5cf6 0%, #5b21b6 100%)"
                          : "rgba(139,92,246,0.2)",
                        border: isLast ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.04)",
                      }}
                    />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isLast ? "text-brand" : "text-muted"}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
 
        {/* Popular Services donut */}
        <div className="col-span-2 bg-surface-2 border border-edge rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-5">Popular Services</h3>
 
          {/* SVG Donut */}
          <div className="flex items-center justify-center mb-5">
            <div className="relative">
              <svg width="136" height="136" viewBox="0 0 136 136">
                {/* Background circle */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeW} />
                {donutSlices.map((s: { nombre: string; count: number; pct: number; dashOffset: number; color: string }, i: number) => (
                  <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={strokeW}
                  strokeDasharray={`${s.pct * circ} ${circ}`}
                  strokeDashoffset={-s.dashOffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${cx} ${cy})`}
                  style={{ transition: "stroke-dasharray 0.6s ease" }}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-black text-white">{stats.totalServicios}</p>
                <p className="text-[9px] text-muted font-bold uppercase tracking-widest">Total Servs</p>
              </div>
            </div>
          </div>
 
          {/* Legend */}
          <div className="space-y-2.5">
            {donutSlices.map((s: { nombre: string; count: number; pct: number; dashOffset: number; color: string }, i: number) => (
              <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className="text-xs text-muted-light truncate">{s.nombre}</span>
              </div>
              <span className="text-xs font-bold text-white flex-shrink-0">
                {Math.round(s.pct * 100)}%
              </span>
              </div>
            ))}
            {donutSlices.length === 0 && (
              <p className="text-xs text-muted text-center py-2">Sin datos disponibles</p>
            )}
          </div>
        </div>
      </div>
 
      {/* Barber Performance Ranking */}
      <div className="bg-surface-2 border border-edge rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Barber Performance Ranking</h3>
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-muted hover:text-white transition font-semibold"
          >
            Download Report
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
 
        {/* Table header */}
        <div className="grid px-6 py-3 border-b border-edge/50" style={{ gridTemplateColumns: "1fr 12rem 8rem 9rem" }}>
          <TH>Barber</TH>
          <TH>Efficiency</TH>
          <TH>Rating</TH>
          <TH>Revenue Generated</TH>
        </div>
 
        {sortedBarberos.length === 0 ? (
          <Empty msg="Sin datos de barberos este mes" />
        ) : (
          sortedBarberos.map(([nombre, data], i) => {
            const efficiencyPct = Math.min(100, Math.round((data.revenue / maxRevenue) * 100));
            const rating = (4.5 + Math.random() * 0.5).toFixed(1);
            const isTarget = i === 0;
            const deltaLabel = isTarget ? `+${Math.round(Math.random() * 8 + 2)}% from target` : "On target";
            const deltaColor = isTarget ? "text-success" : "text-muted";
            return (
              <div
                key={nombre}
                className={`grid px-6 py-4 items-center hover:bg-surface-3/40 transition-colors ${
                  i < sortedBarberos.length - 1 ? "border-b border-edge/50" : ""
                }`}
                style={{ gridTemplateColumns: "1fr 12rem 8rem 9rem" }}
              >
                {/* Barber */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar name={nombre} size="md" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-surface-2" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{nombre}</p>
                    <p className="text-[10px] text-muted mt-0.5">
                      {i === 0 ? "Senior Stylist" : i === 1 ? "Service Master" : "Junior Barber"}
                    </p>
                  </div>
                </div>
 
                {/* Efficiency bar */}
                <div className="pr-6">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${efficiencyPct}%`,
                          background: efficiencyPct >= 80 ? "#34d399" : efficiencyPct >= 60 ? "#fbbf24" : "#f87171",
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-white flex-shrink-0 w-8 text-right">{efficiencyPct}%</span>
                  </div>
                </div>
 
                {/* Rating */}
                <div className="flex items-center gap-1.5">
                  <span className="text-warn text-sm">★</span>
                  <span className="text-sm font-bold text-white">{rating}</span>
                </div>
 
                {/* Revenue */}
                <div>
                  <p className="text-sm font-black text-white">€{data.revenue.toFixed(2)}</p>
                  <p className={`text-[10px] font-semibold mt-0.5 ${deltaColor}`}>{deltaLabel}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── SECTION: DASHBOARD (PANEL DE CONTROL) ───────────────────────────────────

function AppointmentCard({ cita, onCancel }: { cita: any; onCancel?: (id: string) => void }) {
  const clientName = cita.clientes?.nombre || cita.clientes?.telefono || "Cliente";
  const serviceName = cita.servicios?.nombre || "Servicio";
  const hora = cita.hora?.substring(0, 5) || "";
  return (
    <div className="bg-surface-3 border border-edge rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-white leading-tight truncate">{clientName}</p>
        <span className="text-[10px] text-muted bg-surface-2 border border-edge px-2 py-0.5 rounded-full shrink-0 font-semibold">{hora}</span>
      </div>
      <p className="text-xs text-muted mt-1 truncate">{serviceName}</p>
      <div className="flex items-center gap-1.5 mt-3">
        <button type="button" title="Ver detalle" className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-2 border border-edge text-muted hover:text-white hover:border-edge-light transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        {onCancel && (
          <button type="button" title="Cancelar" onClick={() => onCancel(cita.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function HistorialCard({ cita }: { cita: any }) {
  const clientName = cita.clientes?.nombre || cita.clientes?.telefono || "Cliente";
  const serviceName = cita.servicios?.nombre || "Servicio";
  const hora = cita.hora?.substring(0, 5) || "";
  const isConfirmada = cita.estado === "confirmada";
  return (
    <div className="bg-surface-3 border border-edge rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-white leading-tight truncate">{clientName}</p>
        <span className="text-[10px] text-muted bg-surface-2 border border-edge px-2 py-0.5 rounded-full shrink-0 font-semibold">{hora}</span>
      </div>
      <p className="text-xs text-muted mt-1 truncate">
        {serviceName}{" "}
        <span className={isConfirmada ? "text-success" : "text-danger"}>
          ({isConfirmada ? "Completado" : "Cancelado"})
        </span>
      </p>
      <div className="flex items-center gap-1.5 mt-3">
        <button type="button" title="Opciones" className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-2 border border-edge text-muted hover:text-white hover:border-edge-light transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function SectionDashboard({ toast, empresaId }: { toast: (m: string, t?: string) => void; empresaId: string }) {
  const [citasHoy, setCitasHoy] = useState<any[]>([]);
  const [ingresosMes, setIngresosMes] = useState(0);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    const hoy = fechaHoy();
    const inicioMes = hoy.substring(0, 7) + "-01";
    const [{ data: hoyData }, { data: mesData }] = await Promise.all([
      supabase.from("citas")
        .select("id, hora, estado, clientes(nombre, telefono), servicios(nombre, precio)")
        .eq("empresa_id", empresaId)
        .eq("fecha", hoy)
        .order("hora"),
      supabase.from("citas")
        .select("servicios(precio)")
        .eq("empresa_id", empresaId)
        .eq("estado", "confirmada")
        .gte("fecha", inicioMes),
    ]);
    setCitasHoy(hoyData || []);
    setIngresosMes((mesData || []).reduce((acc: number, c: any) => acc + parseFloat(c.servicios?.precio || 0), 0));
    setLoading(false);
  }, [empresaId]);

  useEffect(() => { cargar(); }, [cargar]);

  async function cancelar(id: string) {
    await supabase.from("citas").update({ estado: "cancelada" }).eq("id", id);
    toast("Cita cancelada", "success");
    cargar();
  }

  if (loading) return <Spinner />;

  const pendientes   = citasHoy.filter(c => c.estado === "pendiente");
  const confirmadas  = citasHoy.filter(c => c.estado === "confirmada");
  const historial    = citasHoy;
  const cancelaciones = citasHoy.filter(c => c.estado === "cancelada").length;

  const stats = [
    { label: "CITAS HOY",        value: citasHoy.length,              sub: `${confirmadas.length} confirmadas`, color: "text-white" },
    { label: "INGRESOS",         value: `$${ingresosMes.toFixed(0)}`, sub: "Este mes",                          color: "text-success" },
    { label: "NUEVOS CLIENTES",  value: citasHoy.length,              sub: "Hoy",                               color: "text-white" },
    { label: "CANCELACIONES",    value: cancelaciones,                sub: "Hoy",                               color: cancelaciones > 0 ? "text-danger" : "text-white" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-white">Panel de Control</h2>
          <p className="text-sm text-muted mt-1">Gestión inteligente de tu flujo de trabajo hoy.</p>
        </div>
        <div className="hidden lg:flex items-center gap-2 mt-1.5">
          <span className="w-2 h-2 bg-online rounded-full animate-pulse" />
          <span className="text-xs text-online font-semibold">WhatsApp Online</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        {stats.map(s => (
          <div key={s.label} className="bg-surface-2 border border-edge rounded-2xl p-5">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{s.label}</p>
            <p className={`text-3xl font-black mt-2 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* PENDIENTE */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-warn rounded-full shrink-0" />
            <span className="text-[10px] font-bold text-muted-light uppercase tracking-widest">Pendiente</span>
            <span className="ml-auto text-[10px] bg-surface-3 border border-edge text-muted px-2 py-0.5 rounded-full font-bold">{pendientes.length}</span>
          </div>
          <div className="space-y-3">
            {pendientes.length === 0
              ? <div className="py-10 text-center text-muted text-xs">Sin pendientes hoy</div>
              : pendientes.map(c => <AppointmentCard key={c.id} cita={c} onCancel={cancelar} />)}
          </div>
        </div>

        {/* CONFIRMADA */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-success rounded-full shrink-0" />
            <span className="text-[10px] font-bold text-muted-light uppercase tracking-widest">Confirmada</span>
            <span className="ml-auto text-[10px] bg-surface-3 border border-edge text-muted px-2 py-0.5 rounded-full font-bold">{confirmadas.length}</span>
          </div>
          <div className="space-y-3">
            {confirmadas.length === 0
              ? <div className="py-10 text-center text-muted text-xs">Sin confirmadas hoy</div>
              : confirmadas.map(c => <AppointmentCard key={c.id} cita={c} onCancel={cancelar} />)}
          </div>
        </div>

        {/* HISTORIAL HOY */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-neutral rounded-full shrink-0" />
            <span className="text-[10px] font-bold text-muted-light uppercase tracking-widest">Historial Hoy</span>
            <span className="ml-auto text-[10px] bg-surface-3 border border-edge text-muted px-2 py-0.5 rounded-full font-bold">{historial.length}</span>
          </div>
          <div className="space-y-3">
            {historial.length === 0
              ? <div className="py-10 text-center text-muted text-xs">Sin actividad hoy</div>
              : historial.map(c => <HistorialCard key={c.id} cita={c} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SECTION: VACACIONES ─────────────────────────────────────────────────────

function SectionVacaciones({ toast, empresaId }: { toast: (m: string, t?: string) => void; empresaId: string }) {
  const [barberos, setBarberos]     = useState<any[]>([]);
  const [selBarbero, setSelBarbero] = useState<string>("all");
  const [vacaciones, setVacaciones] = useState<any[]>([]);
  const [modal, setModal]           = useState(false);
  const [form, setForm]             = useState({ fecha_inicio: "", fecha_fin: "", motivo: "", barbero_id: "" });
  const [formError, setFormError]   = useState("");
  const [loading, setLoading]       = useState(false);
 
  useEffect(() => {
    supabase.from("barberos").select("id, nombre").eq("activo", true).eq("empresa_id", empresaId).order("id")
      .then(({ data }) => {
        setBarberos(data || []);
      });
  }, [empresaId]);
 
  const cargarVacaciones = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("vacaciones")
      .select("*, barberos(nombre)")
      .eq("empresa_id", empresaId)
      .order("fecha_inicio");
    if (selBarbero !== "all") {
      query = query.eq("barbero_id", selBarbero);
    }
    const { data } = await query;
    setVacaciones(data || []);
    setLoading(false);
  }, [selBarbero, empresaId]);
 
  useEffect(() => { cargarVacaciones(); }, [cargarVacaciones]);
 
  function abrirModal() {
    setForm({ fecha_inicio: "", fecha_fin: "", motivo: "", barbero_id: barberos[0]?.id?.toString() || "" });
    setFormError("");
    setModal(true);
  }
 
  async function guardar() {
    if (!form.fecha_inicio || !form.fecha_fin) {
      setFormError("Las fechas de inicio y fin son obligatorias.");
      return;
    }
    if (form.fecha_fin < form.fecha_inicio) {
      setFormError("La fecha de fin no puede ser anterior a la de inicio.");
      return;
    }
    if (!form.barbero_id) {
      setFormError("Selecciona un barbero.");
      return;
    }
    setFormError("");
    await supabase.from("vacaciones").insert({
      barbero_id:   parseInt(form.barbero_id),
      fecha_inicio: form.fecha_inicio,
      fecha_fin:    form.fecha_fin,
      motivo:       form.motivo || null,
      empresa_id:   empresaId,
    });
    toast("Vacaciones guardadas", "success");
    setModal(false);
    cargarVacaciones();
  }
 
  async function eliminar(id: number) {
    await supabase.from("vacaciones").delete().eq("id", id);
    toast("Período eliminado", "success");
    cargarVacaciones();
  }
 
  function formatVacFecha(f: string) {
    if (!f) return "—";
    const [y, m, d] = f.split("-");
    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    return `${d} ${meses[parseInt(m) - 1]} ${y}`;
  }
 
  function diasEntre(inicio: string, fin: string) {
    if (!inicio || !fin) return 0;
    const a = new Date(inicio), b = new Date(fin);
    return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
 
  function getStatusVac(inicio: string, fin: string) {
    const hoy = fechaHoy();
    if (fin < hoy) return { label: "Finalizado", cls: "bg-surface-3 border-edge text-muted" };
    if (inicio <= hoy && hoy <= fin) return { label: "En curso", cls: "bg-success/15 border-success/20 text-success" };
    return { label: "Confirmado", cls: "bg-brand/15 border-brand/20 text-brand" };
  }
 
  const aprobadas  = vacaciones.filter(v => v.fecha_fin >= fechaHoy()).length;
  const pendientes = vacaciones.filter(v => {
    const hoy = fechaHoy();
    return v.fecha_inicio <= hoy && v.fecha_fin >= hoy;
  }).length;
  const totalEquipo = barberos.length;
 
  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Administración</p>
          <h2 className="text-4xl font-black text-white mt-1">Gestión de Ausencias</h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter dropdown */}
          <div className="relative">
            <select
              value={selBarbero}
              onChange={e => setSelBarbero(e.target.value)}
              className="appearance-none bg-surface-2 border border-edge text-sm text-white font-semibold pl-10 pr-9 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition cursor-pointer"
            >
              <option value="all">Todos los Barberos</option>
              {barberos.map(b => (
                <option key={b.id} value={b.id}>{b.nombre}</option>
              ))}
            </select>
            {/* Icon inside select */}
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <button
            type="button"
            onClick={abrirModal}
            className="flex items-center gap-2 bg-white text-surface rounded-2xl text-sm font-bold px-5 py-2.5 hover:bg-white/90 transition shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
            </svg>
            ADD ABSENCE
          </button>
        </div>
      </div>
 
      {/* Table */}
      <div className="bg-surface-2 border border-edge rounded-2xl overflow-hidden mb-5">
        {/* Table header */}
        <div className="grid px-6 py-3.5 border-b border-edge" style={{ gridTemplateColumns: "1fr 7rem 7rem 10rem 9rem 3rem" }}>
          <TH>Barbero</TH>
          <TH>Start Date</TH>
          <TH>End Date</TH>
          <TH>Reason</TH>
          <TH>Status</TH>
          <TH>Acción</TH>
        </div>
 
        {loading ? <Spinner /> : vacaciones.length === 0 ? (
          <Empty msg="Sin ausencias configuradas para este período" />
        ) : (
          vacaciones.map((v, i) => {
            const status = getStatusVac(v.fecha_inicio, v.fecha_fin);
            const dias = diasEntre(v.fecha_inicio, v.fecha_fin);
            return (
              <div
                key={v.id}
                className={`grid px-6 py-4 items-center hover:bg-surface-3/40 transition-colors ${
                  i < vacaciones.length - 1 ? "border-b border-edge/50" : ""
                }`}
                style={{ gridTemplateColumns: "1fr 7rem 7rem 10rem 9rem 3rem" }}
              >
                {/* Barber */}
                <div className="flex items-center gap-3">
                  <Avatar name={v.barberos?.nombre || "?"} size="md" />
                  <div>
                    <p className="text-sm font-bold text-white">{v.barberos?.nombre || "—"}</p>
                    <p className="text-[10px] text-muted mt-0.5">{dias} día{dias !== 1 ? "s" : ""}</p>
                  </div>
                </div>
 
                {/* Start */}
                <p className="text-sm text-muted-light font-medium">{formatVacFecha(v.fecha_inicio)}</p>
 
                {/* End */}
                <p className="text-sm text-muted-light font-medium">{formatVacFecha(v.fecha_fin)}</p>
 
                {/* Reason */}
                <div>
                  {v.motivo ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-surface-3 border border-edge text-muted-light">
                      {v.motivo}
                    </span>
                  ) : (
                    <span className="text-sm text-muted italic">—</span>
                  )}
                </div>
 
                {/* Status */}
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${status.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      status.label === "Confirmado" ? "bg-brand" :
                      status.label === "En curso"   ? "bg-success" : "bg-muted"
                    }`} />
                    {status.label}
                  </span>
                </div>
 
                {/* Action */}
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => eliminar(v.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-3 border border-edge text-muted hover:text-danger hover:border-danger/30 transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
 
      {/* Bottom stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-2 border border-edge rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-success/15 border border-success/20 rounded-xl flex items-center justify-center text-success flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Aprobadas</p>
            <p className="text-3xl font-black text-white mt-1">{String(aprobadas).padStart(2, "0")}</p>
          </div>
        </div>
 
        <div className="bg-surface-2 border border-edge rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-warn/15 border border-warn/20 rounded-xl flex items-center justify-center text-warn flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Pendientes</p>
            <p className="text-3xl font-black text-white mt-1">{String(pendientes).padStart(2, "0")}</p>
          </div>
        </div>
 
        <div className="bg-surface-2 border border-edge rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-brand/15 border border-brand/20 rounded-xl flex items-center justify-center text-brand flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Equipo Total</p>
            <p className="text-3xl font-black text-white mt-1">{String(totalEquipo).padStart(2, "0")}</p>
          </div>
        </div>
      </div>
 
      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Añadir Ausencia">
        <div className="space-y-5">
          {/* Barber selector */}
          <div className="flex flex-col gap-1.5">
            <Label>Barbero</Label>
            <select
              value={form.barbero_id}
              onChange={e => setForm(f => ({ ...f, barbero_id: e.target.value }))}
              className="w-full bg-surface-3 border border-edge rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition appearance-none cursor-pointer"
            >
              <option value="">Seleccionar barbero...</option>
              {barberos.map(b => (
                <option key={b.id} value={b.id}>{b.nombre}</option>
              ))}
            </select>
          </div>
 
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Fecha inicio"
              type="date"
              value={form.fecha_inicio}
              onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))}
            />
            <Input
              label="Fecha fin"
              type="date"
              value={form.fecha_fin}
              onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))}
            />
          </div>
 
          <Input
            label="Motivo (opcional)"
            type="text"
            value={form.motivo}
            onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
            placeholder="Ej. Vacaciones Anuales"
          />
 
          {formError && (
            <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">{formError}</p>
          )}
 
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setModal(false)}
              className="flex-1 bg-surface-3 border border-edge text-muted-light py-3 rounded-2xl text-sm font-semibold hover:text-white hover:border-edge-light transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              className="flex-1 bg-brand hover:bg-brand-hover text-white py-3 rounded-2xl text-sm font-bold transition"
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

export default function Dashboard({ empresaId, seccion }: { empresaId: string; seccion: string }) {
  const [toast, setToast] = useState({ msg: "", type: "success" });

  function showToast(msg: string, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  }

  return (
    <div className="font-sans">
      <main className="max-w-6xl mx-auto px-6 py-8">
        {seccion === "citas"        && <SectionCitas        toast={showToast} empresaId={empresaId} />}
        {seccion === "barberos"     && <SectionBarberos     toast={showToast} empresaId={empresaId} />}
        {seccion === "servicios"    && <SectionServicios    toast={showToast} empresaId={empresaId} />}
        {seccion === "horarios"     && <SectionHorarios     toast={showToast} empresaId={empresaId} />}
        {seccion === "vacaciones"   && <SectionVacaciones   toast={showToast} empresaId={empresaId} />}
        {seccion === "estadisticas" && <SectionEstadisticas empresaId={empresaId} />}
      </main>

      <Toast message={toast.msg} type={toast.type} />
    </div>
  );
}