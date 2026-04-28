export type HistoryGranularity = 'year' | 'month' | 'week' | 'day'

export interface HistoryPointModel {
  bucket: string
  water_liters: number
  energy_kwh: number
}

export interface ComparativeHistoryResponseModel {
  granularity: 'year' | 'quarter' | 'month' | 'week' | 'day' | 'hour'
  from_date: string
  to_date: string
  points: HistoryPointModel[]
}

export interface HistorySeriesPointModel {
  label: string
  value: number
}

export interface HistorySeriesModel {
  water: HistorySeriesPointModel[]
  energy: HistorySeriesPointModel[]
}

export interface HistoryUserModel {
  full_name: string
}
