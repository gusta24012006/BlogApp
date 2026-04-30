'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  username: string
  display_name: string
  avatar_url?: string
  location?: string
  bio?: string
}

function UserRow({ profile, currentUserId, initialFollowing, isOwnProfile, currentTab, onRemove }: {
  profile: Profile
  currentUserId: string
  initialFollowing: boolean
  isOwnProfile: boolean
  currentTab: string
  onRemove?: (id: string) => void
}) {
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)
  const [removed, setRemoved] = useState(false)

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentUserId) return
    setLoading(true)
    if (following) {
      await supabase.from('follows').delete()
        .eq('follower_id', currentUserId).eq('following_id', profile.id)
      setFollowing(false)
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: profile.id })
      setFollowing(true)
    }
    setLoading(false)
  }

  if (removed) return null

  return (
    <div
      onClick={() => router.push(`/user/${profile.username}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 20px', cursor: 'pointer',
        borderBottom: '1px solid rgba(184,168,152,0.12)',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(184,168,152,0.08)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
    >
      {/* Avatar */}
      <div style={{
        width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
        border: '2px solid rgba(255,184,0,0.3)', overflow: 'hidden',
        background: 'linear-gradient(135deg, #FFE066, #FFB800)',
      }}>
        {profile.avatar_url
          ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
          : <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at 35% 30%, #E8C9A8, #8E6B4E)' }} />
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#2A2520', fontFamily: "'DM Sans', system-ui" }}>
          {profile.display_name || profile.username}
        </div>
        <div style={{ fontSize: 12, color: '#8A7A65', marginTop: 2 }}>
          @{profile.username}
          {profile.location && ` · ${profile.location}`}
        </div>
      </div>

      {/* Botão seguir — só se não é o próprio */}
      {currentUserId !== profile.id && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {/* Botão remover seguidor — só aparece na tab followers E só para o próprio perfil */}
          {isOwnProfile && currentTab === 'followers' && (
            <button
              onClick={async (e) => {
                e.stopPropagation()
                const { error, data } = await supabase.from('follows')
                  .delete()
                  .eq('follower_id', profile.id)
                  .eq('following_id', currentUserId)
                  .select()
                if (!error) { setRemoved(true); onRemove?.(profile.id) }
              }}
              style={{
                padding: '7px 14px', borderRadius: 100, fontSize: 12, fontWeight: 500,
                background: 'transparent',
                border: '1px solid rgba(226,75,74,0.3)',
                color: '#C03B3A', cursor: 'pointer',
              }}
            >
              Remover
            </button>
          )}
          <button
            onClick={handleFollow}
            disabled={loading}
            style={{
              padding: '7px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600,
              background: following ? 'transparent' : '#FFB800',
              border: following ? '1px solid rgba(184,168,152,0.5)' : 'none',
              color: following ? '#8A7A65' : '#2A2520',
              cursor: 'pointer',
              opacity: loading ? 0.6 : 1, transition: 'all 0.2s',
            }}
          >
            {following ? 'A seguir' : 'Seguir'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function FollowsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const username = params.username as string
  const tab = (searchParams.get('tab') || 'followers') as 'followers' | 'following'

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [profileId, setProfileId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      // Buscar perfil pelo username
      const { data: profileData } = await supabase
        .from('profiles').select('id').eq('username', username).maybeSingle()
      if (!profileData) { router.push('/search'); return }
      setProfileId(profileData.id)
      setProfiles([])
      setLoading(true) // garantir loading enquanto muda tab

      // Buscar lista de follows
      let userIds: string[] = []
      if (tab === 'followers') {
        const { data } = await supabase
          .from('follows').select('follower_id').eq('following_id', profileData.id)
        userIds = data?.map((f: any) => f.follower_id) || []
      } else {
        const { data } = await supabase
          .from('follows').select('following_id').eq('follower_id', profileData.id)
        userIds = data?.map((f: any) => f.following_id) || []
      }

      if (userIds.length === 0) { setLoading(false); return }

      // Buscar perfis
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, location, bio')
        .in('id', userIds)
      setProfiles(profilesData || [])

      // Verificar quem o utilizador atual já segue
      if (user && userIds.length > 0) {
        const { data: myFollows } = await supabase
          .from('follows').select('following_id')
          .eq('follower_id', user.id)
          .in('following_id', userIds)
        setFollowingIds(new Set(myFollows?.map((f: any) => f.following_id) || []))
      }

      setLoading(false)
    }
    load()
  }, [username, tab, router])

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(245,240,232,0.95)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(184,168,152,0.3)',
        padding: '12px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button onClick={() => router.back()} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#8A7A65', display: 'flex', alignItems: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div style={{ fontFamily: "'DM Sans', system-ui", fontSize: 16, fontWeight: 600, color: '#2A2520' }}>
            @{username}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderRadius: 100, background: 'rgba(184,168,152,0.15)', padding: 3 }}>
          {(['followers', 'following'] as const).map(t => (
            <button
              key={t}
              onClick={() => { router.replace(`/user/${username}/follows?tab=${t}`); setSearchQuery('') }}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 100, fontSize: 13, fontWeight: 500,
                background: tab === t ? '#fff' : 'transparent',
                border: 'none', cursor: 'pointer',
                color: tab === t ? '#2A2520' : '#8A7A65',
                transition: 'all 0.2s',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t === 'followers' ? 'Seguidores' : 'A seguir'}
            </button>
          ))}
        </div>

        {/* Pesquisa */}
        <div style={{ position: 'relative', marginTop: 10 }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A7A65" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Pesquisar..."
            style={{
              width: '100%', padding: '9px 12px 9px 34px', borderRadius: 100,
              border: 'none', background: 'rgba(42,37,32,0.07)',
              fontSize: 13, outline: 'none', color: '#2A2520',
              boxSizing: 'border-box', fontFamily: "'DM Sans', system-ui",
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#B8A898', fontSize: 16, lineHeight: 1,
            }}>×</button>
          )}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#B8A898', fontSize: 13 }}>
          A carregar...
        </div>
      ) : profiles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            {tab === 'followers' ? (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C8BAA8" strokeWidth="1.5" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            ) : (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C8BAA8" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            )}
          </div>
          <div style={{ fontSize: 15, color: '#2A2520', fontFamily: "'DM Sans', system-ui", fontWeight: 600 }}>
            {tab === 'followers' ? 'Ainda sem seguidores' : 'Ainda não segue ninguém'}
          </div>
        </div>
      ) : (
        profiles
        .filter(p => {
          if (!searchQuery.trim()) return true
          const q = searchQuery.toLowerCase()
          return (p.display_name || '').toLowerCase().includes(q) || p.username.toLowerCase().includes(q)
        })
        .map(profile => (
          <UserRow
            key={profile.id}
            profile={profile}
            currentUserId={currentUserId}
            initialFollowing={followingIds.has(profile.id)}
            isOwnProfile={currentUserId === profileId}
            currentTab={tab}
            onRemove={(id) => {
              setProfiles(prev => prev.filter(p => p.id !== id))
            }}
          />
        ))
      )}
    </div>
  )
}