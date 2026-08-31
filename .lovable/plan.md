# Usuários: garantir e evidenciar a gravação no banco

## O que foi verificado agora

- A tabela `users` hoje tem 2 registros: `admin@epsolucoes.com` (Maickel, admin) e `rangel@epsolucoes.com` (gerente, criado em 29/08).
- Existe um registro de auditoria de **hoje 31/08 11:59** com a ação `usuario.alterar` para `admin@epsolucoes.com`. Esse log só é gravado depois que a API responde com sucesso, ou seja: **a edição (incluindo a troca de senha) chegou ao banco e foi aplicada**.
- Não existe nenhum registro `usuario.criar` de hoje e nenhuma linha nova em `users`: **a criação do novo usuário não chegou a ser gravada** — a requisição falhou (validação/erro) ou o formulário não foi salvo.
- As rotas `/api/auth/users` (POST) e `/api/auth/users/:id` (PUT) existem e respondem no site publicado (401 sem token, como esperado).

Conclusão: a troca de senha funcionou, mas a tela não dá nenhuma evidência disso (a lista mostra apenas "Último login", que não muda ao editar), então parece que nada foi salvo. E a criação de usuário falhou sem deixar rastro claro para o usuário.

## O que será feito

### 1. Evidência de gravação na tela de Usuários
- Adicionar coluna `updated_at` na tabela `users`, com gatilho de atualização automática.
- Mostrar "Atualizado em" na tabela de usuários, ao lado de "Último login".
- Após salvar, recarregar a lista e exibir na mensagem de sucesso o que foi alterado (inclusive "senha redefinida").

### 2. Erros deixam de ser silenciosos
- Exibir a mensagem de erro **dentro do diálogo** (além do toast) e manter o diálogo aberto com os dados preenchidos, para o admin corrigir.
- Validar no próprio formulário antes de enviar: nome e e-mail obrigatórios, e-mail válido, senha com no mínimo 6 caracteres na criação. Mostrar a dica "mínimo de 6 caracteres" no campo de senha.
- Tratar explicitamente o caso "já existe um usuário com esse e-mail".

### 3. Auditoria mais completa
- Registrar `usuario.senha_alterada` quando a senha for trocada (sem gravar a senha).
- Registrar tentativas que falharam (`usuario.criar_falha` / `usuario.alterar_falha`) com o motivo, para diagnóstico futuro.

### 4. Segurança da troca de senha
- Ao alterar a senha de um usuário, invalidar os tokens antigos dele (o token emitido antes da troca deixa de valer), forçando novo login com a senha nova.

## Detalhes técnicos

- Migração: `ALTER TABLE public.users ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now()` + gatilho `tg_set_updated_at`; e uma coluna `password_changed_at` usada pela validação do JWT (`authenticateRequest` rejeita token emitido antes dessa data).
- `src/routes/api/auth/users.ts` e `users.$id.ts`: retornar `updated_at` em `publicUser`, setar `password_changed_at` quando `patch.password` existir.
- `src/auth.server.ts`: comparar `iat` do token com `password_changed_at`.
- `src/pages/Usuarios.tsx`: estado de erro no diálogo, validação prévia, nova coluna na tabela, mensagens de sucesso descritivas.
- Nenhuma mudança visual fora da página de Usuários.
