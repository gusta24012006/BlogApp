'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  username: string
  display_name: string
  bio?: string
  avatar_url?: string
  location?: string
}

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)
    })
  }, [router])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timeout = setTimeout(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, location')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(20)
      setResults(data || [])
      setLoading(false)
    }, 300)
    return () => clearTimeout(timeout)
  }, [query, currentUserId])

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(245,240,232,0.95)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(184,168,152,0.3)',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button onClick={() => router.push('/dashboard')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 18, color: '#8A7A65', padding: '0 4px', flexShrink: 0,
        }}>←</button>
        <div style={{ flex: 1, position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2A2520" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Pesquisar viajantes..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            style={{
              width: '100%', padding: '10px 14px 10px 36px',
              borderRadius: 100, border: '1px solid rgba(184,168,152,0.4)',
              background: '#fff', fontSize: 14, outline: 'none',
              color: '#2A2520', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Resultados */}
      <div style={{ padding: '8px 0' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#B8A898', fontSize: 13 }}>
            A pesquisar...
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 15, color: '#2A2520', fontFamily: 'Georgia, serif', marginBottom: 6 }}>
              Sem resultados para "{query}"
            </div>
            <div style={{ fontSize: 13, color: '#8A7A65' }}>
              Tenta pesquisar por username ou nome
            </div>
          </div>
        )}

        {!loading && !query && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✈️</div>
            <div style={{ fontSize: 15, color: '#2A2520', fontFamily: 'Georgia, serif' }}>
              Descobre outros viajantes
            </div>
            <div style={{ fontSize: 13, color: '#8A7A65', marginTop: 6 }}>
              Pesquisa por nome ou @username
            </div>
          </div>
        )}

        {results.map(profile => (
          <div
            key={profile.id}
            onClick={() => router.push(`/user/${profile.username}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 20px', cursor: 'pointer',
              borderBottom: '1px solid rgba(184,168,152,0.12)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(184,168,152,0.08)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            {/* Avatar */}
            <div style={{
              width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
              border: '2px solid rgba(255,184,0,0.3)', overflow: 'hidden',
              background: 'linear-gradient(135deg, #FFE066, #FFB800)',
            }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                : <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at 35% 30%, #E8C9A8, #8E6B4E)' }} />
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#2A2520', fontFamily: 'Georgia, serif' }}>
                {profile.display_name || profile.username}
              </div>
              <div style={{ fontSize: 12, color: '#8A7A65', marginTop: 2 }}>
                @{profile.username}
                {profile.location && ` · ${profile.location}`}
              </div>
              {profile.bio && (
                <div style={{ fontSize: 12, color: '#6B5D4A', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile.bio}
                </div>
              )}
            </div>

            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B8A898" strokeWidth="1.8" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        ))}
      </div>
    </div>
  )
}