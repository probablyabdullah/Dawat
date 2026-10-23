import { useEffect } from 'react'

export function useEscape(onEscape) {
  useEffect(() => {
    const onKeyDown = (e) => e.key === 'Escape' && onEscape()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onEscape])
}
