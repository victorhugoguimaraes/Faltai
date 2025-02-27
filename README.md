# Faltaí

![Faltaí Logo](public/apple-touch-icon.png)

Bem-vindo ao **Faltaí**, um aplicativo web simples e prático para controlar suas faltas da faculdade. Com ele, você pode gerenciar suas matérias, registrar faltas e visualizar tudo em um calendário interativo, seja no modo online (com Firebase) ou anônimo (salvo localmente).

## Sobre o Projeto

O **Faltaí** foi desenvolvido para ajudar estudantes a acompanhar suas faltas de forma intuitiva. Ele suporta:

- **Registro de matérias**: Adicione matérias com carga horária e peso de faltas.
- **Controle de faltas**: Adicione ou remova faltas manualmente ou via calendário.
- **Modo Online**: Sincronize seus dados com o Firebase para acessar de qualquer dispositivo.
- **Modo Anônimo**: Salve localmente no `localStorage` sem precisar de login.
- **Redefinição de Senha**: Recupere sua conta com um link enviado por email.

O projeto é hospedado no GitHub Pages e usa React com Firebase para autenticação e armazenamento.

## Funcionalidades

- **Login e Registro**: Entre com email/senha, Google ou use o modo anônimo.
- **Gerenciamento de Matérias**: Adicione, edite ou exclua matérias com facilidade.
- **Calendário Interativo**: Veja e edite suas faltas diretamente em um calendário.
- **Persistência de Dados**: Online (Firebase) ou offline (localStorage).
- **Ícone Otimizado**: Adicione à tela inicial do iPhone/Android com um ícone personalizado.

## Como Usar

1. **Acesse o Site**:
   - Visite [https://victorhugoguimaraes.github.io/Faltaai/](https://victorhugoguimaraes.github.io/Faltaai/).

2. **Faça Login ou Use Anônimo**:
   - Escolha "Login" (email/Google), "Registre-se" ou "Conectar como Anônimo".
   - Se esquecer a senha, clique em "Esqueci a senha" para receber um link de redefinição.

3. **Gerencie suas Matérias**:
   - Clique em "Adicionar Matéria" e preencha os dados.
   - Use os botões `+` e `-` ou o ícone de calendário para registrar faltas.

4. **Logout**:
   - Clique no "X" vermelho no canto superior direito para sair.

## Instalação Local

Quer rodar o Faltaí localmente? Siga os passos abaixo:

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 14 ou superior)
- [Git](https://git-scm.com/)
- Conta no [Firebase](https://firebase.google.com/) (para modo online)
