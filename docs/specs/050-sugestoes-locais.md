# SPEC 050 — Sugestões de locais (fila admin)

> **Status:** Implementado  
> **Autor:** Assistente IA  
> **Data:** 2026-10-29  
> **Origem:** alimentar o catálogo de locais com pontos de quem anda de moto em SC, PR e RS, sem publicar sozinho  
> **Padrões:** Next.js 15 App Router — skill `nextjs-patterns`; visual — skill `desenvolvimento-design`  
> **Backend:** Cloud Function `api` — busca interna + REST admin da fila  
> **Coleção:** `sugestoesLocal` (nova). `locais` ganha `googlePlaceId` opcional  
> **Depende de:** SPEC 023 (cadastro e `POST /locais`), SPEC 032 (`pontoEstaNoSul`)  
> **QA:** IDs **SL1**–**SL4**, um PR por ID

Eventos ficam fora. Menção de Instagram e busca de encontro com data são spec futura, quando existir conta e texto com data para um administrador confirmar.

---

## 1. Objetivo

Uma rotina semanal procura pontos perto de rotas e mirantes que o motociclista já usa no Sul. O que passa na nota entra numa fila. O administrador vê o motivo, ajusta a categoria e aprova. Aprovar grava em `locais` pelo mesmo contrato da SPEC 023. Recusar não volta a sugerir aquele lugar.

O piloto não vê a fila. Nada entra no feed sem aprovação.

| ID | Entrega | Camada |
|----|---------|--------|
| **SL1** | Sementes, vocabulário e nota, com teste e sem rede | Back (lib pura) |
| **SL2** | Places API + gravação da fila + rota do cron | Back |
| **SL3** | Listar, aprovar e recusar | Back |
| **SL4** | Tela admin da fila | Front |

---

## 2. Recorte

### 2.1 O que entra

- Lista fechada de sementes (rota ou mirante) com centro e raio, só em SC, PR e RS.
- Consultas por semente: ponto de encontro de motos e oficina de motos em toda rodada. Ponto turístico busca o nome da serra/rota. Mirante busca `mirante`. São filtros distintos: a serra não entra como mirante e o mirante não entra como ponto turístico. Restaurante, padaria, café e natureza entram no padrão. Mirante começa desligado.
- Nota a partir do nome, do tipo do Google, do resumo, de trechos de avaliação e da distância até a semente.
- Coleção `sugestoesLocal`. O id do documento é o `placeId` do Google.
- `POST /interno/sugestoes-locais/buscar` no mesmo padrão de `POST /interno/stories/expirar` (header `X-Cron-Secret`).
- REST admin: listar pendentes, aprovar, recusar.
- Tela `/sugestoes-locais`, só admin, com **Buscar agora** (`POST /sugestoes-locais/buscar`, mesma rodada do cron).
- No aprovar, criar o local com `criadorId` do administrador e `googlePlaceId` preenchido.

### 2.2 O que não entra

| Item | Motivo |
|------|--------|
| Publicar local sem aprovação | A nota reduz a fila. Quem homologa continua sendo o admin |
| Varrer o retângulo do Sul com "restaurante" ou "posto" | Enche o catálogo de comércio urbano |
| Instagram, Sympla, evento com data | Sem data estruturada. Spec futura |
| Posto sem palavra forte no nome | Posto de bairro não é ponto de rolê |
| Editar local já publicado por esta fila | PUT de local continua fora (SPEC 023) |
| Piloto sugerir local | Fora deste corte |

### 2.3 Decisões travadas

| Decisão | Escolha |
|---------|---------|
| Fonte | Places API (New), Text Search, `languageCode=pt-BR`, `regionCode=BR` |
| Onde busca | Círculo da semente. O bbox da SPEC 032 só descarta o que cair fora de SC/PR/RS |
| Chave | `PLACES_API_KEY` só na function. O client nunca chama o Google |
| IA | `GEMINI_API_KEY` opcional na function. Só classifica ponto turístico. Sem ela, a serra só entra se o nome for a rota. Com ela, o Gemini aceita a serra/canyon/morro e recusa mirante. O modelo é `gemini-3.5-flash-lite`. `GEMINI_MODEL` troca esse nome, exceto 3.5, 3.7 e 3.8 Flash, que caem no Lite |
| Foto | A function baixa a primeira foto, grava em `locais/fachadas/sugestoes/{placeId}.jpg` e usa a URL do Storage em `fotoFachadaUrl`. Sem foto, o campo fica `""` e a homologação segue. O crédito (`fotoAtribuicao`) aparece na fila e no local |
| Segredo do cron | Reusa `STORIES_CRON_SECRET` e o header `X-Cron-Secret`. Sem o header, 404 |
| Ritmo | Segunda, 06:00 `America/Sao_Paulo`. Quatro sementes por rodada, em rotação, para o custo não crescer com a lista |
| Teto da rodada | No máximo 8 documentos novos em `pendente`. Empate: menor distância até a semente |
| Nota mínima | 50 |
| Id da sugestão | `placeId`. Status `aprovada` ou `recusada` não é reaberto |
| Duplicata de local | Mesmo `googlePlaceId`, ou local já existente a menos de 150 m com nome parecido: não cria sugestão |
| Quem aprova | `exigirAdmin`, o mesmo de `POST /locais` |
| Categoria na aprovação | A sugerida vem preenchida. O admin pode trocar antes de confirmar. Facilidades começam vazias. Horário: 24 h se o Google disser que abre o dia inteiro; senão a faixa convertida; se não houver horário, `aberto24h: false` e o admin precisa completar na tela antes de aprovar |
| Entrada da tela | Link **Sugestões** no cabeçalho de `/locais`, visível só para admin. O `+` do dock continua só para cadastrar |

---

## 3. Como a nota separa lugar de moto

A function não varre o estado. Cada consulta nasce de uma semente. Restaurante, padaria e café só entram quando o filtro pede. Posto genérico continua de fora.

### 3.1 Sementes iniciais

Arquivo `functions/src/lib/sugestoes-local/sementes.ts`. Raio padrão 12 km. Coordenada é o centro da busca, não o pin que será gravado.

| Id | Nome | UF | Centro (lat, lng) |
|----|------|----|-------------------|
| `rio-do-rastro` | Serra do Rio do Rastro | SC | −28.399, −49.547 |
| `dona-francisca` | Serra Dona Francisca | SC | −26.220, −49.020 |
| `corvo-branco` | Serra do Corvo Branco | SC | −28.040, −49.370 |
| `morro-da-igreja` | Morro da Igreja | SC | −28.125, −49.480 |
| `graciosa` | Estrada da Graciosa | PR | −25.350, −48.880 |
| `guartela` | Canyon Guartelá | PR | −24.566, −50.257 |
| `rota-romantica` | Rota Romântica | RS | −29.374, −50.876 |
| `itaimbezinho` | Canyon Itaimbezinho | RS | −29.160, −50.080 |
| `fortaleza` | Canyon Fortaleza | RS | −29.070, −50.010 |
| `rota-do-sol` | Rota do Sol | RS | −29.400, −50.020 |

A rotação guarda o índice da próxima semente em `config/sugestoesLocal` (`proximoIndice`). A rodada usa quatro sementes seguidas e avança o índice.

### 3.2 Consultas

Por semente, com `locationBias` circular no centro e `maxResultCount` 10. Sempre:

1. `ponto de encontro de motos`
2. `oficina de motos`

E, se o filtro estiver ligado:

| Filtro | Consulta |
|--------|----------|
| Ponto turístico | nome da semente (`Serra do Rio do Rastro, SC`) |
| Restaurante | `restaurante` |
| Padaria | `padaria` |
| Café | `café` |
| Mirante | `mirante` |
| Natureza | `cachoeira` |

`POST /sugestoes-locais/buscar` recebe `{ facetas: ["turismo", "restaurante", "padaria", "cafe", "mirante", "natureza"] }`. Sem o campo, o padrão liga ponto turístico, restaurante, padaria, café e natureza (é o caso do cron). Mirante começa desligado. Lista vazia busca só moto e oficina. Valor desconhecido responde `400`.

Ponto turístico entra se o nome for a rota (Serra do Rio do Rastro) ou se a IA marcar o lugar como a própria serra/canyon/morro. Mirante da serra não entra neste filtro. Mirante entra só com o filtro mirante ligado, pelo nome (mirante, belvedere). A IA não classifica mirante. Sem `GEMINI_API_KEY`, ponto turístico só entra pelo nome da rota. A IA chama `gemini-3.5-flash-lite` uma vez. Falha dessa chamada não aborta a rodada.

`includedType` não entra. O tipo volta na resposta e só soma ponto. Filtrar tipo na consulta esconde moto point cadastrado como café.

### 3.3 Pontos

| Sinal | Pontos |
|-------|--------|
| Nome com termo forte: moto point, motopoint, point de moto, oficina de moto | +50 |
| Nome casa com a rota da semente | +50 (`casa com Serra do Rio do Rastro`) |
| IA marcou destino de moto | +50 (`ponto turístico de moto`) |
| Veio de restaurante, padaria, café, mirante ou natureza, e o nome não tem termo forte | +50 (`busca de café`, `busca de mirante`…) |
| Resumo ou avaliação com termo de estrada: moto, motociclista, motoqueiro, comboio, custom, trail, harley, estrada, curva | +30 |
| Tipo compatível: `tourist_attraction`, `viewpoint`, `park`, `cafe`, `restaurant`, `bar`, `motorcycle_dealer` | +15 |
| Até 5 km da semente que achou o lugar | +10 |

Descarta antes da nota:

- Fora do raio da semente ou fora de `pontoEstaNoSul`.
- Nome ou tipo com termo de cidade: shopping, supermercado, escola, hospital, aeroporto, hotel, pousada.
- `gas_station` sem termo forte no nome.
- Filtro ponto turístico: nome de mirante, acesso ou fenda.
- Filtro mirante: a própria serra, ou nome que não é mirante.
- Nota abaixo de 50.

Categoria sugerida, pelo primeiro sinal que casar:

| Sinal | Categoria |
|-------|-----------|
| Filtro restaurante, padaria ou café | `restaurante_estrada` |
| Filtro natureza ou mirante | `mirante` |
| oficina, mecânica de moto | `oficina` |
| moto point, point, encontro | `bar_moto_point` |
| restaurante, café, lanchonete | `restaurante_estrada` |
| posto | `posto` |
| nome da rota, IA, ou mirante, vista, canyon, serra | `mirante` |
| nenhum dos acima, mas a nota passou | `bar_moto_point` |

A tela mostra a categoria como sugestão. O admin troca no SL4.

### 3.4 O que a fila mostra para justificar

Cada pendente guarda `motivos: string[]` com no máximo três frases curtas, por exemplo "casa com Serra do Rio do Rastro", "ponto turístico de moto", "4,2 km da Serra do Rio do Rastro". Sem isso o admin não tem como confiar na nota.

---

## 4. IDs de teste

| ID | Área | Critério de aceite |
|----|------|--------------------|
| **SL1** | Nota | Teste puro: serra no ponto turístico entra; mirante no ponto turístico sai; mirante no filtro mirante entra; serra no filtro mirante sai; destino que a IA marcou entra; posto de bairro sai; restaurante sem palavra de moto sai; restaurante com "comboio" na avaliação e a 3 km entra; ponto fora do raio sai |
| **SL2** | Busca | Com a chave configurada, a rota interna grava no máximo 8 pendentes, não repete `placeId` e não sugere local já publicado. Sem o header, 404. Sem a chave, 503 e nada gravado |
| **SL3** | Aprovação | Admin aprova e o documento aparece em `locais` com `googlePlaceId`. Admin recusa e a próxima busca ignora o `placeId`. Piloto recebe 403 |
| **SL4** | Tela | Em `/sugestoes-locais` o admin vê nome, mapa, distância, motivos e categoria. Aprovar publica e tira da lista. Recusar tira da lista. Piloto cai em `/` |

---

## 5. Contrato

### 5.1 `POST /interno/sugestoes-locais/buscar`

Sem `autenticar`. Header `X-Cron-Secret`.

Resposta 200:

```
{
  sementes: string[],
  lidas: number,
  gravadas: number,
  ignoradas: number
}
```

`503` se `PLACES_API_KEY` estiver vazia. Corpo: `{ erro: "Places não configurado" }`.

Field mask do Text Search: `places.id`, `places.displayName`, `places.formattedAddress`, `places.location`, `places.types`, `places.editorialSummary`, `places.googleMapsUri`, `places.regularOpeningHours`, `places.reviews`, `places.photos`. Pedir `reviews` e a mídia da foto sobe o SKU. A foto só é baixada para sugestão pendente que ainda não tem fachada, no máximo as oito da rodada. O teto de quatro sementes e oito gravações existe por isso.

### 5.2 Coleção `sugestoesLocal`

```
{
  id: string,                 // placeId
  placeId: string,
  nome: string,
  endereco: string,
  lat: number,
  lng: number,
  categoriaSugerida: CategoriaLocal,
  nota: number,
  motivos: string[],
  sementeId: string,
  sementeNome: string,
  distanciaSementeKm: number,
  linkMaps: string,
  aberto24h: boolean,
  horarios: HorarioDiaLocal[],
  horarioCompleto: boolean,  // false obriga o admin a definir horário na tela
  fotoFachadaUrl: string,     // URL do Storage; "" se o lugar não tem foto
  fotoRecurso: string,        // nome do recurso Places; vazio se não houver
  fotoAtribuicao: string,     // autor da foto, ou "Google"
  fotoIndisponivel: boolean,  // true quando a Places confirmou que não há foto
  status: "pendente" | "aprovada" | "recusada",
  localId: string | null,
  createdAt: string,
  updatedAt: string
}
```

### 5.3 `GET /sugestoes-locais`

`autenticar` + `exigirAdmin`. Query `status` opcional, default `pendente`.

Resposta 200: `{ itens: SugestaoLocal[] }` ordenada por `nota` descendente.

### 5.4 `POST /sugestoes-locais/:id/aprovar`

`autenticar` + `exigirAdmin`. Body:

```
{
  nome?: string,
  endereco?: string,
  categoria: CategoriaLocal,
  facilidades?: FacilidadeLocal[],
  aberto24h: boolean,
  horarios?: HorarioDiaLocal[]
}
```

O servidor usa `nome` e `endereco` do body quando vêm preenchidos; senão, os da sugestão. Lat, lng e `linkMaps` continuam os da sugestão. `fotoFachadaUrl` e `fotoAtribuicao` são os já gravados na sugestão (a listagem baixa a foto antes). O body passa pelo mesmo validador de `POST /locais`. Grava `googlePlaceId`. Atualiza a sugestão para `aprovada` com `localId`.

`404` se não existe. `409` se o status não é `pendente`.

### 5.5 `POST /sugestoes-locais/:id/recusar`

Sem body. Status `recusada`. `409` se não está `pendente`.

### 5.6 Campo novo em `locais`

`googlePlaceId: string | null`. Documento antigo e cadastro manual ficam `null`. A busca trata ausência como `null`.

---

## 6. Tela `/sugestoes-locais`

Sem mock em `designs/`. Mesmos tokens de `/criar-local`: coluna até 560px, cartão `surface-container-low`, badge **Painel Admin**, CTA laranja.

Cada cartão:

- Nome e endereço, editáveis. O pino no mapa continua o do Google.
- Distância e nome da semente.
- Até três motivos.
- Chips de categoria (um selecionado, o sugerido).
- Horário, editável se `horarioCompleto` for falso.
- **Abrir no Maps** (`linkMaps`).
- **Homologar** e **Recusar**. Alvo de toque 48px. Homologar some enquanto a request está em voo.

Lista vazia: "Nenhuma sugestão nesta semana." Voltar vai para `/locais`.

Guarda igual à de `/criar-local`: sem `usuario.admin`, redirect `/`.

---

## 7. Ordem de implementação

1. **SL1** — `sementes.ts`, `pontuar-sugestao-local.ts` e teste. Nenhum import de Firebase nem de HTTP.
2. **SL2** — cliente Places, repositório `sugestoesLocal`, dedupe, rota interna. Provar com uma chamada manual no emulator.
3. **SL3** — aprovar e recusar reusando o validador de local. `googlePlaceId` no mapper.
4. **SL4** — tela e o link no cabeçalho de `/locais`.

Scheduler no console (não é código): job HTTP semanal para a rota do SL2, header `X-Cron-Secret`, horário de Brasília. Enquanto o job não existe, a rota interna já permite rodar a busca na mão.

---

## 8. Fora desta spec, em seguida

Quando o catálogo de locais estiver estável, uma spec nova cobre eventos: menções na conta de Instagram do Rolemoto e páginas públicas com data, na mesma fila de aprovação, sem publicar sozinho. Não misturar com os IDs SL1–SL4.
