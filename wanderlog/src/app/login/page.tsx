'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

function validatePassword(password: string) {
  const errors = []
  if (password.length < 8) errors.push('Mínimo 8 caracteres')
  if (!/[A-Z]/.test(password)) errors.push('Pelo menos uma maiúscula')
  if (!/[0-9]/.test(password)) errors.push('Pelo menos um número')
  return errors
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const errors = validatePassword(password)
  const strength = 3 - errors.length
  const colors = ['#E24B4A', '#EF9F27', '#5DCAA5']
  const labels = ['Fraca', 'Média', 'Forte']

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < strength ? colors[strength - 1] : 'rgba(184,168,152,0.3)',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>
      {strength > 0 && strength < 3 && (
        <div style={{ fontSize: 11, color: colors[strength - 1] }}>
          {labels[strength - 1]}
        </div>
      )}
      {errors.map(e => (
        <div key={e} style={{
          fontSize: 11, color: '#8A7A65',
          display: 'flex', alignItems: 'center', gap: 4, marginTop: 3,
        }}>
          <span style={{ color: '#E24B4A' }}>×</span> {e}
        </div>
      ))}
      {errors.length === 0 && (
        <div style={{ fontSize: 11, color: '#5DCAA5', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>✓</span> Password forte
        </div>
      )}
    </div>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const passwordErrors = validatePassword(password)
  const isPasswordValid = passwordErrors.length === 0

  const getErrorMessage = (msg: string) => {
    if (msg.includes('Invalid login credentials')) return 'Email ou password incorretos'
    if (msg.includes('Email not confirmed')) return 'Confirma o teu email antes de entrar'
    if (msg.includes('User already registered')) return 'Este email já está registado'
    if (msg.includes('Password should be')) return 'A password não cumpre os requisitos mínimos'
    if (msg.includes('rate limit')) return 'Demasiadas tentativas. Aguarda uns minutos'
    if (msg.includes('network')) return 'Erro de ligação. Verifica a tua internet'
    return msg
  }

  const handleAuth = async () => {
    setError('')

    if (!email.includes('@')) {
      setError('Insere um email válido')
      return
    }

    if (isSignUp && !isPasswordValid) {
      setError('A password não cumpre todos os requisitos')
      return
    }

    setLoading(true)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(getErrorMessage(error.message))
      else window.location.href = '/dashboard'
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(getErrorMessage(error.message))
      else window.location.href = '/dashboard'
    }

    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAuth()
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#F5F0E8',
      fontFamily: 'system-ui, sans-serif', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 32,
        width: '100%', maxWidth: 380,
        boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
        border: '1px solid rgba(184,168,152,0.2)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            fontFamily: 'Georgia, serif', fontSize: 30,
            color: '#2A2520', letterSpacing: -0.5,
          }}>
            wander<span style={{ color: '#FFB800' }}>log</span>
          </div>
          <div style={{ fontSize: 13, color: '#8A7A65', marginTop: 6 }}>
            {isSignUp ? 'Cria a tua conta' : 'Bem-vindo de volta'}
          </div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#6B5D4A', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Email
          </label>
          <input
            type="email"
            placeholder="o@teu.email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 10,
              border: '1px solid rgba(184,168,152,0.5)',
              fontSize: 14, outline: 'none', boxSizing: 'border-box',
              color: '#2A2520', background: '#FAFAF7',
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 12, color: '#6B5D4A', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={isSignUp ? 'Mín. 8 caracteres, maiúscula e número' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                width: '100%', padding: '10px 40px 10px 14px', borderRadius: 10,
                border: '1px solid rgba(184,168,152,0.5)',
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
                color: '#2A2520', background: '#FAFAF7',
              }}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, color: '#8A7A65', padding: 0,
              }}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* Password strength — só no registo */}
        {isSignUp && password && <PasswordStrength password={password} />}

        {/* Requisitos — só no registo sem password */}
        {isSignUp && !password && (
          <div style={{ marginBottom: 12 }}>
            {['Mínimo 8 caracteres', 'Pelo menos uma maiúscula', 'Pelo menos um número'].map(r => (
              <div key={r} style={{ fontSize: 11, color: '#B8A898', display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <span>○</span> {r}
              </div>
            ))}
          </div>
        )}

        {/* Erro */}
        {error && (
          <div style={{
            background: 'rgba(226,75,74,0.08)', border: '1px solid rgba(226,75,74,0.2)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 14,
            fontSize: 13, color: '#C03B3A',
          }}>
            {error}
          </div>
        )}

        {/* Botão */}
        <button
          onClick={handleAuth}
          disabled={loading || (isSignUp && !isPasswordValid)}
          style={{
            width: '100%', padding: 12, borderRadius: 10,
            background: loading || (isSignUp && !isPasswordValid) ? 'rgba(255,184,0,0.4)' : '#FFB800',
            border: 'none', color: '#2A2520',
            fontSize: 14, fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
            transition: 'all 0.2s', marginBottom: 16,
          }}
        >
          {loading ? 'A processar...' : isSignUp ? 'Criar conta' : 'Entrar'}
        </button>

        {/* Separador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(184,168,152,0.3)' }} />
          <span style={{ fontSize: 12, color: '#B8A898' }}>ou</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(184,168,152,0.3)' }} />
        </div>

        {/* Google */}
        <button
          onClick={async () => {
            await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: `${window.location.origin}/dashboard` },
            })
          }}
          style={{
            width: '100%', padding: 12, borderRadius: 10,
            background: '#fff', border: '1px solid rgba(184,168,152,0.5)',
            fontSize: 14, fontWeight: 500, color: '#2A2520',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 10, marginBottom: 16,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar com Google
        </button>

        {/* Toggle */}
        <div style={{ textAlign: 'center', fontSize: 13, color: '#8A7A65' }}>
          {isSignUp ? 'Já tens conta? ' : 'Ainda não tens conta? '}
          <span
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setPassword('') }}
            style={{ color: '#FFB800', cursor: 'pointer', fontWeight: 600 }}
          >
            {isSignUp ? 'Entrar' : 'Registar'}
          </span>
        </div>
      </div>
    </div>
  )
}