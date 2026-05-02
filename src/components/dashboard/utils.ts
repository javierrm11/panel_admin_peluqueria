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
