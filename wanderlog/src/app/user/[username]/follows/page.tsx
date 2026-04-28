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

function UserRow({ profile, currentUserId, initialFollowing }: {
  profile: Profile
  currentUserId: string
  initialFollowing: boolean
}) {
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

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
        <div style={{ fontSize: 15, fontWeight: 600, color: '#2A2520', fontFamily: 'Georgia, serif' }}>
          {profile.display_name || profile.username}
        </div>
        <div style={{ fontSize: 12, color: '#8A7A65', marginTop: 2 }}>
          @{profile.username}
          {profile.location && ` · ${profile.location}`}
        </div>
      </div>

      {/* Botão seguir — só se não é o próprio */}
      {currentUserId !== profile.id && (
        <button
          onClick={handleFollow}
          disabled={loading}
          style={{
            padding: '7px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600,
            background: following ? 'transparent' : '#FFB800',
            border: following ? '1px solid rgba(184,168,152,0.5)' : 'none',
            color: following ? '#8A7A65' : '#2A2520',
            cursor: 'pointer', flexShrink: 0,
            opacity: loading ? 0.6 : 1, transition: 'all 0.2s',
          }}
        >
          {following ? 'A seguir' : 'Seguir'}
        </button>
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
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(245,240,232,0.95)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(184,168,152,0.3)',
        padding: '12px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button onClick={() => router.push('/dashboard')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 18, color: '#8A7A65',
          }}>←</button>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 600, color: '#2A2520' }}>
            @{username}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderRadius: 100, background: 'rgba(184,168,152,0.15)', padding: 3 }}>
          {(['followers', 'following'] as const).map(t => (
            <button
              key={t}
              onClick={() => router.replace(`/user/${username}/follows?tab=${t}`)}
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
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#B8A898', fontSize: 13 }}>
          A carregar...
        </div>
      ) : profiles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>
            {tab === 'followers' ? '👥' : '✈️'}
          </div>
          <div style={{ fontSize: 15, color: '#2A2520', fontFamily: 'Georgia, serif' }}>
            {tab === 'followers' ? 'Ainda sem seguidores' : 'Ainda não segue ninguém'}
          </div>
        </div>
      ) : (
        profiles.map(profile => (
          <UserRow
            key={profile.id}
            profile={profile}
            currentUserId={currentUserId}
            initialFollowing={followingIds.has(profile.id)}
          />
        ))
      )}
    </div>
  )
}