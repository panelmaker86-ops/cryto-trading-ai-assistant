import { useState, useEffect } from 'react'
import Alerts from './pages/Alerts'
import Risk from './pages/Risk'
import Trades from './pages/Trades'
import { health } from './api'
import './App.css'

type Page = 'alerts' | 'risk' | 'trades'

const PAGES: Record<Page, { title: string; subtitle: string }> = {
  alerts: { title: 'Alerts', subtitle: 'Guardian warnings and risk alerts' },
  risk: { title: 'Risk & account', subtitle: 'Account overview and risk parameters' },
  trades: { title: 'Trade history', subtitle: 'Monitored trades' },
}

function IconAlerts() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function IconList() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

function IconLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
    </svg>
  )
}

function App() {
  const [page, setPage] = useState<Page>('alerts')
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)

  useEffect(() => {
    const check = async () => {
      try {
        await health()
        setApiOnline(true)
      } catch {
        setApiOnline(false)
      }
    }
    check()
    const t = setInterval(check, 15000)
    return () => clearInterval(t)
  }, [])

  const { title, subtitle } = PAGES[page]

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo">
            <div className="logo-icon">
              <IconLogo />
            </div>
            Strategy <span>Guardian</span> AI
          </div>
          <p className="tagline">Monitor only · No auto-trading</p>
        </div>
        <nav className="sidebar-nav">
          <button
            className={page === 'alerts' ? 'active' : ''}
            onClick={() => setPage('alerts')}
          >
            <IconAlerts /> Alerts
          </button>
          <button
            className={page === 'risk' ? 'active' : ''}
            onClick={() => setPage('risk')}
          >
            <IconShield /> Risk
          </button>
          <button
            className={page === 'trades' ? 'active' : ''}
            onClick={() => setPage('trades')}
          >
            <IconList /> Trades
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className={`sidebar-status ${apiOnline === false ? 'offline' : ''}`}>
            {apiOnline === true ? 'Connected' : apiOnline === false ? 'Offline' : '…'}
          </div>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <span className="topbar-title">{title}</span>
          <span className="topbar-sub">{subtitle}</span>
        </header>
        <main className="main">
          {page === 'alerts' && <Alerts />}
          {page === 'risk' && <Risk />}
          {page === 'trades' && <Trades />}
        </main>
      </div>
    </div>
  )
}

export default App
