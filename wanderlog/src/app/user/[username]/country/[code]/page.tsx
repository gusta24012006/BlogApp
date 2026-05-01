'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`

interface Post {
  id: string
  title: string
  country_code: string
  country_name: string
  cover_image?: string
  excerpt?: string
  published: boolean
  created_at: string
}

export default function UserCountryBlogPage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  const countryCode = params.code as string

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [countryName, setCountryName] = useState('')
  const [profileId, setProfileId] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: profileData } = await supabase
        .from('profiles').select('id').eq('username', username).maybeSingle()
      if (!profileData) { router.push('/search'); return }
      setProfileId(profileData.id)

      const { data } = await supabase
        .from('posts')
        .select('id, title, country_code, country_name, cover_image, excerpt, published, created_at')
        .eq('country_code', countryCode)
        .eq('user_id', profileData.id)
        .eq('published', true)
        .order('created_at', { ascending: false })

      if (!data || data.length === 0) { router.push(`/user/${username}`); return }

      setPosts(data)
      setCountryName(data[0].country_name)
      setLoading(false)
    }
    load()
  }, [username, countryCode, router])

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#F5F0E8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', system-ui", color: '#8A7A65',
    }}>A carregar...</div>
  )

  const flag = countryCode.toUpperCase().replace(/./g, (c: string) =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{FONTS}</style>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(245,240,232,0.95)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(184,168,152,0.15)',
        padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => router.replace(`/user/${username}`)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#8A7A65', display: 'flex', alignItems: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#2A2520', flex: 1 }}>
          {flag} {countryName}
        </span>
        <span style={{ fontSize: 12, color: '#8A7A65' }}>@{username}</span>
      </div>

      {/* Lista de blogs */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 80px' }}>
        {posts.map(post => (
          <div
            key={post.id}
            onClick={() => router.push(`/blog/${post.id}`)}
            style={{
              background: '#fff', borderRadius: 16,
              marginBottom: 12, overflow: 'hidden',
              border: '1px solid rgba(184,168,152,0.2)',
              cursor: 'pointer', transition: 'transform 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.01)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
          >
            {post.cover_image && (
              <img src={post.cover_image} alt="" style={{ width: '100%', height: 160, objectFit: 'cover' }} />
            )}
            <div style={{ padding: '16px' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#2A2520', lineHeight: 1.3, marginBottom: 6 }}>
                {post.title || 'Sem título'}
              </div>
              {post.excerpt && (
                <div style={{ fontSize: 13, color: '#6B5D4A', lineHeight: 1.5, marginBottom: 10 }}>
                  {post.excerpt.slice(0, 100)}{post.excerpt.length > 100 ? '...' : ''}
                </div>
              )}
              <div style={{ fontSize: 11, color: '#B8A898' }}>
                {new Date(post.created_at).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}