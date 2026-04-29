'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'

const Globe = dynamic(() => import('@/components/Globe'), { ssr: false })

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src; s.onload = () => resolve(); s.onerror = reject
    document.head.appendChild(s)
  })
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function getReliefColor(globeColor: string): string {
  const [h, s, l] = hexToHsl(globeColor)
  return `hsl(${h}, ${Math.min(100, s + 20)}%, ${Math.min(90, l + 45)}%)`
}

const GLOBE_COLORS = [
  // Quentes — terra, fogo, areia
  { name: 'Saara',      value: '#A0522D' },  // areia quente
  { name: 'Marrakech',  value: '#B8560A' },  // terracota
  { name: 'Bali',       value: '#9B2335' },  // vermelho templo
  { name: 'Tóquio',     value: '#8B3A62' },  // sakura escuro
  { name: 'Rajastão',   value: '#7B3F00' },  // especiarias
  { name: 'Havana',     value: '#8B4500' },  // tabaco vintage
  // Frios — oceano, gelo, noite
  { name: 'Mediterrâneo', value: '#1B4F8A' },  // azul profundo
  { name: 'Maldivas',   value: '#0D7C8A' },  // turquesa
  { name: 'Islândia',   value: '#2C4A7C' },  // aurora boreal
  { name: 'Noruega',    value: '#1A3A5C' },  // fiordes
  { name: 'Ártico',     value: '#2D5A7A' },  // gelo azul
  { name: 'Amazónia',   value: '#1A5C3A' },  // floresta densa
  // Neutros — minerais, fumo, pedra
  { name: 'Obsidiana',  value: '#2D2D2D' },  // lava negra
  { name: 'Granito',    value: '#4A4A5A' },  // pedra cinza
  { name: 'Malaquite',  value: '#2D5A40' },  // mineral verde
  { name: 'Âmbar',      value: '#C17800' },  // resina dourada
]

interface Country {
  country_code: string
  country_name: string
}

export default function CustomizePage() {
  const router = useRouter()
  const [selectedColor, setSelectedColor] = useState(GLOBE_COLORS[0])
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState('')
  const [scriptsLoaded, setScriptsLoaded] = useState(false)
  const [visitedCountries, setVisitedCountries] = useState<string[]>([])
  const [globeKey, setGlobeKey] = useState(0)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles').select('globe_color').eq('id', user.id).single()

      if (profile?.globe_color) {
        const found = GLOBE_COLORS.find(c => c.value === profile.globe_color)
        if (found) setSelectedColor(found)
        else setSelectedColor({ name: 'Personalizado', value: profile.globe_color })
      }

      const { data: countriesData } = await supabase
        .from('countries_visited').select('country_code, country_name').eq('user_id', user.id)
      setCountries(countriesData || [])
      setVisitedCountries(countriesData?.map((c: any) => c.country_name) || [])
      await loadScript('https://unpkg.com/three@0.155.0/build/three.min.js')
      await loadScript('https://unpkg.com/topojson-client@3.1.0/dist/topojson-client.min.js')
      setScriptsLoaded(true)
      setLoading(false)
    }
    load()
  }, [router])

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('profiles').update({ globe_color: selectedColor.value }).eq('id', userId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', color: '#8A7A65' }}>
      A carregar...
    </div>
  )

  const reliefColor = getReliefColor(selectedColor.value)

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: 'system-ui, sans-serif', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(245,240,232,0.95)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(184,168,152,0.3)',
        padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#8A7A65' }}>←</button>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 600, color: '#2A2520', flex: 1 }}>
          Personalizar
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '8px 20px', borderRadius: 100, border: 'none',
            background: saved ? '#5DCAA5' : '#FFB800',
            color: saved ? '#fff' : '#2A2520',
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {saving ? 'A guardar...' : saved ? 'Guardado' : 'Guardar'}
        </button>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px' }}>

        {/* Secção globo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#2A2520' }}>
            Cor do globo
          </div>
          <button
            onClick={() => { setSelectedColor({ name: 'Âmbar', value: '#C17800' }); setGlobeKey(k => k + 1) }}
            style={{
              fontSize: 12, color: '#8A7A65', background: 'none', border: 'none',
              cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3,
            }}
          >
            Repor original
          </button>
        </div>

        {/* Preview + seletor lado a lado */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 24 }}>

          {/* Preview do globo real */}
          <div style={{ flexShrink: 0 }}>
            <div style={{
              width: 140, height: 140, borderRadius: '50%',
              overflow: 'hidden', background: '#F5F0E8',
            }}>
              {scriptsLoaded && (
                <Globe
                  key={`preview-${globeKey}`}
                  visitedCountries={visitedCountries}
                  activeContinent={null}
                  onContinentClick={() => {}}
                  globeColor={selectedColor.value}
                />
              )}
            </div>
            <div style={{ fontSize: 11, color: '#8A7A65', textAlign: 'center', marginTop: 6 }}>
              {selectedColor.name}
            </div>
          </div>

          {/* Swatches retangulares */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {GLOBE_COLORS.map(color => (
              <button
                key={color.value}
                onClick={() => { setSelectedColor(color); setGlobeKey(k => k + 1) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 10px', borderRadius: 10,
                  background: selectedColor.value === color.value
                    ? `${color.value}18`
                    : 'rgba(255,255,255,0.6)',
                  border: selectedColor.value === color.value
                    ? `1.5px solid ${color.value}`
                    : '1.5px solid rgba(184,168,152,0.25)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                  background: `linear-gradient(135deg, ${getReliefColor(color.value)}, ${color.value})`,
                }} />
                <span style={{
                  fontSize: 11, fontWeight: selectedColor.value === color.value ? 600 : 400,
                  color: selectedColor.value === color.value ? '#2A2520' : '#6B5D4A',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {color.name}
                </span>
                {selectedColor.value === color.value && (
                  <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color.value} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Separador */}
        <div style={{ height: 1, background: 'rgba(184,168,152,0.2)', margin: '24px 0' }} />

        {/* Secção países */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#2A2520' }}>
            Países visitados
          </div>
          <div style={{ fontSize: 12, color: '#8A7A65' }}>{countries.length} países</div>
        </div>

        {countries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#B8A898', fontSize: 13 }}>
            Ainda não adicionaste países ao teu globo.
          </div>
        ) : (
          <div style={{
            background: '#fff', borderRadius: 14,
            border: '1px solid rgba(184,168,152,0.25)', overflow: 'hidden',
          }}>
            {countries.map((country, i) => {
              const flag = country.country_code.toUpperCase().replace(/./g, (c: string) => String.fromCodePoint(c.charCodeAt(0) + 127397))
              return (
                <div
                  key={country.country_code}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: i < countries.length - 1 ? '1px solid rgba(184,168,152,0.12)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{flag}</span>
                    <span style={{ fontSize: 14, color: '#2A2520' }}>{country.country_name}</span>
                  </div>
                  <div style={{
                    fontSize: 11, padding: '4px 10px', borderRadius: 100,
                    background: 'rgba(184,168,152,0.15)', color: '#8A7A65',
                  }}>
                    Em breve
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}