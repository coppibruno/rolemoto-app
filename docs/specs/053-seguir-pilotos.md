# SPEC 053 — Seguir pilotos

> **Status:** Proposta
> **Autor:** Assistente IA
> **Data:** 2026-11-04
> **Origem:** achar outro piloto, abrir o perfil e seguir; no meu perfil, ver quem eu sigo e quem me segue
> **Padrões:** Next.js 15 App Router — skill `nextjs-patterns`; visual — skill `desenvolvimento-design`
> **Backend:** Cloud Function `api` — seguir, listas, busca e push no `usuariosRouter`
> **Coleções:** `usersseguir` (**nova**). `users` ganha contadores e campos internos de busca
> **Depende de:** SPEC 002 (perfil), SPEC 013 / 042 (push e `url` no clique), SPEC 025 (perfil público), SPEC 036 (layout do perfil), SPEC 039 (`DELETE /perfil`)
> **QA:** IDs **SG1**–**SG5**, um PR por ID

Seguir é na hora. As listas são públicas para quem está logado. A busca mora no topo da home.

---

## 1. Objetivo

O piloto encontra outra pessoa pelo nome ou pelo apelido, abre o perfil e segue. No próprio perfil e no perfil alheio, dois números abrem as listas **seguindo** e **seguidores**.

| ID | Entrega | Camada |
|----|---------|--------|
| **SG1** | Normalizar texto e ordenar o resultado da busca, com teste e sem rede | Back (lib pura) |
| **SG2** | Vínculo, contadores e campos no perfil | Back |
| **SG3** | Listas, busca e índices | Back |
| **SG4** | Push ao seguir e limpeza ao excluir a conta | Back |
| **SG5** | Ícone na home, tela Pilotos, botão e listas | Front |

---

## 2. Recorte

### 2.1 O que entra

- Ícone **Encontrar pilotos** no topo da home, ao lado do avatar. Abre `/pilotos`.
- Busca por nome ou apelido, a partir de 2 letras. A cidade só aparece na linha do resultado.
- Botão **Seguir** / **Seguindo** no perfil de outro piloto e na linha da busca e das listas.
- Números **seguindo** e **seguidores** no cartão do perfil (próprio e alheio). O toque abre a lista.
- Listas públicas, paginadas, da pessoa mais recente para a mais antiga.
- Push na hora em que o vínculo nasce: **"{nome} começou a te seguir"**. O toque abre o perfil de quem seguiu.
- Confirmação de uma linha ao deixar de seguir.
- Ao excluir a conta, os vínculos dos dois lados saem e o número da outra pessoa é corrigido.

### 2.2 O que não entra

| Item | Motivo |
|------|--------|
| Conta privada, pedido de aceite, bloquear, remover seguidor | Seguir é na hora, como conta pública |
| Aba nova no dock, segunda barra na home, ou misturar piloto no campo que filtra rolê, evento e ponto | O topo já tem um ícone; o campo de baixo continua com o recorte da SPEC 003 / 024 |
| Ícone de busca no perfil | Uma porta só, a home. O perfil guarda os números e as listas |
| Sugestão de pessoas, feed só de quem eu sigo, carrossel de stories filtrado por seguir | O carrossel continua “quem publicou nas últimas 24 h” (SPEC 049) |
| Caixa de mensagens ou inbox | O aviso é o push que o app já sabe mostrar |
| Abreviar milhar (`1,2 mil`) | A base é pequena; o número sai inteiro |
| Busca por cidade, e-mail ou moto | Cidade é rótulo da linha, não filtro |
| Landing anônima | GuardaApp segue exigindo login |

### 2.3 Decisões travadas

| Decisão | Escolha |
|---------|---------|
| Modelo | Um sentido. Eu posso seguir quem não me segue |
| Quem vê a lista | Qualquer autenticado, no próprio perfil e no alheio |
| Onde nasce a busca | `CabecalhoFeed`, ícone `person_search` à esquerda do avatar, 48 px, `aria-label="Encontrar pilotos"` |
| Campo da home | Permanece “Buscar rolês, eventos ou pontos…”. Não ganha piloto |
| Seguir | `POST` cria na hora. Repetir não soma de novo e não manda outro push |
| Deixar de seguir | Pede confirmação. Seguir de novo depois disso é vínculo novo: soma e manda push |
| “Segue você” | Linha pequena quando a outra pessoa me segue. O botão continua **Seguir** ou **Seguindo** |
| Ordem da lista | `createdAt` descendente |
| Página | 30 vínculos. A busca devolve no máximo 20 pessoas |
| Nome no push e na linha | `apelidoExibicao`: apelido, senão o primeiro nome, senão `piloto` |
| Cliente | Firestore continua deny-all. O client só fala com a function |

---

## 3. Dados

### 3.1 Coleção `usersseguir`

Id `{seguidorId}_{seguidoId}`. Um doc por par.

```
{
  id: string,
  seguidorId: string,
  seguidoId: string,
  createdAt: timestamp
}
```

`seguidorId` é quem apertou Seguir. `seguidoId` é o perfil visitado. Os dois vêm do token e do path, nunca do body. Timestamp só no servidor.

### 3.2 Campos novos em `users`

Docs antigos leem assim:

| Campo | Ausente no doc antigo | Na API |
|-------|------------------------|--------|
| `seguindo` | `0` | sim |
| `seguidores` | `0` | sim |
| `nomeBusca` | `""` até o próprio perfil ser aberto ou salvo | não |
| `apelidoBusca` | `""` | não |
| `primeiroNomeBusca` | `""` | não |
| `ultimoNomeBusca` | `""` | não |

Os quatro campos de busca são internos. `GET /perfil` e `GET /usuarios/:uid` não os devolvem.

`seguindo` conta quantas pessoas este uid segue. `seguidores` conta quantas o seguem.

### 3.3 Índices

Em `firestore.indexes.json`, coleção `usersseguir`:

- `seguidorId` ASC + `createdAt` DESC — lista Seguindo
- `seguidoId` ASC + `createdAt` DESC — lista Seguidores

A busca por prefixo usa um campo só, sem `orderBy`. O índice simples do Firestore basta. Não criar índice composto para a busca.

---

## 4. Texto da busca

Lib pura em `functions/src/lib/busca-piloto.ts`. Sem Firestore. SG1 cobre os casos.

`normalizarBusca(valor)`:

1. `trim`, espaços internos viram um só.
2. minúsculas.
3. NFD e remoção das marcas (`João` → `joao`).
4. corta em 40 caracteres.

`camposBusca(nome, apelido)` devolve:

| Campo | Regra |
|-------|--------|
| `nomeBusca` | nome normalizado inteiro |
| `apelidoBusca` | apelido normalizado; vazio se a pessoa não tem apelido |
| `primeiroNomeBusca` | primeiro token de `nomeBusca` |
| `ultimoNomeBusca` | último token; se o nome tem uma palavra, repete o primeiro |

`ordenarBusca(termo, pessoas)` ordena quem já passou no prefixo:

1. `apelidoBusca` começa com o termo
2. `primeiroNomeBusca` começa com o termo
3. `ultimoNomeBusca` começa com o termo
4. `nomeBusca` começa com o termo
5. empate: `nomeBusca` em ordem alfabética

O termo da query passa pela mesma normalização. Com menos de 2 caracteres depois disso, a API responde 400. A lib não consulta o banco: só normaliza, monta os campos e ordena uma lista recebida.

Exemplos:

| Entrada | `nomeBusca` | primeiro | último |
|---------|-------------|----------|--------|
| `João Silva` | `joao silva` | `joao` | `silva` |
| `José` | `jose` | `jose` | `jose` |
| apelido `MotoCão` | — | — | `apelidoBusca = motocao` |

`silva` acha o sobrenome de João Silva e o apelido `silva`. `jo` acha João. `ao` não acha João: a busca é prefixo, não “contém”.

Quem já tem conta fica encontrável na próxima abertura do próprio perfil. `GET /perfil` grava os quatro campos quando algum está ausente ou diferente do nome atual. Se já batem, não escreve. `POST /perfil` e `PUT /perfil` gravam sempre. Abrir o perfil de outra pessoa não escreve os campos dela.

---

## 5. API

Tudo em `usuariosRouter`, com `autenticar` e o `rateLimitAutenticado` que já existe (120/min por uid). `GET /usuarios/busca` precisa ser registrado **antes** de `GET /:uid`.

### 5.1 Linha

A busca e as duas listas devolvem o mesmo item:

```
{
  uid: string,
  nome: string,
  apelido: string,       // apelidoExibicao
  fotoUrl: string,
  cidade: string,        // "" se não tiver
  seguidoPorMim: boolean,
  segueVoce: boolean
}
```

Sem e-mail, sem `admin`, sem moto. `seguidoPorMim` / `segueVoce` são em relação ao uid do token.

### 5.2 `POST /usuarios/:uid/seguir`

Sem body. `:uid` é quem será seguido.

| Caso | Resposta |
|------|----------|
| Sem token | 401 |
| `:uid` vazio ou igual ao token | 400 `{ erro: "não dá para seguir a si mesmo" }` |
| Perfil alvo inexistente | 404 `{ erro: "Perfil não encontrado" }` |
| Vínculo novo | 201 `{ seguido: true }` — cria o doc, soma 1 nos dois contadores, dispara o push da seção 6 |
| Vínculo já existe | 200 `{ seguido: true }` — não soma e não manda push |

A criação e as duas somas acontecem na mesma transação. O push roda depois. Falha de push não muda o status da request (o mesmo contrato da SPEC 013).

Contador ausente conta como 0.

### 5.3 `DELETE /usuarios/:uid/seguir`

| Caso | Resposta |
|------|----------|
| `:uid` igual ao token | 400 `{ erro: "não dá para seguir a si mesmo" }` |
| Doc não existe | 200 `{ seguido: false }` |
| Doc existe | 200 `{ seguido: false }` — apaga e reduz os dois contadores |

Na transação, cada contador vai para `max(0, valorAtual - 1)`. Não manda push.

### 5.4 `GET /usuarios/:uid/seguindo` e `GET /usuarios/:uid/seguidores`

Qualquer autenticado. 404 se o perfil do `:uid` não existe.

Query opcional `cursor` (id do último `usersseguir` da página anterior). Cursor desconhecido: 400 `{ erro: "cursor inválido" }`.

```
{
  itens: LinhaPiloto[],
  proximoCursor: string | null
}
```

Seguindo: `seguidorId == :uid`. Seguidores: `seguidoId == :uid`. As duas ordenam `createdAt` desc, limite 30.

O cursor é o id do último **vínculo** lido, mesmo que o usuário daquele vínculo já não exista. Linha cujo `users` sumiu é omitida. Assim a página seguinte não trava.

`seguidoPorMim` e `segueVoce` saem de `getAll` nos ids `{token}_{outro}` e `{outro}_{token}`. Na lista Seguindo do próprio token, `seguidoPorMim` é sempre `true`.

### 5.5 `GET /usuarios/busca?q=`

`q` normalizado com menos de 2 caracteres: 400 `{ erro: "digite pelo menos 2 letras" }`.

Quatro consultas de prefixo em paralelo, cada uma com limite 20, só se o campo não for vazio no termo:

- `apelidoBusca`
- `primeiroNomeBusca`
- `ultimoNomeBusca`
- `nomeBusca`

Prefixo: `>= termo` e `<= termo + "\uf8ff"`. Sem `orderBy`.

Junta, tira o uid do token, deduplica, passa em `ordenarBusca` e devolve no máximo 20 linhas, no mesmo shape da seção 5.1, sem cursor. Lista vazia é 200 `{ itens: [] }`.

### 5.6 Perfil

`GET /perfil` e `GET /usuarios/:uid` ganham `seguindo` e `seguidores` (número).

`GET /usuarios/:uid` ganha também `seguidoPorMim` e `segueVoce`. No próprio `GET /perfil` esses dois não entram.

---

## 6. Push

Tipo novo em `TipoPush`: `novo_seguidor`.

Só no `POST` que criou o doc. Destinatário: `seguidoId`. Remetente no texto: `apelidoExibicao` de quem seguiu.

| Campo | Valor |
|-------|--------|
| `title` | `{nome} começou a te seguir` |
| `body` | o mesmo texto |
| `url` | `/perfil/{seguidorId}` |
| `roleId`, `localId`, `eventoId` | `""` |

O `title` carrega a frase inteira porque o toast com o app aberto mostra só o título (`usePushForeground`). O clique continua no `notificationclick` / `fcm-nativo`, que já abrem `data.url`. Sem parser novo no client.

Não notificar a si mesmo (o POST nem cria esse caso).

---

## 7. Excluir conta

No `DELETE /perfil`, depois das stories e antes de `usuarioRepository.remover`, apagar os vínculos em que o uid é `seguidorId` ou `seguidoId`.

Em lotes de 100. Para cada doc, na transação: apaga o vínculo e reduz o contador do **outro** uid (`seguindo` se o outro era o seguidor, `seguidores` se o outro era o seguido). O contador do uid que está saindo não importa: o doc `users` dele cai em seguida.

Usuário do outro lado já inexistente: só apaga o vínculo. Falha neste passo gera log de warn e a rota segue para 204, no mesmo espírito das stories e dos dispositivos. Auth continua sendo removido primeiro.

---

## 8. Front

Sem mock novo. Tokens e CSS Modules do perfil e do feed. Coluna do shell, toque mínimo `--touch-min`.

### 8.1 Home

`CabecalhoFeed`: à direita, o ícone e depois o avatar que já existe. O ícone é um `Link` para `/pilotos`. A `BarraBuscaRaio` não muda.

### 8.2 `/pilotos`

Header: Voltar (fallback `/`) e título **Pilotos**. Campo com foco ao abrir, `placeholder="Nome ou apelido"`, `type="search"`.

- Menos de 2 letras: texto **Digite pelo menos 2 letras**. Sem request.
- A partir de 2: debounce 300 ms e `GET /usuarios/busca`.
- Carregando: uma linha discreta, sem skeleton de página inteira.
- Zero resultados: **Nenhum piloto com esse nome**.
- Erro: texto curto e **Tentar de novo**.

### 8.3 Linha

Componente único para a busca e para as listas.

Foto (o avatar já usado no app; sem foto, o ícone de pessoa), nome, `@apelido` só quando a pessoa definiu apelido, cidade se não for vazia. Se `segueVoce`, a linha **Segue você**.

Tocar a linha abre `/perfil/{uid}`. Tocar o botão não navega.

| Estado | Botão |
|--------|--------|
| `seguidoPorMim === false` | preenchido, **Seguir** |
| `seguidoPorMim === true` | contorno, **Seguindo**; o toque abre a confirmação |

O botão troca na hora. Se a request falhar, volta ao estado anterior e um toast diz **Não deu para atualizar**.

Confirmação, no mesmo espírito dos modais já existentes (Layer 2):

- Título: **Deixar de seguir {apelidoExibicao}?**
- **Cancelar** e **Deixar de seguir**
- Cancelar não chama a API

### 8.4 Cartão do perfil

Em `CartaoPiloto`, abaixo da identidade e acima da ficha (moto, cidade, garupa):

```
12                 48
seguindo           seguidores
```

Dois botões. Esquerda vai para `/perfil/{uid}/seguindo?aba=seguindo`. Direita, `?aba=seguidores`. O número e o rótulo cabem juntos; o número é o que pesa visualmente.

No perfil de outra pessoa, embaixo dos números, o botão **Seguir** / **Seguindo** em largura do cartão, e **Segue você** quando couber. No próprio perfil esse botão não aparece. O restante do cartão (editar, histórico, sair) fica como está.

### 8.5 `/perfil/[uid]/seguindo`

A rota é filha de `[uid]` e **não** passa pelo redirect de `TelaPerfilPublico`. Vale para o próprio uid e para o alheio.

Header: Voltar. Se o uid for o meu e não houver histórico, o fallback é `/perfil`. Senão, `/perfil/{uid}`.

Título: o `apelidoExibicao` daquela pessoa. Duas abas: **Seguindo** e **Seguidores**. A aba inicial vem de `?aba=`. Valor estranho cai em Seguindo.

A lista usa a linha da seção 8.3. Ao chegar no fim, pede a próxima página com `cursor`.

Vazio:

| Lista | Dono | Outra pessoa |
|-------|------|----------------|
| Seguindo | **Você ainda não segue ninguém** e um link **Encontrar pilotos** → `/pilotos` | **Ninguém por aqui** |
| Seguidores | **Ninguém te segue ainda** | **Ninguém por aqui** |

---

## 9. Critérios de aceite

### SG1 — texto da busca

- [ ] `João Silva` vira `joao silva`, primeiro `joao`, último `silva`.
- [ ] `José` e o apelido `MotoCão` perdem o acento.
- [ ] Termo `jo` ordena apelido que começa com `jo` antes de primeiro nome, e primeiro nome antes de sobrenome.
- [ ] Termo com uma letra depois de normalizar não é termo válido para a função que a rota usa (`tamanho < 2`).

### SG2 — vínculo e perfil

- [ ] `POST` novo grava `usersseguir/{eu}_{outro}`, soma 1 em `seguindo` do eu e em `seguidores` do outro, responde 201.
- [ ] `POST` repetido responde 200 e os números não mudam.
- [ ] `POST` em si mesmo responde 400. Alvo inexistente responde 404.
- [ ] `DELETE` reduz os dois números e o segundo `DELETE` responde 200 sem deixar negativo.
- [ ] `GET /perfil` e `GET /usuarios/:uid` trazem os números. O público traz `seguidoPorMim` e `segueVoce`. Os campos `*Busca` não saem no JSON.
- [ ] Abrir o próprio perfil preenche `*Busca` uma vez. Abrir o perfil alheio não escreve no doc dele.

### SG3 — listas e busca

- [ ] Seguindo e Seguidores abrem para outro piloto logado, 30 por página, mais recente primeiro.
- [ ] Cursor percorre a página seguinte. Cursor inventado responde 400.
- [ ] `GET /usuarios/busca?q=silva` acha sobrenome e apelido, não devolve o próprio uid, corta em 20.
- [ ] `q` com uma letra responde 400. Sem match, `{ itens: [] }`.
- [ ] A rota `/usuarios/busca` não é capturada por `/:uid`.

### SG4 — push e conta

- [ ] O primeiro `POST` manda push com a frase no título e `url` `/perfil/{seguidorId}`. O `POST` repetido não manda.
- [ ] Deixar de seguir e seguir de novo manda outro push.
- [ ] Falha do FCM ainda devolve 201.
- [ ] `DELETE /perfil` remove os vínculos dos dois lados e corrige o número de quem ficou. Falha nessa limpeza não impede o 204.

### SG5 — telas

- [ ] Na home, o ícone ao lado do avatar abre `/pilotos`. O campo de rolê, evento e ponto filtra como antes.
- [ ] Com uma letra, a tela explica e não chama a API. Com “maria”, mostra linhas; tocar a linha abre o perfil; tocar **Seguir** não sai da tela.
- [ ] No perfil alheio, os números abrem a lista certa. **Seguindo** pede confirmação antes do `DELETE`. **Segue você** aparece quando a outra pessoa me segue.
- [ ] No meu perfil, os números abrem as minhas listas e não há botão Seguir. Lista Seguindo vazia oferece **Encontrar pilotos**.
- [ ] 390 px: o ícone não cobre o avatar nem a logo; o botão do cartão não estoura a ficha.

---

## 10. Ordem

SG1 → SG2 → SG3 → SG4 → SG5.

SG4 depende do `POST` da SG2. SG5 pode usar a API assim que SG3 estiver no ar; o push não bloqueia a tela.

---

## 11. Arquivos previstos

| Arquivo | Ação |
|---------|------|
| `functions/src/lib/busca-piloto.ts` | Novo — normalizar, campos, ordenar |
| `functions/src/lib/busca-piloto.test.ts` | Novo — SG1 |
| `functions/src/types/seguir.ts` | Novo — linha, página, campos de busca |
| `functions/src/repositories/interfaces/seguir.repository.ts` | Novo |
| `functions/src/repositories/firestore/firestore-seguir.repository.ts` | Novo |
| `functions/src/repositories/index.ts` | Alterar — factory |
| `functions/src/routes/usuarios.ts` | Alterar — busca, listas, seguir |
| `functions/src/routes/perfil.ts` | Alterar — contadores, campos de busca, limpeza no DELETE |
| `functions/src/types/usuario.ts` | Alterar — contadores no domínio; busca fica fora do DTO público |
| `functions/src/lib/notificacoes.ts` | Alterar — `novo_seguidor` |
| `firestore.indexes.json` | Alterar — dois índices de `usersseguir` |
| `src/app/(app)/feed/components/CabecalhoFeed.tsx` | Alterar — ícone |
| `src/app/(app)/pilotos/` | Novo — tela de busca |
| `src/app/(app)/perfil/[uid]/seguindo/` | Novo — abas e lista |
| `src/app/(app)/perfil/[uid]/components/CartaoPiloto.tsx` | Alterar — números e botão |
| `src/types/perfil-publico.ts` | Alterar — contadores e vínculo |

A rota não importa Firestore. A transação do vínculo fica no repositório.
