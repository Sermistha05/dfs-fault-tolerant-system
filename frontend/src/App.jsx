import { useCallback, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { ThemeProvider } from './lib/ThemeContext'
import Sidebar, { NAV_LINKS } from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Upload    from './pages/Upload'
import Nodes     from './pages/Nodes'
import Files     from './pages/Files'

// ── Topbar ────────────────────────────────────────────────────────────────────
function Topbar({ onMenuOpen }) {
  const location = useLocation()
  const current  = NAV_LINKS.find(l =>
    l.to === '/' ? location.pathname === '/' : location.pathname.startsWith(l.to)
  )

  return (
    <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shrink-0">
      <button
        onClick={onMenuOpen}
        className="p-2 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Open menu"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <line x1="3" y1="6"  x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" className="w-3.5 h-3.5">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
            <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
          </svg>
        </div>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {current?.label ?? 'DFS'}
        </span>
      </div>
    </header>
  )
}

// ── Layout (needs router context for useLocation) ─────────────────────────────
function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const openMenu  = useCallback(() => setMobileOpen(true),  [])
  const closeMenu = useCallback(() => setMobileOpen(false), [])

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Sidebar mobileOpen={mobileOpen} onClose={closeMenu} />

      <div className="flex flex-col flex-1 min-w-0">
        <Topbar onMenuOpen={openMenu} />

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <Routes>
            <Route path="/"       element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/nodes"  element={<Nodes />} />
            <Route path="/files"  element={<Files />} />
            <Route path="*"       element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

// ── App root ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </ThemeProvider>
  )
}
