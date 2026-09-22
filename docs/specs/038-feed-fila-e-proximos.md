# SPEC 038 — Feed: ocultar rolês da fila + filtro “Próximos”

> **Status:** Implementado  
> **Autor:** Assistente IA  
> **Data:** 2026-09-21  
> **Origem:** backlog — rolê já na fila reaparece no feed; “próximos rolês” não traz tudo dali pra frente  
> **Padrões:** Next.js 15 + Cloud Function `api`  
> **Backend:** `GET /roles`, `GET /feed/contagens`, `functions/src/lib/quando.ts`  
> **Depende de:** SPEC 003 (feed), SPEC 005 (`usersrole`), SPEC 024 (filtros)  
> **QA:** IDs **F1**, **F2** (independentes)

---

## 1. Objetivo

| ID | Entrega | Camada |
|----|---------|--------|
| **F1** | Rolês em que o piloto **já tem vínculo** (fila ou confirmado) **não** voltam no feed de descoberta | Back (+ front se precisar) |
| **F2** | Chip **Próximos rolês** = todos com `dataHoraSaida >= agora` (sem teto de 30 dias) | Back |

---

## 2. IDs de teste

| ID | Área | Severidade | Sintoma | Critério de aceite | Como testar |
|----|------|------------|---------|--------------------|-------------|
| **F1** | Feed | Alta | Depois de pedir vaga, o card continua no feed | Com `usersrole` pendente ou aceito, rolê some de `GET /roles` do mesmo uid | Pedir vaga → voltar ao feed |
| **F2** | Filtro | Alta | Rolê daqui a 45 dias some em “próximos” | `quando=proximos_roles` sem `dataFim`; inclui +45d e +120d | Criar rolê +45d; filtrar |

---

## 3. F1 — Ocultar rolês com vínculo

### 3.1 Regra

No `GET /roles` **autenticado** (feed), excluir rolês cujo `roleId` tenha documento `usersrole` com:

- `usuarioId === uid` do token, **e**
- `recusadoEm == null` (ainda “na fila” ou confirmado).

Ou seja: **pendente** (`aceito: false`) e **confirmado** (`aceito: true`) saem do feed de descoberta.

| Situação | Aparece no feed? |
|----------|------------------|
| Sem `usersrole` | Sim |
| Pendente (aguardando) | **Não** |
| Confirmado | **Não** |
| Recusado (`recusadoEm` setado) | **Não** (já 409 em novo POST — manter fora) |
| Líder (`criadorId === uid`) | **Não** (já deve estar fora / ou filtrar criador — alinhar ao comportamento atual da 003) |

Se a 003 já omite rolês criados pelo uid, manter. F1 foca em **participação**.

### 3.2 Contagens

`GET /feed/contagens` (aba Rolês) deve usar a **mesma** exclusão, senão o badge (N) mente.

### 3.3 Onde o piloto vê o rolê depois

- Meus Rolês (aguardando / confirmados).
- Deep link `/roles/:id/participar`.
- Convite público `/r/:id` (015) — continua existindo; após login o CTA reflete estado.

### 3.4 Implementação sugerida

1. Buscar ids de `usersrole` do uid (pendentes + aceitos + recusados, ou só os que devem sumir).
2. Filtrar a lista de rolês candidatos **depois** dos filtros geo/quando/ritmo/q, **ou** `where('id', 'not-in', …)` com cuidado do limite Firestore (máx 10 no `not-in`) — preferir filtro em memória se o volume do MVP for baixo (como o restante do feed).

Documentar a escolha no PR.

---

## 4. F2 — Próximos sem teto

### 4.1 Bug atual

Em `functions/src/lib/quando.ts`:

```ts
if (quando === "proximos_roles") {
  const limiteDia = somarDiasYmd(hoje, 30);
  return {
    dataInicioIso: maxIso(agoraIso, inicioDoDiaSp(hoje)),
    dataFimIso: fimDoDiaSp(limiteDia), // ← remove rolês além de 30 dias
  };
}
```

### 4.2 Comportamento desejado

```ts
if (quando === "proximos_roles") {
  return {
    dataInicioIso: maxIso(agoraIso, inicioDoDiaSp(hoje)),
    // sem dataFimIso → “dali pra frente”
  };
}
```

Alinhar label do chip na UI se ainda disser “próximos 30 dias”.

Mesma semântica para **eventos** se o feed mapear o mesmo chip sobre `dataHoraAbertura` (024) — aplicar o mesmo “sem teto”.

### 4.3 Ainda no passado / cancelados

Continua: só futuros (`>= agora`). Rolês passados não voltam.

---

## 5. Checklist

### F1

- [ ] Pedir vaga → sumir do feed; aparece em Meus Rolês.
- [ ] Aceito → continua fora do feed.
- [ ] Contador da aba Rolês coerente.
- [ ] Outro piloto sem vínculo ainda vê o card.

### F2

- [ ] Rolê +45 dias aparece com `quando=proximos_roles`.
- [ ] Sem `quando` / outros chips (`hoje`, `amanha`, etc.) **não** mudam.
- [ ] Eventos (se compartilham o helper) alinhados.

---

## 6. Fora de escopo

- Paginação infinita.
- Ocultar eventos inscritos / locais favoritos (follow-up se pedido).
- Alterar ritmo / raio.
