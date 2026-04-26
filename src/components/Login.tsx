'use client'
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("Credenciales incorrectas. Verifica tu email y contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="font-black text-fg text-2xl tracking-tight font-display">CitasWassap</p>
          <p className="text-xs text-fg4 mt-1 uppercase tracking-widest">Premium Salon Admin</p>
        </div>

        <div className="bg-surface border border-line rounded-2xl p-8 shadow-[var(--shadow-2)]">
          <h1 className="text-[20px] font-bold text-fg mb-1 font-display">Bienvenido</h1>
          <p className="text-[13px] text-fg3 mb-7">Accede con tu cuenta de administrador.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <p className="text-[10.5px] font-semibold text-fg4 uppercase tracking-widest">Email</p>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-bg border border-line hover:border-line focus:border-accent rounded-lg px-3.5 py-2.5 text-[13.5px] text-fg placeholder:text-fg4 focus:outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-[10.5px] font-semibold text-fg4 uppercase tracking-widest">Contraseña</p>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg border border-line hover:border-line focus:border-accent rounded-lg px-3.5 py-2.5 text-[13.5px] text-fg placeholder:text-fg4 focus:outline-none transition-colors"
              />
            </div>

            {error && (
              <div className="bg-danger2 border border-danger/20 rounded-lg px-4 py-3">
                <p className="text-[12.5px] text-danger">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent/90 text-accentfg py-2.5 rounded-lg text-[13.5px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
