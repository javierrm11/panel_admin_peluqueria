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
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="font-black text-white text-2xl tracking-tight">CitasWassap</p>
          <p className="text-xs text-muted mt-1 uppercase tracking-widest">Premium Salon Admin</p>
        </div>

        <div className="bg-surface border border-edge rounded-3xl p-8">
          <h1 className="text-2xl font-black text-white mb-1">Bienvenido</h1>
          <p className="text-sm text-muted mb-7">Accede con tu cuenta de administrador.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Email</p>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-surface-2 border border-edge hover:border-edge-light focus:border-brand rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted focus:outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Contraseña</p>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-2 border border-edge hover:border-edge-light focus:border-brand rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted focus:outline-none transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-2xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          ¿Sin cuenta?{' '}
          <a href="/#pricing" className="text-brand hover:underline">Ver planes</a>
        </p>
      </div>
    </div>
  );
}