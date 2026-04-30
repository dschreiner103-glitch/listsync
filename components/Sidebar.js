'use client'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href:'/dashboard', icon:'⊞', label:'Dashboard' },
  { href:'/listings',  icon:'≡',  label:'Meine Listings' },
  { primary: true },
  { href:'/settings',  icon:'⚙', label:'Einstellungen' },
]

export default function Sidebar({ activeCount = 0 }) {
  const pathname = usePathname()
  const router   = useRouter()
  return (
    <aside className="hidden md:flex flex-col w-60 fixed inset-y-0 left-0 bg-white border-r border-gray-100 z-20">
      <div className="px-5 py-5 border-b border-gray-100 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">LS</div>
        <span className="font-extrabold text-gray-900 text-lg tracking-tight">ListSync</span>
        <span className="ml-auto text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">Beta</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((n, i) => {
          if (n.primary) return (
            <button key="new" onClick={() => router.push('/new')}
              className="w-full my-2 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors">
              <span className="text-lg font-bold">+</span> Neues Listing
            </button>
          )
          const active = pathname.startsWith(n.href)
          return (
            <button key={n.href} onClick={() => router.push(n.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${active ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <span className="text-base w-5 text-center">{n.icon}</span>
              {n.label}
              {n.href === '/listings' && activeCount > 0 && (
                <span className="ml-auto bg-indigo-100 text-indigo-600 text-xs rounded-full px-2 py-0.5 font-bold">{activeCount}</span>
              )}
            </button>
          )
        })}
      </nav>
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">D</div>
          <div><p className="text-sm font-semibold text-gray-900">Denny S.</p><p className="text-xs text-gray-400">Freemium</p></div>
        </div>
      </div>
    </aside>
  )
}
