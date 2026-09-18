# SPEC 022 — Cadastro de Evento (admin)

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-17  
> **Referência visual:** `designs/cadastro-evento/` (`DESIGN.md`, `code.html`, `screen.png`)  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade  
> **Backend:** Cloud Function `api` (Express) — `POST /eventos` (admin), `GET /eventos` e `GET /eventos/:id` (qualquer autenticado)  
> **Coleção Firestore:** `eventos` (**nova**); `users` ganha `admin: boolean`  
> **Depende de:** SPEC 001 (shell + dock), SPEC 002 (perfil / `GET /perfil`), SPEC 004 (padrão de formulário + geocode + Storage), SPEC 019 (coords + nome do local; **sem** mapa interativo SDK)

---

## 1. Objetivo

Criar a **tela de cadastro de eventos** e o contrato HTTP correspondente.

**Evento** não é rolê. Rolê tem partida → destino e comboio em estrada. Evento é **destino fixo**: moto point, track day, café, exposição. Os pilotos vão direto ao ponto.

| Quem | Pode cadastrar | Pode visualizar os criados |
|------|----------------|----------------------------|
| Administrador (`users.admin === true`) | Sim — `/criar-evento` + `POST /eventos` | Sim (`GET`) |
| Piloto comum | Não. Sem item no `+`, rota redireciona, API 403 | Sim (`GET`) — **UI de listagem é SPEC futura** |

Administrador **não** se auto-promove no app. A flag `admin` entra **manualmente no Firestore** (`users/{uid}.admin = true`).

O `+` do dock:

- Piloto comum: continua indo direto para `/criar-role` (SPEC 001 / 004).
- Admin: abre um **menu âncora** com **Rolês**, **Eventos** e **Locais**. Locais é SPEC futura (item visível e desabilitado).

Esta spec é **full stack**:

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | UI do mock, guarda admin, dropdown do `+`, validação, geocodificação, upload da capa, `POST /eventos`, toast, redirect |
| Back (Functions) | Flag `admin` no perfil, `exigirAdmin` no POST, validação do body, coleção `eventos` só via repositório |

`criadorId` **nunca** vem do body. Timestamps só no servidor. `admin` **nunca** vem do body de `POST`/`PUT /perfil`.

---

## 2. Recorte e princípios

### 2.1 O que entra

- Flag `admin` em `users` (default `false`; promoção só no banco).
- `GET /perfil` devolve `admin` para o dock e a guarda da rota.
- Rota `/criar-evento` alinhada a `designs/cadastro-evento/`.
- Coleção `eventos` + `POST /eventos` (admin) + `GET /eventos` e `GET /eventos/:id` (autenticado).
- Dock: menu do `+` só para admin (Rolês / Eventos / Locais).

### 2.2 O que **não** entra

| Item | Motivo |
|------|--------|
| Tela de feed/listagem de eventos | Sem mock; SPEC futura. O GET já existe para ela consumir |
| Cadastro / CRUD de **Locais** | Item do menu desabilitado; SPEC futura |
| Salvar como rascunho | Mock tem o botão; igual à SPEC 004, sem rascunho nesta spec |
| Push “raio de 40 km” | Banner do mock é **copy visual**. FCM por raio = outra spec |
| Editar / apagar evento | Sem UI no mock; PUT/DELETE ficam para spec futura |
| Mapa interativo (Google/Leaflet) | SPEC 019: só Nominatim + preview estático |
| Participação, vagas, ingresso/Sympla de verdade | Só a **modalidade** (enum) no cadastro |
| Custom claim `admin: true` do Auth | Fonte de verdade desta spec é o **documento** `users` |
| Tela no app para promover admin | Inserção manual no Firestore |

### 2.3 Evento vs rolê (não misturar)

| | Rolê (`roles`) | Evento (`eventos`) |
|--|----------------|-------------------|
| Rota | Partida + destino | Um único local |
| Quem cria | Qualquer piloto autenticado | Só admin |
| Ritmo | `tranquila \| moderada \| agressiva` | Não se aplica |
| Tipo | — | chips do mock |
| Acesso | — | grátis / consumação / ingresso |

Não gravar evento na coleção `roles`. Não reusar `POST /roles`.

### 2.4 Desvios conscientes do mock

O HTML é estático. O documento precisa de coords, data completa e capa persistida.

| Mock | Nesta spec | Por quê |
|------|------------|---------|
| `history.back()` | Voltar para `/` | App Router; origem pode ser o login |
| Capa já preenchida / “Prévia Ativa” | Dropzone **vazio** até anexar; capa **obrigatória** | Sem URL no Storage o GET não tem flyer |
| “Salvar como Rascunho” | **Não implementar** (omitir o botão) | Sem coleção de rascunho; SPEC 004 igual |
| Banner 40 km com notificação real | Banner **informativo**; sem FCM | Evita geo-push sem spec de destinatários |
| Tipo com `toggle` visual | Seleção **única** (já é o script do mock) | Um evento tem um tipo |
| Preview de mapa com foto stock | Mosaico OSM estático **depois** de ter lat/lng | Sem SDK de mapa; ponto verificado |
| Flag admin no Auth | Flag no doc `users` | Pedido do produto: inserção manual no banco |
| Menu inferior no HTML isolado | Dock da SPEC 001 (já no layout) | Não duplicar |

Não adicionar campos que o mock não tem (limite de vagas, link Sympla, recorrência, preço).

---

## 3. Referência de Design

Replicar `designs/cadastro-evento/` (`code.html` + `screen.png`). Não inventar outro layout. Tokens em `DESIGN.md` / `globals.css`.

### O que entra nesta spec (do mock)

- Header sticky: voltar + logo + **Criar Evento** + avatar (link `/perfil`).
- Cartão intro: badge **Painel Admin** (`shield_person`) + **Destino Fixo**; título **Cadastrar Evento**; subtítulo do mock.
- Formulário: Nome, Tipo (chips), Local + GPS + preview, Data + Abertura, Encerramento opcional, Modalidade de acesso, Estrutura & atrações, Flyer, Recados.
- Banner do raio (copy).
- CTA **Publicar Evento** (laranja, uppercase, ícone `publish`).
- Toast de sucesso.

### Comportamento visual (do mock)

- Coluna única, gutter 16px, **max-width 560px** (shell `(app)`).
- Header 64px + `env(safe-area-inset-top)`, `surface` com blur.
- Intro: `surface-container`, `rounded-xl`, glow laranja suave.
- Labels uppercase `label-md` em `on-surface-variant`; asterisco obrigatório em `primary-container`.
- Inputs: altura ~52px (`h-13` / `touch-min`+), `surface-container-low`, focus `surface-container-high`.
- Chips de tipo: pill; selecionado `primary-container`; inativo `surface-container-high`.
- Acesso: grid 3 colunas; selecionado laranja; inativo `surface-container-high`.
- Atrações: linhas `surface-container-low` com checkbox `accent-primary-container`.
- Flyer: altura ~176px (`h-44`), overlay **Alterar Imagem** quando houver preview.
- CTA: 56px (`touch-target`), glow `0 4px 16px rgba(255, 107, 0, 0.35)`, Barlow Condensed.
- Padding inferior: dock + toast (~96px + 72px).

---

## 4. Flag `admin` (cadastro de usuário)

### 4.1 Fonte de verdade

Campo booleano no documento `users/{uid}`:

```
admin: boolean   // default false
```

- **Promoção:** no Console do Firebase / Firestore, editar o doc e setar `admin: true`. Sem tela, sem endpoint, sem custom claim.
- **Rebaixamento:** setar `admin: false` (ou apagar o campo — mapper trata ausente como `false`).
- Pilotos já existentes **não** precisam de migration em lote: `Boolean(data.admin)` → `false` se o campo não existir.

Isso é **independente** do custom claim `admin: true` usado hoje em `isAdmin()` para PUT/DELETE de **rolê**. Esta spec **não** altera essa autorização de rolê. Evento usa só o campo do perfil.

### 4.2 O que o app e a API fazem com a flag

| Operação | `admin` |
|----------|---------|
| `POST /perfil` (primeiro acesso) | Sempre grava `admin: false`. Ignora se vier no body |
| `PUT /perfil` | **Não** atualiza `admin`. Strip do body |
| `GET /perfil` | Devolve `admin: boolean` |
| Front (`Usuario`) | `usuario.admin` alimenta dock + guarda de `/criar-evento` |
| `POST /eventos` | `exigirAdmin`: busca `users/{uid}` e exige `admin === true` |

O piloto comum **não** consegue promover a si mesmo nem via DevTools: a function monta o update só com campos validados.

Depois de setar `admin: true` no banco, o admin precisa **recarregar o perfil** (reabrir o app ou `recarregarPerfil`) para o dock mudar. Não há listener em tempo real nesta spec.

### 4.3 Mapper / tipos

```ts
// Usuario (front e functions)
admin: boolean;
```

`toUsuario`: `admin: Boolean(data.admin)`.

`UsuarioCreate` no primeiro acesso inclui `admin: false` explícito.

`UsuarioEdicao` / `UsuarioPrimeiroAcesso` **não** incluem `admin`.

---

## 5. Fluxo do usuário

```
Grupo (app) — autenticado com perfil (GuardaApp)
  │
  ├── Piloto comum
  │     [ + ]  →  /criar-role          (comportamento atual)
  │     /criar-evento  →  redirect `/`
  │
  └── Admin (usuario.admin === true)
        [ + ]  →  abre MenuIncluir
              ├── Rolês    →  /criar-role
              ├── Eventos  →  /criar-evento
              └── Locais   →  desabilitado (“Em breve”)
                    │
                    ▼
              Tela /criar-evento (vazia; acesso=gratis; tipo sem seleção
                                  ou default moto_point_semanal; abertura 19:30)
                    │
                    ├── Preenche campos
                    ├── Local: texto + sugestões OU [GPS]
                    ├── Flyer: anexa JPG/PNG
                    └── Toca Publicar Evento
                          │
                          ├── Inválido → erros inline (não chama API)
                          └── Válido
                                ├── Upload Storage (eventos/capas/{uid}/{uuid}.jpg)
                                └── POST /eventos
                                      ├── 201 → toast + redirect `/` (~1,6s)
                                      ├── 400 → erros / mensagem da API
                                      ├── 403 → não é admin (GuardaAdmin / toast)
                                      └── 401 → GuardaApp / login
```

- Seta do header e (se houver) cancelar → `/`. Sem rascunho; sair da tela perde o form.
- Avatar → `/perfil`.
- Usuário comum **não vê** Eventos no `+`.

---

## 6. Dock — menu do `+` (admin)

O usuário pediu liberdade de layout. Escolha desta spec: **popover âncora acima do FAB**, não bottom sheet em tela cheia.

Três itens cabem num card compacto no alcance do polegar. Locais já aparece (desabilitado) para o admin entender o mapa mental, sem fingir que a rota existe.

### 6.1 Comportamento

| Perfil | Toque no `+` |
|--------|----------------|
| Comum | `Link` para `/criar-role` (hoje) |
| Admin | Toggle do menu. Não navega no primeiro toque |

- Aberto: card acima do FAB, alinhado ao centro da coluna do `+`, `z-index` acima do dock.
- Backdrop transparente (`surface` 40%) fecha o menu (toque fora, `Escape`).
- Segundo toque no `+` fecha.
- Item **Rolês** / **Eventos**: `Link`; fecha o menu ao navegar.
- Item **Locais**: `aria-disabled`, sem `href`, label **Em breve**. Não navega.
- FAB destacado (`fabDestacado`) em `/criar-role` **e** `/criar-evento`.

### 6.2 Visual do menu

```
┌─────────────────────────────────┐
│  🏍️  Rolê                       │
│      Comboio com partida e rota │
├─────────────────────────────────┤
│  🚩  Evento                     │
│      Encontro no destino fixo   │
├─────────────────────────────────┤
│  📍  Local            Em breve  │  (opacidade ~50%)
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

### 6.3 Acessibilidade do menu

- `+` admin: `aria-label="Incluir"`, `aria-haspopup="menu"`, `aria-expanded`.
- Menu: `role="menu"`; itens `role="menuitem"` (Locais `aria-disabled="true"`).
- Foco no primeiro item ao abrir; Tab cicla; Escape fecha e devolve foco ao `+`.

---

## 7. Arquitetura Next.js

Seguir a skill: página orquestradora, componentes ~80 linhas, lógica em hooks, API em service. `"use client"` só com estado, submit, file picker, geolocalização ou `useAuth`.

A criação **não** é Server Action: Bearer no client (`auth.currentUser`) e GPS em `navigator.geolocation`.

### 7.1 Por que a page continua Server Component

`(app)/layout` já protege autenticação. `/criar-evento` monta a tela; a guarda de **admin** é Client (precisa de `usuario.admin`).

```tsx
// src/app/(app)/criar-evento/page.tsx — Server Component
import { TelaCriarEvento } from "./components/TelaCriarEvento";

const CriarEventoPage = () => {
  return (
    <main>
      <TelaCriarEvento />
    </main>
  );
};

export default CriarEventoPage;
```

`TelaCriarEvento` (ou um `GuardaAdmin` fino) redireciona para `/` se `!usuario.admin`.

### 7.2 Estrutura por feature

```
src/app/(app)/criar-evento/
├── page.tsx                              # Server — orquestrador
├── components/
│   ├── TelaCriarEvento.tsx               # Client — guarda admin + composição
│   ├── CabecalhoCriarEvento.tsx
│   ├── IntroPainelAdmin.tsx              # badges + título
│   ├── FormularioCriarEvento.tsx
│   ├── CampoNomeEvento.tsx
│   ├── SeletorTipoEvento.tsx             # chips exclusivos
│   ├── CampoLocalEvento.tsx              # input + GPS + preview
│   ├── SugestoesEndereco.tsx             # listbox Nominatim
│   ├── PreviewMapaEstatico.tsx           # tile OSM após coords
│   ├── CampoDataHorarios.tsx             # data + abertura + encerramento
│   ├── SeletorAcesso.tsx                 # 3 cards
│   ├── ListaAtracoes.tsx                 # checkboxes
│   ├── FotoFlyer.tsx
│   ├── CampoInformacoes.tsx
│   ├── BannerRaio.tsx                    # copy 40 km (sem FCM)
│   └── ToastSucesso.tsx
├── hooks/
│   ├── useFormularioCriarEvento.ts
│   ├── useFotoFlyer.ts
│   └── useCampoLocalEvento.ts
├── services/
│   └── eventos.service.ts                # POST (e GET se a tela precisar)
├── constants.ts
└── criar-evento.module.css
```

Dock (compartilhado, não dentro da rota):

```
src/components/menu-inferior/
├── BotaoIncluir.tsx                      # Alterar — Link OU menu
├── MenuIncluir.tsx                       # NOVO — popover admin
├── ItemMenuIncluir.tsx                   # NOVO
├── hooks/useMenuIncluir.ts               # NOVO — aberto/fecha/escape
└── menu-inferior.module.css              # Alterar — estilos do popover
```

Não importar CSS de `criar-role/` só para aproveitar: o local desta tela tem ícone **dentro** do input e preview de mapa. Duplicar o padrão visual no CSS da feature.

Geocode: segundo uso real (SPEC 004 já tem). **Extrair** `geocode.service` de `criar-role/services/` para `src/lib/geocode.ts` e apontar as duas features para lá. Sem isso, não importar de uma rota irmã.

### 7.3 Responsabilidades

| Peça | Tipo | Faz |
|------|------|-----|
| `page.tsx` | Server | Só monta `TelaCriarEvento` |
| `TelaCriarEvento` | Client | Se `!admin` → `router.replace("/")`; senão header + form |
| `FormularioCriarEvento` | Client | Markup; chama o hook |
| `useFormularioCriarEvento` | Hook | Campos, `erros`, `publicando`, `publicar` |
| `useFotoFlyer` | Hook | JPG/PNG, ObjectURL, upload |
| `useCampoLocalEvento` | Hook | GPS, debounce, sugestão, coords |
| `eventos.service` | Service | `criar(payload)` via `api` — **sem** Firestore no client |
| `MenuIncluir` | Client | Só se `usuario.admin` |
| Cartões | UI | Um bloco visual cada |

**Não misturar** no mesmo arquivo: JSX + validação + `fetch` + Storage + Nominatim.

---

## 8. Contrato dos campos (front)

```ts
export type TipoEvento =
  | "moto_point_semanal"
  | "track_day"
  | "cafe_pilotos"
  | "exposicao_custom";

export type AcessoEvento = "gratis" | "consumacao" | "ingresso";

export type AtracaoEvento =
  | "estacionamento_monitorado"
  | "musica_ao_vivo"
  | "chopp_hamburguer"
  | "bancada_ferramentas"
  | "area_coberta";

export type LocalizacaoForm = {
  endereco: string;
  lat: number | null;
  lng: number | null;
  nome: string;
};

export type CriarEventoForm = {
  titulo: string;
  tipo: TipoEvento | null;
  local: LocalizacaoForm;
  dataEvento: string;       // YYYY-MM-DD
  horaAbertura: string;     // HH:mm
  horaEncerramento: string; // HH:mm ou ""
  acesso: AcessoEvento;     // default "gratis"
  atracoes: AtracaoEvento[];
  photoFile: File | null;
  informacoes: string;
};
```

Chips de tipo (labels do mock):

| Valor | Label | Ícone |
|-------|-------|-------|
| `moto_point_semanal` | Moto Point Semanal | `sports_motorsports` |
| `track_day` | Track Day / Pista | `flag` |
| `cafe_pilotos` | Café dos Pilotos | `local_cafe` |
| `exposicao_custom` | Exposição & Custom | `two_wheeler` |

Acesso:

| Valor | Label | Subtítulo | Ícone |
|-------|-------|-----------|-------|
| `gratis` | 100% Grátis | Livre Entrada | `lock_open_right` |
| `consumacao` | Consumação | Mínima | `receipt_long` |
| `ingresso` | Ingresso | Portaria / Sympla | `confirmation_number` |

Atrações (multi, todas opcionais; default **nenhuma** marcada — o mock marca 3 por ser estático):

| Valor | Label | Ícone |
|-------|-------|-------|
| `estacionamento_monitorado` | Estacionamento Monitorado para Motos | `local_parking` |
| `musica_ao_vivo` | Música ao Vivo / Rock | `music_note` |
| `chopp_hamburguer` | Chopp & Hambúrguer Artesanal | `lunch_dining` |
| `bancada_ferramentas` | Bancada de Ferramentas / Calibrador | `home_repair_service` |
| `area_coberta` | Área 100% Coberta | `roofing` |

Default de tipo: **nenhum** selecionado (obriga escolha consciente). Default de acesso: `gratis` (como o mock). Abertura inicial: `19:30`. Data inicial: vazia.

Body enviado à API (após upload da capa):

```ts
export type EventoPublicacao = {
  titulo: string;
  tipo: TipoEvento;
  local: Localizacao; // lat, lng, endereco, nome
  dataHoraAbertura: string;      // ISO UTC
  dataHoraEncerramento: string | null;
  acesso: AcessoEvento;
  atracoes: AtracaoEvento[];
  fotoCapaUrl: string;
  informacoes: string;
};
```

`criadorId`, `id`, `createdAt`, `updatedAt` **não** vão no body.

### 8.1 Validação (cliente)

Validar no submit. Erro **no campo**. Bordas `--error`.

| Campo | Obrigatório | Regra | Mensagem |
|-------|-------------|-------|----------|
| Título | Sim | `trim().length` 3–80 | “Informe o nome do evento” / “Mínimo 3 caracteres” |
| Tipo | Sim | um dos 4 valores | “Selecione o tipo de evento” |
| Local | Sim | endereço trim ≥ 3 **e** lat/lng válidos | “Informe o local do evento” / “Escolha um endereço da lista ou use o GPS” |
| Data | Sim | `YYYY-MM-DD` | “Informe a data do evento” |
| Abertura | Sim | `HH:mm` | “Informe o horário de abertura” |
| Data+abertura | Sim | instante America/Sao_Paulo > agora | “A abertura precisa ser no futuro” |
| Encerramento | Não | se preenchido, instante > abertura (mesmo dia; se hora < abertura, **dia seguinte**) | “O encerramento precisa ser depois da abertura” |
| Acesso | Sim | um dos 3 (sempre há default) | “Selecione a modalidade de acesso” |
| Atrações | Não | subset do enum; sem duplicata | — |
| Flyer | Sim | arquivo novo válido | “Inclua o flyer ou a foto de capa” |
| Informações | Não | se preenchida, trim ≤ 2000 | “Máximo 2000 caracteres” |

Foto: `image/jpeg` \| `image/png`; máx. **10 MB** (limite atual de `src/lib/storage.ts`). Erro no bloco, sem submit.

Digitação livre no local **não** basta: sem coords não publica.

### 8.2 Montagem dos instantes

Interpretar data + hora no fuso **America/Sao_Paulo** → ISO UTC. Helper na feature, ex. `montarIsoEvento(data, hora)`.

Encerramento vazio → `null`. Encerramento com hora **menor** que abertura → soma 1 dia (festa que vira a noite).

### 8.3 Foto: Storage vs API

1. Arquivo válido → `uploadFotoCapaEvento(uid, file)` → URL pública.
2. POST recebe só `fotoCapaUrl`. A function **não** recebe multipart.
3. Path: `eventos/capas/{uid}/{uuid}.jpg`.

### 8.4 Local + preview de mapa

Mesma família da SPEC 004 (Nominatim, debounce ~300 ms, escolha da lista ou GPS).

**GPS:** `getCurrentPosition` → reverse geocode; se o reverse falhar, label `"Sua localização"` + coords (local válido). Permissão negada: erro no campo.

**Preview estático (depois de lat/lng):**

- Imagem OSM (tile estático, sem JS de mapa). Ex.: serviço de staticmap OSM ou mosaico de tiles.
- Overlay do mock: badge **Ponto verificado via Geocoding** + ícone `directions_bike`.
- Sem coords: não mostrar foto stock; estado vazio baixo (~112px) com hint “Busque o endereço ou use o GPS”.

Não persistir o ponto além do documento do evento. Sem deep link “Abrir no Maps” nesta spec (SPEC 019 cobre rolê; feed de evento futuro pode reusar `urlAbrirMaps`).

---

## 9. Implementação front (detalhes)

### 9.1 Service

```ts
// src/app/(app)/criar-evento/services/eventos.service.ts
import { api } from "@/lib/api";
import type { Evento, EventoPublicacao } from "@/types/evento";

export const eventosService = {
  criar: (dados: EventoPublicacao) =>
    api<Evento>("/eventos", {
      method: "POST",
      body: JSON.stringify(dados),
    }),
};
```

Usar `api` (Bearer automático). Um único `publicando` no hook. Tratar `ApiError` (400/401/403).

### 9.2 Hook (esqueleto do submit)

```ts
const publicar = async () => {
  const erros = validar(campos);
  if (Object.keys(erros).length > 0) {
    setErros(erros);
    return;
  }

  setPublicando(true);
  try {
    const fotoCapaUrl = await foto.enviar(uid);
    await eventosService.criar({
      titulo: titulo.trim(),
      tipo: tipo!,
      local: {
        lat: local.lat!,
        lng: local.lng!,
        endereco: local.endereco.trim(),
        nome: local.nome.trim(),
      },
      dataHoraAbertura: montarIsoEvento(dataEvento, horaAbertura),
      dataHoraEncerramento: horaEncerramento
        ? montarIsoEncerramento(dataEvento, horaAbertura, horaEncerramento)
        : null,
      acesso,
      atracoes,
      fotoCapaUrl,
      informacoes: informacoes.trim(),
    });

    setSucesso(true);
    // ~1600ms → router.push("/")
  } catch {
    setErroGeral(mensagemDaApiOuGenerica);
  } finally {
    setPublicando(false);
  }
};
```

CTA enquanto `publicando`: ícone `autorenew` girando + **Publicando...**. Inputs e botões `disabled`.

### 9.3 Flyer

- Vazio: ícone `add_photo_alternate` + “Toque para anexar o flyer” + hint 16:9.
- Preenchido: `object-fit: cover`, badge **Prévia ativa**, botão **Alterar Imagem**, `close` para remover (para a propagação).
- `input type="file"` oculto; `aria-label="Anexar flyer ou foto de capa"`.
- Remover volta ao vazio (submit falha até anexar de novo).

### 9.4 Tokens CSS

CSS Modules em `criar-evento.module.css`. Sem hex solto no TSX.

| Token | Uso |
|-------|-----|
| `--surface` / `--surface-container` / `-low` / `-high` / `-highest` / `-lowest` | Página, cartões, inputs, toast, menu |
| `--primary` | Labels / badges suaves |
| `--primary-container` | CTA, chips/acesso ativos, asteriscos, FAB |
| `--tertiary` | Ícone GPS |
| `--on-surface` / `--on-surface-variant` | Texto / hints |
| `--error` | Borda e texto de erro |
| `--gutter-md` / `--touch-min` / `--touch-target` | Espaçamento e toque |

Tipografia: Barlow Condensed em títulos/CTA/badges; Plus Jakarta Sans no body. Ícones: Material Symbols Outlined.

### 9.5 Acessibilidade da tela

- Voltar: `aria-label="Voltar para os rolês"`.
- `label` + `htmlFor` em cada input.
- GPS: `aria-label="Usar minha localização atual"`.
- Tipo: `role="radiogroup"` + `aria-checked`.
- Acesso: idem.
- Atrações: `label` envolvendo o checkbox.
- Erros: `aria-invalid` + `aria-describedby`.
- Toast: `role="status"`.
- Flyer: `alt` descritivo no preview.
- Toque ≥ 48px; CTA 56px.
- `disabled` enquanto `publicando`.
- Sugestões: `role="listbox"` / `option`.

### 9.6 Header

- `Link` para `/` (não `history.back()`).
- Título visível: **Criar Evento**.
- Sem sino.
- Avatar: `usuario.fotoUrl` → `/perfil`.

---

## 10. Backend

Rotas **não** importam Firestore. Persistência só em `repositories/firestore/`. Não usar `onCall`. Function HTTP única `api`.

### 10.1 Tipos

```ts
// functions/src/types/evento.ts
export type TipoEvento =
  | "moto_point_semanal"
  | "track_day"
  | "cafe_pilotos"
  | "exposicao_custom";

export type AcessoEvento = "gratis" | "consumacao" | "ingresso";

export type AtracaoEvento =
  | "estacionamento_monitorado"
  | "musica_ao_vivo"
  | "chopp_hamburguer"
  | "bancada_ferramentas"
  | "area_coberta";

export interface Evento {
  id: string;
  titulo: string;
  tipo: TipoEvento;
  local: Localizacao; // reusar tipo de role.ts
  dataHoraAbertura: string;
  dataHoraEncerramento: string | null;
  acesso: AcessoEvento;
  atracoes: AtracaoEvento[];
  fotoCapaUrl: string;
  informacoes: string;
  criadorId: string;
  createdAt: string;
  updatedAt: string;
}

export type EventoPublicacao = Omit<
  Evento,
  "id" | "criadorId" | "createdAt" | "updatedAt"
>;

export type EventoCreate = EventoPublicacao & { criadorId: string };
```

Front: `src/types/evento.ts` com os mesmos tipos de domínio (+ `EventoPublicacao`). `Usuario` em `src/types/user.ts` e `functions/src/types/usuario.ts` ganha `admin: boolean`.

### 10.2 Middleware `exigirAdmin`

Novo arquivo `functions/src/middleware/exigir-admin.ts`. **Depois** de `autenticar`.

```
1. uid = req.usuario.uid
2. perfil = await usuarioRepository.buscarPorId(uid)
3. se !perfil → 403 { erro: "Perfil não encontrado" }
4. se perfil.admin !== true → 403 { erro: "Apenas administradores podem cadastrar eventos" }
5. next()
```

Não usar `usuario.claims.admin` nesta rota.

Aplicar **somente** em `POST /eventos`. `GET` não usa.

### 10.3 Perfil — persistir `admin` com segurança

`POST /perfil` (criar):

```ts
await usuarioRepository.criar(uid, {
  ...resultado.dados,
  cidade: "",
  admin: false,
});
```

`PUT /perfil`: `validarUsuarioEdicao` **não** lê `bruto.admin`. `atualizar` não recebe o campo.

`toUsuario`: `admin: Boolean(data.admin)`.

### 10.4 Documento gravado (`eventos/{id}`)

```
{
  titulo: string,
  tipo: TipoEvento,
  local: { lat, lng, endereco, nome },
  dataHoraAbertura: timestamp,
  dataHoraEncerramento: timestamp | null,
  acesso: AcessoEvento,
  atracoes: string[],          // subset do enum
  fotoCapaUrl: string,
  informacoes: string,         // "" se omitida
  criadorId: string,
  createdAt: timestamp,
  updatedAt: timestamp         // = createdAt na criação
}
```

**Não gravar:** ritmo, partida/destino de rolê, participantes, `admin` do criador, campos extras do body.

### 10.5 Validação do POST (antes do repositório)

| Campo | Regra | 400 |
|-------|--------|-----|
| `titulo` | string, trim 3–80 | `{ erro: "titulo é obrigatório" }` |
| `tipo` | um dos 4 | `{ erro: "tipo inválido" }` |
| `local` | `endereco` trim ≥ 3, `lat` ∈ \[-90,90\], `lng` ∈ \[-180,180\], `nome` string (pode `""`) | `{ erro: "local inválido" }` |
| `dataHoraAbertura` | ISO parseável e **> agora** | `{ erro: "dataHoraAbertura inválida" }` / `{ erro: "a abertura precisa ser no futuro" }` |
| `dataHoraEncerramento` | `null` ou ISO **> abertura** | `{ erro: "dataHoraEncerramento inválida" }` |
| `acesso` | um dos 3 | `{ erro: "acesso inválido" }` |
| `atracoes` | array; cada item no enum; sem duplicata | `{ erro: "atracoes inválidas" }` |
| `fotoCapaUrl` | string não vazia após trim | `{ erro: "fotoCapaUrl é obrigatória" }` |
| `informacoes` | string ou ausente; trim ≤ 2000 | `{ erro: "informacoes inválida" }` |

Campos extras (`criadorId`, `id`, `admin`, …) **não** são persistidos. Payload = objeto validado + `criadorId` do token.

`informacoes` ausente / só espaços → `""`. `atracoes` ausente → `[]`. `local.nome` ausente → `""`.

Não validar se a URL da foto existe no Storage.

### 10.6 Repositório

```
functions/src/repositories/interfaces/evento.repository.ts
functions/src/repositories/firestore/firestore-evento.repository.ts
```

Exportar `eventoRepository` em `repositories/index.ts`.

```ts
interface EventoRepository {
  criar(dados: EventoCreate): Promise<Evento>;
  listarFuturos(): Promise<Evento[]>;
  buscarPorId(id: string): Promise<Evento | null>;
}
```

`criar`:

- `add` na coleção `eventos`.
- Timestamps: `toTimestamp` nas datas; `createdAt`/`updatedAt` = `FieldValue.serverTimestamp()`.
- Relê o doc e devolve `Evento` (ISO).

`listarFuturos`: `dataHoraAbertura >= now`, ordenar por `dataHoraAbertura` asc. Índice Firestore se a query exigir.

Mapper: `Timestamp` ↔ ISO no `mapper.ts` existente (ou helpers locais do adapter). `dataHoraEncerramento` nulo permanece `null`.

### 10.7 Router

```
functions/src/routes/eventos.ts
```

`app.use("/eventos", eventosRouter)` em `index.ts`.

```
GET  /eventos
     autenticar
     200 → Evento[] (futuros)
     401 → token

GET  /eventos/:id
     autenticar
     200 → Evento
     404 → { erro: "Evento não encontrado" }
     401 → token

POST /eventos
     autenticar + exigirAdmin
     Body: EventoPublicacao
     201 → Evento completo (id, criadorId, ISO)
     400 → validação
     401 → token
     403 → não admin / sem perfil
     500 → responderErro
```

Qualquer piloto autenticado **lê**. Só admin **escreve**.

Filtro por raio (Haversine) **não** entra nesta spec — o GET devolve futuros. O feed futuro (40 km do mock) aplica raio no client ou numa query nova.

Registrar `"/eventos"` e `"/eventos/:id"` no JSON de `GET /` da `api`.

### 10.8 PUT / DELETE

Fora. Não criar handlers vazios.

---

## 11. Visualização (piloto comum)

Regra de produto: o comum **não cadastra**, **vê** o que o admin publicou.

Nesta spec isso significa:

1. `GET /eventos` e `GET /eventos/:id` liberados para qualquer Bearer válido.
2. **Nenhuma tela nova de listagem.** Sem mock. SPEC futura (sugestão: `023-feed-eventos`) consome esses GETs e desenha os cards no feed ou numa aba.

Aceite **não** exige o piloto comum ver o evento no app nesta entrega. Exige que a API já devolva o documento após o POST.

---

## 12. Wireframes

### 12.1 Cadastro (admin)

```
┌─────────────────────────────────┐
│  ←  [logo] CRIAR EVENTO    (👤) │  header sticky
├─────────────────────────────────┤
│  [🛡 Painel Admin] [Destino Fixo]│
│  CADASTRAR EVENTO               │
│  Cadastre encontros, moto       │
│  points… vão direto ao ponto.   │
├─────────────────────────────────┤
│  NOME DO EVENTO *               │
│  [ ............................]│
│                                 │
│  TIPO DE EVENTO *               │
│  [Moto Point] [Track Day]       │
│  [Café] [Exposição]             │
│                                 │
│  LOCAL DO EVENTO *      [GPS]   │
│  [ 📍 ........................] │
│  [ mapa estático / vazio      ] │
│                                 │
│  DATA *          ABERTURA *     │
│  [ 2026-09-20 ]  [ 19:30 ]      │
│  ENCERRAMENTO           opcional│
│  [        ]                     │
│                                 │
│  MODALIDADE DE ACESSO *         │
│  [Grátis*][Consumação][Ingresso]│
│                                 │
│  ESTRUTURA & ATRAÇÕES           │
│  [ ] Estacionamento …           │
│  [ ] Música ao vivo …           │
│                                 │
│  FLYER OU FOTO DE CAPA *        │
│  [  Toque para anexar…        ] │
│                                 │
│  INFORMAÇÕES & RECADOS  opcional│
│  [ textarea                   ] │
│                                 │
│  🔔 Copy: raio 40 km (visual)   │
│                                 │
│  ┌─────────────────────────┐    │
│  │ ⬆  PUBLICAR EVENTO      │    │
│  └─────────────────────────┘    │
│                                 │
│  [✓ Evento publicado!]          │  toast (após 201)
└─────────────────────────────────┘
│  🏍️  …      ( + )      …  👤   │  dock
└─────────────────────────────────┘
```

### 12.2 Menu do `+` (somente admin)

```
          ┌──────────────────────┐
          │ 🏍️ Rolê              │
          │ 🚩 Evento            │
          │ 📍 Local   Em breve  │
          └──────────────────────┘
                   ( + )
```

Piloto comum: sem este card; `+` = criar rolê.

---

## 13. Fora do escopo

- Feed / cards / detalhe visual de evento (SPEC futura).
- Cadastro de Locais (item desabilitado).
- Rascunho / autosave.
- Editar ou excluir evento.
- Push FCM por raio / inscrição no evento.
- Mapa interativo, pins arrastáveis, Google Maps JS.
- Link de ingresso, preço, limite de vagas, aprovação de presença.
- Tela ou endpoint para promover admin.
- Unificar custom claim `admin` do Auth com a flag do perfil.
- Misturar eventos no `GET /roles`.

---

## 14. Critérios de aceite

### Admin e perfil

- [ ] `users.admin` existe; docs antigos sem o campo leem `false`.
- [ ] Primeiro acesso grava `admin: false`.
- [ ] `PUT /perfil` não altera `admin` mesmo se o client mandar `true`.
- [ ] `GET /perfil` devolve `admin`.
- [ ] Promoção: setar `admin: true` no Firestore; após recarregar o perfil, o dock muda.

### Dock

- [ ] Comum: `+` navega para `/criar-role`; sem menu Rolês/Eventos/Locais.
- [ ] Admin: `+` abre popover com Rolês, Eventos e Locais.
- [ ] Rolês → `/criar-role`; Eventos → `/criar-evento`.
- [ ] Locais visível, desabilitado, “Em breve”, sem navegação.
- [ ] Escape / toque fora fecha o menu.
- [ ] FAB destacado em `/criar-role` e `/criar-evento`.

### Front — cadastro

- [ ] `/criar-evento` segue o mock (header, painel admin, chips, local+GPS, datas, acesso, atrações, flyer, recados, CTA, toast).
- [ ] Sem botão “Salvar como rascunho”.
- [ ] Comum em `/criar-evento` é redirecionado para `/` (sem flash longo do form).
- [ ] Obrigatórios: nome, tipo, local (endereço+coords), data, abertura futura, acesso, flyer.
- [ ] Encerramento e recados opcionais; atrações multi opcional (default nenhuma).
- [ ] Acesso default `gratis`; abertura inicial `19:30`.
- [ ] Submit inválido: erro por campo, sem Storage nem POST.
- [ ] Flyer JPG/PNG ≤ 10 MB; upload **antes** do POST; path `eventos/capas/{uid}/{uuid}.jpg`.
- [ ] GPS e Nominatim no local; sem coords → sem POST.
- [ ] Preview OSM só com coords; badge “Ponto verificado via Geocoding”.
- [ ] Sucesso: 201, toast **Evento publicado com sucesso!**, redirect `/` ~1,6s.
- [ ] Falha API: mensagem geral, sem toast de sucesso, permanece na tela.
- [ ] Banner 40 km visível; **não** dispara FCM.
- [ ] `page.tsx` Server; Client só com interatividade.
- [ ] Componentes ~80 linhas; validação no hook; POST no service.
- [ ] Sem `addDoc` / escrita Firestore no client.
- [ ] Toque ≥ 48px; usável a partir de 360px; conteúdo acima do dock.

### Back

- [ ] `POST /eventos` exige Bearer **e** `users.admin === true`.
- [ ] Piloto comum no POST → **403**.
- [ ] `criadorId` só do token; timestamps só no servidor.
- [ ] 400 nos campos inválidos (título, tipo, local, abertura futura, acesso, capa, etc.).
- [ ] `informacoes` pode ser `""`; `atracoes` pode ser `[]`; encerramento `null`.
- [ ] 201 devolve `Evento` completo no schema desta spec.
- [ ] Body não grava outro uid nem `admin`.
- [ ] Persistência só em `FirestoreEventoRepository`.
- [ ] `GET /eventos` e `GET /eventos/:id` autenticados: comum **pode** ler; 401 sem token.
- [ ] Evento criado aparece no `GET /eventos` (se a abertura for futura).

---

## 15. Arquivos impactados

| Arquivo | Ação |
|---------|------|
| `docs/specs/022-cadastro-evento.md` | **NOVO** (este) |
| `src/types/user.ts` | **Alterar** — `admin` |
| `src/types/evento.ts` | **NOVO** |
| `src/lib/geocode.ts` | **NOVO** — extrair de criar-role |
| `src/app/(app)/criar-role/services/geocode.service.ts` | **Alterar** — reexport ou apagar após extração |
| `src/lib/storage.ts` | **Alterar** — `uploadFotoCapaEvento` |
| `src/app/(app)/criar-evento/**` | **NOVO** — feature |
| `src/components/menu-inferior/BotaoIncluir.tsx` | **Alterar** |
| `src/components/menu-inferior/MenuIncluir.tsx` | **NOVO** |
| `src/components/menu-inferior/ItemMenuIncluir.tsx` | **NOVO** |
| `src/components/menu-inferior/hooks/useMenuIncluir.ts` | **NOVO** |
| `src/components/menu-inferior/hooks/useItemMenuAtivo.ts` | **Alterar** — destacar `/criar-evento` |
| `src/components/menu-inferior/menu-inferior.module.css` | **Alterar** |
| `src/components/menu-inferior/MenuInferior.tsx` | **Alterar** — passar `admin` / montar menu |
| `functions/src/types/usuario.ts` | **Alterar** — `admin` |
| `functions/src/types/evento.ts` | **NOVO** |
| `functions/src/middleware/exigir-admin.ts` | **NOVO** |
| `functions/src/routes/eventos.ts` | **NOVO** |
| `functions/src/routes/perfil.ts` | **Alterar** — gravar `admin: false`; strip no PUT |
| `functions/src/repositories/interfaces/evento.repository.ts` | **NOVO** |
| `functions/src/repositories/firestore/firestore-evento.repository.ts` | **NOVO** |
| `functions/src/repositories/firestore/firestore-usuario.repository.ts` | **Alterar** — mapper `admin` |
| `functions/src/repositories/index.ts` | **Alterar** — factory |
| `functions/src/index.ts` | **Alterar** — `app.use("/eventos", …)` |
| `.cursor/rules/tech-stack.mdc` | **Alterar** — `users.admin` + coleção `eventos` |
| `.cursor/rules/project-context.mdc` | **Alterar** — eventos só admin; comuns visualizam |

Índice Firestore (se a query `listarFuturos` exigir): `eventos` em `dataHoraAbertura` ascendente.

Não alterar `GuardaApp` (auth + perfil já bastam). Não misturar eventos no feed de rolês.

---

## 16. Checklist da skill Next.js

- [ ] `page.tsx` sem `"use client"` (só orquestra).
- [ ] `"use client"` só em `TelaCriarEvento`, form, dock e filhos interativos.
- [ ] Estado/validação/submit em `useFormularioCriarEvento` (+ flyer e local).
- [ ] POST isolado em `eventos.service.ts` (sem Firestore no componente).
- [ ] Um componente = uma coisa (nome, tipo, local, horários, acesso, atrações, flyer, toast).
- [ ] Sem abstração genérica “pra futuro” (Locais, feed, edição, FCM).
- [ ] Geocode extraído só porque há **2 usos reais** (rolê + evento).
- [ ] CSS Modules + tokens de `globals.css`.
- [ ] Sem `console.log` de debug.

---

## 17. Ordem sugerida de implementação

1. Flag `admin` no tipo/mapper/`POST` perfil/`GET` perfil (sem UI ainda).
2. Middleware `exigirAdmin` + tipos `Evento` + repositório + `POST`/`GET`.
3. Feature `/criar-evento` (form + Storage).
4. `GuardaAdmin` na tela.
5. Menu do `+` no dock (comum inalterado até o perfil vir com `admin: true`).
6. Docs de visão (`tech-stack` / `project-context`).
7. Promover um uid de teste no Firestore e validar o fluxo completo.

---

## 18. Relação com o código atual

| Hoje | Nesta spec |
|------|------------|
| `isAdmin()` = custom claim no token (PUT/DELETE rolê) | **Intocado.** Evento usa `users.admin` |
| `Usuario` sem `admin` | Campo booleano no perfil |
| `+` sempre `/criar-role` | Comum igual; admin ganha menu de 3 destinos |
| Sem coleção `eventos` | Coleção nova; router `/eventos` |
| Geocode só em `criar-role/` | Lib compartilhada `src/lib/geocode.ts` |
| Capa de rolê em `roles/capas/…` | Flyer de evento em `eventos/capas/…` |
| Feed `/` lista só rolês | Continua só rolês; eventos na SPEC de feed futura |

Como promover um admin (manual, uma vez):

1. Firebase Console → Firestore → `users/{uid}`.
2. Campo `admin` (boolean) = `true`.
3. No app: sair e entrar (ou recarregar perfil) para o `GET /perfil` trazer a flag.
4. O `+` passa a abrir Rolês / Eventos / Locais.
