# SPEC 057 — Feed de fotos no perfil

> **Status:** Proposta
> **Autor:** Assistente IA
> **Data:** 2026-11-11
> **Origem:** grade permanente de fotos no perfil, no gesto do Instagram: legenda, comentário e encaminhar o post para o story
> **Padrões:** Next.js 15 App Router — skill `nextjs-patterns`; visual — skill `desenvolvimento-design`
> **Backend:** Cloud Function `api` — posts, comentários e encaminhamento; a grade em `usuariosRouter`
> **Coleções:** `userspostfoto` (**nova**), `userspostcomentario` (**nova**). `userslocalstory` ganha `postId`, `marcaTipo` e `marcaId`
> **Depende de:** SPEC 002 / 025 / 036 (perfil), SPEC 045 / 047 / 049 (story, marca, bolinha da pessoa), SPEC 013 / 042 (push e `url` no clique), SPEC 039 (`DELETE /perfil`)
> **QA:** IDs **FP1**–**FP6**, um PR por ID

A grade mora no perfil. A foto fica. O story de 24 h continua o de hoje: encaminhar o post cria uma cópia na bolinha de quem encaminhou e não entra na faixa Ao vivo.

---

## 1. Objetivo

No próprio perfil e no perfil de outro piloto, a pessoa vê uma grade de fotos e abre cada uma. No seu perfil, publica. Em qualquer post, comenta. Qualquer piloto logado manda aquele post para o próprio story.

| ID | Entrega | Camada |
|----|---------|--------|
| **FP1** | Legenda, comentário, marca, teto e “já está no story”, com teste e sem rede | Back (lib pura) |
| **FP2** | Post, grade, detalhe, apagar e o arquivo no Storage | Back |
| **FP3** | Comentários e push para o autor da foto | Back |
| **FP4** | Encaminhar para o story e o selo que abre o post | Back + player |
| **FP5** | Limpeza no `DELETE /perfil` | Back |
| **FP6** | Abas, grade, publicar, detalhe, comentário e encaminhar | Front |

---

## 2. Recorte

### 2.1 O que entra

- Aba **Fotos** e aba **Histórico** logo abaixo do cartão do piloto, em `/perfil` e em `/perfil/[uid]`. Fotos abre primeiro. Histórico é o conteúdo que o perfil já mostra hoje.
- Grade de três colunas, da foto mais nova para a mais antiga. O toque abre o post.
- Publicar uma foto, com legenda opcional e marca opcional de um local ou de um evento.
- Comentário em lista plana. Qualquer piloto logado comenta. Quem escreveu apaga o próprio. O dono da foto apaga qualquer um daquele post.
- Push na hora do comentário novo, só para o autor da foto. O toque abre o post.
- Encaminhar o post para o story, na publicação e depois, pelo post. A cópia dura 24 h na bolinha de quem encaminhou. No player, a foto passa e um selo abre o post.
- Ao excluir a conta, saem os posts, os comentários e os arquivos daquela pessoa.

### 2.2 O que não entra

| Item | Motivo |
|------|--------|
| Timeline na home, ou grade só de quem eu sigo | A grade é o perfil |
| Curtir, resposta em fio, editar legenda, editar comentário | O recorte é lista plana e apagar |
| Várias fotos no mesmo post | Uma foto por publicação |
| Coleção de salvos | A aba no lugar do Salvos do Instagram é o histórico, que já existe |
| Conta privada, denúncia, hashtag, menção no texto | Fora do recorte |
| A cópia de 24 h entrar na faixa Ao vivo do ponto | Encaminhar não é check-in. Não pede GPS e não dispara o push `story_local` |
| A foto encaminhada virar post na grade de quem encaminhou | A grade só lista o que a pessoa publicou. A cópia mora no story |
| Miniatura separada, link automático na legenda, destaque que não expira | A grade usa a mesma URL. O texto da legenda é texto |
| Landing anônima | GuardaApp segue exigindo login |

### 2.3 Decisões travadas

| Decisão | Escolha |
|---------|---------|
| Onde | Embaixo do cartão. No próprio perfil, completar perfil e **Editar perfil** ficam acima das abas. Sair, instalar, senha e excluir conta ficam abaixo do painel |
| Abas | Ícones, 48 px. **Fotos** (`grid_view`) e **Histórico** (`history`). `role="tablist"`, rótulo “Perfil”. Estado local, sem query na URL. Fotos é o padrão |
| Histórico | Os componentes de hoje, cada um na sua tela. A aba só muda o lugar |
| Uma foto | Câmera ou galeria. Sem recorte obrigatório. Na grade, quadrado com `object-fit: cover`. No post, a foto inteira |
| Legenda | Opcional. Trim. Até 500 caracteres. Vazia grava `""`. Sem edição |
| Marca | Opcional. Um local **ou** um evento que já exista, inclusive evento encerrado ou cancelado. Sem GPS. O toque abre `/locais/:id` ou `/eventos/:id` |
| Quem vê | Qualquer autenticado |
| Quem publica | O uid do token, na própria grade |
| Quem comenta | Qualquer autenticado, inclusive o autor da foto |
| Quem apaga o comentário | O autor do comentário ou o autor da foto |
| Quem encaminha | Qualquer autenticado, para a própria bolinha. Na publicação, o interruptor **Também no story** nasce desligado |
| Dedup do story | Enquanto a cópia daquele piloto para aquele post não expirou, encaminhar de novo devolve a mesma story |
| Vida separada | Apagar o post não apaga as stories. Apagar a story não apaga o post. Post já apagado: a story segue até expirar e o selo some |
| Teto da grade | 10 fotos do mesmo uid em janela móvel de 24 h |
| Teto do story | A cópia entra no álbum `perfil` e conta no teto de 5 que o story já tem |
| Cliente | Firestore continua deny-all. A rota não importa Firestore |

---

## 3. Dados

### 3.1 Coleção `userspostfoto`

Id auto. Um doc por foto.

```
{
  id: string,
  usuarioId: string,
  fotoUrl: string,
  storagePath: string,
  legenda: string,                 // "" se vazia
  marcaTipo: "local" | "evento" | null,
  marcaId: string | null,
  totalComentarios: number,
  createdAt: timestamp
}
```

`usuarioId` vem do token. A marca guarda o id; o nome é lido na hora, no local ou no evento. Sem `updatedAt`: a legenda não muda. `totalComentarios` começa em 0.

Invariante: `marcaTipo` e `marcaId` vêm os dois ou nenhum. Nunca local e evento no mesmo doc.

### 3.2 Coleção `userspostcomentario`

Id auto.

```
{
  id: string,
  postId: string,
  usuarioId: string,
  texto: string,
  createdAt: timestamp
}
```

`usuarioId` é quem comentou. Texto já com trim, até 280 caracteres.

### 3.3 Campos novos em `userslocalstory`

Docs antigos e stories que não nasceram de um post leem assim:

| Campo | Ausente | Na story pública |
|-------|---------|------------------|
| `postId` | `null` | vira `publicacao` ou `null` |
| `marcaTipo` | `null` | entra em `mencao` quando o álbum não tem local nem evento |
| `marcaId` | `null` | o mesmo |

A story encaminhada grava `album: "perfil"`, `localId: null`, `eventoId: null`, `postId` do post, e a marca copiada. `localId` e `eventoId` continuam significando álbum ao vivo. A faixa Ao vivo e o teto do ponto filtram por esses campos e não enxergam esta cópia.

`StoryPublica` ganha:

```
publicacao: { id: string, autorUid: string } | null
```

`publicacao` sai preenchida só quando `postId` aponta para um post que ainda existe. Post apagado: `null`. O restante do JSON da story não muda.

`mencao` passa a sair também de `marcaTipo` + `marcaId`, quando `localId` e `eventoId` são nulos e o local ou o evento ainda existe. A marca do álbum ao vivo, quando houver, continua tendo prioridade.

### 3.4 Índices

Em `firestore.indexes.json`:

| Coleção | Campos | Uso |
|---------|--------|-----|
| `userspostfoto` | `usuarioId` ASC, `createdAt` DESC | Grade e teto de 10 |
| `userspostcomentario` | `postId` ASC, `createdAt` DESC | Lista do post |
| `userslocalstory` | `usuarioId` ASC, `postId` ASC, `expiresAt` ASC | Já existe cópia no ar |

`userspostcomentario.usuarioId` usa o índice simples, na limpeza da conta. Não criar composto para ele.

### 3.5 Storage

Post: `posts/{uid}/{arquivo}`. Extensões já aceitas em `imagemValida()` (jpeg, png, webp, até 10 MB).

Em `storage.rules`, um `match` no mesmo padrão de `stories/perfil/`:

- `read` se autenticado
- `write` se autenticado, `request.auth.uid == uid` e `imagemValida()`

O client sobe a foto e o `POST` só recebe a URL. O servidor exige o prefixo `posts/{uid do token}/`.

A cópia do story vai para `stories/perfil/{uid de quem encaminha}/{arquivo}`, gravada pelo Admin SDK. É outro arquivo. Apagar o post apaga só `posts/…`. O job que já expira stories apaga a cópia.

---

## 4. Regras puras

Lib em `functions/src/lib/post-foto.ts`. Sem Firestore. FP1 cobre os casos.

`legendaDe(valor)`:

| Entrada | Resultado |
|---------|-----------|
| ausente, `null` ou `""` | `""` |
| string com trim de até 500 | o texto com trim |
| outro tipo, ou mais de 500 depois do trim | erro `legenda longa demais` |

Quebra de linha no meio permanece. Sem cortar em silêncio.

`comentarioDe(valor)`:

| Entrada | Resultado |
|---------|-----------|
| string com trim de 1 a 280 | o texto com trim |
| vazio depois do trim | erro `escreva um comentário` |
| mais de 280, ou outro tipo | erro `comentário longo demais` |

`marcaDe(valor)`:

| Entrada | Resultado |
|---------|-----------|
| ausente ou `null` | sem marca |
| `{ tipo: "local" \| "evento", id }` com id não vazio, sem barra | a marca |
| os dois tipos, id vazio, tipo estranho ou campo a mais no lugar do par | erro `marca inválida` |

A lib não consulta o catálogo. A rota é que exige o local ou o evento existente.

`dentroDoTeto(quantidadeNaJanela)`: `true` quando `quantidadeNaJanela < 10`.

`storyJaEncaminhada(stories, postId, agora)`: `true` se alguma story tem esse `postId` e `expiresAt` ainda no futuro. Story sem `postId`, de outro post, ou já expirada não conta. A janela de 24 h da story em si não é recalculada aqui: a lib só lê a lista que a rota passar.

---

## 5. API

Tudo com `autenticar` e o `rateLimitAutenticado` que já existe (120/min por uid).

Nome na linha e no push: `apelidoExibicao` — apelido, senão o primeiro nome, senão `piloto`.

### 5.1 Formas

Item da grade:

```
{
  id: string,
  fotoUrl: string,
  createdAt: string
}
```

Detalhe:

```
{
  id: string,
  fotoUrl: string,
  legenda: string,
  marca: { tipo: "local" | "evento", id: string, nome: string } | null,
  totalComentarios: number,
  createdAt: string,
  encaminhadoPorMim: boolean,
  autor: { uid: string, apelido: string, fotoUrl: string }
}
```

`marca` é `null` quando o post não tem marca ou quando o local ou o evento não existe mais. `encaminhadoPorMim` é `true` quando o uid do token tem story não expirada com esse `postId`. Autor cujo `users` sumiu sai como `piloto` e `fotoUrl: ""`.

Comentário:

```
{
  id: string,
  texto: string,
  createdAt: string,
  podeApagar: boolean,
  autor: { uid: string, apelido: string, fotoUrl: string }
}
```

`podeApagar` é `true` se o token é o autor do comentário ou o autor da foto.

Página:

```
{
  itens: [],
  proximoCursor: string | null
}
```

Cursor desconhecido: 400 `{ erro: "cursor inválido" }`. O cursor é o id do último doc da página, mesmo que o usuário daquele doc já não exista.

### 5.2 `POST /posts`

```
{
  fotoUrl: string,
  legenda?: string,
  marca?: { tipo: "local" | "evento", id: string } | null,
  encaminharStory?: boolean
}
```

| Caso | Resposta |
|------|----------|
| Sem token | 401 |
| Foto fora de `posts/{uid}/`, URL ruim ou extensão fora do padrão | 400 `{ erro: "foto inválida" }` |
| Legenda ou marca reprovada pela lib | 400 com o erro da seção 4 |
| `encaminharStory` presente e não booleano | 400 `{ erro: "foto inválida" }` |
| Marca aponta para local ou evento inexistente | 404 `{ erro: "marca não encontrada" }` |
| 10 fotos desse uid com `createdAt` nas últimas 24 h | 429 `{ erro: "Você já publicou 10 fotos hoje" }` |
| Gravou | 201, corpo abaixo |

```
{
  post: Detalhe,
  story: { id: string } | null,
  erroStory: string | null
}
```

`encaminharStory` ausente ou `false`: `story` e `erroStory` saem `null`. `true`: depois do commit do post, roda o mesmo encaminhamento da seção 5.7. Se a cópia falhar (teto de 5, arquivo, rede), o post permanece, `story` sai `null` e `erroStory` leva a mensagem. Falha do story não muda o 201.

A contagem das 10 e a criação do doc acontecem na mesma transação.

### 5.3 `GET /usuarios/:uid/posts`

Qualquer autenticado. 404 `{ erro: "Perfil não encontrado" }` se o perfil não existe.

Query opcional `cursor`. Ordem `createdAt` descendente, limite 30. Lista vazia é 200 `{ itens: [], proximoCursor: null }`.

### 5.4 `GET /posts/:id`

Qualquer autenticado. 404 `{ erro: "Foto não encontrada" }` se o doc não existe. 200 com o detalhe.

### 5.5 `DELETE /posts/:id`

| Caso | Resposta |
|------|----------|
| Doc não existe | 404 `{ erro: "Foto não encontrada" }` |
| Token não é o `usuarioId` | 403 `{ erro: "só o autor apaga" }` |
| Autor | 204 |

Apaga os comentários daquele `postId` em lotes de 100, depois o doc, depois o arquivo em `storagePath`. Falha do Storage não impede o 204: log e segue. Um comentário que nascer no meio da exclusão pode ficar sem post; a listagem exige o post e não o mostra.

Não mexe em `userslocalstory`.

### 5.6 Comentários

`GET /posts/:id/comentarios`

404 se o post não existe. Query `cursor`. Ordem `createdAt` descendente, limite 30: a primeira página são os mais novos. O client desenha a página ao contrário, o mais novo junto do campo, e **Comentários anteriores** pede a página seguinte.

`POST /posts/:id/comentarios`

```
{ texto: string }
```

| Caso | Resposta |
|------|----------|
| Post não existe | 404 `{ erro: "Foto não encontrada" }` |
| Texto reprovado pela lib | 400 com o erro da seção 4 |
| Gravou | 201 com o comentário |

Na mesma transação: cria o doc e soma 1 em `totalComentarios`. O push da seção 6 roda depois do commit. Falha de push não muda o 201.

`DELETE /posts/:id/comentarios/:comentarioId`

| Caso | Resposta |
|------|----------|
| Post ou comentário não existe, ou o comentário é de outro post | 404 `{ erro: "Comentário não encontrado" }` |
| Token não é o autor do comentário nem o autor da foto | 403 `{ erro: "não dá para apagar" }` |
| Pode apagar | 204 |

Na transação: apaga o comentário e leva `totalComentarios` a `max(0, atual - 1)`. Post já sumiu: só apaga o comentário. Não manda push.

### 5.7 `POST /posts/:id/story`

Sem body. O uid do token é quem fica com a story.

| Caso | Resposta |
|------|----------|
| Post não existe | 404 `{ erro: "Foto não encontrada" }` |
| Já existe story desse uid, desse `postId`, com `expiresAt` no futuro | 200 `{ storyId }` — não cria outra e não copia de novo |
| Esse uid já tem 5 stories de álbum `perfil` na janela de 24 h que o story já usa | 429 `{ erro: "Você já postou 5 fotos no seu perfil hoje" }` |
| Criou | 201 `{ storyId }` |

A checagem da cópia ativa e a criação do doc acontecem na mesma transação. O arquivo é copiado antes, para `stories/perfil/{uid}/{arquivo}`. Se a transação achar que a cópia já existia, o arquivo novo é apagado.

A story grava:

| Campo | Valor |
|-------|--------|
| `usuarioId` | token |
| `album` | `"perfil"` |
| `localId`, `eventoId` | `null` |
| `postId` | id do post |
| `marcaTipo`, `marcaId` | a marca do post, ou `null` |
| `fotoUrl`, `storagePath` | a cópia |
| `expiresAt` | `createdAt` + 24 h |
| marca arrastável e localização | `null` |

Não chama o push `story_local`. Não exige GPS.

---

## 6. Push

Tipo novo em `TipoPush`: `comentario_foto`.

Só no `POST` de comentário em que o autor do comentário é diferente do autor da foto. Comentar na própria foto não envia.

| Campo | Valor |
|-------|--------|
| `title` | `{nome} comentou na sua foto` |
| `body` | o mesmo texto |
| `url` | `/perfil/{autorUid}/fotos/{postId}` |
| `roleId`, `localId`, `eventoId` | `""` |

`{nome}` é o `apelidoExibicao` de quem comentou. O título leva a frase inteira porque o toast com o app aberto mostra só o título. O clique continua no `notificationclick` / `fcm-nativo`, que já abrem `data.url`. Sem parser novo no client.

Cada comentário avisa uma vez. Não agrupa e não avisa as outras pessoas que comentaram.

---

## 7. Player

`PalcoFotoStory` ganha o selo quando `publicacao` não é `null`.

| Selo | Onde | Toque |
|------|------|--------|
| `@nome` da `mencao` | Onde o player já desenha a marca | Abre o local ou o evento. Não avança a story |
| **Ver publicação** | Na base da foto. Se a story também tiver selo de Maps, este fica acima dele | Abre `/perfil/{autorUid}/fotos/{id}`. Não avança a story |

`aria-label` do selo novo: `Ver publicação`. O toque não dispara o avanço do player (`stopPropagation`, no mesmo gesto da marca).

A bolinha continua sendo de quem encaminhou: o `autor` da story é o `usuarioId` da cópia. O selo é que chega no post original, com a legenda e os comentários de lá.

Story sem `publicacao` não ganha esse botão. Apagar a story no player continua só para o dono da bolinha e não apaga o post.

---

## 8. Excluir conta

No `DELETE /perfil`, depois de `apagarStoriesDoUsuario` e antes de remover o `users`:

1. Posts com `usuarioId` do uid: os comentários de cada um, o doc e o arquivo `posts/…`.
2. Comentários com `usuarioId` do uid em posts de outras pessoas: apaga e reduz `totalComentarios` daquele post, com `max(0, atual - 1)`.

Em lotes de 100. As stories que essa pessoa encaminhou já saíram no passo anterior, com o arquivo da cópia. A story que outra pessoa encaminhou de um post deste uid permanece até expirar; o selo some porque o post não existe mais.

Falha neste passo gera log de warn e a rota segue para 204, no mesmo espírito das stories. Auth continua sendo removido primeiro.

---

## 9. Front

Sem mock novo. Tokens e CSS Modules do perfil. Coluna do shell, toque mínimo `--touch-min`. Viewport de referência 390 px, sem scroll horizontal.

### 9.1 Abas

Um controle só, usado nas duas telas. Cada tela entrega o histórico que já tem: `HistoricoPistas` no próprio perfil, `HistoricoPublicoSecao` no perfil do colega.

| Tela | Ordem |
|------|--------|
| `/perfil` | Cartão, completar, **Editar perfil**, abas, painel, ações da conta |
| `/perfil/[uid]` | Cabeçalho, cartão, abas, painel |

Trocar de aba não recarrega o cartão. Voltar para Fotos não descarta a página já carregada.

O redirect de `/perfil/{meuUid}` para `/perfil` permanece. A rota do post não redireciona.

### 9.2 Grade

Três colunas, vão pequeno, miniatura quadrada. Botão com `aria-label` `Foto de {data}`, data curta no fuso que o histórico já usa.

| Estado | O que aparece |
|--------|----------------|
| Carregando | Seis quadrados |
| Erro | Texto e **Tentar de novo** |
| Próprio, vazio | **Nova foto** e “Poste a primeira foto” |
| Alheio, vazio | “Nenhuma foto ainda”, sem botão |
| Com `proximoCursor` | **Carregar mais** |

**Nova foto** só na aba Fotos do próprio perfil, acima da grade. Ícone `add_a_photo`, 48 px. some no perfil do colega.

O toque na miniatura abre `/perfil/{autorUid}/fotos/{postId}`.

### 9.3 Publicar

Rota `/perfil/fotos/nova`, tela cheia, no mesmo espírito do composer de story.

1. Câmera ou galeria.
2. Prévia da foto inteira.
3. Legenda, com contador até 500.
4. **Marcar** abre a mesma busca de local e evento que o composer de story já usa. Um chip. **Tirar** devolve o botão. Não pede GPS.
5. Interruptor **Também no story**, desligado.
6. **Publicar** fica desabilitado sem foto.

Sucesso volta para `/perfil`, na aba Fotos, com a foto nova na frente. Se `erroStory` vier preenchido, um toast: “A foto foi publicada. O story não foi: {mensagem}”. A mensagem vai na navegação, sem ficar na URL.

### 9.4 Post

Rota `/perfil/[uid]/fotos/[postId]`. `[uid]` é o autor. Abrir o próprio post não manda para `/perfil`.

- Voltar.
- Foto inteira.
- Linha do autor: avatar, apelido, data curta. O toque na linha abre o perfil.
- Chip da marca, quando houver. O toque abre a ficha.
- Legenda, com as quebras de linha, como texto.
- Lista de comentários. **Comentários anteriores** quando houver cursor.
- Campo fixo na base, acima do dock, com `env(safe-area-inset-bottom)`. Enviar só com texto. 400 mostra o erro da API junto do campo.
- **Adicionar ao story** para qualquer logado. Se `encaminhadoPorMim`, o botão fica desabilitado com o rótulo **No seu story**.
- **Apagar publicação** só para o autor, com confirmação: “Apagar esta foto? Os comentários saem junto. O story de quem encaminhou continua até expirar.”

Comentário com `podeApagar` tem **Apagar**, com confirmação “Apagar comentário?”.

Lista vazia: “Nenhum comentário ainda”, e o campo continua.

O push abre esta rota direto.

### 9.5 Story

O selo da seção 7. Fora isso o player, a bolinha e a faixa Ao vivo ficam como estão.

---

## 10. Critérios de aceite

### FP1 — lib

- [ ] Legenda ausente vira `""`. 500 caracteres passam. 501 devolve `legenda longa demais`.
- [ ] Comentário de espaços falha com `escreva um comentário`. 280 passam. 281 devolvem `comentário longo demais`.
- [ ] Marca nula passa. Local e evento com id passam. Os dois juntos, id vazio ou tipo estranho devolvem `marca inválida`.
- [ ] `dentroDoTeto(9)` é verdadeiro e `dentroDoTeto(10)` é falso.
- [ ] Story expirada, sem `postId` ou de outro post não conta. Story no ar com aquele `postId` conta.

### FP2 — post

- [ ] `POST` com foto no prefixo do token cria o doc e a grade desse uid devolve a foto em primeiro.
- [ ] Foto de outro prefixo responde 400 e não grava.
- [ ] A 11ª foto em 24 h responde 429. A grade fica com 10.
- [ ] Marca de local abre o nome certo no detalhe. Id inexistente responde 404.
- [ ] `DELETE` do autor responde 204, tira a foto da grade, os comentários e o arquivo. Outro uid recebe 403. O story encaminhado continua.

### FP3 — comentário e push

- [ ] Qualquer logado comenta. O autor da foto recebe push com a frase no título e `url` do post. Comentar na própria foto não envia.
- [ ] Falha do FCM ainda devolve 201 e o comentário está na lista.
- [ ] O autor do comentário apaga o próprio. O autor da foto apaga o de outra pessoa. Um terceiro recebe 403. `totalComentarios` acompanha.

### FP4 — story

- [ ] Encaminhar cria story `perfil` na bolinha de quem encaminhou, com cópia do arquivo, sem GPS. A faixa Ao vivo do ponto não ganha essa foto e não dispara `story_local`.
- [ ] O segundo `POST` enquanto a cópia está no ar devolve 200 e o mesmo `storyId`.
- [ ] No player, **Ver publicação** abre o post e não avança a foto. A marca, se houver, abre a ficha.
- [ ] Post apagado: a story segue até expirar, sem o selo. Apagar a story não apaga o post.
- [ ] A 6ª story de perfil na janela de 24 h responde 429. Se isso acontecer no `POST /posts` com o interruptor ligado, a foto fica na grade e `erroStory` vem preenchido.

### FP5 — conta

- [ ] `DELETE /perfil` remove os posts, os arquivos `posts/…`, os comentários nos dois sentidos e corrige o contador do post que ficou.
- [ ] A story que outra pessoa encaminhou continua até expirar, sem selo.
- [ ] Falha nessa limpeza não impede o 204.

### FP6 — telas

- [ ] Nos dois perfis, em 390 px, Fotos abre primeiro, em três colunas, e Histórico mostra o que já mostrava, com os filtros de hoje.
- [ ] No próprio perfil, **Nova foto** publica e a grade atualiza. No perfil do colega não há esse botão, e a miniatura abre o post.
- [ ] O post mostra legenda, marca, comentários e **Adicionar ao story**. **No seu story** não cria outra cópia.
- [ ] O campo de comentário não fica embaixo do dock. O push abre o post.
- [ ] `/perfil/{meuUid}` continua indo para `/perfil`. A URL do post não redireciona.

---

## 11. Ordem

FP1 → FP2 → FP3 → FP4 → FP5 → FP6.

FP4 depende do post da FP2 e do player que já existe. FP5 depende dos docs da FP2 e da FP3. FP6 pode usar a API assim que FP4 estiver no ar; a limpeza da conta não bloqueia a tela, e entra antes de ir para produção.

---

## 12. Arquivos previstos

| Arquivo | Ação |
|---------|------|
| `functions/src/lib/post-foto.ts` | Novo — legenda, comentário, marca, teto, dedup |
| `functions/src/lib/post-foto.test.ts` | Novo — FP1 |
| `functions/src/types/post-foto.ts` | Novo |
| `functions/src/repositories/interfaces/post-foto.repository.ts` | Novo |
| `functions/src/repositories/firestore/firestore-post-foto.repository.ts` | Novo |
| `functions/src/repositories/index.ts` | Alterar — factory |
| `functions/src/routes/posts.ts` | Novo — criar, detalhe, apagar, comentários, encaminhar |
| `functions/src/index.ts` | Alterar — `app.use("/posts", …)` |
| `functions/src/routes/usuarios.ts` | Alterar — `GET /:uid/posts` |
| `functions/src/types/story-local.ts` | Alterar — `postId`, marca, `publicacao` |
| `functions/src/lib/story-local.ts` | Alterar — `mencao` da marca copiada; teto de perfil reusado |
| `functions/src/repositories/firestore/firestore-story-local.repository.ts` | Alterar — ler e gravar os campos; achar a cópia no ar |
| `functions/src/lib/notificacoes.ts` | Alterar — `comentario_foto` |
| `functions/src/routes/perfil.ts` | Alterar — limpeza no DELETE |
| `firestore.indexes.json` | Alterar — três índices da seção 3.4 |
| `storage.rules` | Alterar — `posts/{uid}/{arquivo}` |
| `src/types/post-foto.ts` | Novo |
| `src/lib/storage.ts` | Alterar — upload em `posts/{uid}/` |
| `src/app/(app)/perfil/components/AbasConteudoPerfil.tsx` | Novo — tablist |
| `src/app/(app)/perfil/components/GradeFotos.tsx` | Novo |
| `src/app/(app)/perfil/fotos/nova/` | Novo — composer |
| `src/app/(app)/perfil/[uid]/fotos/[postId]/` | Novo — detalhe |
| `src/app/(app)/perfil/components/VisaoPerfil.tsx` | Alterar — abas |
| `src/app/(app)/perfil/[uid]/components/TelaPerfilPublico.tsx` | Alterar — abas |
| `src/app/(app)/components/PalcoFotoStory.tsx` | Alterar — selo **Ver publicação** |
| `.cursor/rules/tech-stack.mdc` | Alterar — coleções, campos da story e rotas |

A transação do post, do comentário e do encaminhamento fica no repositório.

---

## 13. Relação

| Spec | Relação |
|------|---------|
| **025 / 036** | O perfil público e o próprio continuam com o cartão de hoje. A grade entra embaixo. O redirect do próprio uid permanece |
| **045** | Álbum, 24 h, teto de 5 no perfil, faixa Ao vivo e o job de expiração ficam. A cópia usa o álbum `perfil` e outro arquivo |
| **047** | A marca `@nome` no player fica. A marca deste post não arrasta e não troca o álbum |
| **049** | A bolinha da pessoa mostra a cópia, porque ela é uma story do uid que encaminhou. O perfil do colega continua sem anel de story no avatar |
| **013 / 042** | O push novo usa `title`, `url` e o clique que já abre a rota |
| **039** | O `DELETE /perfil` ganha posts e comentários, no mesmo espírito da limpeza das stories |
