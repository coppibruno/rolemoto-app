# SPEC 026 — Inscrição em Evento

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-18  
> **Referência visual:** `designs/filtros-feed/` (card de evento) + `designs/modal-excluir-conta/` / Layer 2 do design system (modal de ingresso) + `designs/perfil/` e `designs/Perfil-publico/` (histórico)  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade (skill `nextjs-patterns`)  
> **Backend:** Cloud Function `api` (Express) — `POST|GET|DELETE /eventos/:id/inscricao`; enriquecer `GET /eventos` e `GET /eventos/:id`; estender `GET /perfil/historico` e `GET /usuarios/:uid/historico`  
> **Coleção Firestore:** `usersevento` (**nova**); lê `eventos` (SPEC 022 / 024)  
> **Depende de:** SPEC 001 (shell), SPEC 005 (`usersrole` como espelho de vínculo), SPEC 008 (histórico próprio), SPEC 022 (coleção `eventos` + `linkIngresso`), SPEC 024 (aba Eventos + `EventoCard`), SPEC 025 (histórico público)

---

## 1. Objetivo

Permitir que qualquer piloto autenticado **se inscreva em um evento** direto no feed (aba Eventos), **sem aceite do criador** (diferente do rolê / SPEC 005).

| Caso | Comportamento |
|------|----------------|
| Evento `acesso: "gratis"` | `POST` confirma inscrição na hora → toast / estado **Inscrito** no card |
| Evento `acesso: "ingresso"` | `POST` confirma inscrição **e** abre **modal** pedindo confirmação para redirecionar ao `linkIngresso` (compra externa) |

A inscrição aparece no **Histórico de Pistas** do próprio perfil **junto com os rolês**, com **filtro** Todos / Rolês / Eventos. O mesmo conteúdo (sem pendências) entra no **perfil público** (SPEC 025), também com filtro.

Esta spec é **full stack**:

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | CTA no `EventoCard`, modal de ingresso, estados inscrito/cancelar, filtro no histórico próprio e público |
| Back (Functions) | Coleção `usersevento`, CRUD de inscrição, enriquecer feed/detalhe, mesclar eventos no histórico |

`usuarioId` **nunca** vem do body. Timestamps só no servidor. Não misturar inscrição de evento com `usersrole` / `roles`.

---

## 2. Recorte e princípios

### 2.1 O que entra

- Coleção **`usersevento`** (vínculo usuário ↔ evento), id `{usuarioId}_{eventoId}`.
- `POST` / `GET` / `DELETE` `/eventos/:id/inscricao`.
- Enriquecer itens do feed de eventos com `inscrito: boolean` (e opcionalmente o doc resumido).
- CTA **Inscrever-se** no card da aba Eventos (substitui o papel principal de “só Ver Detalhes”).
- Modal de confirmação de redirect quando `acesso === "ingresso"` e há `linkIngresso`.
- Cancelar inscrição (card inscrito + DELETE).
- Histórico próprio: itens de evento na aba **Participei** (+ filtro tipo).
- Histórico público: itens de evento em **Concluídos** (+ filtro tipo).
- Contagem de inscritos no card de histórico de evento (`inscritosConfirmados`).

### 2.2 O que **não** entra

| Item | Motivo |
|------|--------|
| Aceite / recusa do organizador | Produto: inscrição imediata |
| Campos `aceito` / `aceitoEm` / `recusadoEm` | Schema do rolê; aqui não há fila |
| Push FCM / lembrete de evento | Spec futura (espelho SPEC 013 / 020) |
| Flag `notificar` no vínculo | Sem FCM nesta entrega |
| Lista pública de inscritos / avatares no card | SPEC 024 já tirou “interessados”; não reabrir |
| Checkout / pagamento dentro do app | Só redirect externo ao link |
| Validar se o piloto **comprou** o ingresso | Fora do controle do Rolemoto |
| Tela completa de detalhe do evento | Placeholder `/eventos/:id` pode ganhar o mesmo CTA; redesign do detalhe = fora |
| Editar evento / vagas / waitlist | Fora |
| Aba **Aguardando** para eventos | Nunca pendente |
| Eventos na aba **Criados** do histórico comum | Criados continua só rolês; admin vê eventos criados só se já houver UI admin — **não** nesta spec |
| Migration de docs fictícios | Coleção nasce vazia no primeiro POST |

### 2.3 Evento vs rolê (inscrição)

| | Rolê (`usersrole`) | Evento (`usersevento`) |
|--|--------------------|------------------------|
| Intenção no feed | Solicitar vaga | Inscrever-se |
| Aceite do criador | Sim (`aceito`) | **Não** — confirmado no POST |
| Criador pode se vincular? | Não (403) | **Sim** (admin também pode marcar presença) |
| Ingresso pago | N/A | Modal + `linkIngresso` |
| Cancelar | DELETE do pedido | DELETE da inscrição |
| Histórico | Aguardando / Participei / Criados | Só entra em **Participei** (e público **Concluídos**) |

Não gravar inscrição na coleção `usersrole`. Não reusar `POST /roles/:id/participacao`.

### 2.4 Desvios conscientes do mock / código atual

Não há mock Stitch dedicado a “inscrição em evento”. O card em `designs/filtros-feed/` ainda diz **Ver Detalhes** e “48 interessados” (já fora na SPEC 024).

| Hoje / mock | Nesta spec | Por quê |
|-------------|------------|---------|
| CTA **Ver Detalhes** | CTA principal **Inscrever-se** / **Inscrito** | Pedido do produto |
| “48 interessados” | **Omitir** | Sem exposição pública de lista |
| Link secundário ao detalhe | Manter toque no título/thumb → `/eventos/:id` (placeholder ok) | Não perder navegação |
| Detalhe só placeholder | CTA de inscrição **também** no detalhe (mínimo) | Evitar dead-end se o usuário abriu o detalhe |
| Histórico só rolês | União tipada + filtro | Pedido explícito |
| Tabs Aguardando / Participei / Criados | **Mantidas**; filtro **Todos \| Rolês \| Eventos** só onde faz sentido (Participei / Concluídos públicos) | Aguardando e Criados não misturam evento |

Tokens: `designs/filtros-feed/DESIGN.md`, `designs/perfil/DESIGN.md`, `designs/Perfil-publico/DESIGN.md`, `globals.css`. Modal: Layer 2 (`surface-container-high`, borda laranja suave) — mesmo espírito de `modal-excluir-conta`.

---

## 3. Referência de Design

### 3.1 Card de evento (feed)

Replicar o card atual (`EventoCard` + tokens do feed). Alterar o rodapé:

| Estado | CTA | Visual |
|--------|-----|--------|
| Não inscrito | **Inscrever-se** | Botão `primary-container`, ícone `event_available` (ou `confirmation_number` se `ingresso`) |
| Inscrito | **Inscrito** (primário desabilitado ou outline) + ação **Cancelar** | Check `check_circle` em `tertiary` / primary; cancelar secundário |
| Carregando POST/DELETE | Spinner no botão; `disabled` | `autorenew` |

Badges de quando + acesso (**Entrada franca** / **Ingresso**) permanecem.

Área de toque do CTA ≥ 56px (`touch-target`). Card continua `surface-container`, thumb 64×64.

### 3.2 Modal de ingresso

Overlay + card central (ou bottom sheet em mobile — **preferir dialog central** alinhado ao modal de excluir conta, mais curto):

```
┌─────────────────────────────────┐
│  confirmation_number            │
│  INGRESSO NECESSÁRIO            │
│                                 │
│  Sua inscrição no evento foi    │
│  confirmada. Para garantir a    │
│  entrada, compre o ingresso no  │
│  link do organizador.           │
│                                 │
│  [ Ir para a compra ]           │  primary
│  [ Agora não ]                  │  secondary
└─────────────────────────────────┘
```

- `role="dialog"`, `aria-modal="true"`, foco no CTA primário.
- Esc / “Agora não” fecha **sem** desfazer a inscrição.
- “Ir para a compra” → `window.open(linkIngresso, "_blank", "noopener,noreferrer")` e fecha o modal.
- Se `linkIngresso` estiver ausente/ inválido no client (não deveria após validação do POST do evento): toast de erro; inscrição já criada permanece.

### 3.3 Histórico — filtro de tipo

Abaixo das tabs Aguardando / Participei / Criados (e abaixo das tabs públicas Concluídos / Como Líder), **somente** quando a aba ativa pode misturar entidades:

| Contexto | Mostra filtro? |
|----------|----------------|
| Aba **Participei** (próprio) | Sim — Todos / Rolês / Eventos |
| Aba **Aguardando** | Não (só rolês) |
| Aba **Criados** | Não (só rolês nesta spec) |
| Público **Concluídos** | Sim |
| Público **Como Líder** | Não (só rolês) |

Chips do filtro: pill `surface-container-high`; ativo `primary-container` + texto `surface` / `on-primary-container`. Toque ≥ 48px. Labels uppercase Barlow Condensed `label-md`.

Card de **evento** no histórico:

| Zona | Conteúdo |
|------|----------|
| Esquerda | Dia/mês da `dataHoraAbertura` (mesmo `BlocoDataHistorico`) |
| Badge tipo | Chip pequeno **Evento** (`local_activity`) para distinguir de rolê |
| Título | `titulo` |
| Status | **Confirmado** se abertura futura; **Concluído** se passou |
| Meta | Local truncado **ou** `{N} inscritos` + data curta — **sem** km de rota (evento é ponto fixo). Usar endereço curto / omitir `distanciaKm` de comboio |

Não reusar badge de ritmo em card de evento.

---

## 4. Fluxo do usuário

### 4.1 Inscrever-se (grátis)

```
Feed → aba Eventos → [Inscrever-se]
  │
  ├── POST /eventos/:id/inscricao
  │     ├── 201 / 200 → card passa a Inscrito + toast “Inscrição confirmada!”
  │     ├── 400 (evento já passou) → toast erro
  │     ├── 404 → toast “Evento não encontrado”
  │     └── 401 → GuardaApp
  │
  └── Sem modal
```

### 4.2 Inscrever-se (ingresso)

```
Feed → [Inscrever-se]
  │
  ├── POST /eventos/:id/inscricao
  │     ├── 201 / 200
  │     │     └── abre ModalIngresso (link do payload do evento já no card)
  │     │           ├── [Ir para a compra] → abre linkIngresso (_blank) + fecha
  │     │           └── [Agora não] / Esc → fecha; inscrito permanece
  │     └── erros → iguais ao fluxo grátis
```

Ordem fixa: **sempre POST primeiro**, depois modal. Cancelar o redirect **não** cancela a inscrição (o piloto pode comprar depois; pode reabrir o link por um botão **Comprar ingresso** no estado inscrito).

### 4.3 Já inscrito + comprar depois

No card com `inscrito === true` e `acesso === "ingresso"`:

- Botão secundário **Comprar ingresso** reabre o mesmo modal (ou abre o link direto — preferir **modal** para consistência).

### 4.4 Cancelar

```
[Cancelar] → confirm nativo ou mini-dialog
  └── DELETE /eventos/:id/inscricao
        ├── 204 → card volta a Inscrever-se
        └── erro → mensagem no card
```

### 4.5 Histórico

```
/perfil → Histórico de Pistas
  GET /perfil/historico  (agora inclui eventos em participei)
  │
  ├── Aba Participei + filtro Eventos → só inscricões
  ├── Aba Participei + filtro Rolês → só aceitos (SPEC 008)
  └── Aba Participei + Todos → merge ordenado por data DESC

/perfil/[uid] → Histórico público
  GET /usuarios/:uid/historico
  └── Concluídos + mesmo filtro
```

Card de evento no histórico navega para `/eventos/{eventoId}` (detalhe).

---

## 5. Arquitetura Next.js

Seguir a skill: componentes ~80 linhas, lógica em hooks, HTTP em services, `"use client"` só com interatividade. Bearer só no client (`useFunctions` / `api`).

### 5.1 Feed — acréscimos

```
src/app/(app)/feed/
├── components/
│   ├── EventoCard.tsx                    # Alterar — CTA inscrição
│   ├── BotaoInscreverEvento.tsx          # NOVO
│   ├── ModalIngressoEvento.tsx           # NOVO
│   └── ...
├── hooks/
│   └── useInscricaoEvento.ts             # NOVO — POST/DELETE + modal
├── services/
│   └── inscricao-evento.service.ts       # NOVO (ou em feed/services/)
└── constants.ts                          # Alterar — copy modal / toasts
```

Não criar rota `/eventos/:id/inscrever` só para espelhar o rolê: **não há sheet de “aguardando líder”**. A inscrição é inline no feed (e no detalhe mínimo).

### 5.2 Detalhe mínimo

```
src/app/(app)/eventos/[id]/
├── page.tsx                              # Server — orquestra
├── components/
│   └── TelaDetalheEvento.tsx             # Client — GET + mesmo BotaoInscreverEvento
└── ...
```

Escopo do detalhe nesta spec: carregar `GET /eventos/:id`, mostrar capa/título/acesso/local/horário + CTA inscrição/modal. **Não** redesenhar o mock completo de detalhe se não existir.

### 5.3 Histórico próprio / público

```
src/app/(app)/perfil/
├── components/
│   ├── FiltroTipoHistorico.tsx           # NOVO — Todos | Rolês | Eventos
│   ├── CardHistorico.tsx                 # Alterar — ramo evento
│   ├── CardHistoricoEvento.tsx           # NOVO (opcional se CardHistorico engordar)
│   ├── HistoricoPistas.tsx               # Alterar — passa filtro
│   └── AbasHistorico.tsx                 # inalterado (3 abas)
├── hooks/useHistoricoPistas.ts           # Alterar — filtroTipo
└── ...

src/app/(app)/perfil/[uid]/               # SPEC 025
├── components/HistoricoPublico.tsx       # Alterar — filtro + cards evento
└── ...
```

### 5.4 Responsabilidades

| Peça | Tipo | Faz |
|------|------|-----|
| `BotaoInscreverEvento` | Client | Dispara hook; renderiza estados |
| `useInscricaoEvento` | Hook | POST/DELETE, `inscrito` local, `modalAberto`, erros |
| `ModalIngressoEvento` | Client | Dialog + redirect |
| `inscricao-evento.service` | Service | `api` Bearer — **sem** Firestore no client |
| `FiltroTipoHistorico` | UI | Chips; só filtra arrays já carregados |
| `CardHistoricoEvento` | UI | Layout sem ritmo/km de rota |

**Não misturar** no mesmo arquivo: JSX do card + POST + `window.open` + formatação de histórico.

---

## 6. Contrato de dados (front)

### 6.1 Vínculo

```ts
export type UsuarioEvento = {
  id: string; // `{usuarioId}_{eventoId}`
  usuarioId: string;
  eventoId: string;
  criadorId: string;
  createdAt: string; // ISO — momento da inscrição
  updatedAt: string;
};
```

Sem `aceito`, `notificar`, `aceitoEm`, `recusadoEm`.

### 6.2 Feed / detalhe

```ts
export type EventoFeedItem = Evento & {
  distanciaKm: number;
  inscrito: boolean; // true se existe usersevento do uid
};

export type EventoDetalhe = Evento & {
  inscrito: boolean;
  inscritos: { total: number }; // count de usersevento do evento
};
```

`GET /eventos` (lista) devolve `inscrito` por item (batch no back). Contagem total de inscritos **não** é obrigatória no feed card (evitar N counts pesados); só no detalhe e no histórico.

### 6.3 Histórico unificado

```ts
export type TipoItemHistorico = "role" | "evento";

export type FiltroTipoHistorico = "todos" | "roles" | "eventos";

// Item de rolê (mantém campos da SPEC 008; acrescenta discriminador)
export type ItemHistoricoRole = {
  tipo: "role";
  roleId: string;
  titulo: string;
  descricao: string;
  dataHoraSaida: string;
  distanciaKm: number;
  participantesConfirmados: number;
  ritmo: RitmoRole;
  status: StatusItemHistorico; // pendente | confirmado | concluido | lider
};

export type ItemHistoricoEvento = {
  tipo: "evento";
  eventoId: string;
  titulo: string;
  dataHoraAbertura: string;
  localNome: string; // local.nome || local.endereco (curto)
  acesso: AcessoEvento;
  inscritosConfirmados: number;
  status: "confirmado" | "concluido";
};

export type ItemHistoricoPista = ItemHistoricoRole | ItemHistoricoEvento;

export type HistoricoPistas = {
  aguardando: ItemHistoricoRole[]; // só rolês
  participei: ItemHistoricoPista[]; // rolês aceitos + eventos inscritos
  criados: ItemHistoricoRole[]; // só rolês
  contagens: {
    aguardando: number;
    participei: number;
    criados: number;
  };
};
```

**Breaking change controlado:** clientes antigos que esperam só `roleId` em `participei` quebram. Aceitável: app e functions versionados juntos neste PR. Front atualiza `CardHistorico` com `item.tipo === "evento"`.

Histórico público (SPEC 025):

```ts
export type HistoricoPublico = {
  concluidos: ItemHistoricoPista[]; // participei sem pendentes (+ eventos)
  comoLider: ItemHistoricoRole[];
  contagens: {
    concluidos: number;
    comoLider: number;
  };
};
```

Filtro **só no client** após o GET (um payload). Badges das tabs usam `contagens` totais (sem filtrar). Opcional: contagens por tipo no payload — **não** nesta spec (evitar inflar).

---

## 7. Implementação front (detalhes)

### 7.1 Service

```ts
// src/app/(app)/feed/services/inscricao-evento.service.ts
import { api } from "@/lib/api";
import type { UsuarioEvento } from "@/types/usuario-evento";

export const inscricaoEventoService = {
  inscrever: (eventoId: string) =>
    api<UsuarioEvento>(`/eventos/${eventoId}/inscricao`, { method: "POST" }),

  buscar: (eventoId: string) =>
    api<UsuarioEvento>(`/eventos/${eventoId}/inscricao`),

  cancelar: (eventoId: string) =>
    api<void>(`/eventos/${eventoId}/inscricao`, { method: "DELETE" }),
};
```

### 7.2 Hook (esqueleto)

```ts
const inscrever = async (evento: EventoFeedItem) => {
  setEnviando(true);
  try {
    await inscricaoEventoService.inscrever(evento.id);
    setInscrito(true);
    if (evento.acesso === "ingresso" && evento.linkIngresso) {
      setModalAberto(true);
    } else {
      // toast sucesso
    }
  } catch {
    // mensagem
  } finally {
    setEnviando(false);
  }
};
```

Estado `inscrito` inicial vem de `evento.inscrito` do GET do feed. Após mutação, atualizar lista local (otimista) ou refetch da aba Eventos.

### 7.3 Acessibilidade

- Modal: `role="dialog"`, `aria-labelledby`, trap de foco simples, Esc fecha.
- CTA: `aria-busy` enquanto `enviando`.
- Chip filtro: `role="radiogroup"` / `aria-checked`.
- Card histórico evento: `aria-label` inclui “evento” + status.

### 7.4 Tokens CSS

Reuse `feed.module.css` para o botão (mesmo glow do Participar). Modal: CSS Module `modal-ingresso-evento.module.css` com tokens `--surface-container-high`, `--primary-container`, `--on-surface`, borda `rgba(255, 107, 0, 0.22)`.

---

## 8. Backend

Rotas **não** importam Firestore. Persistência só em repositórios. Function HTTP única `api`.

### 8.1 Documento `usersevento/{id}`

**Id:** `{usuarioId}_{eventoId}`.

```
{
  usuarioId: string,     // só do token
  eventoId: string,
  criadorId: string,     // denormalizado de eventos.criadorId
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Não gravar:** `aceito`, ritmo, dados espelhados do evento além de `criadorId` / `eventoId`.

### 8.2 Tipos (functions)

```ts
// functions/src/types/usuario-evento.ts
export interface UsuarioEvento {
  id: string;
  usuarioId: string;
  eventoId: string;
  criadorId: string;
  createdAt: string;
  updatedAt: string;
}

export type UsuarioEventoCreate = {
  usuarioId: string;
  eventoId: string;
  criadorId: string;
};
```

### 8.3 Repositório

```ts
interface UsuarioEventoRepository {
  buscarPorId(id: string): Promise<UsuarioEvento | null>;
  buscarPorUsuarioEEvento(
    usuarioId: string,
    eventoId: string,
  ): Promise<UsuarioEvento | null>;
  listarPorUsuario(usuarioId: string): Promise<UsuarioEvento[]>;
  listarPorEvento(eventoId: string): Promise<UsuarioEvento[]>; // opcional se só count
  contarPorEvento(eventoId: string): Promise<number>;
  contarPorEventos(ids: string[]): Promise<Map<string, number>>; // batch
  criar(dados: UsuarioEventoCreate): Promise<UsuarioEvento>;
  remover(id: string): Promise<boolean>;
}
```

- `criar`: se doc já existe → devolver existente (**200** path idempotente).
- `listarPorUsuario`: `where usuarioId == uid` limit 100; rota filtra/ordena após join.
- Índices: igualdade simples em `usuarioId` / `eventoId` basta se sem `orderBy` composto.

Exportar em `repositories/index.ts`.

### 8.4 Rotas de inscrição

Arquivo `functions/src/routes/inscricao-evento.ts`, montado no `eventosRouter`:

```
POST   /eventos/:id/inscricao
GET    /eventos/:id/inscricao
DELETE /eventos/:id/inscricao
```

Registrar **antes** de `GET /:id` se houver ambiguidade de path (Express: `/:id/inscricao` não colide com `/:id`).

#### POST

Sem body (ou body ignorado).

| Caso | Status | Corpo |
|------|--------|-------|
| Evento inexistente | 404 | `{ erro: "Evento não encontrado" }` |
| `dataHoraAbertura` já passou (e sem encerramento aberto — ver regra) | 400 | `{ erro: "este evento já encerrou" }` |
| Já inscrito | **200** | `UsuarioEvento` |
| Criado | **201** | `UsuarioEvento` |

**Regra de “ainda pode inscrever”:**

- Se `dataHoraEncerramento != null` → permitir enquanto `now <= encerramento`.
- Senão → permitir enquanto `now <= dataHoraAbertura` **ou**, mais permissivo: até o fim do dia da abertura no fuso `America/Sao_Paulo`.  
  **Escolha desta spec:** `now <= (dataHoraEncerramento ?? dataHoraAbertura)`. Simples e alinhada a “evento já aconteceu”.

Criador **pode** se inscrever (sem 403).

#### GET

Só a inscrição do uid autenticado.

| Caso | Status |
|------|--------|
| Sem doc | 404 |
| Ok | 200 `UsuarioEvento` |

#### DELETE

| Caso | Status |
|------|--------|
| Sem doc | **204** (idempotente) |
| Ok | **204** |

### 8.5 Enriquecer `GET /eventos` e `GET /eventos/:id`

1. Após montar a lista filtrada do feed, coletar ids.
2. Para o uid: buscar inscricões existentes (query `usuarioId == uid` + filter in-memory pelos ids da página, **ou** `getAll` dos ids compostos). Preferir **uma** `listarPorUsuario` + `Set` se o usuário tiver poucas inscricões; se a lista do feed for ≤ 50, `getAll` dos doc ids `{uid}_{eventoId}` também é ok.
3. Setar `inscrito: boolean` em cada `EventoFeedItem`.

`GET /eventos/:id`:

- `inscrito` + `inscritos.total` via `contarPorEvento`.

### 8.6 Estender `GET /perfil/historico`

Em `montarHistorico` / `functions/src/lib/historico.ts` (ou `historico-eventos.ts` auxiliar):

1. `listarPorUsuario` em `usersevento`.
2. `buscarPorIds` em `eventoRepository` (método novo se não existir).
3. Para cada evento existente:
   - `status`: `concluido` se `now >= (encerramento ?? abertura)`, senão `confirmado`.
   - Montar `ItemHistoricoEvento`.
4. Concatenar em `participei` com os itens de rolê; ordenar por data (`dataHoraSaida` ou `dataHoraAbertura`) **DESC**; teto **50** no array **já mesclado** (ou 50 rolês + 50 eventos — **preferir teto 50 no merge final** para não explodir UI).
5. `contagens.participei = participei.length`.

`aguardando` / `criados` **inalterados** (só rolês). Itens de rolê passam a incluir `tipo: "role"`.

### 8.7 Estender `GET /usuarios/:uid/historico`

Mesma montagem de eventos no array `concluidos`, com `publico: true` (sem aguardando). Helper compartilhado recebendo `uid` alvo.

### 8.8 Índices

```json
{
  "collectionGroup": "usersevento",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "usuarioId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

Só se a query usar `orderBy createdAt`. Se `listarPorUsuario` for só equality, o índice composto **não** é obrigatório — adicionar só quando a query real exigir (URL do emulator).

### 8.9 O que não muda

- `POST /eventos` (admin) e validação de `linkIngresso`.
- `usersrole` e fluxo de rolê.
- Security Rules deny-all no client.
- Sem `onCall`.

---

## 9. Wireframes

### 9.1 Card — não inscrito (grátis)

```
┌─────────────────────────────────┐
│ [Hoje 19:30] [Entrada franca]   │
│ MOTO POINT CENTRO          [🖼] │
│ 📍 Rua das Motos, 100           │
│ [  event_available  INSCREVER-SE ]│
└─────────────────────────────────┘
```

### 9.2 Card — ingresso + modal

```
┌─────────────────────────────────┐
│ … [Ingresso]                    │
│ [ confirmation_number INSCREVER ]│
└─────────────────────────────────┘
          │ POST 201
          ▼
┌─────────────────────────────────┐
│     INGRESSO NECESSÁRIO         │
│  Inscrição confirmada. Compre   │
│  o ingresso no link…            │
│  [ Ir para a compra ]           │
│  [ Agora não ]                  │
└─────────────────────────────────┘
```

### 9.3 Histórico — Participei + filtro

```
│ ▎ HISTÓRICO DE PISTAS           │
│ [Aguardando][Participei*][Criad]│
│ [Todos*][Rolês][Eventos]        │  ← filtro
│ ┌ card rolê ………………… ┐         │
│ ┌ card evento (badge) …┐         │
```

---

## 10. Fora do escopo

- FCM, lembretes, `notificar`.
- Lista/admin de inscritos do evento.
- Pagamento in-app / webhook Sympla.
- Forçar compra antes do POST.
- Aba Criados com eventos do admin.
- Redesign completo da página de detalhe.
- Contador “N interessados” no feed.
- Soft-delete de eventos e histórico órfão além de omitir no join.

---

## 11. Critérios de aceite

### Front — feed / inscrição

- [ ] Card da aba Eventos tem **Inscrever-se** (não só Ver Detalhes como CTA principal).
- [ ] Grátis: POST → estado Inscrito + toast; sem modal.
- [ ] Ingresso: POST → modal; “Ir para a compra” abre `linkIngresso` em nova aba; “Agora não” mantém inscrição.
- [ ] Já inscrito: mostra Inscrito; Cancelar faz DELETE e volta o CTA.
- [ ] Ingresso + inscrito: ação para reabrir compra (modal ou link).
- [ ] `inscrito` inicial vem do GET do feed (sem POST fantasma).
- [ ] Detalhe `/eventos/:id` mínimo com o mesmo CTA.
- [ ] Componentes focados; hook + service; sem Firestore no client.
- [ ] Toque ≥ 48/56px; modal acessível; CSS Modules + tokens.

### Front — histórico

- [ ] Aba Participei lista rolês aceitos **e** eventos inscritos (discriminador visual).
- [ ] Filtro Todos / Rolês / Eventos na Participei (client-side).
- [ ] Aguardando e Criados inalterados (só rolês); filtro oculto nessas abas.
- [ ] Perfil público: Concluídos inclui eventos + mesmo filtro; Como Líder só rolês.
- [ ] Card evento sem ritmo/km de comboio; status Confirmado/Concluído corretos.

### Back

- [ ] Coleção `usersevento`; id `{usuarioId}_{eventoId}`.
- [ ] POST idempotente (201/200); uid só do token; sem `aceito`.
- [ ] 400 se evento encerrado; 404 se inexistente.
- [ ] DELETE 204 idempotente.
- [ ] `GET /eventos` devolve `inscrito` por item.
- [ ] `GET /perfil/historico` e histórico público mesclam eventos em participei/concluidos com `tipo`.
- [ ] Persistência só via repositório.

### Integração

- [ ] Inscrever → aparece em Participei no próximo GET (filtro Eventos/Todos).
- [ ] Cancelar → some do histórico.
- [ ] Evento com ingresso sem `linkIngresso` não deveria existir (validação SPEC 022); se legado inválido, modal não quebra o POST.

---

## 12. Arquivos impactados

| Arquivo | Ação |
|---------|------|
| `docs/specs/026-inscricao-evento.md` | **NOVO** (este) |
| `src/types/usuario-evento.ts` | **NOVO** |
| `src/types/evento.ts` | **Alterar** — `inscrito` no feed/detalhe |
| `src/types/historico-pistas.ts` | **Alterar** — união + filtro |
| `src/types/perfil-publico.ts` | **Alterar** — se SPEC 025 já existir no branch |
| `src/app/(app)/feed/components/EventoCard.tsx` | **Alterar** |
| `src/app/(app)/feed/components/BotaoInscreverEvento.tsx` | **NOVO** |
| `src/app/(app)/feed/components/ModalIngressoEvento.tsx` | **NOVO** |
| `src/app/(app)/feed/hooks/useInscricaoEvento.ts` | **NOVO** |
| `src/app/(app)/feed/services/inscricao-evento.service.ts` | **NOVO** |
| `src/app/(app)/eventos/[id]/**` | **Alterar** — detalhe mínimo + CTA |
| `src/app/(app)/perfil/components/FiltroTipoHistorico.tsx` | **NOVO** |
| `src/app/(app)/perfil/components/CardHistorico*.tsx` | **Alterar** / **NOVO** |
| `src/app/(app)/perfil/hooks/useHistoricoPistas.ts` | **Alterar** |
| `src/app/(app)/perfil/[uid]/**` | **Alterar** — filtro público (se 025 entregue) |
| `functions/src/types/usuario-evento.ts` | **NOVO** |
| `functions/src/types/historico-pistas.ts` | **Alterar** |
| `functions/src/routes/inscricao-evento.ts` | **NOVO** |
| `functions/src/routes/eventos.ts` | **Alterar** — montar router + enriquecer GET |
| `functions/src/lib/historico.ts` | **Alterar** — merge eventos |
| `functions/src/repositories/interfaces/usuario-evento.repository.ts` | **NOVO** |
| `functions/src/repositories/firestore/firestore-usuario-evento.repository.ts` | **NOVO** |
| `functions/src/repositories/interfaces/evento.repository.ts` | **Alterar** — `buscarPorIds` se faltar |
| `functions/src/repositories/index.ts` | **Alterar** |
| `firestore.indexes.json` | **Alterar** se a query exigir |
| `.cursor/rules/tech-stack.mdc` / `project-context.mdc` | **Alterar** na implementação — `usersevento` |

---

## 13. Checklist da skill Next.js

- [ ] `page.tsx` de detalhe sem `"use client"` (só orquestra).
- [ ] `"use client"` só em botão, modal, filtros, hooks.
- [ ] Estado de inscrição no hook; HTTP no service.
- [ ] Um componente = uma coisa (botão, modal, chip filtro, card evento).
- [ ] Sem abstração genérica “ParticipacaoEntity”.
- [ ] Sem `console.log` de debug.
- [ ] Sem escrita Firestore no client.

---

## 14. Ordem sugerida de implementação

1. Tipos + repositório `usersevento` + POST/GET/DELETE.
2. Enriquecer `GET /eventos` / `GET /eventos/:id` com `inscrito`.
3. UI feed: botão + modal + cancelar.
4. Detalhe mínimo com o mesmo CTA.
5. Extender `montarHistorico` + tipos união.
6. Filtro no perfil próprio.
7. Filtro no perfil público (se SPEC 025 já estiver no ar; senão, deixar o contrato pronto e UI pública no mesmo PR da 025).
8. Atualizar rules de contexto (`tech-stack` / `project-context`).

---

## 15. Relação com o código atual

| Hoje | Nesta spec |
|------|------------|
| `EventoCard` → Ver Detalhes | CTA Inscrever-se + estado inscrito |
| Sem vínculo usuário–evento | Coleção `usersevento` |
| Histórico só `usersrole` + `roles` | + eventos em Participei / Concluídos |
| `acesso` + `linkIngresso` só no cadastro | Usados no fluxo de inscrição |
| `/eventos/:id` placeholder | Placeholder enriquecido com CTA |
| SPEC 024 “sem inscrição” | Esta spec **reabre** só a inscrição (sem contador público de interessados) |

**Não implementar nesta tarefa de especificação** — este arquivo é o contrato para o desenvolvimento full stack seguinte.
