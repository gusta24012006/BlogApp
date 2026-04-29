'use client'

import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function NotificationsPage() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: 'system-ui, sans-serif', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(245,240,232,0.95)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(184,168,152,0.3)',
        padding: '52px 20px 14px',
      }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 600, color: '#2A2520' }}>
          Notificações
        </div>
      </div>

      {/* Empty state */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '80px 40px', textAlign: 'center',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(184,168,152,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B8A898" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, color: '#2A2520', fontFamily: 'Georgia, serif', marginBottom: 8 }}>
          Em breve
        </div>
        <div style={{ fontSize: 13, color: '#8A7A65', lineHeight: 1.6, maxWidth: 260 }}>
          As notificações estão a ser desenvolvidas. Em breve saberás quando alguém gosta do teu blog ou começa a seguir-te.
        </div>
      </div>

      <Navbar />
    </div>
  )
}