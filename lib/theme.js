'use client'
import { useEffect, useState } from 'react'

const LIGHT = {
  bg:      '#f0f2f7',
  surface: '#ffffff',
  border:  '#e8ecf2',
  divider: '#f0f2f7',
  text1:   '#111827',
  text2:   '#6b7280',
  text3:   '#9ca3af',
  input:   '#ffffff',
}

const DARK = {
  bg:      '#0d1117',
  surface: '#161b22',
  border:  '#30363d',
  divider: 'rgba(255,255,255,0.08)',
  text1:   '#e6edf3',
  text2:   '#b1bac4',
  text3:   '#8b949e',
  input:   '#0d1117',
}

export function useDark() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('ls-theme')
    const isDark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('ls-theme', next ? 'dark' : 'light')
  }

  return { dark, toggle }
}

export function useTheme() {
  const { dark, toggle } = useDark()
  return { dark, toggle, c: dark ? DARK : LIGHT }
}
