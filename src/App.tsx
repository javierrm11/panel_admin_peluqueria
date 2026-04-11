import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

function Spinner() {
  return (
    <div className="min-h-screen bg-[#eeedf5] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const [session,   setSession]   = useState<any>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [loading,   setLoading]   = useState(true);

  async function cargarEmpresa(userId: string) {
    const { data, error } = await supabase
      .from("perfiles")
      .select("empresa_id")
      .eq("user_id", userId)
      .single();
    if (error) console.error("Error cargando empresa:", error.message);
    setEmpresaId(data?.empresa_id ?? null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) await cargarEmpresa(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) {
          await cargarEmpresa(session.user.id);
          setLoading(false);
        } else {
          setEmpresaId(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <Spinner />;
  if (!session || !empresaId) return <Login />;
  return <Dashboard empresaId={empresaId} />;
}
