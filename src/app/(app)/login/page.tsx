'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import Login from '@/components/Login'

export default function LoginPage() {
  const { session, empresaId, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && session && empresaId) {
      router.replace('/dashboard')
    }
  }, [loading, session, empresaId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-line2 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return <Login />
}