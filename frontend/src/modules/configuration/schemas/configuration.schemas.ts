import type {
  MonthlyTariffUpdateModel,
  ScheduleConfigUpdateModel,
} from '../model/configuration.model'

export function getCurrentPeriod(): { year: number; month: number } {
  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  }
}

export function buildSchedulePayload(payload: ScheduleConfigUpdateModel): ScheduleConfigUpdateModel {
  return {
    ...payload,
    lux_on_min: Number(payload.lux_on_min),
    lux_off_max: Number(payload.lux_off_max),
    humidity_on_min: Number(payload.humidity_on_min),
    humidity_off_max: Number(payload.humidity_off_max),
  }
}

export function buildTariffPayload(payload: MonthlyTariffUpdateModel): MonthlyTariffUpdateModel {
  return {
    ...payload,
    water_cost_per_m3: Number(payload.water_cost_per_m3),
    energy_cost_per_kwh: Number(payload.energy_cost_per_kwh),
  }
}

export function formatMonthLabel(month: number): string {
  const date = new Date(2026, Math.max(0, month - 1), 1)
  return date.toLocaleDateString('es-CO', { month: 'long' })
}

export interface Time12hParts {
  hour: number
  minute: number
  period: 'AM' | 'PM'
}

export function parseTimeTo12h(value: string): Time12hParts {
  const [h, m] = value.split(':')
  const hour24 = Number(h || '0')
  const minute = Number(m || '0')
  const period: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM'

  let hour = hour24 % 12
  if (hour === 0) {
    hour = 12
  }

  return {
    hour,
    minute,
    period,
  }
}

export function buildTimeFrom12h(parts: Time12hParts): string {
  let hour24 = parts.hour % 12
  if (parts.period === 'PM') {
    hour24 += 12
  }

  return `${String(hour24).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`
}

export function formatTime12hLabel(value: string): string {
  const parts = parseTimeTo12h(value)
  const suffix = parts.period === 'AM' ? 'a.m.' : 'p.m.'
  return `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')} ${suffix}`
}

export const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1)
export const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => index)
