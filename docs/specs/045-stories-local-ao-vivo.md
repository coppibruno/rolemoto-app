# SPEC 045 — Stories ao vivo no local e no evento

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-10-21  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade (skill `nextjs-patterns`)  
> **Backend:** Cloud Function `api` (Express) — `POST|GET /locais/:id/stories` e `POST|GET /eventos/:id/stories`; anéis em `GET /stories/ao-vivo`; vínculo `evento.localId`; push `story_local`  
> **Coleções Firestore:** `userslocalstory` (**nova**); `userslocalstoryvisto` (**nova**); campo `storyPushYmd` em `locais` e em `eventos`; campo `localId` em `eventos`  
> **Depende de:** SPEC 013 (FCM + `dispositivos` + `lib/notificacoes.ts`), SPEC 022 (eventos), SPEC 023 (locais), SPEC 026 (inscrição), SPEC 028 (favorito), SPEC 031 (detalhe), SPEC 044 (raio/precisão de presença — **sem** amarrar no check-in)  
> **Fase:** 1 — foto 24 h no ponto **e** no encontro, faixa nas abas Locais e Eventos, push só na primeira do dia

---

## 1. Objetivo

Quem chegou posta **uma foto** que some em 24 h. Vale nos dois lugares em que o piloto para:

| Onde está | Exemplo | Onde a foto fica |
|-----------|---------|------------------|
| Ponto oficial | Café, posto, mirante | Álbum do **local**. Pode postar a qualquer hora |
| Encontro com data | Track day, moto point de hoje, exposição | Álbum do **evento**, se o encontro não é um ponto do catálogo |
| Encontro **num** ponto do catálogo | Hoje no Velharia, e o Velharia já é um local | **O mesmo álbum do local.** Não existem duas fotos da mesma hora |

O ponto é permanente. O evento é a ocorrência. Quando os dois são o mesmo chão, a galera vê um rolo só — no detalhe do café e no detalhe do encontro.

Hoje `eventos.local` é só `{ lat, lng, nome, endereco }`, sem apontar para o catálogo. Esta spec cria `evento.localId` para unir os álbuns. Sem esse campo, o evento tem story própria (o track day não precisa virar “local”).

| Camada | Responsabilidade |
|--------|------------------|
| Front | Faixa de anéis nas abas Locais e Eventos, player, CTA **Postar foto** no detalhe do local e no detalhe do evento (enquanto o encontro está rolando), upload no Storage, GPS pontual |
| Back | Validar raio/precisão/janela/teto, gravar no álbum certo, push da 1ª foto do dia, expirar |

`usuarioId` **nunca** vem do body. Timestamps só no servidor. Lat/lng do body são a posição **do piloto**, não a do local, e **não** voltam na API.

---

## 2. Recorte e princípios

### 2.1 O que entra

- `evento.localId: string | null` — opcional no `POST /eventos`; `PATCH /eventos/:id` admin só com `{ localId }` para eventos já criados (Velharia).
- Coleção `userslocalstory` (id auto). `expiresAt` = `createdAt` + 24 h. Campo `album`: `"local"` ou `"evento"`.
- `POST|GET /locais/:id/stories` e `POST|GET /eventos/:id/stories`. `DELETE` só do autor, enquanto não expirou.
- `POST …/stories/visto` no local e no evento — marca o álbum que o player está mostrando.
- `GET /stories/ao-vivo?aba=locais|eventos` — anéis da faixa daquela aba.
- Push na **primeira** story do dia-calendário `America/Sao_Paulo` daquele álbum. Autor fora. Próximas fotos do mesmo dia **não** geram push.
  - Álbum do local: favoritos do ponto ∪ inscritos do evento que está aberto ali.
  - Álbum do evento (sem `localId`): só inscritos daquele encontro.
- Faixa **Ao vivo** no topo das abas Locais e Eventos. Player fullscreen. CTA **Postar foto** no detalhe do local (sempre) e no detalhe do evento (só enquanto está ao vivo).
- Storage em `stories/locais/…` e `stories/eventos/…`.
- Job diário que apaga doc expirado **e** o objeto no Storage.

### 2.2 O que **não** entra

| Item | Motivo |
|------|--------|
| Timeline / feed de posts | Muda o produto; a 044 já recusou presença ao vivo |
| Lista “quem está aqui agora” | Privacidade + tela vazia |
| Push a cada foto | Spam; o teto é 1× por local por dia |
| Sino, inbox, badge no dock | Mesmo recorte da 013 |
| Topics FCM | Fan-out explícito por uid basta |
| Story de rolê / comboio | Outro verbo |
| Amarrar o post no check-in ou auto-check-in | Verbos distintos (decisão de produto) |
| Legenda, vídeo, figurinha, reação, resposta | v1 é uma foto |
| Galeria permanente | Story some em 24 h; o que fica é a avaliação (027) |
| Gate pelo horário de funcionamento do local | Moto point à noite ficaria mudo. No **evento**, a janela é a do encontro |
| Denúncia / moderação | Autor apaga a própria. Denúncia = spec seguinte se aparecer abuso |
| 4ª aba no feed | A faixa vive dentro de Locais e dentro de Eventos |
| Push nativo APK como critério de aceite | SPEC 042 ainda descartada para reescrita. Esta spec usa o `enviar` que já existe (web + nativo). APK pode falhar até a 042 — não bloqueia |
| Reescrever o pin do evento ao setar `localId` | O FK não mexe em `evento.local` já gravado |

### 2.3 Não misturar

| Verbo | Significado | Onde vive |
|-------|-------------|-----------|
| Favorito | Quero este ponto | `userslocalfavorito` |
| Check-in | Estive aqui (selo) | `userslocalcheckin` — SPEC 044 |
| Avaliação | O que achei, permanente, com relato | `userslocalfeedback` / `userseventofeedback` — SPEC 027 |
| Story | Estou aqui **agora**; some em 24 h | `userslocalstory` — local ou evento |
| Inscrição | Vou neste encontro | `usersevento` — SPEC 026 |

Postar foto **não** grava check-in e **não** cria avaliação. Foto da 027 continua no relato.

### 2.4 Decisões travadas

| Decisão | Escolha |
|---------|---------|
| Onde se posta | Local **e** evento. Dois CTAs, dois GPS |
| Álbum quando o evento tem `localId` | O do local. `POST /eventos/:id/stories` grava `album: "local"` |
| Álbum quando o evento não tem `localId` | O do evento (`album: "evento"`). Track day não precisa existir no catálogo de locais |
| Quem posta | Qualquer autenticado **no raio** (400 m, precisão ≤ 80 m). Inscrição **não** é exigida para postar |
| Quando posta no evento | Só com o encontro ao vivo. Fora da janela o player ainda mostra o que não expirou, mas o CTA some |
| GPS vs check-in | Mesmas constantes de [`functions/src/lib/checkin-local.ts`](../../functions/src/lib/checkin-local.ts) (`RAIO_CHECKIN_KM`, `PRECISAO_MAX_M`). **Não** chama `registrarCheckin` |
| GPS no evento com `localId` | Vale estar a 400 m do **pin do evento** ou do **pin do local** (os dois cadastros podem divergir um pouco) |
| Quem escolhe o álbum | Servidor. Cliente não manda `eventoId` nem `album` |
| Dois eventos abertos no mesmo ponto | O de `dataHoraAbertura` mais recente veste o álbum do local |
| Evento sem `dataHoraEncerramento` | Não está ao vivo. Fim = `dataHoraEncerramento ?? dataHoraAbertura` (ver `eventoEncerrou` em [`functions/src/lib/historico.ts`](../../functions/src/lib/historico.ts)). Sem encerramento a janela é vazia: não posta no evento e o encontro não veste o local |
| Push | 1× por álbum por dia `YYYY-MM-DD` em `America/Sao_Paulo` |
| Teto de fotos | 5 por uid por álbum em janela **móvel** de 24 h. Postar pelo evento que aponta para um local **gasta o teto daquele local** |
| Nome no push e no player | `apelidoExibicao` ([`functions/src/lib/apelido.ts`](../../functions/src/lib/apelido.ts)): apelido, senão o primeiro nome, senão `"piloto"` |
| Ordem no player | Mais antiga → mais nova (gesto de status) |
| Capa do anel | Foto **mais recente** ainda não expirada |

---

## 3. Fluxo

```
Detalhe /locais/:id  (café, posto, mirante)
  → Postar foto → GPS → upload stories/locais/{localId}/{uid}/{uuid}.jpg
  → POST /locais/:id/stories { lat, lng, accuracy, fotoUrl }
  → no raio do local? teto 5 / 24 h?
  → se houver evento com esse localId aberto agora: grava eventoId (mesmo álbum)
  → 1º do dia no local → push (favoritos ∪ inscritos)

Detalhe /eventos/:id  (encontro rolando agora)
  → Postar foto → GPS → upload no prefixo do álbum de destino
  → POST /eventos/:id/stories { lat, lng, accuracy, fotoUrl }
  → encontro ao vivo?
  → se tem localId: mesma gravação do local (raio do pin do evento OU do local)
  → se não tem: álbum do evento (raio do pin do evento) → push só aos inscritos

Faixa Ao vivo
  → aba Locais:  GET /stories/ao-vivo?aba=locais&lat&lng&raioKm
  → aba Eventos: GET /stories/ao-vivo?aba=eventos&lat&lng&raioKm
  → toque no anel → player do álbum → POST …/visto

Push
  → álbum do local  → /locais/:id?stories=1
  → álbum do evento → /eventos/:id?stories=1
```

Permissão de GPS negada: não fingir post. Copy: “Precisamos da localização na hora para postar a foto.”

Permissão de notificação: **não** pedir neste fluxo. Quem já tem token (SPEC 013) recebe. Quem não tem, vê o anel quando abrir o app.

---

## 4. Vínculo evento ↔ local

### 4.1 Campo

`eventos.localId: string | null`. Docs antigos sem o campo são lidos como `null`.

`local` (lat/lng/nome/endereco) **permanece** obrigatório. O FK é extra. Setar `localId` **não** reescreve o pin.

### 4.2 `POST /eventos` (admin)

Body ganha `localId` opcional.

| Caso | Resultado |
|------|-----------|
| Ausente, `null` ou `""` | Grava `localId: null` |
| String de um local existente | Grava o id |
| String de local inexistente | 400 `{ erro: "local não encontrado" }` |

### 4.3 `PATCH /eventos/:id` (admin)

Único body aceito nesta spec:

```
{ "localId": string | null }
```

| Status | Quando | `erro` |
|--------|--------|--------|
| 200 | Atualizado | — |
| 400 | Campo ausente ou tipo errado | `localId é obrigatório` |
| 400 | Id que não existe | `local não encontrado` |
| 403 | Não admin | (o que `exigirAdmin` já devolve) |
| 404 | Evento inexistente | `Evento não encontrado` |

`null` desamarra. Não altera título, datas nem `local`.

Resposta 200: o `Evento` (com `localId`).

### 4.4 Cadastro `/criar-evento`

Campo opcional **Ponto oficial**, acima de `CampoLocalEvento`. Lista vem de `GET /locais` (catálogo; o admin já está autenticado).

- Escolher um ponto preenche `localId` **e** sugere nome/endereço/lat/lng no campo de local (o admin ainda pode ajustar o pin).
- Limpar o ponto manda `localId: null`.
- Hint, uma linha: “Se este encontro é num ponto do catálogo, as fotos ficam no mesmo rolo desse ponto. Se não for, o encontro tem as fotos dele.”
- Sem encerramento, ninguém posta no evento e o encontro não veste o local. Não bloquear o submit — o hint basta.

Eventos já no ar (Velharia) não têm tela de edição. O `PATCH` existe para o backfill. Não criar tela de edição completa nesta spec.

### 4.5 Evento ao vivo

Um evento está **ao vivo** quando:

1. `Date.parse(dataHoraAbertura) <= agora`.
2. `agora < Date.parse(dataHoraEncerramento ?? dataHoraAbertura)`.

Ele **veste** o álbum de um local quando, além disso, `localId` é esse local. Se mais de um passar, fica o de `dataHoraAbertura` maior. Query: `localId ==` + `dataHoraAbertura` DESC, teto 5, filtro em memória. Índice: `localId` ASC + `dataHoraAbertura` DESC.

O `eventoId` gravado na story do local é o dessa escolha **no momento do POST**. Não recalcula depois. O rótulo do anel e a copy do push usam o evento que está ao vivo **agora**, não o id histórico da foto mais antiga.

Fora dessa janela, `POST /eventos/:id/stories` responde 400. Fotos já gravadas continuam no player até `expiresAt`.

---

## 5. Contrato HTTP

Todas as rotas de story exigem `autenticar`. Uid só do token.

### 5.1 `POST /locais/:id/stories`

```
{ lat: number, lng: number, accuracy: number, fotoUrl: string }
```

`accuracy` em metros. Reusar `validarBodyCheckin` para lat/lng/accuracy. A copy de **raio** desta rota é outra: o helper de presença da 044 diz “marcar presença”; aqui a rota traduz para a copy abaixo se `validarPresenca` falhar.

| Status | Quando | `erro` |
|--------|--------|--------|
| 201 | Criada | — |
| 400 | lat/lng inválidos | `lat e lng são obrigatórios` |
| 400 | Precisão ausente ou > 80 m | `GPS impreciso. Tente ao ar livre.` |
| 400 | Fora do raio | `Chegue mais perto para postar a foto` |
| 400 | `fotoUrl` vazia ou fora do prefixo | `foto inválida` |
| 404 | Local inexistente | `Local não encontrado` |
| 429 | Já há 5 stories deste uid neste local com `createdAt` nas últimas 24 h | `Você já postou 5 fotos neste ponto hoje` |
| 401 | Sem Bearer | `Não autenticado` |

`fotoUrl` só passa se for `https` e o path do objeto for `stories/locais/{localId}/{uid}/{arquivo}` com o `uid` do token e o `localId` da URL. Não baixar a imagem no servidor.

Resposta 201 (shape público — sem lat/lng). `album` é sempre `"local"` nesta rota:

```
{
  id: string,
  album: "local",
  localId: string,
  eventoId: string | null,
  fotoUrl: string,
  createdAt: string,
  expiresAt: string,
  autor: { uid: string, apelido: string, fotoUrl: string }
}
```

`apelido` aqui é o retorno de `apelidoExibicao`, não o campo cru.

Falha de FCM **não** vira erro do POST. O `await` do push acontece **antes** do `res.status(201)`, como na 013. Zero destinatários ou emulator: 201 mesmo assim.

### 5.2 `POST /eventos/:id/stories`

Mesmo body. O servidor escolhe o álbum:

| Evento | Álbum gravado | Raio aceito | Prefixo da `fotoUrl` |
|--------|---------------|-------------|----------------------|
| Ao vivo **com** `localId` | `album: "local"`, `localId` do FK, `eventoId` deste encontro | 400 m do pin do evento **ou** do local | `stories/locais/{localId}/{uid}/…` |
| Ao vivo **sem** `localId` | `album: "evento"`, `localId: null`, `eventoId` da URL | 400 m do pin do evento | `stories/eventos/{eventoId}/{uid}/…` |
| Fora da janela, ou sem encerramento | — | — | 400 `{ erro: "Este encontro não está rolando agora" }` |

Demais erros iguais ao POST do local (`foto inválida`, GPS, 429, 404 `Evento não encontrado`). O 429 do álbum compartilhado usa a copy do local (“neste ponto”), porque é o mesmo teto. No álbum próprio do evento: `Você já postou 5 fotos neste encontro hoje`.

A resposta 201 traz `album: "local" | "evento"`. No álbum do evento, `localId` vem `null`.

Postar por aqui num evento com `localId` **é** o mesmo POST do local: um doc, um teto, um `storyPushYmd` do local. Não dispara um segundo push “do evento”.

### 5.3 `GET /locais/:id/stories` e `GET /eventos/:id/stories`

Só docs com `expiresAt > agora`, `createdAt` ASC. Teto 50.

- Local: `album == "local"` e `localId == id`.
- Evento com `localId`: **as mesmas** stories desse local (o player do encontro mostra o rolo do ponto).
- Evento sem `localId`: `album == "evento"` e `eventoId == id`.

```
{
  album: "local" | "evento",
  localId: string | null,
  eventoId: string | null,
  eventoAoVivo: { id: string, titulo: string } | null,
  stories: [ { id, album, localId, eventoId, fotoUrl, createdAt, expiresAt, autor } ]
}
```

Alvo inexistente: 404. Lista vazia é 200 com `stories: []`.

### 5.4 `DELETE /locais/:id/stories/:storyId` e `DELETE /eventos/:id/stories/:storyId`

| Status | Quando |
|--------|--------|
| 204 | Autor apagou (doc + objeto no Storage, best-effort) |
| 403 | Story de outro uid `{ erro: "só o autor apaga" }` |
| 404 | Não existe, não pertence a esse álbum, ou já expirada |

No evento com `localId`, o DELETE aceita story do álbum daquele local. Não reverte `storyPushYmd`.

### 5.5 `POST /locais/:id/stories/visto` e `POST /eventos/:id/stories/visto`

```
{ "storyId": string }
```

O visto é do **álbum que o player abriu**. Id do doc:

- álbum do local: `{usuarioId}_local_{localId}`
- álbum do evento: `{usuarioId}_evento_{eventoId}`

`vistoAte` = `createdAt` da story, só se for mais novo. Story de outro álbum, expirada ou inexistente: 404. Resposta 204. Idempotente.

Registrar `visto` **antes** de `:storyId` em cada router.

### 5.6 `GET /stories/ao-vivo`

Query obrigatória `aba=locais|eventos`. Geo opcional (`lat`, `lng`, `raioKm`), a mesma família do feed. Sem geo válido: **não** lista o mapa inteiro. `aba` ausente ou inválida: 400 `{ erro: "aba inválida" }`.

| `aba` | Com ponto e raio | Sem ponto |
|-------|------------------|-----------|
| `locais` | Locais no raio com story de álbum `"local"` | Favoritos do uid com story ativa, teto 20 |
| `eventos` | Encontros **ao vivo** no raio cuja contagem de story do álbum (local vinculado, ou o próprio evento) é > 0 | Encontros ao vivo em que o uid está inscrito e a contagem é > 0, teto 20 |

Sem raio (pill “sem limite”): até 20 anéis, foto mais recente primeiro. Candidatos de evento: reusar a listagem que o feed de eventos já faz e filtrar “ao vivo” + contagem. Teto 20 antes de hidratar stories, para não varrer o catálogo.

Cada anel:

```
{
  album: "local" | "evento",
  localId: string | null,
  eventoId: string | null,
  nome: string,
  fotoUrl: string,
  contagem: number,
  naoVisto: boolean,
  eventoAoVivo: { id: string, titulo: string } | null
}
```

Na aba Eventos, `nome` é o título do encontro e `eventoId` sempre vem. Se o álbum é o do local, `localId` vem preenchido e `album` é `"local"` — o toque abre o player desse local, com o rótulo do encontro. Na aba Locais, `eventoId` do anel pode ser null; `eventoAoVivo` traz o encontro que está vestindo agora.

`fotoUrl` = foto mais recente. `naoVisto` = existe story ativa com `createdAt` maior que `vistoAte` **e** autor ≠ uid. A própria foto não acende o anel.

Ordem: `naoVisto` primeiro, depois quem tem `eventoAoVivo`, depois a foto mais recente. Resposta: `{ aneis: [...] }`. Vazio é 200.

### 5.7 Enriquecer leituras que já existem

`GET /locais/:id` ganha `storiesAtivas` (álbum do local) e `eventoAoVivo`.

`GET /eventos/:id` ganha `localId` (`null` se não houver) e `storiesAtivas` do álbum que o player desse encontro abriria (o do local, se houver FK; senão o do evento). `podePostarStory: boolean` — true só se está ao vivo.

O item do feed de eventos ganha `aoVivo: boolean` (`storiesAtivas > 0`). O número fica no detalhe. Não embutir o array de fotos no feed.

---

## 6. Dados

### 6.1 `userslocalstory`

```
{
  id: string,             // autoId
  usuarioId: string,
  album: "local" | "evento",
  localId: string | null, // null só quando album = "evento"
  eventoId: string | null,
  fotoUrl: string,
  storagePath: string,
  createdAt: timestamp,
  expiresAt: timestamp    // createdAt + 24 h
}
```

Invariante: `album: "local"` exige `localId`. `album: "evento"` exige `eventoId` e `localId: null`.

Lat/lng do piloto **não** são persistidos.

Índices em [`firestore.indexes.json`](../../firestore.indexes.json):

- `album` ASC + `localId` ASC + `expiresAt` ASC
- `album` ASC + `eventoId` ASC + `expiresAt` ASC
- `usuarioId` ASC + `localId` ASC + `createdAt` DESC
- `usuarioId` ASC + `eventoId` ASC + `createdAt` DESC
- `expiresAt` do job de limpeza usa o índice de campo único (não entra em `firestore.indexes.json`)

### 6.2 `userslocalstoryvisto`

Id = `{usuarioId}_local_{localId}` ou `{usuarioId}_evento_{eventoId}`.

```
{
  id: string,
  usuarioId: string,
  album: "local" | "evento",
  localId: string | null,
  eventoId: string | null,
  vistoAte: timestamp,
  updatedAt: timestamp
}
```

Um doc por par uid+álbum. Sem índice extra (leitura por id).

### 6.3 `storyPushYmd`

String `YYYY-MM-DD` em `America/Sao_Paulo`, no doc do **álbum**: `locais/{id}` ou, só para álbum próprio de evento, `eventos/{id}`. **Não** entra no JSON público.

A virada do dia usa `ymdSaoPaulo` em [`functions/src/lib/quando.ts`](../../functions/src/lib/quando.ts). Exportar essa função (hoje é interna).

Concorrência: transação no doc do álbum. Se `storyPushYmd === hoje`, não envia. Senão grava `hoje` e, **depois do commit**, monta a lista e envia. Evento com `localId` transaciona o doc do **local**, nunca o do evento — senão a foto do café e a foto do encontro gerariam dois pushes.

### 6.4 Destinatários do push

Álbum do local:

1. `listarUsuarioIdsPorLocal(localId)` — método **novo** em `UsuarioLocalFavoritoRepository`.
2. Se houver evento ao vivo nesse ponto: `usuarioEventoRepository.listarPorEvento(eventoId)`.
3. União, sem o autor, sem duplicata.
4. Teto **100**. Favoritos mais recentes primeiro (`createdAt` DESC), depois inscritos que faltaram.

Álbum do evento (sem local): só os inscritos, sem o autor, teto 100. Sem favoritos — não há ponto para favoritar.

Índice novo em `userslocalfavorito`: `localId` ASC + `createdAt` DESC.

### 6.5 Storage

Paths:

- Álbum do local: `stories/locais/{localId}/{uid}/{uuid}.jpg`
- Álbum do evento: `stories/eventos/{eventoId}/{uid}/{uuid}.jpg`

Em [`storage.rules`](../../storage.rules), dois `match` (`stories/locais/{alvoId}/{uid}/{arquivo}` e `stories/eventos/{alvoId}/{uid}/{arquivo}`), no mesmo padrão de `avaliacoes/`:

- `read` se autenticado.
- `write` se autenticado, `request.auth.uid == uid` e `imagemValida()` (já limita 10 MB e jpeg/png/webp).

Upload no client, igual capa e avaliação ([`src/lib/storage.ts`](../../src/lib/storage.ts)): `uploadFotoStory(album, alvoId, uid, file)`. O POST só recebe a URL. No evento com `localId`, o client sobe no prefixo **do local** (é esse álbum que o servidor vai aceitar).

Apagar a story: Admin SDK apaga o objeto em `storagePath`. Falha do Storage não impede o 204 (log + segue); o job diário tenta de novo se o doc ainda existir.

---

## 7. Push

Novo tipo em [`functions/src/lib/notificacoes.ts`](../../functions/src/lib/notificacoes.ts): `story_local`.

`PayloadPush` hoje exige `roleId`. Estender com `localId` e `eventoId` (string; `""` quando não houver). Nos quatro tipos atuais os dois vão `""`. Neste tipo, `roleId` vai `""`. O `data` do FCM continua só string.

| Álbum | `title` | `body` | `url` |
|-------|---------|--------|-------|
| Local, com evento ao vivo | `O {titulo} está rolando` | `{apelidoExibicao} postou uma foto no {nomeLocal}` | `/locais/{localId}?stories=1` |
| Local, sem evento | `{nomeLocal} está ao vivo` | `{apelidoExibicao} postou uma foto` | `/locais/{localId}?stories=1` |
| Evento, sem local | `O {titulo} está rolando` | `{apelidoExibicao} postou uma foto` | `/eventos/{eventoId}?stories=1` |

`titulo` do evento e `nome` do local entram crus, sem emoji. Truncar cada um em 60 caracteres se passar (o título do evento já tem teto 80 no cadastro).

Função nova:

```
notificarStory(uids: string[], title: string, body: string, url: string): Promise<void>
```

Um `enviar` por uid, `await` em série ou em lotes pequenos. Erro de um uid não aborta os outros e não falha o POST. Tokens inválidos continuam sendo apagados pelo `enviar` atual.

Foreground: o toast que já existe (`ToastPush`) mostra `title`. Sem card nativo duplicado se `onMessage` consumir — mesmo critério da 013.

Não criar preferência “não me avise de stories” nesta spec. Favoritar o ponto é o opt-in do café. Inscrição é o opt-in do encontro. Sem nenhum dos dois, silêncio — no álbum do local, o inscrito do evento que está vestindo o ponto também entra.

---

## 8. Front

### 8.1 Faixa nas abas Locais e Eventos

O mesmo componente `FaixaStories`, montado por [`TelaFeed.tsx`](../../src/app/(app)/feed/components/TelaFeed.tsx) acima de [`ListaLocais`](../../src/app/(app)/feed/components/ListaLocais.tsx) e de [`ListaEventos`](../../src/app/(app)/feed/components/ListaEventos.tsx). Cada aba chama `GET /stories/ao-vivo?aba=…` com o ponto e o raio que a aba já usa.

- Faixa horizontal, scroll lateral, anéis de ~64 px.
- Some por completo se `aneis.length === 0`.
- Anel com `naoVisto`: borda em `--primary`. Já visto: borda neutra.
- Aba Locais: se `eventoAoVivo`, o nome sob o anel é o título do encontro; senão, o nome do ponto.
- Aba Eventos: o nome é sempre o título do encontro.
- `aria-label`: `Fotos ao vivo de {nome}, {contagem}`.
- Toque abre o player daquele álbum. Não navega embora do feed.

### 8.2 Detalhe do local

Em [`HeroLocal`](../../src/app/(app)/locais/[id]/components/HeroLocal.tsx), se `storiesAtivas > 0`: anel no topo (mesmo componente da faixa) que abre o player.

CTA **Postar foto** (toque ≥ 48 px), visível sempre — não só quando já há story. Estados:

| Estado | UI |
|--------|----|
| Pedindo GPS | Botão em progresso, sem segundo toque |
| Permissão negada | Copy da §3; CTA volta ao normal |
| GPS impreciso / longe | Copy do 400, igual à API |
| Enviando foto | Progresso no botão |
| 429 | A copy do erro, sem retry automático |
| 201 | Player abre na foto nova |

Input: `accept="image/jpeg,image/png"` e `capture="environment"` (câmera traseira no celular; galeria continua possível). Uma foto por post. Limite `MAX_FOTO_BYTES` já em `storage.ts`.

GPS: `getCurrentPosition` com `enableHighAccuracy: true`, `maximumAge: 0`, `timeout: 15000`. **Não** usar o BackgroundGeolocation da telemetria.

O CTA **Estou aqui** da 044 permanece. São dois botões. Postar não muda `checkinProprio`.

### 8.3 Evento

No detalhe `/eventos/[id]`:

- Anel se `storiesAtivas > 0`, abrindo o player do álbum desse encontro (o do local, quando há `localId`).
- CTA **Postar foto** só quando `podePostarStory` (encontro ao vivo). Mesmos estados da §8.2. Fora da janela o botão não aparece — a copy da API não precisa de um botão morto.
- O CTA não exige inscrição. Quem está no pin posta.

No [`EventoCard`](../../src/app/(app)/feed/components/EventoCard.tsx): chip **Ao vivo** se `aoVivo`. O toque no chip abre o player (`/eventos/:id?stories=1` ou, se o álbum for o local, `/locais/:id?stories=1`). O resto do card continua indo para o detalhe.

`?stories=1` abre o player uma vez e sai da URL com `replace`.

O mesmo `BotaoPostarStory` serve local e evento: recebe o alvo e chama o POST correspondente. No evento com `localId`, o upload usa o prefixo do local.

### 8.4 Player

Tela cheia sobre o shell (portal), não rota nova.

- Barras de progresso, uma por story daquele álbum.
- Avanço automático ~5 s; toque na metade direita avança; esquerda volta; segurar pausa.
- Topo: fechar (`aria-label` “Fechar”), `apelido` + foto do autor, tempo relativo (“agora”, “há 12 min”).
- Se a story é do uid: ação **Apagar** com confirmação de uma linha (“Apagar esta foto?”). DELETE e segue para a próxima; se era a última, fecha.
- Safe area (notch e home indicator). O fechar não fica sob o notch.
- Fundo escuro. A foto em `object-fit: contain`. Sem legenda.

Não há player que salta de um anel para o outro. Fechou, voltou para onde estava.

### 8.5 O que não fazer na UI

- Não colocar anel em cada card da lista (a faixa já é o sinal). O card de evento só ganha o chip.
- Não pedir permissão de notificação ao postar.
- Não mostrar lat/lng, “visto por N”, nem lista de quem favoritou.

---

## 9. Expiração

A leitura filtra `expiresAt > agora`. Isso basta para o app não mostrar foto velha mesmo se o job atrasar.

Job, uma vez por dia:

- Rota `POST /interno/stories/expirar` **sem** `autenticar`.
- Header `X-Cron-Secret` igual a `STORIES_CRON_SECRET`. Ausente ou diferente: 404 (a rota não se anuncia).
- Cloud Scheduler (04:00 `America/Sao_Paulo`) chama a function `api` nessa URL.
- Cada execução: até 200 docs com `expiresAt < agora`, apaga o objeto (`storagePath`) e o doc.
- Resposta 200 `{ apagados: number }`. Falha de um objeto: log, apaga o doc mesmo assim, segue.
- Não usar `onSchedule` / segunda Cloud Function. O projeto tem uma function HTTP.
- Emulator: o Scheduler não roda. O filtro do GET cobre o dev. Documentar `STORIES_CRON_SECRET` no `.env.example` das functions (sem valor real).

TTL nativo do Firestore em `expiresAt` **não** entra: apagaria o doc e perderia o `storagePath` antes do job.

---

## 10. IDs de teste

| ID | Área | Critério de aceite |
|----|------|--------------------|
| **S1** | GPS local | Fora do raio do ponto → 400 “Chegue mais perto para postar a foto”. No raio → 201. Permissão negada não grava |
| **S2** | Teto | 6º POST do mesmo uid no mesmo álbum em < 24 h → 429. Outro ponto, ou o álbum de outro evento, não conta |
| **S3** | Check-in | Postar **não** cria `userslocalcheckin` nem selo. Estou aqui continua independente |
| **S4** | Evento no ponto | Encontro ao vivo com `localId`: `POST /eventos/:id/stories` grava `album: "local"`. A mesma foto aparece no player do local e no do evento. Um só push, copy “O {titulo} está rolando”. Fora da janela → 400 “Este encontro não está rolando agora” |
| **S5** | Push | 1ª foto do dia (SP) no álbum do local avisa favoritos e inscritos, uma vez, sem o autor. 2ª foto (pelo local ou pelo evento ligado) não gera outro push. Quem favoritou e se inscreveu recebe um só. Sem token: 201 igual |
| **S6** | Visto | Anel de foto alheia nasce `naoVisto`. Depois do player, o próximo GET daquela `aba` volta `naoVisto: false`. A própria foto não acende o anel |
| **S7** | UI | Aba Locais e aba Eventos mostram a faixa só se houver anel. No detalhe do evento ao vivo o CTA posta. `?stories=1` abre uma vez. Apagar some a foto nos dois players quando o álbum é compartilhado |
| **S8** | Expiração | Story com `expiresAt` no passado não volta no GET. O job apaga doc e objeto. Falha do Storage ainda apaga o doc |
| **S9** | Evento sem ponto | Track day sem `localId`, ao vivo, no raio do pin: 201 com `album: "evento"`. Não aparece na faixa de Locais. Push só para inscritos, url `/eventos/:id?stories=1`. Café sem evento continua na faixa de Locais com “{nome} está ao vivo” |

---

## 11. Fora do escopo

- Denúncia, ocultar foto de terceiro, ban.
- Story em rolê, telemetria ou perfil (“meus stories”).
- Vídeo, texto, múltiplas fotos num POST.
- Reagir, responder, encaminhar para o WhatsApp (o share do detalhe da 031 continua).
- Editar evento inteiro (só o `PATCH` de `localId`).
- Mover a faixa para a home acima das abas.
- Preferência global de silenciar stories.
- Garantir o card no APK (042).
- Apagar o objeto no logout ou no `DELETE /perfil` além do que o job já faz nas stories daquele uid — **entra** uma limpeza best-effort no `DELETE /perfil`: apagar stories daquele `usuarioId` ainda não expiradas (doc + objeto). Não varrer o Storage inteiro.

---

## 12. Arquivos

| Arquivo | Ação |
|---------|------|
| `docs/specs/045-stories-local-ao-vivo.md` | Esta spec |
| `functions/src/types/story-local.ts` | **NOVO** |
| `functions/src/types/evento.ts` | `localId: string \| null` |
| `functions/src/lib/story-local.ts` | **NOVO** — GPS (reusa check-in), janela do evento, teto, transação do ymd |
| `functions/src/lib/quando.ts` | Exportar `ymdSaoPaulo` |
| `functions/src/lib/notificacoes.ts` | Tipo `story_local` + `notificarStory` |
| `functions/src/repositories/interfaces/story-local.repository.ts` | **NOVO** |
| `functions/src/repositories/firestore/firestore-story-local.repository.ts` | **NOVO** |
| `functions/src/repositories/interfaces/usuario-local-favorito.repository.ts` | `listarUsuarioIdsPorLocal` |
| `functions/src/repositories/interfaces/evento.repository.ts` | Buscar abertos por `localId` |
| `functions/src/routes/stories-local.ts` | **NOVO** — rotas de `/locais/:id/stories`, com `visto` antes de `:storyId` |
| `functions/src/routes/stories-evento.ts` | **NOVO** — as mesmas rotas em `/eventos/:id/stories`; escolhe o álbum |
| `functions/src/routes/stories-ao-vivo.ts` | **NOVO** — `GET /stories/ao-vivo` |
| `functions/src/routes/stories-expirar.ts` | **NOVO** — `POST /interno/stories/expirar` |
| `functions/src/routes/eventos.ts` | `localId` no POST + `PATCH /:id` + `storiesAtivas` / `podePostarStory` |
| `functions/src/routes/locais.ts` | `storiesAtivas` + `eventoAoVivo` no GET `/:id` |
| `functions/src/index.ts` | Montar `/stories` e `/interno` |
| `functions/src/repositories/index.ts` | Factory |
| `firestore.indexes.json` | Índices da §6 |
| `storage.rules` | Path `stories/` |
| `src/lib/storage.ts` | `uploadFotoStory` |
| `src/types/story-local.ts` | **NOVO** |
| `src/app/(app)/feed/components/FaixaStories.tsx` | **NOVO** |
| `src/app/(app)/feed/components/ListaLocais.tsx` | Montar a faixa (`aba=locais`) |
| `src/app/(app)/feed/components/ListaEventos.tsx` | Montar a faixa (`aba=eventos`) |
| `src/app/(app)/feed/components/EventoCard.tsx` | Chip Ao vivo |
| `src/app/(app)/components/BotaoPostarStory.tsx` | **NOVO** — local ou evento |
| `src/app/(app)/components/PlayerStories.tsx` | **NOVO** |
| `src/app/(app)/locais/[id]/components/HeroLocal.tsx` | Anel + CTA |
| `src/app/(app)/eventos/[id]/` | Anel + CTA enquanto ao vivo |
| `src/app/(app)/criar-evento/components/CampoPontoOficial.tsx` | **NOVO** — picker opcional |
| `.cursor/rules/tech-stack.mdc` | Coleção, `album` e `localId` no evento, quando for implementar |

Rotas não importam `firestore.collection`. GPS e push ficam em `lib/`, não no JSX.

---

## 13. Ordem sugerida

1. `evento.localId` no tipo, POST, PATCH e picker do cadastro. Backfill do Velharia via PATCH.
2. Coleção, Storage, POST/GET/DELETE do **local** com GPS e teto. Sem push.
3. POST/GET do **evento**: álbum compartilhado quando há `localId`, álbum próprio quando não há. CTA nos dois detalhes.
4. Faixas (Locais e Eventos), player, `visto`.
5. Transação `storyPushYmd` + `notificarStory` (local e evento).
6. `POST /interno/stories/expirar` + Scheduler.
7. S1–S9.

---

## 14. Relação

| Spec | Relação |
|------|---------|
| **013** | Reusa `enviar` e `dispositivos`. Novo tipo, sem inbox |
| **022** | Estende o evento com `localId`. Sem o FK, o encontro tem o próprio rolo de fotos |
| **023** | O local continua ponto permanente. Story não vira atributo do cadastro |
| **026** | Inscritos entram no push. Inscrição não é exigida para postar; a janela do evento, sim |
| **027** | Fotos do relato não são story e o contrário também |
| **028** | Favoritar passa a significar também “me avise se este ponto acordar”, no máximo 1× por dia |
| **031** | Detalhe do local e do evento ganham anel e CTA. Share do header não muda |
| **042** | Quando o push nativo for reescrito, `story_local` sai pelo mesmo `enviar` |
| **044** | Mesmo raio e mesma precisão. Outro verbo, outra copy, outra coleção |
