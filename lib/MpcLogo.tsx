import React from 'react'

const PATTERN = [
  [1.0, 0.42, 0.16],
  [0.16, 1.0, 0.42],
  [0.16, 0.16, 1.0],
]

interface MarkProps {
  size?: number
  color?: string
  accent?: string
  accentAt?: 'none' | 'center'
  style?: React.CSSProperties
  className?: string
}

export function MpcMark({ size = 32, color = '#0F2942', accent = '#C75A3C', accentAt = 'none', style, className }: MarkProps) {
  const vb = 100, gap = 5, cell = (vb - 2 * gap) / 3
  const rects = []
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const isAcc = accentAt === 'center' && row === 1 && col === 1
      rects.push(
        <rect key={`${row}-${col}`}
          x={col * (cell + gap)} y={row * (cell + gap)}
          width={cell} height={cell} rx={2}
          fill={isAcc ? accent : color}
          opacity={isAcc ? 1 : PATTERN[row][col]} />
      )
    }
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${vb} ${vb}`}
      width={size} height={size} role="img" aria-label="Media Planning Canvas"
      style={style} className={className}>
      <title>Media Planning Canvas</title>
      {rects}
    </svg>
  )
}

interface LockupProps {
  size?: number
  color?: string
  accent?: string
  reverse?: boolean
  style?: React.CSSProperties
}

export function MpcLockup({ size = 32, color = '#0F2942', accent = '#C75A3C', reverse = false, style }: LockupProps) {
  const fg = reverse ? '#F6F4EF' : color
  const ns = Math.round(size * 0.55)
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, color: fg, ...style }}>
      <MpcMark size={size} color={reverse ? '#F6F4EF' : color} accent={accent} />
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontFamily: "'Geist', sans-serif", fontWeight: 600, fontSize: ns, letterSpacing: '-0.02em' }}>
          Media Planning{' '}
          <span style={{ fontWeight: 400, opacity: 0.55 }}>Canvas</span>
        </div>
        <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: Math.max(9, Math.round(ns * 0.38)), letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.55, marginTop: 4 }}>
          The Marketing Plan Generator
        </div>
      </div>
    </div>
  )
}
