'use client'

import { useState, useEffect } from 'react'

/**
 * Returns how many calendar columns to show based on viewport width.
 * 7 on desktop (≥1024px), 5 on tablet (≥640px), 3 on small screens.
 */
export function useVisibleDayCount(): number {
  const [count, setCount] = useState(7)

  useEffect(() => {
    function update() {
      if (window.innerWidth >= 1024) setCount(7)
      else if (window.innerWidth >= 640) setCount(5)
      else setCount(3)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return count
}
