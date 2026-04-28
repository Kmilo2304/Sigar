import { useEffect, useMemo, useState } from 'react'

import { CONFIGURATION_ROUTES } from '../../configuration/route/configuration.route'
import { FINANCE_ROUTES } from '../../finance/route/finance.route'
import { HOME_ROUTES } from '../../home/route/home.route'
import { INGESTION_ROUTES } from '../../ingestion/route/ingestion.route'
import { USERS_ROUTES } from '../../users/route/users.route'
import {
  HISTORY_GRANULARITY_OPTIONS,
  HISTORY_RANGE_OPTIONS,
  getDayOptions,
  getMonthPeriodOptions,
  getDefaultRange,
  mapHistoryResponseToSeries,
} from '../schemas/history.schemas'
import {
  getComparativeHistoryService,
  getCurrentHistoryUserService,
  logoutHistoryService,
} from '../service/history.service'
import { HISTORY_ROUTES } from '../route/history.route'
import type {
  ComparativeHistoryResponseModel,
  HistoryGranularity,
  HistorySeriesPointModel,
} from '../model/history.model'
import './history.view.css'

export function HistoryView() {
  const [granularity, setGranularity] = useState<HistoryGranularity>('month')
  const [rangeDays, setRangeDays] = useState(30)
  const periodOptions = useMemo(() => getMonthPeriodOptions(24), [])
  const [periodKey, setPeriodKey] = useState(periodOptions[0]?.key ?? '')
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [data, setData] = useState<ComparativeHistoryResponseModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const user = useMemo(() => getCurrentHistoryUserService(), [])
  const selectedPeriod = periodOptions.find((item) => item.key === periodKey) ?? periodOptions[0]
  const dayOptions = useMemo(() => getDayOptions(selectedPeriod.year, selectedPeriod.month), [selectedPeriod.year, selectedPeriod.month])

  useEffect(() => {
    let isMounted = true

    const loadHistory = async () => {
      try {
        const range = getDefaultRange({
          granularity,
          days: rangeDays,
          year: selectedPeriod.year,
          month: selectedPeriod.month,
          day: selectedDay,
        })
        const response = await getComparativeHistoryService({
          granularity,
          fromDate: range.fromDate,
          toDate: range.toDate,
        })

        if (!isMounted) {
          return
        }

        setData(response)
        setErrorMessage('')
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message = error instanceof Error ? error.message : 'No se pudo cargar el panel histórico.'
        setErrorMessage(message)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadHistory()

    return () => {
      isMounted = false
    }
  }, [granularity, rangeDays, periodKey, selectedDay, selectedPeriod.year, selectedPeriod.month])

  const series = mapHistoryResponseToSeries(data)
  const welcomeName = user?.full_name ?? 'Administrador SIGAR'
  const avatarLetter = welcomeName.trim().charAt(0).toUpperCase() || 'A'

  const handleGoHome = () => {
    window.location.assign(HOME_ROUTES.home)
  }

  const handleGoHistory = () => {
    window.location.assign(HISTORY_ROUTES.history)
  }

  const handleGoFinance = () => {
    window.location.assign(FINANCE_ROUTES.finance)
  }

  const handleGoConfiguration = () => {
    window.location.assign(CONFIGURATION_ROUTES.configuration)
  }

  const handleGoUsers = () => {
    window.location.assign(USERS_ROUTES.users)
  }

  const handleGoIngestion = () => {
    window.open(INGESTION_ROUTES.ingestion, '_blank', 'noopener,noreferrer')
  }

  const handleLogout = () => {
    logoutHistoryService()
    window.location.assign('/')
  }

  return (
    <div className="history-view">
      <div className="history-shell">
        <aside className="history-sidebar">
          <div className="history-sidebar__brand">
            <img src="/Logo.png" alt="Logo SIGAR" />
            <strong>SIGAR</strong>
          </div>

          <nav className="history-sidebar__menu" aria-label="Menú principal">
            <button className="history-menu-item" onClick={handleGoHome} type="button">
              <PowerIcon />
              Panel Principal
            </button>
            <button className="history-menu-item history-menu-item--active" onClick={handleGoHistory} type="button">
              <ChartIcon />
              Histórico
            </button>
            <button className="history-menu-item" onClick={handleGoFinance} type="button">
              <CoinIcon />
              Consumo Financiero
            </button>
            <button className="history-menu-item" onClick={handleGoConfiguration} type="button">
              <GearIcon />
              Configuración
            </button>
            <button className="history-menu-item" onClick={handleGoUsers} type="button">
              <UserIcon />
              Usuarios
            </button>
            <button className="history-menu-item" onClick={handleGoIngestion} type="button">
              <DropIcon />
              Inyección
            </button>
          </nav>

          <div className="history-sidebar__mode">
            <PowerIcon />
            <span>
              Modo Automático
              <small>Activado</small>
            </span>
          </div>

          <button className="history-sidebar__logout" onClick={handleLogout} type="button">
            Cerrar sesión
          </button>
        </aside>

        <section className="history-content">
          <header className="history-topbar">
            <div className="history-topbar__title">
              <ChartIcon />
              Panel Histórico
            </div>
            <div className="history-topbar__user">
              <span>
                Bienvenido, <strong>{welcomeName}</strong>
              </span>
              <div className="history-avatar">{avatarLetter}</div>
            </div>
          </header>

          <div className="history-content__headline">
            <h1>Panel Histórico</h1>
            <div className="history-filters">
              <div className="history-segmented" role="group" aria-label="Granularidad">
                {HISTORY_GRANULARITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={granularity === option.value ? 'is-active' : ''}
                    onClick={() => setGranularity(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <label className="history-select-wrap">
                <CalendarIcon />
                <select value={periodKey} onChange={(event) => setPeriodKey(event.target.value)}>
                  {periodOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="history-select-wrap">
                <select
                  value={rangeDays}
                  onChange={(event) => setRangeDays(Number(event.target.value))}
                >
                  {HISTORY_RANGE_OPTIONS.map((option) => (
                    <option key={option.days} value={option.days}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="history-select-wrap">
                <select value={selectedDay ?? ''} onChange={(event) => setSelectedDay(event.target.value ? Number(event.target.value) : null)}>
                  <option value="">Todos los días</option>
                  {dayOptions.map((day) => (
                    <option key={day} value={day}>
                      Día {day}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {errorMessage ? <p className="history-error">{errorMessage}</p> : null}

          <HistoryChartCard
            loading={isLoading}
            points={series.water}
            title="Consumo de Agua (litros)"
            tooltipLabel="Agua"
            unit="L"
            valueDecimals={0}
          />

          <HistoryChartCard
            loading={isLoading}
            points={series.energy}
            title="Consumo de Energía (kWh)"
            tooltipLabel="Energía"
            unit="kWh"
            valueDecimals={1}
          />
        </section>
      </div>
    </div>
  )
}

function HistoryChartCard(props: {
  title: string
  points: HistorySeriesPointModel[]
  unit: string
  tooltipLabel: string
  valueDecimals: number
  loading: boolean
}) {
  const { points, unit, tooltipLabel, valueDecimals, title, loading } = props

  if (loading) {
    return (
      <article className="history-card">
        <h2>{title}</h2>
        <p className="history-loading">Cargando datos...</p>
      </article>
    )
  }

  if (points.length === 0) {
    return (
      <article className="history-card">
        <h2>{title}</h2>
        <p className="history-empty">Sin datos en el rango seleccionado.</p>
      </article>
    )
  }

  const maxSource = Math.max(...points.map((point) => point.value), 1)
  const maxValue = Math.max(1, maxSource * 1.08)
  const minValue = 0
  const yRange = maxValue - minValue || 1

  const width = 1020
  const height = 290
  const left = 56
  const right = 18
  const top = 16
  const bottom = 46
  const chartWidth = width - left - right
  const chartHeight = height - top - bottom

  const labelStep = Math.max(1, Math.ceil(points.length / 10))
  const highlightedIndex = Math.min(points.length - 1, Math.floor(points.length * 0.55))

  const pointsXY = points.map((point, index) => {
    const x = left + (index / Math.max(points.length - 1, 1)) * chartWidth
    const y = top + ((maxValue - point.value) / yRange) * chartHeight
    return { ...point, x, y }
  })

  const linePath = pointsXY
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ')

  const highlighted = pointsXY[highlightedIndex]
  const tooltipX = Math.max(left + 12, Math.min(highlighted.x - 88, width - 196))
  const tooltipY = Math.max(top + 6, highlighted.y - 82)

  return (
    <article className="history-card">
      <h2>{title}</h2>

      <svg className="history-chart" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => {
          const y = top + (index / 4) * chartHeight
          const value = maxValue - (index / 4) * yRange
          return (
            <g key={`y-${index}`}>
              <line className="history-grid-line" x1={left} x2={width - right} y1={y} y2={y} />
              <text className="history-axis-label" x={left - 10} y={y + 4} textAnchor="end">
                {value.toFixed(valueDecimals)}
              </text>
            </g>
          )
        })}

        {pointsXY.map((point, index) => (
          <line
            key={`v-${index}`}
            className="history-grid-line history-grid-line--vertical"
            x1={point.x}
            x2={point.x}
            y1={top}
            y2={height - bottom}
          />
        ))}

        <path className="history-line" d={linePath} />

        {pointsXY.map((point, index) => (
          <circle
            key={`dot-${index}`}
            className={`history-dot ${index === highlightedIndex ? 'history-dot--active' : ''}`}
            cx={point.x}
            cy={point.y}
            r={index === highlightedIndex ? 4.4 : 3.4}
          />
        ))}

        {pointsXY.map((point, index) => (
          <text
            key={`x-${index}`}
            className="history-axis-label"
            x={point.x}
            y={height - 14}
            textAnchor="middle"
            opacity={index % labelStep === 0 || index === pointsXY.length - 1 ? 1 : 0}
          >
            {point.label}
          </text>
        ))}

        <g transform={`translate(${tooltipX}, ${tooltipY})`}>
          <rect className="history-tooltip" width="176" height="56" rx="8" />
          <text className="history-tooltip__title" x="12" y="23">
            {highlighted.label}
          </text>
          <text className="history-tooltip__value" x="12" y="42">
            {tooltipLabel}: {highlighted.value.toFixed(valueDecimals)} {unit}
          </text>
        </g>
      </svg>
    </article>
  )
}

function PowerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2V11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M6.35 4.35C4.34 5.79 3 8.15 3 10.83C3 15.25 6.58 18.83 11 18.83H13C17.42 18.83 21 15.25 21 10.83C21 8.15 19.66 5.79 17.65 4.35" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 19.5H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 15L10 11L13 13L18 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CoinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
      <path d="M9.5 10C9.5 8.9 10.4 8 11.5 8H13.1C14.15 8 15 8.85 15 9.9C15 10.75 14.44 11.5 13.63 11.75L10.4 12.75C9.59 13 9.03 13.75 9.03 14.6C9.03 15.65 9.88 16.5 10.93 16.5H12.5C13.6 16.5 14.5 15.6 14.5 14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 15.2C13.77 15.2 15.2 13.77 15.2 12C15.2 10.23 13.77 8.8 12 8.8C10.23 8.8 8.8 10.23 8.8 12C8.8 13.77 10.23 15.2 12 15.2Z" stroke="currentColor" strokeWidth="2" />
      <path d="M19.2 12.9V11.1L17.45 10.55C17.29 9.99 17.07 9.47 16.77 9L17.63 7.38L16.35 6.1L14.72 6.96C14.26 6.66 13.73 6.44 13.17 6.28L12.62 4.53H10.82L10.27 6.28C9.71 6.44 9.18 6.66 8.72 6.96L7.1 6.1L5.82 7.38L6.68 9C6.38 9.47 6.16 9.99 6 10.55L4.25 11.1V12.9L6 13.45C6.16 14.01 6.38 14.53 6.68 15L5.82 16.62L7.1 17.9L8.72 17.04C9.18 17.34 9.71 17.56 10.27 17.72L10.82 19.47H12.62L13.17 17.72C13.73 17.56 14.26 17.34 14.72 17.04L16.35 17.9L17.63 16.62L16.77 15C17.07 14.53 17.29 14.01 17.45 13.45L19.2 12.9Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="7" r="4" fill="currentColor" />
      <path d="M4 22C4.6 18.2 7.7 15.5 11.6 15.5H12.4C16.3 15.5 19.4 18.2 20 22" fill="currentColor" />
    </svg>
  )
}

function DropIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3C12 3 6.5 9.1 6.5 12.8C6.5 15.96 9.05 18.5 12.2 18.5C15.36 18.5 17.9 15.96 17.9 12.8C17.9 9.1 12 3 12 3Z" fill="currentColor" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="5" width="18" height="16" rx="2.2" stroke="currentColor" strokeWidth="2" />
      <path d="M7 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 10.5H21" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}
