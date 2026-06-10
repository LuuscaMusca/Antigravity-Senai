# LifePlanner - Gerenciador Pessoal de Tarefas e Vida

O **LifePlanner** é um gerenciador pessoal moderno, responsivo e elegante para organizar tarefas, hábitos e notas rápidas com suporte a modo claro e escuro.

## 🚀 Funcionalidades

- **Autenticação Segura:** Cadastro e login de usuários com hash de senha (`bcryptjs`) e tokens JWT.
- **Painel de Controle (Dashboard):**
  - **Métricas:** Total de tarefas, tarefas concluídas hoje e tarefas atrasadas.
  - **Gráfico de Produtividade:** Gráfico semanal interativo renderizado dinamicamente com SVG.
  - **Rastreador de Hábitos:** Marque seus hábitos diários e acompanhe o progresso.
  - **Notas Rápidas (Brain Dump):** Bloco de notas com salvamento automático para rascunhos.
- **Gerenciamento de Tarefas:**
  - Criação de tarefas com título, descrição, prioridade (Urgente, Média, Baixa), categoria (Trabalho, Casa, Estudos, Saúde, Financeiro) e data limite.
  - Filtros por categoria, prioridade, status e busca textual.
  - Indicação visual automática de tarefas atrasadas.
- **Interface Premium:** Design baseado em variáveis de cores HSL, glassmorphism, sombras suaves e micro-transições (sem frameworks CSS).
- **Tema Claro / Escuro:** Alternância dinâmica de tema com persistência local.
- **Responsivo:** Layout otimizado tanto para desktops quanto para dispositivos móveis.

---

## 🛠️ Stack Tecnológica

- **Frontend:** React (Vite), Lucide Icons, CSS Vanilla Moderno.
- **Backend:** Node.js, Express, SQLite3 (banco relacional local).
- **Autenticação:** JSON Web Tokens (JWT), Bcrypt.js.

---

## 💻 Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js instalado (v16 ou superior)
- Git instalado (para versionamento)

### 1. Clonar o repositório
```bash
git clone https://github.com/SEU-USUARIO/Antigravity-Senai.git
cd Antigravity-Senai
```

### 2. Configurar o Backend
Abra o diretório do backend, instale as dependências e inicie o servidor:
```bash
cd backend
npm install
npm start
```
O servidor backend estará disponível em `http://localhost:5000`.

### 3. Configurar o Frontend
Abra o diretório do frontend em outro terminal, instale as dependências e inicie o servidor de desenvolvimento:
```bash
cd frontend
npm install
npm run dev
```
A aplicação estará disponível em `http://localhost:5173`.
