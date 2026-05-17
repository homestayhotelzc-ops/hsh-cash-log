import React from 'react'

const styles = {
  Cash: 'bg-amber-800/20 text-amber-800 dark:bg-amber-800/30 dark:text-amber-300 border border-amber-800/30',
  GCash: 'bg-blue-600/15 text-blue-700 dark:bg-blue-600/25 dark:text-blue-300 border border-blue-600/30',
  Maya: 'bg-purple-600/15 text-purple-700 dark:bg-purple-600/25 dark:text-purple-300 border border-purple-600/30',
  Bank: 'bg-slate-600/15 text-slate-700 dark:bg-slate-600/25 dark:text-slate-300 border border-slate-600/30',
  VOIDED: 'bg-red-600/15 text-red-700 dark:bg-red-600/25 dark:text-red-400 border border-red-600/30',
}

export default function PaymentBadge({ method, voided = false, size = 'sm' }) {
  const label = voided ? 'VOIDED' : method
  const cls = styles[label] ?? styles.Cash
  const textSize = size === 'xs' ? 'text-[10px]' : 'text-xs'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold ${textSize} ${cls}`}>
      {label}
    </span>
  )
}
