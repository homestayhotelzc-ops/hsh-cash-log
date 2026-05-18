import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, Receipt, BarChart3, Users, LogOut, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard', roles: ['manager', 'front_desk', 'housekeeping'] },
  { to: '/expenses',  icon: Receipt,         label: 'Expenses',  roles: ['manager', 'front_desk'] },
  { to: '/add-entry', icon: PlusCircle,      label: 'Add',       roles: ['manager', 'front_desk'], primary: true },
  { to: '/summary',   icon: BarChart3,       label: 'Summary',   roles: ['manager', 'front_desk'] },
  { to: '/staff',     icon: Users,           label: 'Staff',     roles: ['manager'] },
]

export default function BottomNav() {
  const { profile, signOut } = useAuth()
  const role = profile?.role
  const [showMenu, setShowMenu] = useState(false)

  const visibleNav = NAV.filter((n) => !role || n.roles.includes(role))

  // Non-managers don't see Staff in bottom nav — they get a "Me" avatar slot instead
  const showMeSlot = role && role !== 'manager'

  return (
    <>
      {/* Sign-out overlay for non-managers */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center p-4 pb-24"
          style={{ background: 'rgba(26,18,9,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowMenu(false)}
        >
          <div
            className="hotel-card w-full max-w-sm p-5 space-y-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* User info */}
            {profile && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-hotel-accent flex items-center justify-center shrink-0">
                  <span className="text-white font-bold">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-hotel-text dark:text-hotel-dark-text">
                    {profile.full_name}
                  </p>
                  <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted capitalize">
                    {profile.role.replace('_', ' ')}
                  </p>
                </div>
                <button
                  onClick={() => setShowMenu(false)}
                  className="ml-auto p-1.5 rounded-lg text-hotel-muted dark:text-hotel-dark-muted hover:bg-hotel-surface dark:hover:bg-hotel-dark-surface"
                >
                  <X size={15} />
                </button>
              </div>
            )}
            <button
              onClick={() => { setShowMenu(false); signOut() }}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
            >
              <LogOut size={15} strokeWidth={2} />
              Sign out
            </button>
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-hotel-bg/95 dark:bg-hotel-dark-bg/95 backdrop-blur-md border-t border-hotel-border dark:border-hotel-dark-border">
        <div className="flex items-end justify-around px-2 py-2 pb-safe">

          {visibleNav.map(({ to, icon: Icon, label, primary }) =>
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

          {/* "Me" slot for non-managers — tapping opens sign-out sheet */}
          {showMeSlot && (
            <button
              onClick={() => setShowMenu(true)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[52px] text-hotel-muted dark:text-hotel-dark-muted"
            >
              <div className="w-5 h-5 rounded-lg bg-hotel-accent flex items-center justify-center">
                <span className="text-white text-[10px] font-bold leading-none">
                  {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
                </span>
              </div>
              <span className="text-[10px] font-medium">Me</span>
            </button>
          )}

        </div>
      </nav>
    </>
  )
}
