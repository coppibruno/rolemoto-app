# SPEC 032 — Mapa integrado + Geocoding Sul (SC / PR / RS)

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-21  
> **Origem:** backlog pós-MVP (mapa no criar rolê; busca fraca; limitar cadastro ao Sul)  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade  
> **Backend:** Cloud Function `api` (Express) — validar lat/lng em `POST /roles`, `POST /eventos`, `POST /locais` (+ PUT quando existir)  
> **Depende de:** SPEC 004 (criar rolê), SPEC 019 (Maps / nome do local — **esta spec estende** o recorte “sem mapa embutido”), SPEC 022 (evento), SPEC 023 (local)  
> **QA:** testar IDs **G1**, **G2**, **G3** em PRs separados quando possível

---

## 1. Objetivo

Melhorar a escolha de **partida / destino / endereço** no cadastro de rolê, evento e local:

| ID | Entrega | Camada |
|----|---------|--------|
| **G1** | Mapa interativo no criar rolê (partida + destino): pin arrastável / toque no mapa confirma ponto | Front |
| **G2** | Aceitar só coordenadas em **SC, PR ou RS** (front + back) | Front + Back |
| **G3** | Busca de endereço mais tolerante (tokens, bias regional, fallback) | Front (lib geocode) |

Hoje o fluxo usa **Nominatim** (`src/lib/geocode.ts`) com texto livre — “posto petrobras vila nova” não encontra “Posto Almirante Vila Nova” em Blumenau. SPEC 019 só entregou deep link “Abrir no Maps” e nome opcional; **não** há mapa embutido.

---

## 2. IDs de teste (checklist independente)

| ID | Área | Severidade | Sintoma atual | Critério de aceite | Como testar |
|----|------|------------|---------------|--------------------|-------------|
| **G1** | Criar rolê | Alta | Só input + lista Nominatim; sem mapa | Em `/criar-role`, partida e destino têm mapa; toque/arrasto atualiza lat/lng + label; publicar persiste coords | Publicar rolê movendo pin; conferir feed/detalhe |
| **G2** | Cadastro | Alta | Qualquer UF do Brasil (e além) | Front bloqueia sugestão/pin fora do Sul; API 400 se lat/lng fora | Tentar SP/RJ/exterior → erro claro; SC/PR/RS → ok |
| **G3** | Busca | Alta | Query literal falha em nomes comerciais parciais | Busca por tokens + bias Sul devolve o posto esperado (ou top-N útil) | Query “posto petrobras vila nova” / “almirante vila nova blumenau” |

---

## 3. Recorte

### 3.1 O que entra

- Componente de mapa (ex.: Leaflet + OSM tiles, ou Maps JS se já houver chave) reutilizado em **partida** e **destino** do criar/clonar/editar rolê.
- Sincronização mapa ↔ campo texto ↔ sugestões (mesmo contrato `SugestaoEndereco { label, lat, lng }`).
- Bounding box / filtro de UF **SC | PR | RS** nas sugestões e na validação do pin.
- Validação server-side: rejeitar body com ponto fora da região.
- Melhoria da lib `geocode`: viewbox Sul, `countrycodes=br`, query por tokens, opcionalmente segunda passagem sem palavras genéricas (“posto”, “rua”).

### 3.2 O que **não** entra

| Item | Motivo |
|------|--------|
| Mapa no feed / pins de todos os rolês | Spec futura |
| Turn-by-turn / rota no mapa | SPEC 019 cobre Abrir no Maps |
| Trocar Nominatim por Google Places pago (obrigatório) | Preferir melhorar Nominatim; Places só se G3 falhar com evidência |
| Capacidade de capa (C1) | SPEC 033 |
| Cadastro de evento/local com o **mesmo** mapa rich (obrigatório nesta entrega) | G2 aplica nos três; G1 prioriza **criar rolê**; evento/local podem reusar o componente num follow-up se o esforço couber no mesmo PR |

**Decisão recomendada:** G1 obrigatório em rolê; evento/local recebem pelo menos **G2 + G3** no mesmo campo de endereço. Se o mapa for barato de reutilizar, plugar também — senão documentar follow-up.

### 3.3 Relação com SPEC 019

| SPEC 019 | Esta spec |
|----------|-----------|
| “Não se embute mapa interativo” | **Revoga** esse fora-de-escopo para criar rolê |
| `BotaoAbrirMaps` / `urlAbrirMaps` | **Mantém** nas listagens e fichas |
| Nome opcional do local | **Mantém** |

---

## 4. Região Sul — regras

### 4.1 Front

- Sugestões: descartar resultados cujo `address.state` / `ISO3166-2-lvl4` não seja `BR-SC`, `BR-PR`, `BR-RS` (ou equivalente Nominatim).
- Pin no mapa: se o usuário arrastar para fora, **snap de volta** ou modal “Só cadastramos pontos em SC, PR e RS” + não atualizar form.
- Viewbox inicial sugerido (aprox.): lat −34.0…−22.0, lng −57.5…−48.0 (ajustar com bbox real dos três estados).
- Bias: se o GPS do piloto estiver no Sul, centrar o mapa nele; senão, centro default (ex. Blumenau / Curitiba — escolher um e documentar).

### 4.2 Back

Helper compartilhado (ex. `functions/src/lib/regiao-sul.ts`):

```ts
export const pontoEstaNoSul = (lat: number, lng: number): boolean =>
  /* bbox + opcional checagem por UF via polígono simplificado */;
```

Usar em:

- `POST /roles` — `localSaida` e `destinoFinal`
- `PUT /roles/:id` — idem
- `POST /eventos` — `local`
- `POST /locais` — `lat`/`lng`
- PUT de evento/local se existirem

Resposta: `400 { erro: "Localização deve estar em SC, PR ou RS" }`.

Não confiar só no front.

---

## 5. G1 — Mapa no criar rolê

### 5.1 UX

Em cada `CampoLocalizacao` (partida e destino):

1. Input + sugestões (já existem).
2. Abaixo: mapa ~180–220px, full-width do card, pin no ponto atual (ou GPS).
3. Toque no mapa / arrastar pin → reverse geocode → atualiza label + lat/lng.
4. Escolher sugestão → centraliza mapa no ponto.

Acessibilidade: input continua usável sem mapa; mapa é atalho visual.

### 5.2 Dependência

Preferir **Leaflet + OpenStreetMap** (sem chave) alinhado ao Nominatim. Se o projeto já tiver Google Maps JS, reutilizar — não misturar dois providers no mesmo formulário.

---

## 6. G3 — Busca inteligente

### 6.1 Problema

Nominatim faz match frágil em nomes fantasia (“Petrobras” vs “Almirante”).

### 6.2 Proposta mínima

1. `viewbox` + `bounded=1` (ou `countrycodes=br`) nas buscas de cadastro.
2. Normalizar query: lowercase, remover acentos, colapsar espaços.
3. Se zero resultados: segunda busca só com tokens “fortes” (remover stopwords: posto, rua, avenida, de, da, do).
4. Ordenar / priorizar hits em SC/PR/RS.
5. Mostrar até N sugestões com label completo (nome + bairro + cidade) para o piloto discriminar.

Fora do escopo MVP: index próprio de POIs, fuzzy Levenshtein no servidor.

Caso de aceite explícito (Blumenau):

- Query A: `almirante vila nova` → encontra o posto.
- Query B: `posto petrobras vila nova` → após fallback de tokens, aparece o mesmo (ou sugestão equivalente no top 5).

---

## 7. Checklist de aceite

### G1

- [ ] `/criar-role`: mapa em partida e destino.
- [ ] Arrastar pin / toque atualiza form e permite publicar.
- [ ] Clone/edição de rolê (se reusar o campo) mantém o mapa.

### G2

- [ ] Sugestão fora do Sul não é selecionável (ou não aparece).
- [ ] API rejeita lat/lng fora com 400.
- [ ] Evento e local também validam no back.

### G3

- [ ] Bias Sul nas buscas de cadastro.
- [ ] Fallback por tokens documentado e coberto pelo caso Blumenau (manual ou teste).

---

## 8. Ordem de implementação sugerida

1. **G2** (validação + filtro UF)  
2. **G3** (lib geocode)  
3. **G1** (mapa — maior esforço de UI)

---

## 9. Fora / follow-ups

- Polígono oficial IBGE (bbox pode deixar passar faixa de outro estado na borda — aceitável no MVP se documentado).
- Mapa rich em criar-evento / criar-local.
- SPEC 033 (capa opcional) — PR aparte.
