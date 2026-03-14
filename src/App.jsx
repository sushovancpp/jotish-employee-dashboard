import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import List from './pages/List'
import Details from './pages/Details'
import Analytics from './pages/Analytics'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/"            element={<Login />} />
          <Route path="/list"        element={<ProtectedRoute><List /></ProtectedRoute>} />
          <Route path="/details/:id" element={<ProtectedRoute><Details /></ProtectedRoute>} />
          <Route path="/analytics"   element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          {/* Catch-all: redirect to home */}
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
