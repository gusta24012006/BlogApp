'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('globe_color').eq('id', user.id).maybeSingle()
        if (data?.globe_color) {
          router.replace('/dashboard')
        } else {
          router.replace('/onboarding')
        }
      } else {
        router.replace('/login')
      }
    }
    check()
  }, [router])

  return (
    <div style={{
      minHeight: '100vh', background: '#F5F0E8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 600, color: '#2A2520', letterSpacing: -0.5 }}>
          wander<span style={{ color: '#FFB800' }}>log</span>
        </div>
      </div>
    </div>
  )
}