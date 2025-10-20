# Faltai

Sistema web progressivo para controle e gerenciamento de faltas acadêmicas, desenvolvido com React e Firebase.

## Sobre o Projeto

Faltai é uma aplicação web que ajuda estudantes a gerenciar suas faltas em disciplinas universitárias. O sistema calcula automaticamente o limite de faltas permitidas com base na carga horária de cada matéria (25% da carga total) e fornece feedback visual em tempo real sobre a situação do aluno.

**Acesse a aplicação:** [https://victorhugoguimaraes.github.io/Faltai/](https://victorhugoguimaraes.github.io/Faltai/)

## Funcionalidades Principais

### Gerenciamento de Matérias
- Adicionar, editar e excluir matérias
- Definir carga horária e peso de faltas (1, 2 ou 4 faltas por vez)
- Cálculo automático do limite máximo de faltas (25% da carga horária)
- Visualização em lista com cards responsivos

### Controle de Faltas
- Marcar faltas através de calendário interativo
- Adicionar/remover faltas manualmente com botões rápidos
- Histórico visual de faltas por data
- Barra de progresso dinâmica com 5 níveis de cores:
  - Verde escuro (0-40%): Situação muito segura
  - Verde claro (41-60%): Situação segura
  - Amarelo (61-75%): Atenção necessária
  - Laranja (76-90%): Alerta crítico
  - Vermelho (91-100%): Limite atingido

### Calendários
- **Calendário de Faltas**: Visualização individual por matéria
- **Calendário Acadêmico**: Gerenciamento de eventos gerais (aulas, feriados, recessos)
- **Calendário de Avaliações**: Organização de provas e trabalhos
- Todos os calendários com suporte a localização em português (pt-BR)
- Navegação responsiva com ano sempre visível

### Sistema de Notificações
- Notificações de lembrete de faltas
- Alertas de presença antes do limite
- Lembretes semanais configuráveis
- Suporte a notificações push quando disponível
- Gerenciador flutuante com histórico de notificações

### Gamificação
- Sistema de pontos por ações no aplicativo
- Conquistas desbloqueáveis
- Níveis de progressão
- Estatísticas e gráficos de desempenho

### Autenticação
- Login com Firebase Authentication
- Cadastro de novos usuários
- Recuperação de senha
- Modo anônimo para testes

## Tecnologias Utilizadas

### Frontend
- **React 19.0.0**: Biblioteca principal para construção da interface
- **React Router**: Navegação entre páginas
- **Tailwind CSS 3.4.17**: Framework de estilização utilitária
- **React Icons 5.5.0**: Ícones SVG otimizados
- **React Calendar 5.1.0**: Componentes de calendário interativos
- **Chart.js 4.5.0 + React-Chartjs-2 5.3.0**: Visualização de dados e gráficos

### Backend e Serviços
- **Firebase 11.3.1**:
  - Authentication: Gerenciamento de usuários
  - Firestore: Banco de dados em tempo real
  - Hosting: Hospedagem da aplicação

### Ferramentas de Desenvolvimento
- **Create React App 5.0.1**: Configuração e build
- **PostCSS 8.5.3 + Autoprefixer 10.4.20**: Processamento de CSS
- **gh-pages 6.1.1**: Deploy automatizado no GitHub Pages

## Design e UX

### Responsividade
- Design mobile-first otimizado para dispositivos móveis
- Bottom sheets nativos em modais mobile
- Drag handles visuais para melhor experiência touch
- Breakpoints adaptados para tablets e desktops

### Acessibilidade
- Labels semânticos em formulários
- Atributos ARIA para leitores de tela
- Contraste adequado de cores (WCAG 2.1)
- Navegação por teclado funcional

### Performance
- Code splitting automático
- Lazy loading de componentes
- Bundle otimizado (187KB gzip)
- Service Worker para funcionamento offline (PWA)

## Instalação e Execução

### Pré-requisitos
- Node.js 14.x ou superior
- npm ou yarn
- Conta Firebase (para configuração do backend)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/victorhugoguimaraes/Faltai.git

# Entre no diretório
cd Faltai

# Instale as dependências
npm install
```

### Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative Authentication e Firestore Database
3. Copie as credenciais do Firebase
4. Configure o arquivo `src/firebase.js` com suas credenciais

### Executando Localmente

```bash
# Modo de desenvolvimento
npm start

# A aplicação abrirá em http://localhost:3000
```

### Build para Produção

```bash
# Gera build otimizado
npm run build

# Deploy para GitHub Pages
npm run deploy
```

## Estrutura do Projeto

```
Faltai/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── sw/
│       └── sw.js
├── src/
│   ├── components/
│   │   ├── AddMateriaModal.js
│   │   ├── AvaliacoesCalendario.js
│   │   ├── CalendarioAcademico.js
│   │   ├── CalendarModal.js
│   │   ├── Dashboard.js
│   │   ├── DeleteMateriaModal.js
│   │   ├── EditMateriaModal.js
│   │   ├── FaltaiCalendar.js
│   │   ├── GamificationSystem.js
│   │   ├── Home.js
│   │   ├── Login.js
│   │   ├── MateriaList.js
│   │   ├── NotificationManager.js
│   │   ├── ScheduledNotifications.js
│   │   └── common/
│   │       ├── LoadingSpinner.js
│   │       └── NotificationToast.js
│   ├── contexts/
│   │   ├── AuthContext.js
│   │   ├── ErrorContext.js
│   │   └── MateriasContext.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── materiaService.js
│   │   └── notificationService.js
│   ├── utils/
│   │   ├── pwaUtils.js
│   │   └── validation.js
│   ├── App.js
│   ├── firebase.js
│   ├── index.css
│   └── index.js
├── build/
├── package.json
├── tailwind.config.js
└── README.md
```

## Arquitetura

### Contextos React
- **AuthContext**: Gerencia estado de autenticação do usuário
- **MateriasContext**: Centraliza dados e operações de matérias
- **ErrorContext**: Sistema global de notificações e erros

### Serviços
- **authService**: Operações de login, registro e recuperação de senha
- **materiaService**: CRUD de matérias no Firestore
- **notificationService**: Gerenciamento de notificações e lembretes

### Componentes Reutilizáveis
- **LoadingSpinner**: Indicador de carregamento
- **NotificationToast**: Sistema de toast messages
- **Modais**: Componentes padronizados para ações do usuário

## Segurança

- Validação de dados no cliente e servidor
- Sanitização de inputs do usuário
- Regras de segurança do Firestore configuradas
- Autenticação via Firebase Authentication
- HTTPS obrigatório em produção

## Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Roadmap

- [ ] Sistema de turmas e compartilhamento de horários
- [ ] Exportação de relatórios em PDF
- [ ] Integração com Google Calendar
- [ ] App nativo mobile (React Native)
- [ ] Modo escuro (dark mode)
- [ ] Suporte a múltiplos idiomas

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Autor

**Victor Hugo Guimarães**

- GitHub: [@victorhugoguimaraes](https://github.com/victorhugoguimaraes)
- Repositório: [Faltai](https://github.com/victorhugoguimaraes/Faltai)

## Agradecimentos

- Comunidade React por ferramentas e bibliotecas incríveis
- Firebase pela infraestrutura backend simplificada
- Tailwind CSS pela produtividade no desenvolvimento de interfaces

---

**Nota**: Esta aplicação foi desenvolvida para fins educacionais e de controle pessoal. O cálculo de faltas segue a regra geral de 25% da carga horária, mas sempre verifique as normas específicas da sua instituição de ensino.
