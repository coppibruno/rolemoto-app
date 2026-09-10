# SPEC 005 — Confirmação de Participação no Rolê

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-09  
> **Referência visual:** `designs/confirmacao-participacao/` (`DESIGN.md`, `code.html`, `screen.png`)  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade  
> **Backend:** Cloud Function `api` (Express) — participação em `POST|GET|PATCH|DELETE /roles/:id/participacao`  
> **Coleção Firestore:** `usersrole` (vínculo usuário ↔ rolê)  
> **Depende de:** SPEC 001 (shell autenticado), SPEC 003 (schema `roles` + feed + rota `/roles/:id/participar`), SPEC 004 (rolê publicado)

---

## 1. Objetivo

Substituir o placeholder de `/roles/:id/participar` pela **confirmação de solicitação de vaga**, alinhada ao mock.

O piloto toca **Participar do Rolê** no feed, o app **grava o pedido** na coleção `usersrole` (`aceito: false`) e mostra o bottom sheet: *Solicitação enviada com sucesso*, aguardando o piloto líder. Dali ele volta ao feed, liga/desliga o aviso do pedido ou **cancela**.

Esta spec é **full stack**:

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | UI do mock (fundo desfocado + sheet), GET do rolê, POST/PATCH/DELETE da participação, estados pendente/confirmado/recusado |
| Back (Functions) | Token válido, coleção `usersrole`, uid só do token, um pedido por par usuário+rolê, persistência só via repositório |

O organizador **ainda não** tem tela para aceitar/recusar. O documento já nasce com a flag `aceito` para essa spec futura não migrar schema.

A coleção `solicitacoes` do contexto antigo **não** é criada. O vínculo vive em **`usersrole`**.

---

## 2. Referência de Design

Replicar o visual de `designs/confirmacao-participacao/` (`code.html` + `screen.png`). Não inventar outro layout. Tokens em `DESIGN.md` / `globals.css`.

### O que entra nesta spec (do mock)

- Header sticky: logo + **Roles Feed / Cockpit** + avatar (link para `/perfil`) — mesmo bloco do feed.
- Fundo: “detalhe” do rolê desfocado (capa, ritmo, km, título, descrição, data, ponto).
- Overlay escuro + **bottom sheet** de confirmação.
- Handle, faixa luminosa no topo do sheet, pulso **Aguardando Piloto Líder**.
- Título **SOLICITAÇÃO ENVIADA COM SUCESSO!**
- Texto com `@apelido` do organizador.
- Mini card: título, badge de ritmo, horário, contagem de pilotos, ponto de partida.
- Card **Checklist Pré-Pista** (copy estática do mock).
- CTA primário **Voltar ao Feed de Rolês**.
- Secundários: **Notificações On / Silenciado** e **Cancelar Pedido**.

### O que o mock mostra e **não** entra

| Elemento do mock | Motivo |
|------------------|--------|
| Sino de notificações no header | Mesmo recorte das SPECs 001–004 |
| Limite `12/15` vagas | SPECs 003/004 não têm `limiteVagas` no documento `roles` |
| Push notification real / FCM | Só a flag `notificar` no documento; envio fica para spec futura |
| Tela do líder aceitar/recusar | Outra spec; schema já prevê `aceito` |
| Menu inferior | Já na SPEC 001 |

### Desvios conscientes do mock (necessários)

O HTML é um overlay estático sobre um detalhe fictício. No app, a rota **é** `/roles/:id/participar` (já ligada no feed). O “detalhe atrás” é decorativo, montado com o rolê real.

| Mock | Nesta spec | Por quê |
|------|------------|---------|
| Pedido já “existia” (só UI) | Ao entrar na rota, **POST** se ainda não houver `usersrole` | O CTA do feed é a intenção de participar |
| `12/15 pilotos` | `{N} confirmados` (só quem tem `aceito: true`) | Sem teto de vagas no schema |
| `185 km totais` no fundo | Haversine `localSaida` → `destinoFinal`, inteiro + ` km` | Não há polyline; linha reta basta no backdrop |
| Toggle de notificação só no DOM | `PATCH` persiste `notificar` em `usersrole` | Recarregar a tela não perde o estado |
| `alert` / `confirm` nativos no script | `confirm` nativo no cancelar; voltar ao feed via App Router | Sem lib de modal extra |

Não adicionar mapa, chat do comboio nem lista de avatares de confirmados.

### Comportamento visual (do mock)

- Conteúdo em coluna única, gutter 16px, **max-width 560px** (já no shell `(app)`).
- Header fixo, altura 64px + `env(safe-area-inset-top)`, fundo `surface` com blur.
- Backdrop do detalhe: `opacity: 0.3` + `blur(2px)`, `pointer-events: none`, `aria-hidden`.
- Overlay: `surface-container-lowest` a ~80% + `backdrop-filter`.
- Sheet: `surface-container-high`, `rounded-t-xl`, faixa 4px `via-primary-container` no topo, handle 48×4px `surface-bright`.
- Pulso: bolinha `primary-container` com `animate-ping`.
- Título do sheet: `display-hero-mobile` (Barlow Condensed 36px), uppercase.
- Mini card: `surface-container-low`. Badge de ritmo nas cores semânticas (iguais ao feed).
- Checklist: `surface-container`, ícone `tune` em círculo `surface-bright`.
- CTA: altura `touch-target` (56px), `primary-container`, glow `0 4px 16px rgba(255, 107, 0, 0.38)`, Barlow Condensed uppercase.
- Secundários: altura `touch-min` (48px), grid 2 colunas, `surface-container`.

### Ritmo no badge do mini card

Mesmos valores de `RitmoRole`. Label composta **Nome (faixa)**, como o mock:

| Valor | Texto do badge |
|-------|----------------|
| `tranquila` | Tranquila (abaixo de 90 km/h) |
| `moderada` | Moderada (90-120 km/h) |
| `agressiva` | Agressiva (track / ritmo forte) |

Cores: iguais ao feed (`--ritmo-tranquila` / `--secondary-container` / `--error`).

---

## 3. Fluxo do Usuário

```
Grupo (app) — autenticado e com perfil (GuardaApp)
  │
  ▼
Feed → [Participar do Rolê]  →  /roles/:id/participar
  │
  ▼
GET /roles/:id  (detalhe + criador + contagens + minhaParticipacao)
  │
  ├── 404 → EstadoErro “Rolê não encontrado” + voltar ao feed
  ├── criadorId === uid → EstadoOrganizador (sem POST)
  ├── minhaParticipacao.recusadoEm preenchido → sheet Recusado
  ├── minhaParticipacao.aceito === true → sheet Confirmado
  ├── minhaParticipacao pendente → sheet Aguardando (sem novo POST)
  └── sem pedido
        └── POST /roles/:id/participacao
              ├── 201 / 200 → sheet Aguardando
              ├── 403 (sou o criador) → EstadoOrganizador
              ├── 400 / 404 → EstadoErro
              └── 401 → GuardaApp / login
  │
  ├── [Voltar ao Feed] / overlay / Esc → /
  ├── [Notificações] → PATCH { notificar } (otimista)
  └── [Cancelar Pedido] → confirm → DELETE → /
```

- Abrir a URL de novo **não** duplica o pedido (POST idempotente).
- Cancelar **apaga** o documento. Um novo toque em Participar cria outro pedido (`aceito: false`).
- Voltar ao feed **não** cancela o pedido.
- Avatar do header → `/perfil`.

---

## 4. Arquitetura Next.js

Seguir a skill: página orquestradora, componentes ~80 linhas, lógica em hooks, API em service. `"use client"` só no que tem estado, confirm, toggle ou `useAuth`.

A participação **não** pode ser Server Action com fetch no servidor: a rule do projeto exige Bearer no client (`auth.currentUser`).

### 4.1 Por que a page continua Server Component

`(app)/layout` já protege a rota. `/roles/[id]/participar` só monta a tela. O `id` vem dos `params`.

```tsx
// src/app/(app)/roles/[id]/participar/page.tsx — Server Component
import { TelaConfirmacaoRole } from "./components/TelaConfirmacaoRole";

type Props = { params: Promise<{ id: string }> };

const ParticiparPage = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <main>
      <TelaConfirmacaoRole roleId={id} />
    </main>
  );
};

export default ParticiparPage;
```

Next.js 15: `params` é `Promise`. Não usar `params.id` síncrono.

### 4.2 Estrutura por feature

A rota **já existe** (placeholder da SPEC 003). Trocar o conteúdo; organizar como `perfil/` e `criar-role/`.

```
src/app/(app)/roles/[id]/participar/
├── page.tsx                              # Server — orquestrador
├── components/
│   ├── TelaConfirmacaoRole.tsx           # Client — composição
│   ├── FundoDetalheRole.tsx              # Backdrop desfocado
│   ├── OverlayConfirmacao.tsx            # Backdrop escuro + sheet
│   ├── SheetConfirmacao.tsx              # Handle, status, título, ações
│   ├── StatusAguardando.tsx              # Pulso + “Aguardando Piloto Líder”
│   ├── MiniCardRole.tsx                  # Resumo no sheet
│   ├── ChecklistPrePista.tsx             # Copy estática
│   ├── BotaoVoltarFeed.tsx
│   ├── BotaoNotificacoes.tsx
│   ├── BotaoCancelarPedido.tsx
│   ├── EstadoCarregando.tsx
│   ├── EstadoErro.tsx
│   └── EstadoOrganizador.tsx             # Criador não solicita vaga
├── hooks/
│   ├── useConfirmacaoParticipacao.ts     # GET + POST + estados
│   └── usePreferenciaNotificar.ts        # Toggle + PATCH
├── services/
│   └── participacao.service.ts           # GET detalhe + CRUD participação
├── constants.ts                          # Copy checklist, labels de ritmo
└── confirmacao-role.module.css
```

Reusar `CabecalhoFeed` do feed (o mock é o mesmo header). Reusar `formatarHorarioSaida` de `feed/formatar-horario.ts`. **Não** copiar o service de listagem do feed.

### 4.3 Responsabilidades

| Peça | Tipo | Faz |
|------|------|-----|
| `page.tsx` | Server | Lê `id`, monta `TelaConfirmacaoRole` |
| `TelaConfirmacaoRole` | Client | Liga hook + header + fundo + sheet |
| `useConfirmacaoParticipacao` | Hook | Loading, erro, detalhe, POST inicial, DELETE |
| `usePreferenciaNotificar` | Hook | Estado do sino + PATCH |
| `participacao.service` | Service | Chamadas `api` — **sem** Firestore no client |
| `FundoDetalheRole` | UI | Capa e dados do rolê, só visual |
| `SheetConfirmacao` | UI | Um estado de copy por vez (pendente / aceito / recusado) |
| `MiniCardRole` | UI | Título, ritmo, hora, confirmados, ponto |
| `EstadoOrganizador` | UI | Mensagem + voltar ao feed |

**Não misturar** no mesmo arquivo: JSX do sheet + POST + PATCH + Haversine.

**Não** usar `addDoc` / `setDoc` em `src/lib/firestore.ts`. Persistência só pela function.

### 4.4 Item ativo no menu

O mock deixa **Rolês** laranja nesta tela. Hoje `useItemMenuAtivo` compara `pathname === "/"`.

Ajuste pontual em `useItemMenuAtivo`: Rolês ativo se `pathname === "/"` **ou** `pathname.startsWith("/roles")`. Não criar item de menu novo.

---

## 5. Contrato dos Dados (front)

```ts
export type UsuarioRole = {
  id: string;
  usuarioId: string;
  roleId: string;
  criadorId: string;
  aceito: boolean;
  notificar: boolean;
  createdAt: string; // ISO — quando pediu a vaga
  updatedAt: string;
  aceitoEm: string | null;
  recusadoEm: string | null;
};

export type RoleDetalhe = Role & {
  criador: RoleCriadorResumo;
  distanciaKm: number; // Haversine partida → destino (backdrop)
  participantes: {
    confirmados: number;
  };
  minhaParticipacao: UsuarioRole | null;
};

export type EstadoSheet =
  | "aguardando"
  | "confirmado"
  | "recusado"
  | "organizador";
```

`Role` e `RoleCriadorResumo` já existem em `src/types/role.ts`. Exportar `UsuarioRole` e `RoleDetalhe` no mesmo arquivo (ou em `src/types/usuario-role.ts` se preferir não inflar `role.ts`).

### Copy do sheet por estado

| Estado | Faixa | Título | Corpo |
|--------|-------|--------|-------|
| `aguardando` | Aguardando Piloto Líder | SOLICITAÇÃO ENVIADA COM SUCESSO! | Você pediu entrada no comboio. O organizador **@apelido** irá revisar seu perfil… |
| `confirmado` | Vaga confirmada na grade | VOCÊ ESTÁ NO COMBOIO! | O organizador **@apelido** confirmou sua vaga. |
| `recusado` | Pedido recusado | SEM VAGA DESTA VEZ | O organizador **@apelido** não confirmou sua entrada neste rolê. |
| `organizador` | — | — | Você organiza este rolê. Não é possível solicitar vaga na própria saída. |

No estado `recusado` / `organizador`: esconder **Cancelar Pedido** e o toggle de notificações. Só **Voltar ao Feed**.

Checklist só no estado `aguardando` (é “enquanto espera”).

---

## 6. Implementação Front

### 6.1 Service

```ts
// src/app/(app)/roles/[id]/participar/services/participacao.service.ts
import { api } from "@/lib/api";
import type { RoleDetalhe, UsuarioRole } from "@/types/role";

export const participacaoService = {
  buscarDetalhe: (roleId: string) =>
    api<RoleDetalhe>(`/roles/${roleId}`),

  solicitar: (roleId: string) =>
    api<UsuarioRole>(`/roles/${roleId}/participacao`, { method: "POST" }),

  atualizarNotificar: (roleId: string, notificar: boolean) =>
    api<UsuarioRole>(`/roles/${roleId}/participacao`, {
      method: "PATCH",
      body: JSON.stringify({ notificar }),
    }),

  cancelar: (roleId: string) =>
    api<void>(`/roles/${roleId}/participacao`, { method: "DELETE" }),
};
```

Usar `api` (Bearer automático). Um único `carregando` no hook principal. Tratar `ApiError` (400/401/403/404).

O `api` já aceita 201 e 204 (`DELETE` → `undefined`).

### 6.2 Hook principal (esqueleto)

```ts
// ao montar:
const detalhe = await participacaoService.buscarDetalhe(roleId);

if (detalhe.criadorId === uid) { /* estado organizador */ }

if (!detalhe.minhaParticipacao) {
  const pedido = await participacaoService.solicitar(roleId);
  // mesclar pedido em detalhe.minhaParticipacao
}
```

Não disparar POST se já houver `minhaParticipacao` ou se for o criador.

Cancelar:

1. `window.confirm("Deseja realmente cancelar a solicitação para o rolê {titulo}?")`
2. DELETE; em 204, `router.push("/")`.
3. Falha: mensagem no sheet, permanece na tela.

### 6.3 Toggle de notificações

- Ligado (default): ícone `notifications_active` em `primary`, texto **Notificações On**.
- Desligado: ícone `notifications_off` em `on-surface-variant`, texto **Silenciado**.
- Clique inverte na hora e manda PATCH. Se o PATCH falhar, reverte o toggle e mostra texto de erro curto acima dos botões.

Sem FCM nesta spec. A flag só registra a preferência.

### 6.4 Fundo desfocado

Dados reais do `GET /roles/:id`:

| Zona | Conteúdo |
|------|----------|
| Capa | `fotoCapaUrl`, altura ~176px (`h-44`), `object-fit: cover` |
| Badge | Ritmo (cor semântica) |
| Métrica | `{distanciaKm} km totais` |
| Título | `titulo` uppercase `headline-lg` |
| Texto | `descricao` (omitir se `""`) |
| Data | `formatarHorarioSaida(dataHoraSaida)` + ícone `calendar_month` |
| Ponto | `localSaida.endereco` no mini card; no fundo o mock mostra vagas — **omitir** o tile de vagas (desvio 12/15) |

O fundo não é clicável e não precisa ser uma tela de detalhe completa.

### 6.5 Tokens CSS

CSS Modules em `confirmacao-role.module.css`. Sem hex solto no TSX.

| Token | Uso |
|-------|-----|
| `--surface` / `--surface-container` / `-low` / `-high` / `-lowest` / `-bright` | Página, overlay, sheet, cards |
| `--primary` / `--primary-container` | Faixa, pulso, CTA, ícones |
| `--on-surface` / `--on-surface-variant` | Título / corpo |
| `--secondary-container` / `--error` / `--ritmo-tranquila` | Badge de ritmo |
| `--gutter-md` / `--touch-min` / `--touch-target` | Espaçamento e toque |

Tipografia: Barlow Condensed em títulos/CTA/badges; Plus Jakarta Sans no body. Ícones: Material Symbols Outlined.

Padding inferior: dock (SPEC 001) + sheet. O sheet fica `fixed` acima do menu (`bottom` = altura do dock + safe area), **não** escondido atrás do `MenuInferior`. No mock o sheet tem `pb-8` e o nav continua visível.

### 6.6 Acessibilidade

- Sheet: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` no título.
- Handle visual, não precisa ser botão.
- Overlay: clique fecha o dialog **voltando ao feed** (pedido permanece); `Esc` igual.
- CTA: texto visível “Voltar ao Feed de Rolês”.
- Toggle: `aria-pressed` no estado de notificar.
- Cancelar: `aria-label="Cancelar pedido de participação"`.
- Fundo: `aria-hidden="true"`.
- Área de toque ≥ 48px; CTA 56px.
- Foco inicial no CTA primário ao abrir o sheet.
- `disabled` em Cancelar/Notificar enquanto `cancelando` ou `salvandoNotificar`.

### 6.7 Header

Reusar `CabecalhoFeed`. Sem sino. Avatar → `/perfil`.

---

## 7. Backend — Coleção `usersrole` e rotas

Não usar `onCall`. Rotas **sem** `firestore.collection` direto. Factory em `repositories/index.ts`.

Em Firestore “tabela” = coleção. Nome pedido pelo produto: **`usersrole`**.

### 7.1 Documento Firestore (`usersrole/{id}`)

**Id do documento:** `{usuarioId}_{roleId}` (garante um vínculo por par; sem índice unique extra).

```
{
  usuarioId: string,          // uid do token na criação
  roleId: string,
  criadorId: string,          // denormalizado do rolê (inbox do líder no futuro)
  aceito: boolean,            // false = pendente; true = líder confirmou
  notificar: boolean,         // default true
  createdAt: timestamp,       // quando o piloto pediu
  updatedAt: timestamp,
  aceitoEm: timestamp | null, // quando aceito passou a true
  recusadoEm: timestamp | null
}
```

| Campo | Obrigatório | Notas |
|-------|-------------|-------|
| `usuarioId` | Sim | Só do Bearer. Nunca do body |
| `roleId` | Sim | Param da URL |
| `criadorId` | Sim | Cópia de `roles.criadorId` no POST |
| `aceito` | Sim | Sempre `false` neste POST |
| `notificar` | Sim | Default `true` |
| `createdAt` | Sim | Server timestamp na criação |
| `updatedAt` | Sim | Server timestamp em create/patch |
| `aceitoEm` | Sim (pode null) | `null` até o líder aceitar |
| `recusadoEm` | Sim (pode null) | `null` até recusa (spec futura) |

**Invariantes**

- `aceito === true` ⇒ `aceitoEm != null` e `recusadoEm == null`.
- `recusadoEm != null` ⇒ `aceito === false` e `aceitoEm == null`.
- Pendente: `aceito === false` e ambos os instantes `null`.

**Não gravar:** array `participantes` dentro de `roles` (SPEC 003 tirou de propósito). Contagem sai de `usersrole`.

Nesta spec **nenhum** endpoint seta `aceito: true` nem `recusadoEm`. Os campos existem para a tela do líder.

### 7.2 Tipos de domínio (Functions)

```ts
// functions/src/types/usuario-role.ts
export interface UsuarioRole {
  id: string;
  usuarioId: string;
  roleId: string;
  criadorId: string;
  aceito: boolean;
  notificar: boolean;
  createdAt: string;
  updatedAt: string;
  aceitoEm: string | null;
  recusadoEm: string | null;
}

export type UsuarioRoleCreate = {
  usuarioId: string;
  roleId: string;
  criadorId: string;
};

export type UsuarioRoleNotificar = {
  notificar: boolean;
};
```

Front: o mesmo shape em ISO.

Estender `Role` no GET por id:

```ts
export type RoleDetalhe = Role & {
  criador: RoleCriadorResumo;
  distanciaKm: number;
  participantes: { confirmados: number };
  minhaParticipacao: UsuarioRole | null;
};
```

`GET /roles` (feed) **não** muda: continua `RoleFeedItem[]` sem participação. Evita N+1 no feed nesta spec. Trocar o CTA do card para “Aguardando…” fica **fora**.

### 7.3 Auth

1. `rolesRouter.use(autenticar)` já cobre `/roles/:id` e `/roles/:id/participacao`.
2. Token inválido / sem Bearer → **401**.
3. `usuarioId` **somente** de `req.usuario.uid`.

Admin SDK ignora Security Rules: a function autoriza.

### 7.4 Repositório

```ts
// functions/src/repositories/interfaces/usuario-role.repository.ts
export interface UsuarioRoleRepository {
  buscarPorId(id: string): Promise<UsuarioRole | null>;
  buscarPorUsuarioERole(
    usuarioId: string,
    roleId: string,
  ): Promise<UsuarioRole | null>;
  contarConfirmados(roleId: string): Promise<number>;
  criar(dados: UsuarioRoleCreate): Promise<UsuarioRole>;
  atualizarNotificar(
    id: string,
    dados: UsuarioRoleNotificar,
  ): Promise<UsuarioRole | null>;
  remover(id: string): Promise<boolean>;
}
```

Implementação: `functions/src/repositories/firestore/firestore-usuario-role.repository.ts`.

- `criar`: `doc(usersrole, `${usuarioId}_${roleId}`)`. Se o doc **já existe**, devolver o existente (idempotência). Não sobrescrever `aceito` / datas.
- `criar` (doc novo): `aceito: false`, `notificar: true`, `aceitoEm: null`, `recusadoEm: null`, timestamps de servidor.
- `contarConfirmados`: `where("roleId", "==", roleId).where("aceito", "==", true)` + `count()` (aggregation). Índice composto `roleId` + `aceito`.
- `remover`: `delete` do doc. Só o dono (`usuarioId === uid`) nesta spec.

Exportar no factory `repositories/index.ts`.

### 7.5 `GET /roles/:id` (ajuste)

Hoje devolve só `Role`. Esta spec **enriquece** para `RoleDetalhe`:

1. 404 se o rolê não existe.
2. `criador` via `usuarioRepository.buscarPorId` (fallback `apelido: "piloto"`, `fotoUrl: ""`).
3. `distanciaKm` = `Math.round(haversineKm(localSaida, destinoFinal))`.
4. `participantes.confirmados` via `contarConfirmados`.
5. `minhaParticipacao` via `buscarPorUsuarioERole(uid, id)`.

Não quebrar clientes: o feed não usa este GET. O objeto ganha campos; os do `Role` permanecem.

### 7.6 `POST /roles/:id/participacao`

Sem body (ou body ignorado). Tudo sai do token + rolê.

| Caso | Status | Corpo |
|------|--------|-------|
| Rolê inexistente | 404 | `{ erro: "Rolê não encontrado" }` |
| `criadorId === uid` | 403 | `{ erro: "O organizador não solicita vaga no próprio rolê" }` |
| `dataHoraSaida` já passou | 400 | `{ erro: "este rolê já aconteceu" }` |
| Pedido existente **recusado** | 409 | `{ erro: "solicitação recusada" }` |
| Pedido existente pendente/aceito | **200** | `UsuarioRole` (não duplica) |
| Criado | **201** | `UsuarioRole` |

Campos extras no body (`usuarioId`, `aceito: true`, …) **não** são persistidos.

### 7.7 `GET /roles/:id/participacao`

Devolve **só** o `UsuarioRole` do uid autenticado neste rolê.

| Caso | Status |
|------|--------|
| Sem documento | 404 `{ erro: "Participação não encontrada" }` |
| Existe | 200 `UsuarioRole` |

A tela prefere o GET do rolê (já traz `minhaParticipacao`). Este GET existe para o PATCH/debug e para não acoplar o toggle ao detalhe.

### 7.8 `PATCH /roles/:id/participacao`

Body: `{ "notificar": boolean }` **somente**.

| Caso | Status |
|------|--------|
| Body sem boolean `notificar` | 400 `{ erro: "notificar é obrigatório" }` |
| Sem documento | 404 |
| Doc de outro uid (impossível pelo id composto + uid) | 404 |
| Doc recusado | 409 (não atualiza preferência) |
| Ok | 200 `UsuarioRole` |

Não aceitar `aceito` neste PATCH.

### 7.9 `DELETE /roles/:id/participacao`

| Caso | Status |
|------|--------|
| Sem documento | 404 |
| Ok | **204** vazio |

Pendente ou já aceito: o piloto pode sair (cancela o pedido / deixa o comboio). Recusado: 404 ou 204 idempotente — preferir **204** se o doc não existe (cancelar duas vezes não quebra a UI).

### 7.10 Ordem das rotas Express

Registrar **antes** de handlers genéricos se necessário. Em `roles.ts` (ou router dedicado montado em `/roles`):

```
GET    /:id/participacao
POST   /:id/participacao
PATCH  /:id/participacao
DELETE /:id/participacao
GET    /:id
```

`/:id/participacao` não colide com `GET /:id`.

Preferir arquivo `functions/src/routes/participacao.ts` com as quatro rotas de participação, importado e `rolesRouter.use` / handlers no mesmo prefixo, para não inflar `roles.ts`. O GET enriquecido do rolê permanece em `roles.ts`.

### 7.11 Índices

Em `firestore.indexes.json`:

```json
{
  "collectionGroup": "usersrole",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "roleId", "order": "ASCENDING" },
    { "fieldPath": "aceito", "order": "ASCENDING" }
  ]
}
```

Busca por id composto não precisa de índice. `buscarPorUsuarioERole` usa o id `{uid}_{roleId}`.

### 7.12 O que não muda

- Function HTTP única `api`.
- `GET /roles` filtrado (SPEC 003).
- `POST /roles` (SPEC 004).
- Sem array `participantes` em `roles`.

---

## 8. Wireframe

```
┌─────────────────────────────────┐
│ [logo] ROLES FEED          (👤) │  header sticky
│        COCKPIT                  │
├─────────────────────────────────┤
│ ░░ capa + título + data ░░      │  fundo blur / 30%
│                                 │
│ ╔═════════════════════════════╗ │
│ ║ ── handle ──                ║ │  sheet
│ ║ ● Aguardando Piloto Líder 🪖║ │
│ ║                             ║ │
│ ║ SOLICITAÇÃO ENVIADA         ║ │
│ ║ COM SUCESSO!                ║ │
│ ║ Você pediu entrada… @apelido║ │
│ ║ ┌─────────────────────────┐ ║ │
│ ║ │ ↗ TÍTULO     Moderada   │ ║ │
│ ║ │ 🕒 Sábado, 07:00  12 conf.│ ║ │
│ ║ │ 📍 Ponto: Posto BR…     │ ║ │
│ ║ └─────────────────────────┘ ║ │
│ ║ ⚙ Checklist Pré-Pista       ║ │
│ ║   Calibrar pneus, tanque…   ║ │
│ ║                             ║ │
│ ║ [  VOLTAR AO FEED DE ROLÊS →]║ │
│ ║ [🔔 Notificações On][✕ Cancelar]║
│ ╚═════════════════════════════╝ │
├─────────────────────────────────┤
│  🏍️        ( + )        👤     │  menu (SPEC 001) — Rolês ativo
└─────────────────────────────────┘
```

---

## 9. Fora do Escopo

- Tela do organizador para **aceitar / recusar** (só o schema).
- Push / FCM / sino do header.
- Limite de vagas, waitlist, categoria de moto.
- Alterar o botão do feed para “Aguardando” / “Confirmado no Rolê”.
- Mapa, detalhe completo do rolê como tela própria (o fundo é só atmosfera).
- Histórico de pedidos cancelados (DELETE é definitivo).
- Paginação de participantes.
- Menu inferior e guarda de rota (SPEC 001), salvo o pathname ativo de Rolês.

---

## 10. Critérios de Aceite

### Front

- [ ] `/roles/:id/participar` deixa de ser placeholder e segue o mock (fundo blur, overlay, sheet, checklist, CTAs).
- [ ] Entrar na rota com rolê válido **cria** o pedido se ainda não existir; segunda visita **não** duplica.
- [ ] Sheet pendente: pulso, título de sucesso, `@apelido` real, mini card, checklist, três ações.
- [ ] **Voltar ao Feed**, overlay e Esc navegam para `/` **sem** apagar o pedido.
- [ ] Toggle persiste `notificar` (On / Silenciado) via PATCH; falha reverte o UI.
- [ ] **Cancelar Pedido** pede confirm com o título do rolê; DELETE + redirect `/`.
- [ ] Criador do rolê vê estado organizador, sem POST.
- [ ] Rolê inexistente: erro + voltar; distinto de “já recusado”.
- [ ] Confirmados no mini card batem com `participantes.confirmados` (sem `/15`).
- [ ] Horário no formato do feed (`Sábado, 07:00` / `Hoje, 22:30`).
- [ ] Sem sino no header; menu permanece; item Rolês ativo em `/roles/...`.
- [ ] `page.tsx` Server; Client só onde há interatividade.
- [ ] Componentes < ~80 linhas; fetch no service; sem Firestore no client.
- [ ] Toque ≥ 48px; usável a partir de 360px; sheet acima do dock.

### Back

- [ ] Coleção `usersrole` no schema desta spec; id `{usuarioId}_{roleId}`.
- [ ] `POST /roles/:id/participacao` exige Bearer; `usuarioId` só do token; `aceito: false`.
- [ ] POST idempotente: 201 na criação, 200 se já pendente/aceito; 409 se recusado.
- [ ] 403 se o uid é o `criadorId`; 404 se o rolê não existe; 400 se a partida já passou.
- [ ] `GET /roles/:id` devolve `RoleDetalhe` (criador, `distanciaKm`, confirmados, `minhaParticipacao`).
- [ ] PATCH só altera `notificar`; DELETE remove o doc (204).
- [ ] Persistência só em `FirestoreUsuarioRoleRepository`.
- [ ] Documento `roles` **não** ganha array `participantes`.
- [ ] Índice `roleId` + `aceito` em `firestore.indexes.json`.

---

## 11. Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| `src/app/(app)/roles/[id]/participar/page.tsx` | **Alterar** — orquestrador Server |
| `src/app/(app)/roles/[id]/participar/**` | **NOVO** — UI, hooks, service, CSS |
| `src/types/role.ts` (ou `usuario-role.ts`) | **Alterar** — `UsuarioRole`, `RoleDetalhe` |
| `src/components/menu-inferior/hooks/useItemMenuAtivo.ts` | **Alterar** — `/roles` conta como Rolês |
| `src/app/(app)/feed/components/BotaoParticipar.tsx` | Sem mudança de href |
| `functions/src/types/usuario-role.ts` | **NOVO** |
| `functions/src/types/role.ts` | **Alterar** — `RoleDetalhe` |
| `functions/src/routes/roles.ts` | **Alterar** — GET `/:id` enriquecido |
| `functions/src/routes/participacao.ts` | **NOVO** — POST/GET/PATCH/DELETE |
| `functions/src/repositories/interfaces/usuario-role.repository.ts` | **NOVO** |
| `functions/src/repositories/firestore/firestore-usuario-role.repository.ts` | **NOVO** |
| `functions/src/repositories/index.ts` | **Alterar** — factory |
| `functions/src/index.ts` | Só se o health listar a nova rota (opcional) |
| `firestore.indexes.json` | **Alterar** — índice `usersrole` |

Não alterar `MenuInferior` visualmente. Não voltar `participantes[]` para `roles`.

---

## 12. Checklist da skill Next.js

- [ ] `page.tsx` sem `"use client"` (só orquestra + `params`).
- [ ] `"use client"` só em `TelaConfirmacaoRole` e filhos interativos.
- [ ] GET/POST/PATCH/DELETE em hooks separados da UI (participação vs notificar).
- [ ] API isolada em `participacao.service.ts` (sem Firestore no componente).
- [ ] Um componente = uma coisa (fundo, sheet, mini card, checklist, botão).
- [ ] Sem abstração genérica “pra futuro” (inbox do líder, FCM, vagas).
- [ ] CSS Modules + tokens de `globals.css`.
- [ ] Sem `console.log` de debug.

---

## 13. Relação com o código atual

| Hoje | Nesta spec |
|------|------------|
| `/roles/:id/participar` placeholder | Sheet de confirmação + pedido real |
| Contexto antigo: coleção `solicitacoes` + `participantes[]` | Coleção **`usersrole`**; `roles` intacto |
| `GET /roles/:id` devolve `Role` cru | `RoleDetalhe` com criador, km, confirmados, meu pedido |
| Feed CTA só navega | Navegação igual; o POST acontece **na tela destino** |
| Menu: Rolês ativo só em `/` | Também ativo em `/roles/...` |

Não migrar documentos fictícios. Coleção vazia: o primeiro pedido nasce no POST desta tela.

A spec do líder (aceitar/recusar) deverá usar `PATCH` autenticado como `criadorId` (ou admin) setando `aceito` / `aceitoEm` / `recusadoEm`. **Não** implementar nesse PR.
