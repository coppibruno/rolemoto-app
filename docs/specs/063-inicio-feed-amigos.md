# SPEC 063 — Início: feed dos amigos

> **Status:** Implementada
> **Autor:** Assistente IA
> **Data:** 2026-11-15
> **Origem:** a home vira social. Num só lugar, o que as pessoas que eu sigo publicaram e fizeram: foto, telemetria, rolê criado, rolê realizado, entrada em rolê, inscrição em evento, avaliação e selo. Com curtir e comentar
> **Padrões:** Next.js 15 App Router — skill `nextjs-patterns`; visual — skill `desenvolvimento-design`
> **Backend:** Cloud Function `api` — `atividadesRouter` (novo), `feedRouter` ganha `/amigos`, gancho nas rotas de origem, job em `internoRouter`
> **Coleções:** `atividades` (**nova**), `atividadecurtida` (**nova**), `atividadecomentario` (**nova**)
> **Depende de:** SPEC 053 (seguir), SPEC 057 (post e comentário), SPEC 030 / 058 (telemetria e medalha), SPEC 026 (inscrição), SPEC 027 (avaliação), SPEC 044 (selo), SPEC 007 (fila), SPEC 049 (stories), SPEC 039 (`DELETE /perfil`)
> **QA:** IDs **FA1**–**FA9**, um PR por ID

`/` deixa de ser a listagem por raio. A listagem continua igual, em `/explorar`. O **Início** é organizado por pessoa e o **Explorar** por lugar e data.

---

## 1. Objetivo

Ao abrir o app, o piloto vê em ordem de tempo o que ele e as pessoas que segue fizeram. Curte qualquer item. Comenta nos itens de conteúdo. Do card, chega na ficha do rolê, do evento, do local, da telemetria ou do post.

| ID | Entrega | Camada |
|----|---------|--------|
| **FA1** | Id, agrupamento, cursor, mescla de consultas, resumo do traçado, com teste e sem rede | Back (lib pura) |
| **FA2** | Coleção `atividades`, gravação nas rotas de origem e remoção quando a origem some | Back |
| **FA3** | `GET /feed/amigos`, novidades e `GET /atividades/:id` | Back |
| **FA4** | Curtir e descurtir, e o coração no post da SPEC 057 | Back + post |
| **FA5** | Comentários e push | Back |
| **FA6** | Job de rolê realizado e carga inicial de 30 dias | Back |
| **FA7** | Limpeza no `DELETE /perfil` | Back |
| **FA8** | Dock, `/explorar` e os links que voltavam para `/` | Front |
| **FA9** | Tela Início, cards, folha de comentários e `/atividades/[id]` | Front |

---

## 2. Recorte

### 2.1 O que entra

- `/` mostra o Início. A `TelaFeed` de hoje muda para `/explorar`, sem mudança de comportamento.
- Dock com cinco itens fixos: **Início**, **Explorar**, **+**, **Meus Rolês** e **Perfil**. A Fila sai do dock.
- No topo do Início, nesta ordem: o card de avaliação pendente, o banner do líder e a faixa de stories. Os três saem do Explorar.
- Lista cronológica, da mais nova para a mais antiga, com o que o próprio piloto e quem ele segue fizeram.
- Nove tipos de item (seção 3.2), em dois formatos: **conteúdo**, que é um card grande com curtir e comentar, e **atividade**, que é uma linha compacta só com curtir.
- Linhas compactas iguais sobre o mesmo alvo viram uma só: “Bruno, Lia e mais 2 se inscreveram em…”.
- Pílula “N novidades” quando chega item novo, sem empurrar a lista.
- Folha de comentários que sobe da base, e a rota `/atividades/[id]` para o push e para o link direto.
- O post da SPEC 057 ganha o coração. A curtida é a mesma do card no Início.

### 2.2 O que não entra

| Item | Motivo |
|------|--------|
| “Solicitou entrar no rolê” com o pedido pendente | Se o líder recusar, todo mundo percebe. Só entra depois do aceite |
| “Começou a seguir” | Polui o feed. Decisão do produto |
| Favoritar local, check-in sem selo novo | Ruído. Só o selo novo entra |
| Avaliação de rolê (SPEC 010) | Fica na ficha do rolê, para o líder |
| Medalha como item separado | Vai dentro do card da telemetria |
| Fotos do grupo no rolê realizado | O rolê não tem álbum. O card usa capa e participantes |
| Prévia de comentário no card | Custa uma leitura por card. O card mostra “Ver os N comentários” |
| Lista de quem curtiu, push de curtida, outras reações, resposta em fio, editar comentário | Fora do recorte |
| Ordem por relevância ou algoritmo | Só cronológica |
| Item de quem eu não sigo | É o papel do Explorar |
| Story como item | A faixa de stories já fica no topo |
| Telemetria privada, rolê apagado, evento ou local apagado | O item não existe ou some junto com a origem |

### 2.3 Decisões travadas

| Decisão | Escolha |
|---------|---------|
| Quem aparece | O uid do token e até 299 seguidos mais recentes (`listarSeguidosRecentes`). Quem segue mais gente vê os 299 seguidos mais recentes |
| Como o feed é montado | Leitura com `in` em lotes de 30 autores, no máximo 10 consultas por página, e mescla por `createdAt`. Sem cópia por seguidor |
| Snapshot ou leitura ao vivo | Ao vivo. A atividade guarda só ids. Título, capa e data vêm da origem na hora, como a marca da SPEC 057 |
| Id da atividade | Determinístico (seção 3.2). Gravar de novo não duplica. Apagar pela origem não precisa de busca |
| Falha ao gravar a atividade | Log de warn. A ação de origem segue com o mesmo status |
| Curtir | Qualquer autenticado, inclusive o próprio autor. Um por pessoa e atividade |
| Comentar | Só nos tipos de conteúdo. Qualquer autenticado. Apaga o autor do comentário ou o da atividade |
| Comentário da foto | Uma conversa só: o tipo `foto` lê e grava em `userspostcomentario`, a mesma do post |
| Agrupamento | Na leitura, dentro da página. O item agrupado não tem curtir |
| Página | 20 itens. Rolagem infinita com sentinela e botão **Carregar mais** de reserva |
| CTA do card | Abre a ficha (`/roles/:id`, `/eventos/:id`, `/locais/:id`, `/telemetria/:id`). O fluxo de entrar, se inscrever ou comprar ingresso continua só na ficha |
| Cliente | Firestore continua deny-all. A rota não importa Firestore |

---

## 3. Dados

### 3.1 Coleção `atividades`

```
{
  id: string,                    // seção 3.2
  tipo: TipoAtividade,
  autorId: string,
  alvoTipo: "post" | "telemetria" | "role" | "evento" | "local",
  alvoId: string,
  refId: string,                 // doc de origem
  totalCurtidas: number,
  totalComentarios: number,      // tipo foto: não usado, vale o do post
  createdAt: timestamp           // momento da ação na origem
}
```

`createdAt` é a hora da ação, não a da gravação. Na carga inicial e na telemetria que volta a ser pública, vale a data da origem.

### 3.2 Tipos

| `tipo` | Formato | Id | Autor | Alvo | `refId` | Nasce em |
|--------|---------|----|-------|------|---------|----------|
| `foto` | conteúdo | `foto_{postId}` | dono do post | post | postId | `POST /posts` |
| `telemetria` | conteúdo | `telemetria_{telemetriaId}` | dono | telemetria | telemetriaId | `POST /telemetria` com `publica: true`; `PATCH` para `true` |
| `role_criado` | conteúdo | `role_criado_{roleId}` | criador | role | roleId | `POST /roles` |
| `role_realizado` | conteúdo | `role_realizado_{roleId}` | criador | role | roleId | Job da seção 5.8 |
| `avaliacao_local` | conteúdo | `avaliacao_local_{feedbackId}` | quem avaliou | local | feedbackId | `POST /locais/:id/avaliacoes` |
| `avaliacao_evento` | conteúdo | `avaliacao_evento_{feedbackId}` | quem avaliou | evento | feedbackId | `POST /eventos/:id/avaliacoes` |
| `entrada_role` | atividade | `entrada_role_{usuarioId}_{roleId}` | participante | role | usersrole id | `POST /roles/:id/participacao` em rolê aberto; `PATCH /aprovacoes/:id` com `aceitar` |
| `inscricao_evento` | atividade | `inscricao_evento_{usuarioId}_{eventoId}` | inscrito | evento | usersevento id | `POST /eventos/:id/inscricao` |
| `selo` | atividade | `selo_{usuarioId}_{localId}` | quem fez check-in | local | checkin id | `POST /locais/:id/checkin` com `seloNovo` não nulo |

`TipoConteudo` = os seis primeiros. `TipoCompacto` = os três últimos.

### 3.3 Onde a atividade some

A remoção apaga o doc, as curtidas e os comentários de `atividadecomentario`, em lotes de 100. Falha gera log de warn e não muda o status da rota.

| Origem | Apaga |
|--------|-------|
| `DELETE /posts/:id` | `foto_{id}` (os comentários do post já saem pela SPEC 057) |
| `PATCH /telemetria/:id` para `publica: false`, `DELETE /telemetria/:id` | `telemetria_{id}` |
| `DELETE /roles/:id` | `role_criado_`, `role_realizado_` e toda `entrada_role` com `alvoId` do rolê |
| `DELETE /roles/:id/participacao` | `entrada_role_{uid}_{roleId}` |
| `DELETE /eventos/:id/inscricao` | `inscricao_evento_{uid}_{eventoId}` |
| `DELETE /eventos/:id` | `inscricao_evento` e `avaliacao_evento` com `alvoId` do evento |
| `DELETE /locais/:id` | `avaliacao_local` e `selo` com `alvoId` do local |

Na leitura, item cuja origem não existe mais é pulado e entra na mesma remoção, sem bloquear a resposta.

### 3.4 Coleção `atividadecurtida`

```
{
  id: string,            // `{usuarioId}_{atividadeId}`
  usuarioId: string,
  atividadeId: string,
  createdAt: timestamp
}
```

### 3.5 Coleção `atividadecomentario`

```
{
  id: string,            // autoId
  atividadeId: string,
  usuarioId: string,
  texto: string,         // 1..280, com trim
  createdAt: timestamp
}
```

O tipo `foto` não usa esta coleção.

### 3.6 Índices

Em `firestore.indexes.json`:

| Coleção | Campos | Uso |
|---------|--------|-----|
| `atividades` | `autorId` ASC, `createdAt` DESC | Página e novidades |
| `atividadecomentario` | `atividadeId` ASC, `createdAt` DESC | Lista de comentários |

`atividades.alvoId`, `atividades.autorId`, `atividadecurtida.atividadeId`, `atividadecurtida.usuarioId` e `atividadecomentario.usuarioId` usam o índice simples, na remoção e na limpeza da conta.

---

## 4. Regras puras

Lib em `functions/src/lib/atividade.ts`. Sem Firestore. FA1 cobre os casos.

`idAtividade(tipo, partes)`: monta o id da tabela 3.2. Parte vazia ou com barra dá erro.

`aceitaComentario(tipo)`: `true` só para `TipoConteudo`.

`lotesDeAutores(tokenUid, seguidos)`: o token primeiro, sem repetir, no máximo 300, em lotes de 30.

`mesclarPaginas(listas, limite)`: junta as listas de cada lote por `createdAt` desc e depois por id desc, sem repetir id, e corta em `limite`. Devolve também se sobrou item para a próxima página.

`agruparCompactos(itens)`: percorre na ordem. Item compacto com o mesmo `tipo` e `alvoId` de um compacto anterior da página, com `createdAt` até 24 h antes dele, entra nesse grupo. O grupo fica na posição do mais novo, guarda até 3 autores distintos para exibir e o total de autores distintos. Conteúdo não agrupa. Grupo de um autor só continua item individual.

`resumirTracado(polyline, maxPontos)`: decodifica, mantém o primeiro e o último ponto e amostra em passo fixo até `maxPontos` (120). Polyline vazia devolve `""`.

`textoDoComentario`: reusa `comentarioDe` de `post-foto.ts`, com os mesmos erros.

---

## 5. API

Tudo com `autenticar` e o `rateLimitAutenticado` que já existe. Nome na linha e no push: `apelidoExibicao`.

### 5.1 Formas

Item:

```
{
  id: string,
  tipo: TipoAtividade,
  createdAt: string,
  autor: { uid: string, apelido: string, fotoUrl: string },
  outrosAutores: { uid: string, apelido: string, fotoUrl: string }[],   // [] fora do grupo
  totalAutores: number,                                                 // 1 fora do grupo
  podeCurtir: boolean,                                                  // false no grupo
  curtidoPorMim: boolean,
  totalCurtidas: number,
  totalComentarios: number | null,                                      // null nos compactos
  alvo: AlvoAtividade
}
```

`AlvoAtividade`, por `tipo`:

| `tipo` | `alvo` |
|--------|--------|
| `foto` | `{ tipo: "post", id, fotoUrl, legenda, marca: { tipo, id, nome } \| null }` |
| `telemetria` | `{ tipo: "telemetria", id, titulo, distanciaKm, tempoMovimentoSegundos, velocidadeMediaKmh, inicioNome, fimNome, tracadoResumo, medalhas: { conquistaId, nome, novidade }[] }` |
| `role_criado`, `entrada_role` | `{ tipo: "role", id, titulo, fotoCapaUrl, ritmo, acesso, dataHoraSaida, saidaNome, destinoNome, confirmados, jaSaiu, minhaParticipacao: "nenhuma" \| "pendente" \| "confirmado" }` |
| `role_realizado` | o mesmo de `role`, mais `participantes: { uid, fotoUrl }[]` (até 5) |
| `inscricao_evento` | `{ tipo: "evento", id, titulo, fotoCapaUrl, dataHoraAbertura, localNome, encerrado, inscrito }` |
| `avaliacao_local`, `avaliacao_evento` | `{ tipo: "avaliacao", alvoTipo: "local" \| "evento", alvoId, alvoNome, nota, comentario, fotosUrls, recomendaComboio }` |
| `selo` | `{ tipo: "local", id, nome, categoria }` |

A medalha não leva `velocidadeMaxKmh`, como na SPEC 058 para quem não é dono. Sem `somaNotas` e sem campo interno.

Página:

```
{ itens: Item[], proximoCursor: string | null }
```

### 5.2 `GET /feed/amigos`

Query opcional `cursor`, que é o id da última atividade da página anterior.

1. Lê os seguidos e monta os lotes com `lotesDeAutores`.
2. Para cada lote: `autorId in lote`, `orderBy createdAt desc, __name__ desc`, depois do cursor, limite 21.
3. `mesclarPaginas` com limite 20.
4. Hidrata em lote: autores, origens, `curtidoPorMim` (leitura pelos ids determinísticos de `atividadecurtida`).
5. Pula o que perdeu a origem (seção 3.3) e aplica `agruparCompactos`.

| Caso | Resposta |
|------|----------|
| Sem token | 401 |
| Cursor de atividade que não existe | 400 `{ erro: "cursor inválido" }` |
| Sem seguidos e sem atividade própria | 200 `{ itens: [], proximoCursor: null }` |
| Ok | 200 com a página |

Telemetria que deixou de ser pública entre a gravação e a leitura também é pulada. O cliente que recebe 400 de cursor recarrega do início.

### 5.3 `GET /feed/amigos/novidades`

Query `desde`, com o id da primeira atividade que o cliente tem. Mesmos lotes, `createdAt` maior que o daquela atividade, limite 20 por lote.

200 `{ total: number }`, de 0 a 20. `desde` desconhecido: `{ total: 0 }`. Não hidrata.

### 5.4 `GET /atividades/:id`

404 `{ erro: "Atividade não encontrada" }` se o doc ou a origem não existe. 200 com o item, sem agrupamento. Qualquer autenticado.

### 5.5 Curtida

`POST /atividades/:id/curtida` e `DELETE /atividades/:id/curtida`. Sem body.

| Caso | Resposta |
|------|----------|
| Atividade não existe | 404 `{ erro: "Atividade não encontrada" }` |
| POST, nova | 201 `{ curtido: true, totalCurtidas }` |
| POST, já curtida | 200, mesmo corpo, sem somar |
| DELETE, existia | 200 `{ curtido: false, totalCurtidas }` |
| DELETE, não existia | 200, mesmo corpo, sem subtrair |

Transação: o doc da curtida e `totalCurtidas` mudam juntos. A subtração usa `max(0, atual - 1)`. Sem push.

`DetalhePost` (SPEC 057) ganha `curtidoPorMim` e `totalCurtidas`, lidos de `foto_{postId}`. Post sem atividade (por exemplo, falha na gravação) cria a atividade no primeiro `POST` de curtida, com o `createdAt` do post.

### 5.6 Comentários

`GET /atividades/:id/comentarios?cursor=` — 30 por página, `createdAt` desc, mesmo formato e mesmo `podeApagar` da SPEC 057. Aqui, `podeApagar` vale para o autor do comentário ou o autor da atividade.

`POST /atividades/:id/comentarios` `{ texto }`:

| Caso | Resposta |
|------|----------|
| Atividade não existe | 404 `{ erro: "Atividade não encontrada" }` |
| Tipo compacto | 400 `{ erro: "este item não aceita comentário" }` |
| Texto reprovado | 400 com o erro de `comentarioDe` |
| Gravou | 201 com o comentário |

`DELETE /atividades/:id/comentarios/:comentarioId` — 404, 403 `{ erro: "não dá para apagar" }` ou 204, como na SPEC 057.

Tipo `foto`: as três rotas leem e gravam `userspostcomentario` e `totalComentarios` do post, com o push `comentario_foto` de hoje. Os outros tipos usam `atividadecomentario` e `totalComentarios` da atividade, na mesma transação.

### 5.7 Gancho nas rotas de origem

Depois do commit da origem e antes da resposta, a rota chama `atividadeRepository.registrar(...)` ou `remover(...)`. Erro: log de warn, segue. `registrar` só cria se o id não existe, sem sobrescrever contadores.

### 5.8 Rolê realizado

`POST /interno/feed/roles-realizados`, header `X-Cron-Secret` (mesmo segredo dos jobs de hoje). Cloud Scheduler de hora em hora.

Rolês com `dataHoraSaida` entre 30 h e 6 h atrás e pelo menos 1 confirmado além do criador. Cria `role_realizado_{roleId}` com `createdAt` = hora do job. Já existente: não mexe. Responde `{ criados }`.

### 5.9 Carga inicial

`POST /interno/feed/carga`, mesmo header, para rodar uma vez no deploy. Cria pelo id determinístico, com o `createdAt` da origem, o que for dos últimos 30 dias: posts, telemetrias públicas, rolês criados, entradas aceitas, inscrições e avaliações. Selo fica de fora. Pode rodar de novo sem duplicar. Responde a contagem por tipo.

---

## 6. Push

Tipo novo em `TipoPush`: `comentario_atividade`. Só quando quem comenta não é o autor da atividade. Tipo `foto` continua em `comentario_foto`.

| Campo | Valor |
|-------|--------|
| `title` | `{nome} comentou {rótulo}` |
| `body` | o texto do comentário |
| `url` | `/atividades/{id}` |
| `roleId`, `localId`, `eventoId` | `""` |

| `tipo` | `{rótulo}` |
|--------|------------|
| `telemetria` | `no seu rolê gravado` |
| `role_criado`, `role_realizado` | `no seu rolê` |
| `avaliacao_local`, `avaliacao_evento` | `na sua avaliação` |

O clique já abre `data.url` no web e no nativo. Sem parser novo.

---

## 7. Excluir conta

No `DELETE /perfil`, junto com a limpeza da SPEC 057:

1. Atividades com `autorId` do uid, com as curtidas e os comentários de cada uma.
2. Curtidas do uid em atividades de outras pessoas, reduzindo `totalCurtidas` com `max(0, atual - 1)`.
3. Comentários do uid em `atividadecomentario` de outras pessoas, reduzindo `totalComentarios` da mesma forma.

Lotes de 100. Falha gera warn e a rota segue para 204.

---

## 8. Navegação (FA8)

### 8.1 Rotas

| Rota | Tela |
|------|------|
| `/` | `TelaInicio` (nova) |
| `/explorar` | `TelaFeed` de hoje |
| `/atividades/[id]` | Item único com os comentários |

`start_url` do manifest continua `/`. O destino pós-login padrão continua `/`.

### 8.2 Dock

`itens-menu.ts`:

| Ordem | Rótulo | Ícone | Rota | `aria-label` |
|-------|--------|-------|------|--------------|
| 1 | Início | `home` | `/` | Início, feed dos amigos |
| 2 | Explorar | `explore` | `/explorar` | Explorar rolês, eventos e locais |
| 3 | + | `add` | menu Incluir de hoje | Incluir |
| 4 | Meus Rolês | `sports_score` | `/meus-roles` | Meus rolês |
| 5 | Perfil | `account_circle` | `/perfil` | Editar perfil |

Saem o item `/aprovacoes` e o `useMostrarFila`. O acesso à Fila passa a ser o banner do líder no Início e o **Gerenciar** do rolê.

`useItemMenuAtivo`:

- Início: `/` exato e `/atividades/*`.
- Explorar: `/explorar`, `/roles/*`, `/eventos/*`, `/locais/*`, `/sugestoes-locais/*`, `/sugestoes-eventos/*`.
- Os demais ficam como estão.

### 8.3 Links que hoje voltam para `/`

Passam para `/explorar`: o voltar de `CabecalhoLocais`, `CabecalhoConquistas`, `CabecalhoSugestoesEventos`, `CabecalhoCriarLocal` e `CabecalhoCriarEvento`; o link para o feed em `EstadoDetalheLocal` e `EstadoDetalheEvento`; o CTA do `EstadoVazio` da Fila; e os `router.push("/")` e `router.replace("/")` depois de criar evento.

Continuam em `/`: telemetria, gravar rolê, mensagens, pilotos, criar rolê, páginas públicas e `not-found`.

### 8.4 O que sai do Explorar

`CarrosselStories`, `BannerCockpitLider` e `CardFeedbackPendente` saem da `TelaFeed` e vão para o Início. O resto da `TelaFeed`, inclusive o estado salvo em `useEstadoRetorno("feed")`, não muda.

---

## 9. Tela Início (FA9)

Sem mock em `designs/`. O wireframe validado no chat é referência de estrutura. Cor, raio e tipografia seguem esta seção e o feed atual. Tokens de `globals.css`, CSS Module em `src/app/(app)/inicio/inicio.module.css`, dark e light pelo tema que já existe. Referência de largura: 390 px, sem scroll horizontal.

### 9.1 Ordem

1. `CabecalhoFeed`, sticky, sem mudança.
2. `.corpo` do feed: coluna, `gap: 16px`, padding `16px var(--gutter-md) 24px`.
3. `CardFeedbackPendente`, quando houver.
4. `BannerCockpitLider`, quando houver.
5. `CarrosselStories`.
6. Pílula de novidades.
7. Lista.

### 9.2 Card de conteúdo

Base igual ao `.card` do feed: fundo `var(--surface-container)`, `border-radius: 0.75rem`, `overflow: hidden`, a mesma sombra.

**Cabeçalho do card** — padding `12px`, linha com:

- Avatar 40 px redondo. O toque abre `/perfil/[uid]` (ou `/perfil` se for o token).
- Nome em 14 px, peso 600, `var(--on-surface)`, seguido do verbo em `var(--on-surface-variant)`.
- Embaixo, tempo relativo em 12 px, `var(--outline)` (“há 12 min”, “ontem”, data curta depois de 7 dias).

| `tipo` | Verbo |
|--------|-------|
| `foto` | postou uma foto |
| `telemetria` | gravou um rolê |
| `role_criado` | criou um rolê |
| `role_realizado` | liderou um rolê |
| `avaliacao_local`, `avaliacao_evento` | avaliou {alvoNome} |

**Corpo**, por tipo:

| `tipo` | Corpo |
|--------|-------|
| `foto` | Foto 4:5, `object-fit: cover`. Toque abre o post. Toque duplo curte e mostra o `favorite` cheio em `var(--primary-container)` por 600 ms, sem descurtir. Legenda com quebras, até 3 linhas e **mais**. Chip da marca como no post |
| `telemetria` | `MapaEstatico` 16:9 com `trajeto` = `tracadoResumo` e marcadores A e B. Traçado e números em `var(--tertiary)`, a cor de telemetria do design system. Faixa de três métricas: distância, em movimento, média. Valor em Barlow Condensed 24 px, rótulo 11 px maiúsculo em `var(--outline)`. Medalhas como chips com `military_tech` |
| `role_criado` | `CapaRole` 16:9 com o selo de ritmo de hoje. Título em Barlow Condensed 20 px maiúsculo. Linha `data · hora · saída` e linha `→ destino`, 13 px, `var(--on-surface-variant)` |
| `role_realizado` | O mesmo de `role_criado`, com selo **Realizado** sobre a capa e `PilhaParticipantes` com “N pilotos” |
| `avaliacao_*` | Estrelas no mesmo estilo de `SeloMediaAvaliacoes`. Relato até 4 linhas e **mais**. Até 4 fotos em faixa de miniaturas de 64 px que abrem o `VisualizadorFotos`. Selo “Recomenda para comboio” quando `true`. Linha do alvo com ícone, que abre a ficha |

**Barra de ações** — padding `4px 12px 12px`, alvos de 48 px:

- `favorite` com o contador. Curtido: ícone cheio (`font-variation-settings: "FILL" 1`) em `var(--primary-container)`. Atualização otimista; erro desfaz e mostra toast.
- `chat_bubble` com o contador. Abre a folha de comentários.
- À direita, o CTA no estilo de chip ativo do design system: 32 px, pill, borda e texto `var(--primary-container)`, Barlow Condensed maiúsculo.

| `tipo` | CTA | Some quando |
|--------|-----|-------------|
| `telemetria` | Ver traçado → `/telemetria/:id` | — |
| `role_criado` | Quero ir → `/roles/:id` | `jaSaiu`, criador é o token ou `minhaParticipacao` diferente de `nenhuma` |
| `role_realizado` | Ver rolê → `/roles/:id` | — |
| `avaliacao_*` | Ver local ou Ver evento → ficha | — |
| `foto` | sem CTA | — |

Com `totalComentarios > 0`, uma linha “Ver os N comentários”, 13 px, `var(--outline)`, abaixo da barra. Ela abre a folha.

### 9.3 Linha de atividade

Fundo `var(--surface-container-low)`, `border-radius: 0.75rem`, sem sombra, padding `12px`, `min-height: var(--touch-min)`.

- À esquerda, avatar de 32 px, ou pilha de até 3 avatares sobrepostos no grupo.
- No meio, o texto em 13 px:

| `tipo` | Individual | Grupo |
|--------|------------|-------|
| `entrada_role` | **Ana** vai no rolê **{titulo}** | **Ana, Bruno** e mais N vão no rolê **{titulo}** |
| `inscricao_evento` | **Ana** se inscreveu em **{titulo}** | **Ana, Bruno** e mais N se inscreveram em **{titulo}** |
| `selo` | **Ana** ganhou o selo **{nome}** | — |

- Embaixo do texto, tempo relativo e a data do rolê ou do evento, em 12 px, `var(--outline)`.
- À direita: o coração com o contador quando `podeCurtir`; o CTA **Eu também vou** (→ `/eventos/:id`) ou **Quero ir** (→ `/roles/:id`) quando o alvo é futuro e o token ainda não está nele.
- O toque no resto da linha abre a ficha do alvo.

### 9.4 Folha de comentários

Sobe da base, acima do dock (`z-index` acima de `MenuInferior`). Fundo `var(--surface-container)`, `border-radius: 1.5rem 1.5rem 0 0`, alça de 36 × 4 px, `max-height: 80dvh`. O fundo atrás escurece; o toque nele, Esc ou arrastar a alça para baixo fecham.

- Título **Comentários** em Barlow Condensed, maiúsculo.
- Lista com `ItemComentario`, do mais antigo para o mais novo, e **Comentários anteriores** quando houver cursor.
- `CampoComentario` fixo na base da folha, com `env(safe-area-inset-bottom)`.

`ItemComentario` e `CampoComentario` saem de `perfil/[uid]/fotos/[postId]/components/` para `src/components/comentarios/` e passam a servir o post, a folha e `/atividades/[id]`.

Lista vazia: “Nenhum comentário ainda”, com o campo aberto e foco no campo. Fechar a folha atualiza o contador do card.

### 9.5 Pílula de novidades

Consulta `GET /feed/amigos/novidades` ao voltar o foco para a aba e a cada 60 s com a tela visível. Com `total > 0`: pílula sticky logo abaixo do cabeçalho, centralizada, fundo `var(--primary-container)`, texto `var(--on-primary-container)`, Barlow Condensed 14 px maiúsculo, `min-height: 32px`, com área de toque de 48 px. Texto “1 novidade”, “N novidades” ou “20+ novidades”. O toque rola ao topo e recarrega a primeira página. A lista não muda sozinha.

### 9.6 Estados

| Estado | O que aparece |
|--------|---------------|
| Carregando a primeira página | Três esqueletos: dois cards e uma linha |
| Erro | Texto e **Tentar de novo** |
| Não segue ninguém e sem atividade própria | Card com ícone `group`, título “Seu feed começa aqui” em Barlow Condensed, texto “Siga pilotos para ver os rolês, fotos e telemetrias deles.”, CTA primário **Encontrar pilotos** (`/pilotos`) e link **Explorar rolês perto de você** (`/explorar`) |
| Segue alguém e sem itens | “Ninguém que você segue postou nada ainda.” e o link para o Explorar |
| Fim da lista | “Você viu tudo dos últimos dias.” em `var(--outline)` |
| Carregando mais | Um esqueleto no fim |

### 9.7 Retorno

Ao voltar de uma ficha, o Início mantém os itens já carregados e a rolagem, no mesmo mecanismo do `PreservarRetorno` e `useEstadoRetorno` que o Explorar usa, com a chave `inicio`.

### 9.8 `/atividades/[id]`

Cabeçalho com voltar, o item no mesmo componente do Início e a lista de comentários aberta em página, como o post da SPEC 057. Tipo compacto: só o item, sem campo. Tipo `foto`: redireciona para `/perfil/{autor}/fotos/{postId}`. 404: “Este item não está mais disponível” e o link para o Início.

---

## 10. Critérios de aceite

### FA1 — lib

- [ ] `idAtividade` monta os nove formatos e recusa parte vazia ou com barra.
- [ ] `lotesDeAutores` põe o token primeiro, não repete, corta em 300 e devolve lotes de 30.
- [ ] `mesclarPaginas` ordena por `createdAt` desc e depois por id, sem repetir, e corta em 20.
- [ ] Três inscrições no mesmo evento em 24 h viram um grupo com 3 autores; uma quarta, 30 h antes, fica separada. Conteúdo nunca agrupa.
- [ ] `resumirTracado` mantém primeiro e último ponto e não passa de 120.

### FA2 — gravação

- [ ] Cada rota da tabela 3.2 cria a atividade com o id certo e o `createdAt` da origem. Repetir a ação não duplica.
- [ ] Pedido em rolê fechado não cria nada; o aceite cria `entrada_role`.
- [ ] Telemetria privada não cria. Mudar para pública cria; voltar para privada apaga.
- [ ] Cada linha da tabela 3.3 apaga a atividade, as curtidas e os comentários.
- [ ] Erro ao gravar a atividade não muda o status da rota de origem.

### FA3 — leitura

- [ ] O feed traz atividades do token e de quem ele segue, e nada de quem ele não segue.
- [ ] Com 45 seguidos ativos, a segunda página continua do ponto certo, sem repetir nem pular.
- [ ] Item com origem apagada não aparece e é removido.
- [ ] Novidades conta só o que é mais novo que `desde`, até 20.
- [ ] O JSON não traz `somaNotas`, `velocidadeMaxKmh` de medalha nem campo de busca.

### FA4 — curtida

- [ ] Curtir duas vezes conta uma. Descurtir sem ter curtido não fica negativo.
- [ ] O coração do post e o do card do Início mostram o mesmo número e o mesmo estado.

### FA5 — comentário

- [ ] Comentar em `telemetria` envia `comentario_atividade` ao dono com `url` `/atividades/{id}`. Comentar no próprio item não envia.
- [ ] Comentar em `foto` pelo Início aparece no post e envia `comentario_foto`.
- [ ] Comentar em tipo compacto responde 400.
- [ ] O autor da atividade apaga comentário de outra pessoa. Um terceiro recebe 403.

### FA6 — jobs

- [ ] Rolê que saiu há 8 h com 2 confirmados ganha `role_realizado`. Sem confirmados além do criador, não ganha. Rodar de novo não duplica.
- [ ] A carga inicial cria os itens dos últimos 30 dias com a data da origem e não duplica na segunda vez.

### FA7 — conta

- [ ] `DELETE /perfil` apaga as atividades do uid e as curtidas e os comentários dele nas dos outros, com os contadores corrigidos.

### FA8 — navegação

- [ ] Em 390 px, o dock mostra Início, Explorar, +, Meus Rolês e Perfil, para líder e não líder.
- [ ] `/explorar` mostra a listagem de hoje com localização, raio, abas e filtros, sem a faixa de stories.
- [ ] Na ficha de rolê, evento ou local, o item ativo do dock é Explorar. Os voltar da seção 8.3 vão para `/explorar`.
- [ ] Com pedido pendente, o banner do líder aparece no Início e abre a Fila.

### FA9 — Início

- [ ] Os seis cards de conteúdo e as três linhas seguem a seção 9, em dark e light.
- [ ] Curtir atualiza na hora; com a rede fora, desfaz e mostra o toast.
- [ ] A folha abre acima do dock, o campo não fica atrás do teclado nem da barra do iPhone, e o contador do card acompanha.
- [ ] A pílula aparece com item novo de quem eu sigo e não move a lista até o toque.
- [ ] Sem seguir ninguém, aparece o estado vazio com **Encontrar pilotos**.
- [ ] Voltar de uma ficha mantém a rolagem.
- [ ] O push de comentário abre `/atividades/{id}`.

---

## 11. Ordem

FA1 → FA2 → FA3 → FA4 → FA5 → FA6 → FA7 → FA8 → FA9.

FA8 pode ir em paralelo com o back; até a FA9 entrar, `/` aponta para a `TelaFeed`. FA6 (carga) roda no mesmo deploy da FA9, para o Início não abrir vazio. FA7 entra antes de produção.

---

## 12. Arquivos previstos

| Arquivo | Ação |
|---------|------|
| `functions/src/lib/atividade.ts` | Novo — id, lotes, mescla, agrupamento, traçado |
| `functions/src/lib/atividade.test.ts` | Novo — FA1 |
| `functions/src/lib/atividade-publica.ts` | Novo — hidratação do item |
| `functions/src/types/atividade.ts` | Novo |
| `functions/src/repositories/interfaces/atividade.repository.ts` | Novo — registrar, remover, página, curtida, comentário, limpeza |
| `functions/src/repositories/firestore/firestore-atividade.repository.ts` | Novo |
| `functions/src/repositories/index.ts` | Alterar — factory |
| `functions/src/routes/atividades.ts` | Novo — item, curtida, comentários |
| `functions/src/routes/feed.ts` | Alterar — `/amigos` e `/amigos/novidades` |
| `functions/src/routes/stories-expirar.ts` | Alterar — `/feed/roles-realizados` e `/feed/carga` |
| `functions/src/index.ts` | Alterar — `app.use("/atividades", …)` |
| `functions/src/routes/posts.ts`, `telemetria.ts`, `roles.ts`, `participacao.ts`, `aprovacoes.ts`, `inscricao-evento.ts`, `eventos.ts`, `locais.ts`, `avaliacao-local.ts`, `avaliacao-evento.ts`, `checkin-local.ts` | Alterar — gancho da seção 5.7 |
| `functions/src/lib/post-foto-publico.ts`, `functions/src/types/post-foto.ts` | Alterar — curtida no detalhe |
| `functions/src/lib/notificacoes.ts` | Alterar — `comentario_atividade` |
| `functions/src/routes/perfil.ts` | Alterar — limpeza da seção 7 |
| `firestore.indexes.json` | Alterar — seção 3.6 |
| `src/types/atividade.ts` | Novo |
| `src/app/(app)/page.tsx` | Alterar — `TelaInicio` |
| `src/app/(app)/explorar/page.tsx` | Novo — `TelaFeed` |
| `src/app/(app)/inicio/` | Novo — componentes, hooks, service e CSS da seção 9 |
| `src/app/(app)/atividades/[id]/` | Novo — seção 9.8 |
| `src/components/comentarios/` | Novo — `ItemComentario` e `CampoComentario` movidos |
| `src/app/(app)/perfil/[uid]/fotos/[postId]/` | Alterar — imports movidos e coração |
| `src/app/(app)/feed/components/TelaFeed.tsx` | Alterar — sai stories, banner e avaliação pendente |
| `src/components/menu-inferior/` | Alterar — itens, ativo; apagar `useMostrarFila` |
| Arquivos da seção 8.3 | Alterar — `/explorar` |
| `.cursor/rules/tech-stack.mdc`, `.cursor/rules/project-context.mdc` | Alterar — coleções, rotas, Início e Explorar |

---

## 13. Relação

| Spec | Relação |
|------|---------|
| **003 / 022 / 023 / 024** | O feed por raio continua inteiro, em `/explorar` |
| **007 / 038** | A Fila sai do dock. O banner do líder no Início e o Gerenciar do rolê levam até ela |
| **049** | A faixa de stories muda do Explorar para o Início, sem mudar o comportamento |
| **053** | A lista de quem eu sigo define o feed. Seguir ou deixar de seguir muda a próxima carga |
| **057** | A tabela “o que não entra” da 057 deixava a timeline na home de fora. Esta spec cobre isso. A conversa da foto continua uma só, e o post ganha o coração |
| **030 / 058** | Só telemetria pública vira item. A medalha segue a regra do leitor que não é dono |
| **013 / 042** | O push novo usa `title`, `url` e o clique que já abre a rota |
| **039** | O `DELETE /perfil` ganha atividades, curtidas e comentários |
