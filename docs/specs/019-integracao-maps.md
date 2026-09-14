# SPEC 019 — Integração Maps + Nome do Local

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-14  
> **Referência visual:**  
> - Criar rolê: `designs/criar-role/` (`DESIGN.md`, `code.html`, `screen.png`)  
> - Convite / ficha: `designs/compartilhar-role/` (`code.html`, `screen.png`) — padrão título + subtítulo do destino  
> - Feed: `designs/feed/` (`DESIGN.md`, `code.html`)  
> - Confirmação: `designs/confirmacao-participacao/`  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade  
> **Backend:** Cloud Function `api` (Express) — `POST /roles`, `GET /roles`, `GET /roles/:id`, `GET /roles/:id/modelo`, `GET /publico/roles/:id`, `GET /meus-roles`  
> **Coleção Firestore:** `roles` (campo aninhado `localSaida` / `destinoFinal`)  
> **Depende de:** SPEC 003 (schema `roles` + feed), SPEC 004 (criar rolê), SPEC 005 (participar), SPEC 009 (clonar), SPEC 015 (convite público), SPEC 017 (meus rolês)

---

## 1. Objetivo

Esta spec agrupa **duas melhorias** ligadas a partida e destino do rolê:

| # | Melhoria | Camada |
|---|----------|--------|
| A | **Abrir no Maps** — toque abre o app de mapas do celular (ou o Google Maps no browser) no ponto de partida ou no destino | Front (PWA) |
| B | **Nome do local (opcional)** — campo curto digitável para partida e destino; vira o título legível; o endereço completo fica como subtítulo | Front + Back |

Hoje o piloto só vê o endereço geocodificado longo (“Avenida …, bairro …, cidade …”) — difícil de escanear no feed, na ficha e no mini card. O mock do convite (`designs/compartilhar-role`) já previa título amigável + subtítulo com o endereço; a SPEC 015 omitiu isso porque o schema só tinha `endereco`.

Esta spec é **full stack**:

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | Campo opcional no formulário de criar/clonar; exibir nome como título nas listagens; botão/link “Abrir no Maps”; lib de URL de mapas |
| Back (Functions) | Aceitar, validar e persistir `nome` em `localSaida` / `destinoFinal`; incluir no DTO público e nas buscas; default `""` em docs antigos |

**Não** se cria coleção nova. **Não** se embute mapa interativo (Leaflet/Google Maps JS). Só deep link para o app nativo / web do Maps.

---

## 2. Melhoria A — Abrir no Maps

### 2.1 Contexto atual

Partida e destino existem como `Localizacao { lat, lng, endereco }` em praticamente todas as telas autenticadas. No convite público (SPEC 015) só há `localSaidaEndereco` / `destinoFinalEndereco` — **sem** lat/lng e **sem** ação de abrir mapas.

Não há utilitário nem botão de maps no app.

### 2.2 Proposta

Em toda superfície onde o piloto vê partida e/ou destino de forma acionável, oferecer **Abrir no Maps** (ícone + área de toque ≥ 48px). O toque abre uma URL universal do Google Maps com as coordenadas (preferencial) ou o endereço (fallback).

### 2.3 Lib `src/lib/maps.ts`

Sem dependência de plataforma nativa. Uma função pura monta a URL; o componente só navega.

```ts
// src/lib/maps.ts
export type PontoMaps = {
  lat?: number | null;
  lng?: number | null;
  endereco: string;
  nome?: string;
};

/** URL universal — no Android/iOS costuma oferecer abrir no app de Maps. */
export const urlAbrirMaps = (ponto: PontoMaps): string => {
  const temCoord =
    typeof ponto.lat === "number" &&
    typeof ponto.lng === "number" &&
    Number.isFinite(ponto.lat) &&
    Number.isFinite(ponto.lng);

  if (temCoord) {
    // query=lat,lng — preciso; label amigável vai no texto do botão, não na URL
    return `https://www.google.com/maps/search/?api=1&query=${ponto.lat},${ponto.lng}`;
  }

  const q = (ponto.nome?.trim() || ponto.endereco).trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
};
```

**Por que Google Maps universal (e não `geo:` / Apple Maps):**

| Opção | Problema |
|-------|----------|
| `geo:lat,lng?q=…` | Bom no Android; suporte frágil no iOS Safari / PWA |
| `maps.apple.com` | Só ideal no iOS; no Android abre web |
| Google `maps/search/?api=1&query=` | Funciona em ambos; no celular costuma oferecer o app nativo |

Fora do escopo: detectar iOS e montar URL Apple, rota turn-by-turn, multi-stop.

### 2.4 Componente `BotaoAbrirMaps`

Client Component fino (~40 linhas), reutilizável.

```
src/components/maps/BotaoAbrirMaps.tsx
src/components/maps/botao-abrir-maps.module.css   // só se precisar de estilos além dos tokens locais
```

Props:

```ts
type Props = {
  ponto: PontoMaps;
  /** Visível: "Abrir no Maps" | "Ver partida" | "Ver destino" */
  label?: string;
  /** compact = só ícone 48×48; default = ícone + texto */
  variante?: "texto" | "icone";
  className?: string;
};
```

Comportamento:

- Renderiza `<a href={urlAbrirMaps(ponto)} target="_blank" rel="noopener noreferrer">`.
- Ícone Material Symbols: `map` (ou `directions` se o contexto for “ir até”).
- `aria-label` sempre descritivo: `Abrir {nome || endereco} no Maps`.
- Se `endereco` vazio **e** sem coords válidas → não renderiza (ou `disabled` + sem `href`).

**Não** usar `window.open` se o `<a>` resolve — melhor para acessibilidade e long-press “abrir em nova aba”.

### 2.5 Onde aparece

| Superfície | Arquivo(s) | UX |
|------------|------------|-----|
| Feed — bloco de rota | `RotaRole.tsx` | Cada linha (Partida / Destino) ganha ação de maps (ícone à direita ou linha inteira clicável **só** no ícone — não competir com o card/link do rolê) |
| Convite público — ficha | `ItemFicha.tsx` / `FichaTecnicaComboio.tsx` | Link “Abrir no Maps” sob o subtítulo (partida e destino) |
| Confirmação de participação | `MiniCardRole.tsx` | Ação no ponto de encontro |
| Detalhe / feedback (se mostrar rota) | `CardResumoRole.tsx` | Opcional: mesma lib se a linha de rota for tocável |

**Meus Rolês / cards compactos:** fora desta spec como CTA dedicado (espaço apertado). O piloto abre o rolê / convite e usa o maps lá. Se no feed o card inteiro já for link, o botão de maps **não** pode ser filho de outro `<a>` — usar `stopPropagation` no clique do ícone **ou** estruturar como botão irmão (mesmo cuidado da SPEC 009 no card Clonar).

### 2.6 Convite público — coords no DTO

A SPEC 015 omitiu lat/lng por privacidade. Com endereço **já público**, coordenadas do ponto de encontro são necessárias para o Maps preciso. Esta spec **adiciona** lat/lng (e o `nome`) ao `RolePublico` de forma aditiva:

```ts
// src/types/role-publico.ts (+ mirror em functions)
export type RolePublico = {
  // ... campos existentes ...
  localSaidaEndereco: string;
  destinoFinalEndereco: string;
  localSaidaNome: string;       // ← NOVO ("" se vazio)
  destinoFinalNome: string;     // ← NOVO
  localSaidaLat: number;        // ← NOVO
  localSaidaLng: number;        // ← NOVO
  destinoFinalLat: number;      // ← NOVO
  destinoFinalLng: number;      // ← NOVO
};
```

Manter os campos flat existentes (`*Endereco`) para não quebrar `generateMetadata`, share text e componentes atuais — só estender.

Backend `roles-publico.ts` passa a preencher esses campos a partir de `role.localSaida` / `role.destinoFinal`.

### 2.7 Fluxo

```
Piloto toca "Abrir no Maps" (partida ou destino)
  → <a> com urlAbrirMaps({ lat, lng, endereco, nome })
  → SO / browser oferece Google Maps (app) ou abre a web
  → Pino no ponto (coords) ou busca pelo texto (fallback)
```

Sem chamada à Cloud Function. Sem permissão de geolocalização extra (já temos as coords do rolê).

---

## 3. Melhoria B — Nome opcional do local

### 3.1 Contexto atual

```ts
export interface Localizacao {
  lat: number;
  lng: number;
  endereco: string;
}
```

O mock do convite já mostra:

| Zona | Título (legível) | Subtítulo |
|------|------------------|-----------|
| Ponto de Encontro | “Posto Shell Rodoanel km 24 (Café e Abastecimento)” | (hora de saída) |
| Destino | “Mirante da Serra & Café dos Pilotos” | “Campos do Jordão - SP …” |

Hoje `ItemFicha` usa o endereço completo como `titulo` — exatamente o problema de legibilidade.

### 3.2 Proposta de schema

```ts
// src/types/role.ts + functions/src/types/role.ts
export interface Localizacao {
  lat: number;
  lng: number;
  endereco: string;
  /** Apelido curto do ponto. Vazio = UI usa só o endereço. */
  nome: string;
}
```

- **Obrigatório no tipo** como `string` (sempre presente).
- **Opcional no produto:** o piloto pode deixar em branco.
- Docs antigos sem `nome`: mapper / `toRole` default `""`.

```ts
// firestore-role.repository.ts — toRole
localSaida: {
  lat: data.localSaida?.lat ?? 0,
  lng: data.localSaida?.lng ?? 0,
  endereco: String(data.localSaida?.endereco ?? ""),
  nome: String(data.localSaida?.nome ?? ""),
},
// idem destinoFinal
```

Não precisa migration job: leitura tolerante basta.

### 3.3 Validação (backend)

Estender `isLocalizacao` em `functions/src/routes/roles.ts`:

| Campo | Regra |
|-------|--------|
| `lat` / `lng` / `endereco` | Iguais à SPEC 004 (endereco trim ≥ 3, coords finitas) |
| `nome` | `string`; após `trim`, comprimento **0–60**; se omitido no body → grava `""` |

```ts
const normalizarNome = (valor: unknown): string | null => {
  if (valor === undefined || valor === null) return "";
  if (typeof valor !== "string") return null;
  const n = valor.trim();
  if (n.length > 60) return null;
  return n;
};
```

No `validarBodyCriacao` / update: se `normalizarNome` retornar `null` → 400 `"localSaida inválida"` (ou destino).

Persistir sempre o objeto completo:

```ts
localSaida: {
  lat: localSaida.lat,
  lng: localSaida.lng,
  endereco: localSaida.endereco.trim(),
  nome: normalizarNome(localSaida.nome) ?? "",
},
```

### 3.4 Busca do feed (`q`)

Incluir `nome` em `bateBusca`:

```ts
textoContem(role.localSaida.nome, termo) ||
textoContem(role.destinoFinal.nome, termo) ||
// ... titulo, descricao, enderecos
```

### 3.5 Helper de exibição (front)

```ts
// src/lib/localizacao.ts
import type { Localizacao } from "@/types/role";

export const tituloLocal = (local: Pick<Localizacao, "nome" | "endereco">): string =>
  local.nome.trim() || local.endereco;

export const subtituloLocal = (
  local: Pick<Localizacao, "nome" | "endereco">,
): string | null => (local.nome.trim() ? local.endereco : null);
```

| `nome` | Título na UI | Subtítulo |
|--------|--------------|-----------|
| preenchido | `nome` | `endereco` |
| vazio | `endereco` | omitido (ou só a hora, na partida do convite) |

### 3.6 Formulário criar / clonar rolê

Seguir o design system de `designs/criar-role/` (cartão `surface-container`, label uppercase `primary` + ícone, input `touch-min`).

Em `CampoLocalizacao`, **abaixo** do input de endereço (e da lista de sugestões), adicionar um segundo input:

| Prop / copy | Partida | Destino |
|-------------|---------|---------|
| Label | Nome do local (opcional) | Nome do local (opcional) |
| Placeholder | Ex.: Posto Shell km 24 | Ex.: Mirante da Serra |
| `maxLength` | 60 | 60 |
| `id` | `{id}-nome` | `{id}-nome` |

Não é cartão separado — fica **dentro** do mesmo cartão de Partida / Destino Final, para não alongar o formulário com mais um card.

#### Hook `useCampoLocalizacao`

- Estado `nome: string`.
- `LocalizacaoForm` ganha `nome`.
- `escolher` / `usarGps` / `aoDigitar` endereço: **não** apagam o `nome` (o piloto pode ter digitado o apelido antes).
- `preencher(local)` (clone): copia `nome` junto com endereço/coords.
- `aoDigitarNome(texto)`.

#### `useFormularioCriarRole` → `POST /roles`

```ts
localSaida: {
  lat: ...,
  lng: ...,
  endereco: partida.valor.endereco.trim(),
  nome: partida.valor.nome.trim(),
},
// idem destinoFinal
```

Clone (SPEC 009): o modelo já traz `Localizacao` completa — com o campo novo no backend, o pré-preenchimento herda o nome sem endpoint novo.

### 3.7 Onde o nome aparece na UI

| Tela | Comportamento |
|------|----------------|
| Feed `RotaRole` | Valor principal = `tituloLocal(...)`; se houver nome, endereço pode ir truncado numa segunda linha discreta **ou** omitido no card (espaço) — preferência: **só o título** no feed + hora na partida; endereço completo fica no convite/detalhe |
| Convite `FichaTecnicaComboio` | `titulo={tituloLocal}` + subtítulo com `endereco` quando `nome` preenchido (fecha o gap do mock da SPEC 015) |
| `MiniCardRole` | `Ponto: **{tituloLocal(localSaida)}**` |
| Meus Rolês / cards | `localSaidaEndereco` no payload pode continuar sendo o endereço; **ou** passar a exibir `tituloLocal` — ver §3.8 |
| Feedback `CardResumoRole` | `tituloLocal(partida) → tituloLocal(destino)` |
| Texto de share (`lib/convite.ts`) | Preferir `tituloLocal` / nome no 📍 se existir; senão endereço |

### 3.8 Payload Meus Rolês / público

**Público:** campos novos em §2.6 (`localSaidaNome`, `destinoFinalNome`, …).

**Meus Rolês** (`MeuRoleItem`): hoje só `localSaidaEndereco`. Adicionar:

```ts
localSaidaNome: string; // "" se vazio
```

A UI dos cards usa `tituloLocal({ nome: localSaidaNome, endereco: localSaidaEndereco })` para a linha de meta. Sem mudar nomes de campos existentes.

`paraMeuRoleItem` em `functions/src/lib/meus-roles.ts` preenche `localSaidaNome: role.localSaida.nome ?? ""`.

### 3.9 Fluxo do organizador

```
/criar-role
  → Preenche endereço (lista/GPS) — obrigatório
  → (Opcional) digita "Nome do local"
  → Publicar
        → POST /roles { localSaida: { lat, lng, endereco, nome }, ... }
        → Firestore grava nome (ou "")
  → Feed / convite / mini card mostram nome como título
  → Piloto toca Abrir no Maps → pino nas coords
```

---

## 4. Referência de Design

### 4.1 Criar rolê

Replicar tokens de `designs/criar-role/` / `globals.css`. O campo `nome` **não** existe no mock HTML — é acréscimo consciente no mesmo cartão:

- Mesmo `styles.input`, mesma altura `touch-min`.
- Label secundária: mesmo `styles.label` **ou** variante menor `on-surface-variant` + texto “(opcional)” — seguir o padrão de “Instruções do comboio” (opcional) se já houver hint similar; senão `label` + “opcional” em `on-surface-variant`.
- Espaço entre endereço e nome: ~8–12px (`gap` do cartão).
- Erro de `nome` (só se > 60 no client): inline sob o input, mesmo `styles.erroCampo`.

### 4.2 Convite — título + subtítulo

Alinhar ao mock `designs/compartilhar-role/code.html`:

```
Ponto de Encontro
  {nome || endereco}          ← itemTitulo
  Saída pontual às HHh        ← itemDetalhe (já existe)
  [map] Abrir no Maps         ← NOVO

Destino
  {nome || endereco}          ← itemTitulo
  {endereco se nome}          ← itemDetalhe / subtítulo cinza
  [map] Abrir no Maps         ← NOVO
```

Estender `ItemFicha` para aceitar `subtitulo?: string` e `acao?: ReactNode` (slot do botão maps), sem inflar demais — se passar de ~80 linhas, extrair `AcaoMapsFicha`.

### 4.3 Feed

Tokens de `designs/feed/`. Ícone maps discreto (`primary-container` / `on-surface-variant`), 48px de toque, **sem** card novo. Não transformar a rota num botão gigante.

### 4.4 Confirmação

Tokens de `designs/confirmacao-participacao/`. No `MiniCardRole`, o ponto pode ser linha + link maps à direita, ou o texto do ponto como link. Preferir ícone maps separado para não parecer que o card inteiro abre o Maps.

---

## 5. Arquitetura Next.js

Seguir a skill: componentes ~80 linhas, lógica em hooks, API em services, `"use client"` só com interatividade / browser APIs.

```
src/
├── lib/
│   ├── maps.ts                 # NOVO — urlAbrirMaps
│   └── localizacao.ts          # NOVO — tituloLocal, subtituloLocal
├── components/maps/
│   └── BotaoAbrirMaps.tsx      # NOVO — Client
├── app/(app)/criar-role/
│   ├── types.ts                # LocalizacaoForm.nome
│   ├── hooks/useCampoLocalizacao.ts
│   ├── hooks/useFormularioCriarRole.ts
│   └── components/CampoLocalizacao.tsx
├── app/(app)/feed/components/RotaRole.tsx
├── app/(app)/roles/[id]/participar/components/MiniCardRole.tsx
├── app/(app)/roles/[id]/feedback/components/CardResumoRole.tsx
├── app/(app)/meus-roles/...    # cards que mostram endereço de saída
├── app/(publico)/r/[id]/
│   ├── components/FichaTecnicaComboio.tsx
│   ├── components/ItemFicha.tsx
│   └── ...
└── types/role.ts, role-publico.ts, meus-roles.ts
```

| Peça | Tipo | Faz |
|------|------|-----|
| `urlAbrirMaps` | Lib pura | Monta URL (testável sem DOM) |
| `tituloLocal` | Lib pura | Regra de exibição |
| `BotaoAbrirMaps` | Client | `<a>` + ícone |
| `CampoLocalizacao` | Client | UI do nome + endereço |
| `useCampoLocalizacao` | Hook | Estado `nome` |
| Pages | Server | Sem mudança estrutural |

**Não** colocar montagem de URL inline em três componentes diferentes.

---

## 6. Backend — resumo de contratos

### 6.1 `Localizacao` (domínio)

```ts
{ lat: number; lng: number; endereco: string; nome: string }
```

Afeta: `Role`, `RolePublicacao`, `RoleModelo`, `RoleFeedItem`, `RoleDetalhe`, create/update.

### 6.2 Endpoints

| Endpoint | Mudança |
|----------|---------|
| `POST /roles` | Aceita `nome` em partida/destino; valida ≤ 60; default `""` |
| `PUT /roles/:id` (se existir update parcial de local) | Idem |
| `GET /roles` | Feed já devolve `Role` completo → `nome` vem de graça |
| `GET /roles/:id` | Idem |
| `GET /roles/:id/modelo` | Clone inclui `nome` |
| `GET /publico/roles/:id` | Novos campos flat (§2.6) |
| `GET /meus-roles` | `localSaidaNome` no item |

Sem rota nova. Sem índice Firestore novo (`nome` não é filtrado por equality — só entra no `q` em memória, como o endereço hoje).

### 6.3 Health / docs internos

Nenhuma function HTTP nova para listar no health.

---

## 7. Wireframes

### 7.1 Cartão Partida (criar rolê)

```
┌─────────────────────────────────┐
│ ◎ PARTIDA              [Meu GPS]│
│ ┌─────────────────────────────┐ │
│ │ Av. Brasil, 1000 - Centro…  │ │  ← endereço (autocomplete)
│ └─────────────────────────────┘ │
│ Nome do local (opcional)        │
│ ┌─────────────────────────────┐ │
│ │ Posto Shell km 24           │ │  ← NOVO
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### 7.2 Ficha do convite

```
┌─────────────────────────────────┐
│ 📍 PONTO DE ENCONTRO            │
│ Posto Shell km 24               │  ← nome (ou endereço)
│ ● Saída pontual às 07:00h       │
│ 🗺 Abrir no Maps                │  ← NOVO
├─────────────────────────────────┤
│ 🏁 DESTINO                      │
│ Mirante da Serra                │  ← nome
│ Campos do Jordão - SP, Rua…     │  ← endereço (se nome)
│ 🗺 Abrir no Maps                │  ← NOVO
└─────────────────────────────────┘
```

### 7.3 Feed — rota

```
◎ Partida
  Posto Shell km 24 (07:00)          [map]
┃
⚑ Destino
  Mirante da Serra                   [map]
```

---

## 8. Fora do Escopo

- Mapa embutido / polyline da rota no app.
- Autocomplete que sugere “nome” a partir do POI (Nominatim/Google Places name) — o piloto digita manualmente.
- Detectar iOS vs Android para URL específica da Apple.
- Navegação turn-by-turn / waypoints intermediários.
- Editar nome sem republicar (tela de edição de rolê) — só create/clone nesta spec; se já existir `PUT`, o validador já cobre.
- Geocodificar de novo ao abrir o Maps.
- Alterar Security Rules do Firestore (Admin SDK na function).
- Traduzir endereços; i18n.
- CTA “Abrir no Maps” nos cards compactos de Meus Rolês.

---

## 9. Critérios de Aceite

### Melhoria A — Abrir no Maps

- [ ] Existe `urlAbrirMaps` em `src/lib/maps.ts` usando Google Maps Search API universal.
- [ ] Com coords válidas, a URL usa `query={lat},{lng}`.
- [ ] Sem coords, usa `query` com nome (se houver) ou endereço.
- [ ] `BotaoAbrirMaps` abre em nova aba/`target=_blank` com `rel="noopener noreferrer"`.
- [ ] Feed: partida e destino têm ação de maps sem quebrar o link do card do rolê.
- [ ] Convite público: partida e destino têm “Abrir no Maps”.
- [ ] Mini card de participação: dá para abrir o ponto de encontro no Maps.
- [ ] `GET /publico/roles/:id` devolve lat/lng de partida e destino.
- [ ] Área de toque ≥ 48px; usável a partir de 360px.
- [ ] Sem SDK Google Maps JS; sem chave de API nova no front para esta feature.

### Melhoria B — Nome do local

- [ ] `Localizacao` inclui `nome: string` no front e no backend.
- [ ] Docs antigos sem `nome` leem como `""` (sem erro).
- [ ] Criar rolê: input “Nome do local (opcional)” em Partida e Destino Final, `maxLength` 60, mesmo cartão.
- [ ] `POST /roles` persiste `nome` (trim); omitido/`""` grava vazio; `> 60` → 400.
- [ ] Clone pré-preenche o nome.
- [ ] Feed, ficha do convite, mini card e resumo de feedback usam `tituloLocal` (nome se houver, senão endereço).
- [ ] Na ficha do convite, se houver nome, o endereço aparece como subtítulo (padrão do mock).
- [ ] Busca `q` do feed considera `localSaida.nome` e `destinoFinal.nome`.
- [ ] `RolePublico` e `MeuRoleItem` expõem o nome da saída (e destino no público).
- [ ] Share text do convite prefere o nome no 📍 quando existir.

### Geral / skill Next.js

- [ ] `"use client"` só em `BotaoAbrirMaps`, formulário e pontos que já eram Client.
- [ ] Componentes novos < ~80 linhas; URL e título em libs puras.
- [ ] CSS Modules + tokens existentes; sem inventar tema paralelo.
- [ ] Sem Firestore no client; sem `console.log` de debug novo.
- [ ] Página `page.tsx` continua orquestradora.

---

## 10. Arquivos Impactados

| Arquivo | Ação | Detalhe |
|---------|------|---------|
| `src/lib/maps.ts` | **NOVO** | `urlAbrirMaps` |
| `src/lib/localizacao.ts` | **NOVO** | `tituloLocal`, `subtituloLocal` |
| `src/components/maps/BotaoAbrirMaps.tsx` | **NOVO** | Link Maps |
| `src/types/role.ts` | **Alterar** | `Localizacao.nome` |
| `src/types/role-publico.ts` | **Alterar** | nome + lat/lng flat |
| `src/types/meus-roles.ts` | **Alterar** | `localSaidaNome` |
| `src/app/(app)/criar-role/types.ts` | **Alterar** | `LocalizacaoForm.nome` |
| `src/app/(app)/criar-role/hooks/useCampoLocalizacao.ts` | **Alterar** | estado/preencher nome |
| `src/app/(app)/criar-role/hooks/useFormularioCriarRole.ts` | **Alterar** | enviar `nome` no POST |
| `src/app/(app)/criar-role/components/CampoLocalizacao.tsx` | **Alterar** | input opcional |
| `src/app/(app)/criar-role/criar-role.module.css` | **Alterar** | espaçamento do campo nome se preciso |
| `src/app/(app)/feed/components/RotaRole.tsx` | **Alterar** | título + BotaoAbrirMaps |
| `src/app/(app)/roles/[id]/participar/components/MiniCardRole.tsx` | **Alterar** | título + maps |
| `src/app/(app)/roles/[id]/feedback/components/CardResumoRole.tsx` | **Alterar** | `tituloLocal` na rota |
| `src/app/(app)/meus-roles/components/*.tsx` | **Alterar** | exibir título amigável |
| `src/app/(app)/meus-roles/formatar-meus-roles.ts` | **Alterar** | mapear `localSaidaNome` |
| `src/lib/convite.ts` | **Alterar** | preferir nome no texto |
| `src/app/(publico)/r/[id]/components/FichaTecnicaComboio.tsx` | **Alterar** | título/subtítulo + maps |
| `src/app/(publico)/r/[id]/components/ItemFicha.tsx` | **Alterar** | subtítulo + slot ação |
| `functions/src/types/role.ts` | **Alterar** | `Localizacao.nome` |
| `functions/src/types/role-publico.ts` | **Alterar** | campos novos |
| `functions/src/types/meus-roles.ts` | **Alterar** | `localSaidaNome` |
| `functions/src/routes/roles.ts` | **Alterar** | validar/persistir `nome`; `bateBusca` |
| `functions/src/routes/roles-publico.ts` | **Alterar** | expor nome + coords |
| `functions/src/lib/meus-roles.ts` | **Alterar** | `localSaidaNome` |
| `functions/src/repositories/firestore/firestore-role.repository.ts` | **Alterar** | default `nome: ""` no `toRole` |

**Não** altera: geocode service, upload de capa, menu inferior, auth, notificações.

---

## 11. Checklist da skill Next.js

- [ ] `page.tsx` sem lógica nova de maps/nome.
- [ ] `"use client"` só onde há clique / formulário / hooks de browser.
- [ ] Libs puras para URL e rótulo (sem React).
- [ ] Um componente = uma coisa (`BotaoAbrirMaps`, campo, ficha).
- [ ] Sem abstração “mapa genérico pra futuro” (sem provider de mapa).
- [ ] CSS Modules + tokens de `globals.css` / DESIGN das telas tocadas.
- [ ] Sem `console.log` de debug.

---

## 12. Relação com o código / specs atuais

| Hoje | Nesta spec |
|------|------------|
| `Localizacao` só `lat/lng/endereco` | + `nome: string` |
| Convite: endereço como título único | Título amigável + subtítulo (como o mock 015) |
| SPEC 015 sem lat/lng no DTO público | Libera lat/lng (e nome) para abrir Maps |
| Endereço longo no feed | Preferência pelo `nome` no card |
| Sem deep link de mapas | `BotaoAbrirMaps` + `urlAbrirMaps` |
| Clone copia partida/destino | Passa a copiar `nome` automaticamente |

A geocodificação (SPEC 004) permanece a fonte de `endereco` + coords. O `nome` é **só** rótulo humano — não substitui o endereço na persistência nem no Haversine.
