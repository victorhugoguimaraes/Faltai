import React from 'react';
import { FaPlus } from 'react-icons/fa';

function FloatingActionButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Adicionar materia"
      className="safe-bottom fixed bottom-28 right-4 z-[9998] flex h-16 w-16 items-center justify-center rounded-[1.6rem] bg-slate-950 text-white shadow-strong transition-transform duration-200 hover:scale-[1.04] active:scale-[0.96] sm:bottom-6 sm:right-6"
    >
      <FaPlus size={20} />
    </button>
  );
}

export default FloatingActionButton;
