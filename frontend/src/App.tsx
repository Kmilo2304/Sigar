import { AUTH_ROUTES } from './modules/auth/route/auth.route'
import { LoginView } from './modules/auth/view/login.view'
import { CONFIGURATION_ROUTES } from './modules/configuration/route/configuration.route'
import { ConfigurationView } from './modules/configuration/view/configuration.view'
import { FINANCE_ROUTES } from './modules/finance/route/finance.route'
import { FinanceView } from './modules/finance/view/finance.view'
import { HOME_ROUTES } from './modules/home/route/home.route'
import { hasSessionService } from './modules/home/service/home.service'
import { HomeView } from './modules/home/view/home.view'
import { HISTORY_ROUTES } from './modules/history/route/history.route'
import { HistoryView } from './modules/history/view/history.view'
import { INGESTION_ROUTES } from './modules/ingestion/route/ingestion.route'
import { IngestionView } from './modules/ingestion/view/ingestion.view'
import { USERS_ROUTES } from './modules/users/route/users.route'
import { UsersView } from './modules/users/view/users.view'

function App() {
  const currentPath = window.location.pathname

  if (currentPath === INGESTION_ROUTES.ingestion) {
    return <IngestionView />
  }

  const hasSession = hasSessionService()

  if (!hasSession) {
    return <LoginView />
  }

  if (currentPath === HISTORY_ROUTES.history) {
    return <HistoryView />
  }

  if (currentPath === FINANCE_ROUTES.finance) {
    return <FinanceView />
  }

  if (currentPath === CONFIGURATION_ROUTES.configuration) {
    return <ConfigurationView />
  }

  if (currentPath === USERS_ROUTES.users) {
    return <UsersView />
  }

  if (currentPath === HOME_ROUTES.home || currentPath === AUTH_ROUTES.login) {
    return <HomeView />
  }

  return <HomeView />
}

export default App
