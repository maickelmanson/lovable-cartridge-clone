# Plano: Substituir o projeto atual pelo cartuchos-web

## Contexto

O repositório `cartuchos-web` não é um projeto Lovable/TanStack Start. Ele usa uma stack própria:

- **Frontend:** Vite + React + Tailwind CSS v4 + Radix UI + Recharts
- **Backend:** Servidor Node.js/Express (`server/_core/index.ts`) com Drizzle ORM
- **Desktop:** Electron (`electron/main.js`)
- **Auth:** Manus OAuth
- **Outros:** AWS S3, upload de logo, backup de banco, geração de PDF

O projeto Lovable atual roda **TanStack Start v1** com runtime **Edge/Cloudflare Workers** e **Lovable Cloud** (banco + auth). Por isso, não é possível simplesmente copiar os arquivos e esperar que funcionem — é necessário **portar/adaptar** o código.

## Objetivo

Substituir o projeto Lovable atual por uma versão web do `cartuchos-web` que rode na stack TanStack Start + Lovable Cloud, reaproveitando o máximo possível de componentes, páginas e regras de negócio do repositório original.

## Etapas

### 1. Clonar e inspecionar o repositório
- Clonar `https://github.com/maickelmanson/cartuchos-web.git` para `/tmp/cartuchos-web`
- Mapear a estrutura de pastas (`client/`, `server/`, `electron/`, `shared/`, etc.)
- Identificar as funcionalidades principais e o fluxo de dados

### 2. Analisar o que pode ser reaproveitado
- Componentes React (tabelas, formulários, modais, cards)
- Páginas e layouts
- Hooks e utilitários puros
- Tipos TypeScript e schemas Zod
- Configuração de tema/cores (Tailwind v4 já é compatível)

### 3. Limpar o projeto Lovable atual
- Remover o placeholder `src/routes/index.tsx`
- Preservar arquivos essenciais do TanStack Start (`src/router.tsx`, `src/routes/__root.tsx`, `src/start.ts`, etc.)
- Ajustar `package.json` e `src/styles.css` conforme necessário

### 4. Criar a estrutura base no padrão TanStack Start
- Configurar rotas principais (dashboard, pedidos, clientes, cartuchos, etc.)
- Criar layout raiz com navegação
- Preparar o sistema de design com as cores e tokens do projeto original

### 5. Portar componentes e páginas
- Mover componentes React reaproveitáveis para `src/components/`
- Adaptar imports e caminhos
- Ajustar hooks que dependem de APIs do Electron/servidor Node para usarem server functions do TanStack Start

### 6. Adaptar backend para Lovable Cloud
- Mapear tabelas do Drizzle para schema do Supabase/Lovable Cloud
- Criar migrations ou usar tabelas equivalentes
- Substituir endpoints Express por `createServerFn` (server functions)
- Substituir auth Manus por auth do Lovable Cloud
- Substituir upload S3 por Storage do Lovable Cloud (se aplicável)

### 7. Configurar dependências
- Instalar pacotes necessários do repositório original que forem compatíveis com o runtime Edge
- Remover pacotes Node-only (Electron, fs extras, etc.)
- Garantir que o build não quebre

### 8. Verificar build e preview
- Rodar typecheck e build
- Corrigir erros de import e incompatibilidades
- Validar visualmente no preview

## Riscos e observações

- O projeto original tem escopo grande (dashboard, pedidos, clientes, remanufatura, PDF, backup, Electron). A portagem completa pode exigir várias iterações.
- Funcionalidades que dependem de servidor Node puro ou Electron não funcionarão diretamente e precisarão ser reescritas.
- Recomendamos aprovar este plano e, se possível, priorizar quais telas/funcionalidades são mais importantes para começar.
