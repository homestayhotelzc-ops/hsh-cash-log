import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { DataProvider } from './contexts/DataContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import AddEntry from './pages/AddEntry'
import Expenses from './pages/Expenses'
import Summary from './pages/Summary'
import Staff from './pages/Staff'

export default function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="add-entry" element={<AddEntry />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="summary" element={<Summary />} />
              <Route path="staff" element={<Staff />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </ThemeProvider>
  )
}
