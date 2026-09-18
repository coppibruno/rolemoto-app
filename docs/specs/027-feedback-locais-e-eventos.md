# SPEC 027 — Feedback de Locais e Eventos

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-18  
> **Referência visual:** `designs/avaliar-local-e-evento/` (`DESIGN.md`, `code.html`, `screen.png`)  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade (skill `nextjs-patterns`)  
> **Backend:** Cloud Function `api` (Express) — `POST|GET /locais/:id/avaliacoes`, `POST|GET /eventos/:id/avaliacoes`, `GET …/avaliacao` (própria); enriquecer feed `GET /locais` e `GET /eventos`  
> **Coleções Firestore:** `userslocalfeedback` e `userseventofeedback` (**novas**)  
> **Depende de:** SPEC 001 (shell + dock), SPEC 010 (padrão de avaliação / relato nominal), SPEC 022 (eventos), SPEC 023 (locais), SPEC 024 (feed abas Eventos/Locais), SPEC 026 (inscrição + histórico de eventos)

---

## 1. Objetivo

Permitir que o piloto **avalie nominalmente** um **local oficial** ou um **evento** em que participou: nota 1–5, relato, fotos opcionais e flag “recomendo para comboios”. A avaliação **fica atribuída** (`@apelido` + foto) e **reflete no feed** (média + contagem nos cards de Locais e Eventos).

Entrada na tela:

| Origem | Comportamento |
|--------|----------------|
| Feed → aba **Locais** | CTA **Avaliar** no card / detalhe → `/locais/:id/avaliar` |
| Feed → aba **Eventos** | CTA **Avaliar** (quando elegível) → `/eventos/:id/avaliar` |
| Perfil → Histórico → card de **evento** `concluido` | Link para `/eventos/:id/avaliar` (form ou leitura) |
| URL direta | GuardaApp + regras de elegibilidade (403 se não pode) |

Esta spec é **full stack**:

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | UI do mock (kicker, card-alvo, estrelas, relato, fotos, toggle, CTAs), pontos de entrada no feed/perfil, POST + upload Storage, selo de média no card |
| Back (Functions) | Coleções de feedback, uid só do token, um doc por par, agregação denormalizada em `locais` / `eventos`, listagem autenticada |

`usuarioId` **nunca** vem do body. Timestamps só no servidor. Não misturar com `usersrolefeedback` (SPEC 010) nem com inscrição (`usersevento`).

---

## 2. Recorte e princípios

### 2.1 O que entra

- Tela única de formulário (visual do mock) parametrizada por **tipo** `local` | `evento`.
- Rotas `/locais/[id]/avaliar` e `/eventos/[id]/avaliar`.
- Coleções `userslocalfeedback` e `userseventofeedback` (id composto `{usuarioId}_{alvoId}`).
- Nota 1–5, relato até **500** chars, até **4 fotos**, toggle **Recomendo para Comboios**.
- Avaliação **nominal** (autor hidratado na listagem).
- Agregação no documento do alvo: `notaMedia`, `totalAvaliacoes` (e contagem auxiliar de recomendações).
- Exibir ★ média + `(N)` nos cards do feed (abas Locais e Eventos) e no detalhe.
- CTA de entrada no feed + ajuste do card de evento no histórico (SPEC 026).

### 2.2 O que **não** entra

| Item | Motivo |
|------|--------|
| Guarda de sessão interceptando o app (como SPEC 010) | Entrada é **explícita** (feed / perfil) |
| Tabs **Ponto / Evento** no mock | Tipo vem da URL; sem switcher na tela |
| Sino de notificações no header | Mesmo recorte das SPECs anteriores |
| Botão **info** “Diretrizes da Comunidade” com conteúdo rico | Fora — omitir ou `aria-label` sem modal nesta versão |
| Destacar ponto em **mapa de rotas** / ranking de comboio | Só persiste o boolean; mapas = spec futura |
| PATCH / DELETE / reavaliar | Relato definitivo (igual SPEC 010) |
| Avaliar **rolê** nesta tela | Continua SPEC 010 (`/roles/:id/feedback`) |
| Lista pública de autores no **card do feed** | Feed só mostra média agregada; lista completa na tela de avaliação / detalhe |
| Moderação / denúncia / anonimato | Fora |
| FCM “avalie este local” | Spec futura |
| Contador “N interessados” de volta no card | SPEC 024 / 026 já fecharam isso |

### 2.3 Local vs evento (elegibilidade)

| | Local (`userslocalfeedback`) | Evento (`userseventofeedback`) |
|--|------------------------------|--------------------------------|
| Quem avalia | Qualquer autenticado | Só quem tem `usersevento` (inscrito) |
| Quando | Sempre (ponto permanente) | Só depois que o evento **encerrou** (`now >= encerramento ?? abertura`) |
| Criador pode avaliar? | Sim (admin também visita) | Sim, se inscrito |
| Um doc por | `{uid}_{localId}` | `{uid}_{eventoId}` |
| Histórico → atalho | Não nesta spec (locais não entram no histórico de pistas) | Card `concluido` → `/eventos/:id/avaliar` |

Não gravar avaliação de local em `userseventofeedback`. Não reusar `POST /roles/:id/feedback`.

### 2.4 Desvios conscientes do mock

O HTML é uma avaliação estática de um **posto**. No app a mesma UI serve local **e** evento.

| Mock | Nesta spec | Por quê |
|------|------------|---------|
| Tabs Ponto / Evento | Omitidas; tipo na URL | Evita ambiguidade e estado órfão |
| Estrelas já em 5 + “4.9” | Nenhuma estrela até o toque; badge mostra a **nota inteira** escolhida (`4` / `5`) + label | Evita inflar nota 5; “4.9” é média do **feed**, não do form |
| Sino + dock completo do HTML | Header do shell + dock SPEC 001 | Consistência |
| Badge **OFICIAL** no thumb | Locais: sempre (catálogo oficial). Eventos: badge do **tipo** (`Track day`, etc.) — sem “OFICIAL” | Evento não é ponto oficial permanente |
| “Destaca este ponto nos mapas…” | Copy mantida; **sem** efeito em mapa nesta versão | Persistimos `recomendaComboio` |
| Seção “Community Feed / Recent Reviews” vazia no HTML | Após POST (ou se já avaliou): lista **leituras** das avaliações do alvo | Visibilidade nominal precisa de tela |
| Upload sem validação | JPG/PNG ≤ 10 MB; máx. 4; upload **antes** do POST | Mesmo padrão SPEC 023 |

---

## 3. Referência de Design

Replicar o visual de `designs/avaliar-local-e-evento/` (`code.html` + `screen.png`). Tokens em `DESIGN.md` / `globals.css`.

### 3.1 O que entra do mock

- Header interno: **voltar** + título **AVALIAR EXPERIÊNCIA** + subtítulo **Feedback da Irmandade** (ping laranja).
- Card-alvo: thumb 64×64, badge, categoria/tipo, título, endereço/local.
- Bloco **NOTA GERAL DA EXPERIÊNCIA**: 5 estrelas grandes + pill com número + label dinâmico.
- **RELATO DO PILOTO**: textarea 500 chars + contador + dica tertiary.
- **FOTOS DA VISITA**: grid 4 slots, Anexar, remoção no thumb.
- Toggle **Recomendo para Comboios**.
- CTA **PUBLICAR AVALIAÇÃO** + secundário **Cancelar**.

### 3.2 Copy das estrelas (`ratingsMeta`)

| Nota | Label no pill | Cor do número |
|------|---------------|---------------|
| 0 (vazio) | Toque nas estrelas | `on-surface-variant` |
| 1 | Ruim para a irmandade | `--error` |
| 2 | Abaixo do esperado | `--secondary-fixed-dim` |
| 3 | Experiência regular | `--secondary-fixed-dim` |
| 4 | Bom para motos & paradas | `--primary` |
| 5 | Excelente para Motos & Comboios | `--secondary-container` / primary |

Número exibido no form = nota inteira (`"5"`, não `"4.9"`). No **feed**, a média agregada usa **uma casa decimal** (`4.9`).

### 3.3 Comportamento visual

- Coluna única, gutter 16px, max-width 560px (shell `(app)`).
- Cards: `surface-container-low`, `rounded-xl`, padding `card-padding-md`.
- Estrelas: ~40px, `primary-container` + `FILL 1` quando ativas; `surface-variant` vazias; toque ≥ 48px.
- CTA: altura `touch-target` (56px), `primary-container`, glow laranja, Barlow Condensed uppercase, ícone `send`.
- Cancelar: `badge-label` uppercase `on-surface-variant`.
- Tipografia: Barlow Condensed em títulos/CTA; Plus Jakarta Sans no body. Ícones Material Symbols Outlined.

### 3.4 Feed — selo de média

Nos `LocalCard` e `EventoCard` (e detalhe), quando `totalAvaliacoes > 0`:

```
★ 4.9  (12)
```

- Ícone `star` FILL + `notaMedia` (`telemetry` / `badge-label`) + contagem entre parênteses.
- Cor: `secondary-container` ou `primary-container`.
- Se `totalAvaliacoes === 0`: **omitir** o selo (não mostrar “0.0”).

Não listar autores no card do feed.

---

## 4. Fluxo do usuário

### 4.1 Avaliar local (feed)

```
Feed → aba Locais → [Avaliar]  (ou detalhe → Avaliar)
  │
  ▼
GET /locais/:id  +  GET /locais/:id/avaliacao  (própria)
  │
  ├── já tem avaliação → visão leitura (meu card + lista GET /avaliacoes)
  └── sem avaliação
        │
        ├── estrelas / relato / fotos / toggle
        ├── [Publicar] disabled até nota 1–5
        │     ├── upload fotos Storage (0–4)
        │     └── POST /locais/:id/avaliacoes
        │           ├── 201 → estado enviado → visão leitura + refetch lista
        │           ├── 409 → já existia → leitura
        │           └── 400/404 → erro no form
        └── [Cancelar] → router.back() ou /
```

### 4.2 Avaliar evento (feed / perfil)

```
Feed Eventos [Avaliar]  OU  Perfil histórico card concluido
  │
  ▼
Regras:
  ├── sem inscrição → 403 / EstadoErro “Inscreva-se primeiro”
  ├── evento ainda não encerrou → EstadoErro “A avaliação abre depois do evento”
  └── elegível → mesmo form do local (card-alvo com tipo do evento)
        └── POST /eventos/:id/avaliacoes
```

No feed, o CTA **Avaliar** no card de evento só aparece se `inscrito === true` **e** evento encerrado **e** `avaliado !== true` (campo enriquecido). Se já avaliou: link **Ver avaliação** ou omitir CTA (preferir **Ver avaliação** → mesma rota em modo leitura).

### 4.3 Perfil (SPEC 026)

| Status do card evento | Href |
|-----------------------|------|
| `confirmado` (ainda não encerrou) | Continua `/eventos/:id` (detalhe) |
| `concluido` | `/eventos/:id/avaliar` |

`aria-label`: “Avaliar ou ver avaliações de {titulo}”.

Locais **não** ganham item no histórico nesta spec.

---

## 5. Arquitetura Next.js

Seguir a skill: página orquestradora, componentes ~80 linhas, lógica em hooks, API em service. `"use client"` só com estado / toque / Storage / `useAuth`.

Bearer **só no client** (`useFunctions` / `api`). Upload de fotos no client (`src/lib/storage.ts`); a function recebe só URLs.

### 5.1 Por que a page é Server Component

`(app)/layout` já protege. A page só lê `params` e monta a tela.

```tsx
// src/app/(app)/locais/[id]/avaliar/page.tsx — Server Component
import { TelaAvaliarExperiencia } from "@/app/(app)/avaliar/components/TelaAvaliarExperiencia";

type Props = { params: Promise<{ id: string }> };

const AvaliarLocalPage = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <main>
      <TelaAvaliarExperiencia tipo="local" alvoId={id} />
    </main>
  );
};

export default AvaliarLocalPage;
```

Espelho em `eventos/[id]/avaliar/page.tsx` com `tipo="evento"`.

UI compartilhada em feature `avaliar/` (evita duplicar form).

### 5.2 Estrutura por feature

```
src/app/(app)/avaliar/
├── components/
│   ├── TelaAvaliarExperiencia.tsx      # Client — composição form | leitura
│   ├── CabecalhoAvaliar.tsx            # Voltar + título + kicker
│   ├── CardAlvoAvaliacao.tsx           # Thumb, badge, título, endereço
│   ├── SeletorNotaExperiencia.tsx      # Estrelas + pill meta
│   ├── CampoRelatoPiloto.tsx           # Textarea 500 + dica
│   ├── FotosVisita.tsx                 # Grid 4 + anexar/remover
│   ├── ToggleRecomendaComboio.tsx
│   ├── AcoesAvaliar.tsx                # Publicar + Cancelar
│   ├── ListaAvaliacoes.tsx             # Visão leitura
│   ├── CardAvaliacao.tsx
│   ├── EstadoCarregando.tsx
│   ├── EstadoErro.tsx
│   └── EstadoEnviado.tsx
├── hooks/
│   ├── useAvaliarExperiencia.ts        # GET alvo + própria + lista + POST
│   ├── useFormularioAvaliacao.ts       # nota, relato, fotos, toggle
│   └── useFotosVisita.ts               # file pick + preview + upload
├── services/
│   └── avaliacao.service.ts
├── constants.ts                        # Copy estrelas, dicas, placeholders
└── avaliar.module.css

src/app/(app)/locais/[id]/avaliar/page.tsx     # Server — tipo local
src/app/(app)/eventos/[id]/avaliar/page.tsx    # Server — tipo evento
```

Ajustes pontuais:

```
src/app/(app)/feed/components/LocalCard.tsx      # Alterar — selo média + CTA Avaliar
src/app/(app)/feed/components/EventoCard.tsx     # Alterar — selo + CTA Avaliar/Ver
src/app/(app)/feed/components/BotaoAvaliar*.tsx  # NOVO (opcional)
src/app/(app)/perfil/constants.ts               # Alterar — href concluido → avaliar
src/app/(app)/perfil/components/CardHistoricoEvento.tsx  # usa novo href
src/lib/storage.ts                              # Alterar — uploadFotoAvaliacao
src/types/avaliacao-experiencia.ts              # NOVO
src/types/local.ts / evento.ts                  # Alterar — notaMedia, totalAvaliacoes, avaliado?
```

### 5.3 Responsabilidades

| Peça | Tipo | Faz |
|------|------|-----|
| `page.tsx` (locais/eventos) | Server | Lê `id`, monta `TelaAvaliarExperiencia` |
| `TelaAvaliarExperiencia` | Client | Liga hooks + form **ou** lista |
| `useFormularioAvaliacao` | Hook | `nota`, `comentario`, `recomendaComboio`, `podeEnviar` |
| `useFotosVisita` | Hook | arquivos locais, preview, upload → URLs |
| `avaliacao.service` | Service | Chamadas `api` — **sem** Firestore no client |
| `FotosVisita` | UI | Grid; não chama Storage direto (hook) |

**Não misturar** no mesmo arquivo: JSX das estrelas + POST + `uploadBytes`.

### 5.4 Item ativo no menu

- `/locais/.../avaliar` → tratar como **Feed** (ou Locais se o hook já mapear `/locais`).
- `/eventos/.../avaliar` → **Feed**.
- Dock visível.

---

## 6. Contrato dos Dados (front)

```ts
export type TipoAlvoAvaliacao = "local" | "evento";

export type NotaAvaliacao = 1 | 2 | 3 | 4 | 5;

export type AutorAvaliacao = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
};

/** Documento de feedback (resposta da API com autor). */
export type AvaliacaoExperiencia = {
  id: string; // `{usuarioId}_{alvoId}`
  usuarioId: string;
  alvoTipo: TipoAlvoAvaliacao;
  alvoId: string; // localId | eventoId
  nota: NotaAvaliacao;
  comentario: string;
  fotosUrls: string[]; // 0..4
  recomendaComboio: boolean;
  createdAt: string; // ISO
  updatedAt: string;
  autor: AutorAvaliacao;
};

export type AvaliacaoCreate = {
  nota: NotaAvaliacao;
  comentario: string;
  fotosUrls: string[];
  recomendaComboio: boolean;
};

/** Enriquecimento no feed / detalhe. */
export type ResumoAvaliacoesAlvo = {
  notaMedia: number; // 0 se total === 0; senão 1 casa decimal
  totalAvaliacoes: number;
  recomendacoesComboio: number; // quantos marcaram o toggle
};

// LocalFeedItem / EventoFeedItem passam a incluir:
// ResumoAvaliacoesAlvo + avaliado?: boolean (só se uid tem doc)
```

Tipos em `src/types/avaliacao-experiencia.ts` e espelho em `functions/src/types/`. Não inflar `usuario-evento.ts`.

### 6.1 Regras do form

| Campo | Obrigatório | Regras |
|-------|-------------|--------|
| `nota` | Sim | Inteiro 1–5 |
| `comentario` | Não | Trim; máx. 500; `""` se vazio |
| `fotosUrls` | Não | 0–4 URLs https do Storage do projeto; sem duplicata |
| `recomendaComboio` | Sim | boolean; default `false` no form |

CTA Publicar **disabled** enquanto `nota === 0` ou `enviando` ou upload de foto em andamento.

### 6.2 Copy vazio / erro

| Situação | Título | Corpo |
|----------|--------|-------|
| Alvo inexistente | Não encontrado | Esse local/evento não existe mais. |
| Evento sem inscrição | Fora da lista | Só quem se inscreveu avalia o evento. |
| Evento ainda aberto | Ainda na grade | A avaliação abre depois do encerramento. |
| Lista vazia | Nenhuma avaliação ainda | Seja o primeiro a publicar um relato. |
| GET falhou | Não deu para carregar | Tentar de novo. |

---

## 7. Implementação Front

### 7.1 Service

```ts
// src/app/(app)/avaliar/services/avaliacao.service.ts
import { api } from "@/lib/api";
import type {
  AvaliacaoCreate,
  AvaliacaoExperiencia,
  TipoAlvoAvaliacao,
} from "@/types/avaliacao-experiencia";

const base = (tipo: TipoAlvoAvaliacao, id: string) =>
  tipo === "local" ? `/locais/${id}` : `/eventos/${id}`;

export const avaliacaoService = {
  buscarAlvo: (tipo: TipoAlvoAvaliacao, id: string) =>
    api(tipo === "local" ? `/locais/${id}` : `/eventos/${id}`),

  buscarMinha: (tipo: TipoAlvoAvaliacao, id: string) =>
    api<AvaliacaoExperiencia>(`${base(tipo, id)}/avaliacao`),

  listar: (tipo: TipoAlvoAvaliacao, id: string) =>
    api<AvaliacaoExperiencia[]>(`${base(tipo, id)}/avaliacoes`),

  publicar: (tipo: TipoAlvoAvaliacao, id: string, dados: AvaliacaoCreate) =>
    api<AvaliacaoExperiencia>(`${base(tipo, id)}/avaliacoes`, {
      method: "POST",
      body: JSON.stringify(dados),
    }),
};
```

Tratar `ApiError` (400/401/403/404/409). `GET …/avaliacao` 404 = ainda não avaliou (não é erro fatal na UI).

### 7.2 Fotos (Storage)

```ts
// src/lib/storage.ts — acréscimo
export const uploadFotoAvaliacao = async (
  uid: string,
  alvoTipo: "local" | "evento",
  alvoId: string,
  file: File,
): Promise<string> => {
  const id = crypto.randomUUID();
  const storageRef = ref(
    storage,
    `avaliacoes/${alvoTipo}/${alvoId}/${uid}/${id}.jpg`,
  );
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};
```

Fluxo submit:

1. Validar form (nota).
2. Para cada `File` pendente → `uploadFotoAvaliacao` → acumular URLs.
3. POST com `fotosUrls` (já existentes + novas).
4. Se POST falhar após upload: URLs órfãs são aceitáveis nesta spec (sem GC).

Mesmos limites: JPG/PNG, `MAX_FOTO_BYTES` (10 MB).

### 7.3 Card-alvo

| Zona | Local | Evento |
|------|-------|--------|
| Thumb | `fotoFachadaUrl` | `fotoCapaUrl` |
| Badge | **OFICIAL** (`secondary-container`) | omitir OFICIAL |
| Linha tipo | categoria (`Posto`, …) + `verified` | label do `tipo` do evento |
| Título | `nome` | `titulo` |
| Endereço | `endereco` | `local.endereco` / `local.nome` |

### 7.4 Feed CTAs

**LocalCard**

- Selo média (se houver).
- Botão / link secundário **Avaliar** → `/locais/{id}/avaliar` (sempre; se já avaliou a tela abre em leitura).
- Manter CTA Maps existente.

**EventoCard**

- Selo média.
- Se `inscrito && encerrado && !avaliado` → **Avaliar**.
- Se `avaliado` → **Ver avaliação**.
- Se não inscrito ou evento futuro → **sem** CTA de avaliar (inscrição continua SPEC 026).

Enriquecimento: `GET /locais` e `GET /eventos` passam a devolver `notaMedia`, `totalAvaliacoes`, `recomendacoesComboio` e `avaliado` (boolean do uid).

### 7.5 Acessibilidade

- Estrelas: `role="radiogroup"`; cada `role="radio"` `aria-checked`.
- Toggle: `role="switch"` `aria-checked`.
- Textarea + contador `aria-live="polite"`.
- Anexar foto: `input type="file"` com label visível **Anexar**.
- Remover foto: `aria-label="Remover foto {n}"`.
- CTA ≥ 56px; usável a partir de 360px.

### 7.6 Tokens CSS

CSS Module `avaliar.module.css`. Sem hex solto no TSX. Reusar tokens do design system (surface, primary-container, secondary-container, tertiary para a dica).

---

## 8. Backend — Coleções e rotas

Não usar `onCall`. Rotas **sem** `firestore.collection` direto. Factory em `repositories/index.ts`.

### 8.1 Documento `userslocalfeedback/{id}`

**Id:** `{usuarioId}_{localId}`.

```
{
  usuarioId: string,
  localId: string,
  nota: number,                 // 1..5
  comentario: string,           // "" ok; máx 500
  fotosUrls: string[],          // 0..4
  recomendaComboio: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 8.2 Documento `userseventofeedback/{id}`

**Id:** `{usuarioId}_{eventoId}`.

```
{
  usuarioId: string,
  eventoId: string,
  nota: number,
  comentario: string,
  fotosUrls: string[],
  recomendaComboio: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Não gravar:** `anonimo`, média no doc de feedback, dados espelhados do alvo além do id.

### 8.3 Agregação denormalizada no alvo

Nos documentos `locais` e `eventos`, **acrescentar** (default na leitura se ausente = zeros):

```
{
  notaMedia: number,              // 1 casa decimal; 0 se totalAvaliacoes === 0
  totalAvaliacoes: number,
  recomendacoesComboio: number,   // count de recomendaComboio === true
  somaNotas: number               // interno p/ incremento; NÃO expor na API pública
}
```

`somaNotas` fica só no Firestore / repositório; a API de feed **não** devolve `somaNotas`.

No `POST` bem-sucedido, em **transação** (ou batch):

1. Criar doc de feedback (fail se já existe → 409).
2. Incrementar `totalAvaliacoes`, `somaNotas += nota`, `recomendacoesComboio += recomenda ? 1 : 0`.
3. Recalcular `notaMedia = round1(somaNotas / totalAvaliacoes)`.

Sem PATCH nesta spec → não precisa decrementar.

### 8.4 Tipos (functions)

```ts
// functions/src/types/avaliacao-experiencia.ts
export type TipoAlvoAvaliacao = "local" | "evento";

export interface AvaliacaoExperiencia {
  id: string;
  usuarioId: string;
  alvoTipo: TipoAlvoAvaliacao;
  alvoId: string;
  nota: number;
  comentario: string;
  fotosUrls: string[];
  recomendaComboio: boolean;
  createdAt: string;
  updatedAt: string;
  autor: {
    uid: string;
    nome: string;
    apelido: string;
    fotoUrl: string;
  };
}

export type AvaliacaoExperienciaCreate = {
  usuarioId: string;
  alvoId: string;
  nota: number;
  comentario: string;
  fotosUrls: string[];
  recomendaComboio: boolean;
};
```

Repositório persiste **sem** `autor` / `alvoTipo` (tipo implícito pela coleção). Rota hidrata `autor` via `usuarioRepository.buscarPorIds`.

Fallback usuário apagado: `nome: "Piloto"`, `apelido: "piloto"`, `fotoUrl: ""`.

### 8.5 Quem pode escrever / ler

**POST local**

1. Token válido.
2. `locais` existe.
3. Ainda não existe feedback do par.
4. Body válido.

**POST evento**

1. Token válido.
2. `eventos` existe.
3. Existe `usersevento` do uid.
4. Evento encerrado: `now >= (dataHoraEncerramento ?? dataHoraAbertura)`.
5. Ainda não existe feedback do par.
6. Body válido.

**GET lista (`/avaliacoes`)** — qualquer autenticado (avaliações são nominais e a média já é pública no feed). Ordenar `createdAt` DESC, teto 50.

**GET própria (`/avaliacao`)** — só o uid do token; 404 se não houver.

### 8.6 Repositórios

```ts
interface UsuarioLocalFeedbackRepository {
  buscarPorId(id: string): Promise<Doc | null>;
  listarPorLocal(localId: string, limite?: number): Promise<Doc[]>;
  criar(dados: Create): Promise<Doc | "conflito">;
}

interface UsuarioEventoFeedbackRepository {
  buscarPorId(id: string): Promise<Doc | null>;
  listarPorEvento(eventoId: string, limite?: number): Promise<Doc[]>;
  criar(dados: Create): Promise<Doc | "conflito">;
}
```

Implementações Firestore + helpers de agregação nos repositórios de `local` / `evento` (`incrementarAvaliacao(...)`) **ou** service de domínio `functions/src/lib/avaliacao-experiencia.ts` orquestrando a transação.

Exportar no factory `repositories/index.ts`.

Validação body em `functions/src/lib/avaliacao-experiencia.ts`:

- `nota` inteiro 1–5
- `comentario` string trim ≤ 500
- `fotosUrls` array ≤ 4, cada item string URL não vazia (não precisa HEAD no Storage)
- `recomendaComboio` boolean

### 8.7 Rotas

Montar nos routers existentes:

```
POST /locais/:id/avaliacoes
GET  /locais/:id/avaliacoes
GET  /locais/:id/avaliacao

POST /eventos/:id/avaliacoes
GET  /eventos/:id/avaliacoes
GET  /eventos/:id/avaliacao
```

Registrar **antes** de rotas ambíguas se necessário. `autenticar` em todas.

#### POST — respostas

| Caso | Status | Corpo |
|------|--------|-------|
| Body inválido | 400 | `{ erro: "…" }` específico |
| Alvo inexistente | 404 | `{ erro: "Local/Evento não encontrado" }` |
| Evento: sem inscrição | 403 | `{ erro: "somente inscritos avaliam" }` |
| Evento: ainda não encerrou | 400 | `{ erro: "este evento ainda não encerrou" }` |
| Já existe | 409 | `{ erro: "você já avaliou" }` |
| Criado | **201** | `AvaliacaoExperiencia` (+ autor) |

#### GET lista

| Caso | Status |
|------|--------|
| Alvo inexistente | 404 |
| Ok | 200 `AvaliacaoExperiencia[]` |

#### GET própria

| Caso | Status |
|------|--------|
| Sem doc | 404 |
| Ok | 200 |

### 8.8 Enriquecer feed / detalhe

`GET /locais`, `GET /locais/:id`, `GET /eventos`, `GET /eventos/:id`:

- Ler `notaMedia`, `totalAvaliacoes`, `recomendacoesComboio` do doc (default 0).
- `avaliado`: `getAll` / existence check do id `{uid}_{alvoId}` na coleção correspondente (batch na lista, como inscrição na SPEC 026).

Não recalcular média em toda listagem — só campos denormalizados.

### 8.9 Histórico

`GET /perfil/historico` / público: **opcional** nesta spec acrescentar `avaliado: boolean` no `ItemHistoricoEvento` para o card decidir copy. Se não fizer: o href `concluido` → avaliar basta (a tela resolve form vs leitura).

**Preferência:** incluir `avaliado` no item de evento do histórico (join barato com ids compostos).

### 8.10 Índices

```json
{
  "collectionGroup": "userslocalfeedback",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "localId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "userseventofeedback",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "eventoId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

Busca por id composto não precisa de índice.

### 8.11 O que não muda

- Function HTTP única `api`.
- `usersrolefeedback` / guarda de feedback de rolê.
- Schema de inscrição `usersevento` (só leitura para elegibilidade).
- Security Rules deny-all no client.
- Sem efeito em mapas / rota de rolê.

Health em `GET /` da function: listar os novos paths.

---

## 9. Wireframes

### 9.1 Form (local)

```
┌─────────────────────────────────┐
│ [←]  AVALIAR EXPERIÊNCIA        │
│      Feedback da Irmandade      │
├─────────────────────────────────┤
│ ┌────┬────────────────────────┐ │
│ │thumb│ OFICIAL  POSTO         │ │
│ │     │ NOME DO LOCAL          │ │
│ │     │ 📍 endereço            │ │
│ └────┴────────────────────────┘ │
│                                 │
│   NOTA GERAL DA EXPERIÊNCIA     │
│      ★ ★ ★ ★ ★                  │
│   [ 5 | Excelente para Motos… ] │
│                                 │
│   RELATO DO PILOTO      0/500   │
│   [ textarea …                ] │
│   💡 Dica: asfalto / piso…      │
│                                 │
│   FOTOS DA VISITA    Até 4      │
│   [img][img][+Anexar][ ]        │
│                                 │
│   👍 Recomendo para Comboios [◼]│
│                                 │
│ [ ✈ PUBLICAR AVALIAÇÃO        ] │
│         CANCELAR                │
├─────────────────────────────────┤
│  dock SPEC 001                  │
└─────────────────────────────────┘
```

### 9.2 Card feed com média

```
┌─────────────────────────────────┐
│ [Aberto 24H] [Posto]   ★ 4.9(12)│
│ NOME DO LOCAL              [🖼] │
│ endereço                        │
│ [ Maps ]            [ Avaliar ] │
└─────────────────────────────────┘
```

### 9.3 Leitura (já publicou)

```
│  Card-alvo …                    │
│  SEU RELATO + lista da irmandade│
│  [ VOLTAR AO FEED ]             │
```

---

## 10. Fora do escopo

- Interceptação global de sessão (SPEC 010 continua só para rolê).
- Editar / apagar avaliação.
- Moderação, denúncia, anonimato.
- Usar `recomendaComboio` para ordenar feed ou pintar mapa.
- Avaliar local a partir do histórico de pistas.
- Push “avalie o evento que você foi”.
- Paginação infinita da lista (teto 50).
- GC de fotos órfãs no Storage.
- Tabs Ponto/Evento e sino do mock.

---

## 11. Critérios de Aceite

### Front — tela

- [ ] `/locais/:id/avaliar` e `/eventos/:id/avaliar` seguem o mock (kicker, card-alvo, estrelas, relato 500, fotos ≤4, toggle, Publicar, Cancelar).
- [ ] Sem tabs Ponto/Evento; tipo pela rota.
- [ ] CTA Publicar **disabled** até nota 1–5.
- [ ] Upload JPG/PNG ≤10 MB; máx. 4; remoção no preview.
- [ ] POST 201: feedback de sucesso e visão leitura com autor.
- [ ] Já avaliou: não reabre form; mostra lista.
- [ ] Evento sem inscrição / ainda aberto: EstadoErro claro.
- [ ] `page.tsx` Server; Client só com interatividade; componentes ~80 linhas; service sem Firestore.
- [ ] Toque ≥ 48/56px; CSS Modules + tokens; dock visível.

### Front — feed / perfil

- [ ] Cards Locais e Eventos mostram ★ média + (N) quando `totalAvaliacoes > 0`.
- [ ] CTA Avaliar no local; no evento só se inscrito + encerrado (+ Ver avaliação se já avaliou).
- [ ] Card histórico evento `concluido` → `/eventos/:id/avaliar`.

### Back

- [ ] Coleções `userslocalfeedback` e `userseventofeedback`; id composto.
- [ ] POST local: qualquer auth; 201; 409 se duplicata; agrega no doc `locais`.
- [ ] POST evento: exige `usersevento` + encerrado; agrega no doc `eventos`.
- [ ] `usuarioId` só do token; `somaNotas` não vaza na API.
- [ ] GET lista autenticada com `autor`; GET própria 404 se vazio.
- [ ] Feed/detalhe devolvem `notaMedia`, `totalAvaliacoes`, `avaliado`.
- [ ] Persistência só via repositórios; índices no `firestore.indexes.json`.

### Integração

- [ ] Publicar avaliação de local → próximo `GET /locais` reflete média.
- [ ] Inscrever + evento encerrado + POST → média no card de eventos; item no histórico leva à leitura.
- [ ] Dois POSTs do mesmo uid no mesmo alvo → impossível (409 / id composto).

---

## 12. Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| `docs/specs/027-feedback-locais-e-eventos.md` | **NOVO** (este) |
| `src/types/avaliacao-experiencia.ts` | **NOVO** |
| `src/types/local.ts` / `evento.ts` | **Alterar** — resumo + `avaliado` |
| `src/types/historico-pistas.ts` | **Alterar** — `avaliado?` em evento |
| `src/app/(app)/avaliar/**` | **NOVO** — UI compartilhada |
| `src/app/(app)/locais/[id]/avaliar/page.tsx` | **NOVO** |
| `src/app/(app)/eventos/[id]/avaliar/page.tsx` | **NOVO** |
| `src/app/(app)/feed/components/LocalCard.tsx` | **Alterar** |
| `src/app/(app)/feed/components/EventoCard.tsx` | **Alterar** |
| `src/app/(app)/perfil/constants.ts` (+ card evento) | **Alterar** — href |
| `src/lib/storage.ts` | **Alterar** — `uploadFotoAvaliacao` |
| `functions/src/types/avaliacao-experiencia.ts` | **NOVO** |
| `functions/src/types/local.ts` / `evento.ts` | **Alterar** — campos agregados |
| `functions/src/routes/avaliacao-local.ts` | **NOVO** |
| `functions/src/routes/avaliacao-evento.ts` | **NOVO** |
| `functions/src/routes/locais.ts` / `eventos.ts` | **Alterar** — montar + enriquecer GET |
| `functions/src/lib/avaliacao-experiencia.ts` | **NOVO** — validação + agregação |
| `functions/src/repositories/interfaces/usuario-*-feedback.repository.ts` | **NOVO** |
| `functions/src/repositories/firestore/firestore-usuario-*-feedback.repository.ts` | **NOVO** |
| `functions/src/repositories/index.ts` | **Alterar** |
| `firestore.indexes.json` | **Alterar** |
| `.cursor/rules/tech-stack.mdc` / `project-context.mdc` | **Alterar** na implementação |

---

## 13. Checklist da skill Next.js

- [ ] `page.tsx` sem `"use client"` (só orquestra + `params`).
- [ ] `"use client"` só em tela, formulário, fotos, toggles.
- [ ] Estado do form / upload / POST em hooks separados.
- [ ] HTTP em `avaliacao.service.ts`; Storage em `storage.ts` + hook de fotos.
- [ ] Um componente = uma coisa (card-alvo, estrelas, relato, fotos, toggle, lista).
- [ ] Sem abstração genérica “FeedbackEntity” misturando rolê (SPEC 010).
- [ ] Sem `console.log` de debug; sem Firestore no client.

---

## 14. Ordem sugerida de implementação

1. Tipos + campos agregados em `locais` / `eventos` (default 0 na leitura).
2. Repositórios de feedback + POST/GET local + transação de média.
3. POST/GET evento + checagem `usersevento` + encerrado.
4. Enriquecer `GET /locais` e `GET /eventos` (`notaMedia`, `avaliado`).
5. Feature front `/avaliar` + rotas page local/evento + Storage fotos.
6. Selo + CTA nos cards do feed.
7. Href histórico evento `concluido` (+ `avaliado` no payload se couber).
8. Atualizar `tech-stack` / `project-context`.

---

## 15. Relação com o código atual

| Hoje | Nesta spec |
|------|------------|
| SPEC 010 avalia só rolê; média fora do feed | Locais/eventos com média **no feed** |
| SPEC 026 inscrição + histórico de eventos | Evento concluído leva a avaliar |
| Cards Locais/Eventos sem reputação | ★ média + (N) |
| Sem coleção de avaliação de destino | `userslocalfeedback` + `userseventofeedback` |
| Upload só perfil/capa/fachada | + `avaliacoes/{tipo}/{alvoId}/{uid}/…` |
| Mock com tabs e 4.9 no form | Tipo na URL; form com nota inteira |

**Não implementar nesta tarefa de especificação** — este arquivo é o contrato para o desenvolvimento full stack seguinte.
