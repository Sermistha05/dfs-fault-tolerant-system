import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const ThemeCtx = createContext()

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const toggle = useCallback(() => setDark(d => !d), [])
  const value  = useMemo(() => ({ dark, toggle }), [dark, toggle])

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => useContext(ThemeCtx)
