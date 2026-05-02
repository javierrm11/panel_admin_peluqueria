'use client'
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Copy, Save, Plus, Clock, X as LucideX } from "lucide-react";
import { DIAS_SEMANA } from "./constants";
import { Empty, Avatar, Modal, FormInput } from "./ui";

export default function SectionHorarios({ toast, empresaId }: { toast: (m: string, t?: string) => void; empresaId: string }) {
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
                          title="Eliminar turno"
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
