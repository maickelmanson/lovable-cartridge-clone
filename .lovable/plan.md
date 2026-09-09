# Cadastro de clientes por tipo de pessoa + novas variáveis de WhatsApp

## O que muda para você

### Cadastro de clientes
No formulário de cliente passa a existir a escolha **Pessoa Física (CPF)** ou **Pessoa Jurídica (CNPJ)**, e os campos mudam conforme a escolha:

- **Pessoa Física (CPF):** Primeiro Nome, Sobrenome, CPF.
- **Pessoa Jurídica (CNPJ):** Razão Social, Nome Fantasia, Nome do Responsável (primeiro nome), CNPJ, Inscrição Estadual.

Os demais campos (telefones, endereço, perfil comercial, observações) continuam iguais para os dois tipos.

Para os clientes que já existem: o nome atual é copiado para o campo **Primeiro Nome** e o tipo é definido automaticamente (CNPJ preenchido → Pessoa Jurídica, caso contrário Pessoa Física). Nada se perde e você ajusta manualmente depois.

Nas listagens, pedidos, impressões e buscas o cliente continua aparecendo com um nome único, montado automaticamente: Primeiro Nome + Sobrenome para pessoa física, e Nome Fantasia (ou Razão Social, quando não houver fantasia) para pessoa jurídica.

### Mensagens do WhatsApp
Três novos botões de variável na tela de Mensagens: `{primeiro_nome}`, `{nome_fantasia}` e `{razao_social}`, ao lado dos já existentes. Na hora do envio são preenchidos com os dados do cliente do pedido; se o cliente não tiver aquele dado, a variável sai em branco.

## Detalhes técnicos

**Banco (migração):** em `public.clientes`, adicionar `tipo_pessoa` (texto, `FISICA`/`JURIDICA`, padrão `FISICA`), `primeiro_nome`, `sobrenome`, `razao_social`, `nome_fantasia`, `responsavel_nome` (todos texto, nulos). Backfill: `primeiro_nome = nome` para todos; `tipo_pessoa = 'JURIDICA'` onde `cnpj` não é nulo/vazio. `nome` continua existindo e obrigatório — passa a ser preenchido automaticamente pelo app como nome de exibição, mantendo intactos pedidos, buscas e impressões. Refletir o mesmo em `supabase/seed.sql`.

**`src/lib/trpc-real/clientes.ts`:** ampliar `ClienteRow`/`ClienteApp` e os mapeamentos `toApp`/`toDb` com os novos campos (camelCase no app). Em `toDb`, derivar `nome` a partir do tipo: física → `PRIMEIRO NOME SOBRENOME`; jurídica → `nome_fantasia || razao_social`; se ambos vazios, mantém o `nome` informado.

**`src/components/ModalCliente.tsx`:** seletor de tipo de pessoa controlando quais campos aparecem; máscaras e validações de CPF/CNPJ preservadas, aplicadas só ao campo visível; validação obrigatória de Primeiro Nome (física) ou Razão Social (jurídica); demais campos e o comportamento de caixa alta sem alteração.

**WhatsApp:** acrescentar as três variáveis em `TEMPLATE_VARS` (`src/lib/whatsapp.ts`) e preenchê-las em `src/pages/PedidoDetalhe.tsx` a partir do cliente do pedido, no mesmo ponto onde hoje são montados `{cliente}`, `{total}` e `{periodo}`. Pré-visualização em `src/pages/MensagensWhatsApp.tsx` com valores de exemplo.

**Sem alterações** em login, permissões, auditoria, remanufatura ou nas telas de pedidos.
