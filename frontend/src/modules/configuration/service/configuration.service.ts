import type {
  ConfigurationUserModel,
  MonthlyTariffModel,
  MonthlyTariffUpdateModel,
  ScheduleConfigModel,
  ScheduleConfigUpdateModel,
} from '../model/configuration.model'

const DEFAULT_API_URL = 'http://127.0.0.1:8000'
const AUTH_TOKEN_KEY = 'sigar.auth.token'
const AUTH_USER_KEY = 'sigar.auth.user'

function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '')
}

function getAuthHeaders(): HeadersInit | undefined {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : undefined
}

export function getCurrentConfigurationUserService(): ConfigurationUserModel | null {
  const raw = localStorage.getItem(AUTH_USER_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as ConfigurationUserModel
  } catch {
    return null
  }
}

export function logoutConfigurationService(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

export async function getConfigurationService(): Promise<ScheduleConfigModel> {
  const response = await fetch(`${getApiBaseUrl()}/api/configuration`, {
    headers: getAuthHeaders(),
  })

  const payload = (await response.json().catch(() => null)) as ScheduleConfigModel | null

  if (!response.ok || !payload) {
    throw new Error('No se pudo cargar la configuracion.')
  }

  return payload
}

export async function updateConfigurationService(payload: ScheduleConfigUpdateModel): Promise<ScheduleConfigModel> {
  const response = await fetch(`${getApiBaseUrl()}/api/configuration`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(getAuthHeaders() || {}),
    },
    body: JSON.stringify(payload),
  })

  const data = (await response.json().catch(() => null)) as ScheduleConfigModel | null

  if (!response.ok || !data) {
    throw new Error('No se pudo guardar la programacion.')
  }

  return data
}

export async function getMonthlyTariffService(params: {
  year: number
  month: number
}): Promise<MonthlyTariffModel> {
  const query = new URLSearchParams({
    year: String(params.year),
    month: String(params.month),
  })

  const response = await fetch(`${getApiBaseUrl()}/api/configuration/tariff?${query.toString()}`, {
    headers: getAuthHeaders(),
  })

  const payload = (await response.json().catch(() => null)) as MonthlyTariffModel | null

  if (!response.ok || !payload) {
    throw new Error('No se pudo cargar la tarifa del periodo.')
  }

  return payload
}

export async function updateMonthlyTariffService(payload: MonthlyTariffUpdateModel): Promise<MonthlyTariffModel> {
  const response = await fetch(`${getApiBaseUrl()}/api/configuration/tariff`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(getAuthHeaders() || {}),
    },
    body: JSON.stringify(payload),
  })

  const data = (await response.json().catch(() => null)) as MonthlyTariffModel | null

  if (!response.ok || !data) {
    throw new Error('No se pudo guardar la tarifa del periodo.')
  }

  return data
}
