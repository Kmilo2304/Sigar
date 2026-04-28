export interface DashboardSummaryModel {
  humidity: number | null
  lux: number | null
  water_liters: number | null
  energy_kwh: number | null
  measured_at: string | null
  active_alerts: number
  manual_mode: boolean
  irrigation_on: boolean
  lights_on: boolean
}

export interface HomeUserModel {
  id: number
  cedula: string
  full_name: string
  role: string
}
