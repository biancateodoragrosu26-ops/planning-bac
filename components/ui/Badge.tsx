interface BadgeProps {
  label: string
  color?: string        // hex color — used for dot
  className?: string
}

export function Badge({ label, color, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        'bg-[var(--surface-2)] text-[var(--foreground)]',
        className,
      ].join(' ')}
    >
      {color && (
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </span>
  )
}
