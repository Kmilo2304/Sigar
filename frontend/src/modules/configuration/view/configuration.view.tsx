import { useEffect, useMemo, useState } from 'react'

import { FINANCE_ROUTES } from '../../finance/route/finance.route'
import { HISTORY_ROUTES } from '../../history/route/history.route'
import { HOME_ROUTES } from '../../home/route/home.route'
import { INGESTION_ROUTES } from '../../ingestion/route/ingestion.route'
import { USERS_ROUTES } from '../../users/route/users.route'
import type {
  MonthlyTariffModel,
  ScheduleConfigModel,
  ScheduleConfigUpdateModel,
} from '../model/configuration.model'
import { CONFIGURATION_ROUTES } from '../route/configuration.route'
import {
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  buildSchedulePayload,
  buildTariffPayload,
  buildTimeFrom12h,
  formatMonthLabel,
  formatTime12hLabel,
  getCurrentPeriod,
  parseTimeTo12h,
} from '../schemas/configuration.schemas'
import {
  getConfigurationService,
  getCurrentConfigurationUserService,
  getMonthlyTariffService,
  logoutConfigurationService,
  updateConfigurationService,
  updateMonthlyTariffService,
} from '../service/configuration.service'
import './configuration.view.css'

export function ConfigurationView() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingProgram, setIsSavingProgram] = useState(false)
  const [isSavingTariff, setIsSavingTariff] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [okMessage, setOkMessage] = useState('')

  const period = getCurrentPeriod()

  const [selectedYear, setSelectedYear] = useState(period.year)
  const [selectedMonth, setSelectedMonth] = useState(period.month)

  const [schedule, setSchedule] = useState<ScheduleConfigUpdateModel>({
    irrigation_start: '06:00',
    irrigation_end: '06:30',
    lights_start: '17:30',
    lights_end: '23:00',
    lux_on_min: 120,
    lux_off_max: 500,
    humidity_on_min: 25,
    humidity_off_max: 80,
  })

  const [tariff, setTariff] = useState<MonthlyTariffModel | null>(null)

  const user = useMemo(() => getCurrentConfigurationUserService(), [])

  useEffect(() => {
    let isMounted = true

    const loadConfiguration = async () => {
      try {
        const [configurationData, tariffData] = await Promise.all([
          getConfigurationService(),
          getMonthlyTariffService({ year: selectedYear, month: selectedMonth }),
        ])

        if (!isMounted) {
          return
        }

        hydrateSchedule(configurationData)
        setTariff(tariffData)
        setErrorMessage('')
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message = error instanceof Error ? error.message : 'No se pudo cargar la configuracion.'
        setErrorMessage(message)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadConfiguration()

    return () => {
      isMounted = false
    }
  }, [selectedYear, selectedMonth])

  const welcomeName = user?.full_name ?? 'Administrador SIGAR'
  const avatarLetter = welcomeName.trim().charAt(0).toUpperCase() || 'A'

  const handleGoHome = () => window.location.assign(HOME_ROUTES.home)
  const handleGoHistory = () => window.location.assign(HISTORY_ROUTES.history)
  const handleGoFinance = () => window.location.assign(FINANCE_ROUTES.finance)
  const handleGoConfiguration = () => window.location.assign(CONFIGURATION_ROUTES.configuration)
  const handleGoUsers = () => window.location.assign(USERS_ROUTES.users)
  const handleGoIngestion = () => window.open(INGESTION_ROUTES.ingestion, '_blank', 'noopener,noreferrer')

  const handleLogout = () => {
    logoutConfigurationService()
    window.location.assign('/')
  }

  const onSaveSchedule = async () => {
    setIsSavingProgram(true)
    setOkMessage('')
    setErrorMessage('')

    try {
      const payload = buildSchedulePayload(schedule)
      const updated = await updateConfigurationService(payload)
      hydrateSchedule(updated)
      setOkMessage('Programacion y umbrales guardados para todos los dias.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar la programacion.'
      setErrorMessage(message)
    } finally {
      setIsSavingProgram(false)
    }
  }

  const onSaveTariff = async () => {
    if (!tariff) {
      return
    }

    setIsSavingTariff(true)
    setOkMessage('')
    setErrorMessage('')

    try {
      const payload = buildTariffPayload({
        year: selectedYear,
        month: selectedMonth,
        water_cost_per_m3: tariff.water_cost_per_m3,
        energy_cost_per_kwh: tariff.energy_cost_per_kwh,
      })

      const updated = await updateMonthlyTariffService(payload)
      setTariff(updated)
      setOkMessage('Tarifa del periodo guardada.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar la tarifa.'
      setErrorMessage(message)
    } finally {
      setIsSavingTariff(false)
    }
  }

  const hydrateSchedule = (config: ScheduleConfigModel) => {
    setSchedule({
      irrigation_start: config.irrigation_start,
      irrigation_end: config.irrigation_end,
      lights_start: config.lights_start,
      lights_end: config.lights_end,
      lux_on_min: config.lux_on_min,
      lux_off_max: config.lux_off_max,
      humidity_on_min: config.humidity_on_min,
      humidity_off_max: config.humidity_off_max,
    })
  }

  return (
    <div className="configuration-view">
      <div className="configuration-shell">
        <aside className="configuration-sidebar">
          <div className="configuration-sidebar__brand">
            <img src="/Logo.png" alt="Logo SIGAR" />
            <strong>SIGAR</strong>
          </div>

          <nav className="configuration-sidebar__menu" aria-label="Menu principal">
            <button className="configuration-menu-item" onClick={handleGoHome} type="button">
              <PowerIcon />
              Panel Principal
            </button>
            <button className="configuration-menu-item" onClick={handleGoHistory} type="button">
              <ChartIcon />
              Historico
            </button>
            <button className="configuration-menu-item" onClick={handleGoFinance} type="button">
              <CoinIcon />
              Consumo Financiero
            </button>
            <button className="configuration-menu-item configuration-menu-item--active" onClick={handleGoConfiguration} type="button">
              <GearIcon />
              Configuracion
            </button>
            <button className="configuration-menu-item" onClick={handleGoUsers} type="button">
              <UserIcon />
              Usuarios
            </button>
            <button className="configuration-menu-item" onClick={handleGoIngestion} type="button">
              <DropIcon />
              Inyección
            </button>
          </nav>

          <button className="configuration-sidebar__logout" onClick={handleLogout} type="button">
            Cerrar sesion
          </button>
        </aside>

        <section className="configuration-content">
          <header className="configuration-topbar">
            <div className="configuration-topbar__title">
              <GearIcon />
              Configuracion
            </div>
            <div className="configuration-topbar__user">
              <span>
                Bienvenido, <strong>{welcomeName}</strong>
              </span>
              <div className="configuration-avatar">{avatarLetter}</div>
            </div>
          </header>

          {errorMessage ? <p className="configuration-error">{errorMessage}</p> : null}
          {okMessage ? <p className="configuration-ok">{okMessage}</p> : null}

          <div className="configuration-grid">
            <article className="configuration-card">
              <h2>Programacion de Riego y Luces</h2>

              <div className="configuration-form-grid">
                <Time12hField
                  label="Inicio riego"
                  value={schedule.irrigation_start}
                  onChange={(value) => setSchedule((prev) => ({ ...prev, irrigation_start: value }))}
                  disabled={isLoading}
                />

                <Time12hField
                  label="Fin riego"
                  value={schedule.irrigation_end}
                  onChange={(value) => setSchedule((prev) => ({ ...prev, irrigation_end: value }))}
                  disabled={isLoading}
                />

                <Time12hField
                  label="Inicio luces"
                  value={schedule.lights_start}
                  onChange={(value) => setSchedule((prev) => ({ ...prev, lights_start: value }))}
                  disabled={isLoading}
                />

                <Time12hField
                  label="Fin luces"
                  value={schedule.lights_end}
                  onChange={(value) => setSchedule((prev) => ({ ...prev, lights_end: value }))}
                  disabled={isLoading}
                />
              </div>

              <h3>Umbrales de Luxometria</h3>
              <div className="configuration-form-grid">
                <label>
                  Minimo para encendido (lux)
                  <input
                    type="number"
                    min="0"
                    value={schedule.lux_on_min}
                    onChange={(event) => setSchedule((prev) => ({ ...prev, lux_on_min: Number(event.target.value) }))}
                    disabled={isLoading}
                  />
                </label>

                <label>
                  Maximo para apagado (lux)
                  <input
                    type="number"
                    min="0"
                    value={schedule.lux_off_max}
                    onChange={(event) => setSchedule((prev) => ({ ...prev, lux_off_max: Number(event.target.value) }))}
                    disabled={isLoading}
                  />
                </label>
              </div>

              <h3>Umbrales de Humedad</h3>
              <div className="configuration-form-grid">
                <label>
                  Minima para encendido (%)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={schedule.humidity_on_min}
                    onChange={(event) => setSchedule((prev) => ({ ...prev, humidity_on_min: Number(event.target.value) }))}
                    disabled={isLoading}
                  />
                </label>

                <label>
                  Maxima para apagado (%)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={schedule.humidity_off_max}
                    onChange={(event) => setSchedule((prev) => ({ ...prev, humidity_off_max: Number(event.target.value) }))}
                    disabled={isLoading}
                  />
                </label>
              </div>

              <div className="configuration-inline-actions configuration-inline-actions--single">
                <button onClick={onSaveSchedule} type="button" disabled={isSavingProgram || isLoading}>
                  {isSavingProgram ? 'Guardando...' : 'Guardar Programacion'}
                </button>
              </div>
            </article>

            <article className="configuration-card">
              <h2>Costo por Periodo (Mes/Ano)</h2>

              <div className="configuration-form-grid">
                <label>
                  Ano
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(Number(event.target.value))}
                    disabled={isLoading}
                  />
                </label>

                <label>
                  Mes
                  <select
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(Number(event.target.value))}
                    disabled={isLoading}
                  >
                    {Array.from({ length: 12 }).map((_, index) => {
                      const month = index + 1
                      return (
                        <option key={month} value={month}>
                          {formatMonthLabel(month)}
                        </option>
                      )
                    })}
                  </select>
                </label>

                <label>
                  Costo por m3 de agua
                  <input
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={tariff?.water_cost_per_m3 ?? 0}
                    onChange={(event) => setTariff((prev) => prev ? ({ ...prev, water_cost_per_m3: Number(event.target.value) }) : prev)}
                    disabled={isLoading || !tariff}
                  />
                </label>

                <label>
                  Costo por kWh
                  <input
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={tariff?.energy_cost_per_kwh ?? 0}
                    onChange={(event) => setTariff((prev) => prev ? ({ ...prev, energy_cost_per_kwh: Number(event.target.value) }) : prev)}
                    disabled={isLoading || !tariff}
                  />
                </label>
              </div>

              <button className="configuration-save-tariff" onClick={onSaveTariff} type="button" disabled={isSavingTariff || isLoading || !tariff}>
                {isSavingTariff ? 'Guardando...' : 'Guardar Tarifa del Periodo'}
              </button>
            </article>
          </div>
        </section>
      </div>
    </div>
  )
}

function Time12hField(props: {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const { label, value, onChange, disabled } = props
  const parts = parseTimeTo12h(value)

  const handleHourChange = (hour: number) => {
    onChange(buildTimeFrom12h({ ...parts, hour }))
  }

  const handleMinuteChange = (minute: number) => {
    onChange(buildTimeFrom12h({ ...parts, minute }))
  }

  const handlePeriodChange = (period: 'AM' | 'PM') => {
    onChange(buildTimeFrom12h({ ...parts, period }))
  }

  return (
    <label className="configuration-time-field">
      {label}
      <div className="configuration-time-selects">
        <select value={parts.hour} onChange={(event) => handleHourChange(Number(event.target.value))} disabled={disabled}>
          {HOUR_OPTIONS.map((hour) => (
            <option key={hour} value={hour}>{String(hour).padStart(2, '0')}</option>
          ))}
        </select>

        <select value={parts.minute} onChange={(event) => handleMinuteChange(Number(event.target.value))} disabled={disabled}>
          {MINUTE_OPTIONS.map((minute) => (
            <option key={minute} value={minute}>{String(minute).padStart(2, '0')}</option>
          ))}
        </select>

        <select value={parts.period} onChange={(event) => handlePeriodChange(event.target.value as 'AM' | 'PM')} disabled={disabled}>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
      <small>{formatTime12hLabel(value)}</small>
    </label>
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
