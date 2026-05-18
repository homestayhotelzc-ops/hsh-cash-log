import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Route guard. Renders a spinner while auth loads, redirects to /login if
 * unauthenticated, redirects to / if role not in allowedRoles, otherwise
 * renders children.
 *
 * @param {string[]} [allowedRoles] - If omitted, any authenticated user passes.
 */
export default function RequireAuth({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-hotel-bg dark:bg-hotel-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-hotel-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If allowedRoles is specified and the profile has loaded, enforce role.
  // While profile is still null (fetching), we let the render through — the
  // DataContext will return empty data until the profile arrives anyway.
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
