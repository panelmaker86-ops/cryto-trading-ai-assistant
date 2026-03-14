import { useEffect, useState } from 'react'
import { getAlerts, type Alert } from '../api'
import { mockAlerts } from '../mockData'
import '../App.css'

function formatRelativeTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (sec < 60) return 'Just now'
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await getAlerts(100)
      setAlerts(data)
    } catch {
      setAlerts(mockAlerts)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(() => load(true), 30000)
    return () => clearInterval(t)
  }, [])

  if (loading && alerts.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>Alerts</h2>
        </div>
        <div className="alert-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>Alert feed</h2>
          <p className="card-desc">Auto-refresh every 30s. Risk, strategy, and behavior warnings.</p>
        </div>
        <button
          className="btn"
          onClick={() => load(true)}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {alerts.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">◉</span>
          <p>No alerts yet.</p>
          <p style={{ fontSize: '0.8125rem' }}>Open a trade or trigger the webhook to see guardian warnings here.</p>
        </div>
      ) : (
        <div className="alert-list">
          {alerts.map((a) => (
            <div key={a.id} className={`alert-item ${a.level}`}>
              <div className="alert-row">
                <span className={`badge ${a.level}`}>{a.level}</span>
                <span className="title">{a.title}</span>
                <span className="meta" style={{ marginLeft: 'auto' }}>
                  {formatRelativeTime(a.created_at)}
                </span>
              </div>
              <div className="message">{a.message}</div>
              <div className="meta">
                {a.source && <span>{a.source}</span>}
                {a.trade_snapshot && (
                  <span className="trade-tag">
                    {(a.trade_snapshot as { symbol?: string }).symbol} {(a.trade_snapshot as { side?: string }).side} · {(a.trade_snapshot as { size?: number }).size} @ ${Number((a.trade_snapshot as { entry_price?: number }).entry_price).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
