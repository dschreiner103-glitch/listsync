'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'

// ── Config ────────────────────────────────────────────────────────────
const CHANNELS = [
  { id: 'ankuendigungen', emoji: '📢', label: 'ankündigungen', desc: 'Offizielle Ankündigungen', writeRoles: ['owner','admin'] },
  { id: 'allgemein',      emoji: '💬', label: 'allgemein',     desc: 'Allgemeiner Chat' },
  { id: 'verkauf',        emoji: '🛍️', label: 'verkauf',       desc: 'Deals & Verkaufstipps' },
  { id: 'legit-check',    emoji: '✅', label: 'legit-check',   desc: 'Echtheitsprüfung' },
  { id: 'feedback',       emoji: '💡', label: 'feedback',      desc: 'Feedback & Wünsche' },
  { id: 'optimierung',    emoji: '🚀', label: 'optimierung',   desc: 'Listing-Optimierung' },
]

function canWrite(channel, role) {
  if (!channel.writeRoles) return true
  return channel.writeRoles.includes(role)
}

const ROLES = {
  owner:  { label: 'Owner',  color: '#f59e0b', bg: 'rgba(245,158,11,.15)',  emoji: '👑' },
  admin:  { label: 'Admin',  color: '#ef4444', bg: 'rgba(239,68,68,.15)',   emoji: '🛡️' },
  mod:    { label: 'Mod',    color: '#3b82f6', bg: 'rgba(59,130,246,.15)',  emoji: '⚡' },
  vip:    { label: 'VIP',    color: '#8b5cf6', bg: 'rgba(139,92,246,.15)',  emoji: '🌟' },
  member: { label: 'Member', color: '#6b7280', bg: 'rgba(107,114,128,.1)', emoji: '' },
}

const RANKS = [
  { min: 5000, label: 'Legend',  emoji: '👑', color: '#f59e0b' },
  { min: 1500, label: 'Veteran', emoji: '💎', color: '#8b5cf6' },
  { min: 500,  label: 'Regular', emoji: '⭐', color: '#3b82f6' },
  { min: 100,  label: 'Active',  emoji: '🔥', color: '#ef4444' },
  { min: 0,    label: 'Newbie',  emoji: '🌱', color: '#10b981' },
]

function getRank(xp) {
  return RANKS.find(r => xp >= r.min) || RANKS[RANKS.length - 1]
}

function xpToNextRank(xp) {
  const idx = RANKS.findIndex(r => xp >= r.min)
  if (idx === 0) return null // already max
  const next = RANKS[idx - 1]
  return { needed: next.min, progress: Math.round((xp / next.min) * 100) }
}

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6']
function avatarColor(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function formatTime(ts) {
  const d = new Date(ts), now = new Date(), diff = now - d
  if (diff < 60000) return 'gerade eben'
  if (diff < 3600000) return `vor ${Math.floor(diff / 60000)}min`
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('de', { hour:'2-digit', minute:'2-digit' })
  return d.toLocaleDateString('de', { day:'2-digit', month:'2-digit' }) + ' ' + d.toLocaleTimeString('de', { hour:'2-digit', minute:'2-digit' })
}

function renderContent(text, users, onMentionClick) {
  if (!text) return null
  return text.split(/(@\w+)/g).map((p, i) => {
    if (!p.startsWith('@')) return p
    // Normalize: underscores → spaces for matching
    const normalized = p.slice(1).replace(/_/g, ' ').toLowerCase()
    const user = users?.find(u => u.name.toLowerCase() === normalized)
    // Display: show @Name with spaces restored
    const display = '@' + p.slice(1).replace(/_/g, ' ')
    return (
      <span key={i}
        onClick={() => user && onMentionClick?.(user)}
        style={{ color:'#818cf8', fontWeight:700, background:'rgba(99,102,241,.1)', borderRadius:4, padding:'1px 5px', cursor:user?'pointer':'default', transition:'background .1s' }}
        onMouseEnter={e => user && (e.target.style.background='rgba(99,102,241,.22)')}
        onMouseLeave={e => (e.target.style.background='rgba(99,102,241,.1)')}>
        {display}
      </span>
    )
  })
}

// ── Role Badge ────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  if (!role || role === 'member') return null
  const r = ROLES[role] || ROLES.member
  return (
    <span style={{ fontSize:10, fontWeight:700, color:r.color, background:r.bg, padding:'1px 6px', borderRadius:4, letterSpacing:'.03em' }}>
      {r.emoji} {r.label}
    </span>
  )
}

// ── Rank Badge ────────────────────────────────────────────────────────
function RankBadge({ xp }) {
  const rank = getRank(xp || 0)
  return (
    <span style={{ fontSize:10, fontWeight:700, color:rank.color, opacity:.85 }}>
      {rank.emoji} {rank.label}
    </span>
  )
}

// ── Main ──────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const { data: session } = useSession()
  const [channel, setChannel]   = useState('allgemein')
  const [messages, setMessages] = useState([])
  const [users, setUsers]       = useState([])
  const [myProfile, setMyProfile] = useState(null)
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pendingImage, setPendingImage] = useState(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [claimMsg, setClaimMsg] = useState('')
  const [mentionSuggestions, setMentionSuggestions] = useState([])
  const [mentionStart, setMentionStart] = useState(-1)
  const [mentionIdx, setMentionIdx] = useState(0)
  const [notifications, setNotifications] = useState({}) // { channel: count }
  const [profileUser, setProfileUser] = useState(null) // user to show profile for
  const bottomRef  = useRef(null)
  const fileRef    = useRef(null)
  const inputRef   = useRef(null)
  const lastIdRef  = useRef(0)
  const myId = session?.user?.id ? Number(session.user.id) : null

  // ── Notifications ──
  const loadNotifications = useCallback(async () => {
    const res = await fetch('/api/community/notifications')
    if (res.ok) setNotifications(await res.json())
  }, [])

  useEffect(() => { loadNotifications() }, [loadNotifications])
  useEffect(() => { const id = setInterval(loadNotifications, 10000); return () => clearInterval(id) }, [loadNotifications])

  // Mark channel as read when switching
  useEffect(() => {
    if (notifications[channel]) {
      fetch('/api/community/notifications', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ channel }) })
      setNotifications(prev => ({ ...prev, [channel]: 0 }))
    }
  }, [channel])

  // ── Heartbeat (online status) ──
  useEffect(() => {
    const beat = () => fetch('/api/community/heartbeat', { method:'POST' })
    beat()
    const id = setInterval(beat, 30000)
    return () => clearInterval(id)
  }, [])

  // ── Load users + my profile ──
  const loadUsers = useCallback(async () => {
    const res = await fetch('/api/community/users')
    if (!res.ok) return
    const data = await res.json()
    setUsers(data)
    const me = data.find(u => u.id === myId)
    if (me) setMyProfile(me)
  }, [myId])

  useEffect(() => { loadUsers() }, [loadUsers])
  useEffect(() => {
    const id = setInterval(loadUsers, 15000)
    return () => clearInterval(id)
  }, [loadUsers])

  // ── Load messages ──
  const loadMessages = useCallback(async (ch, reset = false) => {
    const after = reset ? 0 : lastIdRef.current
    const res = await fetch(`/api/community/messages?channel=${ch}&after=${after}`)
    if (!res.ok) return
    const data = await res.json()
    if (!Array.isArray(data) || !data.length) return
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

  useEffect(() => { lastIdRef.current = 0; setMessages([]); loadMessages(channel, true) }, [channel, loadMessages])
  useEffect(() => { const id = setInterval(() => loadMessages(channel), 3000); return () => clearInterval(id) }, [channel, loadMessages])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  // ── Image upload ──
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      let url
      if (process.env.NODE_ENV === 'production') {
        const { upload } = await import('@vercel/blob/client')
        const blob = await upload(file.name, file, { access:'public', handleUploadUrl:'/api/upload' })
        url = blob.url
      } else {
        const fd = new FormData(); fd.append('files', file)
        const res = await fetch('/api/upload', { method:'POST', body:fd })
        url = (await res.json()).urls?.[0]
      }
      setPendingImage({ url, preview: URL.createObjectURL(file) })
    } catch { alert('Upload fehlgeschlagen') }
    finally { setUploading(false); e.target.value = '' }
  }

  // ── Send message ──
  const send = async () => {
    if (sending || (!input.trim() && !pendingImage)) return
    setSending(true)
    try {
      const res = await fetch('/api/community/messages', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ channel, content: input.trim(), image_url: pendingImage?.url || '' }),
      })
      if (res.ok) { setInput(''); setPendingImage(null); await loadMessages(channel); await loadUsers() }
    } finally { setSending(false); inputRef.current?.focus() }
  }

  const handleInputChange = (e) => {
    if (!writeAllowed) return
    const val = e.target.value
    setInput(val)
    // Detect @mention being typed
    const cursor = e.target.selectionStart
    const before = val.slice(0, cursor)
    const match = before.match(/@(\w*)$/)
    if (match) {
      const query = match[1].toLowerCase()
      const filtered = users.filter(u => u.name.toLowerCase().includes(query) && u.id !== myId)
      setMentionSuggestions(filtered.slice(0, 6))
      setMentionStart(cursor - match[0].length)
      setMentionIdx(0)
    } else {
      setMentionSuggestions([])
      setMentionStart(-1)
    }
  }

  const insertMention = (user) => {
    const before = input.slice(0, mentionStart)
    const after  = input.slice(inputRef.current?.selectionStart || mentionStart)
    // Replace spaces with underscores so @\w+ regex matches the full name
    const tag = '@' + user.name.replace(/\s+/g, '_')
    const newVal = `${before}${tag} ${after.replace(/^\w*/, '')}`
    setInput(newVal)
    setMentionSuggestions([])
    setMentionStart(-1)
    setTimeout(() => inputRef.current?.focus(), 10)
  }

  const handleKeyDown = e => {
    if (mentionSuggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIdx(i => Math.min(i+1, mentionSuggestions.length-1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setMentionIdx(i => Math.max(i-1, 0)); return }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(mentionSuggestions[mentionIdx]); return }
      if (e.key === 'Escape') { setMentionSuggestions([]); return }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const claimOwner = async () => {
    const res = await fetch('/api/community/claim-owner', { method:'POST' })
    const data = await res.json()
    setClaimMsg(data.message || data.error || '')
    if (res.ok) await loadUsers()
  }

  const ch = CHANNELS.find(c => c.id === channel)
  // writeRoles only restrict specific channels (e.g. announcements)
  // If myProfile not loaded yet, assume member (can write in normal channels)
  const userRole = myProfile?.role || 'member'
  const writeAllowed = ch ? canWrite(ch, userRole) : true
  const onlineUsers  = users.filter(u => u.online).sort((a,b) => {
    const roleOrder = { owner:0, admin:1, mod:2, vip:3, member:4 }
    return (roleOrder[a.role]||4) - (roleOrder[b.role]||4) || b.xp - a.xp
  })
  const offlineUsers = users.filter(u => !u.online)

  // Get user profile for a message
  const userProfileMap = {}
  for (const u of users) userProfileMap[u.id] = u

  return (
    <div className="ls-page" style={{ display:'flex' }}>
      <Sidebar/>
      <main className="md:ml-60" style={{ flex:1, display:'flex', height:'100vh', overflow:'hidden' }}>

        {/* ── Channel Sidebar ── */}
        <div style={{ width:220, flexShrink:0, background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column' }} className="hidden md:flex">
          <div style={{ padding:'18px 16px 12px', borderBottom:'1px solid var(--border)' }}>
            <p style={{ fontSize:11, fontWeight:800, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.09em', margin:'0 0 8px' }}>Community</p>
            {/* My XP bar */}
            {myProfile && (
              <div style={{ background:'var(--bg)', borderRadius:10, padding:'8px 10px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:22, height:22, borderRadius:6, background:avatarColor(String(myProfile.id)), display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff' }}>
                      {(myProfile.name||'?').charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize:11.5, fontWeight:700, color:'var(--text-1)' }}>{myProfile.name}</span>
                  </div>
                  <RankBadge xp={myProfile.xp}/>
                </div>
                {myProfile.role !== 'member' && <div style={{ marginBottom:4 }}><RoleBadge role={myProfile.role}/></div>}
                <div style={{ height:4, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
                  {(() => { const n = xpToNextRank(myProfile.xp); return n ? <div style={{ height:'100%', width:`${n.progress}%`, background:'#6366f1', borderRadius:2, transition:'width .5s' }}/> : <div style={{ height:'100%', width:'100%', background:'#f59e0b', borderRadius:2 }}/> })()}
                </div>
                <p style={{ fontSize:10, color:'var(--text-3)', margin:'3px 0 0' }}>{myProfile.xp} XP</p>
              </div>
            )}
          </div>

          <div style={{ padding:'8px 8px', flex:1, overflowY:'auto' }}>
            {/* Announcements */}
            <p style={{ fontSize:10.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.08em', padding:'8px 8px 4px', margin:0 }}>Info</p>
            {CHANNELS.filter(c => c.writeRoles).map(c => {
              const active = c.id === channel
              return (
                <button key={c.id} onClick={() => setChannel(c.id)}
                  style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'7px 10px', borderRadius:8, marginBottom:2, border:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit', background:active?'rgba(245,158,11,.12)':'transparent', color:active?'#f59e0b':'var(--text-2)', fontWeight:active?700:500, fontSize:13, transition:'all .12s' }}>
                  <span style={{ fontSize:15 }}>{c.emoji}</span>
                  <span># {c.label}</span>
                </button>
              )
            })}

            {/* Regular channels */}
            <p style={{ fontSize:10.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.08em', padding:'12px 8px 4px', margin:0 }}>Channels</p>
            {CHANNELS.filter(c => !c.writeRoles).map(c => {
              const active = c.id === channel
              const unread = notifications[c.id] || 0
              return (
                <button key={c.id} onClick={() => setChannel(c.id)}
                  style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'7px 10px', borderRadius:8, marginBottom:2, border:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit', background:active?'rgba(99,102,241,.12)':'transparent', color:active?'#6366f1':'var(--text-2)', fontWeight:active||unread>0?700:500, fontSize:13, transition:'all .12s' }}>
                  <span style={{ fontSize:15 }}>{c.emoji}</span>
                  <span style={{ flex:1 }}># {c.label}</span>
                  {unread > 0 && !active && (
                    <span style={{ fontSize:10, fontWeight:800, background:'#ef4444', color:'#fff', borderRadius:10, padding:'1px 6px', flexShrink:0 }}>{unread}</span>
                  )}
                </button>
              )
            })}

            {/* Leaderboard + Owner claim */}
            <p style={{ fontSize:10.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.08em', padding:'12px 8px 4px', margin:0 }}>Mehr</p>
            <button onClick={() => setShowLeaderboard(true)}
              style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'7px 10px', borderRadius:8, marginBottom:2, border:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit', background:'transparent', color:'var(--text-2)', fontWeight:500, fontSize:13, transition:'all .12s' }}>
              <span style={{ fontSize:15 }}>🏆</span>
              <span># leaderboard</span>
            </button>
            {!users.some(u => u.role === 'owner') && (
              <div style={{ margin:'8px 4px 0', padding:'10px', background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.3)', borderRadius:10 }}>
                <p style={{ fontSize:11, color:'#f59e0b', fontWeight:700, margin:'0 0 6px' }}>👑 Kein Owner</p>
                <button onClick={claimOwner}
                  style={{ width:'100%', padding:'6px', borderRadius:8, border:'none', background:'rgba(245,158,11,.2)', color:'#f59e0b', fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                  Owner beanspruchen
                </button>
                {claimMsg && <p style={{ fontSize:10, color:'#f59e0b', margin:'4px 0 0' }}>{claimMsg}</p>}
              </div>
            )}
          </div>
        </div>

        {/* ── Chat Area ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, background:'var(--bg)' }}>
          {/* Header */}
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', background:'var(--surface)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <span style={{ fontSize:20 }}>{ch?.emoji}</span>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:15, fontWeight:800, color:'var(--text-1)', margin:0 }}># {ch?.label}</p>
              <p style={{ fontSize:12, color:'var(--text-3)', margin:0 }}>{ch?.desc}</p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#10b981' }}/>
              <span style={{ fontSize:12, color:'var(--text-3)', fontWeight:600 }}>{onlineUsers.length} online</span>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:2 }}>
            {messages.length === 0 && (
              <div style={{ textAlign:'center', paddingTop:60 }}>
                <p style={{ fontSize:40, margin:'0 0 12px' }}>{ch?.emoji}</p>
                <p style={{ fontSize:16, fontWeight:700, color:'var(--text-1)', margin:'0 0 6px' }}>Willkommen in #{ch?.label}!</p>
                <p style={{ fontSize:13, color:'var(--text-3)', margin:0 }}>Sei der Erste der schreibt.</p>
              </div>
            )}
            {messages.map((msg, i) => {
              const prev = messages[i - 1]
              const grouped = prev && prev.user_id === msg.user_id && (new Date(msg.created_at) - new Date(prev.created_at)) < 300000
              const isMe = Number(msg.user_id) === myId
              const profile = userProfileMap[Number(msg.user_id)]
              const color = avatarColor(String(msg.user_id))
              const initials = (msg.user_name || '?').slice(0, 2).toUpperCase()
              return (
                <div key={msg.id} style={{ display:'flex', gap:10, padding:grouped?'2px 0 2px 46px':'8px 0 2px', alignItems:'flex-start' }}>
                  {!grouped && (
                    <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background:color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff', marginTop:1 }}>
                      {initials}
                    </div>
                  )}
                  <div style={{ flex:1, minWidth:0 }}>
                    {!grouped && (
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3, flexWrap:'wrap' }}>
                        <span style={{ fontSize:13.5, fontWeight:700, color:isMe?'#6366f1':'var(--text-1)' }}>{msg.user_name}</span>
                        {profile && <RoleBadge role={profile.role}/>}
                        {profile && <RankBadge xp={profile.xp}/>}
                        <span style={{ fontSize:11, color:'var(--text-3)' }}>{formatTime(msg.created_at)}</span>
                      </div>
                    )}
                    {msg.content && <p style={{ fontSize:14, color:'var(--text-1)', margin:0, lineHeight:1.55, wordBreak:'break-word', whiteSpace:'pre-wrap' }}>{renderContent(msg.content, users, setProfileUser)}</p>}
                    {msg.image_url && <img src={msg.image_url} alt="" style={{ maxWidth:320, maxHeight:300, borderRadius:12, marginTop:msg.content?6:0, display:'block', cursor:'pointer', border:'1px solid var(--border)' }} onClick={()=>window.open(msg.image_url,'_blank')}/>}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', background:'var(--surface)', flexShrink:0 }}>
            {!writeAllowed && (
              <div style={{ textAlign:'center', padding:'12px', background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.2)', borderRadius:12, marginBottom:8 }}>
                <p style={{ fontSize:12, color:'#f59e0b', fontWeight:600, margin:0 }}>📢 Nur Owner & Admins können hier schreiben</p>
              </div>
            )}
            {pendingImage && (
              <div style={{ marginBottom:8, position:'relative', display:'inline-block' }}>
                <img src={pendingImage.preview} alt="" style={{ height:80, borderRadius:10, border:'1px solid var(--border)' }}/>
                <button onClick={()=>setPendingImage(null)} style={{ position:'absolute', top:-6, right:-6, width:22, height:22, borderRadius:'50%', background:'#ef4444', color:'#fff', border:'none', cursor:'pointer', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
              </div>
            )}
            {/* @Mention Autocomplete Dropdown */}
            {mentionSuggestions.length > 0 && (
              <div style={{ position:'relative', marginBottom:4 }}>
                <div style={{ position:'absolute', bottom:'100%', left:44, right:44, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', boxShadow:'0 -8px 24px rgba(0,0,0,.15)', zIndex:100 }}>
                  {mentionSuggestions.map((u, i) => {
                    const rank = getRank(u.xp)
                    const role = ROLES[u.role] || ROLES.member
                    return (
                      <div key={u.id} onClick={() => insertMention(u)}
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', cursor:'pointer', background: i === mentionIdx ? 'rgba(99,102,241,.1)' : 'transparent', borderLeft: i === mentionIdx ? '2px solid #6366f1' : '2px solid transparent', transition:'background .1s' }}
                        onMouseEnter={() => setMentionIdx(i)}>
                        <div style={{ width:28, height:28, borderRadius:8, background:avatarColor(String(u.id)), display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff', flexShrink:0 }}>
                          {(u.name||'?').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex:1 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:'var(--text-1)' }}>@{u.name}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                          {u.role !== 'member' && <span style={{ fontSize:10, color:role.color }}>{role.emoji}</span>}
                          <span style={{ fontSize:10, color:rank.color }}>{rank.emoji} {rank.label}</span>
                          {u.online && <div style={{ width:7, height:7, borderRadius:'50%', background:'#10b981' }}/>}
                        </div>
                      </div>
                    )
                  })}
                  <p style={{ fontSize:10, color:'var(--text-3)', padding:'4px 14px 6px', margin:0 }}>↑↓ navigieren · Enter/Tab einfügen · Esc schließen</p>
                </div>
              </div>
            )}

            <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImageUpload}/>
              <button onClick={()=>fileRef.current?.click()} disabled={uploading} style={{ width:36, height:36, borderRadius:10, border:'1px solid var(--border)', background:'var(--modal-close)', color:'var(--text-2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:16 }}>
                {uploading ? '⏳' : '📎'}
              </button>
              <textarea ref={inputRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} rows={1}
                disabled={!writeAllowed}
                placeholder={writeAllowed ? `Nachricht an #${ch?.label}… (@name zum taggen)` : 'Kein Schreibrecht in diesem Channel'}
                style={{ flex:1, padding:'9px 14px', border:'1px solid var(--border)', borderRadius:12, fontSize:14, background:'var(--input-bg)', color:'var(--text-1)', fontFamily:'inherit', resize:'none', lineHeight:1.5, maxHeight:120, overflowY:'auto' }}
                onInput={e=>{e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,120)+'px'}}/>
              <button onClick={send} disabled={!writeAllowed||sending||(!input.trim()&&!pendingImage)}
                style={{ width:36, height:36, borderRadius:10, border:'none', flexShrink:0, background:sending||(!input.trim()&&!pendingImage)?'var(--modal-close)':'#6366f1', color:sending||(!input.trim()&&!pendingImage)?'var(--text-3)':'#fff', cursor:sending||(!input.trim()&&!pendingImage)?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
            <p style={{ fontSize:11, color:'var(--text-3)', margin:'5px 0 0', paddingLeft:44 }}>Enter senden · Shift+Enter neue Zeile · @name taggen · +5 XP pro Nachricht</p>
          </div>
        </div>

        {/* ── Online Users Panel ── */}
        <div style={{ width:200, flexShrink:0, background:'var(--surface)', borderLeft:'1px solid var(--border)', display:'flex', flexDirection:'column', overflowY:'auto' }} className="hidden lg:flex">
          <div style={{ padding:'16px 14px 10px', borderBottom:'1px solid var(--border)' }}>
            <p style={{ fontSize:11, fontWeight:800, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.09em', margin:0 }}>Mitglieder</p>
          </div>

          <div style={{ padding:'8px 10px', flex:1 }}>
            {/* Online */}
            {onlineUsers.length > 0 && (
              <>
                <p style={{ fontSize:10, fontWeight:700, color:'#10b981', textTransform:'uppercase', letterSpacing:'.07em', margin:'8px 4px 6px' }}>Online — {onlineUsers.length}</p>
                {onlineUsers.map(u => {
                  const rank = getRank(u.xp)
                  const role = ROLES[u.role] || ROLES.member
                  return (
                    <div key={u.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 4px', borderRadius:8, marginBottom:2 }}>
                      <div style={{ position:'relative', flexShrink:0 }}>
                        <div style={{ width:28, height:28, borderRadius:8, background:avatarColor(String(u.id)), display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff' }}>
                          {(u.name||'?').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ position:'absolute', bottom:-1, right:-1, width:9, height:9, borderRadius:'50%', background:'#10b981', border:'2px solid var(--surface)' }}/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:12, fontWeight:600, color:'var(--text-1)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</p>
                        <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                          {u.role !== 'member' && <span style={{ fontSize:9, color:role.color }}>{role.emoji}</span>}
                          <span style={{ fontSize:9, color:rank.color }}>{rank.emoji} {rank.label}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </>
            )}

            {/* Offline */}
            {offlineUsers.length > 0 && (
              <>
                <p style={{ fontSize:10, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.07em', margin:'12px 4px 6px' }}>Offline — {offlineUsers.length}</p>
                {offlineUsers.map(u => (
                  <div key={u.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 4px', borderRadius:8, marginBottom:2, opacity:.5 }}>
                    <div style={{ position:'relative', flexShrink:0 }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:avatarColor(String(u.id)), display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff' }}>
                        {(u.name||'?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ position:'absolute', bottom:-1, right:-1, width:9, height:9, borderRadius:'50%', background:'#6b7280', border:'2px solid var(--surface)' }}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:12, fontWeight:500, color:'var(--text-2)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</p>
                      <span style={{ fontSize:9, color:getRank(u.xp).color }}>{getRank(u.xp).emoji} {getRank(u.xp).label}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

      </main>
      <MobileNav/>

      {/* Profile Modal — on @mention click */}
      {profileUser && (() => {
        const rank = getRank(profileUser.xp)
        const role = ROLES[profileUser.role] || ROLES.member
        const next = xpToNextRank(profileUser.xp)
        return (
          <div onClick={() => setProfileUser(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background:'var(--surface)', borderRadius:24, padding:28, maxWidth:320, width:'100%', boxShadow:'0 24px 60px rgba(0,0,0,.3)' }}>
              {/* Banner */}
              <div style={{ height:60, borderRadius:14, background:`linear-gradient(135deg, ${rank.color}44, ${rank.color}22)`, marginBottom:-20, border:`1px solid ${rank.color}33` }}/>
              {/* Avatar */}
              <div style={{ display:'flex', alignItems:'flex-end', gap:12, marginBottom:16 }}>
                <div style={{ width:64, height:64, borderRadius:16, background:avatarColor(String(profileUser.id)), display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color:'#fff', border:'4px solid var(--surface)', flexShrink:0 }}>
                  {(profileUser.name||'?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex:1, paddingBottom:4 }}>
                  <p style={{ fontSize:16, fontWeight:800, color:'var(--text-1)', margin:'0 0 4px' }}>{profileUser.name}</p>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                    {profileUser.role !== 'member' && (
                      <span style={{ fontSize:11, fontWeight:700, color:role.color, background:role.bg, padding:'2px 8px', borderRadius:6 }}>{role.emoji} {role.label}</span>
                    )}
                    <span style={{ fontSize:11, fontWeight:700, color:rank.color, background:`${rank.color}18`, padding:'2px 8px', borderRadius:6 }}>{rank.emoji} {rank.label}</span>
                  </div>
                </div>
                <div style={{ width:12, height:12, borderRadius:'50%', background: profileUser.online ? '#10b981' : '#6b7280', border:'2px solid var(--surface)', marginBottom:4 }}/>
              </div>
              {/* XP Bar */}
              <div style={{ background:'var(--bg)', borderRadius:12, padding:'12px 14px', marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:12, color:'var(--text-2)', fontWeight:600 }}>XP</span>
                  <span style={{ fontSize:12, fontWeight:800, color:rank.color }}>{profileUser.xp} XP</span>
                </div>
                <div style={{ height:6, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                  {next
                    ? <div style={{ height:'100%', width:`${next.progress}%`, background:rank.color, borderRadius:3, transition:'width .5s' }}/>
                    : <div style={{ height:'100%', width:'100%', background:'#f59e0b', borderRadius:3 }}/>
                  }
                </div>
                {next && <p style={{ fontSize:10, color:'var(--text-3)', margin:'4px 0 0' }}>Nächster Rang bei {next.needed} XP</p>}
              </div>
              <button onClick={() => setProfileUser(null)} style={{ width:'100%', padding:'11px', borderRadius:12, border:'none', background:'#6366f1', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Schließen</button>
            </div>
          </div>
        )
      })()}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div onClick={()=>setShowLeaderboard(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'var(--surface)', borderRadius:24, padding:28, maxWidth:400, width:'100%', maxHeight:'80vh', overflow:'auto', boxShadow:'0 24px 60px rgba(0,0,0,.3)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <p style={{ fontSize:18, fontWeight:800, color:'var(--text-1)', margin:0 }}>🏆 Leaderboard</p>
              <button onClick={()=>setShowLeaderboard(false)} style={{ background:'none', border:'none', color:'var(--text-3)', cursor:'pointer', fontSize:20 }}>✕</button>
            </div>
            {[...users].sort((a,b)=>b.xp-a.xp).map((u, i) => {
              const rank = getRank(u.xp)
              const role = ROLES[u.role] || ROLES.member
              const medals = ['🥇','🥈','🥉']
              return (
                <div key={u.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:12, marginBottom:6, background: i < 3 ? 'rgba(99,102,241,.06)' : 'var(--bg)', border: i < 3 ? '1px solid rgba(99,102,241,.12)' : '1px solid transparent' }}>
                  <span style={{ fontSize:18, width:24, textAlign:'center', flexShrink:0 }}>{medals[i] || `${i+1}`}</span>
                  <div style={{ width:34, height:34, borderRadius:9, background:avatarColor(String(u.id)), display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff', flexShrink:0 }}>
                    {(u.name||'?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <p style={{ fontSize:13.5, fontWeight:700, color:'var(--text-1)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</p>
                      {u.role !== 'member' && <span style={{ fontSize:10, color:role.color }}>{role.emoji} {role.label}</span>}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:10, color:rank.color, fontWeight:700 }}>{rank.emoji} {rank.label}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                        <div style={{ height:4, width:60, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
                          {(() => { const n = xpToNextRank(u.xp); return n ? <div style={{ height:'100%', width:`${n.progress}%`, background:rank.color, borderRadius:2 }}/> : <div style={{ height:'100%', width:'100%', background:'#f59e0b', borderRadius:2 }}/>})()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <p style={{ fontSize:14, fontWeight:800, color:'#6366f1', margin:0 }}>{u.xp}</p>
                    <p style={{ fontSize:9, color:'var(--text-3)', margin:0 }}>XP</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
