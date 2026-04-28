import type { LoginFormModel, LoginResponseModel } from '../model/auth.model'

const DEFAULT_API_URL = 'http://127.0.0.1:8000'

function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '')
}

function getErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return 'No fue posible iniciar sesión.'
  }

  const detail = Reflect.get(payload, 'detail')
  if (typeof detail === 'string' && detail.trim().length > 0) {
    return detail
  }

  return 'No fue posible iniciar sesión.'
}

export async function loginService(credentials: LoginFormModel): Promise<LoginResponseModel> {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  const payload = (await response.json().catch(() => null)) as unknown

  if (!response.ok) {
    throw new Error(getErrorMessage(payload))
  }

  return payload as LoginResponseModel
}
