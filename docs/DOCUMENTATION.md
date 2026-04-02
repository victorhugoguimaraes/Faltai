# Documentação Técnica do Faltai

## Visão geral

O Faltai é dividido em duas partes principais:

1. Frontend PWA
   - responsável por interface, autenticação, estado local, lembretes e experiência do usuário
   - publicado no GitHub Pages

2. API da UnB
   - responsável pela consulta de departamentos e turmas
   - publicada separadamente no Render
   - trabalha com snapshots semestrais para acelerar buscas

Essa separação existe porque o GitHub Pages não executa backend nem scraping server-side.

## Arquitetura do frontend

Entradas principais:
- [main.jsx](/Users/victo/Faltai/src/main.jsx)
- [App.jsx](/Users/victo/Faltai/src/app/App.jsx)
- [providers.jsx](/Users/victo/Faltai/src/app/providers.jsx)

Organização:
- `src/app`
  - shell do app, providers e estrutura principal
- `src/components`
  - modais, layout e componentes reutilizáveis
- `src/contexts`
  - autenticação, erros e matérias
- `src/features`
  - lógica separada por domínio
- `src/services`
  - integrações externas
- `src/utils`
  - validação, storage, PWA e helpers
- `src/lib`
  - resolução de ambiente e helpers globais

Features principais:
- `features/auth`
- `features/calendar`
- `features/dashboard`
- `features/home`
- `features/materias`
- `features/notifications`
- `features/schedule`

## Estado principal do app

Os dados mais importantes do Faltai giram em torno de:
- matérias
- faltas
- avaliações
- horários importados
- configurações de lembrete

Módulos importantes:
- [materiasState.js](/Users/victo/Faltai/src/features/materias/lib/materiasState.js)
- [turmasStorage.js](/Users/victo/Faltai/src/features/schedule/lib/turmasStorage.js)
- [notificationState.js](/Users/victo/Faltai/src/features/notifications/lib/notificationState.js)
- [dashboardMetrics.js](/Users/victo/Faltai/src/features/dashboard/lib/dashboardMetrics.js)

## Arquitetura da API da UnB

Arquivos principais:
- [server.js](/Users/victo/Faltai/api/server.js)
- [sigaa.js](/Users/victo/Faltai/api/unb/sigaa.js)
- [snapshotStore.js](/Users/victo/Faltai/api/unb/snapshotStore.js)
- [pushStore.js](/Users/victo/Faltai/api/pushStore.js)

## O que é um snapshot

Um snapshot é uma foto pronta dos dados de um semestre.

Exemplo:
- `snapshot-2026-1.json`

Esse arquivo armazena:
- semestre
- departamentos
- disciplinas por departamento
- turmas de cada disciplina
- metadados de atualização
- estatísticas resumidas

Em vez de a API consultar o SIGAA a cada busca do usuário, ela consulta esse arquivo já preparado.

## Por que usar snapshot

O snapshot foi adotado para resolver:
- lentidão da primeira busca
- dependência do SIGAA em tempo real
- variação de performance por rede, cold start e parsing HTML

Com snapshot:
- o custo pesado acontece antes ou em background
- a busca do usuário fica mais rápida
- a resposta da API fica mais previsível

## Ciclo de vida do snapshot

1. A API define o semestre ativo
   - `UNB_SNAPSHOT_YEAR`
   - `UNB_SNAPSHOT_PERIOD`

2. A API gera o snapshot
   - carrega a lista de departamentos
   - consulta cada departamento no SIGAA
   - consolida tudo em um único arquivo por semestre

3. A API prepara o snapshot em memória
   - normaliza campos de busca
   - ordena disciplinas e turmas
   - calcula estatísticas uma vez

4. A API atende as buscas a partir desse snapshot

5. Quando o snapshot envelhece, ele é atualizado

## Atualização automática e manual

Atualização automática:
- a API verifica no boot se o snapshot está ausente ou vencido
- depois verifica periodicamente
- se tiver mais de 7 dias, faz refresh em background

Atualização manual:
- `POST /api/unb/snapshot/refresh?year=2026&period=1`
- pode ser protegida por `UNB_SNAPSHOT_ADMIN_KEY`

Status do snapshot:
- `GET /api/unb/snapshot/status?year=2026&period=1`

## Fluxo de busca da UnB

### Departamentos

Endpoint:
- `GET /api/unb/departamentos`

Fluxo:
1. tenta responder pelo snapshot
2. se o snapshot existir, usa ele
3. se estiver vencido, agenda refresh em background
4. se não existir snapshot, cai no fluxo antigo com SIGAA

### Disciplinas por departamento

Endpoint:
- `GET /api/unb/turmas`

Hoje esse endpoint devolve uma lista mais leve por disciplina, com:
- código
- nome
- quantidade de turmas

Isso reduz o peso da primeira tela quando o usuário abre um departamento inteiro.

### Detalhe de uma disciplina

Endpoint:
- `GET /api/unb/disciplina`

Esse endpoint devolve as turmas completas de uma disciplina específica.

Isso permite:
- carregar a vitrine de disciplinas primeiro
- carregar as turmas só quando o usuário pedir

## Decisões de performance

As principais otimizações hoje são:
- snapshot por semestre, em vez de scraping a cada request
- normalização de busca feita uma vez
- estatísticas pré-calculadas
- arrays ordenados uma vez
- escrita assíncrona do snapshot
- carregamento sob demanda do detalhe das disciplinas

Isso reduz custo com:
- loops repetidos
- normalização de string toda hora
- renderização excessiva no frontend
- payloads grandes desnecessários

## Push e lembretes

Arquivos principais:
- [notificationService.js](/Users/victo/Faltai/src/services/notificationService.js)
- [pushNotifications.js](/Users/victo/Faltai/src/features/notifications/lib/pushNotifications.js)
- [pushStore.js](/Users/victo/Faltai/api/pushStore.js)

Endpoints:
- `GET /api/push/public-key`
- `POST /api/push/subscribe`
- `POST /api/push/settings`
- `POST /api/push/unsubscribe`
- `POST /api/push/test`

Fluxo:
- o frontend salva preferências de lembrete
- a API guarda subscriptions
- a API usa Web Push para disparar os lembretes

## Variáveis de ambiente principais

Frontend:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_API_URL=
VITE_UNB_API_URL=
```

Backend:

```bash
UNB_API_PORT=8787
UNB_API_HOST=0.0.0.0
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,https://victorhugoguimaraes.github.io
UNB_SNAPSHOT_YEAR=2026
UNB_SNAPSHOT_PERIOD=1
UNB_SNAPSHOT_CONCURRENCY=3
UNB_SNAPSHOT_ADMIN_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:voce@exemplo.com
```

## Comandos úteis

Instalar dependências:

```bash
npm install
```

Rodar frontend:

```bash
npm run dev
```

Rodar API:

```bash
npm run dev:api
```

Rodar testes:

```bash
npm run test:ci
```

Gerar build:

```bash
npm run build
```

## Deploy

Frontend:
- GitHub Pages
- workflow usando `VITE_API_URL` ou `VITE_UNB_API_URL`

API:
- Render
- serviço definido em [render.yaml](/Users/victo/Faltai/render.yaml)
- precisa das envs de snapshot, CORS e push

## Observações finais

O Faltai hoje combina:
- frontend rápido e mobile-first
- autenticação com Firebase
- API própria para integrar SIGAA
- estratégia de snapshot para manter a busca da UnB rápida e estável
