// Animierter Aurora-Hintergrund — driftende, weiche Farbverläufe hinter dem Content.
// Liegt fix im Viewport (z-index 0); die Seiteninhalte müssen z-index 1 bekommen.
export default function Aurora() {
  return (
    <div className="ls-aurora" aria-hidden="true">
      <span className="ao ao1" />
      <span className="ao ao2" />
      <span className="ao ao3" />
    </div>
  )
}
