'use client'

import { sanitizeHtml } from '@/lib/sanitize'

import { loadScript } from '@/lib/loadScript'

import React, { useEffect, useState, useRef, memo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import Navbar from '@/components/Navbar'

const Globe = dynamic(() => import('@/components/Globe'), { ssr: false })

const CONTINENT_NAMES = ['Europe', 'Asia', 'Africa', 'N. America', 'S. America', 'Oceania']
const CONTINENT_PT: Record<string, string> = {
  'Europe': 'Europa', 'Asia': 'Ásia', 'Africa': 'África',
  'N. America': 'N. América', 'S. América': 'S. América', 'Oceania': 'Oceânia',
  'S. America': 'S. América',
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

interface StoryAuthor {
  id: string
  username: string
  display_name: string
  avatar_url?: string
  globe_color?: string
  countries: string[]
  newPostCountry: string
  highlightCountries: string[]
}

const GlobeMemo = memo(({ countries, onCountryClick, tab, globeKey, globeResetRef, searchFnRef, handleCountryClickRef, globeColor, highlightCountries, isAuthorMode, noGlow, activeContinent, onContinentClickRef }: {
  countries: string[]
  onCountryClick: (name: string) => void
  tab: string
  globeKey: number
  globeResetRef: React.MutableRefObject<(() => void) | null>
  searchFnRef: React.MutableRefObject<((name: string) => boolean) | null>
  handleCountryClickRef: React.MutableRefObject<((name: string) => void) | null>
  globeColor?: string
  highlightCountries?: string[]
  isAuthorMode: boolean
  noGlow?: boolean
  activeContinent: string | null
  onContinentClickRef: React.MutableRefObject<((name: string) => void) | null>
}) => {
  return (
    <Globe
      key={`feed-globe-${tab}-${globeKey}`}
      visitedCountries={countries}
      activeContinent={activeContinent}
      onContinentClick={(name) => onContinentClickRef.current?.(name)}
      onCountryClick={onCountryClick}
      feedMode={true}
      globeColor={globeColor}
      highlightCountries={highlightCountries}
      noGlow={noGlow}
      onSceneReady={(reset: () => void) => { globeResetRef.current = reset }}
      onSearchReady={(fn: (name: string) => boolean) => { searchFnRef.current = fn }}
    />
  )
}, (prev, next) => {
  return prev.tab === next.tab && prev.globeKey === next.globeKey && prev.globeColor === next.globeColor && prev.isAuthorMode === next.isAuthorMode && prev.noGlow === next.noGlow && prev.activeContinent === next.activeContinent
})

export default function FeedPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'following' | 'discover'>('following')
  const viewedPostsRef = useRef<Set<string>>(new Set())
  const globeResetRef = useRef<(() => void) | null>(null)
  const searchFnRef = useRef<((name: string) => boolean) | null>(null)
  const handleCountryClickRef = useRef<((name: string) => void) | null>(null)
  const onContinentClickRef = useRef<((name: string) => void) | null>(null)
  const [scriptsLoaded, setScriptsLoaded] = useState(false)
  const [dataReady, setDataReady] = useState(false)
  const [followingCountriesAll, setFollowingCountriesAll] = useState<string[]>([])
  const [discoverCountries, setDiscoverCountries] = useState<string[]>([])
  const [storyAuthors, setStoryAuthors] = useState<StoryAuthor[]>([])
  const [activeAuthor, setActiveAuthor] = useState<StoryAuthor | null>(null)
  const [currentUserId, setCurrentUserId] = useState('')
  const [activePost, setActivePost] = useState<Post | null>(null)
  const [showSheet, setShowSheet] = useState(false)
  const [loading, setLoading] = useState(true)
  const [globeKey, setGlobeKey] = useState(0)
  const [globeOpacity, setGlobeOpacity] = useState(1)
  const [activeGlobeColor, setActiveGlobeColor] = useState<string | undefined>(undefined)
  const [activeHighlightCountries, setActiveHighlightCountries] = useState<string[]>([])
  const [postAuthorFollowers, setPostAuthorFollowers] = useState(0)
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [postBlocks, setPostBlocks] = useState<any[]>([])
  const [blogExpanded, setBlogExpanded] = useState(false)
  const [activeContinent, setActiveContinent] = useState<string | null>(null)
  const viewedPostsRef2 = useRef<Set<string>>(new Set())

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)

      const { data: follows } = await supabase
        .from('follows').select('following_id').eq('follower_id', user.id)
      const followingIds = follows?.map((f: any) => f.following_id) || []

      if (followingIds.length > 0) {
        const { data: viewedData } = await supabase
          .from('post_views').select('post_id').eq('user_id', user.id)
        const viewedIds = viewedData?.map((v: any) => v.post_id) || []
        viewedIds.forEach((id: string) => viewedPostsRef.current.add(id))

        const { data: followingPosts } = await supabase
          .from('posts').select('id, country_name, user_id').eq('published', true).in('user_id', followingIds)

        const unviewedPosts = (followingPosts || []).filter((p: any) => !viewedIds.includes(p.id))
        const unviewedCountries = [...new Set(unviewedPosts.map((p: any) => p.country_name))]
        setFollowingCountriesAll(unviewedCountries)

        // Buscar autores com posts novos para as histórias
        const authorsWithNew = [...new Set(unviewedPosts.map((p: any) => p.user_id))]
        if (authorsWithNew.length > 0) {
          const { data: authorProfiles } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, globe_color')
            .in('id', authorsWithNew)

          const { data: authorCountries } = await supabase
            .from('countries_visited').select('user_id, country_name').in('user_id', authorsWithNew)

          const stories: StoryAuthor[] = (authorProfiles || []).map((p: any) => {
            const newPost = unviewedPosts.find((post: any) => post.user_id === p.id)
            // Todos os países visitados — para o globo base
            const allCountries = (authorCountries || [])
              .filter((c: any) => c.user_id === p.id)
              .map((c: any) => c.country_name)
            // Só países com posts não vistos — para piscar
            const unviewedCountriesForAuthor = [...new Set(
              unviewedPosts.filter((post: any) => post.user_id === p.id).map((post: any) => post.country_name)
            )]
            return {
              id: p.id,
              username: p.username,
              display_name: p.display_name,
              avatar_url: p.avatar_url,
              globe_color: p.globe_color,
              countries: allCountries,
              newPostCountry: newPost?.country_name || '',
              highlightCountries: unviewedCountriesForAuthor,
            }
          })
          setStoryAuthors(stories)
        }
      }

      // Discover
      const { data: privateUsers } = await supabase
        .from('profiles').select('id').eq('is_private', true)
      const privateIds = privateUsers?.map((p: any) => p.id) || []
      let discoverQuery = supabase.from('posts').select('country_name').eq('published', true).neq('user_id', user.id)
      if (followingIds.length > 0) discoverQuery = discoverQuery.not('user_id', 'in', `(${followingIds.join(',')})`)
      if (privateIds.length > 0) discoverQuery = discoverQuery.not('user_id', 'in', `(${privateIds.join(',')})`)
      const { data: allPosts } = await discoverQuery
      setDiscoverCountries([...new Set(allPosts?.map((p: any) => p.country_name) || [])])

      await loadScript('https://unpkg.com/three@0.155.0/build/three.min.js')
      await loadScript('https://unpkg.com/topojson-client@3.1.0/dist/topojson-client.min.js')
      setDataReady(true)
      setScriptsLoaded(true)
      setLoading(false)
    }
    init()
  }, [router])

  // Transição suave ao mudar de autor
  const handleAuthorClick = useCallback(async (author: StoryAuthor) => {
    if (activeAuthor?.id === author.id) {
      // Desselecionar — voltar ao globo geral
      setGlobeOpacity(0)
      setTimeout(() => {
        setActiveAuthor(null)
        setActiveGlobeColor(undefined)
        setActiveHighlightCountries([])
        setGlobeKey(k => k + 1)
        setGlobeOpacity(1)
      }, 350)
      return
    }
    // Zoom out → mudar globo → zoom in
    setGlobeOpacity(0)
    setTimeout(() => {
      setActiveAuthor(author)
      setActiveGlobeColor(author.globe_color)
      setActiveHighlightCountries(author.highlightCountries)
      setGlobeKey(k => k + 1)
      setTimeout(() => {
        setGlobeOpacity(1)
      }, 100)
    }, 350)
  }, [activeAuthor])

  const handleCountryClick = useCallback(async (countryName: string) => {
    if (!currentUserId) return
    const targetUserId = activeAuthor?.id || null

    // Buscar posts não vistos deste país
    let query = supabase
      .from('posts')
      .select('id, country_code, user_id, profiles(username)')
      .eq('country_name', countryName)
      .eq('published', true)
      .neq('user_id', currentUserId)

    if (targetUserId) query = query.eq('user_id', targetUserId)

    const { data: posts } = await query
    if (!posts || posts.length === 0) return

    const unviewed = posts.filter((p: any) => !viewedPostsRef.current.has(p.id))
    const toShow = unviewed.length > 0 ? unviewed : posts

    if (toShow.length > 1) {
      // Múltiplos posts — abrir lista
      const countryCode = toShow[0].country_code
      const authorUsername = (toShow[0].profiles as any)?.username
      if (targetUserId && authorUsername) {
        router.push(`/user/${authorUsername}/country/${countryCode}?from=feed`)
      } else {
        router.push(`/blog/country/${countryCode}?from=feed`)
      }
      return
    }

    // 1 post — abrir sheet
    const { data: fullPost } = await supabase
      .from('posts')
      .select('*, profiles(username, display_name, avatar_url)')
      .eq('id', toShow[0].id)
      .maybeSingle()

    if (!fullPost) return
    setActivePost(fullPost)
    setPostBlocks(fullPost.blocks || [])
    setBlogExpanded(false)
    setShowSheet(true)
    setTimeout(() => searchFnRef.current?.(countryName), 300)

    const { count } = await supabase
      .from('follows').select('*', { count: 'exact', head: true }).eq('following_id', fullPost.user_id)
    setPostAuthorFollowers(count || 0)

    if (currentUserId) {
      const { data: fData } = await supabase
        .from('follows').select('id')
        .eq('follower_id', currentUserId).eq('following_id', fullPost.user_id).maybeSingle()
      setIsFollowingAuthor(!!fData)
    }

    if (tab === 'following' && currentUserId) {
      await supabase.from('post_views').upsert({ user_id: currentUserId, post_id: fullPost.id }, { onConflict: 'user_id,post_id' })
      viewedPostsRef.current.add(fullPost.id)
    }
  }, [currentUserId, tab, activeAuthor, router])

  handleCountryClickRef.current = handleCountryClick
  onContinentClickRef.current = (name: string) => setActiveContinent(prev => prev === name ? null : name)

  const activeCountries = activeAuthor
    ? activeAuthor.countries
    : tab === 'following' ? followingCountriesAll : discoverCountries

  return (
    <div style={{
      width: '100%', height: '100vh', background: '#110D0A',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: "'DM Sans', system-ui, sans-serif", position: 'relative',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '52px 16px 16px',
        background: 'linear-gradient(to bottom, rgba(17,13,10,0.9) 0%, transparent 100%)',
      }}>
        {/* Seta voltar ao globo geral */}
        <div style={{ position: 'absolute', left: 16, top: 52, display: 'flex', alignItems: 'center' }}>
          {activeAuthor && (
            <button onClick={() => handleAuthorClick(activeAuthor)} style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer',
              borderRadius: '50%', width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(10px)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 100, padding: 4, backdropFilter: 'blur(12px)', border: '0.5px solid rgba(255,255,255,0.1)' }}>
          {(['following', 'discover'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setActiveAuthor(null); setActiveGlobeColor(undefined); setActiveHighlightCountries([]); setGlobeKey(k => k + 1) }} style={{
              padding: '7px 20px', borderRadius: 100, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              background: tab === t ? '#FFB800' : 'transparent',
              color: tab === t ? '#2A2520' : 'rgba(255,255,255,0.6)',
              transition: 'all 0.2s',
            }}>
              {t === 'following' ? 'A seguir' : 'Encontrar'}
            </button>
          ))}
        </div>

        {/* Botão reset posição */}
        <div style={{ position: 'absolute', right: 16, top: 52 }}>
          <button onClick={() => globeResetRef.current?.()} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer',
            borderRadius: '50%', width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.2" strokeLinecap="round">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Pills de continente */}
      {!showSheet && (
        <div style={{
          position: 'absolute', top: 110, left: 0, right: 0, zIndex: 21,
          display: 'flex', justifyContent: 'center', padding: '0 16px',
          pointerEvents: 'none',
        }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', pointerEvents: 'all' }}>
            {CONTINENT_NAMES.map(c => {
              const isActive = activeContinent === c
              return (
                <button key={c} onClick={() => setActiveContinent(isActive ? null : c)} style={{
                  padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 500,
                  border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  background: isActive ? '#FFB800' : 'rgba(245,240,232,0.85)',
                  color: isActive ? '#2A2520' : '#2A2520',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.15s',
                }}>{CONTINENT_PT[c] || c}</button>
              )
            })}
          </div>
        </div>
      )}

      {/* Globo */}
      <div style={{ position: 'absolute', inset: 0, opacity: globeOpacity, transition: 'opacity 0.35s ease' }}>
        {scriptsLoaded && dataReady && (
          <GlobeMemo
            countries={activeCountries}
            onCountryClick={handleCountryClick}
            tab={tab}
            globeKey={globeKey}
            globeResetRef={globeResetRef}
            searchFnRef={searchFnRef}
            handleCountryClickRef={handleCountryClickRef}
            globeColor={activeGlobeColor}
            highlightCountries={activeHighlightCountries}
            isAuthorMode={!!activeAuthor}
            noGlow={!!activeAuthor}
            activeContinent={activeContinent}
            onContinentClickRef={onContinentClickRef}
            globeKey={globeKey}
          />
        )}
      </div>

      {/* Stories — avatares em baixo */}
      {tab === 'following' && storyAuthors.length > 0 && !showSheet && (
        <div style={{
          position: 'absolute', bottom: 80, left: 0, right: 0, zIndex: 25,
          padding: '12px 16px',
          background: 'linear-gradient(to top, rgba(17,13,10,0.8) 0%, transparent 100%)',
        }}>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 8, paddingTop: 6, paddingLeft: 4, paddingRight: 4 }}>
            {storyAuthors.map(author => (
              <div key={author.id} onClick={() => handleAuthorClick(author)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}>
                {/* Avatar com borda dourada */}
                <div style={{
                  borderRadius: '50%', flexShrink: 0,
                  boxShadow: activeAuthor?.id === author.id
                    ? '0 0 0 2px #110D0A, 0 0 0 5px #FFB800'
                    : '0 0 0 2px #FFB800',
                  transition: 'all 0.2s',
                }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden' }}>
                    {author.avatar_url
                      ? <img src={author.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                      : <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at 35% 30%, #E8C9A8, #8E6B4E)' }} />
                    }
                  </div>
                </div>
                {/* Nome */}
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: activeAuthor?.id === author.id ? 600 : 400, maxWidth: 56, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {author.display_name || author.username}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de países não vistos — lado esquerdo */}
      {activeAuthor && !showSheet && (activeAuthor.highlightCountries || []).length > 0 && (
        <div style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          zIndex: 22, display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {(activeAuthor.highlightCountries || []).map(country => {
            const flag = country.slice(0, 2) // fallback simples
            return (
              <button
                key={country}
                onClick={() => {
                  searchFnRef.current?.(country)
                  setTimeout(() => handleCountryClick(country), 600)
                }}
                style={{
                  background: 'rgba(17,13,10,0.75)', backdropFilter: 'blur(10px)',
                  border: '0.5px solid rgba(255,184,0,0.4)', borderRadius: 100,
                  padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFB800', boxShadow: '0 0 6px #FFB800', display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{country}</span>
              </button>
            )
          })}
        </div>
      )}



      {/* Sheet */}
      {showSheet && activePost && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
          background: '#F5F0E8', borderRadius: '20px 20px 0 0',
          padding: '20px 20px 100px',
          transition: 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
          maxHeight: blogExpanded ? '92vh' : '55vh', overflowY: 'auto',
        }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(184,168,152,0.4)', margin: '0 auto 20px' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div onClick={() => router.push(`/user/${activePost.profiles?.username}`)} style={{
              width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
              border: '2px solid rgba(255,184,0,0.3)', background: 'linear-gradient(135deg, #FFE066, #FFB800)', cursor: 'pointer',
            }}>
              {activePost.profiles?.avatar_url
                ? <img src={activePost.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                : <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at 35% 30%, #E8C9A8, #8E6B4E)' }} />
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#2A2520' }}>
                {activePost.profiles?.display_name || activePost.profiles?.username}
              </div>
              <div style={{ fontSize: 12, color: '#8A7A65', marginTop: 2 }}>
                @{activePost.profiles?.username} · {postAuthorFollowers} seguidores
              </div>
            </div>
            {currentUserId && (
              <button onClick={async () => {
                setFollowLoading(true)
                if (isFollowingAuthor) {
                  await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', activePost.user_id)
                  setIsFollowingAuthor(false); setPostAuthorFollowers(c => c - 1)
                } else {
                  await supabase.from('follows').insert({ follower_id: currentUserId, following_id: activePost.user_id })
                  setIsFollowingAuthor(true); setPostAuthorFollowers(c => c + 1)
                }
                setFollowLoading(false)
              }} disabled={followLoading} style={{
                padding: '7px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600,
                background: isFollowingAuthor ? 'transparent' : '#FFB800',
                border: isFollowingAuthor ? '1px solid rgba(184,168,152,0.5)' : 'none',
                color: isFollowingAuthor ? '#8A7A65' : '#2A2520', cursor: 'pointer', flexShrink: 0,
              }}>
                {isFollowingAuthor ? 'A seguir' : 'Seguir'}
              </button>
            )}
          </div>

          <div style={{ padding: '24px 20px 20px', background: activePost.theme?.headerColor || '#2A2520', borderRadius: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              {activePost.country_name}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
              {activePost.title}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button onClick={() => setBlogExpanded(!blogExpanded)} style={{
              flex: 1, padding: '12px', borderRadius: 100,
              background: '#FFB800', border: 'none', color: '#2A2520', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>
              {blogExpanded ? 'Minimizar' : 'Ler blog'}
            </button>
            <button onClick={(e) => {
              e.stopPropagation()
              setShowSheet(false); setBlogExpanded(false); globeResetRef.current?.()
              if (activePost && tab === 'following') {
                const viewed = viewedPostsRef.current
                supabase.from('posts').select('id').eq('country_name', activePost.country_name).eq('published', true).neq('user_id', currentUserId)
                  .then(({ data }) => {
                    const remaining = (data || []).filter((p: any) => !viewed.has(p.id))
                    if (remaining.length === 0) {
                      setTimeout(() => { setFollowingCountriesAll(prev => prev.filter(c => c !== activePost.country_name)); setGlobeKey(k => k + 1) }, 800)
                    }
                  })
              }
            }} style={{
              width: 44, height: 44, borderRadius: '50%', background: 'transparent',
              border: '1px solid rgba(184,168,152,0.4)', color: '#8A7A65', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {blogExpanded && postBlocks.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {postBlocks.map((block: any) => {
                if (block.type === 'text') return <div key={block.id} dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content || '') }} style={{ lineHeight: 1.7, marginBottom: 20, fontSize: 15, color: activePost.theme?.text || '#2A2520' }} />
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
                  return sp ? <div key={block.id} style={{ marginBottom: 20 }}><iframe src={`https://open.spotify.com/embed/${sp[1]}/${sp[2]}`} width="100%" height="80" frameBorder="0" style={{ borderRadius: 12 }} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" /></div> : null
                }
                return null
              })}
            </div>
          )}
        </div>
      )}

      {/* Mensagem vazia */}
      {!loading && activeCountries.length === 0 && !showSheet && (
        <div style={{ position: 'absolute', bottom: 120, left: 0, right: 0, textAlign: 'center', padding: '0 40px', zIndex: 20 }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px 24px', backdropFilter: 'blur(8px)', border: '0.5px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: tab === 'following' ? 14 : 0 }}>
              {tab === 'following' ? 'As pessoas que segues ainda não publicaram blogs. Segue mais viajantes para descobrir histórias.' : 'Ainda não há blogs publicados para descobrir.'}
            </div>
            {tab === 'following' && (
              <button onClick={() => router.push('/search')} style={{ padding: '9px 22px', borderRadius: 100, background: '#FFB800', border: 'none', color: '#2A2520', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Encontrar viajantes
              </button>
            )}
          </div>
        </div>
      )}

      <Navbar />
    </div>
  )
}