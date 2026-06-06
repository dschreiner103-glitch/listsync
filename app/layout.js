import SessionWrapper from '@/components/SessionWrapper'

export const metadata = { title: 'ListSync', description: 'Crosslisting Tool für Reseller' }

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <head>
        {/* No-flash: apply theme class before first paint */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var s = localStorage.getItem('ls-theme');
            var dark = s ? s === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (dark) document.documentElement.classList.add('dark');
          })()
        `}}/>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ListSync" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
          body { margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

          /* ── Theme variables ── */
          :root {
            --bg:             #f0f2f7;
            --surface:        #ffffff;
            --border:         #e8ecf2;
            --text-1:         #111827;
            --text-2:         #6b7280;
            --text-3:         #9ca3af;
            --divider:        #f0f2f7;
            --input-bg:       #ffffff;
            --chip-active:    #111827;
            --chip-active-fg: #ffffff;
            --chip-border:    #e2e8f0;
            --tab-bg:         #e8ecf0;
            --tab-active:     #ffffff;
            --modal-close:    #f0f2f7;
            --row-hover:      #f8fafc;
            --warn-bg:        #fffbeb;
            --warn-border:    #fde68a;
            --warn-text:      #92400e;
            --warn-title:     #78350f;
            --success-bg:     #f0fdf4;
            --success-border: #bbf7d0;
          }
          html.dark {
            --bg:             #0d1117;
            --surface:        #161b22;
            --border:         #30363d;
            --text-1:         #e6edf3;
            --text-2:         #b1bac4;
            --text-3:         #8b949e;
            --divider:        rgba(255,255,255,0.08);
            --input-bg:       #0d1117;
            --chip-active:    rgba(255,255,255,0.11);
            --chip-active-fg: var(--text-1);
            --chip-border:    var(--border);
            --tab-bg:         #1c2128;
            --tab-active:     #2d333b;
            --modal-close:    #21262d;
            --row-hover:      #1c2128;
            --warn-bg:        rgba(245,158,11,0.08);
            --warn-border:    rgba(245,158,11,0.22);
            --warn-text:      #fbbf24;
            --warn-title:     #fcd34d;
            --success-bg:     rgba(16,185,129,0.07);
            --success-border: rgba(16,185,129,0.25);
          }

          /* ── Global dark overrides ── */
          body { background: var(--bg); color: var(--text-1); transition: background .2s, color .2s; }

          .ls-page { min-height: 100vh; background: var(--bg); }

          .ls-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 20px;
            box-shadow: 0 1px 3px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.05);
            transition: background .2s, border-color .2s;
          }
          html.dark .ls-card {
            box-shadow: 0 1px 3px rgba(0,0,0,.3), 0 8px 24px rgba(0,0,0,.2);
          }

          /* Inputs & selects in dark mode */
          html.dark input,
          html.dark textarea,
          html.dark select {
            background: var(--input-bg) !important;
            border-color: var(--border) !important;
            color: var(--text-1) !important;
          }
          html.dark input::placeholder,
          html.dark textarea::placeholder { color: var(--text-3) !important; }

          /* Modals */
          html.dark [data-modal] { background: var(--surface) !important; }

          .ls-btn-primary {
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            color: #fff;
            border: none;
            font-weight: 700;
            cursor: pointer;
            transition: opacity .15s, transform .1s;
            box-shadow: 0 4px 14px rgba(99,102,241,.35);
          }
          .ls-btn-primary:hover { opacity: .92; }
          .ls-btn-primary:active { transform: scale(.98); }
          .ls-btn-primary:disabled { background: #e2e8f0; color: #94a3b8; box-shadow: none; }

          /* ── Tailwind dark overrides (for pages using utility classes) ── */
          html.dark .bg-white { background: var(--surface) !important; }
          html.dark .bg-gray-50 { background: #1c2128 !important; }
          html.dark .bg-gray-100 { background: #21262d !important; }
          html.dark .bg-gray-200 { background: #30363d !important; }
          html.dark .text-gray-900, html.dark .text-gray-800 { color: var(--text-1) !important; }
          html.dark .text-gray-700 { color: #c9d1d9 !important; }
          html.dark .text-gray-600 { color: var(--text-2) !important; }
          html.dark .text-gray-500, html.dark .text-gray-400 { color: var(--text-3) !important; }
          html.dark .border-gray-100 { border-color: var(--border) !important; }
          html.dark .border-gray-200 { border-color: #30363d !important; }
          html.dark .border-gray-300 { border-color: #484f58 !important; }
          html.dark .divide-gray-100 > * + * { border-color: var(--border) !important; }
          html.dark .hover\:bg-gray-50:hover { background: #1c2128 !important; }
          html.dark .hover\:bg-gray-100:hover { background: #21262d !important; }
          html.dark .hover\:bg-gray-200:hover { background: #30363d !important; }

          /* New listing page dark overrides */
          html.dark .bg-emerald-50, html.dark .bg-green-50 { background: rgba(16,185,129,0.07) !important; }
          html.dark .border-emerald-200, html.dark .border-green-200 { border-color: rgba(16,185,129,0.2) !important; }
          html.dark .text-emerald-700, html.dark .text-green-700 { color: #34d399 !important; }
          html.dark .text-green-600 { color: #6ee7b7 !important; }
          html.dark .bg-indigo-50 { background: rgba(99,102,241,0.07) !important; }
          html.dark [class*="bg-indigo-50"] { background: rgba(99,102,241,0.07) !important; }
          html.dark .border-indigo-50 { border-color: rgba(99,102,241,0.15) !important; }
          html.dark .text-indigo-700 { color: #a5b4fc !important; }
          html.dark .text-indigo-600 { color: #818cf8 !important; }
          html.dark .text-indigo-500 { color: #818cf8 !important; }
          html.dark .border-gray-300 { border-color: #484f58 !important; }
          html.dark .hover\:border-gray-200:hover { border-color: var(--border) !important; }
          html.dark .hover\:border-indigo-300:hover { border-color: #818cf8 !important; }
          html.dark .hover\:bg-indigo-50\/20:hover { background: rgba(99,102,241,0.05) !important; }
          html.dark .hover\:text-indigo-600:hover { color: #818cf8 !important; }
          html.dark .hover\:text-indigo-700:hover { color: #a5b4fc !important; }

          /* Settings / badge colors dark overrides */
          html.dark .bg-amber-50 { background: rgba(245,158,11,0.08) !important; }
          html.dark .border-amber-200 { border-color: rgba(245,158,11,0.2) !important; }
          html.dark .text-amber-700 { color: #fcd34d !important; }
          html.dark .bg-red-50 { background: rgba(239,68,68,0.08) !important; }
          html.dark .hover\:bg-red-100:hover { background: rgba(239,68,68,0.15) !important; }
          html.dark .bg-green-100 { background: rgba(34,197,94,0.1) !important; }
          html.dark .text-green-700 { color: #4ade80 !important; }
          html.dark .bg-blue-100 { background: rgba(59,130,246,0.1) !important; }
          html.dark .text-blue-700 { color: #60a5fa !important; }
          html.dark .bg-indigo-100 { background: rgba(99,102,241,0.12) !important; }
          html.dark .hover\:bg-indigo-100:hover { background: rgba(99,102,241,0.18) !important; }
          html.dark .text-red-600 { color: #f87171 !important; }
          html.dark .text-green-600 { color: #4ade80 !important; }

          /* Platform badge dark overrides */
          html.dark .bg-yellow-50  { background: rgba(202,138,4,0.1) !important; }
          html.dark .border-yellow-200 { border-color: rgba(202,138,4,0.25) !important; }
          html.dark .text-yellow-800 { color: #fcd34d !important; }
          html.dark .bg-teal-50    { background: rgba(13,148,136,0.1) !important; }
          html.dark .border-teal-200 { border-color: rgba(13,148,136,0.25) !important; }
          html.dark .text-teal-700 { color: #2dd4bf !important; }
          html.dark .bg-orange-50  { background: rgba(234,88,12,0.1) !important; }
          html.dark .border-orange-200 { border-color: rgba(234,88,12,0.25) !important; }
          html.dark .text-orange-800 { color: #fb923c !important; }

          /* Fix select arrow in dark mode */
          html.dark select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") !important; }

          ::-webkit-scrollbar { width: 5px; height: 5px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
          html.dark ::-webkit-scrollbar-thumb { background: #475569; }

          input:focus, textarea:focus, select:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
            border-color: #818cf8 !important;
          }
          select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px !important; }
          .line-clamp-1 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; }
          .line-clamp-2 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }

          /* ── Mobile responsive helpers ── */
          .ls-content { padding: 28px 22px; }
          @media (max-width: 640px) { .ls-content { padding: 18px 14px; } }

          .ls-grid-3 { display: grid; gap: 14px; grid-template-columns: 1fr; }
          @media (min-width: 640px) { .ls-grid-3 { grid-template-columns: repeat(2,1fr); } }
          @media (min-width: 900px) { .ls-grid-3 { grid-template-columns: repeat(3,1fr); } }

          .ls-grid-2-1 { display: grid; gap: 14px; grid-template-columns: 1fr; }
          @media (min-width: 760px) { .ls-grid-2-1 { grid-template-columns: 2fr 1fr; } }

          /* ── Platform picker / modal items in dark mode ── */
          html.dark .ls-platform-option { background: var(--surface) !important; }
          html.dark .ls-platform-option.selected { background: rgba(99,102,241,0.08) !important; }

          /* ── Prevent tap highlight flash on mobile ── */
          button, a { -webkit-tap-highlight-color: transparent; }

          /* ── Spin animation for loading indicators ── */
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .4 } }
          .ls-skeleton { background: linear-gradient(90deg, var(--border) 25%, var(--divider) 50%, var(--border) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 8px; }
          @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }

          /* ── Safe area for iPhone notch/home bar ── */
          .ls-mobile-nav { padding-bottom: env(safe-area-inset-bottom, 0); }
          .ls-page-content { padding-bottom: calc(108px + env(safe-area-inset-bottom, 0)); }
          @media (min-width: 768px) { .ls-page-content { padding-bottom: 40px; } }

          /* ══════════════════════════════════════════
             ── 3D & Animation Overhaul ──
          ══════════════════════════════════════════ */

          /* ── Keyframes ── */
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(28px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0)    scale(1);    }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          @keyframes popIn {
            0%  { opacity: 0; transform: scale(0.6); }
            65% { transform: scale(1.12); }
            100%{ opacity: 1; transform: scale(1);   }
          }
          @keyframes float {
            0%,100% { transform: translateY(0px)  rotate(0deg);  }
            33%     { transform: translateY(-8px) rotate(0.8deg);  }
            66%     { transform: translateY(-4px) rotate(-0.4deg); }
          }
          @keyframes glow-pulse {
            0%,100% { box-shadow: 0 4px 20px rgba(99,102,241,0.4); }
            50%     { box-shadow: 0 4px 40px rgba(99,102,241,0.75), 0 0 80px rgba(99,102,241,0.2); }
          }
          @keyframes gradient-flow {
            0%   { background-position: 0%   50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0%   50%; }
          }
          @keyframes text-shimmer {
            0%   { background-position: -200% center; }
            100% { background-position:  200% center; }
          }
          @keyframes border-glow {
            0%,100% { opacity: 0.5; }
            50%     { opacity: 1;   }
          }

          /* ── 3D Card hover tilt (desktop) ── */
          .ls-card {
            transform-style: preserve-3d;
            will-change: transform;
            transition: transform 0.28s cubic-bezier(0.4,0,0.2,1),
                        box-shadow 0.28s cubic-bezier(0.4,0,0.2,1);
          }
          @media (hover: hover) {
            .ls-card:hover {
              transform: perspective(900px) rotateX(-2deg) rotateY(1deg) translateY(-6px) scale(1.015);
              box-shadow: 0 24px 60px rgba(15,23,42,0.16),
                          0 8px  20px rgba(15,23,42,0.08),
                          0 0   0 1px rgba(99,102,241,0.10);
            }
            html.dark .ls-card:hover {
              box-shadow: 0 24px 60px rgba(0,0,0,0.55),
                          0 0   40px rgba(99,102,241,0.07),
                          0 0   0 1px rgba(255,255,255,0.06);
            }
          }
          /* Mobile card tap ripple */
          @media (hover: none) {
            .ls-card:active {
              transform: scale(0.975);
              transition: transform 0.1s;
            }
          }

          /* ── Glassmorphism helper ── */
          .ls-glass {
            background: rgba(255,255,255,0.72) !important;
            backdrop-filter: blur(24px) saturate(180%);
            -webkit-backdrop-filter: blur(24px) saturate(180%);
            border: 1px solid rgba(255,255,255,0.6) !important;
          }
          html.dark .ls-glass {
            background: rgba(22,27,34,0.78) !important;
            border: 1px solid rgba(255,255,255,0.09) !important;
          }

          /* ── Gradient text ── */
          .ls-gradient-text {
            background: linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #a78bfa 100%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          /* ── Shimmer text ── */
          .ls-text-shimmer {
            background: linear-gradient(90deg, #6366f1 0%, #a78bfa 25%, #6366f1 50%, #818cf8 75%, #6366f1 100%);
            background-size: 200% auto;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: text-shimmer 3s linear infinite;
          }

          /* ── Animated gradient border card ── */
          .ls-card-glow {
            position: relative;
          }
          .ls-card-glow::before {
            content: '';
            position: absolute;
            inset: -1px;
            border-radius: inherit;
            background: linear-gradient(135deg, rgba(99,102,241,0.6), rgba(139,92,246,0.3), rgba(99,102,241,0.1));
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
            animation: border-glow 3s ease-in-out infinite;
          }

          /* ── Primary button upgrades ── */
          .ls-btn-primary:not(:disabled) {
            box-shadow: 0 4px 18px rgba(99,102,241,0.42), 0 0 0 0 rgba(99,102,241,0);
            transition: opacity .15s, transform .15s cubic-bezier(0.34,1.56,0.64,1), box-shadow .2s !important;
          }
          .ls-btn-primary:not(:disabled):hover {
            opacity: 1 !important;
            transform: translateY(-2px) scale(1.02) !important;
            box-shadow: 0 10px 32px rgba(99,102,241,0.58), 0 0 60px rgba(99,102,241,0.18) !important;
          }
          .ls-btn-primary:not(:disabled):active {
            transform: scale(0.95) translateY(1px) !important;
            box-shadow: 0 2px 10px rgba(99,102,241,0.38) !important;
          }

          /* ── Page fade-in ── */
          .ls-page { animation: fadeIn 0.3s ease; }

          /* ── Float animation utility ── */
          .ls-float { animation: float 5s ease-in-out infinite; }

          /* ── Glow ring utility ── */
          .ls-glow-btn { animation: glow-pulse 2.5s ease-in-out infinite; }

          /* ── Mobile header blur bar ── */
          .ls-topbar-glass {
            background: rgba(255,255,255,0.7);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            border-bottom: 1px solid rgba(0,0,0,0.06);
          }
          html.dark .ls-topbar-glass {
            background: rgba(7,9,16,0.78);
            border-bottom: 1px solid rgba(255,255,255,0.07);
          }

          /* ── Stat card mobile micro-interaction ── */
          @media (max-width: 640px) {
            .ls-card {
              border-radius: 18px !important;
            }
          }

          /* ══════════════════════════════════════════
             ── Aurora background (app-wide) ──
          ══════════════════════════════════════════ */
          .ls-aurora { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
          .ls-aurora .ao { position: absolute; border-radius: 50%; filter: blur(90px); opacity: .18; }
          html.dark .ls-aurora .ao { opacity: .36; }
          .ls-aurora .ao1 { width: 560px; height: 560px; background: radial-gradient(circle, #6366f1, transparent 70%); top: -140px; left: -60px;  animation: lsao-a 20s ease-in-out infinite; }
          .ls-aurora .ao2 { width: 480px; height: 480px; background: radial-gradient(circle, #22c55e, transparent 70%); bottom: -160px; right: -40px; animation: lsao-b 26s ease-in-out infinite; }
          .ls-aurora .ao3 { width: 440px; height: 440px; background: radial-gradient(circle, #a78bfa, transparent 70%); top: 38%; right: 28%; animation: lsao-c 30s ease-in-out infinite; }
          @keyframes lsao-a { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(60px,40px) scale(1.15)} }
          @keyframes lsao-b { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-50px,-30px) scale(1.1)} }
          @keyframes lsao-c { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-40px,50px) scale(0.9)} }

          /* 3D gradient icon orb (app-wide) */
          .ls-icon-3d {
            width: 40px; height: 40px; border-radius: 13px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center; color: #fff;
          }
          .ls-icon-3d svg { filter: drop-shadow(0 1px 2px rgba(0,0,0,.25)); }

          /* Live pill (app-wide) */
          .ls-live-pill {
            display: inline-flex; align-items: center; gap: 7px;
            background: rgba(34,197,94,.12); border: 1px solid rgba(34,197,94,.28);
            border-radius: 99px; padding: 6px 13px; font-size: 12px; font-weight: 700; color: #16a34a;
          }
          html.dark .ls-live-pill { color: #4ade80; }
          .ls-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; animation: live-ping 2s ease-in-out infinite; }
          @keyframes live-ping { 0%{box-shadow:0 0 0 0 rgba(34,197,94,.55)} 70%{box-shadow:0 0 0 7px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} }

          @media (prefers-reduced-motion: reduce) {
            .ls-aurora .ao, .ls-float, .ls-live-dot { animation: none !important; }
          }
        `}</style>
      </head>
      <body>
        <SessionWrapper>{children}</SessionWrapper>
        <script dangerouslySetInnerHTML={{ __html: `
          /* Interactive 3D tilt for .ls-card on desktop */
          (function() {
            var STRENGTH = 12;
            function attach(card) {
              if (card._tiltBound) return;
              card._tiltBound = true;
              card.addEventListener('mousemove', function(e) {
                var r = card.getBoundingClientRect();
                var x = (e.clientX - r.left) / r.width  - 0.5;
                var y = (e.clientY - r.top)  / r.height - 0.5;
                card.style.transform = 'perspective(900px) rotateY(' + (x*STRENGTH) + 'deg) rotateX(' + (-y*STRENGTH*0.7) + 'deg) translateY(-6px) scale(1.015)';
                card.style.transition = 'transform 0.08s ease, box-shadow 0.08s';
              });
              card.addEventListener('mouseleave', function() {
                card.style.transform = '';
                card.style.transition = 'transform 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s';
              });
            }
            function scan() {
              if (window.matchMedia('(hover: none)').matches) return;
              document.querySelectorAll('.ls-card').forEach(attach);
            }
            scan();
            var obs = new MutationObserver(scan);
            obs.observe(document.body, { childList: true, subtree: true });
          })();
        `}}/>
      </body>
    </html>
  )
}
