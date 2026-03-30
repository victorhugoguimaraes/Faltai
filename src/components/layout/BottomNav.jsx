import React from 'react';

function BottomNav({ items, activeView, onChange }) {
  return (
    <nav className="safe-bottom fixed bottom-4 left-1/2 z-20 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-[1.75rem] border border-slate-200/70 bg-white/90 p-2 shadow-strong backdrop-blur-xl sm:w-auto sm:min-w-[28rem]">
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map(({ id, label, icon: Icon }) => {
          const active = activeView === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-3 text-[11px] font-semibold transition-all sm:flex-row sm:gap-2 sm:text-sm ${
                active
                  ? 'bg-slate-950 text-white shadow-soft'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
