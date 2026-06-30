import { AV_COLORS } from "./constants";

export function fechaHoy() {
  return new Date().toISOString().split("T")[0];
}

export function fechaSemana() {
  const hoy = new Date();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  return { inicio: lunes.toISOString().split("T")[0], fin: domingo.toISOString().split("T")[0] };
}

export function fechaMes() {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = hoy.getMonth() + 1;
  const lastDay = new Date(y, hoy.getMonth() + 1, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    inicio: `${y}-${pad(m)}-01`,
    fin: `${y}-${pad(m)}-${pad(lastDay)}`,
  };
}

export function formatFechaCorta(fecha: string) {
  if (!fecha) return "—";
  const [y, m, d] = fecha.split("-");
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${d} ${meses[parseInt(m) - 1]}`;
}

export function formatFecha(fecha: string) {
  if (!fecha) return "—";
  const parts = fecha.split("-");
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${parts[2]} ${meses[parseInt(parts[1]) - 1]} ${parts[0]}`;
}

export function formatEUR(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function diasEntre(inicio: string, fin: string) {
  if (!inicio || !fin) return 0;
  const a = new Date(inicio), b = new Date(fin);
  return Math.ceil((b.getTime() - a.getTime()) / 86400000) + 1;
}

export function avColor(name: string) {
  return AV_COLORS[(name?.charCodeAt(0) || 0) % AV_COLORS.length];
}

export function fechaAgendaLabel() {
  const now = new Date();
  const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  return `${dias[now.getDay()]}, ${now.getDate()} de ${meses[now.getMonth()]}`;
}

/* ── Helpers de calendario ─────────────────────────────── */

export function toISO(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function startOfWeek(d: Date) {
  const x = new Date(d);
  const diff = (x.getDay() + 6) % 7; // lunes = 0
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function horaAMin(h: string) {
  if (!h) return 0;
  const [hh, mm] = h.split(":").map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

export function minAHora(min: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

/* Formato 12h estilo Google Calendar: "1pm", "8:30am". */
export function fmtHora12(min: number) {
  let h = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12; if (h === 0) h = 12;
  return m === 0 ? `${h}${ampm}` : `${h}:${String(m).padStart(2, "0")}${ampm}`;
}

/* Rango "1 – 3pm" (omite el sufijo del primero si coincide el meridiano). */
export function fmtRango12(start: number, end: number) {
  const a = fmtHora12(start), b = fmtHora12(end);
  const meridiano = (s: string) => s.slice(-2);
  return meridiano(a) === meridiano(b) ? `${a.slice(0, -2)} – ${b}` : `${a} – ${b}`;
}

/* Etiqueta de la columna de horas: "11 AM", "1 PM". */
export function fmtGutter(h: number) {
  const ampm = h >= 12 ? "PM" : "AM";
  let hh = h % 12; if (hh === 0) hh = 12;
  return `${hh} ${ampm}`;
}

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIAS_LARGOS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES_LARGOS = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

export function diaCorto(d: Date) { return DIAS_CORTOS[d.getDay()]; }
export function diaLargo(d: Date) { return DIAS_LARGOS[d.getDay()]; }
export function mesLargo(d: Date) { return MESES_LARGOS[d.getMonth()]; }

/* Asigna "carriles" a eventos solapados dentro de un mismo día (estilo Google Calendar). */
export function layoutDia<T extends { start: number; end: number }>(eventos: T[]) {
  const ordenados = [...eventos].sort((a, b) => a.start - b.start || a.end - b.end);
  const resultado: (T & { lane: number; lanes: number })[] = [];
  let cluster: T[] = [];
  let clusterFin = -1;

  const volcar = () => {
    const carriles: number[] = []; // último "end" por carril
    const asignados = cluster.map((ev) => {
      let lane = carriles.findIndex((fin) => fin <= ev.start);
      if (lane === -1) { lane = carriles.length; carriles.push(ev.end); }
      else carriles[lane] = ev.end;
      return { ev, lane };
    });
    const total = carriles.length;
    asignados.forEach(({ ev, lane }) => resultado.push({ ...ev, lane, lanes: total }));
    cluster = [];
  };

  for (const ev of ordenados) {
    if (cluster.length && ev.start >= clusterFin) { volcar(); clusterFin = -1; }
    cluster.push(ev);
    clusterFin = Math.max(clusterFin, ev.end);
  }
  if (cluster.length) volcar();
  return resultado;
}
