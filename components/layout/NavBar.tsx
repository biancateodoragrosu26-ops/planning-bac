'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CountdownBadge } from './CountdownBadge'

const NAV_ITEMS = [
  { href: '/calendrier', label: 'Calendrier', icon: 'Agenda' },
  { href: '/accueil', label: 'Accueil', icon: 'Urgence' },
  { href: '/charge', label: 'Charge', icon: 'Charge' },
  { href: '/retard', label: 'Retard', icon: 'Risque' },
  { href: '/inbox', label: 'Inbox', icon: 'Inbox' },
  { href: '/periodes', label: 'Periodes', icon: 'Phases' },
  { href: '/creneaux-libres', label: 'Creneaux', icon: 'Temps' },
  { href: '/semaine-bac', label: 'Semaine bac', icon: 'Finale' },
] as const

export function NavBar() {
  const pathname = usePathname()

  return (
    <>
      <nav className="hidden h-full w-[var(--nav-rail-width)] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur lg:flex">
        <div className="px-5 pt-6 pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--text-faint)]">
            Planning Bac
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-[var(--text-strong)]">
            Phase finale
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Pilotage par blocs equivalents</p>
        </div>

        <div className="px-4 pb-4">
          <CountdownBadge />
        </div>

        <div className="mx-4 mb-2 h-px bg-[var(--border)]" />

        <div className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition',
                  active
                    ? 'bg-[var(--accent-terracotta-soft)] text-[var(--accent-terracotta-deep)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-strong)]',
                ].join(' ')}
              >
                <span className="w-12 text-[11px] font-semibold uppercase tracking-[0.14em]">{icon}</span>
                <span className="font-medium">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--surface)]/96 backdrop-blur lg:hidden"
        style={{ height: 'calc(var(--nav-bottom-height) + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex h-[var(--nav-bottom-height)] items-stretch">
          {NAV_ITEMS.slice(0, 5).map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'flex-1 px-2 text-center text-[11px] font-medium',
                  'flex flex-col items-center justify-center gap-1',
                  active ? 'text-[var(--accent-terracotta-deep)]' : 'text-[var(--text-muted)]',
                ].join(' ')}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
