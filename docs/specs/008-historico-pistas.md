# SPEC 008 — Histórico de Pistas

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-09  
> **Referência visual:** `designs/perfil/` (`DESIGN.md`, `code.html`, `screen.png`) — seção **Histórico de Pistas**  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade  
> **Backend:** Cloud Function `api` (Express) — `GET /perfil/historico`  
> **Coleções Firestore:** `usersrole` (SPEC 005) e `roles` (SPEC 003 / 004)  
> **Depende de:** SPEC 001 (shell autenticado + `/perfil`), SPEC 002 (tela de edição), SPEC 005 (`usersrole` + pedido do piloto), SPEC 007 (líder aceita → `aceito: true`)

---

## 1. Objetivo

Completar o Cockpit (`/perfil`) com a seção **Histórico de Pistas**, que a SPEC 002 deixou de fora de propósito.

O piloto autenticado vê **três abas** com a quantidade de registros em cada uma:

| Aba | Conteúdo |
|-----|----------|
| **Aguardando** | Pedidos de vaga **pendentes** (ainda não decididos pelo líder) |
| **Participei** | Rolês em que o piloto **foi aceito** |
| **Criados** | Rolês que **ele publicou** (`criadorId` = uid do token) |

Esta spec é **full stack**:

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | UI do mock (título, tabs com badge, cards, vazio/erro), `GET /perfil/historico`, troca de aba |
| Back (Functions) | Token válido, uid só do token, join `usersrole` + `roles`, Haversine e contagem de confirmados, persistência só via repositório |

O uid **nunca** vem da query nem do body. Só o dono do token lê o próprio histórico.

A aba **Participei** só enche depois que o líder aceita (SPEC 007). Sem 007 no ar, Aguardando e Criados já funcionam; Participei fica vazia até o primeiro `aceito: true`.

---

## 2. Referência de Design

Replicar o visual de `designs/perfil/code.html` (bloco *Histórico de Rolês Criados e Participados*) + `screen.png`. Não inventar outro layout. Tokens em `designs/perfil/DESIGN.md` / `globals.css`.

### O que entra nesta spec (do mock)

- Título de seção **Histórico de Pistas**, com barra vertical laranja (mesmo padrão de **Dados do Piloto**).
- Tabs em grid 3 colunas: **Aguardando**, **Participei**, **Criados**.
- Badge numérico **por aba** (quantidade daquela lista).
- Lista de cards da aba ativa:
  - **Aguardando:** ícone `pending`, rótulo Pendente, título, chip **Em análise**, subtítulo, km + data.
  - **Participei:** bloco dia/mês, título, status **Concluído** (ou **Confirmado**), subtítulo, km + N motos.
  - **Criados:** bloco dia/mês (tint laranja), faixa **Criado por você**, status **Líder**, título, km + N motos.

### O que o mock mostra e **não** entra

| Elemento do mock | Motivo |
|------------------|--------|
| Telemetria (18 rolês / 2.450 km) | SPEC 002 / 007: sem agregação de km |
| Card de média 4.9 / avaliações | Sem reputação no schema |
| Seção **Avaliações Recebidas como Líder** | Spec futura |
| Sino de notificações no header | SPECs 001–007 já deixaram fora |
| Menu inferior | Já na SPEC 001 |
| Formulário de edição, salvar, sair, excluir | Já nas SPECs 002 e 006 — **não** reabrir |

Esta spec **só** acrescenta o bloco de histórico na tela que já existe. Não muda o PUT/DELETE de perfil.

### Desvios conscientes do mock (necessários)

O HTML é estático (14 / 4 / 2 fictícios). No app os números e os cards vêm da API. O mock mistura `titulo` e `descricao` de forma inconsistente entre abas.

| Mock | Nesta spec | Por quê |
|------|------------|---------|
| Participei ativo por padrão | Aba inicial **Aguardando** se `contagens.aguardando > 0`; senão **Participei** | Pedido pendente é ação; o mock não tinha essa regra |
| Participei = só “já aconteceu” | `aceito === true`; status **Concluído** se a saída passou, **Confirmado** se ainda não | Senão o piloto some da UI entre o aceite e a data de saída |
| Aguardando mostra 1 card fictício | Lista real de pendentes com rolê **ainda não saído** | Pedido em rolê passado sem decisão é ruído, não “aguardando” |
| `12 motos` no card | `{N} motos` = confirmados (`aceito: true`) daquele rolê | Sem `participantes[]` em `roles` (SPEC 005) |
| `260 km` no card | Haversine `localSaida` → `destinoFinal`, inteiro + ` km` | Igual ao backdrop da SPEC 005; sem polyline |
| Script do HTML só liga Participei ↔ Criados | As **três** abas trocam conteúdo | Aguardando existe no markup mas o JS do mock ignora |
| Histórico **dentro** do `<form>` de salvar | Seção **fora** do form de edição (tabs `type="button"`) | Evita submit acidental; ordem visual igual ao mock |

Não adicionar busca, filtro de ritmo, mapa nem paginação.

### Comportamento visual (do mock)

- Conteúdo em coluna única, gutter 16px, **max-width 560px** (já no shell `(app)`).
- Seção: `gap` 12px, `mt` ~8px, **depois** de Dados do Piloto / ritmo e **antes** do toast + Salvar / Sair / Excluir.
- Título: `headline-sm`, uppercase, Barlow Condensed; barra `w-1.5 h-4` `primary-container`.
- Tabs: `grid-cols-3`, fundo `surface-container-low`, padding 4px, `rounded-lg`, gap 4px.
- Tab inativa: `on-surface-variant`, badge pill `surface-variant`.
- Tab ativa: fundo `surface-container`, borda `1px solid` `primary-container` a 30%, label `primary`, badge `primary-container/20` + texto `primary-container`.
- Label da tab: `label-md` ~11px, uppercase, `truncate`.
- Badge: pill, `font-bold` ~10px, min 48px de toque no **botão inteiro** (não no número sozinho).
- Card: `surface-container`, `rounded-xl`, padding 12px, flex row, gap 12px.
- Bloco data: 48×48px (`w-12 h-12`), `rounded-lg`, `surface-container-high`. Dia `primary-container` Barlow bold; mês `badge-label` ~9px uppercase `on-surface-variant`.
- Bloco Aguardando: fundo `secondary-container/15`, ícone `pending` + “Pendente” em `secondary-container`.
- Bloco Criados: fundo `primary-container/20`, dia/mês em `primary-container`.
- Título do rolê (Aguardando / Participei): `badge-label` uppercase `secondary-container` (Aguardando) ou `secondary-container` / `primary` (Participei).
- Subtítulo: `label-md` `on-surface`, `truncate`.
- Meta: `body-sm` `on-surface-variant`, ícones `distance` / `group` / `calendar_today` 13px.
- Chip **Em análise**: `secondary-container/15`, texto `secondary-container` ~10px.
- Status **Concluído**: `on-surface-variant` ~11px.
- Status **Líder**: `tertiary` (ciano).
- Status **Confirmado**: `primary` (ainda não saiu).

---

## 3. Fluxo do Usuário

```
Grupo (app) — autenticado e com perfil (GuardaApp)
  │
  ▼
Menu → Perfil  →  /perfil
  │
  ├── Formulário (SPEC 002 / 006) — inalterado
  └── Histórico de Pistas
        │
        ├── GET /perfil/historico  (Bearer)
        │     ├── 200 → abas + listas + badges
        │     ├── 401 → GuardaApp / login
        │     └── 500 → EstadoErro na seção (form continua usável)
        │
        ├── Troca de aba (local, sem novo GET)
        │
        ├── Card Aguardando  →  /roles/:id/participar  (SPEC 005)
        ├── Card Participei  →  /roles/:id/participar  (sheet confirmado)
        └── Card Criados     →  /aprovacoes?role={id}  (SPEC 007)
```

- Um único GET ao montar a seção. Trocar de aba **não** refetch.
- Listas vazias: estado vazio **daquela aba**, não da página inteira.
- Falha do histórico **não** impede editar o perfil.
- Card Criados: se `/aprovacoes` ainda não existir (007 não entregue), o card **não** navega — só visual. Preferir o link quando a rota existir.

---

## 4. Arquitetura Next.js

Seguir a skill: página orquestradora, componentes ~80 linhas, lógica em hooks, API em service. `"use client"` só no que tem estado, clique ou `useAuth`.

`page.tsx` **não muda** de Server Component. O histórico vive nos filhos Client da feature `perfil`.

A listagem **não** pode ser Server Action com fetch no servidor: a rule do projeto exige Bearer no client (`auth.currentUser`).

### 4.1 Por que não criar rota `/historico`

O mock é um **bloco do Cockpit**, não uma página. Tabs e cards pertencem a `/perfil`. O item Perfil do dock continua ativo.

### 4.2 Estrutura por feature (acréscimos)

```
src/app/(app)/perfil/
├── page.tsx                              # inalterado (Server)
├── components/
│   ├── TelaPerfil.tsx                    # Alterar — monta HistoricoPistas
│   ├── FormularioPerfil.tsx              # inalterado (não envolve o GET)
│   ├── HistoricoPistas.tsx               # NOVO — seção + hook
│   ├── AbasHistorico.tsx                 # NOVO — tablist + badges
│   ├── ListaHistorico.tsx                # NOVO — lista da aba ativa
│   ├── CardHistorico.tsx                 # NOVO — um item
│   ├── BlocoDataHistorico.tsx            # NOVO — dia/mês ou ícone pendente
│   ├── EstadoVazioHistorico.tsx          # NOVO — copy por aba
│   └── EstadoErroHistorico.tsx           # NOVO — retry
├── hooks/
│   └── useHistoricoPistas.ts             # NOVO — GET, aba, loading, erro
├── services/
│   └── historico.service.ts              # NOVO — GET /perfil/historico
├── formatar-data-historico.ts            # NOVO — dia + mês curto (pt-BR)
├── constants.ts                          # Alterar — labels das abas / vazios
└── historico-pistas.module.css           # NOVO — não inflar perfil.module.css
```

`perfil.module.css` já passa de 700 linhas. Estilos do histórico **não** entram lá.

`FormularioPerfil` já está no limite de ~80 linhas e é um `<form>`. **Não** colocar o histórico dentro do form.

Ordem em `TelaPerfil`:

```tsx
<CabecalhoPerfil ... />
<FormularioPerfil usuario={usuario} />   // hoje: identidade + dados + acoes
```

Para o histórico ficar **entre** o seletor de ritmo e o CTA Salvar (como o mock), o form precisa ceder espaço. Duas opções válidas; usar a **A**:

**A (preferida):** `FormularioPerfil` recebe `antesDasAcoes` (`ReactNode`). `TelaPerfil` passa `<HistoricoPistas />`. O form não conhece o GET.

**B:** dividir o form em “dados” e “ações” na `TelaPerfil`. Mais diff na SPEC 002; só se A deixar o form ilegível.

### 4.3 Responsabilidades

| Peça | Tipo | Faz |
|------|------|-----|
| `page.tsx` | Server | Sem mudança |
| `TelaPerfil` | Client | Compõe form + histórico |
| `HistoricoPistas` | Client | Título da seção + hook + abas + lista |
| `AbasHistorico` | UI | Três botões, `aria-selected`, badges |
| `ListaHistorico` | UI | Mapa de cards **ou** vazio da aba |
| `CardHistorico` | UI | Um layout por `status` (pendente / concluido / confirmado / lider) |
| `useHistoricoPistas` | Hook | Fetch, `aba`, `setAba`, loading, erro, retry |
| `historico.service` | Service | `api<HistoricoPistas>("/perfil/historico")` |

**Não misturar** no mesmo arquivo: JSX das tabs + `fetch` + Haversine + formatação de data.

**Não** usar `getDocs` em `src/lib/firestore.ts`. Leitura só pela function.

**Não** reusar `RoleCard` do feed (capa 176px + CTA Participar). O card do histórico é uma linha compacta.

### 4.4 Item ativo no menu

Continua Perfil (`/perfil`). Sem item novo. Sem alterar `useItemMenuAtivo`.

---

## 5. Contrato dos Dados (front)

```ts
export type AbaHistorico = "aguardando" | "participei" | "criados";

export type StatusItemHistorico =
  | "pendente"
  | "confirmado"
  | "concluido"
  | "lider";

export type ItemHistoricoPista = {
  roleId: string;
  titulo: string;
  descricao: string;
  dataHoraSaida: string; // ISO
  distanciaKm: number;
  participantesConfirmados: number;
  ritmo: RitmoRole;
  status: StatusItemHistorico;
};

export type HistoricoPistas = {
  aguardando: ItemHistoricoPista[];
  participei: ItemHistoricoPista[];
  criados: ItemHistoricoPista[];
  contagens: {
    aguardando: number;
    participei: number;
    criados: number;
  };
};
```

Tipos em `src/types/historico-pistas.ts` (front) e o mesmo shape em `functions/src/types/historico-pistas.ts`. Não inflar `role.ts`.

`contagens.*` = `array.length` da lista correspondente (após filtros e teto). Sem aggregation extra.

### Copy do card por `status`

| Status | Bloco esquerdo | Linha 1 (uppercase) | Linha 2 | Direita | Meta |
|--------|----------------|---------------------|---------|---------|------|
| `pendente` | ícone `pending` + Pendente | `titulo` | `descricao` (omitir se `""`) | chip **Em análise** | km + data curta (`12 Nov`) |
| `concluido` | dia + mês | `titulo` | `descricao` | **Concluído** | km + `{N} motos` |
| `confirmado` | dia + mês | `titulo` | `descricao` | **Confirmado** | km + `{N} motos` |
| `lider` | dia + mês (tint laranja) | **Criado por você** | `titulo` | **Líder** | km + `{N} motos` |

Na aba Criados o mock **não** mostra `descricao` — a linha 2 é o título do rolê. Seguir isso.

### Copy do vazio por aba

| Aba | Título | Corpo |
|-----|--------|-------|
| `aguardando` | Nada na fila | Você não tem pedido aguardando o piloto líder. |
| `participei` | Nenhum comboio ainda | Quando o líder confirmar e o rolê entrar no histórico, ele aparece aqui. |
| `criados` | Você ainda não publicou | Toque no **+** do dock para organizar um rolê. |

Ícone de vazio: `explore_off` (aguardando / participei) e `add_road` (criados). Sem CTA extra na aba criados (o dock já tem o +).

---

## 6. Implementação Front

### 6.1 Service

```ts
// src/app/(app)/perfil/services/historico.service.ts
import { api } from "@/lib/api";
import type { HistoricoPistas } from "@/types/historico-pistas";

export const historicoService = {
  buscar: () => api<HistoricoPistas>("/perfil/historico"),
};
```

Usar `api` (Bearer automático). Um único `carregando` no hook. Tratar `ApiError`.

**Não** chamar `GET /roles` do feed e filtrar no client — o feed só lista futuros na região.

### 6.2 Hook (esqueleto)

```ts
const useHistoricoPistas = () => {
  // GET ao montar
  // aba inicial: dados.contagens.aguardando > 0 ? "aguardando" : "participei"
  // itensVisiveis = dados[aba]
  return { aba, setAba, dados, itensVisiveis, carregando, erro, recarregar };
};
```

Não guardar as três listas em estados separados — um `dados: HistoricoPistas | null` basta.

Retry: `EstadoErroHistorico` chama `recarregar()`.

### 6.3 Navegação do card

| Aba | Elemento | Destino |
|-----|----------|---------|
| Aguardando | `Link` | `/roles/{roleId}/participar` |
| Participei | `Link` | `/roles/{roleId}/participar` |
| Criados | `Link` | `/aprovacoes?role={roleId}` |

`aria-label` no link: “Abrir {titulo}”. Área de toque do card ≥ 48px de altura (o card já tem ~64px).

Não disparar POST de participação ao abrir o card — a SPEC 005 já é idempotente se o pedido existe.

### 6.4 Data no bloco e na meta

Helper `formatar-data-historico.ts`, timezone `America/Sao_Paulo` (igual ao feed):

- Bloco: dia com 2 dígitos (`18`) + mês curto sem ponto, uppercase (`OUT`).
- Meta da aba Aguardando: `d MMM` (`12 Nov`) — Plus Jakarta, não Barlow.

Não reusar `formatarHorarioSaida` do feed (ele devolve `Sábado, 07:00`).

### 6.5 Tokens CSS

CSS Modules em `historico-pistas.module.css`. Sem hex solto no TSX.

| Token | Uso |
|-------|-----|
| `--surface-container` / `-low` / `-high` / `-variant` | Cards, trilho das tabs, bloco data, badge inativo |
| `--primary` / `--primary-container` | Tab ativa, título da seção, bloco criados, Confirmado |
| `--secondary-container` | Aguardando (ícone, chip, borda do card pendente) |
| `--tertiary` | Status **Líder** |
| `--on-surface` / `--on-surface-variant` | Título / meta / Concluído |
| `--gutter-md` / `--touch-min` | Espaçamento e toque das tabs |

Tipografia: Barlow Condensed no título da seção, dia e labels uppercase; Plus Jakarta Sans na meta e subtítulo. Ícones: Material Symbols Outlined.

Padding inferior da página já considera o dock (SPEC 001). A seção não precisa de `padding-bottom` extra além do que o form já tem nas ações.

### 6.6 Acessibilidade

- Tabs: `role="tablist"` + `role="tab"` (`aria-selected`, `aria-controls`) + `role="tabpanel"`.
- Troca por clique; setas esquerda/direita no tablist (opcional mas desejável).
- Badge: `aria-label="Aguardando, {n} rolês"` (não só o número).
- Lista: `aria-label` conforme a aba (“Rolês aguardando aprovação”, etc.).
- Card pendente: `aria-label` inclui “em análise”.
- Loading: `role="status"` “Carregando histórico”.
- Erro: `role="alert"` + botão Tentar de novo.
- Área de toque das tabs ≥ 48px; usável a partir de 360px.

### 6.7 Loading

Skeleton de **2 cards** (bloco 48px + barras) na área da lista. As tabs já podem aparecer com badges `0` até o GET voltar, **ou** as três badges só após o 200 — preferir **esconder os números** (ou `—`) enquanto `carregando`, para não flashar zero.

---

## 7. Backend — `GET /perfil/historico`

Não usar `onCall`. Rotas **sem** `firestore.collection` direto. Factory em `repositories/index.ts`.

Não criar coleção nova. Join de `usersrole` + `roles`.

### 7.1 Quem aparece em cada lista

Invariantes da SPEC 005:

- Pendente: `aceito === false` **e** `aceitoEm == null` **e** `recusadoEm == null`.
- Aceito: `aceito === true` **e** `aceitoEm != null` **e** `recusadoEm == null`.
- Recusado: `recusadoEm != null` — **fora** do histórico do piloto nesta spec.

**Aguardando** (`usuarioId` = uid do token):

1. Docs `usersrole` pendentes do uid.
2. Join `roles` por `roleId`.
3. Descartar se o rolê não existe.
4. Descartar se `dataHoraSaida` **já passou**.
5. `status: "pendente"`.
6. Ordenar por `dataHoraSaida` **ASC** (próxima saída primeiro).

**Participei** (`usuarioId` = uid):

1. Docs `usersrole` aceitos do uid.
2. Join `roles`; descartar rolê inexistente.
3. **Não** descartar futuros (desvio do pedido “já passaram” — ver §2).
4. `status`: `concluido` se `Date.parse(dataHoraSaida) <= Date.now()`, senão `confirmado`.
5. Ordenar por `dataHoraSaida` **DESC**.

**Criados** (`roles.criadorId` = uid):

1. Docs `roles` do criador (passados e futuros).
2. `status: "lider"` em todos.
3. Ordenar por `dataHoraSaida` **DESC**.
4. O organizador **não** gera `usersrole` para si (SPEC 005, 403). Sem overlap com as outras abas.

Teto: **50** itens **por** lista. Sem paginação.

Rolê órfão (pedido sem documento `roles`): omitir, não 500.

### 7.2 Campos derivados

| Campo | Origem |
|-------|--------|
| `roleId`, `titulo`, `descricao`, `dataHoraSaida`, `ritmo` | Documento `roles` |
| `distanciaKm` | `Math.round(haversineKm(localSaida, destinoFinal))` — reusar `functions/src/lib/geo.ts` |
| `participantesConfirmados` | `contarConfirmados(roleId)` por rolê **distinto** (cache `Map`) |
| `status` | Regras da §7.1 |

Não devolver `UsuarioRole` cru, `fotoCapaUrl` nem `criador` nesta spec. O card compacto não usa capa.

### 7.3 Tipos de domínio (Functions)

```ts
// functions/src/types/historico-pistas.ts
export type StatusItemHistorico =
  | "pendente"
  | "confirmado"
  | "concluido"
  | "lider";

export type ItemHistoricoPista = {
  roleId: string;
  titulo: string;
  descricao: string;
  dataHoraSaida: string;
  distanciaKm: number;
  participantesConfirmados: number;
  ritmo: RitmoRole;
  status: StatusItemHistorico;
};

export type HistoricoPistas = {
  aguardando: ItemHistoricoPista[];
  participei: ItemHistoricoPista[];
  criados: ItemHistoricoPista[];
  contagens: {
    aguardando: number;
    participei: number;
    criados: number;
  };
};
```

### 7.4 Repositório

Estender contratos — **não** consultar Firestore na rota.

```ts
// UsuarioRoleRepository (além da SPEC 005 / 007)
listarPorUsuario(usuarioId: string): Promise<UsuarioRole[]>;

// RoleRepository (além da SPEC 003 / 007)
listarPorCriador(criadorId: string): Promise<Role[]>;
buscarPorIds(ids: string[]): Promise<Role[]>; // SPEC 007 já pede; reusar se existir
```

`listarPorUsuario`:

```
usersrole where usuarioId == uid
limit 100
```

Sem `orderBy` obrigatório — a rota ordena depois do join pela data do rolê. Se o emulator exigir índice com `orderBy`, **não** ordenar no Firestore nesta query.

Split pendente vs aceito **na rota** (ou num helper `montarHistorico`), não em duas queries, salvo se a SPEC 007 já tiver `listarPendentesDoCriador` — isso é pelo `criadorId`, não serve aqui.

`listarPorCriador`:

```
roles where criadorId == uid
orderBy dataHoraSaida DESC
limit 50
```

`buscarPorIds`: `getAll` em chunks de 100, como a SPEC 007. Se 007 ainda não tiver sido implementada, **entregar o método nesta spec**.

`contarConfirmados` já existe. Na montagem: ids distintos das três listas → um count por id, com `Map` (não N counts do mesmo rolê).

Exportar no factory só se as classes mudarem de construtor — em geral só os métodos novos.

### 7.5 Auth e rota

Arquivo `functions/src/routes/historico.ts`, montado no `perfilRouter` (já tem `autenticar`):

```
GET /perfil/historico
Headers: Authorization: Bearer <idToken>

200 → HistoricoPistas (listas podem ser [])
401 → token ausente / inválido
500 → responderErro
```

Não 404 quando o histórico está vazio.

Registrar **`GET /historico`** no `perfilRouter` **antes** de handlers `/:algo` se algum for criado no futuro. Hoje `GET /` é o perfil — sem colisão.

Não criar `GET /perfil/:uid/historico`. Não aceitar `uid` na query.

Health em `GET /` pode listar `/perfil/historico`.

### 7.6 Handler (contrato)

1. `uid` de `req.usuario.uid`.
2. `listarPorUsuario(uid)` + `listarPorCriador(uid)` em paralelo.
3. `roleIds` = ids dos pedidos + ids dos criados.
4. `buscarPorIds` (os criados já vêm completos; os pedidos precisam do join).
5. Partir os `usersrole` em pendente / aceito; ignorar recusados.
6. Montar as três arrays, teto 50, `contagens`.
7. `res.json(historico)`.

Campos extras na query (`aba=`, `limit=`) **não** entram nesta spec. Um payload único alimenta as três badges.

### 7.7 Índices

Em `firestore.indexes.json`, **além** dos índices das SPECs 005 e 007:

```json
{
  "collectionGroup": "roles",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "criadorId", "order": "ASCENDING" },
    { "fieldPath": "dataHoraSaida", "order": "DESCENDING" }
  ]
}
```

`usersrole.usuarioId` em igualdade simples **não** precisa de composto se a query não mistura `orderBy`. Se `listarPorUsuario` ganhar `orderBy`, adicionar `usuarioId` + o campo ordenado.

Se o emulator reclamar, copiar a URL do erro para o JSON — não inventar ordem diferente da query real.

### 7.8 O que não muda

- Function HTTP única `api`.
- `GET/PUT/DELETE /perfil` (documento `users`).
- `GET /roles` (feed) e `GET /roles/:id`.
- `POST|PATCH|DELETE /roles/:id/participacao`.
- `GET|PATCH /aprovacoes` (SPEC 007).
- Documento `roles` **sem** array `participantes`.
- Sem gravar nada nesta spec (só GET).

---

## 8. Wireframe

```
┌─────────────────────────────────┐
│  [logo]  PERFIL                 │  header (SPEC 002)
│          COCKPIT                │
├─────────────────────────────────┤
│         cartão + form           │  SPEC 002
│                                 │
│  ▎ HISTÓRICO DE PISTAS          │  ← NOVO
│                                 │
│  [Aguardando][Participei][Criad]│  tabs + badges (2) (14) (4)
│                                 │
│  ┌───────────────────────────┐  │
│  │ 18  SERRA DO RIO…  Concl. │  │  card (aba Participei)
│  │ OUT Curvas do Mirante     │  │
│  │     260 km  •  12 motos   │  │
│  └───────────────────────────┘  │
│                                 │
│  [ 💾 SALVAR ALTERAÇÕES ]       │  SPEC 002
│       ↩ Sair da conta           │
│       🗑 Excluir Conta          │  SPEC 006
└─────────────────────────────────┘
│  🏍️        ( + )        👤     │  Perfil ativo
└─────────────────────────────────┘

Aba Aguardando (card):
┌───────────────────────────────┐
│ ⏳   ROTA DOS TRO…  Em análise│
│ Pend. Bate-Volta Cunha…       │
│       310 km  •  12 Nov       │
└───────────────────────────────┘

Aba Criados (card):
┌───────────────────────────────┐
│ 29   CRIADO POR VOCÊ    Líder │
│ JUL  Café da Manhã & Bate-…   │
│      190 km  •  16 motos      │
└───────────────────────────────┘
```

---

## 9. Fora do Escopo

- Telemetria (rolês concluídos / km rodados) e avaliações / estrelas.
- Pedidos **recusados** e pedidos **cancelados** (DELETE da SPEC 005 apaga o doc).
- Paginação, pull-to-refresh, busca no histórico.
- Alterar o botão do feed para “Aguardando” / “Confirmado”.
- Tela de detalhe própria do rolê (além das rotas já existentes).
- Aceitar / recusar (SPEC 007) — esta spec **só lê**.
- Recalcular badges ao voltar de `/roles/:id/participar` além do refetch ao remontar `/perfil`.
- Soft-delete de rolês; histórico de comboios apagados.
- Menu inferior, guarda de rota, tokens globais, edição de perfil.

---

## 10. Critérios de Aceite

### Front

- [ ] `/perfil` ganha a seção **Histórico de Pistas** no visual do mock (título, 3 tabs com badge, cards).
- [ ] Três abas: Aguardando, Participei, Criados; o número da tab bate com `contagens`.
- [ ] Aguardando: pedidos pendentes de rolês **ainda não saídos**; card com Pendente + Em análise.
- [ ] Participei: aceitos; **Concluído** se passou, **Confirmado** se não saiu; km + motos.
- [ ] Criados: rolês do uid; faixa **Criado por você** + **Líder**.
- [ ] Lista vazia: copy da aba, sem quebrar o form.
- [ ] GET falhou: erro + retry **só** na seção; Salvar / Sair / Excluir intactos.
- [ ] Card Aguardando / Participei abre `/roles/:id/participar`; Criados abre `/aprovacoes?role=`.
- [ ] Um GET ao entrar no perfil; trocar de aba é local.
- [ ] Fora do `<form>` de edição (slot `antesDasAcoes` ou equivalente).
- [ ] `page.tsx` continua Server; Client só na seção / tabs / hook.
- [ ] Componentes < ~80 linhas; GET só no service; sem Firestore no client.
- [ ] Tabs acessíveis (`tablist` / `tab` / `tabpanel`); toque ≥ 48px; usável a partir de 360px.
- [ ] Horário/data em `America/Sao_Paulo`; km inteiro; motos = confirmados da API.
- [ ] Sem telemetria, sem avaliações, sem sino.

### Back

- [ ] `GET /perfil/historico` exige Bearer válido.
- [ ] Só lê dados do uid do token.
- [ ] 200 com três listas + `contagens`; vazio é `[]` / `0`, não 404.
- [ ] Aguardando ignora recusados, aceitos e rolês já saídos / inexistentes.
- [ ] Participei só `aceito === true`; recusados fora.
- [ ] Criados = `roles.criadorId === uid` (futuros e passados).
- [ ] `distanciaKm` Haversine; `participantesConfirmados` via `contarConfirmados`.
- [ ] Teto 50 por lista.
- [ ] Persistência só nos repositórios (`listarPorUsuario`, `listarPorCriador`, `buscarPorIds`).
- [ ] Índice `criadorId` + `dataHoraSaida` DESC em `firestore.indexes.json`.
- [ ] Sem escrita; `roles` sem array `participantes`.

### Integração

- [ ] Pedir vaga (SPEC 005) → o rolê entra em **Aguardando** no próximo GET.
- [ ] Líder aceita (SPEC 007) → sai de Aguardando e entra em **Participei** (`confirmado` ou `concluido`).
- [ ] Publicar rolê (SPEC 004) → entra em **Criados**.
- [ ] Cancelar pedido (DELETE) → some de Aguardando.
- [ ] Recusa do líder → **não** aparece em nenhuma aba.

---

## 11. Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| `src/app/(app)/perfil/components/TelaPerfil.tsx` | **Alterar** — passa o histórico ao form |
| `src/app/(app)/perfil/components/FormularioPerfil.tsx` | **Alterar** — slot `antesDasAcoes` |
| `src/app/(app)/perfil/components/HistoricoPistas.tsx` | **NOVO** |
| `src/app/(app)/perfil/components/AbasHistorico.tsx` | **NOVO** |
| `src/app/(app)/perfil/components/ListaHistorico.tsx` | **NOVO** |
| `src/app/(app)/perfil/components/CardHistorico.tsx` | **NOVO** |
| `src/app/(app)/perfil/components/BlocoDataHistorico.tsx` | **NOVO** |
| `src/app/(app)/perfil/components/EstadoVazioHistorico.tsx` | **NOVO** |
| `src/app/(app)/perfil/components/EstadoErroHistorico.tsx` | **NOVO** |
| `src/app/(app)/perfil/hooks/useHistoricoPistas.ts` | **NOVO** |
| `src/app/(app)/perfil/services/historico.service.ts` | **NOVO** |
| `src/app/(app)/perfil/formatar-data-historico.ts` | **NOVO** |
| `src/app/(app)/perfil/constants.ts` | **Alterar** — abas e vazios |
| `src/app/(app)/perfil/historico-pistas.module.css` | **NOVO** |
| `src/types/historico-pistas.ts` | **NOVO** |
| `functions/src/types/historico-pistas.ts` | **NOVO** |
| `functions/src/routes/historico.ts` | **NOVO** — `GET /historico` |
| `functions/src/routes/perfil.ts` | **Alterar** — `perfilRouter.use(historicoRouter)` |
| `functions/src/index.ts` | Opcional — health lista a rota |
| `functions/src/repositories/interfaces/usuario-role.repository.ts` | **Alterar** — `listarPorUsuario` |
| `functions/src/repositories/interfaces/role.repository.ts` | **Alterar** — `listarPorCriador`, `buscarPorIds` |
| `functions/src/repositories/firestore/firestore-usuario-role.repository.ts` | **Alterar** |
| `functions/src/repositories/firestore/firestore-role.repository.ts` | **Alterar** |
| `firestore.indexes.json` | **Alterar** — `criadorId` + `dataHoraSaida` |

Não alterar `MenuInferior`, `GuardaApp`, `PUT /perfil`, `BotaoSair` nem o modal de excluir.

Se a SPEC 007 já tiver `buscarPorIds`, não duplicar a implementação — só reusar.

---

## 12. Checklist da skill Next.js

- [ ] `page.tsx` sem `"use client"` (só orquestra).
- [ ] `"use client"` só em `HistoricoPistas` e filhos interativos (tabs, retry, links).
- [ ] Fetch / aba / erro em `useHistoricoPistas`.
- [ ] GET isolado em `historico.service.ts` (sem Firestore no componente).
- [ ] Um componente = uma coisa (abas, lista, card, bloco data, vazio).
- [ ] Sem abstração genérica “Tabs” da aplicação — só este tablist.
- [ ] Sem reusar `RoleCard` do feed “pra ficar igual”.
- [ ] CSS Modules + tokens de `globals.css`.
- [ ] Sem `console.log` de debug.

---

## 13. Relação com o código atual

| Hoje | Nesta spec |
|------|------------|
| SPEC 002: histórico fora do escopo | Bloco real no Cockpit |
| SPEC 007: “histórico de comboios passados é outra spec” | Esta spec |
| `UsuarioRoleRepository` só busca por par uid+role | + `listarPorUsuario` |
| `RoleRepository.listar` só janela do feed (futuros + ritmo) | + `listarPorCriador` (sem filtro de data) |
| Perfil não chama API de rolês | `GET /perfil/historico` |
| Participei vazio até o líder aceitar | Esperado se 007 não estiver no ar |
| Recusados / deletes | Continuam invisíveis |

Não migrar cards fictícios do HTML. Coleções reais: o primeiro pedido (SPEC 005) e o primeiro `POST /roles` (SPEC 004) nascem nas abas no GET seguinte.
