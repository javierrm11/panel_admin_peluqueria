'use client'
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { CalendarDays, Download, TrendingUp, TrendingDown } from "lucide-react";
import { fechaHoy, formatEUR } from "./utils";
import { Spinner, Empty, Avatar, Sparkline, THead } from "./ui";

export default function SectionAnalitica({ empresaId }: { empresaId: string }) {
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
