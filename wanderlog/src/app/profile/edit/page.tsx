'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EditProfilePage() {
  const router = useRouter()
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [success, setSuccess] = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [userId, setUserId] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()

      if (data) {
        setDisplayName(data.display_name || '')
        setUsername(data.username || '')
        setBio(data.bio || '')
        setLocation(data.location || '')
        setAvatarUrl(data.avatar_url || '')
      }
      setLoading(false)
    }
    load()
  }, [router])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!displayName.trim()) e.displayName = 'O nome não pode estar vazio'
    if (!username.trim()) e.username = 'O username não pode estar vazio'
    if (username.includes(' ')) e.username = 'O username não pode ter espaços'
    if (username.length < 3) e.username = 'O username tem de ter pelo menos 3 caracteres'
    if (bio.length > 160) e.bio = 'A bio não pode ter mais de 160 caracteres'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setSaving(true)
    setErrors({})

    // Validar localização se preenchida
    if (location.trim()) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location.trim())}&format=json&limit=1`)
        const data = await res.json()
        // Rejeitar se não há resultados ou se a relevância é muito baixa (< 0.3)
        // ou se não é um local administrativo reconhecível
        const validTypes = ['city', 'town', 'village', 'municipality', 'county', 'state', 'country', 'suburb', 'district', 'region', 'administrative']
        const result = data[0]
        const isValid = result &&
          parseFloat(result.importance || '0') > 0.3 &&
          (validTypes.some(t => result.type === t || result.class === t || (result.addresstype && result.addresstype === t)))
        if (!isValid) {
          setSaving(false)
          setErrors({ location: 'Localização não reconhecida. Tenta ex: "Lisboa, Portugal" ou "Porto"' })
          return
        }
      } catch {
        // Se falhar a validação por rede, deixar passar
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        location: location.trim(),
        avatar_url: avatarUrl,
      })
      .eq('id', userId)

    setSaving(false)
    if (error) {
      if (error.message.includes('unique')) setErrors({ username: 'Este username já está em uso' })
      else setErrors({ general: 'Erro ao guardar. Tenta novamente.' })
      return
    }
    setSuccess(true)
    setTimeout(() => { setSuccess(false); router.push('/dashboard') }, 1500)
  }

  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploadingAvatar(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${userId}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('post-media').upload(path, file, { upsert: true })
    if (error) { setUploadingAvatar(false); return }
    const { data } = supabase.storage.from('post-media').getPublicUrl(path)
    setAvatarUrl(data.publicUrl)
    setUploadingAvatar(false)
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#F5F0E8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif', color: '#8A7A65',
    }}>A carregar...</div>
  )

  return (
    <div style={{
      minHeight: '100vh', background: '#F5F0E8',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(245,240,232,0.95)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(184,168,152,0.3)',
        padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => router.push('/dashboard')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#8A7A65', display: 'flex', alignItems: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style={{ fontFamily: "'DM Sans', system-ui", fontSize: 18, fontWeight: 600, color: '#2A2520', flex: 1 }}>
          Editar perfil
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '8px 20px', borderRadius: 20,
            background: saving ? 'rgba(255,184,0,0.4)' : '#FFB800',
            border: 'none', color: '#2A2520', fontWeight: 600,
            fontSize: 13, cursor: saving ? 'wait' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {saving ? 'A guardar...' : success ? '✓ Guardado' : 'Guardar'}
        </button>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px 80px' }}>

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div
            onClick={() => avatarInputRef.current?.click()}
            style={{
              width: 96, height: 96, borderRadius: '50%', cursor: 'pointer',
              position: 'relative', overflow: 'hidden',
              background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #FFE066, #FFB800)',
              border: '3px solid #FFB800',
              boxShadow: '0 4px 16px rgba(198,139,0,0.3)',
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="avatar" />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: 'radial-gradient(circle at 35% 30%, #E8C9A8 0%, #C9A487 55%, #8E6B4E 100%)',
              }} />
            )}
            {/* Overlay ao hover */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {uploadingAvatar ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              )}
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#8A7A65', marginTop: 10 }}>
            Toca para alterar a foto
          </div>
          <input
            ref={avatarInputRef}
            type="file" accept="image/*"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f) }}
          />
        </div>

        {errors.general && (
          <div style={{
            background: 'rgba(226,75,74,0.08)', border: '1px solid rgba(226,75,74,0.2)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            fontSize: 13, color: '#C03B3A',
          }}>{errors.general}</div>
        )}

        {/* Campos */}
        {[
          {
            label: 'Nome de exibição',
            value: displayName,
            onChange: setDisplayName,
            placeholder: 'O teu nome',
            error: errors.displayName,
            hint: 'Este é o nome que aparece no teu perfil',
          },
          {
            label: 'Username',
            value: username,
            onChange: (v: string) => setUsername(v.toLowerCase().replace(/\s/g, '')),
            placeholder: 'o_teu_username',
            error: errors.username,
            prefix: '@',
            hint: 'Só letras, números e underscores',
          },
          {
            label: 'Localização',
            value: location,
            onChange: setLocation,
            placeholder: 'Lisboa, Portugal',
            error: errors.location,
            hint: 'Onde moras ou onde te encontras',
          },
        ].map(field => (
          <div key={field.label} style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 600,
              color: '#6B5D4A', marginBottom: 6, letterSpacing: 0.3,
            }}>
              {field.label}
            </label>
            <div style={{ position: 'relative' }}>
              {field.prefix && (
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 14, color: '#8A7A65',
                }}>{field.prefix}</span>
              )}
              <input
                type="text"
                value={field.value}
                onChange={e => field.onChange(e.target.value)}
                placeholder={field.placeholder}
                style={{
                  width: '100%', padding: field.prefix ? '11px 14px 11px 26px' : '11px 14px',
                  borderRadius: 10, fontSize: 14, outline: 'none',
                  border: `1px solid ${field.error ? 'rgba(226,75,74,0.5)' : 'rgba(184,168,152,0.5)'}`,
                  background: '#fff', color: '#2A2520', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>
            {field.error && (
              <div style={{ fontSize: 11, color: '#C03B3A', marginTop: 5 }}>{field.error}</div>
            )}
            {!field.error && field.hint && (
              <div style={{ fontSize: 11, color: '#B8A898', marginTop: 5 }}>{field.hint}</div>
            )}
          </div>
        ))}

        {/* Bio */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: 'block', fontSize: 12, fontWeight: 600,
            color: '#6B5D4A', marginBottom: 6, letterSpacing: 0.3,
          }}>Bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Conta-nos um pouco sobre ti e as tuas viagens..."
            maxLength={160}
            rows={3}
            style={{
              width: '100%', padding: '11px 14px', borderRadius: 10,
              fontSize: 14, outline: 'none', resize: 'none',
              border: `1px solid ${errors.bio ? 'rgba(226,75,74,0.5)' : 'rgba(184,168,152,0.5)'}`,
              background: '#fff', color: '#2A2520', boxSizing: 'border-box',
              fontFamily: 'system-ui', lineHeight: 1.5,
            }}
          />
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 11, marginTop: 5,
          }}>
            <span style={{ color: errors.bio ? '#C03B3A' : 'transparent' }}>
              {errors.bio || ''}
            </span>
            <span style={{ color: bio.length > 140 ? '#EF9F27' : '#B8A898' }}>
              {bio.length}/160
            </span>
          </div>
        </div>

        {/* Separador */}
        <div style={{
          height: 1, background: 'rgba(184,168,152,0.3)',
          margin: '28px 0',
        }} />

        {/* Conta */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: "'DM Sans', system-ui", fontSize: 16, fontWeight: 600, color: '#2A2520', marginBottom: 16 }}>
            Conta
          </div>
          <button
            onClick={() => router.push('/settings/password')}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 10,
              border: '1px solid rgba(184,168,152,0.4)', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 14, color: '#2A2520' }}>Alterar password</span>
            <span style={{ color: '#B8A898', fontSize: 16 }}>→</span>
          </button>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/login')
            }}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 10,
              border: '1px solid rgba(226,75,74,0.3)', background: 'rgba(226,75,74,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 14, color: '#C03B3A' }}>Terminar sessão</span>
            <span style={{ color: '#C03B3A', fontSize: 16, opacity: 0.6 }}>→</span>
          </button>
        </div>

      </div>
    </div>
  )
}