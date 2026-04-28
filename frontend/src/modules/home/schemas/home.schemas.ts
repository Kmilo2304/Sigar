import type { DashboardSummaryModel } from '../model/home.model'

export function withHomeFallback(summary: DashboardSummaryModel | null): DashboardSummaryModel {
  if (summary) {
    return summary
  }

  return {
    humidity: 32,
    lux: 548,
    water_liters: 256,
    energy_kwh: 3.8,
    measured_at: null,
    active_alerts: 0,
    manual_mode: false,
    irrigation_on: false,
    lights_on: false,
  }
}

export function getHumidityStatus(value: number): string {
  if (value < 25) {
    return 'NIVEL BAJO'
  }

  if (value > 85) {
    return 'NIVEL ALTO'
  }

  return 'NIVEL ÓPTIMO'
}

export function getLuxStatus(value: number): string {
  if (value < 120) {
    return 'Iluminación Baja'
  }

  if (value > 900) {
    return 'Iluminación Alta'
  }

  return 'Iluminación Normal'
}

export function formatValue(value: number | null, unit: string, decimals = 0): string {
  if (value === null) {
    return `0${unit}`
  }

  return `${value.toFixed(decimals)}${unit}`
}
