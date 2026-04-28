import { useEffect, useMemo, useState } from 'react'

import { CONFIGURATION_ROUTES } from '../../configuration/route/configuration.route'
import { FINANCE_ROUTES } from '../../finance/route/finance.route'
import { HISTORY_ROUTES } from '../../history/route/history.route'
import { HOME_ROUTES } from '../../home/route/home.route'
import { INGESTION_ROUTES } from '../../ingestion/route/ingestion.route'
import type { UserCreateModel, UserModel } from '../model/users.model'
import { USERS_ROUTES } from '../route/users.route'
import { ROLE_OPTIONS, buildCreateUserPayload, formatDate, formatRole } from '../schemas/users.schemas'
import {
  createUserService,
  deleteUserService,
  getCurrentUsersUserService,
  getUsersService,
  logoutUsersService,
  resetUserPasswordService,
  updateUserRoleService,
} from '../service/users.service'
import './users.view.css'

export function UsersView() {
  const [users, setUsers] = useState<UserModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [okMessage, setOkMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const [form, setForm] = useState<UserCreateModel>({
    cedula: '',
    full_name: '',
    password: '',
    role: 'operador',
  })

  const userSession = useMemo(() => getCurrentUsersUserService(), [])
  const welcomeName = userSession?.full_name ?? 'Administrador SIGAR'
  const avatarLetter = welcomeName.trim().charAt(0).toUpperCase() || 'A'

  useEffect(() => {
    void loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await getUsersService()
      setUsers(data)
      setErrorMessage('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cargar usuarios.'
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  const onCreateUser = async () => {
    setIsSaving(true)
    setErrorMessage('')
    setOkMessage('')

    try {
      await createUserService(buildCreateUserPayload(form))
      setOkMessage('Usuario creado correctamente.')
      setForm({ cedula: '', full_name: '', password: '', role: 'operador' })
      await loadUsers()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear el usuario.'
      setErrorMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  const onChangeRole = async (cedula: string, role: string) => {
    try {
      await updateUserRoleService(cedula, { role })
      setOkMessage('Rol actualizado.')
      await loadUsers()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el rol.'
      setErrorMessage(message)
    }
  }

  const onResetPassword = async (cedula: string) => {
    const nextPassword = window.prompt('Nueva contrasena para este usuario (min 6 caracteres):')
    if (!nextPassword) {
      return
    }

    try {
      await resetUserPasswordService(cedula, { password: nextPassword })
      setOkMessage(`Contrasena reseteada para ${cedula}.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo resetear la contrasena.'
      setErrorMessage(message)
    }
  }

  const onDeleteUser = async (cedula: string) => {
    const confirmed = window.confirm(`Se eliminara el usuario ${cedula}. Deseas continuar?`)
    if (!confirmed) {
      return
    }

    try {
      await deleteUserService(cedula)
      setOkMessage('Usuario eliminado.')
      await loadUsers()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar el usuario.'
      setErrorMessage(message)
    }
  }

  const handleGoHome = () => window.location.assign(HOME_ROUTES.home)
  const handleGoHistory = () => window.location.assign(HISTORY_ROUTES.history)
  const handleGoFinance = () => window.location.assign(FINANCE_ROUTES.finance)
  const handleGoConfiguration = () => window.location.assign(CONFIGURATION_ROUTES.configuration)
  const handleGoUsers = () => window.location.assign(USERS_ROUTES.users)
  const handleGoIngestion = () => window.open(INGESTION_ROUTES.ingestion, '_blank', 'noopener,noreferrer')

  const handleLogout = () => {
    logoutUsersService()
    window.location.assign('/')
  }

  return (
    <div className="users-view">
      <div className="users-shell">
        <aside className="users-sidebar">
          <div className="users-sidebar__brand">
            <img src="/Logo.png" alt="Logo SIGAR" />
            <strong>SIGAR</strong>
          </div>

          <nav className="users-sidebar__menu" aria-label="Menu principal">
            <button className="users-menu-item" onClick={handleGoHome} type="button"><PowerIcon />Panel Principal</button>
            <button className="users-menu-item" onClick={handleGoHistory} type="button"><ChartIcon />Historico</button>
            <button className="users-menu-item" onClick={handleGoFinance} type="button"><CoinIcon />Consumo Financiero</button>
            <button className="users-menu-item" onClick={handleGoConfiguration} type="button"><GearIcon />Configuracion</button>
            <button className="users-menu-item users-menu-item--active" onClick={handleGoUsers} type="button"><UserIcon />Usuarios</button>
            <button className="users-menu-item" onClick={handleGoIngestion} type="button"><DropIcon />Inyección</button>
          </nav>

          <button className="users-sidebar__logout" onClick={handleLogout} type="button">Cerrar sesion</button>
        </aside>

        <section className="users-content">
          <header className="users-topbar">
            <div className="users-topbar__title"><UserIcon />Administracion de Usuarios</div>
            <div className="users-topbar__user">
              <span>Bienvenido, <strong>{welcomeName}</strong></span>
              <div className="users-avatar">{avatarLetter}</div>
            </div>
          </header>

          {errorMessage ? <p className="users-error">{errorMessage}</p> : null}
          {okMessage ? <p className="users-ok">{okMessage}</p> : null}

          <div className="users-grid">
            <article className="users-card">
              <h2>Crear Usuario</h2>
              <div className="users-form-grid">
                <label>Cedula
                  <input value={form.cedula} onChange={(event) => setForm((prev) => ({ ...prev, cedula: event.target.value }))} />
                </label>
                <label>Nombre completo
                  <input value={form.full_name} onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))} />
                </label>
                <label>Contrasena temporal
                  <input type="password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} />
                </label>
                <label>Rol
                  <select value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}>
                    {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{formatRole(role)}</option>)}
                  </select>
                </label>
              </div>
              <button className="users-save" onClick={onCreateUser} disabled={isSaving || isLoading} type="button">
                {isSaving ? 'Guardando...' : 'Crear Usuario'}
              </button>
            </article>

            <article className="users-card users-card--table">
              <h2>Usuarios Registrados</h2>
              {isLoading ? <p className="users-loading">Cargando usuarios...</p> : null}

              <div className="users-table-wrap">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Cedula</th>
                      <th>Nombre</th>
                      <th>Rol</th>
                      <th>Creado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((item) => (
                      <tr key={item.id}>
                        <td>{item.cedula}</td>
                        <td>{item.full_name}</td>
                        <td>
                          <select
                            value={item.role}
                            onChange={(event) => void onChangeRole(item.cedula, event.target.value)}
                          >
                            {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{formatRole(role)}</option>)}
                          </select>
                        </td>
                        <td>{formatDate(item.created_at)}</td>
                        <td className="users-actions">
                          <button onClick={() => void onResetPassword(item.cedula)} type="button">Reset Pass</button>
                          <button className="is-danger" onClick={() => void onDeleteUser(item.cedula)} type="button">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  )
}

function PowerIcon() {
  return <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2V11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /><path d="M6.35 4.35C4.34 5.79 3 8.15 3 10.83C3 15.25 6.58 18.83 11 18.83H13C17.42 18.83 21 15.25 21 10.83C21 8.15 19.66 5.79 17.65 4.35" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
}

function ChartIcon() {
  return <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 19.5H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M6 15L10 11L13 13L18 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function CoinIcon() {
  return <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" /><path d="M9.5 10C9.5 8.9 10.4 8 11.5 8H13.1C14.15 8 15 8.85 15 9.9C15 10.75 14.44 11.5 13.63 11.75L10.4 12.75C9.59 13 9.03 13.75 9.03 14.6C9.03 15.65 9.88 16.5 10.93 16.5H12.5C13.6 16.5 14.5 15.6 14.5 14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
}

function GearIcon() {
  return <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15.2C13.77 15.2 15.2 13.77 15.2 12C15.2 10.23 13.77 8.8 12 8.8C10.23 8.8 8.8 10.23 8.8 12C8.8 13.77 10.23 15.2 12 15.2Z" stroke="currentColor" strokeWidth="2" /><path d="M19.2 12.9V11.1L17.45 10.55C17.29 9.99 17.07 9.47 16.77 9L17.63 7.38L16.35 6.1L14.72 6.96C14.26 6.66 13.73 6.44 13.17 6.28L12.62 4.53H10.82L10.27 6.28C9.71 6.44 9.18 6.66 8.72 6.96L7.1 6.1L5.82 7.38L6.68 9C6.38 9.47 6.16 9.99 6 10.55L4.25 11.1V12.9L6 13.45C6.16 14.01 6.38 14.53 6.68 15L5.82 16.62L7.1 17.9L8.72 17.04C9.18 17.34 9.71 17.56 10.27 17.72L10.82 19.47H12.62L13.17 17.72C13.73 17.56 14.26 17.34 14.72 17.04L16.35 17.9L17.63 16.62L16.77 15C17.07 14.53 17.29 14.01 17.45 13.45L19.2 12.9Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function UserIcon() {
  return <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="7" r="4" fill="currentColor" /><path d="M4 22C4.6 18.2 7.7 15.5 11.6 15.5H12.4C16.3 15.5 19.4 18.2 20 22" fill="currentColor" /></svg>
}

function DropIcon() {
  return <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3C12 3 6.5 9.1 6.5 12.8C6.5 15.96 9.05 18.5 12.2 18.5C15.36 18.5 17.9 15.96 17.9 12.8C17.9 9.1 12 3 12 3Z" fill="currentColor" /></svg>
}
