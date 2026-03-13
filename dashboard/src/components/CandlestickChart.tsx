import { useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts'
import { getMockCandles, tickMockCandle, type Candle } from '../mockData'
import '../App.css'

const CHART_HEIGHT = 320

export default function CandlestickChart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null)
  const seriesRef = useRef<ReturnType<ReturnType<typeof createChart>['addCandlestickSeries']> | null>(null)
  const candlesRef = useRef<Candle[]>(getMockCandles(60))

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const chart = createChart(el, {
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: '#8c929d',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(30, 33, 40, 0.5)' },
        horzLines: { color: 'rgba(30, 33, 40, 0.5)' },
      },
      rightPriceScale: {
        borderColor: '#1e2128',
        scaleMargins: { top: 0.1, bottom: 0.15 },
      },
      timeScale: {
        borderColor: '#1e2128',
        timeVisible: true,
        secondsVisible: false,
      },
      width: el.clientWidth,
      height: CHART_HEIGHT,
    })

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#0d9488',
      downColor: '#dc2626',
      borderUpColor: '#0d9488',
      borderDownColor: '#dc2626',
    })

    const data = candlesRef.current.map((c) => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))
    candlestickSeries.setData(data)

    chart.timeScale().fitContent()

    chartRef.current = chart
    seriesRef.current = candlestickSeries

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  // Real-time: update or append candle every 2s
  useEffect(() => {
    const interval = setInterval(() => {
      const last = tickMockCandle(candlesRef.current)
      const series = seriesRef.current
      if (!series) return
      series.update({
        time: last.time,
        open: last.open,
        high: last.high,
        low: last.low,
        close: last.close,
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      ref={containerRef}
      className="candlestick-chart-container"
      style={{ height: CHART_HEIGHT }}
    />
  )
}
