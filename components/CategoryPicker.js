'use client'
import { useState } from 'react'

// ── Kategorie-Baum (spiegelt Vinted's Struktur exakt wider) ──────────────────
const TREE = [
  {
    label: '👩 Damen', children: [
      {
        label: 'Kleidung', children: [
          { label: 'Jacken & Mäntel' },
          { label: 'Kleider' },
          { label: 'Röcke' },
          {
            label: 'Tops & T-Shirts', children: [
              { label: 'Bauchfreie Tops' },
              { label: 'Schulterfreie Tops' },
              { label: 'Blusen & Tuniken' },
            ]
          },
          { label: 'Hosen & Jeans' },
          { label: 'Shorts' },
          {
            label: 'Pullover & Strickpullover', children: [
              { label: 'Pullover' },
              { label: 'Strickjacken' },
              { label: 'Hoodies & Sweatshirts' },
              { label: 'Westen' },
            ]
          },
          { label: 'Blazer & Anzüge' },
          { label: 'Unterwäsche & Socken' },
          { label: 'Sportkleidung' },
          { label: 'Bademode' },
          { label: 'Overalls & Jumpsuits' },
        ]
      },
      {
        label: 'Schuhe', children: [
          { label: 'Sneakers' },
          { label: 'Stiefel & Stiefeletten' },
          { label: 'Pumps & Absatzschuhe' },
          { label: 'Sandalen' },
          { label: 'Ballerinas & Flats' },
          { label: 'Sportschuhe' },
          { label: 'Hausschuhe' },
        ]
      },
      { label: 'Taschen' },
      { label: 'Accessoires' },
      { label: 'Beauty' },
    ]
  },
  {
    label: '👨 Herren', children: [
      {
        label: 'Kleidung', children: [
          { label: 'Jeans' },
          { label: 'Jacken & Mäntel' },
          { label: 'Tops & T-Shirts' },
          { label: 'Hosen' },
          { label: 'Shorts' },
          { label: 'Anzüge & Blazer' },
          { label: 'Unterwäsche & Socken' },
          { label: 'Sportkleidung' },
          { label: 'Bademode' },
          {
            label: 'Pullover & Sweater', children: [
              { label: 'Sweater' },
              { label: 'Pullis & Hoodies' },
              { label: 'Kapuzenjacken' },
              { label: 'Strickjacken' },
              { label: 'Pullover mit Rundhalsausschnitt' },
              { label: 'Pullover mit V-Ausschnitt' },
              { label: 'Rollkragenpullover' },
              { label: 'Lange Pullover' },
              { label: 'Strickpullover für den Winter' },
              { label: 'Westen' },
            ]
          },
        ]
      },
      {
        label: 'Schuhe', children: [
          { label: 'Sneakers' },
          { label: 'Stiefel & Stiefeletten' },
          { label: 'Sportschuhe' },
          { label: 'Halbschuhe & Mokassins' },
          { label: 'Sandalen & Flip-Flops' },
          { label: 'Hausschuhe' },
        ]
      },
      { label: 'Accessoires' },
    ]
  },
  {
    label: '👶 Kinder', children: [
      {
        label: 'Mädchen', children: [
          { label: 'Kleider' },
          { label: 'Jacken & Mäntel' },
          { label: 'Shirts & Tops' },
          { label: 'Hosen & Shorts' },
          { label: 'Pullover & Jäckchen' },
          { label: 'Schuhe' },
          { label: 'Sportkleidung' },
        ]
      },
      {
        label: 'Jungs', children: [
          { label: 'Jacken & Mäntel' },
          { label: 'Shirts & Tops' },
          { label: 'Hosen & Shorts' },
          { label: 'Pullover & Jäckchen' },
          { label: 'Schuhe' },
          { label: 'Sportkleidung' },
        ]
      },
      { label: 'Spielzeug' },
    ]
  },
  {
    label: '📦 Sonstiges', children: [
      { label: 'Elektronik' },
      { label: 'Home & Living' },
      { label: 'Sport & Outdoor' },
      { label: 'Unterhaltung' },
      { label: 'Sonstiges' },
    ]
  },
]

// Gibt den Pfad ohne Emoji-Präfix zurück
function cleanLabel(label) {
  return label.replace(/^[^\wÀ-ɏ]+/, '').trim()
}

// Baut den Kategorie-String: "Herren – Kleidung – Pullover & Sweater – Pullis & Hoodies"
function buildPath(stack, finalLabel) {
  const parts = stack.map(s => cleanLabel(s))
  parts.push(cleanLabel(finalLabel))
  return parts.join(' – ')
}

export default function CategoryPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  // stack = array von Labels, die der User bereits durchgeklickt hat
  // stack[0] = root (null), stack[1] = "👩 Damen", etc.
  const [stack, setStack] = useState([])
  // currentItems = die aktuell angezeigten Einträge
  const [currentItems, setCurrentItems] = useState(TREE)

  const openPicker = () => {
    setStack([])
    setCurrentItems(TREE)
    setOpen(true)
  }

  const navigateInto = (item) => {
    const newStack = [...stack, item.label]
    setStack(newStack)
    setCurrentItems(item.children)
  }

  const goBack = () => {
    if (stack.length === 0) { setOpen(false); return }
    const newStack = stack.slice(0, -1)
    setStack(newStack)
    // Neu navigieren: von root aus den Baum wieder aufbauen
    let items = TREE
    for (const label of newStack) {
      const found = items.find(i => i.label === label)
      if (found?.children) items = found.children
      else break
    }
    setCurrentItems(items)
  }

  const selectItem = (item) => {
    // Wenn das Item Kinder hat: drill-down
    if (item.children) {
      navigateInto(item)
    } else {
      // Leaf-Node → direkt auswählen
      const path = buildPath(stack, item.label)
      onChange(path)
      setOpen(false)
    }
  }

  const selectCurrentLevel = () => {
    // Aktuelle Ebene (letztes Stack-Element) als Kategorie wählen
    if (stack.length === 0) return
    const currentLabel = stack[stack.length - 1]
    const path = buildPath(stack.slice(0, -1), currentLabel)
    onChange(path)
    setOpen(false)
  }

  // Breadcrumb-Text
  const breadcrumb = stack.map(cleanLabel).join(' › ') || 'Kategorie'

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={openPicker}
        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-left flex items-center justify-between hover:border-indigo-400 transition-colors"
      >
        <span className={value ? 'text-gray-900 font-medium' : 'text-gray-400'}>
          {value || 'Kategorie wählen…'}
        </span>
        <span className="text-gray-400 text-base">›</span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-lg flex flex-col"
            style={{ maxHeight: '85vh' }}>

            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <button
                onClick={goBack}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex-shrink-0"
              >
                {stack.length === 0 ? '✕' : '←'}
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-gray-900 text-sm truncate">{breadcrumb}</p>
                {stack.length > 0 && (
                  <p className="text-xs text-gray-400">Wähle eine Unterkategorie</p>
                )}
              </div>
            </div>


            {/* Kategorie-Liste */}
            <div className="overflow-y-auto flex-1 py-2">
              {currentItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => selectItem(item)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-sm font-semibold text-gray-800">{cleanLabel(item.label)}</span>
                  {item.children
                    ? <span className="text-gray-400 text-lg">›</span>
                    : <span className="text-indigo-500 text-xs font-bold">Wählen</span>
                  }
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
