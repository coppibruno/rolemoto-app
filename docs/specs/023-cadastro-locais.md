# SPEC 023 — Cadastro de Locais (admin) + catálogo

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-17  
> **Referência visual:** `designs/cadastro-locaais/` (`DESIGN.md`, `code.html`, `screen.png`)  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade  
> **Backend:** Cloud Function `api` (Express) — `POST /locais` (admin), `GET /locais` e `GET /locais/:id` (qualquer autenticado)  
> **Coleção Firestore:** `locais` (**nova**)  
> **Depende de:** SPEC 001 (shell + dock), SPEC 002 (perfil / `GET /perfil`), SPEC 004 (padrão de formulário + geocode + Storage), SPEC 019 (`urlAbrirMaps`), SPEC 022 (flag `users.admin`, `exigirAdmin`, menu do `+`)

---

## 1. Objetivo

Criar o **cadastro de pontos / locais oficiais** e o contrato HTTP correspondente.

**Local** não é rolê nem evento. Rolê tem partida → destino e comboio em estrada. Evento é encontro com data num destino fixo. Local é **ponto persistente no catálogo**: posto parceiro, bar / moto point, restaurante de estrada, oficina, mirante. Não tem data de ocorrência.

| Quem | Pode cadastrar | Pode visualizar os criados |
|------|----------------|----------------------------|
| Administrador (`users.admin === true`) | Sim — `/criar-local` + `POST /locais` | Sim — `/locais` + `GET` |
| Piloto comum | Não. Sem item no `+`, rota redireciona, API 403 | Sim — `/locais` + `GET` |

Administrador **não** se auto-promove no app. A flag `admin` entra **manualmente no Firestore** (`users/{uid}.admin = true`). A decisão de produto já está fechada (SPEC 022); esta spec **não** cria tela nem endpoint de promoção.

O `+` do dock:

- Piloto comum: continua indo direto para `/criar-role` (SPEC 001 / 004).
- Admin: abre um **menu âncora** com **Rolês**, **Eventos** e **Locais** — os três **ativos**. Locais deixa de ser “Em breve” (como a SPEC 022 deixou).

Esta spec é **full stack**:

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | UI do mock em `/criar-local`, guarda admin, dropdown do `+` (Locais ativo), validação, geocodificação, upload opcional da fachada, `POST /locais`, toast, redirect; catálogo `/locais` para qualquer autenticado |
| Back (Functions) | `exigirAdmin` no POST, validação do body, coleção `locais` só via repositório; GET liberado a qualquer Bearer |

`criadorId` **nunca** vem do body. Timestamps só no servidor. `admin` **nunca** vem do body de `POST`/`PUT /perfil`.

---

## 2. Recorte e princípios

### 2.1 O que entra

- Rota `/criar-local` alinhada a `designs/cadastro-locaais/`.
- Coleção `locais` + `POST /locais` (admin) + `GET /locais` e `GET /locais/:id` (autenticado).
- Catálogo `/locais` — listagem simples (sem mock próprio; tokens do design system).
- Dock: menu do `+` só para admin; item **Locais** navega para `/criar-local`.
- Flag `admin` no perfil / `exigirAdmin` / `MenuIncluir` — **reusar a SPEC 022**. Se a 022 ainda não estiver no código, esta spec implementa o pacote mínimo compartilhado (secção 4 e 6).

### 2.2 O que **não** entra

| Item | Motivo |
|------|--------|
| Mapa interativo com pins de todos os locais | Toast do mock é **copy visual**. Mapa de catálogo = spec futura |
| Escolher um local oficial ao criar rolê / evento | Autocomplete do catálogo no formulário de rolê = spec futura |
| Editar / apagar local | Sem UI no mock; PUT/DELETE ficam para spec futura |
| Salvar como rascunho | Sem coleção de rascunho; SPEC 004 / 022 iguais |
| Cadastro de Evento | SPEC 022. No menu, Eventos aponta para `/criar-evento` se a 022 existir; senão permanece “Em breve” |
| Mapa interativo (Google/Leaflet) no formulário | O mock **não** tem preview de mapa; Nominatim + GPS bastam |
| Custom claim `admin: true` do Auth | Fonte de verdade continua o **documento** `users` (SPEC 022) |
| Tela no app para promover admin | Inserção manual no Firestore |

### 2.3 Local vs evento vs rolê (não misturar)

| | Rolê (`roles`) | Evento (`eventos`) | Local (`locais`) |
|--|----------------|--------------------|------------------|
| Natureza | Comboio com data | Encontro com data | Ponto **permanente** |
| Rota | Partida + destino | Um único local | Um único ponto |
| Quem cria | Qualquer piloto autenticado | Só admin | Só admin |
| Ritmo | `tranquila \| moderada \| agressiva` | Não se aplica | Não se aplica |
| Categoria | — | Tipo de evento | Posto / bar / restaurante / oficina / mirante |
| Horário | Data/hora de saída | Abertura (e encerramento) **daquela** data | Funcionamento **recorrente** (24h ou faixa) |

Não gravar local na coleção `roles` nem em `eventos`. Não reusar `POST /roles` nem `POST /eventos`.

### 2.4 Desvios conscientes do mock

O HTML é estático. O documento precisa de coords para o catálogo e para “Abrir no Maps”.

| Mock | Nesta spec | Por quê |
|------|------------|---------|
| `history.back()` | Voltar / Cancelar → `/` | App Router; origem pode ser o login |
| Capa já preenchida (foto stock) | Dropzone **vazio** até anexar; foto **opcional** (“Recomendado”) | Sem arquivo → `fotoFachadaUrl: ""` |
| Chip **Mirante** já selecionado | Categoria **sem** seleção inicial | Obriga escolha consciente; o mock é estático |
| 3 facilidades já marcadas | Default **nenhuma** marcada | Idem |
| “Aberto 24 Horas” já ativo | Manter (default `aberto24h = true`) | Único default do mock que é escolha real de produto |
| Badge “Rolê Moto v2.4” | **Omitir** | Versão falsa; não existe no app |
| GPS só preenche o texto | GPS + reverse geocode + **lat/lng** persistidos | Sem coords o catálogo não abre no Maps |
| Endereço só texto livre | Texto + sugestões Nominatim **ou** GPS | Digitação livre sem coords **não** publica |
| “Disponível no mapa” no toast | Copy do toast; **sem** mapa novo | Evita SDK de mapa sem spec |
| Menu inferior no HTML isolado | Dock da SPEC 001 (já no layout) | Não duplicar |

Não adicionar campos que o mock não tem (telefone, site, avaliação, convênio, horário por dia da semana).

---

## 3. Referência de Design

Replicar `designs/cadastro-locaais/` (`code.html` + `screen.png`) **na tela de cadastro**. Não inventar outro layout. Tokens em `DESIGN.md` / `globals.css`.

O catálogo `/locais` **não** tem mock. Usar os mesmos tokens (cartão `surface-container`, chips, tipografia Barlow / Plus Jakarta, dock). Não desenhar um visual paralelo.

### O que entra nesta spec (do mock de cadastro)

- Header sticky: voltar + logo + **Criar Local** + avatar (link `/perfil`).
- Intro: badge **Painel Admin** (dot pulsante) + título **Cadastrar Ponto / Local** + subtítulo do mock.
- Formulário: Nome, Endereço + GPS, Categoria (chips), Facilidades, Horário (24h / específico), Link do Maps (opcional), Foto de fachada (recomendado), CTA **Salvar Local**, **Cancelar**.
- Toast de sucesso (**Ponto Homologado com Sucesso!**).

### Comportamento visual (do mock)

- Coluna única, gutter 16px, **max-width 560px** (shell `(app)`).
- Header 64px + `env(safe-area-inset-top)`, `surface` com blur.
- Cada bloco do form é um cartão `surface-container-low`, `rounded-xl`, padding `card-padding-md`.
- Labels uppercase `badge-label` em `primary` (`#ffb693`).
- Inputs: ícone **dentro** à esquerda (`storefront`, `pin_drop`, `share_location`); fundo `surface-container-highest`; focus `surface-bright`.
- Chips de categoria: pill; selecionado `primary-container` + `on-primary`; inativo `surface-container-highest`.
- Facilidades: linhas `surface-container-highest` com checkbox `accent-primary-container` e ícone à esquerda.
- Horário: segmented 2 colunas; ativo `primary-container`; inativo transparente. Faixa `06:00`–`22:00` só no modo específico.
- Foto: altura ~144px (`h-36`); overlay **Alterar / Subir Imagem** quando houver preview.
- CTA primário: 56px (`h-14`), gradiente `primary-container → secondary-container → primary-container`, ícone `verified`, Barlow Condensed uppercase, glow laranja.
- Cancelar: 48px, `surface-container-high`, sem borda chamativa.
- Padding inferior: dock + toast (~96px + 72px).

---

## 4. Flag `admin` (já definida)

A promoção manual no Firestore **já é a regra de produto**. Esta spec **não** redesenha o modelo.

### 4.1 Fonte de verdade (SPEC 022)

Campo booleano no documento `users/{uid}`:

```
admin: boolean   // default false; ausente = false
```

- **Promoção:** Console do Firebase → `users/{uid}` → `admin = true`.
- **Rebaixamento:** `admin = false` (ou apagar o campo).
- Pilotos antigos não precisam de migration: `Boolean(data.admin)`.

Independente do custom claim `admin: true` usado em `isAdmin()` para PUT/DELETE de **rolê**. Locais usam só o campo do perfil.

### 4.2 Estado atual do repositório

Hoje (`Usuario` em `src/types/user.ts` e `functions/src/types/usuario.ts`) o campo **ainda não é lido pelo mapper**. Documentos já podem ter `admin: true` no banco — o app ignora até o `GET /perfil` devolver a flag.

Se a SPEC 022 **já tiver** aterrissado `admin` no tipo, no mapper, no `POST /perfil` (`admin: false` fixo), no strip do `PUT /perfil` e no `exigirAdmin`, **não repetir** esse trabalho. Só consumir `usuario.admin`.

Se a 022 **não** estiver no branch, esta spec inclui o pacote mínimo:

| Operação | `admin` |
|----------|---------|
| `POST /perfil` (primeiro acesso) | Sempre grava `admin: false`. Ignora se vier no body |
| `PUT /perfil` | **Não** atualiza `admin`. Strip do body |
| `GET /perfil` | Devolve `admin: boolean` |
| Front (`Usuario`) | `usuario.admin` alimenta dock + guarda de `/criar-local` |
| `POST /locais` | `exigirAdmin`: `users/{uid}.admin === true` |

Depois de setar `admin: true` no banco, o admin precisa **recarregar o perfil** (`recarregarPerfil` ou reabrir o app). Sem listener em tempo real.

---

## 5. Fluxo do usuário

```
Grupo (app) — autenticado com perfil (GuardaApp)
  │
  ├── Piloto comum
  │     [ + ]  →  /criar-role
  │     /criar-local  →  redirect `/`
  │     /locais       →  catálogo (somente leitura)
  │
  └── Admin (usuario.admin === true)
        [ + ]  →  abre MenuIncluir
              ├── Rolês    →  /criar-role
              ├── Eventos  →  /criar-evento   (ou “Em breve” se 022 não existir)
              └── Locais   →  /criar-local
                    │
                    ▼
              Tela /criar-local (vazia; 24h ligado; categoria sem seleção;
                                 facilidades nenhuma; foto vazia)
                    │
                    ├── Preenche campos
                    ├── Endereço: texto + sugestões OU [Usar Meu GPS]
                    ├── Foto: anexa JPG/PNG (opcional)
                    ├── Salvar Local
                    │     ├── Inválido → erros inline (não chama API)
                    │     └── Válido
                    │           ├── Upload Storage se houver foto
                    │           └── POST /locais
                    │                 ├── 201 → toast + redirect `/locais` (~1,6s)
                    │                 ├── 400 → erros / mensagem da API
                    │                 ├── 403 → não é admin
                    │                 └── 401 → GuardaApp / login
                    └── Cancelar / voltar → `/`
```

- Sem rascunho; sair da tela perde o form.
- Avatar → `/perfil`.
- Usuário comum **não vê** Locais no `+`.
- Entrada do catálogo para o comum: link **Pontos oficiais** no feed (secção 9.7).

---

## 6. Dock — menu do `+` (admin)

Mesma escolha da SPEC 022: **popover âncora acima do FAB**, não bottom sheet.

Se a 022 já tiver `MenuIncluir` / `ItemMenuIncluir` / `useMenuIncluir`, esta spec **só ativa** o item Locais (tira `aria-disabled` e “Em breve”, coloca `href="/criar-local"`).

Se a 022 não estiver no código, implementar o menu completo aqui — comportamento abaixo.

### 6.1 Comportamento

| Perfil | Toque no `+` |
|--------|----------------|
| Comum | `Link` para `/criar-role` (hoje) |
| Admin | Toggle do menu. Não navega no primeiro toque |

- Aberto: card acima do FAB, alinhado ao centro da coluna do `+`, `z-index` acima do dock.
- Backdrop `surface` 40% fecha o menu (toque fora, `Escape`).
- Segundo toque no `+` fecha.
- **Rolês** → `/criar-role`; **Eventos** → `/criar-evento` (ou desabilitado se a rota não existir); **Locais** → `/criar-local`.
- Fecha ao navegar.
- FAB destacado (`fabDestacado`) em `/criar-role`, `/criar-evento` (se existir) **e** `/criar-local`.

### 6.2 Visual do menu

```
┌─────────────────────────────────┐
│  🏍️  Rolê                       │
│      Comboio com partida e rota │
├─────────────────────────────────┤
│  🚩  Evento                     │
│      Encontro no destino fixo   │
├─────────────────────────────────┤
│  📍  Local                      │
│      Pontos cadastrados         │
└─────────────────────────────────┘
                ▼
             (  +  )
```

- Fundo `surface-container-high`, borda `1px solid rgba(255, 107, 0, 0.22)` (Layer 2 do DESIGN.md).
- `rounded-xl`, sombra `0 8px 24px rgba(0,0,0,0.45)`.
- Cada linha: altura ≥ 48px; ícone 24px; título Barlow Condensed uppercase; subtítulo `body-sm` `on-surface-variant`.
- Ícones: Rolê `two_wheeler`; Evento `flag`; Local `location_on`.
- Largura ~ min(280px, 100vw − 32px). Não ultrapassar o max-width 560px do shell.
- Locais **não** fica com opacidade 50% — é item de primeira classe nesta spec.

### 6.3 Acessibilidade do menu

- `+` admin: `aria-label="Incluir"`, `aria-haspopup="menu"`, `aria-expanded`.
- Menu: `role="menu"`; itens `role="menuitem"`.
- Foco no primeiro item ao abrir; Tab cicla; Escape fecha e devolve foco ao `+`.

---

## 7. Arquitetura Next.js

Seguir a skill: página orquestradora, componentes ~80 linhas, lógica em hooks, API em service. `"use client"` só com estado, submit, file picker, geolocalização ou `useAuth`.

A criação **não** é Server Action: Bearer no client (`auth.currentUser`) e GPS em `navigator.geolocation`.

### 7.1 Pages como Server Components

```tsx
// src/app/(app)/criar-local/page.tsx — Server Component
import { TelaCriarLocal } from "./components/TelaCriarLocal";

const CriarLocalPage = () => {
  return (
    <main>
      <TelaCriarLocal />
    </main>
  );
};

export default CriarLocalPage;
```

```tsx
// src/app/(app)/locais/page.tsx — Server Component
import { TelaLocais } from "./components/TelaLocais";

const LocaisPage = () => {
  return (
    <main>
      <TelaLocais />
    </main>
  );
};

export default LocaisPage;
```

`TelaCriarLocal` (via `GuardaAdmin`) redireciona para `/` se `!usuario.admin`.  
`TelaLocais` **não** exige admin — qualquer perfil autenticado.

### 7.2 Estrutura por feature

Cadastro:

```
src/app/(app)/criar-local/
├── page.tsx                              # Server — orquestrador
├── components/
│   ├── TelaCriarLocal.tsx                # Client — guarda admin + composição
│   ├── CabecalhoCriarLocal.tsx
│   ├── IntroPainelAdmin.tsx              # badge + título + subtítulo
│   ├── FormularioCriarLocal.tsx
│   ├── CampoNomeLocal.tsx
│   ├── CampoEnderecoLocal.tsx            # input + GPS + sugestões
│   ├── SugestoesEndereco.tsx
│   ├── SeletorCategoriaLocal.tsx         # chips exclusivos
│   ├── ListaFacilidades.tsx              # checkboxes
│   ├── SeletorHorarioLocal.tsx           # 24h vs específico
│   ├── CampoLinkMaps.tsx
│   ├── FotoFachada.tsx
│   ├── BotaoSalvarLocal.tsx
│   ├── BotaoCancelar.tsx
│   └── ToastSucesso.tsx
├── hooks/
│   ├── useFormularioCriarLocal.ts
│   ├── useFotoFachada.ts
│   └── useCampoEnderecoLocal.ts
├── constants.ts
└── criar-local.module.css
```

Catálogo:

```
src/app/(app)/locais/
├── page.tsx                              # Server — orquestrador
├── components/
│   ├── TelaLocais.tsx                    # Client — fetch + composição
│   ├── CabecalhoLocais.tsx
│   ├── ListaLocais.tsx
│   ├── LocalCard.tsx
│   ├── EstadoVazioLocais.tsx
│   └── EstadoCarregandoLocais.tsx
├── hooks/
│   └── useListaLocais.ts
├── services/
│   └── locais.service.ts                 # listar, buscarPorId, criar
└── locais.module.css
```

`criar-local` **importa** `locais.service` de `../locais/services/` — segundo uso real do mesmo recurso; um único service. Não duplicar o client HTTP.

Dock (compartilhado; criar ou alterar o que a 022 já tiver):

```
src/components/menu-inferior/
├── BotaoIncluir.tsx                      # Alterar — Link OU menu
├── MenuIncluir.tsx                       # Novo ou alterar — Locais ativo
├── ItemMenuIncluir.tsx
├── hooks/useMenuIncluir.ts
├── hooks/useItemMenuAtivo.ts             # Alterar — destacar /criar-local
└── menu-inferior.module.css
```

Guarda admin compartilhada (se a 022 não tiver criado):

```
src/app/(app)/components/GuardaAdmin.tsx
```

Geocode: `criar-role/services/geocode.service.ts` e `feed/services/geocode.service.ts` já são **dois usos reais**. **Extrair** para `src/lib/geocode.ts` e apontar rolê, feed e locais para lá. Sem isso, não importar o service de uma rota irmã no cadastro de local.

Não importar CSS de `criar-role/` nem de `criar-evento/`: o local desta tela tem ícone **dentro** do input e cartões `surface-container-low`. Duplicar o padrão visual no CSS da feature.

### 7.3 Responsabilidades

| Peça | Tipo | Faz |
|------|------|-----|
| `criar-local/page.tsx` | Server | Só monta `TelaCriarLocal` |
| `TelaCriarLocal` | Client | Se `!admin` → `router.replace("/")`; senão header + form |
| `FormularioCriarLocal` | Client | Markup; chama o hook |
| `useFormularioCriarLocal` | Hook | Campos, `erros`, `salvando`, `salvar` |
| `useFotoFachada` | Hook | JPG/PNG, ObjectURL, upload opcional |
| `useCampoEnderecoLocal` | Hook | GPS, debounce, sugestão, coords |
| `locais.service` | Service | `criar` / `listar` / `buscarPorId` via `api` — **sem** Firestore no client |
| `TelaLocais` | Client | Lista para qualquer autenticado; CTA “Cadastrar” só se `admin` |
| `MenuIncluir` | Client | Só se `usuario.admin` |

**Não misturar** no mesmo arquivo: JSX + validação + `fetch` + Storage + Nominatim.

---

## 8. Contrato dos campos (front)

```ts
export type CategoriaLocal =
  | "posto"
  | "bar_moto_point"
  | "restaurante_estrada"
  | "oficina"
  | "mirante";

export type FacilidadeLocal =
  | "patio_amplo_50"
  | "calibrador_alta_pressao"
  | "banheiros_limpos"
  | "conveniencia_cafe"
  | "wifi_aberto"
  | "cameras_24h";

export type CriarLocalForm = {
  nome: string;
  endereco: string;
  lat: number | null;
  lng: number | null;
  categoria: CategoriaLocal | null;
  facilidades: FacilidadeLocal[];
  aberto24h: boolean;
  horaAbertura: string;     // HH:mm — só vale se !aberto24h
  horaFechamento: string;   // HH:mm — só vale se !aberto24h
  linkMaps: string;
  photoFile: File | null;
};
```

Chips de categoria (labels do mock):

| Valor | Label | Ícone (chip / card) |
|-------|-------|---------------------|
| `posto` | Posto | `local_gas_station` |
| `bar_moto_point` | Bar & Moto Point | `sports_bar` |
| `restaurante_estrada` | Restaurante Estrada | `restaurant` |
| `oficina` | Oficina | `build` |
| `mirante` | Mirante | `landscape` |

Facilidades (multi, todas opcionais; default **nenhuma**):

| Valor | Label | Ícone |
|-------|-------|-------|
| `patio_amplo_50` | Pátio Amplo para 50+ Motos | `two_wheeler` |
| `calibrador_alta_pressao` | Calibrador de Alta Pressão Grátis | `tire_repair` |
| `banheiros_limpos` | Banheiros Limpos | `shower` |
| `conveniencia_cafe` | Loja de Conveniência / Café Expresso | `local_cafe` |
| `wifi_aberto` | Wi-Fi Aberto | `wifi` |
| `cameras_24h` | Câmeras de Monitoramento 24h | `videocam` |

Horário: default **Aberto 24 Horas**. Ao trocar para **Específico**, mostrar os dois `type="time"` com valores iniciais `06:00` e `22:00` (como o mock). Trocar de volta para 24h esconde os times e ignora os valores no submit.

Body enviado à API (após upload opcional):

```ts
export type LocalPublicacao = {
  nome: string;
  endereco: string;
  lat: number;
  lng: number;
  categoria: CategoriaLocal;
  facilidades: FacilidadeLocal[];
  aberto24h: boolean;
  horaAbertura: string | null;    // "HH:mm" ou null
  horaFechamento: string | null;
  linkMaps: string;               // "" se vazio
  fotoFachadaUrl: string;         // "" se sem foto
};
```

`criadorId`, `id`, `createdAt`, `updatedAt` **não** vão no body.

### 8.1 Validação (cliente)

Validar no submit. Erro **no campo**. Bordas `--error`.

| Campo | Obrigatório | Regra | Mensagem |
|-------|-------------|-------|----------|
| Nome | Sim | `trim().length` 3–80 | “Informe o nome do local” / “Mínimo 3 caracteres” |
| Endereço | Sim | trim ≥ 3 **e** lat/lng válidos | “Informe o endereço” / “Escolha um endereço da lista ou use o GPS” |
| Categoria | Sim | um dos 5 valores | “Selecione a categoria do local” |
| Facilidades | Não | subset do enum; sem duplicata | — |
| Horário 24h | Sim (sempre há default) | boolean | — |
| Abertura / fechamento | Se `!aberto24h` | ambos `HH:mm` | “Informe o horário de funcionamento” |
| Link Maps | Não | se preenchido, URL `http:` ou `https:`, trim ≤ 500 | “Informe um link válido (https://…)” |
| Foto | Não | se houver arquivo, JPG/PNG ≤ 10 MB | “Use JPG ou PNG de até 10 MB” |

Digitação livre no endereço **não** basta: sem coords não publica.

`horaFechamento` **pode** ser menor que `horaAbertura` (bar que fecha de madrugada, ex. 18:00–02:00). Não recusar esse caso.

### 8.2 Foto: Storage vs API

1. Sem arquivo → `fotoFachadaUrl: ""` e **não** chama Storage.
2. Com arquivo válido → `uploadFotoFachadaLocal(uid, file)` → URL pública.
3. POST recebe só `fotoFachadaUrl`. A function **não** recebe multipart.
4. Path: `locais/fachadas/{uid}/{uuid}.jpg`.

### 8.3 Endereço + GPS

Mesma família da SPEC 004 (Nominatim, debounce ~300 ms, escolha da lista ou GPS).

**GPS:** `getCurrentPosition` → reverse geocode; se o reverse falhar, label `"Sua localização"` + coords (endereço válido). Permissão negada: erro no campo. Botão do mock: label **Usar Meu GPS (Detectar Ponto)**, ícone `my_location`, largura total, altura 44–48px.

O mock **não** tem preview de mapa — **não** adicionar mosaico OSM nesta tela.

O campo opcional **Ponto de Referência / Link do Google Maps** é texto livre (URL). Não substitui lat/lng. No catálogo, o card usa `linkMaps` se preenchido; senão `urlAbrirMaps({ lat, lng, endereco, nome })` da SPEC 019.

---

## 9. Implementação front (detalhes)

### 9.1 Service

```ts
// src/app/(app)/locais/services/locais.service.ts
import { api } from "@/lib/api";
import type { Local, LocalPublicacao } from "@/types/local";

export const locaisService = {
  listar: () => api<Local[]>("/locais"),

  buscarPorId: (id: string) => api<Local>(`/locais/${id}`),

  criar: (dados: LocalPublicacao) =>
    api<Local>("/locais", {
      method: "POST",
      body: JSON.stringify(dados),
    }),
};
```

Usar `api` (Bearer automático). Um único `salvando` no hook de cadastro. Tratar `ApiError` (400/401/403).

### 9.2 Hook (esqueleto do submit)

```ts
const salvar = async () => {
  const erros = validar(campos);
  if (Object.keys(erros).length > 0) {
    setErros(erros);
    return;
  }

  setSalvando(true);
  try {
    const fotoFachadaUrl = photoFile
      ? await foto.enviar(uid)
      : "";

    await locaisService.criar({
      nome: nome.trim(),
      endereco: endereco.trim(),
      lat: lat!,
      lng: lng!,
      categoria: categoria!,
      facilidades,
      aberto24h,
      horaAbertura: aberto24h ? null : horaAbertura,
      horaFechamento: aberto24h ? null : horaFechamento,
      linkMaps: linkMaps.trim(),
      fotoFachadaUrl,
    });

    setSucesso(true);
    // ~1600ms → router.push("/locais")
  } catch {
    setErroGeral(mensagemDaApiOuGenerica);
  } finally {
    setSalvando(false);
  }
};
```

CTA enquanto `salvando`: ícone `autorenew` girando + **Salvando...**. Inputs e botões `disabled`.

### 9.3 Foto de fachada

- Vazio: área ~144px, ícone `add_a_photo` + “Toque para anexar a foto de fachada” + hint **Recomendado** (não obrigatório).
- Preenchido: `object-fit: cover`, overlay **Alterar / Subir Imagem**, `close` para remover (para a propagação).
- `input type="file"` oculto; `aria-label="Anexar foto de fachada ou pátio"`.
- Remover volta ao vazio — submit **continua válido**.

### 9.4 Tokens CSS

CSS Modules em `criar-local.module.css` e `locais.module.css`. Sem hex solto no TSX.

| Token | Uso |
|-------|-----|
| `--surface` / `--surface-container` / `-low` / `-high` / `-highest` / `-lowest` | Página, cartões, inputs, toast, menu, cards do catálogo |
| `--primary` | Labels / badge Painel Admin |
| `--primary-container` | CTA, chips/horário ativos, FAB, toast |
| `--secondary-container` | Meio do gradiente do CTA |
| `--on-surface` / `--on-surface-variant` | Texto / hints |
| `--outline` | Ícones dentro do input; label do link opcional |
| `--error` | Borda e texto de erro |
| `--gutter-md` / `--touch-min` / `--touch-target` | Espaçamento e toque |

Tipografia: Barlow Condensed em títulos/CTA/badges; Plus Jakarta Sans no body. Ícones: Material Symbols Outlined.

### 9.5 Acessibilidade da tela de cadastro

- Voltar: `aria-label="Voltar para os rolês"`.
- `label` + `htmlFor` em cada input.
- GPS: `aria-label="Usar minha localização atual"`.
- Categoria: `role="radiogroup"` + `aria-checked`.
- Horário 24h / específico: idem.
- Facilidades: `label` envolvendo o checkbox.
- Erros: `aria-invalid` + `aria-describedby`.
- Toast: `role="status"`.
- Foto: `alt` descritivo no preview.
- Toque ≥ 48px; CTA 56px.
- `disabled` enquanto `salvando`.
- Sugestões: `role="listbox"` / `option`.

### 9.6 Header do cadastro

- `Link` para `/` (não `history.back()`).
- Título visível: **Criar Local**.
- Sem sino.
- Avatar: `usuario.fotoUrl` → `/perfil`.

### 9.7 Catálogo `/locais` (visualização)

Sem mock. Tela **simples**, cockpit 560px.

**Header:** voltar (`/`) + título **Locais oficiais** +, se `usuario.admin`, botão ícone `add` (`aria-label="Cadastrar local"`) → `/criar-local`.

**Lista:** um card por local, ordem **nome A–Z**.

Cada `LocalCard`:

- Foto 16:9 se `fotoFachadaUrl`; senão placeholder com ícone da categoria.
- Chip da categoria (label da tabela).
- Nome (`headline-sm`).
- Endereço (`body-sm`, `on-surface-variant`).
- Horário: “Aberto 24 horas” **ou** `horaAbertura–horaFechamento`.
- Até 3 ícones de facilidades + “+N” se passar de 3.
- Ação **Abrir no Maps** (`urlAbrirMaps` ou `linkMaps`), toque ≥ 48px (SPEC 019).

**Vazio:** ícone `location_off` + “Nenhum ponto oficial ainda.” Admin vê CTA **Cadastrar o primeiro local**. Comum só vê o texto.

**Entrada no feed:** no `PainelLocalizacao` (ou logo abaixo), link compacto **Pontos oficiais** → `/locais`. Não redesenhar o feed. Sem aba nova no dock (já tem 5 itens).

Não criar `/locais/[id]` nesta spec. O card é auto-contido. `GET /locais/:id` existe para o futuro.

---

## 10. Backend

Rotas **não** importam Firestore. Persistência só em `repositories/firestore/`. Não usar `onCall`. Function HTTP única `api`.

### 10.1 Tipos

```ts
// functions/src/types/local.ts
export type CategoriaLocal =
  | "posto"
  | "bar_moto_point"
  | "restaurante_estrada"
  | "oficina"
  | "mirante";

export type FacilidadeLocal =
  | "patio_amplo_50"
  | "calibrador_alta_pressao"
  | "banheiros_limpos"
  | "conveniencia_cafe"
  | "wifi_aberto"
  | "cameras_24h";

export interface Local {
  id: string;
  nome: string;
  endereco: string;
  lat: number;
  lng: number;
  categoria: CategoriaLocal;
  facilidades: FacilidadeLocal[];
  aberto24h: boolean;
  horaAbertura: string | null;
  horaFechamento: string | null;
  linkMaps: string;
  fotoFachadaUrl: string;
  criadorId: string;
  createdAt: string;
  updatedAt: string;
}

export type LocalPublicacao = Omit<
  Local,
  "id" | "criadorId" | "createdAt" | "updatedAt"
>;

export type LocalCreate = LocalPublicacao & { criadorId: string };
```

Front: `src/types/local.ts` com os mesmos tipos de domínio (+ `LocalPublicacao`).

### 10.2 Middleware `exigirAdmin`

Reusar `functions/src/middleware/exigir-admin.ts` da SPEC 022. Se ainda não existir, criar:

```
1. uid = req.usuario.uid
2. perfil = await usuarioRepository.buscarPorId(uid)
3. se !perfil → 403 { erro: "Perfil não encontrado" }
4. se perfil.admin !== true → 403 { erro: "Apenas administradores podem cadastrar locais" }
5. next()
```

Não usar `usuario.claims.admin` nesta rota.

Aplicar **somente** em `POST /locais`. `GET` não usa.

Mensagem 403 pode ser genérica (“Apenas administradores”) — o mesmo middleware serve evento e local.

### 10.3 Documento gravado (`locais/{id}`)

```
{
  nome: string,
  endereco: string,
  lat: number,
  lng: number,
  categoria: CategoriaLocal,
  facilidades: string[],
  aberto24h: boolean,
  horaAbertura: string | null,     // "HH:mm" — NÃO timestamp
  horaFechamento: string | null,
  linkMaps: string,
  fotoFachadaUrl: string,
  criadorId: string,
  createdAt: timestamp,
  updatedAt: timestamp             // = createdAt na criação
}
```

Horário de funcionamento é **recorrente**, não um instante. Persistir como string `HH:mm` (ou `null`). Não converter para `Timestamp`.

**Não gravar:** ritmo, partida/destino de rolê, data de evento, participantes, `admin` do criador, campos extras do body.

### 10.4 Validação do POST (antes do repositório)

| Campo | Regra | 400 |
|-------|--------|-----|
| `nome` | string, trim 3–80 | `{ erro: "nome é obrigatório" }` |
| `endereco` | string, trim ≥ 3 | `{ erro: "endereco inválido" }` |
| `lat` | number ∈ \[-90, 90\] | `{ erro: "local inválido" }` |
| `lng` | number ∈ \[-180, 180\] | `{ erro: "local inválido" }` |
| `categoria` | um dos 5 | `{ erro: "categoria inválida" }` |
| `facilidades` | array; cada item no enum; sem duplicata | `{ erro: "facilidades inválidas" }` |
| `aberto24h` | boolean | `{ erro: "aberto24h inválido" }` |
| `horaAbertura` / `horaFechamento` | se `aberto24h` → ambos `null`; senão ambos `HH:mm` | `{ erro: "horario inválido" }` |
| `linkMaps` | string ou ausente; se trim > 0, URL http(s) ≤ 500 | `{ erro: "linkMaps inválido" }` |
| `fotoFachadaUrl` | string (pode `""`) | `{ erro: "fotoFachadaUrl inválida" }` |

Campos extras (`criadorId`, `id`, `admin`, …) **não** são persistidos. Payload = objeto validado + `criadorId` do token.

`facilidades` ausente → `[]`. `linkMaps` / `fotoFachadaUrl` ausentes → `""`.

Não validar se a URL da foto existe no Storage. Não validar se o link do Maps abre.

Regex de hora: `/^([01]\d|2[0-3]):[0-5]\d$/`.

### 10.5 Repositório

```
functions/src/repositories/interfaces/local.repository.ts
functions/src/repositories/firestore/firestore-local.repository.ts
```

Exportar `localRepository` em `repositories/index.ts`.

```ts
interface LocalRepository {
  criar(dados: LocalCreate): Promise<Local>;
  listar(): Promise<Local[]>;
  buscarPorId(id: string): Promise<Local | null>;
}
```

`criar`:

- `add` na coleção `locais`.
- `createdAt` / `updatedAt` = `FieldValue.serverTimestamp()`.
- Relê o doc e devolve `Local` (ISO só em `createdAt` / `updatedAt`).

`listar`: todos os documentos, ordenar por `nome` asc. Índice Firestore se a query exigir (`nome` ascendente).

Mapper: `Timestamp` ↔ ISO só nos timestamps do doc. `horaAbertura` / `horaFechamento` passam como string ou `null`.

### 10.6 Router

```
functions/src/routes/locais.ts
```

`app.use("/locais", locaisRouter)` em `index.ts`.

```
GET  /locais
     autenticar
     200 → Local[] (nome A–Z)
     401 → token

GET  /locais/:id
     autenticar
     200 → Local
     404 → { erro: "Local não encontrado" }
     401 → token

POST /locais
     autenticar + exigirAdmin
     Body: LocalPublicacao
     201 → Local completo (id, criadorId, ISO)
     400 → validação
     401 → token
     403 → não admin / sem perfil
     500 → responderErro
```

Qualquer piloto autenticado **lê**. Só admin **escreve**.

Filtro por raio / categoria **não** entra nesta spec — o GET devolve o catálogo inteiro. O feed futuro (mapa / “locais num raio”) aplica Haversine no client ou numa query nova.

Registrar `"/locais"` e `"/locais/:id"` no JSON de `GET /` da `api`.

### 10.7 PUT / DELETE

Fora. Não criar handlers vazios.

---

## 11. Visualização (piloto comum)

Regra de produto: o comum **não cadastra**, **vê** o que o admin homologou.

Nesta spec isso significa:

1. `GET /locais` e `GET /locais/:id` liberados para qualquer Bearer válido.
2. Tela `/locais` — catálogo em cards (secção 9.7). Sem botão de cadastrar para o comum.
3. Link **Pontos oficiais** no feed.

Aceite **exige** o piloto comum abrir `/locais` e ver o ponto recém-criado (depois do 201). Não exige mapa.

---

## 12. Wireframes

### 12.1 Cadastro (admin)

```
┌─────────────────────────────────┐
│  ←  [logo] CRIAR LOCAL     (👤) │  header sticky
├─────────────────────────────────┤
│  [● Painel Admin]               │
│  CADASTRAR PONTO / LOCAL        │
│  Pontos oficiais de encontro,   │
│  postos parceiros, bases…       │
├─────────────────────────────────┤
│  NOME DO LOCAL / PONTO *        │
│  [ 🏪 ........................] │
│                                 │
│  ENDEREÇO COMPLETO & RODOVIA *  │
│  [ 📍 ........................] │
│  [ ◎ USAR MEU GPS (DETECTAR) ]  │
│                                 │
│  CATEGORIA DO LOCAL *           │
│  [Posto] [Bar & Moto Point]     │
│  [Restaurante] [Oficina]        │
│  [Mirante]                      │
│                                 │
│  ESTRUTURA & FACILIDADES        │
│  [ ] Pátio amplo …              │
│  [ ] Calibrador …               │
│                                 │
│  HORÁRIO DE FUNCIONAMENTO *     │
│  [Aberto 24h*] [Específico]     │
│                                 │
│  LINK DO GOOGLE MAPS    opcional│
│  [ 🔗 https://maps.app.goo.gl/] │
│                                 │
│  FOTO DE FACHADA / PÁTIO  recom.│
│  [  Toque para anexar…        ] │
│                                 │
│  ┌─────────────────────────┐    │
│  │ ✓  SALVAR LOCAL         │    │
│  └─────────────────────────┘    │
│  [      CANCELAR           ]    │
│                                 │
│  [✓ Ponto homologado!]          │  toast (após 201)
└─────────────────────────────────┘
│  🏍️  …      ( + )      …  👤   │  dock
└─────────────────────────────────┘
```

### 12.2 Menu do `+` (somente admin)

```
          ┌──────────────────────┐
          │ 🏍️ Rolê              │
          │ 🚩 Evento            │
          │ 📍 Local             │
          └──────────────────────┘
                   ( + )
```

Piloto comum: sem este card; `+` = criar rolê.

### 12.3 Catálogo `/locais` (admin e comum)

```
┌─────────────────────────────────┐
│  ←  LOCAIS OFICIAIS        [+]  │  [+] só admin
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │ [foto / ícone]  POSTO   │    │
│  │ Posto Shell Rodoanel    │    │
│  │ Rod. Mário Covas, Km 42 │    │
│  │ Aberto 24 horas         │    │
│  │ 🏍️ 🔧 🚿   Abrir no Maps│    │
│  └─────────────────────────┘    │
│  …                              │
└─────────────────────────────────┘
```

---

## 13. Fora do escopo

- Mapa com todos os pontos / pins / clustering.
- Autocomplete de locais oficiais em criar rolê / evento.
- Rascunho / autosave.
- Editar ou excluir local.
- Horário por dia da semana, telefone, site, convênio, avaliação.
- Push FCM (“novo ponto perto de você”).
- Mapa interativo, pins arrastáveis, Google Maps JS no form.
- Tela ou endpoint para promover admin.
- Unificar custom claim `admin` do Auth com a flag do perfil.
- Misturar locais no `GET /roles` ou `GET /eventos`.
- Detalhe `/locais/[id]`.

---

## 14. Critérios de aceite

### Admin e perfil

- [ ] `GET /perfil` devolve `admin` (implementar aqui só se a 022 não tiver feito).
- [ ] `PUT /perfil` não altera `admin` mesmo se o client mandar `true`.
- [ ] Promoção: setar `admin: true` no Firestore; após recarregar o perfil, o dock muda.

### Dock

- [ ] Comum: `+` navega para `/criar-role`; sem menu Rolês/Eventos/Locais.
- [ ] Admin: `+` abre popover com Rolês, Eventos e Locais.
- [ ] Rolês → `/criar-role`; Locais → `/criar-local`.
- [ ] Eventos → `/criar-evento` se a 022 existir; senão “Em breve”, sem navegação.
- [ ] Locais **não** está desabilitado.
- [ ] Escape / toque fora fecha o menu.
- [ ] FAB destacado em `/criar-local`.

### Front — cadastro

- [ ] `/criar-local` segue o mock (header, painel admin, nome, endereço+GPS, chips, facilidades, horário, link Maps, foto, CTA, cancelar, toast).
- [ ] Sem badge de versão “v2.4”.
- [ ] Comum em `/criar-local` é redirecionado para `/` (sem flash longo do form).
- [ ] Obrigatórios: nome, endereço+coords, categoria, modo de horário (24h default).
- [ ] Facilidades multi opcional (default nenhuma); foto e link Maps opcionais.
- [ ] Submit inválido: erro por campo, sem Storage nem POST.
- [ ] Foto JPG/PNG ≤ 10 MB; upload **só** se houver arquivo; path `locais/fachadas/{uid}/{uuid}.jpg`.
- [ ] Sem foto: POST com `fotoFachadaUrl: ""`.
- [ ] GPS e Nominatim no endereço; sem coords → sem POST.
- [ ] Sem preview de mapa no formulário.
- [ ] Sucesso: 201, toast **Ponto Homologado com Sucesso!**, redirect `/locais` ~1,6s.
- [ ] Falha API: mensagem geral, sem toast de sucesso, permanece na tela.
- [ ] `page.tsx` Server; Client só com interatividade.
- [ ] Componentes ~80 linhas; validação no hook; POST no service.
- [ ] Sem `addDoc` / escrita Firestore no client.
- [ ] Toque ≥ 48px; usável a partir de 360px; conteúdo acima do dock.

### Front — catálogo

- [ ] `/locais` acessível a comum e admin.
- [ ] Cards com nome, categoria, endereço, horário, facilidades (resumo), Abrir no Maps.
- [ ] Botão cadastrar / `+` no header **só** para admin.
- [ ] Feed tem o link **Pontos oficiais** → `/locais`.
- [ ] Depois de um POST 201, o novo ponto aparece na lista (nome A–Z).
- [ ] Vazio: copy + CTA de cadastro apenas para admin.

### Back

- [ ] `POST /locais` exige Bearer **e** `users.admin === true`.
- [ ] Piloto comum no POST → **403**.
- [ ] `criadorId` só do token; timestamps só no servidor.
- [ ] 400 nos campos inválidos (nome, endereço, coords, categoria, horário, link).
- [ ] `facilidades` pode ser `[]`; `fotoFachadaUrl` e `linkMaps` podem ser `""`.
- [ ] `aberto24h: true` grava `horaAbertura` / `horaFechamento` = `null`.
- [ ] Horário específico aceita fechamento < abertura (vira a noite).
- [ ] 201 devolve `Local` completo no schema desta spec.
- [ ] Body não grava outro uid nem `admin`.
- [ ] Persistência só em `FirestoreLocalRepository`.
- [ ] `GET /locais` e `GET /locais/:id` autenticados: comum **pode** ler; 401 sem token.
- [ ] Local criado aparece no `GET /locais`.

---

## 15. Arquivos impactados

| Arquivo | Ação |
|---------|------|
| `docs/specs/023-cadastro-locais.md` | **NOVO** (este) |
| `src/types/local.ts` | **NOVO** |
| `src/types/user.ts` | **Alterar** — `admin` (se a 022 não tiver) |
| `src/lib/geocode.ts` | **NOVO** — extrair de criar-role + feed |
| `src/app/(app)/criar-role/services/geocode.service.ts` | **Alterar** — reexport ou apagar após extração |
| `src/app/(app)/feed/services/geocode.service.ts` | **Alterar** — idem |
| `src/lib/storage.ts` | **Alterar** — `uploadFotoFachadaLocal` |
| `src/app/(app)/criar-local/**` | **NOVO** — feature de cadastro |
| `src/app/(app)/locais/**` | **NOVO** — catálogo + service |
| `src/app/(app)/components/GuardaAdmin.tsx` | **Novo ou reusar** (022) |
| `src/app/(app)/feed/components/PainelLocalizacao.tsx` | **Alterar** — link Pontos oficiais |
| `src/components/menu-inferior/BotaoIncluir.tsx` | **Alterar** |
| `src/components/menu-inferior/MenuIncluir.tsx` | **Novo ou alterar** — Locais ativo |
| `src/components/menu-inferior/ItemMenuIncluir.tsx` | **Novo ou reusar** |
| `src/components/menu-inferior/hooks/useMenuIncluir.ts` | **Novo ou reusar** |
| `src/components/menu-inferior/hooks/useItemMenuAtivo.ts` | **Alterar** — destacar `/criar-local` |
| `src/components/menu-inferior/menu-inferior.module.css` | **Alterar** |
| `src/components/menu-inferior/MenuInferior.tsx` | **Alterar** — passar `admin` / montar menu |
| `functions/src/types/local.ts` | **NOVO** |
| `functions/src/types/usuario.ts` | **Alterar** — `admin` (se a 022 não tiver) |
| `functions/src/middleware/exigir-admin.ts` | **Novo ou reusar** (022) |
| `functions/src/routes/locais.ts` | **NOVO** |
| `functions/src/routes/perfil.ts` | **Alterar** — só se `admin` ainda não estiver no GET/POST/PUT |
| `functions/src/repositories/interfaces/local.repository.ts` | **NOVO** |
| `functions/src/repositories/firestore/firestore-local.repository.ts` | **NOVO** |
| `functions/src/repositories/firestore/firestore-usuario.repository.ts` | **Alterar** — mapper `admin` (se faltar) |
| `functions/src/repositories/index.ts` | **Alterar** — factory |
| `functions/src/index.ts` | **Alterar** — `app.use("/locais", …)` |
| `.cursor/rules/tech-stack.mdc` | **Alterar** — coleção `locais` |
| `.cursor/rules/project-context.mdc` | **Alterar** — locais só admin; comuns visualizam o catálogo |

Índice Firestore (se `listar` por `nome` exigir): `locais` em `nome` ascendente.

Não alterar `GuardaApp` (auth + perfil já bastam). Não misturar locais no feed de rolês.

---

## 16. Checklist da skill Next.js

- [ ] `page.tsx` de `/criar-local` e `/locais` sem `"use client"` (só orquestram).
- [ ] `"use client"` só em telas, forms, dock e filhos interativos.
- [ ] Estado/validação/submit em `useFormularioCriarLocal` (+ foto e endereço).
- [ ] HTTP isolado em `locais.service.ts` (sem Firestore no componente).
- [ ] Um componente = uma coisa (nome, endereço, categoria, facilidades, horário, foto, toast, card).
- [ ] Sem abstração genérica “pra futuro” (edição, mapa, autocomplete no rolê).
- [ ] Geocode extraído porque já há **2+ usos reais** (rolê + feed + local).
- [ ] CSS Modules + tokens de `globals.css`.
- [ ] Sem `console.log` de debug.

---

## 17. Ordem sugerida de implementação

1. Confirmar se a SPEC 022 já deixou `admin`, `exigirAdmin` e `MenuIncluir`. Completar só o que faltar.
2. Tipos `Local` + repositório + `POST`/`GET /locais`.
3. Feature `/criar-local` (form + Storage opcional + `GuardaAdmin`).
4. Feature `/locais` (lista + Abrir no Maps).
5. Ativar Locais no menu do `+`; destacar FAB em `/criar-local`.
6. Link **Pontos oficiais** no feed.
7. Extrair `src/lib/geocode.ts`.
8. Docs de visão (`tech-stack` / `project-context`).
9. Promover um uid de teste no Firestore e validar: comum 403 no POST + vê o card; admin cadastra e o ponto aparece na lista.

---

## 18. Relação com o código atual e com a SPEC 022

| Hoje / SPEC 022 | Nesta spec |
|-----------------|------------|
| `isAdmin()` = custom claim no token (PUT/DELETE rolê) | **Intocado.** Local usa `users.admin` |
| SPEC 022: Locais no menu, desabilitado, “Em breve” | Locais **ativo** → `/criar-local` |
| SPEC 022: sem tela de listagem de eventos | Locais **têm** catálogo `/locais` (ponto permanente; sem isso o cadastro não serve ao comum) |
| `+` sempre `/criar-role` (código atual) | Comum igual; admin ganha menu de 3 destinos |
| Sem coleção `locais` | Coleção nova; router `/locais` |
| Geocode em `criar-role/` e `feed/` | Lib compartilhada `src/lib/geocode.ts` |
| Capa de rolê em `roles/capas/…` | Fachada em `locais/fachadas/…` |
| Feed `/` lista só rolês | Continua só rolês; ganha o link para o catálogo |

Como promover um admin (manual, uma vez) — igual à SPEC 022:

1. Firebase Console → Firestore → `users/{uid}`.
2. Campo `admin` (boolean) = `true`.
3. No app: sair e entrar (ou recarregar perfil) para o `GET /perfil` trazer a flag.
4. O `+` passa a abrir Rolês / Eventos / Locais.
