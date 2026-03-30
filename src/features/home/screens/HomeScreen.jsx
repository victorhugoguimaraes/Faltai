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
        <section className="hero-surface rounded-[2.5rem] p-6 shadow-medium sm:p-10">
          <p className="mb-4 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
            Faltaí PWA
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight text-slate-950 sm:text-6xl">
            Um painel academico desenhado para celular primeiro.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Controle faltas, acompanhe provas e use lembretes semanais em uma interface que fica mais clara no
            mobile do que no desktop.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="feature-card">
              <FaMobileAlt className="mb-4 text-xl text-sky-700" />
              <h2 className="feature-card__title">Fluxo de polegar</h2>
              <p className="feature-card__text">Acoes principais sempre ao alcance com uma mao.</p>
            </div>
            <div className="feature-card">
              <FaCalendarCheck className="mb-4 text-xl text-sky-700" />
              <h2 className="feature-card__title">Agenda visual</h2>
              <p className="feature-card__text">Calendarios e proximas avaliacoes sem navegação confusa.</p>
            </div>
            <div className="feature-card">
              <FaShieldAlt className="mb-4 text-xl text-sky-700" />
              <h2 className="feature-card__title">Modo local</h2>
              <p className="feature-card__text">Use offline ou com conta Firebase sem trocar de app.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-white/70 bg-white/85 p-6 shadow-strong backdrop-blur-xl sm:p-8">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-slate-950">Comece pelo modo que fizer sentido</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              O Faltaí agora foi reorganizado para virar um repositório mais limpo e uma experiencia mais parecida com app.
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
              <span className="mt-1 block text-sm text-slate-300">Ideal para testar a interface e o fluxo mobile.</span>
            </button>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Instalacao PWA</p>
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
