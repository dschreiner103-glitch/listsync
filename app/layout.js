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
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
          body { margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

          /* ── Theme variables ── */
          :root {
            --bg:       #f0f2f7;
            --surface:  #ffffff;
            --border:   #e8ecf2;
            --text-1:   #111827;
            --text-2:   #6b7280;
            --text-3:   #9ca3af;
            --divider:  #f0f2f7;
            --input-bg: #ffffff;
          }
          html.dark {
            --bg:       #0d1117;
            --surface:  #161b22;
            --border:   #30363d;
            --text-1:   #e6edf3;
            --text-2:   #b1bac4;
            --text-3:   #8b949e;
            --divider:  rgba(255,255,255,0.08);
            --input-bg: #0d1117;
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
        `}</style>
      </head>
      <body>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  )
}
