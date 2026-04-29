# Eventus

Sistema web para gestão de eventos acadêmicos, com autenticação por perfil, gerenciamento de usuários, eventos e inscrições, além de integração com backend em Node.js e banco MySQL.

## Visão geral

O Eventus foi desenvolvido para centralizar o controle de eventos, participantes e permissões de acesso em uma única plataforma.

Atualmente o sistema possui:

- cadastro e login de usuários
- perfis `Estudante`, `Professor` e `Administrador`
- atualização de perfil
- solicitação e aprovação de promoção para professor
- gerenciamento de usuários
- cadastro, edição e remoção de eventos
- inscrições em eventos
- dashboard com informações por perfil
- recuperação de senha por código enviado por e-mail
- identificação visual de eventos expirados

## Tecnologias utilizadas

- React
- TypeScript
- Vite
- Tailwind CSS
- Motion
- Lucide React
- Node.js
- Express
- MySQL
- Nodemailer

## Estrutura do projeto

```text
eventus/
├── public/
├── server/
│   ├── db.ts
│   ├── index.ts
│   └── schema.sql
├── src/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   └── types.ts
├── .env.example
├── package.json
└── README.md
```

## Como rodar localmente

### Programas necessários para testar o app

- Node.js
- npm
- MySQL Server
- MySQL Workbench ou outro cliente SQL
- um navegador atualizado

### Pré-requisitos

- Node.js instalado
- MySQL em execução
- banco `eventus` criado a partir do script `server/schema.sql`

### 1. Instalar dependências

```powershell
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` com base no `.env.example`.

Exemplo:

```env
VITE_API_URL="http://localhost:3001/api"
PORT="3001"
MYSQL_HOST="localhost"
MYSQL_PORT="3306"
MYSQL_USER="root"
MYSQL_PASSWORD="SUA_SENHA_AQUI"
MYSQL_DATABASE="eventus"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seuemail@gmail.com"
SMTP_PASSWORD="sua_senha_de_app"
SMTP_FROM="Eventus <seuemail@gmail.com>"
```

## 3. Criar a estrutura do banco

Execute o script:

`server/schema.sql`

Esse script cria:

- `accounts`
- `participants`
- `events`
- `registrations`
- `password_reset_codes`

e também insere dados iniciais para teste com:

- 1 usuário administrador
- 1 participante administrador
- 1 evento inicial
- 0 inscrições

## 4. Rodar backend

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run dev:server
```

## 5. Rodar frontend

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run dev
```

## 6. Acessar no navegador

- Frontend: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:3001/api](http://localhost:3001/api)

## Usuário padrão para teste

- E-mail: `admin@eventus.local`
- Senha: `admin123`

## Perfis do sistema

### Estudante

- cria conta
- faz login
- edita o próprio perfil
- solicita promoção para professor
- visualiza eventos
- cria inscrições
- acompanha inscrições realizadas

### Professor

- faz login
- edita o próprio perfil
- visualiza eventos vinculados
- cadastra e atualiza os próprios eventos
- acompanha dashboard com dados dos seus eventos

### Administrador

- gerencia usuários
- aprova promoções para professor
- cadastra, atualiza e remove eventos
- acompanha todas as inscrições
- visualiza dashboard geral do sistema

## Recuperação de senha por e-mail

O sistema possui recuperação de senha por código enviado por e-mail.

### Como funciona

1. o usuário informa o e-mail cadastrado na opção `Esqueceu a senha?`
2. o backend gera um código temporário de recuperação
3. esse código é enviado para o e-mail informado
4. o usuário digita o código recebido
5. o usuário define uma nova senha
6. a senha é atualizada no banco de dados

### O que precisa para funcionar

Para o envio real do e-mail, é necessário configurar:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`

Essas credenciais definem **qual conta vai enviar os e-mails** do sistema.

### Importante

- o e-mail configurado no `.env` é o **remetente**
- o e-mail cadastrado no sistema é o **destinatário**
- eles não precisam ser o mesmo

Exemplo:

- remetente configurado no `.env`: `eventus.projeto@gmail.com`
- usuário cadastrado na aplicação: `aluno@exemplo.com`

Quando `aluno@exemplo.com` solicitar recuperação de senha, o código será enviado normalmente para esse endereço, desde que o SMTP esteja configurado corretamente.

### Gmail

Se estiver usando Gmail, utilize uma **senha de app**, e não a senha comum da conta.

## Observações

- sem configuração SMTP, o fluxo de recuperação de senha não enviará e-mail real
- os eventos com data já encerrada continuam visíveis para histórico, mas aparecem sinalizados como expirados
- o projeto foi estruturado para futura publicação com frontend, backend e banco em serviços separados
- nenhuma credencial real deve ser versionada no repositório

## Scripts disponíveis

```powershell
npm run dev
npm run dev:server
npm run build
npm run lint
```
