import SessionWrapper from '@/components/SessionWrapper'
import LusionCursor from '@/components/LusionCursor'
import { Analytics } from '@vercel/analytics/react'

export const metadata = { title: 'ListSync', description: 'Crosslisting Tool für Reseller' }

export default function RootLayout({ children }) {
  return (
    <html lang="de" className="dark">
      <head>
        {/* Lusion-Innenteil ist immer dunkel — dark-Klasse fest gesetzt */}
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add('dark');` }}/>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#08080a" />
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

          /* ════════════════════════════════════════════
             ── Lusion Theme — Creme auf Ink + Orange ──
             Immer dunkel. :root und html.dark identisch.
          ════════════════════════════════════════════ */
          :root, html.dark {
            --bg:             #08080a;
            --surface:        #0e0e11;
            --border:         rgba(236,231,223,0.12);
            --text-1:         #ece7df;
            --text-2:         rgba(236,231,223,0.62);
            --text-3:         rgba(236,231,223,0.40);
            --divider:        rgba(236,231,223,0.08);
            --input-bg:       rgba(236,231,223,0.04);
            --acc:            #f4511e;
            --acc-2:          #ff6a3d;
            --chip-active:    rgba(244,81,30,0.16);
            --chip-active-fg: #ece7df;
            --chip-border:    rgba(236,231,223,0.16);
            --tab-bg:         rgba(236,231,223,0.05);
            --tab-active:     rgba(236,231,223,0.11);
            --modal-close:    rgba(236,231,223,0.06);
            --row-hover:      rgba(236,231,223,0.04);
            --warn-bg:        rgba(245,158,11,0.08);
            --warn-border:    rgba(245,158,11,0.22);
            --warn-text:      #fbbf24;
            --warn-title:     #fcd34d;
            --success-bg:     rgba(16,185,129,0.07);
            --success-border: rgba(16,185,129,0.25);
          }

          body { background: var(--bg); color: var(--text-1); }

          .ls-page { min-height: 100vh; background: var(--bg); }

          /* ── Glasige Ink-Karte ── */
          .ls-card {
            background: linear-gradient(160deg, rgba(236,231,223,0.045), rgba(236,231,223,0.012));
            border: 1px solid var(--border);
            border-radius: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,.4), 0 14px 44px rgba(0,0,0,.38);
            transition: background .2s, border-color .2s;
          }

          /* Inputs & selects */
          input, textarea, select {
            background: var(--input-bg) !important;
            border-color: var(--border) !important;
            color: var(--text-1) !important;
          }
          input::placeholder, textarea::placeholder { color: var(--text-3) !important; }

          /* Modals */
          [data-modal] { background: var(--surface) !important; }

          .ls-btn-primary {
            background: linear-gradient(135deg, #ff6a3d 0%, #f4511e 100%);
            color: #fff;
            border: none;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 6px 22px rgba(244,81,30,.38);
            will-change: transform;
            transition: transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s, filter .2s;
          }
          .ls-btn-primary:hover { box-shadow: 0 10px 34px rgba(244,81,30,.55), 0 0 60px rgba(244,81,30,.18); filter: brightness(1.06); }
          .ls-btn-primary:active { filter: brightness(.95); }
          .ls-btn-primary:disabled { background: rgba(236,231,223,.08); color: rgba(236,231,223,.35); box-shadow: none; }

          /* ── Tailwind-Utility-Overrides → Ink/Creme/Orange ── */
          .bg-white { background: var(--surface) !important; }
          .bg-gray-50 { background: rgba(236,231,223,0.03) !important; }
          .bg-gray-100 { background: rgba(236,231,223,0.05) !important; }
          .bg-gray-200 { background: rgba(236,231,223,0.08) !important; }
          .text-gray-900, .text-gray-800 { color: var(--text-1) !important; }
          .text-gray-700 { color: rgba(236,231,223,0.80) !important; }
          .text-gray-600 { color: var(--text-2) !important; }
          .text-gray-500, .text-gray-400 { color: var(--text-3) !important; }
          .border-gray-100 { border-color: var(--border) !important; }
          .border-gray-200 { border-color: var(--border) !important; }
          .border-gray-300 { border-color: rgba(236,231,223,0.18) !important; }
          .divide-gray-100 > * + * { border-color: var(--border) !important; }
          .hover\\:bg-gray-50:hover { background: rgba(236,231,223,0.04) !important; }
          .hover\\:bg-gray-100:hover { background: rgba(236,231,223,0.06) !important; }
          .hover\\:bg-gray-200:hover { background: rgba(236,231,223,0.09) !important; }

          /* Erfolg / Verkauft (semantisch grün, bleibt) */
          .bg-emerald-50, .bg-green-50 { background: rgba(16,185,129,0.08) !important; }
          .border-emerald-200, .border-green-200 { border-color: rgba(16,185,129,0.22) !important; }
          .text-emerald-700, .text-green-700 { color: #34d399 !important; }
          .text-green-600 { color: #6ee7b7 !important; }

          /* Marken-Akzent (war Indigo) → Orange */
          .bg-indigo-50, [class*="bg-indigo-50"] { background: rgba(244,81,30,0.08) !important; }
          .bg-indigo-100 { background: rgba(244,81,30,0.14) !important; }
          .border-indigo-50 { border-color: rgba(244,81,30,0.16) !important; }
          .text-indigo-700 { color: #ff8a5c !important; }
          .text-indigo-600, .text-indigo-500 { color: #ff7a4d !important; }
          .hover\\:border-gray-200:hover { border-color: var(--border) !important; }
          .hover\\:border-indigo-300:hover { border-color: #f4511e !important; }
          .hover\\:bg-indigo-50\\/20:hover { background: rgba(244,81,30,0.06) !important; }
          .hover\\:bg-indigo-100:hover { background: rgba(244,81,30,0.18) !important; }
          .hover\\:text-indigo-600:hover { color: #ff7a4d !important; }
          .hover\\:text-indigo-700:hover { color: #ff8a5c !important; }

          /* Settings / badge colors */
          .bg-amber-50 { background: rgba(245,158,11,0.08) !important; }
          .border-amber-200 { border-color: rgba(245,158,11,0.22) !important; }
          .text-amber-700 { color: #fcd34d !important; }
          .bg-red-50 { background: rgba(239,68,68,0.10) !important; }
          .hover\\:bg-red-100:hover { background: rgba(239,68,68,0.16) !important; }
          .bg-green-100 { background: rgba(34,197,94,0.12) !important; }
          .bg-blue-100 { background: rgba(59,130,246,0.12) !important; }
          .text-blue-700 { color: #60a5fa !important; }
          .text-red-600 { color: #f87171 !important; }
          .text-green-600 { color: #4ade80 !important; }

          /* Platform badges */
          .bg-yellow-50  { background: rgba(202,138,4,0.12) !important; }
          .border-yellow-200 { border-color: rgba(202,138,4,0.28) !important; }
          .text-yellow-800 { color: #fcd34d !important; }
          .bg-teal-50    { background: rgba(13,148,136,0.12) !important; }
          .border-teal-200 { border-color: rgba(13,148,136,0.28) !important; }
          .text-teal-700 { color: #2dd4bf !important; }
          .bg-orange-50  { background: rgba(234,88,12,0.12) !important; }
          .border-orange-200 { border-color: rgba(234,88,12,0.28) !important; }
          .text-orange-800 { color: #fb923c !important; }

          select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ece7df' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") !important; }

          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(236,231,223,0.18); border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(236,231,223,0.30); }

          input:focus, textarea:focus, select:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(244,81,30,0.22);
            border-color: #f4511e !important;
          }
          select { appearance: none; background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px !important; }
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

          .ls-platform-option { background: var(--surface) !important; }
          .ls-platform-option.selected { background: rgba(244,81,30,0.10) !important; }

          button, a { -webkit-tap-highlight-color: transparent; }

          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .4 } }
          .ls-skeleton { background: linear-gradient(90deg, var(--border) 25%, var(--divider) 50%, var(--border) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 8px; }
          @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }

          .ls-mobile-nav { padding-bottom: env(safe-area-inset-bottom, 0); }
          .ls-page-content { padding-bottom: calc(108px + env(safe-area-inset-bottom, 0)); }
          @media (min-width: 768px) { .ls-page-content { padding-bottom: 40px; } }

          /* ════════════════════════════════════════════
             ── 3D & Animation ──
          ════════════════════════════════════════════ */
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(28px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0)    scale(1);    }
          }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
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
            0%,100% { box-shadow: 0 4px 20px rgba(244,81,30,0.40); }
            50%     { box-shadow: 0 4px 40px rgba(244,81,30,0.75), 0 0 80px rgba(244,81,30,0.20); }
          }
          @keyframes text-shimmer {
            0%   { background-position: -200% center; }
            100% { background-position:  200% center; }
          }
          @keyframes border-glow { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }

          /* ── 3D Card hover tilt (desktop) ── */
          .ls-card {
            transform-style: preserve-3d;
            will-change: transform;
            transition: transform 0.28s cubic-bezier(0.4,0,0.2,1),
                        box-shadow 0.28s cubic-bezier(0.4,0,0.2,1),
                        border-color 0.28s;
          }
          @media (hover: hover) {
            .ls-card:hover {
              transform: perspective(900px) rotateX(-2deg) rotateY(1deg) translateY(-6px) scale(1.015);
              border-color: rgba(244,81,30,0.30);
              box-shadow: 0 28px 64px rgba(0,0,0,0.55),
                          0 0   46px rgba(244,81,30,0.10),
                          0 0   0 1px rgba(244,81,30,0.12);
            }
          }
          @media (hover: none) {
            .ls-card:active { transform: scale(0.975); transition: transform 0.1s; }
          }

          /* ── Glas ── */
          .ls-glass {
            background: rgba(14,14,17,0.72) !important;
            backdrop-filter: blur(24px) saturate(160%);
            -webkit-backdrop-filter: blur(24px) saturate(160%);
            border: 1px solid rgba(236,231,223,0.10) !important;
          }

          /* ── Gradient-Text (Creme → Orange) ── */
          .ls-gradient-text {
            background: linear-gradient(135deg, #ece7df 0%, #ff8a5c 55%, #f4511e 100%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          /* ── Shimmer-Text ── */
          .ls-text-shimmer {
            background: linear-gradient(90deg, #ece7df 0%, #f4511e 25%, #ece7df 50%, #ff8a5c 75%, #ece7df 100%);
            background-size: 200% auto;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: text-shimmer 3s linear infinite;
          }

          /* ── Animated gradient border card ── */
          .ls-card-glow { position: relative; }
          .ls-card-glow::before {
            content: '';
            position: absolute; inset: -1px; border-radius: inherit;
            background: linear-gradient(135deg, rgba(244,81,30,0.6), rgba(244,81,30,0.25), rgba(244,81,30,0.05));
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor; mask-composite: exclude;
            pointer-events: none; animation: border-glow 3s ease-in-out infinite;
          }

          .ls-page { animation: fadeIn 0.3s ease; }
          .ls-float { animation: float 5s ease-in-out infinite; }
          .ls-glow-btn { animation: glow-pulse 2.5s ease-in-out infinite; }

          /* ── Topbar blur ── */
          .ls-topbar-glass {
            background: rgba(8,8,10,0.72);
            backdrop-filter: blur(20px) saturate(160%);
            -webkit-backdrop-filter: blur(20px) saturate(160%);
            border-bottom: 1px solid rgba(236,231,223,0.08);
          }

          @media (max-width: 640px) { .ls-card { border-radius: 18px !important; } }

          /* ════════════════════════════════════════════
             ── Aurora background (Orange/Rot auf Ink) ──
          ════════════════════════════════════════════ */
          .ls-aurora { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
          .ls-aurora .ao { position: absolute; border-radius: 50%; filter: blur(95px); opacity: .26; }
          .ls-aurora .ao1 { width: 580px; height: 580px; background: radial-gradient(circle, #f4511e, transparent 70%); top: -150px; left: -70px;  animation: lsao-a 20s ease-in-out infinite; }
          .ls-aurora .ao2 { width: 500px; height: 500px; background: radial-gradient(circle, #c81e1e, transparent 70%); bottom: -170px; right: -50px; animation: lsao-b 26s ease-in-out infinite; }
          .ls-aurora .ao3 { width: 460px; height: 460px; background: radial-gradient(circle, #ff9650, transparent 70%); top: 38%; right: 26%; animation: lsao-c 30s ease-in-out infinite; opacity:.16; }
          @keyframes lsao-a { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(60px,40px) scale(1.15)} }
          @keyframes lsao-b { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-50px,-30px) scale(1.1)} }
          @keyframes lsao-c { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-40px,50px) scale(0.9)} }

          /* 3D gradient icon orb */
          .ls-icon-3d {
            width: 40px; height: 40px; border-radius: 13px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center; color: #fff;
          }
          .ls-icon-3d svg { filter: drop-shadow(0 1px 2px rgba(0,0,0,.35)); }

          /* Live pill */
          .ls-live-pill {
            display: inline-flex; align-items: center; gap: 7px;
            background: rgba(34,197,94,.12); border: 1px solid rgba(34,197,94,.28);
            border-radius: 99px; padding: 6px 13px; font-size: 12px; font-weight: 700; color: #4ade80;
          }
          .ls-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; animation: live-ping 2s ease-in-out infinite; }
          @keyframes live-ping { 0%{box-shadow:0 0 0 0 rgba(34,197,94,.55)} 70%{box-shadow:0 0 0 7px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} }

          /* ════════════════════════════════════════════
             ── Lusion Custom Cursor (nur Fein-Pointer) ──
          ════════════════════════════════════════════ */
          .ls-cur-dot, .ls-cur-ring { position: fixed; top: 0; left: 0; z-index: 99999; pointer-events: none; }
          .ls-cur-dot { width: 6px; height: 6px; margin: -3px 0 0 -3px; border-radius: 50%; background: #ece7df; mix-blend-mode: difference; }
          .ls-cur-ring { width: 36px; height: 36px; margin: -18px 0 0 -18px; border: 1px solid rgba(236,231,223,.5); border-radius: 50%; mix-blend-mode: difference;
            transition: width .25s, height .25s, margin .25s, background .25s, border-color .25s; }
          .ls-cur-ring[data-state="hover"] { width: 54px; height: 54px; margin: -27px 0 0 -27px; background: rgba(236,231,223,.12); border-color: transparent; }
          @media (hover: none), (pointer: coarse) { .ls-cur-dot, .ls-cur-ring { display: none !important; } }
          @media (hover: hover) and (pointer: fine) {
            body { cursor: none; }
            a, button, input, textarea, select, label, [role="button"], .ls-card { cursor: none; }
          }

          @media (prefers-reduced-motion: reduce) {
            .ls-aurora .ao, .ls-float, .ls-live-dot { animation: none !important; }
          }
        `}</style>
      </head>
      <body>
        <LusionCursor />
        <SessionWrapper>{children}</SessionWrapper>
        <Analytics />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

            /* 3D tilt for .ls-card */
            var STRENGTH = 12;
            function attachTilt(card) {
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

            /* Magnetic pull for primary buttons + [data-magnetic] */
            function attachMag(el) {
              if (el._magBound) return;
              el._magBound = true;
              el.addEventListener('mousemove', function(e) {
                var r = el.getBoundingClientRect();
                el.style.transform = 'translate(' + ((e.clientX - r.left - r.width/2) * 0.25) + 'px,' + ((e.clientY - r.top - r.height/2) * 0.4) + 'px)';
              });
              el.addEventListener('mouseleave', function() { el.style.transform = 'translate(0,0)'; });
            }

            function scan() {
              if (!fine) return;
              document.querySelectorAll('.ls-card').forEach(attachTilt);
              document.querySelectorAll('.ls-btn-primary, [data-magnetic]').forEach(attachMag);
            }
            scan();
            new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
          })();
        `}}/>
      </body>
    </html>
  )
}
