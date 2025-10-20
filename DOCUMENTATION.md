# 📚 Documentação do Projeto Faltaí

## 📋 Visão Geral
Sistema web para gerenciamento de faltas acadêmicas com suporte offline/online, notificações e gamificação.

---

## 🏗️ Estrutura de Arquivos

### 📁 `/src`

#### **Arquivos Principais**
- **`App.js`** - Componente principal da aplicação
  - Gerencia rotas e estados globais
  - Controla modais e navegação
  - Integra todos os componentes principais

- **`index.js`** - Ponto de entrada da aplicação
  - Inicializa React
  - Configura providers (Auth, Materias, Error)
  - Registra Service Worker para PWA

- **`firebase.js`** - Configuração do Firebase
  - Inicializa Auth e Firestore
  - Suporta modo demo/local
  - Exporta instâncias para toda aplicação

---

### 📁 `/src/components`

#### **Componentes de Modal**
- **`AddMateriaModal.js`** - Modal para adicionar nova matéria
- **`EditMateriaModal.js`** - Modal para editar matéria existente
- **`DeleteMateriaModal.js`** - Modal de confirmação de exclusão
- **`LogoutConfirmationModal.js`** - Confirma logout do usuário
- **`LoginModal.js`** - Modal de login (email/Google)
- **`RegisterModal.js`** - Modal de registro de novo usuário
- **`ResetPasswordModal.js`** - Modal para recuperação de senha
- **`AnonymousModal.js`** - Modal para usuários não autenticados
- **`CalendarModal.js`** - Modal com calendário de faltas

#### **Componentes de Visualização**
- **`Home.js`** - Página inicial com cards de matérias
- **`MateriaList.js`** - Lista de matérias com controles de faltas
  - Exibe progresso de faltas
  - Botões para adicionar/remover faltas
  - Ações de editar/deletar matéria
  
- **`Dashboard.js`** - Painel com estatísticas e gráficos
  - Gráficos de pizza e barras
  - Estatísticas gerais
  - Análise de faltas por matéria

- **`Login.js`** - Página de login completa
- **`FaltaiCalendar.js`** - Calendário visual de faltas
- **`AvaliacoesCalendario.js`** - Calendário de avaliações
- **`CalendarioAcademico.js`** - Calendário acadêmico geral

#### **Componentes de Sistema**
- **`NotificationManager.js`** - Gerenciador de notificações
  - Exibe notificações in-app
  - Gerencia permissões de notificação
  - Configurações de tipos de notificação
  
- **`ScheduledNotifications.js`** - Lista de notificações agendadas
- **`GamificationSystem.js`** - Sistema de conquistas e gamificação

#### **Componentes Comuns** (`/common`)
- **`LoadingSpinner.js`** - Indicador de carregamento
- **`NotificationToast.js`** - Toast de notificações temporárias

---

### 📁 `/src/contexts`

#### **AuthContext.js**
Gerencia autenticação e estado do usuário
```javascript
// Funções principais:
- login(email, senha)           // Login com email/senha
- loginGoogle()                  // Login com Google
- register(nome, email, senha)  // Registro de novo usuário
- logout()                       // Desconecta usuário
- toggleMode()                   // Alterna online/offline

// Estados:
- user                           // Dados do usuário atual
- loading                        // Estado de carregamento
- isOnline                       // Modo online (Firebase) ou offline (localStorage)
```

#### **MateriasContext.js**
Gerencia estado e operações com matérias
```javascript
// Funções principais:
- adicionarMateria(nome, horas, pesoFalta)  // Adiciona nova matéria
- editarMateria(index, dados)               // Edita matéria existente
- deletarMateria(index)                     // Remove matéria
- atualizarFaltas(index, faltas, datas)     // Atualiza contador de faltas
- adicionarFalta(index)                     // Adiciona uma falta
- removerFalta(index)                       // Remove uma falta

// Estados:
- materias                                   // Array de todas as matérias
```

#### **ErrorContext.js**
Gerencia mensagens de erro e sucesso
```javascript
// Funções principais:
- addError(message)                         // Adiciona mensagem de erro
- addSuccess(message)                       // Adiciona mensagem de sucesso
- addWarning(message)                       // Adiciona mensagem de aviso
- clearErrors()                             // Limpa todas as mensagens

// Estados:
- errors                                    // Array de mensagens
```

---

### 📁 `/src/services`

#### **authService.js**
Serviço de autenticação Firebase
```javascript
// Funções exportadas:
- loginWithEmail(email, senha)              // Login com credenciais
- registerUser(nome, email, senha)          // Registro de usuário
- loginWithGoogle()                         // Login com Google (redirect mobile/popup desktop)
- handleGoogleRedirect()                    // Processa redirect do Google
- resetPassword(email)                      // Envia email de recuperação
- logout()                                  // Faz logout
```

#### **materiaService.js**
Serviço CRUD de matérias
```javascript
// Funções exportadas:
- addMateria(nome, horas, peso, materias, isOnline)    // Adiciona matéria
- editMateria(index, nome, horas, peso, materias, isOnline)  // Edita matéria
- deleteMateria(index, materias, isOnline)             // Remove matéria
- addFalta(index, materias, isOnline)                  // Adiciona falta
- removeFalta(index, materias, isOnline)               // Remove falta

// Cálculo automático: maxFaltas = Math.floor(horas * 0.25 / pesoFalta)
```

#### **notificationService.js**
Serviço de notificações push
```javascript
// Funções principais:
- requestPermission()                       // Solicita permissão de notificação
- init()                                    // Inicializa service worker
- scheduleNotification(data)                // Agenda notificação
- sendPushNotification(title, body, data)   // Envia notificação push
```

---

### 📁 `/src/utils`

#### **validation.js**
Funções de validação de dados
```javascript
// Validações de campos:
- validateEmail(email)                      // Valida formato de email
- validatePassword(password)                // Valida requisitos de senha
- validateMateria(materia)                  // Valida dados de matéria
- validateAvaliacao(avaliacao)              // Valida dados de avaliação
- validateFalta(falta)                      // Valida dados de falta
- validateUser(userData)                    // Valida dados de usuário

// Validações genéricas:
- validateRequired(value, fieldName)        // Valida campo obrigatório
- validateLength(value, min, max, name)     // Valida tamanho de string
- validateRange(value, min, max, name)      // Valida intervalo numérico

// Sanitização:
- sanitizeMateria(materia)                  // Limpa e normaliza dados
```

#### **pwaUtils.js**
Utilitários para Progressive Web App
```javascript
// Funções principais:
- registerServiceWorker()                   // Registra service worker
- checkForUpdates()                         // Verifica atualizações
- cacheResources()                          // Armazena recursos em cache
- isOnline()                                // Verifica conectividade
```

---

## 🔄 Fluxo de Dados

### Login/Autenticação
```
1. Usuário → LoginModal/RegisterModal
2. authService → Firebase Auth
3. AuthContext → Atualiza estado global
4. App.js → Renderiza conteúdo autenticado
```

### Gerenciamento de Matérias
```
1. Usuário → AddMateriaModal/EditMateriaModal
2. Validação → validation.js
3. materiaService → Firebase Firestore (se online) ou localStorage
4. MateriasContext → Atualiza estado
5. MateriaList → Re-renderiza com novos dados
```

### Notificações
```
1. NotificationManager → Verifica eventos
2. notificationService → Agenda notificações
3. Service Worker → Exibe notificação em background
4. Usuário clica → App abre/foca
```

---

## 💾 Armazenamento

### **LocalStorage**
- `materias` - Array de matérias (modo offline)
- `isOnline` - Flag de modo online/offline
- `app_notifications` - Notificações da aplicação
- `notification_settings` - Configurações de notificação

### **Firebase Firestore**
```
/usuarios/{uid}/
  ├── nome: string
  ├── email: string
  └── materias: [
      {
        nome: string,
        horas: number,
        faltas: number,
        maxFaltas: number,
        pesoFalta: number,
        datasFaltas: string[],
        avaliacoes: object[]
      }
    ]
```

---

## 🎨 Padrões de Código

### Estrutura de Componente React
```javascript
import React, { useState, useEffect } from 'react';

/**
 * Descrição do componente
 * @param {Object} props - Props do componente
 */
function ComponentName({ prop1, prop2 }) {
  // Estados
  const [state, setState] = useState(initialValue);
  
  // Effects
  useEffect(() => {
    // Efeito
  }, [dependências]);
  
  // Handlers
  const handleAction = () => {
    // Lógica
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}

export default ComponentName;
```

### Estrutura de Serviço
```javascript
/**
 * @fileoverview Descrição do serviço
 */

/**
 * Descrição da função
 * @param {type} param - Descrição
 * @returns {type} Descrição do retorno
 */
export const functionName = async (param) => {
  try {
    // Lógica
    return { success: true, data };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
```

---

## 🚀 Scripts Disponíveis

```bash
npm start          # Inicia servidor de desenvolvimento
npm run build      # Cria build de produção
npm test           # Executa testes
npm run lint       # Verifica código
```

---

## 🔐 Variáveis de Ambiente

Criar arquivo `.env` na raiz:
```env
REACT_APP_FIREBASE_API_KEY=sua_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=seu_dominio.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=seu_projeto_id
REACT_APP_FIREBASE_STORAGE_BUCKET=seu_bucket.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
REACT_APP_FIREBASE_APP_ID=seu_app_id
```

---

## 📱 Features Implementadas

- ✅ Autenticação (Email/Senha + Google)
- ✅ CRUD de Matérias
- ✅ Controle de Faltas
- ✅ Modo Offline/Online
- ✅ Notificações Push
- ✅ Calendário de Faltas
- ✅ Dashboard com Estatísticas
- ✅ Sistema de Gamificação
- ✅ Responsividade Mobile
- ✅ PWA (Progressive Web App)

---

## 🐛 Debugging

### Modo de Desenvolvimento
```javascript
// Ver estado atual no console
console.log('Materias:', materias);
console.log('User:', user);
console.log('Online:', isOnline);
```

### Verificar Firebase
```javascript
// No console do navegador
console.log(firebase.auth().currentUser);
```

---

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- Código fonte: Comentários inline em cada arquivo
- Firebase Docs: https://firebase.google.com/docs
- React Docs: https://react.dev

---

**Última atualização:** Outubro 2025
