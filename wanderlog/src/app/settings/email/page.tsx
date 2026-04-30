'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ChangeEmailPage() {
  const router = useRouter()
  const [currentEmail, setCurrentEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setCurrentEmail(user.email)
    })
  }, [])

  const handleSave = async () => {
    if (!newEmail.includes('@')) { setError('Insere um email válido'); return }
    if (newEmail === currentEmail) { setError('O novo email é igual ao atual'); return }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ email: newEmail })
    setLoading(false)

    if (error) { setError(error.message); return }

    setSuccess(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(245,240,232,0.95)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(184,168,152,0.3)',
        padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => router.push('/settings')} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: '#8A7A65', display: 'flex', alignItems: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style={{ fontFamily: "'DM Sans', system-ui", fontSize: 18, fontWeight: 600, color: '#2A2520' }}>
          Alterar email
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px' }}>
        {success ? (
          <div style={{
            background: 'rgba(93,202,165,0.1)', border: '1px solid rgba(93,202,165,0.3)',
            borderRadius: 12, padding: '20px', textAlign: 'center',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5DCAA5" strokeWidth="1.8" strokeLinecap="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/>
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0F6E56', marginBottom: 8 }}>
              Confirma o teu novo email
            </div>
            <div style={{ fontSize: 13, color: '#6B5D4A', lineHeight: 1.6 }}>
              Enviámos um email de confirmação para <strong>{newEmail}</strong>. Clica no link para confirmar a alteração.
            </div>
            <button onClick={() => router.push('/settings')} style={{
              marginTop: 20, padding: '10px 24px', borderRadius: 100,
              background: '#FFB800', border: 'none', color: '#2A2520',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}>
              Voltar às definições
            </button>
          </div>
        ) : (
          <>
            {currentEmail && (
              <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(184,168,152,0.1)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: '#8A7A65', marginBottom: 4 }}>EMAIL ATUAL</div>
                <div style={{ fontSize: 14, color: '#2A2520' }}>{currentEmail}</div>
              </div>
            )}

            {error && (
              <div style={{
                background: 'rgba(226,75,74,0.08)', border: '1px solid rgba(226,75,74,0.2)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#C03B3A',
              }}>{error}</div>
            )}

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B5D4A', marginBottom: 6 }}>
                Novo email
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="o@novo.email"
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  border: '1px solid rgba(184,168,152,0.5)', fontSize: 14, outline: 'none',
                  background: '#fff', color: '#2A2520', boxSizing: 'border-box',
                }}
              />
              <div style={{ fontSize: 11, color: '#B8A898', marginTop: 6 }}>
                Vais receber um email de confirmação no novo endereço
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!newEmail || loading}
              style={{
                width: '100%', padding: 12, borderRadius: 100,
                background: newEmail && !loading ? '#FFB800' : 'rgba(255,184,0,0.4)',
                border: 'none', color: '#2A2520', fontWeight: 600, fontSize: 14,
                cursor: newEmail ? 'pointer' : 'default',
              }}
            >
              {loading ? 'A enviar...' : 'Enviar confirmação'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}