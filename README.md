# Controlê

> *"Suas finanças, no controle."*

Sistema de organização de finanças pessoais e compartilhadas, com suporte a múltiplos grupos, autenticação segura, visualizações ricas de dados financeiros e instalação como PWA.

---

## Funcionalidades

### Dashboard Pessoal
- Lista de grupos do usuário com nome, descrição, número de membros e resumo do mês (receitas, despesas e saldo)
- Criação de novos grupos

### Grupos Compartilhados
- Criação de grupos com nome e descrição
- Navegação por grupo: Resumo, Receitas, Despesas, Divisões, Categorias, Gráficos e Informações
- Página de informações com integrantes, papéis e link de convite
- Permissões por papel: **OWNER** (Dono), **ADMIN**, **MEMBER**

### Convites e Cadastro
- Link de convite **temporário**, válido por **30 minutos**, gerado apenas pelo OWNER
- Gerar um novo link substitui o anterior
- Cadastro de novos usuários disponível **somente via convite válido**; o usuário entra no grupo como MEMBER
- Usuários já cadastrados aceitam o convite fazendo login pelo link

### Categorias
- Categorias separadas por tipo: **Receita** (`INCOME`) e **Despesa** (`EXPENSE`)
- Categorias padrão criadas automaticamente ao criar um grupo:
  - Receita: Salário, Freelance, Investimentos, Outros
  - Despesa: Contas, Lazer, Alimentação, Transporte, Saúde, Outros
- CRUD completo com cor personalizável (paleta pastel)

### Receitas
- Cadastro com data, valor, categoria, descrição e responsável
- **Recorrência**: mensal, anual ou personalizada (a cada N meses, de 1 a 24), de 2 a 120 ocorrências
- Ordenação por data (mais recente primeiro)
- Total do período no topo
- Ações: editar e remover (recorrentes: apenas esta, esta e as seguintes, ou todas)

### Despesas
- Cadastro com data, valor, forma de pagamento, categoria, descrição e responsável
- Formas de pagamento: Cartão de Crédito, Cartão de Débito, Pix, Dinheiro
- **Parcelamento**: até 48 parcelas mensais, criadas automaticamente (apenas Cartão de Crédito)
- **Recorrência**: mensal, anual ou personalizada (mesmas regras das receitas); não combina com parcelamento
- **Divisão de despesa**: split entre membros do grupo com valor calculado em tempo real
- Parcelas e ocorrências exibidas no mês correspondente
- Remoção de parcelas/ocorrências: apenas esta, esta e as seguintes, ou todas (recorrentes)

### Divisões de Despesas
- Listagem de todas as divisões do grupo
- Agrupamento por despesa ou por pessoa
- Toggle rápido de status: **Pendente ↔ Pago** (sem modal)
- Filtro por status e por período
- Resumo de total pendente e total pago

### Resumo do Grupo
- Listagem unificada de receitas e despesas em ordem cronológica
- Cards de resumo: Receitas, Despesas, Saldo e Divisões pendentes
- Parcelas e recorrências aparecem no mês correspondente

### Gráficos
- **Donut chart**: despesas por categoria no período (com cor por categoria)
- **Gráfico de barras**: comparativo receitas vs despesas nos últimos 6 meses
- **Gráfico de linha**: evolução do saldo ao longo do período
- Tooltips customizados no estilo Neo Brutalism
- Filtro de período sincronizado entre todos os gráficos

### Filtro de Período
- Mês atual (padrão), mês anterior, seleção entre os últimos 6 meses ou intervalo personalizado

### PWA
- Aplicação instalável (manifest com ícones normais e maskable, atalhos para Dashboard e Novo grupo)
- Service worker registrado apenas em produção:
  - Navegação network-first, com fallback para a página `/offline`
  - `/_next/static` em cache-first; ícones, imagens e fontes em stale-while-revalidate
  - `/api` e payloads RSC nunca são cacheados
- Suporte a "Adicionar à Tela de Início" no iOS (`apple-touch-icon` e `appleWebApp`)

---

## Stack Tecnológico

### Frontend
| Tecnologia | Uso |
|---|---|
| [Next.js 14](https://nextjs.org/) | Framework principal com App Router e Server Components |
| [TypeScript](https://www.typescriptlang.org/) | Tipagem estática (strict mode) |
| [Tailwind CSS](https://tailwindcss.com/) | Estilização utilitária |
| [Radix UI](https://www.radix-ui.com/) | Primitivos acessíveis (dialog, select, tooltip, collapsible) customizados para Neo Brutalism |
| [lucide-react](https://lucide.dev/) | Ícones |
| [React Hook Form](https://react-hook-form.com/) | Gerenciamento de formulários |
| [Zod](https://zod.dev/) | Validação de schemas |
| [Zustand](https://zustand-demo.pmnd.rs/) | Estado global do cliente |
| [TanStack Query](https://tanstack.com/query) | Fetching, cache e sincronização de dados |
| [Recharts](https://recharts.org/) | Gráficos interativos |
| [date-fns](https://date-fns.org/) | Manipulação de datas (fuso `America/Sao_Paulo`) |

### Backend
| Tecnologia | Uso |
|---|---|
| Next.js Route Handlers | API REST (App Router) |
| [Prisma ORM](https://www.prisma.io/) | Acesso ao banco de dados |
| [jose](https://github.com/panva/jose) | Geração e verificação de JWT |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Hash de senhas |
| Zod | Validação de payloads da API |

### Banco de Dados
| Tecnologia | Uso |
|---|---|
| [PostgreSQL 16](https://www.postgresql.org/) | Banco relacional principal |
| Docker Compose | Ambiente local de desenvolvimento |

### Autenticação
| Tecnologia | Uso |
|---|---|
| JWT (via `jose`) | Sessões com registro em banco (expiração: 7 dias) |
| bcryptjs | Hash de senhas (salt rounds: 12) |
| httpOnly Cookie | Armazenamento seguro do token (`SameSite=Lax`) |
| Google OAuth *(futuro)* | Schema preparado (`provider`/`providerId`); ver `lib/auth-providers.ts` |
| [Resend](https://resend.com/) *(futuro)* | Envio de emails transacionais, desativado; ver `lib/email.ts` |

---

## Modelo de Dados

```
User ──── Session
  │
  ├──── GroupMember ──── Group ──── Category
  │                        │
  │                        ├──── Income
  │                        │
  │                        ├──── Expense ──── ExpenseSplit
  │                        │
  │                        └──── GroupInvite
  │
  ├──── Group (criador)
  ├──── Income (responsável)
  ├──── Expense (responsável)
  └──── ExpenseSplit
```

**Entidades principais:** `User`, `Session`, `Group`, `GroupMember`, `GroupInvite`, `Category`, `Income`, `Expense`, `ExpenseSplit`

**Enums:** `Provider` (`CREDENTIALS`, `GOOGLE`), `GroupRole` (`OWNER`, `ADMIN`, `MEMBER`), `CategoryType` (`INCOME`, `EXPENSE`), `PaymentMethod` (`CREDIT_CARD`, `DEBIT_CARD`, `PIX`, `CASH`), `SplitStatus` (`PENDING`, `PAID`), `RecurringFrequency` (`MONTHLY`, `ANNUAL`, `CUSTOM`)

---

## Identidade Visual — Neo Brutalism Pastel

O **Controlê** adota o estilo **Neo Brutalism** com paleta pastel suave:

- **Tipografia**: Space Grotesk (títulos) + DM Mono (valores monetários), configuradas no Tailwind
- **Bordas**: `2px solid` preto em todos os elementos interativos
- **Sombras**: `box-shadow: 3px 3px 0px #1a1a1a` com shift no hover
- **Paleta pastel**: lavanda `#D4C5F9`, menta `#B8F0D4`, pêssego `#FFD6C0`, amarelo `#FFF0A0`, azul bebê `#C2E4FF`, rosa pó `#FFCCE0`
- **Fundo**: off-white quente `#FAFAF8`
- **Cor do tema (PWA)**: menta `#B8F0D4`
- **Inputs**: borda preta, `border-radius: 0`, sombra brutalista no focus
- **Botões**: fundo pastel + borda preta + sombra com animação no hover/active

---

## Variáveis de Ambiente

Copie `.env.example` para `.env` (o Prisma CLI lê apenas `.env`) e preencha os valores:

```env
# Banco de Dados (o docker-compose publica o Postgres na porta 5433)
DATABASE_URL="postgresql://user:password@localhost:5433/controle_db"

# JWT: valor aleatório com pelo menos 32 caracteres
JWT_SECRET="troque-por-um-valor-aleatorio"
JWT_EXPIRES_IN="7d"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Controlê"

# Email (desativado inicialmente)
# RESEND_API_KEY=""
# EMAIL_FROM="noreply@controle.app"

# Google OAuth (implementação futura)
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""
```

A aplicação recusa um `JWT_SECRET` ausente, com menos de 32 caracteres ou igual ao valor de exemplo. Para gerar um:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

---

## Como Executar

**Pré-requisitos:** Node.js 20+, npm, Docker e Docker Compose.

```bash
# Instalar dependências
npm install

# Criar arquivo de ambiente (PowerShell: Copy-Item .env.example .env)
cp .env.example .env

# Subir o PostgreSQL local
docker compose up -d

# Gerar cliente Prisma
npm run prisma:generate

# Rodar migrations
npm run prisma:migrate

# Popular banco com dados de teste
npm run prisma:seed

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

Usuários de teste (ambos no grupo "Finanças da Casa"):

| Email | Senha |
|---|---|
| `teste@controle.app` | `senha123` |
| `parceiro@controle.app` | `senha123` |

### Scripts

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run dev:local` | Servidor de desenvolvimento acessível na rede local (`0.0.0.0`) |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção (necessário para testar o PWA) |
| `npm run lint` | ESLint |
| `npm run typecheck` | Checagem de tipos (`tsc --noEmit`) |
| `npm run prisma:generate` | Gera o Prisma Client |
| `npm run prisma:migrate` | Roda as migrations em desenvolvimento |
| `npm run prisma:seed` | Popula o banco com dados de teste |

### Testando o PWA

O service worker não é registrado em `npm run dev`. Para validar:

```bash
npm run build
npm run start
```

Depois use as ferramentas de desenvolvedor do Chrome: **Application → Manifest / Service workers / Cache storage**.

---

## Regras de Negócio

- Valores sempre em **BRL** formatados como `R$ 1.234,56`
- Datas calculadas no fuso `America/Sao_Paulo`
- Período padrão: mês atual (dia 1 ao último dia)
- Parcelamento: divide o valor total igualmente e incrementa a data mensalmente; apenas Cartão de Crédito, até 48 parcelas
- Recorrência: repete o valor integral na frequência escolhida (mensal, anual ou a cada N meses)
- Divisões replicadas automaticamente para todas as parcelas e ocorrências
- Convite: link temporário de 30 minutos, gerado apenas pelo OWNER; cadastro só por convite válido
- Permissões:
  - Editar e remover o grupo, gerar link de convite: apenas OWNER
  - Criar, editar e remover categorias: OWNER e ADMIN
  - Receitas: criar, editar e remover por qualquer membro
  - Despesas: criar por qualquer membro; editar e remover pelo responsável, OWNER ou ADMIN
  - Divisões: alternar status por qualquer membro
