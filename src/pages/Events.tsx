import React, { useState } from 'react';
import { Calendar, Clock, Edit2, MapPin, Plus, Search, Trash2, Users } from 'lucide-react';
import { motion } from 'motion/react';
import InfoHint from '../components/InfoHint';
import Modal from '../components/Modal';
import { Event, UserProfile } from '../types';

interface EventsProps {
  events: Event[];
  users: UserProfile[];
  currentUser: UserProfile;
  onAdd: (event: Omit<Event, 'id' | 'presenterName'>) => Promise<Event>;
  onUpdate: (id: string, event: Omit<Event, 'id' | 'presenterName'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isAdmin: boolean;
}

export default function Events({ events, users, currentUser, onAdd, onUpdate, onDelete, isAdmin }: EventsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    description: '',
    presenterId: '' as string | null,
  });

  const isProfessor = currentUser.accessLevel === 'Professor';
  const canManageEvents = isAdmin || isProfessor;
  const eventsHint = isAdmin
    ? 'Nesta tela o administrador pode cadastrar, editar, remover e consultar todos os eventos da plataforma.'
    : isProfessor
      ? 'Nesta tela você acompanha os eventos vinculados ao seu perfil de professor e pode cadastrar ou editar os seus próprios eventos.'
      : 'Nesta tela você visualiza os eventos disponíveis na plataforma e acompanha as informações de cada atividade.';
  const professors = users.filter((user) => user.accessLevel === 'Professor');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiredEvents = events.filter((event) => {
    const eventDate = new Date(`${event.date}T00:00:00`);
    return eventDate < today;
  });
  const filteredEvents = events.filter(
    (event) =>
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      ...formData,
      presenterId: isProfessor ? currentUser.participantId : formData.presenterId || null,
    };

    if (editingEvent) {
      await onUpdate(editingEvent.id, payload);
    } else {
      await onAdd(payload);
    }

    handleCloseModal();
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description,
      presenterId: event.presenterId,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setFormData({
      name: '',
      date: '',
      time: '',
      location: '',
      description: '',
      presenterId: isProfessor ? currentUser.participantId : '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="brand-card relative overflow-visible p-8">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-fuchsia-400/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Programação</p>
              <InfoHint text={eventsHint} />
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Eventos</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              {isAdmin
                ? 'Gerencie o cronograma de eventos acadêmicos e vincule professores responsáveis.'
                : isProfessor
                  ? 'Crie e acompanhe os eventos vinculados ao seu perfil de professor.'
                  : 'Visualize os eventos disponíveis e acompanhe seus vínculos acadêmicos.'}
            </p>
          </div>
          {canManageEvents && (
            <button onClick={() => setIsModalOpen(true)} className="brand-button inline-flex items-center justify-center gap-2">
              <Plus size={20} />
              <span>Novo evento</span>
            </button>
          )}
        </div>
      </div>

      <div className="brand-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou local..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="brand-input py-3 pl-10 pr-4"
          />
        </div>
      </div>

      {expiredEvents.length > 0 && (
        <div className="rounded-[28px] border border-amber-200/70 bg-amber-50/90 p-5 shadow-[0_18px_40px_rgba(245,158,11,0.12)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-amber-800">Eventos encerrados identificados</p>
              <p className="mt-1 text-sm leading-6 text-amber-700">
                Há {expiredEvents.length} evento{expiredEvents.length > 1 ? 's' : ''} com data já encerrada. Eles continuam visíveis para histórico, mas podem ser removidos para evitar poluição visual futura.
              </p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              Revisar eventos expirados
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredEvents.map((event) => (
          <motion.div
            key={event.id}
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="brand-card flex flex-col overflow-hidden"
          >
            <div className="flex-1 p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="rounded-2xl bg-fuchsia-100 p-3 text-fuchsia-700">
                  <Calendar size={20} />
                </div>
                {(isAdmin || (isProfessor && String(event.presenterId ?? '') === String(currentUser.participantId))) && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(event)}
                      className="rounded-xl p-2 text-slate-500 transition hover:bg-sky-50 hover:text-sky-700"
                      title="Editar evento"
                      aria-label={`Editar ${event.name}`}
                    >
                      <Edit2 size={16} />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={async () => {
                          if (confirm(`Tem certeza que deseja excluir o evento ${event.name}?`)) {
                            await onDelete(event.id);
                          }
                        }}
                        className="rounded-xl p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                        title="Excluir evento"
                        aria-label={`Excluir ${event.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {new Date(`${event.date}T00:00:00`) < today && (
                <div className="mb-4">
                  <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    Evento expirado
                  </span>
                </div>
              )}

              <h3 className="mb-2 line-clamp-1 text-lg font-bold text-slate-950">{event.name}</h3>
              <p className="mb-5 line-clamp-3 text-sm leading-6 text-slate-600">{event.description}</p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar size={14} />
                  <span>{new Date(event.date).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock size={14} />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={14} />
                  <span className="truncate">{event.location}</span>
                </div>
                {event.presenterName && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users size={14} />
                    <span>{event.presenterName}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200/70 bg-slate-50/70 px-6 py-4">
              <button
                onClick={() => {
                  if (isAdmin || (isProfessor && String(event.presenterId ?? '') === String(currentUser.participantId))) {
                    handleEdit(event);
                  }
                }}
                className="text-sm font-bold text-sky-700 hover:text-sky-800"
              >
                {isAdmin || (isProfessor && String(event.presenterId ?? '') === String(currentUser.participantId))
                  ? 'Ver detalhes'
                  : 'Evento disponível'}
              </button>
            </div>
          </motion.div>
        ))}

        {filteredEvents.length === 0 && (
          <div className="brand-card col-span-full py-20 text-center">
            <div className="flex flex-col items-center justify-center text-slate-500">
              <div className="mb-4 rounded-full bg-slate-100 p-4">
                <Calendar size={32} />
              </div>
              <p className="text-lg font-semibold text-slate-900">Nenhum evento encontrado</p>
              <p className="text-sm">Tente ajustar sua busca ou aguarde novos eventos cadastrados.</p>
            </div>
          </div>
        )}
      </div>

      {canManageEvents && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingEvent ? 'Editar evento' : 'Novo evento'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-900">Nome do evento</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                className="brand-input"
                placeholder="Ex: Simpósio de IA"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-900">Data</label>
                <input
                  required
                  type="date"
                  value={formData.date}
                  onChange={(event) => setFormData({ ...formData, date: event.target.value })}
                  className="brand-input"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-900">Horário</label>
                <input
                  required
                  type="time"
                  value={formData.time}
                  onChange={(event) => setFormData({ ...formData, time: event.target.value })}
                  className="brand-input"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-900">Local</label>
              <input
                required
                type="text"
                value={formData.location}
                onChange={(event) => setFormData({ ...formData, location: event.target.value })}
                className="brand-input"
                placeholder="Ex: Auditório Central"
              />
            </div>

            {isAdmin ? (
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-900">Professor responsável</label>
                <select
                  value={formData.presenterId ?? ''}
                  onChange={(event) => setFormData({ ...formData, presenterId: event.target.value || null })}
                  className="brand-input"
                >
                  <option value="">Nenhum professor vinculado</option>
                  {professors.map((professor) => (
                    <option key={professor.id} value={professor.participantId}>
                      {professor.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-900">Professor responsável</label>
                <input
                  type="text"
                  value={currentUser.name}
                  readOnly
                  className="brand-input cursor-default bg-slate-100 text-slate-600"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-900">Descrição</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                className="brand-input resize-none"
                placeholder="Breve descrição do evento..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={handleCloseModal} className="brand-outline-button flex-1">
                Cancelar
              </button>
              <button type="submit" className="brand-button flex-1">
                {editingEvent ? 'Salvar alterações' : 'Criar evento'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
