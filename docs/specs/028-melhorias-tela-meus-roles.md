# SPEC 028 — Melhorias na Tela Meus Rolês (Garagem 2.0)

> **Status:** Implementada  
> **Autor:** Assistente IA  
> **Data:** 2026-09-18  
> **Referência visual:** `designs/meus-roles2.0/` (`DESIGN.md`, `code.html`, `screen.png`)  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade (skill `nextjs-patterns`)  
> **Backend:** Cloud Function `api` (Express) — evoluir `GET /meus-roles` + novos endpoints de eventos/locais da garagem + favoritos de local  
> **Coleções Firestore:** `usersrole` / `roles` (SPEC 017), `usersevento` / `eventos` (SPEC 026), `userslocalfavorito` (**nova**), `userslocalfeedback` / `userseventofeedback` (SPEC 027)  
> **Depende de:** SPEC 001 (shell + dock), SPEC 017 (Meus Rolês v1), SPEC 022/023 (eventos/locais), SPEC 024 (feed), SPEC 026 (inscrição), SPEC 027 (feedback locais/eventos)  
> **Estende:** SPEC 017 (UI + escopo da garagem); **não** substitui SPEC 027 (form de avaliação continua nas rotas `/avaliar`)

---

## 1. Objetivo

Evoluir **Meus Rolês** (`/meus-roles`) de um painel só de **rolês/comboios** para a **garagem do piloto**: um hub com três eixos — **Rolês**, **Eventos** (em que participa) e **Locais** (favoritos) — alinhado ao mock `meus-roles2.0`, com atalhos claros para **avaliar** (SPEC 027) e com **favoritar local** a partir do feed.

O piloto passa a:

1. Ver **eventos inscritos** (`usersevento`) na aba Eventos da garagem.
2. Ver **locais favoritos** na aba Locais (e marcar/desmarcar favorito no **feed** aba Locais).
3. Entrar no fluxo de **feedback** a partir da garagem **ou** do feed (reuso das rotas `/eventos/:id/avaliar` e `/locais/:id/avaliar`).
4. Entender que o relato é **público e nominal** (visível para outros autenticados via listagem da SPEC 027 / selo de média no feed).

Esta spec é **full stack**:

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | Redesign da tela, abas Rolês/Eventos/Locais, pills de avaliação, cards + CTAs, coração de favorito no feed |
| Back (Functions) | Payload da garagem (roles + eventos + locais), favoritos, enriquecer feed de locais com `favorito` |

**Não** cria modal de avaliação paralelo: o form completo permanece na SPEC 027. A garagem só **encaminha** e mostra **preview** do próprio relato quando já existir.

---

## 2. Recorte e princípios

### 2.1 O que entra

- Redesign visual de `/meus-roles` conforme `designs/meus-roles2.0` (tokens, tipografia, cards, sticky tabs).
- Card de **resumo do piloto** (avatar, apelido, moto, cidade) + telemetria em 3 métricas.
- **Abas de tipo:** Rolês · Eventos · Locais (com badge numérico).
- **Pills de recorte** (por aba de tipo): Todos recentes · Aguardando avaliação · Avaliados (quando fizer sentido).
- Aba **Eventos:** lista de eventos em que o uid tem `usersevento`, com status (confirmado / concluído) e CTA Avaliar / Ver relato.
- Aba **Locais:** lista de locais favoritos; CTA Avaliar / Ver relato.
- **Favoritar local** no feed (`LocalCard`): toggle coração; persistência em coleção nova.
- Pontos de entrada de feedback reforçados no feed (já previstos na SPEC 027) + **novos** na garagem.
- Badge **Público no Feed** no preview do próprio relato (copy informativa; não é setting).

### 2.2 O que **não** entra

| Item do mock / desejo | Motivo |
|-----------------------|--------|
| Título de header **Criar Role** + `arrow_back` | Destino de dock; header segue SPEC 017 (logo + avatar, sem back). Título da tela = **Meus Rolês** / kicker garagem |
| Renomear dock para **Garagem** / **Explora** / **Comboios** | SPEC 001/017 já fecharam labels; manter **Meus Rolês** |
| Modal inline de avaliação (HTML) | Form completo já existe em `/…/avaliar` (SPEC 027); evita dois forms |
| **Editar Relato** / **Atualizar Avaliação** (PATCH) | SPEC 027: relato definitivo; CTA vira **Ver relato** |
| **+50 XP de Capitão** | Sem sistema de XP |
| Vel. média / Curvas Nível / Chat Comboio / Ver Telemetria nos cards de rolê | Sem telemetria de rota, chat ou média agregada de rolê no card da garagem (SPEC 010 continua pontual) |
| Mini-mapa estático no card de local | Sem tile/Maps embed nesta spec; endereço textual basta |
| Contador **2X VISITADO** / check-in | Sem tracking de visitas |
| Share no card de local | Fora (sem deep link de local) |
| Lista de **todos** os locais avaliados (não favoritos) | Aba Locais = **só favoritos** (pedido explícito) |
| Favoritar **evento** ou **rolê** | Só local |
| Alterar regras de elegibilidade da SPEC 027 | Evento: inscrito + encerrado; local: qualquer auth |

### 2.3 Desvios conscientes do mock

| Mock | Nesta spec | Por quê |
|------|------------|---------|
| Header “Criar Role” + voltar | Logo + avatar; sem back | Destino de dock (igual 017) |
| Telemetria “locais que visitei” | Contagem de **favoritos** (label: **Locais favoritos**) | Pedido: locais da aba = favoritos, não visitas |
| “Eventos que participei” | Total de `usersevento` do uid (futuros + passados) | Não exige presença física |
| “Rolês feitos” | Contagem de rolês `concluido` da SPEC 017 | Já calculável |
| Modal de review | `router.push` para `/eventos/:id/avaliar` ou `/locais/:id/avaliar` | Reuso SPEC 027 |
| Estrelas no card “pendente” disparam nota inline | Toque nas estrelas **ou** CTA → mesma rota de avaliar (sem POST parcial) | Form único |
| “Editar Relato” | **Ver relato** → tela em modo leitura | Sem PATCH |
| Aba Rolês só com histórico concluído | Mantém comportamento SPEC 017 (próximos + filtros Confirmados / Aguardando / Concluídos) **dentro** da aba Rolês | Garagem continua operando rolês futuros |
| Dock 5 itens com labels do HTML | Dock atual (SPEC 001 + 017) | Consistência |

### 2.4 Relação com SPEC 017 e 027

| Spec | Papel |
|------|--------|
| **017** | Continua dona da lógica de **rolês** na garagem (status, tune ritmo/papel, desistir, clonar). Esta spec **reestiliza** e **encaixa** essa lista na aba Rolês. |
| **027** | Continua dona de **POST/GET** de feedback, Storage, média no feed, tela `/avaliar`. Esta spec só **adiciona entradas** e **preview** na garagem. |
| **028** | Hub UI + eventos inscritos + favoritos + telemetria nova. |

---

## 3. Referência de Design

Replicar o visual de `designs/meus-roles2.0/` (`code.html` + `screen.png`). Tokens em `DESIGN.md` / `globals.css`. **Não** copiar HTML do Stitch (Tailwind CDN + scripts) — CSS Modules + Barlow Condensed / Plus Jakarta Sans.

### 3.1 O que entra do mock

- Card piloto: avatar 56px, nome/apelido uppercase, linha moto · cidade, status online opcional (omitir se sem sinal real — preferir **omitir** bolinha “online”).
- Strip de telemetria 3 colunas (`telemetry-num` + `badge-label`).
- Switcher 3 abas sticky (`top` sob o header): ícones `two_wheeler` / `local_activity` / `local_gas_station` + badges.
- Pills horizontais scrolláveis sob as abas.
- Card de **evento** com capa, data, badge de status, título, meta (endereço · N inscritos), bloco de feedback (preview **ou** CTA pendente).
- Card de **local** favorito: thumb, badge de categoria, nome, facilidades/resumo, bloco de feedback ou CTA Avaliar.
- Cores: `surface` `#121316`, `primary-container` `#ff6b00`, tertiary para presença confirmada, secondary para concluído/pendente.

### 3.2 Comportamento visual

- Coluna única, gutter 16px, **max-width 560px**.
- Tabs: trilho `surface-container-lowest`; ativa `primary-container` + texto `on-primary`.
- Cards: `surface-container-low`, `rounded-xl`, padding `card-padding-md`.
- CTA Avaliar: altura ≥ 44–48px (`touch-min`), full width no bloco pendente.
- Toque mínimo 48×48px; primários de ação 56px quando forem o CTA principal da tela de avaliar (já na 027).

---

## 4. Fluxo do usuário

### 4.1 Abrir a garagem

```
Dock → [Meus Rolês] → /meus-roles
  │
  ├── GET perfil (já em cache / auth) → card piloto
  ├── GET /meus-roles            → telemetria + contagens + itens Rolês (017)
  │     (ou GET agregado — ver §8)
  └── First paint: aba tipo = "roles" (default) OU última aba em sessionStorage (opcional; default roles)
```

### 4.2 Alternar abas de tipo

```
[Rolês] → lista SPEC 017 (com subfiltros Confirmados/Aguardando/Concluídos + tune)
[Eventos] → GET /meus-roles/eventos (se ainda não carregado) → cards evento
[Locais]  → GET /meus-roles/locais  → cards local favorito
```

Lazy-load por aba: não buscar eventos/locais até a primeira visita à aba (exceto contagens no payload inicial).

### 4.3 Pills (Eventos / Locais)

| Pill | Eventos | Locais |
|------|---------|--------|
| **Todos recentes** (default) | Todos os inscritos (futuros primeiro, depois concluídos recentes) | Todos os favoritos (`createdAt` DESC) |
| **Aguardando avaliação** | Inscrito + evento **encerrado** + `avaliado === false` | Favorito + `avaliado === false` |
| **Avaliados** | Inscrito + `avaliado === true` | Favorito + `avaliado === true` |

Na aba **Rolês**, as pills do mock **não** substituem as abas Confirmados/Aguardando/Concluídos da 017. Manter o trilho de status da 017 **dentro** da aba Rolês; omitir as pills “Aguardando Avaliação / Avaliados” em Rolês (feedback de rolê = SPEC 010, fluxo `/roles/:id/feedback`, já no card concluído).

### 4.4 Avaliar a partir da garagem

```
Card evento (pendente) → [Avaliar evento agora] → /eventos/:id/avaliar
Card evento (já avaliou) → [Ver relato] → /eventos/:id/avaliar (leitura)
Card local (pendente) → [Avaliar] → /locais/:id/avaliar
Card local (já avaliou) → [Ver relato] → /locais/:id/avaliar (leitura)
```

Elegibilidade **não** é reinventada no front: se a API devolveu o item como pendente, o POST da 027 ainda valida; erros 403/409 viram EstadoErro na tela de avaliar.

### 4.5 Favoritar no feed

```
Feed → aba Locais → LocalCard → [♡ Favoritar]
  │
  ├── não favorito → POST /locais/:id/favorito → ♥ FILL + favorito=true
  └── favorito     → DELETE /locais/:id/favorito → outline + some da lista da garagem no próximo GET
```

Optimistic UI permitido; rollback em erro. Sem confirmação nativa no unfavorite (ação reversível).

### 4.6 Visibilidade do feedback para outros usuários

Já coberto pela SPEC 027; esta spec **reforça** o produto:

| Onde | O que o outro piloto vê |
|------|-------------------------|
| Feed Locais / Eventos | ★ `notaMedia` + `(N)` |
| `/locais/:id/avaliar` e `/eventos/:id/avaliar` (leitura) | Lista nominal `GET …/avaliacoes` |
| Detalhe do evento/local (se existir) | Mesmo selo de média |
| Card da **própria** garagem | Preview do **meu** relato + badge **Público no Feed** |

Não listar autores no `LocalCard`/`EventoCard` do feed (igual 027).

---

## 5. Arquitetura Next.js

Seguir a skill: página orquestradora, componentes ~80 linhas, lógica em hooks, API em services. Bearer **só no client**.

### 5.1 Page

```tsx
// src/app/(app)/meus-roles/page.tsx — Server Component (inalterado no papel)
import { TelaMeusRoles } from "./components/TelaMeusRoles";

const MeusRolesPage = () => (
  <main>
    <TelaMeusRoles />
  </main>
);

export default MeusRolesPage;
```

### 5.2 Estrutura por feature (evolução)

```
src/app/(app)/meus-roles/
├── page.tsx
├── components/
│   ├── TelaMeusRoles.tsx              # Alterar — orquestra tipo + conteúdo
│   ├── CabecalhoMeusRoles.tsx         # Manter espírito 017
│   ├── CardPilotoGaragem.tsx          # NOVO — avatar + moto + telemetria
│   ├── TelemetriaGaragem.tsx          # Alterar — 3 métricas novas
│   ├── AbasTipoGaragem.tsx            # NOVO — Rolês | Eventos | Locais
│   ├── AbasMeusRoles.tsx              # Manter — status só na aba Rolês
│   ├── PillsAvaliacaoGaragem.tsx      # NOVO — pills eventos/locais
│   ├── ListaMeusRoles.tsx             # Manter (aba roles)
│   ├── ListaMeusEventos.tsx           # NOVO
│   ├── ListaMeusLocais.tsx            # NOVO
│   ├── CardMeuEvento.tsx              # NOVO — capa + status + bloco feedback
│   ├── CardMeuLocal.tsx               # NOVO
│   ├── BlocoPreviewAvaliacao.tsx      # NOVO — estrelas + citação + “Público no Feed”
│   ├── BlocoCtaAvaliar.tsx            # NOVO — pendente → link avaliar
│   ├── SheetFiltrosMeusRoles.tsx      # Manter (só roles)
│   └── …estados vazio/erro/loading
├── hooks/
│   ├── useMeusRoles.ts                # Alterar ou fatiar
│   ├── useMeusEventosGaragem.ts       # NOVO
│   ├── useMeusLocaisGaragem.ts        # NOVO
│   ├── useAbaTipoGaragem.ts           # NOVO — "roles" | "eventos" | "locais"
│   ├── useFiltrosMeusRoles.ts         # Manter (aba status + tune)
│   └── useFiltroAvaliacaoGaragem.ts   # NOVO — pill todos/pendente/avaliados
├── services/
│   ├── meus-roles.service.ts          # Alterar — + eventos + locais
│   └── … (reusar avaliacao.service da 027 para nada além de navegação)
├── constants.ts                       # Alterar — labels telemetria / pills
└── meus-roles.module.css              # Alterar — tokens 2.0

src/app/(app)/feed/components/
├── LocalCard.tsx                      # Alterar — botão favorito
├── BotaoFavoritarLocal.tsx            # NOVO (opcional)
└── hooks/useFavoritoLocal.ts          # NOVO

src/app/(app)/feed/services/
└── favorito-local.service.ts          # NOVO

src/types/
├── meus-roles.ts                      # Alterar — telemetria + DTOs evento/local
├── local.ts                           # Alterar — favorito?: boolean no feed
└── favorito-local.ts                  # NOVO (opcional)
```

### 5.3 Responsabilidades

| Peça | Tipo | Faz |
|------|------|-----|
| `page.tsx` | Server | Só monta a tela |
| `TelaMeusRoles` | Client | Tipo ativo + qual lista + loading/erro |
| `useAbaTipoGaragem` | Hook | Estado da aba de tipo + contagens badges |
| `useMeusEventosGaragem` | Hook | Fetch lazy + pill filter em memória |
| `useMeusLocaisGaragem` | Hook | Idem |
| `useFavoritoLocal` | Hook | POST/DELETE + estado otimista no card |
| Services | — | HTTP; **sem** Firestore no client |
| Cards | UI | Um bloco visual cada; CTA = `Link` |

**Não misturar** no mesmo arquivo: JSX do card de evento + fetch de favoritos + lógica de status de rolê.

### 5.4 Item ativo no menu

Inalterado: `/meus-roles` marca **Meus Rolês**. Rotas `/…/avaliar` continuam marcando Feed (SPEC 027).

---

## 6. Contrato dos Dados (front)

### 6.1 Telemetria e contagens

```ts
// Evolução em src/types/meus-roles.ts

export type AbaTipoGaragem = "roles" | "eventos" | "locais";

export type PillAvaliacaoGaragem = "todos" | "aguardando_avaliacao" | "avaliados";

export type TelemetriaMeusRoles = {
  rolesFeitos: number;       // concluídos (017)
  eventosParticipados: number; // total usersevento do uid
  locaisFavoritos: number;   // total userslocalfavorito do uid
};

/** Badges das abas de tipo (totais, independem da pill). */
export type ContagensTipoGaragem = {
  roles: number;    // itens de rolê na garagem (mesma regra 017: visíveis default / ou total sem recusados)
  eventos: number;  // inscritos
  locais: number;   // favoritos
};

/** Contagens de status de rolê — mantém SPEC 017. */
export type ContagensMeusRoles = {
  confirmados: number;
  aguardando: number;
  concluidos: number;
};
```

Substituir a telemetria antiga (`ativos` / `analise` / `asfaltoKm`) **ou** mantê-la só na aba Rolês?  
**Decisão:** o mock 2.0 substitui o strip. Remover `ativos`/`analise`/`asfaltoKm` do first paint. Se útil, km de asfalto pode ficar omitido nesta versão (histórico no perfil já cobre).

### 6.2 Item de evento na garagem

```ts
export type StatusMeuEventoGaragem =
  | "confirmado"  // inscrito, ainda não encerrou
  | "concluido";  // inscrito, already ended

export type MeuEventoGaragemItem = {
  eventoId: string;
  titulo: string;
  tipo: string; // TipoEvento
  fotoCapaUrl: string;
  dataHoraAbertura: string;
  dataHoraEncerramento: string | null;
  localNome: string;
  localEndereco: string;
  status: StatusMeuEventoGaragem;
  inscritosTotal: number;
  avaliado: boolean;
  /** Presente só se avaliado === true */
  minhaAvaliacao: {
    nota: number;
    comentario: string;
    createdAt: string;
  } | null;
  notaMedia: number;
  totalAvaliacoes: number;
};
```

### 6.3 Item de local na garagem

```ts
export type MeuLocalGaragemItem = {
  localId: string;
  nome: string;
  categoria: string;
  endereco: string;
  fotoFachadaUrl: string;
  facilidadesResumo: string; // join curto no back ou montar no front
  favoritadoEm: string; // ISO
  avaliado: boolean;
  minhaAvaliacao: {
    nota: number;
    comentario: string;
    fotosCount: number;
    createdAt: string;
  } | null;
  notaMedia: number;
  totalAvaliacoes: number;
};
```

### 6.4 Payload

```ts
export type MeusRolesPayload = {
  telemetria: TelemetriaMeusRoles;
  contagensTipo: ContagensTipoGaragem;
  contagens: ContagensMeusRoles; // rolês — 017
  itens: MeuRoleItem[];          // rolês — 017
};

export type MeusEventosGaragemPayload = {
  itens: MeuEventoGaragemItem[];
};

export type MeusLocaisGaragemPayload = {
  itens: MeuLocalGaragemItem[];
};
```

### 6.5 Feed — local

```ts
// LocalFeedItem
favorito: boolean; // true se existe userslocalfavorito do uid
```

---

## 7. Implementação Front

### 7.1 Services

```ts
// meus-roles.service.ts
export const meusRolesService = {
  listar: () => api<MeusRolesPayload>("/meus-roles"),
  listarEventos: () =>
    api<MeusEventosGaragemPayload>("/meus-roles/eventos"),
  listarLocais: () =>
    api<MeusLocaisGaragemPayload>("/meus-roles/locais"),
};

// favorito-local.service.ts
export const favoritoLocalService = {
  favoritar: (localId: string) =>
    api(`/locais/${localId}/favorito`, { method: "POST" }),
  desfavoritar: (localId: string) =>
    api(`/locais/${localId}/favorito`, { method: "DELETE" }),
};
```

### 7.2 Card piloto

Dados do usuário logado (`useAuth` + perfil já carregado no app, ou `GET /usuarios/:uid` / endpoint de perfil atual). Campos: `fotoUrl`, `apelido` ou `nome`, `moto`, `cidade` (omitir cidade se vazia).

### 7.3 Card evento — estados

| Status | Badge capa | Bloco inferior |
|--------|------------|----------------|
| `confirmado` | **Presença confirmada** (tertiary) | Sem CTA Avaliar; link **Ver evento** → `/eventos/:id` (ou detalhe existente) |
| `concluido` + `!avaliado` | **Concluído** (secondary) | Bloco CTA **Avaliar evento agora** |
| `concluido` + `avaliado` | **Presença confirmada** ou **Concluído** | Preview + **Ver relato** + badge **Público no Feed** |

Meta: `{endereco curto} · {inscritosTotal} pilotos` (copy flexível; evitar “motos no comboio” — evento não é comboio).

### 7.4 Card local — estados

| `avaliado` | Bloco |
|------------|--------|
| `false` | CTA **Avaliar** / “Deixar feedback do ponto” |
| `true` | Preview (nota + trecho do comentário + `fotosCount`) + **Ver relato** |

Sem mapa, sem share, sem “2x visitado”.

### 7.5 Favorito no LocalCard

- Ícone `favorite` / `favorite_border`, toque ≥ 48px, canto do card (não cobrir o CTA Avaliar/Maps).
- `aria-pressed` / `aria-label` “Favoritar {nome}” / “Remover dos favoritos”.
- Estado inicial de `favorito` vem do `GET /locais` (feed).

### 7.6 Estados vazios

| Aba + pill | Copy |
|------------|------|
| Rolês (vazio 017) | Manter textos da 017 |
| Eventos / todos | Você ainda não se inscreveu em eventos. Explore a aba Eventos no feed. |
| Eventos / aguardando | Nenhum evento esperando sua avaliação. |
| Eventos / avaliados | Você ainda não publicou relatos de eventos. |
| Locais / todos | Favorite um ponto no feed (aba Locais) para vê-lo aqui. |
| Locais / aguardando | Seus favoritos já estão em dia — ou ainda sem avaliação. |
| Locais / avaliados | Nenhum favorito avaliado ainda. |

### 7.7 Filtro em memória (pills)

Após o GET da aba, filtrar no client:

- `aguardando_avaliacao` → `avaliado === false` (e, em eventos, `status === "concluido"` — futuros nunca entram nesta pill).
- `avaliados` → `avaliado === true`.
- Eventos futuros só aparecem em **Todos**.

---

## 8. Backend (Functions)

### 8.1 Coleção `userslocalfavorito` (**nova**)

```
userslocalfavorito/{id}
{
  id: string,           // `{usuarioId}_{localId}`
  usuarioId: string,
  localId: string,
  createdAt: timestamp,
}
```

- Um doc por par. Sem `updatedAt` obrigatório.
- `usuarioId` **só** do token.

### 8.2 Endpoints

| Método | Path | Auth | Comportamento |
|--------|------|------|----------------|
| `GET` | `/meus-roles` | Sim | Evolui telemetria + `contagensTipo`; mantém `itens` de rolês (017) |
| `GET` | `/meus-roles/eventos` | Sim | Lista eventos inscritos enriquecidos |
| `GET` | `/meus-roles/locais` | Sim | Lista locais favoritos enriquecidos |
| `POST` | `/locais/:id/favorito` | Sim | Cria favorito; 200 se já existia (idempotente) |
| `DELETE` | `/locais/:id/favorito` | Sim | Remove; 204/200 se não existia (idempotente) |
| `GET` | `/locais` (feed) | Sim | **+** `favorito: boolean` por item |

Routers finos; persistência só em repositórios. Registrar no `index.ts` + health.

### 8.3 `GET /meus-roles` — telemetria

```
rolesFeitos          = count itens status concluido (mesma classif. 017)
eventosParticipados  = count usersevento do uid
locaisFavoritos      = count userslocalfavorito do uid

contagensTipo.roles    = total itens de rolê retornados (ou regra badges 017: confirmados+aguardando+concluidos)
contagensTipo.eventos  = eventosParticipados
contagensTipo.locais   = locaisFavoritos
```

Não devolver listas de eventos/locais neste GET (lazy nos subpaths).

### 8.4 `GET /meus-roles/eventos`

1. `usuarioEventoRepository.listarPorUsuario(uid)`.
2. Batch get `eventos`.
3. Para cada evento: `status` por `now >= encerramento ?? abertura` → `concluido` senão `confirmado`.
4. `avaliado` + `minhaAvaliacao` via `userseventofeedback` (id composto).
5. `inscritosTotal` via count (reusar helper da 026 se existir).
6. Ordenação: `confirmado` por `dataHoraAbertura` ASC; depois `concluido` por abertura DESC. Teto **80**.

Omitir eventos apagados / inexistentes.

### 8.5 `GET /meus-roles/locais`

1. `usuarioLocalFavoritoRepository.listarPorUsuario(uid)` ordenado `createdAt` DESC.
2. Batch get `locais`.
3. Enriquecer `avaliado` / `minhaAvaliacao` / médias.
4. Teto **80**.

### 8.6 Favorito — POST/DELETE

```
POST /locais/:id/favorito
  ├── local inexistente → 404
  ├── cria doc id composto → 201 { id, localId, createdAt }
  └── já existe → 200 mesmo body

DELETE /locais/:id/favorito
  └── apaga se existir → 204
```

Não exigir avaliação prévia. Não criar favorito implícito ao avaliar.

### 8.7 Feed `GET /locais`

Após montar a lista (SPEC 024), batch dos ids favoritos do uid → setar `favorito`.

### 8.8 Repositórios (**novos**)

```
interfaces/usuario-local-favorito.repository.ts
firestore/firestore-usuario-local-favorito.repository.ts
```

Métodos: `buscarPorId`, `criar`, `remover`, `listarPorUsuario`, `listarLocalIdsPorUsuario` (para o feed), `contarPorUsuario`.

Índices: `usuarioId` + `createdAt` DESC em `userslocalfavorito` (se a query ordenar).

### 8.9 O que não muda

- Regras de POST avaliação (027).
- Schema `usersevento` / inscrição.
- Security Rules deny-all no client.
- Function HTTP única `api`.

---

## 9. Wireframes

### 9.1 Garagem — aba Eventos

```
┌─────────────────────────────────┐
│  [logo]              (avatar)   │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 👤 ALEX "BRUTO"             │ │
│ │ Yamaha · São Paulo          │ │
│ │  03        02        04     │ │
│ │ Rolês    Eventos   Locais   │ │
│ │ feitos   part.     favoritos│ │
│ └─────────────────────────────┘ │
│ [ Rolês ][ EVENTOS ][ Locais ]  │  ← EVENTOS ativo
│ (Todos) (Aguardando N) (Aval.)  │
│ ┌─────────────────────────────┐ │
│ │ [capa] 15 MAI  PRESENÇA OK  │ │
│ │ TÍTULO EVENTO               │ │
│ │ endereço · N pilotos        │ │
│ │ ★★★★★ 5.0  [PÚBLICO FEED] │ │
│ │ "relato…"                   │ │
│ │ Avaliado há X  [Ver relato] │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ [capa] CONCLUÍDO            │ │
│ │ TÍTULO                      │ │
│ │ ⚠ Avaliação pendente        │ │
│ │ [ Avaliar evento agora ]    │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ dock — Meus Rolês ativo         │
└─────────────────────────────────┘
```

### 9.2 Feed — favorito

```
┌─────────────────────────────────┐
│ [Aberto] [Posto]  ★4.9(12)  ♥  │  ← favorito toggle
│ NOME DO LOCAL                   │
│ …  [Maps]          [Avaliar]    │
└─────────────────────────────────┘
```

---

## 10. Fora do Escopo

- Editar / apagar avaliação (continua 027).
- XP, gamificação, “capitão”.
- Chat, telemetria de velocidade, GPX, mapa no card.
- Favoritar evento/rolê.
- Aba Locais com “todos que avaliei” sem favoritar.
- Push “avalie seu evento”.
- Renomear itens do dock.
- Paginação infinita (teto 80).
- Server Component fetch autenticado.

---

## 11. Critérios de Aceite

### Front — garagem

- [ ] `/meus-roles` segue o visual 2.0 (card piloto, telemetria 3 métricas, abas Rolês/Eventos/Locais, pills em Eventos/Locais).
- [ ] Sem header “Criar Role” / sem back; dock label permanece Meus Rolês.
- [ ] Aba Rolês preserva comportamentos da SPEC 017 (status, tune, desistir, clonar, destinos).
- [ ] Aba Eventos lista só inscritos; pills filtram pendente/avaliado corretamente.
- [ ] Aba Locais lista só favoritos; empty state orienta favoritar no feed.
- [ ] CTA Avaliar / Ver relato navega para rotas da SPEC 027 (sem modal duplicado).
- [ ] Preview mostra badge **Público no Feed** quando há relato próprio.
- [ ] Sem XP, sem Editar/Atualizar avaliação, sem mapa/share/visitas.
- [ ] `page.tsx` Server; Client só com interatividade; componentes ~80 linhas; services sem Firestore.

### Front — feed

- [ ] `LocalCard` exibe toggle de favorito; estado inicial de `favorito` do GET.
- [ ] Favoritar/desfavoritar atualiza UI; erro faz rollback.
- [ ] CTAs Avaliar do feed (027) continuam funcionando.

### Back

- [ ] Coleção `userslocalfavorito`; id composto; uid só do token.
- [ ] `GET /meus-roles` devolve telemetria nova + `contagensTipo` + rolês.
- [ ] `GET /meus-roles/eventos` e `/meus-roles/locais` autenticados, teto 80, com `avaliado` / preview.
- [ ] POST/DELETE favorito idempotentes; 404 se local inexistente no POST.
- [ ] `GET /locais` inclui `favorito`.
- [ ] Persistência só via repositórios; índices atualizados; health lista paths.

### Integração

- [ ] Inscrever em evento → aparece na aba Eventos; após encerrar → pill Aguardando; após POST 027 → Avaliados + preview.
- [ ] Favoritar no feed → aparece em Locais da garagem; desfavoritar some no refetch.
- [ ] Relato publicado continua visível para outros via média no feed + lista em `/avaliar` (027).

---

## 12. Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| `docs/specs/028-melhorias-tela-meus-roles.md` | **NOVO** (este) |
| `src/app/(app)/meus-roles/**` | **Alterar** — UI 2.0 + eventos/locais |
| `src/types/meus-roles.ts` | **Alterar** |
| `src/types/local.ts` | **Alterar** — `favorito` |
| `src/app/(app)/feed/components/LocalCard.tsx` | **Alterar** |
| `src/app/(app)/feed/services/favorito-local.service.ts` | **NOVO** |
| `functions/src/routes/meus-roles.ts` | **Alterar** — subrotas |
| `functions/src/lib/meus-roles.ts` | **Alterar** — telemetria |
| `functions/src/lib/meus-eventos-garagem.ts` | **NOVO** |
| `functions/src/lib/meus-locais-garagem.ts` | **NOVO** |
| `functions/src/routes/favorito-local.ts` (ou em `locais.ts`) | **NOVO** |
| `functions/src/repositories/interfaces/usuario-local-favorito.repository.ts` | **NOVO** |
| `functions/src/repositories/firestore/firestore-usuario-local-favorito.repository.ts` | **NOVO** |
| `functions/src/repositories/index.ts` | **Alterar** |
| `functions/src/types/meus-roles.ts` / `favorito-local.ts` | **Alterar/NOVO** |
| `functions/src/routes/locais.ts` | **Alterar** — enriquecer `favorito` |
| `firestore.indexes.json` | **Alterar** |
| `.cursor/rules/tech-stack.mdc` / `project-context.mdc` | **Alterar** na implementação |

Reuso: `avaliacao.service`, rotas `/avaliar`, repositórios de feedback (027), inscrição (026), classificar rolês (017).

---

## 13. Checklist da skill Next.js

- [ ] `page.tsx` sem `"use client"`.
- [ ] `"use client"` só em tela, abas, pills, cards com botão, favorito.
- [ ] Estado de tipo / pills / fetch / favorito em hooks separados.
- [ ] HTTP em services; sem Firestore no componente.
- [ ] Um componente = uma coisa (piloto, aba tipo, card evento, preview, CTA, favorito).
- [ ] Sem abstrair “ItemGaragem” genérico misturando rolê/evento/local no mesmo card.
- [ ] CSS Modules + tokens; sem copiar HTML Stitch.
- [ ] Sem `console.log` de debug.

---

## 14. Ordem sugerida de implementação

1. Tipos + repositório `userslocalfavorito` + POST/DELETE + `favorito` no `GET /locais`.
2. Evoluir `GET /meus-roles` (telemetria + `contagensTipo`).
3. `GET /meus-roles/eventos` e `GET /meus-roles/locais` + libs de montagem.
4. Front: card piloto + abas de tipo + telemetria (mantendo lista Rolês).
5. Front: lista/cards Eventos + pills + links para `/avaliar`.
6. Front: lista/cards Locais + pills.
7. Front: coração no `LocalCard` + service de favorito.
8. Empty states, critérios de aceite, atualizar `tech-stack` / `project-context`.

---

## 15. Relação com o código atual

| Hoje | Nesta spec |
|------|------------|
| Meus Rolês = só comboios (017) | Hub Rolês + Eventos + Locais favoritos |
| Telemetria ativos/análise/km | Rolês feitos / eventos / favoritos |
| Eventos só no feed + histórico perfil | Também na garagem |
| Locais só no feed/catálogo | Favoritos na garagem + ♥ no feed |
| Avaliar só feed/perfil/URL (027) | + CTAs e preview na garagem |
| Sem coleção de favorito | `userslocalfavorito` |
| Mock com modal / editar / XP | Rotas 027; sem PATCH; sem XP |

**Não implementar nesta tarefa de especificação** — este arquivo é o contrato para o desenvolvimento full stack seguinte.
