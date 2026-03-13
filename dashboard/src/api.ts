/**
 * Strategy Guardian AI - API client
 * Uses dummy data when backend is unavailable (e.g. npm run dev without API).
 */

const BASE = ''; // use Vite proxy in dev

import {
  mockSettings,
  mockAlerts,
  mockTrades,
  mockAccount,
  mockDelay,
} from './mockData'

export type RiskSettings = {
  max_risk_per_trade_pct: number
  max_daily_loss_pct: number
  max_leverage: number
  max_position_pct_of_balance: number
}

export type StrategySettings = {
  strategy_name: string
  entry_conditions: Record<string, unknown>
  exit_conditions: Record<string, unknown>
}

export type Settings = {
  risk: RiskSettings
  strategy: StrategySettings
}

export type Alert = {
  id: number
  level: 'info' | 'warning' | 'critical'
  title: string
  message: string
  source: string
  trade_snapshot: Record<string, unknown> | null
  created_at: string
}

export type Trade = {
  id: number
  exchange: string
  symbol: string
  side: string
  size: number
  entry_price: number
  leverage: number
  opened_at: string
  closed_at: string | null
  exit_price: number | null
  pnl: number | null
}

export type AccountSnapshot = {
  exchange: string
  balance: number
  equity: number
  unrealized_pnl: number
  timestamp: string
}

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

/** Refresh interval for trade history: shorter in mock so "Last updated" is visible. */
export const TRADES_REFRESH_INTERVAL_MS = useMock ? 5000 : 15000

async function withFallback<T>(real: () => Promise<T>, mock: () => T): Promise<T> {
  if (useMock) {
    await mockDelay()
    return mock()
  }
  try {
    return await real()
  } catch {
    await mockDelay()
    return mock()
  }
}

export async function getSettings(): Promise<Settings> {
  return withFallback(
    async () => {
      const r = await fetch(`${BASE}/api/settings`)
      if (!r.ok) throw new Error('Failed to fetch settings')
      return r.json()
    },
    () => mockSettings
  )
}

export async function putSettings(risk?: Partial<RiskSettings>, strategy?: Partial<StrategySettings>): Promise<void> {
  if (useMock) {
    await mockDelay()
    return
  }
  try {
    const r = await fetch(`${BASE}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ risk: risk || null, strategy: strategy || null }),
    })
    if (!r.ok) throw new Error('Failed to update settings')
  } catch {
    await mockDelay()
  }
}

export async function getAlerts(limit = 100): Promise<Alert[]> {
  return withFallback(
    async () => {
      const r = await fetch(`${BASE}/api/alerts?limit=${limit}`)
      if (!r.ok) throw new Error('Failed to fetch alerts')
      return r.json()
    },
    () => mockAlerts
  )
}

export async function getTrades(exchange?: string, limit = 100): Promise<Trade[]> {
  return withFallback(
    async () => {
      const params = new URLSearchParams({ limit: String(limit) })
      if (exchange) params.set('exchange', exchange)
      const r = await fetch(`${BASE}/api/trades?${params}`)
      if (!r.ok) throw new Error('Failed to fetch trades')
      return r.json()
    },
    () => mockTrades
  )
}

export async function getAccount(exchange: string): Promise<AccountSnapshot> {
  return withFallback(
    async () => {
      const r = await fetch(`${BASE}/account/${exchange}`)
      if (!r.ok) throw new Error(`Failed to fetch account: ${exchange}`)
      return r.json()
    },
    () => ({ ...mockAccount, exchange })
  )
}

export async function getPositions(exchange: string): Promise<unknown[]> {
  if (useMock) {
    await mockDelay()
    return []
  }
  try {
    const r = await fetch(`${BASE}/positions/${exchange}`)
    if (!r.ok) throw new Error(`Failed to fetch positions: ${exchange}`)
    return r.json()
  } catch {
    await mockDelay()
    return []
  }
}

export async function health(): Promise<{ status: string }> {
  if (useMock) {
    await mockDelay(100)
    return { status: 'ok' }
  }
  const r = await fetch(`${BASE}/health`)
  if (!r.ok) throw new Error('API unhealthy')
  return r.json()
}
