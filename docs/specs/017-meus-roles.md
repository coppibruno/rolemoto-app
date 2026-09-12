# SPEC 017 — Meus Rolês (Painel de Garagem)

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-12  
> **Referência visual:** `designs/meus-roles/` (`DESIGN.md`, `code.html`, `screen.png`)  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade  
> **Backend:** Cloud Function `api` (Express) — `GET /meus-roles` autenticado  
> **Coleções Firestore:** `usersrole` (SPEC 005) + `roles` (SPEC 003 / 004) + `users` (resumo do líder e avatares)  
> **Depende de:** SPEC 001 (shell + dock), SPEC 003 (schema `roles` + feed), SPEC 004 (rolê publicado), SPEC 005 (`usersrole` + `DELETE /roles/:id/participacao`), SPEC 007 (`/aprovacoes`), SPEC 008 (`GET /perfil/historico` — **não** reutilizar o DTO), SPEC 009 (clonar na aba Concluídos se for líder), SPEC 011 (perfil obrigatório)

---

## 1. Objetivo

Criar a tela autenticada **Meus Rolês** — o painel de garagem do piloto — e um **novo item no dock** para abri-la.

O piloto vê **os próprios rolês**, sem os filtros geográficos do feed. A carga inicial é **sem filtro de status**: mistura o que está **aguardando** e o que está **confirmado** (incluindo os que ele organiza), ordenada pelos **mais próximos no tempo** (`dataHoraSaida` crescente). Dali ele pode filtrar por aba (Confirmados / Aguardando / Concluídos) e pelo botão **tune** (ritmo e papel).

Esta spec é **full stack**:

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | UI do mock, item novo no dock, lista default de próximos, abas + sheet de filtro, cards por status, cancelar/desistir, clonar |
| Back (Functions) | Token válido, uid só do token, join `usersrole` + `roles` + `users`, telemetria (ativos / análise / km), persistência só via repositório |

**Não** se cria coleção nova. O pedido de vaga, o aceite e o cancelamento continuam na SPEC 005. O histórico compacto do Cockpit (`/perfil`, SPEC 008) **permanece** — esta tela é a garagem completa, não um substituto da seção do perfil.

“Mais próximos” nesta spec é **proximidade temporal** (saída mais cedo), não Haversine até o GPS. O feed (`/`) já cobre “rolês na região”.

---

## 2. Referência de Design

Replicar o visual de `designs/meus-roles/` (`code.html` + `screen.png`). Não inventar outro layout. Tokens em `DESIGN.md` / `globals.css`. **Não** copiar o HTML do Stitch (Tailwind CDN + scripts inline) — CSS Modules + tipografia já do app (Barlow Condensed + Plus Jakarta Sans).

A tela **vive** no grupo `(app)`: `GuardaApp` + dock. Mobile-first, coluna única, **max-width 560px**.

### O que entra nesta spec (do mock)

- Header sticky: logo **ROLÊMOTO** + avatar (link para `/perfil`).
- Kicker **Painel de Garagem** (pill com pulso).
- Título **MEUS ROLÊS** + subtítulo do mock.
- Botão **tune** (filtros extras).
- Telemetria em 3 cards: **Ativos** (grupos), **Análise** (pendente), **Asfalto** (km).
- Abas: **Confirmados**, **Aguardando**, **Concluídos** — cada uma com badge numérico.
- Cards por status (hero de destaque, compacto confirmado, pendente, concluído).
- Item novo no dock: **Meus Rolês** (ícone `sports_score`), ativo nesta rota.

### O que o mock mostra e **não** entra

| Elemento do mock | Motivo |
|------------------|--------|
| Chat do Comboio | Sem canal / coleção de mensagens |
| GPS da Rota (navegar) | Sem deep link de mapa nesta spec; endereço textual basta |
| Ver Briefing Técnico Completo | Não há documento de briefing além de `descricao` |
| Cardo CH 4 / intercom | Campo inexistente |
| Selo `verified` no líder | Sem verificação de piloto |
| Badge `#042 ROLÊ VIP` | Sem numeração / categoria VIP no schema |
| Fila “2º na análise” / “3 vagas restantes” | Sem `limiteVagas` nem posição na fila (SPECs 003–007) |
| Falar com o líder | Sem chat / DM |
| Álbum de fotos | Sem galeria |
| Exportar GPX | Sem polyline / arquivo de rota |
| Estrelas 5.0 / 4.9 no concluído | Sem média agregada no documento `roles` (SPEC 010 é relato pontual) |
| Sino de notificações no header | Mesmo recorte das SPECs anteriores |
| Botão **voltar** no header | Destino de dock (raiz); o app não usa back nas outras raízes (`/`, `/perfil`, `/aprovacoes`) |
| Fonte Inter / Tailwind CDN | App já tem tokens e CSS Modules |
| Label **Aprovações** no dock | O item já existe como **Fila** (`/aprovacoes`); esta spec **não** renomeia |

### Desvios conscientes do mock (necessários)

O HTML é uma garagem estática de rolês fictícios, com a aba Confirmados já selecionada. No app os dados vêm da API, o default é **sem filtro de status**, e várias ações do mock não existem.

| Mock | Nesta spec | Por quê |
|------|------------|---------|
| Aba Confirmados ativa no first paint | First paint **sem aba** (`proximos`): confirmados + aguardando + liderança futura, `dataHoraSaida` ASC | Pedido explícito: maior relevância = mais próximos, misturando aguardando e confirmado |
| 3 abas como únicas visões | Abas são **filtros de status**; tocar a aba ativa de novo volta a `proximos` | Precisa de um jeito de voltar ao default sem inventar 4ª aba |
| Header com `arrow_back` | Sem back; logo + avatar (padrão do feed / aprovações) | Destino de dock |
| Chat / GPS / briefing / Cardo | Omitir | Sem dado / sem feature |
| `Desistir da vaga` + `Cancelar Solicitação` | Os dois reutilizam `DELETE /roles/:id/participacao` (SPEC 005) | Já apaga o `usersrole` (pendente ou aceito) |
| Hero sempre o 1º card | Hero só se o **primeiro item visível** for `confirmado` ou `lider` | Pendente tem card próprio (âmbar), sem capa hero |
| `8 confirmados` + avatares | `{N} confirmados` + até 3 fotos + `+K`; N vem de `contarConfirmados` | Sem teto `/15` |
| `1.420 km` de telemetria | Soma Haversine partida → destino dos **concluídos** (inteiro) | Sem odômetro real; mesmo critério da SPEC 005 / 008 |
| Dock com 5 itens já desenhados | Incluir **Meus Rolês** entre Rolês e o FAB; Fila e Perfil ficam à direita | Dock atual tem 4 itens (Rolês, Fila, +, Perfil) |
| “MODERADA (100-130)” | Labels de ritmo já usadas no app (SPEC 005) | Não inventar outra faixa |

Não adicionar chat, mapa, GPX, álbum, fila de vagas nem média de estrelas.

### Comportamento visual (do mock)

- Coluna única, gutter 16px, **max-width 560px**, fundo `surface` (`#121316`).
- Header fixo, 64px + `pt-safe`, blur, logo **ROLÊ** + **MOTO** em `primary-container`.
- Kicker: pill `surface-container-high`, `badge-label` uppercase, pulso `primary`.
- Título: `headline-lg` Barlow Condensed, uppercase; **ROLÊS** em `primary-container`.
- Tune: 48×48px (`touch-min`), `surface-container-high`, ícone `tune`.
- Stats: grid 3 colunas, `surface-container`, `rounded-xl`, numeral `telemetry-num`, faixa inferior em gradiente (ciano / âmbar / laranja).
- Abas: trilho `surface-container-lowest`, aba ativa `primary-container` + badge escuro; inativa `on-surface-variant` + badge `surface-container-high`.
- Card hero: capa `h-44`, scrim inferior, badge **Vaga Confirmada** (ciano, ping) ou **Líder do Comboio** (laranja) se `status === "lider"`.
- Card compacto confirmado: bolinha ciano + **Vaga Assegurada**.
- Card aguardando: glow âmbar, pill **Solicitação Pendente**, box de contexto (sem posição na fila).
- Card concluído: pill **Concluído** + data + km da rota.
- CTA: altura `touch-min` (48px) nos secundários; primários do hero `touch-target` (56px) só quando a ação existir (nesta spec o hero **não** ganha Chat/GPS — o CTA vira **Acessar** em largura total).
- Dock: item ativo `primary` / ícone FILL + underline laranja (já existe no `ItemMenu`; o mock reforça o underline — replicar se o CSS atual ainda não tiver a barra de 4px).

### Ritmo nos cards

Mesmos valores de `RitmoRole`. Label composta (igual SPEC 005):

| Valor | Texto |
|-------|--------|
| `tranquila` | Tranquila (abaixo de 90 km/h) |
| `moderada` | Moderada (90-120 km/h) |
| `agressiva` | Agressiva (track / ritmo forte) |

Cores: `--ritmo-tranquila` / `--secondary-container` / `--error`.

---

## 3. Fluxo do Usuário

```
Grupo (app) — autenticado e com perfil (GuardaApp)
  │
  ├── Dock → [Meus Rolês]  →  /meus-roles
  │
  ▼
GET /meus-roles   (Bearer; uid do token)
  │
  ├── 200 → telemetria + lista default `proximos`
  │     (pendente + confirmado + lider futuros, dataHoraSaida ASC)
  ├── 401 → GuardaApp / login
  └── 500 → EstadoErro + Tentar de novo
        │
        ├── [tune] → sheet: ritmo + papel → filtra a lista em memória
        ├── aba Confirmados → só confirmado + lider (futuros)
        ├── aba Aguardando → só pendente (futuros)
        ├── aba Concluídos → só concluido (passados, dataHoraSaida DESC)
        ├── aba ativa de novo → volta a `proximos`
        │
        ├── card confirmado / pendente → [Acessar] → /roles/:id/participar
        ├── card lider (futuro) → [Acessar] → /aprovacoes?role=:id
        ├── card concluido (participante) → [Acessar] → /roles/:id/feedback
        ├── card concluido (lider) → [Clonar Rota] → /criar-role?origem=:id
        │
        ├── [Cancelar Solicitação] / [Desistir da vaga]
        │     → confirm nativo → DELETE /roles/:id/participacao → refetch
        └── hero / compacto: toque no card (fora dos botões destrutivos)
              → mesmo href de [Acessar]
```

- First paint **não** pede GPS e **não** manda `lat`/`lng`.
- Recusados (`recusadoEm` preenchido) **não** aparecem.
- Pedido pendente cujo `dataHoraSaida` já passou **não** entra em Aguardando (igual SPEC 008).
- Rolê que o piloto **criou** entra como `lider` (futuro) ou `concluido` (passado), mesmo sem `usersrole` (o organizador não pede vaga — SPEC 005).
- Deduplicar por `roleId`: se por algum motivo existir pedido **e** ele for o criador, prevalece `lider`.
- Voltar do sheet da SPEC 005 / aprovações / clone **não** cancela nada.
- Histórico do `/perfil` **não** muda nesta spec.

### Texto das confirmações

```
Desistir:  Deseja desistir da vaga em {titulo}?
Cancelar:  Deseja cancelar a solicitação para o rolê {titulo}?
```

Reusar o espírito do `confirm` da SPEC 005. Sem lib de modal.

---

## 4. Arquitetura Next.js

Seguir a skill: página orquestradora, componentes ~80 linhas, lógica em hooks, API em service. `"use client"` só no que tem estado, clique, sheet ou `useAuth`.

A lista **não** pode ser fetch em Server Component: a rule do projeto exige Bearer no client (`auth.currentUser`).

### 4.1 Por que a page continua Server Component

`(app)/layout` já protege a rota. `/meus-roles` só monta a tela. Interatividade fica nos filhos Client.

```tsx
// src/app/(app)/meus-roles/page.tsx — Server Component
import { TelaMeusRoles } from "./components/TelaMeusRoles";

const MeusRolesPage = () => {
  return (
    <main>
      <TelaMeusRoles />
    </main>
  );
};

export default MeusRolesPage;
```

### 4.2 Estrutura por feature

```
src/app/(app)/meus-roles/
├── page.tsx                              # Server — orquestrador
├── components/
│   ├── TelaMeusRoles.tsx                 # Client — composição
│   ├── CabecalhoMeusRoles.tsx            # Logo + avatar
│   ├── IntroGaragem.tsx                  # Kicker + título + subtítulo + tune
│   ├── TelemetriaGaragem.tsx             # 3 cards de stats
│   ├── CardStat.tsx                      # Um stat
│   ├── AbasMeusRoles.tsx                 # Confirmados / Aguardando / Concluídos
│   ├── ListaMeusRoles.tsx                # Decide hero vs compacto
│   ├── CardDestaqueRole.tsx              # Hero (capa + briefing)
│   ├── CardConfirmadoRole.tsx            # Compacto assegurado
│   ├── CardAguardandoRole.tsx
│   ├── CardConcluidoRole.tsx
│   ├── SheetFiltrosMeusRoles.tsx         # tune: ritmo + papel
│   ├── EstadoVazioMeusRoles.tsx
│   ├── EstadoErroMeusRoles.tsx
│   └── EstadoCarregandoMeusRoles.tsx
├── hooks/
│   ├── useMeusRoles.ts                   # Fetch + refetch
│   ├── useFiltrosMeusRoles.ts            # aba + ritmo + papel + lista visível
│   └── useAcaoParticipacaoGaragem.ts     # DELETE + confirm
├── services/
│   └── meus-roles.service.ts             # GET /meus-roles
├── constants.ts
├── formatar-meus-roles.ts                # data relativa do pedido, km
└── meus-roles.module.css

src/types/meus-roles.ts                   # NOVO — DTO da garagem

src/components/menu-inferior/
├── itens-menu.ts                         # + item Meus Rolês
├── MenuInferior.tsx                      # 2 + FAB + 2
└── hooks/useItemMenuAtivo.ts              # /meus-roles ativo
```

Reusar `formatarHorarioSaida` / `formatarHora` de `feed/formatar-horario.ts`. Reusar `participacao.service` (`DELETE`) — **não** duplicar o client HTTP. **Não** chamar Firestore no client. **Não** reusar os cards compactos do Histórico de Pistas (layout diferente).

### 4.3 Responsabilidades

| Peça | Tipo | Faz |
|------|------|-----|
| `page.tsx` | Server | Só monta `TelaMeusRoles` |
| `TelaMeusRoles` | Client | Liga fetch, filtros e lista |
| `useMeusRoles` | Hook | Loading, erro, payload, `recarregar` |
| `useFiltrosMeusRoles` | Hook | `aba`, ritmo, papel, `itensVisiveis`, sheet aberto |
| `useAcaoParticipacaoGaragem` | Hook | Confirm + DELETE + refetch |
| `meus-roles.service` | Service | `GET /meus-roles` via `api` |
| Cards | UI | Um bloco visual cada |
| `AbasMeusRoles` | Client | Toggle de status + badges |
| `SheetFiltrosMeusRoles` | Client | Ritmo + papel |
| `MenuInferior` | Client | Novo destino |

**Não misturar** no mesmo arquivo: JSX do hero + montagem de filtros + `fetch` + `confirm` de desistência.

### 4.4 Item ativo no menu

| Rota | Rolês | Meus Rolês | `+` | Fila | Perfil |
|------|-------|------------|-----|------|--------|
| `/` e `/roles/...` | ativo | — | — | — | — |
| `/meus-roles` | — | ativo | — | — | — |
| `/criar-role` | — | — | glow | — | — |
| `/aprovacoes` | — | — | — | ativo | — |
| `/perfil` | — | — | — | — | ativo |

`/roles` **não** marca Meus Rolês. `/meus-roles` **não** marca Rolês.

---

## 5. Contrato dos Dados (front)

DTO **só** da garagem — não reusar `HistoricoPistas` (falta capa, endereço, líder, avatares, `pedidoCriadoEm`) nem `RoleFeedItem` (é o feed da região).

```ts
// src/types/meus-roles.ts
import type { RitmoRole } from "./role";

export type StatusMeuRole = "pendente" | "confirmado" | "lider" | "concluido";

export type AbaMeusRoles = "proximos" | "confirmados" | "aguardando" | "concluidos";

export type PapelMeuRole = "participante" | "organizador";

export type CriadorMeuRole = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
};

export type DestaqueParticipante = {
  fotoUrl: string;
  iniciais: string;
};

export type MeuRoleItem = {
  roleId: string;
  titulo: string;
  descricao: string;
  fotoCapaUrl: string;
  ritmo: RitmoRole;
  dataHoraSaida: string; // ISO
  localSaidaEndereco: string;
  distanciaRotaKm: number;
  status: StatusMeuRole;
  papel: PapelMeuRole;
  criador: CriadorMeuRole;
  participantes: {
    confirmados: number;
    destaques: DestaqueParticipante[]; // até 3
  };
  pedidoCriadoEm: string | null; // ISO; null se lider (sem usersrole)
};

export type TelemetriaMeusRoles = {
  ativos: number;   // confirmado + lider futuros
  analise: number;  // pendente futuros
  asfaltoKm: number; // soma dos concluídos
};

export type ContagensMeusRoles = {
  confirmados: number; // confirmado + lider (futuros)
  aguardando: number;  // pendente
  concluidos: number;
};

export type MeusRolesPayload = {
  itens: MeuRoleItem[];
  telemetria: TelemetriaMeusRoles;
  contagens: ContagensMeusRoles;
};
```

### Regras do item

- **Sem** `lat` / `lng` (endereço textual basta).
- **Sem** e-mail, `cidade`, `pilotagem` de terceiros, `minhaParticipacao` cru.
- Destaques: até **3** confirmados (`aceito: true`), **sem** `uid`. Iniciais iguais à SPEC 015 (nome → dois tokens; um token → duas primeiras letras).
- `pedidoCriadoEm` alimenta “Enviada ontem • 21:15” no card pendente.
- `papel: "organizador"` **somente** se `criadorId === uid`. Caso contrário `"participante"`.

### Filtros (só no client)

```ts
export type FiltrosMeusRoles = {
  aba: AbaMeusRoles; // default "proximos"
  ritmo: RitmoRole | "todas"; // default "todas"
  papel: PapelMeuRole | "todos"; // default "todos"
};
```

| Aba | Itens |
|-----|--------|
| `proximos` (default) | `pendente` + `confirmado` + `lider`, `dataHoraSaida` ASC |
| `confirmados` | `confirmado` + `lider`, ASC |
| `aguardando` | `pendente`, ASC |
| `concluidos` | `concluido`, DESC (mais recente primeiro) |

Ritmo e papel combinam com **AND** sobre a aba. Mudar filtro **não** refaz o GET.

Badges das abas usam `contagens` do payload (totais da garagem), **não** o recorte do tune — o piloto ainda vê quantos tem em cada status.

### Telemetria

| Card | Campo | Semântica |
|------|-------|-----------|
| Ativos / grupos | `telemetria.ativos` | Quantos comboios futuros ele **já tem vaga** ou **organiza** |
| Análise / pendente | `telemetria.analise` | Pedidos ainda sem decisão, rolê no futuro |
| Asfalto / km | `telemetria.asfaltoKm` | Soma inteira de `distanciaRotaKm` dos `concluido` |

Não misturar km de rolês futuros no Asfalto.

---

## 6. Implementação Front

### 6.1 Service

```ts
// src/app/(app)/meus-roles/services/meus-roles.service.ts
import { api } from "@/lib/api";
import type { MeusRolesPayload } from "@/types/meus-roles";

export const meusRolesService = {
  listar: () => api<MeusRolesPayload>("/meus-roles"),
};
```

Usar `api` (Bearer automático). Um único `carregando` em `useMeusRoles`. Não duplicar loading com `useFunctions`. Sem query string nesta spec — o GET é a garagem inteira (volume do próprio piloto).

### 6.2 Header

Igual ao espírito do feed, **sem** o bloco “Roles Feed / Cockpit”:

- Logo do app (arquivo já usado em `CabecalhoFeed`).
- Avatar 32px → `/perfil`. Sem foto: ícone `account_circle`.
- Sem back, sem sino.

### 6.3 Intro + tune

- Kicker **Painel de Garagem**.
- `h1`: **MEUS ROLÊS**.
- Subtítulo do mock: *Gerencie seus comboios ativos, solicitações em análise e a sua quilometragem percorrida.*
- Tune: `aria-label="Filtros"`, `aria-expanded`, `aria-controls="sheet-filtros-meus-roles"`.

Sheet (bottom, `surface-container`, borda `primary-container` a 22% — Layer 2 do DESIGN.md):

| Grupo | Opções | Default |
|-------|--------|---------|
| Ritmo | Todas / Tranquila / Moderada / Agressiva | Todas |
| Papel | Todos / Participante / Organizador | Todos |

Chips no idioma do feed (pill, ativo = borda/label `primary-container`). **Aplicar** fecha o sheet. **Limpar** volta ritmo+papel ao default (a aba atual permanece). `Esc` / overlay fecha sem descartar o que já estava aplicado (os chips já mudam o estado ao toque — sem rascunho separado).

Foco preso no sheet; `aria-modal`.

### 6.4 Abas

Três botões, `role="tablist"` / `role="tab"` / `aria-selected`.

- Nenhuma aba com `aria-selected="true"` quando `aba === "proximos"` (default).
- Toque numa aba → aquele filtro.
- Toque na aba já selecionada → volta a `proximos`.
- Badge: número de `contagens.*`.
- Teclado: setas esquerda/direita entre abas (mesmo padrão de `AbasHistorico`).

Não criar uma 4ª aba “Próximos” no trilho — o default é a ausência de seleção, para não destoar do mock de 3 chips.

### 6.5 Cards

#### Hero (`CardDestaqueRole`)

Só o primeiro item visível com `status` `confirmado` ou `lider`.

| Zona | Conteúdo |
|------|----------|
| Capa | `fotoCapaUrl`, `object-fit: cover`, `h-44` |
| Badge esquerdo | `confirmado`: **Vaga Confirmada** (ping ciano). `lider`: **Líder do Comboio** (laranja, sem ping de “vaga”) |
| Badge direito | **omitir** o `#042 VIP` |
| Sobre a capa | `titulo` uppercase + data/hora (`formatarHorarioSaida` ou faixa mais rica se couber numa linha) |
| Grid | Ponto de encontro (`localSaidaEndereco`) + ritmo |
| Líder | Avatar + `nome` + `@apelido` · **Líder do Comboio**. Sem `verified`. Sem Cardo |
| Ações | **Acessar** (largura total). Rodapé: **Desistir da vaga** só se `papel === "participante"` |

Sem Chat, GPS, briefing.

#### Compacto confirmado / lider

Badge **Vaga Assegurada** (ou **Organizador** se `lider`), data à direita, título, ponto + hora, avatares + `{N} confirmados`, botão **Acessar**.

#### Aguardando

Pill **Solicitação Pendente**, `pedidoCriadoEm` relativo (“Enviada ontem • 21:15”), título, “Organizado por **@apelido**”.

Box de contexto (substitui a “fila” do mock):

- Título: **Aguardando o piloto líder**
- Texto: *Você receberá um alerta quando @{apelido} decidir.*
- Chip **Triagem**

Nota amigável (copy enxuto, sem inventar cilindrada): *O líder está avaliando seu pedido. Você recebe um aviso quando a vaga for validada.*

Ações: **Cancelar Solicitação**. Sem **Falar com**.

#### Concluído

Pill **Concluído**, data curta, título, `{N} km rodados` (`distanciaRotaKm`). Sem estrela.

- Participante: **Acessar** → `/roles/:id/feedback` (SPEC 010; a tela já existe).
- Organizador: **Clonar Rota** → `/criar-role?origem=:id` (SPEC 009). Sem álbum / GPX.

### 6.6 Destinos (`href`)

| Status / papel | Destino |
|----------------|---------|
| `pendente` | `/roles/{id}/participar` |
| `confirmado` | `/roles/{id}/participar` |
| `lider` (futuro) | `/aprovacoes?role={id}` |
| `concluido` + participante | `/roles/{id}/feedback` |
| `concluido` + organizador | clone no botão; toque no card → `/aprovacoes?role={id}` |

### 6.7 Estados vazios / erro

| Situação | Título | Corpo |
|----------|--------|--------|
| `proximos` vazio, sem tune | **Nenhum comboio na garagem** | *Peça vaga num rolê do feed ou toque no + para organizar o seu.* |
| `confirmados` vazio | **Nenhuma vaga assegurada** | *Quando o líder aceitar (ou você publicar um rolê), o comboio aparece aqui.* |
| `aguardando` vazio | **Nada em análise** | *Você não tem pedido aguardando o piloto líder.* |
| `concluidos` vazio | **Asfalto zerado** | *Os rolês que você concluiu entram aqui com a quilometragem da rota.* |
| Lista vazia **por** tune | **Nenhum rolê com esses filtros** | *Limpe o ritmo ou o papel no tune.* |
| Erro de API | **Não foi possível carregar seus rolês** | Ação **Tentar de novo** |

Vazio ≠ erro. Filtros e telemetria permanecem visíveis no vazio (stats podem ser zero).

### 6.8 Tokens CSS

CSS Module `meus-roles.module.css`. Sem hex de marca no TSX.

| Token | Uso |
|-------|-----|
| `--surface` / `--surface-container` / `-low` / `-high` / `-lowest` / `-highest` | Página, cards, stats, sheet, abas |
| `--primary` / `--primary-container` | Título ROLÊS, tune hover, aba ativa, CTA |
| `--on-surface` / `--on-surface-variant` | Textos |
| `--secondary` / `--secondary-container` / `--secondary-fixed` | Aguardando, ritmo moderada |
| `--tertiary` / `--tertiary-container` | Ativos, vaga confirmada |
| `--error` | Ritmo agressiva; hover de desistir |
| `--ritmo-tranquila` | Ritmo tranquila |
| `--gutter-md` / `--touch-min` / `--touch-target` | Espaçamento e toque |

Ícones: Material Symbols Outlined. Item ativo do dock pode usar FILL 1 (o mock usa); se o `ItemMenu` atual não preenche o ícone, acrescentar a variation só no ativo — sem mudar os outros destinos além do necessário.

### 6.9 Dock — 5 destinos

Hoje: Rolês + Fila | FAB | Perfil.

Nesta spec:

```
[ Rolês ] [ Meus Rolês ]   ( + )   [ Fila ] [ Perfil ]
```

```ts
// src/components/menu-inferior/itens-menu.ts (trecho)
{
  href: "/meus-roles",
  label: "Meus Rolês",
  icone: "sports_score",
  ariaLabel: "Meus rolês",
  tipo: "lateral",
}
```

`MenuInferior`: grupo esquerdo = Rolês + Meus Rolês; grupo direito = Fila + Perfil. O grid `1fr auto 1fr` **já** comporta 2+2.

Label longa: manter uppercase `label-md`. Em 360px, permitir `font-size: 11px` **só** neste item se o texto vazar — não quebrar em duas linhas (o dock tem altura fixa 80px). Não abreviar para “Meus”.

`useItemMenuAtivo`: `href === "/meus-roles"` casa com o pathname exato (e prefixo `/meus-roles/`, se no futuro houver filho). **Não** usar `startsWith("/roles")` aqui.

### 6.10 Acessibilidade

- `h1` = Meus Rolês.
- Tune e abas com `aria-*` descritos acima.
- Stats: cada card com texto visível (não só o número); o numeral pode ter `aria-label` (“3 grupos ativos”).
- Capa do hero: `alt` curto (`Capa do rolê {titulo}`).
- Avatares: `alt=""` decorativo + `+K` anunciado (“mais K pilotos”).
- Desistir / Cancelar: texto visível, não só ícone; `confirm` nativo.
- Área de toque ≥ 48px; usável a partir de 360px; conteúdo acima do dock (`padding-bottom` do shell já existe).
- `aria-current="page"` no item Meus Rolês.

### 6.11 Cancelar / desistir

`useAcaoParticipacaoGaragem` chama `participacaoService.cancelar(roleId)` (já existe). Em sucesso: `recarregar()` do `useMeusRoles` (atualiza lista **e** telemetria). Em erro: toast/texto curto acima da lista, a tela permanece.

Líder **não** vê Desistir (não há `usersrole` dele).

---

## 7. Backend — `GET /meus-roles`

Não usar `onCall`. Rota **sem** `firestore.collection` direto. Factory em `repositories/index.ts`.

**Não** reutilizar `GET /perfil/historico`: o DTO da SPEC 008 é o card compacto do Cockpit. Inflá-lo quebraria o perfil. Endpoint novo, montagem parecida (mesmos repositórios).

### 7.1 Montagem no Express

Router autenticado, recurso próprio:

```
app.use("/meus-roles", meusRolesRouter);
```

```
GET /meus-roles
Headers: Authorization: Bearer <idToken>
```

```ts
meusRolesRouter.use(autenticar);
meusRolesRouter.get("/", handler);
```

Listar no health (`functions/src/index.ts`).

### 7.2 Auth

1. `autenticar` — Bearer obrigatório.
2. Token inválido / ausente → **401**.
3. Uid **somente** de `req.usuario.uid`. Sem `?uid=` e sem body.

Qualquer piloto autenticado lê **a própria** garagem. Admin SDK ignora Security Rules: a function autoriza.

### 7.3 Repositório

**Nenhum método novo obrigatório.** Reusar:

| Já existe | Uso |
|-----------|-----|
| `usuarioRoleRepository.listarPorUsuario(uid)` | Pedidos do piloto |
| `roleRepository.listarPorCriador(uid)` | Rolês que ele publicou |
| `roleRepository.buscarPorIds(ids)` | Hidratar rolês dos pedidos |
| `usuarioRoleRepository.contarConfirmados(roleId)` | N e telemetria |
| `usuarioRoleRepository.listarConfirmadosDoRole(roleId, 3)` | Avatares |
| `usuarioRepository.buscarPorIds` | Criador + destaques |
| `ePedidoPendente` / `ePedidoAceito` (`lib/historico.ts`) | Classificar |
| `distanciaRotaKm` (`lib/geo.ts`) | km da rota |

Helpers **novos** em `functions/src/lib/meus-roles.ts` (espelho de `lib/historico.ts`): classificar status, deduplicar, ordenar, somar asfalto, montar DTO. **Não** misturar HTTP com Haversine.

Teto defensivo: processar no máximo **80** rolês distintos depois do join (pedidos + criados). Volume inicial baixo; sem paginação nesta spec.

Índices: nenhum novo. `listarPorUsuario` / `listarPorCriador` / `roleId+aceito` já existem.

### 7.4 Montagem do DTO

1. `uid = req.usuario.uid`.
2. `listarPorUsuario` + `listarPorCriador` em paralelo.
3. `buscarPorIds` dos `roleId` dos pedidos; unir com os criados num `Map`.
4. Classificar cada rolê:

```
saidaPassou = Date.parse(dataHoraSaida) <= Date.now()

se criadorId === uid:
  status = saidaPassou ? "concluido" : "lider"
  papel  = "organizador"
  pedidoCriadoEm = null
senão se ePedidoPendente && !saidaPassou:
  status = "pendente"
  papel  = "participante"
  pedidoCriadoEm = usersrole.createdAt
senão se ePedidoAceito:
  status = saidaPassou ? "concluido" : "confirmado"
  papel  = "participante"
  pedidoCriadoEm = usersrole.createdAt
senão: descartar (recusado ou pendente atrasado)
```

5. Deduplicar por `roleId` (criador vence).
6. Para cada item restante: `distanciaRotaKm`, `contarConfirmados`, `listarConfirmadosDoRole(id, 3)`.
7. `buscarPorIds` dos criadores + uids dos destaques. Fallback criador: `nome: ""`, `apelido: "piloto"`, `fotoUrl: ""`.
8. Iniciais dos destaques no **lib** (não gravar no Firestore).
9. Telemetria e `contagens` a partir da lista classificada (antes do teto de slice, mas depois dos descartes).
10. `itens` numa lista **única** (o client fatia por aba). Ordem estável sugerida no payload: próximos ASC concatenados com concluídos DESC — o client reordena de qualquer forma; o back pode mandar ASC por `dataHoraSaida` e o hook reordena na aba Concluídos.

Resposta **200**:

```json
{
  "itens": [ /* MeuRoleItem */ ],
  "telemetria": { "ativos": 3, "analise": 1, "asfaltoKm": 1420 },
  "contagens": { "confirmados": 2, "aguardando": 1, "concluidos": 4 }
}
```

Garagem vazia → `200` com `itens: []` e zeros. **Não** 404.

### 7.5 Tipos de domínio (Functions)

```ts
// functions/src/types/meus-roles.ts
export type MeusRolesPayload = { /* mesmo shape do front */ };
```

Não inflar `types/historico-pistas.ts`.

### 7.6 O que não muda

- `GET /perfil/historico` (contrato da SPEC 008 intacto).
- `GET /roles` (feed) e `GET /roles/:id`.
- `DELETE /roles/:id/participacao` (já remove pendente **e** aceito).
- Documento `roles` **não** ganha `limiteVagas`, array `participantes`, VIP, Cardo, GPX.
- Sem query de filtro no GET nesta spec (ritmo/papel/aba são client).

### 7.7 Erros

| Caso | Status | Corpo |
|------|--------|-------|
| Sem Bearer / token inválido | 401 | `{ erro: "Não autenticado" }` |
| Sucesso (inclusive vazio) | 200 | `MeusRolesPayload` |
| Falha interna | 500 | `responderErro` |

---

## 8. Wireframe

```
┌─────────────────────────────────┐
│ ⚡ ROLÊMOTO                 (👤) │  header sticky
├─────────────────────────────────┤
│ ● Painel de Garagem        [⚙]  │
│ MEUS ROLÊS                      │
│ Gerencie seus comboios…         │
│ ┌──────┐ ┌──────┐ ┌──────┐     │
│ │Ativos│ │Anális│ │Asfalt│     │
│ │  3   │ │  1   │ │1420km│     │
│ └──────┘ └──────┘ └──────┘     │
│ [Confirmados 2][Aguard. 1][4]   │  nenhuma selecionada no default
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ [capa hero — se 1º confirm.]│ │
│ │ Vaga Confirmada             │ │
│ │ TÍTULO                      │ │
│ │ Sábado, 07:00               │ │
│ │ Ponto · Ritmo               │ │
│ │ @lider                      │ │
│ │ [        ACESSAR         ]  │ │
│ │              Desistir da vaga│ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ ● Vaga Assegurada    Sáb 15 │ │
│ │ TÍTULO                      │ │
│ │ ponto · hora                │ │
│ │ 👤👤+6  8 confirmados [→]   │ │
│ └─────────────────────────────┘ │
│ (aba Aguardando)                │
│ ┌─────────────────────────────┐ │
│ │ ⌛ Solicitação Pendente     │ │
│ │ TÍTULO  · @lider            │ │
│ │ Aguardando o piloto líder   │ │
│ │ [ Cancelar Solicitação ]    │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
│ 🏍️  🏁     ( + )     📋   👤  │  dock — Meus Rolês ativo
│Rolês Meus Rolês     Fila Perfil │
└─────────────────────────────────┘
```

---

## 9. Fora do Escopo

- Chat, DM, intercom, GPS turn-by-turn, GPX, álbum.
- Limite de vagas, posição na fila, waitlist, VIP.
- Média de avaliações no card (SPEC 010 continua no fluxo de feedback).
- Pedir geolocalização nesta tela.
- Paginação infinita / pull-to-refresh sofisticado (scroll nativo + refetch no erro / após DELETE).
- Remover ou redesenhar o Histórico de Pistas do `/perfil`.
- Renomear o item **Fila** do dock.
- Push novo (SPEC 013 já cobre aceite / pedido).
- Editar rolê, apagar rolê, mapa.
- Filtro por texto / data no tune (só ritmo e papel).
- Server Component fetch / `unstable_cache` (lista autenticada).

---

## 10. Critérios de Aceite

### Front

- [ ] `/meus-roles` deixa de ser inexistente e segue o mock (kicker, título, 3 stats, 3 abas, cards por status).
- [ ] Dock ganha **Meus Rolês** (`sports_score`) entre Rolês e o FAB; item fica ativo só em `/meus-roles`.
- [ ] First paint **sem** aba selecionada: mistura aguardando + confirmados + liderança futura, `dataHoraSaida` ASC (mais próximos primeiro).
- [ ] Sem GPS / sem `lat`/`lng` na chamada.
- [ ] Abas filtram Confirmados (`confirmado`+`lider`), Aguardando (`pendente`), Concluídos (`concluido` DESC). Tocar a aba ativa volta ao default.
- [ ] Tune filtra ritmo e papel em memória; Limpar não reseta a aba.
- [ ] Lista só via `GET /meus-roles` (Bearer); sem `getDocs` no client.
- [ ] Hero só no primeiro item visível `confirmado`/`lider`; sem Chat/GPS/Cardo/VIP/verified.
- [ ] **Acessar** / toque no card usa a tabela de destinos (§6.6).
- [ ] **Cancelar** / **Desistir** pedem `confirm`, chamam o DELETE da SPEC 005 e atualizam lista + stats.
- [ ] **Clonar Rota** só no concluído do organizador (`?origem=` da SPEC 009).
- [ ] Telemetria: `ativos` / `analise` / `asfaltoKm` batem com o payload.
- [ ] Badges das abas batem com `contagens` (independem do tune).
- [ ] Zero itens: vazio específico da aba / do tune; erro de API ≠ vazio.
- [ ] Recusados e pendentes atrasados não aparecem.
- [ ] Sem sino, sem back no header, sem 4ª aba visível.
- [ ] `page.tsx` Server; Client só onde há interatividade.
- [ ] Componentes < ~80 linhas; filtros/fetch/ação em hooks; GET no service.
- [ ] Toque ≥ 48px; usável a partir de 360px; conteúdo acima do dock.
- [ ] Histórico do `/perfil` inalterado.

### Back

- [ ] `GET /meus-roles` exige Bearer; uid só do token.
- [ ] 200 com `MeusRolesPayload`; vazio é `itens: []` + zeros (não 404).
- [ ] Cada item traz capa, ritmo, endereço de saída, km da rota, status, papel, criador (`nome`, `apelido`, `fotoUrl`), confirmados + até 3 destaques sem uid.
- [ ] Sem lat/lng, sem e-mail, sem `minhaParticipacao` cru.
- [ ] `lider` cobre rolês com `criadorId === uid` (futuro); passado vai para `concluido`.
- [ ] `asfaltoKm` é soma Haversine só dos concluídos (inteiro).
- [ ] Persistência só via repositórios; router novo com `autenticar`.
- [ ] `GET /perfil/historico` **não** muda o contrato.
- [ ] Health lista `/meus-roles`.

---

## 11. Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| `src/app/(app)/meus-roles/**` | **NOVO** — page, UI, hooks, service, CSS |
| `src/types/meus-roles.ts` | **NOVO** |
| `src/components/menu-inferior/itens-menu.ts` | **Alterar** — 5º destino |
| `src/components/menu-inferior/MenuInferior.tsx` | **Alterar** — grupos 2 + FAB + 2 |
| `src/components/menu-inferior/hooks/useItemMenuAtivo.ts` | **Alterar** — ativo em `/meus-roles` |
| `src/components/menu-inferior/menu-inferior.module.css` | **Alterar** se o label / FILL do ativo precisar |
| `functions/src/routes/meus-roles.ts` | **NOVO** |
| `functions/src/lib/meus-roles.ts` | **NOVO** — classificar / montar DTO |
| `functions/src/types/meus-roles.ts` | **NOVO** |
| `functions/src/index.ts` | **Alterar** — `app.use("/meus-roles", …)` + health |

Não alterar visualmente o Histórico de Pistas. Não voltar `participantes[]` para `roles`. Não afrouxar o DELETE de participação.

Reuso sem cópia de arquivo: `participacao.service`, `formatar-horario.ts`, helpers `ePedidoPendente` / `ePedidoAceito` / `distanciaRotaKm`.

---

## 12. Checklist da skill Next.js

- [ ] `page.tsx` sem `"use client"` (só orquestra).
- [ ] `"use client"` só em `TelaMeusRoles`, header (avatar), abas, sheet, cards com botão.
- [ ] Estado de filtro / fetch / DELETE em hooks separados.
- [ ] GET isolado em `meus-roles.service.ts` (sem Firestore no componente).
- [ ] Um componente = uma coisa (stat, aba, hero, pendente, sheet, vazio).
- [ ] Sem abstração genérica “pra futuro” (chat, mapa, GPX, paginação).
- [ ] CSS Modules + tokens de `globals.css`.
- [ ] Sem `console.log` de debug.
- [ ] Sem copiar o HTML do Stitch.

---

## 13. Relação com o código atual

| Hoje | Nesta spec |
|------|------------|
| Dock: Rolês, Fila, +, Perfil | + **Meus Rolês** (`/meus-roles`, `sports_score`) |
| Garagem do piloto = bloco compacto no `/perfil` (SPEC 008) | Tela dedicada; perfil **não** perde o histórico |
| `GET /perfil/historico` → 3 listas finas | `GET /meus-roles` → lista única rica + telemetria |
| Feed pede GPS + raio | Garagem **não** pede GPS; ordem = data de saída |
| Cancelar só no sheet `/roles/:id/participar` | Também na garagem (mesmo DELETE) |
| Clone só no card Criados do perfil | Também no card Concluídos se `papel === "organizador"` |
| `useItemMenuAtivo`: `/roles/*` marca Rolês | Continua; `/meus-roles` é outro href |

O organizador continua aprovando pela SPEC 007; o piloto pendente continua esperando o mesmo `usersrole`. Esta spec só **mostra** esses estados num cockpit próprio e dá atalho de volta aos fluxos que já existem.
