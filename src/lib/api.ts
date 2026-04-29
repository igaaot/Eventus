import { Event, Registration, SessionUser, UserProfile } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(errorBody?.message || 'Erro ao processar a requisição.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  register: (payload: { name: string; email: string; password: string; phone: string }) =>
    request<{ user: SessionUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    request<{ user: SessionUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  requestResetCode: (payload: { email: string }) =>
    request<{ message: string }>('/auth/request-reset-code', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  confirmResetCode: (payload: { email: string; code: string; password: string }) =>
    request<{ message: string }>('/auth/confirm-reset-code', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getUsers: () => request<UserProfile[]>('/users'),
  updateUser: (
    id: string,
    payload: { name: string; email: string; phone: string; accessLevel: SessionUser['accessLevel'] }
  ) =>
    request<UserProfile>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteUser: (id: string) =>
    request<void>(`/users/${id}`, {
      method: 'DELETE',
    }),
  updateProfile: (id: string, payload: { name: string; email: string; phone: string }) =>
    request<SessionUser>(`/users/${id}/profile`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  requestProfessorAccess: (id: string) =>
    request<SessionUser>(`/users/${id}/request-professor`, {
      method: 'POST',
    }),
  getEvents: () => request<Event[]>('/events'),
  createEvent: (payload: Omit<Event, 'id' | 'presenterName'>) =>
    request<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateEvent: (id: string, payload: Omit<Event, 'id' | 'presenterName'>) =>
    request<Event>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteEvent: (id: string) =>
    request<void>(`/events/${id}`, {
      method: 'DELETE',
    }),
  getRegistrations: () => request<Registration[]>('/registrations'),
  createRegistration: (payload: { participantId: string; eventId: string }) =>
    request<Registration>('/registrations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteRegistration: (id: string) =>
    request<void>(`/registrations/${id}`, {
      method: 'DELETE',
    }),
};
