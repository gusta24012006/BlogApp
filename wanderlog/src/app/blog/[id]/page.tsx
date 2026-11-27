'use client'

import { sanitizeHtml } from '@/lib/sanitize'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PostActions from '@/components/PostActions'

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
  user_id: string
  title: string
  country_code: string
  country_name: string
  blocks: Block[]
  theme: Theme
  published: boolean
  created_at: string
  profiles: { username: string; display_name: string; avatar_url?: string }
}

function renderBlock(block: Block, theme: Theme) {
  switch (block.type) {
    case 'text':
      return <div key={block.id} dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content || '') }}
        style={{ lineHeight: 1.7, marginBottom: 24 }} />
    case 'image':
      return block.url ? (
        <div key={block.id} style={{ marginBottom: 24, textAlign: (block.imagePosition === 'center' ? 'center' : block.imagePosition === 'right' ? 'right' : 'left') as any }}>
          <img src={block.url} alt={block.caption || ''} style={{ width: `${block.imageWidth || 100}%`, borderRadius: 10, display: 'inline-block' }} />
          {block.caption && <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', textAlign: 'center', marginTop: 6, fontStyle: 'italic' }}>{block.caption}</div>}
        </div>
      ) : null
    case 'imagetext':
      return (block as any).url || block.content ? (
        <div key={block.id} style={{ display: 'flex', gap: 20, marginBottom: 24, alignItems: 'flex-start', flexDirection: ((block as any).imagePosition === 'right' ? 'row-reverse' : 'row') as any }}>
          {(block as any).url && <img src={(block as any).url} style={{ width: `${(block as any).imageWidth || 40}%`, borderRadius: 10, flexShrink: 0, objectFit: 'cover' }} alt="" />}
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content || '') }} style={{ flex: 1, lineHeight: 1.7 }} />
        </div>
      ) : null
    case 'video':
      if (!block.url) return null
      const ytMatch = block.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
      const vmMatch = block.url.match(/vimeo\.com\/(\d+)/)
      const embedUrl = ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}` : vmMatch ? `https://player.vimeo.com/video/${vmMatch[1]}` : null
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
          <iframe src={`https://open.spotify.com/embed/${spMatch[1]}/${spMatch[2]}`} width="100%" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" style={{ borderRadius: 12 }} />
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

export default function BlogByIdPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | undefined>()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      const { data } = await supabase
        .from('posts')
        .select('*, profiles(username, display_name, avatar_url)')
        .eq('id', postId)
        .maybeSingle() // o RLS só devolve rascunhos ao próprio autor

      if (!data) { router.push('/feed'); return }
      setPost(data)
      setLoading(false)
    }
    load()
  }, [postId, router])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', color: '#8A7A65' }}>
      A carregar...
    </div>
  )

  if (!post) return null

  const theme: Theme = post.theme || { bg: '#F5F0E8', text: '#2A2520', font: 'Georgia, serif', layout: 'centered', headerType: 'solid', headerColor: '#2A2520' }
  const flag = post.country_code.toUpperCase().replace(/./g, (c: string) => String.fromCodePoint(c.charCodeAt(0) + 127397))
  const maxWidth = theme.layout === 'centered' ? 680 : theme.layout === 'magazine' ? 960 : '100%'
  const isOwner = currentUserId === post.user_id

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text, fontFamily: theme.font }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      {/* Navbar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(245,240,232,0.95)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(184,168,152,0.15)',
        padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: "'DM Sans', system-ui",
      }}>
        <button onClick={() => {
          const ref = document.referrer
          if (ref && ref.includes(window.location.hostname) && !ref.includes('/blog')) {
            router.back()
          } else {
            router.push('/dashboard')
          }
        }} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#8A7A65', display: 'flex', alignItems: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span style={{ fontSize: 14, color: '#2A2520', fontWeight: 500, flex: 1 }}>
          {flag} {post.country_name}
        </span>
        <span style={{ fontSize: 13, color: '#8A7A65' }}>
          @{post.profiles?.username}
        </span>
        {isOwner && (
          <button
            onClick={() => router.push(`/blog/new?edit=${post.id}`)}
            style={{ padding: '7px 16px', borderRadius: 100, background: '#FFB800', border: 'none', fontSize: 12, fontWeight: 600, color: '#2A2520', cursor: 'pointer', fontFamily: "'DM Sans', system-ui" }}
          >
            {post.published ? 'Editar' : 'Editar rascunho'}
          </button>
        )}
      </div>

      {/* Header */}
      {theme.headerType !== 'none' && (
        <div style={{ padding: '56px 24px 40px', background: theme.headerType === 'solid' ? (theme.headerColor || '#2A2520') : theme.bg }}>
          <div style={{ maxWidth, margin: '0 auto' }}>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'system-ui', marginBottom: 12, color: theme.headerType === 'solid' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)' }}>
              {flag} {post.country_name}
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.2, margin: 0, color: theme.headerType === 'solid' ? '#fff' : theme.text }}>
              {post.title}
            </h1>
            <div style={{ marginTop: 14, fontSize: 13, fontFamily: 'system-ui', color: theme.headerType === 'solid' ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{new Date(post.created_at).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>·</span>
              <span>@{post.profiles?.username}</span>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <div style={{ maxWidth, margin: '0 auto', padding: '40px 24px 24px' }}>
        {post.blocks?.map(block => renderBlock(block, theme))}
        {(!post.blocks || post.blocks.length === 0) && (
          <div style={{ textAlign: 'center', color: 'rgba(0,0,0,0.3)', fontSize: 14, fontFamily: 'system-ui', padding: '40px 0' }}>
            Este blog ainda não tem conteúdo.
          </div>
        )}
      </div>

      <PostActions postId={post.id} userId={currentUserId} />
      <div style={{ height: 40 }} />
    </div>
  )
}