<p align="center">
  <img src="https://img.shields.io/badge/STATUS-CONCLUÍDO-success?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/Django-4.2-092E20?style=for-the-badge&logo=django" alt="Django" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

<h1 align="center">🎯 PocketPitch AI</h1>

## 🌐 URLs de Acesso

- **Frontend (Vercel):** [https://pocket-pitch-ai.vercel.app](https://pocket-pitch-ai.vercel.app)
- **Backend (Render):** [https://pocketpitch-backend.onrender.com](https://pocketpitch-backend.onrender.com)
- **Banco de Dados (Neon):** [PostgreSQL Online (Neon.tech)](https://neon.tech/)

<p align="center">
  <strong>Um co-piloto de vendas com inteligência artificial, direto no seu bolso.</strong><br/>
  Respostas em tempo real via streaming, pitches instantâneos e dicas de negociação — tudo alimentado pelo Google Gemini 2.5 Flash.
</p>

---

## 📑 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura e Decisões Técnicas](#-arquitetura-e-decisões-técnicas)
- [Tech Stack](#-tech-stack)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Pré-requisitos](#-pré-requisitos)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Rodando Localmente com Docker](#-rodando-localmente-com-docker)
- [Rodando o Frontend Localmente (sem Docker)](#-rodando-o-frontend-localmente-sem-docker)
- [Endpoints da API](#-endpoints-da-api)
- [Deploy em Ambiente de Teste (Online)](#-deploy-em-ambiente-de-teste-online)
- [Autor](#-autor)

---

## 💡 Sobre o Projeto

**PocketPitch AI** é uma aplicação web mobile-first projetada para capacitar vendedores com ferramentas de inteligência artificial em tempo real. Através de uma interface de chat moderna e responsiva, o vendedor pode gerar pitches de elevador, receber dicas de quebra-gelo, contornar objeções de preço e resumir perfis de clientes — tudo com respostas progressivas que aparecem na tela caractere por caractere, como em uma conversa real.

O projeto foi desenvolvido como uma plataforma full-stack completa, com autenticação segura, persistência de dados e infraestrutura containerizada.

---

## ✨ Funcionalidades

| Categoria | Feature | Detalhes |
|---|---|---|
| 🤖 **IA** | Streaming em tempo real (SSE) | Respostas do Gemini aparecem progressivamente, caractere por caractere |
| 🤖 **IA** | Ações rápidas one-click | Pitch 30s, Quebra-gelo, Objeção de Preço, Resumo do Cliente |
| 🔐 **Auth** | JWT via HttpOnly Cookies | Autenticação stateless e segura contra XSS |
| 🔐 **Auth** | Registro e Login | Fluxo completo com validação e feedback visual |
| 💬 **Chat** | Histórico de conversas | Sidebar com listagem, renomeação inline e exclusão com modal de confirmação |
| 💬 **Chat** | Auto-nomeação | Conversas são nomeadas automaticamente com a primeira mensagem do usuário |
| 💬 **Chat** | Formatação Markdown | Respostas da IA renderizam **negrito** e *itálico* nativamente |
| 📱 **UX** | Design Mobile-First | Interface premium com glassmorphism, gradientes e micro-animações |
| 📱 **UX** | Campo de texto auto-expansível | Textarea cresce verticalmente conforme o usuário digita (como Gemini/ChatGPT) |
| 📱 **UX** | Textos selecionáveis | Todo o conteúdo do chat pode ser selecionado e copiado no mobile |
| 🏗️ **Infra** | Docker Compose | Stack completa (Frontend + Backend + DB) com um único comando |

---

## 🏗️ Arquitetura e Decisões Técnicas

### Visão Geral

```
┌──────────────────┐     HTTP/SSE      ┌──────────────────┐       SQL        ┌──────────────┐
│                  │ ◄──────────────── │                  │ ◄──────────────► │              │
│   Next.js 16     │   Port 3000       │   Django 4.2     │   Port 5432      │  PostgreSQL  │
│   (Frontend)     │ ──────────────►   │   DRF + JWT      │ ──────────────►  │     15       │
│                  │   fetch + SSE     │                  │   ORM Queries    │              │
└──────────────────┘                   └──────────────────┘                  └──────────────┘
                                              │
                                              │ google-genai SDK
                                              ▼
                                       ┌──────────────┐
                                       │  Gemini 2.5  │
                                       │    Flash     │
                                       └──────────────┘
```

### Decisões Arquiteturais

| Decisão | Justificativa |
|---|---|
| **SSE em vez de WebSocket** | Streaming unidirecional é suficiente para respostas de IA. SSE funciona nativamente sobre HTTP sem necessidade de infraestrutura adicional (Redis, channels), reduzindo complexidade. |
| **JWT em HttpOnly Cookies** | Tokens armazenados em cookies HttpOnly são imunes a ataques XSS via JavaScript, diferente de localStorage. A autenticação é processada via middleware customizado (`CookieJWTAuthentication`). |
| **API URL dinâmica no Frontend** | `API_URL` é resolvida via `window.location.hostname` em runtime, permitindo acesso de qualquer dispositivo na rede local (celular, tablet) sem reconfiguração manual. |
| **Monorepo com Docker Compose** | Um único repositório com `docker-compose.yml` orquestra todos os serviços, garantindo paridade dev/prod e onboarding em um comando (`docker-compose up`). |
| **PostgreSQL em vez de SQLite** | Banco relacional robusto e production-ready desde o início. O fallback para SQLite existe apenas para desenvolvimento sem Docker. |
| **Django `StreamingHttpResponse`** | Utiliza generators do Python para transmitir chunks do Gemini via SSE, sem buffering — o texto aparece no frontend conforme o modelo gera. |

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** — Framework React com Turbopack
- **TypeScript** — Tipagem estática
- **CSS Modules** — Estilização modular (sem Tailwind)
- **Google Fonts (Inter)** — Tipografia premium

### Backend
- **Django 4.2** — Framework web Python
- **Django REST Framework** — API RESTful
- **Simple JWT** — Autenticação via JSON Web Tokens
- **google-genai** — SDK oficial do Google Gemini AI
- **django-cors-headers** — Controle de CORS

### Infraestrutura
- **Docker & Docker Compose** — Containerização
- **PostgreSQL 15 (Alpine)** — Banco de dados relacional
- **Volumes persistentes** — Dados do banco preservados entre restarts

---

## 📂 Estrutura de Pastas

```
PocketPitch AI/
├── 📁 backend/                    # Serviço Django
│   ├── 📁 api/                    # App principal
│   │   ├── authentication.py      # Middleware JWT via Cookie
│   │   ├── models.py              # Conversation, Message
│   │   ├── serializers.py         # DRF Serializers
│   │   ├── urls.py                # Rotas da API
│   │   └── views.py               # Views (Auth, Chat SSE, CRUD)
│   ├── 📁 core/                   # Configuração Django
│   │   ├── settings.py            # Settings (JWT, DB, CORS)
│   │   └── urls.py                # URL raiz
│   ├── Dockerfile                 # Imagem Python 3.12
│   ├── requirements.txt           # Dependências Python
│   └── manage.py
│
├── 📁 frontend/                   # Serviço Next.js
│   ├── 📁 src/app/
│   │   ├── page.tsx               # Componente principal (SPA)
│   │   ├── page.module.css        # Estilos do app
│   │   ├── globals.css            # Design tokens e reset
│   │   └── layout.tsx             # Layout raiz
│   ├── next.config.ts             # Config Next.js
│   ├── Dockerfile                 # Imagem Node 18
│   └── package.json
│
├── docker-compose.yml             # Orquestração dos 3 serviços
├── .env                           # Variáveis de ambiente (git-ignored)
├── .env.example                   # Template das variáveis
└── .gitignore
```

---

## 📋 Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando
- [Git](https://git-scm.com/)
- (Opcional) [Node.js 18+](https://nodejs.org/) — apenas se rodar o frontend fora do Docker
- Chave de API do [Google Gemini](https://aistudio.google.com/apikey)

---

## 🔑 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:

```bash
cp .env.example .env
```

| Variável | Descrição | Exemplo | Obrigatória |
|---|---|---|---|
| `GEMINI_API_KEY` | Chave da API Google Gemini | `AIzaSy...` | ✅ Sim |
| `POSTGRES_USER` | Usuário do PostgreSQL | `postgres` | ✅ Sim |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL | `sua_senha_segura` | ✅ Sim |
| `POSTGRES_DB` | Nome do banco de dados | `pocketpitch` | ✅ Sim |
| `DEBUG` | Modo debug do Django (`1` = ativo) | `1` | ⚠️ Recomendada |
| `NEXT_PUBLIC_API_URL` | URL do backend para o container do frontend | `http://localhost:8000` | ⚠️ Recomendada |

> [!WARNING]
> **Nunca commite o arquivo `.env` no repositório.** Ele já está listado no `.gitignore`. Para compartilhar a estrutura das variáveis, use o `.env.example`.

---

## 🐳 Rodando Localmente com Docker

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/PocketPitch-AI.git
cd PocketPitch-AI
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
# Edite o .env e insira sua GEMINI_API_KEY e uma senha segura para o PostgreSQL
```

### 3. Suba toda a stack com Docker Compose

```bash
docker-compose up --build
```

Esse único comando irá:
- Construir as imagens do **backend** (Python 3.12) e **frontend** (Node 18)
- Subir o **PostgreSQL 15** com volume persistente
- Aplicar as **migrations** do Django automaticamente
- Iniciar o servidor **Django** na porta `8000`
- Iniciar o servidor **Next.js** na porta `3000`

### 4. Acesse a aplicação

| Serviço | URL |
|---|---|
| **Frontend** | [http://localhost:3000](http://localhost:3000) |
| **Backend API** | [http://localhost:8000/api/](http://localhost:8000/api/) |

### 5. Crie sua conta

Ao acessar `http://localhost:3000`, você verá a tela de login. Clique em **"Crie agora"** para registrar um novo usuário, depois faça login.

### Comandos Úteis

```bash
# Subir apenas backend + banco (ideal se o frontend roda localmente)
docker-compose up backend db

# Reiniciar o backend após alterações no código Python
docker-compose restart backend

# Ver logs em tempo real
docker-compose logs -f backend

# Parar todos os serviços
docker-compose down

# Parar e remover volumes (reset total do banco)
docker-compose down -v
```

---

## 💻 Rodando o Frontend Localmente (sem Docker)

Se preferir rodar o frontend fora do Docker (para Hot Reload mais rápido):

```bash
# 1. Suba apenas o backend e o banco via Docker
docker-compose up backend db

# 2. Em outro terminal, entre na pasta do frontend
cd frontend

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

O Next.js estará disponível em `http://localhost:3000` e acessível na rede local em `http://<seu-ip>:3000`.

---

## 🔌 Endpoints da API

Base URL: `http://localhost:8000/api/`

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `POST` | `/register/` | ❌ | Criação de nova conta |
| `POST` | `/login/` | ❌ | Login (retorna JWT via cookie) |
| `POST` | `/logout/` | ✅ | Logout (limpa cookies) |
| `GET` | `/me/` | ✅ | Retorna dados do usuário logado |
| `GET` | `/conversations/` | ✅ | Lista conversas do usuário |
| `GET` | `/conversations/:id/` | ✅ | Detalhes de uma conversa + mensagens |
| `PATCH` | `/conversations/:id/` | ✅ | Renomear uma conversa |
| `DELETE` | `/conversations/:id/` | ✅ | Excluir uma conversa |
| `POST` | `/chat/` | ✅ | Envia mensagem e retorna stream SSE |

### Exemplo de Resposta SSE (`/chat/`)

```
data: {"content": "Olá! "}

data: {"content": "Aqui está "}

data: {"content": "seu pitch..."}

data: {"done": true, "conversation_id": 42}
```

---

## 🌐 Deploy em Ambiente de Teste (Online)

<!-- 
  ╔══════════════════════════════════════════════════════════════════╗
  ║  📌 PREENCHA ESTA SEÇÃO COM AS URLs APÓS REALIZAR O DEPLOY     ║
  ║                                                                  ║
  ║  Plataformas sugeridas:                                          ║
  ║  • Frontend  → Vercel ou Netlify                                 ║
  ║  • Backend   → Render, Railway ou Fly.io                         ║
  ║  • Banco     → Render PostgreSQL, Neon.tech ou Supabase          ║
  ╚══════════════════════════════════════════════════════════════════╝
-->

| Serviço | Plataforma | URL |
|---|---|---|
| 🖥️ **Frontend** | `Vercel` | <!-- INSIRA_URL_AQUI --> |
| ⚙️ **Backend** | `Render` | <!-- INSIRA_URL_AQUI --> |
| 🗄️ **Banco de Dados** | `Neon.tech` | — (uso interno, sem URL pública) |

> [!NOTE]
> As URLs acima devem ser preenchidas após a realização do deploy. Para instruções detalhadas de deploy em cada plataforma, consulte a documentação oficial:
> - [Vercel — Deploy Next.js](https://vercel.com/docs/frameworks/nextjs)
> - [Render — Deploy Django](https://docs.render.com/deploy-django)
> - [Neon.tech — PostgreSQL Serverless](https://neon.tech/docs/introduction)

---

## 👤 Autor

Desenvolvido por **Gabriel Oliveira**.

<p>
  <a href="https://github.com/gabeoliveiradev">
    <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
</p>
