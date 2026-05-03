'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`

const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=600&q=80',
    title: 'Bem-vindo à Volta',
    subtitle: 'O teu diário de viagens pessoal, num globo interativo.',
  },
  {
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80',
    title: 'Explora histórias de todo o mundo',
    subtitle: 'Segue viajantes e descobre os seus blogs em cada país que visitaram.',
  },
  {
    image: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=600&q=80',
    title: 'Gira para descobrir',
    subtitle: 'Dá um spin no globo para descobrir histórias de qualquer parte do mundo.',
  },
  {
    image: 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=600&q=80',
    title: 'Mergulha num país',
    subtitle: 'Carrega num país para ler os blogs de quem lá esteve.',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [opacity, setOpacity] = useState(1)
  const [animating, setAnimating] = useState(false)

  const goTo = (index: number) => {
    if (animating) return
    setAnimating(true)
    setOpacity(0)
    setTimeout(() => {
      setCurrent(index)
      setOpacity(1)
      setAnimating(false)
    }, 250)
  }

  const next = () => {
    if (current < SLIDES.length - 1) goTo(current + 1)
    else finish()
  }

  const finish = () => {
    setOpacity(0)
    setTimeout(() => router.push('/dashboard'), 250)
  }

  const slide = SLIDES[current]

  return (
    <div style={{
      minHeight: '100vh', background: '#F5F0E8',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      <style>{FONTS}</style>

      {/* Logo */}
      <div style={{ padding: '52px 24px 0', display: 'flex', justifyContent: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#2A2520', letterSpacing: -0.5 }}>
          Vol<span style={{ color: '#FFB800' }}>ta</span>
        </div>
      </div>

      {/* Imagem */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px 0',
        opacity, transition: 'opacity 0.25s ease',
      }}>
        <div style={{
          width: '100%', maxWidth: 320, aspectRatio: '1',
          borderRadius: 24, overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(42,37,32,0.12)',
        }}>
          <img
            src={slide.image}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 28 }}>
        {SLIDES.map((_, i) => (
          <div
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: i === current ? 20 : 6,
              height: 6, borderRadius: 3,
              background: i === current ? '#FFB800' : 'rgba(42,37,32,0.2)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

      {/* Texto */}
      <div style={{
        padding: '24px 28px 0',
        opacity, transition: 'opacity 0.25s ease',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#2A2520', lineHeight: 1.2, marginBottom: 10 }}>
          {slide.title}
        </div>
        <div style={{ fontSize: 15, color: '#6B5D4A', lineHeight: 1.6 }}>
          {slide.subtitle}
        </div>
      </div>

      {/* Botões */}
      <div style={{ padding: '28px 28px 48px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={next} style={{
          width: '100%', padding: '14px', borderRadius: 100,
          background: '#FFB800', border: 'none',
          color: '#2A2520', fontWeight: 700, fontSize: 16,
          cursor: 'pointer', fontFamily: "'DM Sans', system-ui",
          boxShadow: '0 4px 14px rgba(255,184,0,0.35)',
        }}>
          {current < SLIDES.length - 1 ? 'Próximo' : 'Começar'}
        </button>
        {current < SLIDES.length - 1 && (
          <button onClick={finish} style={{
            width: '100%', padding: '14px', borderRadius: 100,
            background: 'transparent', border: 'none',
            color: '#8A7A65', fontWeight: 500, fontSize: 15,
            cursor: 'pointer', fontFamily: "'DM Sans', system-ui",
          }}>
            Saltar
          </button>
        )}
      </div>
    </div>
  )
}