# SPEC 055 — Sugestões de evento a partir de hashtag do Instagram

> **Status:** Proposta
> **Autor:** Assistente IA
> **Data:** 2026-11-05
> **Origem:** achar encontros em posts públicos e mandar para a mesma fila que o admin já homologa
> **Padrões:** Next.js 15 App Router — skill `nextjs-patterns`; visual — skill `desenvolvimento-design`
> **Backend:** Cloud Function `api` — rodada no mesmo `POST /sugestoes-eventos/buscar`
> **Coleção:** `sugestoesEvento` (existente). `fonte` passa a aceitar `instagram`
> **Depende de:** fila e homologação já em produção (MotoClub), SPEC 022 (evento publicado), SPEC 032 (`pontoEstaNoSul`)
> **QA:** IDs **SE1**–**SE3**, um PR por ID

A tela `/sugestoes-eventos` continua a fila do admin. Esta spec acrescenta uma fonte. Não troca a agenda do MotoClub e não publica evento sozinha.

O token de acesso não entra neste documento, no Git nem no client.

---

## 1. Objetivo

Uma rodada lê posts públicos de uma lista fechada de hashtags, na API oficial do Instagram. O que a leitura marcar como encontro de moto vira sugestão pendente. O administrador corrige título, data, lugar e ingresso e homologa. Recusar não volta a sugerir aquele post.

| ID | Entrega | Camada |
|----|---------|--------|
| **SE1** | Lista de hashtags, leitura do cartaz e descarte, com teste e sem rede | Back (lib pura) |
| **SE2** | Chamada da API, foto no Storage e gravação na fila | Back |
| **SE3** | Cartão mostra o post e deixa completar lugar e ingresso | Front + contrato de aprovar |

---

## 2. Recorte

### 2.1 O que entra

- Lista fechada de até 30 hashtags, sem `#`, em `functions/src/lib/sugestoes-evento/hashtags-instagram.ts`.
- `recent_media` de cada hashtag: posts públicos das últimas 24 horas.
- Leitura da legenda e da imagem com o Gemini já usado na SPEC 050. Só grava se a leitura disser que é encontro ou evento de moto.
- Documento em `sugestoesEvento` com `fonte: "instagram"`. O id é `ig_{mediaId}`.
- A mesma busca de hoje (`POST /sugestoes-eventos/buscar` e o cron `POST /interno/sugestoes-eventos/buscar`) roda o MotoClub e, em seguida, o Instagram.
- No cartão, o link do post abre o Instagram. Se o pin não estiver no Sul, ou se o acesso for ingresso sem URL, o admin completa antes de homologar.

### 2.2 O que não entra

| Item | Motivo |
|------|--------|
| Senha do Instagram, Playwright ou feed da home | A API oficial não entrega a home nem story de terceiro |
| Story | Hashtag em story não existe nessa API |
| `top_media` | É a seleção popular da tag, não os posts do dia |
| Autor do post | A API não devolve `username` |
| Trocar o MotoClub | A fila não pode depender da revisão da Meta |
| Publicar sem homologar | Data e lugar lidos do cartaz erram |
| Hashtag nova além das 30 na mesma janela de 7 dias | A conta estoura o teto da Meta e a rodada inteira falha |
| Token no repositório ou na resposta da API | Segredo só da function |

### 2.3 Decisões travadas

| Decisão | Escolha |
|---------|---------|
| Fonte | Instagram API com login do Facebook. Host `graph.facebook.com`. Versão fixa no client (`v27.0`, a mesma do painel) |
| Conta | `@rolemotobr` profissional, ligado à Página. O `user_id` da chamada é o id em `instagram_business_account` |
| Segredo | `INSTAGRAM_ACCESS_TOKEN` é a semente (pode ser curta). `INSTAGRAM_APP_ID` e `INSTAGRAM_APP_SECRET` trocam essa semente por um token de usuário de cerca de 60 dias e gravam o vigente em `config/instagram`. Nos últimos 14 dias a rodada pede outro, enquanto o atual ainda vale. Se `fb_exchange_token` não estender, usa `INSTAGRAM_OAUTH_REDIRECT_URI` (o mesmo redirect do app). Token já vencido não renova: a semente troca uma vez. Permissões: `instagram_basic`, `pages_show_list`, `pages_read_engagement`. `business_management` não entra. Token de Página sem prazo não serve: a hashtag exige token de usuário |
| Trava da Meta | O recurso **Instagram Public Content Access** precisa estar aprovado. Sem ele, a rodada do Instagram registra `bloqueada: true`, grava zero e o MotoClub segue |
| Janela | `recent_media` só vê 24 horas. O cron diário é o que não perde o dia. **Buscar agora** repete a mesma janela |
| Cota | Até 30 hashtags distintas em 7 dias, por conta. Repetir as mesmas não gasta de novo. A lista do arquivo é a cota inteira |
| Leitura | `GEMINI_API_KEY` obrigatória para esta fonte. Modelo `gemini-3.5-flash-lite`. `GEMINI_MODEL` troca o nome, com a mesma ressalva da SPEC 050. Sem a chave, ou se a chamada falhar, aquele post é ignorado. A rodada não inventa evento pela legenda |
| Data | A data do evento sai do cartaz ou da legenda. A data do post não vira abertura. Sem data futura, o post não entra na fila |
| Ingresso | `linkIngresso` só se a legenda tiver URL `http` ou `https`. "Link na bio" deixa o campo `null`. A URL do post não é copiada para o ingresso |
| Lugar | Só entra evento em SC, PR ou RS. UF lida fora do Sul descarta antes do geocódigo. Geocodifica o endereço lido, no mesmo cliente da fila atual. Pin no Sul grava o ponto. Sem pin no Sul, grava com `local` vazio (`lat` e `lng` `null`) e o texto do lugar em `cidade` só se a UF lida for do Sul. Sem pin no Sul e sem UF, descarta |
| Foto | Baixa `media_url` na hora e grava no Storage, no mesmo caminho de `salvarFotoEvento`. URL do Instagram expira |
| Id | `ig_{mediaId}`. `aprovada` ou `recusada` não reabre. O regex da rota passa a aceitar esse id além do `motoclub_…` |
| Teto | No máximo 8 documentos novos de Instagram por rodada, depois do teto que o MotoClub já tem |
| Quem aprova | `exigirAdmin`, igual hoje |

### 2.4 Hashtags iniciais

Arquivo único. Sem acento e sem `#`. Trocar um nome por outro conta como hashtag nova na janela de 7 dias.

| Hashtag | Por que está aqui |
|---------|-------------------|
| `encontromotos` | Cartaz de encontro |
| `encontrodeMotos` | Variante mais longa |
| `trackday` | Pista |
| `trackdaybrasil` | Pista no Brasil |
| `motoclube` | Clube anunciando saída ou festa |
| `cafecommotos` | Café de pilotos |
| `roledeMoto` | Passeio marcado |
| `diadomotociclista` | Data nacional, quando houver cartaz |

A lista cabe nas 30. O restante fica livre para a próxima edição deste arquivo, não para parâmetro da rota.

---

## 3. Como a rodada escolhe

### 3.1 Chamadas

Para cada hashtag, nesta ordem:

1. `GET /ig_hashtag_search?user_id={ig-user-id}&q={hashtag}`
2. `GET /{hashtag-id}/recent_media?user_id={ig-user-id}&fields=id,caption,media_type,media_url,permalink,timestamp&limit=50`

O id da hashtag pode ficar em memória na mesma rodada. Não há coleção para isso.

`media_type` `IMAGE` entra. `CAROUSEL_ALBUM` usa a primeira imagem. `VIDEO` entra só pela legenda, sem frame. Sem `media_url` e sem legenda, ignora.

A paginação segue `paging.next` enquanto existir, com teto de 3 páginas por hashtag.

### 3.2 Leitura

Uma chamada por post, com a legenda (no máximo 2 000 caracteres) e a imagem já salva, ou a `media_url` se o Storage ainda não tiver a foto. A resposta é JSON:

| Campo | Regra |
|-------|--------|
| `eEvento` | `false` descarta. Foto de moto, rolê sem data e meme caem aqui |
| `titulo` | Até 80 caracteres. Vazio descarta |
| `abertura` | ISO com fuso de São Paulo, no futuro. Ausente descarta |
| `encerramento` | ISO ou `null`. Se passar de 7 dias depois da abertura, corta em 7 dias e acrescenta o motivo `encerramento limitado a 7 dias` |
| `tipo` | Um de `moto_point_semanal`, `track_day`, `cafe_pilotos`, `exposicao_custom` |
| `acesso` | `gratis` ou `ingresso` |
| `linkIngresso` | URL da legenda ou `null` |
| `lugar` | Nome e endereço em texto, ou vazio |
| `cidade` | Cidade lida, ou `""` |
| `uf` | Sigla do estado lida ou deduzida da cidade, ou `""`. Fora de SC, PR e RS descarta |
| `motivos` | Até 3 frases curtas. A primeira diz o que no cartaz levou a marcar como evento |

Teste de SE1 cobre o JSON válido, o descarte (`eEvento: false`, data no passado, título vazio) e o corte de 7 dias. Sem HTTP.

### 3.3 O que grava

`SugestaoEventoNova` como hoje, com:

| Campo | Valor |
|-------|--------|
| `fonte` | `instagram` |
| `slug` | `mediaId` |
| `urlOrigem` | `permalink` |
| `nota` | 50 se `eEvento` e a abertura é futura. Não há segunda régua |
| `local` | Ponto geocodificado no Sul, ou `{ lat: null, lng: null, endereco, nome }` |
| `fotoCapaUrl` | URL do Storage, ou `""` se o download falhar. Sem foto a homologação continua bloqueada, como hoje |

Post já decidido não gera outro documento. Evento futuro com o mesmo título e a mesma abertura, já na coleção `eventos`, também não gera. A comparação é a de `escolherSugestoesEvento`.

### 3.4 Resposta da busca

O JSON atual permanece (`lidas`, `gravadas`, `ignoradas`) para o MotoClub. Entra um bloco:

```json
{
  "lidas": 0,
  "gravadas": 0,
  "ignoradas": 0,
  "instagram": {
    "lidas": 0,
    "gravadas": 0,
    "ignoradas": 0,
    "bloqueada": false
  }
}
```

`bloqueada: true` quando falta `INSTAGRAM_ACCESS_TOKEN`, falta `GEMINI_API_KEY`, o token venceu e não dá para renovar, ou a Meta responde sem permissão de conteúdo público. HTTP 200 se o MotoClub concluiu. As duas fontes falhando de rede respondem 502, como a agenda já responde hoje.

---

## 4. Homologação

`POST /sugestoes-eventos/:id/aprovar` passa a aceitar, no corpo:

| Campo | Quando |
|-------|--------|
| `local` | Obrigatório se o documento está com `lat` ou `lng` `null`, ou se o pin salvo está fora do Sul. `{ lat, lng, endereco, nome }`, e `pontoEstaNoSul` precisa passar |
| `linkIngresso` | Obrigatório se `acesso` é `ingresso` e o documento não tem URL. Não usa `urlOrigem` no lugar |

Fonte `motoclub` segue a regra atual: o pin já gravado e, no ingresso, `linkIngresso` ou `urlOrigem`.

O cartão de `fonte: "instagram"`:

- O link deixa de dizer **Abrir na agenda** e passa a dizer **Abrir no Instagram**.
- Mostra o texto do lugar. Se não houver pin no Sul, um campo de endereço usa a busca que `/criar-evento` já tem. Homologar fica desligado até o ponto estar no Sul.
- Com acesso **ingresso** e sem URL, mostra um campo de link. Homologar fica desligado enquanto o link for inválido.

Recusar não muda.

---

## 5. Fora desta spec

- Token de Página sem data de validade. A busca de hashtag pede token de usuário, então o prazo de 60 dias continua e a rodada é que renova.
- Pedido de revisão na Meta. É passo de conta, anterior ao SE2 responder com posts.
- Marcações em que citam `@rolemotobr`. Outra fonte, se a hashtag não bastar.
- Story, reel sem legenda útil e conta pessoal.
