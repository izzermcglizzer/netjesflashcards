import { useCallback, useRef } from 'react'

/** Smoothly scrolls a ref into view — useful after revealing feedback / Volgende. */
export function useScrollIntoView<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const scrollIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    })
  }, [])
  return { ref, scrollIntoView }
}
