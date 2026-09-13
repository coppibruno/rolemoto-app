# SPEC 018 — Ajustes de Tela: Filtro "Próximos Rolês" + Recusados na Garagem

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-13  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade  
> **Backend:** Cloud Function `api` (Express) — `GET /roles` + `GET /meus-roles`  
> **Coleções Firestore:** `roles`, `usersrole`  
> **Depende de:** SPEC 003 (feed + schema `roles`), SPEC 005 (`usersrole` + participação), SPEC 017 (Meus Rolês / garagem)

---

## 1. Objetivo

Esta spec agrupa **duas melhorias pontuais** no app:

| # | Melhoria | Camada |
|---|----------|--------|
| A | Novo chip **"Próximos Rolês"** no filtro de data do feed — mostra rolês dos próximos 30 dias sem exigir que o piloto acerte uma data exata | Front + Back |
| B | Exibir rolês **recusados pelo organizador** na tela Meus Rolês — hoje o sistema simplesmente omite essas solicitações | Front + Back |

---

## 2. Melhoria A — Filtro "Próximos Rolês" no Feed

### 2.1 Contexto atual

O filtro de data (`FiltrosData`) oferece:

| Chip | Valor `quando` | Intervalo |
|------|-----------------|-----------|
| Hoje | `"hoje"` | Início do dia SP → fim do dia SP |
| Amanhã | `"amanha"` | Mesmo, +1 dia |
| Neste Fim de Semana | `"fim_de_semana"` | Sábado → domingo (SP) |
| 📅 Selecionar data | `{ tipo: "data", iso }` | O dia inteiro escolhido |

O piloto que quer ver **qualquer rolê futuro nos próximos dias** precisa navegar manualmente pelo date picker. Falta um atalho rápido tipo "me mostra tudo que tem nas próximas semanas".

### 2.2 Proposta

Adicionar o chip **"Próximos Rolês"** ao final das opções de `quando`, **antes** do botão de selecionar data. O chip filtra rolês de `agora` até `hoje + 30 dias` (fuso `America/Sao_Paulo`).

**Posição dos chips após a mudança:**

```
[ Próximos Rolês ] [ Hoje ] [ Amanhã ] [ Neste Fim de Semana ] [ 📅 Selecionar data ]
```

O chip fica **primeiro** no grupo — é o atalho mais abrangente e deve ser o mais visível.

### 2.3 Tipo `FiltroQuando` — sem quebra

O valor `"proximos_roles"` entra como mais uma alternativa string no union type, sem alterar a variante de objeto `{ tipo: "data", iso }`.

```ts
// src/app/(app)/feed/types.ts
export type FiltroQuando =
  | "hoje"
  | "amanha"
  | "fim_de_semana"
  | "proximos_roles"           // ← NOVO
  | { tipo: "data"; iso: string };
```

### 2.4 Constantes do feed

```ts
// src/app/(app)/feed/constants.ts — OPCOES_QUANDO
export const OPCOES_QUANDO: {
  valor: Exclude<FiltroQuando, { tipo: "data" }>;
  label: string;
}[] = [
  { valor: "proximos_roles", label: "Próximos Rolês" },   // ← NOVO (primeiro)
  { valor: "hoje", label: "Hoje" },
  { valor: "amanha", label: "Amanhã" },
  { valor: "fim_de_semana", label: "Neste Fim de Semana" },
];
```

Não mudar `QUANDO_PADRAO` (`"fim_de_semana"`). O novo chip é uma opção explícita, não o default.

### 2.5 Componente `FiltrosData`

Nenhuma mudança estrutural — o chip `"proximos_roles"` já é renderizado pelo `map` de `OPCOES_QUANDO` e segue o mesmo padrão de toggle (clique ativa, clique de novo desativa via `alternarQuando`).

### 2.6 Service do feed

A função `quandoParaQuery` já converte os valores string em `{ quando }` para a query string. Como `"proximos_roles"` é string, o service envia `quando=proximos_roles` automaticamente, sem alteração em `roles.service.ts` ou `filtrosParaParams`.

### 2.7 Backend — `resolverIntervaloQuando`

Adicionar o case `"proximos_roles"` em `functions/src/lib/quando.ts`:

```ts
// functions/src/lib/quando.ts — dentro de resolverIntervaloQuando

if (quando === "proximos_roles") {
  const limiteDia = somarDiasYmd(hoje, 30);
  return {
    dataInicioIso: maxIso(agoraIso, inicioDoDiaSp(hoje)),
    dataFimIso: fimDoDiaSp(limiteDia),
  };
}
```

**Semântica:** de `agora` (cortado pelo `maxIso`) até o **fim** do dia `hoje + 30 dias`, no fuso `America/Sao_Paulo`. Isso cobre ~31 dias-calendário (hoje até daqui a 30 dias, inclusive).

### 2.8 Backend — validação da query

Adicionar `"proximos_roles"` à lista de valores aceitos em `functions/src/lib/roles-query.ts`:

```ts
// functions/src/lib/roles-query.ts
const QUANDOS = ["hoje", "amanha", "fim_de_semana", "proximos_roles", "data"] as const;
```

Sem nova query param. `proximos_roles` não requer `data`.

### 2.9 Fluxo completo

```
Piloto toca "Próximos Rolês"
  → useFiltrosFeed.quando = "proximos_roles"
  → useListaRoles refaz GET /roles?lat=...&lng=...&quando=proximos_roles
  → Backend: resolverIntervaloQuando("proximos_roles") → intervalo 30 dias
  → roleRepository.listar({ dataInicioIso, dataFimIso })
  → filtra raio + busca
  → 200 RoleFeedItem[]
```

### 2.10 Impacto visual

O chip segue o mesmo design system dos demais (`styles.chip`, `styles.chipQuando`, `styles.chipQuandoAtivo`). Não precisa de ícone especial — texto puro como "Hoje" e "Amanhã".

Em telas 360px o grupo de chips já faz scroll horizontal (`overflow-x: auto` no container `.chips`). O chip extra não quebra o layout — apenas estende a área scrollável.

---

## 3. Melhoria B — Rolês Recusados na Garagem (Meus Rolês)

### 3.1 Contexto atual

Quando o organizador **recusa** a solicitação de um piloto:

1. `PATCH /aprovacoes/:id { decisao: "recusar" }` seta `recusadoEm` + `aceito: false` no doc `usersrole`.
2. Nenhuma notificação push é enviada (só aceites notificam — SPEC 013).
3. Em `classificarMeusRoles` (`functions/src/lib/meus-roles.ts`), pedidos recusados **são ignorados** — não entram no payload.
4. Em `montarHistorico` (`functions/src/lib/historico.ts`), recusados também **não aparecem**.
5. O piloto **nunca fica sabendo** que foi recusado, a menos que volte à tela de participação daquele rolê específico.

### 3.2 Proposta

Incluir uma **nova aba "Recusados"** na tela Meus Rolês, mostrando os rolês cujas solicitações foram recusadas pelo organizador.

### 3.3 Novo status e aba

```ts
// src/types/meus-roles.ts
export type StatusMeuRole = "pendente" | "confirmado" | "lider" | "concluido" | "recusado";

export type AbaMeusRoles = "proximos" | "confirmados" | "aguardando" | "concluidos" | "recusados";
```

```ts
// functions/src/types/meus-roles.ts
export type StatusMeuRole = "pendente" | "confirmado" | "lider" | "concluido" | "recusado";
```

### 3.4 Backend — `classificarMeusRoles`

Hoje o `for` em `classificarMeusRoles` ignora pedidos recusados (não entram no `if ePedidoPendente` nem em `if ePedidoAceito`). Adicionar a classificação:

```ts
// functions/src/lib/meus-roles.ts — dentro do for de classificarMeusRoles

// Pedido recusado — novo
const ePedidoRecusado = (pedido: UsuarioRole): boolean =>
  pedido.recusadoEm !== null;

// Dentro do loop, APÓS os checks existentes:
if (ePedidoRecusado(pedido)) {
  porId.set(role.id, {
    role,
    status: "recusado",
    papel: "participante",
    pedidoCriadoEm: pedido.createdAt,
  });
}
```

**Nota:** `ePedidoRecusado` pode ser adicionado em `functions/src/lib/historico.ts` junto aos demais predicados (`ePedidoPendente`, `ePedidoAceito`), ou diretamente em `meus-roles.ts` — a critério da implementação.

### 3.5 Backend — contagens e telemetria

#### Contagens

Adicionar `recusados` ao `ContagensMeusRoles`:

```ts
// functions/src/types/meus-roles.ts + src/types/meus-roles.ts
export type ContagensMeusRoles = {
  confirmados: number;
  aguardando: number;
  concluidos: number;
  recusados: number;    // ← NOVO
};
```

Em `montarContagens`:

```ts
// functions/src/lib/meus-roles.ts — montarContagens
} else if (item.status === "recusado") {
  recusados += 1;
}
```

#### Telemetria

Recusados **não** impactam a telemetria:

- Não contam em `ativos` (não têm vaga).
- Não contam em `analise` (não estão pendentes).
- Não somam `asfaltoKm` (não participaram).

### 3.6 Backend — payload

Os itens recusados entram na lista `itens[]` do `MeusRolesPayload` com `status: "recusado"`. O client filtra por aba. Não precisa de endpoint novo — apenas o `GET /meus-roles` existente passa a incluí-los.

**Informação adicional no item recusado:** adicionar o campo `recusadoEm` ao `MeuRoleItem` para mostrar quando a recusa aconteceu:

```ts
// src/types/meus-roles.ts + functions/src/types/meus-roles.ts
export type MeuRoleItem = {
  // ... campos existentes ...
  recusadoEm: string | null;   // ← NOVO — ISO; preenchido se status === "recusado"
};
```

Esse campo é `null` para todos os status que não sejam `"recusado"`.

### 3.7 Frontend — Aba "Recusados"

#### Constantes

```ts
// src/app/(app)/meus-roles/constants.ts — ABAS_MEUS_ROLES
export const ABAS_MEUS_ROLES: { id: Exclude<AbaMeusRoles, "proximos">; label: string }[] = [
  { id: "confirmados", label: "Confirmados" },
  { id: "aguardando", label: "Aguardando" },
  { id: "concluidos", label: "Concluídos" },
  { id: "recusados", label: "Recusados" },    // ← NOVO
];
```

#### Estado vazio

```ts
// src/app/(app)/meus-roles/constants.ts — VAZIOS
recusados: {
  titulo: "Nenhuma recusa",
  corpo: "Quando o organizador recusar uma solicitação, ela aparece aqui.",
},
```

#### Hook `useFiltrosMeusRoles`

Na função `porAba`, adicionar o case:

```ts
if (aba === "recusados") return item.status === "recusado";
```

Na aba `proximos` (default), recusados **não** aparecem — o default continua mostrando só `pendente`, `confirmado` e `lider`:

```ts
if (aba === "proximos") return item.status !== "concluido" && item.status !== "recusado";
```

Ordenação na aba recusados: por `recusadoEm` DESC (mais recente primeiro) — o piloto vê primeiro as recusas mais novas.

#### Componente `AbasMeusRoles`

Nenhuma mudança estrutural — o `map` de `ABAS_MEUS_ROLES` já renderiza a nova aba automaticamente. O badge usa `contagens.recusados`.

#### Novo card: `CardRecusadoRole`

Componente novo em `src/app/(app)/meus-roles/components/CardRecusadoRole.tsx`.

**Layout:**

| Zona | Conteúdo |
|------|----------|
| Pill status | **Recusado** — cor `--error` (mesmo tom de ritmo agressiva, indicando negação) |
| Título | `titulo` uppercase |
| Data da recusa | `recusadoEm` formatado: "Recusado em DD/MM/YYYY" |
| Organizador | "Organizado por **@{apelido}**" |
| Info | Texto discreto: *O organizador optou por não incluir você neste rolê.* |

**Ações:**

- **Nenhum CTA primário** — o piloto não pode refazer a solicitação (backend retorna 409).
- **Sem "Acessar"** — não faz sentido navegar à tela de participação de um rolê recusado.
- Toque no card: sem navegação (card informativo).

**Estilo:**

- Fundo `surface-container`, borda sutil `--error` a ~20% de opacidade (glow leve).
- Opacidade do conteúdo pode ser levemente reduzida (`opacity: 0.85`) para indicar estado inativo.
- Pill: `background: var(--error)`, `color: var(--on-error)`.

#### `ListaMeusRoles`

Adicionar o case `"recusado"` no render de cards:

```tsx
if (item.status === "recusado") {
  return <CardRecusadoRole key={item.roleId} item={item} />;
}
```

### 3.8 Contagens no badge — zero inicial

Se não houver recusados, o badge mostra `0`. A aba ainda aparece — o piloto sabe que a funcionalidade existe. Quando clicar nela com 0 itens, vê o estado vazio "Nenhuma recusa".

### 3.9 Fluxo do piloto

```
Piloto abre /meus-roles
  → GET /meus-roles (Bearer)
  → Backend classifica pedidos recusados com status: "recusado"
  → Payload inclui itens recusados + contagens.recusados
  │
  ├── Default (Próximos): recusados NÃO aparecem
  ├── Aba "Recusados": lista de rolês recusados, ordenada por recusadoEm DESC
  │     └── Card informativo: título, data da recusa, organizador
  └── Telemetria: recusados NÃO afetam stats
```

---

## 4. Wireframe da aba Recusados

```
┌─────────────────────────────────┐
│ ⚡ ROLÊMOTO                 (👤) │
├─────────────────────────────────┤
│ ● Painel de Garagem        [⚙]  │
│ MEUS ROLÊS                      │
│ Gerencie seus comboios…         │
│ ┌──────┐ ┌──────┐ ┌──────┐     │
│ │Ativos│ │Anális│ │Asfalt│     │
│ │  3   │ │  1   │ │1420km│     │
│ └──────┘ └──────┘ └──────┘     │
│ [Confirm. 2][Aguard. 1][Concl. 4][Recus. 1] │ ← aba "Recusados" nova
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 🔴 Recusado                 │ │
│ │ ROLÊ SERRA DA MANTIQUEIRA   │ │
│ │ Recusado em 10/09/2026      │ │
│ │ Organizado por @piloto123   │ │
│ │ O organizador optou por não │ │
│ │ incluir você neste rolê.    │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## 5. Arquivos Impactados

### Melhoria A — Filtro "Próximos Rolês"

| Arquivo | Ação | Detalhe |
|---------|------|---------|
| `src/app/(app)/feed/types.ts` | **Alterar** | Adicionar `"proximos_roles"` ao union `FiltroQuando` |
| `src/app/(app)/feed/constants.ts` | **Alterar** | Adicionar item em `OPCOES_QUANDO` |
| `functions/src/lib/quando.ts` | **Alterar** | Novo case `"proximos_roles"` em `resolverIntervaloQuando` |
| `functions/src/lib/roles-query.ts` | **Alterar** | Adicionar `"proximos_roles"` em `QUANDOS` |

**Não** altera: `FiltrosData.tsx`, `useFiltrosFeed.ts`, `roles.service.ts`, `roles.ts` (handler) — tudo já funciona genericamente.

### Melhoria B — Recusados na Garagem

| Arquivo | Ação | Detalhe |
|---------|------|---------|
| `src/types/meus-roles.ts` | **Alterar** | `"recusado"` em `StatusMeuRole`, `"recusados"` em `AbaMeusRoles`, `recusados` em `ContagensMeusRoles`, `recusadoEm` em `MeuRoleItem` |
| `functions/src/types/meus-roles.ts` | **Alterar** | Espelhar as mesmas adições do front |
| `functions/src/lib/meus-roles.ts` | **Alterar** | Classificar recusados em `classificarMeusRoles`, contar em `montarContagens`, preencher `recusadoEm` em `paraMeuRoleItem` |
| `functions/src/lib/historico.ts` | **Alterar** (opcional) | Adicionar `ePedidoRecusado` se quiser centralizar predicados |
| `src/app/(app)/meus-roles/constants.ts` | **Alterar** | Nova aba em `ABAS_MEUS_ROLES`, novo vazio em `VAZIOS` |
| `src/app/(app)/meus-roles/hooks/useFiltrosMeusRoles.ts` | **Alterar** | Case `"recusados"` em `porAba`, excluir recusados de `"proximos"` |
| `src/app/(app)/meus-roles/components/CardRecusadoRole.tsx` | **NOVO** | Card visual do recusado |
| `src/app/(app)/meus-roles/components/ListaMeusRoles.tsx` | **Alterar** | Renderizar `CardRecusadoRole` |
| `src/app/(app)/meus-roles/meus-roles.module.css` | **Alterar** | Estilos do card recusado (pill, glow, opacidade) |

**Não** altera: `GET /perfil/historico`, `AbasMeusRoles.tsx` (renderiza via map), `TelametriaGaragem.tsx`, `SheetFiltrosMeusRoles.tsx`, `page.tsx`.

---

## 6. Fora do Escopo

- Notificação push de recusa (pode ser uma spec futura — hoje nem o aceite tem push granular por rolê na garagem).
- Permitir re-solicitação após recusa (backend retorna 409 e esse comportamento permanece).
- Filtrar por período no chip "Próximos Rolês" (é fixo em 30 dias).
- Mudar o default do feed (`QUANDO_PADRAO` continua `"fim_de_semana"`).
- Alterar o Histórico de Pistas do `/perfil` (SPEC 008 intacta).
- Paginação na aba recusados (volume esperado baixo).
- Card recusado com CTA de ação (sem re-solicitação, sem chat).

---

## 7. Critérios de Aceite

### Melhoria A — Filtro "Próximos Rolês"

- [ ] Chip **"Próximos Rolês"** aparece como **primeiro** chip no filtro de data do feed, antes de "Hoje".
- [ ] Ao tocar, envia `quando=proximos_roles` na query do `GET /roles`.
- [ ] Backend aceita `quando=proximos_roles` e retorna rolês de `agora` até `hoje + 30 dias` (fuso SP).
- [ ] Tocar de novo no chip desativa o filtro (toggle, como os demais).
- [ ] Chip segue o mesmo visual dos existentes (sem ícone especial).
- [ ] Em telas 360px, o grupo de chips faz scroll horizontal sem quebrar.
- [ ] `QUANDO_PADRAO` continua `"fim_de_semana"`.

### Melhoria B — Recusados na Garagem

- [ ] `GET /meus-roles` retorna itens com `status: "recusado"` e campo `recusadoEm` preenchido.
- [ ] `contagens.recusados` reflete a quantidade de pedidos recusados.
- [ ] Recusados **não** aparecem na aba Próximos (default), Confirmados, Aguardando ou Concluídos.
- [ ] Aba **"Recusados"** aparece no trilho de abas com badge numérico.
- [ ] Card recusado exibe: pill "Recusado" (erro), título, data da recusa, organizador, texto explicativo.
- [ ] Card recusado **não** tem CTA de ação (sem Acessar, sem re-solicitar).
- [ ] Toque no card recusado não navega a lugar nenhum.
- [ ] Telemetria **não** é afetada por recusados (ativos, análise, asfalto inalterados).
- [ ] Aba recusados com 0 itens mostra estado vazio "Nenhuma recusa".
- [ ] Recusados de rolês já passados também aparecem (o piloto deve ver o histórico de recusas).
- [ ] `GET /perfil/historico` continua ignorando recusados (SPEC 008 inalterada).

---

## 8. Checklist da skill Next.js

- [ ] Nenhum `"use client"` novo desnecessário (as mudanças front do feed são em tipos/constantes).
- [ ] `CardRecusadoRole` < ~80 linhas, só exibe dados.
- [ ] Lógica de filtro continua no hook `useFiltrosMeusRoles`.
- [ ] Sem Firestore no client.
- [ ] CSS Modules + tokens de `globals.css` para o card recusado.
- [ ] Sem `console.log` de debug.
