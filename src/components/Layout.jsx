import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'
import { isConfigured } from '../lib/supabase'

function SetupBanner() {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/40 px-4 py-2.5 text-center text-xs text-amber-800 dark:text-amber-300">
      <strong>Setup required:</strong> Add your Supabase credentials to a{' '}
      <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">.env</code>{' '}
      file. See{' '}
      <strong>README.md</strong> for instructions. The app is running in offline mode.
    </div>
  )
}

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-hotel-bg dark:bg-hotel-dark-bg">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {!isConfigured && <SetupBanner />}
        <Header />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
