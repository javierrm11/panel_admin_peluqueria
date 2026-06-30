'use client'
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { fechaHoy, formatEUR } from "./utils";
import { Spinner, Empty, Avatar, Sparkline, THead } from "./ui";

export default function SectionAnalitica({ empresaId }: { empresaId: string }) {
  const [stats, setStats]     = useState<any>(null);
  const [periodo, setPeriodo] = useState<"1m"|"3m"|"6m"|"12m">("6m");
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    async function cargar() {
      const hoy = fechaHoy();
      const inicioMes = hoy.substring(0, 7) + "-01";
      const now = new Date();
      const inicio12m = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString().split('T')[0];
      const claveMes = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const keyActual = claveMes(now);
      const keyPrev = claveMes(new Date(now.getFullYear(), now.getMonth() - 1, 1));

      const [{ data: citasMes }, { data: serviciosTop }, { data: barberoStats }, { data: clientes }, { data: citasHistorico }, { data: citasMesAll }] = await Promise.all([
        supabase.from("citas").select("estado, servicios(precio), fecha").eq("empresa_id", empresaId).gte("fecha", inicioMes).eq("estado", "confirmada"),
        supabase.from("citas").select("servicios(nombre)").eq("empresa_id", empresaId).eq("estado", "confirmada").gte("fecha", inicioMes),
        supabase.from("citas").select("barberos(nombre), servicios(precio)").eq("empresa_id", empresaId).eq("estado", "confirmada").gte("fecha", inicioMes),
        supabase.from("clientes").select("id").eq("empresa_id", empresaId),
        supabase.from("citas").select("fecha, estado, servicios(precio)").eq("empresa_id", empresaId).gte("fecha", inicio12m),
        supabase.from("citas").select("estado").eq("empresa_id", empresaId).gte("fecha", inicioMes),
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

      // Tendencia: agrupar ingresos y citas por mes (últimos 12, solo confirmadas)
      const MESES_CORTOS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
      const trendLabels12m: string[] = [];
      const monthlyRevenue: Record<string, number> = {};
      const monthlyCount: Record<string, number> = {};
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyRevenue[key] = 0;
        monthlyCount[key] = 0;
        trendLabels12m.push(MESES_CORTOS[d.getMonth()]);
      }
      (citasHistorico || []).forEach((c: any) => {
        if (c.estado !== "confirmada") return;
        const key = c.fecha?.substring(0, 7);
        if (key && key in monthlyRevenue) {
          monthlyRevenue[key] += parseFloat(c.servicios?.precio || 0);
          monthlyCount[key] += 1;
        }
      });
      const trendData12m = Object.values(monthlyRevenue);

      // Comparativa vs. mes anterior
      const prevIngresos = monthlyRevenue[keyPrev] || 0;
      const prevCitas = monthlyCount[keyPrev] || 0;
      const deltaIngresosPct = prevIngresos > 0 ? ((ingresosMes - prevIngresos) / prevIngresos) * 100 : (ingresosMes > 0 ? 100 : 0);
      const deltaCitasPct = prevCitas > 0 ? ((countCitas - prevCitas) / prevCitas) * 100 : (countCitas > 0 ? 100 : 0);

      // Tasa de cancelación del mes en curso
      const totalMes = citasMesAll?.length || 0;
      const canceladasMes = (citasMesAll || []).filter((c: any) => c.estado === "cancelada").length;
      const tasaCancelacion = totalMes > 0 ? (canceladasMes / totalMes) * 100 : 0;

      setStats({
        ingresosMes, countCitas, ticketPromedio, nuevosClientes: clientes?.length || 0,
        countServicios, sortedServicios, totalServicios, barberoData, trendLabels12m, trendData12m,
        prevIngresos, prevCitas, deltaIngresosPct, deltaCitasPct,
        totalMes, canceladasMes, tasaCancelacion,
        keyActual, keyPrev,
      });
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

  async function descargarInforme() {
    setGenerando(true);
    try {
      // Datos de la empresa (nombre + logo si existen). select("*") evita 400 por columnas ausentes.
      let empresaNombre = "Tu negocio";
      let logoUrl: string | null = null;
      try {
        const { data } = await supabase.from("empresas").select("*").eq("id", empresaId).single();
        const d = data as any;
        if (d?.nombre) empresaNombre = d.nombre;
        if (d?.logo_url) logoUrl = d.logo_url;
      } catch { /* genérico */ }

      const logo = logoUrl ? await cargarLogo(logoUrl) : null;

      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      generarInformePDF(doc, { empresaNombre, logo, stats, sortedBarberos, donutSlices, donutTotal });

      const fecha = new Date().toISOString().split("T")[0];
      doc.save(`Informe-${empresaNombre.replace(/[^\w-]+/g, "_")}-${fecha}.pdf`);
    } catch (e) {
      console.error(e);
      alert("No se pudo generar el informe. Inténtalo de nuevo.");
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 py-5 sm:py-7 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-semibold text-fg font-display leading-tight">Analítica</h1>
          <p className="text-[13px] text-fg3 mt-0.5">Rendimiento del centro · últimos 6 meses</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          <button type="button" onClick={descargarInforme} disabled={generando}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accentfg text-[12.5px] sm:text-[13px] font-semibold hover:bg-accent/90 transition-colors whitespace-nowrap disabled:opacity-60">
            <Download size={13} className="flex-shrink-0" /> <span className="hidden xs:inline">{generando ? "Generando…" : "Descargar "}</span>informe
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

/* ── Informe PDF (jsPDF, vectorial — sin html2canvas/oklch) ─────────── */

type RGB = [number, number, number];
const C = {
  accent: [79, 70, 229] as RGB,
  ink: [29, 32, 48] as RGB,
  gray: [134, 134, 154] as RGB,
  faint: [160, 160, 174] as RGB,
  border: [236, 236, 243] as RGB,
  faintB: [243, 243, 248] as RGB,
  panel: [250, 250, 254] as RGB,
  track: [238, 238, 245] as RGB,
  grid: [232, 232, 239] as RGB,
  green: [22, 163, 74] as RGB,
  red: [220, 38, 38] as RGB,
  white: [255, 255, 255] as RGB,
};

function cargarLogo(url: string): Promise<{ dataUrl: string; w: number; h: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        resolve({ dataUrl: c.toDataURL("image/png"), w: img.naturalWidth, h: img.naturalHeight });
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
    setTimeout(() => resolve(null), 4000);
  });
}

const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1).replace(".", ",")}%`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

type SetText = (size: number, color: RGB, style?: "normal" | "bold") => void;
type Col = { t: string; w: number; align: "left" | "right" };
type Cell = { t: string; color?: RGB };

function generarInformePDF(doc: any, { empresaNombre, logo, stats, sortedBarberos, donutSlices, donutTotal }: {
  empresaNombre: string;
  logo: { dataUrl: string; w: number; h: number } | null;
  stats: any;
  sortedBarberos: [string, { count: number; revenue: number }][];
  donutSlices: any[];
  donutTotal: number;
}) {
  const PW = 210, M = 15, R = PW - M;
  const innerW = R - M;
  let y = 0;

  const setText: SetText = (size, color, style = "normal") => {
    doc.setFont("helvetica", style); doc.setFontSize(size); doc.setTextColor(color[0], color[1], color[2]);
  };
  const ensure = (need: number) => { if (y + need > 282) { doc.addPage(); y = 18; } };

  // Barra superior
  doc.setFillColor(C.accent[0], C.accent[1], C.accent[2]);
  doc.roundedRect(M, 12, innerW, 1.8, 0.9, 0.9, "F");

  // Logo (imagen o monograma)
  const logoY = 17, logoSz = 15;
  if (logo) {
    const ar = logo.w / logo.h;
    let lw = logoSz, lh = logoSz;
    if (ar > 1) lh = logoSz / ar; else lw = logoSz * ar;
    try { doc.addImage(logo.dataUrl, "PNG", M + (logoSz - lw) / 2, logoY + (logoSz - lh) / 2, lw, lh); } catch { /* ignore */ }
  } else {
    doc.setFillColor(C.accent[0], C.accent[1], C.accent[2]);
    doc.roundedRect(M, logoY, logoSz, logoSz, 3.5, 3.5, "F");
    const ini = empresaNombre.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "·";
    setText(13, C.white, "bold");
    doc.text(ini, M + logoSz / 2, logoY + logoSz / 2 + 1.9, { align: "center" });
  }

  // Cabecera
  const hx = M + logoSz + 5;
  setText(7.5, C.accent, "bold");
  doc.text("INFORME DE ANALÍTICA", hx, 20.5);
  setText(18, C.ink, "bold");
  doc.text(clip(empresaNombre, 32), hx, 27.5);
  setText(9.5, C.gray);
  doc.text(`Rendimiento de ${cap(new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" }))}`, hx, 32.5);

  setText(9.5, C.ink, "bold");
  doc.text(new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }), R, 20.5, { align: "right" });
  setText(8, C.gray);
  doc.text("Generado automáticamente", R, 25, { align: "right" });

  y = 44;

  // ── KPIs ──
  y = sectionTitle(doc, "RESUMEN DEL MES", M, y, setText);
  const kpis: { l: string; v: string; d: number | null }[] = [
    { l: "Ingresos del mes", v: `${formatEUR(stats.ingresosMes)} €`, d: stats.deltaIngresosPct },
    { l: "Citas del mes", v: `${stats.countCitas}`, d: stats.deltaCitasPct },
    { l: "Ticket medio", v: `${formatEUR(stats.ticketPromedio)} €`, d: null },
    { l: "Clientes", v: `${stats.nuevosClientes}`, d: null },
  ];
  const gap = 4, cardW = (innerW - 3 * gap) / 4, cardH = 26;
  kpis.forEach((k, i) => {
    const x = M + i * (cardW + gap);
    doc.setFillColor(C.panel[0], C.panel[1], C.panel[2]);
    doc.setDrawColor(C.border[0], C.border[1], C.border[2]); doc.setLineWidth(0.2);
    doc.roundedRect(x, y, cardW, cardH, 2.6, 2.6, "FD");
    setText(7, C.gray, "bold");
    doc.text(k.l.toUpperCase(), x + 4, y + 6.5);
    setText(15, C.ink, "bold");
    doc.text(k.v, x + 4, y + 14.5);
    if (k.d !== null) {
      const up = k.d >= 0;
      setText(7.5, up ? C.green : C.red, "bold");
      const dtxt = fmtPct(k.d);
      doc.text(dtxt, x + 4, y + 21);
      const dw = doc.getTextWidth(dtxt);
      setText(7, C.faint);
      doc.text(" vs. mes ant.", x + 4 + dw, y + 21);
    }
  });
  y += cardH + 12;

  // ── Comparativa ──
  ensure(40);
  y = sectionTitle(doc, "COMPARATIVA VS. MES ANTERIOR", M, y, setText);
  const compCols: Col[] = [
    { t: "Métrica", w: innerW * 0.4, align: "left" },
    { t: "Mes anterior", w: innerW * 0.2, align: "right" },
    { t: "Mes actual", w: innerW * 0.2, align: "right" },
    { t: "Variación", w: innerW * 0.2, align: "right" },
  ];
  const dIng = stats.deltaIngresosPct as number, dCit = stats.deltaCitasPct as number;
  const compRows: Cell[][] = [
    [{ t: "Ingresos" }, { t: `${formatEUR(stats.prevIngresos)} €` }, { t: `${formatEUR(stats.ingresosMes)} €` }, { t: fmtPct(dIng), color: dIng >= 0 ? C.green : C.red }],
    [{ t: "Citas confirmadas" }, { t: `${stats.prevCitas}` }, { t: `${stats.countCitas}` }, { t: fmtPct(dCit), color: dCit >= 0 ? C.green : C.red }],
    [{ t: "Tasa de cancelación" }, { t: "—" }, { t: `${stats.tasaCancelacion.toFixed(1).replace(".", ",")}%` }, { t: "—", color: C.faint }],
  ];
  y = drawTable(doc, M, y, compCols, compRows, setText);
  y += 12;

  // ── Tendencia ──
  ensure(70);
  y = sectionTitle(doc, "TENDENCIA DE INGRESOS · ÚLTIMOS 12 MESES", M, y, setText);
  const chartH = 52;
  doc.setDrawColor(C.border[0], C.border[1], C.border[2]); doc.setLineWidth(0.2);
  doc.roundedRect(M, y, innerW, chartH, 3, 3, "S");
  drawChart(doc, M + 7, y + 6, innerW - 14, chartH - 17, stats.trendData12m, stats.trendLabels12m, setText);
  const totalAnual = (stats.trendData12m as number[]).reduce((a, b) => a + b, 0);
  setText(8.5, C.gray);
  doc.text(`Total acumulado 12 meses: ${formatEUR(totalAnual)} €`, M + 7, y + chartH - 4);
  y += chartH + 12;

  // ── Mix de servicios ──
  ensure(30);
  y = sectionTitle(doc, `MIX DE SERVICIOS · ${donutTotal} RESERVAS`, M, y, setText);
  if (!donutSlices.length) {
    setText(9, C.faint);
    doc.text("Sin reservas registradas este mes.", M, y + 3);
    y += 10;
  } else {
    const barX = M + 55, barW = innerW - 55 - 28, rowH = 8;
    donutSlices.forEach((s: any) => {
      ensure(rowH);
      const pct = Math.round(s.pct * 100);
      setText(9.5, C.ink);
      doc.text(clip(s.nombre, 28), M, y + 4);
      doc.setFillColor(C.track[0], C.track[1], C.track[2]);
      doc.roundedRect(barX, y + 1.4, barW, 3.4, 1.7, 1.7, "F");
      doc.setFillColor(C.accent[0], C.accent[1], C.accent[2]);
      doc.roundedRect(barX, y + 1.4, Math.max(2, (pct / 100) * barW), 3.4, 1.7, 1.7, "F");
      setText(8.5, C.gray);
      doc.text(`${s.count} · ${pct}%`, R, y + 4, { align: "right" });
      y += rowH;
    });
  }
  y += 10;

  // ── Ranking por profesional ──
  ensure(30);
  y = sectionTitle(doc, "RENDIMIENTO POR PROFESIONAL", M, y, setText);
  const barCols: Col[] = [
    { t: "#", w: 12, align: "left" },
    { t: "Profesional", w: innerW - 12 - 30 - 42, align: "left" },
    { t: "Citas", w: 30, align: "right" },
    { t: "Ingresos", w: 42, align: "right" },
  ];
  const barRows: Cell[][] = sortedBarberos.length
    ? sortedBarberos.map(([nombre, d], i) => [{ t: `${i + 1}`, color: C.faint }, { t: clip(nombre, 34) }, { t: `${d.count}` }, { t: `${formatEUR(d.revenue)} €` }])
    : [[{ t: "Sin datos este mes.", color: C.faint }, { t: "" }, { t: "" }, { t: "" }]];
  y = drawTable(doc, M, y, barCols, barRows, setText);

  // ── Pie de página en todas las páginas ──
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(C.border[0], C.border[1], C.border[2]); doc.setLineWidth(0.2);
    doc.line(M, 287, R, 287);
    setText(7.5, C.faint);
    doc.text(`${clip(empresaNombre, 40)} · Informe de analítica`, M, 291);
    doc.text(`CitasWassap · ${p}/${pages}`, R, 291, { align: "right" });
  }
}

function sectionTitle(doc: any, text: string, x: number, y: number, setText: SetText) {
  setText(8, C.gray, "bold");
  doc.text(text, x, y);
  return y + 6;
}

function drawTable(doc: any, x: number, y: number, cols: Col[], rows: Cell[][], setText: SetText) {
  const right = x + cols.reduce((a, c) => a + c.w, 0);
  setText(7.5, C.gray, "bold");
  let cx = x;
  cols.forEach((c) => {
    const tx = c.align === "right" ? cx + c.w - 2 : cx + 2;
    doc.text(c.t.toUpperCase(), tx, y + 4, { align: c.align });
    cx += c.w;
  });
  y += 7;
  doc.setDrawColor(C.border[0], C.border[1], C.border[2]); doc.setLineWidth(0.2);
  doc.line(x, y, right, y);
  rows.forEach((row) => {
    y += 8.5;
    cx = x;
    row.forEach((cell, i) => {
      const c = cols[i];
      setText(9.5, cell.color ?? C.ink, "normal");
      const tx = c.align === "right" ? cx + c.w - 2 : cx + 2;
      doc.text(cell.t, tx, y - 1.5, { align: c.align });
      cx += c.w;
    });
    doc.setDrawColor(C.faintB[0], C.faintB[1], C.faintB[2]);
    doc.line(x, y + 1.5, right, y + 1.5);
  });
  return y + 4;
}

function drawChart(doc: any, x: number, y: number, w: number, h: number, values: number[], labels: string[], setText: SetText) {
  const max = Math.max(...values, 1);
  doc.setDrawColor(C.grid[0], C.grid[1], C.grid[2]); doc.setLineWidth(0.15);
  for (let g = 0; g <= 4; g++) { const gy = y + h - (g / 4) * h; doc.line(x, gy, x + w, gy); }
  const pts = values.map((v, i) => {
    const px = values.length <= 1 ? x + w / 2 : x + (i / (values.length - 1)) * w;
    const py = y + h - (v / max) * h;
    return [px, py] as [number, number];
  });
  doc.setDrawColor(C.accent[0], C.accent[1], C.accent[2]); doc.setLineWidth(0.8);
  for (let i = 1; i < pts.length; i++) doc.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
  doc.setFillColor(C.accent[0], C.accent[1], C.accent[2]);
  pts.forEach((p) => doc.circle(p[0], p[1], 0.8, "F"));
  setText(6.5, C.faint);
  labels.forEach((l, i) => { if (pts[i]) doc.text(l, pts[i][0], y + h + 4, { align: "center" }); });
}
