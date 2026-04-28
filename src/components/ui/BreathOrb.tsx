// src/components/ui/BreathOrb.tsx
// Soft breathing background blur — Calm-inspired ambient texture
// Conversation Mode

type OrbPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center-left'
  | 'center-right'

type Props = {
  color: string
  position?: OrbPosition
  size?: number
  opacity?: number
}

export function BreathOrb({
  color,
  position = 'top-left',
  size = 400,
  opacity = 0.35,
}: Props) {
  const positionClasses: Record<OrbPosition, string> = {
    'top-left': '-top-24 -left-24',
    'top-right': '-top-24 -right-24',
    'bottom-left': '-bottom-24 -left-24',
    'bottom-right': '-bottom-24 -right-24',
    'center-left': 'top-1/3 -left-32',
    'center-right': 'top-1/3 -right-32',
  }

  return (
    <div
      className={`absolute rounded-full pointer-events-none animate-breathe ${positionClasses[position]}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: color,
        filter: 'blur(80px)',
        opacity,
      }}
      aria-hidden="true"
    />
  )
}
