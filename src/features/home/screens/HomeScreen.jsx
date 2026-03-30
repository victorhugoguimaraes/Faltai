import React, { useState } from 'react';
import { FaArrowRight, FaShieldAlt, FaCalendarCheck, FaMobileAlt } from 'react-icons/fa';
import LoginModal from '../../../components/LoginModal';
import RegisterModal from '../../../components/RegisterModal';
import AnonymousModal from '../../../components/AnonymousModal';
import ResetPasswordModal from '../../../components/ResetPasswordModal';

function HomeScreen() {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [anonymousModalOpen, setAnonymousModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-app-shell px-4 py-8 sm:px-6 lg:px-8">
      <div className="app-shell-pattern fixed inset-0 pointer-events-none" />

      <div className="relative z-10 mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <section className="order-2 hero-surface rounded-[2.5rem] p-6 shadow-medium sm:p-10 lg:order-1">
          <p className="mb-4 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
            Faltaí
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight text-slate-950 sm:text-6xl">
            Abra, marque as faltas e feche sem perder tempo.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Controle faltas, acompanhe provas e organize a semana em uma interface direta, feita para rotina
            universitaria de verdade.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="feature-card">
              <FaMobileAlt className="mb-4 text-xl text-sky-700" />
              <h2 className="feature-card__title">Uso rapido</h2>
              <p className="feature-card__text">As acoes principais ficam perto do polegar e sem menus extras.</p>
            </div>
            <div className="feature-card">
              <FaCalendarCheck className="mb-4 text-xl text-sky-700" />
              <h2 className="feature-card__title">Agenda clara</h2>
              <p className="feature-card__text">Calendarios, provas e compromissos no mesmo fluxo simples.</p>
            </div>
            <div className="feature-card">
              <FaShieldAlt className="mb-4 text-xl text-sky-700" />
              <h2 className="feature-card__title">Conta opcional</h2>
              <p className="feature-card__text">Entre para sincronizar ou use localmente quando quiser.</p>
            </div>
          </div>
        </section>

        <section className="order-1 rounded-[2.2rem] border border-white/70 bg-white/85 p-6 shadow-strong backdrop-blur-xl sm:p-8 lg:order-2">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-slate-950">Entre e continue de onde parou</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Login, cadastro e acesso rapido no mesmo visual do resto do app.
            </p>
          </div>

          <div className="space-y-3">
            <button
              className="btn-primary flex w-full items-center justify-between text-base"
              onClick={() => setLoginModalOpen(true)}
            >
              <span>Entrar na conta</span>
              <FaArrowRight />
            </button>

            <button
              className="btn-secondary flex w-full items-center justify-between text-base"
              onClick={() => setRegisterModalOpen(true)}
            >
              <span>Criar conta</span>
              <FaArrowRight />
            </button>

            <button
              className="w-full rounded-2xl border border-slate-200 bg-slate-950 px-5 py-4 text-left text-white shadow-soft transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
              onClick={() => setAnonymousModalOpen(true)}
            >
              <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">Explorar</span>
              <span className="mt-2 block text-lg font-semibold">Usar sem conta</span>
              <span className="mt-1 block text-sm text-slate-300">Ideal para testar a interface e marcar faltas localmente.</span>
            </button>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Instalação</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Android: Chrome - menu - Adicionar a tela inicial.
              <br />
              iPhone: Safari - compartilhar - Adicionar a Tela Inicial.
            </p>
            <button
              className="mt-3 text-sm font-semibold text-sky-700 underline underline-offset-4"
              onClick={() => setResetModalOpen(true)}
            >
              Esqueci a senha
            </button>
          </div>
        </section>
      </div>

      {loginModalOpen && <LoginModal setLoginModalOpen={setLoginModalOpen} />}
      {registerModalOpen && <RegisterModal setRegisterModalOpen={setRegisterModalOpen} />}
      {anonymousModalOpen && <AnonymousModal setAnonymousModalOpen={setAnonymousModalOpen} />}
      {resetModalOpen && <ResetPasswordModal setResetModalOpen={setResetModalOpen} />}
    </div>
  );
}

export default HomeScreen;
