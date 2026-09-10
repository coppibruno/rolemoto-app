# SPEC 004 — Criar Rolê

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-09  
> **Referência visual:** `designs/criar-role/` (`DESIGN.md`, `code.html`, `screen.png`)  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade  
> **Backend:** Cloud Function `api` (Express) — `POST /roles`  
> **Depende de:** SPEC 001 (shell autenticado + rota `/criar-role`), SPEC 002 (perfil + foto no Storage), SPEC 003 (schema da coleção `roles` + feed)

---

## 1. Objetivo

Substituir o placeholder de `/criar-role` pela **tela de publicação de um novo rolê**, alinhada ao mock.

O piloto autenticado preenche **título, partida, data/hora de saída, destino, ritmo da tocada e foto de capa**. **Instruções do comboio** são opcionais. Com sucesso, o documento entra em `roles` e o feed (SPEC 003) passa a listá-lo.

Esta spec é **full stack**:

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | UI do mock, validação, geocodificação, upload da capa no Storage, `POST /roles`, toast, redirect |
| Back (Functions) | Token válido, uid do token como `criadorId`, validação do body, persistência só via repositório |

O `criadorId` **nunca** vem do body. Timestamps só no servidor.

---

## 2. Referência de Design

Replicar o visual de `designs/criar-role/` (`code.html` + `screen.png`). Não inventar outro layout. Tokens em `DESIGN.md` / `globals.css`.

### O que entra nesta spec (do mock)

- Header sticky: voltar + logo + **Criar Rolê** + avatar do piloto (link para `/perfil`).
- Faixa **Briefing Inicial** + badge **Passo 1 de 1**.
- Título **Organizar Novo Rolê** + subtítulo.
- Formulário em cartões: Título, Partida (+ Meu GPS), Horário, Destino, Ritmo da Tocada, Foto de capa, Instruções do comboio.
- CTA **Publicar Rolê** (laranja, uppercase, ícone `two_wheeler`).
- Botão **Cancelar e Voltar**.
- Toast de sucesso (ícone `check_circle`).

### O que o mock mostra e **não** entra

| Elemento do mock | Motivo |
|------------------|--------|
| Badge “opcional” na foto de capa | Nesta spec a capa é **obrigatória** (pedido do produto) |
| Fluxo multi-passo real | “Passo 1 de 1” é só visual; um único formulário |
| `history.back()` no script | App usa App Router: voltar para `/` |
| Menu inferior | Já na SPEC 001 (o HTML do mock é tela isolada) |

### Desvios conscientes do mock (necessários)

O mock é estático. O documento `roles` da SPEC 003 exige coordenadas e `dataHoraSaida` completa. Sem estes desvios o feed não lista o rolê.

| Mock | Nesta spec | Por quê |
|------|------------|---------|
| Só `input type="time"` | **Data** (`type="date"`) + **hora** (`type="time"`) no cartão Horário de Partida | `dataHoraSaida` precisa do dia; o feed filtra por data |
| Partida / destino só texto | Texto + **lat/lng** via GPS ou geocodificação | Raio do feed usa Haversine em `localSaida` |
| Capa marcada “opcional” | Capa **obrigatória** | Pedido desta spec; card do feed precisa de `fotoCapaUrl` |
| Partida e horário lado a lado no `sm:grid-cols-2` | Partida **largura total**; data e hora na linha de 2 colunas | GPS + autocomplete precisam de espaço; data extra cabe no cartão de horário |

Não adicionar campos que o mock não tem (categoria de moto, limite de vagas, ponto intermediário).

### Comportamento visual (do mock)

- Conteúdo em coluna única, gutter 16px, **max-width 560px** (já no shell `(app)`).
- Header fixo, altura 64px + `env(safe-area-inset-top)`, fundo `surface` com blur.
- Cartões: `surface-container`, `rounded-xl`, padding `card-padding-md`.
- Inputs: altura `touch-min` (48px), fundo `surface-container-lowest`, focus `surface-container-low`.
- Label uppercase `label-md` em `primary` (`#ffb693`), ícone Material Symbols à esquerda do texto (não dentro do input).
- Ritmo: grid 3 colunas. Selecionado usa a **cor semântica** do ritmo (não o laranja único do perfil). Inativo: `surface-container-lowest` + `on-surface-variant`.
- CTA: altura `touch-target` (56px), `primary-container`, glow `0 4px 16px rgba(255, 107, 0, 0.35)`, Barlow Condensed uppercase.
- Toast: `surface-container-highest`, círculo laranja com `check_circle`.

### Ritmo da tocada (mesmo domínio do perfil)

Valores iguais a `Pilotagem` / `RitmoRole`: `tranquila` | `moderada` | `agressiva`.

| Valor | Label | Subtítulo (cards do mock) | Cor do selecionado | Hint à direita do label |
|-------|-------|---------------------------|--------------------|-------------------------|
| `tranquila` | Tranquila | Abaixo de 90 km/h | `tertiary-container` | Passeio turístico, fotos e curvas suaves |
| `moderada` | Moderada | 90 - 120 km/h | `secondary-container` | Equilíbrio e curvas com velocidade cruzeiro |
| `agressiva` | Agressiva | Track / Ritmo Forte | `error-container` | Curvas técnicas, ritmo acelerado e poucas paradas |

**Default:** `moderada` (como o mock). Sempre há um ritmo selecionado; não dá para “desmarcar”.

**Não** reutilizar `SeletorPilotagem` do perfil: lá o ativo é laranja único, com ícones e subtítulos diferentes. Aqui o seletor segue o mock desta tela.

---

## 3. Fluxo do Usuário

```
Grupo (app) — já autenticado e com perfil (GuardaApp)
  │
  ▼
Menu → [ + ]  →  /criar-role
  │
  ▼
Tela vazia (ritmo = moderada, hora = 07:30, demais em branco)
  │
  ├── Preenche campos
  ├── Partida: texto + sugestões  OU  [Meu GPS]
  ├── Destino: texto + sugestões
  ├── Foto: anexa JPG/PNG
  └── Toca Publicar Rolê
        │
        ├── Inválido → erros inline (não chama API)
        └── Válido
              │
              ├── Upload Storage (roles/capas/{uid}/{uuid}.jpg)
              └── POST /roles  { titulo, descricao, fotoCapaUrl, ritmo,
                                 dataHoraSaida, localSaida, destinoFinal }
                    │
                    ├── 201 → toast + redirect para `/` (~1,6s)
                    ├── 400 → erros / mensagem da API
                    └── 401 → token inválido (GuardaApp / login)
```

- **Cancelar e Voltar** e a seta do header navegam para `/` (feed). Não gravam rascunho.
- Avatar do header → `/perfil`.
- Sem rascunho no Firestore. Estado só em memória; sair da tela perde o formulário (aceitável nesta spec).

---

## 4. Arquitetura Next.js

Seguir a skill: página orquestradora, componentes ~80 linhas, lógica em hooks, API em service. `"use client"` só no que tem estado, submit, file picker, geolocalização ou `useAuth`.

A criação **não** pode ser Server Action com fetch no servidor: a rule do projeto exige Bearer no client (`auth.currentUser`) e o GPS vem de `navigator.geolocation`.

### 4.1 Por que a page continua Server Component

`(app)/layout` já protege a rota. `/criar-role` só monta a tela. Interatividade fica nos filhos Client.

```tsx
// src/app/(app)/criar-role/page.tsx — Server Component
import { TelaCriarRole } from "./components/TelaCriarRole";

const CriarRolePage = () => {
  return (
    <main>
      <TelaCriarRole />
    </main>
  );
};

export default CriarRolePage;
```

### 4.2 Estrutura por feature

A rota **já existe** (placeholder da SPEC 001). Substituir o conteúdo; organizar como `perfil/`.

```
src/app/(app)/criar-role/
├── page.tsx                              # Server — orquestrador
├── components/
│   ├── TelaCriarRole.tsx                 # Client — composição
│   ├── CabecalhoCriarRole.tsx            # Voltar + logo + título + avatar
│   ├── IntroBriefing.tsx                 # Briefing Inicial + Organizar Novo Rolê
│   ├── FormularioCriarRole.tsx           # <form> + cartões + CTAs
│   ├── CampoTitulo.tsx
│   ├── CampoLocalizacao.tsx              # Partida ou destino (+ GPS opcional)
│   ├── SugestoesEndereco.tsx             # Lista Nominatim
│   ├── CampoDataHora.tsx                 # date + time
│   ├── SeletorRitmo.tsx                  # 3 cards (cores semânticas)
│   ├── FotoCapa.tsx                      # Dropzone, preview, remover
│   ├── CampoDescricao.tsx                # textarea instruções
│   ├── ToastSucesso.tsx
│   └── BotaoCancelar.tsx                 # Link para `/`
├── hooks/
│   ├── useFormularioCriarRole.ts         # Estado, validação, submit
│   ├── useFotoCapa.ts                    # File, preview, upload
│   └── useCampoLocalizacao.ts            # GPS + geocode + sugestões
├── services/
│   └── roles.service.ts                  # POST /roles (api)
├── constants.ts                          # Ritmos, limites, placeholders
└── criar-role.module.css
```

Não importar CSS/componentes de `perfil/` só para “aproveitar”: o cartão desta tela é outro (ícone no label, input sem ícone interno). Duplicar o padrão visual no CSS da feature.

### 4.3 Responsabilidades

| Peça | Tipo | Faz |
|------|------|-----|
| `page.tsx` | Server | Só monta `TelaCriarRole` |
| `TelaCriarRole` | Client | Lê `usuario`; monta header + form |
| `FormularioCriarRole` | Client | Markup do form; chama o hook |
| `useFormularioCriarRole` | Hook | Campos, `erros`, `publicando`, `publicar` |
| `useFotoCapa` | Hook | Validação JPG/PNG 2MB, ObjectURL, upload |
| `useCampoLocalizacao` | Hook | GPS, debounce de busca, escolha de sugestão |
| `roles.service` | Service | `criar(payload)` via `api` — **sem** Firestore no client |
| Cartões de campo | UI | Um bloco visual cada |
| `ToastSucesso` | UI | Mensagem; some ao redirecionar |

**Não misturar** no mesmo arquivo: JSX do form + regras de validação + `fetch` + upload Storage + Nominatim.

**Não** usar `addDoc` / helpers de role em `src/lib/firestore.ts`. Persistência só pela function.

O `GET` do feed permanece em `feed/services/roles.service.ts` (SPEC 003). Esta feature tem o **POST**. Não puxar `criar` para dentro de `feed/`.

---

## 5. Contrato dos Campos (front)

```ts
export type LocalizacaoForm = {
  endereco: string;
  lat: number | null;
  lng: number | null;
};

export type CriarRoleForm = {
  titulo: string;
  partida: LocalizacaoForm;
  destino: LocalizacaoForm;
  dataSaida: string;   // YYYY-MM-DD
  horaSaida: string;   // HH:mm
  ritmo: RitmoRole;    // default "moderada"
  photoFile: File | null;
  descricao: string;   // instruções do comboio; pode ser ""
};

export type ErrosCriarRole = {
  titulo?: string;
  partida?: string;
  destino?: string;
  dataHora?: string;
  ritmo?: string;
  foto?: string;
};
```

Body enviado à API (após upload da capa):

```ts
export type RolePublicacao = {
  titulo: string;
  descricao: string; // "" se o piloto não preencheu
  fotoCapaUrl: string;
  ritmo: RitmoRole;
  dataHoraSaida: string; // ISO UTC
  localSaida: Localizacao;  // lat, lng, endereco
  destinoFinal: Localizacao;
};
```

`criadorId`, `id`, `createdAt` e `updatedAt` **não** vão no body.

### Regras de validação (cliente)

Validar no submit. Mostrar erro **no campo**. Bordas com `--error`.

| Campo | Obrigatório | Regra | Mensagem |
|-------|-------------|-------|----------|
| Título | Sim | `trim().length >= 3` e `<= 80` | “Informe o título do rolê” / “Mínimo 3 caracteres” |
| Partida | Sim | `endereco` trim ≥ 3 **e** `lat`/`lng` numéricos válidos | “Informe o ponto de partida” / “Escolha um endereço da lista ou use o GPS” |
| Destino | Sim | Idem partida | “Informe o destino” / “Escolha um endereço da lista” |
| Data | Sim | `YYYY-MM-DD` válido | “Informe a data de partida” |
| Hora | Sim | `HH:mm` | “Informe o horário de partida” |
| Data+hora | Sim | instante em **America/Sao_Paulo** > agora | “A partida precisa ser no futuro” |
| Ritmo | Sim | um dos 3 valores (sempre preenchido pelo default) | “Selecione o ritmo da tocada” |
| Foto de capa | Sim | arquivo novo válido | “Inclua a foto de capa do rolê” |
| Instruções | Não | se preenchida, `trim().length <= 2000` | “Máximo 2000 caracteres” |

Foto (arquivo), iguais ao perfil:

- Tipos: `image/jpeg`, `image/png`.
- Máx. 2 MB.
- Erro inline no bloco da capa, sem submit.

Digitação livre em partida/destino **não** basta: sem `lat`/`lng` (usuário não escolheu sugestão nem GPS) o campo é inválido. Evita rolê invisível no raio do feed.

### Montagem de `dataHoraSaida`

Interpretar `dataSaida` + `horaSaida` no fuso **America/Sao_Paulo** e enviar ISO UTC (mesmo fuso da SPEC 003). Helper na feature, ex.: `montarIsoSaida(data, hora)`.

Hora inicial no form: `07:30` (mock). Data inicial: vazia (piloto escolhe).

### Foto: Storage vs API

1. Arquivo válido → `uploadFotoCapaRole(uid, file)` → URL pública.
2. POST recebe só `fotoCapaUrl` (string). A function **não** recebe multipart.
3. Sem `id` do rolê ainda: path `roles/capas/{uid}/{uuid}.jpg` (`crypto.randomUUID()`).

Substituir a assinatura atual `uploadFotoRole(roleId, file)` (`roles/{roleId}`) por essa. Nada nesta spec usa o path antigo.

---

## 6. Implementação Front

### 6.1 Service

```ts
// src/app/(app)/criar-role/services/roles.service.ts
import { api } from "@/lib/api";
import type { Role, RolePublicacao } from "@/types/role";

export const rolesService = {
  criar: (dados: RolePublicacao) =>
    api<Role>("/roles", {
      method: "POST",
      body: JSON.stringify(dados),
    }),
};
```

Usar `api` (Bearer automático). Um único `publicando` em `useFormularioCriarRole`. Não duplicar loading com `useFunctions`. Tratar `ApiError` (400/401).

O `api` atual devolve o JSON em qualquer 2xx. O POST responde **201** com o `Role` criado — o client já aceita.

### 6.2 Hook do formulário (esqueleto)

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
    const criado = await rolesService.criar({
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      fotoCapaUrl,
      ritmo,
      dataHoraSaida: montarIsoSaida(dataSaida, horaSaida),
      localSaida: {
        lat: partida.lat!,
        lng: partida.lng!,
        endereco: partida.endereco.trim(),
      },
      destinoFinal: { /* idem destino */ },
    });

    setSucesso(true);
    // após ~1600ms → router.push("/")
  } catch (e) {
    setErroGeral(mensagemDaApiOuGenerica);
  } finally {
    setPublicando(false);
  }
};
```

CTA enquanto `publicando`: ícone `autorenew` girando + texto **Publicando...** (mock). Inputs e botões `disabled`.

### 6.3 Localização (partida e destino)

Mesma família da SPEC 003 (Nominatim/OSM, sem SDK de mapa).

**Partida**

1. Digitação com debounce ~300ms → sugestões (endereço).
2. Escolher uma linha grava `endereco`, `lat`, `lng`.
3. **Meu GPS:**
   - `navigator.geolocation.getCurrentPosition`.
   - Ícone gira; texto **Buscando...** / **Fixado!** (mock) / **Sem GPS** se recusar.
   - Reverse geocode para o label; se falhar, `"Sua localização"` + coordenadas mesmo assim (partida válida).
4. Permissão negada: erro no campo (“Autorize a localização ou busque o endereço”).

**Destino**

Igual à partida **sem** botão GPS (o mock não tem). Só busca + escolha.

Componente `CampoLocalizacao` recebe `mostrarGps?: boolean`. Lógica de busca em `useCampoLocalizacao` (uma instância por campo, ou factory).

Não persistir o ponto no Firestore além do documento do rolê.

### 6.4 Foto de capa

- Altura ~128px (`h-32`), `rounded-lg`, fundo `surface-container-lowest`.
- Vazio: ícone `two_wheeler` em círculo + “Toque para anexar foto da rota” + hint.
- Preenchido: `object-fit: cover`, badge **Capa Atualizada**, botão circular `close` (parar a propagação do clique).
- `input type="file"` oculto; `aria-label="Anexar foto de capa do rolê"`.
- Remover volta ao estado vazio (submit falha até anexar de novo).

### 6.5 Tokens CSS

Reusar variáveis; CSS Modules em `criar-role.module.css`. Sem hex solto no TSX, **exceto** se o token ainda não existir — preferir os já previstos na SPEC 003 (`--ritmo-tranquila`, etc.).

| Token | Uso |
|-------|-----|
| `--surface` / `--surface-container` / `-low` / `-lowest` / `-high` / `-highest` | Página, cartões, inputs, toast |
| `--primary` | Labels |
| `--primary-container` | CTA, ponto Briefing, círculo do toast |
| `--secondary-container` / `--tertiary-container` / `--error-container` | Ritmo selecionado |
| `--on-surface` / `--on-surface-variant` | Texto / hints |
| `--error` | Borda e texto de erro |
| `--gutter-md` / `--touch-min` / `--touch-target` | Espaçamento e toque |

Tipografia: Barlow Condensed em títulos/CTA/badges; Plus Jakarta Sans no body. Ícones: Material Symbols Outlined.

Padding inferior do `<main>`: dock (SPEC 001) + espaço do toast (~96px + 72px). Conteúdo não pode ficar atrás do menu nem do toast.

### 6.6 Acessibilidade

- Seta voltar: `aria-label="Voltar para os rolês"`.
- `label` associado a cada input (`htmlFor`).
- Partida GPS: `aria-label="Usar minha localização atual"`.
- Ritmo: `role="radiogroup"` + `aria-checked` no card ativo.
- Erros: `aria-invalid` + `aria-describedby`.
- Toast: `role="status"`.
- Capa: `alt` descritivo quando houver preview.
- Área de toque ≥ 48px; CTA 56px.
- `disabled` em inputs e botões enquanto `publicando`.
- Lista de sugestões: `role="listbox"`; opção `role="option"`.

### 6.7 Header

- Voltar: `Link` para `/` (não `history.back()`, para não cair no login se a origem for estranha).
- Título visível: **Criar Rolê**.
- Sem sino de notificações.
- Avatar: `useAuth().usuario.fotoUrl`, `Link` para `/perfil`.

---

## 7. Backend — `POST /roles`

O router `POST /roles` **já existe**, mas o handler e o `FirestoreRoleRepository.criar` ainda falam o schema antigo (`categoria`, `categoriaMotos`, `fotoUrl`, `participantes`). O tipo `Role` em `functions/src/types/role.ts` **já** é o da SPEC 003.

Esta spec **fecha o contrato do POST** e alinha rota + repositório ao tipo atual. Não criar outro path. Não usar `onCall`. Rotas **sem** `firestore.collection` direto.

`GET /roles` filtrado continua na SPEC 003. Se as duas specs forem implementadas juntas, fazer o mapper/`criar` uma vez só.

### 7.1 Auth e autorização

1. `rolesRouter.use(autenticar)` — já exige `Authorization: Bearer <idToken>`.
2. Token inválido/expirado → **401**.
3. Sem Bearer → **401**.
4. `criadorId` **somente** de `req.usuario.uid`. Ignorar `criadorId` / `id` / `uid` no body.
5. Qualquer piloto autenticado **pode criar**. Não exige claim admin.

O Admin SDK ignora Security Rules: a function é a autorização.

### 7.2 Documento gravado (`roles/{id}`)

Igual à SPEC 003, com `descricao` podendo ser string vazia:

```
{
  titulo: string,
  descricao: string,              // "" se omitida / só espaços
  fotoCapaUrl: string,
  ritmo: "tranquila" | "moderada" | "agressiva",
  dataHoraSaida: timestamp,
  localSaida: { lat: number, lng: number, endereco: string },
  destinoFinal: { lat: number, lng: number, endereco: string },
  criadorId: string,
  createdAt: timestamp,
  updatedAt: timestamp            // igual a createdAt na criação
}
```

**Não gravar:** `participantes`, `categoria`, `categoriaMotos`, `fotoUrl` (nome antigo).

### 7.3 Tipos (Functions)

```ts
// functions/src/types/role.ts — acréscimo
export type RolePublicacao = Omit<
  Role,
  "id" | "criadorId" | "createdAt" | "updatedAt"
>;
```

`RoleCreate` passa a ser o que o repositório recebe:

```ts
export type RoleCreate = RolePublicacao & { criadorId: string };
```

(Ajustar o `Omit` atual se ainda incluir `criadorId` no body implícito.)

Front (`src/types/role.ts`): exportar o mesmo `RolePublicacao`.

### 7.4 Validação do body (antes do repositório)

| Campo | Regra | 400 |
|-------|--------|-----|
| `titulo` | string, `trim().length` 3–80 | `{ erro: "titulo é obrigatório" }` |
| `descricao` | string ou ausente; se vier, trim ≤ 2000 | `{ erro: "descricao inválida" }` |
| `fotoCapaUrl` | string não vazia após trim | `{ erro: "fotoCapaUrl é obrigatória" }` |
| `ritmo` | exatamente os 3 valores | `{ erro: "ritmo inválido" }` |
| `dataHoraSaida` | ISO parseável e **> agora** | `{ erro: "dataHoraSaida inválida" }` / `{ erro: "a partida precisa ser no futuro" }` |
| `localSaida` / `destinoFinal` | objeto com `endereco` trim ≥ 3, `lat` ∈ \[-90, 90\], `lng` ∈ \[-180, 180\] | `{ erro: "localSaida inválida" }` (ou destino) |

Campos extras (`criadorId`, `id`, `createdAt`, `participantes`, …) **não** são persistidos. Montar o payload só com o objeto validado + `criadorId` do token.

`descricao` ausente ou só espaços → persistir `""`.

Não validar se a URL da foto “existe” no Storage (só string não vazia).

### 7.5 Repositório — `criar`

```ts
async criar(dados: RoleCreate): Promise<Role>
```

- `add` na coleção `roles`.
- `dataHoraSaida`: `toTimestamp(dados.dataHoraSaida)`.
- `createdAt` e `updatedAt`: `FieldValue.serverTimestamp()`.
- Relê o doc e devolve `Role` (ISO), como hoje.

Atualizar `toRole` / `criar` para os campos novos (se a SPEC 003 ainda não tiver feito).

### 7.6 Handler (contrato)

```
POST /roles
Headers: Authorization: Bearer <idToken>
Content-Type: application/json

Body:
{
  "titulo": "Café com Curvas na Serra Negra",
  "descricao": "Pedágio no km 40. Canal 19 no rádio.",
  "fotoCapaUrl": "https://...",
  "ritmo": "moderada",
  "dataHoraSaida": "2026-09-12T10:30:00.000Z",
  "localSaida": {
    "lat": -23.18,
    "lng": -45.88,
    "endereco": "Posto Shell Rodovia km 22"
  },
  "destinoFinal": {
    "lat": -22.73,
    "lng": -45.58,
    "endereco": "Mirante Alto da Serra"
  }
}

201 → Role completo (id, criadorId, createdAt, updatedAt em ISO)
400 → validação
401 → token
500 → erro interno (responderErro)
```

Não devolver `RoleFeedItem` (sem `distanciaKm` / `criador`). O feed busca de novo no GET.

### 7.7 PUT / DELETE

Fora desta spec (sem tela de editar/apagar). Não quebrar os handlers existentes: se o mapper mudar, PUT/DELETE devem continuar compilando (`updatedAt` no PUT quando a SPEC 003 já prever). Sem UI.

### 7.8 O que não muda

- Function HTTP única `api`; `app.use("/roles", rolesRouter)` já registrado.
- Factory em `repositories/index.ts`.
- `GET /roles` e `GET /roles/:id` — contrato da SPEC 003.

---

## 8. Wireframe

```
┌─────────────────────────────────┐
│  ←  [logo] CRIAR ROLÊ      (👤) │  header sticky
├─────────────────────────────────┤
│  ● Briefing Inicial   Passo 1/1 │
│  ORGANIZAR NOVO ROLÊ            │
│  Defina a rota, o ritmo…        │
├─────────────────────────────────┤
│  ▎ TÍTULO DO ROLÊ               │
│  [ ............................]│
│                                 │
│  ▎ PARTIDA           [Meu GPS]  │
│  [ ............................]│
│  (sugestões Nominatim)          │
│                                 │
│  ▎ DATA          ▎ HORÁRIO      │
│  [ 2026-09-12 ]  [ 07:30 ]      │
│                                 │
│  ▎ DESTINO FINAL                │
│  [ ............................]│
│                                 │
│  ▎ RITMO DA TOCADA    (hint)    │
│  [Tranquila][Moderada*][Agress.]│
│                                 │
│  ▎ FOTO DE CAPA DO ROLÊ         │
│  [ 🏍️  Toque para anexar…    ] │
│                                 │
│  ▎ INSTRUÇÕES DO COMBOIO  opcional
│  [ textarea                   ] │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 🏍️  PUBLICAR ROLÊ       │    │
│  └─────────────────────────┘    │
│       CANCELAR E VOLTAR         │
│                                 │
│  [✓ Rolê Criado com Sucesso!]   │  toast (após 201)
└─────────────────────────────────┘
│  🏍️        ( + )        👤     │  menu (SPEC 001)
└─────────────────────────────────┘
```

\* = default `moderada`.

Estado de erro: cartão/input com borda `--error` e texto abaixo. Capa vazia: texto sob o dropzone.

---

## 9. Fora do Escopo

- Editar ou apagar rolê (PUT/DELETE com UI).
- Participação, solicitações, lista de confirmados.
- Rascunho / autosave.
- Recorte, compressão avançada ou múltiplas fotos.
- Mapa interativo / pins / SDK Google Maps (só Nominatim).
- Categoria de cilindrada, limite de vagas, waypoints.
- Notificações no header.
- Menu inferior, guarda de rota e tokens globais (SPEC 001).
- Implementar o GET filtrado do feed (SPEC 003) — só garantir o schema gravado.

---

## 10. Critérios de Aceite

### Front

- [ ] `/criar-role` deixa de ser placeholder e segue o mock `designs/criar-role/` (header, briefing, cartões, ritmo, capa, CTA, toast).
- [ ] Campos obrigatórios: título, partida (endereço + coords), data, hora, destino (endereço + coords), ritmo, foto de capa.
- [ ] Instruções do comboio opcionais; label “opcional” só nesse campo.
- [ ] Foto de capa **sem** badge “opcional”; submit sem arquivo mostra erro no bloco.
- [ ] Ritmo default `moderada`; selecionado usa cor semântica (não o laranja do perfil).
- [ ] Meu GPS preenche partida; busca Nominatim em partida e destino; sem coords → erro, sem POST.
- [ ] Data+hora no futuro (America/Sao_Paulo); hora inicial 07:30.
- [ ] Submit inválido: erro **por campo**, sem chamar a API nem o Storage.
- [ ] Foto: JPG/PNG, máx. 2MB; upload **antes** do POST; path `roles/capas/{uid}/{uuid}.jpg`.
- [ ] Sucesso: **201**, toast **Rolê Criado com Sucesso!**, redirect para `/` ~1,6s.
- [ ] Falha da API: mensagem geral, sem toast de sucesso, permanece na tela.
- [ ] Cancelar e seta voltam para `/`.
- [ ] Menu Inferior permanece; item `+` no estado destacado da SPEC 001.
- [ ] `page.tsx` Server; Client só onde há interatividade.
- [ ] Componentes < ~80 linhas; validação no hook; POST no service.
- [ ] Sem `addDoc` / escrita Firestore no client.
- [ ] Toque ≥ 48px; usável a partir de 360px; conteúdo acima do dock.

### Back

- [ ] `POST /roles` exige Bearer válido.
- [ ] `criadorId` só do token; timestamps só no servidor (`createdAt` = `updatedAt` na criação).
- [ ] 400 se faltar/for inválido título, fotoCapaUrl, ritmo, dataHoraSaida (futuro), localSaida ou destinoFinal.
- [ ] `descricao` pode ser `""`; não é obrigatória.
- [ ] 201 devolve o `Role` completo no schema da SPEC 003 (sem `categoria` / `participantes` / `fotoUrl`).
- [ ] Body não grava outro uid nem campos extras.
- [ ] Persistência só em `FirestoreRoleRepository`.
- [ ] Rolê criado aparece no `GET /roles` da SPEC 003 (quando os filtros baterem).

---

## 11. Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| `src/app/(app)/criar-role/page.tsx` | **Alterar** — orquestrador Server |
| `src/app/(app)/criar-role/components/*` | **NOVO** — UI da feature |
| `src/app/(app)/criar-role/hooks/*` | **NOVO** |
| `src/app/(app)/criar-role/services/roles.service.ts` | **NOVO** — POST |
| `src/app/(app)/criar-role/constants.ts` | **NOVO** — ritmos, limites |
| `src/app/(app)/criar-role/criar-role.module.css` | **NOVO** |
| `src/types/role.ts` | **Alterar** — `RolePublicacao` |
| `src/lib/storage.ts` | **Alterar** — `uploadFotoCapaRole(uid, file)` |
| `functions/src/types/role.ts` | **Alterar** — `RolePublicacao` / `RoleCreate` |
| `functions/src/routes/roles.ts` | **Alterar** — validação completa no POST |
| `functions/src/repositories/firestore/firestore-role.repository.ts` | **Alterar** — `criar` + mapper no schema novo |
| `functions/src/repositories/interfaces/role.repository.ts` | Só se `RoleCreate` mudar |

Não alterar `MenuInferior` nem `GuardaApp`. Não mover o GET do feed para esta pasta.

---

## 12. Checklist da skill Next.js

- [ ] `page.tsx` sem `"use client"` (só orquestra).
- [ ] `"use client"` só em `TelaCriarRole` e filhos interativos.
- [ ] Estado/validação/submit em `useFormularioCriarRole` (+ foto e localização).
- [ ] POST isolado em `roles.service.ts` (sem Firestore no componente).
- [ ] Um componente = uma coisa (título, local, data/hora, ritmo, capa, toast).
- [ ] Sem abstração genérica “pra futuro” (mapa, edição, vagas).
- [ ] CSS Modules + tokens de `globals.css`.
- [ ] Sem `console.log` de debug.

---

## 13. Relação com o código atual

| Hoje | Nesta spec |
|------|------------|
| `criar-role/page.tsx` placeholder | Tela completa do mock |
| `POST /roles` schema antigo (`categoria`, `fotoUrl`, `participantes`) | POST com `RolePublicacao` |
| `uploadFotoRole(roleId)` | `uploadFotoCapaRole(uid)` antes do id existir |
| SPEC 003: `descricao` obrigatória no documento | `descricao` **opcional** (`""` permitido); feed omite o bloco se vazia (já previsto na 003) |
| Tipos `Role` já no schema novo | Rota e repositório de criação alinhados a esses tipos |

Documentos criados por esta tela **são** os que o feed lista. Sem seed: o primeiro rolê real vem daqui.

### Ajuste pontual na SPEC 003

Na implementação do feed, tratar `descricao === ""` como “omitir o resumo no card” (a 003 já diz para omitir se vazia). Não exigir descrição no GET.
