import type {
  FinanceDashboardModel,
  FinanceGranularity,
  FinanceSensorPointModel,
  FinanceTrendPointModel,
} from '../model/finance.model'

interface RangeOption {
  label: string
  days: number
}

interface GranularityOption {
  label: string
  value: FinanceGranularity
}

export interface FinanceDetailItem {
  label: string
  amount: number
}

const DEFAULT_WATER_COST_PER_M3 = 3
const DEFAULT_ENERGY_COST_PER_KWH = 0.8

export const WATER_BUDGET_TARGET = 100
export const ENERGY_BUDGET_TARGET = 80
export const MONTHLY_BUDGET_TARGET = 1_000_000

export const FINANCE_GRANULARITY_OPTIONS: GranularityOption[] = [
  { label: 'Ano', value: 'year' },
  { label: 'Mes', value: 'month' },
  { label: 'Semana', value: 'week' },
  { label: 'Dia', value: 'day' },
]

export const FINANCE_RANGE_OPTIONS: RangeOption[] = [
  { label: 'Ultimos 30 dias', days: 30 },
  { label: 'Ultimos 90 dias', days: 90 },
  { label: 'Ultimos 180 dias', days: 180 },
]

export function getCurrentMonthLabel(): string {
  const now = new Date()
  return now.toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric',
  })
}

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

export function getFinanceRange(params: {
  granularity: FinanceGranularity
  days: number
  year: number
  month: number
  day?: number | null
}): { fromDate: string; toDate: string } {
  const { granularity, days, year, month, day } = params
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0)

  if (granularity === 'year') {
    const from = new Date(year, 0, 1)
    const to = new Date(year, 11, 31)
    return {
      fromDate: from.toISOString().slice(0, 10),
      toDate: to.toISOString().slice(0, 10),
    }
  }

  if (granularity === 'month') {
    return {
      fromDate: startOfMonth.toISOString().slice(0, 10),
      toDate: endOfMonth.toISOString().slice(0, 10),
    }
  }

  if (granularity === 'day' && day) {
    const d = new Date(year, month - 1, day).toISOString().slice(0, 10)
    return { fromDate: d, toDate: d }
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

  const to = endOfMonth
  const from = new Date(to)
  from.setDate(to.getDate() - Math.max(days - 1, 0))

  return {
    fromDate: from.toISOString().slice(0, 10),
    toDate: to.toISOString().slice(0, 10),
  }
}

export function buildFinanceDashboard(params: {
  points: FinanceSensorPointModel[]
  granularity: FinanceGranularity
  waterCostPerM3?: number
  energyCostPerKwh?: number
  currency?: string
}): FinanceDashboardModel {
  const waterCostPerM3 = params.waterCostPerM3 && params.waterCostPerM3 > 0
    ? params.waterCostPerM3
    : DEFAULT_WATER_COST_PER_M3
  const energyCostPerKwh = params.energyCostPerKwh && params.energyCostPerKwh > 0
    ? params.energyCostPerKwh
    : DEFAULT_ENERGY_COST_PER_KWH

  const totalWaterLiters = params.points.reduce((acc, item) => acc + (item.water_liters || 0), 0)
  const totalEnergyKwh = params.points.reduce((acc, item) => acc + (item.energy_kwh || 0), 0)
  const totalWaterM3 = totalWaterLiters

  const waterCost = totalWaterLiters * waterCostPerM3
  const energyCost = totalEnergyKwh * energyCostPerKwh

  const groupedMap = new Map<string, { waterLiters: number; energyKwh: number }>()

  for (const point of params.points) {
    const bucket = point.bucket
    const prev = groupedMap.get(bucket) ?? { waterLiters: 0, energyKwh: 0 }
    prev.waterLiters += point.water_liters || 0
    prev.energyKwh += point.energy_kwh || 0
    groupedMap.set(bucket, prev)
  }

  const trend: FinanceTrendPointModel[] = Array.from(groupedMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([bucket, values]) => {
      const monthCost = values.waterLiters * waterCostPerM3 + values.energyKwh * energyCostPerKwh
      const waterCost = values.waterLiters * waterCostPerM3
      const energyCost = values.energyKwh * energyCostPerKwh
      return {
        bucket: formatBucketLabel(bucket, params.granularity),
        water_cost: round2(waterCost),
        energy_cost: round2(energyCost),
        total_cost: round2(monthCost),
      }
    })

  return {
    currency: params.currency || 'COP',
    water_cost_per_m3: waterCostPerM3,
    energy_cost_per_kwh: energyCostPerKwh,
    total_water_m3: round2(totalWaterM3),
    total_energy_kwh: round2(totalEnergyKwh),
    water_cost: round2(waterCost),
    energy_cost: round2(energyCost),
    total_cost: round2(waterCost + energyCost),
    trend,
  }
}

function formatBucketLabel(bucket: string, granularity: FinanceGranularity): string {
  if (granularity === 'day' && /^\d{4}-\d{2}-\d{2}$/.test(bucket)) {
    const date = new Date(`${bucket}T00:00:00`)
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
  }

  if (granularity === 'month' && /^\d{4}-\d{2}$/.test(bucket)) {
    const [year, month] = bucket.split('-')
    const date = new Date(Number(year), Number(month) - 1, 1)
    return date.toLocaleDateString('es-CO', { month: 'short' })
  }

  return bucket
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function formatMoney(value: number, _currency: string): string {
  const rounded = Math.round(value)
  const formatted = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded)
  return `$ ${formatted}`
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

export function calculateProgress(current: number, target: number): number {
  if (target <= 0) {
    return 0
  }
  return Math.max(0, Math.min((current / target) * 100, 100))
}

export function buildFinanceDetails(summary: FinanceDashboardModel): FinanceDetailItem[] {
  return [
    { label: 'Agua', amount: summary.water_cost },
    { label: 'Electricidad', amount: summary.energy_cost },
  ]
}
