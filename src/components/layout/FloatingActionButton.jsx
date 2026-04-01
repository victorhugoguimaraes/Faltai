import React from 'react';
import { FaPlus } from 'react-icons/fa';

function FloatingActionButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Adicionar materia"
      className="safe-bottom fixed bottom-24 right-4 z-[9998] flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-white/20 bg-slate-950 text-white shadow-strong transition-transform duration-200 hover:scale-[1.04] active:scale-[0.96] sm:bottom-8 sm:right-8 sm:h-16 sm:w-16 sm:rounded-[1.6rem]"
    >
      <FaPlus size={18} />
    </button>
  );
}

export default FloatingActionButton;
