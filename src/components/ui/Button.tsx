// src/components/ui/Button.tsx
// Reusable button — primary + ghost variants
// Conversation Mode tasarım dili

'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'ghost'
type ButtonArrow = 'left' | 'right' | 'none'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  arrow?: ButtonArrow
  children: ReactNode
}

export function Button({
  variant = 'primary',
  arrow = 'none',
  children,
  className = '',
  ...rest
}: Props) {
  const baseClasses =
    'inline-flex items-center gap-2.5 font-medium text-[15px] cursor-pointer transition-all duration-250 ease-out border-none font-sans active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100'

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'rounded-full px-7 py-3.5 bg-humanos-text text-humanos-bg hover:bg-humanos-accent hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(26,24,20,0.06)]',
    ghost:
      'rounded-full px-1 py-3.5 bg-transparent text-humanos-text-muted hover:text-humanos-text',
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {arrow === 'left' && (
        <span className="transition-transform duration-250 ease-out group-hover:-translate-x-1 inline-block">
          ←
        </span>
      )}
      {children}
      {arrow === 'right' && (
        <span className="transition-transform duration-250 ease-out inline-block">
          →
        </span>
      )}
    </button>
  )
}
