export type LightPayload = {
  measured_at?: string
  lux: number
  device_id: string
}

export type WaterPayload = {
  measured_at?: string
  humidity?: number
  water_liters?: number
  device_id: string
}

export type SystemState = {
  id: number
  irrigation_on: boolean
  lights_on: boolean
  last_reason: string
  updated_at: string
}

export type DashboardSummary = {
  humidity: number | null
  lux: number | null
  water_liters: number | null
  energy_kwh: number | null
  measured_at: string | null
  active_alerts: number
  irrigation_on: boolean
  lights_on: boolean
}
