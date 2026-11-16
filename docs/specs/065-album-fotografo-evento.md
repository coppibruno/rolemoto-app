# SPEC 065 — Álbum do fotógrafo no evento

> **Status:** Implementada  
> **Autor:** Assistente IA  
> **Data:** 2026-11-16  
> **Origem:** admin autoriza um fotógrafo na ocorrência; ele publica links https do álbum; inscritos recebem push na 1ª publicação; o Início registra a atividade  
> **Padrões:** Next.js 15 App Router — skill `nextjs-patterns`; visual — skill `desenvolvimento-design`  
> **Backend:** Cloud Function `api` — `eventosRouter` (fotógrafo + álbuns), push em `lib/notificacoes.ts`, gancho de feed em `lib/atividade-gancho.ts`  
> **Coleções:** `eventos` (campos novos). Lê `usersevento`, `users`, `atividades`  
> **Depende de:** SPEC 022 (evento), SPEC 026 (inscrição), SPEC 031 (detalhe), SPEC 048 / 013 / 042 (push), SPEC 053 (busca de piloto), SPEC 063 (feed amigos)  
> **QA:** IDs **AF1**–**AF7**, um PR por ID

O encontro termina e as fotos ficam fora (Google Photos, Drive, etc.). O app não hospeda o álbum: só guarda o link, avisa quem foi e mostra no Início.

---

## 1. Objetivo

| ID | Entrega | Camada |
|----|---------|--------|
| **AF1** | Validar https, classificar 1ª publicação vs republicação, frase do push — lib pura com teste | Back (lib) |
| **AF2** | Campos `fotografoId`, `albuns`, `albumNotificado` no evento + métodos no repositório | Back |
| **AF3** | `POST|DELETE /eventos/:id/fotografo` (só admin) | Back |
| **AF4** | `POST|DELETE /eventos/:id/albuns` (fotógrafo ou admin); push só na 1ª; atividade no feed | Back |
| **AF5** | Enriquecer `GET /eventos/:id` e limpeza no `DELETE` do evento / perfil | Back |
| **AF6** | Bloco álbum no detalhe + CTA Abrir álbum + `?album=1` | Front |
| **AF7** | Admin autoriza fotógrafo; fotógrafo adiciona/remove links; card no Início | Front |

---

## 2. Recorte

### 2.1 O que entra

- Um **fotógrafo** por ocorrência (`eventos` doc), definido só por **admin**.
- Qualquer conta pode ser fotógrafo (não precisa estar inscrita).
- O fotógrafo (ou o admin) publica **um ou mais links https** de álbum externo.
- Publicar **sempre** é permitido (antes, durante ou depois do evento; inclusive cancelado — o álbum ainda serve).
- **Push** só para **inscritos** (`usersevento`), na **primeira** vez que o evento passa de zero álbuns para pelo menos um. Adicionar outro link ou republicar não manda push de novo.
- Ao **trocar ou remover** o fotógrafo, os álbuns **permanecem**.
- No **detalhe** `/eventos/[id]`: bloco com lista de links + formulário para quem pode publicar + gestão do fotógrafo para admin.
- Query `?album=1` rola até o bloco e destaca.
- No **Início**, item de conteúdo `album_evento` (curtir sim; comentar não no MVP).

### 2.2 O que não entra

| Item | Motivo |
|------|--------|
| Upload de fotos no Rolemoto | O pedido é link externo |
| Vários fotógrafos na mesma data | Um só; troca via admin |
| Moderação do link pelo admin depois | Admin já escolheu a pessoa |
| Whitelist de hosts | Qualquer `https` válido |
| Preferência “não receber push de álbum” | Sem tela de prefs |
| Push para a base inteira | Só inscritos |
| Comentário no card do feed | Destino é o álbum externo |
| Álbum em rolê ou local | Esta spec é evento |

### 2.3 Decisões travadas

| Decisão | Escolha |
|---------|---------|
| Quem vira fotógrafo | Qualquer uid; só admin concede / remove |
| Quantos fotógrafos | Um por ocorrência |
| Quantos links | Até **5** por evento |
| Quando publica | Sempre |
| Audiência do push | Só inscritos (`usersevento`), menos quem publicou |
| Republicar / 2º link | Sem novo push; `albumNotificado` fica `true` |
| Trocar / remover fotógrafo | Álbuns ficam |
| Link | `https` absoluto; sem lista de hosts |
| Cliente | Firestore deny-all; só via Functions |
| Id da atividade | `album_evento_{eventoId}` — um por evento |

### 2.4 Caminho

1. Admin abre o detalhe → **Autorizar fotógrafo** → busca piloto → confirma.
2. Fotógrafo (ou admin) cola URL https → **Adicionar álbum**.
3. Se era o primeiro link do evento: push aos inscritos + atividade no feed.
4. Inscrito toca o push → `/eventos/{id}?album=1` → bloco em destaque.
5. No Início, quem segue o fotógrafo (ou o próprio) vê o card e abre o mesmo detalhe.

---

## 3. Dados

### 3.1 Campos novos em `eventos`

```
{
  // …campos atuais…
  fotografoId: string | null,     // docs antigos = null
  albuns: AlbumEvento[],          // docs antigos = []
  albumNotificado: boolean        // docs antigos = false; true após o 1º push
}
```

```
AlbumEvento {
  id: string,           // autoId curto no servidor
  url: string,          // https absoluto
  createdAt: string,    // ISO
  criadoPor: string     // uid de quem adicionou
}
```

Não criar coleção nova. Array no doc do evento (teto 5). Sem índice composto.

`fotografoId`, `albuns` e `albumNotificado` **não** entram no `EventoPublicacao` de criação/edição de ocorrência da série: default `null` / `[]` / `false` no create. Ajuste de data da série **não** apaga fotógrafo nem álbuns (campos ficam de fora do `atualizarOcorrencia`).

### 3.2 Leitura no detalhe

`GET /eventos/:id` passa a devolver, além do contrato atual:

```
{
  fotografo: {
    uid: string,
    nome: string,
    apelido: string,
    fotoUrl: string
  } | null,
  albuns: { id: string, url: string, createdAt: string }[],
  possoPublicarAlbum: boolean,      // token é fotógrafo ou admin
  possoGerenciarFotografo: boolean  // token é admin
}
```

`criadoPor` não sai na API pública do álbum. Feed e listagem (`GET /eventos`) **não** precisam dos álbuns no MVP; o CTA “Abrir álbum” é no detalhe.

### 3.3 Atividade (SPEC 063)

| Campo | Valor |
|-------|-------|
| `tipo` | `album_evento` (**TipoConteudo**) |
| `id` | `album_evento_{eventoId}` |
| `autorId` | quem adicionou o **primeiro** link (não muda se outro uid adicionar o 2º) |
| `alvoTipo` | `evento` |
| `alvoId` | `eventoId` |
| `refId` | `eventoId` |
| `createdAt` | hora do primeiro álbum |

Adicionar mais links **não** altera a atividade. Remover **todos** os álbuns remove a atividade. Se depois alguém publicar de novo: nova atividade (mesmo id, `merge`/registrar de novo) e **sem** push (`albumNotificado` já true).

`DELETE /eventos/:id` remove atividades do alvo incluindo `album_evento`.

---

## 4. Lib pura (AF1)

Arquivo `functions/src/lib/album-evento.ts` — sem Firestore.

| Função | Comportamento |
|--------|----------------|
| `validarUrlAlbum(url)` | Trim; exige `https:` com host; rejeita `http`, relativo, javascript; máx. 2048 chars. Devolve URL normalizada ou erro |
| `deveNotificarAlbum(albunsAntes, albumNotificado)` | `true` só se `albunsAntes.length === 0` e `albumNotificado === false` |
| `fraseAlbum(apelido, titulo)` | `{apelido} adicionou as fotos de {titulo}`; título vazio → `o evento` |
| `podePublicarAlbum(uid, fotografoId, admin)` | uid === fotografoId ou admin |
| `tetoAlbuns` | constante `5` |

---

## 5. API

Tudo em `eventosRouter` (ou router irmão montado no mesmo prefixo), com `autenticar` + `rateLimitAutenticado`. Rotas **não** importam Firestore.

### 5.1 `POST /eventos/:id/fotografo`

Body `{ usuarioId: string }`. Só `isAdmin`.

| Caso | Resposta |
|------|----------|
| Sem token | 401 |
| Não admin | 403 `{ erro: "apenas administradores" }` |
| Body inválido / uid vazio | 400 |
| Evento inexistente | 404 |
| Perfil do `usuarioId` inexistente | 404 `{ erro: "piloto não encontrado" }` |
| Ok (novo ou troca) | 200 `{ fotografoId }` |

Trocar fotógrafo **não** apaga `albuns` nem `albumNotificado`.

### 5.2 `DELETE /eventos/:id/fotografo`

Só admin. Zera `fotografoId`. Álbuns ficam. 204. 404 se evento ausente. Se já era `null`, 204 idempotente.

### 5.3 `POST /eventos/:id/albuns`

Body `{ url: string }`. Fotógrafo autorizado **ou** admin.

| Caso | Resposta |
|------|----------|
| Sem permissão | 403 `{ erro: "sem permissão para o álbum" }` |
| Sem fotógrafo e não admin | 403 (admin pode publicar mesmo sem fotógrafo definido) |
| URL inválida | 400 `{ erro: "informe um link https válido" }` |
| Já tem 5 | 400 `{ erro: "limite de 5 álbuns" }` |
| URL duplicada (mesmo href normalizado) | 400 `{ erro: "este link já está no evento" }` |
| Ok, não é a 1ª notificação | 201 `{ album, notificou: false }` |
| Ok, 1ª notificação | 201 `{ album, notificou: true }` — grava `albumNotificado: true`, push, atividade |

Falha de push não desfaz o álbum (log warn).

### 5.4 `DELETE /eventos/:id/albuns/:albumId`

Fotógrafo ou admin. Remove o item do array. Se zerar a lista, remove atividade `album_evento`. **Não** reseta `albumNotificado`. 204. 404 se álbum ou evento ausente.

### 5.5 Enriquecimento e exclusões

- `GET /eventos/:id`: campos da seção 3.2.
- `DELETE /eventos/:id`: já remove atividades do evento; incluir `album_evento` na lista de tipos.
- `DELETE /perfil`: se o uid era `fotografoId` de algum evento, **não** apaga os álbuns; opcionalmente zera `fotografoId` em batch (recomendado: sim, para não deixar uid órfão). Álbuns ficam.

---

## 6. Push

Tipo novo: `album_evento` em `TipoPush`.

| Campo | Valor |
|-------|--------|
| `title` | `Fotos do evento disponíveis` |
| `body` | `fraseAlbum(apelidoExibicao, titulo)` |
| `url` | `/eventos/{eventoId}?album=1` |
| `eventoId` | id do path |
| `roleId`, `localId` | `""` |

Destinatários: uids de `usuarioEventoRepository.listarPorEvento`, menos o uid que publicou. Sem teto especial (mesmo padrão dos lembretes de inscritos). Quem não tem token FCM simplesmente não recebe.

Toast com app aberto: mostra `title` (padrão atual). Clique: `data.url` (SW / FCM nativo já abrem).

---

## 7. Front

Tokens e CSS Modules do detalhe do evento. Sem mock novo.

### 7.1 Bloco álbum (`BlocoAlbumEvento`)

No `TelaDetalheEvento`, depois de presenças / antes da avaliação.

- Título **Álbum de fotos**.
- Se `albuns.length === 0` e não pode publicar: bloco oculto (não polui).
- Lista: cada item botão/link **Abrir álbum** (`target=_blank`, `rel=noopener noreferrer`) com domínio legível.
- Quem `possoPublicarAlbum`: input URL + **Adicionar**; cada item com **Remover**.
- `id="album-evento"` para o scroll de `?album=1`. Com a query, após carregar: `scrollIntoView` + classe de destaque ~2 s.

### 7.2 Admin — fotógrafo

Se `possoGerenciarFotografo`:

- Sem fotógrafo: botão **Autorizar fotógrafo** → tela `/eventos/[id]/fotografo` (busca igual à SPEC 054 / `/pilotos`, um uid só).
- Com fotógrafo: chip com nome/foto + **Trocar** + **Remover**.

### 7.3 Feed Início

Card de conteúdo para `album_evento`:

- Texto: **{apelido} publicou as fotos de {titulo}**.
- Capa do evento.
- CTA abre `/eventos/{id}?album=1`.
- Curtir sim; comentários não (`aceitaComentario` = false para este tipo — ou tratar como conteúdo sem comentário na UI).

Incluir `album_evento` em `TipoConteudo` no front e no back.

---

## 8. Critérios de aceite

### AF1 — lib

- [ ] `https://photos.google.com/x` ok; `http://…` e `ftp://…` falham.
- [ ] `deveNotificarAlbum([], false)` true; `([a], false)` false; `([], true)` false.
- [ ] `fraseAlbum("Lia", "Velharia")` → `Lia adicionou as fotos de Velharia`.

### AF2 — persistência

- [ ] Create de evento grava `fotografoId: null`, `albuns: []`, `albumNotificado: false`.
- [ ] Docs antigos leem defaults seguros no mapper.

### AF3 — fotógrafo

- [ ] Não-admin → 403.
- [ ] Admin define e troca sem apagar álbuns.
- [ ] DELETE zera só `fotografoId`.

### AF4 — álbuns + push + feed

- [ ] 1º POST cria álbum, `albumNotificado=true`, push só inscritos, atividade `album_evento_{id}`.
- [ ] 2º POST não manda push; atividade permanece.
- [ ] DELETE último álbum remove atividade; `albumNotificado` permanece true.
- [ ] Novo POST depois disso: álbum volta, atividade volta, **sem** push.

### AF5 — GET / DELETE

- [ ] Detalhe traz `fotografo`, `albuns`, flags de permissão.
- [ ] Apagar evento remove a atividade.

### AF6 / AF7 — UI

- [ ] Admin autoriza; fotógrafo adiciona link; inscrito vê push e cai no bloco.
- [ ] Card no Início para quem segue o fotógrafo.
- [ ] `?album=1` destaca o bloco.

---

## 9. Testes e deploy

- Unitários: `album-evento.test.ts` + extensão dos testes de atividade (tipo novo).
- Rotas: testes de integração no padrão de `convite-evento` / `eventos` (mock de repos).
- `npm test` (functions), lint/tsc do predeploy front e functions.
- Deploy: `firebase deploy --only functions` (e hosting se o front for pelo mesmo pipeline).
- Local: `npm run emulators`, `npm run dev`, `cd functions && npm run build:watch`.
`)