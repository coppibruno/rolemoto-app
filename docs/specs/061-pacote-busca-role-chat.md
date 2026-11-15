# SPEC 061 — Busca, rolê aberto, ranking, chat, afiliado, foto e rolê fixo

> **Status:** Proposta
> **Autor:** Assistente IA
> **Data:** 2026-11-15
> **Origem:** decisões fechadas em conversa sobre oito pedidos; um ficou de fora
> **Padrões:** Next.js 15 App Router — skill `nextjs-patterns`; visual — skill `desenvolvimento-design`
> **Backend:** Cloud Function `api` — cada frente no router que já é dono daquele recurso, mais dois routers novos (`conversas`, `afiliados`)
> **Coleções:** `roles` ganha `acesso` e `fixado`. `rolestelemetria` ganha `fotosUrls`. Novas: `conversas`, `mensagens`, `afiliados`
> **Depende de:** SPEC 004 (criar rolê), SPEC 005 (participação), SPEC 007 (fila), SPEC 009 (clonar), SPEC 021 (editar e cancelar), SPEC 025 (perfil público), SPEC 030 (detalhe da telemetria), SPEC 049 (story), SPEC 053 (seguir e busca), SPEC 056 e 058 (carimbo e ranking)
> **QA:** IDs abaixo, um PR por ID. Frentes não se esperam.

Paradas no rolê **não** entram aqui. Continuam na SPEC 060.

As sete frentes podem ser implementadas ao mesmo tempo. O único arquivo em comum de verdade é o tipo do rolê: **RA** acrescenta `acesso` e **FR** acrescenta `fixado`. Cada um lê o campo que o outro ainda não gravou como o default desta spec. O segundo PR faz rebase. O resto não compartilha rota, coleção nem tela.

| Pedido | IDs | Nesta spec |
|--------|-----|------------|
| Sugestões na pesquisa | **BP1**, **BP2** | Sim. Sem “perto de mim” |
| Rolê aberto e fechado | **RA1**, **RA2**, **RA3** | Sim |
| Ranking só do que eu conquistei | **CF1** | Sim |
| Chat, resposta de story e reação | **CH1**, **CH2**, **CH3** | Mensagem e resposta de story. Reação fica de fora |
| Link de afiliado | **AF1**, **AF2** | Clique e conta criada pelo site. Instalação da loja não |
| Foto na telemetria | **FT1**, **FT2** | Sim |
| Paradas no rolê | — | SPEC 060 |
| Salvar e fixar rolê | **FR1**, **FR2** | Fixar no perfil e reutilizar. Sem lista privada de salvos |

---

## 1. Como paralelizar

1. Abrir um branch por ID.
2. **RA** e **FR** são os únicos que se cruzam no documento `roles`. Podem nascer juntos ou um depois do outro; o default cobre o campo ausente.
3. **BP**, **CF**, **CH**, **AF** e **FT** não leem esses campos.
4. Nenhum ID espera tela ou endpoint de outro ID desta spec.

---

## BP — Busca de pilotos

A tela `/pilotos` hoje, com o campo vazio, só diz “Digite pelo menos 2 letras”. A busca com 2 letras já devolve qualquer piloto, seguido ou não (`GET /usuarios/busca`, SPEC 053).

### BP1 — Campo vazio mostra quem eu sigo

| | |
|--|--|
| Camada | Front |
| Endpoint novo | Nenhum. Usa `GET /usuarios/{meuUid}/seguindo` |

- Campo vazio: a lista é quem eu sigo, da pessoa mais recente para a mais antiga, a mesma página de 30 da SPEC 053. Cada linha continua o `LinhaPiloto`.
- Se eu não sigo ninguém: “Você ainda não segue ninguém.” O campo de busca continua lá.
- Uma letra: a mesma lista, filtrada no aparelho pelo nome ou apelido. Se ninguém casa: “Digite mais uma letra para buscar todo mundo.”
- A frase “Digite pelo menos 2 letras” sai.
- Sem GPS, sem cidade e sem “perto de mim”.

### BP2 — Com 2 letras, seguidos e o resto na mesma lista

| | |
|--|--|
| Camada | Back |
| Rota | `GET /usuarios/busca`, a mesma |

- O contrato de quem entra não muda: prefixo de nome ou apelido, teto atual, eu mesmo fora.
- A ordem passa a ser: quem eu sigo primeiro; dentro de cada grupo, a ordem que a SPEC 053 já usa (apelido, primeiro nome, último nome, nome).
- Quem eu não sigo continua na lista. Os dois grupos aparecem juntos, no estilo da busca do Instagram.
- `seguidoPorMim` já sai na linha. Esta frente não muda o desenho da linha.

### Fora do BP

| Item | Motivo |
|------|--------|
| Pilotos próximos por GPS ou por cidade | Decisão desta rodada: não entra |
| Campo vazio com seguidores, sugestão de desconhecidos ou recente da busca | Campo vazio é só quem eu sigo |
| Busca com 1 letra no servidor | Continua 400. O filtro de 1 letra é na lista local |

---

## RA — Rolê aberto e fechado

Hoje todo `POST /roles/:id/participacao` nasce pendente e o líder aceita ou recusa.

### Decisões

| Decisão | Escolha |
|---------|---------|
| Campo | `acesso: "aberto" \| "fechado"` em `roles` |
| Rolê novo sem o campo no body | `aberto` |
| Documento antigo sem o campo | Lido como `fechado` |
| Quando se escolhe | Só na criação. `PUT` não altera `acesso`. Valor diferente no body do editar é ignorado |
| Aberto | `POST /participacao` grava `aceito: true` e `aceitoEm` na hora. Não entra na fila. Não manda push `pedido_vaga` nem `aceite_vaga` |
| Fechado | O fluxo atual, inteiro |
| Lembrete | Quem entra num aberto ganha o mesmo lembrete de quem foi aceito num fechado |
| Líder tirar alguém | Não. Pedido já aceito segue 409 em `PATCH /aprovacoes/:id` (`jaDecidida`). Aberto não ganha ação de remover |
| Piloto sair | `DELETE /roles/:id/participacao` continua, aberto ou fechado |
| Cancelar o rolê | SPEC 021, sem mudança |

### RA1 — Campo e entrada

| | |
|--|--|
| Camada | Back |

- `POST /roles` aceita `acesso`. Ausente ou inválido: ausente vira `aberto`; valor que não é `aberto` nem `fechado` responde 400.
- O campo sai em `GET /roles`, `GET /roles/:id`, `GET /meus-roles`, `GET /publico/roles/:id` e `GET /roles/:id/modelo`.
- `POST /roles/:id/participacao` em rolê aberto cria o vínculo já aceito, agenda o lembrete e responde 201. Repetir devolve o mesmo doc, como hoje. Recusado continua 409. Organizador continua 403. Rolê que já saiu continua 400.
- `POST` em rolê fechado não muda.

### RA2 — Escolha na criação

| | |
|--|--|
| Camada | Front |
| Onde | Formulário de criar rolê, inclusive clone e reutilizar (FR2) |

- Dois controles, **Aberto** e **Fechado**. Aberto começa marcado.
- Copy curta: Aberto — “Quem quiser entra na hora.” Fechado — “Você aceita cada piloto.”
- A tela de editar não mostra a escolha e não manda troca de `acesso`.
- No card do feed, na ficha e no convite público, o botão de quem ainda não entrou lê **Entrar** no aberto e **Pedir vaga** no fechado.
- Aberto, depois do 201: a pessoa vê o estado de confirmado, o mesmo de quem já foi aceito. Fechado continua “aguardando”.

### RA3 — Fila só do fechado

| | |
|--|--|
| Camada | Front |
| Onde | `/aprovacoes` e o detalhe do líder |

- Pedido de rolê aberto não aparece em Fila. Aparece em Confirmados, sem Recusar e sem Aceitar.
- Chip e contagem de fila ignoram rolê aberto.
- Rolê fechado permanece como está.

### Fora do RA

| Item | Motivo |
|------|--------|
| Mudar aberto/fechado depois de publicar | Decisão: só na criação |
| Líder expulsar de rolê aberto | Decisão: não |
| Teto de vagas | Continua sem teto |
| Reclassificar rolê já publicado | Antigo fica fechado. Não há migração |

---

## CF — Ranking só com o que eu carimbei

`/ranking` lista o catálogo ativo inteiro (`GET /conquistas`). A Serra do Rio do Rastro aparece mesmo sem passagem.

### CF1 — Lista do meu carimbo

| | |
|--|--|
| Camada | Back e front |
| Rota nova | `GET /conquistas/minhas`, registrada **antes** de `GET /conquistas/:id/ranking` |

- Devolve os pinos em que o uid do token tem `usersconquista`, com `id` e `nome` atuais do catálogo.
- Pino arquivado (`ativa: false`) entra, se o carimbo existe.
- Pino apagado do catálogo não entra (a mesma regra da faixa do perfil).
- Ordem: nome, `pt-BR`.
- Eu sem carimbo nenhum: `{ itens: [] }`. A tela diz “Você ainda não passou por nenhum ponto.”
- `GET /conquistas` (catálogo para a gravação) não muda.
- `GET /conquistas/:id/ranking` não muda: eu e quem eu sigo e também carimbou aquele pino. A velocidade continua nesse placar.
- O link da medalha no passeio continua abrindo o placar daquele pino, mesmo que a lista geral não mostre pino alheio.

### Fora do CF

| Item | Motivo |
|------|--------|
| Pino que só quem eu sigo carimbou | A lista é a minha passagem |
| Esconder pino arquivado que eu já carimbei | O carimbo permanece na lista |
| Mudar a conta do placar, o teto de 100 ou o empate | SPEC 058 |

---

## CH — Mensagem direta e resposta de story

Não existe conversa. A story some em 24 h. O cliente continua sem ler o Firestore: lista e envio passam pela API. Atualização é ao abrir a conversa e pelo push. Sem bolha ao vivo.

Reação em story e reação em mensagem **não** entram. O pedido original citava reação; nesta rodada o recorte ficou em texto.

### Decisões

| Decisão | Escolha |
|---------|---------|
| Quem escreve para quem | Qualquer autenticado, menos para si |
| Uma conversa por par | Id `{uidMenor}_{uidMaior}` |
| Texto | 1..1000 caracteres, sem anexo |
| Resposta de story | Vira mensagem nessa conversa, com `storyId` |
| Story já expirada ou de outra pessoa | 400. Não cria mensagem |
| Resposta à própria story | 400 |
| Vida da mensagem | Fica depois que a story some. O `storyId` expirado vira o rótulo “Resposta a um story”, sem foto |
| Leitura ao vivo, recibo, grupo do rolê, foto no chat, bloquear, apagar mensagem | Fora |
| Push | Tipo novo `mensagem`. Toque abre `/mensagens/{conversaId}` |

### Dados

`conversas/{uidMenor}_{uidMaior}`

```
{
  id: string,
  participantes: [uidA, uidB],
  ultimaMensagemTexto: string,
  ultimaMensagemEm: timestamp,
  ultimaMensagemAutorId: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

`mensagens/{autoId}`

```
{
  id: string,
  conversaId: string,
  autorId: string,
  texto: string,
  storyId: string | null,
  createdAt: timestamp
}
```

Índice: `conversaId` + `createdAt` desc. Lista de conversas: `participantes` array-contains o token + `ultimaMensagemEm` desc.

`DELETE /perfil` apaga as conversas em que o uid participa e as mensagens delas.

### CH1 — Conversas

| | |
|--|--|
| Camada | Back |

- `GET /conversas` — as minhas, 30, cursor por `ultimaMensagemEm`. Cada item traz o outro piloto (nome, apelido, foto) e o trecho da última mensagem.
- `GET /conversas/:id/mensagens` — 30, da mais nova para a mais antiga, cursor. Só participante. Id alheio: 404.
- `POST /conversas` — body `{ destinatarioId, texto, storyId? }`. Cria a conversa se não existe, grava a mensagem, atualiza o resumo, manda o push para o outro. Resposta 201 com a mensagem e o `conversaId`.
- `storyId` preenchido: a story existe, não expirou, o autor da story é o `destinatarioId`.
- Destinatário inexistente: 404. Eu mesmo: 400. Texto vazio ou acima de 1000: 400.
- Rate limit autenticado já existente. Sem cota extra nesta leva.

### CH2 — Caixa e conversa

| | |
|--|--|
| Camada | Front |
| Rotas | `/mensagens` e `/mensagens/[conversaId]` |

- Ícone de conversa no topo da home, na mesma faixa de Encontrar pilotos. Abre `/mensagens`.
- No perfil de outra pessoa, botão **Mensagem**. Abre a conversa do par, vazia se ainda não houve texto. O primeiro envio chama o `POST`.
- A caixa lista nome, foto e o trecho. Vazia: “Nenhuma mensagem ainda.”
- A conversa é uma lista. Enviar acrescenta a mensagem e, se o push chegar com a tela fechada, abrir de novo busca a lista.
- Sem indicador de “visto” e sem atualização sozinha enquanto a tela fica aberta.

### CH3 — Responder story

| | |
|--|--|
| Camada | Front |
| Onde | Player de story de outra pessoa |

- Campo **Responder** no story alheio. Enviar chama o mesmo `POST` com `storyId`.
- Em seguida abre `/mensagens/{conversaId}` com a mensagem já na lista.
- No balão, enquanto a story existe, um selo “Story”. Depois de 24 h, o selo troca para “Resposta a um story” e a foto não é copiada para a mensagem.
- Story própria não mostra o campo.

### Fora do CH

| Item | Motivo |
|------|--------|
| Reação em story ou em mensagem | Fora do recorte decidido |
| Chat do comboio, foto, áudio, bloqueio, denúncia, apagar | Fora desta leva |
| Listener no Firestore | O cliente segue deny-all |

---

## AF — Link de afiliado

Dá para contar clique no nosso site e conta criada por esse caminho. Não dá, nesta leva, para contar instalação da App Store nem da Play. O Install Referrer da Play e um SDK de atribuição ficam de fora de propósito.

### Decisões

| Decisão | Escolha |
|---------|---------|
| URL | `https://www.rolemoto.com.br/i/{codigo}` |
| Código | 3..20, `a-z`, `0-9` e hífen. Único. O admin define |
| Quem cadastra | Admin, em `/afiliados`. Não entra no `+` do dock |
| Clique | Uma vez por navegador por dia e por código. Atualizar a página não soma de novo |
| Conta | No `POST /perfil` (primeiro acesso), se o body trouxer `codigoAfiliado` válido e o uid ainda não tiver afiliado, grava e soma 1 |
| Já tem perfil | O clique conta. A conta não soma de novo |
| Onde o código espera | `localStorage`, chave `rolemoto.afiliado`, por 30 dias, gravado na página `/i/{codigo}` |
| Lojas | A página mostra os botões da App Store e da Play. O toque não é instalação atribuída |
| Conta no admin | `cliques` e `contas`. Sem lista de uid na tela |

### Dados

`afiliados/{codigo}`

```
{
  id: string,          // o código
  nome: string,        // 1..60, nome do influencer para o admin
  cliques: number,
  contas: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

`users` ganha `afiliadoCodigo: string | null`. Interno. Não sai em `GET /perfil` nem no perfil público. Documento antigo lê `null`.

### AF1 — Código, clique e conta

| | |
|--|--|
| Camada | Back |

- `POST /afiliados`, `GET /afiliados`, `DELETE /afiliados/:codigo` — admin. Apagar o código não apaga o `afiliadoCodigo` já gravado nos usuários e não mexe nos números que a tela já mostrou antes do delete. O delete recusa se preferirmos histórico: **não apaga**; a rota de delete não existe. Corrigir nome: `PATCH /afiliados/:codigo` só `{ nome }`.
- `POST /publico/afiliados/:codigo/clique` — sem token. Código desconhecido: 404. Senão 204 e `cliques + 1`. Rate limit por IP, 30 por minuto, o helper já existente.
- `POST /perfil` aceita `codigoAfiliado` opcional. Código desconhecido é ignorado (o perfil cria do mesmo jeito, sem afiliado). Código válido e campo ainda `null`: grava e incrementa `contas` na mesma escrita. Segunda chamada de perfil não existe; se um dia o campo já estiver preenchido, não troca e não soma.

### AF2 — Página e primeiro acesso

| | |
|--|--|
| Camada | Front |
| Rotas | `/i/[codigo]` pública; `/afiliados` só admin |

- `/i/[codigo]` explica o Rolemoto, grava o código no `localStorage` e dispara o clique uma vez naquele dia. Botões: entrar no site, App Store, Play. Código 404: “Este link não existe.”
- Login e cadastro não mostram o código. No concluir do primeiro acesso, o client manda `codigoAfiliado` se a chave existir e não tiver passado 30 dias. Sucesso do `POST /perfil` apaga a chave.
- `/afiliados`: lista com nome, código, link completo, cliques e contas. Criar pede nome e código. Sem item no menu inferior. No próprio perfil, se `admin`, uma linha **Links de afiliado** abre essa tela.

### Fora do AF

| Item | Motivo |
|------|--------|
| Instalação iOS ou Android por influencer | Sem Install Referrer e sem SDK nesta leva |
| Comissão, cupom, painel do próprio influencer | O admin lê os dois números |
| Trocar o afiliado de uma conta já criada | O primeiro código fica |

---

## FT — Foto no passeio gravado

O `POST /telemetria` não tem foto. A foto permanente do perfil (SPEC 057) é outro lugar.

### Decisões

| Decisão | Escolha |
|---------|---------|
| Quantidade | 0..4 |
| Quando | No resumo antes de salvar e, depois, no próprio detalhe |
| Quem vê | Quem já pode abrir o passeio. Passeio privado segue 404 para os outros, foto inclusive |
| Deslize | Troca de foto naquele passeio. Não troca de passeio |
| Lista | `GET /telemetria` e o histórico não levam o array |

### FT1 — Campo

| | |
|--|--|
| Camada | Back |

- `rolestelemetria.fotosUrls: string[]`. Ausente lê `[]`.
- `POST /telemetria` aceita `fotosUrls` opcional. Cada item é URL do Storage em `telemetria/{uid}/`. Fora isso, ou mais de 4: 400. O passeio grava mesmo com `[]`.
- `PATCH /telemetria/:id` com `{ fotosUrls }` — só o dono. Substitui a lista inteira (0..4). Outro campo neste PATCH continua sendo só `publica`, como hoje: body que mistura os dois é aceito; body com qualquer outra chave responde 400.
- `GET /telemetria/:id` inclui `fotosUrls` para quem já recebe o passeio.

### FT2 — Escolher e deslizar

| | |
|--|--|
| Camada | Front |
| Onde | Resumo do `/gravar-role` e `/telemetria/[id]` |

- No resumo, antes de **Salvar rolê**: até 4 fotos, opcional, mesmo seletor de arquivo das fotos de visita. Dá para tirar uma antes de enviar.
- No detalhe do próprio passeio: acrescentar e remover, até 4, e salvar pelo PATCH.
- Duas ou mais: faixa horizontal com scroll por arraste, uma foto por tela. Uma: a foto parada. Nenhuma: o detalhe como está hoje, sem faixa vazia.
- Passeio público de outra pessoa: a faixa só leitura, o mesmo deslize, sem botão de editar.

### Fora do FT

| Item | Motivo |
|------|--------|
| Foto no meio da gravação, com a tela desligada | Só no resumo e no detalhe |
| Deslizar entre passeios | O gesto é entre fotos daquele doc |
| Capa da telemetria no perfil | A lista não mostra a foto |

---

## FR — Fixar rolê e reutilizar

Rolê concluído já fica em Meus Rolês e no histórico de quem participou, e sai do feed. Clonar (SPEC 009) só o criador, e só um rolê dele. Não há lista privada de “salvos”.

O produto desta frente: o criador **fixa** o rolê no perfil público. O rolê continua lá depois da data. Qualquer autenticado abre e **reutiliza**: cai em `/criar-role` preenchido, escolhe a data nova e publica um rolê seu.

### Decisões

| Decisão | Escolha |
|---------|---------|
| Campo | `fixado: boolean`. Ausente lê `false` |
| Quem fixa | O criador. Teto 12 fixados por uid |
| Quando | Futuro ou concluído. O 13º responde 400 “Você já fixou 12 rolês” |
| Cancelar | No cancelamento da SPEC 021, `fixado` volta a `false` |
| Onde aparece | Faixa **Rotas** no perfil público (`/perfil/[uid]`), e no próprio perfil |
| Ordem | `dataHoraSaida` desc |
| Reutilizar | `GET /roles/:id/modelo` deixa de ser só do criador quando `fixado === true`. Qualquer autenticado recebe o DTO. Rolê não fixado de outro piloto continua 403 |
| O que o modelo copia | O que a SPEC 009 já copia, mais `paradas` (SPEC 060) e `acesso` (RA1), para o formulário pré-marcar |
| O rolê novo | Outro documento. Comboio vazio. `criadorId` de quem publicou. `fixado: false`. A data é a nova |
| Salvar numa lista só minha | Fora |

### FR1 — Fixar e modelo

| | |
|--|--|
| Camada | Back |

- `PATCH /roles/:id/fixado` body `{ fixado: boolean }`. Só o criador. Admin não fixa rolê alheio.
- `GET /usuarios/:uid` e `GET /perfil` ganham `rolesFixados`: até 12 itens `{ id, titulo, dataHoraSaida, fotoCapaUrl, acesso }`. Sem descrição longa e sem lista de participantes.
- Modelo: criador continua podendo clonar rolê próprio não fixado. Outra pessoa só se `fixado`.

### FR2 — Faixa e reutilizar

| | |
|--|--|
| Camada | Front |

- No próprio perfil, em cada rolê que eu criei (histórico, status de líder ou concluído), ação **Fixar** / **Desfixar**.
- No perfil público, faixa **Rotas** com os fixados. Toque abre a ficha só leitura da rota (título, saída, paradas, destino, ritmo, acesso) e o botão **Reutilizar**.
- **Reutilizar** vai para `/criar-role?origem={id}`. O formulário é o do clone: data vazia, resto preenchido, escolha Aberto/Fechado pré-marcada com o `acesso` de origem e editável até publicar.
- Faixa vazia no perfil alheio: a faixa não aparece. No próprio, se não há fixado, uma linha “Fixe um rolê para outros reutilizarem a rota.”

### Fora do FR

| Item | Motivo |
|------|--------|
| Favorito privado de rolê alheio | O pedido fechou em fixar no perfil e reutilizar |
| Fixar rolê de outra pessoa no meu perfil | Só o criador fixa o próprio |
| Reutilizar sem conta | O modelo exige token |
| Editar o rolê original pelo reutilizar | Publica um rolê novo |

---

## 2. Aceite por ID

| ID | Pronto quando |
|----|----------------|
| **BP1** | Abrir `/pilotos` com o campo vazio lista quem eu sigo. Uma letra filtra essa lista. Zero seguidos mostra o vazio, não a frase das 2 letras |
| **BP2** | Buscar um termo que casa um seguido e um não seguido coloca o seguido antes |
| **RA1** | Criar sem `acesso` grava aberto. `POST /participacao` nesse rolê volta `aceito: true` e não chama o push de pedido. Doc antigo sem campo segue pedindo vaga |
| **RA2** | O criar mostra Aberto marcado. O feed do aberto diz Entrar. O editar não oferece a troca |
| **RA3** | Confirmado de rolê aberto aparece sem Aceitar/Recusar. A fila não conta esse rolê |
| **CF1** | `/ranking` só lista pino que eu carimbei, inclusive arquivado. Sem carimbo, o vazio novo. O placar de um pino meu continua com quem eu sigo |
| **CH1** | Duas contas trocam texto. Story válida vira mensagem com `storyId`. Story vencida responde 400. Terceiro não lê |
| **CH2** | Home abre a caixa. Perfil alheio abre a conversa. Fechar e abrir de novo mostra o que o push anunciou |
| **CH3** | Responder no story alheio cai na conversa. Story própria não tem campo |
| **AF1** | Clique 204 soma 1. Segundo clique no mesmo dia, no mesmo navegador, não soma (o front não chama). `POST /perfil` com código válido preenche `afiliadoCodigo` e soma `contas` uma vez |
| **AF2** | `/i/{codigo}` grava a chave e mostra as lojas. Admin vê os dois números em `/afiliados`. Código inválido no primeiro acesso não impede o perfil |
| **FT1** | Passeio com 2 URLs válidas devolve as duas no detalhe e não na lista. A quinta URL responde 400. Outra pessoa não lê passeio privado |
| **FT2** | Salvar sem foto continua. Com 2 fotos, arrastar para o lado troca a foto. Dono acrescenta depois, até 4 |
| **FR1** | Criador fixa e o perfil público lista. O 13º dá 400. Outro piloto pega o modelo só do fixado. Cancelar solta o fixado |
| **FR2** | Reutilizar abre o criar preenchido, data vazia, publica outro rolê, e o original não ganha participante |
