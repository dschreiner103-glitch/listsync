'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PLATFORMS } from '@/components/Badge'

function fmt(n) { return (n||0).toLocaleString('de-DE',{style:'currency',currency:'EUR'}) }

function MonthlyReceiptInner() {
  const params         = useSearchParams()
  const ids            = params.get('ids')?.split(',').filter(Boolean) || []
  const month          = params.get('month') || ''
  const receiptNoParam = params.get('rn') || null
  const isPurchase     = params.get('type') === 'einkauf'

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

  const year      = new Date().getFullYear()
  const receiptNo = receiptNoParam || `SAM-${year}-${month.replace(/\s/g,'-').replace(/[^a-zA-Z0-9-]/g,'')}`
  const issueDate = new Date().toLocaleDateString('de-DE', {day:'2-digit',month:'2-digit',year:'numeric'})
  const shopName  = settings.shopName || 'Verkäufer'
  const isKlein   = settings.kleinunternehmer !== false

  const totalRevenue = listings.reduce((s,l) => s + (isPurchase ? (l.buyPrice||0) : (l.price||0)), 0)
  const totalFees    = !isPurchase ? listings.reduce((s,l) => {
    return s + ((l.platforms||[]).includes('ebay') ? (l.price||0)*0.13 : 0)
  }, 0) : 0
  const totalNet     = totalRevenue - totalFees

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; }
        .page { max-width: 740px; margin: 40px auto; background: white; padding: 48px; box-shadow: 0 4px 24px rgba(0,0,0,.08); border-radius: 12px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 2px solid #f3f4f6; }
        .brand { font-size: 24px; font-weight: 900; color: #4f46e5; }
        .brand span { font-size: 11px; font-weight: 600; color: #6b7280; display: block; }
        .meta { text-align: right; }
        .meta h2 { font-size: 18px; font-weight: 800; color: #111; }
        .meta p { font-size: 12px; color: #6b7280; margin-top: 3px; }
        .seller { margin-bottom: 28px; }
        .seller h4 { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing:.1em; color: #9ca3af; margin-bottom: 6px; }
        .seller .name { font-weight: 700; font-size: 14px; color: #111; margin-bottom: 2px; }
        .seller p { font-size: 13px; color: #374151; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
        thead th { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing:.07em; color: #9ca3af; padding: 8px 8px; text-align: left; border-bottom: 2px solid #f3f4f6; }
        tbody td { padding: 10px 8px; border-bottom: 1px solid #f9fafb; color: #374151; vertical-align: middle; }
        tbody td:last-child, thead th:last-child { text-align: right; }
        tfoot td { padding: 10px 8px; font-weight: 700; color: #111; font-size: 13px; border-top: 2px solid #e5e7eb; }
        tfoot td:last-child { text-align: right; color: #4f46e5; }
        .summary { display: flex; justify-content: flex-end; gap: 40px; margin-top: 8px; padding: 16px; background: #f9fafb; border-radius: 10px; }
        .summary div { text-align: right; }
        .summary .lbl { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing:.05em; }
        .summary .val { font-size: 18px; font-weight: 900; color: #111; margin-top: 2px; }
        .summary .val.green { color: #16a34a; }
        .info-box { margin-top: 24px; padding: 12px 16px; background: #f9fafb; border-radius: 8px; font-size: 11px; color: #6b7280; line-height: 1.7; border: 1px solid #f3f4f6; }
        .legal { margin-top: 12px; padding: 12px 16px; background: #fffbeb; border-radius: 8px; font-size: 11px; color: #92400e; border: 1px solid #fde68a; line-height: 1.6; }
        .footer { margin-top: 28px; padding-top: 18px; border-top: 1px solid #f3f4f6; display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; }
        .print-bar { position: fixed; bottom: 24px; right: 24px; display: flex; gap: 10px; }
        .print-bar button { padding: 11px 20px; border-radius: 12px; border: none; font-size: 13px; font-weight: 700; cursor: pointer; }
        .btn-p { background: #4f46e5; color: white; }
        .btn-c { background: #f3f4f6; color: #374151; }
        @media print { body { background: white; } .page { margin:0; padding:32px; box-shadow:none; border-radius:0; max-width:none; } .print-bar { display:none; } }
      `}</style>

      <div className="page">
        <div className="header">
          <div><div className="brand">ListSync<span>Reseller-Management</span></div></div>
          <div className="meta">
            <h2>{isPurchase ? 'Sammelbeleg Einkäufe' : 'Sammelbeleg Verkäufe'}</h2>
            <p><strong>Belegnummer:</strong> {receiptNo}</p>
            <p><strong>Zeitraum:</strong> {month || 'Alle'}</p>
            <p><strong>Ausstellungsdatum:</strong> {issueDate}</p>
          </div>
        </div>

        <div className="seller">
          <h4>{isPurchase ? 'Käufer / Betrieb' : 'Verkäufer / Betrieb'}</h4>
          <p className="name">{shopName}</p>
          {settings.address && <p style={{whiteSpace:'pre-line'}}>{settings.address}</p>}
          {settings.taxId   && <p>Steuernummer: {settings.taxId}</p>}
        </div>

        <table>
          <thead>
            <tr>
              <th style={{width:'38%'}}>Artikel</th>
              <th>Plattform</th>
              <th>Datum</th>
              {!isPurchase && <th>EK</th>}
              <th>{isPurchase ? 'Einkaufspreis' : 'Verkaufspreis'}</th>
              {!isPurchase && <th>Gebühr</th>}
              <th>{isPurchase ? 'Betrag' : 'Nettoerlös'}</th>
            </tr>
          </thead>
          <tbody>
            {listings.map(l => {
              const plt    = (l.platforms||[]).map(p=>PLATFORMS[p]?.name||p).join(', ')||'—'
              const date   = new Date(l.updatedAt||l.createdAt).toLocaleDateString('de-DE')
              const fee    = (!isPurchase && (l.platforms||[]).includes('ebay')) ? l.price*0.13 : 0
              const net    = isPurchase ? l.buyPrice : (l.price - fee)
              return (
                <tr key={l.id}>
                  <td><strong style={{fontSize:12}}>{l.title}</strong>
                    {l.brand && <div style={{fontSize:10,color:'#9ca3af'}}>Marke: {l.brand}</div>}
                  </td>
                  <td style={{color:'#6b7280'}}>{plt}</td>
                  <td style={{color:'#6b7280',whiteSpace:'nowrap'}}>{date}</td>
                  {!isPurchase && <td style={{color:'#9ca3af'}}>{l.buyPrice > 0 ? fmt(l.buyPrice) : '—'}</td>}
                  <td style={{fontWeight:600}}>{fmt(isPurchase ? l.buyPrice : l.price)}</td>
                  {!isPurchase && <td style={{color:'#dc2626'}}>{fee > 0 ? '−' + fmt(fee) : '—'}</td>}
                  <td style={{fontWeight:700,color:net>=0?'#16a34a':'#dc2626'}}>{fmt(net)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={isPurchase ? 3 : 5}>Gesamt ({listings.length} Positionen)</td>
              {!isPurchase && <td style={{color:'#dc2626',textAlign:'right'}}>−{fmt(totalFees)}</td>}
              <td>{fmt(totalNet)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="summary">
          <div><div className="lbl">Positionen</div><div className="val">{listings.length}</div></div>
          {!isPurchase && <div><div className="lbl">Gesamtumsatz</div><div className="val">{fmt(totalRevenue)}</div></div>}
          {!isPurchase && totalFees > 0 && <div><div className="lbl">Gebühren gesamt</div><div className="val" style={{color:'#dc2626'}}>−{fmt(totalFees)}</div></div>}
          <div><div className="lbl">{isPurchase ? 'Gesamteinkauf' : 'Nettoerlös'}</div><div className="val green">{fmt(totalNet)}</div></div>
        </div>

        <div className="info-box">
          <strong>Pflichtangaben gem. § 14 UStG:</strong><br/>
          Belegnummer: {receiptNo} · Ausstellungsdatum: {issueDate} · Abrechnungszeitraum: {month || 'Alle'}<br/>
          {isPurchase ? 'Käufer' : 'Verkäufer'}: {shopName}{settings.address ? ', ' + settings.address.replace(/\n/g,', ') : ''}
          {settings.taxId ? ' · Steuernummer: ' + settings.taxId : ''}
        </div>

        <div className="legal">
          {isKlein
            ? '⚖️ Gemäß § 19 Abs. 1 UStG (Kleinunternehmerregelung) wird keine Umsatzsteuer ausgewiesen.'
            : `⚖️ Im ausgewiesenen Betrag ist die gesetzliche Mehrwertsteuer (19 %) enthalten.${settings.taxId ? ' Steuernummer: ' + settings.taxId : ''}`
          }
        </div>

        <div className="footer">
          <span>Erstellt mit ListSync · {issueDate}</span>
          <span>{receiptNo}</span>
        </div>
      </div>

      <div className="print-bar">
        <button className="btn-c" onClick={() => window.close()}>Schließen</button>
        <button className="btn-p" onClick={() => window.print()}>🖨️ Als PDF speichern</button>
      </div>
    </>
  )
}

export default function MonthlyReceipt() {
  return (
    <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'sans-serif',color:'#9ca3af'}}>Lade…</div>}>
      <MonthlyReceiptInner />
    </Suspense>
  )
}
