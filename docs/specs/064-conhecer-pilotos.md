# SPEC 064 — Conhecer pilotos

> **Status:** Proposta
> **Autor:** Assistente IA
> **Data:** 2026-11-16
> **Origem:** a lupa acha quem a pessoa já conhece pelo nome. Quem entra sozinho, e quem já segue gente, precisa de um lugar permanente para conhecer piloto novo
> **Padrões:** Next.js 15 App Router — skill `nextjs-patterns`; visual — skill `desenvolvimento-design`
> **Backend:** Cloud Function `api` — leitura e dispensa no `usuariosRouter`; `seguidoPorMim` do organizador no `GET /roles`
> **Coleções:** `userssugestaodispensa` (**nova**)
> **Depende de:** SPEC 053 (seguir, listas e busca), SPEC 061 BP1 (campo vazio lista quem eu sigo), SPEC 003 (rolê no raio), SPEC 030 (telemetria pública), SPEC 045 / 049 (story), SPEC 057 (foto com marca), SPEC 063 (Início)
> **QA:** IDs **CG1**–**CG6**, um PR por ID

A SPEC 061 (BP) deixou piloto próximo e sugestão de desconhecido de fora. Esta spec cobre esse buraco. O bloco **Seguindo** do BP1 permanece. O feed do Início continua só com o próprio piloto e quem ele segue.

---

## 1. Objetivo

O piloto vê gente que ainda não segue, cada uma com um motivo, sem precisar saber o nome. A lista existe no primeiro acesso e continua depois que a rede enche.

| ID | Entrega | Camada |
|----|---------|--------|
| **CG1** | Faixa, desempate, frase e rotação do dia, com teste e sem rede | Back (lib pura) |
| **CG2** | Dispensa de 30 dias e limpeza no `DELETE /perfil` | Back |
| **CG3** | `GET /usuarios/sugestoes` com os cinco rastos públicos | Back |
| **CG4** | Bloco **Conhecer** em `/pilotos` | Front |
| **CG5** | Faixa no Início | Front |
| **CG6** | **Seguir** no organizador do card de rolê | Front + `GET /roles` |

---

## 2. Recorte

### 2.1 O que entra

- `GET /usuarios/sugestoes` devolve até 10 pilotos que o token ainda não segue. Cada linha traz um motivo só.
- Cinco rastos, todos já públicos: quem me segue, segundo grau, organizador de rolê futuro no raio, telemetria pública no raio, story ou foto marcada num ponto do raio.
- Cidade, ritmo e tipo de moto só desempatam. Não criam candidato.
- `/pilotos` com o campo vazio mostra **Seguindo** e, embaixo, **Conhecer**.
- No Início, uma faixa com 3 pessoas, entre as stories e o feed. **Ver mais** abre `/pilotos`.
- **Agora não** numa pessoa esconde ela por 30 dias. Fechar a faixa do Início esconde a faixa até o fim do dia, neste aparelho.
- No card de rolê do Explorar, **Seguir** ao lado do organizador.

### 2.2 O que não entra

| Item | Motivo |
|------|--------|
| Inscrição em evento, fila do rolê, participante aceito, check-in | Essa presença não é lista pública. O motivo entregaria o rastro a um desconhecido |
| Mapa ao vivo, GPS da pessoa, importar contatos | Fora do recorte |
| Cidade como filtro, chip de ritmo, raio sem limite | O raio da sugestão é fixo |
| Estranho no feed do Início | O feed segue a SPEC 063. Desconhecido só aparece na prateleira e no card de rolê |
| Push “você talvez conheça” | A prateleira é o aviso |
| **Seguir** no card de evento | O organizador do evento é admin. O card de rolê é o momento em que o rolê já interessa |
| Trocar a busca por nome | Duas letras continuam no `GET /usuarios/busca` |

### 2.3 Decisões travadas

| Decisão | Escolha |
|---------|---------|
| Onde mora | Campo vazio de `/pilotos` e faixa do Início. A busca não muda |
| Uma letra | Filtra só **Seguindo**, no aparelho. **Conhecer** some. Não chama sugestão de novo |
| Duas letras | Os dois blocos saem. Entra a busca da SPEC 053 / 061 |
| Raio | 50 km. O client manda `lat` e `lng`. Sem os dois, a rota devolve só rede (quem me segue e segundo grau) |
| Ponto | O mesmo `useLocalizacaoFeed` do Explorar (`sessionStorage` `rolemoto.feed.ponto`). Sem ponto salvo, pede o GPS uma vez. Negado ou indisponível: segue sem coordenada, sem segundo pedido na sessão, sem painel de endereço no Início |
| Tamanho | 10 na rota. A faixa mostra os 3 primeiros |
| Motivo | Um por pessoa, o da faixa mais alta. A frase vem pronta do servidor |
| Rotação | Dentro da mesma faixa, o dia em `America/Sao_Paulo` reordena. Não atravessa faixa. Um único candidato continua |
| Dispensa da pessoa | 30 dias no servidor. Repetir regrava a data |
| Dispensa da faixa | `localStorage`, chave `rolemoto.sugestoes.faixa`, valor `YYYY-MM-DD` em `America/Sao_Paulo`. Não esconde o bloco de `/pilotos` |
| Seguir na prateleira | Tira a linha na hora. No campo vazio, a pessoa entra no topo de **Seguindo** |
| Cache | O client guarda a última resposta por 5 minutos, chave lat/lng com 3 casas. Seguir e dispensar tiram o uid da memória. Não há cache no servidor |

---

## 3. Quem entra

Candidato nasce de um rasto. Perfil sozinho não entra. Eu mesmo, quem eu já sigo e quem está dispensado até uma data futura ficam de fora antes da nota.

### 3.1 Faixas

A nota da faixa é fixa. O desempate soma em cima e não alcança a faixa de cima (o maior desempate cabe abaixo de 50).

| Faixa | Nota | Rasto | Leitura, no máximo |
|-------|------|--------|--------------------|
| `segue_voce` | 400 | Primeira página de quem me segue (30, a mais recente primeiro) | A lista que a SPEC 053 já faz |
| `organizou_role` | 300 | Rolê com `dataHoraSaida` entre agora e agora + 30 dias, saída a até 50 km. Um rolê por criador: o que sai primeiro | 80 docs |
| `seguido_por` | 250 | Até 10 pessoas que eu sigo, as mais recentes. De cada uma, até 10 que ela segue | `listarSeguidosRecentes` |
| `telemetria` | 200 | `rolestelemetria` dos últimos 30 dias, `encerradoEm` desc. `publica` ausente lê `true`, como o restante do app. `pontoInicio` a até 50 km. Uma por piloto: a mais recente | 80 docs, filtro na memória |
| `publicou` | 150 | Story que ainda não venceu **ou** foto dos últimos 14 dias, com ponto resolvível a até 50 km. Uma por piloto: a mais recente | 40 stories + 40 fotos |

Vários rastos na mesma pessoa: fica o da faixa mais alta e a frase dele.

Segundo grau: se mais de um piloto que eu sigo segue o candidato, o nome da frase é o do vínculo mais recente entre eu e esse intermediário.

### 3.2 Ponto do `publicou`

A story ou a foto precisa de um ponto já público. Sem ponto, o doc não vira candidato.

| Origem | Ponto | Nome na frase |
|--------|--------|----------------|
| Story `album: local` | `locais.lat/lng` do `localId` | `locais.nome` |
| Story `album: evento` | O local do catálogo se `evento.localId` existir; senão `evento.local` | Nome do local, senão `evento.local.nome` |
| Story `album: perfil` com `localizacaoLat/lng` | Esses campos | `localizacaoNome` |
| Foto com `marcaTipo: local` | O local | `locais.nome` |
| Foto com `marcaTipo: evento` | Igual à story de evento | Igual à story de evento |

Story de perfil sem marca e sem pin, foto sem marca, local ou evento apagado: o doc é ignorado. Nome vazio depois do trim também.

Os ids de local e de evento repetidos carregam uma vez, no teto de 40 docs.

### 3.3 Desempate e dia

Sobre a nota da faixa, nesta ordem, só para ordenar dentro dela:

| Sinal | Soma |
|-------|------|
| `pilotagem` igual à minha, as duas preenchidas | +30 |
| `tipoMoto` igual ao meu, os dois não nulos | +15 |
| `cidade` igual à minha, as duas não vazias depois de normalizar como a busca da SPEC 053 | +10 |
| Mais perto | Menor `distanciaKm` ganha. Empate de km segue para o jitter |
| Jitter do dia | `hash(uid + ymd) % 21 - 10`, inteiro de −10 a +10. `ymd` é o dia em `America/Sao_Paulo`. O hash é estável e entra no teste |

Corte final: `uid` ascendente.

`distanciaKm` é a haversine (`functions/src/lib/geo.ts`) do ponto do pedido até o ponto do rasto (saída do rolê, `pontoInicio` da telemetria ou ponto da seção 3.2). Arredonda com `Math.round`. Não é a posição ao vivo do piloto.

Sem `lat`/`lng` no pedido, as faixas `organizou_role`, `telemetria` e `publicou` não rodam. Rede continua.

---

## 4. Frase

O servidor manda `motivo.texto`. O client não monta.

| Tipo | Texto |
|------|--------|
| `segue_voce` | `Segue você` |
| `seguido_por` | `Seguido por {apelidoExibicao}` |
| `organizou_role` | `Organizou {titulo} · {n} km` |
| `telemetria` | `Telemetria pública saindo de {nome}` quando `pontoInicio.nome` tem texto. Senão `Telemetria pública · {n} km` |
| `publicou` | `Publicou em {nome}` |

`{apelidoExibicao}` é o da SPEC 053. `{titulo}` e `{nome}` passam por trim. Acima de 40 caracteres, cortam em 39 e ganham `…`. `{n}` é o km inteiro, inclusive `0`.

Na linha que já mostra **Segue você** por `segueVoce`, o motivo do mesmo tipo não repete a frase. No card curto da faixa, a frase aparece uma vez.

---

## 5. API

Registrada ao lado de `GET /usuarios/busca`, antes de `/:uid`.

### 5.1 `GET /usuarios/sugestoes`

Autenticado. Query opcional: `lat`, `lng`. Os dois juntos ou nenhum. Número finito, lat em −90..90, lng em −180..180. Qualquer outra forma: 400 `coordenadas inválidas`. `raioKm` na query é ignorado; o raio é 50.

```
{
  itens: [
    {
      uid, nome, apelido, fotoUrl, cidade,
      seguidoPorMim: false,
      segueVoce: boolean,
      motivo: {
        tipo: "segue_voce" | "seguido_por" | "organizou_role" | "telemetria" | "publicou",
        texto: string
      }
    }
  ]
}
```

`seguidoPorMim` sai `false`: quem já é seguido não entra. Sem candidato: `{ itens: [] }`, 200. A linha reusa o formato da SPEC 053 e soma `motivo`.

Não saem lat/lng, e-mail, check-in, inscrição, telemetria privada nem os campos `*Busca`.

Falha de uma leitura de rasto: log de warn, a faixa daquele rasto fica vazia, as outras seguem. A rota ainda responde 200.

### 5.2 `POST /usuarios/sugestoes/:uid/dispensa`

Autenticado. `:uid` é quem some da lista. Eu mesmo ou uid vazio: 400. Alvo inexistente: 404.

Grava `userssugestaodispensa/{eu}_{alvo}`:

```
{
  id: string,
  usuarioId: string,
  dispensadoId: string,
  ate: timestamp
}
```

`ate` é agora + 30 dias, no relógio do servidor. Doc já existente atualiza `ate`. Resposta 204. Não mexe em seguir.

A listagem lê os docs com `usuarioId == eu` (teto 100) e descarta `ate` no passado. Sem índice composto.

### 5.3 Excluir conta

No `DELETE /perfil`, no mesmo passo dos vínculos de seguir: apagar dispensas em que o uid é `usuarioId` ou `dispensadoId`. Lotes de 100. Falha gera log de warn e a rota segue para 204.

### 5.4 `GET /roles`

O `criador` de cada item ganha `seguidoPorMim: boolean`. O meu próprio rolê sai `false`. Uma leitura `vinculosCom` com os `criadorId` da página, não uma por card.

---

## 6. Front

Sem mock novo. Tokens e CSS Modules de `/pilotos`, do Início e do card de rolê. Coluna do shell, toque mínimo `--touch-min`.

### 6.1 `/pilotos`

O campo, o foco, a busca com debounce de 300 ms e os textos do BP1 ficam.

Campo vazio, nesta ordem:

1. Título de seção **Seguindo**, Barlow Condensed, maiúsculo, 14 px, `var(--outline)`.
2. A lista de quem eu sigo, como no BP1. Vazio: **Você ainda não segue ninguém.** O título da seção continua.
3. Título **Conhecer**.
4. Até 10 linhas.

Uma letra: some **Conhecer** e o filtro local do BP1 fica. Duas letras: somem os dois títulos e entra o resultado da busca, sem motivo.

Linha de **Conhecer**: a `LinhaPiloto` atual, mais o `motivo.texto` em 12 px, `var(--outline)`, uma linha, reticências. À direita, **Seguir**. Embaixo do botão, texto **Agora não**, 48 px de altura, sem confirmação.

| Estado do bloco | O que aparece |
|-----------------|---------------|
| Carregando | Uma linha **Buscando…** |
| Zero | **Ninguém novo por aqui agora.** |
| Erro | **Não deu para buscar agora.** e **Tentar de novo**. **Seguindo** não espera esta request |
| Sem GPS | O bloco pede assim mesmo, sem `lat`/`lng`. Sem frase pedindo permissão |

**Seguir** com sucesso tira a linha. **Agora não** tira na hora. Falha do POST devolve a linha e um toast **Não deu para ocultar**. Falha do seguir continua no toast que o botão já usa.

### 6.2 Início

A faixa fica depois de `CarrosselStories` e antes da lista ou do `EstadoVazioInicio`. O estado vazio da SPEC 063 não muda: o CTA **Encontrar pilotos** continua.

Some se a chave do dia for hoje, se a resposta vier vazia, ou se o erro for da sugestão. Erro da sugestão não substitui o feed.

Card: fundo `var(--surface-container-low)`, `border-radius: 1.5rem`, padding `var(--card-padding-md)`.

- Título **Conhecer** à esquerda. À direita, botão ícone `close`, 48 px, `aria-label="Agora não"`.
- Três pessoas em coluna. Cada uma: foto 48 px (sem foto, o ícone `person`), nome numa linha, motivo numa linha, **Seguir** à direita. Tocar a pessoa abre `/perfil/{uid}`. Tocar **Seguir** não navega.
- Link **Ver mais** para `/pilotos`, cor `var(--primary-container)`.

Fechar grava o dia e tira a faixa até amanhã. **Seguir** tira só aquela pessoa. Se as três saem, a faixa some.

390 px: as três linhas cabem sem rolagem horizontal. O fechar não cobre o título.

### 6.3 Card de rolê

`OrganizadorRole` no `RoleCard` ganha `BotaoSeguir` quando `criador.uid` não é o meu. O botão fica na área que já não abre o detalhe (`cardDetalheAcao`), com `stopPropagation`. **Seguindo** pede a mesma confirmação de deixar de seguir.

O detalhe do rolê e os cards da garagem não ganham botão.

---

## 7. Critérios de aceite

### CG1 — nota e frase

- [ ] Quem me segue fica acima de organizador, organizador acima de segundo grau, segundo grau acima de telemetria, telemetria acima de publicou.
- [ ] Dois rastos na mesma pessoa deixam um item, com o tipo da faixa mais alta.
- [ ] Ritmo igual soma 30 e não ultrapassa a faixa de cima. Cidade vazia não soma. Tipo de moto nulo não soma.
- [ ] O mesmo `uid` e o mesmo `ymd` produzem o mesmo jitter. Outro `ymd` pode trocar a ordem dentro da faixa e não troca a faixa.
- [ ] Título de 41 caracteres corta com `…`. Telemetria sem nome de partida usa a frase com km. Story sem ponto não entra na função que monta o candidato.

### CG2 — dispensa

- [ ] `POST` grava `{eu}_{alvo}` com `ate` cerca de 30 dias à frente e responde 204.
- [ ] `POST` repetido atualiza `ate` e não cria outro doc.
- [ ] Alvo inexistente responde 404. Eu mesmo responde 400.
- [ ] `DELETE /perfil` apaga os docs dos dois lados. Falha nessa limpeza não impede o 204.

### CG3 — lista

- [ ] A rota `/usuarios/sugestoes` não é capturada por `/:uid`.
- [ ] Eu, quem eu sigo e quem está dispensado não saem. Quem está dispensado com `ate` no passado pode sair.
- [ ] Sem `lat`/`lng`, a lista só tem `segue_voce` e `seguido_por`.
- [ ] Rolê com saída a 60 km não entra. Rolê a 40 km entra com `organizou_role` e km inteiro.
- [ ] Telemetria privada não entra. Doc antigo sem `publica` entra, se o ponto estiver no raio.
- [ ] Foto sem marca não entra. Story de local no raio entra com `publicou`.
- [ ] Inscrição, participação e check-in não geram motivo.
- [ ] A resposta corta em 10. Lista vazia é 200 com `itens: []`.
- [ ] `lat` sem `lng` responde 400.

### CG4 — `/pilotos`

- [ ] Campo vazio mostra **Seguindo** e **Conhecer**. Uma letra esconde **Conhecer** e filtra quem eu sigo. “maria” mostra a busca, sem motivo.
- [ ] **Seguir** tira a linha de **Conhecer** e a pessoa aparece no topo de **Seguindo**.
- [ ] **Agora não** tira a linha. Recarregar dentro de 30 dias não a devolve.
- [ ] Erro de sugestão não apaga a lista de quem eu sigo.
- [ ] 390 px: **Seguir** e **Agora não** cabem na linha sem cortar o nome no meio do botão.

### CG5 — Início

- [ ] Com sugestão, a faixa fica entre as stories e o feed, com 3 pessoas e **Ver mais**.
- [ ] Fechar esconde a faixa até o dia seguinte neste aparelho e deixa **Conhecer** em `/pilotos`.
- [ ] Feed vazio continua com **Encontrar pilotos**. A faixa, se houver sugestão, fica acima desse estado.
- [ ] GPS negado não bloqueia o Início. A faixa usa só a rede, ou some se a rede também vier vazia.
- [ ] Erro da sugestão não troca o erro do feed.

### CG6 — card

- [ ] No Explorar, o card de rolê de outra pessoa mostra **Seguir**. O meu rolê não mostra.
- [ ] Tocar **Seguir** não abre o detalhe. Tocar o resto do card abre.
- [ ] `seguidoPorMim: true` mostra **Seguindo** e pede confirmação antes do `DELETE`.
- [ ] Garagem e detalhe do rolê seguem sem esse botão.

---

## 8. Ordem

CG1 → CG2 → CG3. CG4 e CG5 esperam o CG3. CG6 não espera os outros: o `POST /usuarios/:uid/seguir` já existe.

CG4, CG5 e CG6 podem ser três PRs ao mesmo tempo depois do CG3. CG6 pode sair antes, junto com o campo novo do `GET /roles`.

---

## 9. Arquivos previstos

| Arquivo | Ação |
|---------|------|
| `functions/src/lib/sugestao-piloto.ts` | Novo — faixa, frase, jitter, corte |
| `functions/src/lib/sugestao-piloto.test.ts` | Novo — CG1 |
| `functions/src/types/seguir.ts` | Alterar — `motivo` na linha de sugestão |
| `functions/src/repositories/interfaces/sugestao.repository.ts` | Novo — dispensa e leituras com teto |
| `functions/src/repositories/firestore/firestore-sugestao.repository.ts` | Novo |
| `functions/src/repositories/index.ts` | Alterar — factory |
| `functions/src/routes/usuarios.ts` | Alterar — `GET /sugestoes` e `POST /sugestoes/:uid/dispensa` |
| `functions/src/routes/perfil.ts` | Alterar — limpeza da dispensa |
| `functions/src/routes/roles.ts` | Alterar — `criador.seguidoPorMim` |
| `functions/src/types/role.ts` | Alterar — campo no resumo do criador |
| `src/app/(app)/pilotos/` | Alterar — bloco **Conhecer** |
| `src/app/(app)/inicio/components/` | Novo — faixa; a tela só encaixa |
| `src/app/(app)/feed/components/OrganizadorRole.tsx` | Alterar — botão no card |
| `src/types/seguir.ts` | Alterar — `motivo` |

A rota não importa Firestore. A nota mora na lib pura. A transação da dispensa fica no repositório.
