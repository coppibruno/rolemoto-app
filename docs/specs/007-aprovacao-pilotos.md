# SPEC 007 — Aprovação de Pilotos (Cockpit Líder)

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-09  
> **Referência visual:** `designs/aprovacao-integrante/` (`DESIGN.md`, `code.html`, `screen.png`)  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade  
> **Backend:** Cloud Function `api` (Express) — inbox do líder em `GET|PATCH /aprovacoes`  
> **Coleção Firestore:** `usersrole` (vínculo usuário ↔ rolê, SPEC 005)  
> **Depende de:** SPEC 001 (shell autenticado), SPEC 003 (feed + schema `roles`), SPEC 004 (rolê publicado), SPEC 005 (`usersrole` + pedido do piloto)  
> **Estendido por:** SPEC 021 — `cidade` + `rolesRodados` no card da fila (sem estrelas)

---

## 1. Objetivo

Entregar o **Cockpit do piloto líder**: a fila de triagem para **aceitar ou recusar** quem pediu vaga nos rolês que ele organiza.

O líder vê cada pedido pendente com **dados do piloto** e **dados do rolê**, decide, recebe um alerta de sucesso e a lista **atualiza na hora** — quem foi aceito some da fila. Os já aceitos continuam acessíveis numa visão só de consulta (sem decidir de novo).

Esta spec é **full stack**:

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | UI do mock (HUD, chips, cards, Recusar/Aceitar, toast, visão Confirmados), GET da fila, PATCH da decisão |
| Back (Functions) | Token válido, listar `usersrole` do `criadorId`, enriquecer com usuário + rolê, setar `aceito` / `aceitoEm` / `recusadoEm` |

Esta spec **fecha** o que a SPEC 005 deixou explícito: o schema já tem `aceito`, `aceitoEm` e `recusadoEm`; nenhum endpoint do líder existia.

Push / FCM **não** entra. O toast promete notificação (copy do produto); o envio real fica para spec futura. A flag `notificar` em `usersrole` já existe.

---

## 2. Referência de Design

Replicar o visual de `designs/aprovacao-integrante/` (`code.html` + `screen.png`). Não inventar outro layout. Tokens em `DESIGN.md` / `globals.css`.

### O que entra nesta spec (do mock)

- Header sticky: logo + **Roles Feed / Cockpit** + avatar (link para `/perfil`) — mesmo bloco do feed.
- HUD: pulso laranja + título **Aprovações de Comboio** + badge **Cockpit Líder**.
- Subtítulo com contagem: *N pilotos na fila de triagem aguardando seu aval em M rolês ativos.*
- Chips horizontais: **Fila (N)** (equivale ao “Todos” do mock) + um chip por rolê com pedidos + chip **Confirmados (N)**.
- Card de solicitação:
  - Faixa do rolê (ícone `route`, título uppercase).
  - Contagem **N confirmados** (sem teto `/15`).
  - Avatar 56px, nome, `@apelido`, moto.
  - Badge de **pilotagem do piloto** (não o ritmo do rolê).
  - Banner **Atenção ao Ritmo do Grupo** quando `pilotagem !== ritmo` do rolê.
  - Grid **Recusar** / **Aceitar** (só na fila pendente).
- Estado vazio **Grid 100% Organizado!** + CTA **Voltar para os Rolês**.
- Toast flutuante acima do dock após a decisão.

### O que o mock mostra e **não** entra

| Elemento do mock | Motivo |
|------------------|--------|
| Sino de notificações no header | Mesmo recorte das SPECs 001–006 |
| `12/15 vagas` | SPECs 003/004/005 não têm `limiteVagas` |
| Estrelas / `(14 rolês)` | Sem reputação nem histórico agregado |
| Selo `verified` / `shield` no avatar | Sem verificação de piloto |
| Ano da moto (`• 2022`) | `users.moto` é um único string |
| Cardo Canal 4, Kit Primeiros Socorros, Garupa | Sem esses campos no perfil |
| Citação / recado do piloto | `usersrole` não tem mensagem |
| Push notification real / FCM | Só o copy do toast; envio fica para spec futura |
| Menu inferior | Já na SPEC 001 |

### Desvios conscientes do mock (necessários)

O HTML é uma fila estática de 3 cards. No app a lista vem da API, há **duas visões** (fila vs confirmados) e o líder precisa **achar** a tela.

| Mock | Nesta spec | Por quê |
|------|------------|---------|
| Página “já aberta”, sem rota | Rota autenticada `/aprovacoes` | Sem 4º item no menu (SPEC 001) |
| Só pedidos pendentes | Chip **Confirmados** lista `aceito: true` (somente leitura) | Pedido explícito: visualizar já aceitos |
| `12/15 vagas` | `{N} confirmados` | Sem teto de vagas no schema |
| Toast *“X adicionado ao comboio!”* | Toast *“X foi aceito no comboio. O piloto será notificado.”* | Pedido explícito de alerta de notificação |
| Recusar some o card, sem confirm | `window.confirm` antes de recusar | Recusa é permanente (SPEC 005: POST depois dá 409) |
| Extra badges (Cardo, kit, garupa) | Omitir | Sem dados |
| Rating / verified | Omitir | Sem dados |

Não adicionar mapa, chat, limite de vagas nem recados livres.

### Comportamento visual (do mock)

- Conteúdo em coluna única, gutter 16px, **max-width 560px** (já no shell `(app)`).
- Header fixo, altura 64px + `env(safe-area-inset-top)`, fundo `surface` com blur.
- Título HUD: `headline-md`, uppercase, Barlow Condensed. Pulso `primary-container` + `animate-pulse`.
- Badge Cockpit Líder: pill `primary-container/15`, texto `primary-container`, `badge-label`.
- Chips: altura ~32px, pill, ativo = `primary-container` + `on-primary`; inativo = `surface-container-high` + `on-surface-variant`. Scroll horizontal, sem scrollbar visível.
- Card: `surface-container`, `rounded-xl`, padding `card-padding-md`.
- Faixa do rolê: `surface-container-low`, títulos `badge-label` uppercase `primary-container`.
- Avatar 56px (`w-14 h-14`), circular.
- Nome: `headline-sm` uppercase. Apelido: `body-sm` `on-surface-variant`.
- Badge de pilotagem: mesmas cores semânticas do feed (`--ritmo-tranquila` / `--secondary-container` / `--error`).
- Alerta de ritmo: fundo `secondary-container/15`, ícone `warning`, título uppercase `label-md`.
- **Recusar**: `surface-container-highest`, texto `--error`, ícone `close`, hover `error-container`. Altura `touch-min` (48px).
- **Aceitar**: `primary-container`, glow `0 4px 14px rgba(255, 107, 0, 0.35)`, ícone `check`. Altura `touch-min`.
- Toast: pill `surface-container-highest`, `bottom` acima do dock (~96px), ícone `check_circle` (`primary-container`) no aceite e `do_not_disturb_on` (`error`) na recusa. Some após ~2,5s.
- Empty: ícone `task_alt` em círculo `primary-container/20`, título `headline-md`.

### Pilotagem no badge do card

É a **pilotagem do piloto** (`users.pilotagem`), não o ritmo do rolê. Label composta **Nome (faixa)**, como o mock:

| Valor | Texto do badge |
|-------|----------------|
| `tranquila` | Tranquila (até 90 km/h) |
| `moderada` | Moderada (90-120 km/h) |
| `agressiva` | Agressiva (track / ritmo forte) |

Alerta de ritmo **só** quando `usuario.pilotagem !== role.ritmo`. Copy do mock, com o ritmo **do rolê** em destaque:

> O ritmo planejado é **MODERADA**. Certifique-se de que o piloto está ciente da velocidade dos trechos sinuosos antes de autorizar.

---

## 3. Fluxo do Usuário

```
Grupo (app) — autenticado e com perfil (GuardaApp)
  │
  ├── Feed (/) → banner “N pilotos na fila…”     →  /aprovacoes
  ├── Feed → card do próprio rolê → “Aprovar Pilotos” →  /aprovacoes?role={id}
  └── URL direta /aprovacoes
        │
        ▼
GET /aprovacoes?status=pendente
  │
  ├── 401 → GuardaApp / login
  ├── lista vazia + resumo zerado → EstadoVazio “publique um rolê”
  ├── lista vazia + pendentes=0    → EstadoVazio “Grid 100% Organizado!”
  └── cards da fila
        │
        ├── Chip rolê / Fila / Confirmados  (filtro local + refetch se mudar status)
        ├── [Aceitar] → PATCH { decisao: "aceitar" }
        │     ├── 200 → some da fila + toast “será notificado” + atualiza contagens
        │     └── 409 / 403 / 404 → toast de erro, card permanece
        └── [Recusar] → confirm nativo → PATCH { decisao: "recusar" }
              ├── 200 → some da fila + toast de recusa
              └── falha → toast de erro, card permanece

Chip Confirmados → GET /aprovacoes?status=aceito
  │
  └── cards somente leitura (sem Recusar/Aceitar), badge “Na grade”
```

- Aceitar **não** pede confirm. Recusar **pede** (`Deseja recusar a entrada de {nome} em {titulo}?`).
- Recusar é **definitivo** para aquele par usuário+rolê (SPEC 005: novo POST do piloto → 409).
- Aceitos **não** voltam para a fila. Recusados **não** aparecem em Confirmados.
- Voltar ao feed **não** altera pedidos.
- Avatar do header → `/perfil`.
- Quem **não** é criador de nenhum pedido vê empty, não 403 — a inbox do uid simplesmente vem vazia.

### Como o líder chega aqui

O menu inferior **não** ganha item novo.

| Origem | Comportamento |
|--------|----------------|
| Feed — banner HUD | Se `resumo.pendentes > 0`: *N pilotos na fila… em M rolês ativos* (link `/aprovacoes`). Se só há aceitos: *N pilotos confirmados nos seus rolês* (link `/aprovacoes?status=aceito`). Sem pedidos e sem aceitos futuros: banner oculto. |
| Feed — card do próprio rolê | CTA **Aprovar Pilotos** (no lugar de Participar) → `/aprovacoes?role={id}`. |
| `/roles/:id/participar` (organizador) | `EstadoOrganizador` ganha o mesmo CTA para `/aprovacoes?role={id}` (hoje só volta ao feed). |

---

## 4. Arquitetura Next.js

Seguir a skill: página orquestradora, componentes ~80 linhas, lógica em hooks, API em service. `"use client"` só no que tem estado, chips, decisão ou `useAuth`.

A fila **não** pode ser Server Action com fetch no servidor: a rule do projeto exige Bearer no client (`auth.currentUser`).

### 4.1 Por que a page é Server Component

`(app)/layout` já protege a rota. `/aprovacoes` só monta a tela. Query `role` / `status` é lida no client (`useSearchParams`) porque o líder troca chips sem navegar de verdade — a page **não** precisa dos search params.

```tsx
// src/app/(app)/aprovacoes/page.tsx — Server Component
import { TelaAprovacoes } from "./components/TelaAprovacoes";

const AprovacoesPage = () => {
  return (
    <main>
      <TelaAprovacoes />
    </main>
  );
};

export default AprovacoesPage;
```

### 4.2 Estrutura por feature

```
src/app/(app)/aprovacoes/
├── page.tsx                              # Server — orquestrador
├── components/
│   ├── TelaAprovacoes.tsx                # Client — composição
│   ├── HudAprovacoes.tsx                 # Título, badge, subtítulo
│   ├── FiltrosAprovacoes.tsx             # Chips Fila / rolês / Confirmados
│   ├── ChipFiltro.tsx                    # Um chip
│   ├── ListaSolicitacoes.tsx             # Lista de cards
│   ├── CardSolicitacao.tsx               # Card pendente (ações)
│   ├── CardConfirmado.tsx                # Card aceito (somente leitura)
│   ├── FaixaRoleCard.tsx                 # Título do rolê + confirmados
│   ├── IdentidadePiloto.tsx              # Avatar, nome, apelido, moto
│   ├── BadgePilotagem.tsx
│   ├── AlertaRitmo.tsx                   # Só se divergência
│   ├── AcoesSolicitacao.tsx              # Recusar / Aceitar
│   ├── EstadoCarregando.tsx
│   ├── EstadoVazio.tsx
│   └── ToastDecisao.tsx
├── hooks/
│   ├── useFilaAprovacoes.ts              # GET + filtros + lista local
│   └── useDecisaoPiloto.ts               # PATCH aceitar/recusar + toast
├── services/
│   └── aprovacoes.service.ts
├── constants.ts                          # Copy HUD, toast, empty, labels
└── aprovacoes.module.css
```

Reusar `CabecalhoFeed` do feed (o mock é o mesmo header). **Não** copiar o service de participação do piloto.

Ajuste pontual no feed (descoberta da tela):

```
src/app/(app)/feed/components/BannerCockpitLider.tsx   # NOVO
src/app/(app)/feed/hooks/useResumoAprovacoes.ts        # NOVO — GET só para o banner
src/app/(app)/feed/components/BotaoParticipar.tsx      # Alterar — CTA do organizador
src/app/(app)/feed/components/RoleCard.tsx             # Alterar — passa criadorId / souLider
```

Reusar o mesmo `aprovacoes.service` no feed (import da feature `/aprovacoes/services`). Não duplicar o client HTTP.

### 4.3 Responsabilidades

| Peça | Tipo | Faz |
|------|------|-----|
| `page.tsx` | Server | Monta `TelaAprovacoes` |
| `TelaAprovacoes` | Client | Liga hooks + header + HUD + filtros + lista + toast |
| `useFilaAprovacoes` | Hook | Loading, erro, GET, status, chip de rolê, lista derivada |
| `useDecisaoPiloto` | Hook | PATCH, estado `decidindoId`, toast, avisa a lista para remover o item |
| `aprovacoes.service` | Service | Chamadas `api` — **sem** Firestore no client |
| `CardSolicitacao` | UI | Um pedido pendente |
| `CardConfirmado` | UI | Um aceito; badge **Na grade** + `aceitoEm`; sem botões |
| `AlertaRitmo` | UI | Só renderiza se `divergenciaRitmo` |

**Não misturar** no mesmo arquivo: JSX do card + PATCH + montagem dos chips.

**Não** usar `updateDoc` em `src/lib/firestore.ts`. Persistência só pela function.

### 4.4 Item ativo no menu

O mock deixa **Rolês** laranja nesta tela. Hoje `useItemMenuAtivo` trata `/` e `/roles...`.

Ajuste: Rolês ativo se `pathname === "/"` **ou** `pathname.startsWith("/roles")` **ou** `pathname.startsWith("/aprovacoes")`. Não criar item de menu novo.

---

## 5. Contrato dos Dados (front)

```ts
export type StatusAprovacao = "pendente" | "aceito";

export type UsuarioResumoSolicitacao = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
  moto: string;
  pilotagem: Pilotagem;
};

export type RoleResumoSolicitacao = {
  id: string;
  titulo: string;
  ritmo: RitmoRole;
  dataHoraSaida: string;
  confirmados: number;
};

export type SolicitacaoLider = {
  id: string; // usersrole id = `{usuarioId}_{roleId}`
  participacao: UsuarioRole;
  usuario: UsuarioResumoSolicitacao;
  role: RoleResumoSolicitacao;
  divergenciaRitmo: boolean;
};

export type ResumoAprovacoes = {
  pendentes: number;
  aceitos: number;
  rolesComPendentes: number;
  rolesComAceitos: number;
};

export type FilaAprovacoes = {
  resumo: ResumoAprovacoes;
  itens: SolicitacaoLider[];
};

export type DecisaoPiloto = "aceitar" | "recusar";
```

`UsuarioRole`, `Pilotagem` e `RitmoRole` já existem. Novos tipos em `src/types/aprovacao.ts` (não inflar `usuario-role.ts`).

### Copy

| Situação | Texto |
|----------|--------|
| HUD com pendentes | **{n}** piloto(s) na fila de triagem aguardando seu aval em **{m}** rolê(s) ativo(s). |
| HUD só confirmados (fila vazia) | Nenhum pedido na fila. **{n}** piloto(s) já confirmado(s) na grade. |
| Toast aceite | `{nome} foi aceito no comboio. O piloto será notificado.` |
| Toast recusa | `Solicitação de {nome} recusada.` |
| Empty fila (já teve movimento) | **Grid 100% Organizado!** Todas as solicitações de pilotos foram avaliadas. |
| Empty sem histórico | Você ainda não recebeu pedidos. Publique um rolê para montar o comboio. |
| Empty confirmados | Nenhum piloto confirmado ainda. Os aceitos da fila aparecem aqui. |
| Confirm recusar | `Deseja recusar a entrada de {nome} em {titulo}?` |

Pluralizar *piloto/pilotos* e *rolê/rolês* no HUD (como o mock: “3 pilotos … em 2 rolês”).

---

## 6. Implementação Front

### 6.1 Service

```ts
// src/app/(app)/aprovacoes/services/aprovacoes.service.ts
import { api } from "@/lib/api";
import type { DecisaoPiloto, FilaAprovacoes, SolicitacaoLider, StatusAprovacao } from "@/types/aprovacao";

export const aprovacoesService = {
  listar: (status: StatusAprovacao = "pendente") =>
    api<FilaAprovacoes>(`/aprovacoes?status=${status}`),

  decidir: (id: string, decisao: DecisaoPiloto) =>
    api<SolicitacaoLider>(`/aprovacoes/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ decisao }),
    }),
};
```

Usar `api` (Bearer automático). Tratar `ApiError` (400/401/403/404/409).

### 6.2 Hook da fila (esqueleto)

```ts
// ao montar e quando `status` muda:
const fila = await aprovacoesService.listar(status);

// chips de rolê = distinct role.id em fila.itens
// filtro local por roleId (query ?role= pré-seleciona)
// após PATCH sucesso: remove o item da lista local e ajusta resumo
//   aceitar: pendentes - 1, aceitos + 1, confirmados do role + 1
//   recusar: pendentes - 1
```

Não refetch a lista inteira se o PATCH devolveu 200 — atualização local evita flicker. Refetch só no pull/erro ou ao trocar `status`.

Chip **Confirmados** troca `status` para `"aceito"` e dispara novo GET. Chip **Fila** volta para `"pendente"`.

`?role={id}` (search param): seleciona o chip daquele rolê se ele existir na lista atual; senão cai em Fila/Todos.

`?status=aceito`: abre direto a visão Confirmados (banner do feed).

### 6.3 Decisão

**Aceitar**

1. `disabled` no par de botões daquele card (`decidindoId === id`).
2. PATCH `{ decisao: "aceitar" }`.
3. 200: remove o card (animação opcional `translateX(100px)` + fade, ~280ms como o mock), toast de notificação, atualiza HUD.
4. Falha: toast curto de erro; o card permanece.

**Recusar**

1. `window.confirm` com nome + título do rolê.
2. Se cancelar, não chama a API.
3. PATCH `{ decisao: "recusar" }`; animação `translateX(-100px)`.
4. 200: some da fila; **não** entra em Confirmados.

Na visão Confirmados **não** há botões. Sem “desfazer aceite” nesta spec.

### 6.4 Banner no feed

`useResumoAprovacoes` chama `aprovacoesService.listar("pendente")` e usa só `resumo` (os `itens` podem ser ignorados). Se a chamada falhar, o banner some — o feed continua utilizável.

Não bloquear o skeleton do feed à espera desse GET.

### 6.5 CTA do organizador no feed

`BotaoParticipar` hoje sempre aponta para `/roles/:id/participar`.

Se `role.criadorId === uid` (via `useAuth`):

- Label **Aprovar Pilotos**, ícone `how_to_reg` (ou `group`).
- `href="/aprovacoes?role={id}"`.

Não esconder o card do próprio rolê.

### 6.6 Tokens CSS

CSS Modules em `aprovacoes.module.css`. Sem hex solto no TSX.

| Token | Uso |
|-------|-----|
| `--surface` / `--surface-container` / `-low` / `-high` / `-highest` | Página, cards, chips inativos, faixa |
| `--primary` / `--primary-container` | Pulso, badge líder, chip ativo, Aceitar, títulos de rolê |
| `--on-surface` / `--on-surface-variant` | Título / corpo / apelido |
| `--secondary-container` | Alerta de ritmo, badge moderada |
| `--error` / `--error-container` | Recusar |
| `--ritmo-tranquila` | Badge tranquila |
| `--gutter-md` / `--touch-min` / `--card-padding-md` | Espaçamento e toque |

Tipografia: Barlow Condensed em títulos/CTA/badges; Plus Jakarta Sans no body. Ícones: Material Symbols Outlined.

Padding inferior: dock (SPEC 001). Toast `fixed` acima do `MenuInferior`.

### 6.7 Acessibilidade

- Lista: `aria-label="Fila de aprovação de pilotos"` (ou “Pilotos confirmados”).
- Chips: `role="tablist"` / `role="tab"` **ou** grupo de botões com `aria-pressed`.
- Aceitar: texto visível; `aria-label="Aceitar {nome} em {titulo}"`.
- Recusar: `aria-label="Recusar {nome} em {titulo}"`.
- Avatar: `alt="Foto de {nome}"`; placeholder `account_circle` se `fotoUrl` vazio.
- Área de toque ≥ 48px; usável a partir de 360px.
- `disabled` nos dois botões enquanto `decidindoId` aponta para aquele card.
- Toast: `role="status"` (aceite) / `role="alert"` (erro).
- Alerta de ritmo: não é `role="alert"` agressivo demais; `role="note"` basta.

### 6.8 Header

Reusar `CabecalhoFeed`. Sem sino. Avatar → `/perfil`.

---

## 7. Backend — Inbox do líder

Não usar `onCall`. Rotas **sem** `firestore.collection` direto. Factory em `repositories/index.ts`.

Coleção **`usersrole`** — schema da SPEC 005, **sem migração**.

### 7.1 Quem aparece em cada lista

Invariantes já documentados na SPEC 005:

- Pendente: `aceito === false` **e** `aceitoEm == null` **e** `recusadoEm == null`.
- Aceito: `aceito === true` **e** `aceitoEm != null` **e** `recusadoEm == null`.
- Recusado: `recusadoEm != null` **e** `aceito === false` **e** `aceitoEm == null` — **fora** das duas listas.

Query de pendentes (criador = uid do token):

```
criadorId == uid
aceito == false
recusadoEm == null
```

(`aceitoEm == null` segue da invariante; não precisa de 4º filtro no Firestore.)

Query de aceitos:

```
criadorId == uid
aceito == true
```

Ordenar por `createdAt` **ASC** (FIFO: quem pediu primeiro aparece primeiro).

Depois do join com `roles`: **descartar** itens cujo rolê não existe ou cuja `dataHoraSaida` já passou. O mock fala em “rolês ativos”. Histórico de comboios passados é outra spec.

Teto de segurança: 100 documentos por query. Sem paginação nesta spec.

### 7.2 Tipos de domínio (Functions)

```ts
// functions/src/types/aprovacao.ts
export type StatusAprovacao = "pendente" | "aceito";
export type DecisaoPiloto = "aceitar" | "recusar";

export type UsuarioResumoSolicitacao = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
  moto: string;
  pilotagem: Pilotagem;
};

export type RoleResumoSolicitacao = {
  id: string;
  titulo: string;
  ritmo: RitmoRole;
  dataHoraSaida: string;
  confirmados: number;
};

export type SolicitacaoLider = {
  id: string;
  participacao: UsuarioRole;
  usuario: UsuarioResumoSolicitacao;
  role: RoleResumoSolicitacao;
  divergenciaRitmo: boolean;
};

export type FilaAprovacoes = {
  resumo: {
    pendentes: number;
    aceitos: number;
    rolesComPendentes: number;
    rolesComAceitos: number;
  };
  itens: SolicitacaoLider[];
};
```

Estender o repositório de `usersrole`:

```ts
export type UsuarioRoleDecisao = {
  decisao: DecisaoPiloto;
};

// em UsuarioRoleRepository:
listarPendentesDoCriador(criadorId: string): Promise<UsuarioRole[]>;
listarAceitosDoCriador(criadorId: string): Promise<UsuarioRole[]>;
contarPendentesDoCriador(criadorId: string): Promise<number>;
contarAceitosDoCriador(criadorId: string): Promise<number>;
decidir(id: string, dados: UsuarioRoleDecisao): Promise<UsuarioRole | null>;
```

`decidir`:

- `aceitar` → `aceito: true`, `aceitoEm: serverTimestamp()`, `recusadoEm: null`, `updatedAt`.
- `recusar` → `aceito: false`, `aceitoEm: null`, `recusadoEm: serverTimestamp()`, `updatedAt`.
- Se o doc não existe → `null`.
- Se já está aceito ou recusado → a **rota** responde 409 **antes** de chamar (lê o doc). O repositório pode recusar overwrite se `aceitoEm` ou `recusadoEm` já preenchidos, devolvendo o doc inalterado; a rota detecta e manda 409.

`buscarPorIds` em `UsuarioRepository` e `RoleRepository` (batch `getAll`, chunks de 100). Evita N+1 na montagem da fila.

Fallback se o usuário foi apagado: `nome: "Piloto"`, `apelido: "piloto"`, `fotoUrl: ""`, `moto: ""`, `pilotagem: "moderada"`. Se o rolê foi apagado: **omitir** o item (não dá para decidir um rolê inexistente).

`divergenciaRitmo` = `usuario.pilotagem !== role.ritmo` (calculado na rota, não persistido).

`role.confirmados` = `contarConfirmados(roleId)` por rolê **distinto** da lista (não por item). Cache em `Map<roleId, number>` na montagem.

`resumo.pendentes` / `resumo.aceitos`: counts **já filtrados** pelos mesmos critérios da lista (rolê existente e ainda não saiu). Implementação prática: montar as duas listas leves (ids) ou contar depois do join. Preferir: buscar pendentes **e** aceitos do criador (duas queries), join, filtrar rolês ativos, daí derivar counts + `itens` da visão pedida. Duas queries no `usersrole` por GET cabem no MVP.

Não devolver o array da visão oposta em `itens` — só a pedida em `?status=`.

### 7.3 Auth

1. Router próprio com `aprovacoesRouter.use(autenticar)`.
2. Token inválido / sem Bearer → **401**.
3. Inbox **somente** de `req.usuario.uid` como `criadorId`. Admin **não** vê a fila de todos nesta spec.
4. PATCH: `isDonoOuAdmin(usuario, pedido.criadorId)`. Admin pode decidir um pedido alheio; o GET continua só a inbox do uid.

Uid do piloto **nunca** vem do body para autorizar. O `:id` da URL é o id do documento `usersrole`.

### 7.4 `GET /aprovacoes`

Query:

| Param | Default | Valores |
|-------|---------|---------|
| `status` | `pendente` | `pendente` \| `aceito` |

Outro valor → **400** `{ erro: "status inválido" }`.

| Caso | Status | Corpo |
|------|--------|-------|
| Ok (inclusive vazio) | 200 | `FilaAprovacoes` |
| Sem token | 401 | `{ erro: "Não autenticado" }` |

Não 404 quando a fila está vazia.

### 7.5 `PATCH /aprovacoes/:id`

Body: `{ "decisao": "aceitar" | "recusar" }` **somente**.

| Caso | Status | Corpo |
|------|--------|-------|
| `decisao` ausente / inválida | 400 | `{ erro: "decisao é obrigatória" }` |
| Doc inexistente | 404 | `{ erro: "Solicitação não encontrada" }` |
| `criadorId` ≠ uid (e não admin) | 403 | `{ erro: "somente o organizador decide" }` |
| Já aceito ou já recusado | 409 | `{ erro: "solicitação já decidida" }` |
| Rolê inexistente | 404 | `{ erro: "Rolê não encontrado" }` |
| `dataHoraSaida` já passou | 400 | `{ erro: "este rolê já aconteceu" }` |
| Ok | 200 | `SolicitacaoLider` (item enriquecido, já com o novo estado) |

Não aceitar `aceito`, `aceitoEm`, `usuarioId` no body. A rota traduz `decisao` → campos.

Não alterar `notificar`. O PATCH de `notificar` continua em `PATCH /roles/:id/participacao` (piloto).

### 7.6 Ordem das rotas Express

Arquivo `functions/src/routes/aprovacoes.ts`, montado em `index.ts`:

```
app.use("/aprovacoes", aprovacoesRouter);
```

```
GET   /aprovacoes
PATCH /aprovacoes/:id
```

**Não** colocar sob `/roles/:id` — colide com `GET /roles/:id` e mistura o PATCH do piloto (`notificar`) com o do líder.

Health em `GET /` pode listar `/aprovacoes` junto de `/roles` e `/perfil`.

### 7.7 Índices

Em `firestore.indexes.json`, **além** do índice `roleId + aceito` (SPEC 005):

```json
{
  "collectionGroup": "usersrole",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "criadorId", "order": "ASCENDING" },
    { "fieldPath": "aceito", "order": "ASCENDING" },
    { "fieldPath": "recusadoEm", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "usersrole",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "criadorId", "order": "ASCENDING" },
    { "fieldPath": "aceito", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "ASCENDING" }
  ]
}
```

O primeiro serve a fila pendente (`recusadoEm == null`). O segundo serve os aceitos (sem filtrar `recusadoEm`).

Se o emulator reclamar de índice, copiar a URL do erro para o JSON — não inventar ordem diferente da query real.

### 7.8 O que não muda

- Function HTTP única `api`.
- `POST|GET|PATCH|DELETE /roles/:id/participacao` (piloto).
- `GET /roles` (feed) — **não** ganha `minhaParticipacao` nem contagem de pedidos.
- Documento `roles` **sem** array `participantes`.
- Sem FCM, sem e-mail, sem escrever em `users`.

---

## 8. Wireframe

### Fila (default)

```
┌─────────────────────────────────┐
│ [logo] ROLES FEED          (👤) │  header sticky
│        COCKPIT                  │
├─────────────────────────────────┤
│ ● APROVAÇÕES DE COMBOIO    [LÍDER]
│ 3 pilotos na fila … em 2 rolês  │
│                                 │
│ [Fila (3)] [Serra Campos (2)]   │  chips
│ [Serra Negra (1)] [Confirmados] │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ↗ SUBIDA DA SERRA …  12 conf.│ │
│ │ (foto) LUCAS ANDRADE        │ │
│ │        @lucas_cbr           │ │
│ │        Honda CBR 650R       │ │
│ │ [MODERADA (90-120 KM/H)]    │ │
│ │ [ Recusar ] [ Aceitar ]     │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ … alerta de ritmo se diverge│ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│  🏍️        ( + )        👤     │  menu — Rolês ativo
└─────────────────────────────────┘
```

### Confirmados

Mesmo HUD/chips. Card sem Recusar/Aceitar. Pill **Na grade** + data `aceitoEm` (mesmo formato relativo do feed, ou `confirmado em {data}`).

### Toast (após Aceitar)

```
        (check)  Lucas Andrade foi aceito no comboio.
                 O piloto será notificado.
```

---

## 9. Fora do Escopo

- Push / FCM / e-mail / sino do header (o toast **diz** que será notificado).
- Limite de vagas, waitlist, categoria de cilindrada.
- Desfazer aceite, reabrir recusa, recados do piloto.
- Reputação, selo verificado, histórico de rolês do piloto.
- Paginação da fila (teto 100).
- Inbox admin de todos os líderes.
- Menu inferior extra, salvo o pathname ativo de Rolês.
- Alterar o sheet da SPEC 005 além do CTA do `EstadoOrganizador`.
- Auto-expirar pedidos de rolês que já saíram (só filtro na listagem).

---

## 10. Critérios de Aceite

### Front

- [ ] `/aprovacoes` segue o mock (HUD, chips, cards, Recusar/Aceitar, empty, toast).
- [ ] Lista pendente = `aceito: false` e `aceitoEm` / `recusadoEm` nulos, com **usuário + rolê**.
- [ ] Aceitar: toast *“{nome} foi aceito no comboio. O piloto será notificado.”*, card some, HUD/contagens atualizam, o piloto **não** permanece na fila.
- [ ] Recusar: confirm nativo; 200 some da fila; não aparece em Confirmados.
- [ ] Chip **Confirmados** lista só `aceito: true` (somente leitura, badge Na grade).
- [ ] Chips por rolê filtram a lista visível; `?role=` pré-seleciona.
- [ ] Banner no feed quando há pendentes (ou só aceitos); CTA do próprio rolê vira **Aprovar Pilotos**.
- [ ] Alerta de ritmo só se `pilotagem !== ritmo`.
- [ ] Sem sino, sem `/15`, sem estrela, sem recado fictício.
- [ ] `page.tsx` Server; Client só onde há interatividade.
- [ ] Componentes < ~80 linhas; fetch no service; sem Firestore no client.
- [ ] Toque ≥ 48px; usável a partir de 360px; toast acima do dock.
- [ ] Item Rolês ativo em `/aprovacoes`.

### Back

- [ ] `GET /aprovacoes?status=pendente|aceito` exige Bearer; filtra `criadorId` do token.
- [ ] Pendentes: `aceito == false` e `recusadoEm == null` (e `aceitoEm` nulo na prática).
- [ ] Cada item traz `participacao` + `usuario` + `role` + `divergenciaRitmo`.
- [ ] `resumo` traz counts de pendentes e aceitos (rolês ainda não saídos).
- [ ] `PATCH /aprovacoes/:id` com `{ decisao }` seta `aceito`/`aceitoEm` ou `recusadoEm`; 409 se já decidido; 403 se não é o criador.
- [ ] Body não persiste `usuarioId` / `aceito` crus.
- [ ] Persistência só em `FirestoreUsuarioRoleRepository` (+ `buscarPorIds` nos outros repos).
- [ ] Documento `roles` **não** ganha array `participantes`.
- [ ] Índices `criadorId` + `aceito` (+ `recusadoEm` na fila) em `firestore.indexes.json`.
- [ ] `PATCH /roles/:id/participacao` (notificar do piloto) **não** passa a aceitar `aceito`.

---

## 11. Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| `src/app/(app)/aprovacoes/page.tsx` | **NOVO** — orquestrador Server |
| `src/app/(app)/aprovacoes/**` | **NOVO** — UI, hooks, service, CSS |
| `src/types/aprovacao.ts` | **NOVO** |
| `src/app/(app)/feed/components/BannerCockpitLider.tsx` | **NOVO** |
| `src/app/(app)/feed/hooks/useResumoAprovacoes.ts` | **NOVO** |
| `src/app/(app)/feed/components/TelaFeed.tsx` | **Alterar** — monta o banner |
| `src/app/(app)/feed/components/RoleCard.tsx` | **Alterar** — CTA do líder |
| `src/app/(app)/feed/components/BotaoParticipar.tsx` | **Alterar** — variante organizador |
| `src/app/(app)/roles/[id]/participar/components/EstadoOrganizador.tsx` | **Alterar** — link para `/aprovacoes?role=` |
| `src/components/menu-inferior/hooks/useItemMenuAtivo.ts` | **Alterar** — `/aprovacoes` conta como Rolês |
| `functions/src/types/aprovacao.ts` | **NOVO** |
| `functions/src/types/usuario-role.ts` | **Alterar** — `UsuarioRoleDecisao` se preferir colocalizar |
| `functions/src/routes/aprovacoes.ts` | **NOVO** |
| `functions/src/index.ts` | **Alterar** — `app.use("/aprovacoes", …)` |
| `functions/src/repositories/interfaces/usuario-role.repository.ts` | **Alterar** — listar / contar / decidir |
| `functions/src/repositories/firestore/firestore-usuario-role.repository.ts` | **Alterar** |
| `functions/src/repositories/interfaces/usuario.repository.ts` | **Alterar** — `buscarPorIds` |
| `functions/src/repositories/interfaces/role.repository.ts` | **Alterar** — `buscarPorIds` |
| `functions/src/repositories/firestore/*.ts` | **Alterar** — impl. `buscarPorIds` |
| `firestore.indexes.json` | **Alterar** — índices do inbox |

Não alterar `MenuInferior` visualmente. Não voltar `participantes[]` para `roles`. Não misturar decisão do líder no PATCH de `notificar`.

---

## 12. Checklist da skill Next.js

- [ ] `page.tsx` sem `"use client"` (só orquestra).
- [ ] `"use client"` só em `TelaAprovacoes` e filhos interativos.
- [ ] GET da fila e PATCH da decisão em hooks separados da UI.
- [ ] API isolada em `aprovacoes.service.ts` (sem Firestore no componente).
- [ ] Um componente = uma coisa (HUD, chip, card pendente, card confirmado, alerta, toast).
- [ ] Sem abstração genérica “pra futuro” (FCM, vagas, reputação).
- [ ] CSS Modules + tokens de `globals.css`.
- [ ] Sem `console.log` de debug.

---

## 13. Relação com o código atual

| Hoje | Nesta spec |
|------|------------|
| SPEC 005: piloto pede vaga; líder não decide | Inbox `/aprovacoes` + PATCH `decisao` |
| `PATCH /roles/:id/participacao` só `notificar` | **Permanece**; decisão do líder é outro recurso |
| `usersrole.aceito` sempre `false` no POST | Líder passa a `true` (ou seta `recusadoEm`) |
| Feed: todo card tem Participar | Card do próprio rolê → Aprovar Pilotos |
| `EstadoOrganizador` só explica que não pede vaga | Ganha atalho para a fila daquele rolê |
| Menu: Rolês ativo em `/` e `/roles` | Também em `/aprovacoes` |
| Índice `usersrole`: `roleId + aceito` | + índices por `criadorId` para o inbox |

Não migrar documentos. Pedidos já gravados pela SPEC 005 (`aceito: false`, datas nulas) aparecem na fila sem backfill.

O sheet do piloto (SPEC 005) já trata `aceito === true` (Confirmado) e `recusadoEm` (Recusado). Depois desta spec, aquele sheet deixa de ser só “caminho feliz futuro”: a decisão do líder é o que muda o estado.
