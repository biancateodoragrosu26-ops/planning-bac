import { forwardRef, type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-[var(--accent-terracotta-strong)] text-white hover:bg-[var(--accent-terracotta-deep)] shadow-[var(--shadow-button)]',
  secondary:
    'bg-[var(--surface-2)] text-[var(--text-strong)] border border-[var(--border)] hover:bg-[var(--surface-3)]',
  ghost:
    'text-[var(--text-strong)] hover:bg-[var(--surface-2)]',
  danger:
    'bg-[var(--critical-strong)] text-white hover:opacity-92',
}

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3.5 py-2 text-sm min-h-[36px]',
  md: 'px-4.5 py-2.5 text-sm min-h-[44px]',
  lg: 'px-6 py-3 text-base min-h-[52px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', className = '', ...props }, ref) => (
    <button
      ref={ref}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-full font-medium transition duration-150',
        'disabled:pointer-events-none disabled:opacity-40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-sage-strong)]',
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(' ')}
      {...props}
    />
  )
)

Button.displayName = 'Button'
