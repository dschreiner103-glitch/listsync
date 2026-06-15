'use client'
import { useEffect, useRef } from 'react'

// Lusion-Style Custom Cursor: kleiner Punkt + nachziehender Ring.
// Nur auf Geräten mit Fein-Pointer (Maus); Touch zeigt nichts (CSS blendet aus).
export default function LusionCursor() {
  const dot = useRef(null)
  const ring = useRef(null)

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    let mx = 0, my = 0, rx = 0, ry = 0, raf

    const move = (e) => {
      mx = e.clientX; my = e.clientY
      if (dot.current) dot.current.style.transform = `translate(${mx}px,${my}px)`
      const el = e.target?.closest?.('a,button,input,textarea,select,label,[role="button"],.ls-card')
      if (ring.current) ring.current.dataset.state = el ? 'hover' : 'idle'
    }
    const loop = () => {
      rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2
      if (ring.current) ring.current.style.transform = `translate(${rx}px,${ry}px)`
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('mousemove', move)
    loop()
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf) }
  }, [])

  return (
    <>
      <div ref={dot} className="ls-cur-dot" aria-hidden="true" />
      <div ref={ring} className="ls-cur-ring" data-state="idle" aria-hidden="true" />
    </>
  )
}
