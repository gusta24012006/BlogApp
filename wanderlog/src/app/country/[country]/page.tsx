'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Post {
  id: string
  title: string
  country_code: string
  country_name: string
  excerpt?: string
  cover_image?: string
  published: boolean
  created_at: string
  theme?: any
}

export default function CountryPage() {
  const params = useParams()
  const router = useRouter()
  const countryName = decodeURIComponent(params.country as string)

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .eq('country_name', countryName)
        .order('created_at', { ascending: false })

      setPosts(data || [])
      setLoading(false)
    }
    load()
  }, [countryName, router])

  const flag = posts[0]?.country_code
    ? posts[0].country_code.toUpperCase().replace(/./g, (c: string) =>
        String.fromCodePoint(c.charCodeAt(0) + 127397)
      )
    : '🌍'

  // Buscar code do país da query string se não há posts
  const countryCode = posts[0]?.country_code || ''

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#F5F0E8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif', color: '#8A7A65',
    }}>A carregar...</div>
  )

  return (
    <div style={{
      minHeight: '100vh', background: '#F5F0E8',
      fontFamily: 'system-ui, sans-serif',
      animation: 'fadeIn 0.4s ease',
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '52px 20px 24px',
        background: '#2A2520',
        position: 'relative',
      }}>
        <button onClick={() => {
          // Fade out e voltar ao dashboard
          document.body.style.opacity = '0'
          document.body.style.transition = 'opacity 0.3s'
          setTimeout(() => {
            document.body.style.opacity = ''
            document.body.style.transition = ''
            router.push('/dashboard')
          }, 300)
        }} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 18, color: 'rgba(255,255,255,0.6)', padding: '0 4px',
          marginBottom: 16, display: 'block',
        }}>←</button>

        <div style={{ fontSize: 48, marginBottom: 8 }}>{flag}</div>
        <h1 style={{
          fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700,
          color: '#fff', margin: 0, lineHeight: 1.1,
        }}>{countryName}</h1>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
          {posts.length} {posts.length === 1 ? 'blog' : 'blogs'}
        </div>
      </div>

      {/* Blogs */}
      <div style={{ padding: '20px 16px 80px' }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✏️</div>
            <div style={{ fontSize: 16, color: '#2A2520', fontFamily: 'Georgia, serif', marginBottom: 8 }}>
              Ainda sem blogs para {countryName}
            </div>
            <div style={{ fontSize: 13, color: '#8A7A65', marginBottom: 24 }}>
              Conta a tua história desta viagem
            </div>
            <button
              onClick={() => router.push(`/blog/new?country=${countryCode}&name=${encodeURIComponent(countryName)}`)}
              style={{
                padding: '12px 28px', borderRadius: 20,
                background: '#FFB800', border: 'none',
                color: '#2A2520', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}
            >
              Criar blog
            </button>
          </div>
        ) : (
          <>
            {posts.map((post, i) => (
              <div
                key={post.id}
                onClick={() => router.push(`/blog/${post.id}`)}
                style={{
                  background: '#fff', borderRadius: 14,
                  border: '1px solid rgba(184,168,152,0.25)',
                  marginBottom: 12, overflow: 'hidden', cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  animation: `fadeIn 0.4s ease ${i * 0.08}s both`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = ''
                  ;(e.currentTarget as HTMLElement).style.boxShadow = ''
                }}
              >
                {/* Cover */}
                <div style={{
                  height: 120,
                  background: post.theme?.headerColor || post.theme?.bg || '#2A2520',
                  display: 'flex', alignItems: 'flex-end',
                  padding: '12px 16px',
                  position: 'relative',
                }}>
                  {!post.published && (
                    <span style={{
                      position: 'absolute', top: 10, right: 10,
                      fontSize: 10, padding: '2px 8px', borderRadius: 20,
                      background: 'rgba(239,159,39,0.2)', color: '#FFD93D',
                      border: '1px solid rgba(239,159,39,0.4)',
                    }}>Rascunho</span>
                  )}
                  <div style={{
                    fontFamily: post.theme?.font || 'Georgia, serif',
                    fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.3,
                  }}>
                    {post.title}
                  </div>
                </div>

                {/* Meta */}
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 12, color: '#8A7A65' }}>
                    {new Date(post.created_at).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 12, color: '#FFB800', fontWeight: 500 }}>
                    Ler →
                  </div>
                </div>
              </div>
            ))}

            {/* Botão novo blog */}
            <button
              onClick={() => router.push(`/blog/new?country=${posts[0]?.country_code || ''}&name=${encodeURIComponent(countryName)}`)}
              style={{
                width: '100%', padding: '14px', borderRadius: 14,
                border: '2px dashed rgba(184,168,152,0.4)',
                background: 'transparent', color: '#8A7A65',
                fontSize: 14, cursor: 'pointer', marginTop: 4,
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#FFB800'
                ;(e.currentTarget as HTMLElement).style.color = '#FFB800'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(184,168,152,0.4)'
                ;(e.currentTarget as HTMLElement).style.color = '#8A7A65'
              }}
            >
              + Novo blog para {countryName}
            </button>
          </>
        )}
      </div>
    </div>
  )
}