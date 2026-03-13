import { useEffect, useState } from 'react'
import { getSettings, putSettings, getAccount, type RiskSettings, type AccountSnapshot } from '../api'
import '../App.css'

export default function Risk() {
  const [settings, setSettings] = useState<RiskSettings | null>(null)
  const [account, setAccount] = useState<AccountSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<RiskSettings>({
    max_risk_per_trade_pct: 3,
    max_daily_loss_pct: 5,
    max_leverage: 10,
    max_position_pct_of_balance: 20,
  })

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, a] = await Promise.all([
        getSettings(),
        getAccount('binance').catch(() => null),
      ])
      setSettings(s.risk)
      setForm(s.risk)
      setAccount(a)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await putSettings(form, undefined)
      setSettings(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading && !settings) {
    return (
      <div className="card">
        <div className="skeleton skeleton-line" style={{ width: '40%', marginBottom: '1rem' }} />
        <div className="risk-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton skeleton-card" style={{ height: '5rem' }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {account && (
        <div className="card">
          <p className="section-title">Account overview</p>
          <h2 style={{ marginBottom: '0.5rem' }}>Binance</h2>
          <p className="card-desc" style={{ marginBottom: '1rem' }}>Live balance and equity from exchange.</p>
          <div className="account-cards">
            <div className="account-card">
              <div className="label">Balance</div>
              <div className="value">
                ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="account-card">
              <div className="label">Equity</div>
              <div className="value">
                ${account.equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="account-card">
              <div className="label">Unrealized PnL</div>
              <div className={`value ${account.unrealized_pnl >= 0 ? 'positive' : 'negative'}`}>
                ${account.unrealized_pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <p className="section-title">Risk parameters</p>
        <h2 style={{ marginBottom: '0.25rem' }}>Guardian rules</h2>
        <p className="card-desc">Alerts are sent when a trade exceeds these limits.</p>
        <div className="risk-grid">
          <div className="risk-item">
            <label>Max risk per trade (%)</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="100"
              value={form.max_risk_per_trade_pct}
              onChange={(e) => setForm((f) => ({ ...f, max_risk_per_trade_pct: Number(e.target.value) }))}
            />
          </div>
          <div className="risk-item">
            <label>Max daily loss (%)</label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="100"
              value={form.max_daily_loss_pct}
              onChange={(e) => setForm((f) => ({ ...f, max_daily_loss_pct: Number(e.target.value) }))}
            />
          </div>
          <div className="risk-item">
            <label>Max leverage</label>
            <input
              type="number"
              min="1"
              max="125"
              value={form.max_leverage}
              onChange={(e) => setForm((f) => ({ ...f, max_leverage: Number(e.target.value) }))}
            />
          </div>
          <div className="risk-item">
            <label>Max position (% of balance)</label>
            <input
              type="number"
              step="1"
              min="1"
              max="100"
              value={form.max_position_pct_of_balance}
              onChange={(e) => setForm((f) => ({ ...f, max_position_pct_of_balance: Number(e.target.value) }))}
            />
          </div>
        </div>
        <div className="card-actions">
          <button className="btn primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save rules'}
          </button>
          {saved && <span className="success-msg">Settings saved.</span>}
          {error && <span className="error">{error}</span>}
        </div>
      </div>
    </>
  )
}
