# SPEC 010 — Feedback do Rolê

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-09  
> **Referência visual:** `designs/tela-feedback/` (`DESIGN.md`, `code.html`, `screen.png`)  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade  
> **Backend:** Cloud Function `api` (Express) — pendente em `GET /feedback/pendente`; envio em `POST /roles/:id/feedback`; listagem em `GET /roles/:id/feedbacks`  
> **Coleção Firestore:** `usersrolefeedback` (um relato por par usuário + rolê)  
> **Depende de:** SPEC 001 (shell autenticado + dock), SPEC 003 (`roles` + `GET /roles/:id`), SPEC 005 (`usersrole` + pedido do piloto), SPEC 007 (líder aceita → `aceito: true`), SPEC 008 (histórico / aba Participei)

---

## 1. Objetivo

Depois que um rolê **já saiu**, o piloto que **confirmou vaga** avalia a pista: nota de 1 a 5, destaques (tags) e um relato opcional. Esse feedback **fica visível para o comboio** (demais confirmados e o organizador).

A tela **intercepta a entrada no app** (uma vez por sessão): se existe rolê concluído sem avaliação, o piloto cai em `/roles/:id/feedback` antes do feed. Ele pode **salvar** ou **pular por enquanto**.

Esta spec é **full stack**:

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | UI do mock (kicker, card do rolê, estrelas, tags, relato, CTAs), guarda de entrada, POST do relato, listagem do comboio |
| Back (Functions) | Token válido, coleção `usersrolefeedback`, uid só do token, um doc por par, listagem só para quem estava no rolê |

O uid **nunca** vem da query nem do body. Só quem tem `usersrole` **aceito** naquele rolê envia. Só o comboio (confirmados + organizador) lê a lista.

---

## 2. Referência de Design

Replicar o visual de `designs/tela-feedback/` (`code.html` + `screen.png`). Não inventar outro layout. Tokens em `DESIGN.md` / `globals.css`.

### O que entra nesta spec (do mock)

- Header sticky: logo + **Roles Feed / Cockpit** + avatar (link para `/perfil`) — mesmo bloco do feed.
- Kicker **Avaliação de Rota** (ícone `route` em círculo laranja).
- Título **Como foi esta rota?**
- Subtítulo explicando que a avaliação serve ao comboio deste trajeto.
- Card-resumo do rolê concluído: capa 80×80, km sobre a foto, título, rota partida → destino, criador `@apelido`.
- Bloco **Avaliação Geral da Rota e Trajeto**: 5 estrelas + título/subtítulo dinâmicos da nota.
- **Destaques do Trajeto (Múltipla escolha)**: chips selecionáveis.
- **Relato do Piloto** (opcional): textarea 280 caracteres + contador.
- CTA primário **Salvar Avaliação da Rota**.
- Secundário **Pular por enquanto**.

### O que o mock mostra e **não** entra

| Elemento do mock | Motivo |
|------------------|--------|
| Sino de notificações no header | Mesmo recorte das SPECs 001–009 |
| Badge **Rota Clonável** no kicker | Sem flag de clonagem no schema (SPEC 009 não grava linhagem) |
| Badge **Trajeto Clonado** no card | Idem — não há `roleIdOrigem` persistido no documento `roles` |
| Selo **Top Rota** | Sem índice de qualidade agregado |
| Banner **Comentário 100% Anônimo** | Pedido explícito: o feedback é **visível** aos demais participantes, com identidade |
| **Criptografado ponta a ponta** | Firestore guarda texto em claro; não mentir na UI |
| **Índice de Qualidade da Rota** / **Trajeto Verificado** no feed | Agregação + selo no card do feed = spec futura (SPEC 008 já deixou reputação de fora) |
| Estrelas preenchidas em 5 por padrão no HTML estático | Relato sem toque na estrela inflaria nota 5; ver desvio abaixo |
| Menu inferior | Já na SPEC 001 |

### Desvios conscientes do mock (necessários)

O HTML é uma avaliação estática de um rolê fictício. No app a tela é **gate de sessão** + formulário real + lista do comboio.

| Mock | Nesta spec | Por quê |
|------|------------|---------|
| Página “já aberta”, sem rota | `/roles/:id/feedback` autenticada | Um rolê por URL; reusa o `id` das SPECs 003/005 |
| Comentário anônimo / E2E | Relato **atribuído** (`@apelido` + foto) visível ao comboio | Pedido explícito de visibilidade entre participantes |
| Copy do aviso de reputação pública no feed | Copy honesta: o relato fica **neste rolê**, para quem confirmou | Sem selo no feed nesta spec |
| 5 estrelas pré-selecionadas | Nenhuma estrela até o toque; CTA **disabled** enquanto `nota === 0` | Evita enviar 5 sem avaliar |
| Título HTML 5★ *Trajeto Espetacular!* vs JS *Experiência Épica!* | Usar o mapa **interativo do `<script>`** (`ratingsMeta`) | É o comportamento do protótipo ao clicar |
| Pular só some o overlay no DOM | `sessionStorage` da sessão + `replace("/")` | “Por enquanto” = não bloqueia o app; pergunta de novo na próxima sessão |
| Só o formulário | Se o uid **já** avaliou: formulário some; mostra o próprio relato + **Relatos do comboio** | Sem mock de lista — tokens iguais; senão a visibilidade não tem tela |
| Card Participei (SPEC 008) sempre → `/participar` | Se `status === "concluido"` → `/roles/:id/feedback` | Rolê passado: o destino útil é avaliar / ler o comboio |

Não adicionar mapa, chat, edição do relato depois de enviado, nem média no card do feed.

### Comportamento visual (do mock)

- Conteúdo em coluna única, gutter 16px, **max-width 560px** (já no shell `(app)`).
- Header fixo, altura 64px + `env(safe-area-inset-top)`, fundo `surface` com blur.
- Main: `pt-16` (header) + `pb-24` (dock), `space-y-5`, padding horizontal `margin-mobile`.
- Kicker: ícone 28px círculo `primary-container/20`, label `badge-label` uppercase `primary-container`.
- Título: `headline-lg` uppercase Barlow Condensed.
- Subtítulo: `body-md` `on-surface-variant`.
- Card do rolê: `surface-container`, `rounded-xl`, padding `card-padding-md`, thumb 80×80 (`w-20 h-20`) `rounded-lg`. Km: pill sobre a foto, `badge-label` `secondary-fixed-dim`.
- Título curto no card: `badge-label` uppercase `primary`. Título principal: `headline-sm` uppercase, `truncate`.
- Rota: ícone `near_me` `primary-container` + `{partida} → {destino}` `body-sm` `truncate`.
- Faixa do criador: fundo `surface-container-high/40`, `Criador da Rota: @apelido`.
- Bloco das estrelas: `surface-container`, `rounded-xl`, padding `card-padding-lg`, centro.
- Estrela: botão `touch-min` (48px), ícone `star` ~36px (`text-4xl`). Preenchida: `primary-container` + `FILL 1`. Vazia: `surface-variant` + `FILL 0`. `active:scale-90`.
- Meta da nota: caixa `surface-container-low`, título `headline-sm` uppercase na cor da faixa (ver §5.2).
- Chips: pill, `label-md`. Ativo: `primary-container` + `on-primary-container` + ícone `check_circle`. Inativo: `surface-container` + `on-surface-variant` + ícone semântico do tag.
- Textarea: `surface-container-low`, `rounded-xl`, 3 linhas, sem resize. Foco: `surface-container`.
- CTA: altura `touch-target` (56px), `primary-container`, glow `0 4px 16px rgba(255,107,0,0.35)`, Barlow Condensed uppercase.
- Pular: altura ~44px, `label-md` uppercase `on-surface-variant`.

### Copy das estrelas (`ratingsMeta` do mock)

| Nota | Título | Subtítulo | Cor do título |
|------|--------|-----------|---------------|
| 1 | Desorganizado e Perigoso | Houve falhas graves de ritmo, segurança ou rota. | `--error` |
| 2 | Abaixo do Esperado | O comboio se perdeu ou houve desatenção com pilotos. | `--secondary-fixed-dim` |
| 3 | Rolê Regular | Foi legal, mas com pontos claros de melhoria. | `--secondary-fixed-dim` |
| 4 | Muito Bom! Comboio Firme | Boa liderança, ritmo constante e trajeto agradável. | `--primary` |
| 5 | Experiência Épica! | Pista limpa, comboio coeso e liderança impecável. | `--primary-container` |

Com `nota === 0`: título **Toque nas estrelas**; subtítulo **Diga como foi a pista e o comboio.**; cor `on-surface-variant`.

### Tags (enum fechado)

| `id` | Label | Ícone inativo |
|------|-------|----------------|
| `asfalto_tapete` | Asfalto tapete | `layers` |
| `mirantes_incriveis` | Mirantes incríveis | `landscape` |
| `pouco_trafego` | Pouco tráfego | `traffic` |
| `visual_cinematografico` | Visual cinematográfico | `movie` |
| `boas_curvas` | Boas Curvas | `turn_sharp_right` |
| `parada_bem_estruturada` | Parada bem estruturada | `storefront` |

Múltipla escolha, **zero ou mais**. Sem tag obrigatória.

### Copy que substitui anonimato / E2E / selo do feed

| Zona do mock | Nesta spec |
|--------------|------------|
| Badge “Comentário 100% Anônimo” | Ícone `group`; título **Visível para o comboio**; corpo *O organizador e os pilotos confirmados veem seu @apelido, a nota e o relato.* |
| “Criptografado ponta a ponta” | **Só quem confirmou neste rolê** (ícone `lock`) |
| Aviso “Índice de Qualidade / Trajeto Verificado” | *Sua nota e os destaques ficam neste rolê para o comboio consultar depois. Não publicamos média no feed nesta versão.* |

---

## 3. Fluxo do Usuário

```
Login / sessão já autenticada
  │
  ▼
GuardaApp (SPEC 001) — token + perfil
  │
  ▼
GuardaFeedbackPendente  (uma vez por aba/sessão)
  │
  ├── session já checada neste tab → segue a rota pedida
  ├── já está em /roles/:id/feedback → segue
  └── GET /feedback/pendente
        ├── role == null → marca sessão checada, segue
        └── role.id      → replace /roles/{id}/feedback
              │
              ▼
GET /roles/:id  +  GET /roles/:id/feedbacks
  │
  ├── 404 → EstadoErro “Rolê não encontrado”
  ├── 403 → EstadoErro “Só o comboio avalia / lê este rolê”
  ├── dataHoraSaida no futuro → EstadoErro “Este rolê ainda não aconteceu”
  ├── uid já tem relato → visão leitura (meu card + lista do comboio)
  └── sem relato (participante aceito, rolê passado)
        │
        ├── Estrelas / tags / textarea (local)
        ├── [Salvar] disabled até nota 1–5
        │     └── POST /roles/:id/feedback
        │           ├── 201 → estado “Avaliação enviada!” ~1,1s (como o mock)
        │           │         depois visão leitura + lista (refetch GET feedbacks)
        │           ├── 409 → já existia; vai para visão leitura
        │           └── 400 / 403 / 404 → erro no form, permanece
        └── [Pular por enquanto] → sessionStorage skip deste roleId
                                    + sessão checada + replace("/")
```

- **Salvar** não pede confirm. **Pular** não grava no Firestore.
- Pular **não** descarta o direito de avaliar: na **próxima** sessão o mesmo rolê volta a interceptar, se ainda for o pendente mais recente.
- Vários rolês sem nota: o GET pendente devolve **um** (saída mais recente já passada). Pular este → feed nesta sessão; o próximo entra na sessão seguinte.
- Organizer **não** é interceptado (não há `usersrole` dele — SPEC 005). Ele **pode** abrir `/roles/:id/feedback` e **só ler** a lista (GET 200, POST 403).
- Avatar do header → `/perfil`.
- Voltar pelo dock **Rolês** durante o form: a guarda já marcou a sessão? **Não** até pular ou não haver pendente. Se o piloto toca Rolês sem pular, o `pathname` muda para `/` — a guarda, se ainda não checou, redirecionaria de novo. Por isso: ao **montar** a tela de feedback, marcar `feedback-entrada-checada` **sem** contar como pulado. Assim o dock funciona; a interceptação já cumpriu. Pular continua só o skip daquele `roleId` para não reabrir o mesmo form se o GET pendente ainda apontar para ele nesta sessão (não reconsulta). Detalhe na §6.3.

### Como o piloto chega aqui

| Origem | Comportamento |
|--------|----------------|
| Entrada no app (sessão nova) | Guarda redireciona se `GET /feedback/pendente` tiver rolê |
| Histórico → aba **Participei**, card `concluido` | Link para `/roles/:id/feedback` (form ou lista) |
| Histórico → card `confirmado` (ainda não saiu) | Continua `/roles/:id/participar` (SPEC 008) |
| URL direta | GuardaApp + regras da tela (403 se não é comboio) |

Sem item novo no menu.

---

## 4. Arquitetura Next.js

Seguir a skill: página orquestradora, componentes ~80 linhas, lógica em hooks, API em service. `"use client"` só no que tem estado, toque ou `useAuth`.

O feedback **não** pode ser Server Action com fetch no servidor: a rule do projeto exige Bearer no client (`auth.currentUser`).

### 4.1 Por que a page é Server Component

`(app)/layout` já protege a rota. `/roles/[id]/feedback` só monta a tela. O `id` vem dos `params` (Promise no Next 15).

```tsx
// src/app/(app)/roles/[id]/feedback/page.tsx — Server Component
import { TelaFeedbackRole } from "./components/TelaFeedbackRole";

type Props = { params: Promise<{ id: string }> };

const FeedbackRolePage = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <main>
      <TelaFeedbackRole roleId={id} />
    </main>
  );
};

export default FeedbackRolePage;
```

### 4.2 Estrutura por feature

```
src/app/(app)/roles/[id]/feedback/
├── page.tsx                              # Server — orquestrador
├── components/
│   ├── TelaFeedbackRole.tsx              # Client — composição
│   ├── CabecalhoAvaliacao.tsx            # Kicker + título + subtítulo
│   ├── CardResumoRole.tsx                # Capa, km, título, rota, criador
│   ├── SeletorNota.tsx                   # 5 estrelas + meta
│   ├── TagsDestaque.tsx                  # Chips múltiplos
│   ├── CampoRelato.tsx                   # Label, aviso comboio, textarea
│   ├── AvisoVisibilidade.tsx             # Bloco “só o comboio”
│   ├── AcoesFeedback.tsx                 # Salvar + Pular
│   ├── ListaRelatosComboio.tsx           # Visão leitura
│   ├── CardRelato.tsx                    # Um item da lista
│   ├── EstadoCarregando.tsx
│   ├── EstadoErro.tsx
│   └── EstadoEnviado.tsx                 # CTA “Avaliação Enviada!” (~1,1s)
├── hooks/
│   ├── useFeedbackRole.ts                # GET detalhe + lista + POST
│   └── useFormularioFeedback.ts          # nota, tags, relato, validação
├── services/
│   └── feedback.service.ts
├── constants.ts                          # Copy estrelas, tags, avisos
└── feedback-role.module.css
```

Guarda de entrada (não vive na feature da rota):

```
src/app/(app)/components/GuardaFeedbackPendente.tsx   # NOVO
src/app/(app)/hooks/useFeedbackPendenteEntrada.ts     # NOVO
src/app/(app)/services/feedback-pendente.service.ts   # NOVO — ou reusa feedback.service
```

Reusar `CabecalhoFeed`. Reusar Haversine já vem no `GET /roles/:id` (`distanciaKm`). **Não** copiar o service de participação.

Ajuste pontual no histórico (SPEC 008):

```
src/app/(app)/perfil/components/CardHistorico.tsx     # Alterar — href se concluido
```

### 4.3 Responsabilidades

| Peça | Tipo | Faz |
|------|------|-----|
| `page.tsx` | Server | Lê `id`, monta `TelaFeedbackRole` |
| `TelaFeedbackRole` | Client | Liga hooks + header + form **ou** lista |
| `useFeedbackRole` | Hook | Loading, erro, detalhe, lista, POST, pular |
| `useFormularioFeedback` | Hook | `nota`, `tags`, `comentario`, `podeEnviar` |
| `feedback.service` | Service | Chamadas `api` — **sem** Firestore no client |
| `GuardaFeedbackPendente` | Client | Um GET pendente por sessão + redirect |
| `SeletorNota` | UI | Estrelas + meta |
| `ListaRelatosComboio` | UI | Cards de leitura |

**Não misturar** no mesmo arquivo: JSX das estrelas + POST + sessionStorage.

**Não** usar `addDoc` / `setDoc` em `src/lib/firestore.ts`. Persistência só pela function.

### 4.4 Item ativo no menu

`useItemMenuAtivo` já trata `/roles...` como Rolês. `/roles/:id/feedback` **não** muda o hook. Dock visível (como o mock).

---

## 5. Contrato dos Dados (front)

```ts
export const TAGS_FEEDBACK = [
  "asfalto_tapete",
  "mirantes_incriveis",
  "pouco_trafego",
  "visual_cinematografico",
  "boas_curvas",
  "parada_bem_estruturada",
] as const;

export type TagFeedback = (typeof TAGS_FEEDBACK)[number];

export type NotaFeedback = 1 | 2 | 3 | 4 | 5;

export type AutorFeedback = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
};

export type UsuarioRoleFeedback = {
  id: string; // `{usuarioId}_{roleId}`
  usuarioId: string;
  roleId: string;
  nota: NotaFeedback;
  tags: TagFeedback[];
  comentario: string;
  createdAt: string; // ISO
  updatedAt: string;
  autor: AutorFeedback;
};

export type FeedbackPendente = {
  role: {
    id: string;
    titulo: string;
    dataHoraSaida: string;
  } | null;
};

export type FeedbackCreate = {
  nota: NotaFeedback;
  tags: TagFeedback[];
  comentario: string;
};
```

Tipos em `src/types/usuario-role-feedback.ts` (front) e o mesmo shape em `functions/src/types/usuario-role-feedback.ts`. Não inflar `usuario-role.ts`.

`RoleDetalhe` da SPEC 005 **não** ganha `meuFeedback` — a tela busca a lista em paralelo.

### 5.1 Regras do form

| Campo | Obrigatório | Regras |
|-------|-------------|--------|
| `nota` | Sim | Inteiro 1–5 |
| `tags` | Não | Subconjunto do enum, sem duplicata, máx. 6 |
| `comentario` | Não | Trim; máx. 280; `""` se vazio |

### 5.2 Copy do vazio / erro

| Situação | Título | Corpo |
|----------|--------|-------|
| Rolê inexistente | Rolê não encontrado | Esse comboio não existe mais. |
| Sem permissão | Fora do comboio | Só quem teve a vaga confirmada avalia e lê os relatos. |
| Ainda não saiu | Ainda na grade | A avaliação abre depois da hora de saída. |
| Lista vazia (organizador, ninguém avaliou) | Nenhum relato ainda | Quando o comboio avaliar, os cards aparecem aqui. |
| GET falhou | Não deu para carregar | Tentar de novo. |

Pular **não** tem toast. Salvar: o próprio CTA vira **Avaliação Enviada!** (ícone `check_circle`), como o script do mock (~1100 ms), depois a visão leitura.

---

## 6. Implementação Front

### 6.1 Service

```ts
// src/app/(app)/roles/[id]/feedback/services/feedback.service.ts
import { api } from "@/lib/api";
import type {
  FeedbackCreate,
  FeedbackPendente,
  UsuarioRoleFeedback,
} from "@/types/usuario-role-feedback";
import type { RoleDetalhe } from "@/types/role";

export const feedbackService = {
  buscarPendente: () => api<FeedbackPendente>("/feedback/pendente"),

  buscarDetalhe: (roleId: string) => api<RoleDetalhe>(`/roles/${roleId}`),

  listar: (roleId: string) =>
    api<UsuarioRoleFeedback[]>(`/roles/${roleId}/feedbacks`),

  enviar: (roleId: string, dados: FeedbackCreate) =>
    api<UsuarioRoleFeedback>(`/roles/${roleId}/feedback`, {
      method: "POST",
      body: JSON.stringify(dados),
    }),
};
```

Usar `api` (Bearer automático). Tratar `ApiError` (400/401/403/404/409).

O detalhe do rolê **reusa** `GET /roles/:id` (já existe). Não criar `GET /roles/:id/feedback` singular.

### 6.2 Hook do form (esqueleto)

```ts
const useFormularioFeedback = () => {
  // nota: 0 | 1..5
  // tags: Set<TagFeedback>
  // comentario: string (slice 280)
  // podeEnviar = nota >= 1 && !enviando
  return { nota, setNota, tags, toggleTag, comentario, setComentario, podeEnviar };
};
```

### 6.3 Guarda de entrada

Chaves `sessionStorage` (escopo da aba):

| Chave | Significado |
|-------|-------------|
| `rolemoto.feedback.entrada-checada` | Já rodou o GET pendente **ou** já abriu a tela de feedback nesta sessão |
| `rolemoto.feedback.pulados` | JSON `string[]` de `roleId` pulados nesta sessão (reserva; a checagem não dispara de novo) |

Algoritmo em `useFeedbackPendenteEntrada`:

1. Se `loading` do `GuardaApp` / não autorizado → não faz nada.
2. Se `pathname` casa com `/roles/[^/]+/feedback` → seta `entrada-checada` e libera.
3. Se `entrada-checada` → libera.
4. GET `/feedback/pendente`. Falha de rede → **libera** (o app não fica preso; o histórico ainda leva à tela).
5. Se `role == null` → seta checada, libera.
6. Se tem `role.id` → `router.replace("/roles/{id}/feedback")`.

Montar **dentro** de `GuardaApp`, depois de `autorizado`, para não disparar sem token.

```tsx
// src/app/(app)/layout.tsx
<GuardaApp>
  <GuardaFeedbackPendente>
    <div className={styles.shell}>...</div>
  </GuardaFeedbackPendente>
</GuardaApp>
```

`GuardaFeedbackPendente` pode mostrar o **mesmo** spinner do `GuardaApp` enquanto o GET pendente não volta (só na primeira checagem). Telas `(auth)` não entram neste layout.

Pular:

```ts
sessionStorage.setItem("rolemoto.feedback.entrada-checada", "1");
router.replace("/");
```

Não precisa persistir `pulados` se a checagem é única por sessão. Manter a chave só se no futuro a guarda passar a reconsultar; **nesta spec** checagem única basta.

### 6.4 Quem vê o form vs a lista

| Condição | UI |
|----------|----|
| Participante aceito, rolê passado, **sem** relato próprio | Form do mock |
| Participante aceito, **com** relato próprio | Lista (destaque “Seu relato”) |
| Organizador | Só lista (sem Salvar / Pular) |
| Recém POST 201 | CTA sucesso → lista |

Pular **só** no form. Na lista, CTA **Voltar ao Feed** (`/`) no lugar de Pular.

### 6.5 Card-resumo

Dados de `RoleDetalhe`:

| Zona | Campo |
|------|--------|
| Capa | `fotoCapaUrl` (placeholder `surface-container-high` se vazio) |
| Km | `{distanciaKm} KM` |
| Título | `titulo` (o mock tinha duas linhas de nome — usar **uma**: `headline-sm`) |
| Rota | `{localSaida.endereco} → {destinoFinal.endereco}` |
| Criador | `@` + `criador.apelido` |

Sem badge de ritmo neste card (o mock não usa o chip de ritmo aqui; usa “Trajeto Clonado”, que omitimos). Sem **Top Rota**.

### 6.6 Histórico (SPEC 008)

Em `CardHistorico`, se `status === "concluido"`: `href={`/roles/${roleId}/feedback`}`. Demais status inalterados.

`aria-label`: “Avaliar ou ver relatos de {titulo}”.

### 6.7 Tokens CSS

CSS Modules em `feedback-role.module.css`. Sem hex solto no TSX.

| Token | Uso |
|-------|-----|
| `--surface` / `--surface-container` / `-low` / `-high` / `-lowest` | Página, cards, chips inativos, textarea |
| `--primary` / `--primary-container` | Kicker, título do card, estrelas, chips ativos, CTA, nota 4/5 |
| `--secondary-fixed-dim` | Km na capa, notas 2 e 3 |
| `--error` | Nota 1 |
| `--on-surface` / `--on-surface-variant` | Título / corpo / pular |
| `--gutter-md` / `--touch-min` / `--touch-target` | Espaçamento e toque |

Tipografia: Barlow Condensed em títulos/CTA/badges; Plus Jakarta Sans no body. Ícones: Material Symbols Outlined.

Padding inferior: dock (SPEC 001).

### 6.8 Acessibilidade

- Grupo de estrelas: `role="radiogroup"` `aria-label="Nota da rota"`; cada botão `role="radio"` `aria-checked` `aria-label="{n} estrela(s)"`.
- Chips: `aria-pressed` no estado selecionado.
- Textarea: `label` associado; contador `aria-live="polite"`.
- CTA Salvar: texto visível; `disabled` sem nota ou enquanto `enviando`.
- Pular: `aria-label="Pular avaliação por enquanto"`.
- Lista: `aria-label="Relatos do comboio"`.
- Avatar do relato: `alt="Foto de {nome}"`.
- Área de toque ≥ 48px; CTA 56px; usável a partir de 360px.
- Foco inicial: primeira estrela (form) ou heading da lista (leitura).

### 6.9 Header

Reusar `CabecalhoFeed`. Sem sino. Avatar → `/perfil`.

---

## 7. Backend — Coleção `usersrolefeedback` e rotas

Não usar `onCall`. Rotas **sem** `firestore.collection` direto. Factory em `repositories/index.ts`.

Em Firestore “tabela” = coleção. Nome pedido pelo produto: **`usersrolefeedback`**.

### 7.1 Documento Firestore (`usersrolefeedback/{id}`)

**Id do documento:** `{usuarioId}_{roleId}` (um relato por par; idempotente).

```
{
  usuarioId: string,     // uid do token na criação
  roleId: string,
  nota: number,          // 1..5
  tags: string[],        // enum TagFeedback
  comentario: string,    // "" permitido
  createdAt: timestamp,
  updatedAt: timestamp
}
```

| Campo | Obrigatório | Notas |
|-------|-------------|-------|
| `usuarioId` | Sim | Só do Bearer. Nunca do body |
| `roleId` | Sim | Param da URL |
| `nota` | Sim | Inteiro 1–5 |
| `tags` | Sim | Array; pode `[]` |
| `comentario` | Sim | String; máx 280 após trim |
| `createdAt` | Sim | Server timestamp na criação |
| `updatedAt` | Sim | Igual a `createdAt` nesta spec (sem PATCH) |

**Não gravar:** `anonimo`, ciphertext, média do rolê, `criadorId` (o join com `roles` basta). Sem array de feedbacks dentro de `roles`.

**Não** há PATCH/DELETE nesta spec. Relato é definitivo.

### 7.2 Tipos de domínio (Functions)

```ts
// functions/src/types/usuario-role-feedback.ts
export type TagFeedback =
  | "asfalto_tapete"
  | "mirantes_incriveis"
  | "pouco_trafego"
  | "visual_cinematografico"
  | "boas_curvas"
  | "parada_bem_estruturada";

export interface UsuarioRoleFeedback {
  id: string;
  usuarioId: string;
  roleId: string;
  nota: number;
  tags: TagFeedback[];
  comentario: string;
  createdAt: string;
  updatedAt: string;
  autor: {
    uid: string;
    nome: string;
    apelido: string;
    fotoUrl: string;
  };
}

export type UsuarioRoleFeedbackCreate = {
  usuarioId: string;
  roleId: string;
  nota: number;
  tags: TagFeedback[];
  comentario: string;
};

export type FeedbackPendente = {
  role: { id: string; titulo: string; dataHoraSaida: string } | null;
};
```

O repositório persiste **sem** `autor`. A rota hidrata `autor` via `usuarioRepository.buscarPorIds`.

Fallback se o usuário foi apagado: `nome: "Piloto"`, `apelido: "piloto"`, `fotoUrl: ""`.

### 7.3 Quem pode escrever / ler

**POST** — todas as condições:

1. Token válido.
2. Documento `roles` existe.
3. `dataHoraSaida` **já passou** (`Date.parse <= Date.now()`).
4. Existe `usersrole` do uid neste rolê com pedido **aceito** (`ePedidoAceito` da SPEC 008).
5. uid **não** é o `criadorId` (o líder não autoavalia o próprio comboio por este POST).
6. Ainda não existe doc de feedback deste par.

**GET lista** — token válido **e** um de:

- `criadorId === uid`, ou
- `usersrole` aceito do uid neste rolê.

Pendente / recusado / estranho → **403**. Lista vazia → **200 `[]`**, não 404.

**GET pendente** — só o uid do token. Não exige query extra do cliente.

### 7.4 Repositório

```ts
// functions/src/repositories/interfaces/usuario-role-feedback.repository.ts
export interface UsuarioRoleFeedbackRepository {
  buscarPorId(id: string): Promise<UsuarioRoleFeedbackDoc | null>;
  buscarPorUsuarioERole(
    usuarioId: string,
    roleId: string,
  ): Promise<UsuarioRoleFeedbackDoc | null>;
  buscarPorIds(ids: string[]): Promise<UsuarioRoleFeedbackDoc[]>;
  listarPorRole(roleId: string): Promise<UsuarioRoleFeedbackDoc[]>;
  criar(
    dados: UsuarioRoleFeedbackCreate,
  ): Promise<UsuarioRoleFeedbackDoc | "conflito">;
}

// Doc = UsuarioRoleFeedback sem `autor`
```

Implementação: `functions/src/repositories/firestore/firestore-usuario-role-feedback.repository.ts`.

- `criar`: `doc(usersrolefeedback, `${usuarioId}_${roleId}`)`. Se já existe → `"conflito"` (a rota manda 409). Não overwrite.
- `listarPorRole`: `where roleId == id` `orderBy createdAt DESC` `limit 100`.
- `buscarPorIds`: `getAll` em chunks de 100 (igual SPEC 007). Usado no GET pendente.

Exportar no factory `repositories/index.ts`.

Helper `functions/src/lib/feedback.ts`:

- Validar body (`nota`, `tags`, `comentario`).
- `escolherPendente(pedidosAceitos, rolesPorId, feedbacksPorRoleId)` → o rolê com `dataHoraSaida` máxima entre os **passados** sem feedback do uid.

### 7.5 `GET /feedback/pendente`

Router próprio `functions/src/routes/feedback.ts`, montado em `index.ts`:

```
app.use("/feedback", feedbackRouter);
```

`feedbackRouter.use(autenticar)`.

Algoritmo:

1. `listarPorUsuario(uid)`.
2. Filtrar `ePedidoAceito`.
3. `buscarPorIds` dos `roleId`.
4. Candidatos: rolê existe **e** `saidaPassou`.
5. `buscarPorIds` dos docs `{uid}_{roleId}` em `usersrolefeedback`.
6. Sobram os sem feedback. Ordenar `dataHoraSaida` **DESC**. Pegar o primeiro.
7. `200 { role: { id, titulo, dataHoraSaida } | null }`.

Teto: mesmos 100 pedidos de `listarPorUsuario`. Sem paginação.

Rolê órfão: omitir. Sem 500.

### 7.6 `POST /roles/:id/feedback`

Body: `{ "nota": 1..5, "tags": TagFeedback[], "comentario": string }`.

Campos extras (`usuarioId`, `anonimo`, …) **não** são persistidos.

| Caso | Status | Corpo |
|------|--------|-------|
| Body inválido (nota, tags, tamanho) | 400 | `{ erro: "nota é obrigatória" }` (mensagem específica) |
| Rolê inexistente | 404 | `{ erro: "Rolê não encontrado" }` |
| Saída ainda não passou | 400 | `{ erro: "este rolê ainda não aconteceu" }` |
| uid é o criador | 403 | `{ erro: "o organizador não avalia o próprio rolê" }` |
| Sem `usersrole` aceito | 403 | `{ erro: "somente o comboio confirma avalia" }` |
| Já existe relato | 409 | `{ erro: "você já avaliou este rolê" }` |
| Criado | **201** | `UsuarioRoleFeedback` (com `autor`) |

### 7.7 `GET /roles/:id/feedbacks`

| Caso | Status | Corpo |
|------|--------|-------|
| Rolê inexistente | 404 | `{ erro: "Rolê não encontrado" }` |
| Sem permissão (não criador e não aceito) | 403 | `{ erro: "somente o comboio lê os relatos" }` |
| Ok | 200 | `UsuarioRoleFeedback[]` (autor hidratado) |

Ordenar `createdAt` **DESC**. Teto 100.

### 7.8 Ordem das rotas Express

Em `roles.ts` (ou `participacao`-style `feedback-role.ts` montado no `rolesRouter`):

```
GET  /:id/feedbacks
POST /:id/feedback
GET  /:id
```

Registrar **`/:id/feedbacks` e `/:id/feedback` antes** de `GET /:id` se algum parser ambíguo aparecer; com path distinto não colide.

**Não** colocar o pendente sob `/roles` — é inbox do uid, igual `/aprovacoes`.

Health em `GET /`:

```
/feedback/pendente
/roles/:id/feedback
/roles/:id/feedbacks
```

### 7.9 Índices

Em `firestore.indexes.json`, **além** dos índices das SPECs 005/007/008:

```json
{
  "collectionGroup": "usersrolefeedback",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "roleId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

Busca por id composto não precisa de índice. `listarPorUsuario` em `usersrole` já existe.

Se o emulator reclamar, copiar a URL do erro para o JSON — não inventar ordem diferente da query real.

### 7.10 O que não muda

- Function HTTP única `api`.
- `GET /roles` (feed) — **não** ganha média, selo nem contagem de relatos.
- `GET /perfil/historico` — o payload **não** ganha `avaliado: boolean` nesta spec (o card concluído só troca o href).
- Documento `roles` **sem** array de feedbacks e **sem** `notaMedia`.
- `usersrole` intacto.
- Sem FCM, sem e-mail, sem criptografia.

---

## 8. Wireframe

### Form (pendente)

```
┌─────────────────────────────────┐
│ [logo] ROLES FEED          (👤) │  header sticky
│        COCKPIT                  │
├─────────────────────────────────┤
│ (route) AVALIAÇÃO DE ROTA       │
│ COMO FOI ESTA ROTA?             │
│ Sua avaliação fica no comboio…  │
│                                 │
│ ┌─────┬───────────────────────┐ │
│ │capa │ TÍTULO                │ │  98 KM na capa
│ │     │ partida → destino     │ │
│ │     │ Criador: @apelido     │ │
│ └─────┴───────────────────────┘ │
│                                 │
│   AVALIAÇÃO GERAL DA ROTA       │
│      ★ ★ ★ ★ ★                  │
│   Experiência Épica!            │
│                                 │
│ Destaques do trajeto            │
│ [Asfalto tapete] [Mirantes] …   │
│                                 │
│ Relato do piloto (opcional)     │
│ [ visível para o comboio      ] │
│ [ textarea              0/280 ] │
│                                 │
│ [ SALVAR AVALIAÇÃO DA ROTA  → ] │
│      PULAR POR ENQUANTO         │
├─────────────────────────────────┤
│  🏍️        ( + )        👤     │  Rolês ativo
└─────────────────────────────────┘
```

### Leitura (já enviou / organizador)

Mesmo header + card-resumo. Sem estrelas editáveis.

```
│  RELATOS DO COMBOIO             │
│  ┌───────────────────────────┐  │
│  │ (foto) @voce   ★★★★★      │  │  “Seu relato”
│  │ tags · comentário         │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ (foto) @lucas  ★★★★☆      │  │
│  └───────────────────────────┘  │
│  [ VOLTAR AO FEED DE ROLÊS   ]  │
```

---

## 9. Fora do Escopo

- Média, selo **Trajeto Verificado**, telemetria 4.9 no perfil / feed.
- Anonimato real, E2E, criptografia.
- PATCH / DELETE do relato; reavaliar.
- Organizer enviar nota no próprio rolê.
- Push / FCM / sino do header.
- Clonar a partir desta tela (SPEC 009 continua no Cockpit).
- Interceptar de novo na mesma sessão depois de Pular.
- Pedidos pendentes / recusados avaliarem.
- Rolê que ainda **não** saiu.
- Paginação da lista (teto 100).
- Menu inferior extra.

---

## 10. Critérios de Aceite

### Front

- [ ] `/roles/:id/feedback` segue o mock (kicker, card, estrelas, tags, relato, Salvar, Pular).
- [ ] Entrar no app com rolê concluído sem nota **redireciona** para essa rota (uma vez por sessão).
- [ ] Sem pendente, a guarda **não** atrasa o feed além do GET (e falha do GET não bloqueia).
- [ ] CTA Salvar **disabled** até escolher 1–5 estrelas.
- [ ] Tags múltiplas do enum; relato opcional 280 chars com contador.
- [ ] POST 201: CTA vira **Avaliação Enviada!** e em seguida a lista do comboio (com o próprio card).
- [ ] Pular vai para `/` e **não** grava documento; próxima sessão pode interceptar de novo.
- [ ] Já avaliou: não mostra o form; mostra relatos com autor.
- [ ] Organizador: só lista, sem Salvar.
- [ ] Sem sino, sem Rota Clonável / Trajeto Clonado / Top Rota, sem copy de E2E / anônimo.
- [ ] Card **concluido** do histórico abre esta rota.
- [ ] `page.tsx` Server; Client só onde há interatividade.
- [ ] Componentes < ~80 linhas; fetch no service; sem Firestore no client.
- [ ] Toque ≥ 48px; usável a partir de 360px; dock visível; item Rolês ativo.

### Back

- [ ] Coleção `usersrolefeedback`; id `{usuarioId}_{roleId}`.
- [ ] `GET /feedback/pendente` exige Bearer; devolve o rolê aceito mais recente já saído **sem** relato, ou `role: null`.
- [ ] `POST /roles/:id/feedback` exige Bearer; `usuarioId` só do token; 201; 409 se já existe.
- [ ] POST 403 se criador ou se não está aceito; 400 se a saída não passou; 404 se o rolê não existe.
- [ ] `GET /roles/:id/feedbacks` 200 para criador ou aceito; 403 para o resto; itens com `autor`.
- [ ] Persistência só em `FirestoreUsuarioRoleFeedbackRepository`.
- [ ] Documento `roles` **não** ganha média nem array de relatos.
- [ ] Índice `roleId` + `createdAt` DESC em `firestore.indexes.json`.

### Integração

- [ ] Aceite (SPEC 007) + saída no passado + sem doc de feedback → aparece no GET pendente.
- [ ] Pedido só pendente / recusado → **não** intercepta e POST 403.
- [ ] Organizador do rolê → não intercepta; GET lista 200.
- [ ] Dois relatos do mesmo uid no mesmo rolê → impossível (409 / id composto).

---

## 11. Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| `src/app/(app)/roles/[id]/feedback/page.tsx` | **NOVO** — orquestrador Server |
| `src/app/(app)/roles/[id]/feedback/**` | **NOVO** — UI, hooks, service, CSS |
| `src/app/(app)/components/GuardaFeedbackPendente.tsx` | **NOVO** |
| `src/app/(app)/hooks/useFeedbackPendenteEntrada.ts` | **NOVO** |
| `src/app/(app)/layout.tsx` | **Alterar** — envolve a guarda |
| `src/app/(app)/perfil/components/CardHistorico.tsx` | **Alterar** — href `concluido` |
| `src/types/usuario-role-feedback.ts` | **NOVO** |
| `functions/src/types/usuario-role-feedback.ts` | **NOVO** |
| `functions/src/routes/feedback.ts` | **NOVO** — `GET /pendente` |
| `functions/src/routes/feedback-role.ts` | **NOVO** — POST + GET lista no `rolesRouter` |
| `functions/src/routes/roles.ts` | **Alterar** — `use` do router de feedback |
| `functions/src/index.ts` | **Alterar** — `app.use("/feedback", …)` + health |
| `functions/src/lib/feedback.ts` | **NOVO** — validação + escolha do pendente |
| `functions/src/repositories/interfaces/usuario-role-feedback.repository.ts` | **NOVO** |
| `functions/src/repositories/firestore/firestore-usuario-role-feedback.repository.ts` | **NOVO** |
| `functions/src/repositories/index.ts` | **Alterar** — factory |
| `firestore.indexes.json` | **Alterar** — índice da coleção nova |

Não alterar `MenuInferior` visualmente. Não voltar `participantes[]` para `roles`. Não agregar nota no feed.

---

## 12. Checklist da skill Next.js

- [ ] `page.tsx` sem `"use client"` (só orquestra + `params`).
- [ ] `"use client"` só em `TelaFeedbackRole`, guarda, filhos interativos.
- [ ] GET/POST e estado do form em hooks separados da UI.
- [ ] API isolada em `feedback.service.ts` (sem Firestore no componente).
- [ ] Um componente = uma coisa (card, estrelas, tags, textarea, lista, card de relato).
- [ ] Sem abstração genérica “pra futuro” (média no feed, E2E, reputação do líder).
- [ ] CSS Modules + tokens de `globals.css`.
- [ ] Sem `console.log` de debug.

---

## 13. Relação com o código atual

| Hoje | Nesta spec |
|------|------------|
| SPEC 008: avaliações / 4.9 fora de propósito | Relato **por rolê**, não reputação do líder no Cockpit |
| SPEC 009: clonar sem linhagem | Badges de rota clonada do mock **omitidos** |
| Entrada no `(app)` = feed depois do perfil | Guarda extra: um GET pendente por sessão |
| Card concluído → sheet de participação | → tela de feedback / relatos |
| Sem coleção de avaliação | **`usersrolefeedback`** |
| `GET /roles/:id` já traz `minhaParticipacao` | Continua; o relato é outro recurso |

Não migrar documentos fictícios. Coleção vazia: o primeiro POST nasce o primeiro card na lista do comboio.

A média no feed e o selo **Trajeto Verificado** deverão ler esta coleção numa spec futura. **Não** implementar nesse PR.
