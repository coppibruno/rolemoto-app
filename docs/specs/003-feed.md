# SPEC 003 — Feed de Rolês (Listagem)

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-09  
> **Referência visual:** `designs/feed/` (`DESIGN.md`, `code.html`, `screen.png`)  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade  
> **Backend:** Cloud Function `api` (Express) — `GET /roles` com filtros  
> **Depende de:** SPEC 001 (shell autenticado + rota `/`) e perfil existente em `users`

---

## 1. Objetivo

Substituir o placeholder de `/` pela **listagem de rolês na região**, alinhada ao mock do feed.

O piloto autenticado vê rolês filtrados por **localização** (GPS atual ou ponto escolhido), **raio de saída**, **data de saída** e **ritmo de pilotagem**. Cada card tem **Participar do Rolê**, que só navega — a tela de participação é **outra spec**.

Esta spec é **full stack**:

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | UI do mock, geolocalização, filtros, listagem, estado vazio, link de participar |
| Back (Functions) | Token válido, coleção `roles` com o schema desta spec, `GET /roles` filtrado, persistência só via repositório |

Não há criação de rolê nesta spec (`/criar-role` continua placeholder). O schema e o GET precisam existir para o feed ter dados.

---

## 2. Referência de Design

Replicar o visual de `designs/feed/` (`code.html` + `screen.png`). Não inventar outro layout. Tokens em `DESIGN.md` / `globals.css`.

### O que entra nesta spec (do mock)

- Header sticky: logo + **Roles Feed / Cockpit** + avatar do piloto (link para `/perfil`).
- Painel **Sua localização atual** (label do ponto + **Alterar**).
- Campo de busca: “Buscar destino, serra ou motogrupo…”.
- Filtros em chips: **Raio de Saída**, **Quando**, **Ritmo de Pilotagem**.
- Título **Rolês na Região** + contador `N encontrados`.
- Cards: capa, badge de ritmo, distância até a partida, título, horário, partida → destino, organizador, CTA Participar.
- Estado vazio quando o filtro não retorna rolês.

### O que o mock mostra e **não** entra

| Elemento do mock | Motivo |
|------------------|--------|
| Sino de notificações | Mesmo recorte das SPECs 001 e 002 |
| Mini avatares / “N pilotos confirmados” | Dependem de participação — spec futura |
| Toggle Confirmado no Rolê no próprio card | Participar é outra tela |
| Banner de dica de condução (seção vazia no HTML) | Sem conteúdo no mock |
| Menu inferior | Já na SPEC 001 |

### Comportamento visual (do mock)

- Conteúdo em coluna única, gutter 16px, **max-width 560px** (já no shell `(app)`).
- Header fixo, altura 64px + `env(safe-area-inset-top)`, fundo `surface` com blur.
- Painel de localização: `surface-container-high`, ponto laranja pulsante.
- Chips de raio ativos: fundo `#FF6B00`, glow `0 0 14px rgba(255, 107, 0, 0.45)`.
- Chips de ritmo: bolinha + label nas cores semânticas (abaixo).
- Card: `surface-container`, capa 176px (`h-44`), scrim inferior, badge de ritmo no canto superior esquerdo.
- CTA: altura `touch-target` (56px), `primary-container`, glow laranja, Barlow Condensed uppercase.

### Ritmo (mesmo domínio do perfil)

| Valor | Cor (DESIGN.md) | Uso no chip / badge |
|-------|-----------------|---------------------|
| `tranquila` | `#00E676` | Bolinha + texto |
| `moderada` | `#FFB300` (`secondary-container`) | Bolinha + texto |
| `agressiva` | `#FF334B` (no mock o badge usa `--error`) | Bolinha + texto |
| `todas` (só filtro) | `on-surface` | Chip sem bolinha |

Valores iguais a `Pilotagem` em `src/types/user.ts`. **Não** reutilizar `categoria: acelero \| moderado \| tranquilo` do stub antigo de `roles`.

---

## 3. Fluxo do Usuário

```
Grupo (app) — já autenticado e com perfil (GuardaApp)
  │
  ▼
Menu → Rolês  →  /
  │
  ▼
Tela pede geolocalização (ou usa ponto já escolhido)
  │
  ├── GPS ok / ponto customizado
  │     └── GET /roles?lat=&lng=&raioKm=&...
  │           ├── 200 com itens → lista + “N encontrados”
  │           └── 200 [] → EstadoVazio
  │
  ├── GPS negado / indisponível
  │     └── Painel pede Alterar; não chama API até haver lat/lng
  │
  └── Usuário muda filtro / busca / localização
        └── Novo GET (debounce na busca)

Card → [Participar do Rolê] → /roles/:id/participar
        (placeholder desta spec; UI real em spec futura)
```

- Filtros combinam com **AND**.
- Mudar chip dispara nova busca imediatamente (exceto texto: debounce ~300ms).
- “Alterar” abre seletor: GPS atual **ou** endereço pesquisado.

---

## 4. Arquitetura Next.js

Seguir a skill: página orquestradora, componentes ~80 linhas, lógica em hooks, API em service. `"use client"` só no que tem estado, geolocalização, chips ou `useAuth`.

A listagem **não** pode ser fetch em Server Component: a rule do projeto exige Bearer no client (`auth.currentUser`) e a origem do raio vem de `navigator.geolocation`.

### 4.1 Por que a page continua Server Component

`(app)/layout` já protege a rota. `/` só monta a tela. Interatividade fica nos filhos Client.

```tsx
// src/app/(app)/page.tsx — Server Component
import { TelaFeed } from "./feed/components/TelaFeed";

const RolesPage = () => {
  return (
    <main>
      <TelaFeed />
    </main>
  );
};

export default RolesPage;
```

### 4.2 Estrutura por feature

O feed **é** a home (`/`). Os arquivos ficam em `feed/` ao lado da `page.tsx`, no mesmo espírito de `perfil/`.

```
src/app/(app)/
├── page.tsx                              # Server — orquestrador
├── feed/
│   ├── components/
│   │   ├── TelaFeed.tsx                  # Client — composição
│   │   ├── CabecalhoFeed.tsx             # Logo + Roles Feed / Cockpit
│   │   ├── PainelLocalizacao.tsx         # Ponto atual + Alterar
│   │   ├── CampoBusca.tsx                # Busca + ícone tune
│   │   ├── FiltrosRaio.tsx
│   │   ├── FiltrosData.tsx
│   │   ├── FiltrosRitmo.tsx
│   │   ├── ListaRoles.tsx                # Título da seção + cards
│   │   ├── RoleCard.tsx                  # Orquestra um card
│   │   ├── CapaRole.tsx                  # Imagem, badges, título
│   │   ├── RotaRole.tsx                  # Partida / destino
│   │   ├── OrganizadorRole.tsx           # Foto + @apelido
│   │   ├── BotaoParticipar.tsx           # Link para spec futura
│   │   ├── EstadoVazio.tsx
│   │   ├── EstadoCarregando.tsx
│   │   └── SeletorLocalizacao.tsx        # Sheet Alterar
│   ├── hooks/
│   │   ├── useLocalizacaoFeed.ts         # GPS + ponto customizado
│   │   ├── useFiltrosFeed.ts             # Estado dos chips + busca
│   │   └── useListaRoles.ts              # Chama o service
│   ├── services/
│   │   └── roles.service.ts              # GET /roles (api)
│   ├── constants.ts                      # Raios, datas, ritmos
│   └── feed.module.css
└── roles/[id]/participar/page.tsx        # Placeholder Participar
```

### 4.3 Responsabilidades

| Peça | Tipo | Faz |
|------|------|-----|
| `page.tsx` | Server | Só monta `TelaFeed` |
| `TelaFeed` | Client | Liga localização, filtros e lista |
| `useLocalizacaoFeed` | Hook | Permissão GPS, label do ponto, ponto custom |
| `useFiltrosFeed` | Hook | Raio, quando, ritmo, texto, querystring da API |
| `useListaRoles` | Hook | Loading, erro, itens; dispara o GET |
| `roles.service` | Service | `listar(filtros)` via `api` — **sem** Firestore no client |
| `RoleCard` e filhos | UI | Um bloco visual cada |
| `BotaoParticipar` | UI | `Link` para `/roles/{id}/participar` |
| `EstadoVazio` | UI | Mensagem quando `itens.length === 0` |
| `SeletorLocalizacao` | Client | GPS atual ou busca de endereço |

**Não misturar** no mesmo arquivo: JSX do card + montagem da query + `fetch` + Haversine.

**Não** usar `listarRoles` / `getDocs` em `src/lib/firestore.ts` nesta tela. Listagem só pela function.

---

## 5. Contrato dos Filtros (front)

```ts
export type RaioKm = 25 | 50 | 100 | null; // null = sem limite

export type FiltroQuando =
  | "hoje"
  | "amanha"
  | "fim_de_semana"
  | { tipo: "data"; iso: string }; // YYYY-MM-DD (America/Sao_Paulo)

export type FiltroRitmo = Pilotagem | "todas";

export type PontoFeed = {
  lat: number;
  lng: number;
  label: string; // ex.: "Serra da Mantiqueira, SP"
  origem: "gps" | "custom";
};

export type FiltrosFeed = {
  ponto: PontoFeed | null;
  raioKm: RaioKm;
  quando: FiltroQuando | null; // null = qualquer data futura
  ritmo: FiltroRitmo;
  busca: string;
};
```

### 5.1 Defaults (alinhados ao mock)

| Filtro | Inicial |
|--------|---------|
| Localização | GPS atual (após permissão) |
| Raio | `50` |
| Quando | `fim_de_semana` |
| Ritmo | `todas` |
| Busca | `""` |

Chip de data pode ser **desmarcado** (`quando = null`) → qualquer rolê com `dataHoraSaida >= agora`.

### 5.2 Semântica de “Quando”

Timezone: **America/Sao_Paulo**.

| Chip | Intervalo |
|------|-----------|
| Hoje | 00:00:00 → 23:59:59.999 de hoje |
| Amanhã | 00:00:00 → 23:59:59.999 de amanhã |
| Neste Fim de Semana | Sábado 00:00 → domingo 23:59 da **semana corrente**; se hoje for segunda–sexta, o **próximo** sáb–dom |
| Selecionar data | Dia escolhido no `input type="date"` (nativo, mobile) |

Só rolês **futuros ou em andamento no dia** entram: mesmo em “hoje”, descartar `dataHoraSaida` já passada no fim do filtro (o backend aplica `dataHoraSaida >= agora` além do teto do chip).

### 5.3 Raio

Calculado do **ponto do filtro** até `localSaida` (Haversine), não até o destino.

| Chip | `raioKm` |
|------|----------|
| Até 25 km | `25` |
| Até 50 km | `50` |
| Até 100 km | `100` |
| Sem limite | omitido / `null` |

“Sem limite” ainda envia `lat`/`lng` para o card mostrar `distanciaKm`.

### 5.4 Busca

Texto opcional (`q`), case-insensitive, em `titulo`, `descricao`, `localSaida.endereco`, `destinoFinal.endereco`. O ícone **tune** não abre outro modal: faz scroll até os chips (`aria-controls` da seção de filtros). Os chips **são** o filtro avançado.

### 5.5 Query enviada à API

```
GET /roles?lat=-23.18&lng=-45.88&raioKm=50&quando=fim_de_semana&ritmo=todas&q=
```

| Query | Obrigatório | Notas |
|-------|-------------|-------|
| `lat` | Sim para listar | Número |
| `lng` | Sim para listar | Número |
| `raioKm` | Não | `25`, `50` ou `100`; ausente = sem limite |
| `quando` | Não | `hoje` \| `amanha` \| `fim_de_semana` \| `data` |
| `data` | Se `quando=data` | `YYYY-MM-DD` |
| `ritmo` | Não | `tranquila` \| `moderada` \| `agressiva` \| `todas` (ou omitir) |
| `q` | Não | Trim; ignorar se vazio |

---

## 6. Implementação Front

### 6.1 Service

```ts
// src/app/(app)/feed/services/roles.service.ts
import { api } from "@/lib/api";
import type { RoleFeedItem } from "@/types/role";

export type ListarRolesParams = {
  lat: number;
  lng: number;
  raioKm?: 25 | 50 | 100;
  quando?: "hoje" | "amanha" | "fim_de_semana" | "data";
  data?: string;
  ritmo?: "tranquila" | "moderada" | "agressiva";
  q?: string;
};

const montarQuery = (params: ListarRolesParams) => {
  const qs = new URLSearchParams();
  qs.set("lat", String(params.lat));
  qs.set("lng", String(params.lng));
  if (params.raioKm) qs.set("raioKm", String(params.raioKm));
  if (params.quando) qs.set("quando", params.quando);
  if (params.data) qs.set("data", params.data);
  if (params.ritmo) qs.set("ritmo", params.ritmo);
  if (params.q?.trim()) qs.set("q", params.q.trim());
  return qs.toString();
};

export const rolesService = {
  listar: (params: ListarRolesParams) =>
    api<RoleFeedItem[]>(`/roles?${montarQuery(params)}`),
};
```

Usar `api` (Bearer automático). Um único `carregando` em `useListaRoles`. Não duplicar loading com `useFunctions`.

### 6.2 Localização

1. Ao montar: `navigator.geolocation.getCurrentPosition`.
2. Reverse geocode **leve** para o label (Nominatim/OSM, sem SDK de mapa nesta spec). Fallback de label: `"Sua localização"` se o reverse falhar.
3. **Alterar** → sheet:
   - “Usar minha localização” (repete o GPS).
   - Campo de endereço com sugestões (mesmo Nominatim). Escolher um resultado grava `origem: "custom"`.
4. Sem `lat`/`lng`: não chama `GET /roles`. Painel mostra “Ative a localização ou toque em Alterar”.

Não persistir o ponto no Firestore. Pode ficar só em memória da sessão (state). `sessionStorage` é opcional se ajudar a não pedir GPS de novo ao voltar do perfil.

### 6.3 Card

| Zona | Conteúdo |
|------|----------|
| Capa | `fotoCapaUrl`, `object-fit: cover` |
| Badge esquerdo | Ritmo (cor semântica + pulse no agressiva, como o mock) |
| Badge direito | `{distanciaKm} KM` (inteiro) + ícone `route` |
| Sobre a capa | `titulo` (headline-md uppercase) + horário formatado |
| Bloco rota | Partida: `localSaida.endereco` + hora; Destino: `destinoFinal.endereco` |
| Organizador | `criador.fotoUrl` + `@apelido` |
| CTA | Link **Participar do Rolê** |

Horário no card (pt-BR): “Hoje, 22:30”, “Amanhã, 08:30”, “Sábado, 07:00” — derivar de `dataHoraSaida`.

`descricao` vem na API; no card, **duas linhas** com ellipsis (`-webkit-line-clamp: 2`) abaixo da rota. Se vazia, omitir o bloco.

**Não** mostrar pilha de avatares nem “N pilotos confirmados”.

### 6.4 Estado vazio

Quando a API responde `[]` (e não está carregando / sem erro):

- Ícone `explore_off` (ou `two_wheeler`).
- Título: **Nenhum rolê por aqui**.
- Texto: **Não encontramos rolês com esses filtros. Aumente o raio, mude a data ou o ritmo.**

Não usar lista fictícia do mock. Não esconder os filtros.

Erro de rede/API: mensagem geral acima da lista (“Não foi possível carregar os rolês”), com ação **Tentar de novo**. Distinto do vazio.

### 6.5 Participar (só navegação)

```tsx
<Link href={`/roles/${id}/participar`}>Participar do Rolê</Link>
```

A página destino é placeholder (título + “Em breve”). **Não** chama POST de solicitação. **Não** troca o botão para “Confirmado no Rolê!” (isso é o script do mock, não o produto desta spec).

### 6.6 Tokens CSS

Reusar variáveis; CSS Modules em `feed.module.css`. Sem hex solto no TSX, **exceto** as cores de ritmo — adicionar tokens em `globals.css`:

| Token | Uso |
|-------|-----|
| `--surface` / `--surface-container` / `-high` / `-low` / `-lowest` | Página, painel, card, rota |
| `--primary-container` | Chip raio ativo, CTA, ponto GPS |
| `--on-surface` / `--on-surface-variant` | Texto / labels |
| `--secondary-container` | Ritmo moderada |
| `--error` | Ritmo agressiva (como o mock) |
| `--ritmo-tranquila` (`#00e676`) | **Novo** — chip/badge tranquila |
| `--gutter-md` / `--touch-min` / `--touch-target` | Espaçamento e toque |

Tipografia: Barlow Condensed em títulos/CTA/badges; Plus Jakarta Sans no body. Ícones: Material Symbols Outlined.

### 6.7 Acessibilidade

- Header: logo com `alt`; avatar com `alt` do nome; link “Perfil”.
- Alterar: `aria-label="Alterar localização"`.
- Busca: `label` visível ou `aria-label`; tune com `aria-label="Filtros"` + `aria-controls`.
- Chips: `role="radiogroup"` por linha (raio, quando, ritmo) + `aria-checked` no ativo.
- Lista: `aria-live="polite"` no contador “N encontrados”.
- Vazio: `role="status"`.
- CTA: texto visível “Participar do Rolê” (não só ícone).
- Área de toque ≥ 48px; CTA 56px.
- Sheet de localização: foco preso, `Esc` fecha, `aria-modal`.

### 6.8 Header

Sem sino de notificações (omitir o botão). Avatar usa `useAuth().usuario.fotoUrl` e navega para `/perfil`. Título **Roles Feed** / **Cockpit** como o mock.

---

## 7. Backend — Coleção `roles` e `GET /roles`

O router `GET /roles` **já existe**, mas lista tudo sem filtro e no schema antigo (`categoria`, `categoriaMotos`, `participantes`). Esta spec **define o documento real** e **fecha o contrato do GET**.

Não criar segunda coleção (`roles_feed`). Em Firestore “tabela” = coleção: usar **`roles`**, que hoje é só stub. Não usar `onCall`. Rotas **sem** `firestore.collection` direto.

### 7.1 Documento Firestore (`roles/{id}`)

```
{
  titulo: string,
  descricao: string,
  fotoCapaUrl: string,
  ritmo: "tranquila" | "moderada" | "agressiva",
  dataHoraSaida: timestamp,
  localSaida: { lat: number, lng: number, endereco: string },
  destinoFinal: { lat: number, lng: number, endereco: string },
  criadorId: string,           // uid do token na criação (spec de criar)
  createdAt: timestamp,
  updatedAt: timestamp
}
```

| Campo | Obrigatório | Notas |
|-------|-------------|-------|
| `titulo` | Sim | Nome do rolê (capa do card) |
| `descricao` | Sim | Texto livre; card mostra resumo |
| `fotoCapaUrl` | Sim | URL pública (Storage na spec de criar) |
| `ritmo` | Sim | Mesmo enum de `Pilotagem` |
| `dataHoraSaida` | Sim | Partida (data + hora) |
| `localSaida` | Sim | Ponto do **raio** e da linha Partida |
| `destinoFinal` | Sim | Linha Destino |
| `criadorId` | Sim | Quem criou |
| `createdAt` | Sim | Server timestamp na criação |
| `updatedAt` | Sim | Server timestamp na criação e em updates |

**Fora deste documento (nesta spec):** `participantes`, `categoria`, `categoriaMotos`. Participação vive na spec do botão Participar (`solicitacoes`).

Não há tela de criar aqui. O `POST /roles` existente deve ser **ajustado** para o novo tipo (para o código compilar e para um seed/manual/criar-role futuro gravar o schema certo). A UI de criar **não** entra.

### 7.2 Tipo de domínio (Functions)

```ts
// functions/src/types/role.ts
export type RitmoRole = "tranquila" | "moderada" | "agressiva";

export interface Localizacao {
  lat: number;
  lng: number;
  endereco: string;
}

export interface Role {
  id: string;
  titulo: string;
  descricao: string;
  fotoCapaUrl: string;
  ritmo: RitmoRole;
  dataHoraSaida: string; // ISO
  localSaida: Localizacao;
  destinoFinal: Localizacao;
  criadorId: string;
  createdAt: string;
  updatedAt: string;
}

export type RoleCriadorResumo = {
  uid: string;
  apelido: string;
  fotoUrl: string;
};

/** Item do feed — Role + distância + organizador. */
export type RoleFeedItem = Role & {
  distanciaKm: number;
  criador: RoleCriadorResumo;
};
```

Front (`src/types/role.ts`): o mesmo shape em ISO (não `Timestamp` do SDK). O feed consome `RoleFeedItem`.

### 7.3 Auth

1. `rolesRouter.use(autenticar)` — já exige `Authorization: Bearer <idToken>`.
2. Token inválido → **401**.
3. Sem Bearer → **401**.
4. Qualquer piloto autenticado **lista**. Não filtrar por `criadorId` no feed.

O Admin SDK ignora Security Rules: a function autoriza.

### 7.4 Repositório — `listar` com critérios

Estender a interface; **não** filtrar raio no Firestore (desigualdade só em um campo + geo ruim sem geohash).

```ts
export type CriteriosListagemRoles = {
  dataInicioIso: string;
  dataFimIso?: string;
  ritmo?: RitmoRole;
};

listar(criterios: CriteriosListagemRoles): Promise<Role[]>;
```

Query Firestore sugerida:

- Sempre `where("dataHoraSaida", ">=", dataInicio)`.
- Se `dataFimIso`: `where("dataHoraSaida", "<=", dataFim)`.
- Se `ritmo`: `where("ritmo", "==", ritmo)`.
- `orderBy("dataHoraSaida", "asc")`.

Índice composto se ritmo + intervalo de data forem juntos (`ritmo` ASC, `dataHoraSaida` ASC). Criar `firestore.indexes.json` e referenciar no `firebase.json`.

Raio e `q`: **na rota**, depois do `listar`:

1. Haversine(`lat`,`lng` → `localSaida`). Descartar se `raioKm` definido e distância > raio.
2. Se `q`, match case-insensitive nos quatro textos.
3. Ordenar por `dataHoraSaida` crescente (já vem assim; reordenar se o filtro em memória misturar).
4. Enriquecer `criador` via `usuarioRepository.buscarPorId` (batch/cache por uid na request). Apelido/foto ausentes → `apelido: "piloto"`, `fotoUrl: ""`.
5. Preencher `distanciaKm` arredondado (inteiro, km).

Helper `haversineKm` em `functions/src/lib/geo.ts` — **não** na rota misturado com HTTP.

Limite defensivo: processar no máximo **200** docs da query; se passar, ainda aplicar filtros e devolver o que couber. Sem paginação nesta spec (volume inicial baixo).

### 7.5 Validação da query (rota)

| Caso | Status | Corpo |
|------|--------|-------|
| `lat` / `lng` ausentes ou não numéricos | 400 | `{ erro: "lat e lng são obrigatórios" }` |
| `lat` fora de \[-90, 90\] ou `lng` fora de \[-180, 180\] | 400 | `{ erro: "coordenadas inválidas" }` |
| `raioKm` presente e ≠ 25, 50, 100 | 400 | `{ erro: "raioKm inválido" }` |
| `quando` inválido | 400 | `{ erro: "quando inválido" }` |
| `quando=data` sem `data` `YYYY-MM-DD` | 400 | `{ erro: "data é obrigatória" }` |
| `ritmo` inválido (e ≠ todas) | 400 | `{ erro: "ritmo inválido" }` |
| Sucesso | 200 | `RoleFeedItem[]` (array; `[]` se nada) |

`quando=todas` não existe — omitir `quando` = só `dataHoraSaida >= agora`.

Resolver `quando` → `dataInicioIso` / `dataFimIso` **na rota** (timezone São Paulo), não no repositório.

### 7.6 Handler (contrato)

```
GET /roles?lat=&lng=&raioKm=&quando=&data=&ritmo=&q=
Headers: Authorization: Bearer <idToken>

200 → RoleFeedItem[]
400 → validação
401 → token
500 → erro interno (responderErro)
```

Exemplo de item:

```json
{
  "id": "abc",
  "titulo": "Subida da Serra de Campos",
  "descricao": "Subida clássica com café no portal.",
  "fotoCapaUrl": "https://...",
  "ritmo": "moderada",
  "dataHoraSaida": "2026-09-12T10:00:00.000Z",
  "localSaida": {
    "lat": -23.45,
    "lng": -46.72,
    "endereco": "Posto BR Rodoanel"
  },
  "destinoFinal": {
    "lat": -22.73,
    "lng": -45.58,
    "endereco": "Portal de Campos do Jordão"
  },
  "criadorId": "uid123",
  "createdAt": "2026-09-01T12:00:00.000Z",
  "updatedAt": "2026-09-01T12:00:00.000Z",
  "distanciaKm": 45,
  "criador": {
    "uid": "uid123",
    "apelido": "rodrigo_r1",
    "fotoUrl": "https://..."
  }
}
```

### 7.7 POST / PUT / DELETE (ajuste mínimo)

O feed **não** chama esses métodos. Como o tipo `Role` muda, atualizar handlers para não quebrarem o build:

- `POST`: passar a exigir `titulo`, `descricao`, `fotoCapaUrl`, `ritmo`, `dataHoraSaida`, `localSaida`, `destinoFinal`. `criadorId` e timestamps só no servidor (`updatedAt` = `createdAt` na criação).
- `PUT`: `updatedAt` via `FieldValue.serverTimestamp()`; dono ou admin (já existe).
- `DELETE`: inalterado na regra de dono.

UI de criar/editar/apagar: **fora**. Sem seed obrigatório no código; coleção vazia → estado vazio (aceitável até a spec de criar).

### 7.8 O que não muda

- Function HTTP única `api`.
- Factory em `repositories/index.ts`.
- `GET /roles/:id` pode devolver o `Role` novo (sem `distanciaKm`); útil ao abrir participar. Enriquecer criador é opcional nesse GET nesta spec.

---

## 8. Wireframe

```
┌─────────────────────────────────┐
│ [logo] ROLES FEED          (👤) │  header sticky
│        COCKPIT                  │
├─────────────────────────────────┤
│ ● Sua localização atual         │
│   Serra da Mantiqueira, SP  [Alterar]
│ [🔍 Buscar destino, serra…  ⚙]  │
├─────────────────────────────────┤
│ RAIO DE SAÍDA                   │
│ [25km] [50km*] [100km] [Sem lim]│
│ QUANDO                          │
│ [Hoje] [Amanhã] [Fim de sem.*]  │
│ [📅 Selecionar data]            │
│ RITMO DE PILOTAGEM              │
│ [Todas*] [●Tranquila] [●Mod.]   │
│ [●Agressiva]                    │
├─────────────────────────────────┤
│ ROLÊS NA REGIÃO     3 encontrados
│ ┌─────────────────────────────┐ │
│ │ [capa]  Moderada     45 KM  │ │
│ │ TÍTULO                      │ │
│ │ Sábado, 07:00               │ │
│ │ Partida → Destino           │ │
│ │ @apelido                    │ │
│ │ [ 🏍️ PARTICIPAR DO ROLÊ ]   │ │
│ └─────────────────────────────┘ │
│                                 │
│ (se zero)                       │
│   Nenhum rolê por aqui          │
│   Não encontramos rolês…        │
└─────────────────────────────────┘
│  🏍️        ( + )        👤     │  menu (SPEC 001)
└─────────────────────────────────┘
```

\* = default do mock.

---

## 9. Fora do Escopo

- Tela e POST de **criar rolê** (só o ajuste de tipo no backend).
- Tela de **participar**, solicitações, aceite/recusa, lista de confirmados.
- Mapa / pins / SDK Google Maps.
- Filtro por categoria de moto (cc).
- Paginação infinita / pull-to-refresh sofisticado (scroll nativo basta).
- Notificações no header.
- Cache SSR / `unstable_cache` (lista autenticada + geo).
- Menu inferior, guarda de rota e tokens globais (SPEC 001).
- Geohash / GeoFirestore (volume baixo; Haversine na function).

---

## 10. Critérios de Aceite

### Front

- [ ] `/` deixa de ser placeholder e segue o mock `designs/feed/` (header, painel, busca, chips, cards).
- [ ] Localização inicia no GPS; **Alterar** permite GPS de novo ou endereço customizado.
- [ ] Filtros: raio (25 / 50 / 100 / sem limite), quando (hoje / amanhã / fim de semana / data), ritmo (todas + 3 valores do perfil), busca textual.
- [ ] Sem ponto (GPS negado e sem custom): não lista; copy pedindo Alterar.
- [ ] Lista só via `GET /roles` (Bearer); sem `getDocs` no client.
- [ ] Card mostra capa, ritmo, km até a partida, título, horário, partida, destino, organizador, descrição truncada.
- [ ] **Participar do Rolê** navega para `/roles/:id/participar` (placeholder); não confirma participação.
- [ ] Zero resultados: mensagem **Nenhum rolê por aqui** + texto para afrouxar filtros.
- [ ] Erro de API ≠ estado vazio; oferece tentar de novo.
- [ ] Contador “N encontrados” bate com a lista.
- [ ] Menu Inferior permanece; item Rolês ativo.
- [ ] Sem sino, sem avatares fictícios de confirmados.
- [ ] `page.tsx` Server; Client só onde há interatividade.
- [ ] Componentes < ~80 linhas; filtros/GPS/lista em hooks; GET no service.
- [ ] Toque ≥ 48px; usável a partir de 360px; conteúdo acima do dock.

### Back

- [ ] Coleção `roles` no schema desta spec (`titulo`, `localSaida`, `dataHoraSaida`, `destinoFinal`, `ritmo`, `fotoCapaUrl`, `descricao`, `criadorId`, `createdAt`, `updatedAt`).
- [ ] `GET /roles` exige Bearer válido.
- [ ] Filtra por intervalo de data, ritmo, raio (Haversine) e `q`.
- [ ] Sem match → `200 []` (não 404).
- [ ] 400 para query inválida; 401 sem token.
- [ ] Cada item traz `distanciaKm` e `criador` `{ uid, apelido, fotoUrl }`.
- [ ] Persistência só em `FirestoreRoleRepository`.
- [ ] Sem `categoria` / `categoriaMotos` / `participantes` no documento novo.

---

## 11. Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| `src/app/(app)/page.tsx` | **Alterar** — orquestrador Server → `TelaFeed` |
| `src/app/(app)/feed/**` | **NOVO** — UI, hooks, service, CSS |
| `src/app/(app)/roles/[id]/participar/page.tsx` | **NOVO** — placeholder |
| `src/types/role.ts` | **Alterar** — schema novo + `RoleFeedItem` |
| `src/lib/firestore.ts` | Não usar no feed; helpers antigos de role podem ficar até a spec de criar |
| `functions/src/types/role.ts` | **Alterar** — schema + `RoleFeedItem` |
| `functions/src/routes/roles.ts` | **Alterar** — query, validação, Haversine, enrich |
| `functions/src/repositories/interfaces/role.repository.ts` | **Alterar** — `listar(criterios)` |
| `functions/src/repositories/firestore/firestore-role.repository.ts` | **Alterar** — campos e query |
| `functions/src/lib/geo.ts` | **NOVO** — Haversine |
| `firestore.indexes.json` | **NOVO** — ritmo + dataHoraSaida |
| `firebase.json` | **Alterar** — apontar indexes se ainda não aponta |
| `src/app/globals.css` | **Alterar** — token `--ritmo-tranquila` |

Não alterar `MenuInferior` nem `GuardaApp`.

---

## 12. Checklist da skill Next.js

- [ ] `page.tsx` sem `"use client"` (só orquestra).
- [ ] `"use client"` só em `TelaFeed` e filhos interativos.
- [ ] Estado de filtro / GPS / fetch em hooks separados.
- [ ] GET isolado em `roles.service.ts` (sem Firestore no componente).
- [ ] Um componente = uma coisa (chip, card, capa, vazio, sheet).
- [ ] Sem abstração genérica “pra futuro” (mapa, participação, paginação).
- [ ] CSS Modules + tokens de `globals.css`.
- [ ] Sem `console.log` de debug.

---

## 13. Relação com o código atual

| Hoje | Nesta spec |
|------|------------|
| `(app)/page.tsx` placeholder | Feed completo |
| `GET /roles` sem query, schema antigo | GET filtrado, schema de produto |
| `categoria` acelero/moderado/tranquilo | `ritmo` = `Pilotagem` do perfil |
| `participantes[]` no documento | Removido; volta na spec de participar |
| `listarRoles()` no client Firestore | Proibido no feed |
| Sem `updatedAt` / `titulo` / `descricao` | Campos obrigatórios do documento |

Documentos antigos (se existirem no emulator) **não** são migrados nesta spec. Recriar no schema novo ou ignorar campos faltantes no mapper com defaults vazios — preferir **não** mascarar: mapper exige os campos novos; docs velhos simplesmente não aparecem corretos até serem apagados.
