'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function validatePassword(password: string) {
  const errors = []
  if (password.length < 8) errors.push('Mínimo 8 caracteres')
  if (!/[A-Z]/.test(password)) errors.push('Pelo menos uma maiúscula')
  if (!/[0-9]/.test(password)) errors.push('Pelo menos um número')
  return errors
}

export default function ChangePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const passwordErrors = validatePassword(password)
  const isValid = passwordErrors.length === 0 && password === confirm

  const handleSave = async () => {
    if (!isValid) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/settings'), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(245,240,232,0.95)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(184,168,152,0.3)',
        padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => router.push('/settings')} style={{
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#8A7A65',
        }}>←</button>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 600, color: '#2A2520' }}>
          Alterar password
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px' }}>
        {success ? (
          <div style={{
            background: 'rgba(93,202,165,0.1)', border: '1px solid rgba(93,202,165,0.3)',
            borderRadius: 12, padding: '16px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 14, color: '#0F6E56' }}>Password alterada com sucesso</div>
          </div>
        ) : (
          <>
            {error && (
              <div style={{
                background: 'rgba(226,75,74,0.08)', border: '1px solid rgba(226,75,74,0.2)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#C03B3A',
              }}>{error}</div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B5D4A', marginBottom: 6 }}>
                Nova password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mín. 8 caracteres, maiúscula e número"
                  style={{
                    width: '100%', padding: '11px 40px 11px 14px', borderRadius: 10,
                    border: '1px solid rgba(184,168,152,0.5)', fontSize: 14, outline: 'none',
                    background: '#fff', color: '#2A2520', boxSizing: 'border-box',
                  }}
                />
                <button onClick={() => setShowPassword(!showPassword)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#8A7A65',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    {showPassword
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    }
                  </svg>
                </button>
              </div>

              {/* Requisitos */}
              {password && (
                <div style={{ marginTop: 8 }}>
                  {['Mínimo 8 caracteres', 'Pelo menos uma maiúscula', 'Pelo menos um número'].map((req, i) => {
                    const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password)]
                    return (
                      <div key={req} style={{ fontSize: 11, color: checks[i] ? '#5DCAA5' : '#B8A898', display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                        <span>{checks[i] ? '✓' : '○'}</span> {req}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B5D4A', marginBottom: 6 }}>
                Confirmar password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repete a nova password"
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  border: `1px solid ${confirm && confirm !== password ? 'rgba(226,75,74,0.5)' : 'rgba(184,168,152,0.5)'}`,
                  fontSize: 14, outline: 'none', background: '#fff', color: '#2A2520', boxSizing: 'border-box',
                }}
              />
              {confirm && confirm !== password && (
                <div style={{ fontSize: 11, color: '#C03B3A', marginTop: 5 }}>As passwords não coincidem</div>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={!isValid || loading}
              style={{
                width: '100%', padding: 12, borderRadius: 100,
                background: isValid && !loading ? '#FFB800' : 'rgba(255,184,0,0.4)',
                border: 'none', color: '#2A2520', fontWeight: 600, fontSize: 14,
                cursor: isValid ? 'pointer' : 'default',
              }}
            >
              {loading ? 'A guardar...' : 'Guardar password'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}