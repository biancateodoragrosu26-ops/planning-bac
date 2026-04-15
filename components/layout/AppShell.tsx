'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store/useAppStore'
import { NavBar } from './NavBar'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const hydrate = useAppStore((s) => s.hydrate)
  const hydrated = useAppStore((s) => s._hydrated)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--background)]">
      {/* Left rail nav (desktop) */}
      <NavBar />

      {/* Main content area */}
      <main
        className={[
          'flex-1 overflow-hidden flex flex-col',
          // On mobile: leave room for bottom tab bar
          'pb-[var(--nav-bottom-height)] lg:pb-0',
        ].join(' ')}
        style={{
          paddingBottom: `calc(var(--nav-bottom-height) + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        {/* Skeleton while store hydrates from localStorage */}
        {!hydrated ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-[var(--text-faint)] text-sm">Chargement…</div>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  )
}
