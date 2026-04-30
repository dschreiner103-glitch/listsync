'use client'

const PLT = {
  ebay:         { name:'eBay',          bg:'bg-yellow-50',  text:'text-yellow-800', border:'border-yellow-200', dot:'#ca8a04' },
  vinted:       { name:'Vinted',        bg:'bg-teal-50',    text:'text-teal-700',   border:'border-teal-200',   dot:'#0d9488' },
  kleinanzeigen:{ name:'Kleinanzeigen', bg:'bg-orange-50',  text:'text-orange-800', border:'border-orange-200', dot:'#ea580c' },
}

export function PlatformBadge({ plt }) {
  const p = PLT[plt]; if (!p) return null
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${p.bg} ${p.text} ${p.border}`}>
      <span style={{width:5,height:5,borderRadius:'50%',background:p.dot,display:'inline-block'}}/>
      {p.name}
    </span>
  )
}

export function StatusBadge({ status }) {
  const map = {
    aktiv:   { bg:'bg-green-100', text:'text-green-700', label:'Aktiv' },
    verkauft:{ bg:'bg-blue-100',  text:'text-blue-700',  label:'Verkauft' },
    inaktiv: { bg:'bg-gray-100',  text:'text-gray-500',  label:'Inaktiv' }
  }
  const s = map[status] || map.inaktiv
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>{s.label}</span>
}

export const PLATFORMS = PLT
export const CONDITIONS = ['Neu mit Etikett','Neu ohne Etikett','Sehr gut','Gut','Akzeptabel']

export const CATEGORIES = [
  'Damen – Kleidung','Damen – Schuhe','Damen – Taschen & Accessoires',
  'Herren – Kleidung','Herren – Schuhe','Herren – Accessoires',
  'Kinder – Kleidung','Kinder – Schuhe','Kinder – Spielzeug',
  'Elektronik & Gadgets','Handys & Tablets','Computer & Laptops',
  'Sport & Outdoor','Haushalt & Garten','Bücher & Medien',
  'Schmuck & Uhren','Kosmetik & Pflege','Sonstiges'
]

export const BRANDS = [
  'Nike','Adidas','Zara','H&M','Puma','New Balance','Levi\'s','Tommy Hilfiger',
  'Boss','Gucci','Louis Vuitton','Stone Island','The North Face','Carhartt',
  'Jordan','Supreme','Stüssy','Off-White','Balenciaga','Apple','Samsung','Sony',
  'Andere'
]

export const COLORS = [
  'Schwarz','Weiß','Grau','Beige','Braun','Blau','Hellblau','Navy',
  'Rot','Pink','Lila','Grün','Gelb','Orange','Mehrfarbig','Gemustert'
]

export const SIZES_CLOTHING = ['XXS','XS','S','M','L','XL','XXL','3XL','4XL','Einheitsgröße']
export const SIZES_SHOES    = ['35','36','37','38','39','40','41','42','43','44','45','46','47','48']
export const SIZES_KIDS     = ['56','62','68','74','80','86','92','98','104','110','116','122','128','134','140','146','152','158','164']

export function getSizes(category) {
  if (!category) return SIZES_CLOTHING
  const c = category.toLowerCase()
  if (c.includes('schuh')) return SIZES_SHOES
  if (c.includes('kinder')) return SIZES_KIDS
  if (c.includes('kleidung') || c.includes('damen') || c.includes('herren')) return SIZES_CLOTHING
  return []
}

export const SHIPPING_OPTIONS = [
  { id: 'vinted',   label: 'Vinted-Versand',  desc: 'Einfach & günstig über Vinted' },
  { id: 'paket',    label: 'Paket (DHL/DPD)',  desc: 'Selbst versenden' },
  { id: 'abholung', label: 'Nur Abholung',     desc: 'Kein Versand möglich' },
]

export const SHIP_SIZES = [
  { id: 'S', label: 'Klein',  desc: 'Päckchen S · bis 2 kg' },
  { id: 'M', label: 'Mittel', desc: 'Paket M · bis 10 kg' },
  { id: 'L', label: 'Groß',   desc: 'Paket L/XL · bis 31 kg' },
]

export const CARD_COLORS = ['#e0e7ff','#fef3c7','#d1fae5','#fce7f3','#f0fdf4']

export function optimizeTitle(t, id) {
  if (!t) return ''
  if (id === 'ebay')          return (t + ' | Top Zustand ✅').substring(0, 80)
  if (id === 'vinted')        return t.length > 60 ? t.substring(0,57)+'…' : t
  if (id === 'kleinanzeigen') return t + ' (VHB)'
  return t
}

export const fmt    = n => Number(n).toFixed(2).replace('.', ',') + ' €'
export const profit = l => l.price - l.buyPrice
