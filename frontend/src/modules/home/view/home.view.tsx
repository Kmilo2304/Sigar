import { useEffect, useMemo, useState } from 'react'

import { CONFIGURATION_ROUTES } from '../../configuration/route/configuration.route'
import { FINANCE_ROUTES } from '../../finance/route/finance.route'
import { HISTORY_ROUTES } from '../../history/route/history.route'
import { INGESTION_ROUTES } from '../../ingestion/route/ingestion.route'
import { USERS_ROUTES } from '../../users/route/users.route'
import type { DashboardSummaryModel } from '../model/home.model'
import { getHumidityStatus, getLuxStatus, withHomeFallback, formatValue } from '../schemas/home.schemas'
import { getCurrentUserService, getDashboardSummaryService, logoutService, setControlModeService, toggleSystemService } from '../service/home.service'
import { HOME_ROUTES } from '../route/home.route'
import './home.view.css'

export function HomeView() {
  const [summary, setSummary] = useState<DashboardSummaryModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const user = useMemo(() => getCurrentUserService(), [])

  useEffect(() => {
    let isMounted = true

    const loadSummary = async () => {
      try {
        const data = await getDashboardSummaryService()
        if (!isMounted) {
          return
        }

        setSummary(data)
        setErrorMessage('')
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message = error instanceof Error ? error.message : 'No se pudo cargar la información del panel.'
        setErrorMessage(message)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadSummary()

    const intervalId = window.setInterval(() => {
      void loadSummary()
    }, 30000)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
    }
  }, [])

  const data = withHomeFallback(summary)
  const humidity = data.humidity ?? 0
  const lux = data.lux ?? 0
  const waterLiters = data.water_liters ?? 0
  const energyKwh = data.energy_kwh ?? 0

  const humidityStatus = getHumidityStatus(humidity)
  const luxStatus = getLuxStatus(lux)

  const welcomeName = user?.full_name ?? 'Usuario SIGAR'
  const avatarLetter = welcomeName.trim().charAt(0).toUpperCase() || 'U'

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
    logoutService()
    window.location.assign('/')
  }

  const handleControlMode = async (mode: 'automatic' | 'manual') => {
    try {
      await setControlModeService(mode)
      const fresh = await getDashboardSummaryService()
      setSummary(fresh)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cambiar el modo.'
      setErrorMessage(message)
    }
  }

  const handleToggleSystem = async (system: 'irrigation' | 'lights', action: 'on' | 'off') => {
    try {
      await toggleSystemService(system, action)
      const fresh = await getDashboardSummaryService()
      setSummary(fresh)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cambiar el estado.'
      setErrorMessage(message)
    }
  }

  return (
    <div className="home-view">
      <div className="home-shell">
        <aside className="home-sidebar">
          <div className="home-sidebar__brand">
            <img src="/Logo.png" alt="Logo SIGAR" />
            <strong>SIGAR</strong>
          </div>

          <nav className="home-sidebar__menu" aria-label="Menú principal">
            <button className="home-menu-item home-menu-item--active" onClick={handleGoHome} type="button">
              <PowerIcon />
              Panel Principal
            </button>
            <button className="home-menu-item" onClick={handleGoHistory} type="button">
              <ChartIcon />
              Histórico
            </button>
            <button className="home-menu-item" onClick={handleGoFinance} type="button">
              <CoinIcon />
              Consumo Financiero
            </button>
            <button className="home-menu-item" onClick={handleGoConfiguration} type="button">
              <GearIcon />
              Configuración
            </button>
            <button className="home-menu-item" onClick={handleGoUsers} type="button">
              <UserIcon />
              Usuarios
            </button>
            <button className="home-menu-item" onClick={handleGoIngestion} type="button">
              <DropIcon />
              Inyección
            </button>
          </nav>

          <div className="home-sidebar__mode">
            <PowerIcon />
            <span>
              Modo {data.manual_mode ? 'Manual' : 'Automático'}
              <small>{data.manual_mode ? 'Activado' : 'Activado'}</small>
            </span>
          </div>

          <button className="home-sidebar__logout" onClick={handleLogout} type="button">
            Cerrar sesión
          </button>
        </aside>

        <section className="home-content">
          <header className="home-topbar">
            <div className="home-topbar__title">
              <ChartIcon />
              Panel Principal
            </div>
            <div className="home-topbar__user">
              <span>
                Bienvenido, <strong>{welcomeName}</strong>
              </span>
              <div className="home-avatar">{avatarLetter}</div>
            </div>
          </header>

          <div className="home-content__headline">
            <h1>Panel Principal</h1>
          </div>

          {errorMessage ? <p className="home-error">{errorMessage}</p> : null}

          <div className="home-grid">
            <article className="home-card">
              <h2>Humedad Actual</h2>
              <div className="home-card__body">
                <DropIcon />
                <div>
                  <p className="home-card__value">{formatValue(humidity, '%', 0)}</p>
                  <span className="home-chip">{humidityStatus}</span>
                </div>
              </div>
            </article>

            <article className="home-card home-card--lux">
              <h2>Luminosidad Actual</h2>
              <div className="home-card__body home-card__body--spread">
                <div>
                  <p className="home-card__value">{formatValue(lux, ' lx', 0)}</p>
                  <span className="home-chip">{luxStatus}</span>
                </div>
                <GaugeIcon />
              </div>
            </article>

            <article className="home-card">
              <h2>Consumo de Agua</h2>
              <div className="home-card__body">
                <WaterDishIcon />
                <div>
                  <p className="home-card__value">{formatValue(waterLiters, ' L', 0)}</p>
                  <span className="home-card__sub">Hoy</span>
                </div>
              </div>
            </article>

            <article className="home-card home-card--energy">
              <h2>Consumo de Energía</h2>
              <div className="home-card__body home-card__body--spread">
                <div>
                  <p className="home-card__value">{formatValue(energyKwh, ' kWh', 1)}</p>
                  <span className="home-card__sub">Hoy</span>
                </div>
                <EnergyIcon />
              </div>
            </article>
          </div>

          <section className="home-controls">
            <h2>Control del Sistema</h2>
            <div className="home-controls__actions">
              <div className="home-toggle" role="group" aria-label="Control de modo">
                <button className={!data.manual_mode ? 'is-active' : ''} onClick={() => void handleControlMode('automatic')} type="button">
                  Automático
                </button>
                <button className={data.manual_mode ? 'is-active' : ''} onClick={() => void handleControlMode('manual')} type="button">Manual</button>
              </div>

              <button
                className={`home-action ${data.irrigation_on ? 'home-action--danger' : ''}`}
                onClick={() => void handleToggleSystem('irrigation', data.irrigation_on ? 'off' : 'on')}
                type="button"
              >
                <img src="/Logo.png" alt="" aria-hidden="true" />
                {data.irrigation_on ? 'APAGAR RIEGO' : 'ENCENDER RIEGO'}
              </button>

              <button
                className={`home-action ${data.lights_on ? 'home-action--danger' : ''}`}
                onClick={() => void handleToggleSystem('lights', data.lights_on ? 'off' : 'on')}
                type="button"
              >
                <BulbIcon />
                {data.lights_on ? 'APAGAR ILUMINACIÓN' : 'ENCENDER ILUMINACIÓN'}
              </button>
            </div>
          </section>

          <footer className="home-footer">
            {isLoading ? 'Cargando datos del panel...' : `Alertas activas: ${data.active_alerts}`}
          </footer>
        </section>
      </div>
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

function DropIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="rgba(178,233,92,0.16)" />
      <path d="M32 9C32 9 18 24 18 33C18 41.28 24.27 48 32 48C39.73 48 46 41.28 46 33C46 24 32 9 32 9Z" fill="currentColor" />
    </svg>
  )
}

function GaugeIcon() {
  return (
    <svg viewBox="0 0 140 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 74C19 49 41 31 70 31C99 31 121 49 126 74" stroke="currentColor" strokeWidth="9" strokeLinecap="round" opacity="0.38" />
      <path d="M42 74L70 48" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <circle cx="70" cy="74" r="7" fill="currentColor" />
    </svg>
  )
}

function WaterDishIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="42" rx="25" ry="12" fill="rgba(178,233,92,0.2)" stroke="currentColor" strokeWidth="2" />
      <path d="M32 14C32 14 23 25 23 31C23 35.97 27.03 40 32 40C36.97 40 41 35.97 41 31C41 25 32 14 32 14Z" fill="currentColor" />
    </svg>
  )
}

function EnergyIcon() {
  return (
    <svg viewBox="0 0 140 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 74C19 49 41 31 70 31C99 31 121 49 126 74" stroke="currentColor" strokeWidth="9" strokeLinecap="round" opacity="0.38" />
      <path d="M80 38L64 57H76L60 77" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BulbIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3C8.13 3 5 6.13 5 10C5 12.22 6.03 14.19 7.64 15.47C8.26 15.96 8.62 16.7 8.62 17.49V18.5H15.38V17.49C15.38 16.7 15.74 15.96 16.36 15.47C17.97 14.19 19 12.22 19 10C19 6.13 15.87 3 12 3Z" fill="currentColor"/>
      <path d="M9 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
