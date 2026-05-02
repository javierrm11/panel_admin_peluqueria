'use client'
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Plus, CalendarDays, ChevronRight, Trash2, Check } from "lucide-react";
import { fechaHoy, diasEntre, formatFechaCorta } from "./utils";
import { Spinner, Empty, KpiStrip, Avatar, Badge, Modal, FormInput, FormSelect } from "./ui";

export default function SectionAusencias({ toast, empresaId }: { toast: (m: string, t?: string) => void; empresaId: string }) {
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
