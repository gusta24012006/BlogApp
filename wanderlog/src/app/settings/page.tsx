'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=DM+Sans:wght@400;500;600&display=swap');`

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
      const { data } = await supabase.from('profiles').select('is_private').eq('id', user.id).single()
      setIsPrivate(data?.is_private || false)
      setLoading(false)
    }
    load()
  }, [router])

  const handleTogglePrivacy = async () => {
    setSaving(true)
    const newValue = !isPrivate
    await supabase.from('profiles').update({ is_private: newValue }).eq('id', userId)
    setIsPrivate(newValue)
    setSuccess(newValue ? 'Perfil privado ativado' : 'Perfil público ativado')
    setTimeout(() => setSuccess(''), 2500)
    setSaving(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const SettingsRow = ({ icon, label, sub, onPress, danger = false, rightElement }: {
    icon: React.ReactNode; label: string; sub?: string; onPress?: () => void; danger?: boolean; rightElement?: React.ReactNode
  }) => (
    <div onClick={onPress} style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
      cursor: onPress ? 'pointer' : 'default',
      borderBottom: '1px solid rgba(184,168,152,0.12)',
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: danger ? 'rgba(226,75,74,0.08)' : 'rgba(42,37,32,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: danger ? '#C03B3A' : '#2A2520' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: '#8A7A65', marginTop: 2 }}>{sub}</div>}
      </div>
      {rightElement || (onPress && !danger && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8BAA8" strokeWidth="1.8" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      ))}
    </div>
  )

  if (loading) return <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", color: '#8A7A65' }}>A carregar...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 40 }}>
      <style>{FONTS}</style>

      {/* Header */}
      <div style={{
        padding: '52px 20px 16px',
        background: 'rgba(245,240,232,0.97)', backdropFilter: 'blur(16px)',
        position: 'sticky', top: 0, zIndex: 10,
        borderBottom: '1px solid rgba(184,168,152,0.15)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A7A65', display: 'flex', alignItems: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style={{ fontFamily: "'DM Sans', system-ui", fontSize: 22, fontWeight: 600, color: '#2A2520' }}>
          Definições
        </div>
      </div>

      {success && (
        <div style={{ margin: '12px 20px 0', padding: '10px 14px', background: 'rgba(93,202,165,0.1)', border: '1px solid rgba(93,202,165,0.3)', borderRadius: 10, fontSize: 13, color: '#0F6E56' }}>
          {success}
        </div>
      )}

      <div style={{ padding: '8px 20px' }}>

        {/* Privacidade */}
        <div style={{ fontSize: 11, fontWeight: 600, color: '#8A7A65', letterSpacing: 1, textTransform: 'uppercase', padding: '16px 0 4px' }}>
          Privacidade
        </div>
        <SettingsRow
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B5D4A" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
          label="Perfil privado"
          sub={isPrivate ? 'Os teus blogs não aparecem no "Encontrar"' : 'Os teus blogs aparecem no "Encontrar"'}
          rightElement={
            <button onClick={handleTogglePrivacy} disabled={saving} style={{
              width: 46, height: 26, borderRadius: 13,
              background: isPrivate ? '#FFB800' : 'rgba(184,168,152,0.3)',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background 0.2s', flexShrink: 0,
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3,
                left: isPrivate ? 23 : 3,
                transition: 'left 0.2s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
              }} />
            </button>
          }
        />

        {/* Conta */}
        <div style={{ fontSize: 11, fontWeight: 600, color: '#8A7A65', letterSpacing: 1, textTransform: 'uppercase', padding: '20px 0 4px' }}>
          Conta
        </div>
        <SettingsRow
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B5D4A" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
          label="Editar perfil"
          sub="Nome, bio, avatar, localização"
          onPress={() => router.push('/profile/edit')}
        />
        <SettingsRow
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B5D4A" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/></svg>}
          label="Alterar email"
          sub="O teu email atual"
          onPress={() => router.push('/settings/email')}
        />
        <SettingsRow
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B5D4A" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
          label="Alterar password"
          sub="Mínimo 8 caracteres"
          onPress={() => router.push('/settings/password')}
        />

        {/* Aplicação */}
        <div style={{ fontSize: 11, fontWeight: 600, color: '#8A7A65', letterSpacing: 1, textTransform: 'uppercase', padding: '20px 0 4px' }}>
          Aplicação
        </div>
        <SettingsRow
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B5D4A" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
          label="Notificações"
          sub="Em breve"
          onPress={() => router.push('/notifications')}
        />
        <SettingsRow
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B5D4A" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
          label="Idioma"
          sub="Português"
          onPress={() => {}}
        />
        <SettingsRow
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C03B3A" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>}
          label="Sair do Volta"
          danger
          onPress={handleSignOut}
        />
      </div>
    </div>
  )
}