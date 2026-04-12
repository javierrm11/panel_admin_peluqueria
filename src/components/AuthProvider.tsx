'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

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
    const { data, error } = await supabase
      .from('perfiles')
      .select('empresa_id')
      .eq('user_id', userId)
      .single()
    if (error) console.error('Error cargando empresa:', error.message)
    setEmpresaId(data?.empresa_id ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session) await cargarEmpresa(session.user.id)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') return
        setSession(session)
        if (session) {
          await cargarEmpresa(session.user.id)
          router.push('/dashboard')
        } else {
          setEmpresaId(null)
          router.push('/login')
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
