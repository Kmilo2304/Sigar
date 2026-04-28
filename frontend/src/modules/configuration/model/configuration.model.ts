export interface ScheduleConfigModel {
  id: number
  irrigation_start: string
  irrigation_end: string
  lights_start: string
  lights_end: string
  lux_on_min: number
  lux_off_max: number
  humidity_on_min: number
  humidity_off_max: number
  updated_at: string
}

export interface ScheduleConfigUpdateModel {
  irrigation_start: string
  irrigation_end: string
  lights_start: string
  lights_end: string
  lux_on_min: number
  lux_off_max: number
  humidity_on_min: number
  humidity_off_max: number
}

export interface MonthlyTariffModel {
  id: number
  year: number
  month: number
  water_cost_per_m3: number
  energy_cost_per_kwh: number
  updated_at: string
}

export interface MonthlyTariffUpdateModel {
  year: number
  month: number
  water_cost_per_m3: number
  energy_cost_per_kwh: number
}

export interface ConfigurationUserModel {
  full_name: string
}
