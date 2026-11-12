# SPEC 058 — Medalha no mapa e ranking entre quem eu sigo

> **Status:** Proposta
> **Autor:** Assistente IA
> **Data:** 2026-11-11
> **Origem:** medalha no traçado do passeio, no gesto do Strava; placar só com quem o piloto segue
> **Padrões:** Next.js 15 App Router — skill `nextjs-patterns`; visual — skill `desenvolvimento-design`
> **Backend:** Cloud Function `api` — medalhas no `POST /telemetria` e no `GET /telemetria/:id`; ranking em `/conquistas/:id/ranking`
> **Coleções:** `rolestelemetria` ganha `medalhas`. `conquistas` e `usersconquista` continuam as da SPEC 056. `usersseguir` continua a da SPEC 053
> **Depende de:** SPEC 056 (conquista, concessão, perfil), SPEC 030 (detalhe do passeio e mapa), SPEC 053 (seguir, um sentido), SPEC 051 (mapa Google ou livre)
> **QA:** IDs **MD1**–**MD3** e **RK1**–**RK2**, um PR por ID

A medalha nasce no passeio que cruzou o pino e fica em cima do mapa daquele passeio. O placar compara a velocidade máxima de cada um, e só entra quem o piloto segue, mais ele mesmo.

Esta spec revoga dois recortes da SPEC 056 §2.2: “Ranking, nível, XP, bronze/prata/ouro, push” e a frase que deixa a velocidade fora de qualquer JSON que não seja o `GET /perfil`. O que continua valendo está na seção 2.3.

---

## 1. Objetivo

Quem gravou o rolê e cruzou uma conquista vê a medalha no mapa daquele passeio. Quem quer comparar abre o placar daquele pino e vê a própria velocidade ao lado da velocidade de quem segue.

| ID | Entrega | Camada |
|----|---------|--------|
| **MD1** | Gravar em `rolestelemetria.medalhas` toda passagem aceita, inclusive a que não sobe o recorde | Back |
| **MD2** | `GET /telemetria/:id` devolve a medalha; a velocidade da passagem só para o dono | Back |
| **MD3** | Medalha no mapa do detalhe, com folha ao toque | Front |
| **RK1** | `GET /conquistas/:id/ranking` — o token e quem ele segue | Back |
| **RK2** | Lista de pontos e placar, abertos pelo próprio perfil e pela medalha | Front |

---

## 2. Recorte

### 2.1 O que entra

- No `POST /telemetria`, depois da concessão da SPEC 056, o passeio ganha a lista das passagens que a lib aceitou. Primeira vez, recorde e passagem que não bate o recorde entram do mesmo jeito.
- No detalhe `/telemetria/[id]`, cada medalha é um pino `military_tech` na coordenada gravada, por cima do traçado. Primeira vez e recorde usam o laranja. Passagem comum usa o contorno.
- Toque na medalha abre a folha com o nome. No próprio passeio, a folha também mostra a velocidade daquela passagem. Nos dois casos, a folha tem **Ver ranking**.
- Tela **Ranking** no próprio perfil. A lista são os pinos ativos. Cada um abre o placar daquele pino.
- O placar ordena por velocidade. Entram o piloto do token e as pessoas que ele segue e que já carimbaram o pino. A velocidade desses uids aparece nessa resposta.

### 2.2 O que não entra

| Item | Motivo |
|------|--------|
| Placar aberto para qualquer piloto, feed, ou perfil público | O combinado é a roda de quem eu sigo |
| Bronze, prata, ouro, XP, nível | A medalha do mapa é uma só. O número do placar é a posição |
| Push quando alguém passa a sua velocidade | O placar é consulta. Ninguém é avisado |
| Reprocessar passeio antigo | Sem `medalhas` no doc, o mapa não inventa pino. A SPEC 056 já não reprocessa |
| Velocidade da passagem no perfil público, no feed, na lista `GET /telemetria` ou na imagem de compartilhar | Continua dado do dono, fora desta superfície |
| Apagar o carimbo quando o passeio é apagado | `DELETE /telemetria/:id` não mexe em `usersconquista`. A medalha some porque o doc do passeio some |
| Histórico de todas as passagens de um pino | O placar usa a máxima que o carimbo já guarda. A medalha guarda a velocidade daquele passeio |
| Corredor ao longo da estrada | O lugar continua o círculo da SPEC 056. O placar é “quem passou mais rápido por este círculo” |
| Ranking de quantidade de carimbos | A disputa é a velocidade no pino, dentro da roda |

### 2.3 O que a SPEC 056 mantém

| Regra | Onde continua |
|-------|----------------|
| `GET /perfil` traz a velocidade. `GET /usuarios/:uid` não traz, nem quando o uid é o do token | SPEC 056 §7 |
| Chip do perfil público é só o nome, e não é link | Esta spec não muda `/perfil/[uid]` |
| Toast do 201 só para `primeira` e `recorde` | SPEC 056 §8.2. Passagem que não sobe o recorde não entra em `conquistas` |
| Passeio privado continua 404 para quem não é o dono | `GET /telemetria/:id` |
| Arquivar para de conceder e não apaga carimbo | SPEC 056 |

### 2.4 Decisões travadas

| Decisão | Escolha |
|---------|---------|
| Onde a medalha mora | Campo `medalhas` no doc do passeio, escrito no mesmo `POST` que concede |
| O que conta como medalha | Toda passagem que `avaliarPassagens` devolve, não só a que cria ou sobe o carimbo |
| Velocidade na medalha | A máxima daquele passeio naquele círculo, uma casa. Não é a máxima vitalícia se este passeio foi mais lento |
| Coordenada | `lat` e `lng` do catálogo na hora do `POST`. Mover o pino depois não muda a medalha já gravada |
| Nome na medalha | Nome do catálogo na hora do `POST`. Renomear depois não reescreve o passeio |
| Destaque | `primeira` e `recorde` no laranja. `passagem` no contorno |
| Quem vê a velocidade da medalha | Só o `usuarioId` do passeio |
| Quem vê o pino | Quem já pode abrir o passeio |
| Quem entra no placar | O uid do token, mais os uids que ele segue |
| Quem não segue de volta | Seguir é um sentido. Eu vejo a velocidade de quem eu sigo. Essa pessoa só vê a minha se me seguir |
| Quem segue e não carimbou | Não aparece |
| Eu, sem carimbo | Última linha, sem posição e sem número |
| Empate na mesma casa decimal | Quem tem `recordeEm` mais antigo fica na frente. Persistindo o empate, o uid em ordem crescente |
| Teto da roda | 100 seguidos mais recentes (`createdAt` desc). O próprio uid não entra nessa conta |
| Passeio anterior a esta spec | `medalhas` ausente lê como `[]` |
| Falha ao gravar `medalhas` | O 201 do passeio se mantém. A concessão da SPEC 056 não é desfeita. O log é `Medalha` com o id da telemetria. O campo fica `[]` |
| Cliente Firestore | Continua deny-all |

---

## 3. Dados

### 3.1 `rolestelemetria.medalhas`

Array no doc que o `POST /telemetria` já cria. Ausente em docs antigos.

```
medalhas: {
  conquistaId: string,
  nome: string,
  lat: number,
  lng: number,
  velocidadeMaxKmh: number,   // uma casa; a deste passeio
  novidade: "primeira" | "recorde" | "passagem"
}[]
```

No máximo 6 itens, a mesma cota de amostras da SPEC 056. Ordem: a ordem em que `avaliarPassagens` devolve.

`passagem` é a novidade desta spec. O carimbo em `usersconquista` não muda quando a novidade é `passagem`: velocidade, `telemetriaId` e `recordeEm` ficam como estavam. `primeira` e `recorde` continuam o contrato da SPEC 056 §6.

O array não entra em `GET /telemetria` (a lista) nem no histórico do perfil. Entra só em `GET /telemetria/:id`, com o corte da seção 5.2.

### 3.2 O que não muda

`usersconquista` continua um doc por par, com a máxima vitalícia. O placar lê esse doc. Não há coleção nova e não há índice novo: o placar busca pelos ids `{uid}_{conquistaId}` que já existem.

---

## 4. Gravação da medalha

MD1. A rota do `POST /telemetria` segue os passos da SPEC 056 §6 e, no fim, grava `medalhas`.

`concederConquistas` passa a devolver também as passagens que a lib aceitou e que não escreveram carimbo. A lib `avaliarPassagens` já não filtra recorde; o filtro mora em `registrarPassagem`. Para cada resultado da lib:

| Situação | `novidade` da medalha | Carimbo |
|----------|----------------------|---------|
| Sem doc | `primeira` | Cria, como hoje |
| Doc e velocidade maior na casa decimal | `recorde` | Atualiza, como hoje |
| Doc e velocidade menor ou igual | `passagem` | Não escreve |

A medalha leva `nome`, `lat` e `lng` do doc ativo usado na avaliação. Conquista arquivada, id fora do catálogo ou traçado que a lib recusou não geram item.

O 201 continua com `conquistas` só para `primeira` e `recorde`, para o toast da SPEC 056. `medalhas` não entra no 201. Quem abre o detalhe lê o doc.

Sem `amostras`, ou com traçado de menos de dois vértices, `medalhas` fica `[]`. Body malformado em `amostras` continua sendo ignorado: o passeio grava e `medalhas` fica `[]`.

A escrita de `medalhas` é um update no doc já criado. Se esse update falhar, o log registra e a resposta do passeio segue 201. Um passeio sem o campo é o mesmo que lista vazia.

---

## 5. Leitura do passeio

### 5.1 Lista

`GET /telemetria` e o histórico do perfil não ganham `medalhas`. O mapper da lista tira o campo se o doc tiver.

### 5.2 Detalhe

`GET /telemetria/:id` continua 404 quando o passeio é privado e o token não é o dono.

Quem pode ver recebe `medalhas`. O dono recebe o objeto da seção 3.1. Qualquer outro uid recebe o mesmo objeto **sem** `velocidadeMaxKmh`. `novidade` fica nos dois: ela diz se aquele passeio foi a primeira vez, o recorde ou uma passagem, e não entrega o número.

Doc antigo, sem o campo: `"medalhas": []`.

`PATCH` de visibilidade não altera `medalhas`.

---

## 6. Mapa do passeio

MD3. `MapaPontosAB` no detalhe desenha as medalhas junto de A, B e do traçado.

O marcador de medalha é um botão com ícone `military_tech` e nome acessível `Medalha {nome}`. A e B continuam como estão.

| `novidade` | Cor do ícone |
|------------|----------------|
| `primeira`, `recorde` | `var(--primary-container)` |
| `passagem` | `var(--outline)` |

O pino entra no enquadramento, junto do traçado. Google e mapa livre desenham o mesmo pino. No Google, o clique do marcador abre a folha. No mapa livre, o botão posicionado abre a mesma folha. Abaixo do mapa, uma lista com o nome de cada medalha repete o mesmo toque, para o pino pequeno na tela de 390 px.

A folha:

- Título: o `nome` gravado na medalha.
- Linha da novidade: **Primeira vez**, **Recorde** ou **Passagem**.
- Dono: a velocidade daquela passagem, no formato da faixa do perfil (`72 km/h`, `72,5 km/h`).
- Quem não é o dono: a linha da velocidade não renderiza.
- **Ver ranking** leva a `/ranking/[conquistaId]`.
- **Fechar** dispensa a folha.

Lista vazia: o mapa fica o de hoje, sem a faixa de medalhas.

A imagem de compartilhar do passeio não recebe medalha.

---

## 7. Ranking

### 7.1 `GET /conquistas/:id/ranking`

RK1. Qualquer autenticado. Registrada antes de um eventual `GET /conquistas/:id` ambíguo; hoje esse GET não existe, e `/conquistas/admin` continua na frente.

`:id` ausente no catálogo: 404 `{ erro: "Conquista não encontrada" }`. Arquivada responde 200. O placar de um pino arquivado existe para a medalha de um passeio antigo.

```
{
  conquista: { id: string, nome: string },
  teto: 100,
  itens: {
    posicao: number | null,
    uid: string,
    apelido: string,
    fotoUrl: string,
    velocidadeMaxKmh: number | null,
    eu: boolean
  }[]
}
```

`nome` é o do catálogo agora. `apelido` sai de `apelidoExibicao`. `fotoUrl` é a do `users`, ou `""`.

Montagem:

1. Ler o pino. Sem doc, 404.
2. Percorrer `usersseguir` com `seguidorId == token`, `createdAt` desc, até 100 uids ou até acabar a lista. A página interna pode ser a de 30 da SPEC 053; a rota junta até o teto. Cursor inválido dessa junção não vaza: a rota não recebe cursor do cliente.
3. O conjunto é esses uids mais o uid do token.
4. `getAll` em `usersconquista/{uid}_{conquistaId}`.
5. `getAll` em `users` para nome, apelido e foto. Uid sem doc de usuário sai da lista. Isso também cobre conta já excluída cujo carimbo tenha sobrado.
6. Quem não tem carimbo sai, exceto o token.
7. Ordenar quem tem velocidade: `velocidadeMaxKmh` desc, `recordeEm` asc, `uid` asc. A posição começa em 1 e não pula.
8. Se o token não tem carimbo, a última linha é ele, com `posicao: null`, `velocidadeMaxKmh: null` e `eu: true`.

Ninguém além do token e desses seguidos entra, mesmo que o pino tenha centenas de carimbos. A rota não lista a coleção `usersconquista` por `conquistaId`.

Seguindo zero e o token sem carimbo: `itens` é uma linha, a dele, sem posição. Seguindo zero e o token com carimbo: uma linha, posição 1.

`velocidadeMaxKmh` desta resposta é a máxima vitalícia do carimbo, não a de um passeio. É o único JSON em que a velocidade de outro piloto sai da function, e só porque o token segue esse uid.

Falha ao ler a roda: 500 pelo `responderErro`. Não devolver um placar pela metade.

### 7.2 Telas

RK2.

**Ranking**, rota `/ranking`, só no próprio perfil. Ao lado do rótulo **Conquistas** da faixa, o botão **Ranking** abre essa rota. Sem conquistas na faixa, o botão continua: a lista é o catálogo, não os carimbos.

A rota chama `GET /conquistas` e lista os pinos ativos, nome em ordem alfabética de `pt-BR`. Cada linha abre `/ranking/[id]`. Catálogo vazio: “Nenhum ponto no ranking ainda”.

`/ranking/[id]` chama `GET /conquistas/:id/ranking`.

- Título: `conquista.nome`.
- Cada linha com posição: o número, a foto, o apelido, a velocidade no formato do perfil. A linha com `eu: true` leva o sufixo **Você**.
- A linha sem posição, quando existir, fica abaixo de um separador e diz **Você ainda não passou aqui**. Sem velocidade.
- Toque na linha de outra pessoa abre `/perfil/[uid]`. A linha **Você** abre `/perfil`.
- 404: “Este ponto não está no ranking” e volta para `/ranking`.
- Se `itens` de quem tem velocidade estiver vazio e a única linha for o próprio piloto sem carimbo, o texto acima da linha é **Ninguém que você segue carimbou este ponto**.

O chip de conquista em `/perfil/[uid]` (perfil de outra pessoa) continua sem link. O chip no próprio `/perfil` abre `/ranking/[id]` daquele pino.

O `+` do dock não ganha item.

390 px: posição, apelido e velocidade cabem numa linha. O apelido trunca. O alvo da linha tem no mínimo `var(--touch-min)`.

---

## 8. Critérios de aceite

### MD1 — gravar a medalha

- [ ] Passagem que cria carimbo grava `medalhas` com `novidade: "primeira"`, nome, lat, lng e a velocidade com uma casa.
- [ ] Passagem mais rápida grava `recorde` e atualiza o carimbo como a SPEC 056.
- [ ] Passagem igual ou mais lenta grava `passagem`, não altera o carimbo e o 201 segue com `conquistas: []`.
- [ ] A velocidade em `passagem` é a daquele passeio, menor que a máxima do carimbo.
- [ ] Sem amostras, o doc fica com `medalhas: []` e o 201 não muda o contrato do toast.
- [ ] Mover o pino no catálogo depois do `POST` não altera lat, lng nem nome já gravados na medalha.
- [ ] Exceção forçada no update de `medalhas` ainda responde 201 do passeio. O carimbo da primeira vez, se a concessão já ocorreu, permanece.

### MD2 — leitura

- [ ] `GET /telemetria` não traz `medalhas`.
- [ ] O dono, em `GET /telemetria/:id`, recebe `velocidadeMaxKmh` em cada medalha.
- [ ] Outro piloto, no passeio público, recebe nome, coordenada e `novidade`, sem `velocidadeMaxKmh`.
- [ ] Passeio privado continua 404 para quem não é o dono.
- [ ] Doc sem o campo devolve `medalhas: []`.

### MD3 — mapa

- [ ] Detalhe com uma medalha `recorde` mostra o ícone laranja no lat/lng gravado. `passagem` mostra o ícone no contorno.
- [ ] Toque no pino e toque no nome abaixo do mapa abrem a mesma folha.
- [ ] No próprio passeio a folha mostra a velocidade. No passeio público de outro piloto, a folha não mostra número.
- [ ] **Ver ranking** abre `/ranking/[conquistaId]`.
- [ ] Passeio sem medalha não desenha a faixa.
- [ ] A imagem de compartilhar permanece sem medalha.
- [ ] 390 px: o mapa e a lista de nomes cabem na largura, e o botão da medalha alcança 48 px.

### RK1 — placar

- [ ] Sem o doc da conquista, 404.
- [ ] Conquista arquivada responde 200 com o nome atual.
- [ ] O placar traz o token e quem ele segue que tem carimbo, ordenado pela velocidade. Não traz um terceiro piloto que carimbou o mesmo pino.
- [ ] Seguir é um sentido: A segue B e B não segue A. O placar de A inclui B com velocidade. O placar de B não inclui A.
- [ ] Empate na casa decimal: `recordeEm` mais antigo vem antes.
- [ ] Token sem carimbo fica na última linha, com `posicao: null` e `velocidadeMaxKmh: null`.
- [ ] Com 101 seguidos, entram os 100 vínculos mais recentes. O 101º não é lido.
- [ ] Uid sem doc em `users` não vira linha.
- [ ] `GET /usuarios/:uid` continua sem `velocidadeMaxKmh` nas conquistas.

### RK2 — telas

- [ ] No próprio perfil, **Ranking** abre `/ranking` com os pinos ativos em ordem alfabética.
- [ ] O chip de conquista no próprio perfil abre o placar daquele pino. No perfil de outra pessoa, o chip não navega.
- [ ] A linha de outro piloto abre o perfil público. A linha **Você** abre `/perfil`.
- [ ] Sem ninguém da roda no pino, a frase **Ninguém que você segue carimbou este ponto** aparece, e a linha do piloto sem passagem fica embaixo.
- [ ] Id desconhecido mostra o vazio da seção 7.2.
- [ ] 390 px: a linha do placar não estoura a largura.

---

## 9. Ordem

MD1 → MD2 → MD3.

RK1 → RK2. RK1 pode andar em paralelo com MD1. RK2 depende de RK1. O link **Ver ranking** da folha (MD3) aponta para a rota que RK2 entrega; com RK2 ainda fechado, o botão pode existir e a rota mostrar o vazio até o PR do placar.

---

## 10. Arquivos previstos

| Arquivo | Ação |
|---------|------|
| `functions/src/lib/conquistas.ts` | Alterar — devolver também a passagem que não escreve carimbo, com nome e coordenada |
| `functions/src/routes/telemetria.ts` | Alterar — gravar `medalhas`; cortar a velocidade no detalhe alheio; omitir na lista |
| `functions/src/types/role-telemetria.ts` | Alterar — `medalhas` |
| `functions/src/repositories/interfaces/role-telemetria.repository.ts` | Alterar — update das medalhas |
| `functions/src/repositories/firestore/firestore-role-telemetria.repository.ts` | Alterar |
| `functions/src/routes/telemetria` (teste do `POST` que já cobre concessão) | Alterar — MD1 e MD2 |
| `functions/src/lib/ranking-conquista.ts` | Novo — junta a roda, ordena, corta o teto. Sem Firestore |
| `functions/src/lib/ranking-conquista.test.ts` | Novo — RK1 da ordenação e do teto |
| `functions/src/routes/conquistas.ts` | Alterar — `GET /:id/ranking` |
| `functions/src/repositories/interfaces/seguir.repository.ts` | Alterar — ler até 100 seguidos, se a lista paginada não bastar na rota |
| `src/types/role-telemetria.ts` | Alterar — medalha com velocidade opcional |
| `src/components/maps/MapaEstatico.tsx` | Alterar — marcador com ícone, botão |
| `src/components/maps/useMapaLeituraGoogle.ts` | Alterar — clique do marcador de medalha |
| `src/components/telemetria/MapaPontosAB.tsx` | Alterar — pinos e lista de nomes |
| `src/app/(app)/telemetria/[id]/components/` | Novo — folha da medalha |
| `src/app/(app)/ranking/` | Novo — lista de pinos e placar |
| `src/app/(app)/perfil/[uid]/components/FaixaConquistas.tsx` | Alterar — **Ranking** e chip clicável só no próprio perfil |

A rota não importa Firestore. A ordenação do placar fica na lib pura. O `getAll` dos carimbos e dos usuários fica no repositório.
