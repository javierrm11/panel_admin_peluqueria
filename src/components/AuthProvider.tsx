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
    console.log('[Auth] cargarEmpresa start', userId)
    const cached = localStorage.getItem(EMPRESA_CACHE_KEY)
    console.log('[Auth] cached empresaId:', cached)
    if (cached) {
      setEmpresaId(cached)
      setLoading(false)
      console.log('[Auth] loading=false (from cache)')
    }

    console.log('[Auth] querying perfiles...')
    const { data, error } = await supabase
      .from('perfiles')
      .select('empresa_id')
      .eq('user_id', userId)
      .single()
    console.log('[Auth] perfiles result:', { data, error: error?.message })

    if (error) {
      console.error('[Auth] Error cargando empresa:', error.message)
      if (!cached) setLoading(false)
      return
    }

    const id = data?.empresa_id ?? null
    if (id) localStorage.setItem(EMPRESA_CACHE_KEY, id)
    setEmpresaId(id)
    setLoading(false)
    console.log('[Auth] loading=false (from DB), empresaId:', id)
  }

  useEffect(() => {
    console.log('[Auth] registering onAuthStateChange')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] onAuthStateChange event:', event, 'session:', !!session)
        setSession(session)
        if (session) {
          await cargarEmpresa(session.user.id)
        } else {
          setEmpresaId(null)
          localStorage.removeItem(EMPRESA_CACHE_KEY)
          setLoading(false)
          console.log('[Auth] loading=false (no session)')
        }

        if (event !== 'INITIAL_SESSION') {
          if (session) {
            console.log('[Auth] redirecting to /dashboard')
            router.push('/dashboard')
          } else {
            console.log('[Auth] redirecting to /login')
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
