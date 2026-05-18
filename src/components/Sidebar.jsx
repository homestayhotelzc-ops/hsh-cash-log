import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  PlusCircle,
  Receipt,
  BarChart3,
  Users,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard', roles: ['manager', 'front_desk', 'housekeeping'] },
  { to: '/add-entry',  icon: PlusCircle,      label: 'Add Entry', roles: ['manager', 'front_desk'] },
  { to: '/expenses',   icon: Receipt,         label: 'Expenses',  roles: ['manager', 'front_desk'] },
  { to: '/summary',    icon: BarChart3,       label: 'Summary',   roles: ['manager', 'front_desk'] },
  { to: '/staff',      icon: Users,           label: 'Staff',     roles: ['manager'] },
]

function roleBadge(role) {
  const map = {
    manager:      { label: 'Manager',    cls: 'bg-hotel-accent/10 dark:bg-hotel-dark-accent/10 text-hotel-accent dark:text-hotel-dark-accent' },
    front_desk:   { label: 'Front Desk', cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
    housekeeping: { label: 'Housekeeping', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  }
  return map[role] ?? { label: role, cls: 'bg-hotel-surface dark:bg-hotel-dark-surface text-hotel-muted dark:text-hotel-dark-muted' }
}

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const role = profile?.role

  const visibleNav = NAV.filter((n) => !role || n.roles.includes(role))
  const badge = roleBadge(role)

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
        {visibleNav.map(({ to, icon: Icon, label }) => (
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

      {/* User + logout */}
      <div className="p-4 border-t border-hotel-border dark:border-hotel-dark-border space-y-3">
        {profile && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-hotel-accent flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">
                {profile.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-hotel-text dark:text-hotel-dark-text truncate">
                {profile.full_name}
              </p>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${badge.cls}`}>
                {badge.label}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-hotel-muted dark:text-hotel-dark-muted hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-150"
        >
          <LogOut size={14} strokeWidth={1.75} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
