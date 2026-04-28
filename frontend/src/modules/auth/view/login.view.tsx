import { useState } from 'react'

import { HOME_ROUTES } from '../../home/route/home.route'
import type { LoginFormModel } from '../model/auth.model'
import { normalizeCedula, validateLoginForm, type LoginValidationErrors } from '../schemas/auth.schemas'
import { loginService } from '../service/auth.service'
import './login.view.css'

const INITIAL_FORM: LoginFormModel = {
  cedula: '',
  password: '',
}

export function LoginView() {
  const [form, setForm] = useState<LoginFormModel>(INITIAL_FORM)
  const [errors, setErrors] = useState<LoginValidationErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [statusType, setStatusType] = useState<'error' | 'success' | 'idle'>('idle')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCedulaChange = (value: string) => {
    setForm((prev) => ({ ...prev, cedula: normalizeCedula(value) }))
    setErrors((prev) => ({ ...prev, cedula: undefined }))
  }

  const handlePasswordChange = (value: string) => {
    setForm((prev) => ({ ...prev, password: value }))
    setErrors((prev) => ({ ...prev, password: undefined }))
  }

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()

    const validationErrors = validateLoginForm(form)
    setErrors(validationErrors)
    setStatusMessage('')
    setStatusType('idle')

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await loginService(form)
      localStorage.setItem('sigar.auth.token', result.access_token)
      localStorage.setItem('sigar.auth.user', JSON.stringify(result.user))

      setStatusMessage(`Bienvenido, ${result.user.full_name}`)
      setStatusType('success')

      window.setTimeout(() => {
        window.location.assign(HOME_ROUTES.home)
      }, 220)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible iniciar sesión.'
      setStatusMessage(message)
      setStatusType('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-view">
      <div className="login-view__decor login-view__decor--drop" aria-hidden="true">
        <DropIcon />
      </div>
      <div className="login-view__decor login-view__decor--bulb" aria-hidden="true">
        <BulbIcon />
      </div>

      <main className="login-card" aria-label="Formulario de acceso SIGAR">
        <header className="login-card__brand">
          <img className="login-card__logo" src="/Logo.png" alt="Logo SIGAR" />
          <h1 className="login-card__title">SIGAR</h1>
        </header>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div>
            <label className={`login-field ${errors.cedula ? 'login-field--error' : ''}`}>
              <span className="login-field__icon" aria-hidden="true">
                <UserIcon />
              </span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="username"
                placeholder="Usuario"
                value={form.cedula}
                onChange={(event) => handleCedulaChange(event.target.value)}
                aria-label="Usuario"
              />
            </label>
            {errors.cedula ? <p className="login-field__error">{errors.cedula}</p> : null}
          </div>

          <div>
            <label className={`login-field ${errors.password ? 'login-field--error' : ''}`}>
              <span className="login-field__icon" aria-hidden="true">
                <LockIcon />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Ingrese su contraseña"
                value={form.password}
                onChange={(event) => handlePasswordChange(event.target.value)}
                aria-label="Contraseña"
              />
              <button
                type="button"
                className="login-field__toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </label>
            {errors.password ? <p className="login-field__error">{errors.password}</p> : null}
          </div>

          {statusType !== 'idle' ? (
            <p className={`login-status ${statusType === 'error' ? 'login-status--error' : 'login-status--success'}`}>
              {statusMessage}
            </p>
          ) : null}

          <button className="login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'INGRESANDO...' : 'INGRESAR'}
          </button>

          <button className="login-forgot" type="button">
            ¿Olvidó su contraseña?
          </button>
        </form>
      </main>
    </div>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 11C14.7614 11 17 8.76142 17 6C17 3.23858 14.7614 1 12 1C9.23858 1 7 3.23858 7 6C7 8.76142 9.23858 11 12 11Z" fill="currentColor" />
      <path d="M2 22.5C2 18.0817 5.58172 14.5 10 14.5H14C18.4183 14.5 22 18.0817 22 22.5V23H2V22.5Z" fill="currentColor" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 10V8C6 4.68629 8.68629 2 12 2C15.3137 2 18 4.68629 18 8V10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="4" y="10" width="16" height="12" rx="2.8" fill="currentColor" />
      <circle cx="12" cy="15.5" r="1.7" fill="#4A7546" />
      <path d="M12 17V19" stroke="#4A7546" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 12C3.8 8.5 7.2 6 12 6C16.8 6 20.2 8.5 22 12C20.2 15.5 16.8 18 12 18C7.2 18 3.8 15.5 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10.8 6.15C11.2 6.05 11.59 6 12 6C16.8 6 20.2 8.5 22 12C21.3 13.3 20.42 14.43 19.35 15.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6.2 7.2C4.45 8.35 3.1 10.02 2 12C3.8 15.5 7.2 18 12 18C13.95 18 15.63 17.58 17.05 16.84" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 14.1C13.5 14.66 12.78 15 12 15C10.34 15 9 13.66 9 12C9 11.22 9.34 10.5 9.9 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function DropIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C12 2 5 10 5 14.2C5 18.5 8.13 22 12 22C15.87 22 19 18.5 19 14.2C19 10 12 2 12 2Z" fill="currentColor" />
    </svg>
  )
}

function BulbIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9C5 11.28 6.09 13.31 7.78 14.6C8.53 15.17 9 16.03 9 16.97V17.5C9 18.88 10.12 20 11.5 20H12.5C13.88 20 15 18.88 15 17.5V16.97C15 16.03 15.47 15.17 16.22 14.6C17.91 13.31 19 11.28 19 9C19 5.13 15.87 2 12 2Z" fill="currentColor" />
      <path d="M9 22H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 0.8V0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3.6 3.6L3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20.4 3.6L21 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
