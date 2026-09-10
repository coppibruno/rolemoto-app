# SPEC 009 — Clonar Rolê

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-09  
> **Referência visual:** `designs/perfil/` (`DESIGN.md`, `code.html`, `screen.png`) — aba **Criados** do Histórico de Pistas; tela de publicação em `designs/criar-role/`  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade  
> **Backend:** Cloud Function `api` (Express) — `GET /roles/:id/modelo` + `POST /roles` (SPEC 004, inalterado)  
> **Coleções Firestore:** `roles` (SPEC 003 / 004) — **sem** coleção nova e **sem** campo de linhagem  
> **Depende de:** SPEC 001 (shell + `/criar-role` + `/perfil`), SPEC 004 (publicar rolê), SPEC 008 (Histórico de Pistas / aba Criados)

---

## 1. Objetivo

Permitir que o piloto **repita um rolê que ele já publicou**, sem redigitar rota, ritmo, instruções e capa.

O ponto de entrada é a aba **Criados** do Cockpit (`/perfil`). O clone **não** grava na hora: abre `/criar-role` com o formulário **pré-preenchido**. O piloto só precisa escolher uma **nova data** (obrigatória, no futuro) e tocar em **Publicar Rolê**. O documento novo entra em `roles` como qualquer outro da SPEC 004 — comboio zerado, `criadorId` do token.

Esta spec é **full stack**:

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | Botão Clonar no card da aba Criados; `/criar-role?origem={roleId}`; GET do modelo; pré-preenchimento; validação da data nova; POST já existente |
| Back (Functions) | Token válido; modelo **só** se `criadorId` = uid do token; DTO enxuto; persistência só via repositório |

O uid **nunca** vem da query nem do body. Não dá para clonar rolê de outro piloto por esta rota.

Clonar **não** é editar o original. O documento fonte permanece intacto.

---

## 2. Referência de Design

O mock de `designs/perfil/code.html` **não tem** ação de clonar. Esta spec **acrescenta** o botão na aba Criados, usando **os mesmos tokens** de `designs/perfil/DESIGN.md` / `globals.css` (cockpit asfalto, laranja `#FF6B00`, toque 48px, cards compactos).

A tela de destino **é** a de criar rolê (SPEC 004 / `designs/criar-role/`). Não inventar uma terceira tela. No modo clone, só mudam copy do header/intro, faixa de contexto e a regra da capa (URL já existente).

### O que entra nesta spec

- Botão **Clonar** em cada card da aba **Criados** (status `lider`).
- Navegação para `/criar-role?origem={roleId}`.
- Faixa **Clonando rota** no formulário (barra vertical laranja, mesmo padrão de **Dados do Piloto** / **Histórico de Pistas**).
- Header **Clonar Rolê**; intro **Mesma pista, nova data**.
- Pré-preenchimento: título, partida, destino, ritmo, instruções, capa, **hora**.
- Data de partida **vazia** — o piloto escolhe o dia novo.
- Publicação pelo `POST /roles` da SPEC 004.

### O que o mock mostra e **não** entra

| Elemento | Motivo |
|----------|--------|
| Telemetria, avaliações, sino | Já fora da SPEC 008 |
| Clonar nas abas Aguardando / Participei | Só o líder clona o que **ele** publicou |
| Menu inferior, guarda, tokens globais | SPEC 001 |
| Formulário de perfil, salvar, sair, excluir | SPECs 002 / 006 |

### Desvios conscientes do mock (necessários)

O HTML da aba Criados é um card-link único, sem ação secundária.

| Mock / código hoje | Nesta spec | Por quê |
|--------------------|------------|---------|
| Card Criados inteiro é `Link` para `/aprovacoes?role=` | Card vira **linha**: área do briefing continua indo às aprovações; **Clonar** é botão/link **irmão**, não filho do `Link` | HTML válido (botão não pode viver dentro de âncora); dois destinos distintos |
| Sem botão no card | Ação secundária 48×48px, ícone `content_copy`, `aria-label` **Clonar {titulo}** | Toque com luva; o mock não previa a feature |
| Criar rolê sempre vazio | Query `origem` hidrata o form | Evita recriar a rota na mão |
| Capa exige `File` novo (SPEC 004) | No clone, a URL da capa original **vale** até o piloto remover / trocar | Mesma foto da pista; sem reupload obrigatório |
| Data copiada do original | Data **em branco** | Original quase sempre no passado; validação “partida no futuro” falharia |
| Voltar / Cancelar → `/` | Com `origem`, voltam para `/perfil` | O fluxo começou no Cockpit |

Não adicionar confirmação modal, swipe, menu `more_vert` nem clonar em lote.

### Comportamento visual

#### Botão no card (perfil — tokens do cockpit)

- Só na aba **Criados**. Aguardando e Participei **não** mudam.
- Layout do card: `flex` row; briefing (`Link`) `flex: 1`; botão à **direita**, `flex-shrink: 0`.
- Botão: 48×48px (`--touch-min`), `rounded-lg` (8px, igual ao bloco dia/mês), fundo `surface-container-high`, ícone `content_copy` 22px em `primary-container`.
- Hover/active: fundo `surface-container-highest`; `active:scale-90` (mesmo idioma do botão câmera do avatar).
- Sem texto visível no botão (o card já está apertado). `aria-label` carrega o significado.
- O card **não** ganha segunda linha “CLONAR ROLÊ” full-width — isso estoura a altura compacta da SPEC 008.
- Área de toque do `Link` (briefing) continua ≥ 48px de altura.

#### Modo clone em `/criar-role`

- Header: título **Clonar Rolê** (Barlow Condensed uppercase). Seta volta para `/perfil`.
- Intro: badge **Briefing Inicial** permanece; **Passo 1 de 1** permanece.
- Título: **Mesma pista, nova data**.
- Subtítulo: **Rota, ritmo e capa vêm do rolê original. Escolha o dia da próxima saída.**
- Faixa acima do form (padrão seção do perfil): barra `w-1.5 h-4` `primary-container` + texto uppercase `headline-sm` **Clonando rota** + nome do original em `label-md` `on-surface-variant`, `truncate`.
- Cartão **Horário de Partida**: data vazia, borda/hint se tentar publicar sem data (já na SPEC 004). Hora pré-preenchida.
- Capa com URL original: preview `object-fit: cover`; badge **Capa do original** (não “Capa Atualizada”). Trocar arquivo → badge volta a **Capa Atualizada**. Remover → dropzone vazio (submit exige capa de novo).
- CTA continua **Publicar Rolê** (é um rolê **novo**).
- Toast de sucesso: **Rolê clonado com sucesso!** / subtítulo igual à SPEC 004.

Conteúdo em coluna única, gutter 16px, **max-width 560px** (já no shell).

---

## 3. Fluxo do Usuário

```
Grupo (app) — autenticado e com perfil (GuardaApp)
  │
  ▼
Menu → Perfil  →  /perfil  →  aba Criados
  │
  ├── Toque no briefing do card  →  /aprovacoes?role={id}   (SPEC 007, inalterado)
  └── Toque em Clonar
        │
        ▼
      /criar-role?origem={roleId}
        │
        ├── GET /roles/:id/modelo  (Bearer)
        │     ├── 200 → hidrata form (exceto data)
        │     ├── 401 → GuardaApp / login
        │     ├── 403 / 404 → estado de erro na tela + CTA Voltar ao perfil
        │     └── 500 → mesmo estado de erro + Tentar de novo
        │
        ├── Piloto ajusta o que quiser (título, rota, ritmo, capa, instruções)
        ├── Escolhe data nova (+ hora, já preenchida)
        └── Publicar Rolê
              │
              ├── Sem data / data passada → erro no cartão Horário (sem POST)
              ├── Capa removida e sem arquivo → erro no bloco da capa
              └── Válido
                    │
                    ├── Se arquivo novo → upload Storage (SPEC 004)
                    ├── Se capa original → reusa fotoCapaUrl (sem upload)
                    └── POST /roles  (mesmo body da SPEC 004)
                          │
                          ├── 201 → toast clone + redirect `/` ~1,6s
                          └── 400 / 500 → mensagem geral, permanece na tela
```

- Sem `origem` na query, `/criar-role` permanece **100%** a SPEC 004 (form vazio).
- Cancelar / seta com `origem` → `/perfil` (não grava rascunho).
- Avatar do header → `/perfil`.
- O rolê original **não** é alterado.
- Participantes, pedidos e `usersrole` **não** são copiados.

---

## 4. Arquitetura Next.js

Seguir a skill: página orquestradora, componentes ~80 linhas, lógica em hooks, API em service. `"use client"` só no que tem estado, clique ou `useAuth`.

A listagem e o GET do modelo **não** podem ser Server Action com fetch no servidor: a rule do projeto exige Bearer no client (`auth.currentUser`).

### 4.1 Por que não criar `/clonar-role`

Clone é **criar de novo com atalho**. A rota `/criar-role` já existe, o dock `+` já aponta para ela, e o POST já valida o body. Query `origem` é o discriminante. Sem item novo no menu. `useItemMenuAtivo`: com ou sem query, o `+` continua destacado.

`page.tsx` lê `searchParams` (Next 15: Promise) e passa `origemId` para a tela. Assim o form não precisa de `useSearchParams`.

```tsx
// src/app/(app)/criar-role/page.tsx — Server Component
type Props = { searchParams: Promise<{ origem?: string }> };

const CriarRolePage = async ({ searchParams }: Props) => {
  const { origem } = await searchParams;
  const origemId =
    typeof origem === "string" && origem.trim() ? origem.trim() : undefined;

  return (
    <main>
      <TelaCriarRole origemId={origemId} />
    </main>
  );
};
```

Query malformada / vazia = modo criação normal.

### 4.2 Estrutura por feature (acréscimos)

```
src/app/(app)/perfil/
├── components/
│   ├── CardHistorico.tsx                 # Alterar — briefing Link + slot do clone
│   └── BotaoClonarRole.tsx               # NOVO — só status lider
├── constants.ts                          # Alterar — href do clone
└── historico-pistas.module.css           # Alterar — linha do card + botão

src/app/(app)/criar-role/
├── page.tsx                              # Alterar — lê searchParams.origem
├── components/
│   ├── TelaCriarRole.tsx                 # Alterar — recebe origemId
│   ├── CabecalhoCriarRole.tsx            # Alterar — título / href voltar
│   ├── IntroBriefing.tsx                 # Alterar — copy do modo clone
│   ├── FaixaClonando.tsx                 # NOVO — barra laranja + título original
│   ├── FormularioCriarRole.tsx           # Alterar — origemId + estados de load/erro
│   ├── EstadoCarregandoModelo.tsx        # NOVO
│   ├── EstadoErroModelo.tsx              # NOVO
│   ├── FotoCapa.tsx                      # Alterar — badge “Capa do original”
│   ├── BotaoCancelar.tsx                 # Alterar — href / ou /perfil
│   └── ToastSucesso.tsx                  # Alterar — copy quando clone
├── hooks/
│   ├── useFormularioCriarRole.ts         # Alterar — hidrata + capa URL
│   ├── useModeloRole.ts                  # NOVO — GET do modelo
│   ├── useCampoLocalizacao.ts            # Alterar — preencher() sem Nominatim
│   └── useFotoCapa.ts                    # Alterar — usarUrlExistente()
├── services/
│   └── roles.service.ts                  # Alterar — buscarModelo(id)
└── constants.ts                          # Alterar — copies do modo clone
```

Não criar pasta `clonar-role/`. Não inflar `perfil.module.css`.

`CardHistorico` já está no limite de ~80 linhas. **Não** colocar o GET nem o `Link` de clone dentro dele — só compor `BotaoClonarRole`.

### 4.3 Responsabilidades

| Peça | Tipo | Faz |
|------|------|-----|
| `page.tsx` (criar-role) | Server | Lê `origem`, monta `TelaCriarRole` |
| `BotaoClonarRole` | UI | `Link` 48px para `/criar-role?origem=` |
| `CardHistorico` | UI | Briefing + botão se `status === "lider"` |
| `useModeloRole` | Hook | GET, loading, erro, retry |
| `useFormularioCriarRole` | Hook | Hidrata campos quando o modelo chega |
| `roles.service` | Service | `buscarModelo` + `criar` (já existe) |
| `FaixaClonando` | UI | Contexto visual do original |
| `GET /roles/:id/modelo` | Back | Dono only; DTO `RoleModelo` |

**Não misturar** no mesmo arquivo: JSX do card + `fetch` do modelo + validação do form.

**Não** usar `GET /roles/:id` (detalhe do feed / SPEC 005) para clonar. Aquele payload traz `criador`, `minhaParticipacao` e é **lível por qualquer autenticado**. Clone exige dono e um DTO sem participação.

**Não** usar `GET /perfil/historico` para hidratar: o item do histórico **não** tem `localSaida`, `destinoFinal` nem `fotoCapaUrl`.

### 4.4 Item ativo no menu

- Em `/perfil`: Perfil.
- Em `/criar-role?origem=`: o **+** (igual criar do zero).

---

## 5. Contrato dos Dados (front)

```ts
export type RoleModelo = {
  roleIdOrigem: string;
  titulo: string;
  descricao: string;
  fotoCapaUrl: string;
  ritmo: RitmoRole;
  localSaida: Localizacao;
  destinoFinal: Localizacao;
  horaSaida: string; // "HH:mm" em America/Sao_Paulo
};
```

Tipos em `src/types/role.ts` e o mesmo shape em `functions/src/types/role.ts`. Não criar `clonar-role.ts` só por isso. Não inflar `historico-pistas.ts`.

`horaSaida` vem **pronta do backend**. O client **não** parseia `dataHoraSaida` do original (evita bug de fuso).

O body do `POST /roles` continua `RolePublicacao`. **Não** enviar `roleIdOrigem`, `clonadoDe` nem `id`.

### O que copia / o que não copia

| Campo | Clone |
|-------|--------|
| `titulo` | Copia (piloto pode editar) |
| `descricao` | Copia (`""` se original vazio) |
| `ritmo` | Copia |
| `localSaida` / `destinoFinal` | Copia endereço + lat/lng (partida válida sem Nominatim) |
| `fotoCapaUrl` | Reusa a string; upload só se o piloto anexar arquivo novo |
| `horaSaida` | Copia (America/Sao_Paulo) |
| Data de partida | **Não** copia — input vazio |
| `id`, `criadorId`, `createdAt`, `updatedAt` | Novos no POST |
| Confirmados / pedidos (`usersrole`) | **Não** copia |
| `dataHoraSaida` antiga | **Não** vai no POST |

### Validação no clone (delta da SPEC 004)

Regras da 004 permanecem, **exceto** capa:

| Campo | Clone |
|-------|--------|
| Foto | Válida se `photoFile` **ou** `fotoCapaUrl` do modelo ainda estiver no form |
| Data | Obrigatória e futura (igual 004). Vazia no hydrate → “Informe a data de partida” |
| Hora | Já preenchida; piloto pode mudar |
| Partida / destino | Já com coords; válidos sem nova escolha na lista |

Se o piloto **apagar** o texto da partida, as coords zeram (`aoDigitar` já faz isso) e a 004 volta a exigir sugestão/GPS.

---

## 6. Implementação Front

### 6.1 Service

```ts
// src/app/(app)/criar-role/services/roles.service.ts
export const rolesService = {
  criar: (dados: RolePublicacao) =>
    api<Role>("/roles", { method: "POST", body: JSON.stringify(dados) }),

  buscarModelo: (roleId: string) =>
    api<RoleModelo>(`/roles/${roleId}/modelo`),
};
```

Usar `api` (Bearer automático). Tratar `ApiError` (403/404/500).

### 6.2 Hook do modelo (esqueleto)

```ts
const useModeloRole = (origemId: string | undefined) => {
  // sem origemId → { modelo: null, carregando: false, erro: null }
  // com origemId → GET ao montar / ao mudar o id
  return { modelo, carregando, erro, recarregar };
};
```

Não chamar o GET no `CardHistorico`. O card só navega.

### 6.3 Hidratação do form

Quando `modelo` chegar:

1. `setTitulo(modelo.titulo)`
2. `setDescricao(modelo.descricao)`
3. `setRitmo(modelo.ritmo)`
4. `setHoraSaida(modelo.horaSaida)` — se vier fora de `HH:mm`, cair em `HORA_PADRAO`
5. `setDataSaida("")`
6. `partida.preencher(modelo.localSaida)` e `destino.preencher(modelo.destinoFinal)`
7. `foto.usarUrlExistente(modelo.fotoCapaUrl)`

`preencher` em `useCampoLocalizacao`:

- Seta `escolhendoRef.current = true` **antes** de gravar endereço (senão o debounce dispara Nominatim).
- Grava `endereco`, `lat`, `lng`; fecha lista; `gpsStatus = "idle"`.

`usarUrlExistente` em `useFotoCapa`:

- `arquivo = null`
- `previewUrl = url` (http/https, **não** revogar no unmount — só revogar `blob:`)
- Flag interna `urlHerdada: boolean` para o badge e para o submit.

`enviar(uid)`:

- Se tem `arquivo` → `uploadFotoCapaRole` (SPEC 004).
- Senão se `urlHerdada` ainda válida → devolve essa string (Promise.resolve).
- Senão → reject (capa obrigatória).

Remover capa: limpa arquivo, preview **e** `urlHerdada`.

### 6.4 Navegação do card Criados

```ts
export const hrefClonarRole = (roleId: string): string =>
  `/criar-role?origem=${encodeURIComponent(roleId)}`;
```

| Superfície | Elemento | Destino |
|------------|----------|---------|
| Briefing do card (título, km, data) | `Link` | `/aprovacoes?role={roleId}` (SPEC 008) |
| Botão Clonar | `Link` | `/criar-role?origem={roleId}` |

`aria-label` do clone: `Clonar {titulo}`. Não disparar POST ao tocar.

Estrutura (não aninhar):

```tsx
<div className={styles.cardLinha}>
  <Link href={hrefCardHistorico(item)} className={styles.card} ...>
    {/* briefing atual */}
  </Link>
  {item.status === "lider" ? (
    <BotaoClonarRole roleId={item.roleId} titulo={item.titulo} />
  ) : null}
</div>
```

`.cardLinha`: flex, gap 8px, align center. O `Link.card` perde a largura total e vira `flex: 1; min-width: 0`.

### 6.5 Estados de `/criar-role?origem=`

| Estado | UI |
|--------|----|
| Carregando modelo | Header + intro clone + skeleton de 3 cartões (`role="status"` “Carregando rota original”) — **sem** form editável |
| Erro 403 | “Só o piloto líder pode clonar este rolê.” + Voltar ao perfil |
| Erro 404 | “Não encontramos este rolê.” + Voltar ao perfil |
| Erro de rede / 500 | “Não foi possível carregar a rota original.” + Tentar de novo |
| 200 | Faixa + form hidratado |

Não mostrar o form vazio “piscando” antes do GET — evita o piloto achar que o clone falhou.

### 6.6 Tokens CSS

Botão clone: CSS em `historico-pistas.module.css` (é peça do card). Faixa e estados de modelo: `criar-role.module.css`. Sem hex solto no TSX.

| Token | Uso |
|-------|-----|
| `--surface-container-high` / `-highest` | Fundo do botão Clonar |
| `--primary-container` | Ícone clone, barra da faixa, título Clonar Rolê |
| `--on-surface` / `--on-surface-variant` | Textos da faixa / erros |
| `--touch-min` | 48px do botão |
| Tokens já usados em `criar-role.module.css` | Form, CTA, toast |

Ícone: Material Symbols Outlined `content_copy`. Tipografia da faixa: Barlow Condensed no rótulo; Plus Jakarta no título original.

### 6.7 Acessibilidade

- Botão clone: `aria-label="Clonar {titulo}"`; toque 48×48; não usar só cor para significar a ação.
- Card: o `Link` do briefing **não** inclui a palavra “clonar” no `aria-label` (continua “Abrir {titulo}”).
- Faixa: `aria-label="Clonando rota: {titulo}"`.
- Loading do modelo: `role="status"`.
- Erro do modelo: `role="alert"` + botão Tentar de novo (se 500) ou link Voltar.
- Data vazia: `aria-invalid` no input date ao falhar submit (já na 004).
- Usável a partir de 360px: o botão não pode empurrar o título do card para fora — `truncate` no briefing já existe.

### 6.8 Header e cancelar

| Modo | Título | Voltar / Cancelar |
|------|--------|-------------------|
| Criação (sem `origem`) | Criar Rolê | `/` |
| Clone | Clonar Rolê | `/perfil` |

`aria-label` da seta no clone: “Voltar para o perfil”.

---

## 7. Backend — `GET /roles/:id/modelo`

Não usar `onCall`. Rotas **sem** `firestore.collection` direto. Não criar coleção. Não gravar. O POST continua o da SPEC 004.

### 7.1 Por que um path novo

| Endpoint | Quem lê | Payload |
|----------|---------|---------|
| `GET /roles/:id` | Qualquer autenticado | `RoleDetalhe` (criador, participação, km) |
| `GET /roles/:id/modelo` | **Só o criador** | `RoleModelo` (rota + hora, sem participação) |

Reusar o detalhe vazaria a regra “qualquer piloto vê o comboio” para um atalho de **publicar de novo**. 403 no modelo deixa a autorização explícita.

Registrar **antes** de handlers ambíguos se no futuro existir `GET /roles/modelo`. Hoje `GET /:id/modelo` não colide com `GET /:id` (segundo segmento).

Montar no `rolesRouter` (já tem `autenticar`), **acima** do `GET /:id` por clareza:

```
GET /roles/:id/modelo
```

### 7.2 Auth e autorização

1. Bearer válido — senão **401**.
2. `buscarPorId(id)` — inexistente → **404** `{ erro: "Rolê não encontrado" }`.
3. `existente.criadorId !== req.usuario.uid` e não admin → **403** `{ erro: "Apenas o criador pode clonar este rolê" }`.
4. Admin (`isAdmin`) **pode** clonar (mesmo critério de PUT/DELETE). Caso raro; não documentar na UI.

Não aceitar `uid` na query. Não devolver o modelo de rolê alheio “porque está autenticado”.

### 7.3 Tipo de domínio (Functions)

```ts
// functions/src/types/role.ts — acréscimo
export type RoleModelo = {
  roleIdOrigem: string;
  titulo: string;
  descricao: string;
  fotoCapaUrl: string;
  ritmo: RitmoRole;
  localSaida: Localizacao;
  destinoFinal: Localizacao;
  horaSaida: string; // HH:mm America/Sao_Paulo
};
```

### 7.4 Montagem de `horaSaida`

Helper em `functions/src/lib/quando.ts` (já conhece `America/Sao_Paulo`):

```ts
export const horaSaoPaulo = (iso: string): string => {
  // Intl hour2-digit + minute2-digit, hour12: false, timeZone America/Sao_Paulo
  // Normalizar "24:xx" → "00:xx" se o runtime emitir 24
};
```

Formato sempre `HH:mm` (zero à esquerda). Sem timezone no string.

### 7.5 Handler (contrato)

```
GET /roles/:id/modelo
Headers: Authorization: Bearer <idToken>

200 → RoleModelo
401 → token ausente / inválido
403 → autenticado mas não é o criador
404 → id inexistente
500 → responderErro
```

```ts
res.json({
  roleIdOrigem: role.id,
  titulo: role.titulo,
  descricao: role.descricao,
  fotoCapaUrl: role.fotoCapaUrl,
  ritmo: role.ritmo,
  localSaida: role.localSaida,
  destinoFinal: role.destinoFinal,
  horaSaida: horaSaoPaulo(role.dataHoraSaida),
});
```

Não incluir `dataHoraSaida`, `criadorId`, `createdAt`, `participantes`.

Rolê **futuro** também é clonável (repetir a mesma pista na semana seguinte). Sem filtro de data.

Não criar `POST /roles/:id/clonar`. A data nova só o piloto escolhe no form; um POST servidor copiaria horário velho ou exigiria body extra sem ganho.

### 7.6 Repositório

Só `roleRepository.buscarPorId` — **já existe**. Sem método novo. Sem índice novo.

### 7.7 POST /roles

Inalterado. O clone é um POST comum. Sem campo `origemId` no documento.

Health em `GET /` pode listar `/roles/:id/modelo`.

### 7.8 O que não muda

- Function HTTP única `api`.
- `POST /roles`, `GET /roles`, `GET /roles/:id`.
- `GET /perfil/historico`.
- Documento `roles` **sem** `clonadoDe` / `origemId` / array `participantes`.
- Sem escrita nesta spec (só o GET; a escrita é o POST da 004).

---

## 8. Wireframe

```
Cockpit — aba Criados
┌─────────────────────────────────────┐
│  ▎ HISTÓRICO DE PISTAS              │
│  [Aguardando][Participei][Criados*] │
│                                     │
│  ┌──────────────────────────┐ ┌───┐ │
│  │ 29  CRIADO POR VOCÊ Líder│ │⧉ │ │  ← botão Clonar
│  │ JUL Café da Manhã & Ba…  │ │   │ │
│  │     190 km • 16 motos    │ └───┘ │
│  └──────────────────────────┘       │
│        briefing → /aprovacoes        │
└─────────────────────────────────────┘
│  🏍️        ( + )        👤*        │  Perfil ativo
└─────────────────────────────────────┘


/criar-role?origem=abc
┌─────────────────────────────────────┐
│  ←  [logo] CLONAR ROLÊ         (👤) │  voltar → /perfil
├─────────────────────────────────────┤
│  ● Briefing Inicial   Passo 1/1     │
│  MESMA PISTA, NOVA DATA             │
│  Rota, ritmo e capa vêm do original.│
│                                     │
│  ▎ CLONANDO ROTA                    │
│    Café da Manhã & Bate-Volta…      │
│                                     │
│  [título pré-preenchido]            │
│  [partida + coords]                 │
│  [ data vazia ]  [ hora 07:30* ]    │  *hora do original
│  [destino + coords]                 │
│  [ritmo do original]                │
│  [capa — badge Capa do original]    │
│  [instruções copiadas]              │
│                                     │
│  [ 🏍️  PUBLICAR ROLÊ ]              │
│       CANCELAR E VOLTAR → /perfil   │
└─────────────────────────────────────┘
│  🏍️        ( + )*       👤         │  + destacado
└─────────────────────────────────────┘
```

\* hora ilustrativa.

Estado de erro do modelo: mesma coluna, ícone `explore_off` / `warning`, copy da §6.5, botão pill 48px (visual do `botaoTentar` do histórico).

---

## 9. Fora do Escopo

- Editar ou apagar o rolê original (PUT/DELETE com UI).
- Clonar rolê de **outro** piloto (feed / Participei / Aguardando).
- Copiar participantes, pedidos ou chat.
- Persistência de linhagem (`clonadoDe`).
- Rascunho / autosave.
- Recorte de capa, compressão extra.
- Modal de confirmação antes de abrir o form.
- Atalho de clonar no feed ou em `/aprovacoes`.
- `POST /roles/:id/clonar` no servidor.
- Recorrência automática (todo sábado).
- Menu inferior, guarda de rota, tokens globais, GET do feed.

---

## 10. Critérios de Aceite

### Front — perfil

- [ ] Aba **Criados**: cada card tem botão Clonar 48×48 (`content_copy`) à direita, tokens do cockpit.
- [ ] Aguardando e Participei **sem** o botão.
- [ ] Briefing do card continua indo para `/aprovacoes?role={id}`.
- [ ] Clonar vai para `/criar-role?origem={id}` (id na query, encoded).
- [ ] Botão **não** está dentro do `Link` do briefing.
- [ ] `aria-label` “Clonar {titulo}”; usável a partir de 360px.
- [ ] CardHistorico < ~80 linhas; clone em `BotaoClonarRole`.

### Front — criar rolê

- [ ] Sem `origem`: comportamento idêntico à SPEC 004.
- [ ] Com `origem`: header **Clonar Rolê**, intro **Mesma pista, nova data**, faixa **Clonando rota**.
- [ ] GET `/roles/:id/modelo` ao entrar; skeleton até o 200; sem flash de form vazio.
- [ ] 200 hidrata título, partida (com coords), destino (com coords), ritmo, descrição, hora, capa (preview URL).
- [ ] Data permanece vazia; publicar sem data = erro no cartão Horário, sem POST.
- [ ] Capa original aceita no submit sem novo `File`; badge **Capa do original**.
- [ ] Trocar arquivo → upload novo (path da SPEC 004); remover sem anexar → erro de capa.
- [ ] `preencher` **não** dispara busca Nominatim ao hidratar.
- [ ] Voltar / Cancelar → `/perfil`.
- [ ] 201: toast **Rolê clonado com sucesso!** e redirect `/` ~1,6s.
- [ ] 403/404/500 do modelo: alerta + voltar ou retry; não publica.
- [ ] `page.tsx` Server; Client só na tela/form/hooks.
- [ ] GET isolado no service; sem Firestore no client.

### Back

- [ ] `GET /roles/:id/modelo` exige Bearer válido.
- [ ] 200 só se `criadorId === uid` (ou admin).
- [ ] 403 para autenticado que não é o criador (não vazar o DTO).
- [ ] 404 se o id não existe.
- [ ] Payload = `RoleModelo` (`horaSaida` em America/Sao_Paulo `HH:mm`); sem participação / criador / timestamps.
- [ ] Persistência só em `buscarPorId`; sem índice novo; sem escrita.
- [ ] `POST /roles` inalterado; documento novo **sem** campo de origem.
- [ ] Rolê futuro também retorna 200 no modelo.

### Integração

- [ ] Publicar o clone → aparece na aba **Criados** no próximo GET do histórico (SPEC 008).
- [ ] O original permanece na lista e em `/aprovacoes`.
- [ ] Comboio do clone começa em **0 motos** (sem `usersrole` copiado).
- [ ] Feed (SPEC 003) lista o clone quando data/raio/ritmo baterem.
- [ ] Piloto B não clona o rolê de A nem pela URL `/criar-role?origem=` (403 no GET).

---

## 11. Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| `src/app/(app)/perfil/components/CardHistorico.tsx` | **Alterar** — linha briefing + clone |
| `src/app/(app)/perfil/components/BotaoClonarRole.tsx` | **NOVO** |
| `src/app/(app)/perfil/constants.ts` | **Alterar** — `hrefClonarRole` |
| `src/app/(app)/perfil/historico-pistas.module.css` | **Alterar** — `.cardLinha`, botão |
| `src/app/(app)/criar-role/page.tsx` | **Alterar** — `searchParams.origem` |
| `src/app/(app)/criar-role/components/TelaCriarRole.tsx` | **Alterar** — `origemId` |
| `src/app/(app)/criar-role/components/CabecalhoCriarRole.tsx` | **Alterar** |
| `src/app/(app)/criar-role/components/IntroBriefing.tsx` | **Alterar** |
| `src/app/(app)/criar-role/components/FaixaClonando.tsx` | **NOVO** |
| `src/app/(app)/criar-role/components/FormularioCriarRole.tsx` | **Alterar** |
| `src/app/(app)/criar-role/components/EstadoCarregandoModelo.tsx` | **NOVO** |
| `src/app/(app)/criar-role/components/EstadoErroModelo.tsx` | **NOVO** |
| `src/app/(app)/criar-role/components/FotoCapa.tsx` | **Alterar** — badge herdada |
| `src/app/(app)/criar-role/components/BotaoCancelar.tsx` | **Alterar** — `href` |
| `src/app/(app)/criar-role/components/ToastSucesso.tsx` | **Alterar** — copy clone |
| `src/app/(app)/criar-role/hooks/useFormularioCriarRole.ts` | **Alterar** |
| `src/app/(app)/criar-role/hooks/useModeloRole.ts` | **NOVO** |
| `src/app/(app)/criar-role/hooks/useCampoLocalizacao.ts` | **Alterar** — `preencher` |
| `src/app/(app)/criar-role/hooks/useFotoCapa.ts` | **Alterar** — `usarUrlExistente` |
| `src/app/(app)/criar-role/services/roles.service.ts` | **Alterar** — `buscarModelo` |
| `src/app/(app)/criar-role/constants.ts` | **Alterar** — copies |
| `src/types/role.ts` | **Alterar** — `RoleModelo` |
| `functions/src/types/role.ts` | **Alterar** — `RoleModelo` |
| `functions/src/lib/quando.ts` | **Alterar** — `horaSaoPaulo` |
| `functions/src/routes/roles.ts` | **Alterar** — `GET /:id/modelo` |
| `functions/src/index.ts` | Opcional — health lista a rota |

Não alterar `MenuInferior`, `GuardaApp`, `POST /roles` (validação), `GET /perfil/historico` nem o mapper do Firestore.

---

## 12. Checklist da skill Next.js

- [ ] `page.tsx` de criar-role sem `"use client"` (lê `searchParams`, orquestra).
- [ ] `"use client"` só em tela, form, card e botão.
- [ ] GET do modelo em `useModeloRole` + `roles.service`; hidratação no hook do form.
- [ ] Um componente = uma coisa (botão clone, faixa, erro do modelo, card).
- [ ] Sem rota `/clonar-role` “pra ficar separado”.
- [ ] Sem abstração genérica `useClone` da aplicação.
- [ ] CSS Modules + tokens de `globals.css` / DESIGN do perfil.
- [ ] Sem `console.log` de debug.

---

## 13. Relação com o código atual

| Hoje | Nesta spec |
|------|------------|
| Aba Criados: só link para aprovações | + ação Clonar ao lado |
| `/criar-role` sempre em branco | `?origem=` hidrata via GET modelo |
| `useFotoCapa` exige `File` | URL herdada conta como capa |
| `useCampoLocalizacao` só GPS / digitação | + `preencher` para coords já conhecidas |
| `GET /roles/:id` = detalhe público autenticado | `GET /roles/:id/modelo` = dono, DTO de publicação |
| SPEC 004: capa obrigatória por arquivo | Clone: arquivo **ou** URL original |
| Sem linhagem no Firestore | Continua sem — clone é atalho de UI + POST novo |

O primeiro clone real nasce do primeiro card na aba Criados (SPEC 008) + publicar de novo (SPEC 004). Sem seed.
