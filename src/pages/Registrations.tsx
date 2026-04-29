import React, { useState } from 'react';
import { Calendar, ClipboardList, Plus, Search, Trash2 } from 'lucide-react';
import InfoHint from '../components/InfoHint';
import Modal from '../components/Modal';
import { Event, Registration, SessionUser, UserProfile } from '../types';

interface RegistrationsProps {
  registrations: Registration[];
  participants: UserProfile[];
  events: Event[];
  onAdd: (participantId: string, eventId: string) => Promise<Registration>;
  onDelete: (id: string) => Promise<void>;
  currentUser: SessionUser;
  isAdmin: boolean;
}

export default function Registrations({
  registrations,
  participants,
  events,
  onAdd,
  onDelete,
  currentUser,
  isAdmin,
}: RegistrationsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    participantId: currentUser.participantId,
    eventId: '',
  });
  const [error, setError] = useState('');

  const filteredRegistrations = registrations.filter((registration) => {
    const participant = participants.find((item) => item.participantId === registration.participantId);
    const event = events.find((item) => item.id === registration.eventId);
    const search = searchTerm.toLowerCase();

    return (
      participant?.name.toLowerCase().includes(search) ||
      participant?.email.toLowerCase().includes(search) ||
      event?.name.toLowerCase().includes(search)
    );
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      const participantId = isAdmin ? formData.participantId : currentUser.participantId;

      if (!participantId || !formData.eventId) {
        throw new Error('Selecione um participante e um evento.');
      }

      await onAdd(participantId, formData.eventId);
      handleCloseModal();
    } catch (submissionError: unknown) {
      if (submissionError instanceof Error) {
        setError(submissionError.message);
      } else {
        setError('Não foi possível concluir a inscrição.');
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ participantId: currentUser.participantId, eventId: '' });
    setError('');
  };

  const registrationsHint = isAdmin
    ? 'Nesta tela o administrador acompanha todas as inscrições registradas no sistema e pode remover registros quando necessário.'
    : currentUser.accessLevel === 'Professor'
      ? 'Nesta tela você visualiza as inscrições feitas com a sua conta, ou seja, os eventos em que você também participa como usuário da plataforma.'
      : 'Nesta tela você acompanha os eventos em que está inscrito e pode realizar novas inscrições quando houver disponibilidade.';

  return (
    <div className="space-y-6">
      <div className="brand-card relative overflow-visible p-8">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-lime-300/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Participação</p>
              <InfoHint text={registrationsHint} />
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Inscrições</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              {isAdmin
                ? 'Acompanhe e gerencie todas as inscrições do sistema.'
                : 'Visualize suas inscrições e participe dos eventos disponíveis.'}
            </p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="brand-button inline-flex items-center justify-center gap-2">
            <Plus size={20} />
            <span>Nova inscrição</span>
          </button>
        </div>
      </div>

      <div className="brand-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por participante ou evento..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="brand-input py-3 pl-10 pr-4"
          />
        </div>
      </div>

      <div className="brand-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200/70 bg-[linear-gradient(180deg,#f8fbff_0%,#f4f8ff_100%)]">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Participante</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Evento</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Data da inscrição</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {filteredRegistrations.map((registration) => {
                const participant = participants.find((item) => item.participantId === registration.participantId);
                const event = events.find((item) => item.id === registration.eventId);

                return (
                  <tr key={registration.id} className="transition-colors hover:bg-sky-50/35">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1d4ed8_0%,#cf1cab_100%)] text-xs font-bold text-white">
                          {participant?.name.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-950">{participant?.name || 'Usuário removido'}</p>
                          <p className="text-xs text-slate-500">{participant?.email || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-500" />
                        <span className="text-sm font-medium text-slate-950">{event?.name || 'Evento indisponível'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(registration.registrationDate).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={async () => {
                          if (confirm('Tem certeza que deseja remover esta inscrição?')) {
                            await onDelete(registration.id);
                          }
                        }}
                        className="rounded-xl p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                        title="Remover inscrição"
                        aria-label="Remover inscrição"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredRegistrations.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <div className="mb-4 rounded-full bg-slate-100 p-4">
                        <ClipboardList size={32} />
                      </div>
                      <p className="text-lg font-semibold text-slate-900">Nenhuma inscrição encontrada</p>
                      <p className="text-sm">Tente ajustar sua busca ou realize uma nova inscrição.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Nova inscrição">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          {isAdmin && (
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-900">Participante</label>
              <select
                required
                value={formData.participantId}
                onChange={(event) => setFormData({ ...formData, participantId: event.target.value })}
                className="brand-input"
              >
                <option value="">Selecione um participante...</option>
                {participants.map((participant) => (
                  <option key={participant.id} value={participant.participantId}>
                    {participant.name} ({participant.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-900">Evento</label>
            <select
              required
              value={formData.eventId}
              onChange={(event) => setFormData({ ...formData, eventId: event.target.value })}
              className="brand-input"
            >
              <option value="">Selecione um evento...</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} - {new Date(event.date).toLocaleDateString('pt-BR')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={handleCloseModal} className="brand-outline-button flex-1">
              Cancelar
            </button>
            <button type="submit" className="brand-button flex-1">
              Confirmar inscrição
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
