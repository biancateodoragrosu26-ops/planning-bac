'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CountdownBadge } from './CountdownBadge'

const NAV_ITEMS = [
  { href: '/accueil', label: 'Accueil' },
  { href: '/calendrier', label: 'Calendrier' },
  { href: '/taches-bac', label: 'Taches bac' },
  { href: '/retard', label: 'Retard' },
  { href: '/charge', label: 'Charge' },
  { href: '/inbox', label: 'Inbox' },
  { href: '/periodes', label: 'Periodes' },
  { href: '/maitrise', label: 'Programme' },
  { href: '/creneaux-libres', label: 'Creneaux' },
  { href: '/semaine-bac', label: 'Semaine bac' },
] as const

export function NavBar() {
  const pathname = usePathname()

  return (
    <>
      <nav className="hidden h-full w-[var(--nav-rail-width)] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur lg:flex">
        <div className="px-5 pb-4 pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--text-faint)]">
            Planning Bac
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-[var(--text-strong)]">
            Accueil
          </h1>
        </div>

        <div className="px-4 pb-4">
          <CountdownBadge />
        </div>

        <div className="mx-4 mb-2 h-px bg-[var(--border)]" />

        <div className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'block rounded-2xl px-4 py-3 text-sm font-medium transition',
                  active
                    ? 'bg-[var(--accent-terracotta-soft)] text-[var(--accent-terracotta-deep)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-strong)]',
                ].join(' ')}
              >
                {label}
              </Link>
            )
          })}
        </div>
      </nav>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--surface)]/96 backdrop-blur lg:hidden"
        style={{ height: 'calc(var(--nav-bottom-height) + env(safe-area-inset-bottom, 0px))' }}
      >
        <div
          className="flex h-[var(--nav-bottom-height)] gap-2 overflow-x-auto px-3 pb-[env(safe-area-inset-bottom,0px)] pt-2"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {NAV_ITEMS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'inline-flex min-w-max items-center justify-center rounded-full px-4 text-xs font-medium',
                  active
                    ? 'bg-[var(--accent-terracotta-soft)] text-[var(--accent-terracotta-deep)]'
                    : 'border border-[var(--border)] text-[var(--text-muted)]',
                ].join(' ')}
              >
                {label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
