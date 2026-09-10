# SPEC 013 — Notificações push (pedido de vaga e aceite)

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-10  
> **Referência visual:** sem mock Stitch de push — reusa toasts já existentes (criar-rolê, aprovações, sheet da SPEC 005)  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade  
> **Backend:** Cloud Function `api` (Express) — envio FCM **dentro** de `POST /roles/:id/participacao` e `PATCH /aprovacoes/:id`  
> **Coleção Firestore:** `dispositivos` (token FCM ↔ uid)  
> **Depende de:** SPEC 001 (shell autenticado), SPEC 004 (publicar rolê), SPEC 005 (`usersrole` + flag `notificar`), SPEC 007 (`PATCH /aprovacoes/:id`), SPEC 012 (PWA + service worker Serwist)

---

## 1. Objetivo

Entregar **duas** notificações push, disparadas nas requests que já existem — sem scheduler, sem trigger Firestore, sem segunda Cloud Function.

| # | Quando | Quem recebe | Copy visível |
|---|--------|-------------|--------------|
| 1 | Um piloto **cria** o pedido de vaga | Organizador (`role.criadorId`) | **Um motociclista solicitou vaga para um rolê** |
| 2 | O organizador **aceita** o pedido | Piloto (`pedido.usuarioId`) | **O organizador aceitou você no rolê** |

**Recusa não notifica.** O piloto vê o estado no sheet `/roles/:id/participar` quando abrir o app.

Esta spec **fecha** o que as SPECs 005 e 007 adiaram: a flag `notificar` e o toast *“O piloto será notificado”* passam a ter envio real.

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | Permissão do browser, `getToken` (VAPID), upsert/delete em `/dispositivos`, SW de background (estende a SPEC 012), toast se o app estiver aberto |
| Back (Functions) | Persistir tokens, enviar FCM **depois** de gravar o domínio, nunca falhar a request se o push falhar |

Sem sino no header. Sem inbox. Sem lembrete de horário de saída.

---

## 2. Referência de Design

Não há tela nova de “notificações”. O SO desenha o card nativo em background. Em foreground, reusar o padrão de toast já existente (pill acima do dock).

### O que entra nesta spec

- Registro do token FCM no shell autenticado (se a permissão já foi `granted`).
- Pedido de permissão em **dois gestos naturais**:
  - Organizador: logo após **Publicar Rolê** com sucesso (SPEC 004).
  - Piloto: no sheet de confirmação, ao **ligar** o toggle Notificações (SPEC 005) — ou na primeira visita ao sheet se `notificar === true` e a permissão ainda é `default`.
- Push nativo em background (service worker).
- Toast in-app se a mensagem chegar com o app em primeiro plano (`onMessage`).
- Clique na notificação abre o deep link (§5.3).

### O que o produto / os mocks sugerem e **não** entra

| Elemento | Motivo |
|----------|--------|
| Sino no header (mocks do feed / aprovações) | Recorte das SPECs 001–012 |
| Push de **recusa** | Combinado: recusa é silenciosa |
| Lembrete “o rolê sai em X horas” / Cloud Scheduler | Combinado: sem schedule |
| Preferência global do organizador | Sem flag; se tem token, recebe o pedido |
| Histórico / central de notificações | Fora |
| Banner no feed “ative as notificações” | Prompt só nos dois gestos acima |
| PWA instalável, Serwist, `/offline` | Já na SPEC 012 — esta spec **estende** o SW |

### Copy das notificações nativas

Uma linha, exatamente esta. O **título do rolê** vai no `body` para o organizador com vários rolês saber qual é.

| Tipo | `title` | `body` |
|------|---------|--------|
| `pedido_vaga` | Um motociclista solicitou vaga para um rolê | `{titulo}` do rolê |
| `aceite_vaga` | O organizador aceitou você no rolê | `{titulo}` do rolê |

Sem apelido, sem “foi recusado”, sem emoji extra.

### Toast em foreground

Mesmo `title` da tabela. Sem inventar outro copy. Some após ~2,5s (igual SPEC 007). Toque no toast **não** é obrigatório — o piloto já está no app.

---

## 3. Fluxo do Usuário

```
Piloto autenticado (GuardaApp)
  │
  ├── Shell (app)
  │     └── permissão já granted? → getToken → POST /dispositivos (silencioso)
  │
  ├── Publicar rolê (organizador)
  │     └── 201 + toast de sucesso
  │           └── permissão default → Notification.requestPermission()
  │                 └── granted → getToken → POST /dispositivos
  │
  └── Pedir vaga (piloto)
        └── sheet SPEC 005 (notificar default true)
              ├── permissão default → pedir no sheet (gesto)
              └── toggle Off → PATCH notificar:false (não manda aceite depois)
                    toggle On  → pede permissão se ainda não granted

Evento 1 — POST /roles/:id/participacao
  │
  ├── pedido JÁ existia → 200, sem push
  ├── 201 (create)
  │     └── FCM → tokens do criadorId
  │           ├── organizador fora do app → card nativo → clique → /aprovacoes
  │           └── organizador no app     → toast in-app
  └── sem token / FCM falhou → 201 mesmo assim

Evento 2 — PATCH /aprovacoes/:id { decisao: "aceitar" }
  │
  ├── 200 + pedido.notificar === true
  │     └── FCM → tokens do usuarioId
  │           └── clique → /roles/:id/participar
  ├── pedido.notificar === false → 200, sem push
  └── decisao === "recusar" → 200, sem push
```

- Logout (`BotaoSair`): `DELETE /dispositivos` **antes** do `signOut` (best-effort; falha não bloqueia o logout).
- Excluir conta (SPEC 006): a function apaga os `dispositivos` daquele uid junto com `users/{uid}`.
- POST participação **idempotente**: segundo toque devolve o doc existente — **não** dispara de novo.
- PATCH já decidido (`409`) — **não** dispara.
- iOS: Web Push só depois de instalado (SPEC 012). Sem PWA, o iPhone não recebe; Android no Chrome recebe mesmo em aba.

---

## 4. Arquitetura Next.js

Seguir a skill: layout/page orquestram, lógica no hook, `"use client"` só no que lê `Notification` / `getMessaging`. Chamadas à API só no client (`api()` + Bearer).

`getMessaging` **não** entra em `src/lib/firebase.ts` no top-level: quebra SSR. Factory lazy + `isSupported()`.

### 4.1 Um service worker só (não criar `firebase-messaging-sw.js`)

A SPEC 012 já registra o Serwist em `src/app/sw.ts`. Dois SWs no mesmo scope brigam.

Nesta spec:

1. `src/app/sw.ts` ganha `onBackgroundMessage` de `firebase/messaging/sw`.
2. `getToken(messaging, { vapidKey, serviceWorkerRegistration })` usa a **mesma** registration do Serwist.
3. Precache / fallback `/offline` da 012 **permanecem**. O handler FCM só trata push.

Se a 012 ainda não estiver mergeada no momento da implementação: o mínimo desta spec é um SW que atenda FCM **no mesmo arquivo que a 012 vai usar** (`src/app/sw.ts`). Não criar `public/firebase-messaging-sw.js` “temporário”.

### 4.2 Estrutura (acréscimos)

```
src/lib/
├── firebase.ts                     # Alterar — NÃO inicializar Messaging aqui
└── fcm.ts                          # NOVO — isSupported, getToken, onMessage

src/app/(app)/
├── hooks/
│   └── useRegistroFcm.ts           # NOVO — silent register no shell
├── components/
│   └── GuardaApp.tsx               # Alterar — monta o hook (já é Client)
└── criar-role/hooks/
    └── useFormularioCriarRole.ts   # Alterar — após sucesso, pedir permissão

src/app/(app)/roles/[id]/participar/hooks/
└── usePreferenciaNotificar.ts      # Alterar — ao ligar, pedir permissão + registrar

src/hooks/  ou  src/lib/auth.ts
└── logout                          # Alterar — DELETE token antes do signOut

src/app/(app)/services/             # ou src/lib/
└── dispositivos.service.ts         # NOVO — POST/DELETE /dispositivos

src/app/sw.ts                       # Alterar (SPEC 012) — onBackgroundMessage

.env.example                        # Alterar — NEXT_PUBLIC_FIREBASE_VAPID_KEY
```

O toast de foreground pode ser um `ToastPush` mínimo no shell `(app)` (um componente, um hook `usePushForeground`). **Não** duplicar o toast de criar-rolê / aprovações.

### 4.3 Responsabilidades

| Peça | Tipo | Faz |
|------|------|-----|
| `fcm.ts` | Lib client | `isSupported`, `obterToken`, `ouvirForeground` — sem `fetch` |
| `dispositivos.service.ts` | Service | `POST` / `DELETE` `/dispositivos` |
| `useRegistroFcm` | Hook | Se `granted`, token → upsert; ignora `denied` / `unsupported` |
| `usePushForeground` | Hook | `onMessage` → estado do toast |
| `ToastPush` | UI | Copy do push; `role="status"` |
| `useFormularioCriarRole` | Hook existente | Depois de `setSucesso(true)`, `pedirPermissaoERegistrar()` |
| `usePreferenciaNotificar` | Hook existente | Ao ir para `true`, `pedirPermissaoERegistrar()` |
| `GuardaApp` | Client | Só monta `useRegistroFcm` (não pede permissão no boot) |
| `sw.ts` | SW | Background: mostra o card; clique → `data.url` |

**Não misturar** no mesmo arquivo: `getToken` + JSX do toast + `PATCH /aprovacoes`.

### 4.4 Permissão — contrato

```ts
type ResultadoPermissao = "granted" | "denied" | "default" | "unsupported";

pedirPermissaoERegistrar(): Promise<ResultadoPermissao>
registrarSeJaPermitido(): Promise<void>
```

- `unsupported` (`isSupported() === false` ou sem `Notification`): no-op. O app funciona igual.
- `denied`: nunca insistir de novo nesta sessão **nem** gravar flag agressiva no feed. O piloto pode mudar em Ajustes do SO.
- `default`: só chama `requestPermission()` a partir dos dois gestos (§3).
- Token mudou (rotação): `POST` de novo (upsert pelo próprio token como id).

VAPID: `process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY`. Já existe no `.env.local`. O **servidor não usa VAPID** — o Admin SDK autentica com a service account.

---

## 5. Contrato dos Dados

### 5.1 `dispositivos`

Coleção **à parte**. Token **não** entra no documento `users` (perfil ≠ device; o motociclista tem celular + desktop; token expira).

Id do documento = o próprio token FCM (upsert e delete baratos).

```ts
// functions/src/types/dispositivo.ts
export type Dispositivo = {
  token: string;
  uid: string;
  createdAt: string; // ISO
  updatedAt: string;
};

export type DispositivoCreate = {
  token: string;
};
```

Campos Firestore: `token`, `uid`, `createdAt`, `updatedAt` (timestamps no adapter). Sem `userAgent` nesta spec.

### 5.2 Payload FCM

```ts
export type TipoPush = "pedido_vaga" | "aceite_vaga";

export type PayloadPush = {
  tipo: TipoPush;
  title: string;
  body: string;
  url: string;
  roleId: string;
};
```

`data` (strings, exigência FCM) + `notification` (title/body) para o SO desenhar sem o app aberto.

```
data: {
  tipo, url, roleId
}
notification: { title, body }
webpush.fcmOptions.link: url   // clique no Chrome
```

### 5.3 Deep links

| Tipo | `url` |
|------|-------|
| `pedido_vaga` | `/aprovacoes` |
| `aceite_vaga` | `/roles/{roleId}/participar` |

Sem query extra. A tela de aprovações já lista a fila; o sheet de participar já mostra o estado `confirmado`.

### 5.4 Flag `usersrole.notificar` (já existe)

| Evento | Usa a flag? |
|--------|-------------|
| Pedido → organizador | **Não.** Organizador não tem toggle. |
| Aceite → piloto | **Sim.** `notificar === false` → não envia. Default na criação é `true` (SPEC 005). |
| Recusa | Não envia, **independente** da flag. |

---

## 6. Implementação Front

### 6.1 `src/lib/fcm.ts`

- Importar `getMessaging`, `getToken`, `onMessage`, `isSupported` de `firebase/messaging`.
- Messaging a partir do **mesmo** `app` de `firebase.ts` (`initializeApp` já existe).
- `obterToken()`: se `Notification.permission !== "granted"` ou `!isSupported()`, retorna `null`. Senão `getToken` com VAPID + registration do SW.
- Nunca `console.log` o token.

### 6.2 Service

```ts
// dispositivos.service.ts
export const dispositivosService = {
  registrar: (token: string) =>
    api("/dispositivos", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  remover: (token: string) =>
    api("/dispositivos", {
      method: "DELETE",
      body: JSON.stringify({ token }),
    }),
};
```

Token no body do `DELETE` (o valor é longo demais para path). Sem `httpsCallable`.

### 6.3 Shell

`GuardaApp` (já Client, já depois do perfil completo) chama `useRegistroFcm()`. Não pedir permissão no first paint do feed.

### 6.4 Após publicar

Em `useFormularioCriarRole`, no mesmo caminho que `setSucesso(true)`: `void pedirPermissaoERegistrar()`. Não atrasar o redirect do rolê criado se o piloto recusar a permissão.

### 6.5 Sheet de participar

`usePreferenciaNotificar`: se `alternar` vai para `true`, pedir permissão + registrar. Se a permissão for `denied`, o PATCH `notificar: true` **ainda grava** (preferência do pedido); o push simplesmente não chega até o piloto mudar o SO.

Na **primeira** montagem do sheet em estado `aguardando`, se `notificar === true` e permission `default`, pode pedir **uma vez** (o toque em Participar no feed é o gesto). Não pedir de novo a cada re-render.

### 6.6 Logout

Estender `logout` em `src/lib/auth.ts` (ou o wrapper do `AuthProvider`):

1. `obterToken()` se possível (sem prompt).
2. `DELETE /dispositivos` best-effort (`try/catch` engole 401/rede).
3. `signOut(auth)` sempre.

Não deixar o próximo usuário no mesmo browser receber push do anterior.

### 6.7 Clique / deep link

Background: o SW faz `clients.openWindow(data.url)` (ou foca um client já aberto na origem e `navigate`).

Foreground: o toast não precisa navegar.

### 6.8 Acessibilidade

- Toast: `role="status"`.
- Não há botão novo permanente. `requestPermission` é o diálogo nativo do browser.
- Sem depender só da cor.

---

## 7. Backend

Não usar `onCall`. Rotas **sem** `firestore.collection` direto. Factory em `repositories/index.ts`. Messaging **não** é repositório de domínio: adapter fino + lib de orquestração.

```
functions/src/lib/firebase-admin.ts     # Alterar — export adminMessaging
functions/src/lib/notificacoes.ts       # NOVO — notificarPedidoVaga / notificarAceite
functions/src/types/dispositivo.ts      # NOVO
functions/src/repositories/interfaces/dispositivo.repository.ts
functions/src/repositories/firestore/firestore-dispositivo.repository.ts
functions/src/routes/dispositivos.ts    # NOVO
functions/src/routes/participacao.ts    # Alterar — após criar, notificar
functions/src/routes/aprovacoes.ts      # Alterar — após aceitar, notificar
functions/src/routes/perfil.ts          # Alterar — DELETE apaga dispositivos
functions/src/index.ts                  # Alterar — app.use("/dispositivos")
```

### 7.1 Admin Messaging

Em `firebase-admin.ts`, junto de `adminAuth` / `firestore`:

```ts
import {getMessaging} from "firebase-admin/messaging";

export const adminMessaging = getMessaging();
```

Rotas **não** importam `firebase-admin/messaging`. Só `lib/notificacoes.ts` (e o adapter, se o send viver lá).

### 7.2 Repositório `DispositivoRepository`

```ts
export interface DispositivoRepository {
  upsert(uid: string, token: string): Promise<Dispositivo>;
  listarTokensPorUid(uid: string): Promise<string[]>;
  removerPorToken(token: string): Promise<boolean>;
  removerPorUid(uid: string): Promise<void>;
}
```

- `upsert`: `set` com merge em `dispositivos/{token}`; se o token já era de outro uid (logout falhou), **passa a ser** do uid atual.
- `listarTokensPorUid`: query `uid ==`. Campo único — índice automático.
- `removerPorUid`: usado no `DELETE /perfil`.

### 7.3 `lib/notificacoes.ts`

```ts
notificarPedidoVaga(criadorId: string, roleId: string, titulo: string): Promise<void>
notificarAceite(usuarioId: string, roleId: string, titulo: string): Promise<void>
```

Fluxo interno:

1. `listarTokensPorUid`.
2. Zero tokens → return.
3. `sendEachForMulticast` (ou `sendEach`) com o payload da tabela §2.
4. Para cada resultado `messaging/registration-token-not-registered` ou `messaging/invalid-registration-token` → `removerPorToken`.
5. Qualquer outro erro → log (`console.error`) e segue. **Não relança.**

`await` obrigatório: a function `api` morre depois do `res.json` se o send não estiver awaited.

Teto: se um uid tiver mais de 10 tokens, enviar os 10 mais recentes (`updatedAt` DESC) e apagar o restante (device morto). Não precisa agora se a query for pequena; documentar o teto 10.

### 7.4 Auth dos novos endpoints

`dispositivosRouter.use(autenticar)`. Uid **só** do token.

### 7.5 `POST /dispositivos`

Body: `{ "token": string }` não vazio.

| Caso | Status | Corpo |
|------|--------|-------|
| `token` ausente / não-string / vazio | 400 | `{ erro: "token é obrigatório" }` |
| Sem Bearer | 401 | `{ erro: "Não autenticado" }` |
| Ok | 201 ou 200 | `Dispositivo` |

Idempotente: mesmo token de novo → 200 + `updatedAt` novo.

### 7.6 `DELETE /dispositivos`

Body: `{ "token": string }`.

| Caso | Status |
|------|--------|
| Token ausente | 400 |
| Sem Bearer | 401 |
| Token de **outro** uid | 403 `{ erro: "dispositivo de outro usuário" }` |
| Não existe | 204 (idempotente) |
| Ok | 204 |

Não aceitar “apague todos os meus devices” nesta spec (logout manda o token atual).

### 7.7 `POST /roles/:id/participacao` (alterar)

Depois de `usuarioRoleRepository.criar` e **somente** no caminho `201`:

```ts
await notificarPedidoVaga(role.criadorId, role.id, role.titulo);
res.status(201).json(criado);
```

Caminho “já existe” (`res.json(existente)`) → **não** chama.

Título do rolê já está em `role` (buscado antes do create). Não precisa de query extra.

Falha FCM **não** vira 500 da participação.

### 7.8 `PATCH /aprovacoes/:id` (alterar)

Depois de `decidir` com sucesso, **somente** se `decisao === "aceitar"` **e** `atualizado.notificar !== false`:

```ts
await notificarAceite(atualizado.usuarioId, atualizado.roleId, role.titulo);
```

`role` já é buscado na rota para validar `dataHoraSaida`. Recusa: não chama. `notificar: false`: não chama. 409/403/400: não chama.

A resposta HTTP continua sendo `SolicitacaoLider`. O toast da SPEC 007 (*“O piloto será notificado.”*) permanece — agora é verdade quando `notificar` está ligado e há token.

### 7.9 `DELETE /perfil` (alterar)

Antes ou depois de `usuarioRepository.remover(uid)`:

```ts
await dispositivoRepository.removerPorUid(uid);
```

Não falhar a exclusão se a limpeza de tokens quebrar: log + segue (o user já some). Preferir limpar tokens **antes** de apagar o user, ainda assim devolver 204 se o user foi apagado.

Não muda o recorte da SPEC 006 (Auth/Storage/rolês continuam de fora).

### 7.10 Ordem Express

```
app.use("/dispositivos", dispositivosRouter);
```

Health `GET /` inclui `/dispositivos`.

### 7.11 O que não muda

- Function HTTP única `api`.
- Schema de `users` e `usersrole` (nenhum campo novo no perfil).
- Contratos de status 201/200/409 das SPECs 005 e 007.
- Sem `onDocumentCreated`, sem Pub/Sub, sem Cloud Scheduler, sem topics FCM.

---

## 8. Wireframe

Não há tela cheia. Só o card do SO e o toast.

```
Background (organizador, app fechado)
┌─────────────────────────────────┐
│ Rolê Moto                       │
│ Um motociclista solicitou vaga  │
│ para um rolê                    │
│ Serra da Cantareira             │  ← body = título
└─────────────────────────────────┘
        toque → /aprovacoes

Background (piloto aceito)
┌─────────────────────────────────┐
│ Rolê Moto                       │
│ O organizador aceitou você      │
│ no rolê                         │
│ Serra da Cantareira             │
└─────────────────────────────────┘
        toque → /roles/{id}/participar

Foreground (app aberto) — toast acima do dock
        (campainha)  Um motociclista solicitou vaga para um rolê
```

Diálogo de permissão = nativo do Chrome/Safari. Sem modal cockpit próprio.

---

## 9. Fora do Escopo

- Recusa por push.
- Cloud Scheduler / lembrete de saída / “rolê em 1 hora”.
- Sino, inbox, badge no menu.
- Topics, e-mail, SMS.
- Array `fcmTokens` em `users`.
- Preferência global “não me avise de pedidos”.
- Cache offline de rolês (SPEC 012).
- Segundo service worker em `public/`.
- Emulator de FCM (não há um útil — o send vai no FCM de verdade; tokens de `localhost` vs HTTPS de produção são origins diferentes).
- Banner no feed.
- Alterar copy do toast da SPEC 007.
- Notificar o organizador quando o piloto **cancela** o pedido (`DELETE` participação).

---

## 10. Critérios de Aceite

### Registro

- [ ] `NEXT_PUBLIC_FIREBASE_VAPID_KEY` documentada no `.env.example`.
- [ ] Permissão `granted` no shell → `POST /dispositivos` com o token do uid autenticado.
- [ ] Publicar rolê com permissão `default` abre o diálogo nativo; `granted` registra o token.
- [ ] Ligar o toggle Notificações no sheet registra o token (se o SO deixar).
- [ ] `denied` / `unsupported`: app continua usável; participação e aceite funcionam.
- [ ] Logout tenta `DELETE` do token atual antes do `signOut`.
- [ ] `DELETE /perfil` remove os documentos `dispositivos` daquele uid.

### Evento 1 — pedido

- [ ] Primeiro `POST /participacao` (`201`) envia push ao **criador**, copy da tabela §2.
- [ ] Segundo `POST` do mesmo par (idempotente) **não** envia de novo.
- [ ] Criador sem token: `201` igual, sem erro na API.
- [ ] FCM fora do ar: `201` igual.
- [ ] Clique no card nativo abre `/aprovacoes`.

### Evento 2 — aceite

- [ ] `PATCH` aceitar com `notificar: true` envia push ao **piloto**, copy da tabela §2.
- [ ] `notificar: false`: 200, sem push.
- [ ] `decisao: "recusar"`: 200, **sem** push.
- [ ] Já decidida (`409`): sem push.
- [ ] Clique no card nativo abre `/roles/{id}/participar`.

### Qualidade / arquitetura

- [ ] Rotas não importam Firestore nem `firebase-admin/messaging`.
- [ ] Send awaited **antes** do `res.json` / `res.status(201)`.
- [ ] Tokens inválidos são apagados no adapter.
- [ ] Um único SW (Serwist + `onBackgroundMessage`). `getToken` usa essa registration.
- [ ] `getMessaging` não roda no SSR.
- [ ] Sem `httpsCallable`. Sem Cloud Scheduler.
- [ ] Componentes < ~80 linhas; lógica FCM no hook/lib.
- [ ] Sem `console.log` de debug (token, payload).
- [ ] Usável a partir de 360px; toast não tapa o dock.

### Device

- [ ] Android Chrome (HTTPS): recebe os dois tipos com o app em background.
- [ ] App em foreground: toast, não dois cards nativos empilhados (ou, se o SO mostrar os dois, o toast ainda aparece — aceitável; preferir só toast se `onMessage` consumir).
- [ ] iOS: só depois de instalado (SPEC 012). Sem instalação, não é regressão desta spec.

---

## 11. Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| `src/lib/fcm.ts` | **NOVO** |
| `src/app/(app)/services/dispositivos.service.ts` | **NOVO** |
| `src/app/(app)/hooks/useRegistroFcm.ts` | **NOVO** |
| `src/app/(app)/hooks/usePushForeground.ts` | **NOVO** |
| `src/app/(app)/components/ToastPush.tsx` | **NOVO** |
| `functions/src/types/dispositivo.ts` | **NOVO** |
| `functions/src/lib/notificacoes.ts` | **NOVO** |
| `functions/src/repositories/interfaces/dispositivo.repository.ts` | **NOVO** |
| `functions/src/repositories/firestore/firestore-dispositivo.repository.ts` | **NOVO** |
| `functions/src/routes/dispositivos.ts` | **NOVO** |
| `src/app/(app)/components/GuardaApp.tsx` | **Alterar** — registra FCM silencioso |
| `src/app/(app)/app.module.css` | **Alterar** — toast push (se não reusar classe existente) |
| `src/app/(app)/criar-role/hooks/useFormularioCriarRole.ts` | **Alterar** — pedir permissão após sucesso |
| `src/app/(app)/roles/[id]/participar/hooks/usePreferenciaNotificar.ts` | **Alterar** — pedir ao ligar |
| `src/lib/auth.ts` / `AuthProvider` | **Alterar** — DELETE token no logout |
| `src/lib/firebase.ts` | **Alterar só se** precisar exportar `app` para o Messaging (já exporta `default`) |
| `src/app/sw.ts` | **Alterar** (SPEC 012) — background message |
| `.env.example` | **Alterar** — VAPID |
| `functions/src/lib/firebase-admin.ts` | **Alterar** — `adminMessaging` |
| `functions/src/repositories/index.ts` | **Alterar** — factory |
| `functions/src/routes/participacao.ts` | **Alterar** — notificar no `201` |
| `functions/src/routes/aprovacoes.ts` | **Alterar** — notificar no aceite |
| `functions/src/routes/perfil.ts` | **Alterar** — limpar dispositivos |
| `functions/src/index.ts` | **Alterar** — montar router |
| `README.md` | **Alterar** — VAPID + “HTTPS / iOS precisa PWA” |

Não alterar `MenuInferior`, schema de `users` / `roles` / `usersrole`, copy do sheet de recusa, nem criar tela `/notificacoes`.

---

## 12. Checklist da skill Next.js

- [ ] `"use client"` só no shell/hook/toast que falam com `Notification` / Messaging.
- [ ] Estado de permissão/token no hook — componentes só renderizam.
- [ ] Acesso HTTP no service; Messaging na lib `fcm.ts`.
- [ ] Um componente = uma coisa (`ToastPush` ≠ registro silencioso ≠ service).
- [ ] Sem abstração “NotificationCenter” para um único toast.
- [ ] CSS Modules + tokens (`--surface-container-highest`, `--primary-container`).
- [ ] Sem `console.log` de debug.

---

## 13. Relação com o código atual

| Hoje | Nesta spec |
|------|------------|
| SPEC 005: flag `notificar`, toggle no sheet, **sem** FCM | Toggle passa a registrar token; flag controla o aceite |
| SPEC 007: toast “O piloto será notificado”, **sem** envio | `PATCH` aceitar dispara FCM |
| SPEC 007: recusa some o card | Recusa continua sem push |
| SPEC 012: Serwist + `/offline` | Mesmo SW ganha `onBackgroundMessage` |
| `.env.local` já tem `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | `.env.example` documenta; client usa no `getToken` |
| `Usuario` sem token | Continua limpo; tokens em `dispositivos` |
| `POST` participação idempotente | Continua; push só no create |
| `DELETE /perfil` apaga `users/{uid}` | + `dispositivos` daquele uid |
| `logout()` só `signOut` | + best-effort `DELETE /dispositivos` |
| `firebase-admin.ts` Auth + Firestore | + `getMessaging()` |
| Sem scheduler | Continua sem |

---

## 14. Ordem sugerida de implementação (quando for pedir código)

1. Coleção + repositório + `POST/DELETE /dispositivos` + `adminMessaging`.
2. `lib/notificacoes.ts` + gancho no `201` da participação e no aceite do `PATCH`.
3. `fcm.ts` + service + `useRegistroFcm` no `GuardaApp`.
4. Estender `sw.ts` (SPEC 012) + `getToken` com a registration.
5. Gestos: publicar rolê + toggle do sheet.
6. Foreground toast + deep link no clique.
7. Logout e `DELETE /perfil`.
8. Teste em HTTPS (Android; iOS só com PWA instalado).
