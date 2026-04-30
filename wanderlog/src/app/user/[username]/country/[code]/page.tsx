'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'

const Globe = dynamic(() => import('@/components/Globe'), { ssr: false })

const CONTINENT_NAMES = ['Europe', 'Asia', 'Africa', 'N. America', 'S. America', 'Oceania']
const CONTINENT_PT: Record<string, string> = {
  'Europe': 'Europa', 'Asia': 'Ásia', 'Africa': 'África',
  'N. America': 'N. América', 'S. America': 'S. América', 'Oceania': 'Oceânia',
}

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src; s.onload = () => resolve(); s.onerror = reject
    document.head.appendChild(s)
  })
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const [profile, setProfile] = useState<any>(null)
  const [visitedCountries, setVisitedCountries] = useState<string[]>([])
  const [activeContinent, setActiveContinent] = useState<string | null>(null)
  const [scriptsLoaded, setScriptsLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    const init = async () => {
      await loadScript('https://unpkg.com/three@0.155.0/build/three.min.js')
      await loadScript('https://unpkg.com/topojson-client@3.1.0/dist/topojson-client.min.js')
      setScriptsLoaded(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('username', username).maybeSingle()

      if (!profileData) { router.push('/search'); return }
      if (user?.id === profileData.id) { router.push('/dashboard'); return }

      setProfile(profileData)

      const { data: countriesData } = await supabase
        .from('countries_visited').select('country_name').eq('user_id', profileData.id)
      setVisitedCountries(countriesData?.map((c: any) => c.country_name) || [])

      const { count: followers } = await supabase
        .from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileData.id)
      setFollowerCount(followers || 0)

      if (user) {
        const { data: followData } = await supabase
          .from('follows').select('id')
          .eq('follower_id', user.id).eq('following_id', profileData.id).maybeSingle()
        setIsFollowing(!!followData)
      }

      setLoading(false)
    }
    init()
  }, [username, router])

  const handleFollow = async () => {
    if (!currentUserId) { router.push('/login'); return }
    setFollowLoading(true)
    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', currentUserId).eq('following_id', profile.id)
      setIsFollowing(false); setFollowerCount(c => c - 1)
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: profile.id })
      setIsFollowing(true); setFollowerCount(c => c + 1)
    }
    setFollowLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', system-ui", color: '#8A7A65' }}>
      A carregar...
    </div>
  )

  return (
    <div style={{
      width: '100%', height: '100vh', background: '#F5F0E8',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <style>{FONTS}</style>

      {/* Header */}
      <div style={{ padding: '52px 20px 16px', background: '#F5F0E8', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <button onClick={() => router.push('/search')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#8A7A65', flexShrink: 0, padding: '4px 0',
            display: 'flex', alignItems: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <div style={{ width: 68, height: 68, borderRadius: '50%', padding: 2.5, flexShrink: 0, background: 'linear-gradient(135deg, #FFE066, #FFB800)' }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
              : <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #E8C9A8, #8E6B4E)' }} />
            }
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#2A2520', lineHeight: 1.1 }}>
              {profile?.display_name || profile?.username}
            </div>
            <div style={{ fontSize: 11, color: '#8A7A65', marginTop: 2 }}>@{profile?.username}</div>
            {profile?.bio && (
              <div style={{ fontSize: 12, color: '#4A3F30', marginTop: 5, lineHeight: 1.5 }}>{profile.bio}</div>
            )}
            {profile?.location && (
              <div style={{ fontSize: 11, color: '#8A7A65', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#B8A898" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {profile.location}
              </div>
            )}
          </div>

          <button onClick={handleFollow} disabled={followLoading} style={{
            padding: '8px 18px', borderRadius: 100, flexShrink: 0,
            background: isFollowing ? 'transparent' : '#FFB800',
            border: isFollowing ? '1px solid rgba(184,168,152,0.5)' : 'none',
            color: isFollowing ? '#8A7A65' : '#2A2520',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            opacity: followLoading ? 0.6 : 1, transition: 'all 0.2s',
          }}>
            {isFollowing ? 'A seguir' : 'Seguir'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', marginTop: 16, paddingTop: 14, borderTop: '0.5px solid rgba(184,168,152,0.3)' }}>
          {[
            { label: 'PAÍSES', value: visitedCountries.length },
            { label: 'SEGUIDORES', value: followerCount },
            { label: 'LIKES', value: 0 },
          ].map((s, i) => (
            <div key={s.label} style={{
              flex: 1, textAlign: 'center',
              borderLeft: i > 0 ? '0.5px solid rgba(184,168,152,0.35)' : 'none',
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#FFB800', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: '#8A7A65', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pills */}
      <div style={{ padding: '10px 16px', display: 'flex', gap: 6, overflowX: 'auto', background: '#F5F0E8', flexShrink: 0, scrollbarWidth: 'none' }}>
        {['Todos', ...CONTINENT_NAMES].map(c => {
          const label = c === 'Todos' ? 'Todos' : CONTINENT_PT[c]
          const isActive = c === 'Todos' ? !activeContinent : activeContinent === c
          return (
            <button key={c} onClick={() => setActiveContinent(c === 'Todos' ? null : (activeContinent === c ? null : c))} style={{
              padding: '5px 14px', borderRadius: 100, fontSize: 11, fontWeight: 500,
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, border: 'none',
              background: isActive ? '#2A2520' : 'rgba(42,37,32,0.07)',
              color: isActive ? '#F5F0E8' : '#6B5D4A',
              transition: 'all 0.15s',
            }}>{label}</button>
          )
        })}
      </div>

      {/* Globo — ocupa o resto */}
      <div style={{
        position: 'relative', flex: 1,
        background: 'radial-gradient(ellipse at 50% 35%, #EDE8DF, #D8D0C4)',
        margin: '0 16px 16px', borderRadius: 24, overflow: 'hidden',
      }}>
        {scriptsLoaded ? (
          <Globe
            visitedCountries={visitedCountries}
            activeContinent={activeContinent}
            onContinentClick={(name) => setActiveContinent(activeContinent === name ? null : name)}
            globeColor={profile?.globe_color || '#B8860B'}
            onCountryClick={async (countryName) => {
              const { data } = await supabase
                .from('countries_visited').select('country_code')
                .eq('country_name', countryName).eq('user_id', profile.id).maybeSingle()
              if (data) router.push(`/user/${profile.username}/country/${data.country_code}`)
            }}
            userLocation={profile?.location}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A7A65', fontSize: 13 }}>
            A carregar globo...
          </div>
        )}
        <div style={{ position: 'absolute', top: 12, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none', zIndex: 5 }}>
          <div style={{ fontSize: 9, color: 'rgba(80,65,45,0.45)', fontFamily: 'monospace', letterSpacing: 2, textTransform: 'uppercase' }}>Travel Map</div>
          <div style={{ fontSize: 9, color: 'rgba(80,65,45,0.45)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFD93D', boxShadow: '0 0 6px #FFD93D', display: 'inline-block' }} />
            {visitedCountries.length} visitados
          </div>
        </div>
      </div>
    </div>
  )
}