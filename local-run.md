# Controlê

Sistema de organização de finanças pessoais e compartilhadas.

Tagline: **Suas finanças, no controle.**

## Stack

- Next.js 14 com App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- JWT com `jose`
- React Hook Form, Zod, Zustand, TanStack Query e Recharts

## Pré-requisitos

- Node.js 20+
- npm
- Docker e Docker Compose

## Rodando localmente

1. Instale as dependências:

```bash
npm install
```

2. Crie o arquivo de ambiente:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Suba o PostgreSQL local:

```bash
docker compose up -d
```

O banco ficará disponível em:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/controle_db"
```

4. Gere o Prisma Client:

```bash
npm run prisma:generate
```

5. Rode as migrations:

```bash
npm run prisma:migrate
```

6. Popule dados de desenvolvimento:

```bash
npm run prisma:seed
```

Usuário de teste:

```text
Email: teste@controle.app
Senha: senha123
```

7. Inicie o servidor:

```bash
npm run dev
```

Acesse:

[http://localhost:3000](http://localhost:3000)

## Scripts úteis

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Email

O envio de email está desativado inicialmente. As variáveis `RESEND_API_KEY` e `EMAIL_FROM` ficam comentadas em `.env.example`, e o scaffold futuro está em `lib/email.ts`.

Quando for ativar emails transacionais, configure as variáveis no `.env` e conecte o módulo aos fluxos de convite, verificação de email e recuperação de senha.

## Docker

Subir o banco:

```bash
docker compose up -d
```

Ver logs:

```bash
docker compose logs -f postgres
```

Parar os containers:

```bash
docker compose down
```

Remover também os dados locais do banco:

```bash
docker compose down -v
```

## Qualidade

Antes de abrir PR ou publicar mudanças:

```bash
npm run lint
npm run typecheck
npm run build
```
