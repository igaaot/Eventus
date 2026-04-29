import React, { useState } from 'react';
import { Lock, Mail, Phone, UserRound } from 'lucide-react';
import InfoHint from '../components/InfoHint';
import Modal from '../components/Modal';
import { formatPhone, sanitizeName } from '../lib/formatters';
import { api } from '../lib/api';

type AuthMode = 'login' | 'register';

interface AuthProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string, phone: string) => Promise<void>;
}

export default function Auth({ onLogin, onRegister }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [resetCodeSent, setResetCodeSent] = useState(false);

  const isLogin = mode === 'login';

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setError('');
  };

  const handleToggleMode = () => {
    setMode((currentMode) => (currentMode === 'login' ? 'register' : 'login'));
    resetForm();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await onLogin(email, password);
      } else {
        await onRegister(name.trim(), email.trim(), password, phone);
      }
    } catch (submissionError) {
      if (submissionError instanceof Error) {
        setError(submissionError.message);
      } else {
        setError('Nao foi possivel concluir a operacao.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenResetModal = () => {
    setResetEmail(email);
    setResetCode('');
    setResetPassword('');
    setResetPasswordConfirm('');
    setResetMessage('');
    setResetError('');
    setResetCodeSent(false);
    setIsResetModalOpen(true);
  };

  const handleCloseResetModal = () => {
    setIsResetModalOpen(false);
    setResetCode('');
    setResetPassword('');
    setResetPasswordConfirm('');
    setResetMessage('');
    setResetError('');
    setResetCodeSent(false);
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetMessage('');
    setResetError('');
    setIsResetSubmitting(true);

    try {
      if (!resetCodeSent) {
        const response = await api.requestResetCode({
          email: resetEmail.trim(),
        });

        setResetMessage(response.message);
        setResetCodeSent(true);
      } else {
        if (!resetCode.trim()) {
          setResetError('Informe o codigo recebido por e-mail.');
          return;
        }

        if (resetPassword.length < 6) {
          setResetError('A nova senha deve ter pelo menos 6 caracteres.');
          return;
        }

        if (resetPassword !== resetPasswordConfirm) {
          setResetError('A confirmacao da senha nao confere.');
          return;
        }

        const response = await api.confirmResetCode({
          email: resetEmail.trim(),
          code: resetCode.trim(),
          password: resetPassword,
        });

        setResetMessage(response.message);
        setPassword('');
      }
    } catch (submissionError) {
      if (submissionError instanceof Error) {
        setResetError(submissionError.message);
      } else {
        setResetError('Nao foi possivel concluir a recuperacao.');
      }
    } finally {
      setIsResetSubmitting(false);
    }
  };

  return (
    <>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(26,168,232,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(207,28,171,0.16),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#eef5ff_48%,#f8fafc_100%)]" />
        <div className="absolute left-[8%] top-[12%] h-40 w-40 rounded-full bg-sky-300/25 blur-3xl" />
        <div className="absolute bottom-[10%] right-[8%] h-48 w-48 rounded-full bg-fuchsia-300/20 blur-3xl" />

        <div className="brand-card relative z-10 grid w-full max-w-5xl overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden bg-[linear-gradient(160deg,#0b1020_0%,#16203f_50%,#1d4ed8_100%)] p-10 text-white lg:flex lg:items-center lg:justify-center">
            <div className="mb-8 inline-flex rounded-[32px] border border-white/10 bg-white px-6 py-5 shadow-[0_20px_45px_rgba(0,0,0,0.22)]">
              <img src="/logo-eventus.png" alt="Logo Eventus" className="h-28 w-auto object-contain" />
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <div className="mb-6 flex justify-center lg:hidden">
              <div className="rounded-[28px] border border-white/80 bg-white px-5 py-4 shadow-[0_20px_35px_rgba(29,78,216,0.14)]">
                <img src="/logo-eventus.png" alt="Logo Eventus" className="h-20 w-auto object-contain" />
              </div>
            </div>

            <div className="mb-8 text-center lg:text-left">
              <div className="flex items-start justify-center gap-3 lg:justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-700">Acesso ao sistema</p>
                <InfoHint text="Nesta tela voce pode entrar com uma conta existente, realizar um novo cadastro ou redefinir a senha de acesso." />
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                {isLogin ? 'Entre na sua conta' : 'Crie sua conta no Eventus'}
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                {isLogin
                  ? 'Acesse sua conta para entrar na plataforma e gerenciar suas informacoes.'
                  : 'O cadastro comeca como estudante e pode evoluir de acordo com o uso da plataforma.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {!isLogin && (
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-900">Nome completo</label>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3">
                    <UserRound className="h-5 w-5 text-slate-400" />
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(event) => setName(sanitizeName(event.target.value))}
                      placeholder="Seu nome completo"
                      className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-900">E-mail</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="exemplo@universidade.edu"
                    className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {!isLogin && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-bold text-slate-900">Telefone</label>
                    <span className="text-xs font-medium text-slate-500">Opcional</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3">
                    <Phone className="h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(event) => setPhone(formatPhone(event.target.value))}
                      placeholder="(11) 99999-9999"
                      inputMode="numeric"
                      maxLength={15}
                      className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-900">Senha</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                  <input
                    required
                    minLength={6}
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimo de 6 caracteres"
                    className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {isLogin && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleOpenResetModal}
                    className="text-sm font-semibold text-sky-700 underline underline-offset-4"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              )}

              <button type="submit" disabled={isSubmitting} className="brand-button w-full disabled:opacity-70">
                {isSubmitting ? 'Processando...' : isLogin ? 'Entrar' : 'Cadastrar'}
              </button>
            </form>

            <div className="mt-8 text-center text-base font-semibold text-slate-800">
              {isLogin ? 'Nao tem uma conta?' : 'Ja tem uma conta?'}{' '}
              <button type="button" onClick={handleToggleMode} className="text-sky-700 underline underline-offset-4">
                {isLogin ? 'Cadastre-se' : 'Faca login'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isResetModalOpen} onClose={handleCloseResetModal} title="Recuperar acesso">
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">
            {!resetCodeSent
              ? 'Informe o e-mail da conta para receber um codigo de recuperacao.'
              : 'Digite o codigo recebido por e-mail e defina sua nova senha.'}
          </p>

          {resetMessage && (
            <div className="rounded-xl border border-lime-100 bg-lime-50 p-3 text-sm text-lime-700">
              {resetMessage}
            </div>
          )}

          {resetError && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
              {resetError}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-900">E-mail</label>
            <input
              required
              type="email"
              value={resetEmail}
              onChange={(event) => setResetEmail(event.target.value)}
              className="brand-input"
              placeholder="exemplo@universidade.edu"
            />
          </div>

          {resetCodeSent && (
            <>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-900">Codigo de recuperacao</label>
                <input
                  required
                  type="text"
                  value={resetCode}
                  onChange={(event) => setResetCode(event.target.value)}
                  className="brand-input"
                  placeholder="Digite o codigo de 6 digitos"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-900">Nova senha</label>
                <input
                  required
                  minLength={6}
                  type="password"
                  value={resetPassword}
                  onChange={(event) => setResetPassword(event.target.value)}
                  className="brand-input"
                  placeholder="Minimo de 6 caracteres"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-900">Confirmar nova senha</label>
                <input
                  required
                  minLength={6}
                  type="password"
                  value={resetPasswordConfirm}
                  onChange={(event) => setResetPasswordConfirm(event.target.value)}
                  className="brand-input"
                  placeholder="Repita a nova senha"
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleCloseResetModal} className="brand-outline-button flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={isResetSubmitting} className="brand-button flex-1 disabled:opacity-70">
              {isResetSubmitting ? 'Processando...' : resetCodeSent ? 'Salvar nova senha' : 'Enviar codigo'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
