'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'

const CHANNELS = [
  { id: 'allgemein',   emoji: '💬', label: 'allgemein',   desc: 'Allgemeiner Chat' },
  { id: 'verkauf',     emoji: '🛍️', label: 'verkauf',     desc: 'Deals & Verkaufstipps' },
  { id: 'legit-check', emoji: '✅', label: 'legit-check', desc: 'Echtheitsprüfung mit Bildern' },
  { id: 'feedback',    emoji: '💡', label: 'feedback',    desc: 'Feedback & Wünsche' },
  { id: 'optimierung', emoji: '🚀', label: 'optimierung', desc: 'Listing-Optimierung' },
]

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6']
function avatarColor(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function formatTime(ts) {
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'gerade eben'
  if (diff < 3600000) return `vor ${Math.floor(diff / 60000)}min`
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('de', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' })
}

function renderContent(text) {
  if (!text) return null
  const parts = text.split(/(@\w+)/g)
  return parts.map((part, i) =>
    part.startsWith('@')
      ? <span key={i} style={{ color: '#818cf8', fontWeight: 700, background: 'rgba(99,102,241,0.1)', borderRadius: 4, padding: '1px 3px' }}>{part}</span>
      : part
  )
}

export default function CommunityPage() {
  const { data: session } = useSession()
  const [channel, setChannel]   = useState('allgemein')
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pendingImage, setPendingImage] = useState(null) // { url, preview }
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const bottomRef = useRef(null)
  const fileRef   = useRef(null)
  const lastIdRef = useRef(0)
  const inputRef  = useRef(null)

  const myId = session?.user?.id

  const loadMessages = useCallback(async (ch, reset = false) => {
    const after = reset ? 0 : lastIdRef.current
    const res = await fetch(`/api/community/messages?channel=${ch}&after=${after}`)
    if (!res.ok) return
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return
    if (reset) {
      setMessages(data)
      lastIdRef.current = data[data.length - 1]?.id || 0
    } else {
      setMessages(prev => {
        const ids = new Set(prev.map(m => m.id))
        const fresh = data.filter(m => !ids.has(m.id))
        if (!fresh.length) return prev
        lastIdRef.current = fresh[fresh.length - 1]?.id || lastIdRef.current
        return [...prev, ...fresh]
      })
    }
  }, [])

  // Load on channel switch
  useEffect(() => {
    lastIdRef.current = 0
    setMessages([])
    loadMessages(channel, true)
    setSidebarOpen(false)
  }, [channel, loadMessages])

  // Poll every 3s
  useEffect(() => {
    const id = setInterval(() => loadMessages(channel), 3000)
    return () => clearInterval(id)
  }, [channel, loadMessages])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      let url
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
        const { upload } = await import('@vercel/blob/client')
        const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' })
        url = blob.url
      } else {
        const fd = new FormData()
        fd.append('files', file)
        const res  = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        url = data.urls?.[0]
      }
      setPendingImage({ url, preview: URL.createObjectURL(file) })
    } catch { alert('Upload fehlgeschlagen') }
    finally { setUploading(false); e.target.value = '' }
  }

  const send = async () => {
    if (sending) return
    if (!input.trim() && !pendingImage) return
    setSending(true)
    try {
      const res = await fetch('/api/community/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, content: input.trim(), image_url: pendingImage?.url || '' }),
      })
      if (res.ok) {
        setInput('')
        setPendingImage(null)
        await loadMessages(channel)
      }
    } finally { setSending(false) }
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const ch = CHANNELS.find(c => c.id === channel)

  return (
    <div className="ls-page" style={{ display: 'flex' }}>
      <Sidebar />
      <main className="md:ml-60" style={{ flex: 1, display: 'flex', height: '100vh', overflow: 'hidden' }}>

        {/* ── Channel Sidebar ── */}
        <div style={{
          width: sidebarOpen ? '100%' : 220,
          flexShrink: 0,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
        }} className={sidebarOpen ? '' : 'hidden md:flex'}>
          <div style={{ padding: '18px 16px 12px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.09em', margin: 0 }}>Community</p>
          </div>
          <div style={{ padding: '8px 8px', flex: 1, overflowY: 'auto' }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', padding: '8px 8px 4px', margin: 0 }}>Channels</p>
            {CHANNELS.map(c => {
              const active = c.id === channel
              return (
                <button key={c.id} onClick={() => setChannel(c.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '7px 10px', borderRadius: 8, marginBottom: 2,
                    border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                    color: active ? '#6366f1' : 'var(--text-2)',
                    fontWeight: active ? 700 : 500, fontSize: 13.5,
                    transition: 'all .12s',
                  }}>
                  <span style={{ fontSize: 16 }}>{c.emoji}</span>
                  <span># {c.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Chat Area ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>

          {/* Header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button onClick={() => setSidebarOpen(s => !s)}
              className="md:hidden"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', fontSize: 20, lineHeight: 1, padding: 0 }}>
              ☰
            </button>
            <span style={{ fontSize: 20 }}>{ch?.emoji}</span>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', margin: 0 }}># {ch?.label}</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>{ch?.desc}</p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', paddingTop: 60 }}>
                <p style={{ fontSize: 40, margin: '0 0 12px' }}>{ch?.emoji}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 6px' }}>Willkommen in #{ch?.label}!</p>
                <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>{ch?.desc} — sei der Erste der schreibt.</p>
              </div>
            )}

            {messages.map((msg, i) => {
              const prev = messages[i - 1]
              const grouped = prev && prev.user_id === msg.user_id && (new Date(msg.created_at) - new Date(prev.created_at)) < 300000
              const isMe = msg.user_id === myId
              const initials = (msg.user_name || '?').slice(0, 2).toUpperCase()
              const color = avatarColor(msg.user_id || msg.user_name)

              return (
                <div key={msg.id} style={{ display: 'flex', gap: 10, padding: grouped ? '2px 0 2px 46px' : '8px 0 2px', alignItems: 'flex-start' }}>
                  {!grouped && (
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 800, color: '#fff', marginTop: 1,
                    }}>{initials}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {!grouped && (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: isMe ? '#6366f1' : 'var(--text-1)' }}>{msg.user_name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{formatTime(msg.created_at)}</span>
                      </div>
                    )}
                    {msg.content && (
                      <p style={{ fontSize: 14, color: 'var(--text-1)', margin: 0, lineHeight: 1.55, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {renderContent(msg.content)}
                      </p>
                    )}
                    {msg.image_url && (
                      <img src={msg.image_url} alt=""
                        style={{ maxWidth: 320, maxHeight: 300, borderRadius: 12, marginTop: msg.content ? 6 : 0, display: 'block', cursor: 'pointer', border: '1px solid var(--border)' }}
                        onClick={() => window.open(msg.image_url, '_blank')}
                      />
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
            {pendingImage && (
              <div style={{ marginBottom: 8, position: 'relative', display: 'inline-block' }}>
                <img src={pendingImage.preview} alt="" style={{ height: 80, borderRadius: 10, border: '1px solid var(--border)' }}/>
                <button onClick={() => setPendingImage(null)}
                  style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload}/>
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--modal-close)', color: 'var(--text-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
                {uploading ? '⏳' : '📎'}
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={`Nachricht an #${ch?.label} … (@username zum taggen)`}
                style={{
                  flex: 1, padding: '9px 14px', border: '1px solid var(--border)', borderRadius: 12,
                  fontSize: 14, background: 'var(--input-bg)', color: 'var(--text-1)',
                  fontFamily: 'inherit', resize: 'none', lineHeight: 1.5,
                  maxHeight: 120, overflowY: 'auto',
                }}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
              />
              <button onClick={send} disabled={sending || (!input.trim() && !pendingImage)}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: 'none', flexShrink: 0,
                  background: sending || (!input.trim() && !pendingImage) ? 'var(--modal-close)' : '#6366f1',
                  color: sending || (!input.trim() && !pendingImage) ? 'var(--text-3)' : '#fff',
                  cursor: sending || (!input.trim() && !pendingImage) ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s',
                }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '6px 0 0', paddingLeft: 44 }}>Enter zum Senden · Shift+Enter für neue Zeile · @name zum Taggen</p>
          </div>
        </div>
      </main>
      <MobileNav/>
    </div>
  )
}
