import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { AccessLevel, Event, Registration, SessionUser, UserProfile } from '../types';

export function useEventusData() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, eventsData, registrationsData] = await Promise.all([
          api.getUsers(),
          api.getEvents(),
          api.getRegistrations(),
        ]);

        setUsers(usersData);
        setEvents(eventsData);
        setRegistrations(registrationsData);
      } catch (error) {
        console.error('Erro ao carregar dados do Eventus:', error);
      }
    };

    loadData();
  }, []);

  const updateUser = async (
    id: string,
    payload: { name: string; email: string; phone: string; accessLevel: AccessLevel }
  ) => {
    const updatedUser = await api.updateUser(id, payload);
    setUsers((prev) => prev.map((item) => (item.id === id ? updatedUser : item)));
    setEvents((prev) =>
      prev.map((event) =>
        event.presenterId === updatedUser.participantId
          ? { ...event, presenterName: updatedUser.accessLevel === 'Professor' ? updatedUser.name : null }
          : event
      )
    );
    return updatedUser;
  };

  const deleteUser = async (id: string) => {
    const userToDelete = users.find((item) => item.id === id);
    await api.deleteUser(id);
    setUsers((prev) => prev.filter((item) => item.id !== id));

    if (userToDelete) {
      setEvents((prev) =>
        prev.map((event) =>
          event.presenterId === userToDelete.participantId
            ? { ...event, presenterId: null, presenterName: null }
            : event
        )
      );
      setRegistrations((prev) =>
        prev.filter((registration) => registration.participantId !== userToDelete.participantId)
      );
    }
  };

  const updateProfile = async (
    id: string,
    payload: { name: string; email: string; phone: string }
  ) => {
    const updatedUser = await api.updateProfile(id, payload);
    setUsers((prev) => prev.map((item) => (item.id === id ? updatedUser : item)));
    setEvents((prev) =>
      prev.map((event) =>
        event.presenterId === updatedUser.participantId && updatedUser.accessLevel === 'Professor'
          ? { ...event, presenterName: updatedUser.name }
          : event
      )
    );
    return updatedUser;
  };

  const requestProfessorAccess = async (id: string) => {
    const updatedUser = await api.requestProfessorAccess(id);
    setUsers((prev) => prev.map((item) => (item.id === id ? updatedUser : item)));
    return updatedUser;
  };

  const addEvent = async (event: Omit<Event, 'id' | 'presenterName'>) => {
    const createdEvent = await api.createEvent(event);
    setEvents((prev) => [...prev, createdEvent]);
    return createdEvent;
  };

  const updateEvent = async (id: string, event: Omit<Event, 'id' | 'presenterName'>) => {
    const updatedEvent = await api.updateEvent(id, event);
    setEvents((prev) => prev.map((item) => (item.id === id ? updatedEvent : item)));
  };

  const deleteEvent = async (id: string) => {
    await api.deleteEvent(id);
    setEvents((prev) => prev.filter((item) => item.id !== id));
    setRegistrations((prev) => prev.filter((registration) => registration.eventId !== id));
  };

  const addRegistration = async (participantId: string, eventId: string) => {
    const createdRegistration = await api.createRegistration({ participantId, eventId });
    setRegistrations((prev) => [...prev, createdRegistration]);
    return createdRegistration;
  };

  const deleteRegistration = async (id: string) => {
    await api.deleteRegistration(id);
    setRegistrations((prev) => prev.filter((item) => item.id !== id));
  };

  return {
    users,
    events,
    registrations,
    updateUser,
    deleteUser,
    updateProfile,
    requestProfessorAccess,
    addEvent,
    updateEvent,
    deleteEvent,
    addRegistration,
    deleteRegistration,
  };
}
