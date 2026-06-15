'use client'
import { useEffect } from 'react'

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

// App ist seit dem Lusion-Reskin durchgehend dunkel (siehe layout.js).
// useDark erzwingt deshalb dauerhaft Dark — nie mehr aus localStorage strippen,
// sonst zerschiesst ein alter ls-theme=light-Eintrag das Theme zur Laufzeit.
export function useDark() {
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  const toggle = () => {
    document.documentElement.classList.add('dark')
  }

  return { dark: true, toggle }
}

export function useTheme() {
  const { dark, toggle } = useDark()
  return { dark, toggle, c: dark ? DARK : LIGHT }
}
