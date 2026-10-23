# SPEC 047 — Story que abre, com a marca do lugar na foto

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-10-22  
> **Origem:** teste em produção — foto aceita, anel verde, player com “Nenhuma foto ao vivo”  
> **Referência de gesto:** story do Instagram no recorte de **uma marca de lugar** (evento ou local) em cima da foto. Sem texto, figurinha, enquete, música ou “quem viu”.  
> **Padrões:** Next.js 15 App Router — Server Components por padrão; skill `nextjs-patterns`  
> **Backend:** Cloud Function `api` — mesmas rotas da SPEC 045; a leitura do álbum passa a ter o índice que a query já pede  
> **Coleções:** `userslocalstory` (sem campo novo)  
> **Depende de:** SPEC 045 (álbum, GPS, teto, faixa, player)  
> **QA:** IDs **ST1**, **ST2**, **ST3**

---

## 1. Objetivo

O piloto tira uma foto, marca um evento ou um local **em cima da imagem** e, ao publicar, **vê essa foto**. Quem abre o anel vê a mesma foto, com a mesma marca, e o toque na marca leva ao lugar.

Hoje a publicação grava. A tela que deveria mostrar a foto trata a falha da leitura como “não há foto”.

| ID | Entrega |
|----|---------|
| **ST1** | A foto gravada abre no player. Erro de leitura não vira lista vazia nem anel verde mentiroso |
| **ST2** | A marca do evento ou do local fica na foto, na hora de publicar e na hora de ver |
| **ST3** | O gesto de criar é o próprio anel, no mesmo lugar em que a foto vai aparecer |

---

## 2. Por que não abre em produção

Teste de 22/10/2026, horário de Brasília. A câmera devolveu a foto, o piloto publicou marcando um local, o anel do avatar ficou verde e o player mostrou **“Nenhuma foto ao vivo”**.

A gravação funcionou. A leitura é que quebra.

| Hora (Brasília) | O que aconteceu |
|-----------------|-----------------|
| 20:44 | `POST` criou `userslocalstory/9bJIaqZT4qGNXPAyy0U8` — `album: "local"`, `localId: EGSoUVP0qbe9pAZPV3wb`, expira em 24 h |
| 20:44 | Na sequência, `GET /usuarios/:uid/stories` respondeu **500** |
| 20:45 | Segundo `POST` criou `userslocalstory/9vw5F5g3enZEw55kqGgm`, o mesmo ponto. O player vazio levou a publicar de novo |
| 22:05 | Novo `GET /usuarios/:uid/stories` — o mesmo 500, ao abrir o anel verde |

Log da function `api` (`responderErro` em `usuarios.ts`, lista do perfil):

```
FAILED_PRECONDITION: The query requires an index.
album ASC, localId ASC, expiresAt DESC
```

A query está em `listarAtivas` ([`firestore-story-local.repository.ts`](../../functions/src/repositories/firestore/firestore-story-local.repository.ts)): `album` + `localId` (ou `eventoId`) + `expiresAt > agora`, ordenado por `expiresAt` **desc**. O índice em [`firestore.indexes.json`](../../firestore.indexes.json) está com `expiresAt` **asc**. Índice composto não atende a direção invertida. A contagem (`contarAtivas`, sem `orderBy`) passa; a lista não.

Quem publica com marca cai nesse caminho: o `POST /stories` com `localId` grava no álbum do local. O player do perfil (`listarStoriesUsuario`) busca as fotos do piloto e, em seguida, as do álbum. A segunda query derruba a rota inteira. O `catch` do player zera a lista:

```82:84:src/app/(app)/stories/hooks/useReelStories.ts
      .catch(() => {
        if (!cancelado) setStories([]);
      })
```

Com a lista vazia e o loading acabado, o player mostra “Nenhuma foto ao vivo” ([`PlayerStories.tsx`](../../src/app/(app)/components/PlayerStories.tsx)). O anel já estava verde: `marcarTemStories(uid, true)` roda no cliente assim que o `POST` devolve 201, antes da leitura ([`usePublicarStoryPerfil.ts`](../../src/app/(app)/stories/hooks/usePublicarStoryPerfil.ts)).

O mesmo índice derruba `GET /locais/:id/stories`, `GET /eventos/:id/stories` e a faixa Ao vivo. Story só de perfil, sem marca, não entra nessa query e não é este bug.

As duas fotos do teste continuam válidas até expirarem. Com o índice certo, as duas aparecem. Não há migração.

---

## 3. IDs de teste

| ID | Área | Severidade | Sintoma hoje | Critério de aceite | Como testar |
|----|------|------------|--------------|--------------------|-------------|
| **ST1** | Leitura | Bloqueante | Anel verde e “Nenhuma foto ao vivo” | `GET` do álbum e do perfil devolvem a foto; falha de rede mostra erro, não lista vazia | Publicar num local (as duas fotos do teste, ou uma nova) e abrir pelo anel e pelo detalhe do ponto |
| **ST2** | Marca | Alta | A marca é um chip numa lista, fora da foto; no player o `@nome` fica no cabeçalho | A marca escolhida aparece sobre a foto antes e depois de publicar; o toque abre o lugar | Câmera → marcar local e marcar evento → ver no player |
| **ST3** | Entrada | Alta | “Novo story” é um card no meio do perfil, junto de editar e sair | O anel do próprio piloto abre a câmera ou as fotos; o card some | Header, perfil próprio e perfil de outro piloto |

---

## 4. Recorte

### 4.1 O que entra

- Dois índices compostos com `expiresAt` **DESC** (local e evento), para a query que já existe.
- Player honesto: foto recém-publicada aparece na hora; erro de leitura tem copy própria; anel verde só com foto que a leitura devolve.
- Composer em tela cheia: a foto ocupa a tela, a marca fica em cima dela, um CTA **Publicar**.
- A mesma marca no player, sobre a foto, com toque para o detalhe do local ou do evento.
- Criar a story pelo anel do próprio avatar.

Regras da 045 que **permanecem**: 24 h, raio 400 m e precisão ≤ 80 m para a foto entrar no álbum do lugar, teto de 5, álbum do local quando o evento tem `localId`, push 1× por dia, sem legenda.

### 4.2 O que não entra

| Item | Motivo |
|------|--------|
| Texto, figurinha, desenho, música, enquete, recorte, filtro | Fora do gesto pedido |
| Arrastar a marca, várias marcas, marcar piloto | Uma marca, posição fixa |
| “Quem viu”, resposta, encaminhar a foto | Não é o recorte |
| Vídeo ou mais de uma foto por publicação | A 045 já fechou |
| Postar no álbum do lugar sem estar no raio | A marca no lugar continua presença. Sem GPS válido, a publicação com marca não finge sucesso |
| Story de rolê | Outro verbo |
| Apagar as duas fotos do teste | Expiram sozinhas; o ST1 é elas aparecerem |

### 4.3 Decisões travadas

| Decisão | Escolha |
|---------|---------|
| Onde a marca mora | Continua `localId` / `eventoId` da story. Sem campo de posição. A UI desenha o selo; o servidor não ganha coordenada |
| Uma marca | Escolher outra substitui. Sem marca, a story fica no álbum `perfil` (já existe) |
| Marcar local | Mesmo `POST` de hoje: álbum do local, GPS no pin |
| Marcar evento | Mesmo `POST` de hoje: se o evento tem `localId`, álbum do local; senão, álbum do evento. Encontro fora da janela continua 400 |
| Sem marca | `POST /stories` só com `fotoUrl`, prefixo `stories/perfil/{uid}/…`, sem GPS |
| Posição do selo | Terço de baixo, centralizado, acima da safe area. Não compete com o cabeçalho do player |
| Anel verde | Só depois de um `GET` de resumo (ou da lista) com `storiesAtivas > 0`. O 201 sozinho não pinta o anel |
| Foto que acabou de sair | O player abre com o objeto do 201. A lista chega em seguida e substitui. Se a lista falhar, a foto do 201 continua na tela |
| Lista vazia de verdade | Copy **“Nenhuma foto nas últimas 24 h”**. “Nenhuma foto ao vivo” sai |
| Falha ao carregar | Copy **“Não foi possível abrir as fotos.”** e um **Tentar de novo**. Não zera a foto do 201 |
| Quem cria | O próprio anel. O card “Novo story” do perfil sai |

---

## 5. ST1 — A foto abre

### 5.1 Índices

Em [`firestore.indexes.json`](../../firestore.indexes.json), **além** dos índices `expiresAt` ASC que o job e a contagem já usam, criar:

| Coleção | Campos |
|---------|--------|
| `userslocalstory` | `album` ASC, `localId` ASC, `expiresAt` DESC |
| `userslocalstory` | `album` ASC, `eventoId` ASC, `expiresAt` DESC |

Não inverter a query para ASC: o `limit` em ordem crescente devolveria as fotos que expiram primeiro e cortaria as mais novas. O `orderBy` desc fica.

Publicar os índices antes de considerar o ST1 fechado. Enquanto o índice estiver construindo, o player do ST1 ainda mostra o erro honesto — não a copy de lista vazia.

### 5.2 Player

[`useReelStories`](../../src/app/(app)/stories/hooks/useReelStories.ts) deixa de engolir o erro.

| Estado | O que o piloto vê |
|--------|-------------------|
| Carregando a primeira vez, sem foto do 201 | “Carregando…” |
| Lista com fotos | A foto, a marca (ST2) e as barras |
| Lista 200 com `stories: []` | “Nenhuma foto nas últimas 24 h” |
| Lista falhou e não há foto do 201 | “Não foi possível abrir as fotos.” + **Tentar de novo** |
| Lista falhou e há foto do 201 | Essa foto permanece. Sem a copy de vazio |

`PlayerStories` ganha a story inicial opcional (`inicial`). `NovoStoryPerfil` e `BotaoPostarStory` passam o retorno do 201. O `destaqueId` continua apontando para o id dessa foto quando a lista chega.

O anel ([`useTemStories`](../../src/app/(app)/stories/hooks/useTemStories.ts)) não usa `marcarTemStories(true)` no 201. Depois do 201, chama de novo `resumo`. Verde só se `storiesAtivas > 0`. Se o resumo falhar, o anel não fica verde.

Apagar a própria foto continua no player. Se era a última, o anel apaga junto (resumo de novo).

### 5.3 Onde a mesma leitura quebra hoje

O índice desbloqueia, de uma vez:

- anel do avatar → `GET /usuarios/:uid/stories`
- detalhe do local e do evento
- faixa Ao vivo nas abas Locais e Eventos
- chip **Ao vivo** do card, que já usa contagem e pode estar certo enquanto o player falha — depois do índice, chip e player concordam

---

## 6. ST2 — Marca na foto

### 6.1 Composer

Depois que a câmera confirma a foto (o “OK” nativo), abre uma tela cheia sobre o shell. A foto em `object-fit: cover`. Safe area no topo e no rodapé.

| Controle | Função |
|----------|--------|
| **Fechar** | Descarta a foto. `aria-label` “Descartar foto” |
| **Marcar lugar** | Abre a busca. Some quando já há marca |
| Selo na foto | `@{nome}`. Toque tira a marca e devolve o botão |
| **Publicar** | Único CTA primário. Mínimo 48 px. Enquanto envia: “Enviando foto…” e não aceita outro toque |

A busca reusa `useMencoesStory`: locais e eventos já carregados, campo “Evento ou local”, no máximo 8. Se o GPS achar um ponto perto, a primeira linha é **Perto de você · @{nome}** — escolher essa linha marca, não publica sozinho.

Não há lista verde permanente embaixo da foto. O chip verde de hoje (`#3ddc84` no formulário do perfil) sai: o “status verde” que o piloto viu no teste mistura esse chip com o anel do avatar.

Erro do `POST` (longe do pin, GPS impreciso, fora da janela do evento, teto, foto inválida) aparece numa linha sobre o rodapé. A foto e a marca continuam na tela para tentar de novo ou tirar a marca.

Sem marca, **Publicar** segue o álbum `perfil` e não pede GPS.

### 6.2 Player

O selo usa `story.mencao` (já vem na API). Fica sobre a foto, no mesmo terço de baixo do composer. `aria-label`: `Abrir {nome}`.

| Marca | Toque |
|-------|-------|
| `tipo: "local"` | Fecha o player e vai a `/locais/{id}` |
| `tipo: "evento"` | Fecha o player e vai a `/eventos/{id}` |
| `mencao: null` | Sem selo |

O `@nome` do cabeçalho sai. O cabeçalho fica com fechar, avatar, apelido e tempo.

Segurar a foto pausa. O toque no selo não avança o story.

---

## 7. ST3 — Entrar pelo anel

[`AvatarStories`](../../src/app/(app)/components/AvatarStories.tsx), só quando o uid é o do token:

| Anel | Toque |
|------|-------|
| Sem foto nas últimas 24 h | Abre a câmera (mesmo `capturarFotoStory`; no browser, o `input` com `capture`) |
| Com foto | Menu de duas linhas: **Ver fotos** e **Nova foto** |

**Ver fotos** abre o player desse uid. **Nova foto** abre o composer do ST2. Os dois menus de perfil (“Visualizar perfil” no próprio anel) saem — o piloto já está no app, e o perfil continua no dock.

No anel de **outro** piloto nada muda: sem story, o toque vai ao perfil; com story, o menu segue **Visualizar perfil** / **Visualizar Stories**.

O card [`NovoStoryPerfil`](../../src/app/(app)/perfil/components/NovoStoryPerfil.tsx) sai de [`VisaoPerfil`](../../src/app/(app)/perfil/components/VisaoPerfil.tsx). O composer passa a ser um componente único, aberto pelo anel. **Postar foto** no detalhe do local e do evento (045) permanece: lá o lugar já está escolhido, a marca entra marcada e a foto segue o GPS daquele pin.

---

## 8. Fora do escopo

- Reescrever faixa, push, expiração, teto ou Storage.
- Editar a marca depois de publicar.
- Denúncia e moderação.
- Garantir o card no APK além do que a câmera nativa já faz.

---

## 9. Arquivos

| Arquivo | Ação |
|---------|------|
| `docs/specs/047-story-marca-na-foto.md` | Esta spec |
| `firestore.indexes.json` | Índices `expiresAt` DESC da §5.1 |
| `src/app/(app)/stories/hooks/useReelStories.ts` | Erro distinto de lista vazia; aceita a story do 201 |
| `src/app/(app)/components/PlayerStories.tsx` | Selo na foto; copy nova; tentar de novo |
| `src/app/(app)/stories/hooks/useTemStories.ts` | Verde só com resumo > 0 |
| `src/app/(app)/stories/components/ComposerStory.tsx` | **NOVO** — tela cheia, marca na foto, publicar |
| `src/app/(app)/components/AvatarStories.tsx` | Câmera / ver / nova foto no próprio anel |
| `src/app/(app)/perfil/components/NovoStoryPerfil.tsx` | Remover do perfil; a lógica de publicar vai para o composer |
| `src/app/(app)/perfil/components/VisaoPerfil.tsx` | Deixa de montar o card |
| `src/app/(app)/components/BotaoPostarStory.tsx` | Passa a story do 201 ao player; marca já definida pelo alvo |

A rota não muda. Não há coleção nova.

---

## 10. Ordem sugerida

1. Índices DESC no ar. Confirmar que as duas fotos do teste abrem no anel e no local `EGSoUVP0qbe9pAZPV3wb`.
2. Player: erro honesto + foto do 201 + anel preso ao resumo. Fecha **ST1**.
3. Composer com selo na foto e o mesmo selo no player. Fecha **ST2**.
4. Anel como entrada; card do perfil sai. Fecha **ST3**.

---

## 11. Relação

| Spec | Relação |
|------|---------|
| **045** | O álbum, o GPS e o teto ficam. Esta spec corrige a leitura que a 045 não viu faltar em produção e tira a marca de um formulário para a foto |
| **023 / 022** | O toque no selo abre o detalhe que já existe |
| **044** | O raio da marca no lugar continua o da presença. Story sem marca não pede GPS |
