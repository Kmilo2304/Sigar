import type { DashboardSummary, LightPayload, SystemState, WaterPayload } from '../model/ingestion.model'

const DEFAULT_API_URL = 'http://127.0.0.1:8000'
const AUTH_TOKEN_KEY = 'sigar.auth.token'

function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '')
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function parseOrThrow<T>(response: Response, fallback: string): Promise<T> {
  const data = (await response.json().catch(() => null)) as T | { detail?: string } | null
  if (!response.ok || !data) {
    const detail = data && typeof data === 'object' && 'detail' in data ? data.detail : undefined
    throw new Error(detail || fallback)
  }
  return data as T
}

export async function injectLight(payload: LightPayload) {
  const response = await fetch(`${getApiBaseUrl()}/api/telemetry/light`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return parseOrThrow(response, 'No se pudo inyectar lectura de luz.')
}

export async function injectWater(payload: WaterPayload) {
  const response = await fetch(`${getApiBaseUrl()}/api/telemetry/water`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return parseOrThrow(response, 'No se pudo inyectar lectura de agua.')
}

export async function getSystemState(): Promise<SystemState> {
  const response = await fetch(`${getApiBaseUrl()}/api/dashboard/system-state`, {
    headers: authHeaders(),
  })
  return parseOrThrow<SystemState>(response, 'No se pudo consultar el estado del sistema.')
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await fetch(`${getApiBaseUrl()}/api/dashboard/summary`, {
    headers: authHeaders(),
  })
  return parseOrThrow<DashboardSummary>(response, 'No se pudo consultar el resumen del dashboard.')
}
