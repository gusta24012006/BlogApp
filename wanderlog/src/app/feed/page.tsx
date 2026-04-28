'use client'

import React, { useEffect, useState, useRef, useMemo, memo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import Navbar from '@/components/Navbar'

const Globe = dynamic(() => import('@/components/Globe'), { ssr: false })

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload = () => resolve()
    s.onerror = reject
    document.head.appendChild(s)
  })
}

interface Post {
  id: string
  user_id: string
  title: string
  country_code: string
  country_name: string
  theme?: any
  profiles: { username: string; display_name: string; avatar_url?: string }
}

// Componente estável que não re-renderiza quando o sheet abre
const GlobeMemo = memo(({ countries, onCountryClick, tab, globeKey, globeResetRef }: {
  countries: string[]
  onCountryClick: (name: string) => void
  tab: string
  globeKey: number
  globeResetRef: React.MutableRefObject<(() => void) | null>
}) => {
  return (
    <Globe
      key={`feed-globe-${tab}-${globeKey}`}
      visitedCountries={countries}
      activeContinent={null}
      onContinentClick={() => {}}
      onCountryClick={onCountryClick}
      feedMode={true}
      onSceneReady={(reset: () => void) => { globeResetRef.current = reset }}
    />
  )
}, (prev, next) => {
  // Só re-renderizar se tab ou globeKey mudarem — não quando países mudam
  return prev.tab === next.tab && prev.globeKey === next.globeKey
})

export default function FeedPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'following' | 'discover'>('following')
  const viewedPostsRef = useRef<Set<string>>(new Set())
  const globeResetRef = useRef<(() => void) | null>(null)
  const [scriptsLoaded, setScriptsLoaded] = useState(false)
  const [dataReady, setDataReady] = useState(false)
  const followingCountriesRef = useRef<string[]>([])
  const followingCountriesAllRef = useRef<string[]>([])
  const discoverCountriesRef = useRef<string[]>([])
  const [followingCountries, setFollowingCountries] = useState<string[]>([])
  const [followingCountriesAll, setFollowingCountriesAll] = useState<string[]>([])
  const [discoverCountries, setDiscoverCountries] = useState<string[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [activePost, setActivePost] = useState<Post | null>(null)
  const [showSheet, setShowSheet] = useState(false)
  const [loading, setLoading] = useState(true)
  const [globeKey, setGlobeKey] = useState(0)
  const [postAuthorFollowers, setPostAuthorFollowers] = useState(0)
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [postBlocks, setPostBlocks] = useState<any[]>([])
  const [blogExpanded, setBlogExpanded] = useState(false)

  useEffect(() => {
    const init = async () => {
      // Carregar dados ANTES de ativar o Globe
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)

      // Países de posts de pessoas que segues
      const { data: follows } = await supabase
        .from('follows').select('following_id').eq('follower_id', user.id)
      const followingIds = follows?.map((f: any) => f.following_id) || []

      if (followingIds.length > 0) {
        const { data: viewedData } = await supabase
          .from('post_views').select('post_id').eq('user_id', user.id)
        const viewedIds = viewedData?.map((v: any) => v.post_id) || []
        viewedIds.forEach((id: string) => viewedPostsRef.current.add(id))
        
        const { data: followingPosts } = await supabase
          .from('posts').select('id, country_name').eq('published', true).in('user_id', followingIds)
        
        const allCountries = [...new Set((followingPosts || []).map((p: any) => p.country_name))]
        const unviewedPosts = (followingPosts || []).filter((p: any) => !viewedIds.includes(p.id))
        const unviewedCountries = [...new Set(unviewedPosts.map((p: any) => p.country_name))]
        
        followingCountriesRef.current = unviewedCountries
        // Só mostrar países que ainda têm posts não vistos
        followingCountriesAllRef.current = unviewedCountries
      }

      // "Encontrar" — posts de pessoas públicas que não segues
      // Buscar IDs de utilizadores privados
      const { data: privateUsers } = await supabase
        .from('profiles').select('id').eq('is_private', true)
      const privateIds = privateUsers?.map((p: any) => p.id) || []

      let discoverQuery = supabase
        .from('posts')
        .select('country_name')
        .eq('published', true)
        .neq('user_id', user.id)
      if (followingIds.length > 0) discoverQuery = discoverQuery.not('user_id', 'in', `(${followingIds.join(',')})`)
      if (privateIds.length > 0) discoverQuery = discoverQuery.not('user_id', 'in', `(${privateIds.join(',')})`)
      const { data: allPosts } = await discoverQuery
      discoverCountriesRef.current = [...new Set(allPosts?.map((p: any) => p.country_name) || [])]

      // Agora sim — carregar scripts e ativar Globe com dados fixos nas refs
      await loadScript('https://unpkg.com/three@0.155.0/build/three.min.js')
      await loadScript('https://unpkg.com/topojson-client@3.1.0/dist/topojson-client.min.js')
      
      // Atualizar states uma única vez antes de mostrar o Globe
      setFollowingCountries(followingCountriesRef.current)
      setFollowingCountriesAll(followingCountriesAllRef.current)
      setDiscoverCountries(discoverCountriesRef.current)
      setDataReady(true)
      setScriptsLoaded(true)
      setLoading(false)
    }
    init()
  }, [router])

  const handleCountryClick = useCallback(async (countryName: string) => {
    const { data: posts } = await supabase
      .from('posts')
      .select('*, profiles(username, display_name, avatar_url)')
      .eq('country_name', countryName)
      .eq('published', true)
      .neq('user_id', currentUserId)
      .limit(1)

    if (posts && posts.length > 0) {
      const post = posts[0]
      setActivePost(post)
      setPostBlocks(post.blocks || [])
      setBlogExpanded(false)
      setShowSheet(true)

      // Buscar seguidores do autor
      const { count } = await supabase
        .from('follows').select('*', { count: 'exact', head: true })
        .eq('following_id', post.user_id)
      setPostAuthorFollowers(count || 0)

      // Verificar se já segue
      if (currentUserId) {
        const { data: fData } = await supabase
          .from('follows').select('id')
          .eq('follower_id', currentUserId)
          .eq('following_id', post.user_id)
          .maybeSingle()
        setIsFollowingAuthor(!!fData)
      }

      // Marcar como visto (só no tab "a seguir")
      if (tab === 'following' && currentUserId) {
        await supabase.from('post_views').upsert({
          user_id: currentUserId, post_id: post.id
        }, { onConflict: 'user_id,post_id' })
        // Guardar como visto na ref (sem re-render do Globe)
        viewedPostsRef.current.add(post.id)
      }
    }
  }, [currentUserId, tab])

  const activeCountries = tab === 'following' ? followingCountriesAll : discoverCountries
  // Forçar re-render do Globe quando países mudam
  const countriesKey = activeCountries.join(',')

  return (
    <div style={{
      width: '100%', height: '100vh', background: '#1a1a2e',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif', position: 'relative',
    }}>

      {/* Abas tipo TikTok — em cima ao centro */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        display: 'flex', justifyContent: 'center', padding: '52px 0 16px',
        background: 'linear-gradient(to bottom, rgba(26,26,46,0.8) 0%, transparent 100%)',
      }}>
        <div style={{ display: 'flex', gap: 24 }}>
          {(['following', 'discover'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
                fontSize: 16, fontWeight: tab === t ? 700 : 400,
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.5)',
                fontFamily: 'system-ui',
                borderBottom: tab === t ? '2px solid #FFB800' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              {t === 'following' ? 'A seguir' : 'Encontrar'}
            </button>
          ))}
        </div>
      </div>

      {/* Globo fullscreen */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {scriptsLoaded && dataReady && (
          <GlobeMemo
            countries={activeCountries}
            onCountryClick={handleCountryClick}
            tab={tab}
            globeKey={globeKey}
            globeResetRef={globeResetRef}
          />
        )}
      </div>

      {/* Sheet do post */}
      {showSheet && activePost && (
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
            background: '#fff', borderRadius: '20px 20px 0 0',
            padding: '20px 20px 100px',
            transform: showSheet ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
            maxHeight: blogExpanded ? '92vh' : '70vh', overflowY: 'auto',
          }}
        >
          {/* Handle */}
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: 'rgba(184,168,152,0.4)', margin: '0 auto 20px',
          }} />

          {/* Perfil do autor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div
              onClick={() => router.push(`/user/${activePost.profiles?.username}`)}
              style={{
                width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                border: '2px solid rgba(255,184,0,0.3)',
                background: 'linear-gradient(135deg, #FFE066, #FFB800)', cursor: 'pointer',
              }}
            >
              {activePost.profiles?.avatar_url
                ? <img src={activePost.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                : <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at 35% 30%, #E8C9A8, #8E6B4E)' }} />
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#2A2520', fontFamily: 'Georgia, serif' }}>
                {activePost.profiles?.display_name || activePost.profiles?.username}
              </div>
              <div style={{ fontSize: 12, color: '#8A7A65', marginTop: 2 }}>
                @{activePost.profiles?.username} · {postAuthorFollowers} seguidores
              </div>
            </div>
            {currentUserId && (
              <button
                onClick={async () => {
                  if (!currentUserId) return
                  setFollowLoading(true)
                  if (isFollowingAuthor) {
                    await supabase.from('follows').delete()
                      .eq('follower_id', currentUserId).eq('following_id', activePost.user_id)
                    setIsFollowingAuthor(false)
                    setPostAuthorFollowers(c => c - 1)
                  } else {
                    await supabase.from('follows').insert({ follower_id: currentUserId, following_id: activePost.user_id })
                    setIsFollowingAuthor(true)
                    setPostAuthorFollowers(c => c + 1)
                  }
                  setFollowLoading(false)
                }}
                disabled={followLoading}
                style={{
                  padding: '7px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600,
                  background: isFollowingAuthor ? 'transparent' : '#FFB800',
                  border: isFollowingAuthor ? '1px solid rgba(184,168,152,0.5)' : 'none',
                  color: isFollowingAuthor ? '#8A7A65' : '#2A2520',
                  cursor: 'pointer', flexShrink: 0,
                }}
              >
                {isFollowingAuthor ? 'A seguir' : 'Seguir'}
              </button>
            )}
          </div>

          {/* Header do post */}
          <div style={{
            padding: '24px 20px 20px',
            background: activePost.theme?.headerColor || '#2A2520',
            borderRadius: 14, marginBottom: 16,
          }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              {activePost.country_name}
            </div>
            <div style={{
              fontFamily: activePost.theme?.font || 'Georgia, serif',
              fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.3,
            }}>
              {activePost.title}
            </div>
          </div>

          {/* Botão expandir / fechar */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              onClick={() => setBlogExpanded(!blogExpanded)}
              style={{
                flex: 1, padding: '12px', borderRadius: 100,
                background: '#FFB800', border: 'none',
                color: '#2A2520', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}
            >
              {blogExpanded ? 'Minimizar' : 'Ler blog'}
            </button>
            <button
              onClick={() => {
            setShowSheet(false)
            setBlogExpanded(false)
            globeResetRef.current?.()
            // Verificar se há mais posts não vistos para este país
            if (activePost && tab === 'following') {
              const viewed = viewedPostsRef.current
              supabase
                .from('posts')
                .select('id')
                .eq('country_name', activePost.country_name)
                .eq('published', true)
                .neq('user_id', currentUserId)
                .then(({ data }) => {
                  const remaining = (data || []).filter((p: any) => !viewed.has(p.id))
                  if (remaining.length === 0) {
                    // Esperar zoom out terminar antes de recriar o Globe
                    setTimeout(() => {
                      setFollowingCountriesAll(prev => prev.filter(c => c !== activePost.country_name))
                      setGlobeKey(k => k + 1)
                    }, 800)
                  }
                })
            }
          }}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'transparent', border: '1px solid rgba(184,168,152,0.4)',
                color: '#8A7A65', fontSize: 18, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Conteúdo do blog inline */}
          {blogExpanded && postBlocks.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {postBlocks.map((block: any) => {
                if (block.type === 'text') return (
                  <div key={block.id} dangerouslySetInnerHTML={{ __html: block.content || '' }}
                    style={{ lineHeight: 1.7, marginBottom: 20, fontSize: 15, color: activePost.theme?.text || '#2A2520', fontFamily: activePost.theme?.font || 'Georgia, serif' }} />
                )
                if (block.type === 'image' && block.url) return (
                  <div key={block.id} style={{ marginBottom: 20 }}>
                    <img src={block.url} style={{ width: '100%', borderRadius: 10 }} alt={block.caption || ''} />
                    {block.caption && <div style={{ fontSize: 12, color: '#8A7A65', textAlign: 'center', marginTop: 6, fontStyle: 'italic' }}>{block.caption}</div>}
                  </div>
                )
                if (block.type === 'divider') return (
                  <div key={block.id} style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.1)' }} />
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(0,0,0,0.2)' }} />
                    <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.1)' }} />
                  </div>
                )
                if (block.type === 'music' && block.spotifyUrl) {
                  const sp = block.spotifyUrl.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/)
                  return sp ? (
                    <div key={block.id} style={{ marginBottom: 20 }}>
                      <iframe src={`https://open.spotify.com/embed/${sp[1]}/${sp[2]}`} width="100%" height="80" frameBorder="0" style={{ borderRadius: 12 }} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />
                    </div>
                  ) : null
                }
                return null
              })}
            </div>
          )}
        </div>
      )}

      {/* Mensagem se não há posts */}
      {!loading && activeCountries.length === 0 && !showSheet && (
        <div style={{
          position: 'absolute', bottom: 120, left: 0, right: 0,
          textAlign: 'center', padding: '0 40px', zIndex: 20,
        }}>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            {tab === 'following'
              ? 'As pessoas que segues ainda não publicaram blogs.\nSegue mais viajantes para ver as suas histórias.'
              : 'Ainda não há blogs publicados para descobrir.'
            }
          </div>
          {tab === 'following' && (
            <button onClick={() => router.push('/search')} style={{
              marginTop: 16, padding: '10px 24px', borderRadius: 100,
              background: '#FFB800', border: 'none',
              color: '#2A2520', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}>
              Encontrar viajantes
            </button>
          )}
        </div>
      )}

      <Navbar />
    </div>
  )
}