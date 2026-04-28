import type { FinanceSensorPointModel, FinanceUserModel } from '../model/finance.model'
import type { FinanceGranularity } from '../model/finance.model'

const DEFAULT_API_URL = 'http://127.0.0.1:8000'
const AUTH_TOKEN_KEY = 'sigar.auth.token'
const AUTH_USER_KEY = 'sigar.auth.user'

interface HistoryComparativeResponse {
  points: FinanceSensorPointModel[]
}

interface ConfigurationResponse {
    water_cost_per_m3?: number
    energy_cost_per_kwh?: number
}

function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '')
}

export function getCurrentFinanceUserService(): FinanceUserModel | null {
  const raw = localStorage.getItem(AUTH_USER_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as FinanceUserModel
  } catch {
    return null
  }
}

export function logoutFinanceService(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

function buildHeaders(): HeadersInit | undefined {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : undefined
}

export async function getFinanceSensorPointsService(params: {
  granularity: FinanceGranularity
  fromDate: string
  toDate: string
}): Promise<FinanceSensorPointModel[]> {
  const query = new URLSearchParams({
    granularity: params.granularity,
    from_date: params.fromDate,
    to_date: params.toDate,
  })

  const response = await fetch(`${getApiBaseUrl()}/api/history/comparative?${query.toString()}`, {
    headers: buildHeaders(),
  })

  const payload = (await response.json().catch(() => null)) as HistoryComparativeResponse | null

  if (!response.ok || !payload || !Array.isArray(payload.points)) {
    throw new Error('No se pudo cargar el consumo de sensores.')
  }

  return payload.points
}

export async function getFinanceTariffService(params: {
  year: number
  month: number
}): Promise<{
  waterCostPerM3?: number
  energyCostPerKwh?: number
}> {
  const query = new URLSearchParams({
    year: String(params.year),
    month: String(params.month),
  })

  const response = await fetch(`${getApiBaseUrl()}/api/configuration/tariff?${query.toString()}`, {
    headers: buildHeaders(),
  })

  const payload = (await response.json().catch(() => null)) as ConfigurationResponse | null
  if (!response.ok || !payload) {
    return {}
  }

  return {
    waterCostPerM3: payload.water_cost_per_m3,
    energyCostPerKwh: payload.energy_cost_per_kwh,
  }
}
