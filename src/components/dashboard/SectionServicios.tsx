'use client'
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { fechaHoy, formatEUR } from "./utils";
import { LUCIDE_SERVICE_ICONS } from "./constants";
import { Spinner, Empty, KpiStrip, Badge, IconChip, Modal, FormInput } from "./ui";

export default function SectionServicios({ toast, empresaId }: { toast: (m: string, t?: string) => void; empresaId: string }) {
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
