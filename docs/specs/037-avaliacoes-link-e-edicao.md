# SPEC 037 — Avaliações: link no feed + edição

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-21  
> **Origem:** backlog — estrelas no feed sem link; não dá para editar avaliação  
> **Padrões:** Next.js 15 App Router  
> **Backend:** estender SPEC 027 — `PATCH` (ou `PUT`) da avaliação própria; listagem já via `GET …/avaliacoes`  
> **Depende de:** SPEC 027 (feedback locais/eventos — **revoga** “sem PATCH/reavaliar”), SPEC 024 (cards), SPEC 031 (detalhe)  
> **QA:** IDs **A1**, **A2** (PRs separados recomendados)

---

## 1. Objetivo

| ID | Entrega | Camada |
|----|---------|--------|
| **A1** | Toque nas ★ / selo de média no card (feed Locais e Eventos) navega para a listagem de avaliações | Front |
| **A2** | Piloto pode **editar** a própria avaliação já publicada | Front + Back |

Hoje a SPEC 027 trata o relato como definitivo (sem PATCH). O produto pede correção de nota/texto após publicação.

---

## 2. IDs de teste

| ID | Área | Severidade | Sintoma | Critério de aceite | Como testar |
|----|------|------------|---------|--------------------|-------------|
| **A1** | Feed | Média | ★ só decorativas | Toque no selo ★ média (N) → `/locais/:id/avaliacoes` ou `/eventos/:id/avaliacoes` (ou âncora na tela `/avaliar` em modo lista) | Feed aba Locais com local avaliado |
| **A2** | Avaliação | Alta | Não edita | Após publicar, reabrir → formulário pré-preenchido → salvar atualiza doc e recalcula média | Avaliar, mudar nota, conferir card |

---

## 3. A1 — Navegação a partir das estrelas

### 3.1 Superfícies

- Card Local no feed (aba Locais).
- Card Evento no feed (aba Eventos), quando exibe média.
- Preferencialmente também no detalhe (031) se o selo ainda não for clicável.

### 3.2 Destino

**Preferência:** rota de **listagem** dedicada:

- `/locais/[id]/avaliacoes`
- `/eventos/[id]/avaliacoes`

Conteúdo: lista autenticada já prevista em `GET /locais/:id/avaliacoes` e `GET /eventos/:id/avaliacoes` (027), com CTA “Avaliar” / “Editar minha avaliação” conforme elegibilidade.

**Alternativa aceitável (menor escopo):** navegar para `/locais/[id]/avaliar` com query `?ver=lista` se a tela já misturar form + lista — desde que as ★ do feed não abram só o form vazio.

Área clicável: o selo ★ + contagem; **não** capturar o clique do card inteiro (thumb/título continuam indo ao detalhe).

`stopPropagation` no selo se o card for `<Link>` envolvente.

---

## 4. A2 — Editar avaliação

### 4.1 Revoga SPEC 027 §2.2

| Antes | Depois |
|-------|--------|
| Sem PATCH / DELETE / reavaliar | **PATCH** da própria avaliação |
| Um POST único | POST cria; PATCH atualiza |

DELETE continua **fora** (piloto não remove avaliação nesta spec).

### 4.2 Contrato API

```
PATCH /locais/:id/avaliacao
PATCH /eventos/:id/avaliacao
Authorization: Bearer
Body: { nota, comentario, fotosUrls, recomendaComboio }  // mesmos campos do POST
```

Regras:

1. Só o `usuarioId` do token.
2. Doc deve existir; senão **404** (não criar via PATCH — usar POST).
3. Evento: manter elegibilidade (inscrito + encerrado).
4. Local: qualquer autenticado que já avaliou.
5. Validação idêntica ao POST (nota 1–5, comentário ≤500, ≤4 fotos).
6. Agregação: **recalcular** `notaMedia`, `totalAvaliacoes` (total não muda), `somaNotas`, `recomendacoesComboio` com delta (novaNota − antigaNota; flags de recomendação).

Preferir transação no repositório Firestore.

Resposta: `200` + DTO da avaliação atualizada (`updatedAt` novo).

### 4.3 Front

- Se `GET …/avaliacao` 200 → modo **editar**: CTA “Salvar alterações”; título “Sua avaliação”.
- Se 404 → modo **criar** (POST) como hoje.
- Fotos: permitir trocar/remover dentro do limite 4; upload Storage igual ao POST.
- Após PATCH: toast + atualizar selo no feed (invalidate query / recarregar).

### 4.4 Feed / detalhe

Após edição, `notaMedia` exibida deve refletir o novo valor (refresh na próxima listagem ou optimistic opcional).

---

## 5. Checklist

### A1

- [ ] ★ no card Local (e Evento) navegam para listagem/avaliações.
- [ ] Clique no restante do card não quebra (detalhe / Maps / favorito).
- [ ] Local sem avaliações: selo ausente ou desabilitado (sem 404 confuso).

### A2

- [ ] PATCH autenticado atualiza doc.
- [ ] Agregação correta após mudar nota e flag recomenda.
- [ ] UI pré-preenche; segundo save não cria segundo doc.
- [ ] 404 no PATCH se nunca avaliou; POST continua para primeira vez.

---

## 6. Fora de escopo

- Apagar avaliação (DELETE).
- Editar avaliação alheia / moderação.
- Avaliar rolê (SPEC 010) — não misturar, salvo follow-up explícito.
- Ordenação avançada / filtros na listagem.
