import { useEffect, useMemo, useState } from 'react'

import { CONFIGURATION_ROUTES } from '../../configuration/route/configuration.route'
import { HISTORY_ROUTES } from '../../history/route/history.route'
import { HOME_ROUTES } from '../../home/route/home.route'
import { INGESTION_ROUTES } from '../../ingestion/route/ingestion.route'
import { USERS_ROUTES } from '../../users/route/users.route'
import type { FinanceDashboardModel, FinanceGranularity } from '../model/finance.model'
import { FINANCE_ROUTES } from '../route/finance.route'
import {
  FINANCE_GRANULARITY_OPTIONS,
  FINANCE_RANGE_OPTIONS,
  MONTHLY_BUDGET_TARGET,
  buildFinanceDashboard,
  buildFinanceDetails,
  calculateProgress,
  formatMoney,
  formatPercent,
  getDayOptions,
  getMonthPeriodOptions,
  getFinanceRange,
} from '../schemas/finance.schemas'
import {
  getCurrentFinanceUserService,
  getFinanceSensorPointsService,
  getFinanceTariffService,
  logoutFinanceService,
} from '../service/finance.service'
import './finance.view.css'

export function FinanceView() {
  const [granularity, setGranularity] = useState<FinanceGranularity>('month')
  const [rangeDays, setRangeDays] = useState(30)
  const periodOptions = useMemo(() => getMonthPeriodOptions(24), [])
  const [periodKey, setPeriodKey] = useState(periodOptions[0]?.key ?? '')
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [summary, setSummary] = useState<FinanceDashboardModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const user = useMemo(() => getCurrentFinanceUserService(), [])
  const selectedPeriod = periodOptions.find((item) => item.key === periodKey) ?? periodOptions[0]
  const dayOptions = useMemo(() => getDayOptions(selectedPeriod.year, selectedPeriod.month), [selectedPeriod.year, selectedPeriod.month])

  useEffect(() => {
    let isMounted = true

    const loadFinance = async () => {
      try {
        const range = getFinanceRange({
          granularity,
          days: rangeDays,
          year: selectedPeriod.year,
          month: selectedPeriod.month,
          day: selectedDay,
        })
        const [points, tariff] = await Promise.all([
          getFinanceSensorPointsService({ granularity, fromDate: range.fromDate, toDate: range.toDate }),
          getFinanceTariffService({ year: selectedPeriod.year, month: selectedPeriod.month }),
        ])

        if (!isMounted) {
          return
        }

        const dashboard = buildFinanceDashboard({
          points,
          granularity,
          waterCostPerM3: tariff.waterCostPerM3,
          energyCostPerKwh: tariff.energyCostPerKwh,
          currency: 'COP',
        })

        setSummary(dashboard)
        setErrorMessage('')
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message = error instanceof Error ? error.message : 'No se pudo cargar el panel financiero.'
        setErrorMessage(message)
        setSummary(
          buildFinanceDashboard({
            points: [],
            granularity,
            currency: 'COP',
          }),
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadFinance()

    return () => {
      isMounted = false
    }
  }, [granularity, rangeDays, periodKey, selectedDay, selectedPeriod.year, selectedPeriod.month])

  const data = summary ?? buildFinanceDashboard({ points: [], granularity, currency: 'COP' })
  const details = buildFinanceDetails(data)
  const waterProgress = calculateProgress(data.water_cost, MONTHLY_BUDGET_TARGET)
  const energyProgress = calculateProgress(data.energy_cost, MONTHLY_BUDGET_TARGET)

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
    logoutFinanceService()
    window.location.assign('/')
  }

  return (
    <div className="finance-view">
      <div className="finance-shell">
        <aside className="finance-sidebar">
          <div className="finance-sidebar__brand">
            <img src="/Logo.png" alt="Logo SIGAR" />
            <strong>SIGAR</strong>
          </div>

          <nav className="finance-sidebar__menu" aria-label="Menu principal">
            <button className="finance-menu-item" onClick={handleGoHome} type="button">
              <PowerIcon />
              Panel Principal
            </button>
            <button className="finance-menu-item" onClick={handleGoHistory} type="button">
              <ChartIcon />
              Historico
            </button>
            <button className="finance-menu-item finance-menu-item--active" onClick={handleGoFinance} type="button">
              <CoinIcon />
              Consumo Financiero
            </button>
            <button className="finance-menu-item" onClick={handleGoConfiguration} type="button">
              <GearIcon />
              Configuracion
            </button>
            <button className="finance-menu-item" onClick={handleGoUsers} type="button">
              <UserIcon />
              Usuarios
            </button>
            <button className="finance-menu-item" onClick={handleGoIngestion} type="button">
              <DropIcon />
              Inyección
            </button>
          </nav>

          <button className="finance-sidebar__logout" onClick={handleLogout} type="button">
            Cerrar sesion
          </button>
        </aside>

        <section className="finance-content">
          <header className="finance-topbar">
            <div className="finance-topbar__title">
              <CoinIcon />
              Panel Financiero
            </div>
            <div className="finance-topbar__user">
              <span>
                Bienvenido, <strong>{welcomeName}</strong>
              </span>
              <div className="finance-avatar">{avatarLetter}</div>
            </div>
          </header>

          <div className="finance-content__headline">
            <h1>Panel Financiero</h1>
            <div className="finance-filters">
              <div className="finance-segmented" role="group" aria-label="Granularidad">
                {FINANCE_GRANULARITY_OPTIONS.map((option) => (
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

              <label className="finance-select-wrap">
                <CalendarIcon />
                <select value={periodKey} onChange={(event) => setPeriodKey(event.target.value)}>
                  {periodOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="finance-select-wrap">
                <select value={rangeDays} onChange={(event) => setRangeDays(Number(event.target.value))}>
                  {FINANCE_RANGE_OPTIONS.map((option) => (
                    <option key={option.days} value={option.days}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="finance-select-wrap">
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

          {errorMessage ? <p className="finance-error">{errorMessage}</p> : null}

          <section className="finance-kpi-grid">
            <FinanceRingCard
              icon={<DropIcon />}
              title="Riego"
              value={data.water_cost}
              target={MONTHLY_BUDGET_TARGET}
              progress={waterProgress}
              currency={data.currency}
            />

            <FinanceRingCard
              icon={<BulbIcon />}
              title="Iluminacion"
              value={data.energy_cost}
              target={MONTHLY_BUDGET_TARGET}
              progress={energyProgress}
              currency={data.currency}
            />
          </section>

          <section className="finance-bottom-grid">
            <article className="finance-card finance-card--details">
              <div className="finance-totals">
                <div>
                  <h2>Total Gasto General</h2>
                  <p className="finance-total-value">{formatMoney(data.total_cost, data.currency)}</p>
                </div>
                <div className="finance-budget-note">
                  Tarifa agua m3: {formatMoney(data.water_cost_per_m3, data.currency)}
                  <br />
                  Tarifa energia kWh: {formatMoney(data.energy_cost_per_kwh, data.currency)}
                </div>
              </div>

              <div className="finance-detail-header">
                <span>Detalle de Gastos</span>
                <span>Costos</span>
              </div>

              <div className="finance-detail-list">
                {details.map((item) => (
                  <div className="finance-detail-row" key={item.label}>
                    <span>{item.label}</span>
                    <strong>{formatMoney(item.amount, data.currency)}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="finance-card finance-card--chart">
              <h2>Resumen Mensual (COP)</h2>
              <MonthlyBarChart points={data.trend} currency={data.currency} loading={isLoading} />
            </article>
          </section>
        </section>
      </div>
    </div>
  )
}

function FinanceRingCard(props: {
  icon: React.ReactNode
  title: string
  value: number
  target: number
  progress: number
  currency: string
}) {
  const { icon, title, value, target, progress, currency } = props

  return (
    <article className="finance-card finance-card--ring">
      <div className="finance-ring" style={{ ['--progress' as string]: `${progress}%` }}>
        <div className="finance-ring__inner">
          {icon}
          <strong>{formatMoney(value, currency)}</strong>
          <small>{formatMoney(target, currency)}</small>
        </div>
      </div>

      <div className="finance-ring__meta">
        <h2>{title}</h2>
        <p>{formatMoney(value, currency)}</p>
        <span>Presupuesto {formatMoney(target, currency)}</span>
        <div className="finance-progress">
          <div style={{ width: `${progress}%` }} />
        </div>
        <strong>{`+${formatPercent(progress)}`}</strong>
      </div>
    </article>
  )
}

function MonthlyBarChart(props: { points: { bucket: string; water_cost: number; energy_cost: number; total_cost: number }[]; currency: string; loading: boolean }) {
  const { points, currency, loading } = props

  if (loading) {
    return <p className="finance-loading">Cargando datos...</p>
  }

  if (points.length === 0) {
    return <p className="finance-loading">Sin datos en el rango seleccionado.</p>
  }

  const maxValue = Math.max(...points.map((item) => Math.max(item.water_cost, item.energy_cost)), 1)

  return (
    <div className="finance-bars">
      {points.map((item, index) => {
        const waterHeight = `${Math.max((item.water_cost / maxValue) * 100, 6)}%`
        const energyHeight = `${Math.max((item.energy_cost / maxValue) * 100, 6)}%`
        const isLast = index === points.length - 1

        return (
          <div className="finance-bar-item" key={`${item.bucket}-${index}`}>
            {isLast ? <span className="finance-bar-value">{formatMoney(item.total_cost, currency)}</span> : null}
            <div className="finance-bar-group">
              <div className={`finance-bar finance-bar--water ${isLast ? 'finance-bar--active' : ''}`} style={{ height: waterHeight }} />
              <div className={`finance-bar finance-bar--energy ${isLast ? 'finance-bar--active' : ''}`} style={{ height: energyHeight }} />
            </div>
            <span>{item.bucket}</span>
          </div>
        )
      })}
    </div>
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

function DropIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 10C32 10 18 25 18 34C18 42.28 24.27 49 32 49C39.73 49 46 42.28 46 34C46 25 32 10 32 10Z" fill="currentColor" />
    </svg>
  )
}

function BulbIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 11C23.16 11 16 17.94 16 26.5C16 31.74 18.69 36.37 22.77 39.17C24.19 40.14 25 41.75 25 43.47V45H39V43.47C39 41.75 39.81 40.14 41.23 39.17C45.31 36.37 48 31.74 48 26.5C48 17.94 40.84 11 32 11Z" fill="currentColor" />
      <path d="M26 50H38" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M27 56H37" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
