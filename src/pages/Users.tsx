import React, { useState } from 'react';
import { CheckCircle2, Edit2, Search, Trash2, Users as UsersIcon } from 'lucide-react';
import InfoHint from '../components/InfoHint';
import { formatPhone, sanitizeName } from '../lib/formatters';
import Modal from '../components/Modal';
import { AccessLevel, UserProfile } from '../types';

interface UsersProps {
  users: UserProfile[];
  currentUserId: string;
  onUpdate: (
    id: string,
    payload: { name: string; email: string; phone: string; accessLevel: AccessLevel }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function Users({ users, currentUserId, onUpdate, onDelete }: UsersProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    accessLevel: 'Estudante' as AccessLevel,
  });

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      accessLevel: user.accessLevel,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setError('');
    setIsModalOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!editingUser) {
      return;
    }

    try {
      await onUpdate(editingUser.id, formData);
      handleCloseModal();
    } catch (submissionError) {
      if (submissionError instanceof Error) {
        setError(submissionError.message);
      } else {
        setError('Não foi possível atualizar o usuário.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="brand-card relative overflow-visible p-8">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Administração</p>
            <InfoHint text="Aqui o administrador pode consultar usuários, editar perfis, aprovar promoções para professor e remover contas do sistema." />
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Usuários</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Gerencie as contas cadastradas, acompanhe solicitações pendentes e ajuste os perfis de acesso quando necessário.
          </p>
        </div>
      </div>

      <div className="brand-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
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
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Nome</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">E-mail</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Telefone</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Perfil</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-sky-50/35">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1d4ed8_0%,#cf1cab_100%)] text-sm font-bold text-white">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-950">{user.name}</p>
                        {user.id === currentUserId && <p className="text-xs text-sky-700">Conta atual</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.phone || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          user.accessLevel === 'Administrador'
                            ? 'bg-rose-50 text-rose-700'
                            : user.accessLevel === 'Professor'
                              ? 'bg-sky-50 text-sky-700'
                              : 'bg-lime-50 text-lime-700'
                        }`}
                      >
                        {user.accessLevel}
                      </span>
                      {user.professorRequestPending && (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                          Solicitação pendente
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.professorRequestPending && (
                        <button
                          onClick={async () => {
                            await onUpdate(user.id, {
                              name: user.name,
                              email: user.email,
                              phone: user.phone,
                              accessLevel: 'Professor',
                            });
                          }}
                          className="rounded-xl p-2 text-slate-500 transition hover:bg-lime-50 hover:text-lime-700"
                          title="Aprovar solicitação de professor"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(user)}
                        className="rounded-xl p-2 text-slate-500 transition hover:bg-sky-50 hover:text-sky-700"
                        title="Editar usuário"
                      >
                        <Edit2 size={18} />
                      </button>
                      {user.id !== currentUserId && (
                        <button
                          onClick={async () => {
                            if (confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)) {
                              await onDelete(user.id);
                            }
                          }}
                          className="rounded-xl p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                          title="Excluir usuário"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <div className="mb-4 rounded-full bg-slate-100 p-4">
                        <UsersIcon size={32} />
                      </div>
                      <p className="text-lg font-semibold text-slate-900">Nenhum usuário encontrado</p>
                      <p className="text-sm">Os usuários cadastrados aparecerão aqui.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Editar usuário">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-900">Nome completo</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: sanitizeName(event.target.value) })}
              className="brand-input"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-900">E-mail</label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={(event) => setFormData({ ...formData, email: event.target.value })}
              className="brand-input"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-900">Telefone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(event) => setFormData({ ...formData, phone: formatPhone(event.target.value) })}
              inputMode="numeric"
              maxLength={15}
              placeholder="(11) 99999-9999"
              className="brand-input"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-900">Perfil</label>
            <select
              value={formData.accessLevel}
              onChange={(event) =>
                setFormData({ ...formData, accessLevel: event.target.value as AccessLevel })
              }
              className="brand-input"
            >
              <option value="Estudante">Estudante</option>
              <option value="Professor">Professor</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={handleCloseModal} className="brand-outline-button flex-1">
              Cancelar
            </button>
            <button type="submit" className="brand-button flex-1">
              Salvar alterações
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
