# SPEC 024 — Filtragem do Feed (abas Rolês / Eventos / Locais)

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-17  
> **Referência visual:** `designs/filtros-feed/` (`DESIGN.md`, `code.html`, `screen.png`)  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade  
> **Backend:** Cloud Function `api` (Express) — estender `GET /roles`, `GET /eventos`, `GET /locais` + `GET /feed/contagens`  
> **Coleções Firestore:** `roles`, `eventos`, `locais` (sem coleção nova)  
> **Depende de:** SPEC 003 (feed de rolês), SPEC 022 (coleção `eventos` + `GET /eventos`), SPEC 023 (coleção `locais` + `GET /locais`), SPEC 001 (shell + dock)

---

## 1. Objetivo

Transformar a home `/` de **lista só de rolês** em um **feed com três listagens distintas**, controladas por abas:

| Aba | Entidade | Contador |
|-----|----------|----------|
| **Rolês** | Comboios com partida → destino | `(N)` itens no raio / filtros atuais |
| **Eventos** | Encontros com data em destino fixo | `(N)` itens no raio / filtros atuais |
| **Locais** | Pontos permanentes do catálogo | `(N)` itens no raio / busca atual |

O piloto autenticado escolhe a aba, vê **só** os cards daquela entidade e os contadores das três abas atualizam juntos quando mudam localização, raio ou busca.

Esta spec é **full stack**:

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | UI do mock (`designs/filtros-feed/`), abas + contadores, filtros contextuais por aba, listagens e estados vazios |
| Back (Functions) | Filtro geo/texto em eventos e locais; contagens leves; rolês continuam no contrato já existente |

**Não implementar** cadastro de evento/local aqui — isso é SPEC 022 / 023. Esta spec **consome** os GETs e os **estende** com os critérios do feed.

---

## 2. Recorte e princípios

### 2.1 O que entra

- Abas segmentadas **Rolês | Eventos | Locais** com ícone, label e contador `(N)`.
- Uma listagem por aba (nunca misturar os três tipos no mesmo scroll).
- Barra de busca unificada + atalho de **raio** (pill ciclável do mock: 25 / 50 / 100 / sem limite).
- Filtros contextuais:
  - Aba Rolês: **quando** + **ritmo** (já existem).
  - Aba Eventos: **quando** (sem ritmo).
  - Aba Locais: só raio + busca (sem quando / ritmo).
- Contadores sincronizados com os mesmos critérios de localização / raio / busca (e `quando` quando aplicável).
- Cards de Evento e Local no estilo do mock (versão enxuta — secção 6).
- Extensão de `GET /eventos` e `GET /locais` com `lat`, `lng`, `raioKm`, `q` (+ `quando`/`data` só em eventos).
- `GET /feed/contagens` — contagens sem payloads de card.

### 2.2 O que **não** entra

| Elemento do mock / ideia | Motivo |
|--------------------------|--------|
| Banner **Radar SP • Ao Redor** / “N pilotos online” / **AO VIVO** | Sem presença em tempo real nem coleção de sessões |
| **Modo de visualização** (dropdown “Rolês de Estrada”…) | Só decorativo no HTML; não há modos de produto |
| Badge **Conectado** | Idem; não há heartbeat |
| Feed misto (rolê + evento + local no mesmo scroll) | Pedido do produto: **três listagens distintas** via abas |
| “48 motociclistas interessados” | Sem inscrição/interesse em evento |
| Pilha de avatares / “+12 confirmados” no card de rolê | Já fora na SPEC 003 (ou só se já existir no código — não inventar) |
| Toggle “Presença Confirmada!” no card | Participar continua navegando (SPEC 003 / 005) |
| Cadastro de evento / local / menu do `+` | SPEC 022 / 023 |
| Mapa interativo / pins do perímetro | Spec futura |
| Paginação infinita | Volume baixo; limite defensivo no back (como SPEC 003) |
| Persistência da aba no Firestore | Só `sessionStorage` / state (opcional) |

### 2.3 Dependências obrigatórias

| Spec | O que esta spec precisa já existir |
|------|-------------------------------------|
| 003 | Feed de rolês, `GET /roles` filtrado, `TelaFeed`, hooks de localização / filtros |
| 022 | Coleção `eventos`, tipos, `GET /eventos` (futuros), `GET /eventos/:id` |
| 023 | Coleção `locais`, tipos, `GET /locais`, `GET /locais/:id` |

Se 022/023 ainda não estiverem no branch, **implementar primeiro** o mínimo de leitura (tipos + repositório + GET sem POST/UI de cadastro) **ou** bloquear esta entrega. Não inventar schema paralelo.

### 2.4 Desvios conscientes do mock

| Mock | Nesta spec | Por quê |
|------|------------|---------|
| Stream com 3 tipos de card juntos | Só o tipo da aba ativa | Pedido explícito de três listagens |
| Radar / AO VIVO / Conectado / Modo | **Omitir** | Sem backend |
| Placeholder “Buscar rolês, eventos ou pontos…” | Adotar | Busca unificada por aba |
| Raio como pill ciclável ao lado da busca | Adotar **e** manter chips de raio na seção de filtros **ou** só o pill — **escolher o pill** como controle primário (mock); remover duplicata dos chips de raio na aba ativa |
| Card evento “Ver Detalhes” | Link para `/eventos/:id` (placeholder fino se detalhe não existir) | Spec de detalhe pode vir depois |
| Card local “Traçar Rota Direta” | Abrir Maps (`urlAbrirMaps` / `linkMaps` do doc) | SPEC 019 |
| Título header “Feed” | Adotar (hoje o feed pode dizer “Roles Feed / Cockpit”) | Alinhar ao mock |

---

## 3. Referência de Design

Replicar o visual de `designs/filtros-feed/` (`code.html` + `screen.png`) **na região de busca, abas e cards**. Tokens em `DESIGN.md` / `globals.css`. Não inventar outro layout.

### 3.1 O que entra do mock

- Header sticky: logo + **Feed** + avatar (`/perfil`).
- Linha: busca + pill de raio (`radar` + `50 KM`).
- Segmented control 3 colunas: Rolês / Eventos / Locais.
  - Ativo: `bg-primary-container`, texto `surface`, sombra.
  - Inativo: texto `on-surface-variant`.
  - Contador em pill `(N)` com tipografia `telemetry-num` / `body-sm`.
- Cards por tipo (abaixo).
- Cue de fim de lista: ícone `two_wheeler` + “Você está atualizado com o asfalto ao redor.”

### 3.2 Comportamento visual

- Coluna única, gutter 16px, **max-width 560px** (shell `(app)`).
- Abas: `grid grid-cols-3`, fundo `surface-container-lowest`, `p-1`, `rounded-xl`.
- Touch ≥ 48px nas abas e no pill de raio.
- Ícones Material Symbols: Rolês `two_wheeler`; Eventos `local_activity`; Locais `near_me`.

### 3.3 Cards (conteúdo mínimo)

**Rolê** — manter o card já implementado (SPEC 003 / ajustes posteriores). Não redesenhar do zero; só garantir que aparece **somente** na aba Rolês.

**Evento** (novo, alinhado ao mock):

| Zona | Conteúdo |
|------|----------|
| Badges | Horário relativo (“Hoje às 19:30”) + acesso (`Entrada Franca` / Consumação / Ingresso) |
| Título | `titulo` uppercase |
| Endereço | `local.endereco` (truncate) |
| Thumb | `fotoCapaUrl` 64×64 |
| CTA | **Ver Detalhes** → `/eventos/{id}` |

**Não** mostrar contagem de interessados.

**Local** (novo, alinhado ao mock):

| Zona | Conteúdo |
|------|----------|
| Badge | `Aberto 24H` **ou** faixa `HH:mm–HH:mm`; label categoria (ex. “Pit Stop Oficial” / label da categoria) |
| Título | `nome` |
| Subtítulo | `endereco` (1 linha) ou texto curto se houver — **sem** inventar “ponto zero…” se o schema não tiver descrição |
| Chips | Até 3 facilidades (ícone + label) |
| CTA | **Traçar Rota Direta** → Maps (`linkMaps` se preenchido, senão `urlAbrirMaps(lat,lng,nome)`) |

Se `fotoFachadaUrl` vazia: ícone de categoria no lugar da thumb/mapa miniatura.

---

## 4. Fluxo do usuário

```
Grupo (app) — autenticado com perfil (GuardaApp)
  │
  ▼
Menu → Feed  →  /
  │
  ▼
GPS / ponto (já SPEC 003)
  │
  ├── Sem ponto → painel pede Alterar; abas visíveis com (0); sem GET de lista
  │
  └── Com ponto
        ├── GET /feed/contagens?...     → atualiza (N) nas 3 abas
        ├── GET da entidade da aba ativa (roles | eventos | locais)
        │     ├── 200 com itens → lista
        │     └── 200 [] → EstadoVazio contextual
        │
        ├── Troca de aba → GET só da nova entidade (contagens já conhecidas;
        │                 revalidar contagens se filtros mudaram)
        │
        └── Muda raio / busca / quando / ritmo / ponto
              → debounce busca (~300ms)
              → novo GET contagens + GET da aba ativa
```

- Default da aba: **Rolês**.
- Filtros combinam com **AND** dentro da entidade.
- Trocar aba **não** limpa busca nem raio; limpa ou ignora filtros que não se aplicam (ritmo some na UI de Eventos/Locais; `quando` some em Locais).

---

## 5. Arquitetura Next.js

Seguir a skill: página orquestradora, componentes ~80 linhas, lógica em hooks, API em service. `"use client"` só com estado, geolocalização, abas ou `useAuth`.

A listagem **continua no client** (Bearer + `navigator.geolocation`).

### 5.1 Page (inalterada na responsabilidade)

```tsx
// src/app/(app)/page.tsx — Server Component
import { TelaFeed } from "./feed/components/TelaFeed";

const FeedPage = () => {
  return (
    <main>
      <TelaFeed />
    </main>
  );
};

export default FeedPage;
```

### 5.2 Estrutura por feature (evolução de `feed/`)

```
src/app/(app)/feed/
├── components/
│   ├── TelaFeed.tsx                 # Alterar — orquestra aba + listas
│   ├── AbasFeed.tsx                 # NOVO — segmented + contadores
│   ├── BarraBuscaRaio.tsx           # NOVO — busca + pill raio (mock)
│   ├── CampoBusca.tsx               # Alterar — placeholder unificado
│   ├── FiltrosQuando.tsx            # Renomear/reusar FiltrosData (rolês + eventos)
│   ├── FiltrosRitmo.tsx             # Só aba rolês
│   ├── ListaRoles.tsx               # Já existe
│   ├── ListaEventos.tsx             # NOVO
│   ├── ListaLocais.tsx              # NOVO
│   ├── EventoCard.tsx               # NOVO
│   ├── LocalCard.tsx                # NOVO
│   ├── EstadoVazio.tsx              # Alterar — copy por aba
│   └── …
├── hooks/
│   ├── useAbaFeed.ts                # NOVO — aba ativa + sessionStorage opcional
│   ├── useContagensFeed.ts          # NOVO — GET /feed/contagens
│   ├── useListaRoles.ts             # Já existe
│   ├── useListaEventos.ts           # NOVO
│   ├── useListaLocais.ts            # NOVO
│   ├── useFiltrosFeed.ts            # Alterar — filtros contextuais por aba
│   └── useLocalizacaoFeed.ts        # Já existe
├── services/
│   ├── roles.service.ts             # Já existe
│   ├── eventos.service.ts           # NOVO (ou reexport da feature criar-evento)
│   ├── locais.service.ts            # NOVO
│   └── feed.service.ts              # NOVO — contagens
├── constants.ts                     # Alterar — labels abas, placeholder
├── types.ts                         # Alterar — AbaFeed, ContagensFeed
└── feed.module.css                  # Alterar — abas, cards evento/local
```

Detalhe de evento (mínimo):

```
src/app/(app)/eventos/[id]/page.tsx   # Placeholder “Em breve” se 022 não tiver detalhe
```

### 5.3 Responsabilidades

| Peça | Tipo | Faz |
|------|------|-----|
| `page.tsx` | Server | Só monta `TelaFeed` |
| `TelaFeed` | Client | Liga localização, filtros, aba, contagens e lista ativa |
| `AbasFeed` | Client | UI das 3 abas + `(N)`; `role="tablist"` |
| `useAbaFeed` | Hook | `aba: "roles" \| "eventos" \| "locais"` |
| `useContagensFeed` | Hook | Chama `feed.service.contagens` quando ponto/filtros mudam |
| `useListaEventos` / `useListaLocais` | Hook | Loading, erro, itens da aba |
| `eventos.service` / `locais.service` | Service | GET filtrado via `api` — **sem** Firestore no client |
| `EventoCard` / `LocalCard` | UI | Um card cada |

**Não misturar** no mesmo arquivo: JSX da aba + três fetches + Haversine.

**Não** usar `getDocs` no client.

---

## 6. Contrato dos filtros (front)

```ts
export type AbaFeed = "roles" | "eventos" | "locais";

export type ContagensFeed = {
  roles: number;
  eventos: number;
  locais: number;
};

// Reusar RaioKm, FiltroQuando, FiltroRitmo, PontoFeed de types.ts atuais
```

### 6.1 O que cada aba envia

| Query | Rolês | Eventos | Locais |
|-------|-------|---------|--------|
| `lat` / `lng` | Sim | Sim | Sim |
| `raioKm` | Sim | Sim | Sim |
| `q` | Sim | Sim | Sim |
| `quando` / `data` | Sim | Sim | Não |
| `ritmo` | Sim | Não | Não |

### 6.2 Defaults

| Filtro | Inicial |
|--------|---------|
| Aba | `roles` |
| Localização | GPS (SPEC 003) |
| Raio | `50` (pill) |
| Quando | `proximos_roles` (rolês); para eventos: `proximos_roles` mapeado a abertura futura (~30 dias) **ou** omitir teto = só `>= agora` — **preferir** o mesmo chip set, interpretando sobre `dataHoraAbertura` |
| Ritmo | `todas` (só rolês) |
| Busca | `""` |

### 6.3 Busca (`q`)

| Entidade | Campos |
|----------|--------|
| Rolê | `titulo`, `descricao`, `localSaida.*`, `destinoFinal.*` (já existe) |
| Evento | `titulo`, `informacoes`, `local.endereco`, `local.nome` |
| Local | `nome`, `endereco` |

Case-insensitive. Debounce 300 ms. Placeholder: **Buscar rolês, eventos ou pontos…**

Ícone **tune**: scroll até `#filtros-feed` (chips contextuais da aba).

### 6.4 Pill de raio

Ciclo: `25` → `50` → `100` → `null` (label **TODOS** no mock). Mesmos valores de `RaioKm`. Um único controle — **remover** a fileira duplicada `FiltrosRaio` se o pill cobrir o mesmo contrato (evitar dois UIs para o mesmo estado).

---

## 7. Implementação front

### 7.1 Services

```ts
// feed/services/feed.service.ts
export const feedService = {
  contagens: (params: ContagensParams) =>
    api<ContagensFeed>(`/feed/contagens?${montarQuery(params)}`),
};

// feed/services/eventos.service.ts
export const eventosService = {
  listar: (params: ListarEventosParams) =>
    api<EventoFeedItem[]>(`/eventos?${montarQuery(params)}`),
};

// feed/services/locais.service.ts
export const locaisService = {
  listar: (params: ListarLocaisParams) =>
    api<LocalFeedItem[]>(`/locais?${montarQuery(params)}`),
};
```

`EventoFeedItem` = `Evento & { distanciaKm: number }`.  
`LocalFeedItem` = `Local & { distanciaKm: number }`.

### 7.2 Abas — acessibilidade

- Container: `role="tablist"` `aria-label="Tipo de conteúdo do feed"`.
- Cada botão: `role="tab"`, `aria-selected`, `aria-controls` do painel.
- Painel da lista: `role="tabpanel"`.
- Contador: `aria-label` ex. “4 rolês” (não só `(4)` visual).
- Troca por clique; setas ←/→ opcionais (bom ter).

### 7.3 Estado vazio (por aba)

| Aba | Título | Texto |
|-----|--------|-------|
| Rolês | Nenhum rolê por aqui | Não encontramos rolês com esses filtros… |
| Eventos | Nenhum evento por aqui | Não encontramos eventos com esses filtros. Aumente o raio ou mude a data. |
| Locais | Nenhum local por aqui | Não encontramos pontos oficiais nesse raio. Aumente o raio ou limpe a busca. |

Erro de API ≠ vazio; botão **Tentar de novo**.

### 7.4 Contadores

- Fonte da verdade: `GET /feed/contagens` (não `itens.length` de uma aba só).
- Enquanto carrega: manter último N ou mostrar `—` / skeleton curto no pill; **não** piscar `(0)` falso.
- `aria-live="polite"` no `tablist` ou nos contadores ao atualizar.

### 7.5 Tokens CSS

CSS Modules em `feed.module.css`. Sem hex solto no TSX.

| Token | Uso |
|-------|-----|
| `--primary-container` | Aba ativa, pill raio, CTAs de rolê |
| `--tertiary` / `--tertiary-container` | Acentos do card de local / badge 24h |
| `--secondary-container` | Badges de horário / ritmo moderado |
| `--surface-container-lowest` | Trilha das abas |
| `--surface-container` | Cards |
| `--gutter-md` / `--touch-min` | Espaçamento e toque |

---

## 8. Backend

Rotas **não** importam Firestore. Persistência só via repositórios. Não usar `onCall`.

### 8.1 Estender `GET /eventos`

Hoje (SPEC 022): futuros, sem geo.

Passar a aceitar:

```
GET /eventos?lat=&lng=&raioKm=&quando=&data=&q=
```

| Query | Obrigatório | Notas |
|-------|-------------|-------|
| `lat` / `lng` | Sim neste contrato de feed | 400 se ausentes quando usados pelo app; **alternativa:** se omitidos, manter comportamento antigo (lista futuros sem raio) para o catálogo admin — **preferir:** lat/lng **obrigatórios** só quando `raioKm` ou o client de feed chama; mais simples: **sempre exigir lat/lng no GET usado pelo feed** e deixar um `GET` sem geo só se 022 já documentou catálogo sem coords. Decisão: **feed sempre envia lat/lng**; se ausentes → 400 `{ erro: "lat e lng são obrigatórios" }` (quebra o GET “solto” da 022). Mitigação: catálogo `/locais` da 023 e qualquer tela admin que listava sem geo passam a enviar ponto do GPS ou “sem limite” com lat/lng do usuário. |

Filtro:

1. Repositório: `dataHoraAbertura >= dataInicio` (+ `dataFim` se `quando`).
2. Na rota: Haversine(`lat`,`lng` → `local`); descartar se > `raioKm`.
3. `q` case-insensitive nos textos.
4. Ordenar por `dataHoraAbertura` asc.
5. Enriquecer `distanciaKm` (inteiro).

Reusar `haversineKm` de `functions/src/lib/geo.ts`.

Limite defensivo: máx. **200** docs processados.

### 8.2 Estender `GET /locais`

```
GET /locais?lat=&lng=&raioKm=&q=
```

1. Repositório `listar()` (ou `listar` sem geo).
2. Na rota: Haversine → `lat`/`lng` do local; filtro `raioKm`; `q` em nome/endereço.
3. Ordenar por `distanciaKm` asc (melhor UX no feed) **ou** por nome se sem raio — **preferir distância** quando há ponto.
4. `LocalFeedItem` com `distanciaKm`.

### 8.3 `GET /feed/contagens`

```
GET /feed/contagens?lat=&lng=&raioKm=&quando=&data=&q=&ritmo=
Headers: Authorization: Bearer <idToken>

200 → { "roles": number, "eventos": number, "locais": number }
400 → validação (mesma família do GET /roles)
401 → token
```

Implementação sugerida: **uma rota fina** que:

1. Valida query (lat/lng obrigatórios; mesmos enums de raio/quando/ritmo).
2. Resolve intervalo `quando` (America/Sao_Paulo).
3. Chama os três fluxos de filtragem **sem** montar cards ricos (sem batch de criadores nos rolês — só `id` + critérios, ou reusar helpers internos `contarRoles` / `filtrarEventos` / `filtrarLocais`).
4. Devolve só os três números.

Não persistir nada. Não criar coleção.

Registrar `"/feed/contagens"` no JSON de `GET /` da `api`.

Router dedicado:

```
functions/src/routes/feed.ts
app.use("/feed", feedRouter)
```

`feedRouter.use(autenticar)`.

### 8.4 Tipos

```ts
// functions/src/types/feed.ts
export type ContagensFeed = {
  roles: number;
  eventos: number;
  locais: number;
};

// Em evento.ts / local.ts (ou feed.ts)
export type EventoFeedItem = Evento & { distanciaKm: number };
export type LocalFeedItem = Local & { distanciaKm: number };
```

Front: espelhar em `src/types/evento.ts`, `src/types/local.ts`, `src/types/feed.ts`.

### 8.5 Validação (resumo)

Mesmas regras de `GET /roles` para `lat`/`lng`/`raioKm`/`quando`/`data`/`ritmo`/`q` onde aplicável.

| Endpoint | `ritmo` | `quando` |
|----------|---------|----------|
| `/roles` | Sim | Sim |
| `/eventos` | Ignorar se vier | Sim |
| `/locais` | Ignorar | Ignorar |
| `/feed/contagens` | Usar só na contagem de roles | Usar em roles + eventos |

---

## 9. Wireframe

```
┌─────────────────────────────────┐
│ [logo] FEED                (👤) │  header sticky
├─────────────────────────────────┤
│ [🔍 Buscar rolês, eventos…  ⚙] [📡 50 KM]
├─────────────────────────────────┤
│ ┌─────────┬─────────┬─────────┐ │
│ │🏍️ ROLÊS │🎫 EVENTOS│📍 LOCAIS│ │  tablist
│ │   (4)   │   (3)   │  (12)   │ │
│ └─────────┴─────────┴─────────┘ │
├─────────────────────────────────┤
│ (se aba = roles)                │
│ QUANDO / RITMO (chips)          │
│ ┌─ RoleCard ─────────────────┐  │
│ └────────────────────────────┘  │
│                                 │
│ (se aba = eventos)              │
│ QUANDO (chips)                  │
│ ┌─ EventoCard ───────────────┐  │
│ └────────────────────────────┘  │
│                                 │
│ (se aba = locais)               │
│ ┌─ LocalCard ────────────────┐  │
│ └────────────────────────────┘  │
│                                 │
│  🏍️ Você está atualizado…      │
└─────────────────────────────────┘
│  Feed   Meus   ( + )  Aprov  👤 │  dock
└─────────────────────────────────┘
```

---

## 10. Fora do escopo

- Presence / radar / pilotos online.
- Modos de visualização / status “Conectado”.
- Feed unificado misturando entidades.
- Interesse / RSVP de evento; confirmados no card de rolê (além do que já existir).
- CRUD admin (022 / 023).
- Detalhe rico de evento (além de placeholder + GET por id).
- Mapa / geohash.
- Push por raio.
- Alterar o dock (SPEC 001 / 022).

---

## 11. Critérios de aceite

### Front

- [ ] `/` exibe abas **Rolês**, **Eventos**, **Locais** com contadores `(N)` alinhados ao mock.
- [ ] Aba ativa mostra **somente** cards daquela entidade.
- [ ] Contadores vêm de `GET /feed/contagens` e batem com os filtros atuais (ponto + raio + busca + quando/ritmo quando couber).
- [ ] Default aba = Rolês; troca de aba não exige novo GPS.
- [ ] Busca com placeholder unificado; debounce 300 ms; tune scrolla aos filtros.
- [ ] Pill de raio cicla 25 / 50 / 100 / sem limite e alimenta as três listagens.
- [ ] Filtros de ritmo só na aba Rolês; quando em Rolês e Eventos; Locais sem data/ritmo.
- [ ] Sem ponto: não lista; contadores 0 ou não disparam GET.
- [ ] Cards de evento e local seguem o mock (versão enxuta da secção 3.3).
- [ ] Estados vazios e erro distintos por contexto.
- [ ] Sem radar, sem “modo de visualização”, sem “conectado”, sem interessados fictícios.
- [ ] `page.tsx` Server; Client só com interatividade.
- [ ] Componentes ~80 linhas; abas/contagens/listas em hooks; GET em services.
- [ ] Sem Firestore no client.
- [ ] Toque ≥ 48px; usável a partir de 360px; conteúdo acima do dock.

### Back

- [ ] `GET /eventos` aceita `lat`/`lng`/`raioKm`/`quando`/`data`/`q` e devolve `EventoFeedItem[]` com `distanciaKm`.
- [ ] `GET /locais` aceita `lat`/`lng`/`raioKm`/`q` e devolve `LocalFeedItem[]` com `distanciaKm`.
- [ ] `GET /feed/contagens` autenticado devolve `{ roles, eventos, locais }`.
- [ ] 400 / 401 coerentes com `GET /roles`.
- [ ] Haversine só em helper `geo.ts`; rotas sem `firestore.collection`.
- [ ] Persistência continua só nos repositórios de cada entidade.
- [ ] Sem coleção nova.

---

## 12. Arquivos impactados

| Arquivo | Ação |
|---------|------|
| `docs/specs/024-filtragem-feed.md` | **NOVO** (este) |
| `src/app/(app)/feed/components/TelaFeed.tsx` | **Alterar** |
| `src/app/(app)/feed/components/AbasFeed.tsx` | **NOVO** |
| `src/app/(app)/feed/components/BarraBuscaRaio.tsx` | **NOVO** |
| `src/app/(app)/feed/components/ListaEventos.tsx` | **NOVO** |
| `src/app/(app)/feed/components/ListaLocais.tsx` | **NOVO** |
| `src/app/(app)/feed/components/EventoCard.tsx` | **NOVO** |
| `src/app/(app)/feed/components/LocalCard.tsx` | **NOVO** |
| `src/app/(app)/feed/components/CampoBusca.tsx` | **Alterar** |
| `src/app/(app)/feed/components/EstadoVazio.tsx` | **Alterar** |
| `src/app/(app)/feed/components/FiltrosRaio.tsx` | **Remover ou desativar** se o pill substituir |
| `src/app/(app)/feed/hooks/useAbaFeed.ts` | **NOVO** |
| `src/app/(app)/feed/hooks/useContagensFeed.ts` | **NOVO** |
| `src/app/(app)/feed/hooks/useListaEventos.ts` | **NOVO** |
| `src/app/(app)/feed/hooks/useListaLocais.ts` | **NOVO** |
| `src/app/(app)/feed/hooks/useFiltrosFeed.ts` | **Alterar** |
| `src/app/(app)/feed/services/feed.service.ts` | **NOVO** |
| `src/app/(app)/feed/services/eventos.service.ts` | **NOVO** |
| `src/app/(app)/feed/services/locais.service.ts` | **NOVO** |
| `src/app/(app)/feed/types.ts` / `constants.ts` / `feed.module.css` | **Alterar** |
| `src/types/feed.ts` | **NOVO** |
| `src/types/evento.ts` / `src/types/local.ts` | **Alterar** — `*FeedItem` (se já existirem da 022/023) |
| `src/app/(app)/eventos/[id]/page.tsx` | **NOVO** — placeholder se necessário |
| `functions/src/routes/feed.ts` | **NOVO** |
| `functions/src/routes/eventos.ts` | **Alterar** — query geo + `q` |
| `functions/src/routes/locais.ts` | **Alterar** — query geo + `q` |
| `functions/src/types/feed.ts` | **NOVO** |
| `functions/src/types/evento.ts` / `local.ts` | **Alterar** — FeedItem |
| `functions/src/index.ts` | **Alterar** — `app.use("/feed", …)` |
| `.cursor/rules/project-context.mdc` | **Alterar** — feed com 3 abas |

Não alterar `MenuInferior` nesta spec (exceto se o label “Rolês” do dock já tiver virado “Feed” em outra entrega — fora).

---

## 13. Checklist da skill Next.js

- [ ] `page.tsx` sem `"use client"` (só orquestra).
- [ ] `"use client"` só em `TelaFeed` e filhos interativos.
- [ ] Estado de aba / contagens / listas em hooks separados.
- [ ] GETs isolados em services (sem Firestore no componente).
- [ ] Um componente = uma coisa (aba, card evento, card local, vazio).
- [ ] Sem abstração genérica “FeedCard universal” até haver 2+ shapes idênticos.
- [ ] CSS Modules + tokens de `globals.css`.
- [ ] Sem `console.log` de debug.

---

## 14. Ordem sugerida de implementação

1. Confirmar 022/023 no branch (tipos + GET básico de eventos/locais). Se faltarem, aterrissar só a leitura.
2. Backend: geo + `q` em `GET /eventos` e `GET /locais`; tipos `*FeedItem`.
3. Backend: `GET /feed/contagens`.
4. Front: `AbasFeed` + `useAbaFeed` + wire nos contadores (mesmo com listas vazias).
5. Front: `BarraBuscaRaio`; ligar raio único ao estado existente.
6. Front: `ListaEventos` / `EventoCard` + hook/service.
7. Front: `ListaLocais` / `LocalCard` + hook/service.
8. Front: filtros contextuais + estados vazios + acessibilidade das abas.
9. Ajuste fino visual vs `screen.png` (sem radar/modo).
10. Atualizar `project-context.mdc`.

---

## 15. Relação com o código atual

| Hoje | Nesta spec |
|------|------------|
| Feed `/` só lista rolês | Três abas; rolês = default |
| Busca “destino ou serra” | Placeholder unificado do mock |
| Chips de raio na seção de filtros | Pill ciclável (mock); chips de raio removidos ou unificados |
| Sem UI de eventos/locais no feed | Cards + listas por aba |
| `GET /eventos` / `GET /locais` sem geo (022/023) | Filtram por raio + `q` (+ data em eventos) |
| Contador “N encontrados” só na lista de rolês | Contadores nas três abas via `/feed/contagens` |
| Spec 022 dizia “feed de eventos = futura” | Esta é essa spec (unificada com locais) |

---

## 16. Relação com SPECs vizinhas

| Spec | Relação |
|------|---------|
| 003 | Base do feed de rolês; esta spec **estende**, não substitui o card de rolê |
| 022 | Fornece `eventos`; esta spec lista no feed e exige geo no GET |
| 023 | Fornece `locais`; catálogo `/locais` pode permanecer; feed ganha a aba Locais (entrada principal do comum) |
| 019 | `urlAbrirMaps` no CTA do local |
| 001 | Dock inalterado; item Feed/Rolês continua apontando para `/` |
