import { motion } from 'framer-motion'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'neutral' | 'purple'

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-brand-green text-white shadow-[0_4px_0_var(--color-brand-green-dark)] active:shadow-[0_1px_0_var(--color-brand-green-dark)]',
  secondary:
    'bg-brand-blue text-white shadow-[0_4px_0_var(--color-brand-blue-dark)] active:shadow-[0_1px_0_var(--color-brand-blue-dark)]',
  danger:
    'bg-brand-red text-white shadow-[0_4px_0_var(--color-brand-red-dark)] active:shadow-[0_1px_0_var(--color-brand-red-dark)]',
  neutral:
    'bg-white text-ink border-2 border-cloud-dark shadow-[0_4px_0_var(--color-cloud-dark)] active:shadow-[0_1px_0_var(--color-cloud-dark)]',
  purple:
    'bg-brand-purple text-white shadow-[0_4px_0_#9d4dd6] active:shadow-[0_1px_0_#9d4dd6]',
}

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onDrag' | 'onDragStart' | 'onDragEnd'
>

interface ChunkyButtonProps extends NativeButtonProps {
  variant?: Variant
  fullWidth?: boolean
  children: ReactNode
}

export function ChunkyButton({
  variant = 'primary',
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...rest
}: ChunkyButtonProps) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      whileTap={disabled ? undefined : { y: 3 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={[
        'rounded-2xl px-6 py-3 text-base font-extrabold uppercase tracking-wide transition-opacity',
        fullWidth ? 'w-full' : '',
        disabled ? 'cursor-not-allowed opacity-50' : '',
        VARIANT_CLASSES[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </motion.button>
  )
}
