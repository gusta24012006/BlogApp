'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'

const Globe = dynamic(() => import('@/components/Globe'), { ssr: false })

const CONTINENT_NAMES = ['Europe', 'Asia', 'Africa', 'N. America', 'S. America', 'Oceania']

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

  // Re-verificar quando a página fica em foco (volta do histórico)
  useEffect(() => {
    const handleFocus = () => {
      setLoading(true)
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  useEffect(() => {
    const init = async () => {
      await loadScript('https://unpkg.com/three@0.155.0/build/three.min.js')
      await loadScript('https://unpkg.com/topojson-client@3.1.0/dist/topojson-client.min.js')
      setScriptsLoaded(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      // Buscar perfil pelo username
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle()

      if (!profileData) { router.push('/search'); return }

      // Se é o próprio perfil, ir para o dashboard
      if (user?.id === profileData.id) { router.push('/dashboard'); return }

      setProfile(profileData)

      // Países visitados
      const { data: countriesData } = await supabase
        .from('countries_visited')
        .select('country_name')
        .eq('user_id', profileData.id)
      setVisitedCountries(countriesData?.map((c: any) => c.country_name) || [])

      // Seguidores
      const { count: followers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profileData.id)
      setFollowerCount(followers || 0)

      // Verificar se já segue
      if (user) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', profileData.id)
          .maybeSingle()
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
      await supabase.from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', profile.id)
      setIsFollowing(false)
      setFollowerCount(c => c - 1)
    } else {
      await supabase.from('follows')
        .insert({ follower_id: currentUserId, following_id: profile.id })
      setIsFollowing(true)
      setFollowerCount(c => c + 1)
    }
    setFollowLoading(false)
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#F5F0E8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif', color: '#8A7A65',
    }}>A carregar...</div>
  )

  return (
    <div style={{
      width: '100%', minHeight: '100vh', background: '#F5F0E8',
      display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Profile Header */}
      <div style={{
        background: '#F5F0E8', padding: '52px 22px 18px',
        flexShrink: 0, borderBottom: '1px solid rgba(184,168,152,0.3)',
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          {/* Voltar */}
          <button onClick={() => router.push('/search')} style={{
            position: 'absolute', top: 16, left: 16,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 18, color: '#8A7A65',
          }}>←</button>

          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%', padding: 3, flexShrink: 0,
            background: 'linear-gradient(135deg, #FFE066, #FFB800)',
            boxShadow: '0 4px 14px rgba(198,139,0,0.35)',
          }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
              : <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #E8C9A8, #8E6B4E)' }} />
            }
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 600, color: '#2A2520' }}>
              {profile?.display_name || profile?.username}
            </div>
            <div style={{ fontSize: 12, color: '#8A7A65', marginTop: 4, fontFamily: 'monospace' }}>
              @{profile?.username}
            </div>
            {profile?.location && (
              <div style={{ fontSize: 12, color: '#8A7A65', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>📍</span> {profile.location}
              </div>
            )}
          </div>

          {/* Botão Seguir */}
          <button
            onClick={handleFollow}
            disabled={followLoading}
            style={{
              padding: '8px 20px', borderRadius: 100,
              background: isFollowing ? 'transparent' : '#FFB800',
              border: isFollowing ? '1px solid rgba(184,168,152,0.5)' : 'none',
              color: isFollowing ? '#8A7A65' : '#2A2520',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              alignSelf: 'flex-start', transition: 'all 0.2s',
              opacity: followLoading ? 0.6 : 1,
            }}
          >
            {isFollowing ? 'A seguir' : 'Seguir'}
          </button>
        </div>

        {profile?.bio && (
          <div style={{ marginTop: 14, fontSize: 13.5, lineHeight: 1.5, color: '#4A3F30' }}>
            {profile.bio}
          </div>
        )}

        {/* Stats */}
        <div style={{
          marginTop: 18, display: 'flex',
          borderTop: '1px solid rgba(184,168,152,0.45)',
          borderBottom: '1px solid rgba(184,168,152,0.45)',
          paddingTop: 14, paddingBottom: 14,
        }}>
          {[
            { label: 'PAÍSES', value: visitedCountries.length },
            { label: 'LIKES', value: 0 },
            { label: 'SEGUIDORES', value: followerCount },
          ].map((s, i) => (
            <div key={s.label} style={{
              flex: 1, textAlign: 'center',
              borderLeft: i > 0 ? '1px solid rgba(184,168,152,0.45)' : 'none',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#FFB800', letterSpacing: -0.5, lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 9.5, color: '#8A7A65', marginTop: 6, textTransform: 'uppercase', letterSpacing: 1.4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Continent pills */}
      <div style={{
        padding: '12px 16px', display: 'flex', gap: 6, flexWrap: 'wrap',
        background: '#F5F0E8', borderBottom: '1px solid rgba(184,168,152,0.2)',
      }}>
        <button onClick={() => setActiveContinent(null)} style={{
          padding: '4px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
          border: `1px solid ${!activeContinent ? '#FFB800' : 'rgba(184,168,152,0.5)'}`,
          background: !activeContinent ? 'rgba(255,184,0,0.1)' : 'transparent',
          color: !activeContinent ? '#8A6800' : '#8A7A65',
        }}>Todos</button>
        {CONTINENT_NAMES.map(c => (
          <button key={c} onClick={() => setActiveContinent(activeContinent === c ? null : c)} style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
            border: `1px solid ${activeContinent === c ? '#FFB800' : 'rgba(184,168,152,0.5)'}`,
            background: activeContinent === c ? 'rgba(255,184,0,0.1)' : 'transparent',
            color: activeContinent === c ? '#8A6800' : '#8A7A65',
          }}>{c}</button>
        ))}
      </div>

      {/* Globe */}
      <div style={{
        position: 'relative', height: 500,
        background: 'radial-gradient(ellipse at 50% 35%, #EDE8DF 0%, #D8D0C4 100%)',
      }}>
        {scriptsLoaded ? (
          <Globe
            visitedCountries={visitedCountries}
            activeContinent={activeContinent}
            onContinentClick={(name) => setActiveContinent(activeContinent === name ? null : name)}
            onCountryClick={async (countryName) => {
              const { data } = await supabase
                .from('countries_visited')
                .select('country_code')
                .eq('country_name', countryName)
                .eq('user_id', profile.id)
                .maybeSingle()
              if (data) router.push(`/user/${profile.username}/country/${data.country_code}`)
            }}
            userLocation={profile?.location}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#8A7A65', fontSize: 13,
          }}>A carregar globo...</div>
        )}

        <div style={{
          position: 'absolute', top: 12, left: 16, right: 16,
          display: 'flex', justifyContent: 'space-between',
          pointerEvents: 'none', zIndex: 5,
        }}>
          <div style={{ fontSize: 10, color: 'rgba(80,65,45,0.6)', fontFamily: 'monospace', letterSpacing: 2, textTransform: 'uppercase' }}>
            Travel Map
          </div>
          <div style={{ fontSize: 10, color: 'rgba(80,65,45,0.6)', fontFamily: 'monospace', letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFD93D', boxShadow: '0 0 8px #FFD93D', display: 'inline-block' }} />
            {visitedCountries.length} visitados
          </div>
        </div>

        {activeContinent && (
          <div style={{ position: 'absolute', top: 36, left: 16, zIndex: 5 }}>
            <button onClick={() => setActiveContinent(null)} style={{
              padding: '6px 12px', borderRadius: 100,
              border: '1px solid rgba(180,140,0,0.4)',
              background: 'rgba(255,248,220,0.85)',
              fontSize: 11, fontWeight: 600, color: '#8A6800', cursor: 'pointer',
            }}>← {activeContinent}</button>
          </div>
        )}
      </div>
    </div>
  )
}