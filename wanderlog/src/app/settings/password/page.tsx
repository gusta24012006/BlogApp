'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`

function validatePassword(password: string) {
  const errors = []
  if (password.length < 8) errors.push('Mínimo 8 caracteres')
  if (!/[A-Z]/.test(password)) errors.push('Pelo menos uma maiúscula')
  if (!/[0-9]/.test(password)) errors.push('Pelo menos um número')
  return errors
}

const MAX_ATTEMPTS = 3
const LOCKOUT_MINUTES = 15

export default function ChangePasswordPage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null)

  const passwordErrors = validatePassword(password)
  const isValid = passwordErrors.length === 0 && password === confirm && currentPassword.length > 0

  const isLocked = lockedUntil && new Date() < lockedUntil

  const handleSave = async () => {
    if (!isValid || isLocked) return
    setLoading(true)
    setError('')

    // Verificar password atual re-autenticando
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) { setLoading(false); return }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      if (newAttempts >= MAX_ATTEMPTS) {
        const lockout = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
        setLockedUntil(lockout)
        setError(`Password atual incorreta. Conta bloqueada por ${LOCKOUT_MINUTES} minutos.`)
      } else {
        setError(`Password atual incorreta. ${MAX_ATTEMPTS - newAttempts} tentativa(s) restante(s).`)
      }
      setLoading(false)
      return
    }

    // Password atual correta — atualizar
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/settings'), 2000)
  }

  const handleForgotPassword = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/settings/password`,
    })
    setResetSent(true)
  }

  const EyeIcon = ({ show }: { show: boolean }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      {show
        ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      }
    </svg>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{FONTS}</style>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(245,240,232,0.95)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(184,168,152,0.2)',
        padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => router.push('/settings')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#8A7A65', display: 'flex', alignItems: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#2A2520', flex: 1 }}>
          Alterar password
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px' }}>

        {success ? (
          <div style={{
            background: 'rgba(93,202,165,0.1)', border: '1px solid rgba(93,202,165,0.3)',
            borderRadius: 16, padding: '24px', textAlign: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5DCAA5" strokeWidth="2" strokeLinecap="round" style={{ marginBottom: 12 }}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0F6E56' }}>Password alterada com sucesso</div>
          </div>
        ) : resetSent ? (
          <div style={{
            background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.25)',
            borderRadius: 16, padding: '24px', textAlign: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="1.8" strokeLinecap="round" style={{ marginBottom: 12 }}>
              <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/>
            </svg>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#2A2520', marginBottom: 6 }}>Email enviado</div>
            <div style={{ fontSize: 13, color: '#8A7A65' }}>Verifica o teu email para redefinir a password.</div>
          </div>
        ) : (
          <>
            {error && (
              <div style={{
                background: 'rgba(226,75,74,0.08)', border: '1px solid rgba(226,75,74,0.2)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#C03B3A',
              }}>{error}</div>
            )}

            {isLocked && (
              <div style={{
                background: 'rgba(226,75,74,0.05)', border: '1px solid rgba(226,75,74,0.15)',
                borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#8A7A65',
              }}>
                Podes tentar novamente às {lockedUntil?.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}.
              </div>
            )}

            {/* Password atual */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B5D4A', marginBottom: 6 }}>
                Password atual
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="A tua password atual"
                  disabled={!!isLocked}
                  style={{
                    width: '100%', padding: '11px 40px 11px 14px', borderRadius: 12,
                    border: '1px solid rgba(184,168,152,0.5)', fontSize: 14, outline: 'none',
                    background: isLocked ? 'rgba(184,168,152,0.05)' : '#fff',
                    color: '#2A2520', boxSizing: 'border-box',
                    fontFamily: "'DM Sans', system-ui",
                  }}
                />
                <button onClick={() => setShowCurrent(!showCurrent)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#8A7A65',
                }}>
                  <EyeIcon show={showCurrent} />
                </button>
              </div>
              {/* Esqueci-me */}
              <button onClick={handleForgotPassword} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: '#FFB800', fontWeight: 500, marginTop: 6, padding: 0,
                fontFamily: "'DM Sans', system-ui",
              }}>
                Esqueci-me da password
              </button>
            </div>

            {/* Nova password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B5D4A', marginBottom: 6 }}>
                Nova password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mín. 8 caracteres, maiúscula e número"
                  disabled={!!isLocked}
                  style={{
                    width: '100%', padding: '11px 40px 11px 14px', borderRadius: 12,
                    border: '1px solid rgba(184,168,152,0.5)', fontSize: 14, outline: 'none',
                    background: isLocked ? 'rgba(184,168,152,0.05)' : '#fff',
                    color: '#2A2520', boxSizing: 'border-box',
                    fontFamily: "'DM Sans', system-ui",
                  }}
                />
                <button onClick={() => setShowNew(!showNew)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#8A7A65',
                }}>
                  <EyeIcon show={showNew} />
                </button>
              </div>
              {password && (
                <div style={{ marginTop: 8 }}>
                  {['Mínimo 8 caracteres', 'Pelo menos uma maiúscula', 'Pelo menos um número'].map((req, i) => {
                    const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password)]
                    return (
                      <div key={req} style={{ fontSize: 11, color: checks[i] ? '#5DCAA5' : '#B8A898', display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          {checks[i] ? <polyline points="20 6 9 17 4 12"/> : <circle cx="12" cy="12" r="8"/>}
                        </svg>
                        {req}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Confirmar */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B5D4A', marginBottom: 6 }}>
                Confirmar nova password
              </label>
              <input
                type={showNew ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repete a nova password"
                disabled={!!isLocked}
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 12,
                  border: `1px solid ${confirm && confirm !== password ? 'rgba(226,75,74,0.5)' : 'rgba(184,168,152,0.5)'}`,
                  fontSize: 14, outline: 'none',
                  background: isLocked ? 'rgba(184,168,152,0.05)' : '#fff',
                  color: '#2A2520', boxSizing: 'border-box',
                  fontFamily: "'DM Sans', system-ui",
                }}
              />
              {confirm && confirm !== password && (
                <div style={{ fontSize: 11, color: '#C03B3A', marginTop: 5 }}>As passwords não coincidem</div>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={!isValid || loading || !!isLocked}
              style={{
                width: '100%', padding: 12, borderRadius: 100,
                background: isValid && !loading && !isLocked ? '#FFB800' : 'rgba(255,184,0,0.35)',
                border: 'none', color: '#2A2520', fontWeight: 600, fontSize: 14,
                cursor: isValid && !isLocked ? 'pointer' : 'default',
                fontFamily: "'DM Sans', system-ui",
              }}
            >
              {loading ? 'A verificar...' : 'Guardar password'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}