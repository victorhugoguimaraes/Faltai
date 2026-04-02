# Faltai

Faltai é uma aplicação web progressiva voltada para estudantes que precisam acompanhar faltas, matérias, grade semanal, avaliações e marcos do semestre com rapidez, principalmente no celular.

A proposta do projeto é juntar em um só lugar:
- controle de faltas por matéria
- visualização da grade semanal
- calendário acadêmico e calendário de avaliações
- painel com leitura do semestre
- lembretes e notificações
- importação de turmas da UnB

Aplicação publicada:
[https://victorhugoguimaraes.github.io/Faltai/](https://victorhugoguimaraes.github.io/Faltai/)

## Tecnologias utilizadas

### Linguagens

- JavaScript
- HTML
- CSS

### Frontend

- React 19
- Vite 6
- React DOM
- React Icons
- React Calendar
- Chart.js
- React Chartjs 2

### Backend e serviços

- Node.js
- Express
- CORS
- Cheerio para parsing do HTML do SIGAA
- Web Push para notificações
- Firebase Authentication
- Firebase Firestore
- Firebase Analytics

### Infra e deploy

- GitHub Pages para o frontend
- Render para a API da UnB
- GitHub Actions para automação de build e publicação

### Testes e qualidade

- Vitest
- Testing Library

## Técnicas e decisões usadas no projeto

- arquitetura mobile-first
- PWA com manifest, service worker e suporte a instalação
- separação entre frontend e API própria
- autenticação terceirizada com Firebase para não armazenar senha manualmente
- persistência local para modo offline e fallback
- integração com SIGAA via API intermediária
- uso de snapshot por semestre para reduzir latência e evitar scraping ao vivo em toda busca
- atualização semanal do snapshot com opção de refresh manual
- carregamento sob demanda das turmas ao abrir uma disciplina

## Estrutura geral

- `src/`
  - interface, estado do app, componentes e features
- `api/`
  - API da UnB, snapshots e endpoints de push
- `public/`
  - ícones, manifest e arquivos públicos do PWA
- `docs/`
  - documentação técnica e documentação de segurança

## Documentações

- [Documentação técnica](/Users/victo/Faltai/docs/DOCUMENTATION.md)
- [Segurança](/Users/victo/Faltai/docs/SECURITY.md)
