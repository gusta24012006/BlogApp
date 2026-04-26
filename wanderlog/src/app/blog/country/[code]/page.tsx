'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Block {
  id: string
  type: string
  content?: string
  url?: string
  caption?: string
  spotifyUrl?: string
  imageWidth?: number
  imagePosition?: string
}

interface Theme {
  bg: string
  text: string
  font: string
  layout: 'centered' | 'fullwidth' | 'magazine'
  headerType: 'cover' | 'solid' | 'none'
  headerColor: string
}

interface Post {
  id: string
  title: string
  country_code: string
  country_name: string
  blocks: Block[]
  theme: Theme
  published: boolean
  created_at: string
  profiles: { username: string; display_name: string }
}

function renderBlock(block: Block, theme: Theme) {
  switch (block.type) {
    case 'text':
      return (
        <div key={block.id} dangerouslySetInnerHTML={{ __html: block.content || '' }}
          style={{ lineHeight: 1.7, marginBottom: 24 }} />
      )
    case 'image':
      return block.url ? (
        <div key={block.id} style={{
          marginBottom: 24,
          textAlign: (block.imagePosition === 'center' ? 'center' : block.imagePosition === 'right' ? 'right' : 'left') as any,
        }}>
          <img src={block.url} alt={block.caption || ''}
            style={{ width: `${block.imageWidth || 100}%`, borderRadius: 10, display: 'inline-block' }} />
          {block.caption && (
            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', textAlign: 'center', marginTop: 6, fontStyle: 'italic' }}>
              {block.caption}
            </div>
          )}
        </div>
      ) : null
    case 'imagetext':
      return (block as any).url || block.content ? (
        <div key={block.id} style={{
          display: 'flex', gap: 20, marginBottom: 24, alignItems: 'flex-start',
          flexDirection: ((block as any).imagePosition === 'right' ? 'row-reverse' : 'row') as any,
        }}>
          {(block as any).url && (
            <img src={(block as any).url}
              style={{ width: `${(block as any).imageWidth || 40}%`, borderRadius: 10, flexShrink: 0, objectFit: 'cover' }}
              alt="" />
          )}
          <div dangerouslySetInnerHTML={{ __html: block.content || '' }} style={{ flex: 1, lineHeight: 1.7 }} />
        </div>
      ) : null
    case 'video':
      if (!block.url) return null
      const ytMatch = block.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
      const vmMatch = block.url.match(/vimeo\.com\/(\d+)/)
      const embedUrl = ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}`
        : vmMatch ? `https://player.vimeo.com/video/${vmMatch[1]}` : null
      return embedUrl ? (
        <div key={block.id} style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
          <iframe src={embedUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} frameBorder="0" allowFullScreen />
        </div>
      ) : null
    case 'music':
      if (!block.spotifyUrl) return null
      const spMatch = block.spotifyUrl.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/)
      return spMatch ? (
        <div key={block.id} style={{ marginBottom: 24 }}>
          <iframe src={`https://open.spotify.com/embed/${spMatch[1]}/${spMatch[2]}`}
            width="100%" height="80" frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            style={{ borderRadius: 12 }} />
        </div>
      ) : null
    case 'divider':
      return (
        <div key={block.id} style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.1)' }} />
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(0,0,0,0.2)' }} />
          <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.1)' }} />
        </div>
      )
    default:
      return null
  }
}

export default function CountryBlogPage() {
  const params = useParams()
  const router = useRouter()
  const countryCode = params.code as string

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [countryName, setCountryName] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      // Buscar o blog deste país para este utilizador
      const { data } = await supabase
        .from('posts')
        .select('*, profiles(username, display_name)')
        .eq('country_code', countryCode)
        .eq('user_id', user?.id)
        .maybeSingle()

      if (data) {
        setPost(data)
        setCountryName(data.country_name)
        setIsOwner(user?.id === data.user_id)
      } else {
        // Não existe blog — ir para o editor
        // Buscar nome do país a partir do código
        const { data: countryData } = await supabase
          .from('countries_visited')
          .select('country_name')
          .eq('country_code', countryCode)
          .eq('user_id', user?.id)
          .maybeSingle()

        const name = countryData?.country_name || countryCode
        router.replace(`/blog/new?country=${countryCode}&name=${encodeURIComponent(name)}`)
        return
      }

      setLoading(false)
    }
    load()
  }, [countryCode, router])

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#F5F0E8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif', color: '#8A7A65',
    }}>A carregar...</div>
  )

  if (!post) return null

  const theme: Theme = post.theme || {
    bg: '#F5F0E8', text: '#2A2520', font: 'Georgia, serif',
    layout: 'centered', headerType: 'solid', headerColor: '#2A2520',
  }

  const flag = post.country_code.toUpperCase().replace(/./g, (c: string) =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  )

  const maxWidth = theme.layout === 'centered' ? 680 : theme.layout === 'magazine' ? 960 : '100%'

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text, fontFamily: theme.font }}>

      {/* Navbar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(184,168,152,0.2)',
        padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => {
          document.body.style.opacity = '0'
          document.body.style.transition = 'opacity 0.3s'
          setTimeout(() => {
            document.body.style.opacity = ''
            document.body.style.transition = ''
            router.push('/dashboard')
          }, 300)
        }} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 18, color: '#8A7A65',
        }}>←</button>

        <span style={{ fontSize: 13, color: '#8A7A65', fontFamily: 'system-ui', flex: 1 }}>
          {flag} {post.country_name}
        </span>

        {!post.published && (
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 20,
            background: 'rgba(239,159,39,0.15)', color: '#8A6800',
            border: '1px solid rgba(239,159,39,0.3)', fontFamily: 'system-ui',
          }}>Rascunho</span>
        )}

        {/* Botão editar — só para o dono */}
        {isOwner && (
          <button
            onClick={() => router.push(`/blog/edit/${post.id}`)}
            style={{
              padding: '7px 16px', borderRadius: 20,
              background: '#FFB800', border: 'none',
              fontSize: 12, fontWeight: 600, color: '#2A2520',
              cursor: 'pointer',
            }}
          >
            Editar
          </button>
        )}
      </div>

      {/* Header */}
      {theme.headerType !== 'none' && (
        <div style={{
          padding: '56px 24px 40px',
          background: theme.headerType === 'solid' ? (theme.headerColor || '#2A2520') : theme.bg,
        }}>
          <div style={{ maxWidth, margin: '0 auto' }}>
            <div style={{
              fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
              fontFamily: 'system-ui', marginBottom: 12,
              color: theme.headerType === 'solid' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)',
            }}>
              {flag} {post.country_name} · @{post.profiles?.username}
            </div>
            <h1 style={{
              fontSize: 36, fontWeight: 700, lineHeight: 1.2, margin: 0,
              color: theme.headerType === 'solid' ? '#fff' : theme.text,
            }}>
              {post.title}
            </h1>
            <div style={{
              marginTop: 14, fontSize: 13, fontFamily: 'system-ui',
              color: theme.headerType === 'solid' ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.4)',
            }}>
              {new Date(post.created_at).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <div style={{ maxWidth, margin: '0 auto', padding: '40px 24px 80px' }}>
        {post.blocks?.map(block => renderBlock(block, theme))}
        {(!post.blocks || post.blocks.length === 0) && (
          <div style={{
            textAlign: 'center', color: 'rgba(0,0,0,0.3)',
            fontSize: 14, fontFamily: 'system-ui', padding: '40px 0',
          }}>
            Este blog ainda não tem conteúdo.
            {isOwner && (
              <div style={{ marginTop: 16 }}>
                <button onClick={() => router.push(`/blog/edit/${post.id}`)} style={{
                  padding: '10px 24px', borderRadius: 20,
                  background: '#FFB800', border: 'none',
                  color: '#2A2520', fontWeight: 600, cursor: 'pointer', fontSize: 13,
                }}>Começar a escrever</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}