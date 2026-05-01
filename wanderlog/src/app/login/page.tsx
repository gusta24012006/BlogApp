'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');`

const LOGO_SVG = `<svg fill="#FFB800" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><g><g><g><path d="M512,256c0-68.38-26.629-132.667-74.981-181.019C388.668,26.629,324.38,0,256,0c-42.396,0-83.214,10.246-119.641,29.548c-49.413-19.661-87.464-19.19-108.415,1.76C6.613,52.64,6.257,90.739,26.893,141.505C9.305,176.613,0,215.591,0,256c0,68.38,26.629,132.667,74.981,181.019C123.333,485.371,187.62,512,256,512c41.656,0,81.787-9.9,117.728-28.556c23.719,9.363,44.81,14.081,62.616,14.08c19.011-0.001,34.294-5.36,45.057-16.123c20.978-20.978,21.662-58.178,2.053-107.692C502.104,337.773,512,297.649,512,256z M44.035,47.4c11.785-11.785,35.875-12.459,67.248-2.634c-12.866,8.853-25.023,18.935-36.303,30.215c-12.594,12.594-23.699,26.277-33.26,40.825C31.447,83.748,32.134,59.3,44.035,47.4z M465.31,465.31c-11.643,11.646-35.303,12.446-66.133,2.983c13.437-9.103,26.112-19.544,37.842-31.273c11.743-11.743,22.192-24.431,31.301-37.885C477.854,430.093,476.933,453.688,465.31,465.31z M372.225,458.169c-3.518-1.541-7.091-3.174-10.726-4.925c-53.998-26.015-115.057-71.664-171.93-128.538c-27.902-27.902-53.688-57.542-75.61-86.826l41.67,10.737c6.087,1.57,12.289-2.095,13.857-8.178c1.568-6.085-2.094-12.289-8.178-13.857l-71.798-18.5c-3.353-0.864-6.92-0.152-9.686,1.931c-2.767,2.084-4.433,5.316-4.526,8.779l-2.007,74.116c-0.169,6.282,4.784,11.511,11.066,11.682c0.105,0.003,0.209,0.005,0.313,0.005c6.141,0,11.201-4.894,11.368-11.069l1.088-40.178c22.273,29.554,48.282,59.38,76.355,87.453c56.763,56.763,117.865,102.822,172.734,130.289c-27.766,11.687-58.248,18.157-90.214,18.157C127.388,489.244,22.756,384.612,22.756,256c0-85.568,46.325-160.507,115.203-201.094c3.247,1.434,6.541,2.948,9.887,4.56c53.997,26.015,115.057,71.664,171.928,128.537c27.903,27.902,53.689,57.543,75.611,86.826l-41.67-10.737c-6.088-1.57-12.29,2.094-13.857,8.178c-1.568,6.085,2.094,12.289,8.178,13.857l71.798,18.501c0.936,0.241,1.89,0.36,2.839,0.36c2.445,0,4.854-0.788,6.848-2.292c2.766-2.084,4.433-5.316,4.526-8.779l2.006-74.117c0.17-6.282-4.784-11.512-11.066-11.682c-0.106-0.003-0.209-0.005-0.313-0.005c-6.141,0-11.201,4.894-11.368,11.069l-1.088,40.178c-22.273-29.554-48.28-59.379-76.355-87.453c-56.603-56.603-117.52-102.558-172.27-130.053C191.947,29.579,223.189,22.756,256,22.756c128.611,0,233.244,104.632,233.244,233.244C489.244,342.321,442.109,417.838,372.225,458.169z"/><path d="M141.959,373.639c2.22,2.208,5.122,3.312,8.025,3.312c2.921,0,5.844-1.118,8.066-3.353c4.432-4.456,4.413-11.659-0.042-16.09l-0.619-0.621c-4.443-4.443-11.647-4.443-16.092,0c-4.443,4.443-4.443,11.647,0,16.092L141.959,373.639z"/><path d="M221.404,444.2c2.082,1.633,4.556,2.423,7.012,2.423c3.376,0,6.717-1.496,8.962-4.359c3.875-4.944,3.008-12.096-1.936-15.973c-16.547-12.972-33.151-27.077-49.352-41.923c-4.633-4.246-11.828-3.931-16.075,0.702c-4.245,4.633-3.931,11.829,0.702,16.075C187.345,416.383,204.398,430.868,221.404,444.2z"/><path d="M366.729,138.416c-4.453-4.436-11.655-4.421-16.092,0.031c-4.434,4.452-4.42,11.657,0.031,16.09l1.282,1.28c2.221,2.225,5.136,3.338,8.05,3.338c2.909,0,5.819-1.109,8.04-3.327c4.446-4.441,4.451-11.644,0.01-16.09L366.729,138.416z"/><path d="M269.073,54.17c-5.057-3.724-12.183-2.641-15.907,2.42c-3.724,5.061-2.64,12.183,2.421,15.907c21.448,15.783,43.016,33.478,64.106,52.595c2.178,1.974,4.912,2.948,7.638,2.948c3.099,0,6.187-1.26,8.433-3.737c4.22-4.656,3.866-11.851-0.788-16.071C313.314,88.599,291.143,70.409,269.073,54.17z"/></g></g></g></svg>`

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
      {errors.map(e => (
        <div key={e} style={{ fontSize: 11, color: '#8A7A65', display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
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
    if (msg.includes('User already registered')) return 'Este email já está em uso'
    if (msg.includes('already been registered')) return 'Este email já está em uso'
    if (msg.includes('email address is already')) return 'Este email já está em uso'
    if (msg.includes('already exists')) return 'Este email já está em uso'
    if (msg.includes('rate limit')) return 'Demasiadas tentativas. Aguarda uns minutos'
    return msg
  }

  const handleAuth = async () => {
    setError('')
    if (!email.includes('@')) { setError('Insere um email válido'); return }
    if (isSignUp && !isPasswordValid) { setError('A password não cumpre todos os requisitos'); return }
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

  return (
    <div style={{
      minHeight: '100vh', background: '#F5F0E8',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <style>{FONTS}</style>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 44, height: 44 }} dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
          <div style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 38, fontWeight: 700, color: '#2A2520',
            letterSpacing: -1.5, lineHeight: 1,
          }}>
            Vol<span style={{ color: '#FFB800' }}>ta</span>
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#8A7A65', marginTop: 4 }}>
          {isSignUp ? 'Cria a tua conta' : 'Bem-vindo de volta'}
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: '#fff', borderRadius: 20, padding: '28px 24px',
        width: '100%', maxWidth: 380,
        boxShadow: '0 4px 24px rgba(42,37,32,0.08)',
        border: '0.5px solid rgba(184,168,152,0.25)',
      }}>

        {/* Email */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: '#6B5D4A', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Email
          </label>
          <input
            type="email"
            placeholder="o@teu.email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
            style={{
              width: '100%', padding: '11px 14px', borderRadius: 12,
              border: '1px solid rgba(184,168,152,0.4)',
              fontSize: 14, outline: 'none', boxSizing: 'border-box',
              color: '#2A2520', background: '#FAFAF7',
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, color: '#6B5D4A', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={isSignUp ? 'Mín. 8 caracteres, maiúscula e número' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
              style={{
                width: '100%', padding: '11px 42px 11px 14px', borderRadius: 12,
                border: '1px solid rgba(184,168,152,0.4)',
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
                color: '#2A2520', background: '#FAFAF7',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            <button onClick={() => setShowPassword(!showPassword)} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B8A898" strokeWidth="1.8" strokeLinecap="round">
                {showPassword
                  ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                  : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                }
              </svg>
            </button>
          </div>
        </div>

        {isSignUp && password && <PasswordStrength password={password} />}

        {error && (
          <div style={{
            background: 'rgba(226,75,74,0.08)', border: '1px solid rgba(226,75,74,0.2)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 14,
            fontSize: 13, color: '#C03B3A',
          }}>
            {error}
          </div>
        )}

        {/* Botão principal */}
        <button
          onClick={handleAuth}
          disabled={loading || (isSignUp && !isPasswordValid)}
          style={{
            width: '100%', padding: '12px', borderRadius: 100,
            background: loading || (isSignUp && !isPasswordValid) ? 'rgba(255,184,0,0.4)' : '#FFB800',
            border: 'none', color: '#2A2520',
            fontSize: 14, fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'all 0.2s', marginBottom: 16, marginTop: 4,
          }}
        >
          {loading ? 'A processar...' : isSignUp ? 'Criar conta' : 'Entrar'}
        </button>

        {/* Separador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 0.5, background: 'rgba(184,168,152,0.4)' }} />
          <span style={{ fontSize: 12, color: '#B8A898' }}>ou</span>
          <div style={{ flex: 1, height: 0.5, background: 'rgba(184,168,152,0.4)' }} />
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
            width: '100%', padding: '11px', borderRadius: 100,
            background: '#fff', border: '1px solid rgba(184,168,152,0.4)',
            fontSize: 14, fontWeight: 500, color: '#2A2520',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 10, marginBottom: 20,
            fontFamily: "'DM Sans', sans-serif",
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