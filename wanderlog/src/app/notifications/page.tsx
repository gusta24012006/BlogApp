'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`

interface Notification {
  id: string
  type: 'follow' | 'like' | 'comment'
  read: boolean
  created_at: string
  actor_id: string
  post_id?: string
  profiles: { username: string; display_name: string; avatar_url?: string }
  posts?: { title: string; country_name: string; country_code: string }
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

const notifText = (n: Notification) => {
  if (n.type === 'follow') return 'começou a seguir-te.'
  if (n.type === 'like') return `gostou do teu blog "${n.posts?.title}".`
  if (n.type === 'comment') return `comentou no teu blog "${n.posts?.title}".`
  return ''
}

const notifIcon = (type: string) => {
  if (type === 'follow') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="2" strokeLinecap="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  )
  if (type === 'like') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#E85D7A" stroke="#E85D7A" strokeWidth="1.5" strokeLinecap="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1B4F8A" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

const iconBg = (type: string) => {
  if (type === 'follow') return 'rgba(255,184,0,0.12)'
  if (type === 'like') return 'rgba(232,93,122,0.12)'
  return 'rgba(27,79,138,0.12)'
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('notifications')
        .select('*, profiles!actor_id(username, display_name, avatar_url), posts(title, country_name, country_code)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      setNotifications(data || [])
      setLoading(false)

      // Marcar todas como lidas
      await supabase.from('notifications').update({ read: true })
        .eq('user_id', user.id).eq('read', false)
    }
    load()
  }, [router])

  const handleClick = (n: Notification) => {
    if (n.type === 'follow') router.push(`/user/${n.profiles?.username}`)
    else if (n.post_id) router.push(`/blog/${n.post_id}`)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', system-ui", color: '#8A7A65' }}>
      A carregar...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 80 }}>
      <style>{FONTS}</style>

      <div style={{
        padding: '52px 20px 16px',
        background: 'rgba(245,240,232,0.97)', backdropFilter: 'blur(16px)',
        position: 'sticky', top: 0, zIndex: 10,
        borderBottom: '1px solid rgba(184,168,152,0.15)',
      }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#2A2520' }}>Notificações</div>
      </div>

      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 20px', color: '#B8A898' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C8BAA8" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 12 }}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#2A2520', marginBottom: 6 }}>Sem notificações</div>
          <div style={{ fontSize: 13 }}>Quando alguém te seguir ou gostar dos teus blogs aparece aqui.</div>
        </div>
      ) : (
        <div style={{ padding: '8px 0' }}>
          {notifications.map(n => (
            <div key={n.id} onClick={() => handleClick(n)} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '14px 20px',
              background: n.read ? 'transparent' : 'rgba(255,184,0,0.04)',
              borderBottom: '1px solid rgba(184,168,152,0.1)',
              cursor: 'pointer',
            }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', background: 'radial-gradient(circle at 35% 30%, #E8C9A8, #8E6B4E)' }}>
                  {n.profiles?.avatar_url && <img src={n.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: '#2A2520', lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 600 }}>{n.profiles?.display_name || n.profiles?.username}</span>
                  {' '}
                  <span style={{ color: '#4A3F30' }}>{notifText(n)}</span>
                </div>
                <div style={{ fontSize: 12, color: '#B8A898', marginTop: 3 }}>{timeAgo(n.created_at)}</div>
              </div>
              {!n.read && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFB800', flexShrink: 0, marginTop: 6 }} />
              )}
            </div>
          ))}
        </div>
      )}

      <Navbar />
    </div>
  )
}