import { useEffect, useState, useRef } from 'react'
import { getTrades, TRADES_REFRESH_INTERVAL_MS, type Trade } from '../api'
import { getMockChartData, appendMockChartPoint, MOCK_BASE_EQUITY, mockTrades, type ChartPoint } from '../mockData'
import CandlestickChart from '../components/CandlestickChart'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import '../App.css'

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatUsd(n: number): string {
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Trades() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [chartData, setChartData] = useState<ChartPoint[]>(() => getMockChartData())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const seriesRef = useRef<ChartPoint[]>(getMockChartData())

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await getTrades(undefined, 100)
      setTrades(data)
      setLastUpdated(new Date())
    } catch {
      setTrades(mockTrades)
      setLastUpdated(new Date())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(() => load(true), TRADES_REFRESH_INTERVAL_MS)
    return () => clearInterval(t)
  }, [])

  // Real-time chart: append a new point every 2s
  useEffect(() => {
    const interval = setInterval(() => {
      appendMockChartPoint(seriesRef.current)
      setChartData([...seriesRef.current])
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  if (loading && trades.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>Trade history</h2>
        </div>
        <div className="chart-skeleton" />
        <div className="table-wrap">
          <table className="trades-table">
            <thead>
              <tr>
                <th><div className="skeleton skeleton-line short" /></th>
                <th><div className="skeleton skeleton-line short" /></th>
                <th><div className="skeleton skeleton-line short" /></th>
                <th><div className="skeleton skeleton-line short" /></th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td><div className="skeleton skeleton-line" /></td>
                  <td><div className="skeleton skeleton-line" /></td>
                  <td><div className="skeleton skeleton-line" /></td>
                  <td><div className="skeleton skeleton-line" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const latestPnL = chartData.length > 0 ? chartData[chartData.length - 1].pnl : 0
  const baseEquity = MOCK_BASE_EQUITY

  return (
    <>
      <div className="card chart-card">
        <div className="card-header">
          <div>
            <h2>Price (BTC/USDT)</h2>
            <p className="card-desc">1m candlesticks · live</p>
          </div>
        </div>
        <div className="chart-wrap candlestick-wrap">
          <CandlestickChart />
        </div>
      </div>

      <div className="card chart-card equity-card">
        <div className="card-header">
          <div>
            <h2>Portfolio equity</h2>
            <p className="card-desc">Cumulative equity from trade PnL · streaming</p>
          </div>
          <div className="chart-legend">
            <span className="chart-legend-label">Equity</span>
            <span className="chart-legend-value">${(baseEquity + latestPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className={`chart-legend-pnl ${latestPnL >= 0 ? 'pnl-pos' : 'pnl-neg'}`}>
              {latestPnL >= 0 ? '+' : ''}{formatUsd(latestPnL)}
            </span>
          </div>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 12, right: 12, left: 12, bottom: 12 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" opacity={0.6} />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => '$' + (v / 1000).toFixed(1) + 'k'}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'var(--text-strong)' }}
                formatter={(value: number) => [formatUsd(value), 'Equity']}
                labelFormatter={(label) => label}
              />
              <ReferenceLine y={baseEquity} stroke="var(--text-muted)" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Line
                type="monotone"
                dataKey="equity"
                name="Equity"
                stroke="var(--accent)"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={true}
                animationDuration={400}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Trade history</h2>
            <p className="card-desc">Monitored by Guardian. Auto-refresh every {TRADES_REFRESH_INTERVAL_MS / 1000}s.</p>
          </div>
          <button
            className="btn"
            onClick={() => load(true)}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        {trades.length === 0 ? (
          <div className="empty">
            <span className="empty-icon">▣</span>
            <p>No trades recorded yet.</p>
            <p style={{ fontSize: '0.8125rem' }}>Trades appear when you open positions or call the webhook.</p>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="trades-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Exchange</th>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th>Size</th>
                    <th>Entry</th>
                    <th>Leverage</th>
                    <th>PnL</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t) => (
                    <tr key={t.id}>
                      <td>{formatDate(t.opened_at)}</td>
                      <td>{t.exchange}</td>
                      <td className="mono">{t.symbol}</td>
                      <td className={t.side === 'long' ? 'side-long' : 'side-short'}>{t.side}</td>
                      <td className="num">{t.size}</td>
                      <td className="mono num">{formatUsd(t.entry_price)}</td>
                      <td className="num">{t.leverage}×</td>
                      <td className={t.pnl != null ? (t.pnl >= 0 ? 'pnl-pos' : 'pnl-neg') : ''}>
                        {t.pnl != null ? formatUsd(t.pnl) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {lastUpdated && (
              <p className="last-updated">
                Last updated {lastUpdated.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            )}
          </>
        )}
      </div>
    </>
  )
}
