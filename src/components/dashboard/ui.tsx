'use client'
import React from "react";
import { X as LucideX } from "lucide-react";
import { avColor } from "./utils";

export function Avatar({ name, size = "md" }: { name: string; size?: "xs" | "sm" | "md" | "lg" }) {
  const sz = {
    xs: "w-5 h-5 text-[9px]",
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-[12px]",
    lg: "w-10 h-10 text-[14px]",
  }[size];
  const { bg, text } = avColor(name);
  const inits = name?.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) ?? "?";
  return (
    <div className={`${sz} ${bg} ${text} rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
      {inits}
    </div>
  );
}

export function Badge({
  variant = "neutral", children,
}: { variant?: "success" | "warning" | "danger" | "info" | "neutral"; children: React.ReactNode }) {
  const map = {
    success: { dot: "bg-success", cls: "bg-success2 text-success border-success/20" },
    warning: { dot: "bg-warning", cls: "bg-warning2 text-warning border-warning/20" },
    danger:  { dot: "bg-danger",  cls: "bg-danger2 text-danger border-danger/20"   },
    info:    { dot: "bg-info",    cls: "bg-info2 text-info border-info/20"         },
    neutral: { dot: "bg-fg4",     cls: "bg-hover text-fg3 border-line"             },
  }[variant];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-[3px] rounded-[4px] text-[11px] font-semibold border ${map.cls}`}>
      <span className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${map.dot}`} />
      {children}
    </span>
  );
}

export function IconChip({ Icon, variant = "neutral" }: { Icon: React.ElementType; variant?: "neutral" | "accent" }) {
  const cls = variant === "accent"
    ? "bg-accent2 text-accent border-accent/20"
    : "bg-surface border-line text-fg3";
  return (
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center border flex-shrink-0 ${cls}`}>
      <Icon size={14} strokeWidth={1.5} />
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-5 h-5 border-2 border-line2 border-t-accent rounded-full animate-spin" />
      <p className="text-[13px] text-fg3">Cargando...</p>
    </div>
  );
}

export function Empty({ msg, icon }: { msg: string; icon?: React.ReactNode }) {
  return (
    <div className="py-16 text-center">
      {icon && <div className="flex justify-center mb-4">{icon}</div>}
      <p className="text-[13px] text-fg3">{msg}</p>
    </div>
  );
}

export function Toast({ message, type = "success" }: { message: string; type?: string }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-surface border border-line text-fg text-[13px] font-medium px-4 py-3 rounded-xl shadow-[var(--shadow-2)]">
      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black text-white ${type === "success" ? "bg-success" : "bg-danger"}`}>
        {type === "success" ? "✓" : "✕"}
      </span>
      {message}
    </div>
  );
}

export function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface border border-line rounded-2xl w-full max-w-md mx-4 p-6 shadow-[var(--shadow-2)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-fg text-[16px]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-fg3 hover:text-fg hover:bg-hover transition-colors"
          >
            <LucideX size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FormInput({
  label, ...props
}: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold uppercase tracking-widest text-fg3">
          {label}
        </label>
      )}
      <input
        className="w-full bg-bg border border-line rounded-lg px-3 py-2.5 text-[13px] text-fg placeholder:text-fg4 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition"
        {...props}
      />
    </div>
  );
}

export function FormSelect({
  label, children, ...props
}: { label?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold uppercase tracking-widest text-fg3">
          {label}
        </label>
      )}
      <select
        className="w-full bg-bg border border-line rounded-lg px-3 py-2.5 text-[13px] text-fg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition appearance-none cursor-pointer"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function KpiStrip({ items }: { items: { label: string; value: React.ReactNode; sub?: string; accent?: boolean }[] }) {
  const cols = 2;
  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden mb-5 sm:mb-6 shadow-[var(--shadow-1)]">
      <div className="grid grid-cols-2 sm:grid-cols-4">
        {items.map((item, i) => {
          const isLastMobileCol = (i + 1) % cols === 0;
          const isLastMobileRow = i >= items.length - cols;
          const isLastDesktopCol = i === items.length - 1;
          return (
            <div
              key={i}
              className={`px-4 sm:px-5 py-3.5 sm:py-4 min-w-0
                ${!isLastMobileCol ? 'border-r border-line' : ''}
                ${!isLastMobileRow ? 'border-b border-line sm:border-b-0' : ''}
                ${!isLastDesktopCol ? 'sm:border-r sm:border-line' : ''}
              `}
            >
              <p className="text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-widest text-fg4 mb-1.5">{item.label}</p>
              <p className={`font-semibold leading-none tabular ${item.accent ? "text-[20px] sm:text-[22px] text-fg font-display" : "text-[18px] sm:text-[20px] text-fg"}`}>
                {item.value}
              </p>
              {item.sub && <p className="text-[11px] sm:text-[11.5px] text-fg4 mt-1.5 leading-snug">{item.sub}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Sparkline({ values, color = "var(--color-accent)" }: { values: number[]; color?: string }) {
  if (values.length < 2) return <span className="text-fg4 text-[11px]">—</span>;
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min || 1;
  const w = 56, h = 20;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline points={pts.join(" ")} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function OccBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-hover rounded-full overflow-hidden min-w-12">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span className="text-[12px] tabular text-fg2 font-medium w-7 text-right">{pct}%</span>
    </div>
  );
}

export function THead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-[10.5px] font-semibold uppercase tracking-widest text-fg4 ${className}`}>
      {children}
    </span>
  );
}
