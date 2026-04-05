import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIAS_SEMANA = [
  { id: 1, label: "Lunes" },
  { id: 2, label: "Martes" },
  { id: 3, label: "Miércoles" },
  { id: 4, label: "Jueves" },
  { id: 5, label: "Viernes" },
  { id: 6, label: "Sábado" },
];

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

// ─── Componentes UI ───────────────────────────────────────────────────────────

function Badge({ children, color = "green" }) {
  const colors = {
    green:  "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    red:    "bg-red-500/20 text-red-400 border border-red-500/30",
    yellow: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    gray:   "bg-zinc-700/50 text-zinc-400 border border-zinc-600/30",
    blue:   "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${colors[color]}`}>
      {children}
    </span>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-zinc-900 rounded-2xl border border-zinc-800 ${className}`}>
      {children}
    </div>
  );
}

function Button({ children, onClick, variant = "primary", size = "md", disabled = false, className = "" }) {
  const base = "inline-flex items-center gap-1.5 font-semibold rounded-xl transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" };
  const variants = {
    primary: "bg-amber-400 text-zinc-950 hover:bg-amber-300 active:scale-95 shadow-lg shadow-amber-400/20",
    danger:  "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 active:scale-95",
    ghost:   "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:scale-95",
    outline: "border border-zinc-700 text-zinc-300 hover:bg-zinc-800 active:scale-95",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

function Input({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</label>
      )}
      <input
        className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition"
        {...props}
      />
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-zinc-100 text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Toast({ message, type = "success" }) {
  if (!message) return null;
  const styles = {
    success: "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400",
    error:   "bg-red-500/20 border border-red-500/30 text-red-400",
  };
  return (
    <div className={`fixed bottom-6 right-6 z-50 ${styles[type]} text-sm font-semibold px-5 py-3 rounded-xl shadow-2xl backdrop-blur`}>
      {message}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color = "zinc" }) {
  const colors = {
    zinc:    "bg-zinc-800 border-zinc-700",
    emerald: "bg-emerald-500/10 border-emerald-500/20",
    blue:    "bg-blue-500/10 border-blue-500/20",
    amber:   "bg-amber-400/10 border-amber-400/20",
  };
  const textColors = {
    zinc:    "text-zinc-100",
    emerald: "text-emerald-400",
    blue:    "text-blue-400",
    amber:   "text-amber-400",
  };
  return (
    <div className={`${colors[color]} border rounded-2xl p-5 flex flex-col gap-3`}>
      <span className="text-2xl">{icon}</span>
      <div>
        <p className={`text-3xl font-black leading-none ${textColors[color]}`}>{value}</p>
        <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide mt-1.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <div className="w-1 h-5 bg-amber-400 rounded-full" />
      <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">{children}</h2>
    </div>
  );
}

// ─── SECCIÓN: CITAS ───────────────────────────────────────────────────────────

function SectionCitas({ toast }) {
  const [vista, setVista] = useState("hoy");
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const { inicio, fin } = vista === "hoy"
      ? { inicio: fechaHoy(), fin: fechaHoy() }
      : fechaSemana();

    const { data } = await supabase
      .from("citas")
      .select("id, fecha, hora, estado, clientes(telefono), servicios(nombre, precio), barberos(nombre)")
      .gte("fecha", inicio)
      .lte("fecha", fin)
      .order("fecha", { ascending: true })
      .order("hora", { ascending: true });

    setCitas(data || []);
    setLoading(false);
  }, [vista]);

  useEffect(() => { cargar(); }, [cargar]);

  async function cancelar(id) {
    await supabase.from("citas").update({ estado: "cancelada" }).eq("id", id);
    toast("Cita cancelada", "success");
    cargar();
  }

  const confirmadas = citas.filter(c => c.estado === "confirmada");
  const canceladas  = citas.filter(c => c.estado === "cancelada");

  return (
    <div className="space-y-5">
      {/* Vista toggle */}
      <div className="flex gap-2 p-1 bg-zinc-800/50 rounded-xl w-fit">
        {["hoy", "semana"].map(v => (
          <button
            type="button"
            key={v}
            onClick={() => setVista(v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              vista === v
                ? "bg-amber-400 text-zinc-950 shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {v === "hoy" ? "📅 Hoy" : "🗓 Esta semana"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Confirmadas" value={confirmadas.length} icon="✅" color="emerald" />
        <StatCard label="Canceladas"  value={canceladas.length}  icon="✕" color="zinc" />
      </div>

      {loading ? (
        <div className="text-center text-zinc-600 py-10">
          <div className="inline-block w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mb-3" />
          <p className="text-sm">Cargando citas...</p>
        </div>
      ) : citas.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-4xl mb-3">✂️</p>
          <p className="text-zinc-500 text-sm">No hay citas para este período</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {citas.map(c => (
            <Card key={c.id} className="p-4 flex items-center gap-4 hover:border-zinc-700 transition-colors">
              {/* Hora pill */}
              <div className="flex-shrink-0 bg-amber-400/10 border border-amber-400/20 rounded-xl px-3 py-2 text-center min-w-[56px]">
                <p className="text-amber-400 font-black text-base leading-none">{c.hora?.substring(0,5)}</p>
                <p className="text-zinc-600 text-[10px] font-medium mt-0.5">{c.fecha?.substring(5)}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-zinc-100 text-sm">{c.servicios?.nombre}</span>
                  <Badge color={c.estado === "confirmada" ? "green" : "red"}>{c.estado}</Badge>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  💇 {c.barberos?.nombre} &nbsp;·&nbsp; {c.servicios?.precio}€ &nbsp;·&nbsp; 📱 {c.clientes?.telefono}
                </p>
              </div>
              {c.estado === "confirmada" && (
                <Button variant="danger" size="sm" onClick={() => cancelar(c.id)}>Cancelar</Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SECCIÓN: BARBEROS ────────────────────────────────────────────────────────

function SectionBarberos({ toast }) {
  const [barberos, setBarberos]         = useState([]);
  const [servicios, setServicios]       = useState([]);
  const [modal, setModal]               = useState(false);
  const [editando, setEditando]         = useState(null);
  const [nombre, setNombre]             = useState("");
  const [selServicios, setSelServicios] = useState([]);
  const [loading, setLoading]           = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const [{ data: b }, { data: s }] = await Promise.all([
      supabase.from("barberos").select("id, nombre, activo").order("id"),
      supabase.from("servicios").select("id, nombre"),
    ]);
    setBarberos(b || []);
    setServicios(s || []);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function abrirModal(barbero = null) {
    setEditando(barbero);
    setNombre(barbero?.nombre || "");
    if (barbero) {
      const { data } = await supabase.from("barbero_servicios").select("servicio_id").eq("barbero_id", barbero.id);
      setSelServicios((data || []).map(r => r.servicio_id));
    } else {
      setSelServicios([]);
    }
    setModal(true);
  }

  function toggleServicio(id) {
    setSelServicios(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  async function guardar() {
    if (!nombre.trim()) return;
    let barberoId = editando?.id;

    if (editando) {
      await supabase.from("barberos").update({ nombre }).eq("id", barberoId);
    } else {
      const { data } = await supabase.from("barberos").insert({ nombre }).select().single();
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

  async function toggleActivo(b) {
    await supabase.from("barberos").update({ activo: !b.activo }).eq("id", b.id);
    toast(`Barbero ${b.activo ? "desactivado" : "activado"}`, "success");
    cargar();
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => abrirModal()}>+ Nuevo barbero</Button>
      </div>

      {loading ? (
        <div className="text-center text-zinc-600 py-10">
          <div className="inline-block w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mb-3" />
        </div>
      ) : (
        <div className="space-y-2">
          {barberos.map(b => (
            <Card key={b.id} className="p-4 flex items-center gap-4 hover:border-zinc-700 transition-colors">
              {/* Avatar */}
              <div className="w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center font-black text-lg flex-shrink-0">
                {b.nombre[0]}
              </div>
              <div className="flex-1">
                <p className="font-bold text-zinc-100">{b.nombre}</p>
                <div className="mt-1">
                  <Badge color={b.activo ? "green" : "gray"}>{b.activo ? "Activo" : "Inactivo"}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => abrirModal(b)}>Editar</Button>
                <Button variant={b.activo ? "outline" : "primary"} size="sm" onClick={() => toggleActivo(b)}>
                  {b.activo ? "Desactivar" : "Activar"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar barbero" : "Nuevo barbero"}>
        <div className="space-y-4">
          <Input label="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del barbero" />
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Servicios que realiza</p>
            <div className="space-y-2">
              {servicios.map(s => (
                <label key={s.id} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-zinc-800 transition">
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                      selServicios.includes(s.id)
                        ? "bg-amber-400 border-amber-400"
                        : "border-zinc-600"
                    }`}
                    onClick={() => toggleServicio(s.id)}
                  >
                    {selServicios.includes(s.id) && (
                      <svg className="w-2.5 h-2.5 text-zinc-950" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <input type="checkbox" checked={selServicios.includes(s.id)} onChange={() => toggleServicio(s.id)} className="hidden" />
                  <span className="text-sm text-zinc-300 group-hover:text-zinc-100">{s.nombre}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={guardar} className="flex-1">Guardar</Button>
            <Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── SECCIÓN: SERVICIOS ───────────────────────────────────────────────────────

function SectionServicios({ toast }) {
  const [servicios, setServicios] = useState([]);
  const [modal, setModal]         = useState(false);
  const [editando, setEditando]   = useState(null);
  const [form, setForm]           = useState({ nombre: "", precio: "", duracion_minutos: "" });

  const cargar = useCallback(async () => {
    const { data } = await supabase.from("servicios").select("*").order("id");
    setServicios(data || []);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  function abrirModal(s = null) {
    setEditando(s);
    setForm(s
      ? { nombre: s.nombre, precio: s.precio, duracion_minutos: s.duracion_minutos }
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
      await supabase.from("servicios").insert(payload);
    }
    toast(editando ? "Servicio actualizado" : "Servicio creado", "success");
    setModal(false);
    cargar();
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => abrirModal()}>+ Nuevo servicio</Button>
      </div>

      <div className="space-y-2">
        {servicios.map(s => (
          <Card key={s.id} className="p-4 flex items-center gap-4 hover:border-zinc-700 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl flex-shrink-0">
              ✂️
            </div>
            <div className="flex-1">
              <p className="font-bold text-zinc-100">{s.nombre}</p>
              <div className="flex gap-3 mt-1">
                <span className="text-xs text-amber-400 font-semibold">{s.precio}€</span>
                <span className="text-xs text-zinc-500">⏱ {s.duracion_minutos} min</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => abrirModal(s)}>Editar</Button>
          </Card>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar servicio" : "Nuevo servicio"}>
        <div className="space-y-4">
          <Input label="Nombre" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Corte, Tinte..." />
          <Input label="Precio (€)" type="number" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} placeholder="15" />
          <Input label="Duración (minutos)" type="number" value={form.duracion_minutos} onChange={e => setForm(f => ({ ...f, duracion_minutos: e.target.value }))} placeholder="30" />
          <div className="flex gap-2 pt-2">
            <Button onClick={guardar} className="flex-1">Guardar</Button>
            <Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── SECCIÓN: HORARIOS ────────────────────────────────────────────────────────

function SectionHorarios({ toast }) {
  const [barberos, setBarberos]       = useState([]);
  const [selBarbero, setSelBarbero]   = useState(null);
  const [horarios, setHorarios]       = useState([]);
  const [modal, setModal]             = useState(false);
  const [editando, setEditando]       = useState(null);
  const [form, setForm]               = useState({ dia_semana: 1, hora_inicio: "10:00", hora_fin: "14:00" });

  useEffect(() => {
    supabase.from("barberos").select("id, nombre").eq("activo", true).order("id")
      .then(({ data }) => {
        setBarberos(data || []);
        if (data?.length > 0) setSelBarbero(data[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selBarbero) return;
    supabase.from("horarios_barbero").select("*").eq("barbero_id", selBarbero).order("dia_semana").order("hora_inicio")
      .then(({ data }) => setHorarios(data || []));
  }, [selBarbero]);

  function abrirModal(h = null) {
    setEditando(h);
    setForm(h
      ? { dia_semana: h.dia_semana, hora_inicio: h.hora_inicio?.substring(0,5), hora_fin: h.hora_fin?.substring(0,5) }
      : { dia_semana: 1, hora_inicio: "10:00", hora_fin: "14:00" }
    );
    setModal(true);
  }

  async function guardar() {
    const payload = { ...form, barbero_id: selBarbero, activo: true };
    if (editando) {
      await supabase.from("horarios_barbero").update(payload).eq("id", editando.id);
    } else {
      await supabase.from("horarios_barbero").insert(payload);
    }
    toast("Horario guardado", "success");
    setModal(false);
    const { data } = await supabase.from("horarios_barbero").select("*").eq("barbero_id", selBarbero).order("dia_semana").order("hora_inicio");
    setHorarios(data || []);
  }

  async function eliminar(id) {
    await supabase.from("horarios_barbero").delete().eq("id", id);
    toast("Franja eliminada", "success");
    const { data } = await supabase.from("horarios_barbero").select("*").eq("barbero_id", selBarbero).order("dia_semana").order("hora_inicio");
    setHorarios(data || []);
  }

  async function toggleActivo(h) {
    await supabase.from("horarios_barbero").update({ activo: !h.activo }).eq("id", h.id);
    const { data } = await supabase.from("horarios_barbero").select("*").eq("barbero_id", selBarbero).order("dia_semana").order("hora_inicio");
    setHorarios(data || []);
  }

  return (
    <div className="space-y-5">
      {/* Selector de barbero */}
      <div className="flex gap-2 flex-wrap">
        {barberos.map(b => (
          <button
            type="button"
            key={b.id}
            onClick={() => setSelBarbero(b.id)}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
              selBarbero === b.id
                ? "bg-amber-400 text-zinc-950 shadow shadow-amber-400/20"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {b.nombre}
          </button>
        ))}
      </div>

      {selBarbero && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => abrirModal()}>+ Añadir franja</Button>
          </div>

          {horarios.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-4xl mb-3">🕐</p>
              <p className="text-zinc-500 text-sm">Sin horarios configurados</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {horarios.map(h => (
                <Card key={h.id} className="p-4 flex items-center gap-4 hover:border-zinc-700 transition-colors">
                  <div className="flex-shrink-0 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-center min-w-[80px]">
                    <p className="text-zinc-100 font-bold text-xs">{DIAS_SEMANA.find(d => d.id === h.dia_semana)?.label}</p>
                    <p className="text-zinc-500 text-[10px] mt-0.5">{h.hora_inicio?.substring(0,5)} – {h.hora_fin?.substring(0,5)}</p>
                  </div>
                  <div className="flex-1">
                    <Badge color={h.activo ? "green" : "gray"}>{h.activo ? "Activo" : "Inactivo"}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => abrirModal(h)}>Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleActivo(h)}>{h.activo ? "Pausar" : "Activar"}</Button>
                    <Button variant="danger" size="sm" onClick={() => eliminar(h.id)}>✕</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar franja" : "Nueva franja horaria"}>
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Día</label>
            <select
              value={form.dia_semana}
              onChange={e => setForm(f => ({ ...f, dia_semana: parseInt(e.target.value) }))}
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition"
            >
              {DIAS_SEMANA.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Hora inicio" type="time" value={form.hora_inicio} onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} />
            <Input label="Hora fin"    type="time" value={form.hora_fin}    onChange={e => setForm(f => ({ ...f, hora_fin: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={guardar} className="flex-1">Guardar</Button>
            <Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── SECCIÓN: ESTADÍSTICAS ────────────────────────────────────────────────────

function SectionEstadisticas() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function cargar() {
      const hoy = fechaHoy();
      const inicioMes = hoy.substring(0, 7) + "-01";

      const [{ data: citasMes }, { data: serviciosTop }, { data: barberoStats }] = await Promise.all([
        supabase.from("citas").select("estado, servicios(precio)").gte("fecha", inicioMes).eq("estado", "confirmada"),
        supabase.from("citas").select("servicios(nombre)").eq("estado", "confirmada").gte("fecha", inicioMes),
        supabase.from("citas").select("barberos(nombre)").eq("estado", "confirmada").gte("fecha", inicioMes),
      ]);

      const ingresosMes = (citasMes || []).reduce((acc, c) => acc + parseFloat(c.servicios?.precio || 0), 0);

      const countServicios: Record<string, number> = {};
      (serviciosTop || []).forEach(c => {
        const n = c.servicios?.nombre;
        if (n) countServicios[n] = (countServicios[n] || 0) + 1;
      });
      const servicioTop = Object.entries(countServicios).sort((a, b) => b[1] - a[1])[0];

      const countBarberos: Record<string, number> = {};
      (barberoStats || []).forEach(c => {
        const n = c.barberos?.nombre;
        if (n) countBarberos[n] = (countBarberos[n] || 0) + 1;
      });
      const barberoTop = Object.entries(countBarberos).sort((a, b) => b[1] - a[1])[0];

      setStats({ citasMes: citasMes?.length || 0, ingresosMes: ingresosMes.toFixed(2), servicioTop, barberoTop, countServicios, countBarberos });
    }
    cargar();
  }, []);

  if (!stats) return (
    <div className="text-center text-zinc-600 py-10">
      <div className="inline-block w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mb-3" />
      <p className="text-sm">Cargando estadísticas...</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Citas este mes"    value={stats.citasMes}              icon="📅" color="blue" />
        <StatCard label="Ingresos este mes" value={`${stats.ingresosMes}€`}     icon="💶" color="emerald" />
        <StatCard label="Servicio estrella" value={stats.servicioTop?.[0] || "—"} icon="✂️" color="amber" />
        <StatCard label="Barbero top"       value={stats.barberoTop?.[0] || "—"} icon="💇" color="zinc" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <SectionTitle>Citas por servicio</SectionTitle>
          <div className="space-y-3 mt-4">
            {Object.entries(stats.countServicios).sort((a, b) => b[1] - a[1]).map(([nombre, count]) => {
              const max = Math.max(...Object.values(stats.countServicios));
              return (
                <div key={nombre}>
                  <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                    <span className="font-medium">{nombre}</span>
                    <span className="font-bold text-amber-400">{count}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle>Citas por barbero</SectionTitle>
          <div className="space-y-3 mt-4">
            {Object.entries(stats.countBarberos).sort((a, b) => b[1] - a[1]).map(([nombre, count]) => {
              const max = Math.max(...Object.values(stats.countBarberos));
              return (
                <div key={nombre}>
                  <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                    <span className="font-medium">{nombre}</span>
                    <span className="font-bold text-emerald-400">{count}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────

const SECCIONES = [
  { id: "citas",        label: "Citas",       icon: "📅" },
  { id: "barberos",     label: "Barberos",     icon: "💇" },
  { id: "servicios",    label: "Servicios",    icon: "✂️" },
  { id: "horarios",     label: "Horarios",     icon: "🕐" },
  { id: "estadisticas", label: "Estadísticas", icon: "📊" },
];

export default function Dashboard() {
  const [seccion, setSeccion] = useState("citas");
  const [toast, setToast]     = useState({ msg: "", type: "success" });

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  }

  return (
    <div className="min-h-screen bg-zinc-950 font-sans">

      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-xl shadow-lg shadow-amber-400/30">
              💈
            </div>
            <div>
              <h1 className="font-black text-zinc-100 leading-none tracking-tight">Peluquería Javier</h1>
              <p className="text-xs text-zinc-500 font-medium">Panel de administración</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-zinc-400">En línea</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="max-w-5xl mx-auto px-4 flex gap-0 pb-0 overflow-x-auto">
          {SECCIONES.map(s => (
            <button
              key={s.id}
              onClick={() => setSeccion(s.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                seccion === s.id
                  ? "border-amber-400 text-amber-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {seccion === "citas"        && <SectionCitas        toast={showToast} />}
        {seccion === "barberos"     && <SectionBarberos     toast={showToast} />}
        {seccion === "servicios"    && <SectionServicios    toast={showToast} />}
        {seccion === "horarios"     && <SectionHorarios     toast={showToast} />}
        {seccion === "estadisticas" && <SectionEstadisticas />}
      </main>

      <Toast message={toast.msg} type={toast.type} />
    </div>
  );
}
