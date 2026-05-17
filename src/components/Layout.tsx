import React, { useState } from 'react';
import {
  Calendar,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { SessionUser } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: SessionUser;
  onLogout: () => void;
  isAdmin?: boolean;
}

export default function Layout({
  children,
  activeTab,
  setActiveTab,
  user,
  onLogout,
  isAdmin = false,
}: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(isAdmin ? [{ id: 'users', label: 'Usuários', icon: Users }] : []),
    { id: 'events', label: 'Eventos', icon: Calendar },
    { id: 'registrations', label: 'Inscrições', icon: ClipboardList },
    { id: 'profile', label: 'Meu perfil', icon: UserRound },
  ];

  return (
    <div className="flex min-h-screen text-slate-900">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 transform border-r border-white/10 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background:
            'linear-gradient(180deg, rgba(11,16,32,0.98) 0%, rgba(18,25,53,0.98) 52%, rgba(24,36,74,0.98) 100%)',
        }}
      >
        <div className="flex h-full flex-col">
          <div className="relative overflow-hidden border-b border-white/10 p-6">
            <div className="absolute -right-8 top-0 h-24 w-24 rounded-full bg-fuchsia-500/20 blur-2xl" />
            <div className="absolute -left-6 bottom-0 h-16 w-16 rounded-full bg-sky-400/20 blur-2xl" />

            <div className="relative flex items-center justify-between">
              <div className="min-w-0">
                <div className="inline-flex rounded-[26px] border border-white/10 bg-white/4 px-5 py-4 shadow-[0_16px_32px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                  <img
                    src="/logo-eventus.png"
                    alt="Logo Eventus"
                    className="h-16 w-auto object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.18)]"
                  />
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-[0.24em] text-sky-200/80">
                  Gestão de eventos
                </p>
              </div>

              <button
                onClick={() => setIsSidebarOpen(false)}
                className="rounded-xl p-2 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
                aria-label="Fechar menu"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <nav className="flex-1 space-y-2 p-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`
                    flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200
                    ${
                      isActive
                        ? 'bg-white text-slate-950 shadow-[0_20px_35px_rgba(0,0,0,0.18)]'
                        : 'text-slate-300 hover:bg-white/8 hover:text-white'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-4 text-white shadow-[0_20px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-300">Usuário</p>
              <p className="truncate text-sm font-semibold text-white">{user.email}</p>
              <p className="mt-1 truncate text-xs text-slate-300">{user.name}</p>
              <p className="mt-3 inline-flex rounded-full bg-sky-400/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-100 ring-1 ring-sky-200/20">
                {user.accessLevel}
              </p>
              <button
                type="button"
                onClick={onLogout}
                className="mt-5 ml-1 inline-flex items-center gap-2 rounded-lg text-xs font-semibold text-slate-200 transition hover:text-white"
              >
                <LogOut size={14} />
                Sair
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-white/60 bg-white/70 px-6 backdrop-blur-sm lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="-ml-2 rounded-xl p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu size={24} />
            </button>

            <div className="flex items-center gap-4">
              <div className="hidden sm:block">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Plataforma Eventus</p>
                <p className="text-sm font-medium text-slate-700">Sistema web para gestão de eventos</p>
              </div>
            </div>

            <div className="hidden rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2 shadow-sm md:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Versão atual</p>
              <p className="text-sm font-bold text-slate-900">2.0</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </div>
      </main>
    </div>
  );
}
