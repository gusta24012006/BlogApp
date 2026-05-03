'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const router = useRouter()
  const path = usePathname()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const loadUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
      setUnread(count || 0)
    }
    loadUnread()
  }, [path])

  const items = [
    {
      label: 'Feed',
      path: '/feed',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#FFB800' : 'none'}
          stroke={active ? '#FFB800' : '#8A7A65'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      label: 'Pesquisar',
      path: '/search',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={active ? '#FFB800' : '#8A7A65'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      ),
    },
    {
      label: '',
      path: '/blog/new',
      isCenter: true,
      icon: (_active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="#2A2520" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      ),
    },
    {
      label: 'Notificações',
      path: '/notifications',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={active ? '#FFB800' : '#8A7A65'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      ),
    },
    {
      label: 'Perfil',
      path: '/dashboard',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={active ? '#FFB800' : '#8A7A65'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
  ]

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      padding: '8px 16px 20px',
      background: 'rgba(245,240,232,0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '0.5px solid rgba(184,168,152,0.2)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        maxWidth: 480, margin: '0 auto',
      }}>
        {items.map((item, i) => {
          const active = path === item.path
          if (item.isCenter) {
            return (
              <button
                key={i}
                onClick={() => router.push(item.path)}
                style={{
                  width: 50, height: 50, borderRadius: '50%',
                  background: '#FFB800', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0,
                  boxShadow: '0 4px 16px rgba(255,184,0,0.35)',
                  transform: 'translateY(-6px)',
                }}
              >
                {item.icon(false)}
              </button>
            )
          }
          return (
            <button
              key={i}
              onClick={() => router.push(item.path)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px 10px',
                minWidth: 48, position: 'relative',
              }}
            >
              {/* Círculo discreto na aba ativa */}
              {active && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(255,184,0,0.12)',
                }} />
              )}
              <div style={{ position: 'relative', zIndex: 1 }}>
                {item.icon(active)}
                {item.path === '/notifications' && unread > 0 && (
                  <div style={{
                    position: 'absolute', top: -2, right: -2,
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#FFB800', border: '1.5px solid #F5F0E8',
                  }} />
                )}
              </div>
              {item.label && (
                <span style={{
                  fontSize: 10, color: active ? '#B8860B' : '#8A7A65',
                  fontFamily: "'DM Sans', system-ui", fontWeight: active ? 600 : 400,
                  position: 'relative', zIndex: 1,
                }}>
                  {item.label}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}