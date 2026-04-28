'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const [userId, setUserId] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('profiles').select('is_private').eq('id', user.id).single()
      setIsPrivate(data?.is_private || false)
      setLoading(false)
    }
    load()
  }, [router])

  const handleTogglePrivacy = async () => {
    setSaving(true)
    const newValue = !isPrivate
    const { error } = await supabase
      .from('profiles').update({ is_private: newValue }).eq('id', userId)
    if (!error) {
      setIsPrivate(newValue)
      setSuccess(newValue ? 'Perfil tornado privado' : 'Perfil tornado público')
      setTimeout(() => setSuccess(''), 3000)
    }
    setSaving(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#F5F0E8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif', color: '#8A7A65',
    }}>A carregar...</div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: 'system-ui, sans-serif', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(245,240,232,0.95)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(184,168,152,0.3)',
        padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => router.push('/dashboard')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 18, color: '#8A7A65',
        }}>←</button>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 600, color: '#2A2520' }}>
          Definições
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px' }}>

        {success && (
          <div style={{
            background: 'rgba(93,202,165,0.1)', border: '1px solid rgba(93,202,165,0.3)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            fontSize: 13, color: '#0F6E56',
          }}>{success}</div>
        )}

        {/* Privacidade */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#2A2520', marginBottom: 16 }}>
            Privacidade
          </div>

          <div style={{
            background: '#fff', borderRadius: 14,
            border: '1px solid rgba(184,168,152,0.25)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid rgba(184,168,152,0.15)',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#2A2520' }}>
                  Perfil privado
                </div>
                <div style={{ fontSize: 12, color: '#8A7A65', marginTop: 3 }}>
                  {isPrivate
                    ? 'Os teus blogs não aparecem no "Encontrar" e o teu perfil só é visível para quem segues'
                    : 'Os teus blogs aparecem no "Encontrar" e o teu perfil é público'
                  }
                </div>
              </div>
              {/* Toggle */}
              <button
                onClick={handleTogglePrivacy}
                disabled={saving}
                style={{
                  width: 48, height: 28, borderRadius: 14,
                  background: isPrivate ? '#FFB800' : 'rgba(184,168,152,0.3)',
                  border: 'none', cursor: 'pointer',
                  position: 'relative', flexShrink: 0, marginLeft: 16,
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3,
                  left: isPrivate ? 23 : 3,
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                }} />
              </button>
            </div>
          </div>
        </div>

        {/* Separador */}
        <div style={{ height: 1, background: 'rgba(184,168,152,0.2)', margin: '24px 0' }} />

        {/* Conta */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#2A2520', marginBottom: 16 }}>
            Conta
          </div>

          <div style={{
            background: '#fff', borderRadius: 14,
            border: '1px solid rgba(184,168,152,0.25)',
            overflow: 'hidden',
          }}>
            <button
              onClick={() => router.push('/profile/edit')}
              style={{
                width: '100%', padding: '14px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: '1px solid rgba(184,168,152,0.15)',
              }}
            >
              <span style={{ fontSize: 14, color: '#2A2520' }}>Editar perfil</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B8A898" strokeWidth="1.8" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>

            <button
              onClick={() => router.push('/settings/password')}
              style={{
                width: '100%', padding: '14px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: '1px solid rgba(184,168,152,0.15)',
              }}
            >
              <span style={{ fontSize: 14, color: '#2A2520' }}>Alterar password</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B8A898" strokeWidth="1.8" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>

            <button
              onClick={() => router.push('/settings/email')}
              style={{
                width: '100%', padding: '14px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 14, color: '#2A2520' }}>Alterar email</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B8A898" strokeWidth="1.8" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Separador */}
        <div style={{ height: 1, background: 'rgba(184,168,152,0.2)', margin: '24px 0' }} />

        {/* Sair */}
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', padding: '14px 20px', borderRadius: 14,
            border: '1px solid rgba(226,75,74,0.3)', background: 'rgba(226,75,74,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 14, color: '#C03B3A' }}>Terminar sessão</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C03B3A" strokeWidth="1.8" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>

      </div>
    </div>
  )
}