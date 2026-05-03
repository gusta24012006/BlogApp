'use client'

import { sanitizeHtml } from '@/lib/sanitize'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import type { Block } from '@/components/editor/BlockEditor'

const BlockEditor = dynamic(() => import('@/components/editor/BlockEditor'), { ssr: false })
const ThemePanel = dynamic(() => import('@/components/editor/ThemePanel'), { ssr: false })

interface Theme {
  bg: string
  text: string
  font: string
  layout: 'centered' | 'fullwidth' | 'magazine'
  headerType: 'cover' | 'solid' | 'none'
  headerColor: string
}

const DEFAULT_THEME: Theme = {
  bg: '#F5F0E8',
  text: '#2A2520',
  font: 'Playfair Display, Georgia, serif',
  layout: 'centered',
  headerType: 'solid',
  headerColor: '#2A2520',
}

function BlogNewContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const countryCode = searchParams.get('country') || ''
  const countryName = searchParams.get('name') || ''

  const [title, setTitle] = useState('')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME)
  const [showTheme, setShowTheme] = useState(false)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
    })
  }, [router])

  const handleSave = async (publish: boolean) => {
    if (!title.trim()) { alert('Adiciona um título ao blog'); return }
    setSaving(true)

    const { error } = await supabase.from('posts').insert({
      user_id: userId,
      country_code: countryCode,
      country_name: countryName,
      title: title.trim(),
      blocks: blocks,
      theme: theme,
      published: publish,
    })

    setSaving(false)
    if (error) { alert('Erro ao guardar: ' + error.message); return }
    router.push('/dashboard')
  }

  const flag = countryCode.toUpperCase().replace(/./g, (c: string) =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  )

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif', background: '#F5F0E8',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px', background: '#fff',
        borderBottom: '1px solid rgba(184,168,152,0.3)',
        flexShrink: 0,
      }}>
        <button onClick={() => router.push('/dashboard')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 20, color: '#8A7A65', padding: '0 4px',
        }}>←</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <span style={{ fontSize: 20 }}>{flag}</span>
          <input
            type="text"
            placeholder={`Título do blog — ${countryName}`}
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 16, fontWeight: 600, color: '#2A2520',
              background: 'transparent', fontFamily: 'Georgia, serif',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => setShowPreview(true)}
            style={{
              padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
              background: 'transparent', border: '1px solid rgba(184,168,152,0.4)',
              color: '#8A7A65',
            }}
          >👁 Preview</button>
          <button
            onClick={() => setShowTheme(!showTheme)}
            style={{
              padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
              background: showTheme ? 'rgba(255,184,0,0.15)' : 'transparent',
              border: `1px solid ${showTheme ? '#FFB800' : 'rgba(184,168,152,0.4)'}`,
              color: showTheme ? '#8A6800' : '#8A7A65',
            }}
          >🎨 Estilo</button>

          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            style={{
              padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
              background: 'transparent', border: '1px solid rgba(184,168,152,0.4)',
              color: '#8A7A65',
            }}
          >Guardar rascunho</button>

          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            style={{
              padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
              background: '#FFB800', border: 'none', color: '#2A2520', fontWeight: 600,
            }}
          >{saving ? 'A publicar...' : 'Publicar'}</button>
        </div>
      </div>

      {/* Editor + painel */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Editor de blocos */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          {/* Preview header */}
          {theme.headerType !== 'none' && (
            <div style={{
              padding: '24px 20px 20px',
              background: theme.headerType === 'solid' ? theme.headerColor : '#2A2520',
              flexShrink: 0,
            }}>
              <div style={{
                fontSize: 10, color: 'rgba(255,255,255,0.5)',
                fontFamily: 'monospace', letterSpacing: 2,
                textTransform: 'uppercase', marginBottom: 6,
              }}>
                {flag} {countryName}
              </div>
              <div style={{
                fontFamily: theme.font,
                fontSize: 22, fontWeight: 700, color: '#fff',
                lineHeight: 1.2,
              }}>
                {title || 'Título do blog'}
              </div>
            </div>
          )}
          <BlockEditor
            blocks={blocks}
            onChange={setBlocks}
            theme={theme}
          />
        </div>



        {/* Painel de estilo */}
        {showTheme && (
          <ThemePanel
            theme={theme}
            onChange={setTheme}
            onClose={() => setShowTheme(false)}
          />
        )}
      </div>
    {/* Modal de preview fullscreen */}
      {showPreview && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: theme.bg, color: theme.text, fontFamily: theme.font,
          overflowY: 'auto',
        }}>
          {/* Botão fechar */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(184,168,152,0.2)',
            padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <button onClick={() => setShowPreview(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 18, color: '#8A7A65',
            }}>←</button>
            <span style={{ fontSize: 13, color: '#8A7A65', fontFamily: 'system-ui', flex: 1 }}>Preview</span>
            <span style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 20,
              background: 'rgba(239,159,39,0.15)', color: '#8A6800',
              border: '1px solid rgba(239,159,39,0.3)', fontFamily: 'system-ui',
            }}>Rascunho</span>
          </div>

          {/* Header */}
          {theme.headerType !== 'none' && (
            <div style={{
              padding: '48px 24px 36px',
              background: theme.headerType === 'solid' ? (theme.headerColor || '#2A2520') : theme.bg,
            }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, fontFamily: 'system-ui' }}>
                {flag} {countryName}
              </div>
              <div style={{ fontFamily: theme.font, fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                {title || 'Título do blog'}
              </div>
            </div>
          )}

          {/* Conteúdo */}
          <div style={{ padding: '32px 20px 80px', maxWidth: 680, margin: '0 auto' }}>
            {blocks.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(0,0,0,0.25)', padding: '40px 0', fontFamily: 'system-ui' }}>
                Sem conteúdo ainda
              </div>
            ) : blocks.map(b => {
              if (b.type === 'text') return <div key={b.id} dangerouslySetInnerHTML={{ __html: sanitizeHtml(b.content || '') }} style={{ marginBottom: 24, lineHeight: 1.7 }} />
              if (b.type === 'image' && b.url) return (
                <div key={b.id} style={{ marginBottom: 24, textAlign: (b.imagePosition === 'center' ? 'center' : b.imagePosition === 'right' ? 'right' : 'left') as any }}>
                  <img src={b.url} style={{ width: `${b.imageWidth || 100}%`, borderRadius: 10 }} alt={b.caption || ''} />
                  {b.caption && <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', textAlign: 'center', marginTop: 6, fontStyle: 'italic' }}>{b.caption}</div>}
                </div>
              )
              if (b.type === 'imagetext') return (
                <div key={b.id} style={{ display: 'flex', gap: 16, marginBottom: 24, flexDirection: (b.imagePosition === 'right' ? 'row-reverse' : 'row') as any, alignItems: 'flex-start' }}>
                  {b.url && <img src={b.url} style={{ width: `${b.imageWidth || 40}%`, borderRadius: 10, flexShrink: 0 }} alt="" />}
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(b.content || '') }} style={{ flex: 1, lineHeight: 1.7 }} />
                </div>
              )
              if (b.type === 'video' && b.url) {
                const yt = b.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
                const vm = b.url.match(/vimeo\.com\/(\d+)/)
                const eu = yt ? `https://www.youtube.com/embed/${yt[1]}` : vm ? `https://player.vimeo.com/video/${vm[1]}` : null
                return eu ? (
                  <div key={b.id} style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
                    <iframe src={eu} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} frameBorder="0" allowFullScreen />
                  </div>
                ) : null
              }
              if (b.type === 'music' && b.spotifyUrl) {
                const sp = b.spotifyUrl.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/)
                return sp ? (
                  <div key={b.id} style={{ marginBottom: 24 }}>
                    <iframe src={`https://open.spotify.com/embed/${sp[1]}/${sp[2]}`} width="100%" height="80" frameBorder="0" style={{ borderRadius: 12 }} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />
                  </div>
                ) : null
              }
              if (b.type === 'divider') return <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}><div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.1)' }} /><div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(0,0,0,0.2)' }} /><div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.1)' }} /></div>
              return null
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function BlogNewPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', background: '#F5F0E8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#8A7A65', fontSize: 14,
      }}>A carregar editor...</div>
    }>
      <BlogNewContent />
    </Suspense>
  )
}