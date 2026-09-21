# SPEC 033 — Foto de capa do rolê opcional

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-21  
> **Origem:** backlog pós-MVP — capa obrigatória atrito no criar rolê  
> **Padrões:** Next.js 15 App Router  
> **Backend:** Cloud Function `api` — `POST /roles`, `PUT /roles/:id`  
> **Depende de:** SPEC 004 (criar rolê — **revoga** obrigatoriedade da capa), SPEC 003 (feed / card), SPEC 009 (clonar)  
> **QA:** ID **C1** isolado

---

## 1. Objetivo

Tornar a **foto de capa** do rolê **opcional** na publicação e na edição.

A SPEC 004 exigiu capa porque o card do feed “precisa” de imagem; o mock original já marcava “opcional”. Na prática, o piloto abandona o fluxo por não ter foto na hora.

| ID | Entrega | Camada |
|----|---------|--------|
| **C1** | Capa opcional no form + API; card com placeholder quando vazia | Front + Back |

---

## 2. ID de teste

| ID | Área | Severidade | Sintoma | Critério de aceite | Como testar |
|----|------|------------|---------|--------------------|-------------|
| **C1** | Criar / editar rolê | Média | Publicar sem foto bloqueia | Publicar sem arquivo → 201; feed mostra placeholder; com foto continua upload normal | `/criar-role` sem anexar; publicar; ver card |

---

## 3. Contrato

### 3.1 Schema / DTO

`fotoCapaUrl: string` — passar a aceitar **`""`** (string vazia).

| Antes (004) | Depois |
|-------------|--------|
| Obrigatória, URL Storage | Opcional; `""` se não enviada |
| Validação front + back exige URL | Front: válido sem arquivo; Back: se presente, URL http(s); se ausente/`""`, ok |

Não usar `null` se o restante do app já trata `string` — manter `""` para docs antigos e novos.

### 3.2 Front

- Badge / hint **(opcional)** no card Foto de capa (como no mock Stitch).
- `useFormularioCriarRole`: validação **não** exige `photoFile` nem URL.
- Upload: só se houver arquivo; senão `fotoCapaUrl: ""` no body.
- Clone (009): se modelo tem URL, reusa; se piloto remove, pode gravar `""`.
- Editar rolê: permitir remover capa (CTA “Remover foto” → `""`).

### 3.3 Feed / cards / convite

Onde hoje assume imagem:

- Placeholder `surface-container-high` + ícone `two_wheeler` / `image` (já previsto em feedback/outros fluxos).
- Convite público (015): mesma regra — sem capa não quebra layout.

---

## 4. Backend

Em `POST /roles` e `PUT /roles/:id`:

- Se `fotoCapaUrl` omitido ou `""` → persistir `""`.
- Se string não vazia → validar URL absoluta http(s) (mesma regra atual).
- Não apagar objetos antigos do Storage nesta spec (GC futuro).

---

## 5. Checklist

- [ ] UI marca capa como opcional.
- [ ] Publicar sem foto → sucesso; documento com `fotoCapaUrl: ""`.
- [ ] Publicar com foto → upload + URL como hoje.
- [ ] Card do feed / Meus Rolês / convite não quebram sem imagem.
- [ ] Clone e edição respeitam opcionalidade.

---

## 6. Fora de escopo

- Capa obrigatória só para admin.
- Gerar capa automática (IA / Street View).
- Mudar Storage rules além do necessário para upload opcional (já autenticado).
