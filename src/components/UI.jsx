import { useState } from 'react'

const AVATARS = [
  { bg: '#4c1d95', accent: '#c084fc', symbol: '🐺' }, // Purple Wolf
  { bg: '#1e3a8a', accent: '#60a5fa', symbol: '🦅' }, // Blue Eagle
  { bg: '#064e3b', accent: '#34d399', symbol: '🐉' }, // Green Dragon
  { bg: '#78350f', accent: '#fbbf24', symbol: '🦁' }, // Gold Lion
  { bg: '#831843', accent: '#f472b6', symbol: '🦊' }, // Pink Fox
  { bg: '#164e63', accent: '#22d3ee', symbol: '🐬' }, // Cyan Dolphin
  { bg: '#7f1d1d', accent: '#f87171', symbol: '🔥' }, // Red Phoenix
  { bg: '#1e3a5f', accent: '#818cf8', symbol: '⚡' }, // Indigo Thunder
  { bg: '#1a2e05', accent: '#84cc16', symbol: '🐍' }, // Lime Serpent
]

export function Avatar({ avatarId = 0, size = 40 }) {
  const av = AVATARS[avatarId % AVATARS.length]
  const fontSize = size * 0.44
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle at 35% 35%, ${av.accent}88, ${av.bg})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: fontSize, flexShrink: 0,
      border: `1.5px solid ${av.accent}55`,
      boxShadow: `0 0 14px ${av.bg}99`,
    }}>{av.symbol}</div>
  )
}

export function AvatarPicker({ selected, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
      {AVATARS.map((av, i) => (
        <div key={i} onClick={() => onSelect(i)} title={av.symbol} style={{
          width: 48, height: 48, borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, ${av.accent}88, ${av.bg})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, cursor: 'pointer',
          border: selected === i ? `2px solid ${av.accent}` : '2px solid transparent',
          boxShadow: selected === i ? `0 0 18px ${av.accent}88` : 'none',
          transition: 'all 0.2s',
        }}>{av.symbol}</div>
      ))}
    </div>
  )
}

export function Input({ label, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(180,140,255,0.7)', fontFamily: "'Orbitron',sans-serif", textTransform: 'uppercase' }}>{label}</label>}
      <input {...props} style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(120,80,255,0.3)',
        borderRadius: 8, padding: '10px 14px',
        color: '#e0e0ff', fontFamily: "'Share Tech Mono',monospace",
        fontSize: 14, outline: 'none', width: '100%',
        transition: 'border-color 0.2s',
        ...props.style
      }}
      onFocus={e => e.target.style.borderColor = 'rgba(192,132,252,0.7)'}
      onBlur={e => e.target.style.borderColor = 'rgba(120,80,255,0.3)'}
      />
    </div>
  )
}

export function Btn({ children, variant = 'primary', loading, style: s, ...props }) {
  const styles = {
    primary: { background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none', color: '#fff' },
    ghost: { background: 'rgba(120,80,255,0.1)', border: '1px solid rgba(120,80,255,0.4)', color: '#c084fc' },
    danger: { background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)', color: '#f87171' },
    google: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#e0e0ff' },
  }
  return (
    <button {...props} style={{
      fontFamily: "'Orbitron',sans-serif", fontSize: 11, letterSpacing: 1.5,
      borderRadius: 8, padding: '12px 20px', cursor: 'pointer',
      textTransform: 'uppercase', width: '100%', transition: 'all 0.2s',
      opacity: loading ? 0.6 : 1,
      ...styles[variant], ...s
    }}>
      {loading ? '...' : children}
    </button>
  )
}

export function Card({ children, style: s }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(120,80,255,0.25)',
      borderRadius: 12, padding: '20px',
      ...s
    }}>{children}</div>
  )
}

export function SectionTitle({ children }) {
  return (
    <div style={{
      fontFamily: "'Orbitron',sans-serif", fontSize: 10,
      letterSpacing: 3, color: 'rgba(180,140,255,0.6)',
      textTransform: 'uppercase', marginBottom: 12,
      borderBottom: '1px solid rgba(120,80,255,0.15)',
      paddingBottom: 8,
    }}>{children}</div>
  )
}

export const RANK_INFO = [
  { name: 'Bronze',  min: 0,      color: '#cd7f32', glow: '#cd7f3244' },
  { name: 'Silver',  min: 1000,   color: '#c0c0c0', glow: '#c0c0c044' },
  { name: 'Gold',    min: 3000,   color: '#fbbf24', glow: '#fbbf2444' },
  { name: 'Plat',    min: 7000,   color: '#22d3ee', glow: '#22d3ee44' },
  { name: 'Diamond', min: 15000,  color: '#c084fc', glow: '#c084fc66' },
]

export function getRank(score) {
  for (let i = RANK_INFO.length - 1; i >= 0; i--)
    if (score >= RANK_INFO[i].min) return RANK_INFO[i]
  return RANK_INFO[0]
}

export function RankBadge({ score = 0 }) {
  const rank = getRank(score)
  return (
    <span style={{
      fontFamily: "'Orbitron',sans-serif", fontSize: 10,
      color: rank.color, border: `1px solid ${rank.color}66`,
      borderRadius: 4, padding: '2px 8px', letterSpacing: 1,
      boxShadow: `0 0 8px ${rank.glow}`,
    }}>{rank.name}</span>
  )
}

export function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(120,80,255,0.2)' }} />
      {label && <span style={{ fontSize: 11, color: 'rgba(180,140,255,0.5)', letterSpacing: 1 }}>{label}</span>}
      <div style={{ flex: 1, height: 1, background: 'rgba(120,80,255,0.2)' }} />
    </div>
  )
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid rgba(120,80,255,0.2)', marginBottom: 16 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          fontFamily: "'Orbitron',sans-serif", fontSize: 9, letterSpacing: 2,
          padding: '10px 16px', background: 'none', cursor: 'pointer',
          textTransform: 'uppercase',
          color: active === t.id ? '#c084fc' : 'rgba(180,140,255,0.4)',
          borderBottom: active === t.id ? '2px solid #c084fc' : '2px solid transparent',
          border: 'none', transition: 'all 0.2s',
        }}>{t.label}</button>
      ))}
    </div>
  )
}
