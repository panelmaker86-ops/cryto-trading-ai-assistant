/**
 * Dummy data for dashboard when API is not available (e.g. npm run dev only).
 */
import type { Settings, Alert, Trade, AccountSnapshot } from './api'

const now = new Date()
const iso = (minsAgo: number) => new Date(now.getTime() - minsAgo * 60 * 1000).toISOString()

export const mockSettings: Settings = {
  risk: {
    max_risk_per_trade_pct: 2,
    max_daily_loss_pct: 5,
    max_leverage: 10,
    max_position_pct_of_balance: 15,
  },
  strategy: {
    strategy_name: 'BTC pullback long',
    entry_conditions: { rsi_max: 35, near_support: true, btc_trend: 'bullish' },
    exit_conditions: { profit_target_r: 1.5, stop_below_support: true },
  },
}

export const mockAlerts: Alert[] = [
  {
    id: 1,
    level: 'warning',
    title: 'Risk per trade exceeded',
    message: 'This trade risks ~2.8% of your capital. Your strategy rule is max 2%.',
    source: 'risk_engine.position_risk',
    trade_snapshot: { symbol: 'BTCUSDT', side: 'long', size: 0.015, entry_price: 73850 },
    created_at: iso(2),
  },
  {
    id: 2,
    level: 'info',
    title: 'High volatility',
    message: '24h volatility is 3.8%. Consider smaller size or wider stops.',
    source: 'ai_analysis.market_risk_scanner',
    trade_snapshot: null,
    created_at: iso(5),
  },
  {
    id: 3,
    level: 'critical',
    title: 'Daily loss limit approached',
    message: "Today's drawdown is 4.9% of equity. Your rule is max 5% daily loss.",
    source: 'risk_engine.drawdown_monitor',
    trade_snapshot: null,
    created_at: iso(12),
  },
  {
    id: 4,
    level: 'warning',
    title: 'Entry rule mismatch: RSI',
    message: 'RSI is 42 but strategy requires RSI < 35.',
    source: 'strategy_validator.rule_engine',
    trade_snapshot: { symbol: 'ETHUSDT', side: 'long', size: 0.2, entry_price: 3580 },
    created_at: iso(25),
  },
  {
    id: 5,
    level: 'warning',
    title: 'Possible revenge trading detected',
    message: '3 trades opened within 15 minutes after a losing close.',
    source: 'emotion_detector.behavior_model',
    trade_snapshot: { symbol: 'BTCUSDT', side: 'short', size: 0.01, entry_price: 73680 },
    created_at: iso(45),
  },
]

/** Trade history: newest first. PnL = (exit−entry)×size (long) or (entry−exit)×size (short). */
export const mockTrades: Trade[] = [
  {
    id: 12,
    exchange: 'binance',
    symbol: 'BTCUSDT',
    side: 'long',
    size: 0.008,
    entry_price: 73755,
    leverage: 3,
    opened_at: iso(70),
    closed_at: null,
    exit_price: null,
    pnl: null,
  },
  {
    id: 11,
    exchange: 'binance',
    symbol: 'BTCUSDT',
    side: 'long',
    size: 0.12,
    entry_price: 73400,
    leverage: 5,
    opened_at: iso(260),
    closed_at: iso(245),
    exit_price: 74150,
    pnl: 90,
  },
  {
    id: 10,
    exchange: 'bybit',
    symbol: 'ETHUSDT',
    side: 'short',
    size: 0.25,
    entry_price: 3620,
    leverage: 8,
    opened_at: iso(165),
    closed_at: iso(138),
    exit_price: 3588,
    pnl: 8,
  },
  {
    id: 9,
    exchange: 'bybit',
    symbol: 'ETHUSDT',
    side: 'long',
    size: 0.15,
    entry_price: 3540,
    leverage: 5,
    opened_at: iso(480),
    closed_at: iso(450),
    exit_price: 3510,
    pnl: -4.5,
  },
  {
    id: 8,
    exchange: 'binance',
    symbol: 'BTCUSDT',
    side: 'short',
    size: 0.02,
    entry_price: 73800,
    leverage: 5,
    opened_at: iso(720),
    closed_at: iso(705),
    exit_price: 73650,
    pnl: 30,
  },
  {
    id: 7,
    exchange: 'binance',
    symbol: 'ETHUSDT',
    side: 'long',
    size: 0.2,
    entry_price: 3520,
    leverage: 5,
    opened_at: iso(1440 + 120),
    closed_at: iso(1440 + 60),
    exit_price: 3550,
    pnl: 6,
  },
  {
    id: 6,
    exchange: 'bybit',
    symbol: 'BTCUSDT',
    side: 'long',
    size: 0.05,
    entry_price: 73100,
    leverage: 3,
    opened_at: iso(1560),
    closed_at: iso(1500),
    exit_price: 73500,
    pnl: 20,
  },
  {
    id: 5,
    exchange: 'binance',
    symbol: 'BTCUSDT',
    side: 'short',
    size: 0.1,
    entry_price: 73900,
    leverage: 10,
    opened_at: iso(1740),
    closed_at: iso(1680),
    exit_price: 74050,
    pnl: -15,
  },
  {
    id: 4,
    exchange: 'bybit',
    symbol: 'ETHUSDT',
    side: 'short',
    size: 0.1,
    entry_price: 3580,
    leverage: 5,
    opened_at: iso(2880),
    closed_at: iso(2850),
    exit_price: 3560,
    pnl: 2,
  },
  {
    id: 3,
    exchange: 'binance',
    symbol: 'BTCUSDT',
    side: 'long',
    size: 0.03,
    entry_price: 72800,
    leverage: 5,
    opened_at: iso(3060),
    closed_at: iso(3000),
    exit_price: 73200,
    pnl: 12,
  },
  {
    id: 2,
    exchange: 'bybit',
    symbol: 'ETHUSDT',
    side: 'long',
    size: 0.5,
    entry_price: 3480,
    leverage: 5,
    opened_at: iso(4320),
    closed_at: iso(4260),
    exit_price: 3510,
    pnl: 15,
  },
  {
    id: 1,
    exchange: 'binance',
    symbol: 'BTCUSDT',
    side: 'long',
    size: 0.015,
    entry_price: 72400,
    leverage: 3,
    opened_at: iso(4560),
    closed_at: iso(4500),
    exit_price: 73100,
    pnl: 10.5,
  },
]

export const mockAccount: AccountSnapshot = {
  exchange: 'binance',
  balance: 18750,
  equity: 18820,
  unrealized_pnl: 70,
  timestamp: now.toISOString(),
}

/** Simulate a short delay for mock responses */
export function mockDelay(ms = 200): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/** Chart point for equity curve (Recharts) */
export type ChartPoint = {
  time: string
  label: string
  equity: number
  pnl: number
}

export const MOCK_BASE_EQUITY = 18500
const baseEquity = MOCK_BASE_EQUITY
const chartMinutes = 60

function buildInitialChartData(): ChartPoint[] {
  const points: ChartPoint[] = []
  let equity = baseEquity
  let pnl = 0
  const now = Date.now()
  for (let i = chartMinutes; i >= 0; i -= 2) {
    const t = new Date(now - i * 60 * 1000)
    const variation = (Math.random() - 0.5) * 24
    pnl += variation
    equity = baseEquity + pnl
    points.push({
      time: t.toISOString(),
      label: t.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      equity: Math.round(equity * 100) / 100,
      pnl: Math.round(pnl * 100) / 100,
    })
  }
  return points
}

let cachedChartData: ChartPoint[] | null = null

export function getMockChartData(): ChartPoint[] {
  if (!cachedChartData) cachedChartData = buildInitialChartData()
  return [...cachedChartData]
}

export function appendMockChartPoint(series: ChartPoint[]): ChartPoint {
  const last = series[series.length - 1]
  const variation = (Math.random() - 0.5) * 18
  const pnl = last.pnl + variation
  const equity = baseEquity + pnl
  const t = new Date()
  const point: ChartPoint = {
    time: t.toISOString(),
    label: t.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    equity: Math.round(equity * 100) / 100,
    pnl: Math.round(pnl * 100) / 100,
  }
  series.push(point)
  if (series.length > 90) series.shift()
  return point
}

/** Candlestick (OHLC) for lightweight-charts. time = unix seconds UTC */
export type Candle = {
  time: number
  open: number
  high: number
  low: number
  close: number
}

const basePrice = 73755
const candleIntervalSec = 60

/** Build initial mock candles (e.g. last 60 candles, 1-min each). BTC-like 1m moves. */
export function getMockCandles(count = 60): Candle[] {
  const candles: Candle[] = []
  const now = Math.floor(Date.now() / 1000)
  let close = basePrice
  for (let i = count - 1; i >= 0; i--) {
    const time = now - i * candleIntervalSec
    const change = (Math.random() - 0.5) * 120
    const open = close
    close = Math.round((open + change) * 100) / 100
    const high = Math.round((Math.max(open, close) + Math.random() * 35) * 100) / 100
    const low = Math.round((Math.min(open, close) - Math.random() * 35) * 100) / 100
    candles.push({
      time,
      open,
      high: Math.max(high, open, close),
      low: Math.min(low, open, close),
      close,
    })
  }
  return candles
}

/** Append or update last candle for real-time. Returns new candle data. */
export function tickMockCandle(candles: Candle[]): Candle {
  const now = Math.floor(Date.now() / 1000)
  const last = candles[candles.length - 1]
  const isNewCandle = now >= last.time + candleIntervalSec
  const change = (Math.random() - 0.5) * 60
  const newClose = Math.round((last.close + change) * 100) / 100
  if (isNewCandle) {
    const high = Math.round((Math.max(last.close, newClose) + Math.random() * 25) * 100) / 100
    const low = Math.round((Math.min(last.close, newClose) - Math.random() * 25) * 100) / 100
    const c: Candle = {
      time: now,
      open: last.close,
      high: Math.max(high, last.close, newClose),
      low: Math.min(low, last.close, newClose),
      close: newClose,
    }
    candles.push(c)
    if (candles.length > 120) candles.shift()
    return c
  }
  const high = Math.round(Math.max(last.high, newClose) * 100) / 100
  const low = Math.round(Math.min(last.low, newClose) * 100) / 100
  last.high = high
  last.low = low
  last.close = newClose
  return last
}
