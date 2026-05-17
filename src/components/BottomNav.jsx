import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, Receipt, BarChart3, Users } from 'lucide-react'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/add-entry', icon: PlusCircle, label: 'Add', primary: true },
  { to: '/summary', icon: BarChart3, label: 'Summary' },
  { to: '/staff', icon: Users, label: 'Staff' },
]

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-hotel-bg/95 dark:bg-hotel-dark-bg/95 backdrop-blur-md border-t border-hotel-border dark:border-hotel-dark-border">
      <div className="flex items-end justify-around px-2 py-2 pb-safe">
        {NAV.map(({ to, icon: Icon, label, primary }) =>
          primary ? (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center gap-0.5 -mt-5"
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-hotel-md transition-all ${
                      isActive
                        ? 'bg-hotel-text dark:bg-hotel-dark-text scale-95'
                        : 'bg-hotel-accent'
                    }`}
                  >
                    <Icon size={22} className="text-white" />
                  </div>
                  <span className="text-[10px] font-medium text-hotel-muted dark:text-hotel-dark-muted">
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ) : (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[52px] ${
                  isActive
                    ? 'text-hotel-accent dark:text-hotel-dark-accent'
                    : 'text-hotel-muted dark:text-hotel-dark-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          )
        )}
      </div>
    </nav>
  )
}
