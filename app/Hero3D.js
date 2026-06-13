'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/* Lusion-Style Liquid-Metal Blob: morphende Metaballs (MarchingCubes),
   iridescent/chrome Material mit Studio-Reflexionen, wölbt sich zur Maus,
   scroll-reaktiv. Metapher: drei Plattformen verschmelzen zu einem Tool. */

export default function Hero3D() {
  const mountRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let raf, disposed = false

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block'

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, mount.clientWidth / mount.clientHeight, 0.1, 100)
    camera.position.set(0, 0, 5)

    // studio reflections (the soul of the chrome look)
    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

    // lights — neutral key + brand-orange rim + cool fill
    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-3, 4, 4); scene.add(key)
    const rim = new THREE.DirectionalLight(0xf4511e, 4.0); rim.position.set(4, -2, -3); scene.add(rim)
    const fill = new THREE.DirectionalLight(0x6a8bff, 1.4); fill.position.set(3, 1, 3); scene.add(fill)
    scene.add(new THREE.AmbientLight(0x202024, 0.5))

    // ── liquid metal blob ──
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xdfe2e8,
      metalness: 1.0,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.15,
      iridescence: 1.0,
      iridescenceIOR: 1.35,
      iridescenceThicknessRange: [120, 420],
      envMapIntensity: 1.35,
    })
    const RES = 56
    const blob = new MarchingCubes(RES, material, true, false, 90000)
    blob.scale.set(2.6, 2.6, 2.6)
    blob.position.set(0, 0, 0)
    scene.add(blob)

    // soft orange glow behind
    const glowTex = (() => {
      const s = 256, c = document.createElement('canvas'); c.width = c.height = s
      const g = c.getContext('2d').createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
      g.addColorStop(0, 'rgba(244,81,30,0.5)'); g.addColorStop(0.45, 'rgba(244,81,30,0.14)'); g.addColorStop(1, 'rgba(0,0,0,0)')
      const x = c.getContext('2d'); x.fillStyle = g; x.fillRect(0, 0, s, s)
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
    })()
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
    glow.scale.set(7, 7, 1); glow.position.set(0, 0, -2); scene.add(glow)

    // ── interaction ──
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
    const onMove = (e) => {
      const r = mount.getBoundingClientRect()
      mouse.tx = ((e.clientX - r.left) / r.width - 0.5) * 2
      mouse.ty = ((e.clientY - r.top) / r.height - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove)
    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    if (wrapRef.current) wrapRef.current.dataset.loaded = '1'

    const clock = new THREE.Clock()
    const render = () => {
      raf = requestAnimationFrame(render)
      const t = clock.getElapsedTime()
      mouse.x += (mouse.tx - mouse.x) * 0.06
      mouse.y += (mouse.ty - mouse.y) * 0.06

      let prog = 0
      if (wrapRef.current) {
        const r = wrapRef.current.getBoundingClientRect()
        prog = Math.min(Math.max((window.innerHeight - r.top) / (window.innerHeight + r.height), 0), 1)
      }

      // rebuild metaball field
      blob.reset()
      const strength = 0.55, subtract = 12
      const n = 3 // three platforms merging into one
      for (let i = 0; i < n; i++) {
        const a = t * 0.5 + (i / n) * Math.PI * 2
        const rr = 0.085 + Math.sin(t * 0.6 + i) * 0.03
        const bx = 0.5 + Math.cos(a) * rr
        const by = 0.5 + Math.sin(a * 1.1) * rr + Math.sin(t * 0.4) * 0.025
        const bz = 0.5 + Math.sin(a * 0.7) * rr
        blob.addBall(bx, by, bz, strength, subtract)
      }
      // strong central anchor keeps them fused into one liquid mass
      blob.addBall(0.5, 0.5, 0.5, 0.9, subtract)
      // mouse pulls a bulge toward the cursor
      blob.addBall(0.5 + mouse.x * 0.18, 0.5 - mouse.y * 0.18, 0.58, 0.4, subtract)
      blob.update()

      blob.rotation.y = t * 0.18 + mouse.x * 0.5
      blob.rotation.x = mouse.y * 0.3
      blob.position.y = prog * 1.2
      glow.material.opacity = 0.85 - prog * 0.4
      camera.position.x = mouse.x * 0.3
      camera.position.y = -mouse.y * 0.2
      camera.lookAt(0, blob.position.y * 0.5, 0)

      renderer.render(scene, camera)
    }
    render()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose(); pmrem.dispose()
      blob.material.dispose()
      glowTex.dispose()
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div ref={wrapRef} data-loaded="0" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />
    </div>
  )
}
