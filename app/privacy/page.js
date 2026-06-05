'use client'
import { useEffect, useState } from 'react'

export default function PrivacyPage() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: dark ? '#0d1117' : '#f0f2f7', padding: '48px 16px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', background: dark ? '#161b22' : '#fff', borderRadius: 16, padding: '48px', border: dark ? '1px solid #30363d' : '1px solid #e8ecf2', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>L</span>
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, color: dark ? '#e6edf3' : '#111827', fontFamily: 'Inter, sans-serif' }}>ListSync</span>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: dark ? '#e6edf3' : '#111827', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>Datenschutzerklärung</h1>
        <p style={{ color: dark ? '#8b949e' : '#9ca3af', fontSize: 14, marginBottom: 40 }}>Zuletzt aktualisiert: Juni 2025</p>

        <Section dark={dark} title="1. Überblick">
          ListSync ist ein Crosslisting-Tool für Reseller. Die Chrome-Extension von ListSync hilft dabei,
          Artikel automatisch auf Plattformen wie Vinted, Kleinanzeigen und eBay einzustellen.
          Diese Datenschutzerklärung beschreibt, welche Daten wir verarbeiten und wie wir damit umgehen.
        </Section>

        <Section dark={dark} title="2. Welche Daten werden verarbeitet?">
          <b>Listing-Daten:</b> Titel, Beschreibung, Preis, Bilder und Kategorie deiner Artikel – ausschließlich
          um Formulare auf den Zielplattformen auszufüllen. Diese Daten verlassen nicht deinen Browser,
          außer zur direkten Übertragung an die gewählte Plattform (Vinted, Kleinanzeigen, eBay).
          <br /><br />
          <b>Session-Daten:</b> Deine Login-Session auf project-dle5b.vercel.app wird genutzt,
          um Listings abzurufen. Es werden keine Passwörter oder Authentifizierungstoken gespeichert.
          <br /><br />
          <b>Vinted-Bestellhistorie (optional):</b> Wenn du den Vinted-Sync nutzt, werden deine
          abgeschlossenen Verkäufe aus deiner Vinted-Session ausgelesen und in ListSync importiert.
          Dieser Vorgang läuft lokal in deinem Browser und nur auf ausdrückliche Benutzeraktion.
        </Section>

        <Section dark={dark} title="3. Datenweitergabe">
          Wir verkaufen oder teilen deine Daten nicht mit Dritten. Daten werden ausschließlich
          an die von dir gewählten Plattformen (Vinted, Kleinanzeigen, eBay) übermittelt –
          direkt aus deinem Browser, ohne Zwischenspeicherung auf unseren Servern.
        </Section>

        <Section dark={dark} title="4. Berechtigungen der Chrome-Extension">
          <PermRow dark={dark} perm="tabs / windows" reason="Öffnet neue Tabs für Vinted, Kleinanzeigen und eBay beim Crossposten" />
          <PermRow dark={dark} perm="scripting" reason="Injiziert Formular-Daten in die Zielseiten (React-kompatibel)" />
          <PermRow dark={dark} perm="storage" reason="Speichert temporäre Daten zwischen Hintergrund-Script und Content-Scripts" />
          <PermRow dark={dark} perm="activeTab" reason="Liest die aktuelle Tab-URL um den richtigen Content-Script auszuführen" />
          <PermRow dark={dark} perm="notifications" reason="Zeigt Statusmeldungen beim Crossposten an" />
          <PermRow dark={dark} perm="alarms" reason="Prüft regelmäßig ob neue Listings zum Synchronisieren vorhanden sind" />
        </Section>

        <Section dark={dark} title="5. Datenspeicherung">
          Die Extension speichert keine dauerhaften persönlichen Daten. Temporäre Daten (z.B.
          Bild-Daten während eines Crosspost-Vorgangs) werden nur im Arbeitsspeicher gehalten
          und nach Abschluss des Vorgangs gelöscht.
        </Section>

        <Section dark={dark} title="6. Deine Rechte">
          Da wir keine personenbezogenen Daten auf unseren Servern speichern, hast du jederzeit
          die vollständige Kontrolle über deine Daten. Du kannst die Extension jederzeit
          deinstallieren, um alle lokalen Speicherdaten zu entfernen.
        </Section>

        <Section dark={dark} title="7. Kontakt">
          Bei Fragen zur Datenschutzerklärung wende dich an:{' '}
          <a href="mailto:support@listsync.app" style={{ color: '#6366f1' }}>support@listsync.app</a>
        </Section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: dark ? '1px solid #30363d' : '1px solid #e8ecf2', textAlign: 'center' }}>
          <a href="/" style={{ color: '#6366f1', textDecoration: 'none', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>← Zurück zu ListSync</a>
        </div>
      </div>
    </div>
  )
}

function Section({ dark, title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: dark ? '#e6edf3' : '#111827', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>{title}</h2>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: dark ? '#b1bac4' : '#374151', fontFamily: 'Inter, sans-serif' }}>{children}</p>
    </div>
  )
}

function PermRow({ dark, perm, reason }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
      <span style={{ background: dark ? '#21262d' : '#f3f4f6', border: dark ? '1px solid #30363d' : '1px solid #e5e7eb', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontFamily: 'monospace', color: dark ? '#79c0ff' : '#4f46e5', whiteSpace: 'nowrap', marginTop: 2 }}>{perm}</span>
      <span style={{ fontSize: 14, color: dark ? '#b1bac4' : '#6b7280', lineHeight: 1.5 }}>{reason}</span>
    </div>
  )
}
