# SPEC 054 — Convidar amigos para o evento

> **Status:** Proposta
> **Autor:** Assistente IA
> **Data:** 2026-11-04
> **Origem:** chamar quem já tem conta para um evento aberto, e se inscrever em seguida
> **Padrões:** Next.js 15 App Router — skill `nextjs-patterns`; visual — skill `desenvolvimento-design`
> **Backend:** Cloud Function `api` — convite no `eventosRouter`
> **Coleções:** `usersconviteevento` (**nova**). Lê `eventos`, `users` e `usersevento`
> **Depende de:** SPEC 026 (inscrição), SPEC 046 (share do link continua), SPEC 052 (ocorrência da série), SPEC 053 (busca, listas e `apelidoExibicao`), SPEC 013 / 042 (push e `url` no clique)
> **QA:** IDs **CV1**–**CV5**, um PR por ID

O share leva o link para fora. O convite chama quem já está no app. Inscrever e convidar são dois botões, e a pessoa pode fazer um e depois o outro.

---

## 1. Objetivo

No card da aba **Eventos** e no detalhe do evento, a pessoa vê **Inscreva-se** e **Convidar amigo**. O convite abre uma tela para marcar quem ela segue, quem a segue, ou quem ela acha pelo nome. Cada pessoa marcada recebe um push e abre o evento. A inscrição continua na mão de quem recebe.

| ID | Entrega | Camada |
|----|---------|--------|
| **CV1** | Separar quem entra no envio, quem já vai e quem já foi convidado, com teste e sem rede | Back (lib pura) |
| **CV2** | Coleção e `POST` do convite | Back |
| **CV3** | Situação das linhas e evento fechado | Back |
| **CV4** | Push e limpeza ao excluir a conta | Back |
| **CV5** | Os dois botões, a tela e a volta para se inscrever | Front |

---

## 2. Recorte

### 2.1 O que entra

- Botão **Convidar amigo** ao lado de **Inscreva-se** no card da aba Eventos e no bloco de presenças do detalhe.
- Rótulo do evento grátis passa de **Inscrever-se** para **Inscreva-se**. Evento pago continua **Comprar ingresso**.
- Tela `/eventos/[id]/convidar`.
- Lista inicial: quem eu sigo. Chip para quem me segue. Busca por nome ou apelido, a mesma da SPEC 053.
- Vários de uma vez, até 20. Um push por trio (quem convida, quem recebe, este evento).
- Depois do envio, a própria tela oferece **Inscreva-se** se a pessoa ainda não entrou. **Voltar** devolve à listagem ou ao detalhe, no mesmo lugar.
- O convite é desta ocorrência. Na série semanal, é a quarta daquele documento `eventos`, não as outras datas.

### 2.2 O que não entra

| Item | Motivo |
|------|--------|
| Ícone ao lado do share | O rótulo **Convidar amigo** é o atalho |
| Atalho na garagem (**Meus Rolês**) | A porta é a listagem em que a pessoa descobre o evento, e o detalhe |
| Convite de rolê ou de local | Esta spec é evento |
| Inscrição automática de quem foi chamado | Quem recebe abre o evento e se inscreve no fluxo da SPEC 026 |
| Caixa de mensagens | O aviso é o push |
| Convite para quem não tem conta | O share da SPEC 046 continua com o link `/e/{id}` |
| Convite da série inteira | Cada data é um documento |
| Segundo push para o mesmo trio | Repetir deixa a linha em **Convidado** |
| Aceite do convite | Não há fila. A inscrição é que confirma presença |

### 2.3 Decisões travadas

| Decisão | Escolha |
|---------|---------|
| Quem convida | Qualquer autenticado, com o evento aberto e sem cancelamento |
| Ordem | Convidar e se inscrever são independentes. Os dois caminhos valem |
| Onde nascem os botões | Rodapé do `EventoCard` e bloco de presenças do detalhe. O share do header e do card fica como está |
| Lista inicial | Quem eu sigo. Chip **Seguidores**. Busca no topo, a partir de 2 letras |
| Envio | Até 20 por request. A pessoa marca e confirma **Convidar (N)** |
| Efeito | Grava o doc e manda push. Não cria `usersevento` |
| Repetir | O doc existente responde no grupo `jaConvidados` e não manda push |
| Já inscrito | Linha **Já vai**. Não grava convite e não manda push |
| Eu mesmo | Fora da lista e, se vier no body, cai em `ignorados` |
| Cliente | Firestore continua deny-all. O client só fala com a function |
| Voltar | `history.back()`. Sem histórico, cai em `/eventos/{id}` |

### 2.4 Caminho

1. Na aba Eventos ou no detalhe, a pessoa toca **Convidar amigo**.
2. Marca a galera e confirma.
3. A tela mostra **Convites enviados**. Se ela ainda não está no evento, o botão **Inscreva-se** (ou **Comprar ingresso**) aparece ali.
4. **Voltar** reabre a listagem ou o detalhe. A página de origem monta de novo e busca o evento outra vez, então o chip **Inscrito** aparece se a inscrição foi feita na tela de convite.
5. Quem prefere se inscrever no card ou no detalhe usa o **Inscreva-se** que continua lá. **Convidar amigo** também continua, enquanto o evento estiver aberto.

---

## 3. Dados

### 3.1 Coleção `usersconviteevento`

Id `{convidanteId}_{convidadoId}_{eventoId}`. Um doc por trio.

```
{
  id: string,
  convidanteId: string,
  convidadoId: string,
  eventoId: string,
  createdAt: timestamp
}
```

`convidanteId` é o uid do token. `convidadoId` vem do body. `eventoId` vem do path. Timestamp só no servidor.

Não criar índice composto. A tela consulta pelo id do doc (`getAll`). A limpeza da conta usa igualdade em um campo só (`convidanteId` ou `convidadoId`); o índice simples do Firestore basta.

### 3.2 Inscrição

`usersevento` não muda. Id continua `{usuarioId}_{eventoId}`. **Já vai** é a existência desse doc. O convite não escreve nele.

---

## 4. Texto do push

Lib pura em `functions/src/lib/convite-evento.ts`. Sem Firestore. CV1 cobre a classificação e a frase.

`classificarConvites(uids, contexto)` devolve quatro listas, sem repetir uid:

| Lista | Regra, nesta ordem |
|-------|--------------------|
| `ignorados` | string vazia, uid igual ao token, ou perfil que não existe |
| `jaInscritos` | existe `usersevento` daquele uid neste evento |
| `jaConvidados` | já existe o doc deste trio |
| `enviados` | o restante |

A entrada já vem sem duplicata. Quem está inscrito não cai em `jaConvidados`, mesmo que o doc de convite também exista.

`fraseConvite(apelido, titulo)` devolve `{apelido} te chamou para {titulo}`. Título vazio vira `o evento`. O apelido é o `apelidoExibicao` de quem convida.

`quandoConvite(aberturaIso, encerramentoIso)` formata em `America/Sao_Paulo`:

- dia da semana curto, sem ponto, dia, mês curto, `·`, `HH:mm`. Exemplo: `qua 12 nov · 19:30`.
- Se o encerramento cai em outro dia do calendário, acrescenta ` – ` e o mesmo formato do fim. No mesmo dia, só a abertura.

---

## 5. API

Tudo em `eventosRouter`, que já tem `autenticar` e `rateLimitAutenticado`. Registrar `POST /:id/convites/situacao` antes de `POST /:id/convites`.

A rota não importa Firestore. A transação fica no repositório.

### 5.1 `POST /eventos/:id/convites`

Body `{ uids: string[] }`.

| Caso | Resposta |
|------|----------|
| Sem token | 401 |
| `uids` ausente, vazio ou com mais de 20 depois de tirar duplicata | 400 `{ erro: "escolha até 20 pilotos" }` |
| Evento inexistente | 404 `{ erro: "Evento não encontrado" }` |
| `cancelada` | 400 `{ erro: "esta data foi cancelada" }` |
| Já encerrou (`now` maior que encerramento, ou que a abertura se não houver encerramento) | 400 `{ erro: "este evento já encerrou" }` |
| Pelo menos um doc novo | 201 com o corpo abaixo |
| Nenhum doc novo | 200 com o mesmo corpo |

```
{
  enviados: string[],
  jaConvidados: string[],
  jaInscritos: string[],
  ignorados: string[]
}
```

Duplicata no array conta uma vez, antes do teto de 20. Uid com mais de 128 caracteres cai em `ignorados`.

Os docs de `enviados` nascem na mesma transação. O push da seção 6 roda depois, só para `enviados`. Falha de push não muda o status da request.

### 5.2 `POST /eventos/:id/convites/situacao`

Body `{ uids: string[] }`, de 1 a 30 depois de tirar duplicata. A página de quem eu sigo tem 30; a busca tem 20.

Mesmos 401, 404 e 400 de evento fechado da seção 5.1. Fora da faixa de tamanho: 400 `{ erro: "escolha até 30 pilotos" }`.

```
{
  inscritos: string[],
  convidados: string[]
}
```

`inscritos`: existe `usersevento`. `convidados`: existe o doc deste trio com o token como `convidanteId`. Não grava e não manda push. Uid desconhecido simplesmente não aparece nas duas listas.

---

## 6. Push

Tipo novo em `TipoPush`: `convite_evento`.

Só para uid em `enviados`. Um envio por destinatário. Falha de um não cancela os outros.

| Campo | Valor |
|-------|--------|
| `title` | `fraseConvite` |
| `body` | `quandoConvite` |
| `url` | `/eventos/{eventoId}` |
| `eventoId` | o id do path |
| `roleId`, `localId` | `""` |

O `title` carrega a frase inteira porque o toast com o app aberto mostra só o título (`usePushForeground`). O clique continua no `notificationclick` / `fcm-nativo`, que já abrem `data.url`. Sem parser novo no client.

Não notificar o próprio token.

---

## 7. Excluir conta

No `DELETE /perfil`, no mesmo ponto em que os vínculos de seguir saem, apagar os docs de `usersconviteevento` em que o uid é `convidanteId` ou `convidadoId`.

Em lotes de 100. Não há contador para corrigir. Falha neste passo gera log de warn e a rota segue para 204.

---

## 8. Front

Sem mock novo. Tokens e CSS Modules do feed e do detalhe do evento. Coluna do shell, toque mínimo `--touch-min`. O botão do card fica dentro de `cardEventoRodape`, que já está acima do link invisível do card.

### 8.1 Os dois botões

Um bloco só, usado no `EventoCard` e em `BlocoPresencasEvento`.

Evento aberto e a pessoa ainda fora:

- Uma linha, altura `--touch-target`, gap 8 px.
- **Inscreva-se** (ou **Comprar ingresso**) é o botão laranja e fica com o espaço que sobrar.
- **Convidar amigo** tem contorno. `aria-label="Convidar amigo para o evento"`. Abre `/eventos/{id}/convidar`.

Em 390 px os dois rótulos cabem na linha. Abaixo disso, a linha quebra: **Inscreva-se** em cima, largura cheia, e **Convidar amigo** embaixo. O texto não abrevia.

Evento aberto e a pessoa já inscrita: chip **Inscrito**, **Cancelar** e, no ingresso, **Comprar ingresso**, como hoje. **Convidar amigo** fica embaixo, largura cheia.

Evento encerrado ou `cancelada`: **Convidar amigo** não renderiza. A inscrição segue a regra que o bloco já tem.

O share não muda de lugar nem de ícone.

### 8.2 `/eventos/[id]/convidar`

A página carrega `GET /eventos/:id`.

Header: **Voltar** (`aria-label="Voltar"`) e título **Convidar**. Abaixo, o título do evento numa linha, com reticências.

Evento encerrado ou cancelado: uma frase (**Este evento já encerrou** ou **Esta data foi cancelada**) e o voltar. Sem lista e sem envio.

Campo igual ao de `/pilotos`: foco ao abrir, `placeholder="Nome ou apelido"`, `type="search"`.

- Campo vazio: a lista do chip. **Seguindo** começa selecionado. **Seguidores** troca a lista. As duas usam `GET /usuarios/{meuUid}/seguindo` e `/seguidores`, página de 30, mais recente primeiro.
- Uma letra: **Digite pelo menos 2 letras**. A lista do chip sai.
- A partir de 2: debounce 300 ms e `GET /usuarios/busca`. Até 20 pessoas.
- Ao limpar o campo, volta o chip que estava ativo. A seleção marcada não se perde na troca de chip nem na busca.

Cada página de resultados chama `POST /eventos/:id/convites/situacao` com os uids daquela página.

Linha própria, no visual da linha de piloto (foto, nome, `@apelido` quando existir, cidade, **Segue você**). Sem botão **Seguir** e sem abrir o perfil. O toque na linha marca ou desmarca.

| Estado | Linha |
|--------|--------|
| Livre | caixa vazia. O toque marca |
| Marcada | caixa preenchida na cor primária |
| `inscritos` | texto **Já vai**. Não marca |
| `convidados` | texto **Convidado**. Não marca |

**Já vai** ganha de **Convidado** se os dois vierem.

Vazio de quem eu sigo: **Você ainda não segue ninguém**. A busca do topo continua na tela. Vazio de seguidores: **Ninguém te segue ainda**. Busca sem match: **Nenhum piloto com esse nome**. Erro de lista ou de busca: **Não deu para carregar agora** e **Tentar de novo**.

Barra no fim da coluna, acima do dock:

- Evento pago: uma linha **Eles confirmam a inscrição. O ingresso continua por fora.**
- Botão **Convidar**, desabilitado com zero marcas. Com marcas, **Convidar (N)**.
- A 21ª marca não entra. A barra avisa **Dá para chamar até 20 por vez**.

Durante o `POST`, o rótulo é **Convidando…** e o botão trava. Falha: as marcas continuam e um toast diz **Não deu para convidar agora**.

### 8.3 Depois do envio

A lista dá lugar ao resultado.

| `enviados` | Título |
|------------|--------|
| 1 ou mais | **Convites enviados** e **{n} piloto chamado** / **{n} pilotos chamados** |
| 0 | **Nenhum convite novo** |

Se `jaInscritos` tiver gente: **{n} já estavam no evento**. Se `jaConvidados` tiver gente: **{n} já tinham convite seu**.

Se o token ainda não está inscrito, o botão principal é o mesmo fluxo de `useInscricaoEvento`: **Inscreva-se**, ou **Comprar ingresso** com o modal que já existe. Quando a inscrição fecha, o botão vira o chip **Inscrito**.

**Voltar** usa a mesma ação do header.

---

## 9. Critérios de aceite

### CV1 — classificação e frase

- [ ] Uid vazio, o próprio token e perfil ausente caem em `ignorados`.
- [ ] Quem tem `usersevento` cai em `jaInscritos`, mesmo com doc de convite.
- [ ] Quem só tem o doc do trio cai em `jaConvidados`. O restante cai em `enviados`. Nenhuma lista repete uid.
- [ ] `fraseConvite("Ana", "Velharia")` devolve `Ana te chamou para Velharia`. Título vazio vira `o evento`.
- [ ] Abertura `2026-11-12T22:30:00.000Z` vira `qua 12 nov · 19:30`. Encerramento em outro dia de São Paulo entra depois de ` – `.

### CV2 — gravar o convite

- [ ] `POST` com dois uids novos grava `usersconviteevento/{eu}_{outro}_{evento}`, responde 201 e não cria `usersevento`.
- [ ] O mesmo `POST` de novo responde 200, com esses uids em `jaConvidados`, e não cria outro doc.
- [ ] Uid já inscrito vai para `jaInscritos` e não ganha doc.
- [ ] Body vazio ou com 21 uids responde 400. Evento inexistente responde 404.
- [ ] Duplicata no array conta uma vez.

### CV3 — situação e evento fechado

- [ ] `situacao` devolve, entre os uids pedidos, quem está inscrito e quem eu já convidei. Não grava.
- [ ] Mais de 30 uids responde 400. Lista vazia de status é 200 com os dois arrays vazios.
- [ ] Evento cancelado responde 400 `esta data foi cancelada` nos dois `POST`.
- [ ] Evento cujo limite já passou responde 400 `este evento já encerrou` nos dois `POST`.

### CV4 — push e conta

- [ ] Cada uid em `enviados` recebe push com a frase no título, a data no body e `url` `/eventos/{id}`.
- [ ] `jaConvidados` e `jaInscritos` não recebem push. O próprio uid não recebe.
- [ ] Falha do FCM ainda devolve 201 quando o doc nasceu.
- [ ] `DELETE /perfil` apaga os convites em que o uid é quem convidou ou quem foi chamado. Falha nessa limpeza não impede o 204.

### CV5 — telas

- [ ] No card da aba Eventos e no detalhe, evento grátis aberto mostra **Inscreva-se** e **Convidar amigo**. Evento pago mostra **Comprar ingresso** e **Convidar amigo**.
- [ ] **Convidar amigo** abre `/eventos/{id}/convidar` e não abre o detalhe por baixo do card. O share segue mandando o link.
- [ ] Evento encerrado ou cancelado não mostra **Convidar amigo**. A URL direta explica e não lista gente.
- [ ] Com o campo vazio, a lista é quem eu sigo. O chip **Seguidores** troca a lista. Duas letras buscam pelo nome. A marca feita numa lista continua na outra.
- [ ] **Já vai** e **Convidado** não marcam. A 21ª pessoa não marca e a barra explica o teto.
- [ ] Confirmar mostra **Convites enviados**. Sem inscrição prévia, **Inscreva-se** funciona nessa tela, inclusive o modal de ingresso.
- [ ] **Voltar** devolve à aba Eventos ou ao detalhe, de onde a pessoa saiu. Se ela se inscreveu na tela de convite, a origem mostra **Inscrito**.
- [ ] 390 px: os dois rótulos aparecem inteiros. Abaixo disso, um botão por linha. A barra de confirmar não cobre o dock.

---

## 10. Ordem

CV1 → CV2 → CV3 → CV4 → CV5.

CV4 depende do `POST` da CV2. CV5 pode usar a API assim que CV3 estiver no ar; o push não bloqueia a tela.

---

## 11. Arquivos previstos

| Arquivo | Ação |
|---------|------|
| `functions/src/lib/convite-evento.ts` | Novo — classificar, frase, quando |
| `functions/src/lib/convite-evento.test.ts` | Novo — CV1 |
| `functions/src/types/convite-evento.ts` | Novo |
| `functions/src/repositories/interfaces/convite-evento.repository.ts` | Novo |
| `functions/src/repositories/firestore/firestore-convite-evento.repository.ts` | Novo |
| `functions/src/repositories/index.ts` | Alterar — factory |
| `functions/src/routes/eventos.ts` | Alterar — os dois `POST`, ou router fino incluído aqui |
| `functions/src/routes/perfil.ts` | Alterar — limpeza no `DELETE` |
| `functions/src/lib/notificacoes.ts` | Alterar — `convite_evento` |
| `src/app/(app)/feed/components/BotaoInscreverEvento.tsx` | Alterar — rótulo **Inscreva-se** e a linha com **Convidar amigo** |
| `src/app/(app)/feed/components/EventoCard.tsx` | Alterar — esconder o convite quando encerrado ou cancelado |
| `src/app/(app)/eventos/[id]/components/BlocoPresencasEvento.tsx` | Alterar — a mesma linha de botões |
| `src/app/(app)/eventos/[id]/convidar/` | Novo — tela, linha, resultado |
| `src/types/convite-evento.ts` | Novo — corpo do `POST` |

A rota não importa Firestore. A transação dos docs novos fica no repositório.
