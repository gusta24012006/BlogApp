'use client'

import { useState, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { supabase } from '@/lib/supabase'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export type BlockType = 'text' | 'image' | 'video' | 'music' | 'divider' | 'imagetext'

export interface Block {
  id: string
  type: BlockType
  content?: string
  url?: string
  caption?: string
  spotifyUrl?: string
  trackName?: string
  artistName?: string
  coverUrl?: string
  imageWidth?: number
  imagePosition?: 'left' | 'center' | 'right'
}

interface BlockEditorProps {
  blocks: Block[]
  onChange: (blocks: Block[]) => void
  theme: { bg: string; text: string; font: string }
}

function genId() {
  return Math.random().toString(36).slice(2, 9)
}

function TextBlock({ block, onUpdate }: { block: Block; onUpdate: (b: Block) => void }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: block.content || '<p>Escreve aqui...</p>',
    immediatelyRender: false,
    onUpdate: ({ editor }) => onUpdate({ ...block, content: editor.getHTML() }),
  })

  return (
    <div style={{ minHeight: 60 }}>
      {editor && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
          {[
            { label: 'B', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
            { label: 'I', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
            { label: 'H1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }) },
            { label: 'H2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
            { label: '• Lista', action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action} style={{
              padding: '3px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer',
              background: btn.active ? 'rgba(255,184,0,0.2)' : 'rgba(184,168,152,0.15)',
              border: `1px solid ${btn.active ? '#FFB800' : 'rgba(184,168,152,0.3)'}`,
              color: '#2A2520', fontWeight: btn.label === 'B' ? 700 : btn.label === 'I' ? undefined : 500,
              fontStyle: btn.label === 'I' ? 'italic' : 'normal',
            }}>{btn.label}</button>
          ))}
        </div>
      )}
      <EditorContent editor={editor} style={{ outline: 'none' }} />
    </div>
  )
}

function ImageBlock({ block, onUpdate }: { block: Block; onUpdate: (b: Block) => void }) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const imageWidth = block.imageWidth || 100
  const imagePosition = block.imagePosition || 'left'

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { alert('Só imagens são permitidas'); return }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('post-media').upload(path, file)
    if (error) { alert('Erro ao fazer upload: ' + error.message); setUploading(false); return }
    const { data } = supabase.storage.from('post-media').getPublicUrl(path)
    onUpdate({ ...block, url: data.publicUrl })
    setUploading(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) await uploadFile(file)
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await uploadFile(file)
  }

  return (
    <div>
      {block.url ? (
        <div>
          {/* Controlos de tamanho */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#8A7A65' }}>Largura: {imageWidth}%</span>
            <input
              type="range" min={20} max={100} value={imageWidth}
              onChange={e => onUpdate({ ...block, imageWidth: Number(e.target.value) })}
              style={{ width: 100 }}
            />
            <button onClick={() => onUpdate({ ...block, imagePosition: 'left' })} style={{
              padding: '2px 8px', borderRadius: 20, fontSize: 10, cursor: 'pointer',
              background: imagePosition === 'left' ? 'rgba(255,184,0,0.15)' : 'transparent',
              border: `1px solid ${imagePosition === 'left' ? '#FFB800' : 'rgba(184,168,152,0.3)'}`,
              color: '#2A2520',
            }}>← Esq</button>
            <button onClick={() => onUpdate({ ...block, imagePosition: 'center' })} style={{
              padding: '2px 8px', borderRadius: 20, fontSize: 10, cursor: 'pointer',
              background: imagePosition === 'center' ? 'rgba(255,184,0,0.15)' : 'transparent',
              border: `1px solid ${imagePosition === 'center' ? '#FFB800' : 'rgba(184,168,152,0.3)'}`,
              color: '#2A2520',
            }}>Centro</button>
            <button onClick={() => onUpdate({ ...block, imagePosition: 'right' })} style={{
              padding: '2px 8px', borderRadius: 20, fontSize: 10, cursor: 'pointer',
              background: imagePosition === 'right' ? 'rgba(255,184,0,0.15)' : 'transparent',
              border: `1px solid ${imagePosition === 'right' ? '#FFB800' : 'rgba(184,168,152,0.3)'}`,
              color: '#2A2520',
            }}>Dir →</button>
          </div>
          <div style={{ textAlign: imagePosition === 'center' ? 'center' : imagePosition === 'right' ? 'right' : 'left' }}>
            <img src={block.url} alt={block.caption || ''} style={{ width: `${imageWidth}%`, borderRadius: 8, display: 'inline-block' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              type="text" placeholder="Legenda (opcional)" value={block.caption || ''}
              onChange={e => onUpdate({ ...block, caption: e.target.value })}
              style={{
                flex: 1, padding: '6px 10px', borderRadius: 6,
                border: '1px solid rgba(184,168,152,0.3)', fontSize: 12, color: '#8A7A65',
                background: 'transparent', outline: 'none',
              }}
            />
            <button onClick={() => onUpdate({ ...block, url: '' })} style={{
              padding: '6px 10px', borderRadius: 6, fontSize: 11,
              border: '1px solid rgba(184,168,152,0.3)', background: 'transparent',
              color: '#8A7A65', cursor: 'pointer',
            }}>Trocar</button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          style={{
            width: '100%', padding: '32px 20px', borderRadius: 10, cursor: 'pointer',
            border: `2px dashed ${dragOver ? '#FFB800' : 'rgba(184,168,152,0.4)'}`,
            background: dragOver ? 'rgba(255,184,0,0.05)' : 'rgba(184,168,152,0.05)',
            textAlign: 'center', transition: 'all 0.2s',
            boxSizing: 'border-box',
          }}
        >
          {uploading ? (
            <div style={{ color: '#8A7A65', fontSize: 13 }}>A fazer upload...</div>
          ) : (
            <>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🖼</div>
              <div style={{ fontSize: 13, color: '#8A7A65', marginBottom: 4 }}>
                Arrasta uma imagem ou clica para escolher
              </div>
              <div style={{ fontSize: 11, color: '#B8A898' }}>JPG, PNG, WebP, GIF · máx 10MB</div>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </div>
      )}
    </div>
  )
}

function VideoBlock({ block, onUpdate }: { block: Block; onUpdate: (b: Block) => void }) {
  const getEmbedUrl = (url: string) => {
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`
    const vm = url.match(/vimeo\.com\/(\d+)/)
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`
    return null
  }

  const embedUrl = block.url ? getEmbedUrl(block.url) : null

  return (
    <div>
      <input
        type="text" placeholder="URL do YouTube ou Vimeo..."
        value={block.url || ''}
        onChange={e => onUpdate({ ...block, url: e.target.value })}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 8,
          border: '1px solid rgba(184,168,152,0.3)', fontSize: 13,
          color: '#2A2520', outline: 'none', boxSizing: 'border-box',
          marginBottom: embedUrl ? 10 : 0,
        }}
      />
      {embedUrl && (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 8, overflow: 'hidden' }}>
          <iframe
            src={embedUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            frameBorder="0" allowFullScreen
          />
        </div>
      )}
    </div>
  )
}

function MusicBlock({ block, onUpdate }: { block: Block; onUpdate: (b: Block) => void }) {
  const getSpotifyEmbed = (url: string) => {
    const match = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/)
    if (match) return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator`
    return null
  }

  const embedUrl = block.spotifyUrl ? getSpotifyEmbed(block.spotifyUrl) : null

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 20 }}>🎵</div>
        <div style={{ flex: 1 }}>
          <input
            type="text" placeholder="Link do Spotify (track, album, playlist)..."
            value={block.spotifyUrl || ''}
            onChange={e => onUpdate({ ...block, spotifyUrl: e.target.value })}
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 8,
              border: '1px solid rgba(184,168,152,0.3)', fontSize: 13,
              color: '#2A2520', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>
      {embedUrl && (
        <iframe
          src={embedUrl}
          width="100%" height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          style={{ borderRadius: 12 }}
        />
      )}
      {!embedUrl && block.spotifyUrl && (
        <div style={{ fontSize: 11, color: '#E24B4A', padding: '6px 0' }}>Link inválido — usa um link do Spotify</div>
      )}
    </div>
  )
}

function ImageTextBlock({ block, onUpdate }: { block: Block; onUpdate: (b: Block) => void }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const imageWidth = block.imageWidth || 40
  const imagePosition = block.imagePosition || 'left'

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('post-media').upload(path, file)
    if (error) { setUploading(false); return }
    const { data } = supabase.storage.from('post-media').getPublicUrl(path)
    onUpdate({ ...block, url: data.publicUrl })
    setUploading(false)
  }

  const editor = useEditor({
    extensions: [StarterKit],
    content: block.content || '<p>Escreve aqui...</p>',
    immediatelyRender: false,
    onUpdate: ({ editor }) => onUpdate({ ...block, content: editor.getHTML() }),
  })

  const imgSide = imagePosition === 'left'
    ? { order: 0 }
    : { order: 1 }
  const txtSide = imagePosition === 'left'
    ? { order: 1 }
    : { order: 0 }

  return (
    <div>
      {/* Controlos */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#8A7A65' }}>Imagem:</span>
        <button
          onClick={() => onUpdate({ ...block, imagePosition: 'left' })}
          style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
            background: imagePosition === 'left' ? 'rgba(255,184,0,0.15)' : 'transparent',
            border: `1px solid ${imagePosition === 'left' ? '#FFB800' : 'rgba(184,168,152,0.4)'}`,
            color: '#2A2520',
          }}
        >← Esquerda</button>
        <button
          onClick={() => onUpdate({ ...block, imagePosition: 'right' })}
          style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
            background: imagePosition === 'right' ? 'rgba(255,184,0,0.15)' : 'transparent',
            border: `1px solid ${imagePosition === 'right' ? '#FFB800' : 'rgba(184,168,152,0.4)'}`,
            color: '#2A2520',
          }}
        >Direita →</button>
        <span style={{ fontSize: 11, color: '#8A7A65', marginLeft: 8 }}>Largura: {imageWidth}%</span>
        <input
          type="range" min={20} max={70} value={imageWidth}
          onChange={e => onUpdate({ ...block, imageWidth: Number(e.target.value) })}
          style={{ width: 80 }}
        />
      </div>

      {/* Layout */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Imagem */}
        <div style={{ width: `${imageWidth}%`, flexShrink: 0, ...imgSide }}>
          {block.url ? (
            <div style={{ position: 'relative' }}>
              <img src={block.url} style={{ width: '100%', borderRadius: 8, display: 'block' }} alt="" />
              <button
                onClick={() => onUpdate({ ...block, url: '' })}
                style={{
                  position: 'absolute', top: 6, right: 6,
                  background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                  width: 24, height: 24, cursor: 'pointer', color: '#fff', fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >×</button>
            </div>
          ) : (
            <div
              onClick={() => inputRef.current?.click()}
              style={{
                height: 120, borderRadius: 8, border: '2px dashed rgba(184,168,152,0.4)',
                background: 'rgba(184,168,152,0.05)', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 6,
              }}
            >
              {uploading
                ? <span style={{ fontSize: 12, color: '#8A7A65' }}>A carregar...</span>
                : <>
                    <span style={{ fontSize: 24 }}>🖼</span>
                    <span style={{ fontSize: 11, color: '#8A7A65' }}>Clica ou arrasta</span>
                  </>
              }
              <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={async e => { const f = e.target.files?.[0]; if (f) await uploadFile(f) }} />
            </div>
          )}
        </div>

        {/* Texto */}
        <div style={{ flex: 1, minHeight: 120, ...txtSide }}>
          <EditorContent editor={editor} style={{ outline: 'none', minHeight: 120 }} />
        </div>
      </div>
    </div>
  )
}

function DividerBlock() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(184,168,152,0.4)' }} />
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(184,168,152,0.6)' }} />
      <div style={{ flex: 1, height: 1, background: 'rgba(184,168,152,0.4)' }} />
    </div>
  )
}

function SortableBlock({
  block, onUpdate, onDelete,
}: {
  block: Block
  onUpdate: (b: Block) => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{
        border: '1px solid rgba(184,168,152,0.25)',
        borderRadius: 10, background: '#fff',
        marginBottom: 8, overflow: 'hidden',
      }}>
        {/* Block toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 10px', background: 'rgba(245,240,232,0.8)',
          borderBottom: '1px solid rgba(184,168,152,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              {...attributes} {...listeners}
              style={{ cursor: 'grab', color: '#B8A898', fontSize: 14, padding: '0 4px', userSelect: 'none' }}
            >⠿</div>
            <span style={{ fontSize: 11, color: '#8A7A65', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {block.type === 'text' ? 'Texto' : block.type === 'image' ? 'Imagem' : block.type === 'video' ? 'Vídeo' : block.type === 'music' ? 'Música' : 'Separador'}
            </span>
          </div>
          <button onClick={onDelete} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#B8A898', fontSize: 16, padding: '0 4px', lineHeight: 1,
          }}>×</button>
        </div>
        {/* Block content */}
        <div style={{ padding: '12px 14px' }}>
          {block.type === 'text' && <TextBlock block={block} onUpdate={onUpdate} />}
          {block.type === 'image' && <ImageBlock block={block} onUpdate={onUpdate} />}
          {block.type === 'video' && <VideoBlock block={block} onUpdate={onUpdate} />}
          {block.type === 'music' && <MusicBlock block={block} onUpdate={onUpdate} />}
          {block.type === 'divider' && <DividerBlock />}
          {block.type === 'imagetext' && <ImageTextBlock block={block} onUpdate={onUpdate} />}
        </div>
      </div>
    </div>
  )
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: string }[] = [
  { type: 'text', label: 'Texto', icon: '¶' },
  { type: 'image', label: 'Imagem', icon: '🖼' },
  { type: 'imagetext', label: 'Img + Texto', icon: '⊞' },
  { type: 'video', label: 'Vídeo', icon: '▶' },
  { type: 'music', label: 'Música', icon: '♪' },
  { type: 'divider', label: 'Separador', icon: '—' },
]

export default function BlockEditor({ blocks, onChange, theme }: BlockEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id)
      const newIndex = blocks.findIndex(b => b.id === over.id)
      onChange(arrayMove(blocks, oldIndex, newIndex))
    }
  }

  const addBlock = (type: BlockType) => {
    onChange([...blocks, { id: genId(), type }])
  }

  const updateBlock = useCallback((id: string, updated: Block) => {
    onChange(blocks.map(b => b.id === id ? updated : b))
  }, [blocks, onChange])

  const deleteBlock = useCallback((id: string) => {
    onChange(blocks.filter(b => b.id !== id))
  }, [blocks, onChange])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Add block toolbar */}
      <div style={{
        display: 'flex', gap: 6, padding: '10px 16px',
        borderBottom: '1px solid rgba(184,168,152,0.2)',
        background: '#F5F0E8', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 11, color: '#8A7A65', alignSelf: 'center', marginRight: 4 }}>+ Adicionar:</span>
        {BLOCK_TYPES.map(bt => (
          <button key={bt.type} onClick={() => addBlock(bt.type)} style={{
            padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
            background: '#fff', border: '1px solid rgba(184,168,152,0.4)',
            color: '#2A2520', display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span>{bt.icon}</span> {bt.label}
          </button>
        ))}
      </div>

      {/* Blocks */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {blocks.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: '#B8A898', fontSize: 14,
          }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>✏️</div>
            Adiciona um bloco para começar
          </div>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.map(block => (
              <SortableBlock
                key={block.id}
                block={block}
                onUpdate={(updated) => updateBlock(block.id, updated)}
                onDelete={() => deleteBlock(block.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}