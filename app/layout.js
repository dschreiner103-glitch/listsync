import SessionWrapper from '@/components/SessionWrapper'

export const metadata = { title: 'ListSync', description: 'Crosslisting Tool für Reseller' }

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>{`
          * { box-sizing: border-box; }
          body { margin: 0; }
          input:focus, textarea:focus, select:focus { outline: none; box-shadow: 0 0 0 3px rgba(79,70,229,0.12); }
          .line-clamp-1 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; }
        `}</style>
      </head>
      <body className="bg-gray-50 text-gray-900">
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  )
}
