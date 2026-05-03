'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;600&display=swap');`

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
    { label: 'Feed', path: '/feed' },
    { label: 'Pesquisar', path: '/search' },
    { label: '', path: '/blog/new', isCenter: true },
    { label: 'Notif.', path: '/notifications' },
    { label: 'Perfil', path: '/dashboard' },
  ]

  return (
    <>
      <style>{FONTS}</style>
      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 100, width: 'calc(100% - 32px)', maxWidth: 420,
      }}>
        <div style={{
          background: '#F5F0E8',
          borderRadius: 100,
          padding: '8px 10px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 8px 32px rgba(42,37,32,0.15), 0 2px 8px rgba(42,37,32,0.08)',
          border: '0.5px solid rgba(184,168,152,0.3)',
        }}>
          {items.map((item, i) => {
            const active = path === item.path

            if (item.isCenter) {
              return (
                <button key={i} onClick={() => router.push(item.path)} style={{
                  width: 46, height: 46, borderRadius: '50%',
                  background: '#FFB800', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(255,184,0,0.45)',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A2520" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              )
            }

            return (
              <button key={i} onClick={() => router.push(item.path)} style={{
                display: 'flex', alignItems: 'center', gap: active ? 7 : 0,
                padding: active ? '9px 14px' : '9px 10px',
                borderRadius: 100,
                background: active ? '#2A2520' : 'transparent',
                border: 'none', cursor: 'pointer',
                transition: 'all 0.2s ease',
                overflow: 'hidden', flexShrink: 0,
                position: 'relative',
              }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke={active ? '#F5F0E8' : '#8A7A65'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {i === 0 && <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>}
                    {i === 1 && <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}
                    {i === 3 && <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>}
                    {i === 4 && <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}
                  </svg>
                  {i === 3 && unread > 0 && (
                    <div style={{
                      position: 'absolute', top: -2, right: -2,
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#FFB800', border: '1.5px solid #F5F0E8',
                    }} />
                  )}
                </div>
                {active && (
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: '#F5F0E8',
                    fontFamily: "'DM Sans', system-ui", whiteSpace: 'nowrap',
                  }}>
                    {item.label}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
      <div style={{ height: 90 }} />
    </>
  )
}