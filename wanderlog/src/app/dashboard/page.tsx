'use client'

import { loadScript } from '@/lib/loadScript'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import AddCountryModal from '@/components/AddCountryModal'
import Navbar from '@/components/Navbar'

const Globe = dynamic(() => import('@/components/Globe'), { ssr: false })

const CONTINENT_NAMES = ['Europe', 'Asia', 'Africa', 'N. America', 'S. America', 'Oceania']

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
  const [navigating, setNavigating] = useState(false)
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
  const [globeColor, setGlobeColor] = useState('#B8860B')

  const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');`
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
      if (profileData?.globe_color) setGlobeColor(profileData.globe_color)

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
      {/* Fontes */}
      <style>{FONTS + `
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* Profile Header */}
      <div style={{
        background: '#F5F0E8', padding: '52px 20px 16px',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <svg fill="#FFB800" width="24" height="24" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path d="M512,256c0-68.38-26.629-132.667-74.981-181.019C388.668,26.629,324.38,0,256,0c-42.396,0-83.214,10.246-119.641,29.548c-49.413-19.661-87.464-19.19-108.415,1.76C6.613,52.64,6.257,90.739,26.893,141.505C9.305,176.613,0,215.591,0,256c0,68.38,26.629,132.667,74.981,181.019C123.333,485.371,187.62,512,256,512c41.656,0,81.787-9.9,117.728-28.556c23.719,9.363,44.81,14.081,62.616,14.08c19.011-0.001,34.294-5.36,45.057-16.123c20.978-20.978,21.662-58.178,2.053-107.692C502.104,337.773,512,297.649,512,256z M372.225,458.169c-3.518-1.541-7.091-3.174-10.726-4.925c-53.998-26.015-115.057-71.664-171.93-128.538c-27.902-27.902-53.688-57.542-75.61-86.826l41.67,10.737c6.087,1.57,12.289-2.095,13.857-8.178c1.568-6.085-2.094-12.289-8.178-13.857l-71.798-18.5c-3.353-0.864-6.92-0.152-9.686,1.931c-2.767,2.084-4.433,5.316-4.526,8.779l-2.007,74.116c-0.169,6.282,4.784,11.511,11.066,11.682c6.141,0,11.201-4.894,11.368-11.069l1.088-40.178c22.273,29.554,48.282,59.38,76.355,87.453c56.763,56.763,117.865,102.822,172.734,130.289C391.947,483.665,256,489.244,256,489.244S22.756,384.612,22.756,256c0-85.568,46.325-160.507,115.203-201.094c53.997,26.015,115.057,71.664,171.928,128.537c27.903,27.902,53.689,57.543,75.611,86.826l-41.67-10.737c-6.088-1.57-12.29,2.094-13.857,8.178c-1.568,6.085,2.094,12.289,8.178,13.857l71.798,18.501c4.687,1.206,9.687-1.932,10.687-6.931l2.006-74.117c0.17-6.282-4.784-11.512-11.066-11.682c-6.141,0-11.201,4.894-11.368,11.069l-1.088,40.178c-22.273-29.554-48.28-59.379-76.355-87.453C256,22.756,489.244,127.389,489.244,256C489.244,342.321,442.109,417.838,372.225,458.169z"/>
          </svg>
          <span style={{ fontFamily: "'DM Sans', system-ui", fontSize: 20, fontWeight: 700, color: '#2A2520', letterSpacing: -0.5 }}>
            Vol<span style={{ color: '#FFB800' }}>ta</span>
          </span>
        </div>

        {/* Linha 1: avatar + info + ícones */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%', padding: 2.5, flexShrink: 0,
            background: 'linear-gradient(135deg, #FFE066, #FFB800)',
          }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
              : <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #E8C9A8, #8E6B4E)' }} />
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'DM Sans', system-ui", fontSize: 20, fontWeight: 700, color: '#2A2520', lineHeight: 1.1 }}>
              {profile?.display_name || profile?.username || 'Viajante'}
            </div>
            <div style={{ fontSize: 11, color: '#8A7A65', marginTop: 2 }}>
              @{profile?.username}
            </div>
            {profile?.bio && (
              <div style={{ fontSize: 12, color: '#4A3F30', marginTop: 5, lineHeight: 1.5 }}>
                {profile.bio}
              </div>
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
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={() => router.push('/search')} style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(42,37,32,0.07)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B5D4A" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            <button onClick={() => router.push('/settings')} style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(42,37,32,0.07)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B5D4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Linha 2: botões editar/personalizar */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={() => router.push('/profile/edit')} style={{
            flex: 1, padding: '9px', borderRadius: 100,
            background: '#2A2520', border: 'none',
            fontSize: 12, fontWeight: 600, color: '#F5F0E8',
            cursor: 'pointer', fontFamily: "'DM Sans', system-ui",
          }}>Editar perfil</button>
          <button onClick={() => router.push('/profile/customize')} style={{
            flex: 1, padding: '9px', borderRadius: 100,
            background: 'rgba(42,37,32,0.08)', border: 'none',
            fontSize: 12, fontWeight: 600, color: '#2A2520',
            cursor: 'pointer', fontFamily: "'DM Sans', system-ui",
          }}>Personalizar</button>
        </div>

        {/* Stats sem bordas quadradas */}
        <div style={{
          marginTop: 14, display: 'flex',
          borderTop: '0.5px solid rgba(184,168,152,0.3)',
          paddingTop: 12,
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
                borderLeft: i > 0 ? '0.5px solid rgba(184,168,152,0.35)' : 'none',
                cursor: s.link ? 'pointer' : 'default',
              }}
            >
              <div style={{ fontFamily: "'DM Sans', system-ui", fontSize: 22, fontWeight: 700, color: '#FFB800', lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 9, color: '#8A7A65', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 500 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Continent pills */}
      <div style={{
        padding: '10px 16px', display: 'flex', gap: 6, overflowX: 'auto',
        background: '#F5F0E8', scrollbarWidth: 'none',
      }}>
        {['Todos', ...CONTINENT_NAMES].map((c) => {
          const isActive = c === 'Todos' ? !activeContinent : activeContinent === c
          return (
            <button key={c} onClick={() => setActiveContinent(c === 'Todos' ? null : (activeContinent === c ? null : c))} style={{
              padding: '5px 14px', borderRadius: 100, fontSize: 11, fontWeight: 500,
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              border: 'none',
              background: isActive ? '#2A2520' : 'rgba(42,37,32,0.07)',
              color: isActive ? '#F5F0E8' : '#6B5D4A',
              fontFamily: "'DM Sans', system-ui",
              transition: 'all 0.15s',
            }}>{c === 'N. America' ? 'N. América' : c === 'S. America' ? 'S. América' : c}</button>
          )
        })}
      </div>

      {/* Globe */}
      <div style={{
        position: 'relative', height: 480,
        background: 'radial-gradient(ellipse at 50% 35%, #EDE8DF 0%, #D8D0C4 100%)',
        margin: '0 16px', borderRadius: 24, overflow: 'hidden',
      }}>
        {scriptsLoaded ? (
          <Globe
            visitedCountries={visitedCountries}
            activeContinent={activeContinent}
            onContinentClick={(name) => setActiveContinent(activeContinent === name ? null : name)}
            onSearchReady={(fn) => { searchFnRef.current = fn }}
            onResetReady={(fn) => { resetGlobeFnRef.current = fn }}
            globeColor={globeColor}
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
          <div style={{ fontSize: 9, color: 'rgba(80,65,45,0.5)', fontFamily: 'monospace', letterSpacing: 2, textTransform: 'uppercase' }}>
            Travel Map
          </div>
          <div style={{ fontSize: 9, color: 'rgba(80,65,45,0.5)', fontFamily: 'monospace', letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFD93D', boxShadow: '0 0 6px #FFD93D', display: 'inline-block' }} />
            {visitedCountries.length} visitados
          </div>
        </div>

        {/* Botão + País dentro do globo */}
        <button
          onClick={() => setShowModal(true)}
          style={{
            position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
            background: '#FFB800', border: 'none', borderRadius: 100,
            padding: '7px 18px', fontSize: 12, fontWeight: 600, color: '#2A2520',
            cursor: 'pointer', zIndex: 5,
            fontFamily: "'DM Sans', system-ui",
            display: 'flex', alignItems: 'center', gap: 5,
            boxShadow: '0 4px 14px rgba(255,184,0,0.4)',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2A2520" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          País
        </button>

        {/* Overlay de navegação */}
        {navigating && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.15)', borderRadius: 24,
            backdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{
              background: 'rgba(245,240,232,0.95)', borderRadius: 100,
              padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }}>
              <div style={{
                width: 14, height: 14, borderRadius: '50%',
                border: '2px solid #FFB800', borderTopColor: 'transparent',
                animation: 'spin 0.6s linear infinite',
              }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#2A2520', fontFamily: "'DM Sans', system-ui" }}>
                A abrir...
              </span>
            </div>
          </div>
        )}

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
          onCountryVisitedClick={(country) => {
            setShowModal(false)
            searchFnRef.current?.(country.name)
            setTimeout(() => router.push(`/blog/country/${country.code}`), 800)
          }}
          onCountryNewClick={(country) => {
            setShowModal(false)
            router.push(`/blog/new?country=${country.code}&name=${encodeURIComponent(country.name)}`)
          }}
        />
      )}
      <Navbar />
    </div>
  )
}