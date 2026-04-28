import { useEffect, useState } from 'react'

import type { DashboardSummary, SystemState } from '../model/ingestion.model'
import { getDashboardSummary, getSystemState, injectLight, injectWater } from '../service/ingestion.service'
import './ingestion.view.css'

export function IngestionView() {
  const ONE_HOUR_MS = 60 * 60 * 1000
  const SENSOR_ID_OPTIONS = ['1', '2', '3', '4', '5']
  const [lightDeviceId, setLightDeviceId] = useState('')
  const [waterDeviceId, setWaterDeviceId] = useState('')
  const [lux, setLux] = useState('')
  const [humidity, setHumidity] = useState('')
  const [water, setWater] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [state, setState] = useState<SystemState | null>(null)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [lightPulse, setLightPulse] = useState(false)
  const [irrigationPulse, setIrrigationPulse] = useState(false)
  const [autoEnabled, setAutoEnabled] = useState(false)
  const [autoStatus, setAutoStatus] = useState('Inyección automática desactivada.')

  const loadState = async () => {
    const [nextState, nextSummary] = await Promise.all([getSystemState(), getDashboardSummary()])

    if (state && !state.lights_on && nextState.lights_on) {
      setLightPulse(true)
      window.setTimeout(() => setLightPulse(false), 1400)
    }

    if (state && !state.irrigation_on && nextState.irrigation_on) {
      setIrrigationPulse(true)
      window.setTimeout(() => setIrrigationPulse(false), 1400)
    }

    setState(nextState)
    setSummary(nextSummary)
  }

  useEffect(() => {
    void loadState()

    const intervalId = window.setInterval(() => {
      void loadState()
    }, 10000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    if (!autoEnabled) {
      return
    }

    const intervalId = window.setInterval(() => {
      void runAutoInjection()
    }, ONE_HOUR_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [autoEnabled, lightDeviceId, waterDeviceId])

  const onSendLight = async () => {
    setError('')
    setMessage('')
    if (!SENSOR_ID_OPTIONS.includes(lightDeviceId.trim())) {
      setError('El ID del sensor de luz es obligatorio y debe ser entre 1 y 5.')
      return
    }

    try {
      await injectLight({ lux: Number(lux), device_id: lightDeviceId.trim() })
      setMessage('Lectura de luz inyectada y evaluada correctamente.')
      await loadState()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inyectando luz.')
    }
  }

  const onSendWater = async () => {
    setError('')
    setMessage('')
    if (!SENSOR_ID_OPTIONS.includes(waterDeviceId.trim())) {
      setError('El ID del sensor de agua/humedad es obligatorio y debe ser entre 1 y 5.')
      return
    }

    try {
      await injectWater({
        device_id: waterDeviceId.trim(),
        humidity: humidity ? Number(humidity) : undefined,
        water_liters: water ? Number(water) : undefined,
      })
      setMessage('Lectura de agua/humedad inyectada y evaluada correctamente.')
      await loadState()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inyectando agua/humedad.')
    }
  }

  const runAutoInjection = async () => {
    const lightId = SENSOR_ID_OPTIONS[Math.floor(Math.random() * SENSOR_ID_OPTIONS.length)]
    const waterId = SENSOR_ID_OPTIONS[Math.floor(Math.random() * SENSOR_ID_OPTIONS.length)]
    const randomLux = Math.floor(Math.random() * 1001)
    const randomHumidity = Math.floor(Math.random() * 101)

    try {
      await Promise.all([
        injectLight({ device_id: lightId, lux: randomLux }),
        injectWater({ device_id: waterId, humidity: randomHumidity }),
      ])

      setLightDeviceId(lightId)
      setWaterDeviceId(waterId)
      setAutoStatus(`Última inyección automática: lux ${randomLux} lx, humedad ${randomHumidity}%.`)
      await loadState()
    } catch (e) {
      setAutoStatus(e instanceof Error ? e.message : 'Error en inyección automática.')
    }
  }

  const onToggleAuto = async () => {
    const next = !autoEnabled
    setAutoEnabled(next)
    if (next) {
      setAutoStatus('Inyección automática activa: cada 1 hora.')
      await runAutoInjection()
      return
    }
    setAutoStatus('Inyección automática desactivada.')
  }

  return (
    <div className="ingestion-view">
      <div className="ingestion-panel">
        <h1>Entorno Simulación Sensores</h1>
        <p>
          Usa este modulo para enviar lecturas por API, validar alertas y verificar encendido/apagado automatico.
        </p>

        {message ? <p className="ingestion-ok">{message}</p> : null}
        {error ? <p className="ingestion-error">{error}</p> : null}

        <div className="ingestion-grid">
          <section className="ingestion-card">
            <h2>Sensor de Luz</h2>
            <label>
              ID sensor de luz
              <select value={lightDeviceId} onChange={(event) => setLightDeviceId(event.target.value)}>
                <option value="">Selecciona ID</option>
                {SENSOR_ID_OPTIONS.map((id) => (
                  <option key={`light-${id}`} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Luxometria (lx)
              <input value={lux} onChange={(event) => setLux(event.target.value)} placeholder="Ej: 85" />
            </label>
            <button onClick={() => void onSendLight()} type="button">Inyectar Luz</button>
          </section>

          <section className="ingestion-card">
            <h2>Sensor de Agua / Humedad</h2>
            <label>
              ID sensor de agua/humedad
              <select value={waterDeviceId} onChange={(event) => setWaterDeviceId(event.target.value)}>
                <option value="">Selecciona ID</option>
                {SENSOR_ID_OPTIONS.map((id) => (
                  <option key={`water-${id}`} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Humedad (%)
              <input value={humidity} onChange={(event) => setHumidity(event.target.value)} placeholder="Ej: 22" />
            </label>
            <label>
              Consumo agua (litros)
              <input value={water} onChange={(event) => setWater(event.target.value)} placeholder="Ej: 15" />
            </label>
            <button onClick={() => void onSendWater()} type="button">Inyectar Agua/Humedad</button>
          </section>
        </div>

        <section className="ingestion-auto">
          <h2>Inyección Automática</h2>
          <p>Genera datos aleatorios de luxometría y humedad cada hora.</p>
          <div className="ingestion-auto__actions">
            <button onClick={() => void onToggleAuto()} type="button">
              {autoEnabled ? 'Detener Automática' : 'Iniciar Automática'}
            </button>
            <button onClick={() => void runAutoInjection()} type="button">
              Inyectar ahora
            </button>
          </div>
          <p>{autoStatus}</p>
        </section>

        <section className="ingestion-state">
          <h2>Estado actual del sistema</h2>
          <div className="ingestion-traffic">
            <div className={`ingestion-pill ${state?.irrigation_on ? 'on' : 'off'} ${irrigationPulse ? 'pulse' : ''}`}>
              <span className={`light-dot ${state?.irrigation_on ? 'green' : 'red'}`} />
              Riego: {state?.irrigation_on ? 'ENCENDIDO' : 'APAGADO'}
            </div>
            <div className={`ingestion-pill ${state?.lights_on ? 'on' : 'off'} ${lightPulse ? 'pulse' : ''}`}>
              <span className={`light-dot ${state?.lights_on ? 'green' : 'red'}`} />
              Luces: {state?.lights_on ? 'ENCENDIDAS' : 'APAGADAS'}
            </div>
          </div>
          <p>Ultima accion: {state?.last_reason || 'Sin cambios aun.'}</p>
          <p>Alertas activas: {summary?.active_alerts ?? 0}</p>
          <p>Ultimo dato: humedad {summary?.humidity ?? '-'}%, lux {summary?.lux ?? '-'} lx</p>
        </section>
      </div>
    </div>
  )
}
