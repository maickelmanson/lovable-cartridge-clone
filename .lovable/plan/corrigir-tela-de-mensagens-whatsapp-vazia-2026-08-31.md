# Corrigir: tela de Mensagens WhatsApp vazia

## Diagnóstico (confirmado)

- A tabela `whatsapp_templates` **tem os 3 modelos salvos** no banco (pedido em andamento, pedido finalizado, mensagem livre).
- A página renderiza o cabeçalho mas nenhum card porque a consulta falha: o proxy de dados `src/routes/api/db/$.ts` tem uma lista de tabelas permitidas (`ALLOWED_TABLES`) e **`whatsapp_templates` não está nela** — toda leitura retorna 403 e a lista fica vazia.

## Correção

- Adicionar `"whatsapp_templates"` ao `ALLOWED_TABLES` em `src/routes/api/db/$.ts`.

## Resultado esperado

A tela `/mensagens` passa a listar os 3 modelos com campo de texto, chips de variáveis, pré-visualização e botões Salvar/Restaurar. O botão "Notificar cliente" no pedido também volta a ler o template salvo.

## Validação

Recarregar `/mensagens` no preview e confirmar que os 3 cards aparecem e que Salvar persiste.
