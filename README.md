# Faltai

Aplicacao web progressiva para controle de faltas academicas, com foco em uso mobile, notificacoes e acompanhamento rapido da situacao de cada materia.

**Acesse a aplicacao:** [https://victorhugoguimaraes.github.io/Faltai/](https://victorhugoguimaraes.github.io/Faltai/)

## O que mudou nesta versao

- Shell mobile-first com header compacto, atalhos mais fortes e navegacao inferior fixa
- Estrutura de projeto reorganizada para ficar mais clara no GitHub
- Migracao de Create React App para Vite + Vitest
- Fluxos de auth e notificacoes mais robustos
- Ambiente atualizado para reduzir vulnerabilidades e melhorar manutencao

## Funcionalidades

- Cadastro, edicao e exclusao de materias
- Controle de faltas com calculo automatico do limite permitido
- Calendario de faltas por materia
- Calendario academico e calendario de avaliacoes
- Dashboard com graficos, tendencias e materias em risco
- Notificacoes locais e lembretes configuraveis
- Login com Firebase Authentication e modo local quando Firebase nao estiver configurado
- PWA com suporte offline basico

## Stack

### Frontend

- React 19
- Vite 6
- Tailwind CSS 3
- React Icons
- React Calendar
- Chart.js + React Chartjs 2

### Backend e servicos

- Firebase Authentication
- Firestore
- Firebase Analytics quando suportado pelo navegador
- API Node para consulta publica de turmas da UnB via SIGAA

### Qualidade

- Vitest
- Testing Library
- GitHub Actions para teste, build e deploy no GitHub Pages

## Design e experiencia mobile

O app foi reorganizado para parecer mais um produto instalado do que uma pagina tradicional:

- header mais compacto
- hero inicial com resumo rapido
- navegacao inferior fixa para uso com o polegar
- FAB para adicionar materia
- cards de acao com atalhos para agenda e insights
- central de avisos mais acessivel

## Estrutura do projeto

```text
Faltai/
├── docs/
│   ├── DOCUMENTATION.md
│   └── SECURITY.md
├── public/
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── manifest.json
│   └── sw/
│       └── sw.js
├── src/
│   ├── app/
│   │   ├── App.jsx
│   │   └── providers.jsx
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   └── *.jsx
│   ├── contexts/
│   ├── features/
│   │   ├── calendar/
│   │   ├── dashboard/
│   │   └── home/
│   ├── lib/
│   │   └── env.js
│   ├── services/
│   ├── styles/
│   │   └── tokens.css
│   ├── utils/
│   ├── App.js
│   ├── firebase.js
│   ├── index.css
│   ├── main.jsx
│   └── setupTests.js
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

## Como rodar

### Requisitos

- Node.js 18 ou superior
- npm
- Projeto Firebase, se quiser usar auth e persistencia online

### Instalacao

```bash
git clone https://github.com/victorhugoguimaraes/Faltai.git
cd Faltai
npm install
```

### Configuracao do Firebase

1. Crie um projeto no Firebase Console.
2. Ative Authentication e Firestore.
3. Copie as credenciais do app web.
4. Crie o arquivo `.env.local` a partir de `.env.example`.
5. Preencha as variaveis `VITE_FIREBASE_*`.

Exemplo:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_FIREBASE_DATABASE_URL=...
```

Sem essas variaveis, o projeto continua funcional em modo local para desenvolvimento basico.

### Desenvolvimento

```bash
npm run dev:api
npm run dev
```

O front abre normalmente em `http://localhost:5173` ou `http://localhost:5174`, e a API da UnB fica em `http://localhost:8787`.

### Testes

```bash
npm run test:ci
```

### Build

```bash
npm run build
```

O output final fica em `dist/`.

### Deploy do front

O front do Faltai fica no GitHub Pages. O workflow `.github/workflows/ci-pages.yml` já publica o `dist/` automaticamente.

Para a busca de turmas da UnB funcionar em produção, configure no repositório do GitHub a variável:

```text
Settings > Secrets and variables > Actions > Variables
VITE_UNB_API_URL=https://sua-api-em-producao.onrender.com
```

### Deploy da API da UnB

A API não pode ficar no GitHub Pages, porque ela faz scraping do SIGAA no servidor. O projeto já vem pronto para subir no Render usando [render.yaml](/home/victor/Faltai/render.yaml).

Variáveis recomendadas no serviço da API:

```bash
CORS_ORIGINS=https://victorhugoguimaraes.github.io,http://localhost:5173,http://localhost:5174
PORT=10000
```

Depois do deploy da API, copie a URL pública e use em `VITE_UNB_API_URL` no workflow do GitHub Pages.

### Deploy manual

Se quiser publicar só o front manualmente:

```bash
npm run deploy
```

Mas a busca da UnB em produção só funciona com a API publicada separadamente.

## Qualidade e manutencao

- Testes para validacao, assets e persistencia local
- Separacao melhor entre shell do app, layout e telas de feature
- Variaveis de ambiente centralizadas
- Build com code splitting e chunks dedicados para dependencias pesadas
- Auditoria de dependencias sem vulnerabilidades na ultima validacao local

## Proximos passos recomendados

- Continuar quebrando componentes grandes como `Dashboard` e `NotificationManager`
- Expandir testes para fluxos de auth e materias
- Refinar ainda mais o fluxo de agenda mobile com bottom sheets e gestos
- Avaliar extracao de mais regras de negocio para `features/` e `lib/`

## Documentacao adicional

- [Documentacao tecnica](./docs/DOCUMENTATION.md)
- [Seguranca](./docs/SECURITY.md)
