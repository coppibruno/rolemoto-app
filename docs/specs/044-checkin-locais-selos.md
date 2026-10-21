# SPEC 044 — Check-in em locais (GPS) + selos no perfil

> **Status:** Implementada  
> **Autor:** Assistente IA  
> **Data:** 2026-10-21  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade (skill `nextjs-patterns`)  
> **Backend:** Cloud Function `api` (Express) — `POST /locais/:id/checkin`; enriquecer `GET /locais/:id`, `GET /usuarios/:uid`, `GET /perfil`, `GET /meus-roles/locais`  
> **Coleção Firestore:** `userslocalcheckin` (**nova**); agregados no documento `users`  
> **Depende de:** SPEC 023 (locais), SPEC 025 (perfil público), SPEC 027 (avaliação), SPEC 028 (garagem / favoritos), SPEC 031 (detalhe do local)  
> **Fase:** 1 — verbo (Estou aqui) + carimbo com **nome do local** no perfil + pill Visitados.

---

## 1. Objetivo

O piloto marca **presença física** num local oficial do catálogo. O check-in **não é um post**: não entra no feed, não vira timeline, não mostra “quem está aqui agora”.

O que permanece no app:

1. CTA **Estou aqui** no detalhe do local (`/locais/:id`), só com GPS no raio.
2. Estado **Você já passou aqui** depois do primeiro check-in naquele ponto.
3. **Selos** no perfil (público e próprio) — um carimbo por local único, com o **nome do ponto** e o ícone da categoria. Sem data, sem timeline.
4. Pill **Visitados** na aba Locais da garagem (coleção privada do dono).

| Camada | Responsabilidade |
|--------|------------------|
| Front | CTA + GPS pontual, chips de selo, pill Visitados |
| Back | Validar raio/precisão/cooldown, persistir check-in, agregar selos no `users` |

`usuarioId` **nunca** vem do body. Timestamps só no servidor. Lat/lng do body são a posição **do piloto**, não a do local.

---

## 2. Recorte e princípios

### 2.1 O que entra (fase 1)

- `POST /locais/:id/checkin` `{ lat, lng, accuracy }`.
- Coleção `userslocalcheckin` (id auto).
- `GET /locais/:id` → `checkinProprio: boolean` (já passou neste ponto, alguma vez).
- Agregado no piloto: locais únicos + selos. `GET /usuarios/:uid` e `GET /perfil` devolvem `selos: { localId, nome, categoria }[]` (sem datas).
- CTA no detalhe; após sucesso, prompt leve e opcional para avaliar se ainda não há relato.
- Garagem: `GET /meus-roles/locais?recorte=visitados` + pill **Visitados**.

### 2.2 O que **não** entra

| Item | Motivo |
|------|--------|
| Timeline / feed de atividade | Muda o produto |
| Presença ao vivo | Privacidade + tela vazia |
| XP, níveis, prefeitura | SPEC 028 já cortou XP |
| Selo no **card do local** (“Parada da galera”) | Fase 3 — prova social do ponto |
| Auto-check-in pela telemetria | Fase 3 |
| Lista pública de locais visitados | Paradeiro |
| Item no dock / aba no feed | Poluição |
| GPS de fundo (Capgo) | Só `getCurrentPosition` pontual |

### 2.3 Não misturar

| Feature | Significado |
|---------|-------------|
| Favorito | Quero este ponto (intenção) |
| Avaliação | O que achei (opinião) — SPEC 027 |
| Check-in | Estive aqui (presença) |
| Telemetria | Gravei o passeio — SPEC 030 |

### 2.4 Relação com SPEC 028

A 028 recusou **2X VISITADO** por não haver tracking. Esta spec **cria** o tracking, mas o resíduo é selo + pill Visitados — não o contador no card.

A aba Locais **continua favoritos por padrão**. Visitados é recorte extra (`recorte=visitados`), não substitui favoritos.

---

## 3. Fluxo

```
Detalhe /locais/:id
  → toque Estou aqui
  → getCurrentPosition (alta precisão, sem cache)
  → POST { lat, lng, accuracy }
  → servidor: local existe? accuracy ≤ 80 m? haversine ≤ 400 m? cooldown 24 h?
  → grava userslocalcheckin
  → se local único para o uid: incrementa agregados e recalcula selos
  → UI: Você já passou aqui (+ “Quer avaliar?” se !avaliado)
```

Permissão negada: não fingir check-in; copy “Precisamos da localização na hora para marcar presença.”

---

## 4. Contrato HTTP

### 4.1 `POST /locais/:id/checkin`

Autenticado. Body:

```
{ lat: number, lng: number, accuracy: number }
```

`accuracy` em metros (Geolocation API).

| Status | Quando | `erro` |
|--------|--------|--------|
| 201 | Criado | — |
| 400 | Body/coords inválidos | `lat e lng são obrigatórios` |
| 400 | Precisão > 80 m | `GPS impreciso. Tente ao ar livre.` |
| 400 | Fora do raio | `Chegue mais perto para marcar presença` |
| 404 | Local inexistente | `Local não encontrado` |
| 409 | Já fez check-in neste local nas últimas 24 h | `Você já marcou presença aqui hoje` |
| 401 | Sem Bearer | `Não autenticado` |

Resposta 201:

```
{
  id: string,
  localId: string,
  createdAt: string,          // ISO
  checkinProprio: true,
  seloNovo: { id, label } | null,
  selos: { id, label }[]
}
```

Não devolve `lat`/`lng` do piloto.

### 4.2 `GET /locais/:id`

Além de `avaliado` e `favorito`:

```
checkinProprio: boolean
```

### 4.3 `GET /usuarios/:uid` e `GET /perfil`

Campo extra:

```
selos: { localId: string, nome: string, categoria: CategoriaLocal }[]
```

Vazio `[]` se o piloto ainda não tem selo. Sem datas. O chip do perfil usa `nome` do local.

### 4.4 `GET /meus-roles/locais`

Query opcional `recorte=favoritos|visitados`. Default `favoritos` (comportamento da 028).

`visitados`: locais **únicos** com check-in do uid, mais recente primeiro, teto 80. Mesmo shape de item da garagem; `visitadoEm` preenchido, `favoritadoEm` pode ser `null`.

---

## 5. Dados

### 5.1 `userslocalcheckin`

```
{
  id: string,          // autoId
  usuarioId: string,
  localId: string,
  lat: number,         // posição do piloto
  lng: number,
  createdAt: timestamp
}
```

Índices:

- `usuarioId` ASC + `createdAt` DESC
- `usuarioId` ASC + `localId` ASC + `createdAt` DESC

### 5.2 Agregado no `users`

```
locaisVisitadosUnicos: number
locaisVisitadosIds: string[]          // interno
checkinsPorCategoria: { posto, bar_moto_point, restaurante_estrada, oficina, mirante }
selos: { localId, nome, categoria }[]  // mais recente primeiro
```

Docs antigos: mapper lê `0` / `[]` / zeros. Cliente **não** envia esses campos em POST/PUT `/perfil`.

---

## 6. Carimbo do local

Um selo por **local único**. O label é o **nome do ponto** (ex.: “Posto Graal da Serra”). Ícone = categoria (`posto`, `mirante`, …). Voltar no mesmo local não gera selo novo.

`seloNovo` no POST é `{ localId, nome, categoria }` na primeira visita daquele ponto; `null` se já tinha o carimbo.

Não há catálogo genérico (“Primeira parada”, “Rodou o mapa”) nesta versão.

---

## 7. Front

### 7.1 Detalhe `/locais/[id]`

- Se `checkinProprio`: chip **Você já passou aqui**; esconde o CTA (repetir só via API, cooldown 24 h).
- Senão: botão primário **Estou aqui** (touch ≥ 48 px).
- Estados: pedindo GPS · erro de permissão · GPS impreciso · longe demais · sucesso.
- Depois do primeiro check-in, se `!avaliado`: link “Quer avaliar este ponto?” → `/locais/:id/avaliar`. Sem forçar.

GPS: `navigator.geolocation.getCurrentPosition` com `enableHighAccuracy: true`, `maximumAge: 0`, `timeout: 15000`. **Não** usar BackgroundGeolocation da telemetria.

### 7.2 Perfil (`CartaoPiloto`)

Faixa **Paradas** abaixo da ficha. Chip = ícone da categoria + nome do local (trunca se longo); toque abre `/locais/:id`. Some se `selos.length === 0`. Máx. 4 visíveis; **Ver selos** expande. Vale no perfil público e no próprio.

### 7.3 Garagem aba Locais

Pills de recorte **Favoritos** | **Visitados** acima das pills de avaliação. Visitados busca `recorte=visitados`. Empty: “Nenhum check-in ainda. Chegue num ponto oficial e toque em Estou aqui.”

---

## 8. GPS e anti-fazenda

| Regra | Valor |
|-------|-------|
| Raio | 400 m (`haversineKm` já em `functions/src/lib/geo.ts`) |
| Precisão máxima | 80 m |
| Cooldown | 1 check-in / par uid+local / 24 h |
| Selos | só locais distintos |
| Uid | só do token |

O cliente pode recusar cedo (copy igual); o servidor é a fonte da verdade.

---

## 9. IDs de teste

| ID | Área | Critério de aceite |
|----|------|--------------------|
| **K1** | Detalhe | Fora do raio → 400 + copy “Chegue mais perto…”; no raio → 201 e chip “Você já passou aqui” |
| **K2** | GPS | Permissão negada não grava check-in; copy de localização |
| **K3** | Perfil | Após o 1º check-in único, o chip com o **nome do local** aparece no perfil público e no próprio |
| **K4** | Garagem | Pill Visitados lista o local; Favoritos continua só coração |
| **K5** | Cooldown | Segundo POST no mesmo local em < 24 h → 409 |

---

## 10. Fases seguintes (fora desta entrega)

- **Fase 2:** UI “Ver selos” rica se o overflow ficar curto (fase 1 já mostra até 4 + expandir).
- **Fase 3:** selo no local (“Parada da galera”) e/ou check-in automático pela polyline da telemetria.
