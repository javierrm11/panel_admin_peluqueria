'use client'
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

// ─── Constants ────────────────────────────────────────────────────────────────

const DIAS_SEMANA = [
  { id: 1, label: "Lunes" },
  { id: 2, label: "Martes" },
  { id: 3, label: "Miérc." },
  { id: 4, label: "Jueves" },
  { id: 5, label: "Viernes" },
  { id: 6, label: "Sábado" },
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

function SectionCitas({ toast, empresaId }: { toast: (m: string, t?: string) => void; empresaId: string }) {
  const [vista, setVista] = useState<"hoy" | "semana">("hoy");
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const { inicio, fin } = vista === "hoy"
      ? { inicio: fechaHoy(), fin: fechaHoy() }
      : fechaSemana();
    const { data } = await supabase
      .from("citas")
      .select("id, fecha, hora, estado, clientes(telefono), servicios(nombre, precio), barberos(nombre)")
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

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Label>Gestión de Agenda</Label>
          <h2 className="text-4xl font-black text-white mt-1">Citas</h2>
        </div>
        <div className="flex bg-surface-2 border border-edge rounded-2xl p-1">
          {(["hoy", "semana"] as const).map(v => (
            <button
              type="button"
              key={v}
              onClick={() => setVista(v)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                vista === v
                  ? "bg-brand text-white shadow"
                  : "text-muted hover:text-white"
              }`}
            >
              {v === "hoy" ? "Hoy" : "Esta semana"}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        <div className="bg-surface-2 border border-edge rounded-2xl p-5">
          <Label>Próxima Cita</Label>
          <div className="mt-3">
            {proxima ? (
              <>
                <p className="text-3xl font-black text-white">{proxima.hora?.substring(0,5)}</p>
                <p className="text-sm text-muted mt-1 truncate">
                  {proxima.servicios?.nombre} — {proxima.barberos?.nombre}
                </p>
              </>
            ) : (
              <p className="text-3xl font-black text-muted">—</p>
            )}
          </div>
        </div>
        <div className="bg-surface-2 border border-edge rounded-2xl p-5 flex items-start justify-between">
          <div>
            <Label>Confirmadas</Label>
            <p className="text-4xl font-black text-white mt-3">{confirmadas.length}</p>
          </div>
          <div className="w-10 h-10 bg-success/20 border border-success/30 rounded-full flex items-center justify-center text-success font-black text-lg flex-shrink-0">
            ✓
          </div>
        </div>
        <div className="bg-surface-2 border border-edge rounded-2xl p-5 flex items-start justify-between">
          <div>
            <Label>Canceladas</Label>
            <p className="text-4xl font-black text-white mt-3">{canceladas.length}</p>
          </div>
          <div className="w-10 h-10 bg-danger/20 border border-danger/30 rounded-full flex items-center justify-center text-danger font-black text-lg flex-shrink-0">
            ✕
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-2 border border-edge rounded-2xl overflow-hidden">
        {/* Headers */}
        <div className="flex items-center gap-0 px-6 py-3 border-b border-edge">
          <TH className="w-36 flex-shrink-0">Fecha / Hora</TH>
          <TH className="flex-1">Servicio</TH>
          <TH className="w-36 flex-shrink-0">Barbero</TH>
          <TH className="w-40 flex-shrink-0">Cliente / Tel</TH>
          <TH className="w-28 flex-shrink-0">Estado</TH>
          <TH className="w-16 flex-shrink-0 text-center">Acción</TH>
        </div>

        {loading ? <Spinner /> : citas.length === 0 ? (
          <Empty msg="No hay citas para este período" />
        ) : (
          citas.map((c, i) => {
            const cancelada = c.estado === "cancelada";
            return (
              <div
                key={c.id}
                className={`flex items-center gap-0 px-6 py-4 transition-colors hover:bg-surface-3/50 ${
                  i < citas.length - 1 ? "border-b border-edge/60" : ""
                } ${cancelada ? "opacity-40" : ""}`}
              >
                <div className="w-36 flex-shrink-0">
                  <p className={`text-sm font-semibold text-white ${cancelada ? "line-through" : ""}`}>
                    {formatFecha(c.fecha)}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{c.hora?.substring(0,5)}</p>
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <p className={`text-sm font-semibold text-white truncate ${cancelada ? "line-through" : ""}`}>
                    {c.servicios?.nombre}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{c.servicios?.precio} €</p>
                </div>
                <div className="w-36 flex-shrink-0 flex items-center gap-2">
                  <Avatar name={c.barberos?.nombre || "?"} size="sm" />
                  <p className="text-sm text-muted-light font-medium truncate">{c.barberos?.nombre}</p>
                </div>
                <div className="w-40 flex-shrink-0">
                  <p className={`text-sm text-muted-light ${cancelada ? "line-through" : ""}`}>
                    {c.clientes?.telefono}
                  </p>
                </div>
                <div className="w-28 flex-shrink-0">
                  <StatusBadge estado={c.estado} />
                </div>
                <div className="w-16 flex-shrink-0 flex justify-center">
                  {cancelada ? (
                    <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-muted text-sm">
                      ✕
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => cancelar(c.id)}
                      className="w-8 h-8 rounded-full bg-danger/20 border border-danger/30 flex items-center justify-center text-danger text-sm font-bold hover:bg-danger/30 transition"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── SECTION: BARBEROS ────────────────────────────────────────────────────────

function SectionBarberos({ toast, empresaId }: { toast: (m: string, t?: string) => void; empresaId: string }) {
  const [barberos, setBarberos]         = useState<any[]>([]);
  const [servicios, setServicios]       = useState<any[]>([]);
  const [modal, setModal]               = useState(false);
  const [editando, setEditando]         = useState<any>(null);
  const [nombre, setNombre]             = useState("");
  const [selServicios, setSelServicios] = useState<number[]>([]);
  const [loading, setLoading]           = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const [{ data: b }, { data: s }] = await Promise.all([
      supabase.from("barberos").select("id, nombre, activo").eq("empresa_id", empresaId).order("id"),
      supabase.from("servicios").select("id, nombre").eq("empresa_id", empresaId),
    ]);
    setBarberos(b || []);
    setServicios(s || []);
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

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <Label>Equipo</Label>
          <h2 className="text-4xl font-black text-white mt-1">Barberos</h2>
        </div>
        <button
          type="button"
          onClick={() => abrirModal()}
          className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded-2xl text-sm font-semibold transition shadow-lg shadow-brand-glow"
        >
          + Nuevo Barbero
        </button>
      </div>

      <div className="bg-surface-2 border border-edge rounded-2xl overflow-hidden">
        {loading ? <Spinner /> : barberos.length === 0 ? (
          <Empty msg="No hay barberos registrados" />
        ) : (
          barberos.map((b, i) => (
            <div
              key={b.id}
              className={`flex items-center gap-4 px-6 py-4 hover:bg-surface-3/50 transition-colors ${
                i < barberos.length - 1 ? "border-b border-edge/60" : ""
              }`}
            >
              <Avatar name={b.nombre} size="lg" />
              <div className="flex-1">
                <p className="font-semibold text-white">{b.nombre}</p>
                <div className="mt-1"><ActiveBadge activo={b.activo} /></div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => abrirModal(b)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-light bg-surface-3 border border-edge hover:border-edge-light hover:text-white transition"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => toggleActivo(b)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition border ${
                    b.activo
                      ? "bg-surface-3 border-edge text-muted-light hover:text-white hover:border-edge-light"
                      : "bg-brand/20 border-brand/40 text-brand hover:bg-brand/30"
                  }`}
                >
                  {b.activo ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

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

function SectionServicios({ toast, empresaId }: { toast: (m: string, t?: string) => void; empresaId: string }) {
  const [servicios, setServicios] = useState<any[]>([]);
  const [modal, setModal]         = useState(false);
  const [editando, setEditando]   = useState<any>(null);
  const [form, setForm]           = useState({ nombre: "", precio: "", duracion_minutos: "" });

  const cargar = useCallback(async () => {
    const { data } = await supabase.from("servicios").select("*").eq("empresa_id", empresaId).order("id");
    setServicios(data || []);
  }, []);

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

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <Label>Carta de Servicios</Label>
          <h2 className="text-4xl font-black text-white mt-1">Servicios</h2>
        </div>
        <button
          type="button"
          onClick={() => abrirModal()}
          className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded-2xl text-sm font-semibold transition shadow-lg shadow-brand-glow"
        >
          + Nuevo Servicio
        </button>
      </div>

      <div className="bg-surface-2 border border-edge rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-0 px-6 py-3 border-b border-edge">
          <TH className="flex-1">Servicio</TH>
          <TH className="w-24 flex-shrink-0">Precio</TH>
          <TH className="w-28 flex-shrink-0">Duración</TH>
          <TH className="w-20 flex-shrink-0">Acción</TH>
        </div>
        {servicios.length === 0 ? (
          <Empty msg="No hay servicios registrados" />
        ) : (
          servicios.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-0 px-6 py-4 hover:bg-surface-3/50 transition-colors ${
                i < servicios.length - 1 ? "border-b border-edge/60" : ""
              }`}
            >
              <div className="flex-1 flex items-center gap-3 min-w-0 pr-4">
                <div className="w-10 h-10 rounded-xl bg-surface-3 border border-edge flex items-center justify-center text-lg flex-shrink-0">
                  {SERVICIO_ICONS[i % SERVICIO_ICONS.length]}
                </div>
                <p className="text-sm font-semibold text-white truncate">{s.nombre}</p>
              </div>
              <div className="w-24 flex-shrink-0">
                <p className="text-sm font-semibold text-white">{s.precio} €</p>
              </div>
              <div className="w-28 flex-shrink-0">
                <p className="text-sm text-muted">{s.duracion_minutos} min</p>
              </div>
              <div className="w-20 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => abrirModal(s)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-light bg-surface-3 border border-edge hover:border-edge-light hover:text-white transition"
                >
                  Editar
                </button>
              </div>
            </div>
          ))
        )}
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

  function abrirModal(h: any = null) {
    setEditando(h);
    setForm(h
      ? { dia_semana: h.dia_semana, hora_inicio: h.hora_inicio?.substring(0,5), hora_fin: h.hora_fin?.substring(0,5) }
      : { dia_semana: 1, hora_inicio: "09:00", hora_fin: "18:00" }
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

  async function eliminar(id: number) {
    await supabase.from("horarios_barbero").delete().eq("id", id);
    toast("Franja eliminada", "success");
    cargarHorarios(selBarbero.id);
  }

  async function toggleActivo(h: any) {
    await supabase.from("horarios_barbero").update({ activo: !h.activo }).eq("id", h.id);
    cargarHorarios(selBarbero.id);
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <Label>Disponibilidad</Label>
          <h2 className="text-4xl font-black text-white mt-1">Horarios</h2>
          <p className="text-sm text-muted mt-1">Configura la disponibilidad semanal de tu equipo de trabajo.</p>
        </div>
        <button
          type="button"
          onClick={() => abrirModal()}
          className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded-2xl text-sm font-semibold transition shadow-lg shadow-brand-glow"
        >
          + Agregar Horario
        </button>
      </div>

      {/* Barbero selector */}
      {barberos.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {barberos.map(b => (
            <button
              type="button"
              key={b.id}
              onClick={() => setSelBarbero(b)}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl text-sm font-semibold transition border ${
                selBarbero?.id === b.id
                  ? "bg-brand/20 border-brand/40 text-white"
                  : "bg-surface-2 border-edge text-muted-light hover:text-white hover:border-edge-light"
              }`}
            >
              <Avatar name={b.nombre} size="sm" />
              {b.nombre}
            </button>
          ))}
        </div>
      )}

      <div className="bg-surface-2 border border-edge rounded-2xl overflow-hidden">
        <div className="flex items-center gap-0 px-6 py-3 border-b border-edge">
          <TH className="flex-1">Día de la Semana</TH>
          <TH className="w-28 flex-shrink-0">Activo</TH>
          <TH className="w-28 flex-shrink-0">Acciones</TH>
        </div>
        {horarios.length === 0 ? (
          <Empty msg="Sin horarios configurados" />
        ) : (
          horarios.map((h, i) => (
            <div
              key={h.id}
              className={`flex items-center gap-0 px-6 py-4 hover:bg-surface-3/50 transition-colors ${
                i < horarios.length - 1 ? "border-b border-edge/60" : ""
              }`}
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">
                  {DIAS_SEMANA.find(d => d.id === h.dia_semana)?.label.replace(".", "")}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {h.hora_inicio?.substring(0,5)} – {h.hora_fin?.substring(0,5)}
                </p>
              </div>
              <div className="w-28 flex-shrink-0">
                <ActiveBadge activo={h.activo} />
              </div>
              <div className="w-28 flex-shrink-0 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => abrirModal(h)}
                  title="Editar"
                  className="w-8 h-8 bg-surface-3 border border-edge rounded-lg flex items-center justify-center text-muted hover:text-white hover:border-edge-light transition text-sm"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={() => toggleActivo(h)}
                  title={h.activo ? "Pausar" : "Activar"}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition border ${
                    h.activo
                      ? "bg-surface-3 border-edge text-muted hover:text-white"
                      : "bg-success/15 border-success/30 text-success hover:bg-success/25"
                  }`}
                >
                  {h.activo ? "⏸" : "▶"}
                </button>
                <button
                  type="button"
                  onClick={() => eliminar(h.id)}
                  title="Eliminar"
                  className="w-8 h-8 bg-danger/10 border border-danger/20 rounded-lg flex items-center justify-center text-danger hover:bg-danger/20 transition text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar Horario" : "Agregar Horario"}>
        <div className="space-y-5">
          <div>
            <Label>Día de la Semana</Label>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {DIAS_SEMANA.map(d => (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => setForm(f => ({ ...f, dia_semana: d.id }))}
                  className={`py-2.5 rounded-2xl text-sm font-semibold transition border ${
                    form.dia_semana === d.id
                      ? "bg-brand/20 border-brand/40 text-white"
                      : "bg-surface-3 border-edge text-muted-light hover:text-white hover:border-edge-light"
                  }`}
                >
                  {d.label}
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
                Este horario será aplicado específicamente al barbero{" "}
                <strong className="text-white">{selBarbero.nombre}</strong>.
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
              Guardar Horario
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── SECTION: ESTADÍSTICAS ────────────────────────────────────────────────────

function SectionEstadisticas({ empresaId }: { empresaId: string }) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function cargar() {
      const hoy = fechaHoy();
      const inicioMes = hoy.substring(0, 7) + "-01";
      const [{ data: citasMes }, { data: serviciosTop }, { data: barberoStats }] = await Promise.all([
        supabase.from("citas").select("estado, servicios(precio)").eq("empresa_id", empresaId).gte("fecha", inicioMes).eq("estado", "confirmada"),
        supabase.from("citas").select("servicios(nombre)").eq("empresa_id", empresaId).eq("estado", "confirmada").gte("fecha", inicioMes),
        supabase.from("citas").select("barberos(nombre)").eq("empresa_id", empresaId).eq("estado", "confirmada").gte("fecha", inicioMes),
      ]);
      const ingresosMes = (citasMes || []).reduce((acc: number, c: any) => acc + parseFloat(c.servicios?.precio || 0), 0);
      const countServicios: Record<string, number> = {};
      (serviciosTop || []).forEach((c: any) => {
        const n = c.servicios?.nombre; if (n) countServicios[n] = (countServicios[n] || 0) + 1;
      });
      const countBarberos: Record<string, number> = {};
      (barberoStats || []).forEach((c: any) => {
        const n = c.barberos?.nombre; if (n) countBarberos[n] = (countBarberos[n] || 0) + 1;
      });
      setStats({
        citasMes: citasMes?.length || 0,
        ingresosMes: ingresosMes.toFixed(2),
        servicioTop: Object.entries(countServicios).sort((a, b) => b[1] - a[1])[0],
        barberoTop:  Object.entries(countBarberos).sort((a, b) => b[1] - a[1])[0],
        countServicios,
        countBarberos,
      });
    }
    cargar();
  }, []);

  if (!stats) return <Spinner />;

  const barberoTopName: string = stats.barberoTop?.[0] ?? "";

  return (
    <div>
      <div className="mb-8">
        <Label>Rendimiento</Label>
        <h2 className="text-4xl font-black text-white mt-1">Panel de Estadísticas</h2>
        <p className="text-sm text-muted mt-1">Resumen detallado del rendimiento de la peluquería este mes.</p>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-2 border border-edge rounded-2xl p-5">
          <Label>Citas este mes</Label>
          <p className="text-4xl font-black text-white mt-3">{stats.citasMes}</p>
        </div>
        <div className="bg-surface-2 border border-edge rounded-2xl p-5">
          <Label>Ingresos este mes (€)</Label>
          <p className="text-4xl font-black text-success mt-3">{stats.ingresosMes}€</p>
        </div>
        <div className="bg-surface-2 border border-edge rounded-2xl p-5">
          <Label>Servicio más pedido</Label>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-muted">✂</span>
            <p className="text-xl font-bold text-white leading-tight">{stats.servicioTop?.[0] || "—"}</p>
          </div>
        </div>
        <div className="bg-surface-2 border border-edge rounded-2xl p-5">
          <Label>Mejor Barbero</Label>
          <div className="flex items-center gap-2 mt-3">
            {barberoTopName ? (
              <Avatar name={barberoTopName} size="sm" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-surface-3 flex-shrink-0" />
            )}
            <p className="text-xl font-bold text-white leading-tight">{barberoTopName || "—"}</p>
          </div>
        </div>
      </div>

      {/* Bar charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Servicios */}
        <div className="bg-surface-2 border border-edge rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-white">Citas por servicio</h4>
            <span className="text-muted text-xl">⋮</span>
          </div>
          <div className="space-y-5">
            {Object.entries(stats.countServicios)
              .sort((a: any, b: any) => b[1] - a[1])
              .map(([nombre, count]: any) => {
                const max = Math.max(...Object.values(stats.countServicios) as number[]);
                return (
                  <div key={nombre}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-light">{nombre}</span>
                      <span className="text-sm font-bold text-white">{count}</span>
                    </div>
                    <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                      <div className="h-full bg-brand rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            {Object.keys(stats.countServicios).length === 0 && (
              <p className="text-sm text-muted text-center py-4">Sin datos</p>
            )}
          </div>
        </div>

        {/* Barberos */}
        <div className="bg-surface-2 border border-edge rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-white">Citas por barbero</h4>
            <span className="text-muted text-xl">👥</span>
          </div>
          <div className="space-y-5">
            {Object.entries(stats.countBarberos)
              .sort((a: any, b: any) => b[1] - a[1])
              .map(([nombre, count]: any) => {
                const max = Math.max(...Object.values(stats.countBarberos) as number[]);
                return (
                  <div key={nombre}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-light">{nombre}</span>
                      <span className="text-sm font-bold text-white">{count}</span>
                    </div>
                    <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                      <div className="h-full bg-success rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            {Object.keys(stats.countBarberos).length === 0 && (
              <p className="text-sm text-muted text-center py-4">Sin datos</p>
            )}
          </div>
        </div>
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
  const [selBarbero, setSelBarbero] = useState<any>(null);
  const [vacaciones, setVacaciones] = useState<any[]>([]);
  const [modal, setModal]           = useState(false);
  const [form, setForm]             = useState({ fecha_inicio: "", fecha_fin: "", motivo: "" });
  const [formError, setFormError]   = useState("");

  useEffect(() => {
    supabase.from("barberos").select("id, nombre").eq("activo", true).eq("empresa_id", empresaId).order("id")
      .then(({ data }) => {
        setBarberos(data || []);
        if (data?.length) setSelBarbero(data[0]);
      });
  }, [empresaId]);

  const cargarVacaciones = useCallback(async (barberoId: number) => {
    const { data } = await supabase
      .from("vacaciones").select("*")
      .eq("barbero_id", barberoId)
      .order("fecha_inicio");
    setVacaciones(data || []);
  }, []);

  useEffect(() => {
    if (selBarbero) cargarVacaciones(selBarbero.id);
  }, [selBarbero, cargarVacaciones]);

  function abrirModal() {
    setForm({ fecha_inicio: "", fecha_fin: "", motivo: "" });
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
    setFormError("");
    await supabase.from("vacaciones").insert({
      barbero_id:   selBarbero.id,
      fecha_inicio: form.fecha_inicio,
      fecha_fin:    form.fecha_fin,
      motivo:       form.motivo || null,
      empresa_id:   empresaId,
    });
    toast("Vacaciones guardadas", "success");
    setModal(false);
    cargarVacaciones(selBarbero.id);
  }

  async function eliminar(id: number) {
    await supabase.from("vacaciones").delete().eq("id", id);
    toast("Período eliminado", "success");
    cargarVacaciones(selBarbero.id);
  }

  function formatVacFecha(f: string) {
    if (!f) return "—";
    const [y, m, d] = f.split("-");
    return `${d}/${m}/${y}`;
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <Label>Ausencias</Label>
          <h2 className="text-4xl font-black text-white mt-1">Vacaciones</h2>
          <p className="text-sm text-muted mt-1">Bloquea fechas para que el bot no muestre disponibilidad durante ese período.</p>
        </div>
        <button
          type="button"
          onClick={abrirModal}
          className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded-2xl text-sm font-semibold transition shadow-lg shadow-brand-glow"
        >
          + Añadir Vacaciones
        </button>
      </div>

      {/* Barbero selector */}
      {barberos.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {barberos.map(b => (
            <button
              type="button"
              key={b.id}
              onClick={() => setSelBarbero(b)}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl text-sm font-semibold transition border ${
                selBarbero?.id === b.id
                  ? "bg-brand/20 border-brand/40 text-white"
                  : "bg-surface-2 border-edge text-muted-light hover:text-white hover:border-edge-light"
              }`}
            >
              <Avatar name={b.nombre} size="sm" />
              {b.nombre}
            </button>
          ))}
        </div>
      )}

      <div className="bg-surface-2 border border-edge rounded-2xl overflow-hidden">
        <div className="flex items-center gap-0 px-6 py-3 border-b border-edge">
          <TH className="w-36 flex-shrink-0">Fecha inicio</TH>
          <TH className="w-36 flex-shrink-0">Fecha fin</TH>
          <TH className="flex-1">Motivo</TH>
          <TH className="w-20 flex-shrink-0">Acción</TH>
        </div>
        {vacaciones.length === 0 ? (
          <Empty msg="Sin vacaciones configuradas" />
        ) : (
          vacaciones.map((v, i) => (
            <div
              key={v.id}
              className={`flex items-center gap-0 px-6 py-4 hover:bg-surface-3/50 transition-colors ${
                i < vacaciones.length - 1 ? "border-b border-edge/60" : ""
              }`}
            >
              <div className="w-36 flex-shrink-0">
                <p className="text-sm font-semibold text-white">{formatVacFecha(v.fecha_inicio)}</p>
              </div>
              <div className="w-36 flex-shrink-0">
                <p className="text-sm font-semibold text-white">{formatVacFecha(v.fecha_fin)}</p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted">{v.motivo || <span className="text-muted/40 italic">Sin motivo</span>}</p>
              </div>
              <div className="w-20 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => eliminar(v.id)}
                  title="Eliminar"
                  className="w-8 h-8 bg-danger/10 border border-danger/20 rounded-lg flex items-center justify-center text-danger hover:bg-danger/20 transition text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Añadir Vacaciones">
        <div className="space-y-5">
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
            placeholder="Ej. Vacaciones de verano"
          />
          {formError && (
            <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">{formError}</p>
          )}
          {selBarbero && (
            <div className="flex gap-3 bg-warn/10 border border-warn/20 rounded-xl px-4 py-3.5">
              <span className="text-warn text-sm flex-shrink-0 mt-0.5">🏖</span>
              <p className="text-xs text-warn/80 leading-relaxed">
                El bot no mostrará disponibilidad de{" "}
                <strong className="text-warn">{selBarbero.nombre}</strong> durante este período.
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