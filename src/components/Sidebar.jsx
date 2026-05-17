import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  PlusCircle,
  Receipt,
  BarChart3,
  Users,
} from 'lucide-react'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/add-entry', icon: PlusCircle, label: 'Add Entry' },
  { to: '/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/summary', icon: BarChart3, label: 'Summary' },
  { to: '/staff', icon: Users, label: 'Staff' },
]

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 bg-hotel-surface dark:bg-hotel-dark-surface border-r border-hotel-border dark:border-hotel-dark-border h-screen sticky top-0 overflow-y-auto">
      {/* Brand */}
      <div className="p-5 border-b border-hotel-border dark:border-hotel-dark-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-hotel-accent flex items-center justify-center shadow-hotel">
            <span className="text-white font-bold text-base">H</span>
          </div>
          <div>
            <p className="text-xs font-bold text-hotel-text dark:text-hotel-dark-text leading-tight">
              Home Stay
            </p>
            <p className="text-[10px] text-hotel-muted dark:text-hotel-dark-muted">
              Cash Log
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-hotel-accent text-white shadow-hotel'
                  : 'text-hotel-muted dark:text-hotel-dark-muted hover:bg-hotel-border dark:hover:bg-hotel-dark-border hover:text-hotel-text dark:hover:text-hotel-dark-text'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-hotel-border dark:border-hotel-dark-border">
        <p className="text-[10px] text-hotel-muted dark:text-hotel-dark-muted text-center">
          © 2026 Home Stay Hotel
        </p>
      </div>
    </aside>
  )
}
