import React from 'react';
import { FaTimes } from 'react-icons/fa';

function BottomSheet({
  isOpen,
  onClose,
  title,
  icon = null,
  children,
  className = '',
  contentClassName = '',
  showHandle = true,
  mobileFullHeight = false,
  headerActions = null
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10050] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div
        className={`flex w-full flex-col overflow-hidden border border-white/70 bg-white/95 shadow-strong backdrop-blur-xl sm:max-w-4xl ${
          mobileFullHeight ? 'h-[92vh] sm:h-auto sm:max-h-[90vh]' : 'max-h-[90vh]'
        } rounded-t-3xl sm:rounded-3xl ${className}`}
      >
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/96 backdrop-blur-xl">
          {showHandle && (
            <div className="flex justify-center pb-1 pt-2 sm:hidden">
              <div className="h-1.5 w-12 rounded-full bg-slate-300" />
            </div>
          )}

          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex min-w-0 items-center gap-3">
              {icon && <span className="shrink-0 text-sky-700">{icon}</span>}
              <h2 className="truncate text-base font-semibold text-slate-900 sm:text-xl">{title}</h2>
            </div>

            <div className="flex items-center gap-2">
              {headerActions}
              <button
                onClick={onClose}
                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                aria-label="Fechar"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        </div>

        <div className={`min-h-0 flex-1 overflow-y-auto ${contentClassName}`}>{children}</div>
      </div>
    </div>
  );
}

export default BottomSheet;
