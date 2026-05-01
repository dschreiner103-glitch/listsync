'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { PLATFORMS } from '@/components/Badge'

function fmt(n) { return (n||0).toLocaleString('de-DE',{style:'currency',currency:'EUR'}) }

export default function BelegPage() {
  const { id } = useParams()
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

  const receiptNo = `RE-${new Date(listing.updatedAt||listing.createdAt).getFullYear()}-${String(id).padStart(4,'0')}`
  const soldDate  = new Date(listing.updatedAt||listing.createdAt).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'})
  const platform  = (listing.platforms||[]).map(p => PLATFORMS[p]?.name||p).join(', ') || '—'
  const fee       = (listing.platforms||[]).includes('ebay') ? listing.price * 0.13 : 0
  const profit    = listing.price - (listing.buyPrice||0) - fee

  const shopName  = settings.shopName  || 'Verkäufer'
  const address   = settings.address   || ''
  const taxId     = settings.taxId     || ''
  const isKlein   = settings.kleinunternehmer !== false

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; }
        .page { max-width: 680px; margin: 40px auto; background: white; padding: 48px; box-shadow: 0 4px 24px rgba(0,0,0,.08); border-radius: 12px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #f3f4f6; }
        .brand { font-size: 28px; font-weight: 900; color: #4f46e5; letter-spacing: -1px; }
        .brand span { font-size: 12px; font-weight: 600; color: #6b7280; display: block; letter-spacing: 0; margin-top: 2px; }
        .meta { text-align: right; }
        .meta h2 { font-size: 22px; font-weight: 800; color: #111827; }
        .meta p { font-size: 13px; color: #6b7280; margin-top: 4px; }
        .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
        .party h4 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #9ca3af; margin-bottom: 8px; }
        .party p { font-size: 14px; color: #374151; line-height: 1.6; }
        .party .name { font-weight: 700; font-size: 15px; color: #111827; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        thead th { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #9ca3af; padding: 10px 12px; text-align: left; border-bottom: 2px solid #f3f4f6; }
        thead th:last-child { text-align: right; }
        tbody td { padding: 14px 12px; font-size: 14px; color: #374151; border-bottom: 1px solid #f9fafb; vertical-align: top; }
        tbody td:last-child { text-align: right; font-weight: 600; color: #111827; }
        .totals { margin-left: auto; width: 280px; }
        .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #374151; }
        .totals .row.total { border-top: 2px solid #e5e7eb; margin-top: 6px; padding-top: 10px; font-size: 17px; font-weight: 800; color: #111827; }
        .tax-note { margin-top: 32px; padding: 16px; background: #f9fafb; border-radius: 8px; font-size: 12px; color: #6b7280; line-height: 1.6; border: 1px solid #f3f4f6; }
        .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #9ca3af; }
        .print-bar { position: fixed; bottom: 24px; right: 24px; display: flex; gap: 12px; }
        .print-bar button { padding: 12px 24px; border-radius: 12px; border: none; font-size: 14px; font-weight: 700; cursor: pointer; }
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
            <div className="brand">ListSync<span>Reseller-Tool</span></div>
          </div>
          <div className="meta">
            <h2>Beleg</h2>
            <p>Nr. {receiptNo}</p>
            <p>Datum: {soldDate}</p>
          </div>
        </div>

        {/* Parties */}
        <div className="parties">
          <div className="party">
            <h4>Verkäufer</h4>
            <p className="name">{shopName}</p>
            {address && <p style={{whiteSpace:'pre-line'}}>{address}</p>}
            {taxId && <p>Steuer-Nr.: {taxId}</p>}
          </div>
          <div className="party">
            <h4>Verkauft über</h4>
            <p className="name">{platform}</p>
            <p>Verkaufsdatum: {soldDate}</p>
          </div>
        </div>

        {/* Items table */}
        <table>
          <thead>
            <tr>
              <th>Artikel</th>
              <th>Zustand</th>
              <th>Plattform</th>
              <th>Preis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>{listing.title}</strong>
                {listing.brand && <div style={{fontSize:12,color:'#9ca3af',marginTop:2}}>Marke: {listing.brand}</div>}
                {listing.size  && <div style={{fontSize:12,color:'#9ca3af'}}>Größe: {listing.size}</div>}
              </td>
              <td>{listing.condition || '—'}</td>
              <td>{platform}</td>
              <td>{fmt(listing.price)}</td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="totals">
          <div className="row"><span>Verkaufspreis</span><span>{fmt(listing.price)}</span></div>
          {fee > 0 && <div className="row"><span>Plattform-Gebühr (13%)</span><span>−{fmt(fee)}</span></div>}
          {listing.buyPrice > 0 && <div className="row" style={{color:'#9ca3af',fontSize:13}}><span>Einkaufspreis (intern)</span><span>−{fmt(listing.buyPrice)}</span></div>}
          <div className="row total"><span>Nettogewinn</span><span style={{color: profit >= 0 ? '#16a34a' : '#dc2626'}}>{fmt(profit)}</span></div>
        </div>

        {/* Tax note */}
        <div className="tax-note">
          {isKlein
            ? '⚖️ Steuerhinweis: Gemäß §19 Abs. 1 UStG (Kleinunternehmerregelung) wird keine Umsatzsteuer berechnet und ausgewiesen.'
            : `⚖️ Steuerhinweis: Im ausgewiesenen Betrag ist die gesetzliche Mehrwertsteuer enthalten. Steuer-Nr.: ${taxId || '(bitte in Einstellungen hinterlegen)'}`
          }
        </div>

        {/* Footer */}
        <div className="footer">
          <span>Erstellt mit ListSync · {new Date().toLocaleDateString('de-DE')}</span>
          <span>{receiptNo}</span>
        </div>
      </div>

      {/* Print bar */}
      <div className="print-bar">
        <button className="btn-close" onClick={() => window.close()}>Schließen</button>
        <button className="btn-print" onClick={() => window.print()}>🖨️ Als PDF drucken</button>
      </div>
    </>
  )
}
