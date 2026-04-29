export type AccessLevel = 'Estudante' | 'Professor' | 'Administrador';

export interface UserProfile {
  id: string;
  participantId: string;
  name: string;
  email: string;
  phone: string;
  accessLevel: AccessLevel;
  professorRequestPending: boolean;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  description: string;
  presenterId: string | null;
  presenterName: string | null;
}

export interface Registration {
  id: string;
  participantId: string;
  eventId: string;
  registrationDate: string;
}

export interface SessionUser extends UserProfile {}
