# SPEC 052 — Encontros semanais

> **Status:** Proposta
> **Autor:** Assistente IA
> **Data:** 2026-11-03
> **Origem:** encontro fixo no mesmo ponto, toda semana (Velharia, toda quarta), sem gravar o ano inteiro
> **Padrões:** Next.js 15 App Router — skill `nextjs-patterns`; visual — skill `desenvolvimento-design`
> **Backend:** Cloud Function `api` — série + ocorrências em `eventos`; cron no mesmo padrão de `POST /interno/stories/expirar`
> **Coleções:** `seriesEvento` (**nova**). `eventos` ganha `serieId`, `ocorrenciaYmd`, `ocorrenciaAjustada`, `cancelada`
> **Depende de:** SPEC 022 (cadastro e `eventos`), SPEC 024 (aba Eventos), SPEC 026 (inscrição), SPEC 027 (avaliação), SPEC 045 (ao vivo e `localId`)
> **QA:** IDs **RS1**–**RS5**, um PR por ID

A série é a regra. A ocorrência é um evento com data, no contrato que o app já usa. O feed mostra uma linha por série.

---

## 1. Objetivo

O administrador cadastra o rito uma vez: Velharia, toda quarta, 19:30–23:00, no local do catálogo. O servidor materializa só as próximas quatro semanas como documentos `eventos`. Quando uma quarta encerra, a seguinte entra no horizonte.

Inscrição, lembrete, janela ao vivo, story e avaliação continuam na ocorrência. Cada quarta tem começo, fim e histórico próprio.

| ID | Entrega | Camada |
|----|---------|--------|
| **RS1** | Calendário das próximas datas e escolha de qual ocorrência o feed mostra, com teste e sem rede | Back (lib pura) |
| **RS2** | Coleção `seriesEvento`, `POST`/`GET`/`PUT` e geração na criação | Back |
| **RS3** | Cron, pular data, pausar, encerrar, ajustar uma data, tasks | Back |
| **RS4** | Feed e contagem com uma linha por série; chip no card e no detalhe | Back + front |
| **RS5** | Toggle no cadastro e tela da série | Front |

---

## 2. Recorte

### 2.1 O que entra

- Série semanal: um dia da semana e um par de horários, fuso `America/Sao_Paulo`.
- Horizonte de **4** ocorrências, contando a próxima que ainda não encerrou.
- Ocorrência gravada em `eventos`, com o mesmo shape do `POST /eventos` mais os campos desta spec.
- Feed (e `GET /feed/contagens`) com **uma** linha por `serieId`: a que está ao vivo, ou a próxima que ainda não encerrou.
- Chip `toda quarta` / `todo domingo` no card e no detalhe.
- Admin pausa, encerra, pula uma data ou ajusta só uma quarta.
- Job diário que empurra o horizonte. Criar ou retomar a série já gera, sem esperar o job.
- Tasks de aviso (24 h, todos) e lembrete (2 h, criador) em cada ocorrência nova, iguais às do `POST /eventos`.

### 2.2 O que não entra

| Item | Motivo |
|------|--------|
| Gerar o ano, o mês ou mais de 4 semanas | Estoura o teto de 200 de `listarFuturos` e repete o mesmo card |
| Evento eterno que só troca a data | Apaga qual quarta a pessoa foi, mistura nota e não abre o ao vivo na noite certa |
| Quinzenal, mensal, vários dias ou RRULE livre | O caso real é semanal. Outra frequência é outra spec |
| “Vou sempre” (inscrição automática na ocorrência nova) | Inscrição continua sendo daquela data (SPEC 026) |
| Converter um evento avulso já publicado em série | O admin cria a série. O avulso segue até encerrar |
| Média da série, ou herdar a nota da quarta anterior | A nota do evento continua por ocorrência. A reputação do ponto fica no local (SPEC 027) |
| Push de “esta quarta foi cancelada” | Não há esse tipo hoje. Quem se inscreveu vê **Cancelado** na garagem e no detalhe |
| Apagar ocorrência passada, avaliação ou inscrição | Histórico fica |

### 2.3 Decisões travadas

| Decisão | Escolha |
|---------|---------|
| Quem cria | `exigirAdmin`, o mesmo de `POST /eventos` |
| Frequência | Só semanal. `diaSemana` 0 = domingo … 6 = sábado, igual ao horário do local |
| Fuso | `America/Sao_Paulo`. Relógio de parede no critério de `paredeSaoPauloIso` (`functions/src/lib/sugestoes-evento/datas-evento.ts`) |
| Duração de uma ocorrência | Maior que 0 e menor que 24 h. Se `horaEncerramento` ≤ `horaAbertura`, o fim cai no dia seguinte (vira a noite) |
| Horizonte | 4 datas. A que já encerrou não conta |
| Id da ocorrência | `{serieId}_{yyyy-mm-dd}` da abertura em São Paulo. Criar de novo o mesmo par não duplica |
| O que o feed lista | Por `serieId`, a ocorrência ao vivo; senão a de `dataHoraAbertura` menor cujo fim ainda não passou. Evento sem `serieId` passa inteiro |
| Contagem da aba | O mesmo recorte do feed, senão o número mente |
| Edição da regra | Só nas ocorrências futuras **livres** |
| Livre | Futura, `cancelada === false`, `ocorrenciaAjustada === false`, sem inscrição e sem avaliação |
| Ocorrência ajustada à mão | Congelada. A regra não pisa nela |
| Pular data com inscrição | Não apaga. Marca `cancelada` e tira do feed |
| Pular data livre | Apaga o documento e cancela as tasks |
| Capa | Uma URL na série. A ocorrência copia a URL; não há upload por semana |
| `localId` | Opcional, como no evento. Com ele, a quarta veste o álbum do local (SPEC 045) |
| Nota | Cada ocorrência tem a própria. O card da próxima quarta começa em 0 |
| Compartilhar | O link continua sendo a ocorrência (`/e/:id`), com a data daquela semana |
| Segredo do cron | Reusa `STORIES_CRON_SECRET` e o header `X-Cron-Secret`. Sem o header, 404 |
| Ritmo do cron | Todo dia, 06:10 `America/Sao_Paulo`. Uma function HTTP só; sem `onSchedule` |
| Cliente | Firestore continua deny-all. Nada de série escrita no client |

---

## 3. Série e ocorrência

### 3.1 Coleção `seriesEvento`

Id auto.

```
{
  id: string,
  titulo: string,
  tipo: TipoEvento,                  // o mesmo enum de eventos
  local: { lat, lng, endereco, nome },
  localId: string | null,
  diaSemana: 0 | 1 | 2 | 3 | 4 | 5 | 6,
  horaAbertura: "HH:mm",
  horaEncerramento: "HH:mm",
  aPartirDe: "yyyy-mm-dd" | null,    // null = a partir de agora
  acesso: "gratis" | "ingresso",
  linkIngresso: string | null,
  atracoes: AtracaoEvento[],
  fotoCapaUrl: string,
  informacoes: string,
  excecoes: string[],                // ymd pulados; teto 24
  status: "ativa" | "pausada" | "encerrada",
  criadorId: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

`criadorId` vem do token. Timestamps só no servidor. `excecoes` guarda o ymd da **abertura**.

### 3.2 Campos novos em `eventos`

Docs antigos leem assim:

| Campo | Ausente no doc antigo |
|-------|------------------------|
| `serieId` | `null` |
| `ocorrenciaYmd` | `null` |
| `ocorrenciaAjustada` | `false` |
| `cancelada` | `false` |

A ocorrência copiada da série traz `titulo`, `tipo`, `local`, `localId`, `acesso`, `linkIngresso`, `atracoes`, `fotoCapaUrl`, `informacoes`, `criadorId`. `dataHoraAbertura` e `dataHoraEncerramento` saem do ymd + horários. Contadores de nota nascem em 0, como no `POST /eventos`.

### 3.3 Índice

`eventos`: `serieId` ASC + `dataHoraAbertura` ASC. A listagem do feed não precisa desse índice: ela já traz os futuros e a dedupe é em memória. O índice serve para a série achar as próprias ocorrências.

---

## 4. Quais datas nascem

Lib pura em `functions/src/lib/serie-evento.ts`. Sem Firestore. RS1 cobre os casos abaixo.

Entrada: `diaSemana`, `horaAbertura`, `horaEncerramento`, `aPartirDe`, `excecoes`, `agora`, horizonte 4.

1. O primeiro candidato é o próximo ymd com aquele `diaSemana`, em São Paulo, maior ou igual a `max(hoje, aPartirDe)`.
2. Se o fim dessa ocorrência já passou, pula para a semana seguinte.
3. Ymd presente em `excecoes` é pulado e não consome uma vaga do horizonte.
4. Devolve até 4 ymids, cada um com `dataHoraAbertura` e `dataHoraEncerramento` em ISO UTC.

Exemplos, série quarta 19:30–23:00:

| Agora em São Paulo | Primeira data |
|--------------------|---------------|
| Quarta, 10:00 | Hoje |
| Quarta, 22:00 (ainda não encerrou) | Hoje |
| Quarta, 23:01 | A outra quarta |
| Quinta | A outra quarta |

Quarta 19:30 até quinta 01:00 é válida (fim no dia seguinte, duração &lt; 24 h). Quarta 19:30 até quinta 19:30 é inválida.

Dois horários iguais são inválidos. `horaEncerramento` omitida é inválida na série: sem fim não há janela ao vivo (SPEC 045).

---

## 5. API

Rotas autenticadas com `exigirAdmin`, exceto as de leitura que o piloto já usa no evento.

### 5.1 `POST /series-evento`

Body no formato do evento, trocando a data única pela regra:

```
{
  titulo, tipo, local, localId?,
  diaSemana, horaAbertura, horaEncerramento,
  aPartirDe?,          // ymd; se vier, tem de cair em diaSemana e não estar no passado
  acesso, linkIngresso?, atracoes, fotoCapaUrl, informacoes
}
```

Validação de título, tipo, local, acesso, atrações, capa e texto reusa a do `POST /eventos`. `localId`, se vier, precisa existir.

Resposta `201`: a série e a lista das ocorrências criadas.

Na mesma request, para cada ocorrência nova:

- grava `eventos/{serieId}_{ymd}` só se o doc não existir;
- `agendarAvisoEvento` (24 h, todos);
- `agendarLembreteEvento` do `criadorId` (2 h).

Não inscreve o admin. Quem quiser a quarta usa o `POST /eventos/:id/inscricao`.

### 5.2 `GET /series-evento` e `GET /series-evento/:id`

Admin. A lista devolve status, dia, horários, título, `localId` e a próxima ocorrência não cancelada (`id`, abertura, fim), ou `null` se não houver. Teto 50 séries.

### 5.3 `PUT /series-evento/:id`

Admin. Mesmos campos do POST, mais nada de status (status tem rota própria). Série `encerrada` responde `409`.

O que mudou é copiado só para ocorrências **livres**. Data e hora livres são recalculadas. Se o `diaSemana` mudou, a livre que deixou de cair no dia novo é apagada (e as tasks canceladas); as datas novas do horizonte são criadas.

Ocorrência com inscrição, avaliação, `ocorrenciaAjustada` ou já encerrada permanece byte a byte.

### 5.4 `POST /series-evento/:id/pausar` e `POST /series-evento/:id/retomar`

Pausar: `status = pausada`. Não apaga o que já foi gerado. O feed continua mostrando a próxima até ela encerrar. O cron não cria a seguinte.

Retomar: `status = ativa` e gera o horizonte na hora. `409` se estiver encerrada.

### 5.5 `POST /series-evento/:id/encerrar`

`status = encerrada`. Ocorrências livres futuras são canceladas pelo mesmo caminho de pular data (seção 5.6). Passadas e as que têm inscrição ou avaliação ficam. Encerrada não retoma.

### 5.6 `POST /series-evento/:id/excecoes`

Body `{ ymd }`. O ymd tem de ser uma abertura possível da série (aquele `diaSemana`) e não pode estar no passado distante: aceita de hoje em diante. Teto 24. Duplicata responde `200` com a série como está.

| A ocorrência dessa data | Efeito |
|-------------------------|--------|
| Não existe | Só entra em `excecoes`. O gerador não cria |
| Livre | Apaga o doc. Cancela aviso e lembrete do criador. Entra em `excecoes` |
| Tem inscrição ou avaliação, ou `ocorrenciaAjustada` | `cancelada: true`. Cancela aviso, lembrete do criador e lembrete de cada inscrito. Não apaga inscrição nem avaliação. Entra em `excecoes` |
| Já encerrou | `409` `{ erro: "essa data já passou" }` |

Cancelar task reusa `cancelarLembreteEvento`: `userId` vazio para o aviso de 24 h; uid do criador e de cada inscrito para o de 2 h.

### 5.7 `PATCH /eventos/:id`

Além do `localId` que já existe, o admin pode ajustar **uma** ocorrência de série. Body parcial:

```
{
  titulo?, informacoes?,
  dataHoraAbertura?, dataHoraEncerramento?,
  horaAbertura?, horaEncerramento?
}
```

Um dos dois jeitos de horário: o par ISO, ou o par `HH:mm` aplicado ao `ocorrenciaYmd` (fim no dia seguinte se cruzar a meia-noite). Os dois juntos respondem `400`.

Regras:

- Sem `serieId`: `400` neste body. O PATCH antigo de `localId` continua valendo para qualquer evento.
- `cancelada` ou já encerrada: `409`.
- Duração da ocorrência continua &lt; 24 h e o fim fica depois da abertura.
- Grava `ocorrenciaAjustada: true`.
- Se a abertura mudou: cancela as tasks da abertura antiga e cria de novo (aviso 24 h e lembrete 2 h do criador e dos inscritos).

A série não muda. A quarta seguinte volta ao horário do rito.

### 5.8 Leitura e verbos que já existem

| Rota | Com `cancelada: true` |
|------|------------------------|
| `GET /eventos` e `GET /feed/contagens` | Fora |
| `GET /eventos/:id` e o convite público | Entram, com `cancelada: true` |
| `POST /eventos/:id/inscricao` | `400` `{ erro: "esta data foi cancelada" }` |
| `DELETE` da inscrição | Continua permitido |
| Avaliação (SPEC 027) | `400`, mesmo caminho de “ainda não encerrou” no espírito: não avalia data cancelada |
| Story do evento (SPEC 045) | Não está ao vivo |
| Garagem | Entra se o piloto está inscrito. `status: "cancelado"` |

`status` da garagem hoje é `confirmado` | `concluido`. Esta spec acrescenta `cancelado`, que vem antes dos dois na ordenação e não oferece Avaliar.

---

## 6. Feed com uma linha

Depois de `filtrarEventosFeed` (raio, busca, intervalo do `quando`) e depois de descartar `cancelada`:

1. Item com `serieId === null` fica.
2. Os demais agrupam por `serieId`.
3. No grupo, se alguma ocorrência está ao vivo (`abertura <= agora < fim`), fica essa. Se houver mais de uma, a de abertura maior — o mesmo desempate da SPEC 045.
4. Senão, fica a de `dataHoraAbertura` menor.
5. A ordenação do feed (distância) roda em cima desse resultado.

O chip `quando` continua valendo **antes** da dedupe. Filtro “hoje” numa quinta não mostra a Velharia. Filtro “próximos” mostra a próxima quarta, não as outras três que estão no banco.

`GET /eventos` sem geo (lista crua de futuros) aplica a mesma dedupe e o mesmo descarte de canceladas.

Cada item de série ganha:

```
recorrencia: {
  serieId: string,
  diaSemana: number,
  rotulo: string
} | null
```

`rotulo` sai de uma tabela fechada: `todo domingo`, `toda segunda`, `toda terça`, `toda quarta`, `toda quinta`, `toda sexta`, `todo sábado`.

O `EventoCard` e o detalhe mostram o `rotulo` num chip ao lado do período, no mesmo estilo de `badgeQuando`. O período continua sendo a data daquela ocorrência (`5 nov · 19:30–23:00`), não a palavra “semanal” no lugar da data.

---

## 7. Cron

`POST /interno/series-evento/gerar`

Sem `autenticar`. Header `X-Cron-Secret`. Registrar em `functions/src/index.ts` junto das rotas internas já públicas no matcher.

Para cada série `ativa`:

- calcula o horizonte (seção 4);
- cria a ocorrência que falta, com aviso e lembrete do criador;
- não mexe em doc existente;
- não cria ymd de `excecoes`.

Série pausada ou encerrada é ignorada. A rota devolve `{ series, criadas }`.

Scheduler no console (não é código): todo dia 06:10 `America/Sao_Paulo`, POST nessa rota. Enquanto o job não existe, criar e retomar a série já deixam as quatro datas no ar.

---

## 8. Telas

Sem mock novo. A tela reusa o formulário de `/criar-evento` e os tokens do cadastro (SPEC 022): coluna única, max-width 560 px, chips pill, CTA laranja.

### 8.1 Cadastro

No formulário, acima da data, um interruptor **Toda semana**.

Desligado: o POST atual, um evento, uma data. Nada desta spec.

Ligado:

- Some o par de datas do evento avulso.
- Entram 7 chips: Dom Seg Ter Qua Qui Sex Sáb. Um obrigatório.
- Ficam hora de abertura e hora de encerramento. Encerramento passa a ser obrigatório.
- Campo opcional **A partir de** (data). Vazio = próxima ocorrência a partir de agora. Preenchido, o dia da semana tem de bater com o chip.
- O restante (nome, tipo, ponto, acesso, atrações, flyer, recados) é o mesmo.
- CTA **Publicar encontro**. Sucesso vai para `/series-evento/:id`.

### 8.2 `/series-evento`

Só admin. Lista as séries: título, rótulo, status, próxima data. Ações em cada linha: abrir, pausar ou retomar, encerrar. Encerrar pede confirmação numa modal Layer 2 (`surface-container-high`, borda laranja suave), no espírito da modal de excluir conta.

Entrada: link **Encontros semanais** no cabeçalho de `/criar-evento`, visível para admin. O `+` do dock não ganha item.

### 8.3 Detalhe da série

`/series-evento/:id`. Mostra a regra e as ocorrências do horizonte que existem (data, cancelada ou não, se alguém se inscreveu). Ações:

- **Pular esta data** — pede o ymd (default a próxima) e chama a rota de exceção.
- **Editar o rito** — o mesmo formulário do cadastro, `PUT`. Texto de apoio: “Vale para as próximas quartas em que ninguém se inscreveu.”
- **Encerrar encontro**.

### 8.4 Detalhe do evento, admin, com `serieId`

Bloco curto no fim do detalhe, só para admin:

- **Ajustar só esta data** — data/hora (e título e recados, se o admin mudar). Deixa claro que a outra semana não muda.
- **Ver o encontro semanal** — vai para `/series-evento/:id`.

Piloto vê o chip e, se `cancelada`, a faixa **Esta data foi cancelada** no lugar da inscrição. O convite público usa a mesma faixa.

---

## 9. Critérios de aceite

### RS1 — calendário e dedupe

- [ ] Quarta 10:00 inclui hoje; quarta depois do fim empurra para a outra semana.
- [ ] Fim ≤ abertura cai no dia seguinte; duração ≥ 24 h é rejeitada na lib.
- [ ] Exceção não consome vaga: 4 datas sobram além do ymd pulado.
- [ ] Dedupe: avulso intacto; série fica com a ao vivo; sem ao vivo, fica a abertura menor; cancelada sai antes do grupo.
- [ ] Rótulos `toda quarta` e `todo domingo`.

### RS2 — criar a série

- [ ] Admin cria “Velharia, quarta, 19:30–23:00” e nascem 4 `eventos` com ids estáveis.
- [ ] Repetir a geração não duplica.
- [ ] Piloto recebe 403. Corpo inválido recebe 400.
- [ ] Cada ocorrência tem aviso 24 h e lembrete 2 h do criador.
- [ ] `localId` da Velharia vai para a ocorrência.

### RS3 — vida da série

- [ ] Cron (ou a rota interna com o header) cria a 5ª quando a 1ª já encerrou, e não cria na série pausada.
- [ ] Pular uma quarta livre apaga o doc. Pular uma com inscrição marca `cancelada`, cancela as tasks e a inscrição nova responde 400.
- [ ] `PUT` do horário muda a livre e não muda a que tem inscrição nem a `ocorrenciaAjustada`.
- [ ] Ajustar uma data reagenda as tasks daquela ocorrência.
- [ ] Encerrar impede retomar.
- [ ] Header do cron ausente ou errado: 404.

### RS4 — feed

- [ ] Aba Eventos mostra um card da Velharia, com chip “toda quarta” e a data da ocorrência escolhida.
- [ ] As outras três não aparecem. Um track day avulso no meio continua aparecendo.
- [ ] `GET /feed/contagens` bate com a quantidade de cards.
- [ ] Filtro “hoje” fora da quarta não inclui a série. No horário do encontro, o card é o ao vivo.
- [ ] Garagem do inscrito numa data cancelada mostra **Cancelado** e não oferece Avaliar.

### RS5 — telas

- [ ] Interruptor desligado publica um evento avulso, como hoje.
- [ ] Interruptor ligado publica a série e abre o detalhe dela.
- [ ] Admin pausa, pula uma data e encerra por essa tela.
- [ ] No detalhe da ocorrência, “Ajustar só esta data” não altera a série.
- [ ] Piloto não vê as rotas admin (redirect, como `/criar-evento`).

---

## 10. Ordem

RS1 → RS2 → RS3 → RS4 → RS5. RS4 pode ir junto de RS2 se o feed sem dedupe chegar a mostrar quatro Velharias; não soltar RS2 em produção sem RS4.
