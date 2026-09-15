# SPEC 021 — Fechar o MVP (organizador + confiança + higiene)

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-15  
> **Origem:** revisão do MVP vs proposta do produto (ciclo líder incompleto; fila sem sinais de confiança; docs/visão defasados)  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade  
> **Backend:** Cloud Function `api` (Express) — `PUT|DELETE /roles/:id` (já existem), `GET /aprovacoes` (enriquecer), `PUT /perfil` (campo `cidade`)  
> **Coleções Firestore:** `roles`, `usersrole`, `users`, `dispositivos` — **sem** coleção nova  
> **Depende de:** SPEC 002 (perfil), SPEC 004 (criar rolê), SPEC 007 (fila), SPEC 009 (clone / `GET .../modelo`), SPEC 013 (FCM), SPEC 017 (Meus Rolês), SPEC 020 (lembretes no PUT/DELETE)

---

## 1. Objetivo

Fechar três buracos do MVP que já estão **meio prontos** no backend ou na visão, mas não entregam valor no app:

| ID | Área | Problema hoje | Entrega |
|----|------|---------------|---------|
| **A** | Organizador | `PUT` / `DELETE /roles/:id` existem (e reagendam/cancelam lembretes — SPEC 020), mas **nenhuma tela chama** | Editar e cancelar rolê no app |
| **B** | Confiança na fila | SPEC 007 omitiu estrelas / `(14 rolês)` e cidade; líder decide só com nome, moto e ritmo | Mostrar **cidade** + **já rodou N rolês** no card da aprovação |
| **C** | Higiene | Páginas de exemplo do Sentry no app; `.cursor/rules` ainda falam Facebook, mapa no feed, `categoriaMotos` e coleção `solicitacoes` | Remover exemplos Sentry e alinhar docs da visão ao modelo atual |

Esta spec **não** abre mapa no feed, chat, limite de vagas, Facebook login nem filtro por cilindrada.

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | Modo editar em `/criar-role`, ações no Meus Rolês / detalhe do líder, card da fila enriquecido, campo cidade no perfil, apagar rotas Sentry de exemplo |
| Back (Functions) | Endurecer validação do `PUT`, push no cancelamento, enriquecer `UsuarioResumoSolicitacao`, aceitar `cidade` no `PUT /perfil`, helper de contagem `rolesRodados` |
| Docs | Atualizar `project-context.mdc` e `tech-stack.mdc` para o domínio real (`ritmo`, `usersrole`, auth Google + e-mail) |

---

## 2. Recorte e princípios

### 2.1 O que entra

- **A1** — Entrar em modo edição a partir de Meus Rolês (status `lider`, saída futura) e do detalhe `/roles/[id]/participar` quando o viewer é o criador.
- **A2** — Reusar o formulário de `/criar-role` com query `editar={roleId}` (espelho do clone `origem=` da SPEC 009).
- **A3** — `PUT /roles/:id` com a **mesma validação** do `POST` (campos obrigatórios, partida no futuro).
- **A4** — Cancelar (excluir) rolê com `confirm` + `DELETE /roles/:id` + push FCM aos aceitos.
- **B1** — Campo `cidade` editável no perfil (`PUT /perfil`).
- **B2** — Fila de aprovações recebe `cidade` + `rolesRodados` e exibe no card.
- **C1** — Remover `src/app/sentry-example-page/` e `src/app/api/sentry-example-api/`.
- **C2** — Alinhar regras de visão (`.cursor/rules/project-context.mdc`, `tech-stack.mdc`) ao schema/código atuais.

### 2.2 O que **não** entra

| Item | Motivo |
|------|--------|
| Mapa no feed / pins | Próximo salto de produto; SPEC 003 já recortou |
| Login Facebook | Visão antiga; Google + e-mail bastam |
| Filtro por cilindrada / `categoriaMotos` | Domínio real é `ritmo` |
| Soft-delete / arquivar rolê | `DELETE` hard (já remove o doc); lembretes já cancelam |
| Editar rolê **depois** da saída | Só futuro — passado usa clone (SPEC 009) |
| Editar `criadorId` / transferir liderança | Fora |
| Unicidade de apelido | SPEC 011 / 014 |
| Cidade no primeiro acesso | Opcional depois; nesta spec só no perfil |
| Redesign da fila / reputação com estrelas | Só contagem textual |
| Inbox de notificações | Push direto (SPEC 013) |
| Manter páginas Sentry de exemplo “para demo” | Ruído em produção |

### 2.3 Desvios conscientes

| Hoje / mock | Nesta spec | Por quê |
|-------------|------------|---------|
| SPEC 007: sem `(14 rolês)` | Texto **Já rodou N rolês** (ou **Ainda não rodou**) | Confiança mínima sem schema de reputação |
| SPEC 002 / 014: cidade fora | Cidade **opcional** no perfil + exibida na fila se preenchida | Sem coleta, o campo na fila nasce morto |
| `camposUpdate` frouxo no PUT | Validação espelhando `validarBodyCriacao` | Evitar título vazio / partida no passado |
| Clone usa `origem=` | Edição usa `editar=` (mutuamente exclusivo) | Clone cria doc novo; edição altera o mesmo `id` |
| SPEC 017: “Editar/apagar fora” | Abre essas ações só para líder futuro | Fecha o buraco que a 017 deixou explícito |

---

## 3. Fluxos do usuário

### 3.1 A — Editar rolê

```
Meus Rolês (/meus-roles) — item status=lider, dataHoraSaida > agora
  │
  └── [Editar]  →  /criar-role?editar={roleId}
        │
        ├── GET /roles/:id/modelo  (Bearer, só dono/admin — já existe)
        │     ├── 200 → hidrata form (inclui data + hora do original)
        │     ├── 403 / 404 → EstadoErroModelo + Voltar
        │     └── 401 → GuardaApp
        │
        ├── Piloto altera campos → [Salvar alterações]
        │     ├── upload capa se trocou arquivo (mesmo Storage da SPEC 004)
        │     └── PUT /roles/:id
        │           ├── 200 → toast “Rolê atualizado!” → /meus-roles
        │           ├── 400 → erro no form
        │           └── 403 / 404 → toast erro
        │
        └── Cancelar / voltar → /meus-roles (não /perfil; fluxo começou na garagem)

Detalhe do líder (/roles/[id]/participar, criadorId === uid, saída futura)
  └── Ação secundária [Editar rolê] → mesmo /criar-role?editar=
```

Regras:

- Query `editar` e `origem` **não** podem coexistir. Se ambas vierem, priorizar `editar` e ignorar `origem`.
- No modo editar: header **Editar Rolê**; CTA **Salvar alterações**; faixa **Editando rota** (mesmo idioma visual da faixa **Clonando rota**).
- Data **vem preenchida** (diferente do clone). Continua obrigatória e **no futuro** no submit.
- Capa: URL atual vale (igual clone). Trocar arquivo → novo upload. Remover → exige nova capa antes do PUT.

### 3.2 A — Cancelar rolê

```
Meus Rolês — status=lider (futuro)  OU  detalhe do líder
  │
  └── [Cancelar rolê]
        │
        └── window.confirm(
              "Cancelar “{titulo}”? Os pilotos aceitos serão notificados e o rolê some do feed."
            )
              ├── Cancelar diálogo → nada
              └── OK → DELETE /roles/:id
                    ├── 204 → toast “Rolê cancelado.” → lista atualiza / redirect /meus-roles
                    ├── 403 / 404 → toast erro
                    └── (back) cancela lembretes (SPEC 020) + push aos aceitos (NOVO nesta spec)
```

- Cancelar é **definitivo** (doc removido). Não há “desfazer”.
- Rolês **já saídos** (`dataHoraSaida <= agora`): **sem** botão Cancelar nem Editar. Clone continua na aba Concluídos (SPEC 009 / 017).
- Participantes pendentes / aceitos: o doc `usersrole` pode ficar órfão se o repositório de roles não cascateia — ver §6.4.

### 3.3 B — Cidade no perfil + sinais na fila

```
Perfil (/perfil)
  └── Campo Cidade (opcional) → PUT /perfil { ..., cidade }
        └── 200 → toast existente; cidade persiste em users/{uid}

Aprovações (/aprovacoes)
  └── GET /aprovacoes (payload enriquecido)
        └── Card:
              nome, @apelido, moto   (já existe)
              cidade                 (se trim !== "")
              “Já rodou N rolês”     (sempre; N pode ser 0 → copy “Ainda não rodou”)
```

### 3.4 C — Higiene

```
Remover rotas:
  /sentry-example-page
  /api/sentry-example-api

Manter (se já usados em prod):
  sentry.client.config / sentry.server.config / sentry.edge.config
  instrumentação Next — fora do escopo de “exemplo”

Docs:
  .cursor/rules/project-context.mdc
  .cursor/rules/tech-stack.mdc  (modelo users / roles / usersrole)
```

---

## 4. Referência de design

Sem mock Stitch novo. Reusar tokens de `designs/criar-role/`, `designs/aprovacao-integrante/` e `designs/perfil/` + `globals.css`.

### 4.1 Modo editar (`/criar-role?editar=`)

- Mesmo layout da SPEC 004 / 009.
- Header: **Editar Rolê** (Barlow Condensed uppercase).
- Intro: título **Ajustar a rota**; subtítulo **Altere o que precisar e salve. Os pilotos já aceitos mantêm a vaga.**
- Faixa: barra laranja + **Editando rota** + título truncado.
- CTA: **Salvar alterações** (ícone `save`), altura `touch-target`.
- Toast sucesso: **Rolê atualizado!** / subtítulo curto igual ao de publicar.

### 4.2 Ações no card Meus Rolês (líder futuro)

No card `lider` com saída futura, além dos CTAs já existentes (Acessar / fila):

| Ação | Visual | Destino |
|------|--------|---------|
| **Editar** | Botão secundário 48px, ícone `edit`, label ou `aria-label` **Editar {titulo}** | `/criar-role?editar={id}` |
| **Cancelar rolê** | Texto/erro (`--error`), ícone `delete` | `confirm` → DELETE |

Não inventar menu `more_vert` com swipe. Dois botões explícitos bastam (toque com luva).

No detalhe `/roles/[id]/participar` do criador: bloco de ações do organizador com os mesmos dois botões (acima do dock).

### 4.3 Identidade na fila (SPEC 007)

Em `IdentidadePiloto`, abaixo da moto:

- Linha cidade (ícone `location_on`, `body-sm` `on-surface-variant`) — **só se** `cidade.trim()`.
- Linha trajetória: ícone `sports_score` + texto:
  - `rolesRodados === 0` → **Ainda não rodou**
  - `rolesRodados === 1` → **Já rodou 1 rolê**
  - `n > 1` → **Já rodou {n} rolês**

Sem estrelas, sem selo verified, sem “/15 vagas”.

### 4.4 Campo cidade no perfil

- Em **Dados do Piloto**, após Apelido (ou após Moto — manter ordem visual atual e inserir **Cidade** antes do ritmo).
- Input `touch-min`, ícone `location_city`, label **Cidade**, hint **opcional · aparece na fila de aprovação**.
- Não bloqueia Salvar se vazio. Se preenchido: trim, 2–80 chars.

---

## 5. Front — arquitetura

### 5.1 Estrutura (delta)

```
src/app/(app)/criar-role/
├── hooks/
│   ├── useModeloRole.ts          # Alterar — aceitar modo "editar" | "clonar"
│   └── useFormularioCriarRole.ts # Alterar — submit PUT vs POST
├── components/
│   ├── FaixaClonando.tsx         # Alterar ou extrair FaixaContextoRole (clonar | editar)
│   ├── CabecalhoCriarRole.tsx    # Alterar copy
│   └── BotaoPublicar.tsx         # Alterar label CTA
├── services/roles.service.ts     # Alterar — atualizar() + (opcional) excluir()
└── page.tsx                      # Ler searchParams editar | origem

src/app/(app)/meus-roles/
├── components/CardDestaqueRole.tsx / CardConfirmadoRole.tsx  # Ações editar/cancelar
└── constants.ts                  # destinos + helpers

src/app/(app)/roles/[id]/participar/
└── …                             # Bloco ações do organizador (editar/cancelar)

src/app/(app)/aprovacoes/components/IdentidadePiloto.tsx  # cidade + rolesRodados

src/app/(app)/perfil/             # Campo cidade no form + UsuarioEdicao

src/types/aprovacao.ts            # cidade, rolesRodados
src/types/user.ts                 # cidade em UsuarioEdicao

# Remover
src/app/sentry-example-page/
src/app/api/sentry-example-api/
```

### 5.2 Service

```ts
// roles.service.ts
export const rolesService = {
  criar: (dados: RolePublicacao) => api<Role>("/roles", { method: "POST", body: JSON.stringify(dados) }),
  atualizar: (id: string, dados: RolePublicacao) =>
    api<Role>(`/roles/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(dados),
    }),
  excluir: (id: string) =>
    api<void>(`/roles/${encodeURIComponent(id)}`, { method: "DELETE" }),
  buscarModelo: (roleId: string) =>
    api<RoleModelo>(`/roles/${encodeURIComponent(roleId)}/modelo`),
};
```

`DELETE` via `api` deve tolerar **204 sem body** (não dar `JSON.parse` em vazio).

### 5.3 Hook de modelo

Estender `useModeloRole`:

| Query | Modo | Data no form | Submit |
|-------|------|--------------|--------|
| `origem` | clonar | vazia | POST |
| `editar` | editar | preenchida (partir `dataHoraSaida` do GET detalhe **ou** estender modelo — ver §6.2) | PUT |
| nenhuma | criar | vazia | POST |

Hoje `GET /roles/:id/modelo` devolve só `horaSaida`, não a data — ok para clone. Para editar, opções:

1. **Preferida:** estender `RoleModelo` com `dataHoraSaida` (ISO) opcional / sempre; no clone o front **ignora a data** e deixa o campo vazio; no editar usa o ISO.
2. Alternativa: no modo editar chamar `GET /roles/:id` e mapear para o form.

Esta spec manda a opção **1** (um GET só, menos round-trip).

### 5.4 Tipos front

```ts
// UsuarioResumoSolicitacao
cidade: string;
rolesRodados: number;

// UsuarioEdicao
cidade: string; // pode ser ""
```

---

## 6. Backend

### 6.1 `PUT /roles/:id` — validação

Substituir `camposUpdate` frouxo por validação **completa** no estilo `validarBodyCriacao`:

- Mesmos campos obrigatórios do POST (`titulo`, `fotoCapaUrl`, `ritmo`, `dataHoraSaida`, `localSaida`, `destinoFinal`; `descricao` opcional).
- `dataHoraSaida` > `Date.now()`.
- Body parcial **não** é aceito nesta spec (front sempre manda o formulário inteiro). Se quiser evoluir para PATCH depois, outra spec.
- Autorização: `isDonoOuAdmin` (já existe).
- Se `dataHoraSaida` mudou → cancelar + reagendar lembretes (já na SPEC 020 / código atual).
- Resposta: `200` + `Role` atualizado.
- **Não** permitir PUT se a saída **original** já passou (`existente.dataHoraSaida <= now` → `409` *“Não dá para editar um rolê que já saiu”*).

### 6.2 `GET /roles/:id/modelo` — estender

```ts
export type RoleModelo = {
  roleIdOrigem: string;
  titulo: string;
  descricao: string;
  fotoCapaUrl: string;
  ritmo: RitmoRole;
  localSaida: Localizacao;
  destinoFinal: Localizacao;
  horaSaida: string;
  /** ISO completo — clone ignora; edição pré-preenche data+hora */
  dataHoraSaida: string;
};
```

Contrato compatível: campo novo; clone só deixa de usar a data.

### 6.3 `DELETE /roles/:id` — push aos aceitos

Após cancelar lembretes e **antes ou depois** de `roleRepository.remover`:

1. Listar confirmados (`listarConfirmadosDoRole`).
2. Para cada `usuarioId` (exceto o criador se estiver na lista): `notificarCancelamentoRole(uid, roleId, titulo)`.
3. Remover o documento do rolê.
4. `204`.

Novo helper em `functions/src/lib/notificacoes.ts`:

| Campo | Valor |
|-------|--------|
| title | Rolê cancelado |
| body | `{titulo} foi cancelado pelo organizador.` |
| data.link | `/meus-roles` (ou `/` — preferir Meus Rolês) |

Pedidos **pendentes** não recebem push (ainda não estavam no comboio). Opcional: apagar `usersrole` do `roleId` em lote — ver §6.4.

### 6.4 Cascata de `usersrole` no DELETE

Hoje o DELETE remove só `roles/{id}`. Pedidos órfãos poluem Meus Rolês / histórico.

**Nesta spec (obrigatório):** ao excluir o rolê, remover (ou marcar) todos os `usersrole` com aquele `roleId`.

Implementação sugerida:

- Novo método no repositório: `usuarioRoleRepository.removerPorRoleId(roleId)`.
- Chamado na rota `DELETE` **na mesma request**, após listar confirmados (para o push) e antes/depois de remover o rolê.
- Sem soft-delete.

### 6.5 Enriquecer aprovações — `cidade` + `rolesRodados`

#### Tipo

```ts
export type UsuarioResumoSolicitacao = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
  moto: string;
  pilotagem: Pilotagem;
  cidade: string;
  rolesRodados: number;
};
```

#### Definição de `rolesRodados`

Número de rolês em que o piloto **já concluiu participação aceita**:

- Documento `usersrole` com `usuarioId = uid`, `aceito === true`, `aceitoEm != null`, `recusadoEm == null`.
- E o `roles/{roleId}.dataHoraSaida <= now`.

**Não** conta: pendentes, recusados, rolês futuros confirmados, rolês só como organizador (sem vínculo aceito).  
Organizador que só lidera e não “pede vaga” não infla a contagem via criação — evita vanity; confiança = asfalto como piloto da grade.

#### Performance na fila

Em `montarFilaAprovacoes`, para os `usuarioId` distintos da visão:

- Preferir `usuarioRoleRepository.contarRolesRodados(uid)` com query `aceito == true` + join/filtro por roles já saídos.
- Se a query composta for cara no MVP: buscar aceitos do uid (teto razoável, ex. 100) + `roleRepository.buscarPorIds` + filtrar `saidaPassou` em memória (mesmo espírito do histórico).

Índice Firestore se a query exigir (`usersrole`: `usuarioId` + `aceito`).

`fallbackUsuario` → `cidade: ""`, `rolesRodados: 0`.

### 6.6 `PUT /perfil` — cidade

- `UsuarioEdicao` / update: incluir `cidade: string`.
- Validação: se string vazia após trim → grava `""`; se não vazia → length 2–80, senão `400`.
- `GET /perfil` já devolve `cidade` (campo no doc).
- POST primeiro acesso **continua** gravando `cidade: ""` (SPEC 011).

---

## 7. Docs da visão (trabalho C)

### 7.1 `project-context.mdc`

Atualizar funcionalidades para o produto real:

- Auth: **Google + e-mail/senha** (sem Facebook).
- Onboarding: apelido, moto, ritmo/pilotagem, foto, garupa (cidade no perfil, opcional).
- Feed: lista + filtros **data, distância, ritmo** — mapa como evolução futura, não como “já tem”.
- Criação: ritmo `tranquila | moderada | agressiva` (não “acelero/moderado/tranquilo” solto sem alinhar ao enum).
- Perfil: histórico (SPEC 008), Meus Rolês (017), aprovações (007).

### 7.2 `tech-stack.mdc` — modelo de dados

Substituir o bloco defasado por algo alinhado aos types atuais:

**`users`** — `uid`, `nome`, `apelido`, `moto`, `pilotagem`, `fotoUrl`, `cidade`, `garupaFrequente`, `createdAt`.

**`roles`** — `id`, `titulo`, `descricao`, `fotoCapaUrl`, `ritmo`, `dataHoraSaida`, `localSaida` / `destinoFinal` (`lat`, `lng`, `endereco`, `nome`), `criadorId`, `createdAt`, `updatedAt`.

**`usersrole`** (não `solicitacoes`) — vínculo usuário↔rolê: `usuarioId`, `roleId`, `criadorId`, `aceito`, `notificar`, `aceitoEm`, `recusadoEm`, `createdAt`.

Remover `categoriaMotos`, `fotoUrl` no role (é `fotoCapaUrl`), `participantes: string[]` embutido.

Firestore client continua **deny-all**; escrita só via Functions.

---

## 8. Contratos HTTP (resumo)

| Método | Path | Mudança |
|--------|------|---------|
| `GET` | `/roles/:id/modelo` | + `dataHoraSaida` ISO |
| `PUT` | `/roles/:id` | Body completo validado; 409 se já saiu; lembretes se data mudou |
| `DELETE` | `/roles/:id` | + push aceitos + cascata `usersrole` |
| `GET` | `/aprovacoes` | `usuario.cidade`, `usuario.rolesRodados` |
| `PUT` | `/perfil` | aceita `cidade` |

Nenhuma rota nova.

---

## 9. Fora do escopo (repetição explícita)

- Mapa, Facebook, cilindrada, chat, vagas, recorrência nativa.
- Editar/cancelar rolê passado.
- Forçar cidade no onboarding.
- Estrelas / média de feedback na fila (SPEC 010 continua só no fluxo de feedback).
- Migrar dados órfãos antigos em batch job (só cascata daqui pra frente; opcional script manual fora desta spec).
- Remover o SDK Sentry do projeto (só as **páginas de exemplo**).

---

## 10. Critérios de aceite

### A — Editar / cancelar

- [ ] Líder com rolê **futuro** vê **Editar** e **Cancelar rolê** em Meus Rolês e no detalhe.
- [ ] Rolê **passado**: sem essas ações; clone permanece.
- [ ] `/criar-role?editar=` hidrata via modelo (com data); CTA **Salvar alterações**; `PUT` persiste.
- [ ] Mudar `dataHoraSaida` reagenda lembretes (comportamento SPEC 020 preservado).
- [ ] `PUT` com partida no passado ou rolê já saído → 400 / 409; UI mostra erro.
- [ ] Cancelar pede `confirm`; `DELETE` 204; some do feed e de Meus Rolês.
- [ ] Aceitos recebem push “Rolê cancelado”.
- [ ] `usersrole` daquele `roleId` são removidos (sem órfãos novos).
- [ ] Piloto comum **não** vê Editar/Cancelar; `PUT`/`DELETE` de outro uid → 403.
- [ ] `origem` + `editar` juntos → modo editar.

### B — Confiança na fila + cidade

- [ ] Perfil salva `cidade` (vazia ou 2–80 chars).
- [ ] `GET /aprovacoes` devolve `cidade` e `rolesRodados` por piloto.
- [ ] Card omite cidade se vazia; sempre mostra a linha de trajetória.
- [ ] Contagem: só aceitos com saída passada; piloto novo → **Ainda não rodou**.
- [ ] Confirmados (visão só leitura) também mostram os mesmos campos.

### C — Higiene

- [ ] `/sentry-example-page` e `/api/sentry-example-api` **não existem** mais no app.
- [ ] `project-context.mdc` sem Facebook / filtro cc / mapa como feature atual.
- [ ] `tech-stack.mdc` documenta `ritmo`, `fotoCapaUrl`, `usersrole` (não `solicitacoes` / `categoriaMotos`).

### Qualidade

- [ ] Sem Firestore no client.
- [ ] Sem `httpsCallable`.
- [ ] Componentes pequenos; fetch em service/hook.
- [ ] `api()` trata 204 no DELETE.
- [ ] Sem abstração genérica “FormRoleMode” além do necessário para clone/editar/criar.

---

## 11. Ordem sugerida de implementação

1. **C** — remover páginas Sentry + docs (rápido, sem risco de produto).
2. **B back** — tipos + `rolesRodados` + `cidade` no PUT perfil e na fila.
3. **B front** — campo cidade + `IdentidadePiloto`.
4. **A back** — validar PUT, estender modelo, cascata DELETE + push.
5. **A front** — service, modo `editar`, botões Meus Rolês / detalhe.

---

## 12. Checklist de arquivos

| Arquivo | Ação |
|---------|------|
| `docs/specs/021-fechar-mvp-organizador.md` | **NOVO** (este) |
| `.cursor/rules/project-context.mdc` | **Alterar** — visão atual |
| `.cursor/rules/tech-stack.mdc` | **Alterar** — schema atual |
| `src/app/sentry-example-page/**` | **Remover** |
| `src/app/api/sentry-example-api/**` | **Remover** |
| `functions/src/types/role.ts` | **Alterar** — `RoleModelo.dataHoraSaida` |
| `functions/src/types/aprovacao.ts` | **Alterar** — cidade, rolesRodados |
| `functions/src/types/usuario.ts` | **Alterar** — cidade no update |
| `functions/src/lib/aprovacoes.ts` | **Alterar** — enriquecer resumo |
| `functions/src/lib/notificacoes.ts` | **Alterar** — `notificarCancelamentoRole` |
| `functions/src/routes/roles.ts` | **Alterar** — PUT validado, modelo, DELETE cascata+push |
| `functions/src/routes/perfil.ts` | **Alterar** — cidade |
| `functions/src/repositories/interfaces/usuario-role.repository.ts` | **Alterar** — `removerPorRoleId` (+ count opcional) |
| `functions/src/repositories/firestore/firestore-usuario-role.repository.ts` | **Alterar** — impl. |
| `src/types/aprovacao.ts` / `src/types/role.ts` / `src/types/user.ts` | **Alterar** |
| `src/app/(app)/criar-role/**` | **Alterar** — modo editar |
| `src/app/(app)/meus-roles/**` | **Alterar** — ações líder |
| `src/app/(app)/roles/[id]/participar/**` | **Alterar** — ações organizador |
| `src/app/(app)/aprovacoes/components/IdentidadePiloto.tsx` | **Alterar** |
| `src/app/(app)/perfil/**` | **Alterar** — campo cidade |
| `docs/specs/007-aprovacao-pilotos.md` | **Opcional** — nota “parcialmente estendido pela 021” |
| `docs/specs/017-meus-roles.md` | **Opcional** — riscar “editar/apagar fora” |

Não alterar MenuInferior, GuardaApp, feed filters, nem o fluxo de clone além da convivência `origem` / `editar`.
