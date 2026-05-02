'use client'
import { useState } from 'react'

// ── Exakter Vinted DE Kategorie-Baum (direkt aus der Vinted-Navigation) ────────
const TREE = [
  {
    label: '👩 Damen', children: [
      {
        label: 'Kleidung', children: [
          { label: 'Jacken & Mäntel' },
          { label: 'Pullover & Strickpullover' },
          { label: 'Blazer & Anzüge' },
          { label: 'Kleider' },
          { label: 'Röcke' },
          { label: 'Skorts' },
          { label: 'Tops & T-Shirts' },
          { label: 'Jeans' },
          { label: 'Hosen & Leggings' },
          { label: 'Shorts' },
          { label: 'Jumpsuits & Playsuits' },
          { label: 'Bademode' },
          { label: 'Unterwäsche & Nachtwäsche' },
          { label: 'Umstandskleidung' },
          { label: 'Activewear' },
          { label: 'Kostüme & Besonderes' },
          { label: 'Sonstiges' },
        ]
      },
      {
        label: 'Schuhe', children: [
          { label: 'Sneakers' },
          { label: 'Stiefel & Stiefeletten' },
          { label: 'Pumps & Absätze' },
          { label: 'Sandalen' },
          { label: 'Ballerinas & Flats' },
          { label: 'Sportschuhe' },
          { label: 'Hausschuhe & Pantoffeln' },
          { label: 'Sonstige Schuhe' },
        ]
      },
      {
        label: 'Taschen', children: [
          { label: 'Handtaschen' },
          { label: 'Umhängetaschen & Crossbody-Bags' },
          { label: 'Rucksäcke' },
          { label: 'Clutches & Abendtaschen' },
          { label: 'Shopper & Totes' },
          { label: 'Geldbörsen & Kartenetuis' },
          { label: 'Koffer & Trolleys' },
          { label: 'Gürteltaschen' },
          { label: 'Sonstige Taschen' },
        ]
      },
      {
        label: 'Accessoires', children: [
          { label: 'Schmuck' },
          { label: 'Uhren' },
          { label: 'Sonnenbrillen & Brillen' },
          { label: 'Schals & Tücher' },
          { label: 'Mützen, Hüte & Caps' },
          { label: 'Gürtel' },
          { label: 'Handschuhe' },
          { label: 'Haaraccessoires' },
          { label: 'Sonstige Accessoires' },
        ]
      },
      {
        label: 'Beauty', children: [
          { label: 'Parfüm & Düfte' },
          { label: 'Make-up' },
          { label: 'Hautpflege' },
          { label: 'Haarpflege' },
          { label: 'Körperpflege' },
          { label: 'Nagelpflege' },
          { label: 'Sonstige Beauty' },
        ]
      },
    ]
  },

  {
    label: '👨 Herren', children: [
      {
        label: 'Kleidung', children: [
          { label: 'Jacken & Mäntel' },
          { label: 'Anzüge & Blazer' },
          { label: 'Hosen' },
          { label: 'Unterwäsche & Socken' },
          { label: 'Badebekleidung' },
          { label: 'Spezielle Kleidung' },
          { label: 'Jeans' },
          { label: 'Tops & T-Shirts' },
          { label: 'Pullover & Sweater' },
          { label: 'Shorts' },
          { label: 'Nachtwäsche' },
          { label: 'Sportartikel' },
          { label: 'Sonstiges' },
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
          { label: 'Sonstige Schuhe' },
        ]
      },
      {
        label: 'Accessoires', children: [
          { label: 'Schmuck' },
          { label: 'Uhren' },
          { label: 'Sonnenbrillen & Brillen' },
          { label: 'Gürtel' },
          { label: 'Mützen, Hüte & Caps' },
          { label: 'Schals & Tücher' },
          { label: 'Rucksäcke & Taschen' },
          { label: 'Geldbörsen' },
          { label: 'Sonstige Accessoires' },
        ]
      },
      {
        label: 'Körper- & Gesichtspflege', children: [
          { label: 'Parfüm & Düfte' },
          { label: 'Hautpflege' },
          { label: 'Haarpflege' },
          { label: 'Rasur & Bartpflege' },
          { label: 'Sonstige Pflege' },
        ]
      },
    ]
  },

  {
    label: '👶 Kinder', children: [
      {
        label: 'Mädchen', children: [
          { label: 'Outerwear' },
          { label: 'Shirts, Tops & Blusen' },
          { label: 'Pullover und Jäckchen' },
          { label: 'Kleider' },
          { label: 'Röcke' },
          { label: 'Hosen & Shorts' },
          { label: 'Accessoires' },
          { label: 'Unterwäsche & Socken' },
          { label: 'Sportkleidung' },
          { label: 'Schuhe' },
          { label: 'Badekleidung' },
          { label: 'Nachtwäsche' },
          { label: 'Babykleidung (Mädchen)' },
          { label: 'Kinder-Handtaschen' },
          { label: 'Sets & Kleidungspakete' },
          { label: 'Schicke Kleider & Kostüme' },
          { label: 'Für Zwillinge' },
          { label: 'Für besondere Anlässe' },
        ]
      },
      {
        label: 'Jungs', children: [
          { label: 'Outerwear' },
          { label: 'Shirts & Tops' },
          { label: 'Pullover und Jäckchen' },
          { label: 'Hosen & Shorts' },
          { label: 'Unterwäsche & Socken' },
          { label: 'Sportkleidung' },
          { label: 'Schuhe' },
          { label: 'Badekleidung' },
          { label: 'Nachtwäsche' },
          { label: 'Babykleidung (Jungs)' },
          { label: 'Sets & Kleidungspakete' },
          { label: 'Spezielle Kleidung' },
          { label: 'Für Zwillinge' },
        ]
      },
      { label: 'Spielzeug' },
      { label: 'Kinderwagen, Tragen & Autositze' },
      { label: 'Möbel & Deko' },
      { label: 'Baden & Wickeln' },
      { label: 'Kindersicherung & Sicherheitsausstattung' },
      { label: 'Gesundheit & Schwangerschaft' },
      { label: 'Stillen & Füttern' },
      { label: 'Schlafen & Bettzeug' },
      { label: 'Schulbedarf' },
      { label: 'Sonstige Artikel für Kinder' },
    ]
  },

  {
    label: '🏠 Home', children: [
      {
        label: 'Kleine Küchengeräte', children: [
          { label: 'Zubereitung von Kaffee, Tee und Espresso' },
          { label: 'Mixer und Küchenmaschinen' },
          { label: 'Fritteusen' },
          { label: 'Kochplatten' },
          { label: 'Wasser- und Getränkespender' },
          { label: 'Kessel und Wasserkocher' },
          { label: 'Toaster' },
          { label: 'Mikrowellen' },
          { label: 'Elektrische Grills und Grillplatten' },
          { label: 'Entsafter' },
          { label: 'Spezialgeräte' },
        ]
      },
      { label: 'Koch- und Backutensilien' },
      { label: 'Küchenhelfer' },
      { label: 'Essen' },
      { label: 'Haushaltsgeräte' },
      { label: 'Textilien' },
      { label: 'Wohnaccessoires' },
      { label: 'Büromaterial' },
      { label: 'Feste & Feiertage' },
      { label: 'Werkzeuge & Heimwerken' },
      { label: 'Außenbereich & Garten' },
      { label: 'Haustierbedarf' },
    ]
  },

  {
    label: '📱 Elektronik', children: [
      { label: 'Handys & Smartphones' },
      { label: 'Tablets & E-Reader' },
      { label: 'Laptops & Computer' },
      { label: 'Kopfhörer & Lautsprecher' },
      { label: 'Zubehör & Kabel' },
      { label: 'Kameras & Fotografie' },
      { label: 'Gaming & Konsolen' },
      { label: 'Smartwatches & Wearables' },
      { label: 'TV & Video' },
      { label: 'Sonstige Elektronik' },
    ]
  },

  {
    label: '🎭 Unterhaltung', children: [
      { label: 'Bücher' },
      { label: 'Musik & Instrumente' },
      { label: 'Filme & DVDs' },
      { label: 'Videospiele' },
      { label: 'Sammlerstücke' },
      { label: 'Sonstiges' },
    ]
  },

  {
    label: '🏅 Hobby- & Sammlerartikel', children: [
      { label: 'Sport' },
      { label: 'Outdoor & Camping' },
      { label: 'Fahrräder & Zubehör' },
      { label: 'Kunst & Basteln' },
      { label: 'Sammeln' },
      { label: 'Sonstiges' },
    ]
  },
]

// Gibt den Pfad ohne Emoji-Präfix zurück
function cleanLabel(label) {
  return label.replace(/^[^\wÀ-ɏ]+/, '').trim()
}

// Baut den Kategorie-String: "Damen – Kleidung – Jeans"
function buildPath(stack, finalLabel) {
  const parts = stack.map(s => cleanLabel(s))
  parts.push(cleanLabel(finalLabel))
  return parts.join(' – ')
}

export default function CategoryPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [stack, setStack] = useState([])
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
    let items = TREE
    for (const label of newStack) {
      const found = items.find(i => i.label === label)
      if (found?.children) items = found.children
      else break
    }
    setCurrentItems(items)
  }

  const selectItem = (item) => {
    if (item.children) {
      navigateInto(item)
    } else {
      onChange(buildPath(stack, item.label))
      setOpen(false)
    }
  }

  const breadcrumb = stack.map(cleanLabel).join(' › ') || 'Kategorie'

  return (
    <>
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

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-lg flex flex-col"
            style={{ maxHeight: '85vh' }}>

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
