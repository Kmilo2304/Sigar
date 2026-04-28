import type { DashboardSummaryModel, HomeUserModel } from '../model/home.model'

const DEFAULT_API_URL = 'http://127.0.0.1:8000'
const AUTH_TOKEN_KEY = 'sigar.auth.token'
const AUTH_USER_KEY = 'sigar.auth.user'

function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '')
}

export function getCurrentUserService(): HomeUserModel | null {
  const rawUser = localStorage.getItem(AUTH_USER_KEY)
  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser) as HomeUserModel
  } catch {
    return null
  }
}

export function hasSessionService(): boolean {
  return Boolean(localStorage.getItem(AUTH_TOKEN_KEY))
}

export function logoutService(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

export async function getDashboardSummaryService(): Promise<DashboardSummaryModel> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)

  const response = await fetch(`${getApiBaseUrl()}/api/dashboard/summary`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  })

  const payload = (await response.json().catch(() => null)) as DashboardSummaryModel | null

  if (!response.ok || !payload) {
    throw new Error('No se pudo cargar el resumen del panel.')
  }

  return payload
}

export async function setControlModeService(mode: 'automatic' | 'manual'): Promise<void> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  const response = await fetch(`${getApiBaseUrl()}/api/dashboard/control/mode`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ mode }),
  })
  if (!response.ok) {
    throw new Error('No se pudo cambiar el modo del sistema.')
  }
}

export async function toggleSystemService(system: 'irrigation' | 'lights', action: 'on' | 'off'): Promise<void> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  const response = await fetch(`${getApiBaseUrl()}/api/dashboard/control/toggle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ system, action }),
  })
  if (!response.ok) {
    throw new Error('No se pudo cambiar el estado del sistema.')
  }
}
