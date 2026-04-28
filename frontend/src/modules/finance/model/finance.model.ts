export type FinanceGranularity = 'year' | 'month' | 'week' | 'day'

export interface FinanceSensorPointModel {
  bucket: string
  water_liters: number
  energy_kwh: number
}

export interface FinanceTrendPointModel {
  bucket: string
  water_cost: number
  energy_cost: number
  total_cost: number
}

export interface FinanceDashboardModel {
  currency: string
  water_cost_per_m3: number
  energy_cost_per_kwh: number
  total_water_m3: number
  total_energy_kwh: number
  water_cost: number
  energy_cost: number
  total_cost: number
  trend: FinanceTrendPointModel[]
}

export interface FinanceUserModel {
  full_name: string
}
