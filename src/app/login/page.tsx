'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import Login from '@/components/Login'

function Spinner() {
  return (
    <div className="min-h-screen bg-[#eeedf5] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
    </div>
  )
}

export default function LoginPage() {
  const { session, empresaId, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && session && empresaId) {
      router.replace('/dashboard')
    }
  }, [loading, session, empresaId, router])

  if (loading) return <Spinner />

  return <Login />
}
