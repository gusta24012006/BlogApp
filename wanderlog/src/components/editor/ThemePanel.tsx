'use client'

interface Theme {
  bg: string
  text: string
  font: string
  layout: 'centered' | 'fullwidth' | 'magazine'
  headerType: 'cover' | 'solid' | 'none'
  headerColor: string
}

interface ThemePanelProps {
  theme: Theme
  onChange: (theme: Theme) => void
  onClose: () => void
}

const FONTS = [
  { label: 'Playfair Display', value: 'Playfair Display, Georgia, serif' },
  { label: 'Cormorant', value: 'Cormorant Garamond, Georgia, serif' },
  { label: 'Merriweather', value: 'Merriweather, Georgia, serif' },
  { label: 'DM Sans', value: 'DM Sans, system-ui, sans-serif' },
  { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { label: 'Lora', value: 'Lora, Georgia, serif' },
]

const PRESETS = [
  { label: 'Bege', bg: '#F5F0E8', text: '#2A2520' },
  { label: 'Branco', bg: '#FFFFFF', text: '#1a1a1a' },
  { label: 'Noite', bg: '#1a1a2e', text: '#F5F0E8' },
  { label: 'Floresta', bg: '#1a2e1a', text: '#F0F5E8' },
  { label: 'Oceano', bg: '#0d1b2a', text: '#E8F0F5' },
  { label: 'Areia', bg: '#E8DCC8', text: '#2A2010' },
]

function contrastRatio(hex1: string, hex2: string): number {
  const lum = (hex: string) => {
    const c = parseInt(hex.slice(1), 16)
    const r = (c >> 16) / 255, g = ((c >> 8) & 0xff) / 255, b = (c & 0xff) / 255
    return [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
      .reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i], 0)
  }
  const l1 = lum(hex1), l2 = lum(hex2)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

export default function ThemePanel({ theme, onChange, onClose }: ThemePanelProps) {
  const contrast = theme.bg.startsWith('#') && theme.text.startsWith('#')
    ? contrastRatio(theme.bg, theme.text)
    : 4.5

  const contrastOk = contrast >= 4.5

  return (
    <div style={{
      width: 240, background: '#fff', height: '100%',
      borderLeft: '1px solid rgba(184,168,152,0.3)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif', flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid rgba(184,168,152,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#2A2520' }}>Estilo</div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 16, color: '#8A7A65', padding: '0 4px',
        }}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Presets */}
        <div>
          <div style={{ fontSize: 11, color: '#8A7A65', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Tema base</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => onChange({ ...theme, bg: p.bg, text: p.text })}
                style={{
                  padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                  background: p.bg, color: p.text,
                  border: theme.bg === p.bg ? '2px solid #FFB800' : '1px solid rgba(184,168,152,0.3)',
                  fontSize: 12, fontWeight: 500, textAlign: 'left',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cor de fundo */}
        <div>
          <div style={{ fontSize: 11, color: '#8A7A65', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Fundo</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={theme.bg}
              onChange={e => onChange({ ...theme, bg: e.target.value })}
              style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(184,168,152,0.3)', cursor: 'pointer', padding: 2 }}
            />
            <input
              type="text"
              value={theme.bg}
              onChange={e => onChange({ ...theme, bg: e.target.value })}
              style={{
                flex: 1, padding: '7px 10px', borderRadius: 8,
                border: '1px solid rgba(184,168,152,0.3)', fontSize: 12,
                fontFamily: 'monospace', color: '#2A2520', outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Cor de texto */}
        <div>
          <div style={{ fontSize: 11, color: '#8A7A65', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Texto</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={theme.text}
              onChange={e => onChange({ ...theme, text: e.target.value })}
              style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(184,168,152,0.3)', cursor: 'pointer', padding: 2 }}
            />
            <input
              type="text"
              value={theme.text}
              onChange={e => onChange({ ...theme, text: e.target.value })}
              style={{
                flex: 1, padding: '7px 10px', borderRadius: 8,
                border: '1px solid rgba(184,168,152,0.3)', fontSize: 12,
                fontFamily: 'monospace', color: '#2A2520', outline: 'none',
              }}
            />
          </div>
          {/* Contraste */}
          <div style={{
            marginTop: 6, padding: '5px 8px', borderRadius: 6, fontSize: 11,
            background: contrastOk ? 'rgba(93,202,165,0.1)' : 'rgba(226,75,74,0.1)',
            color: contrastOk ? '#0F6E56' : '#C03B3A',
          }}>
            {contrastOk ? `✓ Contraste OK (${contrast.toFixed(1)}:1)` : `⚠ Contraste baixo (${contrast.toFixed(1)}:1)`}
          </div>
        </div>

        {/* Cor do header */}
        {theme.headerType === 'solid' && (
          <div>
            <div style={{ fontSize: 11, color: '#8A7A65', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Cor do header</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="color"
                value={theme.headerColor || '#2A2520'}
                onChange={e => onChange({ ...theme, headerColor: e.target.value })}
                style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(184,168,152,0.3)', cursor: 'pointer', padding: 2 }}
              />
              <input
                type="text"
                value={theme.headerColor || '#2A2520'}
                onChange={e => onChange({ ...theme, headerColor: e.target.value })}
                style={{
                  flex: 1, padding: '7px 10px', borderRadius: 8,
                  border: '1px solid rgba(184,168,152,0.3)', fontSize: 12,
                  fontFamily: 'monospace', color: '#2A2520', outline: 'none',
                }}
              />
            </div>
            <div style={{
              marginTop: 8, height: 32, borderRadius: 8,
              background: theme.headerColor || '#2A2520',
              border: '1px solid rgba(184,168,152,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 11, color: '#fff', fontFamily: 'monospace', opacity: 0.7 }}>
                Título do blog
              </span>
            </div>
          </div>
        )}

        {/* Fonte */}
        <div>
          <div style={{ fontSize: 11, color: '#8A7A65', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Fonte</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {FONTS.map(f => (
              <button
                key={f.value}
                onClick={() => onChange({ ...theme, font: f.value })}
                style={{
                  padding: '8px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                  background: theme.font === f.value ? 'rgba(255,184,0,0.1)' : 'transparent',
                  border: `1px solid ${theme.font === f.value ? '#FFB800' : 'rgba(184,168,152,0.3)'}`,
                  fontFamily: f.value, fontSize: 13, color: '#2A2520',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Layout */}
        <div>
          <div style={{ fontSize: 11, color: '#8A7A65', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Layout</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              { value: 'centered', label: 'Coluna central', desc: 'texto centrado, largura limitada' },
              { value: 'fullwidth', label: 'Full width', desc: 'ocupa toda a largura' },
              { value: 'magazine', label: 'Magazine', desc: '2 colunas em blocos grandes' },
            ].map(l => (
              <button
                key={l.value}
                onClick={() => onChange({ ...theme, layout: l.value as any })}
                style={{
                  padding: '8px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                  background: theme.layout === l.value ? 'rgba(255,184,0,0.1)' : 'transparent',
                  border: `1px solid ${theme.layout === l.value ? '#FFB800' : 'rgba(184,168,152,0.3)'}`,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 500, color: '#2A2520' }}>{l.label}</div>
                <div style={{ fontSize: 11, color: '#8A7A65', marginTop: 2 }}>{l.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Header */}
        <div>
          <div style={{ fontSize: 11, color: '#8A7A65', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Header</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              { value: 'cover', label: 'Foto de capa' },
              { value: 'solid', label: 'Cor sólida' },
              { value: 'none', label: 'Sem header' },
            ].map(h => (
              <button
                key={h.value}
                onClick={() => onChange({ ...theme, headerType: h.value as any })}
                style={{
                  padding: '8px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                  background: theme.headerType === h.value ? 'rgba(255,184,0,0.1)' : 'transparent',
                  border: `1px solid ${theme.headerType === h.value ? '#FFB800' : 'rgba(184,168,152,0.3)'}`,
                  fontSize: 13, fontWeight: 500, color: '#2A2520',
                }}
              >
                {h.label}
              </button>
            ))}
          </div>

        </div>

      </div>
    </div>
  )
}