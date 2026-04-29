'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=DM+Sans:wght@400;500;600&display=swap');`

interface Notification {
  id: string
  type: 'follow' | 'like' | 'comment'
  actor: { username: string; display_name: string; avatar_url?: string }
  post?: { title: string; country_name: string; country_code: string }
  created_at: string
  read: boolean
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `há ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

export default function NotificationsPage() {
  const router = useRouter()

  // Placeholder — notificações reais vêm na v3
  const mockNotifications: Notification[] = [
    { id: '1', type: 'follow', actor: { username: 'mariaescalada', display_name: 'Maria Escalada', avatar_url: undefined }, created_at: new Date(Date.now() - 5 * 60000).toISOString(), read: false },
    { id: '2', type: 'like', actor: { username: 'leohenriques', display_name: 'Leo Henriques', avatar_url: undefined }, post: { title: 'Sete dias no Japão', country_name: 'Japan', country_code: 'JP' }, created_at: new Date(Date.now() - 35 * 60000).toISOString(), read: false },
    { id: '3', type: 'comment', actor: { username: 'anaAlmeida', display_name: 'Ana Almeida', avatar_url: undefined }, post: { title: 'Estradas onde o vento decide', country_name: 'Morocco', country_code: 'MA' }, created_at: new Date(Date.now() - 2 * 3600000).toISOString(), read: true },
    { id: '4', type: 'follow', actor: { username: 'pedrosantos', display_name: 'Pedro Santos', avatar_url: undefined }, created_at: new Date(Date.now() - 5 * 3600000).toISOString(), read: true },
  ]

  const notifText = (n: Notification) => {
    if (n.type === 'follow') return 'começou a seguir-te.'
    if (n.type === 'like') return `gostou do teu blog "${n.post?.title}".`
    if (n.type === 'comment') return `comentou no teu blog "${n.post?.title}".`
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

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 80 }}>
      <style>{FONTS}</style>

      {/* Header */}
      <div style={{
        padding: '52px 20px 16px',
        background: 'rgba(245,240,232,0.97)', backdropFilter: 'blur(16px)',
        position: 'sticky', top: 0, zIndex: 10,
        borderBottom: '1px solid rgba(184,168,152,0.15)',
      }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 600, color: '#2A2520' }}>
          Notificações
        </div>
      </div>

      {/* Lista */}
      <div style={{ padding: '8px 0' }}>
        {mockNotifications.map((n, i) => (
          <div key={n.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '14px 20px',
            background: n.read ? 'transparent' : 'rgba(255,184,0,0.04)',
            borderBottom: '1px solid rgba(184,168,152,0.1)',
            cursor: 'pointer',
          }}>
            {/* Avatar com badge */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', background: 'radial-gradient(circle at 35% 30%, #E8C9A8, #8E6B4E)' }}>
                {n.actor.avatar_url && <img src={n.actor.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />}
              </div>
              <div style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 22, height: 22, borderRadius: '50%',
                background: iconBg(n.type),
                border: '2px solid #F5F0E8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {notifIcon(n.type)}
              </div>
            </div>

            {/* Texto */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, color: '#2A2520', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600 }}>{n.actor.display_name}</span>
                {' '}
                <span style={{ color: '#4A3F30' }}>{notifText(n)}</span>
              </div>
              <div style={{ fontSize: 12, color: '#B8A898', marginTop: 3 }}>
                {timeAgo(n.created_at)}
              </div>
            </div>

            {/* Dot não lido */}
            {!n.read && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFB800', flexShrink: 0, marginTop: 6 }} />
            )}
          </div>
        ))}
      </div>

      {/* Em breve banner */}
      <div style={{ margin: '20px', padding: '16px', background: 'rgba(255,184,0,0.08)', borderRadius: 16, border: '1px solid rgba(255,184,0,0.2)', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: '#8A6800', fontWeight: 500 }}>Notificações em tempo real em breve</div>
        <div style={{ fontSize: 12, color: '#B8A898', marginTop: 4 }}>Por agora estás a ver uma prévia do aspeto final</div>
      </div>

      <Navbar />
    </div>
  )
}