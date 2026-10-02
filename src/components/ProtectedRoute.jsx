import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loader-page">
        <div className="spinner" />
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return children
}
