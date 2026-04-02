# Segurança do Faltai

## Visão geral

O modelo de segurança do Faltai parte de uma separação simples:

1. Frontend
   - roda no navegador
   - é público
   - não deve conter segredos do backend

2. Backend
   - roda no Render
   - pode guardar segredos e chaves privadas

## Autenticação

O Faltai usa Firebase Authentication.

Motivos:
- o projeto não precisa implementar login e senha do zero
- o app não precisa armazenar senha manualmente
- o fluxo de sessão e login social fica com um provedor maduro

Importante:
- credenciais privadas de backend nunca devem ir para o frontend
- configuração pública do app web do Firebase pode existir no frontend, o que é normal nesse modelo

## Dados do usuário

Os dados do usuário podem existir em:
- Firebase
- armazenamento local do navegador

Tipos principais:
- matérias
- faltas
- avaliações
- preferências
- horários importados

Boas práticas:
- guardar só o necessário
- evitar dados pessoais extras
- revisar regras do Firebase quando o modelo de dados mudar

## Segurança da API da UnB

A API da UnB expõe:
- busca pública de departamentos e turmas
- endpoints de push
- endpoints de snapshot

Proteções principais:
- CORS controlado por `CORS_ORIGINS`
- refresh manual protegido por `UNB_SNAPSHOT_ADMIN_KEY`
- chaves privadas de push só no backend

## Segurança dos snapshots

Os snapshots contêm dados acadêmicos públicos do semestre, não dados privados de usuários.

Mesmo assim:
- devem ficar fora do Git
- devem ser tratados como artefatos do servidor
- devem ser servidos pela API, não por acesso direto a arquivos

Local esperado:
- `api/data/snapshots`

## Segurança das notificações push

Pode ser pública:
- `VAPID_PUBLIC_KEY`

Deve permanecer privada:
- `VAPID_PRIVATE_KEY`
- `UNB_SNAPSHOT_ADMIN_KEY`
- quaisquer credenciais administrativas futuras

Subscriptions de push não são senha, mas também não devem ser expostas desnecessariamente.

## Variáveis seguras no frontend

Essas podem existir no build do frontend:
- `VITE_FIREBASE_*`
- `VITE_API_URL`
- `VITE_UNB_API_URL`

## Variáveis que devem ficar só no backend

- `UNB_SNAPSHOT_ADMIN_KEY`
- `VAPID_PRIVATE_KEY`
- credenciais de banco futuras
- credenciais administrativas futuras do Firebase, se existirem

## Recomendações operacionais

- usar HTTPS em produção
- manter `CORS_ORIGINS` alinhado com o domínio do GitHub Pages
- proteger o refresh manual com chave
- rotacionar segredos se houver vazamento
- evitar logs com tokens, subscriptions ou payloads sensíveis
- revisar permissões do Firebase periodicamente

## Em caso de incidente

Se algum segredo for exposto:
1. revogue ou troque o segredo
2. restrinja o serviço afetado
3. publique o ajuste
4. revise logs e uso recente

Se for encontrado um problema de segurança no projeto:
- reporte de forma privada primeiro
- descreva impacto, reprodução e possível correção
