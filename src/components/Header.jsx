import React from 'react'
import { Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { useTheme } from '../contexts/ThemeContext'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'

export default function Header() {
  const { dark, toggleTheme } = useTheme()
  const { selectedDate, setSelectedDate } = useData()
  const { user, profile } = useAuth()

  const dateObj = parseISO(selectedDate)
  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd')

  return (
    <header className="sticky top-0 z-30 bg-hotel-bg/90 dark:bg-hotel-dark-bg/90 backdrop-blur-md border-b border-hotel-border dark:border-hotel-dark-border">
      <div className="flex items-center justify-between px-4 md:px-6 h-14">

        {/* Logo — hidden on desktop (sidebar has it) */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-7 h-7 rounded-lg bg-hotel-accent flex items-center justify-center">
            <span className="text-white text-xs font-bold">H</span>
          </div>
          <span className="text-sm font-semibold text-hotel-text dark:text-hotel-dark-text">
            Home Stay Hotel
          </span>
        </div>

        {/* Date navigator */}
        <div className="flex items-center gap-2 mx-auto md:mx-0">
          <button
            onClick={() => setSelectedDate(format(subDays(dateObj, 1), 'yyyy-MM-dd'))}
            className="p-1.5 rounded-lg hover:bg-hotel-surface dark:hover:bg-hotel-dark-surface transition-colors"
          >
            <ChevronLeft size={16} className="text-hotel-muted dark:text-hotel-dark-muted" />
          </button>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="text-sm font-semibold text-hotel-text dark:text-hotel-dark-text bg-transparent border-none outline-none cursor-pointer text-center"
                style={{ colorScheme: dark ? 'dark' : 'light' }}
              />
            </div>
            <span className="text-[10px] text-hotel-muted dark:text-hotel-dark-muted">
              {format(dateObj, 'EEEE')}
              {isToday && (
                <span className="ml-1 text-hotel-accent dark:text-hotel-dark-accent font-semibold">
                  · Today
                </span>
              )}
            </span>
          </div>

          <button
            onClick={() => setSelectedDate(format(addDays(dateObj, 1), 'yyyy-MM-dd'))}
            className="p-1.5 rounded-lg hover:bg-hotel-surface dark:hover:bg-hotel-dark-surface transition-colors"
          >
            <ChevronRight size={16} className="text-hotel-muted dark:text-hotel-dark-muted" />
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-hotel-surface dark:hover:bg-hotel-dark-surface transition-colors"
            aria-label="Toggle theme"
          >
            {dark
              ? <Sun  size={16} className="text-hotel-dark-accent" />
              : <Moon size={16} className="text-hotel-muted" />
            }
          </button>

          {/* User avatar — desktop only (sidebar shows name + logout) */}
          {(profile || user) && (
            <div
              className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg bg-hotel-accent ml-1"
              title={profile?.full_name ?? user?.email ?? ''}
            >
              <span className="text-white text-[11px] font-bold">
                {(profile?.full_name ?? user?.email ?? '?').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
