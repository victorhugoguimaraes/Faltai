import React from 'react';
import { FaPlus } from 'react-icons/fa';

function FloatingActionButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Adicionar materia"
      className="fixed right-4 z-[9998] flex h-15 w-15 items-center justify-center rounded-[1.5rem] border border-white/25 bg-slate-950 text-white shadow-strong transition-transform duration-200 hover:scale-[1.04] active:scale-[0.96] sm:bottom-8 sm:right-8 sm:h-16 sm:w-16 sm:rounded-[1.6rem]"
      style={{ bottom: 'calc(7.25rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <FaPlus size={20} />
    </button>
  );
}

export default FloatingActionButton;
