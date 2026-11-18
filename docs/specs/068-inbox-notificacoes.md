# SPEC 068 — Inbox de notificações (sininho)

> **Status:** Implementada  

> **Autor:** Assistente IA  
> **Data:** 2026-11-17  
> **Origem:** o push (SPEC 013 / 042 / 048) só vive no card do SO. Sem app aberto, some. Falta um histórico no estilo Instagram (Activity) com sininho e contagem de não lidas  
> **Padrões:** Next.js 15 App Router — skill `nextjs-patterns`; visual — skill `desenvolvimento-design`  
> **Backend:** Cloud Function `api` — gravação no mesmo caminho de `lib/notificacoes.ts`; rotas novas em `notificacoesRouter`  
> **Coleções:** `usersnotificacao` (**nova**). Lê `users` só para hidratar ator na listagem  
> **Depende de:** SPEC 013 / 042 / 048 (catálogo de push + `url`), SPEC 001 (shell), SPEC 061 CH (`BotaoMensagens` / contagem não lida como padrão de UI)  
> **QA:** IDs **IN1**–**IN7**, um PR por ID

O push continua. Toda vez que o app **tentaria** avisar alguém, também grava uma linha na caixa daquela pessoa. O sininho mostra quantas ainda não foram abertas. Toque na linha abre a mesma `url` do push.

---

## 1. Objetivo

| ID | Entrega | Camada |
|----|---------|--------|
| **IN1** | Tipo, normalização do doc e regras de “entra / não entra” na inbox — lib pura com teste | Back (lib) |
| **IN2** | Coleção `usersnotificacao` + repositório (criar, listar, marcar lida, contar não lidas, limpar no `DELETE /perfil`) | Back |
| **IN3** | Gancho único em `enviar` (ou wrapper): grava inbox **antes** do FCM; falha de FCM não apaga a linha; sem token ainda assim grava | Back |
| **IN4** | `GET /notificacoes`, `GET /notificacoes/nao-lidas`, `POST /notificacoes/:id/lida`, `POST /notificacoes/lidas` | Back |
| **IN5** | Sininho no `CabecalhoFeed` com badge (mesmo gesto do ícone de mensagens) | Front |
| **IN6** | Tela `/notificacoes` (lista Instagram-like, empty, marcar ao tocar) | Front |
| **IN7** | Navegação pela `url` já definida no push; marcar lida ao abrir a linha | Front |

---

## 2. Recorte

### 2.1 O que entra

- Caixa in-app por uid, persistida no Firestore.
- Sininho no header compartilhado do Início / Explorar (`CabecalhoFeed`), à esquerda do ícone de mensagens (ou entre busca e mensagens — ver §2.4).
- Badge com total de **não lidas** (mesmo padrão visual de `BotaoMensagens`: número até 9, depois `9+`).
- Lista cronológica em `/notificacoes`: avatar (quando houver ator), título, corpo, tempo relativo, estado não lida.
- Toque → `router.push(url)` + marca lida.
- Botão **Marcar todas como lidas**.
- Escrita no mesmo momento do push, **independente** de ter token FCM ou de o emulator engolir o envio.

### 2.2 O que não entra (nesta entrega)

| Item | Motivo |
|------|--------|
| Preferências por tipo (“não quero lembrete na inbox”) | Uma caixa só; preferência global fica para depois |
| Agrupar “João e outras 3 pessoas curtiram” | Lista plana; agregação é outra spec |
| Curtida no Início / foto | Hoje **não** tem push; fora até existir `notificarCurtida` |
| Substituir o badge de mensagens | DM continua em `/mensagens`; ver §2.4 se `mensagem` entra na inbox |
| Preferência de push no SO / canal novo | Inbox não mexe em FCM |
| Realtime (Firestore listener / WebSocket) | Polling leve no badge, igual mensagens |
| Apagar uma notificação na UI | Soft: só marcar lida. TTL no servidor limpa |
| Mock Stitch dedicado | Reusa tokens do cockpit + gesto do chat |

### 2.3 Decisões travadas (proposta)

| Decisão | Escolha |
|---------|---------|
| Fonte da verdade | O mesmo payload do push (`tipo`, `title`, `body`, `url`, ids). Inbox não inventa copy paralelo |
| Quando grava | Em `enviar`, **antes** de listar tokens / FCM. Emulator e “0 tokens” ainda gravam |
| Idempotência | Sem dedupe fino nesta leva: cada chamada a `enviar` = 1 doc. Lembretes e convites em lote geram 1 por destinatário (já é assim no push) |
| Página | 30 itens, `createdAt` desc, cursor |
| Retenção | Docs com mais de **60 dias** podem ser apagados por job interno futuro; nesta leva, só documentar. Listagem não precisa filtrar por idade |
| Teto por uid | Ao criar, se passar de **200** docs do uid, apaga os mais antigos que excederem (ou deixa para job — ver ponto aberto) |
| `lida` | Default `false`. Abrir a linha ou “marcar todas” → `true`. Não volta para não lida |
| Contagem | `GET /notificacoes/nao-lidas` → `{ total: number }`. Badge polled como `useMensagensNaoLidas` |
| Ator | Campo opcional `atorUid` + hidratação `{ nome, fotoUrl }` na listagem. Tipos sem ator (lembrete, cancelamento) mostram ícone genérico do tipo |
| Segurança | Só o dono lê/marca. Client deny-all |
| Deep link | Reusa a `url` já definida em `notificacoes.ts` (tabela §3) |

### 2.4 Pontos abertos — **fechar na discussão**

Estes itens estão **propostos** abaixo; a implementação só começa depois do ok.

| # | Pergunta | Proposta default |
|---|----------|------------------|
| **A** | Quais tipos entram na inbox? | Ver §3.1: social + operacional “sobre você”. **Fora:** `story_local` (broadcast) e, se combinarmos, `mensagem` |
| **B** | `mensagem` duplica o badge do chat? | **Fora da inbox.** Push de DM continua; só o ícone de mensagens conta não lidas |
| **C** | Lembretes (`lembrete_role` / `lembrete_evento`) entram? | **Sim** — são avisos pessoais do seu compromisso. Se quiser inbox só “social”, tiramos |
| **D** | `story_local` (primeira story do dia no ponto/evento) entra? | **Não** nesta leva — é broadcast, não “atividade no seu perfil” |
| **E** | Curtidas no futuro? | Fora desta SPEC; quando houver push de curtida, entra automaticamente pelo gancho |
| **F** | Posição do sininho | Entre **busca** e **mensagens** no `CabecalhoFeed` |
| **G** | Marcar lida ao abrir a tela inteira? | **Não.** Só ao tocar a linha ou “Marcar todas” (gesto Instagram antigo; o atual do IG marca ao ver — podemos alinhar se preferir) |
| **H** | Teto 200 + purge | Purge síncrono no create vs job `POST /interno/notificacoes/limpar` | Preferência: **job** na mesma leva ou só documentar e fazer no IN2 mínimo |

---

## 3. Catálogo (alinhado ao push)

### 3.1 Quem entra / quem fica de fora (proposta)

| `tipo` | Entra na inbox? | Por quê |
|--------|-----------------|---------|
| `novo_seguidor` | Sim | Atividade no perfil |
| `comentario_foto` | Sim | Atividade no perfil |
| `comentario_atividade` | Sim | Atividade no perfil |
| `pedido_vaga` | Sim | Pedido para o seu rolê |
| `entrada_role` | Sim | Entrada no seu rolê aberto |
| `aceite_vaga` | Sim | Resposta sobre você |
| `cancelamento_role` | Sim | Afeta sua vaga |
| `convite_evento` | Sim | Convite dirigido a você |
| `album_evento` | Sim | Fotos de um evento em que você está |
| `lembrete_role` | Sim* | Compromisso seu (*ponto C*) |
| `lembrete_evento` | Sim* | Compromisso seu (*ponto C*) |
| `mensagem` | Não* | Já tem caixa própria (*ponto B*) |
| `story_local` | Não* | Broadcast (*ponto D*) |

\* Defaults da proposta; mudam se a discussão inverter A–D.

### 3.2 Destino ao tocar (`url` já existente)

| `tipo` | `url` |
|--------|-------|
| `pedido_vaga` | `/aprovacoes` |
| `entrada_role` | `/roles/{id}/gerenciar` |
| `aceite_vaga` | `/roles/{id}/participar` |
| `lembrete_role` | `/roles/{id}/participar` |
| `lembrete_evento` | `/eventos/{id}` |
| `cancelamento_role` | `/meus-roles` |
| `novo_seguidor` | `/perfil/{seguidorId}` |
| `comentario_foto` | `/perfil/{autorUid}/fotos/{postId}` |
| `comentario_atividade` | `/atividades/{id}` |
| `convite_evento` | `/eventos/{id}` |
| `album_evento` | `/eventos/{id}?album=1` |

---

## 4. Dados

### 4.1 Coleção `usersnotificacao`

Id auto.

```
{
  id: string,
  usuarioId: string,          // dono da caixa (quem receberia o push)
  tipo: TipoPush,             // subset que “entra”
  title: string,
  body: string,
  url: string,                // path interno, ex. /perfil/uid
  lida: boolean,
  atorUid: string | null,     // quem gerou a ação; null em lembrete/cancelamento
  roleId: string,             // "" se não couber
  localId: string,
  eventoId: string,
  createdAt: timestamp
}
```

Índices:

- `usuarioId` + `createdAt` desc (lista)
- `usuarioId` + `lida` + `createdAt` desc (opcional; contagem pode ser `where lida == false` com limite ou contador denormalizado — ver abaixo)

**Contagem:** nesta leva, query `lida == false` com `limit` alto o bastante **ou** campo denormalizado `users.notificacoesNaoLidas`.  
Proposta default: **query simples** no `GET /nao-lidas` (contar docs com `lida == false`, teto exibido `9+` no client). Se ficar caro, denormaliza num PR seguinte.

### 4.2 Campo em `users`

Nenhum nesta leva (a menos que escolhamos contador denormalizado no ponto da contagem).

---

## 5. API

Todas com `autenticar`. Uid só do token.

### 5.1 `GET /notificacoes?cursor=`

200:

```
{
  itens: [{
    id, tipo, title, body, url, lida, createdAt,
    ator: { uid, nome, fotoUrl } | null
  }],
  nextCursor: string | null
}
```

30 por página. `ator` hidratado em lote a partir de `atorUid`.

### 5.2 `GET /notificacoes/nao-lidas`

```
{ total: number }
```

### 5.3 `POST /notificacoes/:id/lida`

204. Só se `usuarioId` do doc = token. Já lida: 204 idempotente. Outro uid / inexistente: 404.

### 5.4 `POST /notificacoes/lidas`

204. Marca todas as não lidas do token.

### 5.5 Escrita interna

Não há `POST /notificacoes` público. Só o gancho em `lib/notificacoes.ts`:

```
registrarInboxSeAplicavel(uid, payload & { atorUid?: string | null })
```

Tipos fora da allowlist (§3.1) → no-op.  
`DELETE /perfil` apaga os docs do uid (gancho em `apagar-catalogo` / limpeza de conta).

---

## 6. Front

### 6.1 Sininho (IN5)

- Componente `BotaoNotificacoes` espelhando `BotaoMensagens`.
- `aria-label`: `Notificações` ou `Notificações, N não lidas`.
- Hook `useNotificacoesNaoLidas` (poll ~30–60 s + refresh ao focar a aba / voltar de `/notificacoes`).
- Só renderiza badge se `total > 0`.

### 6.2 Tela `/notificacoes` (IN6–IN7)

- Header: voltar + título **Notificações** + ação texto **Marcar todas**.
- Lista: linha com avatar/ícone, `title` em destaque, `body` em secondary (1–2 linhas), tempo relativo à direita ou abaixo.
- Não lida: ponto ou fundo levemente destacado (mesmo espírito de `linhaNaoLida` do chat).
- Empty: *Nenhuma notificação ainda.*
- Toque: `POST .../lida` otimista + `router.push(url)`.
- Sem dock especial; rota no grupo `(app)`.

### 6.3 Copy / ícones sem ator

| Família | Ícone sugerido |
|---------|----------------|
| Rolê / vaga / lembrete rolê | `two_wheeler` |
| Evento / álbum / lembrete evento | `event` |
| Cancelamento | `cancel` |
| Default | `notifications` |

---

## 7. IDs de teste

| ID | Área | Critério de aceite |
|----|------|--------------------|
| **IN1** | Lib | Allowlist decide gravar ou não. Payload sem `url` válida não grava. Teste sem rede |
| **IN2** | Repo | Criar, listar cursor, marcar uma, marcar todas, apagar por uid |
| **IN3** | Gancho | `enviar` com 0 tokens ainda cria doc. Tipo fora da lista não cria. FCM falho não remove o doc |
| **IN4** | HTTP | Dono lista e marca. Outro uid 404 no `:id`. `nao-lidas` reflete o estado |
| **IN5** | Header | Sininho visível logado; badge some com total 0; `9+` acima de 9 |
| **IN6** | Lista | Ordem desc; empty; marcar todas zera o badge |
| **IN7** | Navegação | Toque em `novo_seguidor` abre `/perfil/{uid}`; linha fica lida |

---

## 8. Fora / depois

- Agregação estilo Instagram.
- Push de curtida → entra sozinho quando existir.
- Preferências por tipo.
- Listener realtime.
- Job de TTL 60 dias (se não entrar no IN2).
- Tela de configurações “notificações do app”.

---

## 9. Checklist da discussão (fechado)

- [x] **A–D** — lembretes sim; mensagem e story_local fora
- [x] **F** — sininho entre lupa e mensagens
- [x] **G** — marcar lida só ao tocar a linha ou “Marcar todas”
- [x] **H** — sem purge síncrono nesta leva (só limpeza no `DELETE /perfil`)
- [x] Inbox e push convivem
