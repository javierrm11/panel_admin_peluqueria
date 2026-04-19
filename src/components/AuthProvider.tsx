'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

const EMPRESA_CACHE_KEY = 'cw_empresa_id'

interface AuthContextValue {
  session: Session | null
  empresaId: string | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  empresaId: null,
  loading: true,
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  async function cargarEmpresa(userId: string) {
    // Usar caché para mostrar el dashboard de inmediato en recargas
    const cached = localStorage.getItem(EMPRESA_CACHE_KEY)
    if (cached) {
      setEmpresaId(cached)
      setLoading(false)
    }

    const { data, error } = await supabase
      .from('perfiles')
      .select('empresa_id')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error cargando empresa:', error.message)
      if (!cached) setLoading(false)
      return
    }

    const id = data?.empresa_id ?? null
    if (id) localStorage.setItem(EMPRESA_CACHE_KEY, id)
    setEmpresaId(id)
    setLoading(false)
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        if (session) {
          await cargarEmpresa(session.user.id)
        } else {
          setEmpresaId(null)
          localStorage.removeItem(EMPRESA_CACHE_KEY)
          setLoading(false)
        }

        if (event !== 'INITIAL_SESSION') {
          if (session) {
            router.push('/dashboard')
          } else {
            router.push('/login')
          }
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [router])

  return (
    <AuthContext.Provider value={{ session: session ?? null, empresaId, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
