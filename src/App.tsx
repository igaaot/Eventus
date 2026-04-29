/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Layout from './components/Layout';
import { useEventusData } from './hooks/useEventusData';
import { api } from './lib/api';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Profile from './pages/Profile';
import Registrations from './pages/Registrations';
import Users from './pages/Users';
import { SessionUser } from './types';

const SESSION_KEY = 'eventus_session_user';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);

    if (!savedSession) {
      return null;
    }

    try {
      return JSON.parse(savedSession);
    } catch {
      return null;
    }
  });
  const {
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
  } = useEventusData();

  const persistSession = (nextSessionUser: SessionUser | null) => {
    setSessionUser(nextSessionUser);

    if (nextSessionUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSessionUser));
      return;
    }

    localStorage.removeItem(SESSION_KEY);
  };

  const handleRegister = async (name: string, email: string, password: string, phone: string) => {
    const response = await api.register({ name, email, password, phone });
    persistSession(response.user);
  };

  const handleLogin = async (email: string, password: string) => {
    const response = await api.login({ email, password });
    persistSession(response.user);
  };

  const handleProfileUpdate = async (payload: { name: string; email: string; phone: string }) => {
    if (!sessionUser) {
      return;
    }

    const updatedUser = await updateProfile(sessionUser.id, payload);
    persistSession(updatedUser);
  };

  const handleProfessorRequest = async () => {
    if (!sessionUser) {
      return;
    }

    const updatedUser = await requestProfessorAccess(sessionUser.id);
    persistSession(updatedUser);
  };

  const handleAdminUserUpdate = async (
    id: string,
    payload: { name: string; email: string; phone: string; accessLevel: SessionUser['accessLevel'] }
  ) => {
    const updatedUser = await updateUser(id, payload);

    if (sessionUser?.id === id) {
      persistSession(updatedUser);
    }
  };

  const handleLogout = () => {
    persistSession(null);
    setActiveTab('dashboard');
  };

  const currentUser = sessionUser
    ? users.find((user) => user.id === sessionUser.id) ?? sessionUser
    : null;

  const isAdmin = currentUser?.accessLevel === 'Administrador';
  const isProfessor = currentUser?.accessLevel === 'Professor';

  const visibleEvents = isProfessor && currentUser
    ? events.filter((event) => String(event.presenterId ?? '') === String(currentUser.participantId))
    : events;

  const visibleRegistrations = isAdmin || !currentUser
    ? registrations
    : registrations.filter((registration) => registration.participantId === currentUser.participantId);

  const dashboardEvents = isProfessor ? visibleEvents : events;
  const dashboardRegistrations = isAdmin
    ? registrations
    : isProfessor
      ? registrations.filter((registration) => visibleEvents.some((event) => event.id === registration.eventId))
      : visibleRegistrations;

  const renderContent = () => {
    if (!currentUser) {
      return null;
    }

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {(() => {
            switch (activeTab) {
              case 'dashboard':
                return (
                  <Dashboard
                    currentUser={currentUser}
                    participants={users}
                    events={dashboardEvents}
                    registrations={dashboardRegistrations}
                  />
                );
              case 'users':
                return isAdmin ? (
                  <Users
                    users={users}
                    currentUserId={currentUser.id}
                    onUpdate={handleAdminUserUpdate}
                    onDelete={deleteUser}
                  />
                ) : (
                  <Profile
                    user={currentUser}
                    onUpdate={handleProfileUpdate}
                    onRequestProfessorAccess={handleProfessorRequest}
                  />
                );
              case 'events':
                return (
                  <Events
                    events={visibleEvents}
                    onAdd={addEvent}
                    onUpdate={updateEvent}
                    onDelete={deleteEvent}
                    isAdmin={isAdmin}
                    currentUser={currentUser}
                    users={users}
                  />
                );
              case 'registrations':
                return (
                  <Registrations
                    registrations={visibleRegistrations}
                    participants={users}
                    events={events}
                    onAdd={addRegistration}
                    onDelete={deleteRegistration}
                    currentUser={currentUser}
                    isAdmin={isAdmin}
                  />
                );
              case 'profile':
                return (
                  <Profile
                    user={currentUser}
                    onUpdate={handleProfileUpdate}
                    onRequestProfessorAccess={handleProfessorRequest}
                  />
                );
              default:
                return (
                  <Dashboard
                    currentUser={currentUser}
                    participants={users}
                    events={dashboardEvents}
                    registrations={dashboardRegistrations}
                  />
                );
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  if (!sessionUser) {
    return <Auth onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      user={currentUser ?? sessionUser}
      onLogout={handleLogout}
      isAdmin={isAdmin}
    >
      {renderContent()}
    </Layout>
  );
}
