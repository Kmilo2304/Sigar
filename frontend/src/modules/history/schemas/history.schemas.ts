import type {
  ComparativeHistoryResponseModel,
  HistoryGranularity,
  HistorySeriesModel,
  HistorySeriesPointModel,
} from '../model/history.model'

interface RangeOption {
  label: string
  days: number
}

interface GranularityOption {
  label: string
  value: HistoryGranularity
}

export const HISTORY_GRANULARITY_OPTIONS: GranularityOption[] = [
  { label: 'Año', value: 'year' },
  { label: 'Mes', value: 'month' },
  { label: 'Semana', value: 'week' },
  { label: 'Día', value: 'day' },
]

export const HISTORY_RANGE_OPTIONS: RangeOption[] = [
  { label: 'Últimos 30 días', days: 30 },
  { label: 'Últimos 90 días', days: 90 },
]

export function getMonthPeriodOptions(count = 18): Array<{ key: string; label: string; year: number; month: number }> {
  const now = new Date()
  const options: Array<{ key: string; label: string; year: number; month: number }> = []

  for (let i = 0; i < count; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    options.push({
      key: `${year}-${String(month).padStart(2, '0')}`,
      label: date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
      year,
      month,
    })
  }

  return options
}

export function getDayOptions(year: number, month: number): number[] {
  const lastDay = new Date(year, month, 0).getDate()
  return Array.from({ length: lastDay }, (_, index) => index + 1)
}

export function getDefaultRange(params: {
  granularity: HistoryGranularity
  days: number
  year: number
  month: number
  day?: number | null
}): { fromDate: string; toDate: string } {
  const { granularity, days, year, month, day } = params
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0)

  if (granularity === 'year') {
    return {
      fromDate: new Date(year, 0, 1).toISOString().slice(0, 10),
      toDate: new Date(year, 11, 31).toISOString().slice(0, 10),
    }
  }

  if (granularity === 'month') {
    return {
      fromDate: startOfMonth.toISOString().slice(0, 10),
      toDate: endOfMonth.toISOString().slice(0, 10),
    }
  }

  if (granularity === 'day' && day) {
    const selected = new Date(year, month - 1, day).toISOString().slice(0, 10)
    return { fromDate: selected, toDate: selected }
  }

  if (granularity === 'week' && day) {
    const selected = new Date(year, month - 1, day)
    const weekStart = new Date(selected)
    weekStart.setDate(selected.getDate() - selected.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    return {
      fromDate: weekStart.toISOString().slice(0, 10),
      toDate: weekEnd.toISOString().slice(0, 10),
    }
  }

  const today = endOfMonth
  const from = new Date(today)
  from.setDate(today.getDate() - days + 1)

  return {
    fromDate: from.toISOString().slice(0, 10),
    toDate: today.toISOString().slice(0, 10),
  }
}

function normalizeBucketLabel(bucket: string): string {
  if (bucket.includes('-W')) {
    return bucket.replace('-', ' ')
  }

  if (bucket.length >= 10 && bucket.includes('-')) {
    const parsedDate = new Date(`${bucket}T00:00:00`)
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
      })
    }
  }

  return bucket
}

export function mapHistoryResponseToSeries(data: ComparativeHistoryResponseModel | null): HistorySeriesModel {
  if (!data || data.points.length === 0) {
    return { water: [], energy: [] }
  }

  const water = data.points.map<HistorySeriesPointModel>((point) => ({
    label: normalizeBucketLabel(point.bucket),
    value: point.water_liters,
  }))

  const energy = data.points.map<HistorySeriesPointModel>((point) => ({
    label: normalizeBucketLabel(point.bucket),
    value: point.energy_kwh,
  }))

  return { water, energy }
}
