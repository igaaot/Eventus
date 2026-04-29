DROP DATABASE IF EXISTS eventus;
CREATE DATABASE eventus;
USE eventus;

CREATE TABLE accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password VARCHAR(160) NOT NULL,
  phone VARCHAR(30) NULL,
  access_level VARCHAR(20) NOT NULL DEFAULT 'Estudante',
  professor_request_pending TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  phone VARCHAR(30) NULL,
  access_level VARCHAR(20) NOT NULL DEFAULT 'Estudante',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_participants_account FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
);

CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  presenter_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_events_presenter FOREIGN KEY (presenter_id) REFERENCES participants (id) ON DELETE SET NULL
);

CREATE TABLE registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  participant_id INT NOT NULL,
  event_id INT NOT NULL,
  registration_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_registrations_participant FOREIGN KEY (participant_id) REFERENCES participants (id) ON DELETE CASCADE,
  CONSTRAINT fk_registrations_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT uniq_registration UNIQUE (participant_id, event_id)
);

INSERT INTO accounts (name, email, password, phone, access_level, professor_request_pending) VALUES
  ('Administrador Eventus', 'admin@eventus.local', 'admin123', '', 'Administrador', 0),
  ('Ana Martins', 'ana.martins@fatec.sp.gov.br', '123456', '(11) 99999-1000', 'Professor', 0),
  ('Bruno Costa', 'bruno@example.com', '123456', '(11) 99999-2000', 'Estudante', 0),
  ('Alice Silva', 'alice@example.com', '123456', '(11) 99999-3000', 'Estudante', 0);

INSERT INTO participants (account_id, name, email, phone, access_level) VALUES
  (1, 'Administrador Eventus', 'admin@eventus.local', '', 'Administrador'),
  (2, 'Ana Martins', 'ana.martins@fatec.sp.gov.br', '(11) 99999-1000', 'Professor'),
  (3, 'Bruno Costa', 'bruno@example.com', '(11) 99999-2000', 'Estudante'),
  (4, 'Alice Silva', 'alice@example.com', '(11) 99999-3000', 'Estudante');

INSERT INTO events (name, date, time, location, description, presenter_id) VALUES
  ('Simpósio de Inteligência Artificial', '2026-05-14', '09:00:00', 'Auditório Central', 'Evento voltado à apresentação de pesquisas e tendências em inteligência artificial.', 2),
  ('Workshop de Escrita Acadêmica', '2026-06-09', '14:00:00', 'Sala 302', 'Oficina prática para desenvolvimento de artigos e trabalhos acadêmicos.', 2);

INSERT INTO registrations (participant_id, event_id, registration_date) VALUES
  (3, 1, '2026-04-01 10:00:00'),
  (4, 1, '2026-04-02 11:30:00');
