import React from 'react'

export default function KPICard({
  label,
  value,
  helper,
  icon: Icon,
  positive,
  negative,
  accent = false,
}) {
  const valueColor = positive
    ? 'text-emerald-600 dark:text-emerald-400'
    : negative
    ? 'text-red-500 dark:text-red-400'
    : accent
    ? 'text-hotel-accent dark:text-hotel-dark-accent'
    : 'text-hotel-text dark:text-hotel-dark-text'

  const iconColor = positive
    ? 'text-emerald-400 dark:text-emerald-500'
    : negative
    ? 'text-red-300 dark:text-red-600'
    : accent
    ? 'text-hotel-accent/50 dark:text-hotel-dark-accent/50'
    : 'text-hotel-border dark:text-hotel-dark-border'

  return (
    <div className="hotel-card p-5 flex flex-col gap-3 hover:shadow-hotel-md dark:hover:shadow-hotel-dark-md transition-all duration-200">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold text-hotel-muted dark:text-hotel-dark-muted uppercase tracking-widest leading-tight">
          {label}
        </span>
        {Icon && (
          <Icon size={14} strokeWidth={1.75} className={`shrink-0 mt-0.5 ${iconColor}`} />
        )}
      </div>
      <div className={`text-2xl font-bold leading-none tracking-tight ${valueColor}`}>
        {value}
      </div>
      {helper && (
        <p className="text-[11px] text-hotel-muted dark:text-hotel-dark-muted leading-relaxed -mt-0.5">
          {helper}
        </p>
      )}
    </div>
  )
}
