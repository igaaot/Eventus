import React, { useEffect, useState } from 'react';
import { ShieldCheck, UserRound } from 'lucide-react';
import InfoHint from '../components/InfoHint';
import { formatPhone, sanitizeName } from '../lib/formatters';
import { SessionUser } from '../types';

interface ProfileProps {
  user: SessionUser;
  onUpdate: (payload: { name: string; email: string; phone: string }) => Promise<void>;
  onRequestProfessorAccess: () => Promise<void>;
}

export default function Profile({ user, onUpdate, onRequestProfessorAccess }: ProfileProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [requestMessage, setRequestMessage] = useState('');

  useEffect(() => {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
    });
  }, [user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setRequestMessage('');

    try {
      await onUpdate(formData);
      setMessage('Perfil atualizado com sucesso.');
    } catch (submissionError) {
      if (submissionError instanceof Error) {
        setError(submissionError.message);
      } else {
        setError('Não foi possível atualizar o perfil.');
      }
    }
  };

  const handleProfessorRequest = async () => {
    setMessage('');
    setError('');
    setRequestMessage('');

    try {
      await onRequestProfessorAccess();
      setRequestMessage('Solicitação enviada. Um administrador precisa aprovar sua promoção para professor.');
    } catch (submissionError) {
      if (submissionError instanceof Error) {
        setError(submissionError.message);
      } else {
        setError('Não foi possível enviar a solicitação.');
      }
    }
  };

  const profileHint =
    user.accessLevel === 'Administrador'
      ? 'Nesta área o administrador pode atualizar seus próprios dados e acompanhar o perfil com que acessa a plataforma.'
      : user.accessLevel === 'Professor'
        ? 'Nesta área você pode manter seus dados atualizados e acompanhar o perfil de professor utilizado nos eventos vinculados.'
        : 'Nesta área você pode atualizar seus dados e, se desejar, solicitar promoção para professor.';

  return (
    <div className="space-y-6">
      <div className="brand-card relative overflow-visible p-8">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-fuchsia-400/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Meu espaço</p>
            <InfoHint text={profileHint} />
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Meu perfil</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Atualize seus dados, acompanhe seu nível de acesso e solicite evolução de perfil quando necessário.
          </p>
        </div>
      </div>

      <div className="brand-card p-6">
        <div className="mb-8 flex flex-col gap-4 rounded-[28px] bg-[linear-gradient(135deg,#0f172a_0%,#16203f_50%,#1d4ed8_100%)] p-6 text-white shadow-[0_24px_50px_rgba(15,23,42,0.18)] sm:flex-row sm:items-center">
          <div className="flex h-18 w-18 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur-sm">
            <UserRound size={30} />
          </div>
          <div className="flex-1">
            <p className="text-xl font-bold">{user.name}</p>
            <p className="text-sm text-slate-200">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-bold">
                <ShieldCheck size={14} />
                {user.accessLevel}
              </span>
              {user.professorRequestPending && (
                <span className="rounded-full bg-amber-300/15 px-3 py-1 text-xs font-bold text-amber-100 ring-1 ring-amber-200/20">
                  Solicitação de professor pendente
                </span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {requestMessage && (
            <div className="rounded-xl border border-sky-100 bg-sky-50 p-3 text-sm text-sky-700">{requestMessage}</div>
          )}
          {message && (
            <div className="rounded-xl border border-lime-100 bg-lime-50 p-3 text-sm text-lime-700">{message}</div>
          )}
          {error && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-900">Telefone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(event) => setFormData({ ...formData, phone: formatPhone(event.target.value) })}
              placeholder="(11) 99999-9999"
              inputMode="numeric"
              maxLength={15}
              className="brand-input"
            />
          </div>

          <div className="pt-2">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" className="brand-button">
                Salvar perfil
              </button>
              {user.accessLevel === 'Estudante' && !user.professorRequestPending && (
                <button type="button" onClick={handleProfessorRequest} className="brand-outline-button">
                  Solicitar perfil de professor
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
