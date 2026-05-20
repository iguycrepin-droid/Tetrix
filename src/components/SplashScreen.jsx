import { useEffect, useState } from 'react'

export function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0)
  // phase 0: fade in logo, 1: tagline appears, 2: fade out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600)
    const t2 = setTimeout(() => setPhase(2), 1800)
    const t3 = setTimeout(() => onDone(), 2400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#07071a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: phase === 2 ? 0 : 1,
      transition: 'opacity 0.5s ease',
    }}>
      {/* Animated grid background */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.3,
        backgroundImage: `
          linear-gradient(rgba(120,80,255,0.15) 1px, transparent 1px),
          linear-gradient(90deg, rgba(120,80,255,0.15) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
      }} />

      {/* Glow pulse */}
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(120,80,255,0.18) 0%, transparent 70%)',
        animation: 'pulse 2s ease-in-out infinite',
      }} />

      {/* Logo */}
      <div style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 52, fontWeight: 900,
        color: '#c084fc',
        letterSpacing: 10,
        opacity: phase >= 0 ? 1 : 0,
        transform: phase >= 0 ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        textShadow: '0 0 40px rgba(192,132,252,0.7), 0 0 80px rgba(192,132,252,0.3)',
        position: 'relative', zIndex: 1,
      }}>TETRIX</div>

      {/* Tagline */}
      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 11, letterSpacing: 5,
        color: 'rgba(180,140,255,0.5)',
        marginTop: 14,
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'translateY(0)' : 'translateY(8px)',
        transition: 'all 0.5s ease 0.1s',
        position: 'relative', zIndex: 1,
      }}>BLOCK DROP ARENA</div>

      {/* Loading bar */}
      <div style={{
        position: 'absolute', bottom: 60,
        width: 120, height: 2,
        background: 'rgba(120,80,255,0.2)',
        borderRadius: 1, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #7c3aed, #c084fc)',
          borderRadius: 1,
          width: phase >= 1 ? '100%' : '0%',
          transition: 'width 1.2s ease',
        }} />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
