'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PLATFORMS } from '@/components/Badge'

function fmt(n) { return (n||0).toLocaleString('de-DE',{style:'currency',currency:'EUR'}) }

export default function MonthlyReceipt() {
  const params   = useSearchParams()
  const ids      = params.get('ids')?.split(',').filter(Boolean) || []
  const month    = params.get('month') || ''
  const [listings, setListings] = useState([])
  const [settings, setSettings] = useState({})
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/listings').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([ls, s]) => {
      const filtered = Array.isArray(ls) ? ls.filter(l => ids.includes(String(l.id))) : []
      setListings(filtered)
      setSettings(s || {})
      setLoading(false)
    })
  }, [])

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'sans-serif',color:'#9ca3af'}}>Lade…</div>

  const totalRevenue = listings.reduce((s,l) => s + l.price, 0)
  const totalProfit  = listings.reduce((s,l) => s + l.price - (l.buyPrice||0), 0)
  const shopName = settings.shopName || 'Verkäufer'
  const isKlein  = settings.kleinunternehmer !== false
  const receiptNo = `SAM-${new Date().getFullYear()}-${month.replace(/\s/g,'-')}`

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; }
        .page { max-width: 720px; margin: 40px auto; background: white; padding: 48px; box-shadow: 0 4px 24px rgba(0,0,0,.08); border-radius: 12px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 2px solid #f3f4f6; }
        .brand { font-size: 26px; font-weight: 900; color: #4f46e5; }
        .brand span { font-size: 12px; font-weight: 600; color: #6b7280; display: block; }
        .meta h2 { font-size: 20px; font-weight: 800; color: #111; text-align:right; }
        .meta p { font-size: 13px; color: #6b7280; text-align:right; margin-top: 3px; }
        .seller { margin-bottom: 28px; }
        .seller h4 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing:.08em; color: #9ca3af; margin-bottom: 6px; }
        .seller p { font-size: 14px; color: #374151; }
        .seller .name { font-weight: 700; font-size: 15px; color: #111; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
        thead th { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing:.06em; color: #9ca3af; padding: 8px 10px; text-align: left; border-bottom: 2px solid #f3f4f6; }
        tbody td { padding: 10px 10px; border-bottom: 1px solid #f9fafb; color: #374151; vertical-align: middle; }
        tbody td:last-child, thead th:last-child { text-align: right; }
        .summary { display: flex; justify-content: flex-end; gap: 48px; margin-top: 8px; padding: 16px; background: #f9fafb; border-radius: 10px; }
        .summary div { text-align: right; }
        .summary .lbl { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing:.05em; }
        .summary .val { font-size: 20px; font-weight: 900; color: #111; margin-top: 2px; }
        .summary .val.green { color: #16a34a; }
        .tax-note { margin-top: 28px; padding: 14px; background: #f9fafb; border-radius: 8px; font-size: 12px; color: #6b7280; line-height: 1.6; border: 1px solid #f3f4f6; }
        .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #f3f4f6; display: flex; justify-content: space-between; font-size: 12px; color: #9ca3af; }
        .print-bar { position: fixed; bottom: 24px; right: 24px; display: flex; gap: 10px; }
        .print-bar button { padding: 12px 20px; border-radius: 12px; border: none; font-size: 14px; font-weight: 700; cursor: pointer; }
        .btn-p { background: #4f46e5; color: white; }
        .btn-c { background: #f3f4f6; color: #374151; }
        @media print { body { background: white; } .page { margin:0; padding:32px; box-shadow:none; border-radius:0; max-width:none; } .print-bar { display:none; } }
      `}</style>

      <div className="page">
        <div className="header">
          <div><div className="brand">ListSync<span>Reseller-Tool</span></div></div>
          <div className="meta">
            <h2>Sammelbeleg</h2>
            <p>Zeitraum: {month}</p>
            <p>Nr. {receiptNo}</p>
            <p>Erstellt: {new Date().toLocaleDateString('de-DE')}</p>
          </div>
        </div>

        <div className="seller">
          <h4>Verkäufer</h4>
          <p className="name">{shopName}</p>
          {settings.address && <p style={{whiteSpace:'pre-line'}}>{settings.address}</p>}
          {settings.taxId   && <p>Steuer-Nr.: {settings.taxId}</p>}
        </div>

        <table>
          <thead>
            <tr><th>Artikel</th><th>Plattform</th><th>Datum</th><th>EK</th><th>VK</th><th>Gewinn</th></tr>
          </thead>
          <tbody>
            {listings.map((l,i) => {
              const plt = (l.platforms||[]).map(p=>PLATFORMS[p]?.name||p).join(', ')||'—'
              const profit = l.price-(l.buyPrice||0)
              return (
                <tr key={l.id}>
                  <td><strong>{l.title}</strong></td>
                  <td style={{color:'#6b7280'}}>{plt}</td>
                  <td style={{color:'#6b7280',whiteSpace:'nowrap'}}>{new Date(l.updatedAt||l.createdAt).toLocaleDateString('de')}</td>
                  <td style={{color:'#6b7280'}}>{fmt(l.buyPrice||0)}</td>
                  <td style={{fontWeight:600}}>{fmt(l.price)}</td>
                  <td style={{fontWeight:700,color:profit>=0?'#16a34a':'#dc2626'}}>{fmt(profit)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="summary">
          <div><div className="lbl">Verkäufe</div><div className="val">{listings.length}</div></div>
          <div><div className="lbl">Gesamtumsatz</div><div className="val">{fmt(totalRevenue)}</div></div>
          <div><div className="lbl">Gesamtgewinn</div><div className={`val green`}>{fmt(totalProfit)}</div></div>
        </div>

        <div className="tax-note">
          {isKlein
            ? '⚖️ Gemäß §19 Abs. 1 UStG (Kleinunternehmerregelung) wird keine Umsatzsteuer berechnet und ausgewiesen.'
            : `⚖️ Im ausgewiesenen Betrag ist die gesetzliche Mehrwertsteuer enthalten.${settings.taxId ? ` Steuer-Nr.: ${settings.taxId}` : ''}`}
        </div>

        <div className="footer">
          <span>Erstellt mit ListSync · {new Date().toLocaleDateString('de-DE')}</span>
          <span>{receiptNo}</span>
        </div>
      </div>

      <div className="print-bar">
        <button className="btn-c" onClick={() => window.close()}>Schließen</button>
        <button className="btn-p" onClick={() => window.print()}>🖨️ Als PDF drucken</button>
      </div>
    </>
  )
}
