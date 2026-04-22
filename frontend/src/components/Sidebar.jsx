import { useCallback } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTheme } from '../lib/ThemeContext'

// ── nav config ────────────────────────────────────────────────────────────────
export const NAV_LINKS = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    to: '/upload',
    label: 'Upload',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
  },
  {
    to: '/nodes',
    label: 'Nodes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <circle cx="12" cy="5"  r="2"/>
        <circle cx="5"  cy="19" r="2"/>
        <circle cx="19" cy="19" r="2"/>
        <line x1="12" y1="7"  x2="5"  y2="17"/>
        <line x1="12" y1="7"  x2="19" y2="17"/>
        <line x1="5"  y1="19" x2="19" y2="19"/>
      </svg>
    ),
  },
  {
    to: '/files',
    label: 'Files',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="8" y1="13" x2="16" y2="13"/>
        <line x1="8" y1="17" x2="16" y2="17"/>
      </svg>
    ),
  },
]

// ── theme toggle icon ─────────────────────────────────────────────────────────
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2"  x2="12" y2="4"/>
      <line x1="12" y1="20" x2="12" y2="22"/>
      <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="2"  y1="12" x2="4"  y2="12"/>
      <line x1="20" y1="12" x2="22" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

// ── sidebar content (shared between desktop + mobile drawer) ──────────────────
function SidebarContent({ onNavClick }) {
  const { dark, toggle } = useTheme()
  const location = useLocation()

  const currentLabel = NAV_LINKS.find(l =>
    l.to === '/' ? location.pathname === '/' : location.pathname.startsWith(l.to)
  )?.label ?? ''

  return (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
            <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
          </svg>
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-white">DFS</p>
          <p className="text-[10px] text-gray-400 tracking-wide">Distributed FS</p>
        </div>
      </div>

      {/* Section label */}
      <p className="px-5 pt-5 pb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
        Navigation
      </p>

      {/* Nav links */}
      <nav className="flex flex-col gap-0.5 px-3 flex-1">
        {NAV_LINKS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavClick}
            className={({ isActive }) => [
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5',
            ].join(' ')}
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-white' : 'text-gray-500'}>{icon}</span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: current page + theme toggle */}
      <div className="px-3 pb-5 pt-4 border-t border-white/10 flex flex-col gap-1">
        {currentLabel && (
          <p className="px-3 pb-2 text-[10px] text-gray-500 truncate">
            Viewing: <span className="text-gray-300">{currentLabel}</span>
          </p>
        )}
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-150 w-full"
        >
          {dark ? <SunIcon /> : <MoonIcon />}
          {dark ? 'Light mode' : 'Dark mode'}
        </button>
      </div>

    </div>
  )
}

// ── main export ───────────────────────────────────────────────────────────────
export default function Sidebar({ mobileOpen, onClose }) {
  const handleNavClick = useCallback(() => { if (onClose) onClose() }, [onClose])

  return (
    <>
      {/* ── Desktop sidebar (always visible ≥ lg) ── */}
      <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-gray-900 dark:bg-gray-950 shrink-0 border-r border-white/5">
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer ── */}
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={[
          'lg:hidden fixed inset-0 z-20 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      {/* Drawer panel */}
      <aside
        className={[
          'lg:hidden fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 dark:bg-gray-950 flex flex-col',
          'transform transition-transform duration-300 ease-in-out border-r border-white/5',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <SidebarContent onNavClick={handleNavClick} />
      </aside>
    </>
  )
}
