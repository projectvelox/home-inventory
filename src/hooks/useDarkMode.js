import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('dark') === '1' }
    catch { return false }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try { localStorage.setItem('dark', dark ? '1' : '0') }
    catch {}
  }, [dark])

  return [dark, () => setDark(d => !d)]
}
