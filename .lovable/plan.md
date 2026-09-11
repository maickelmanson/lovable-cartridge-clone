# Atualizar README.md com todas as funcionalidades recentes e sincronizar com o GitHub

## Objetivo

O `README.md` atual já é completo, mas ficou desatualizado em relação às últimas melhorias do sistema. Atualizar o conteúdo existente (sem reescrever do zero) para refletir tudo que foi implementado nas últimas sessões, mantendo o bloco do Lovable no topo.

## Atualizações no README.md

1. **Funcionalidades** — acrescentar/ajustar:
   - Cadastro de clientes separado por Pessoa Física (primeiro nome + sobrenome) e Pessoa Jurídica (razão social, nome fantasia, responsável).
   - **Crédito pendente do cliente**: valor em reais + observação na ficha do cliente; aviso ao criar pedido, no pedido aberto e na tela de valores da remanufatura; botão "Aplicar crédito" que abate como desconto limitado ao total do pedido e guarda o saldo restante no cliente; selo amarelo na lista de clientes.
   - Variáveis de mensagens WhatsApp: `{total}`, `{periodo}` (dia/tarde/noite conforme o horário), `{primeiro_nome}`, `{nome_fantasia}`, `{razao_social}`, além das já existentes.
   - Pedidos em aberto no topo da lista, destacados em vermelho.
   - Busca prática de modelo de cartucho no modal (campo de texto com filtro por código/descrição).
   - Dados da empresa compartilhados entre todos os usuários.
   - Usuário responsável por cartucho (campo já documentado — conferir se está completo).

2. **Banco de dados** — mencionar as novas colunas: `clientes.tipo_pessoa`, `primeiro_nome`, `sobrenome`, `razao_social`, `nome_fantasia`, `responsavel_nome`, `credito_pendente`, `credito_observacao`, e `pedido_cartuchos.usuario_id` (se ainda não constar).

3. **AGENTS.md** — atualizar a tabela de páginas e a tabela do banco com os mesmos campos novos, para que a documentação para IAs fique consistente com o README.

## Sincronização com o GitHub

- O projeto está conectado ao repositório `maickelmanson/lovable-cartridge-clone` com sincronização automática bidirecional: ao salvar as alterações, elas são enviadas ao GitHub sem comandos manuais.
- Após editar, vou confirmar que os arquivos no projeto estão corretos; o push acontece pela integração.

## Restrições

- Não alterar código-fonte, rotas, páginas, `.env` ou banco de dados.
- Manter o bloco do Lovable no topo do README.
- Nenhuma funcionalidade existente é modificada — só documentação.
