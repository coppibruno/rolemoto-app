# SPEC 035 — Detalhe do líder + acesso às aprovações (Meus Rolês)

> **Status:** Implementada  
> **Autor:** Assistente IA  
> **Data:** 2026-09-21  
> **Origem:** backlog — tela ao “acessar rolê” deslocada; deveria mostrar info do rolê + aprovações; avaliar remover fila dedicada  
> **Referência visual:** reusar tokens de `designs/` de Meus Rolês / aprovações / detalhe; sem mock Stitch novo obrigatório  
> **Padrões:** Next.js 15 App Router  
> **Backend:** reutilizar `GET /roles/:id`, `GET /aprovacoes` (ou por role), PATCH decisão (SPEC 007)  
> **Depende de:** SPEC 007 (fila), SPEC 017 / 021 / 028 (Meus Rolês + editar/cancelar), SPEC 005 (participar)  
> **QA:** IDs **L1**, **L2**  
> **Decisão L2:** **Opção A** — manter `/aprovacoes` (inbox global) + detalhe por rolê em `/roles/[id]/gerenciar`

---

## 1. Objetivo

Corrigir a experiência do **líder** ao abrir um rolê que organiza:

1. **L1** — Layout íntegro: informações do rolê + bloco de solicitações/confirmados (aprovações), sem conteúdo “deslocado” / cortado.
2. **L2** — Decidir e implementar o **ponto de entrada**: manter `/aprovacoes` global **ou** concentrar o fluxo em **Meus Rolês** → detalhe do rolê.

| ID | Entrega |
|----|---------|
| **L1** | Tela de detalhe do líder utilizável (info + aprovações) |
| **L2** | Navegação: fila global vs só via Meus Rolês |

---

## 2. IDs de teste

| ID | Área | Severidade | Sintoma | Critério de aceite | Como testar |
|----|------|------------|---------|--------------------|-------------|
| **L1** | UX líder | Alta | Tela deslocada / info incompleta | Viewport 390×844: header, capa/ficha, lista de pedidos com CTAs Aceitar/Recusar sem overlap do dock | Abrir rolê próprio com ≥1 pendente |
| **L2** | Navegação | Média | Fila separada confunde | Conforme decisão §4: rotas e CTAs coerentes; zero link morto | Percorrer Meus Rolês → detalhe → decidir pedido |

---

## 3. Estado atual (baseline)

| Rota | Papel |
|------|--------|
| `/aprovacoes` | Inbox global do líder (SPEC 007) — pedidos de **todos** os rolês |
| `/meus-roles` | Garagem: próximos, liderança, editar/cancelar |
| `/roles/[id]/participar` | Sheet do piloto (pedido / confirmado) — **não** é cockpit do líder |
| `/roles/[id]/gerenciar` | Cockpit do líder: ficha do rolê + aprovações daquele rolê |

Hipótese do bug L1 (corrigida): líder caía em `/participar` (rota do piloto). Agora Meus Rolês / feed / convite apontam a `/gerenciar`; `/participar` redireciona o criador.

---

## 4. Decisão de produto (L2) — **Opção A** (implementada)

### Opção A — Manter `/aprovacoes` + detalhe por rolê ✅

- `/aprovacoes` continua atalho para “tudo pendente” (dock / banner).
- Em Meus Rolês, card de rolê que **lidero** → `/roles/[id]/gerenciar` com ficha + aprovações **daquele** rolê.
- Dock / header: badge de pendentes continua linkando à inbox global.

### Opção B — Remover fila global; só Meus Rolês (não escolhida)

- Deprecar `/aprovacoes` (redirect → `/meus-roles` com filtro “como líder” / pill pendentes).
- Remover entrada dedicada no shell se existir.
- Aprovar só no detalhe do rolê.

---

## 5. L1 — Conteúdo da tela de gerenciamento

Rota: **`/roles/[id]/gerenciar`** (só criador/admin; senão redirect para `/participar`).

Blocos (coluna única, max-width 560px):

1. Header: Voltar · título · Compartilhar.
2. Resumo do rolê: capa (ou placeholder 033), data/hora, ritmo, partida → destino, contagens (pendentes / confirmados); Editar / Cancelar se saída futura.
3. Seção **Aguardando aprovação**: cards no padrão SPEC 007 (foto, apelido, moto, ritmo, Aceitar/Recusar).
4. Seção **Confirmados** (colapsável): lista só leitura + link perfil público.
5. Padding-bottom via shell autenticado (SPEC 001).

Reusa `aprovacoesService` + `useDecisaoPiloto` filtrando por `roleId`.

### Layout — anti-deslocamento

- Sem `transform` / `height: 100vh` conflitante com safe-area.
- Toast acima do dock (mesmo componente da SPEC 007); CTAs com `min-height` touch.
- Testar 390×844 e 430×932.

---

## 6. Navegação (Opção A)

```
Meus Rolês → card "Você é o líder" → /roles/{id}/gerenciar
Aprovações (inbox) → decide inline (manter 007)
Feed / convite (criador) → /roles/{id}/gerenciar
/roles/{id}/participar (criador) → redirect /gerenciar
Piloto comum → /roles/{id}/participar
```

---

## 7. Checklist

### L1

- [x] Líder abre o rolê e vê ficha + pedidos sem corte/overlap.
- [x] Aceitar/Recusar funciona igual à SPEC 007 (toast, remove card).
- [x] Não-líder não acessa a rota de gerenciar.

### L2

- [x] Decisão A documentada (esta spec + PR).
- [x] Links do app apontam para a entrada correta.
- [ ] Se B: N/A — Opção A escolhida.

---

## 8. Fora de escopo

- Redesign completo do mock Stitch da fila.
- Chat do comboio.
- Mover PATCH de decisão para outro path (manter contrato 007).
