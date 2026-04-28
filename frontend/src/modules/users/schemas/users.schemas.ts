import type { UserCreateModel } from '../model/users.model'

export const ROLE_OPTIONS = ['admin', 'operador', 'visor']

export function buildCreateUserPayload(payload: UserCreateModel): UserCreateModel {
  return {
    cedula: payload.cedula.trim(),
    full_name: payload.full_name.trim(),
    password: payload.password,
    role: payload.role,
  }
}

export function formatRole(role: string): string {
  if (!role) {
    return 'Sin rol'
  }
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString('es-CO')
}
