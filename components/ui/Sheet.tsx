'use client'

import { useEffect, useRef } from 'react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

/**
 * Bottom sheet for mobile/tablet. On desktop ≥1024px, renders as a right side panel.
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-stretch lg:justify-end">
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={[
          'relative w-full bg-[var(--surface)] rounded-t-2xl lg:rounded-none',
          'lg:w-[360px] lg:h-full lg:border-l lg:border-[var(--border)]',
          'flex flex-col shadow-xl',
          'max-h-[85dvh] lg:max-h-full',
          open ? 'animate-slide-up lg:animate-slide-in-right' : '',
        ].join(' ')}
        style={{
          // Slide-up animation via inline style for simplicity
          animation: open ? 'slideUp 0.22s ease-out' : undefined,
        }}
      >
        {/* Handle bar on mobile */}
        <div className="lg:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--border-strong)]" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
            <h2 className="font-semibold text-base">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-colors"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
