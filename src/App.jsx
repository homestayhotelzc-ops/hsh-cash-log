import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { DataProvider } from './contexts/DataContext'
import RequireAuth from './components/RequireAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AddEntry from './pages/AddEntry'
import Expenses from './pages/Expenses'
import Summary from './pages/Summary'
import Staff from './pages/Staff'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>

              {/* Public */}
              <Route path="/login" element={<Login />} />

              {/* Protected — any authenticated user */}
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <Layout />
                  </RequireAuth>
                }
              >
                <Route index element={<Dashboard />} />

                <Route
                  path="add-entry"
                  element={
                    <RequireAuth allowedRoles={['manager', 'front_desk']}>
                      <AddEntry />
                    </RequireAuth>
                  }
                />

                <Route
                  path="expenses"
                  element={
                    <RequireAuth allowedRoles={['manager', 'front_desk']}>
                      <Expenses />
                    </RequireAuth>
                  }
                />

                <Route
                  path="summary"
                  element={
                    <RequireAuth allowedRoles={['manager', 'front_desk']}>
                      <Summary />
                    </RequireAuth>
                  }
                />

                {/* Manager-only */}
                <Route
                  path="staff"
                  element={
                    <RequireAuth allowedRoles={['manager']}>
                      <Staff />
                    </RequireAuth>
                  }
                />
              </Route>

            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
