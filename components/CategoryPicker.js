'use client'
import { useState } from 'react'

// ── Kompletter Kategorie-Baum (exakt wie Vinted DE) ──────────────────────────
const TREE = [
  {
    label: '👩 Damen', children: [
      {
        label: 'Kleidung', children: [
          {
            label: 'Jacken & Mäntel', children: [
              { label: 'Lederjacken' },
              { label: 'Winterjacken' },
              { label: 'Übergangsjacken' },
              { label: 'Parkas' },
              { label: 'Trenchcoats & Mäntel' },
              { label: 'Bomberjacken' },
              { label: 'Regenjacken' },
              { label: 'Westen' },
              { label: 'Daunenjacken' },
              { label: 'Fleecejacken' },
            ]
          },
          {
            label: 'Kleider', children: [
              { label: 'Minikleid' },
              { label: 'Midikleid' },
              { label: 'Maxikleid' },
              { label: 'Abendkleider' },
              { label: 'Freizeitkleider' },
              { label: 'Blusen- & Hemdblusenkleider' },
              { label: 'Jerseykleider' },
              { label: 'Träger- & Strandkleider' },
              { label: 'Cocktailkleider' },
            ]
          },
          {
            label: 'Röcke', children: [
              { label: 'Miniröcke' },
              { label: 'Midiröcke' },
              { label: 'Maxiröcke' },
              { label: 'Bleistiftröcke' },
              { label: 'A-Linien-Röcke' },
              { label: 'Jeansröcke' },
            ]
          },
          {
            label: 'Tops & T-Shirts', children: [
              { label: 'T-Shirts' },
              { label: 'Tanktops & Trägertops' },
              { label: 'Poloshirts' },
              { label: 'Bauchfreie Tops' },
              { label: 'Schulterfreie Tops' },
              { label: 'Blusen & Tuniken' },
            ]
          },
          {
            label: 'Hosen & Jeans', children: [
              { label: 'Jeans' },
              { label: 'Chinos & Stoffhosen' },
              { label: 'Leggings' },
              { label: 'Hosen mit weitem Bein' },
              { label: 'Jogginghosen' },
              { label: 'Cargo-Hosen' },
              { label: 'Anzug- & Bundfaltenhosen' },
              { label: 'Lederoptik-Hosen' },
            ]
          },
          {
            label: 'Shorts', children: [
              { label: 'Jeans-Shorts' },
              { label: 'Stoff-Shorts' },
              { label: 'Sportshorts' },
              { label: 'Radlerhosen' },
            ]
          },
          {
            label: 'Pullover & Strickpullover', children: [
              { label: 'Pullover' },
              { label: 'Strickjacken' },
              { label: 'Hoodies & Sweatshirts' },
              { label: 'Westen' },
              { label: 'Rollkragenpullover' },
              { label: 'Oversize-Pullover' },
              { label: 'Cardigan' },
            ]
          },
          {
            label: 'Blazer & Anzüge', children: [
              { label: 'Blazer' },
              { label: 'Hosenanzüge' },
              { label: 'Kostüme' },
              { label: 'Businessjacken' },
            ]
          },
          {
            label: 'Unterwäsche & Socken', children: [
              { label: 'BHs' },
              { label: 'Slips & Strings' },
              { label: 'Shapewear' },
              { label: 'Socken & Strümpfe' },
              { label: 'Strumpfhosen' },
              { label: 'Nachtwäsche' },
            ]
          },
          {
            label: 'Sportkleidung', children: [
              { label: 'Sport-BHs' },
              { label: 'Sport-Leggings' },
              { label: 'Sport-Tops & T-Shirts' },
              { label: 'Sport-Jacken' },
              { label: 'Trainingsanzüge' },
              { label: 'Yoga-Kleidung' },
            ]
          },
          {
            label: 'Bademode', children: [
              { label: 'Bikinis' },
              { label: 'Badeanzüge' },
              { label: 'Strandhosen & Pareos' },
              { label: 'Badekleider' },
            ]
          },
          {
            label: 'Overalls & Jumpsuits', children: [
              { label: 'Overalls' },
              { label: 'Jumpsuits' },
              { label: 'Hosenanzüge (einteilig)' },
            ]
          },
          {
            label: 'Hemden & Blusen', children: [
              { label: 'Hemdblusen' },
              { label: 'Klassische Blusen' },
              { label: 'Oversize-Hemden' },
            ]
          },
        ]
      },
      {
        label: 'Schuhe', children: [
          {
            label: 'Sneakers', children: [
              { label: 'Low-Top Sneakers' },
              { label: 'High-Top Sneakers' },
              { label: 'Plateau-Sneakers' },
              { label: 'Chunky Sneakers' },
            ]
          },
          {
            label: 'Stiefel & Stiefeletten', children: [
              { label: 'Ankle Boots' },
              { label: 'Kniestiefel' },
              { label: 'Overknee-Stiefel' },
              { label: 'Chelsea Boots' },
              { label: 'Cowboy-Stiefel' },
            ]
          },
          {
            label: 'Pumps & Absatzschuhe', children: [
              { label: 'Klassische Pumps' },
              { label: 'Pfennigabsatz (Stilettos)' },
              { label: 'Kitten Heels' },
              { label: 'Plateaupumps' },
            ]
          },
          {
            label: 'Sandalen', children: [
              { label: 'Flache Sandalen' },
              { label: 'Sandaletten mit Absatz' },
              { label: 'Gladiator-Sandalen' },
              { label: 'Slides & Pantoletten' },
            ]
          },
          { label: 'Ballerinas & Flats' },
          { label: 'Sportschuhe' },
          { label: 'Hausschuhe & Pantoffeln' },
          { label: 'Espadrilles & Mokassins' },
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
          { label: 'Bauchtaschen & Gürteltaschen' },
          { label: 'Bucket Bags' },
        ]
      },
      {
        label: 'Accessoires', children: [
          {
            label: 'Schmuck', children: [
              { label: 'Halsketten & Anhänger' },
              { label: 'Ohrringe' },
              { label: 'Ringe' },
              { label: 'Armbänder' },
              { label: 'Schmucksets' },
            ]
          },
          {
            label: 'Uhren', children: [
              { label: 'Armbanduhren' },
              { label: 'Smartwatches' },
            ]
          },
          { label: 'Sonnenbrillen & Brillen' },
          { label: 'Schals & Tücher' },
          { label: 'Mützen, Hüte & Caps' },
          { label: 'Gürtel' },
          { label: 'Handschuhe' },
          { label: 'Haaraccessoires' },
          { label: 'Strümpfe & Strumpfhosen' },
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
        ]
      },
    ]
  },

  {
    label: '👨 Herren', children: [
      {
        label: 'Kleidung', children: [
          {
            label: 'Jeans', children: [
              { label: 'Slim Fit Jeans' },
              { label: 'Regular Fit Jeans' },
              { label: 'Loose Fit Jeans' },
              { label: 'Skinny Jeans' },
              { label: 'Straight Jeans' },
              { label: 'Bootcut Jeans' },
              { label: 'Jogger Jeans' },
            ]
          },
          {
            label: 'Jacken & Mäntel', children: [
              { label: 'Lederjacken' },
              { label: 'Winterjacken' },
              { label: 'Übergangsjacken' },
              { label: 'Parkas' },
              { label: 'Trenchcoats & Mäntel' },
              { label: 'Bomberjacken' },
              { label: 'Regenjacken' },
              { label: 'Westen' },
              { label: 'Daunenjacken' },
              { label: 'Fleecejacken' },
              { label: 'Softshell-Jacken' },
            ]
          },
          {
            label: 'Tops & T-Shirts', children: [
              { label: 'T-Shirts' },
              { label: 'Poloshirts' },
              { label: 'Hemden' },
              { label: 'Tanktops' },
              { label: 'Oversize T-Shirts' },
              { label: 'Langarmshirts' },
            ]
          },
          {
            label: 'Hosen', children: [
              { label: 'Chinos & Stoffhosen' },
              { label: 'Cargo-Hosen' },
              { label: 'Jogginghosen' },
              { label: 'Anzughosen' },
              { label: 'Leinenhosen' },
            ]
          },
          {
            label: 'Shorts', children: [
              { label: 'Jeans-Shorts' },
              { label: 'Cargo-Shorts' },
              { label: 'Sport-Shorts' },
              { label: 'Badeshorts & Boardshorts' },
            ]
          },
          {
            label: 'Pullover & Sweater', children: [
              { label: 'Sweater' },
              { label: 'Pullis & Hoodies' },
              { label: 'Kapuzenjacken' },
              { label: 'Strickjacken' },
              { label: 'Pullover mit Rundhalsausschnitt' },
              { label: 'Pullover mit V-Ausschnitt' },
              { label: 'Rollkragenpullover' },
              { label: 'Oversize Pullover' },
              { label: 'Strickpullover' },
              { label: 'Westen' },
            ]
          },
          {
            label: 'Anzüge & Blazer', children: [
              { label: 'Anzüge' },
              { label: 'Blazer & Sakkos' },
              { label: 'Smokings' },
            ]
          },
          {
            label: 'Hemden', children: [
              { label: 'Freizeithemden' },
              { label: 'Businesshemden' },
              { label: 'Leinenhemden' },
              { label: 'Flanellhemden' },
              { label: 'Oversize-Hemden' },
            ]
          },
          {
            label: 'Unterwäsche & Socken', children: [
              { label: 'Boxershorts' },
              { label: 'Unterhemden' },
              { label: 'Socken' },
              { label: 'Thermowäsche' },
            ]
          },
          {
            label: 'Sportkleidung', children: [
              { label: 'Sport-Shirts' },
              { label: 'Sport-Hosen & Tights' },
              { label: 'Sport-Jacken' },
              { label: 'Trainingsanzüge' },
              { label: 'Laufkleidung' },
              { label: 'Fußballtrikots' },
            ]
          },
          {
            label: 'Bademode', children: [
              { label: 'Badehosen' },
              { label: 'Boardshorts' },
              { label: 'Badeshorts' },
            ]
          },
          { label: 'Overalls & Jumpsuits' },
        ]
      },
      {
        label: 'Schuhe', children: [
          {
            label: 'Sneakers', children: [
              { label: 'Low-Top Sneakers' },
              { label: 'High-Top Sneakers' },
              { label: 'Chunky Sneakers' },
              { label: 'Laufschuhe' },
            ]
          },
          {
            label: 'Stiefel & Stiefeletten', children: [
              { label: 'Chelsea Boots' },
              { label: 'Chukka Boots' },
              { label: 'Worker Boots' },
              { label: 'Winterstiefel' },
            ]
          },
          { label: 'Sportschuhe' },
          { label: 'Halbschuhe & Mokassins' },
          { label: 'Sandalen & Flip-Flops' },
          { label: 'Hausschuhe' },
          { label: 'Espadrilles & Bootsschuhe' },
        ]
      },
      {
        label: 'Accessoires', children: [
          {
            label: 'Schmuck', children: [
              { label: 'Halsketten & Anhänger' },
              { label: 'Armbänder' },
              { label: 'Ringe' },
              { label: 'Ohrringe' },
            ]
          },
          { label: 'Uhren' },
          { label: 'Sonnenbrillen & Brillen' },
          { label: 'Gürtel' },
          { label: 'Mützen, Hüte & Caps' },
          { label: 'Schals & Tücher' },
          { label: 'Rucksäcke & Taschen' },
          { label: 'Geldbörsen' },
        ]
      },
    ]
  },

  {
    label: '👶 Kinder', children: [
      {
        label: 'Baby (0–24 Monate)', children: [
          { label: 'Bodys & Strampler' },
          { label: 'Schlafsäcke & Decken' },
          { label: 'Jacken & Mäntel' },
          { label: 'Hosen & Jeans' },
          { label: 'Shirts & Tops' },
          { label: 'Kleider (Baby)' },
          { label: 'Schuhe (Baby)' },
          { label: 'Accessoires (Baby)' },
        ]
      },
      {
        label: 'Mädchen', children: [
          {
            label: 'Jacken & Mäntel', children: [
              { label: 'Winterjacken' },
              { label: 'Übergangsjacken' },
              { label: 'Regenjacken' },
            ]
          },
          {
            label: 'Kleider & Röcke', children: [
              { label: 'Kleider' },
              { label: 'Röcke' },
              { label: 'Tutu & Ballkleider' },
            ]
          },
          { label: 'Shirts & Tops' },
          {
            label: 'Hosen & Jeans', children: [
              { label: 'Jeans' },
              { label: 'Leggings' },
              { label: 'Stoffhosen' },
              { label: 'Jogginghosen' },
            ]
          },
          { label: 'Shorts' },
          { label: 'Pullover & Strickjacken' },
          { label: 'Sportkleidung' },
          {
            label: 'Schuhe', children: [
              { label: 'Sneakers' },
              { label: 'Sandalen' },
              { label: 'Stiefel' },
              { label: 'Ballerinas' },
            ]
          },
          { label: 'Accessoires' },
        ]
      },
      {
        label: 'Jungs', children: [
          {
            label: 'Jacken & Mäntel', children: [
              { label: 'Winterjacken' },
              { label: 'Übergangsjacken' },
              { label: 'Regenjacken' },
            ]
          },
          { label: 'Shirts & T-Shirts' },
          {
            label: 'Hosen & Jeans', children: [
              { label: 'Jeans' },
              { label: 'Jogginghosen' },
              { label: 'Cargo-Hosen' },
              { label: 'Shorts' },
            ]
          },
          { label: 'Pullover & Hoodies' },
          { label: 'Sportkleidung' },
          {
            label: 'Schuhe', children: [
              { label: 'Sneakers' },
              { label: 'Sandalen' },
              { label: 'Stiefel' },
              { label: 'Sportschuhe' },
            ]
          },
          { label: 'Accessoires' },
        ]
      },
      {
        label: 'Spielzeug & Freizeit', children: [
          { label: 'Puppen & Zubehör' },
          { label: 'Fahrzeuge & Ferngesteuertes' },
          { label: 'Bausteine & Konstruktion' },
          { label: 'Brettspiele & Puzzle' },
          { label: 'Kuscheltiere & Plüsch' },
          { label: 'Outdoor-Spielzeug' },
          { label: 'Bücher & Lernspiele' },
        ]
      },
    ]
  },

  {
    label: '📦 Sonstiges', children: [
      {
        label: 'Elektronik', children: [
          { label: 'Handys & Smartphones' },
          { label: 'Tablets & E-Reader' },
          { label: 'Laptops & Computer' },
          { label: 'Kopfhörer & Lautsprecher' },
          { label: 'Zubehör & Kabel' },
          { label: 'Kameras & Fotografie' },
          { label: 'Gaming & Konsolen' },
          { label: 'Smartwatches & Wearables' },
        ]
      },
      {
        label: 'Home & Living', children: [
          { label: 'Dekoration' },
          { label: 'Küche & Kochen' },
          { label: 'Bettwäsche & Textilien' },
          { label: 'Beleuchtung' },
          { label: 'Möbel & Einrichtung' },
          { label: 'Pflanzen & Garten' },
        ]
      },
      {
        label: 'Sport & Outdoor', children: [
          { label: 'Fitness & Training' },
          { label: 'Fahrräder & Zubehör' },
          { label: 'Camping & Outdoor' },
          { label: 'Wintersport' },
          { label: 'Wassersport' },
          { label: 'Mannschaftssport' },
        ]
      },
      {
        label: 'Unterhaltung', children: [
          { label: 'Bücher' },
          { label: 'Musik & CDs' },
          { label: 'Filme & DVDs' },
          { label: 'Videospiele' },
          { label: 'Sammlerstücke' },
        ]
      },
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
      const path = buildPath(stack, item.label)
      onChange(path)
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
