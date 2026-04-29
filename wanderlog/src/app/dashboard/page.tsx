'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import AddCountryModal from '@/components/AddCountryModal'
import Navbar from '@/components/Navbar'

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

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [visitedCountries, setVisitedCountries] = useState<string[]>([])
  const [activeContinent, setActiveContinent] = useState<string | null>(null)
  const [scriptsLoaded, setScriptsLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchError, setSearchError] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchFnRef = useRef<((name: string) => boolean) | null>(null)
  const resetGlobeFnRef = useRef<(() => void) | null>(null)

  const ALL_COUNTRIES = [
    'Afghanistan','Albania','Algeria','Angola','Argentina','Armenia','Australia','Austria','Azerbaijan',
    'Bahrain','Bangladesh','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herz.',
    'Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cambodia','Cameroon','Canada',
    'Central African Rep.','Chad','Chile','China','Colombia','Congo','Costa Rica','Croatia','Cuba',
    'Cyprus','Czechia','Dem. Rep. Congo','Denmark','Djibouti','Dominican Rep.','Ecuador','Egypt',
    'El Salvador','Eq. Guinea','Eritrea','Estonia','Ethiopia','Fiji','Finland','France','Gabon',
    'Gambia','Georgia','Germany','Ghana','Greece','Guatemala','Guinea','Guinea-Bissau','Guyana',
    'Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Ivory Coast',
    'Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Kyrgyzstan','Laos','Latvia',
    'Lebanon','Lesotho','Liberia','Libya','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia',
    'Mali','Malta','Mauritania','Mexico','Moldova','Mongolia','Montenegro','Morocco','Mozambique',
    'Myanmar','Namibia','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria',
    'North Macedonia','Norway','Oman','Pakistan','Panama','Papua New Guinea','Paraguay','Peru',
    'Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saudi Arabia','Senegal',
    'Serbia','Sierra Leone','Singapore','Slovakia','Slovenia','Somalia','South Africa','S. Sudan',
    'Cape Verde','eSwatini','Kosovo','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria','Taiwan','Tajikistan',
    'Tanzania','Thailand','Timor-Leste','Togo','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan',
    'Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan',
    'Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
  ]

  const suggestions = searchQuery.length > 0
    ? ALL_COUNTRIES.filter(c => c.toLowerCase().startsWith(searchQuery.toLowerCase())).slice(0, 5)
    : []
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      await loadScript('https://unpkg.com/three@0.155.0/build/three.min.js')
      await loadScript('https://unpkg.com/topojson-client@3.1.0/dist/topojson-client.min.js')
      setScriptsLoaded(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      setUserId(user.id)

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()

      const { data: countriesData } = await supabase
        .from('countries_visited').select('country_name').eq('user_id', user.id)

      // Contadores de follows
      const { count: fCount } = await supabase
        .from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id)
      const { count: fgCount } = await supabase
        .from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id)

      setFollowersCount(fCount || 0)
      setFollowingCount(fgCount || 0)
      setProfile(profileData)
      setVisitedCountries(countriesData?.map((c: any) => c.country_name) || [])
      setLoading(false)
    }
    init()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#F5F0E8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif', color: '#8A7A65', fontSize: 16
    }}>
      A carregar...
    </div>
  )

  return (
    <div style={{
      width: '100%', minHeight: '100vh', background: '#F5F0E8',
      display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif',
      paddingBottom: 80,
    }}>
      {/* Profile Header */}
      <div style={{
        background: '#F5F0E8', padding: '52px 22px 18px',
        flexShrink: 0, borderBottom: '1px solid rgba(184,168,152,0.3)',
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', padding: 3, flexShrink: 0,
            background: 'linear-gradient(135deg, #FFE066 0%, #FFB800 50%, #C68B00 100%)',
            boxShadow: '0 4px 14px rgba(198,139,0,0.35)',
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, #E8C9A8 0%, #C9A487 55%, #8E6B4E 100%)',
            }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 600, color: '#2A2520' }}>
              {profile?.display_name || profile?.username || 'Viajante'}
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
          <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start' }}>
            <button onClick={() => router.push('/search')} style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '1px solid rgba(184,168,152,0.5)', background: 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8A7A65" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            <button onClick={() => router.push('/settings')} style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '1px solid rgba(184,168,152,0.5)', background: 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8A7A65" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
            <button onClick={() => router.push('/profile/edit')} style={{
              padding: '7px 14px', borderRadius: 100,
              border: '1px solid rgba(184,168,152,0.5)', background: 'transparent',
              fontSize: 12, fontWeight: 500, color: '#8A7A65',
              cursor: 'pointer',
            }}>Editar perfil</button>
            <button onClick={() => setShowModal(true)} style={{
              padding: '7px 14px', borderRadius: 100,
              border: 'none', background: '#FFB800',
              fontSize: 12, fontWeight: 600, color: '#2A2520',
              cursor: 'pointer',
            }}>+ País</button>
          </div>
        </div>

        {profile?.bio && (
          <div style={{ marginTop: 14, fontSize: 13.5, lineHeight: 1.5, color: '#4A3F30' }}>
            {profile.bio}
          </div>
        )}

        <div style={{
          marginTop: 18, display: 'flex',
          borderTop: '1px solid rgba(184,168,152,0.45)',
          borderBottom: '1px solid rgba(184,168,152,0.45)',
          paddingTop: 14, paddingBottom: 14,
        }}>
          {[
            { label: 'PAÍSES', value: visitedCountries.length, link: null },
            { label: 'SEGUIDORES', value: followersCount, link: `/user/${profile?.username}/follows?tab=followers` },
            { label: 'A SEGUIR', value: followingCount, link: `/user/${profile?.username}/follows?tab=following` },
          ].map((s, i) => (
            <div
              key={s.label}
              onClick={() => s.link && router.push(s.link)}
              style={{
                flex: 1, textAlign: 'center',
                borderLeft: i > 0 ? '1px solid rgba(184,168,152,0.45)' : 'none',
                cursor: s.link ? 'pointer' : 'default',
              }}
            >
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
        background: '#F5F0E8', borderBottom: '1px solid rgba(184,168,152,0.2)'
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
            onSearchReady={(fn) => { searchFnRef.current = fn }}
            onResetReady={(fn) => { resetGlobeFnRef.current = fn }}
            onCountryClick={async (countryName) => {
              // Buscar o country_code a partir do nome
              const { data } = await supabase
                .from('countries_visited')
                .select('country_code')
                .eq('country_name', countryName)
                .eq('user_id', userId)
                .single()
              if (data) router.push(`/blog/country/${data.country_code}`)
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

        {/* Barra de pesquisa de países */}
        <div style={{
          position: 'absolute', top: 10, right: 16, zIndex: 10,
          display: 'flex', gap: 6, alignItems: 'center',
        }}>
          {/* Botão reset globo */}
          <button
            onClick={() => {
              setSearchQuery('')
              setSearchError('')
              setShowSuggestions(false)
              setActiveContinent(null)
              resetGlobeFnRef.current?.()
            }}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'rgba(245,240,232,0.7)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(10px)',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B5D4A" strokeWidth="2.2" strokeLinecap="round">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
            </svg>
          </button>

          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2A2520" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="País..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setSearchError(''); setShowSuggestions(true) }}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  setShowSuggestions(false)
                  const found = searchFnRef.current?.(searchQuery.trim())
                  if (!found) setSearchError('País não encontrado')
                }
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onFocus={() => setShowSuggestions(true)}
              style={{
                width: 120, padding: '6px 10px 6px 24px', borderRadius: 100,
                border: 'none', background: 'rgba(245,240,232,0.7)',
                backdropFilter: 'blur(10px)', fontSize: 12, outline: 'none',
                color: '#2A2520', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
        {/* Sugestões */}
        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: 46, left: 16, right: 16, zIndex: 10,
            background: 'rgba(245,240,232,0.97)', borderRadius: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            backdropFilter: 'blur(10px)', overflow: 'hidden',
          }}>
            {suggestions.map(country => (
              <button
                key={country}
                onClick={() => {
                  setSearchQuery(country)
                  setShowSuggestions(false)
                  setSearchError('')
                  const found = searchFnRef.current?.(country)
                  if (!found) setSearchError('País não encontrado')
                }}
                style={{
                  width: '100%', padding: '10px 16px', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, color: '#2A2520',
                  borderBottom: '1px solid rgba(184,168,152,0.15)',
                }}
              >
                {country}
              </button>
            ))}
          </div>
        )}

        {searchError && (
          <div style={{
            position: 'absolute', top: 50, left: 16, zIndex: 10,
            background: 'rgba(226,75,74,0.9)', borderRadius: 8,
            padding: '6px 12px', fontSize: 12, color: '#fff',
            backdropFilter: 'blur(10px)',
          }}>{searchError}</div>
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

      {/* Modal */}
      {showModal && (
        <AddCountryModal
          userId={userId}
          visitedCountries={visitedCountries}
          onClose={() => setShowModal(false)}
          onAdd={(c) => setVisitedCountries(prev => [...prev, c.name])}
          onRemove={(name) => setVisitedCountries(prev => prev.filter(n => n !== name))}
        />
      )}
      <Navbar />
    </div>
  )
}