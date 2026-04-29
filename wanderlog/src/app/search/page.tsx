'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

interface Profile {
  id: string; username: string; display_name: string; avatar_url?: string; location?: string
}
interface BlogResult {
  id: string; title: string; country_code: string; country_name: string
  cover_image?: string
  profiles: { username: string; display_name: string; avatar_url?: string }
}

function parseQuery(q: string) {
  const parts = q.trim().split(/\s+/)
  if (parts.length >= 2) return { type: 'user_country' as const, username: parts[0], country: parts.slice(1).join(' ') }
  return { type: 'user' as const }
}

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=DM+Sans:wght@400;500;600&display=swap');`

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [userResults, setUserResults] = useState<Profile[]>([])
  const [blogResults, setBlogResults] = useState<BlogResult[]>([])
  const [featuredBlogs, setFeaturedBlogs] = useState<BlogResult[]>([])
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'countries'>('users')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [myCountries, setMyCountries] = useState<string[]>([])
  const [myFollowing, setMyFollowing] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)
      const [countriesRes, followingRes, featuredRes] = await Promise.all([
        supabase.from('countries_visited').select('country_name').eq('user_id', user.id),
        supabase.from('follows').select('profiles(username)').eq('follower_id', user.id),
        supabase.from('posts').select('id, title, country_code, country_name, cover_image, profiles(username, display_name, avatar_url)').eq('published', true).limit(4),
      ])
      setMyCountries(countriesRes.data?.map((c: any) => c.country_name) || [])
      setMyFollowing((followingRes.data as any)?.map((f: any) => f.profiles?.username).filter(Boolean) || [])
      setFeaturedBlogs((featuredRes.data as any) || [])
    })
  }, [router])

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return }
    const q = query.toLowerCase()
    const countrySuggestions = myCountries.filter(c => c.toLowerCase().startsWith(q)).slice(0, 3)
    const userSuggestions = myFollowing.filter(u => u.toLowerCase().startsWith(q)).map(u => `@${u}`).slice(0, 3)
    setSuggestions([...countrySuggestions, ...userSuggestions].slice(0, 5))
  }, [query, myCountries, myFollowing])

  const handleSuggestionClick = (s: string) => {
    setQuery(s.startsWith('@') ? s.slice(1) : s)
    setShowSuggestions(false)
  }

  useEffect(() => {
    if (!query.trim()) { setUserResults([]); setBlogResults([]); return }
    const timeout = setTimeout(async () => {
      setLoading(true)
      const parsed = parseQuery(query)
      if (parsed.type === 'user_country') {
        const { data: profileData } = await supabase.from('profiles').select('id, username').ilike('username', `%${parsed.username}%`).limit(1).maybeSingle()
        if (profileData) {
          const { data: posts } = await supabase.from('posts').select('id, title, country_code, country_name, cover_image, profiles(username, display_name, avatar_url)').eq('user_id', profileData.id).eq('published', true).ilike('country_name', `%${parsed.country}%`).limit(5)
          setBlogResults((posts as any) || []); setUserResults([]); setActiveTab('countries')
        } else { setBlogResults([]); setUserResults([]) }
      } else {
        const [usersRes, blogsRes] = await Promise.all([
          supabase.from('profiles').select('id, username, display_name, avatar_url, location').or(`username.ilike.%${query}%,display_name.ilike.%${query}%`).limit(10),
          supabase.from('posts').select('id, title, country_code, country_name, cover_image, profiles(username, display_name, avatar_url)').eq('published', true).ilike('country_name', `%${query}%`).limit(15)
        ])
        setUserResults(usersRes.data || [])
        setBlogResults((blogsRes.data as any) || [])
        if ((usersRes.data?.length || 0) === 0 && (blogsRes.data?.length || 0) > 0) setActiveTab('countries')
        else setActiveTab('users')
      }
      setLoading(false)
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  const hasUsers = userResults.length > 0
  const hasBlogs = blogResults.length > 0
  const isEmpty = !loading && query.trim() && !hasUsers && !hasBlogs
  const showHome = !query.trim()

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 80 }}>
      <style>{FONTS}</style>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(245,240,232,0.97)', backdropFilter: 'blur(16px)',
        padding: '52px 20px 14px',
      }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A7A65" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setShowSuggestions(true) }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Pessoas, países ou @user país..."
            style={{
              width: '100%', padding: '12px 40px 12px 44px', borderRadius: 14,
              border: 'none', background: 'rgba(42,37,32,0.07)',
              fontSize: 15, outline: 'none', color: '#2A2520',
              boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif",
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(138,122,101,0.2)', border: 'none', cursor: 'pointer',
              width: 20, height: 20, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#6B5D4A', fontSize: 13,
            }}>×</button>
          )}
          {/* Sugestões */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, marginTop: 6,
              background: '#fff', borderRadius: 14, overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(42,37,32,0.12)',
            }}>
              {suggestions.map((s, i) => (
                <button key={s} onMouseDown={() => handleSuggestionClick(s)} style={{
                  width: '100%', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10,
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: i < suggestions.length - 1 ? '1px solid rgba(184,168,152,0.12)' : 'none',
                  textAlign: 'left',
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,184,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="2" strokeLinecap="round">
                      {s.startsWith('@')
                        ? <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>
                        : <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>
                      }
                    </svg>
                  </div>
                  <span style={{ fontSize: 14, color: '#2A2520', fontWeight: 500 }}>{s}</span>
                  <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B8A898" strokeWidth="2" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        {hasUsers && hasBlogs && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {(['users', 'countries'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding: '6px 16px', borderRadius: 100, fontSize: 13, fontWeight: 500,
                background: activeTab === t ? '#2A2520' : 'transparent',
                border: activeTab === t ? 'none' : '1px solid rgba(184,168,152,0.4)',
                color: activeTab === t ? '#fff' : '#8A7A65',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {t === 'users' ? `Pessoas` : `Países`}
                <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>
                  {t === 'users' ? userResults.length : blogResults.length}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Home state */}
      {showHome && (
        <div style={{ padding: '8px 20px 24px' }}>
          {/* Pesquisas sugeridas */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8A7A65', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
              Pesquisas sugeridas
            </div>
            {[
              { label: 'Japan', sub: 'Todos os blogs sobre o Japão', icon: 'globe' },
              { label: 'gustavotibe Japan', sub: 'Blog direto do utilizador', icon: 'user' },
              { label: '@mariaescalada', sub: 'Ver perfil', icon: 'user' },
            ].map((s, i) => (
              <button key={i} onClick={() => setQuery(s.label)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 12, marginBottom: 6,
                background: '#fff', border: '1px solid rgba(184,168,152,0.18)',
                cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,184,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="1.8" strokeLinecap="round">
                    {s.icon === 'user'
                      ? <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>
                      : <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>
                    }
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#2A2520' }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: '#8A7A65', marginTop: 1 }}>{s.sub}</div>
                </div>
                <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8BAA8" strokeWidth="1.8" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            ))}
          </div>

          {/* Em destaque */}
          {featuredBlogs.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#8A7A65', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                Em destaque
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {featuredBlogs.slice(0, 4).map(blog => {
                  const flag = blog.country_code.toUpperCase().replace(/./g, (c: string) => String.fromCodePoint(c.charCodeAt(0) + 127397))
                  const colors = ['#7B2D6B', '#1B4F8A', '#2D6A4F', '#B8560A']
                  const ci = featuredBlogs.indexOf(blog) % colors.length
                  return (
                    <button key={blog.id}
                      onClick={() => router.push(`/user/${blog.profiles?.username}/country/${blog.country_code}`)}
                      style={{
                        borderRadius: 16, overflow: 'hidden', border: 'none', cursor: 'pointer',
                        background: blog.cover_image ? 'transparent' : colors[ci],
                        padding: 0, textAlign: 'left', position: 'relative',
                        height: 120,
                      }}
                    >
                      {blog.cover_image
                        ? <img src={blog.cover_image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        : null
                      }
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: blog.cover_image ? 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' : 'none',
                        padding: '12px 12px',
                        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', lineHeight: 1.3, fontFamily: "'Playfair Display', Georgia, serif" }}>
                          {blog.title}
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>
                          {blog.country_name}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '32px', color: '#B8A898', fontSize: 13 }}>A pesquisar...</div>
      )}

      {isEmpty && (
        <div style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ fontSize: 15, color: '#2A2520', fontFamily: "'Playfair Display', Georgia, serif", marginBottom: 6 }}>
            Sem resultados para "{query}"
          </div>
          <div style={{ fontSize: 13, color: '#8A7A65' }}>Tenta um país, username ou "@user país"</div>
        </div>
      )}

      {/* Utilizadores */}
      {!loading && !showHome && (activeTab === 'users' || !hasBlogs) && userResults.map(profile => (
        <div key={profile.id}
          onClick={() => router.push(profile.id === currentUserId ? '/dashboard' : `/user/${profile.username}`)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid rgba(184,168,152,0.1)' }}
        >
          <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: 'linear-gradient(135deg, #FFE066, #FFB800)' }}>
            {profile.avatar_url ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at 35% 30%, #E8C9A8, #8E6B4E)' }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#2A2520' }}>{profile.display_name || profile.username}</div>
            <div style={{ fontSize: 12, color: '#8A7A65', marginTop: 2 }}>@{profile.username}{profile.location ? ` · ${profile.location}` : ''}</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8BAA8" strokeWidth="1.8" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      ))}

      {/* Blogs */}
      {!loading && !showHome && (activeTab === 'countries' || !hasUsers) && blogResults.map(blog => {
        const flag = blog.country_code.toUpperCase().replace(/./g, (c: string) => String.fromCodePoint(c.charCodeAt(0) + 127397))
        return (
          <div key={blog.id}
            onClick={() => router.push(`/user/${blog.profiles?.username}/country/${blog.country_code}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid rgba(184,168,152,0.1)' }}
          >
            <div style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: 'rgba(255,184,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              {flag}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#2A2520', fontFamily: "'Playfair Display', Georgia, serif" }}>{blog.title}</div>
              <div style={{ fontSize: 12, color: '#8A7A65', marginTop: 2 }}>{blog.country_name} · @{blog.profiles?.username}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8BAA8" strokeWidth="1.8" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        )
      })}

      <Navbar />
    </div>
  )
}