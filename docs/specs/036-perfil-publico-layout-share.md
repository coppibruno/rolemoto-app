# SPEC 036 — Perfil público: layout + compartilhar

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-21  
> **Origem:** backlog — layout estranho/quebrado; falta compartilhar no perfil  
> **Referência visual:** `designs/Perfil-publico/` (`DESIGN.md`, `code.html`, `screen.png`)  
> **Padrões:** Next.js 15 App Router  
> **Backend:** reutilizar `GET /usuarios/:uid`, `GET /usuarios/:uid/historico` (SPEC 025)  
> **Depende de:** SPEC 025 (perfil público — **fecha gaps**), SPEC 015 / 030 / 031 (padrão Web Share)  
> **QA:** IDs **P1**, **P2**

---

## 1. Objetivo

Deixar `/perfil/[uid]` **fiel ao mock** e utilizável no mobile, e expor **Compartilhar** no header (SPEC 025 já listou share; o relato indica que layout e/ou CTA não estão ok).

| ID | Entrega |
|----|---------|
| **P1** | Corrigir layout quebrado (espaçamento, overflow, hierarquia) |
| **P2** | CTA Compartilhar (Web Share → clipboard → fallback) |

---

## 2. IDs de teste

| ID | Área | Severidade | Sintoma | Critério de aceite | Como testar |
|----|------|------------|---------|--------------------|-------------|
| **P1** | UI | Alta | Layout estranho/quebrado | 390×844 alinhado ao mock: identidade, garagem, ritmo, histórico sem overflow/corte | Abrir perfil de outro piloto |
| **P2** | Share | Média | Sem compartilhar | Botão gera URL absoluta `/perfil/{uid}`; share nativo ou copia + toast | Mobile + desktop |

---

## 3. Baseline SPEC 025 (não redesenhar produto)

Já definido e **mantido**:

- Visão comunitária somente leitura.
- Redirect se `uid === eu` → `/perfil`.
- Sem telemetria inventada, sem verified, sem editar/excluir.
- Histórico público sem aba Aguardando.

Esta spec **não** reabre tipo de moto nem endpoints — só UI + share.

---

## 4. P1 — Layout

### 4.1 Checklist visual (do mock)

- Header sticky: Voltar · kicker “Visão Comunitária” · título · **Compartilhar** · (avatar do visitante → próprio `/perfil`).
- Cápsula identidade: avatar, nome uppercase, `@apelido`.
- Garagem: moto + badge tipo + chip visual.
- Ritmo: badge semântico.
- Histórico: tabs Concluídos / Como Líder + cards.

### 4.2 Defeitos típicos a caçar

| Problema | Correção |
|----------|----------|
| Conteúdo sob o dock | `padding-bottom` do shell |
| Avatar/texto estourando | `min-width: 0`, truncate, object-fit |
| Tabs / cards com gap inconsistente | Tokens `card-padding-md`, gutter 16px |
| Safe-area iOS | `env(safe-area-inset-*)` no header |
| CSS Module vs global conflitante | Isolar classes; evitar `100vh` quebrado |

Comparar com `designs/Perfil-publico/screen.png` em viewport mobile.

---

## 5. P2 — Compartilhar

Reutilizar o padrão já usado em detalhe de evento/local / telemetria:

1. `navigator.share({ title, text, url })` se disponível.
2. Senão `clipboard.writeText(url)` + toast “Link copiado”.
3. Fallback final: abrir WhatsApp com texto + URL (se o app já usa esse padrão na 031).

URL: origem atual + `/perfil/{uid}` (absoluta).

Copy sugerida:

- title: `Perfil · @{apelido} · Rolemoto`
- text: `Olha o cockpit do @{apelido} no Rolemoto`

Área de toque ≥ 48px; `aria-label="Compartilhar perfil"`.

**Não** criar landing pública anônima — GuardaApp continua exigindo login (025).

---

## 6. Checklist

- [ ] P1: side-by-side mock vs app em 390px sem regressão óbvia.
- [ ] Dono abrindo o próprio uid → redirect `/perfil`.
- [ ] P2: share / copiar funciona; URL abre o perfil após login.
- [ ] Sem novos campos na API.

---

## 7. Fora de escopo

- URL por `@apelido`.
- Perfil público sem autenticação / OG tags.
- Editar perfil alheio.
- Contadores de km / telemetria no hero (ainda fora da 025).
