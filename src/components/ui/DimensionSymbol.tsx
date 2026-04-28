// src/components/ui/DimensionSymbol.tsx
// Stylized SVG symbols for each life dimension
// Inspired by Headspace — warm, characterful, mature
// Conversation Mode

import type { Dimension } from '@/lib/assessment/questions'

type SymbolVariant = 'inline' | 'card'

type Props = {
  dimension: Dimension
  variant?: SymbolVariant
  size?: number
}

const dimensionColors: Record<Dimension, string> = {
  nutrition: 'var(--color-dim-nutrition)',
  exercise: 'var(--color-dim-exercise)',
  blood: 'var(--color-dim-blood)',
  habits: 'var(--color-dim-habits)',
}

// ═══════════════════════════════════════════════════
// SVG PATHS — each dimension's symbol
// ═══════════════════════════════════════════════════

function NutritionPath({ color }: { color: string }) {
  return (
    <>
      {/* Stylized fruit/leaf form */}
      <path
        d="M12 4C9 4 6 6 6 10C6 12 7 14 9 15L9 18C9 19 10 20 11 20L13 20C14 20 15 19 15 18L15 15C17 14 18 12 18 10C17 6 14 4 12 4Z"
        fill={color}
        fillOpacity="0.12"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 4C12 6 13 7 14 7"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </>
  )
}

function ExercisePath({ color }: { color: string }) {
  return (
    <>
      {/* Upward motion: dot + arrow */}
      <circle
        cx="12"
        cy="6"
        r="2"
        fill={color}
        fillOpacity="0.12"
        stroke={color}
        strokeWidth="1.5"
      />
      <path
        d="M12 10V20M8 14L12 10L16 14"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  )
}

function BloodPath({ color }: { color: string }) {
  return (
    <>
      {/* Drop + ring */}
      <path
        d="M12 4C12 4 7 10 7 14C7 17 9 19 12 19C15 19 17 17 17 14C17 10 12 4 12 4Z"
        fill={color}
        fillOpacity="0.12"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="14"
        r="2"
        stroke={color}
        strokeWidth="1.2"
        fill="none"
        opacity="0.6"
      />
    </>
  )
}

function HabitsPath({ color }: { color: string }) {
  return (
    <>
      {/* Circular flow */}
      <path
        d="M19 12C19 8 16 5 12 5C8 5 5 8 5 12C5 16 8 19 12 19"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M16 9L19 12L16 15"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="12" cy="12" r="2" fill={color} fillOpacity="0.4" />
    </>
  )
}

// ═══════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════

export function DimensionSymbol({
  dimension,
  variant = 'inline',
  size = 24,
}: Props) {
  const color = dimensionColors[dimension]

  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {dimension === 'nutrition' && <NutritionPath color={color} />}
      {dimension === 'exercise' && <ExercisePath color={color} />}
      {dimension === 'blood' && <BloodPath color={color} />}
      {dimension === 'habits' && <HabitsPath color={color} />}
    </svg>
  )

  if (variant === 'card') {
    return (
      <div className="inline-flex items-center justify-center w-20 h-20 bg-humanos-surface rounded-3xl shadow-[0_1px_2px_rgba(26,24,20,0.04)] border border-humanos-border-faint animate-float">
        <div style={{ transform: 'scale(1.8)' }}>{svg}</div>
      </div>
    )
  }

  return svg
}
