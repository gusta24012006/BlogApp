'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  postId: string
  userId?: string
}

interface Comment {
  id: string
  content: string
  created_at: string
  profiles: { username: string; display_name: string; avatar_url?: string }
}

export default function PostActions({ postId, userId }: Props) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [comments, setComments] = useState<Comment[]>([])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      // Likes
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)
      setLikeCount(count || 0)

      // Verificar se o user já deu like
      if (userId) {
        const { data } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .maybeSingle()
        setLiked(!!data)
      }

      // Comentários
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*, profiles(username, display_name, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
      setComments(commentsData || [])
    }
    load()
  }, [postId, userId])

  const handleLike = async () => {
    if (!userId) return
    if (liked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId)
      setLiked(false)
      setLikeCount(c => c - 1)
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: userId })
      setLiked(true)
      setLikeCount(c => c + 1)
    }
  }

  const handleComment = async () => {
    if (!userId || !newComment.trim()) return
    setSubmitting(true)
    const { data } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: userId, content: newComment.trim() })
      .select('*, profiles(username, display_name, avatar_url)')
      .single()
    if (data) {
      setComments(prev => [...prev, data])
      setNewComment('')
    }
    setSubmitting(false)
  }

  const iconStyle = { width: 20, height: 20 }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* Barra de ações */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 24,
        padding: '14px 24px',
        borderTop: '1px solid rgba(184,168,152,0.2)',
        borderBottom: showComments ? 'none' : '1px solid rgba(184,168,152,0.2)',
      }}>
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={!userId}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'none', border: 'none', cursor: userId ? 'pointer' : 'default',
            padding: 0, color: liked ? '#c0392b' : '#8A7A65',
            fontSize: 14, fontWeight: 500, fontFamily: 'system-ui',
            transition: 'all 0.15s',
          }}
        >
          <svg {...iconStyle} viewBox="0 0 24 24" fill={liked ? '#c0392b' : 'none'}
            stroke={liked ? '#c0392b' : '#8A7A65'} strokeWidth="1.7"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        {/* Comentários */}
        <button
          onClick={() => { setShowComments(!showComments); setTimeout(() => inputRef.current?.focus(), 100) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 0, color: showComments ? '#2A2520' : '#8A7A65',
            fontSize: 14, fontWeight: 500, fontFamily: 'system-ui',
            transition: 'all 0.15s',
          }}
        >
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none"
            stroke={showComments ? '#2A2520' : '#8A7A65'} strokeWidth="1.7"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {comments.length > 0 && <span>{comments.length}</span>}
        </button>

        {/* Partilhar */}
        <button
          onClick={() => navigator.share?.({ url: window.location.href })}
          style={{
            display: 'flex', alignItems: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 0, color: '#8A7A65', marginLeft: 'auto',
          }}
        >
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none"
            stroke="#8A7A65" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      </div>

      {/* Secção de comentários */}
      {showComments && (
        <div style={{ borderTop: '1px solid rgba(184,168,152,0.15)' }}>
          {/* Lista de comentários */}
          {comments.length === 0 ? (
            <div style={{
              padding: '20px 24px', fontSize: 13, color: '#B8A898', textAlign: 'center',
            }}>
              Ainda sem comentários — sê o primeiro
            </div>
          ) : (
            <div style={{ padding: '12px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: c.profiles?.avatar_url ? 'transparent' : 'linear-gradient(135deg, #FFE066, #FFB800)',
                    overflow: 'hidden', border: '1.5px solid rgba(255,184,0,0.3)',
                  }}>
                    {c.profiles?.avatar_url
                      ? <img src={c.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                      : <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at 35% 30%, #E8C9A8, #8E6B4E)' }} />
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#2A2520' }}>
                        {c.profiles?.display_name || c.profiles?.username}
                      </span>
                      <span style={{ fontSize: 11, color: '#B8A898' }}>
                        {new Date(c.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, color: '#4A3F30', lineHeight: 1.5 }}>
                      {c.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Input novo comentário */}
          {userId ? (
            <div style={{
              padding: '12px 24px 16px',
              borderTop: comments.length > 0 ? '1px solid rgba(184,168,152,0.15)' : 'none',
              display: 'flex', gap: 10, alignItems: 'center',
            }}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Adiciona um comentário..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleComment()}
                style={{
                  flex: 1, padding: '9px 14px', borderRadius: 100,
                  border: '1px solid rgba(184,168,152,0.4)',
                  background: '#F5F0E8', fontSize: 13, outline: 'none',
                  color: '#2A2520', fontFamily: 'system-ui',
                }}
              />
              <button
                onClick={handleComment}
                disabled={!newComment.trim() || submitting}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: newComment.trim() ? '#FFB800' : 'rgba(184,168,152,0.2)',
                  border: 'none', cursor: newComment.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={newComment.trim() ? '#2A2520' : '#B8A898'} strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          ) : (
            <div style={{ padding: '12px 24px', fontSize: 13, color: '#B8A898' }}>
              Faz login para comentar
            </div>
          )}
        </div>
      )}
    </div>
  )
}