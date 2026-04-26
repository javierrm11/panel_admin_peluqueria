'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import Dashboard from '@/components/Dashboard'
import AdminShell from '@/components/AdminShell'

function Spinner() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-line2 border-t-accent rounded-full animate-spin" />
    </div>
  )
}

export default function DashboardPage() {
  const { session, empresaId, loading } = useAuth()
  const router = useRouter()
  const [seccion, setSeccion] = useState('citas')

  useEffect(() => {
    if (!loading && (!session || !empresaId)) {
      router.replace('/login')
    }
  }, [loading, session, empresaId, router])

  if (loading || !session || !empresaId) return <Spinner />

  return (
    <AdminShell seccion={seccion} onSeccionChange={setSeccion} empresaId={empresaId}>
      <Dashboard empresaId={empresaId} seccion={seccion} />
    </AdminShell>
  )
}