# SPEC 056 — Conquistas de rota

> **Status:** Proposta
> **Autor:** Assistente IA
> **Data:** 2026-11-11
> **Origem:** carimbo no perfil quando o piloto passa num ponto famoso gravando o passeio; a velocidade máxima da passagem fica só para ele
> **Padrões:** Next.js 15 App Router — skill `nextjs-patterns`; visual — skill `desenvolvimento-design`
> **Backend:** Cloud Function `api` — catálogo em `/conquistas`; concessão no `POST /telemetria` que já existe
> **Coleções:** `conquistas` (**nova**), `usersconquista` (**nova**)
> **Depende de:** SPEC 030 / 041 / 043 (gravação nativa, buffer e save offline), SPEC 025 / 036 (perfil), SPEC 032 / 051 (mapa do Sul na criação), SPEC 039 (`DELETE /perfil`), SPEC 044 (selos de local — faixa vizinha, outro significado)
> **QA:** IDs **CQ1**–**CQ5**, um PR por ID

A conquista é um pino com um círculo. Quem grava o rolê e cruza esse círculo carimba o perfil. A primeira passagem cria o carimbo. As seguintes só sobem a velocidade se ela for maior.

---

## 1. Objetivo

O piloto que passa na Serra do Rio do Rastro, na Serra do Corvo Branco ou no Morro da Igreja — ou num ponto que o administrador cadastrar depois — ganha um carimbo no perfil. A prova é o passeio gravado. O servidor mede a velocidade nos pontos de dentro do círculo e guarda a maior.

| ID | Entrega | Camada |
|----|---------|--------|
| **CQ1** | Regra da passagem: círculo, trecho contínuo, 50 m, velocidade com a função que a telemetria já usa | Back (lib pura) |
| **CQ2** | Catálogo, seed dos três pontos, cadastro do admin | Back |
| **CQ3** | Concessão no `POST /telemetria`: cria o carimbo ou sobe o recorde | Back |
| **CQ4** | Faixa no perfil. Velocidade só no próprio. Limpeza ao excluir a conta | Back + front do perfil |
| **CQ5** | Item no `+`, tela com mapa e círculo, amostra cortada no `stop()` da gravação | Front + adapter nativo |

---

## 2. Recorte

### 2.1 O que entra

- Três conquistas iniciais, editáveis: Serra do Rio do Rastro, Serra do Corvo Branco, Morro da Igreja.
- Tela **Cadastrar Conquistas**, só administrador, aberta pelo `+` do dock. Mapa com pino e círculo. Criar, editar e arquivar.
- Catálogo ativo baixado pelo app e guardado no aparelho, para a serra sem sinal.
- No encerramento da gravação nativa, um recorte dos pontos que caíram dentro de cada círculo vai no resumo pendente e no `POST /telemetria`.
- O servidor refaz a conta. A primeira passagem cria o carimbo. Passagem mais rápida atualiza a velocidade. Passagem igual ou mais lenta não escreve.
- Faixa **Conquistas** no perfil, separada de **Paradas**. No próprio perfil, nome e velocidade. No perfil público, só o nome.
- `DELETE /perfil` apaga os carimbos daquele uid.

### 2.2 O que não entra

| Item | Motivo |
|------|--------|
| GPS sempre ligado, geofence em segundo plano, carimbo sem gravar | A prova é a sessão da telemetria. O app não rastreia o piloto o dia inteiro |
| Corredor ao longo da estrada | O lugar é um pino. Passar no círculo basta; não é preciso vencer a serra inteira |
| Subida e descida como conquistas diferentes | Uma conquista por lugar, qualquer sentido |
| Ranking, nível, XP, bronze/prata/ouro, push | A velocidade é memória do próprio piloto, não desafio |
| Velocidade no perfil público, no feed ou no detalhe do passeio alheio | Dado sensível. O JSON público não leva o número |
| Histórico de passagens, data no chip, link para a telemetria | O chip é o nome (e, no próprio perfil, a máxima atual) |
| Check-in manual neste fluxo | “Estou aqui” continua sendo a SPEC 044 |
| Apagar conquista | Arquivar para de conceder. Quem já carimbou mantém o nome |
| Carimbo pela PWA | O adapter web recusa a gravação. Sem buffer, sem amostra, sem carimbo |
| Foto, descrição, horário de funcionamento | O cadastro é nome, pino e raio |

### 2.3 Não misturar

| Feature | Significado |
|---------|-------------|
| Selo / Parada (SPEC 044) | Estive neste local do catálogo, por check-in manual |
| Conquista | Passei neste pino enquanto gravava o rolê |
| Telemetria (SPEC 030) | O passeio em si. Pode ser privado e ainda assim carimbar |
| Favorito | Quero este ponto |

Descartar o passeio não chama o `POST`. Não carimba.

Um passeio privado carimba do mesmo jeito. O perfil público mostra o nome da conquista e continua sem abrir o traçado.

### 2.4 Decisões travadas

| Decisão | Escolha |
|---------|---------|
| Gatilho | `stop()` do adapter nativo, com o buffer ainda na memória. O `POST /telemetria` é quem concede |
| Forma | Pino + círculo. Raio default **500 m**, mínimo **150 m**, máximo **2.000 m**, passo **50 m** |
| O que é “passar” | Um trecho contínuo dentro do círculo com pelo menos **50 m** aceitos pela mesma função de métricas da telemetria |
| Buraco | Intervalo maior que **10 s** entre dois pontos quebra o trecho. Os lados não se somam |
| Velocidade | `velocidadeMaxKmh` de `processarPontos` nesse trecho. Pico isolado não vira recorde, como na gravação |
| Vários trechos no mesmo passeio, mesmo pino | Vale o de maior velocidade confirmada |
| Vários pinos no mesmo passeio | Cada um é avaliado. O corpo leva no máximo **6** amostras, as de maior distância aceita dentro do círculo |
| Pontos por amostra | No máximo **120**. Se o trecho for maior, a redução reparte o tempo em 120 baldes e fica, em cada balde, o ponto de maior `speed` |
| Quem decide | O servidor. O número que o aparelho calculou não vai no body |
| Primeira vez | Cria o doc mesmo com velocidade 0 |
| De novo | Atualiza se a nova máxima, com uma casa, for maior. Igual ou menor: não escreve |
| Sentido | Ignorado |
| Onde a velocidade aparece | `GET /perfil` apenas. `GET /usuarios/:uid` nunca devolve o número, inclusive quando o uid é o do token |
| Passeio sem traçado | Não concede. Passeio antigo, anterior a esta spec, não é reprocessado |
| Falha da concessão | O passeio grava assim mesmo. A resposta traz `conquistas: []` e a function loga o erro |
| Body malformado em `amostras` | Ignora as amostras e responde 201 do passeio. Não vira 400 |
| Catálogo vazio no aparelho | O passeio salva sem amostras. Sem segunda chance: o buffer é apagado no `stop()` |
| Cliente Firestore | Continua deny-all. Escrita só pela function |

---

## 3. Dados

### 3.1 Coleção `conquistas`

Id estável. Os três iniciais usam os ids abaixo. As próximas usam id automático.

```
{
  id: string,
  nome: string,             // 3..48, trim
  lat: number,
  lng: number,
  raioMetros: number,       // 150..2000, inteiro, múltiplo de 50
  ativa: boolean,
  criadorId: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

`criadorId` não sai na API. Arquivar grava `ativa: false` e atualiza `updatedAt`. O pino e o raio podem mudar depois; carimbos já dados não são revistos.

Nome comparado sem acento e em minúsculas. Outro doc com o mesmo nome normalizado responde 409, esteja arquivado ou não.

O pino tem de cair no retângulo da SPEC 032 (`pontoEstaNoSul`: lat −34..−22, lng −57,5..−48). Fora isso, 400 com `Só cadastramos pontos em SC, PR e RS`.

### 3.2 Coleção `usersconquista`

Id `{usuarioId}_{conquistaId}`. Um doc por par.

```
{
  id: string,
  usuarioId: string,
  conquistaId: string,
  velocidadeMaxKmh: number,    // uma casa; interno no perfil público
  telemetriaId: string,        // passeio que gravou a máxima atual; não sai na API
  primeiraVezEm: timestamp,    // não muda na atualização do recorde
  recordeEm: timestamp,        // nasce igual a primeiraVezEm; muda quando a velocidade sobe
  createdAt: timestamp,
  updatedAt: timestamp
}
```

`usuarioId` vem do token. `telemetriaId` é o id recém-criado no mesmo `POST`. Timestamps só no servidor.

### 3.3 Índices

Consulta por `usuarioId` na coleção `usersconquista`. O índice simples do Firestore basta. A lista cabe em memória (um doc por pino). Sem índice composto.

`conquistas` é catálogo curto: leitura da coleção inteira e filtro `ativa` na function.

### 3.4 Três pontos iniciais

`garantirConquistasIniciais()` cria o doc **só se o id não existe**. Se o admin já moveu o pino, a função não sobrescreve. Ela roda no `GET /conquistas` administrativo (a lista da tela). O piloto não dispara seed.

| Id | Nome | Pino inicial | O que o pino marca | Raio |
|----|------|--------------|--------------------|------|
| `serra-rio-do-rastro` | Serra do Rio do Rastro | −28.3990, −49.5478 | Mirante, Bom Jardim da Serra | 500 m |
| `serra-corvo-branco` | Serra do Corvo Branco | −28.0574, −49.3667 | Corte da serra, entre Grão Pará e Urubici | 500 m |
| `morro-da-igreja` | Morro da Igreja | −28.1258, −49.4808 | Cume, Urubici | 500 m |

Os três nascem `ativa: true`. O admin arrasta o pino e o círculo se a passagem real ficar fora.

---

## 4. Regra da passagem

Lib pura em `functions/src/lib/passagem-conquista.ts`. Sem Firestore. CQ1 cobre os casos. A função de velocidade é a que já está em `functions/src/lib/calcular-metricas-telemetria.ts` (`processarPontos`). Não duplicar o filtro de pico, de accuracy nem de teto.

Entrada:

```
{
  tracado: string,                  // polyline precisão 5, a mesma do passeio
  iniciadoEmMs: number,
  encerradoEmMs: number,
  conquistas: { id, lat, lng, raioMetros }[],
  amostras: { conquistaId: string, pontos: PontoGps[] }[]
}
```

`PontoGps` é o mesmo tipo da telemetria: `lat`, `lng`, `t` (epoch ms), `speed` em m/s, `accuracy` em metros, `provider` opcional. `speed` nulo é permitido.

Para cada conquista ativa citada numa amostra:

1. Descartar a amostra se o id não está no catálogo recebido.
2. Decodificar `tracado`. Sem pelo menos dois vértices, a conquista não sai.
3. O traçado precisa passar pela área: algum vértice, ou o ponto mais próximo de algum segmento, a até `raioMetros + 80` do pino. Os 80 m cobrem a simplificação do polyline (a tolerância inicial da gravação é 8 m e só cresce em passeio enorme). Fora isso, a amostra não concede — os pontos não pertencem a este traçado.
4. Ficar só com pontos cuja distância haversine ao pino é `≤ raioMetros`, com `t` dentro de `[iniciadoEmMs − 120_000, encerradoEmMs + 120_000]`. O resto sai.
5. Ordenar por `t`. Quebrar o trecho quando a diferença para o ponto seguinte é `> 10_000` ms.
6. Em cada trecho, rodar `processarPontos`. A distância que conta é a que essa função acumulou. Trecho com menos de **0,05 km** não vale.
7. A velocidade do trecho é o `velocidadeMaxKmh` devolvido. Entre os trechos que passaram, fica o maior.
8. Uma casa decimal (`Math.round(n * 10) / 10`).

Saída: `{ conquistaId, velocidadeMaxKmh }[]`, só as que passaram. A lib não lê recorde anterior e não escreve banco.

O aparelho usa uma lib irmã, `src/lib/telemetria/amostras-conquista.ts`, só para **escolher** os pontos que vão no body. Ela não concede. Para cada pino do cache, fica a sequência contínua dentro do círculo com maior distância aceita, reduzida a 120 pontos. No máximo 6 pinos, os de maior distância. Ponto com `accuracy` ausente ou maior que 100 m nem entra na amostra.

Redução, quando o trecho tem mais de 120 pontos: o intervalo do primeiro ao último `t` é dividido em 120 baldes iguais. De cada balde sai o ponto de maior `speed` (nulo conta como −1). A ordem de tempo se mantém.

---

## 5. API do catálogo

Router novo `conquistasRouter`, `app.use("/conquistas", conquistasRouter)`, com `autenticar` e o `rateLimitAutenticado` já usado (120/min por uid). Escrita passa por `exigirAdmin` (`users.admin === true`), o mesmo middleware de evento e local.

### 5.1 `GET /conquistas`

Qualquer autenticado. Só ativas. Serve o cache do aparelho.

```
{
  itens: {
    id: string,
    nome: string,
    lat: number,
    lng: number,
    raioMetros: number
  }[]
}
```

Sem `criadorId`, sem `ativa`, sem velocidade. Ordem: `nome` normalizado.

### 5.2 `GET /conquistas/admin`

`exigirAdmin`. Roda o seed da seção 3.4. Devolve ativas e arquivadas.

```
{
  itens: {
    id: string,
    nome: string,
    lat: number,
    lng: number,
    raioMetros: number,
    ativa: boolean
  }[]
}
```

A rota `/conquistas/admin` é registrada **antes** de `/:id`, se `/:id` existir. Nesta spec o admin edita pelo id no `PATCH`, e a lista basta; não há `GET /:id`.

### 5.3 `POST /conquistas`

`exigirAdmin`. Body: `{ nome, lat, lng, raioMetros }`.

| Caso | Resposta |
|------|----------|
| Sem token | 401 |
| Autenticado sem `admin` | 403 `Apenas administradores` |
| Nome, coordenada, raio ou pino fora do Sul | 400 com a mensagem do campo |
| Nome normalizado já usado | 409 `Já existe uma conquista com esse nome` |
| Válido | 201 com o item da lista admin (`ativa: true`) |

`criadorId` é o uid do token.

### 5.4 `PATCH /conquistas/:id`

`exigirAdmin`. Body parcial: qualquer combinação de `nome`, `lat`, `lng`, `raioMetros`, `ativa`.

| Caso | Resposta |
|------|----------|
| Id inexistente | 404 `Conquista não encontrada` |
| Nome batendo com outro doc | 409 |
| Campo inválido | 400 |
| Válido | 200 com o item |

`ativa: false` arquiva. `ativa: true` republica. Não há `DELETE`.

Arquivar não altera `usersconquista`. Republicar não apaga recordes. Mudar o pino não reprocessa passeios antigos: só os `POST /telemetria` daí em diante usam a geometria nova.

---

## 6. Concessão no `POST /telemetria`

O body atual da SPEC 030 ganha um campo opcional. Cliente antigo continua 201.

```
amostras?: {
  conquistaId: string,
  pontos: {
    lat: number,
    lng: number,
    t: number,
    speed: number | null,
    accuracy: number | null,
    provider?: string | null
  }[]
}[]
```

Limites aceitos pela rota, acima dos quais o excedente é cortado e o passeio segue:

| Limite | Valor |
|--------|--------|
| Amostras | 6 |
| Pontos em cada amostra | 120 |
| `provider` | até 16 caracteres; senão `null` |

Fora de tipo (amostra que não é objeto, `t` que não é número) aquele pedaço é ignorado.

Ordem na rota:

1. Validar e gravar a telemetria como hoje. Isso já responde o contrato antigo.
2. Se `amostras` veio e o `tracado` salvo tem pelo menos dois vértices, carregar as conquistas **ativas** cujos ids aparecem nas amostras.
3. Rodar a lib da seção 4.
4. Para cada resultado, na mesma transação por par:
   - sem doc: criar `usersconquista/{uid}_{conquistaId}` com a velocidade, `telemetriaId`, `primeiraVezEm = recordeEm = now`;
   - doc existente e velocidade nova maior na casa decimal: atualizar `velocidadeMaxKmh`, `telemetriaId`, `recordeEm`, `updatedAt`;
   - doc existente e velocidade nova menor ou igual: não escrever.
5. Exceção nesse passo não muda o 201. Log `Conquista` com o id da telemetria. `conquistas` na resposta fica `[]`.

Resposta 201 passa a incluir, além do documento da telemetria:

```
conquistas: {
  id: string,
  nome: string,
  velocidadeMaxKmh: number,
  novidade: "primeira" | "recorde"
}[]
```

Só entram pinos que criaram doc ou subiram recorde. Passagem que não bate o recorde não aparece. A velocidade aqui é a do próprio piloto, na hora em que ele salvou o passeio dele.

O sync offline (SPEC 043) manda o mesmo body quando a rede volta. O resumo pendente precisa já conter `amostras`, porque o buffer nativo é limpo no fim do `stop()`.

---

## 7. Perfil

### 7.1 `GET /perfil`

Campo novo, junto de `selos`:

```
conquistas: {
  id: string,
  nome: string,
  velocidadeMaxKmh: number
}[]
```

`id` é o da conquista. Nome lido do doc `conquistas` na hora (se o admin renomeou, o chip acompanha). Conquista sumida do catálogo sai da lista. Arquivada continua, com o nome atual.

Ordem: `primeiraVezEm` crescente. Sem data no JSON do perfil — a ordem já nasce pronta. Sem `telemetriaId`.

Lista vazia: `[]`.

### 7.2 `GET /usuarios/:uid`

```
conquistas: { id: string, nome: string }[]
```

Mesma ordem e a mesma regra de nome. Sem `velocidadeMaxKmh`. Vale também quando `:uid` é o uid do token: a tela `/perfil/[uid]` é a visão pública.

### 7.3 Faixa

Componente ao lado de `FaixaSelos`, no cartão do perfil próprio e do público. Rótulo **Conquistas**. Ícone `military_tech`. Chip não é link.

- Próprio (`/perfil`): `Serra do Rio do Rastro` e, na mesma linha, `72 km/h` ou `72,5 km/h` (uma casa, vírgula, sufixo só quando o número não é inteiro no texto — `72 km/h` sem decimal).
- Público: só o nome.
- Até 4 visíveis; o restante abre com **Ver conquistas**, no mesmo gesto de **Ver selos**.
- Lista vazia: a faixa não renderiza.

390 px: o chip quebra o nome em uma linha e não empurra a ficha para fora.

### 7.4 Excluir a conta

`DELETE /perfil` apaga os docs de `usersconquista` com aquele `usuarioId`, no mesmo ponto em que a SPEC 053 limpa `usersseguir`. Falha nessa limpeza não impede o 204. A coleção `conquistas` permanece.

---

## 8. Aparelho

### 8.1 Cache do catálogo

`GET /conquistas` ao abrir o app com rede e de novo no `start()` da gravação, se houver rede. O JSON fica nas Preferences. Sem rede, usa o que já está salvo. Cache ausente: `amostras` vazia, gravação normal.

O cache guarda só o que o `GET` devolve (id, nome, lat, lng, raio). Não guarda velocidade de ninguém.

### 8.2 Onde a amostra nasce

Em `telemetria-gps.native.ts`, no `stop()`, **depois** de `telemetriaBuffer.listar()` e **antes** de `limparBufferNativo()`.

A lib de amostra lê o cache e o buffer e devolve `amostras`. Isso entra em `montarDados` / no resumo pendente (`RoleTelemetriaCreate`). Descartar limpa o resumo e não envia nada.

O toast de conquista, se a tela de resumo ainda estiver aberta quando o 201 chegar, lê `conquistas` da resposta: “Você conquistou {nome}” na primeira vez, “Recorde em {nome}: {velocidade}” quando `novidade` é `recorde`. Sync em silêncio não precisa de toast: o perfil é a superfície permanente. Não afirmar a conquista antes do 201.

---

## 9. Tela do administrador

Item novo em `ITENS_MENU_INCLUIR`, `soAdmin: true`, ao lado de Evento e Local:

| Campo | Valor |
|-------|--------|
| `id` | `conquista` |
| `href` | `/conquistas` |
| ícone | `military_tech` |
| título | Cadastrar Conquistas |
| subtítulo | Pontos que carimbam o perfil |

`/conquistas` usa a mesma guarda de `/criar-evento`: perfil carregado e sem `admin` volta para `/`. A function responde 403 de qualquer forma.

A tela lista os itens de `GET /conquistas/admin`. Arquivada aparece esmaecida, com o rótulo **Arquivada**.

**Nova conquista** abre o formulário na mesma rota, em modo criação. Tocar um item abre a edição. Campos:

- Nome.
- Mapa: o `MapaSelecaoLocal` desta tela ganha a prop opcional `raioMetros`. Com a prop, desenha o círculo em metros ao redor do pino, no basemap que estiver ativo (Google ou Leaflet, SPEC 051). Sem a prop, rolê, evento e local ficam como estão.
- Controle do raio, 150–2000, passo 50, valor inicial 500. O círculo acompanha na hora.
- Toque e arraste continuam no recorte do Sul. Fora do Sul, a mesma frase do cadastro de local e o salvar fica desabilitado.

Salvar chama `POST` ou `PATCH`. Na edição, **Arquivar** pede confirmação de uma linha (“Este ponto deixa de carimbar. Quem já tem a conquista mantém.”) e manda `ativa: false`. Se já está arquivada, o botão é **Publicar de novo**.

Não há busca de endereço obrigatória. O pino é o dado. Nome e pino dentro do Sul e raio válido habilitam salvar.

---

## 10. Critérios de aceite

### CQ1 — regra da passagem

- [ ] Ponto a 400 m de um pino com raio 500 entra; ponto a 600 m sai.
- [ ] Trecho contínuo de 60 m aceitos concede; trecho de 40 m não concede.
- [ ] Dois grupos dentro do círculo, separados por 11 s, não somam os metros. Cada um é julgado sozinho.
- [ ] Um pico isolado de velocidade não vira a máxima, no mesmo caso que `calcular-metricas-telemetria` já cobre.
- [ ] Traçado cujo ponto mais próximo está a `raio + 81` m não concede, mesmo com amostra dentro do círculo.
- [ ] Ponto da amostra fora do círculo é descartado antes da conta.
- [ ] Dois trechos válidos no mesmo pino: sai a maior velocidade, com uma casa.

### CQ2 — catálogo

- [ ] `GET /conquistas/admin` na base vazia cria os três ids da seção 3.4 e não os recria na segunda chamada.
- [ ] `GET /conquistas` de um piloto devolve só os três ativos, sem `ativa` e sem `criadorId`.
- [ ] `POST` sem admin responde 403. Nome repetido, raio 100, raio 2050 e pino fora do Sul respondem 400 ou 409 como a seção 5.
- [ ] `PATCH` move o pino e o raio. `ativa: false` tira o item do `GET` do piloto e mantém no `GET` admin.
- [ ] Não existe rota de delete.

### CQ3 — concessão

- [ ] `POST /telemetria` sem `amostras` responde 201 como hoje, com `conquistas: []`.
- [ ] Amostra que a lib aceita, sem doc prévio, cria `usersconquista/{uid}_{id}`, grava a velocidade com uma casa e devolve `novidade: "primeira"`.
- [ ] Segunda passagem mais rápida atualiza velocidade, `telemetriaId` e `recordeEm`, mantém `primeiraVezEm` e devolve `recorde`.
- [ ] Passagem igual ou mais lenta responde 201 com `conquistas: []` e o doc não muda.
- [ ] Conquista arquivada, id inventado ou traçado vazio não criam doc.
- [ ] `amostras` com tipo errado não derruba o 201 do passeio.
- [ ] Exceção forçada na concessão ainda devolve 201 da telemetria e `conquistas: []`.

### CQ4 — perfil e conta

- [ ] `GET /perfil` traz `conquistas` com `velocidadeMaxKmh`. `GET /usuarios/:uid` traz nome e id, sem velocidade, mesmo com o token do próprio uid.
- [ ] Renomear a conquista muda o nome nas duas leituras. Arquivar não tira o carimbo de quem já tem.
- [ ] No `/perfil`, o chip mostra o nome e a velocidade. No `/perfil/[uid]`, só o nome. Lista vazia não desenha a faixa.
- [ ] Com 5 conquistas, aparecem 4 e o botão **Ver conquistas**.
- [ ] `DELETE /perfil` remove os docs daquele uid. Falha nessa limpeza ainda responde 204.

### CQ5 — dock, mapa e gravação

- [ ] O `+` do admin mostra **Cadastrar Conquistas**. O piloto comum não vê o item. Abrir `/conquistas` sem admin volta para `/`.
- [ ] O círculo acompanha o slider e o arraste do pino. Salvar persiste nome, coordenada e raio. Arquivar pede confirmação.
- [ ] Mapa de criar rolê, evento e local não ganha círculo.
- [ ] No `stop()` nativo, o resumo pendente leva `amostras` cortadas pelo cache. Cache vazio gera lista vazia e o passeio ainda finaliza.
- [ ] Descartar não envia `POST`.
- [ ] Com a tela de resumo aberta, o 201 com `primeira` ou `recorde` mostra a frase da seção 8.2.
- [ ] 390 px: a lista admin e o chip do perfil cabem na largura.

---

## 11. Ordem

CQ1 → CQ2 → CQ3 → CQ4 → CQ5.

CQ3 depende da lib e do catálogo. CQ4 lê os docs que CQ3 grava. CQ5 pode fechar a tela de admin em cima de CQ2 e a amostra em cima do contrato de CQ3.

---

## 12. Arquivos previstos

| Arquivo | Ação |
|---------|------|
| `functions/src/lib/passagem-conquista.ts` | Novo — regra da seção 4 |
| `functions/src/lib/passagem-conquista.test.ts` | Novo — CQ1 |
| `functions/src/lib/conquistas-iniciais.ts` | Novo — os três pinos e `garantirConquistasIniciais` |
| `functions/src/types/conquista.ts` | Novo |
| `functions/src/repositories/interfaces/conquista.repository.ts` | Novo |
| `functions/src/repositories/firestore/firestore-conquista.repository.ts` | Novo |
| `functions/src/repositories/index.ts` | Alterar — factory |
| `functions/src/routes/conquistas.ts` | Novo |
| `functions/src/index.ts` | Alterar — `app.use("/conquistas", …)` |
| `functions/src/lib/role-telemetria.ts` | Alterar — `amostras` opcional |
| `functions/src/routes/telemetria.ts` | Alterar — concessão depois do create |
| `functions/src/routes/perfil.ts` | Alterar — faixa no próprio, no público e limpeza no DELETE |
| `functions/src/types/usuario.ts` | Alterar — DTO com e sem velocidade |
| `src/lib/telemetria/amostras-conquista.ts` | Novo — corte da amostra |
| `src/lib/telemetria/amostras-conquista.test.ts` | Novo — 120 pontos, 6 pinos, accuracy |
| `src/lib/telemetria/telemetria-gps.native.ts` | Alterar — amostra no `stop()`, antes de limpar o buffer |
| `src/types/role-telemetria.ts` | Alterar — `amostras` no create |
| `src/components/maps/MapaSelecaoLocal.tsx` | Alterar — círculo opcional |
| `src/components/menu-inferior/itens-menu-incluir.ts` | Alterar — item admin |
| `src/app/(app)/conquistas/` | Novo — lista, formulário, guarda |
| `src/app/(app)/perfil/[uid]/components/FaixaConquistas.tsx` | Novo |
| `src/app/(app)/perfil/[uid]/components/CartaoPiloto.tsx` | Alterar — faixa |
| `src/types/perfil-publico.ts` | Alterar |

A rota não importa Firestore. A transação do par uid+conquista fica no repositório.
