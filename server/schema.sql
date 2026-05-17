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

CREATE TABLE password_reset_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_password_reset_codes_account FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
);

INSERT INTO accounts (id, name, email, password, phone, access_level, professor_request_pending) VALUES
(1, 'Administrador Eventus', 'admin@eventus.local', 'admin123', '', 'Administrador', 0);

INSERT INTO participants (id, account_id, name, email, phone, access_level) VALUES
(1, 1, 'Administrador Eventus', 'admin@eventus.local', '', 'Administrador');

INSERT INTO events (id, name, date, time, location, description, presenter_id) VALUES
(1, 'Evento de Demonstração Eventus', '2026-05-20', '19:00:00', 'Auditório Principal', 'Evento inicial de demonstração do sistema Eventus.', NULL);
