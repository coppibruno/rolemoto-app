# SPEC 025 — Perfil Público + Tipo de Moto

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-18  
> **Referência visual:** `designs/Perfil-publico/` (`DESIGN.md`, `code.html`, `screen.png`)  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade (skill `nextjs-patterns`)  
> **Backend:** Cloud Function `api` (Express) — `GET /usuarios/:uid`, `GET /usuarios/:uid/historico`; estender `POST|PUT /perfil`  
> **Coleção Firestore:** `users` (campo novo `tipoMoto`); histórico via `usersrole` + `roles` (SPEC 008)  
> **Depende de:** SPEC 001 (shell autenticado + dock), SPEC 002 / 011 (perfil + primeiro acesso), SPEC 007 (fila de aprovações — ponto de entrada), SPEC 008 (histórico de pistas)

---

## 1. Objetivo

Dois entregáveis acoplados no mesmo ciclo:

1. **Perfil público** — qualquer piloto autenticado abre o perfil de outro piloto e vê identidade, garagem, ritmo e histórico **público** (sem editar, sem sair da conta, sem fila de pedidos pendentes).
2. **Tipo de moto** — campo obrigatório no cadastro (`trail` | `speed` | `custom`), preenchido no **primeiro acesso** e editável no **próprio** `/perfil`. No perfil público aparece como badge na Garagem (ex.: `SPEED`), como no mock.

| Quem | Vê `/perfil` (edição) | Vê `/perfil/[uid]` (leitura) |
|------|----------------------|------------------------------|
| Dono do uid | Sim — formulário atual + `tipoMoto` | Redireciona para `/perfil` (ou CTA “Editar cockpit”) |
| Outro piloto autenticado | Não (só o próprio) | Sim — visão comunitária do mock |
| Visitante sem login | Não | Não — GuardaApp / 401 na API |

Esta spec é **full stack**:

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | Tela `/perfil/[uid]` alinhada ao mock; seletor de tipo de moto no primeiro acesso e na edição; links a partir da fila de aprovações; share opcional |
| Back (Functions) | DTO público + histórico sem pendências; validar `tipoMoto` em `POST`/`PUT /perfil`; mapper Firestore |

O uid do visitante vem do **token**. O uid do perfil visitado vem da **rota** / path param. Nunca misturar: o Bearer não autoriza editar o documento alheio.

---

## 2. Recorte e princípios

### 2.1 O que entra

- Rota autenticada **`/perfil/[uid]`** — “Visão Comunitária / Perfil do Piloto” (`designs/Perfil-publico/`).
- Endpoints **`GET /usuarios/:uid`** e **`GET /usuarios/:uid/historico`** (qualquer Bearer válido).
- Campo **`tipoMoto`** em `users`: `trail` | `speed` | `custom`.
- Seletor de tipo no **primeiro acesso** (`/primeiro-acesso`) e na **edição** (`/perfil` → seção Garagem).
- Badge do tipo na garagem do perfil público (e, de preferência, também no cartão/garagem do próprio perfil em modo leitura visual).
- Entrada primária de navegação: toque no piloto na **fila de aprovações** (SPEC 007) → `/perfil/{usuarioId}`.
- Botão **Voltar** (history / fallback sensato).
- **Compartilhar perfil** via Web Share API (ou copiar link) — URL absoluta de `/perfil/[uid]`.

### 2.2 O que **não** entra

| Item do mock / ideia | Motivo |
|----------------------|--------|
| Telemetria **18 Rolês Feitos** / **2.450 Km em Comboio** | Sem agregação de km no schema (mesmo recorte SPECs 002 / 007 / 008). Contagens do histórico bastam no título da seção |
| Selo **verified** no avatar | Sem homologação de piloto no produto |
| Nota **5.0 da Rota** / estrelas nos cards | Sem reputação; cards reusam o contrato enxuto da SPEC 008 |
| Botões “quick action” vazios no HTML | Markup morto no Stitch |
| Sino de notificações no header | SPECs anteriores já omitiram |
| Aba **Aguardando** no histórico público | Privacidade: pedidos pendentes são só do dono (SPEC 008) |
| Editar / excluir / sair na visão alheia | Só no `/perfil` próprio |
| `admin`, e-mail, telefone, dispositivos | Fora do DTO público |
| Perfil aberto sem autenticação | App autenticado; sem rota pública anônima nesta spec |
| Unicidade de apelido / URL por `@apelido` | Continua `uid` na rota |
| Subcoleção de várias motos | Uma moto (`moto` string) + um `tipoMoto` |
| Migration batch no Firestore | Soft migration no mapper + obrigatoriedade no próximo save / primeiro acesso novo |

### 2.3 Perfil próprio vs perfil alheio (não misturar)

| | `/perfil` | `/perfil/[uid]` |
|--|-----------|-----------------|
| Natureza | Cockpit editável | Visão comunitária (somente leitura) |
| Mock | `designs/perfil/` (+ garagem já existente) | `designs/Perfil-publico/` |
| API | `GET/PUT /perfil`, `GET /perfil/historico` | `GET /usuarios/:uid`, `GET /usuarios/:uid/historico` |
| Histórico | 3 abas (Aguardando / Participei / Criados) | 2 abas (Concluídos / Como Líder) |
| CTA Salvar / Sair / Excluir | Sim | Não |

Se `uid` da rota === `usuario.uid` do token → **redirect** para `/perfil` (evita dois modos da mesma pessoa).

### 2.4 Desvios conscientes do mock

O HTML é estático (piloto fictício, telemetria falsa, histórico inventado).

| Mock | Nesta spec | Por quê |
|------|------------|---------|
| Header com sino + avatar do visitante | Voltar + título; avatar do header linka ao **próprio** `/perfil` (padrão do feed). Sem sino | Consistência com SPECs 001–024 |
| `history.back()` só | Voltar: `router.back()`; se não houver histórico → `/aprovacoes` ou `/` | App Router |
| Telemetria 18 / 2.450 km | **Omitir** a barra de 2–3 colunas | Sem km; não mentir com número inventado |
| Badge verified | **Omitir** | Sem verificação |
| “14 Rolês” no título do histórico | `contagens.concluidos + contagens.comoLider` ou só o total de concluídos aceitos — ver §7 | Dados reais |
| Tabs Concluídos / Como Líder | Mapear para `participei` (só concluídos/confirmados públicos) e `criados` | Reuso da SPEC 008 sem `aguardando` |
| Card com km decimal `45.2` | Inteiro Haversine + ` km` (igual SPEC 008) | Contrato já existente |
| Ano / “Edição Black Raven” separados | `users.moto` continua **um** texto livre; tipo vai no badge | Schema atual |
| Share sempre nativo | `navigator.share` se existir; senão copiar URL + toast curto | Desktop / browsers sem Share |
| Menu inferior no HTML isolado | Dock da SPEC 001 | Não duplicar |

Não inventar layout paralelo: tokens de `designs/Perfil-publico/DESIGN.md` / `globals.css`.

---

## 3. Referência de Design (perfil público)

Replicar `designs/Perfil-publico/` (`code.html` + `screen.png`). Não copiar Tailwind CDN do Stitch — **CSS Modules + tokens**.

### 3.1 O que entra nesta spec (do mock)

- Faixa superior: **Voltar** + kicker **Visão Comunitária** + título **Perfil do Piloto** + **Compartilhar**.
- Cápsula de identidade: avatar circular com glow, nome uppercase, `@apelido`.
- Seção **Garagem Principal**: modelo (`moto`), badge **tipo** (`TRAIL` / `SPEED` / `CUSTOM`), chip “Ativa no Cockpit” (copy visual; não implica estado online).
- Seção **Ritmo de Pilotagem**: label “Classificação de Guia” + badge do valor (`Tranquila` / `Moderada` / `Agressiva`) com tokens de ritmo já usados no app.
- Seção **Histórico de Rodagem**: tabs **Concluídos (N)** / **Como Líder (N)** + lista de cards (título, data, km, papel Participante / Líder Oficial, status Concluído quando aplicável).

### 3.2 Comportamento visual

- Coluna única, gutter 16px, **max-width 560px** (shell `(app)`).
- Cards `surface-container-low`, `rounded-xl`, padding `card-padding-md`.
- Tipografia: Barlow Condensed nos títulos/badges; Plus Jakarta Sans no body.
- Badge de tipo: `surface-container-highest`, `badge-label` uppercase.
- Badge de ritmo: tint conforme SPEC de ritmo (moderada → `secondary-container`, etc.).
- Tabs: ativo `primary-container` / `on-primary-container`; inativo transparente + `on-surface-variant`.
- Padding inferior acima do dock (~96px).
- Toque ≥ 48px (voltar, share, tabs).

### 3.3 Tipo de moto (domínio + UI de cadastro)

Valores persistidos em **minúsculas**; label na UI em Title Case / uppercase no badge público.

| Valor | Label UI (seletor) | Badge público |
|-------|--------------------|---------------|
| `trail` | Trail | `TRAIL` |
| `speed` | Speed | `SPEED` |
| `custom` | Custom | `CUSTOM` |

No **primeiro acesso** e na **edição**, o seletor fica na seção Garagem (junto do campo moto), como grid de **3 cards** (mesmo padrão visual do seletor de pilotagem: `role="radiogroup"`, card ativo com `primary-container` + glow).

Ícones sugeridos (Material Symbols):

| Valor | Ícone |
|-------|-------|
| `trail` | `terrain` |
| `speed` | `speed` |
| `custom` | `build` |

Sem seleção inicial no primeiro acesso (igual ritmo). CTA de concluir / salvar permanece inválido até escolher.

---

## 4. Fluxo do Usuário

### 4.1 Ver perfil de outro piloto

```
Piloto autenticado (GuardaApp)
  │
  ├── Aprovações → toca identidade do solicitante
  │     └─→ /perfil/{usuarioId}
  │
  ▼
Tela pública carrega em paralelo:
  GET /usuarios/:uid
  GET /usuarios/:uid/historico
  │
  ├── 200 → render cápsula + garagem + ritmo + histórico
  ├── 404 → estado “Piloto não encontrado” + Voltar
  └── 401 → GuardaApp / login

Se uid === eu → redirect /perfil
```

### 4.2 Cadastrar / editar tipo de moto

```
Primeiro acesso (/primeiro-acesso)
  │
  └── Garagem: moto + tipoMoto (obrigatório) + garupa + …
        POST /perfil { …, tipoMoto }

Edição (/perfil)
  │
  └── Garagem: moto + SeletorTipoMoto + garupa
        PUT /perfil { …, tipoMoto }

Legado (doc sem tipoMoto):
  - GET /perfil devolve tipoMoto: null (ou omite)
  - Formulário abre sem seleção; Salvar exige escolha (400 se a API receber vazio)
  - Perfil público: omite o badge de tipo até existir valor
```

Não forçar redirect global de todos os legados para o primeiro acesso (o documento já existe). A cobrança é no **próximo save** e em **novos** onboarding.

### 4.3 Compartilhar

1. Toque em Compartilhar.
2. Se `navigator.share` → `{ title, text, url }` com URL absoluta `/perfil/{uid}`.
3. Senão → `clipboard.writeText(url)` + toast “Link copiado”.
4. Sem backend de deep link / preview OG nesta spec (PWA já instalável).

---

## 5. Arquitetura Next.js

Seguir a skill: `page.tsx` orquestra; componentes ~80 linhas; lógica em hooks; HTTP em services; `"use client"` só com estado / eventos / `useAuth`.

### 5.1 Rotas

```
src/app/(app)/perfil/
├── page.tsx                    # próprio — já existe (edição)
├── [uid]/
│   ├── page.tsx                # Server — orquestra TelaPerfilPublico
│   ├── components/
│   │   ├── TelaPerfilPublico.tsx
│   │   ├── CabecalhoVisaoComunitaria.tsx   # voltar + títulos + share
│   │   ├── CapsulaIdentidadePublica.tsx
│   │   ├── GaragemPublica.tsx              # moto + badge tipo
│   │   ├── RitmoPublico.tsx
│   │   ├── HistoricoPublico.tsx            # tabs + lista
│   │   ├── CardHistoricoPublico.tsx
│   │   ├── EstadoCarregandoPublico.tsx
│   │   └── EstadoErroPublico.tsx
│   ├── hooks/
│   │   ├── usePerfilPublico.ts
│   │   └── useHistoricoPublico.ts
│   ├── services/
│   │   └── perfil-publico.service.ts
│   ├── constants.ts
│   └── perfil-publico.module.css
```

Reusar o máximo possível de tipos/formatadores do histórico próprio (`formatar-data-historico`, labels de ritmo). **Não** reusar `FormularioPerfil` / `BotaoSair` / `ModalExcluirConta` na visão pública.

### 5.2 Edição + primeiro acesso (acréscimos)

```
src/app/(app)/perfil/components/SeletorTipoMoto.tsx      # NOVO
src/app/(auth)/primeiro-acesso/components/SeletorTipoMoto.tsx
  # Preferir um componente compartilhado em
  # src/components/perfil/SeletorTipoMoto.tsx
  # se evitar duplicação sem over-engineering
```

- Estender `SecaoGaragem` (perfil e primeiro acesso) para receber `tipoMoto` + callbacks + erro.
- Estender hooks `useFormularioPerfil` / formulário do primeiro acesso + `constants` com as 3 opções.
- Tipos em `src/types/user.ts`.

### 5.3 Entrada na fila de aprovações

Em `IdentidadePiloto` (e equivalentes em confirmados): envolver avatar/nome em `Link` para `/perfil/${usuario.uid}` (ou `usuarioId` do DTO — usar o campo já presente em `UsuarioResumoSolicitacao`).

- `aria-label={`Ver perfil de ${nome}`}`.
- Não navegar ao tocar em Aceitar/Recusar.
- Outros pontos (avatares em Meus Rolês, detalhe do rolê) **podem** linkar na mesma spec se o `uid` já estiver no DTO; se faltar uid no card, **não** inventar fetch — fica melhoria opcional listada em fora de escopo mínimo.

### 5.4 Responsabilidades

| Peça | Tipo | Faz |
|------|------|-----|
| `perfil/[uid]/page.tsx` | Server | Valida param; monta `TelaPerfilPublico` |
| `TelaPerfilPublico` | Client | Redirect se sou eu; orquestra fetch + seções |
| `usePerfilPublico` | Hook | `GET /usuarios/:uid`, loading/erro |
| `useHistoricoPublico` | Hook | `GET /usuarios/:uid/historico`, aba ativa |
| `perfil-publico.service` | Service | Chamadas `api` Bearer |
| `SeletorTipoMoto` | UI | Radiogroup Trail / Speed / Custom |
| `IdentidadePiloto` | UI | Link para perfil público |

**Não** ler Firestore no client para perfil alheio. **Não** usar `GET /perfil` com uid de outro.

---

## 6. Contrato de dados

### 6.1 Campo novo em `users`

```ts
export type TipoMoto = "trail" | "speed" | "custom";

// acréscimo em Usuario (front e functions)
tipoMoto: TipoMoto; // novos docs sempre; legado pode chegar null no mapper até o save
```

Documento Firestore:

```
tipoMoto: "trail" | "speed" | "custom"
```

Mapper: se ausente/ inválido → `null` no tipo de leitura do próprio perfil (`Usuario` com `tipoMoto: TipoMoto | null` **somente** no GET próprio para migração). No DTO público, campo opcional omitido ou `null`.

`UsuarioPrimeiroAcesso` e `UsuarioEdicao` passam a **exigir** `tipoMoto` válido.

### 6.2 DTO perfil público

```ts
export type PerfilPublico = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
  moto: string;
  tipoMoto: TipoMoto | null;
  pilotagem: Pilotagem;
  cidade: string;           // pode ser ""
  garupaFrequente: boolean; // exibir só se útil na garagem; mock não destaca — opcional na UI
};
```

**Nunca** incluir: `admin`, tokens, e-mail Auth, dispositivos.

### 6.3 Histórico público

```ts
export type HistoricoPublico = {
  concluidos: ItemHistoricoPista[]; // aceitos; espelha “participei” sem pendentes
  comoLider: ItemHistoricoPista[];  // espelha “criados”
  contagens: {
    concluidos: number;
    comoLider: number;
  };
};
```

Regras (espelhar SPEC 008 onde couber):

- **Concluídos:** vínculos `usersrole` com `aceito === true` do uid visitado (rolês futuros confirmados **entram** com status Confirmado; passados com Concluído) — igual critério de Participei, **sem** Aguardando.
- **Como Líder:** `roles` com `criadorId === uid` (não cancelados, se o app já filtrar cancelados no histórico próprio — manter a mesma regra).
- Distância: Haversine inteiro; motos confirmadas: mesma contagem da SPEC 008.
- **Não** devolver lista `aguardando`.

Implementação sugerida: extrair `montarHistorico` / helper em `functions/src/lib/historico.ts` para aceitar `uid` alvo e um flag `publico: true` que zera/omitte aguardando — evitar copiar a query inteira.

---

## 7. Backend

### 7.1 Rotas novas

```
GET /usuarios/:uid
GET /usuarios/:uid/historico
```

Router dedicado `usuariosRouter` (ou `perfilPublicoRouter`) montado em `app.use("/usuarios", …)`.

Ambas:

1. `autenticar` + `rateLimitAutenticado`.
2. `uid` do path: string não vazia; 400 se inválido.
3. 404 se `users/{uid}` não existe.
4. Persistência **só** via `usuarioRepository` / repositórios de histórico (sem `firestore.collection` na rota).

Respostas:

```
200 GET /usuarios/:uid → PerfilPublico
200 GET /usuarios/:uid/historico → HistoricoPublico
401 → token
404 → { erro: "Perfil não encontrado" }
500 → responderErro
```

Qualquer autenticado pode ler qualquer perfil existente (produto: comunidade aberta entre pilotos logados). Sem bloquear por “não somos amigos”.

### 7.2 Estender `POST /perfil` e `PUT /perfil`

Validação adicional:

| Campo | Regra |
|-------|--------|
| `tipoMoto` | exatamente `trail` \| `speed` \| `custom` |

Mensagens:

- Ausente / inválido → **400** `{ erro: "tipoMoto é obrigatório" }` ou `"tipoMoto inválido"`.
- Incluir `tipoMoto` no objeto passado a `usuarioRepository.criar` / `atualizar`.
- Atualizar `ERRO_CAMPOS_OBRIGATORIOS` do PUT para mencionar `tipoMoto`.

`admin` continua **nunca** vindo do body.

### 7.3 Mapper / tipos functions

- `functions/src/types/usuario.ts` — `TipoMoto`, campos em `Usuario`, `UsuarioCreate`, `UsuarioPrimeiroAcesso`, `UsuarioEdicao`.
- `firestore-usuario.repository.ts` — ler/gravar `tipoMoto`; legado sem campo → `null` na leitura tipada (ajustar interface se necessário com `TipoMoto | null` só no retorno de busca, ou normalizar e forçar re-save).
- Factory / interface: sem mudança de métodos; só shape do documento.

### 7.4 O que não muda

- `GET /perfil` e `GET /perfil/historico` continuam **só o próprio** uid do token.
- `DELETE /perfil`.
- Security Rules deny-all no client (inalteradas).
- Não criar `onCall`.

---

## 8. Wireframes

### 8.1 Perfil público

```
┌─────────────────────────────────┐
│ [←]  VISÃO COMUNITÁRIA    [share]│
│      PERFIL DO PILOTO           │
├─────────────────────────────────┤
│  (foto)  NOME                   │
│          @apelido               │
├─────────────────────────────────┤
│  GARAGEM PRINCIPAL    Ativa…    │
│  Yamaha YZF-R1 …        [SPEED] │
├─────────────────────────────────┤
│  RITMO DE PILOTAGEM             │
│  Classificação:     [MODERADA]  │
├─────────────────────────────────┤
│  HISTÓRICO DE RODAGEM    N rolês│
│  [Concluídos (N)] [Como Líder]  │
│  ┌ card rolê … ───────────────┐ │
│  └────────────────────────────┘ │
└─────────────────────────────────┘
│  dock (SPEC 001)                │
└─────────────────────────────────┘
```

### 8.2 Seletor no cadastro / edição (acréscimo na Garagem)

```
│  TIPO DE MOTO        obrigatório│
│  [ Trail ] [ Speed ] [ Custom ] │
│  (erro inline se vazio no submit)│
```

---

## 9. Fora do Escopo

- Km totais / telemetria agregada.
- Verificação de piloto / badge verified.
- Avaliações e estrelas.
- Perfil anônimo / SEO / Open Graph.
- URL amigável por apelido.
- Chat / seguir / bloquear piloto.
- Forçar todos os legados a um wizard antes de usar o app.
- Alterar dock ou GuardaApp além do necessário para a nova rota.
- Reabrir SPEC 008 (abas do histórico **próprio**).

---

## 10. Critérios de Aceite

### Front — perfil público

- [ ] `/perfil/[uid]` segue o mock `designs/Perfil-publico/` (cápsula, garagem+badge, ritmo, histórico 2 abas, voltar, share).
- [ ] Sem telemetria falsa, sem verified, sem editar/sair/excluir.
- [ ] `uid === eu` → redirect `/perfil`.
- [ ] 404 amigável se piloto inexistente.
- [ ] Histórico público sem aba Aguardando; cards alinhados ao contrato.
- [ ] Aprovações: toque na identidade abre o perfil público.
- [ ] `page.tsx` Server; Client só onde há interatividade; componentes focados; service isolado.
- [ ] CSS Modules + tokens; sem hex solto no TSX.

### Front — tipo de moto

- [ ] Primeiro acesso exige `tipoMoto` (validação + POST).
- [ ] Edição em `/perfil` mostra seletor e envia no PUT.
- [ ] Legado sem tipo: não salva sem escolher; badge omitido no público.
- [ ] Acessível: `radiogroup` / `aria-checked`, toque ≥ 48px, erros com `aria-invalid`.

### Back

- [ ] `GET /usuarios/:uid` autenticado → `PerfilPublico` sem `admin`.
- [ ] `GET /usuarios/:uid/historico` → só concluidos + comoLider.
- [ ] 404 se uid inexistente; 401 sem token.
- [ ] `POST` / `PUT /perfil` rejeitam sem `tipoMoto` válido.
- [ ] Persistência só via repositórios.

---

## 11. Arquivos impactados

| Arquivo | Ação |
|---------|------|
| `docs/specs/025-perfil-publico.md` | Este documento |
| `src/app/(app)/perfil/[uid]/**` | **NOVO** — feature perfil público |
| `src/types/user.ts` | **Alterar** — `TipoMoto`, campos nos payloads |
| `src/types/perfil-publico.ts` | **NOVO** — DTOs públicos |
| `src/components/perfil/SeletorTipoMoto.tsx` | **NOVO** (ou duplicata local mínima) |
| `src/app/(app)/perfil/components/SecaoGaragem.tsx` | **Alterar** — seletor |
| `src/app/(app)/perfil/hooks/useFormularioPerfil.ts` | **Alterar** |
| `src/app/(auth)/primeiro-acesso/**` | **Alterar** — form, validação, POST |
| `src/app/(app)/aprovacoes/components/IdentidadePiloto.tsx` | **Alterar** — `Link` |
| `functions/src/types/usuario.ts` | **Alterar** |
| `functions/src/routes/perfil.ts` | **Alterar** — validação `tipoMoto` |
| `functions/src/routes/usuarios.ts` | **NOVO** |
| `functions/src/index.ts` | **Alterar** — montar router |
| `functions/src/repositories/firestore/firestore-usuario.repository.ts` | **Alterar** — mapper |
| `functions/src/lib/historico.ts` | **Alterar** — variante pública |
| `.cursor/rules/tech-stack.mdc` / `project-context.mdc` | **Alterar** na implementação — documentar `tipoMoto` e rota pública |

---

## 12. Checklist da skill Next.js

- [ ] `perfil/[uid]/page.tsx` sem `"use client"` (só orquestra).
- [ ] `"use client"` só em tela/hooks interativos.
- [ ] Fetch em service; estado em hooks; UI em componentes pequenos.
- [ ] Um componente = uma coisa (cápsula, garagem, ritmo, card, seletor).
- [ ] Sem abstração “pra futuro” (chat, km, verified).
- [ ] Sem `console.log` de debug.
- [ ] Sem Firestore no client para ler outro piloto.

---

## 13. Relação com o código atual

| Hoje | Nesta spec |
|------|------------|
| Só `/perfil` (próprio) | + `/perfil/[uid]` leitura |
| `GET /perfil` só do token | + `GET /usuarios/:uid` |
| Histórico só `/perfil/historico` | + histórico público sem pendências |
| `moto` texto livre sem categoria | + `tipoMoto` enum obrigatório |
| Aprovações mostram piloto sem link | Identidade navega ao perfil público |
| Mock `Perfil-publico` sem implementação | Tela alinhada ao design system |

---

## 14. Ordem sugerida de implementação

1. Tipos + mapper + validação `POST`/`PUT` (`tipoMoto`).
2. Seletor no primeiro acesso e na edição de perfil.
3. `GET /usuarios/:uid` + `GET /usuarios/:uid/historico`.
4. UI `/perfil/[uid]` + share/voltar.
5. Link na fila de aprovações.
6. Ajuste fino visual vs `screen.png` / tokens.

**Não implementar nesta tarefa de especificação** — este arquivo é só o contrato para o desenvolvimento full stack seguinte.
