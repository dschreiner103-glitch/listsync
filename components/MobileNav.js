'use client'
import { usePathname, useRouter } from 'next/navigation'

export default function MobileNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const items = [
    { href:'/dashboard', icon:'⊞', label:'Home' },
    { href:'/listings',  icon:'≡',  label:'Listings' },
    { primary: true },
    { href:'/settings',  icon:'⚙', label:'Settings' },
  ]
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-20 flex h-16">
      {items.map((n, i) => {
        if (n.primary) return (
          <button key="new" onClick={() => router.push('/new')} className="flex-1 flex flex-col items-center justify-center">
            <div className="w-11 h-11 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg -mt-5">+</div>
            <span className="text-xs text-indigo-600 font-semibold mt-0.5">Neu</span>
          </button>
        )
        const active = pathname.startsWith(n.href)
        return (
          <button key={n.href} onClick={() => router.push(n.href)} className="flex-1 flex flex-col items-center justify-center gap-0.5">
            <span className={`text-lg ${active ? 'text-indigo-600' : 'text-gray-400'}`}>{n.icon}</span>
            <span className={`text-xs font-medium ${active ? 'text-indigo-600' : 'text-gray-400'}`}>{n.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
