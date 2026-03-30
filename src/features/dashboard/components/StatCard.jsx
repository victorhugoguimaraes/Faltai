import React from 'react';

const colorVariants = {
  blue: {
    border: 'border-blue-500',
    text: 'text-blue-600',
    icon: 'text-blue-500'
  },
  amber: {
    border: 'border-amber-500',
    text: 'text-amber-600',
    icon: 'text-amber-500'
  },
  emerald: {
    border: 'border-emerald-500',
    text: 'text-emerald-600',
    icon: 'text-emerald-500'
  },
  rose: {
    border: 'border-rose-500',
    text: 'text-rose-600',
    icon: 'text-rose-500'
  }
};

function StatCard({ title, fullTitle, value, icon, color = 'blue', subtitle }) {
  const variant = colorVariants[color] || colorVariants.blue;

  return (
    <div className={`rounded-2xl border border-slate-100 border-l-4 bg-white p-3 shadow-sm sm:p-6 ${variant.border}`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-slate-600 sm:text-sm" title={fullTitle || title}>
            <span className="sm:hidden">{title}</span>
            <span className="hidden sm:inline">{fullTitle || title}</span>
          </p>
          <p className={`text-lg font-bold sm:text-2xl ${variant.text}`}>
            {typeof value === 'number' && !Number.isNaN(value) ? value : '0'}
          </p>
          {subtitle && <p className="mt-1 truncate text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={`ml-2 shrink-0 ${variant.icon}`}>{icon}</div>
      </div>
    </div>
  );
}

export default StatCard;
