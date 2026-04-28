import type { LoginFormModel } from '../model/auth.model'

export interface LoginValidationErrors {
  cedula?: string
  password?: string
}

export function normalizeCedula(value: string): string {
  return value.replace(/\D/g, '')
}

export function validateLoginForm(form: LoginFormModel): LoginValidationErrors {
  const errors: LoginValidationErrors = {}

  if (!form.cedula.trim()) {
    errors.cedula = 'La cédula es obligatoria.'
  } else if (form.cedula.trim().length < 5) {
    errors.cedula = 'La cédula debe tener al menos 5 dígitos.'
  }

  if (!form.password.trim()) {
    errors.password = 'La contraseña es obligatoria.'
  } else if (form.password.trim().length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres.'
  }

  return errors
}
