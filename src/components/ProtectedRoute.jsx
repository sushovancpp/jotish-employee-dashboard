import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Guards any route that requires authentication.
 * Unauthenticated users are redirected to /
 * with the intended path saved in location.state so
 * Login can forward them after success.
 */
export default function ProtectedRoute({ children }) {
  const { user } = useAuth()
  const location  = useLocation()

  if (!user) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />
  }

  return children
}
