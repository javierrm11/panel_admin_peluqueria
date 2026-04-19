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
      console.error('[Auth] Error cargando empresa:', error.message)
      if (!cached) setLoading(false)
      return
    }

    const id = data?.empresa_id ?? null
    if (id) localStorage.setItem(EMPRESA_CACHE_KEY, id)
    setEmpresaId(id)
    setLoading(false)
  }

  async function manejarSesion(currentSession: Session | null, event?: string) {
    setSession(currentSession)

    if (currentSession) {
      await cargarEmpresa(currentSession.user.id)
      return
    }

    setEmpresaId(null)
    localStorage.removeItem(EMPRESA_CACHE_KEY)
    setLoading(false)

    if (event && event !== 'INITIAL_SESSION') {
      router.replace('/login')
    }
  }

  useEffect(() => {
    let active = true

    async function inicializarSesion() {
      const { data, error } = await supabase.auth.getSession()
      if (!active) return

      if (error) {
        console.error('[Auth] getSession error:', error.message)
        setSession(null)
        setEmpresaId(null)
        setLoading(false)
        return
      }

      await manejarSesion(data.session, 'INITIAL_SESSION')
    }

    void inicializarSesion()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return
      void manejarSesion(nextSession, event)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [router])

  return (
    <AuthContext.Provider value={{ session: session ?? null, empresaId, loading }}>
      {children}
    </AuthContext.Provider>
  )
}