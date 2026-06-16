import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('asx-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      localStorage.setItem('asx-theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('asx-theme', 'light')
    }
  }, [isDark])

  const toggle = () => setIsDark(d => !d)

  return { isDark, toggle }
}
