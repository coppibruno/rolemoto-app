# SPEC 035 — Detalhe do líder + acesso às aprovações (Meus Rolês)

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-21  
> **Origem:** backlog — tela ao “acessar rolê” deslocada; deveria mostrar info do rolê + aprovações; avaliar remover fila dedicada  
> **Referência visual:** reusar tokens de `designs/` de Meus Rolês / aprovações / detalhe; sem mock Stitch novo obrigatório  
> **Padrões:** Next.js 15 App Router  
> **Backend:** reutilizar `GET /roles/:id`, `GET /aprovacoes` (ou por role), PATCH decisão (SPEC 007)  
> **Depende de:** SPEC 007 (fila), SPEC 017 / 021 / 028 (Meus Rolês + editar/cancelar), SPEC 005 (participar)  
> **QA:** IDs **L1**, **L2** (L2 é decisão de produto — fechar antes do PR)

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
| Detalhe rico do líder | Pode estar incompleto ou reutilizar tela errada → “deslocado” |

Hipótese do bug L1: líder cai em rota pensada para piloto, ou CSS/padding do dock corta o bloco de aprovações.

---

## 4. Decisão de produto (L2) — escolher **uma**

### Opção A — Manter `/aprovacoes` + detalhe por rolê (recomendado se volume alto)

- `/aprovacoes` continua atalho para “tudo pendente”.
- Em Meus Rolês, card de rolê que **lidero** → `/roles/[id]/gerenciar` (ou equivalente) com ficha + aprovações **daquele** rolê.
- Dock / header: badge de pendentes pode linkar à inbox global.

### Opção B — Remover fila global; só Meus Rolês

- Deprecar `/aprovacoes` (redirect → `/meus-roles` com filtro “como líder” / pill pendentes).
- Remover entrada dedicada no shell se existir.
- Aprovar só no detalhe do rolê.

**Esta spec assume Opção A como default** se o produto não escolher B no kickoff. Se escolher B, o PR L2 inclui redirect + atualização da SPEC 007.

---

## 5. L1 — Conteúdo da tela de gerenciamento

Rota sugerida: **`/roles/[id]/gerenciar`** (só criador/admin; senão 403 → redirect).

Blocos (coluna única, max-width 560px):

1. Header: Voltar · título · (opcional) Compartilhar / Editar / Cancelar.
2. Resumo do rolê: capa (ou placeholder 033), data/hora, ritmo, partida → destino, contagens (pendentes / confirmados).
3. Seção **Aguardando aprovação**: cards no padrão SPEC 007 (foto, apelido, moto, ritmo, Aceitar/Recusar).
4. Seção **Confirmados** (colapsável): lista só leitura + link perfil público.
5. Padding-bottom ≥ dock (SPEC 001).

Reusar hooks/services de `aprovacoes/` filtrando por `roleId` — não duplicar lógica de PATCH.

### Layout — anti-deslocamento

- Evitar `transform` / `height: 100vh` conflitante com safe-area.
- Toast acima do dock; CTAs com `min-height` 48px.
- Testar 390×844 e 430×932.

---

## 6. Navegação (Opção A)

```
Meus Rolês → card "Você é o líder" → /roles/{id}/gerenciar
Aprovações (inbox) → toque no pedido → mesmo gerenciar OU decide inline (manter 007)
Feed → não é entrada primária do líder para aprovar
```

Piloto comum continua em `/roles/[id]/participar`.

---

## 7. Checklist

### L1

- [ ] Líder abre o rolê e vê ficha + pedidos sem corte/overlap.
- [ ] Aceitar/Recusar funciona igual à SPEC 007 (toast, remove card).
- [ ] Não-líder não acessa a rota de gerenciar.

### L2

- [ ] Decisão A ou B documentada no PR.
- [ ] Links do app apontam para a entrada correta.
- [ ] Se B: `/aprovacoes` redireciona; SPEC 007 marcada como supersedida na navegação.

---

## 8. Fora de escopo

- Redesign completo do mock Stitch da fila.
- Chat do comboio.
- Mover PATCH de decisão para outro path (manter contrato 007).
