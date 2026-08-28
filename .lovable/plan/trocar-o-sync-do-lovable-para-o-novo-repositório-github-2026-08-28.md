# Trocar o sync do Lovable para o novo repositório GitHub

## Objetivo
Mudar a sincronização Git do projeto para o repositório `https://github.com/maickelmanson/lovable-cartridge-clone.git`, descontinuando o repositório antigo `cartuchos-web.git`.

## Passos

1. **Verificar acesso ao novo repositório**
   - Confirmar que `maickelmanson/lovable-cartridge-clone.git` existe no GitHub.
   - Verificar se a integração GitHub do Lovable tem permissão de escrita nele (público ou convite aceito).

2. **Abrir a configuração de Git no editor Lovable**
   - No editor Lovable, abrir o menu de GitHub/Git sync.
   - Desconectar o repositório antigo, se ainda estiver vinculado.

3. **Conectar o novo repositório**
   - Escolher a opção para conectar a um repositório existente ou criar/sync para `lovable-cartridge-clone.git`.
   - Autorizar o acesso, se solicitado.

4. **Sincronizar o estado atual**
   - Forçar o sync inicial para que o commit atual do projeto vá para o novo repositório.
   - Aguardar a confirmação de que os arquivos e commits apareceram no GitHub.

5. **Validar o sync**
   - Verificar no GitHub que o conteúdo de `main` reflete o projeto atual.
   - Fazer uma pequena alteração no editor e confirmar que o sync bidirecional funciona.

6. **Descontinuar o repositório antigo**
   - Opcional: arquivar ou adicionar um aviso no README de `cartuchos-web.git` informando que o projeto migrou para `lovable-cartridge-clone.git`.

## O que não será feito
- Não executarei `git push` manualmente deste ambiente sandbox.
- Não criarei um novo repositório; usaremos o `lovable-cartridge-clone.git` já existente.
- Não alterarei código da aplicação, apenas a configuração de sync.

## Resultado esperado
O projeto continua acessível pelo mesmo link de preview/público do Lovable, mas o código-fonte passa a ser sincronizado com `https://github.com/maickelmanson/lovable-cartridge-clone.git`.
