import React from 'react';
import { ArrowUpRight, Calendar, ClipboardList, ShieldCheck, Users } from 'lucide-react';
import { motion } from 'motion/react';
import InfoHint from '../components/InfoHint';
import { Event, Registration, SessionUser, UserProfile } from '../types';

interface DashboardProps {
  currentUser: SessionUser;
  participants: UserProfile[];
  events: Event[];
  registrations: Registration[];
}

export default function Dashboard({ currentUser, participants, events, registrations }: DashboardProps) {
  const isAdmin = currentUser.accessLevel === 'Administrador';
  const isProfessor = currentUser.accessLevel === 'Professor';
  const dashboardHint = isAdmin
    ? 'Esta tela mostra uma visão geral da plataforma, com indicadores de usuários, eventos e inscrições para acompanhamento administrativo.'
    : isProfessor
      ? 'Esta tela resume os eventos vinculados ao seu perfil de professor e as inscrições relacionadas a essas atividades.'
      : 'Esta tela apresenta um resumo da sua experiência no sistema, com eventos disponíveis, inscrições realizadas e status do seu perfil.';

  const stats = isAdmin
    ? [
        {
          label: 'Total de usuários',
          value: participants.length,
          icon: Users,
          iconClasses: 'bg-sky-100 text-sky-700',
          tagClasses: 'bg-sky-50 text-sky-700',
          trend: 'Visão geral do sistema',
        },
        {
          label: 'Eventos cadastrados',
          value: events.length,
          icon: Calendar,
          iconClasses: 'bg-fuchsia-100 text-fuchsia-700',
          tagClasses: 'bg-fuchsia-50 text-fuchsia-700',
          trend: `${events.length} ativos`,
        },
        {
          label: 'Inscrições totais',
          value: registrations.length,
          icon: ClipboardList,
          iconClasses: 'bg-lime-100 text-lime-700',
          tagClasses: 'bg-lime-50 text-lime-700',
          trend: 'Monitoramento completo',
        },
      ]
    : isProfessor
      ? [
          {
            label: 'Meus eventos',
            value: events.length,
            icon: Calendar,
            iconClasses: 'bg-fuchsia-100 text-fuchsia-700',
            tagClasses: 'bg-fuchsia-50 text-fuchsia-700',
            trend: 'Eventos vinculados a você',
          },
          {
            label: 'Inscrições nos meus eventos',
            value: registrations.length,
            icon: ClipboardList,
            iconClasses: 'bg-lime-100 text-lime-700',
            tagClasses: 'bg-lime-50 text-lime-700',
            trend: 'Participação acompanhada',
          },
          {
            label: 'Perfil atual',
            value: currentUser.accessLevel,
            icon: ShieldCheck,
            iconClasses: 'bg-sky-100 text-sky-700',
            tagClasses: 'bg-sky-50 text-sky-700',
            trend: currentUser.professorRequestPending ? 'Solicitação pendente' : 'Acesso aprovado',
          },
        ]
      : [
          {
            label: 'Eventos disponíveis',
            value: events.length,
            icon: Calendar,
            iconClasses: 'bg-fuchsia-100 text-fuchsia-700',
            tagClasses: 'bg-fuchsia-50 text-fuchsia-700',
            trend: 'Explore novas atividades',
          },
          {
            label: 'Minhas inscrições',
            value: registrations.length,
            icon: ClipboardList,
            iconClasses: 'bg-lime-100 text-lime-700',
            tagClasses: 'bg-lime-50 text-lime-700',
            trend: 'Acompanhe sua participação',
          },
          {
            label: 'Perfil atual',
            value: currentUser.accessLevel,
            icon: ShieldCheck,
            iconClasses: 'bg-sky-100 text-sky-700',
            tagClasses: 'bg-sky-50 text-sky-700',
            trend: currentUser.professorRequestPending ? 'Solicitação pendente' : 'Conta ativa',
          },
        ];

  const secondaryTitle = isAdmin
    ? 'Inscrições recentes'
    : isProfessor
      ? 'Inscrições nos meus eventos'
      : 'Minhas inscrições';

  const secondarySubtitle = isAdmin
    ? 'Acompanhe as últimas movimentações do sistema.'
    : isProfessor
      ? 'Veja quem já confirmou presença nos seus eventos.'
      : 'Confira em quais eventos você já está inscrito.';

  return (
    <div className="space-y-8">
      <div className="brand-card relative overflow-visible p-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(207,28,171,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(26,168,232,0.12),transparent_34%)]" />
        <div className="relative max-w-3xl">
          <div className="flex items-start justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Dashboard</p>
            <InfoHint text={dashboardHint} />
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            {isAdmin
              ? 'Visão central da plataforma Eventus'
              : isProfessor
                ? 'Seus eventos e movimentações mais recentes'
                : 'Seu resumo dentro do Eventus'}
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            {isAdmin
              ? 'Acompanhe o comportamento geral do sistema, os eventos ativos e a movimentação de inscrições.'
              : isProfessor
                ? 'Visualize rapidamente os eventos vinculados ao seu perfil e o interesse dos participantes.'
                : 'Acompanhe eventos disponíveis, suas inscrições e o status atual do seu perfil.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="brand-card p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className={`rounded-2xl p-3 ${stat.iconClasses}`}>
                  <Icon size={24} />
                </div>
                <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${stat.tagClasses}`}>
                  <ArrowUpRight size={12} />
                  {stat.trend}
                </div>
              </div>
              <div className="mt-5">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="mt-1 text-3xl font-bold text-slate-950">{stat.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="brand-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-5">
            <h3 className="text-lg font-bold text-slate-950">Próximos eventos</h3>
            <button className="text-sm font-semibold text-sky-700 hover:text-sky-800">Ver todos</button>
          </div>
          <div className="divide-y divide-slate-200/70">
            {events.slice(0, 3).map((event) => (
              <div key={event.id} className="p-6 transition-colors hover:bg-sky-50/40">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-slate-950">{event.name}</h4>
                    <p className="mt-1 text-sm text-slate-600">
                      {event.location} • {new Date(event.date).toLocaleDateString('pt-BR')}
                    </p>
                    {event.presenterName && (
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        Professor responsável: {event.presenterName}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-950">{event.time}</p>
                    <p className="text-xs text-slate-500">Horário</p>
                  </div>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="p-12 text-center">
                <Calendar className="mx-auto mb-3 text-slate-300" size={40} />
                <p className="font-medium text-slate-600">Nenhum evento disponível.</p>
                <p className="mt-1 text-xs text-slate-400">Assim que novos eventos forem cadastrados, eles aparecerão aqui.</p>
              </div>
            )}
          </div>
        </div>

        <div className="brand-card overflow-hidden">
          <div className="border-b border-slate-200/70 px-6 py-5">
            <h3 className="text-lg font-bold text-slate-950">{secondaryTitle}</h3>
            <p className="mt-1 text-xs text-slate-500">{secondarySubtitle}</p>
          </div>
          <div className="divide-y divide-slate-200/70">
            {registrations.slice(0, 3).map((reg) => {
              const participant = participants.find((p) => p.participantId === reg.participantId);
              const event = events.find((e) => e.id === reg.eventId);

              return (
                <div key={reg.id} className="p-6 transition-colors hover:bg-sky-50/40">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1d4ed8_0%,#cf1cab_100%)] font-bold text-white shadow-sm">
                      {participant?.name.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {participant?.name || 'Usuário indisponível'}
                      </p>
                      <p className="truncate text-xs text-slate-500">Inscrito em: {event?.name || 'Evento indisponível'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{new Date(reg.registrationDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {registrations.length === 0 && (
              <div className="p-12 text-center">
                <ClipboardList className="mx-auto mb-3 text-slate-300" size={40} />
                <p className="font-medium text-slate-600">
                  {isAdmin
                    ? 'Nenhuma inscrição realizada.'
                    : isProfessor
                      ? 'Ainda não há inscrições nos seus eventos.'
                      : 'Você ainda não realizou nenhuma inscrição.'}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {isAdmin
                    ? 'As inscrições recentes aparecerão aqui.'
                    : isProfessor
                      ? 'Quando estudantes se inscreverem, você verá o movimento aqui.'
                      : 'Quando você se inscrever em um evento, ele aparecerá aqui.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
