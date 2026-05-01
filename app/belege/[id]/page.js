'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { PLATFORMS } from '@/components/Badge'

function fmt(n) { return (n||0).toLocaleString('de-DE',{style:'currency',currency:'EUR'}) }

function BelegContent() {
  const { id }         = useParams()
  const params         = useSearchParams()
  const receiptNoParam = params.get('rn') || null
  const isPurchase     = params.get('type') === 'purchase'

  const [listing, setListing]   = useState(null)
  const [settings, setSettings] = useState({})
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/listings/${id}`).then(r => r.json()).catch(() => null),
      fetch('/api/settings').then(r => r.json()).catch(() => ({})),
    ]).then(([l, s]) => {
      setListing(l)
      setSettings(s || {})
      setLoading(false)
    })
  }, [id])

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'sans-serif',color:'#9ca3af'}}>Lade Beleg…</div>
  if (!listing) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'sans-serif',color:'#ef4444'}}>Beleg nicht gefunden</div>

  const year       = new Date().getFullYear()
  const receiptNo  = receiptNoParam || `RE-${year}-${String(id).padStart(4,'0')}`
  const issueDate  = new Date().toLocaleDateString('de-DE', {day:'2-digit',month:'2-digit',year:'numeric'})
  const soldDate   = new Date(listing.updatedAt||listing.createdAt).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'})
  const platform   = (listing.platforms||[]).map(p => PLATFORMS[p]?.name||p).join(', ') || '—'
  const fee        = (!isPurchase && (listing.platforms||[]).includes('ebay')) ? listing.price * 0.13 : 0
  const netAmount  = isPurchase ? listing.buyPrice : (listing.price - fee)

  const shopName = settings.shopName || 'Verkäufer'
  const isKlein  = settings.kleinunternehmer !== false

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; color: #111827; }
        .page { max-width: 680px; margin: 40px auto; background: white; padding: 48px; box-shadow: 0 4px 24px rgba(0,0,0,.08); border-radius: 12px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #f3f4f6; }
        .brand { font-size: 26px; font-weight: 900; color: #4f46e5; letter-spacing: -1px; }
        .brand span { font-size: 11px; font-weight: 600; color: #6b7280; display: block; letter-spacing: 0; margin-top: 2px; }
        .meta { text-align: right; }
        .meta h2 { font-size: 20px; font-weight: 800; color: #111827; }
        .meta p { font-size: 12px; color: #6b7280; margin-top: 3px; }
        .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-bottom: 32px; }
        .party h4 { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #9ca3af; margin-bottom: 6px; }
        .party .name { font-weight: 700; font-size: 14px; color: #111827; margin-bottom: 2px; }
        .party p { font-size: 13px; color: #374151; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        thead th { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #9ca3af; padding: 8px 10px; text-align: left; border-bottom: 2px solid #f3f4f6; }
        thead th:last-child { text-align: right; }
        tbody td { padding: 14px 10px; font-size: 13px; color: #374151; border-bottom: 1px solid #f9fafb; vertical-align: top; }
        tbody td:last-child { text-align: right; font-weight: 700; color: #111827; }
        .totals { margin-left: auto; width: 260px; border-top: 2px solid #f3f4f6; padding-top: 12px; }
        .totals .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: #374151; }
        .totals .row.bold { font-weight: 800; font-size: 16px; color: #111827; margin-top: 6px; border-top: 1px solid #e5e7eb; padding-top: 8px; }
        .info-box { margin-top: 28px; padding: 14px 16px; background: #f9fafb; border-radius: 8px; font-size: 11.5px; color: #6b7280; line-height: 1.7; border: 1px solid #f3f4f6; }
        .info-box strong { color: #374151; }
        .legal { margin-top: 16px; padding: 12px 16px; background: #fffbeb; border-radius: 8px; font-size: 11px; color: #92400e; border: 1px solid #fde68a; line-height: 1.6; }
        .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #f3f4f6; display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; }
        .print-bar { position: fixed; bottom: 24px; right: 24px; display: flex; gap: 10px; z-index: 100; }
        .print-bar button { padding: 11px 22px; border-radius: 12px; border: none; font-size: 13px; font-weight: 700; cursor: pointer; }
        .btn-print { background: #4f46e5; color: white; }
        .btn-print:hover { background: #4338ca; }
        .btn-close { background: #f3f4f6; color: #374151; }
        .btn-close:hover { background: #e5e7eb; }
        @media print {
          body { background: white; }
          .page { max-width: none; margin: 0; padding: 32px; box-shadow: none; border-radius: 0; }
          .print-bar { display: none; }
        }
      `}</style>

      <div className="page">
        {/* Header */}
        <div className="header">
          <div>
            <div className="brand">ListSync<span>Reseller-Management</span></div>
          </div>
          <div className="meta">
            <h2>{isPurchase ? 'Einkaufsbeleg' : 'Verkaufsbeleg'}</h2>
            <p><strong>Belegnummer:</strong> {receiptNo}</p>
            <p><strong>Ausstellungsdatum:</strong> {issueDate}</p>
            <p><strong>Leistungsdatum:</strong> {soldDate}</p>
          </div>
        </div>

        {/* Parties */}
        <div className="parties">
          <div className="party">
            <h4>{isPurchase ? 'Käufer / Empfänger' : 'Verkäufer / Leistungserbringer'}</h4>
            <p className="name">{shopName}</p>
            {settings.address && <p style={{whiteSpace:'pre-line'}}>{settings.address}</p>}
            {settings.taxId && <p>Steuernummer: {settings.taxId}</p>}
          </div>
          <div className="party">
            <h4>{isPurchase ? 'Verkauft über / Herkunft' : 'Verkauft über / Plattform'}</h4>
            <p className="name">{platform}</p>
            <p>{isPurchase ? 'Einkaufsdatum' : 'Verkaufsdatum'}: {soldDate}</p>
          </div>
        </div>

        {/* Items table */}
        <table>
          <thead>
            <tr>
              <th style={{width:'45%'}}>Artikel / Leistungsbeschreibung</th>
              <th>Zustand</th>
              <th>Plattform</th>
              <th>{isPurchase ? 'Einkaufspreis' : 'Verkaufspreis'}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>{listing.title}</strong>
                {listing.brand && <div style={{fontSize:11,color:'#9ca3af',marginTop:2}}>Marke: {listing.brand}</div>}
                {listing.size  && <div style={{fontSize:11,color:'#9ca3af'}}>Größe: {listing.size}</div>}
                {listing.color && <div style={{fontSize:11,color:'#9ca3af'}}>Farbe: {listing.color}</div>}
              </td>
              <td style={{fontSize:12}}>{listing.condition || '—'}</td>
              <td style={{fontSize:12}}>{platform}</td>
              <td>{fmt(isPurchase ? listing.buyPrice : listing.price)}</td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="totals">
          {!isPurchase && (
            <div className="row"><span>Bruttoerlös</span><span>{fmt(listing.price)}</span></div>
          )}
          {fee > 0 && (
            <div className="row"><span>Plattformgebühr eBay (13 %)</span><span>− {fmt(fee)}</span></div>
          )}
          {!isPurchase && listing.buyPrice > 0 && (
            <div className="row" style={{color:'#9ca3af',fontSize:12}}><span>Einkaufswert (intern)</span><span>− {fmt(listing.buyPrice)}</span></div>
          )}
          <div className="row bold">
            <span>{isPurchase ? 'Einkaufsbetrag' : 'Nettoerlös'}</span>
            <span style={{color: netAmount >= 0 ? '#16a34a' : '#dc2626'}}>{fmt(netAmount)}</span>
          </div>
        </div>

        {/* Info box */}
        <div className="info-box">
          <strong>Pflichtangaben gem. § 14 UStG:</strong><br/>
          Belegnummer: {receiptNo} · Ausstellungsdatum: {issueDate} · Leistungsdatum: {soldDate}<br/>
          Leistungserbringer: {shopName}{settings.address ? ', ' + settings.address.replace(/\n/g,', ') : ''}
          {settings.taxId ? ' · Steuernummer: ' + settings.taxId : ''}
        </div>

        {/* Tax note */}
        <div className="legal">
          {isKlein
            ? '⚖️ Gemäß § 19 Abs. 1 UStG (Kleinunternehmerregelung) wird keine Umsatzsteuer ausgewiesen.'
            : `⚖️ Im ausgewiesenen Betrag ist die gesetzliche Mehrwertsteuer (19 %) enthalten.${settings.taxId ? ' Steuernummer: ' + settings.taxId : ''}`
          }
        </div>

        {/* Footer */}
        <div className="footer">
          <span>Erstellt mit ListSync · {issueDate}</span>
          <span>{receiptNo}</span>
        </div>
      </div>

      {/* Print bar */}
      <div className="print-bar">
        <button className="btn-close" onClick={() => window.close()}>Schließen</button>
        <button className="btn-print" onClick={() => window.print()}>🖨️ Als PDF speichern</button>
      </div>
    </>
  )
}

export default function BelegPage() {
  return (
    <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'sans-serif',color:'#9ca3af'}}>Lade…</div>}>
      <BelegContent />
    </Suspense>
  )
}
