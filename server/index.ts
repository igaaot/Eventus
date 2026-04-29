import dotenv from 'dotenv';
import express from 'express';
import nodemailer from 'nodemailer';
import { pool, testDatabaseConnection } from './db';

dotenv.config();

type AccessLevel = 'Estudante' | 'Professor' | 'Administrador';

interface UserRow {
  id: number;
  participantId: number;
  name: string;
  email: string;
  phone: string | null;
  accessLevel: string;
  professorRequestPending: number;
}

interface PasswordResetCodeRow {
  id: number;
  accountId: number;
  code: string;
  expiresAt: string;
  usedAt: string | null;
}

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
});

function normalizeAccessLevel(value?: string): AccessLevel {
  if (value === 'Professor' || value === 'Administrador') {
    return value;
  }

  return 'Estudante';
}

function mapUser(row: UserRow) {
  return {
    id: String(row.id),
    participantId: String(row.participantId),
    name: row.name,
    email: row.email,
    phone: row.phone ?? '',
    accessLevel: normalizeAccessLevel(row.accessLevel),
    professorRequestPending: Boolean(row.professorRequestPending),
  };
}

function generateRecoveryCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass || !from) {
    return null;
  }

  return { host, port, user, pass, from };
}

async function sendRecoveryCodeEmail(email: string, code: string) {
  const smtpConfig = getSmtpConfig();

  if (!smtpConfig) {
    throw new Error('O envio de e-mail ainda nao foi configurado no servidor.');
  }

  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.port === 465,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
  });

  await transporter.sendMail({
    from: smtpConfig.from,
    to: email,
    subject: 'Codigo de recuperacao - Eventus',
    text: `Seu codigo de recuperacao do Eventus e: ${code}\n\nEsse codigo expira em 15 minutos.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin-bottom: 12px;">Recuperacao de acesso - Eventus</h2>
        <p>Voce solicitou a redefinicao de senha da sua conta.</p>
        <p>Use o codigo abaixo para continuar:</p>
        <div style="display:inline-block;padding:12px 18px;border-radius:12px;background:#eff6ff;border:1px solid #bfdbfe;font-size:24px;font-weight:700;letter-spacing:4px;">
          ${code}
        </div>
        <p style="margin-top:16px;">Esse codigo expira em 15 minutos.</p>
      </div>
    `,
  });
}

async function columnExists(tableName: string, columnName: string) {
  const [rows] = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
    `,
    [tableName, columnName]
  );

  return Number((rows as { total: number }[])[0]?.total || 0) > 0;
}

async function indexExists(tableName: string, indexName: string) {
  const [rows] = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?
    `,
    [tableName, indexName]
  );

  return Number((rows as { total: number }[])[0]?.total || 0) > 0;
}

async function ensureColumn(tableName: string, columnName: string, definition: string) {
  if (!(await columnExists(tableName, columnName))) {
    await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function ensureIndex(tableName: string, indexName: string, definition: string) {
  if (!(await indexExists(tableName, indexName))) {
    await pool.query(`CREATE ${definition}`);
  }
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(160) NOT NULL UNIQUE,
      password VARCHAR(160) NOT NULL,
      phone VARCHAR(30) NULL,
      access_level VARCHAR(20) NOT NULL DEFAULT 'Estudante',
      professor_request_pending TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS participants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      account_id INT NULL,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(160) NOT NULL UNIQUE,
      phone VARCHAR(30) NULL,
      access_level VARCHAR(20) NOT NULL DEFAULT 'Estudante',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(160) NOT NULL,
      date DATE NOT NULL,
      time TIME NOT NULL,
      location VARCHAR(160) NOT NULL,
      description TEXT NOT NULL,
      presenter_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      participant_id INT NOT NULL,
      event_id INT NOT NULL,
      registration_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      account_id INT NOT NULL,
      code VARCHAR(10) NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_password_reset_codes_account FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
    )
  `);

  await ensureColumn('accounts', 'phone', 'VARCHAR(30) NULL');
  await ensureColumn('accounts', 'access_level', "VARCHAR(20) NOT NULL DEFAULT 'Estudante'");
  await ensureColumn('accounts', 'professor_request_pending', 'TINYINT(1) NOT NULL DEFAULT 0');
  await ensureColumn('accounts', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

  await ensureColumn('participants', 'account_id', 'INT NULL');
  await ensureColumn('participants', 'phone', 'VARCHAR(30) NULL');
  await ensureColumn('participants', 'access_level', "VARCHAR(20) NOT NULL DEFAULT 'Estudante'");
  await ensureColumn('participants', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

  await ensureColumn('events', 'presenter_id', 'INT NULL');
  await ensureColumn('events', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

  await ensureIndex(
    'participants',
    'uniq_participants_account_id',
    'UNIQUE INDEX uniq_participants_account_id ON participants (account_id)'
  );
  await ensureIndex(
    'registrations',
    'uniq_registrations_participant_event',
    'UNIQUE INDEX uniq_registrations_participant_event ON registrations (participant_id, event_id)'
  );

  await pool.query(`
    UPDATE accounts
    SET access_level = CASE
      WHEN access_level IN ('Estudante', 'Professor', 'Administrador') THEN access_level
      ELSE 'Estudante'
    END
  `);

  await pool.query(`
    UPDATE participants
    SET access_level = CASE
      WHEN access_level IN ('Estudante', 'Professor', 'Administrador') THEN access_level
      ELSE 'Estudante'
    END
  `);

  const [orphanParticipants] = await pool.query(`
    SELECT id, name, email, COALESCE(phone, '') AS phone, access_level AS accessLevel
    FROM participants
    WHERE account_id IS NULL
    ORDER BY id
  `);

  for (const participant of orphanParticipants as {
    id: number;
    name: string;
    email: string;
    phone: string;
    accessLevel: string;
  }[]) {
    const [accountRows] = await pool.query('SELECT id FROM accounts WHERE email = ? LIMIT 1', [participant.email]);
    const existingAccount = (accountRows as { id: number }[])[0];
    let accountId = existingAccount?.id;

    if (!accountId) {
      const [result] = await pool.query(
        'INSERT INTO accounts (name, email, password, phone, access_level, professor_request_pending) VALUES (?, ?, ?, ?, ?, 0)',
        [
          participant.name,
          participant.email,
          '123456',
          participant.phone,
          normalizeAccessLevel(participant.accessLevel),
        ]
      );

      accountId = (result as { insertId: number }).insertId;
    }

    await pool.query('UPDATE participants SET account_id = ? WHERE id = ?', [accountId, participant.id]);
  }

  const [accountsWithoutParticipant] = await pool.query(`
    SELECT a.id, a.name, a.email, COALESCE(a.phone, '') AS phone, a.access_level AS accessLevel
    FROM accounts a
    LEFT JOIN participants p ON p.account_id = a.id
    WHERE p.id IS NULL
    ORDER BY a.id
  `);

  for (const account of accountsWithoutParticipant as {
    id: number;
    name: string;
    email: string;
    phone: string;
    accessLevel: string;
  }[]) {
    await pool.query(
      'INSERT INTO participants (account_id, name, email, phone, access_level) VALUES (?, ?, ?, ?, ?)',
      [account.id, account.name, account.email, account.phone, normalizeAccessLevel(account.accessLevel)]
    );
  }

  await pool.query(`
    UPDATE participants p
    INNER JOIN accounts a ON a.id = p.account_id
    SET
      p.name = a.name,
      p.email = a.email,
      p.phone = a.phone,
      p.access_level = a.access_level
  `);

  const [adminCountRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM accounts WHERE access_level = 'Administrador'`
  );
  const adminCount = Number((adminCountRows as { total: number }[])[0]?.total || 0);

  if (adminCount === 0) {
    const [firstAccountRows] = await pool.query('SELECT id FROM accounts ORDER BY id LIMIT 1');
    const firstAccount = (firstAccountRows as { id: number }[])[0];

    if (firstAccount) {
      await pool.query(`UPDATE accounts SET access_level = 'Administrador' WHERE id = ?`, [firstAccount.id]);
      await pool.query(`UPDATE participants SET access_level = 'Administrador' WHERE account_id = ?`, [
        firstAccount.id,
      ]);
    } else {
      const [result] = await pool.query(
        'INSERT INTO accounts (name, email, password, phone, access_level, professor_request_pending) VALUES (?, ?, ?, ?, ?, 0)',
        ['Administrador Eventus', 'admin@eventus.local', 'admin123', '', 'Administrador']
      );

      const adminId = (result as { insertId: number }).insertId;
      await pool.query(
        'INSERT INTO participants (account_id, name, email, phone, access_level) VALUES (?, ?, ?, ?, ?)',
        [adminId, 'Administrador Eventus', 'admin@eventus.local', '', 'Administrador']
      );
    }
  }
}

async function getUserByAccountId(id: string | number) {
  const [rows] = await pool.query(
    `
      SELECT
        a.id,
        p.id AS participantId,
        a.name,
        a.email,
        a.phone,
        a.access_level AS accessLevel,
        a.professor_request_pending AS professorRequestPending
      FROM accounts a
      INNER JOIN participants p ON p.account_id = a.id
      WHERE a.id = ?
      LIMIT 1
    `,
    [id]
  );

  const row = (rows as UserRow[])[0];
  return row ? mapUser(row) : null;
}

async function isProfessorParticipant(participantId: string | number) {
  const [rows] = await pool.query(
    `
      SELECT p.id
      FROM participants p
      INNER JOIN accounts a ON a.id = p.account_id
      WHERE p.id = ? AND a.access_level = 'Professor'
      LIMIT 1
    `,
    [participantId]
  );

  return (rows as { id: number }[]).length > 0;
}

app.get('/api/health', async (_, res) => {
  try {
    await testDatabaseConnection();
    res.json({ ok: true });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ ok: false, message: 'Falha ao conectar com o MySQL.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, phone } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
  };

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' });
    return;
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const [existingRows] = await pool.query('SELECT id FROM accounts WHERE email = ?', [normalizedEmail]);

    if ((existingRows as { id: number }[]).length > 0) {
      res.status(409).json({ message: 'Já existe uma conta cadastrada com este e-mail.' });
      return;
    }

    const [result] = await pool.query(
      'INSERT INTO accounts (name, email, password, phone, access_level, professor_request_pending) VALUES (?, ?, ?, ?, ?, 0)',
      [name.trim(), normalizedEmail, password, phone?.trim() || '', 'Estudante']
    );

    const insertedId = (result as { insertId: number }).insertId;

    const [participantResult] = await pool.query(
      'INSERT INTO participants (account_id, name, email, phone, access_level) VALUES (?, ?, ?, ?, ?)',
      [insertedId, name.trim(), normalizedEmail, phone?.trim() || '', 'Estudante']
    );

    const insertedParticipantId = (participantResult as { insertId: number }).insertId;

    res.status(201).json({
      user: {
        id: String(insertedId),
        participantId: String(insertedParticipantId),
        name: name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || '',
        accessLevel: 'Estudante',
        professorRequestPending: false,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Não foi possível cadastrar a conta.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    return;
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const [rows] = await pool.query(
      `
        SELECT
          a.id,
          p.id AS participantId,
          a.name,
          a.email,
          a.phone,
          a.access_level AS accessLevel,
          a.professor_request_pending AS professorRequestPending
        FROM accounts a
        INNER JOIN participants p ON p.account_id = a.id
        WHERE a.email = ? AND a.password = ?
        LIMIT 1
      `,
      [normalizedEmail, password]
    );

    const account = (rows as UserRow[])[0];

    if (!account) {
      res.status(401).json({ message: 'E-mail ou senha inválidos.' });
      return;
    }

    res.json({ user: mapUser(account) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Não foi possível realizar o login.' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ message: 'E-mail e nova senha são obrigatórios.' });
    return;
  }

  if (password.trim().length < 6) {
    res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres.' });
    return;
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const [rows] = await pool.query('SELECT id FROM accounts WHERE email = ? LIMIT 1', [normalizedEmail]);
    const account = (rows as { id: number }[])[0];

    if (!account) {
      res.status(404).json({ message: 'Não existe conta cadastrada com este e-mail.' });
      return;
    }

    await pool.query('UPDATE accounts SET password = ? WHERE id = ?', [password.trim(), account.id]);
    res.json({ message: 'Senha atualizada com sucesso. Você já pode fazer login com a nova senha.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Não foi possível atualizar a senha.' });
  }
});

app.post('/api/auth/request-reset-code', async (req, res) => {
  const { email } = req.body as { email?: string };

  if (!email) {
    res.status(400).json({ message: 'Informe o e-mail da conta.' });
    return;
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const [rows] = await pool.query('SELECT id FROM accounts WHERE email = ? LIMIT 1', [normalizedEmail]);
    const account = (rows as { id: number }[])[0];

    if (!account) {
      res.status(404).json({ message: 'Nao existe conta cadastrada com este e-mail.' });
      return;
    }

    await pool.query('UPDATE password_reset_codes SET used_at = NOW() WHERE account_id = ? AND used_at IS NULL', [
      account.id,
    ]);

    const code = generateRecoveryCode();

    await pool.query(
      'INSERT INTO password_reset_codes (account_id, code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))',
      [account.id, code]
    );

    await sendRecoveryCodeEmail(normalizedEmail, code);

    res.json({ message: 'Codigo de recuperacao enviado para o e-mail informado.' });
  } catch (error) {
    console.error('Request reset code error:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Nao foi possivel enviar o codigo.' });
  }
});

app.post('/api/auth/confirm-reset-code', async (req, res) => {
  const { email, code, password } = req.body as { email?: string; code?: string; password?: string };

  if (!email || !code || !password) {
    res.status(400).json({ message: 'E-mail, codigo e nova senha sao obrigatorios.' });
    return;
  }

  if (password.trim().length < 6) {
    res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres.' });
    return;
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const [accountRows] = await pool.query('SELECT id FROM accounts WHERE email = ? LIMIT 1', [normalizedEmail]);
    const account = (accountRows as { id: number }[])[0];

    if (!account) {
      res.status(404).json({ message: 'Nao existe conta cadastrada com este e-mail.' });
      return;
    }

    const [codeRows] = await pool.query(
      `
        SELECT id, account_id AS accountId, code, expires_at AS expiresAt, used_at AS usedAt
        FROM password_reset_codes
        WHERE account_id = ?
          AND code = ?
          AND used_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [account.id, code.trim()]
    );

    const resetCode = (codeRows as PasswordResetCodeRow[])[0];

    if (!resetCode) {
      res.status(400).json({ message: 'Codigo de recuperacao invalido.' });
      return;
    }

    if (new Date(resetCode.expiresAt).getTime() < Date.now()) {
      await pool.query('UPDATE password_reset_codes SET used_at = NOW() WHERE id = ?', [resetCode.id]);
      res.status(400).json({ message: 'O codigo informado expirou. Solicite um novo codigo.' });
      return;
    }

    await pool.query('UPDATE accounts SET password = ? WHERE id = ?', [password.trim(), account.id]);
    await pool.query('UPDATE password_reset_codes SET used_at = NOW() WHERE id = ?', [resetCode.id]);

    res.json({ message: 'Senha atualizada com sucesso. Voce ja pode fazer login com a nova senha.' });
  } catch (error) {
    console.error('Confirm reset code error:', error);
    res.status(500).json({ message: 'Nao foi possivel atualizar a senha.' });
  }
});

app.get('/api/users', async (_, res) => {
  try {
    const [rows] = await pool.query(
      `
        SELECT
          a.id,
          p.id AS participantId,
          a.name,
          a.email,
          a.phone,
          a.access_level AS accessLevel,
          a.professor_request_pending AS professorRequestPending
        FROM accounts a
        INNER JOIN participants p ON p.account_id = a.id
        ORDER BY a.name
      `
    );

    res.json((rows as UserRow[]).map(mapUser));
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ message: 'Não foi possível listar os usuários.' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, accessLevel } = req.body as {
    name?: string;
    email?: string;
    phone?: string;
    accessLevel?: string;
  };

  if (!name || !email || !accessLevel) {
    res.status(400).json({ message: 'Nome, e-mail e perfil são obrigatórios.' });
    return;
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const nextAccessLevel = normalizeAccessLevel(accessLevel);

    const [existingRows] = await pool.query('SELECT id FROM accounts WHERE email = ? AND id <> ?', [
      normalizedEmail,
      id,
    ]);

    if ((existingRows as { id: number }[]).length > 0) {
      res.status(409).json({ message: 'Já existe outro usuário cadastrado com este e-mail.' });
      return;
    }

    await pool.query(
      'UPDATE accounts SET name = ?, email = ?, phone = ?, access_level = ? WHERE id = ?',
      [name.trim(), normalizedEmail, phone?.trim() || '', nextAccessLevel, id]
    );

    if (nextAccessLevel === 'Professor' || nextAccessLevel === 'Administrador') {
      await pool.query('UPDATE accounts SET professor_request_pending = 0 WHERE id = ?', [id]);
    }

    await pool.query(
      'UPDATE participants SET name = ?, email = ?, phone = ?, access_level = ? WHERE account_id = ?',
      [name.trim(), normalizedEmail, phone?.trim() || '', nextAccessLevel, id]
    );

    const user = await getUserByAccountId(id);
    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Não foi possível atualizar o usuário.' });
  }
});

app.post('/api/users/:id/request-professor', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      'SELECT access_level AS accessLevel, professor_request_pending AS professorRequestPending FROM accounts WHERE id = ? LIMIT 1',
      [id]
    );

    const account = (rows as { accessLevel: string; professorRequestPending: number }[])[0];

    if (!account) {
      res.status(404).json({ message: 'Usuário não encontrado.' });
      return;
    }

    const accessLevel = normalizeAccessLevel(account.accessLevel);

    if (accessLevel !== 'Estudante') {
      res.status(400).json({ message: 'A solicitação só pode ser feita por contas com perfil de estudante.' });
      return;
    }

    if (Boolean(account.professorRequestPending)) {
      res.status(409).json({ message: 'Já existe uma solicitação de professor pendente para esta conta.' });
      return;
    }

    await pool.query('UPDATE accounts SET professor_request_pending = 1 WHERE id = ?', [id]);
    const user = await getUserByAccountId(id);
    res.json(user);
  } catch (error) {
    console.error('Request professor access error:', error);
    res.status(500).json({ message: 'Não foi possível registrar a solicitação.' });
  }
});

app.put('/api/users/:id/profile', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body as {
    name?: string;
    email?: string;
    phone?: string;
  };

  if (!name || !email) {
    res.status(400).json({ message: 'Nome e e-mail são obrigatórios.' });
    return;
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const [existingRows] = await pool.query('SELECT id FROM accounts WHERE email = ? AND id <> ?', [
      normalizedEmail,
      id,
    ]);

    if ((existingRows as { id: number }[]).length > 0) {
      res.status(409).json({ message: 'Já existe outro usuário cadastrado com este e-mail.' });
      return;
    }

    const [roleRows] = await pool.query('SELECT access_level AS accessLevel FROM accounts WHERE id = ? LIMIT 1', [
      id,
    ]);
    const role = normalizeAccessLevel((roleRows as { accessLevel: string }[])[0]?.accessLevel);

    await pool.query('UPDATE accounts SET name = ?, email = ?, phone = ? WHERE id = ?', [
      name.trim(),
      normalizedEmail,
      phone?.trim() || '',
      id,
    ]);

    await pool.query(
      'UPDATE participants SET name = ?, email = ?, phone = ?, access_level = ? WHERE account_id = ?',
      [name.trim(), normalizedEmail, phone?.trim() || '', role, id]
    );

    const user = await getUserByAccountId(id);
    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Não foi possível atualizar o perfil.' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [roleRows] = await pool.query('SELECT access_level AS accessLevel FROM accounts WHERE id = ? LIMIT 1', [id]);
    const currentUser = (roleRows as { accessLevel: string }[])[0];

    if (!currentUser) {
      res.status(404).json({ message: 'Usuário não encontrado.' });
      return;
    }

    if (normalizeAccessLevel(currentUser.accessLevel) === 'Administrador') {
      const [adminRows] = await pool.query(
        `SELECT COUNT(*) AS total FROM accounts WHERE access_level = 'Administrador'`
      );
      const totalAdmins = Number((adminRows as { total: number }[])[0]?.total || 0);

      if (totalAdmins <= 1) {
        res.status(400).json({ message: 'O sistema precisa manter ao menos um administrador.' });
        return;
      }
    }

    const [participantRows] = await pool.query('SELECT id FROM participants WHERE account_id = ? LIMIT 1', [id]);
    const participant = (participantRows as { id: number }[])[0];

    if (participant) {
      await pool.query('UPDATE events SET presenter_id = NULL WHERE presenter_id = ?', [participant.id]);
      await pool.query('DELETE FROM registrations WHERE participant_id = ?', [participant.id]);
      await pool.query('DELETE FROM participants WHERE id = ?', [participant.id]);
    }

    await pool.query('DELETE FROM accounts WHERE id = ?', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Não foi possível remover o usuário.' });
  }
});

app.get('/api/events', async (_, res) => {
  try {
    const [rows] = await pool.query(
      `
        SELECT
          e.id,
          e.name,
          e.date,
          e.time,
          e.location,
          e.description,
          e.presenter_id AS presenterId,
          p.name AS presenterName
        FROM events e
        LEFT JOIN participants p ON p.id = e.presenter_id
        ORDER BY e.date, e.time
      `
    );

    res.json(
      (
        rows as {
          id: number;
          name: string;
          date: string;
          time: string;
          location: string;
          description: string;
          presenterId: number | null;
          presenterName: string | null;
        }[]
      ).map((row) => ({
        id: String(row.id),
        name: row.name,
        date: row.date,
        time: row.time,
        location: row.location,
        description: row.description,
        presenterId: row.presenterId ? String(row.presenterId) : null,
        presenterName: row.presenterName,
      }))
    );
  } catch (error) {
    console.error('List events error:', error);
    res.status(500).json({ message: 'Não foi possível listar os eventos.' });
  }
});

app.post('/api/events', async (req, res) => {
  const { name, date, time, location, description, presenterId } = req.body as {
    name?: string;
    date?: string;
    time?: string;
    location?: string;
    description?: string;
    presenterId?: string | null;
  };

  if (!name || !date || !time || !location || !description) {
    res.status(400).json({ message: 'Todos os campos principais do evento são obrigatórios.' });
    return;
  }

  try {
    const normalizedPresenterId = presenterId || null;

    if (normalizedPresenterId && !(await isProfessorParticipant(normalizedPresenterId))) {
      res.status(400).json({ message: 'Selecione um professor válido para vincular ao evento.' });
      return;
    }

    const [result] = await pool.query(
      'INSERT INTO events (name, date, time, location, description, presenter_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), date, time, location.trim(), description.trim(), normalizedPresenterId]
    );

    const insertedId = (result as { insertId: number }).insertId;
    const [rows] = await pool.query(
      `
        SELECT
          e.id,
          e.name,
          e.date,
          e.time,
          e.location,
          e.description,
          e.presenter_id AS presenterId,
          p.name AS presenterName
        FROM events e
        LEFT JOIN participants p ON p.id = e.presenter_id
        WHERE e.id = ?
      `,
      [insertedId]
    );

    const event = (
      rows as {
        id: number;
        name: string;
        date: string;
        time: string;
        location: string;
        description: string;
        presenterId: number | null;
        presenterName: string | null;
      }[]
    )[0];

    res.status(201).json({
      id: String(event.id),
      name: event.name,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description,
      presenterId: event.presenterId ? String(event.presenterId) : null,
      presenterName: event.presenterName,
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Não foi possível cadastrar o evento.' });
  }
});

app.put('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  const { name, date, time, location, description, presenterId } = req.body as {
    name?: string;
    date?: string;
    time?: string;
    location?: string;
    description?: string;
    presenterId?: string | null;
  };

  if (!name || !date || !time || !location || !description) {
    res.status(400).json({ message: 'Todos os campos principais do evento são obrigatórios.' });
    return;
  }

  try {
    const normalizedPresenterId = presenterId || null;

    if (normalizedPresenterId && !(await isProfessorParticipant(normalizedPresenterId))) {
      res.status(400).json({ message: 'Selecione um professor válido para vincular ao evento.' });
      return;
    }

    await pool.query(
      'UPDATE events SET name = ?, date = ?, time = ?, location = ?, description = ?, presenter_id = ? WHERE id = ?',
      [name.trim(), date, time, location.trim(), description.trim(), normalizedPresenterId, id]
    );

    const [rows] = await pool.query(
      `
        SELECT
          e.id,
          e.name,
          e.date,
          e.time,
          e.location,
          e.description,
          e.presenter_id AS presenterId,
          p.name AS presenterName
        FROM events e
        LEFT JOIN participants p ON p.id = e.presenter_id
        WHERE e.id = ?
      `,
      [id]
    );

    const event = (
      rows as {
        id: number;
        name: string;
        date: string;
        time: string;
        location: string;
        description: string;
        presenterId: number | null;
        presenterName: string | null;
      }[]
    )[0];

    res.json({
      id: String(event.id),
      name: event.name,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description,
      presenterId: event.presenterId ? String(event.presenterId) : null,
      presenterName: event.presenterName,
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Não foi possível atualizar o evento.' });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM registrations WHERE event_id = ?', [req.params.id]);
    await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Não foi possível remover o evento.' });
  }
});

app.get('/api/registrations', async (_, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, participant_id AS participantId, event_id AS eventId, registration_date AS registrationDate FROM registrations ORDER BY registration_date DESC'
    );

    res.json(
      (
        rows as {
          id: number;
          participantId: number;
          eventId: number;
          registrationDate: string;
        }[]
      ).map((row) => ({
        id: String(row.id),
        participantId: String(row.participantId),
        eventId: String(row.eventId),
        registrationDate: row.registrationDate,
      }))
    );
  } catch (error) {
    console.error('List registrations error:', error);
    res.status(500).json({ message: 'Não foi possível listar as inscrições.' });
  }
});

app.post('/api/registrations', async (req, res) => {
  const { participantId, eventId } = req.body as {
    participantId?: string;
    eventId?: string;
  };

  if (!participantId || !eventId) {
    res.status(400).json({ message: 'Participante e evento são obrigatórios.' });
    return;
  }

  try {
    const [participantRows] = await pool.query('SELECT id FROM participants WHERE id = ? LIMIT 1', [participantId]);
    const [eventRows] = await pool.query('SELECT id FROM events WHERE id = ? LIMIT 1', [eventId]);

    if ((participantRows as { id: number }[]).length === 0) {
      res.status(404).json({ message: 'Participante não encontrado.' });
      return;
    }

    if ((eventRows as { id: number }[]).length === 0) {
      res.status(404).json({ message: 'Evento não encontrado.' });
      return;
    }

    const [existingRows] = await pool.query(
      'SELECT id FROM registrations WHERE participant_id = ? AND event_id = ?',
      [participantId, eventId]
    );

    if ((existingRows as { id: number }[]).length > 0) {
      res.status(409).json({ message: 'Este participante já está inscrito no evento selecionado.' });
      return;
    }

    const [result] = await pool.query(
      'INSERT INTO registrations (participant_id, event_id, registration_date) VALUES (?, ?, NOW())',
      [participantId, eventId]
    );

    const insertedId = (result as { insertId: number }).insertId;
    const [rows] = await pool.query(
      'SELECT id, participant_id AS participantId, event_id AS eventId, registration_date AS registrationDate FROM registrations WHERE id = ?',
      [insertedId]
    );

    const registration = (
      rows as {
        id: number;
        participantId: number;
        eventId: number;
        registrationDate: string;
      }[]
    )[0];

    res.status(201).json({
      id: String(registration.id),
      participantId: String(registration.participantId),
      eventId: String(registration.eventId),
      registrationDate: registration.registrationDate,
    });
  } catch (error) {
    console.error('Create registration error:', error);
    res.status(500).json({ message: 'Não foi possível realizar a inscrição.' });
  }
});

app.delete('/api/registrations/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM registrations WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Delete registration error:', error);
    res.status(500).json({ message: 'Não foi possível remover a inscrição.' });
  }
});

app.listen(port, async () => {
  try {
    await ensureSchema();
    await testDatabaseConnection();
    console.log(`API Eventus rodando em http://localhost:${port}`);
  } catch (error) {
    console.error('API iniciada, mas sem conexão com o MySQL:', error);
    console.log(`API Eventus rodando em http://localhost:${port}`);
  }
});
