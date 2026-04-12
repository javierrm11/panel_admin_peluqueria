'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import Dashboard from '@/components/Dashboard'

function Spinner() {
  return (
    <div className="min-h-screen bg-[#eeedf5] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
    </div>
  )
}

export default function DashboardPage() {
  const { session, empresaId, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!session || !empresaId)) {
      router.replace('/login')
    }
  }, [loading, session, empresaId, router])

  if (loading || !session || !empresaId) return <Spinner />

  return <Dashboard empresaId={empresaId} />
}
