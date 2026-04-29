'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Converte hex para HSL
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

// Calcula a cor de relevo (países visitados) a partir da cor base
export function getReliefColor(globeColor: string): string {
  const [h, s, l] = hexToHsl(globeColor)
  const newS = Math.min(100, s + 20)
  const newL = Math.min(90, l + 45)
  return `hsl(${h}, ${newS}%, ${newL}%)`
}

// Paleta de cores do globo — o utilizador escolhe a base, o relevo é calculado automaticamente
const GLOBE_COLORS = [
  { name: 'Saara',        value: '#A0522D' },
  { name: 'Marrakech',    value: '#B8560A' },
  { name: 'Bali',         value: '#9B2335' },
  { name: 'Tóquio',       value: '#8B3A62' },
  { name: 'Rajastão',     value: '#7B3F00' },
  { name: 'Havana',       value: '#8B4500' },
  { name: 'Mediterrâneo', value: '#1B4F8A' },
  { name: 'Maldivas',     value: '#0D7C8A' },
  { name: 'Islândia',     value: '#2C4A7C' },
  { name: 'Noruega',      value: '#1A3A5C' },
  { name: 'Ártico',       value: '#2D5A7A' },
  { name: 'Amazónia',     value: '#1A5C3A' },
  { name: 'Obsidiana',    value: '#2D2D2D' },
  { name: 'Granito',      value: '#4A4A5A' },
  { name: 'Malaquite',    value: '#2D5A40' },
  { name: 'Âmbar',        value: '#C17800' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [selectedColor, setSelectedColor] = useState(GLOBE_COLORS[0])
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: boas vindas, 2: cor do globo

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data } = await supabase.from('profiles').select('username, globe_color').eq('id', user.id).single()
      if (data?.globe_color) { router.replace('/dashboard'); return } // já fez onboarding
      if (data?.username) setUsername(data.username)
    }
    load()
  }, [router])

  const handleFinish = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ globe_color: selectedColor.value }).eq('id', user.id)
    router.replace('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F5F0E8',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>

      {step === 1 && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 32px', textAlign: 'center',
        }}>
          {/* Logo */}
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 36, fontWeight: 700, color: '#2A2520', marginBottom: 8 }}>
            wander<span style={{ color: '#FFB800' }}>log</span>
          </div>
          <div style={{ fontSize: 13, color: '#8A7A65', marginBottom: 48 }}>
            O mundo à espera das tuas histórias
          </div>

          {/* Globe preview */}
          <div style={{
            width: 180, height: 180, borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${getReliefColor(selectedColor.value)}, ${selectedColor.value})`,
            boxShadow: `0 20px 60px ${selectedColor.value}40`,
            marginBottom: 48, transition: 'all 0.4s ease',
          }} />

          <div style={{ fontSize: 22, fontWeight: 600, color: '#2A2520', fontFamily: 'Georgia, serif', marginBottom: 8 }}>
            Bem-vindo{username ? `, ${username}` : ''}
          </div>
          <div style={{ fontSize: 14, color: '#6B5D4A', lineHeight: 1.7, marginBottom: 48, maxWidth: 280 }}>
            Regista as tuas viagens, partilha as tuas histórias e descobre o mundo através dos olhos de outros viajantes.
          </div>

          <button
            onClick={() => setStep(2)}
            style={{
              width: '100%', maxWidth: 320, padding: '14px', borderRadius: 100,
              background: '#FFB800', border: 'none', color: '#2A2520',
              fontWeight: 600, fontSize: 15, cursor: 'pointer',
            }}
          >
            Começar
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '52px 24px 32px' }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 600, color: '#2A2520', marginBottom: 8 }}>
              O teu globo
            </div>
            <div style={{ fontSize: 14, color: '#6B5D4A', lineHeight: 1.6 }}>
              Escolhe a cor que representa a tua forma de viajar. Podes mudar nas definições a qualquer momento.
            </div>
          </div>

          {/* Preview do globo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
            <div style={{
              width: 140, height: 140, borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, ${getReliefColor(selectedColor.value)}, ${selectedColor.value})`,
              boxShadow: `0 16px 48px ${selectedColor.value}50`,
              transition: 'all 0.3s ease',
            }} />
          </div>

          {/* Grid de cores */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
            marginBottom: 40,
          }}>
            {GLOBE_COLORS.map(color => (
              <button
                key={color.value}
                onClick={() => setSelectedColor(color)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', cursor: 'pointer', padding: '8px 4px',
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 35%, ${getReliefColor(color.value)}, ${color.value})`,
                  border: selectedColor.value === color.value ? `3px solid #2A2520` : '3px solid transparent',
                  boxShadow: selectedColor.value === color.value ? `0 4px 16px ${color.value}60` : 'none',
                  transition: 'all 0.2s',
                }} />
                <span style={{
                  fontSize: 10, color: selectedColor.value === color.value ? '#2A2520' : '#8A7A65',
                  fontWeight: selectedColor.value === color.value ? 600 : 400,
                }}>
                  {color.name}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={handleFinish}
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: 100,
              background: '#FFB800', border: 'none', color: '#2A2520',
              fontWeight: 600, fontSize: 15, cursor: 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'A guardar...' : 'Explorar o mundo'}
          </button>
        </div>
      )}
    </div>
  )
}