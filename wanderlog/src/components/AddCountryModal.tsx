'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// Nomes em inglês têm de coincidir com o GeoJSON do Natural Earth
const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' },
  { code: 'DZ', name: 'Algeria' }, { code: 'AO', name: 'Angola' },
  { code: 'AR', name: 'Argentina' }, { code: 'AM', name: 'Armenia' },
  { code: 'AU', name: 'Australia' }, { code: 'AT', name: 'Austria' },
  { code: 'AZ', name: 'Azerbaijan' }, { code: 'BS', name: 'Bahamas' },
  { code: 'BH', name: 'Bahrain' }, { code: 'BD', name: 'Bangladesh' },
  { code: 'BY', name: 'Belarus' }, { code: 'BE', name: 'Belgium' },
  { code: 'BZ', name: 'Belize' }, { code: 'BJ', name: 'Benin' },
  { code: 'BT', name: 'Bhutan' }, { code: 'BO', name: 'Bolivia' },
  { code: 'BA', name: 'Bosnia and Herz.' }, { code: 'BW', name: 'Botswana' },
  { code: 'BR', name: 'Brazil' }, { code: 'BN', name: 'Brunei' },
  { code: 'BG', name: 'Bulgaria' }, { code: 'BF', name: 'Burkina Faso' },
  { code: 'BI', name: 'Burundi' }, { code: 'CV', name: 'Cape Verde' },
  { code: 'KH', name: 'Cambodia' }, { code: 'CM', name: 'Cameroon' },
  { code: 'CA', name: 'Canada' }, { code: 'CF', name: 'Central African Rep.' },
  { code: 'TD', name: 'Chad' }, { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' }, { code: 'CO', name: 'Colombia' },
  { code: 'KM', name: 'Comoros' }, { code: 'CG', name: 'Congo' },
  { code: 'CD', name: 'Dem. Rep. Congo' }, { code: 'CR', name: 'Costa Rica' },
  { code: 'HR', name: 'Croatia' }, { code: 'CU', name: 'Cuba' },
  { code: 'CY', name: 'Cyprus' }, { code: 'CZ', name: 'Czechia' },
  { code: 'DK', name: 'Denmark' }, { code: 'DJ', name: 'Djibouti' },
  { code: 'DO', name: 'Dominican Rep.' }, { code: 'EC', name: 'Ecuador' },
  { code: 'EG', name: 'Egypt' }, { code: 'SV', name: 'El Salvador' },
  { code: 'GQ', name: 'Eq. Guinea' }, { code: 'ER', name: 'Eritrea' },
  { code: 'EE', name: 'Estonia' }, { code: 'SZ', name: 'eSwatini' },
  { code: 'ET', name: 'Ethiopia' }, { code: 'FJ', name: 'Fiji' },
  { code: 'FI', name: 'Finland' }, { code: 'FR', name: 'France' },
  { code: 'GA', name: 'Gabon' }, { code: 'GM', name: 'Gambia' },
  { code: 'GE', name: 'Georgia' }, { code: 'DE', name: 'Germany' },
  { code: 'GH', name: 'Ghana' }, { code: 'GR', name: 'Greece' },
  { code: 'GT', name: 'Guatemala' }, { code: 'GN', name: 'Guinea' },
  { code: 'GW', name: 'Guinea-Bissau' }, { code: 'GY', name: 'Guyana' },
  { code: 'HT', name: 'Haiti' }, { code: 'HN', name: 'Honduras' },
  { code: 'HU', name: 'Hungary' }, { code: 'IS', name: 'Iceland' },
  { code: 'IN', name: 'India' }, { code: 'ID', name: 'Indonesia' },
  { code: 'IR', name: 'Iran' }, { code: 'IQ', name: 'Iraq' },
  { code: 'IE', name: 'Ireland' }, { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' }, { code: 'JM', name: 'Jamaica' },
  { code: 'JP', name: 'Japan' }, { code: 'JO', name: 'Jordan' },
  { code: 'KZ', name: 'Kazakhstan' }, { code: 'KE', name: 'Kenya' },
  { code: 'KW', name: 'Kuwait' }, { code: 'KG', name: 'Kyrgyzstan' },
  { code: 'LA', name: 'Laos' }, { code: 'LV', name: 'Latvia' },
  { code: 'LB', name: 'Lebanon' }, { code: 'LS', name: 'Lesotho' },
  { code: 'LR', name: 'Liberia' }, { code: 'LY', name: 'Libya' },
  { code: 'LT', name: 'Lithuania' }, { code: 'LU', name: 'Luxembourg' },
  { code: 'MG', name: 'Madagascar' }, { code: 'MW', name: 'Malawi' },
  { code: 'MY', name: 'Malaysia' }, { code: 'MV', name: 'Maldives' },
  { code: 'ML', name: 'Mali' }, { code: 'MT', name: 'Malta' },
  { code: 'MR', name: 'Mauritania' }, { code: 'MX', name: 'Mexico' },
  { code: 'MD', name: 'Moldova' }, { code: 'MN', name: 'Mongolia' },
  { code: 'ME', name: 'Montenegro' }, { code: 'MA', name: 'Morocco' },
  { code: 'MZ', name: 'Mozambique' }, { code: 'MM', name: 'Myanmar' },
  { code: 'NA', name: 'Namibia' }, { code: 'NP', name: 'Nepal' },
  { code: 'NL', name: 'Netherlands' }, { code: 'NZ', name: 'New Zealand' },
  { code: 'NI', name: 'Nicaragua' }, { code: 'NE', name: 'Niger' },
  { code: 'NG', name: 'Nigeria' }, { code: 'MK', name: 'North Macedonia' },
  { code: 'NO', name: 'Norway' }, { code: 'OM', name: 'Oman' },
  { code: 'PK', name: 'Pakistan' }, { code: 'PA', name: 'Panama' },
  { code: 'PG', name: 'Papua New Guinea' }, { code: 'PY', name: 'Paraguay' },
  { code: 'PE', name: 'Peru' }, { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' },
  { code: 'QA', name: 'Qatar' }, { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russia' }, { code: 'RW', name: 'Rwanda' },
  { code: 'SA', name: 'Saudi Arabia' }, { code: 'SN', name: 'Senegal' },
  { code: 'RS', name: 'Serbia' }, { code: 'SL', name: 'Sierra Leone' },
  { code: 'SG', name: 'Singapore' }, { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' }, { code: 'SO', name: 'Somalia' },
  { code: 'ZA', name: 'South Africa' }, { code: 'SS', name: 'S. Sudan' },
  { code: 'ES', name: 'Spain' }, { code: 'LK', name: 'Sri Lanka' },
  { code: 'SD', name: 'Sudan' }, { code: 'SR', name: 'Suriname' },
  { code: 'SE', name: 'Sweden' }, { code: 'CH', name: 'Switzerland' },
  { code: 'SY', name: 'Syria' }, { code: 'TW', name: 'Taiwan' },
  { code: 'TJ', name: 'Tajikistan' }, { code: 'TZ', name: 'Tanzania' },
  { code: 'TH', name: 'Thailand' }, { code: 'TL', name: 'Timor-Leste' },
  { code: 'TG', name: 'Togo' }, { code: 'TT', name: 'Trinidad and Tobago' },
  { code: 'TN', name: 'Tunisia' }, { code: 'TR', name: 'Turkey' },
  { code: 'TM', name: 'Turkmenistan' }, { code: 'UG', name: 'Uganda' },
  { code: 'UA', name: 'Ukraine' }, { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'US', name: 'United States' },
  { code: 'UY', name: 'Uruguay' }, { code: 'UZ', name: 'Uzbekistan' },
  { code: 'VE', name: 'Venezuela' }, { code: 'VN', name: 'Vietnam' },
  { code: 'YE', name: 'Yemen' }, { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' },
]

interface AddCountryModalProps {
  userId: string
  visitedCountries: string[]
  onClose: () => void
  onAdd: (country: { code: string; name: string }) => void
  onRemove: (countryName: string) => void
}

export default function AddCountryModal({ userId, visitedCountries, onClose, onAdd, onRemove }: AddCountryModalProps) {
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ code: string; name: string } | null>(null)
  const router = useRouter()

  const visitedSet = new Set(visitedCountries)

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleToggle = async (country: { code: string; name: string }) => {
    setLoading(country.code)
    if (visitedSet.has(country.name)) {
      const { error } = await supabase
        .from('countries_visited')
        .delete()
        .eq('user_id', userId)
        .eq('country_code', country.code)
      if (!error) {
        onRemove(country.name)
        setToast(null)
      }
    } else {
      const { error } = await supabase
        .from('countries_visited')
        .insert({ user_id: userId, country_code: country.code, country_name: country.name })
      if (!error) {
        onAdd(country)
        setToast(country)
        // Auto-dismiss após 5 segundos
        setTimeout(() => setToast(t => t?.code === country.code ? null : t), 5000)
      }
    }
    setLoading(null)
  }

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'flex-end',
      }} onClick={onClose}>
        <div style={{
          width: '100%', maxHeight: '80vh',
          background: '#F5F0E8',
          borderRadius: '20px 20px 0 0',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }} onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div style={{
            padding: '16px 20px 12px',
            borderBottom: '1px solid rgba(184,168,152,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#2A2520', fontWeight: 600 }}>
                Países visitados
              </div>
              <div style={{ fontSize: 11, color: '#8A7A65', marginTop: 2 }}>
                {visitedCountries.length} países selecionados
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '1px solid rgba(184,168,152,0.5)',
              background: 'transparent', cursor: 'pointer',
              fontSize: 16, color: '#8A7A65',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
          </div>

          {/* Search */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(184,168,152,0.2)' }}>
            <input
              type="text"
              placeholder="Pesquisar país..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              style={{
                width: '100%', padding: '9px 14px', borderRadius: 10,
                border: '1px solid rgba(184,168,152,0.5)',
                background: '#fff', fontSize: 14, outline: 'none',
                color: '#2A2520', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map(country => {
              const isVisited = visitedSet.has(country.name)
              const isLoading = loading === country.code
              return (
                <div
                  key={country.code}
                  onClick={() => handleToggle(country)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 20px',
                    borderBottom: '1px solid rgba(184,168,152,0.15)',
                    cursor: 'pointer',
                    background: isVisited ? 'rgba(255,184,0,0.06)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>
                      {country.code.toUpperCase().replace(/./g, (c: string) =>
                        String.fromCodePoint(c.charCodeAt(0) + 127397)
                      )}
                    </span>
                    <span style={{ fontSize: 15, color: '#2A2520' }}>{country.name}</span>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    border: `2px solid ${isVisited ? '#FFB800' : 'rgba(184,168,152,0.5)'}`,
                    background: isVisited ? '#FFB800' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.15s',
                    fontSize: 12, color: '#fff',
                  }}>
                    {isLoading ? '...' : isVisited ? '✓' : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 200, display: 'flex', alignItems: 'center', gap: 12,
          background: '#2A2520', borderRadius: 16, padding: '12px 16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          animation: 'slideUp 0.3s ease',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 18 }}>
            {toast.code.toUpperCase().replace(/./g, (c: string) =>
              String.fromCodePoint(c.charCodeAt(0) + 127397)
            )}
          </span>
          <span style={{ fontSize: 13, color: '#F5F0E8', fontWeight: 500 }}>
            {toast.name} adicionado!
          </span>
          <button
            onClick={() => {
              const t = toast
              setToast(null)
              onClose()
              router.push(`/blog/new?country=${t.code}&name=${encodeURIComponent(t.name)}`)
            }}
            style={{
              padding: '6px 14px', borderRadius: 20,
              background: '#FFB800', border: 'none',
              fontSize: 12, fontWeight: 600, color: '#2A2520',
              cursor: 'pointer', marginLeft: 4,
            }}
          >
            Criar blog
          </button>
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'none', border: 'none', color: 'rgba(245,240,232,0.5)',
              cursor: 'pointer', fontSize: 16, padding: '0 4px',
            }}
          >×</button>
        </div>
      )}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  )
}