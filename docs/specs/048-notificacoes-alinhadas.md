# SPEC 048 — Notificações alinhadas (story do dia, 24 h e 2 h)

> **Status:** Implementado  
> **Autor:** Assistente IA  
> **Data:** 2026-10-22  
> **Padrões:** Cloud Function `api` + FCM (SPEC 013 / 042) e Cloud Tasks (SPEC 020)  
> **Backend:** `lib/notificacoes.ts`, `lib/lembretes.ts`, `POST /lembretes/enviar`  
> **Depende de:** SPEC 013 (pedido e aceite), SPEC 020 (fila `lembretes-role`), SPEC 034 (cancelamento), SPEC 045 (story do dia), SPEC 026 (inscrição)  
> **QA:** IDs **L1**–**L6**

---

## 1. Objetivo

Deixar um catálogo só de push. O piloto entende cada aviso sem abrir o app para descobrir o que mudou.

| Quando | Quem recebe | O que muda nesta spec |
|--------|-------------|------------------------|
| Primeira story do dia **no evento** (encontro ao vivo, com ou sem local) | Toda conta com token FCM, menos quem postou | **Muda** a SPEC 045: sai o teto de favoritos/inscritos |
| Primeira story do dia num local **sem** encontro | Favoritos do ponto, menos o autor. Teto 100 | Permanece a SPEC 045 |
| 24 h antes e 2 h antes da saída do rolê | Organizador e pilotos **aceitos** com `notificar !== false` | **Substitui** o lembrete de 1 h da SPEC 020 |
| 24 h antes da abertura do evento | Toda conta com token, inscrita ou não | **Novo.** Uma task só; a lista sai na hora do disparo |
| 2 h antes da abertura do evento | Criador e inscritos | Pessoal. Não vai para quem só viu o feed |
| Pedido de vaga | Organizador | Igual à SPEC 013 |
| Aceite da vaga | Piloto, se `notificar !== false` | Igual à SPEC 013 |
| Rolê cancelado | Confirmados, menos o organizador | Igual à SPEC 034 |
| Recusa de vaga | Ninguém | Continua em silêncio |

Não há tela nova, sino, inbox nem preferência de antecedência. O card é o do sistema. Com o app aberto, o toast que já existe mostra o `title`.

---

## 2. O que o piloto lê

Uma linha no título. O nome do rolê, do evento ou de quem postou vai no corpo.

| Tipo | `title` | `body` | Toque abre |
|------|---------|--------|------------|
| `story_local` no evento | `O {titulo} está rolando` | `{apelido} postou uma foto` (e o nome do ponto, se houver) | `/eventos/{id}?stories=1` ou, se o álbum é o local, `/locais/{id}?stories=1` |
| `story_local` no local | `{nome} está ao vivo` | `{apelido} postou uma foto` | `/locais/{id}?stories=1` |
| `lembrete_role` 24 h | Seu rolê é amanhã | `{titulo}` | `/roles/{id}/participar` |
| `lembrete_role` 2 h | Seu rolê começa em 2 horas | `{titulo}` | `/roles/{id}/participar` |
| `lembrete_evento` 24 h | Tem evento amanhã | `{titulo}` | `/eventos/{id}` |
| `lembrete_evento` 2 h | Seu evento começa em 2 horas | `{titulo}` | `/eventos/{id}` |
| `pedido_vaga` | Um motociclista solicitou vaga para um rolê | `{titulo}` | `/aprovacoes` |
| `aceite_vaga` | O organizador aceitou você no rolê | `{titulo}` | `/roles/{id}/participar` |
| `cancelamento_role` | Rolê cancelado | `{titulo} foi cancelado pelo organizador.` | `/meus-roles` |

Sem emoji. “Amanhã” é a antecedência de 24 h, não o virar do calendário. Se o horário de 24 h já passou na hora de entrar, esse aviso não existe — só o de 2 h, se ainda der tempo.

---

## 3. Story — primeira do dia

- Marcar o evento, ou postar no ponto enquanto o encontro está ao vivo, pode disparar o push do **evento**.
- A reserva é `storyPushYmd` do **evento** (`YYYY-MM-DD` em `America/Sao_Paulo`). A primeira foto do dia no encontro avisa. A segunda, no mesmo dia, não.
- Quem recebe: toda conta que tem token em `dispositivos`, menos quem postou. Sem teto de 100. Quem nunca aceitou o push não tem para onde enviar.
- Local sem encontro ao vivo continua o recorte da SPEC 045: favoritos, teto 100, `storyPushYmd` do local. Uma foto de posto não acorda a base inteira.
- Uma foto no ponto de manhã, antes do encontro, não gasta o aviso do evento. O aviso do evento espera a primeira foto com o encontro ao vivo.
- Story só de perfil, sem marca, não avisa ninguém.
- Falha do FCM não desfaz a foto.

---

## 4. Lembrete — 24 h e 2 h

A fila continua **`lembretes-role`**. O handler continua `POST /lembretes/enviar` com OIDC. No rolê, cada pessoa ganha até duas tasks. No evento, a de 24 h é **uma** task da base; a de 2 h é por pessoa.

O horário de referência:

| Alvo | Instante |
|------|----------|
| Rolê | `dataHoraSaida` |
| Evento | `dataHoraAbertura` (não o encerramento) |

Nome da task: `lembrete-{24h|2h}-{role|evento}-{alvoId}-{userId}-{segundos}`. Os segundos são o horário do disparo. Trocar a data cria ids novos, então o Cloud Tasks não recusa o reagendamento por causa do id antigo.

A task antiga `lembrete-{roleId}-{userId}` (1 h) deixa de ser criada. Se ainda estiver na fila, o handler devolve 200 e **não envia** push.

### Quem entra na agenda

| Evento | Agenda |
|--------|--------|
| `POST /roles` | Organizador, as duas que ainda couberem |
| `PATCH /aprovacoes/:id` com aceite | Piloto aceito. O push de aceite (013) continua na hora |
| `POST /eventos` | Uma task `audiencia: "todos"` para 24 h, mais a de 2 h do criador |
| `POST /eventos/:id/inscricao` (201) | Só a de 2 h do inscrito. A de 24 h já vale para ele |
| Antecedência já passou | Essa task não nasce. A outra, se ainda for futura, nasce |
| Saída ou abertura em menos de 2 h | Nenhuma |
| Task a mais de 29 dias | Cloud Tasks não aceita. Essa antecedência fica de fora |

### Quem sai da agenda

| Evento | Cancela |
|--------|---------|
| Piloto sai do rolê (`DELETE /roles/:id/participacao`) | As duas do piloto e a task legada de 1 h |
| Organizador exclui o rolê | As de cada aceito, as do organizador e as legadas |
| `dataHoraSaida` muda | Cancela e cria de novo com o horário novo |
| Piloto sai do evento | A task de 2 h dele. A de 24 h da base fica |
| Criador sai da própria inscrição | A de 2 h dele fica. A de 24 h da base fica |
| Recusa de vaga | Não havia task |

Na hora de disparar, o handler confere de novo: o rolê ou o evento ainda existe, e o relógio está a até 20 minutos do horário combinado (`início − antecedência`). No rolê, a pessoa precisa continuar aceita (o organizador passa direto) e com `notificar !== false`. Na task de 2 h do evento, precisa continuar inscrita (o criador passa direto). Na task de 24 h do evento, a lista é quem tem token naquele instante — inscrição não entra na conta. Fora disso, 200 sem push. O título do corpo é o que está no banco na hora.

Falha de agenda ou de FCM não vira erro do aceite, da publicação nem da inscrição.

---

## 5. O que não entra

| Item | Motivo |
|------|--------|
| Avisar a base inteira sobre um rolê, ou 2 h antes de um evento | Rolê e o “começa em 2 horas” continuam de quem já entrou. O aberto é a story do evento e o “tem evento amanhã” |
| Aviso de evento por raio ou por cidade | A base ainda cabe num envio só. Recorte geográfico fica para quando o volume doer |
| Toggle “não me lembre do evento” | O rolê já tem `notificar`. Evento não ganha preferência nova |
| Lembrete no encerramento do evento | O aviso é da abertura |
| Job para recriar tasks de quem já estava aceito | Task de 1 h já na fila é consumida em silêncio. Editar a data do rolê passa esse rolê para 24 h e 2 h |
| Fila nova, Scheduler ou segunda function | A fila e o `POST /lembretes/enviar` já existem |
| Tela de notificações | O card do sistema basta |

---

## 6. IDs de teste

| ID | O que provar | Como |
|----|----------------|------|
| **L1** | A primeira story do dia com o encontro ao vivo avisa quem tem token, mesmo sem inscrição. A segunda no mesmo dia não. O autor não recebe a própria. Local sem encontro continua só nos favoritos | Conta sem inscrição e com push ligado; outra posta no evento. No mesmo dia, a segunda foto fica em silêncio |
| **L2** | Rolê com saída em mais de 24 h gera duas tasks (24 h e 2 h). Não existe task de 1 h. O texto é o da §2 | Aceitar um piloto e olhar a fila `lembretes-role`. Disparar o handler com `antecedencia: "24h"` |
| **L3** | Publicar evento cria uma task `audiencia: "todos"` em 24 h e a de 2 h do criador. Inscrição cria só a de 2 h. O texto de 24 h é “Tem evento amanhã” e o toque abre `/eventos/{id}` | Criar evento, inscrever outra conta, inspecionar a fila |
| **L4** | Pedido de vaga e aceite seguem a copy da SPEC 013. Recusa não avisa | Pedir vaga, aceitar, recusar outro pedido |
| **L5** | Sair do rolê apaga 24 h e 2 h daquela pessoa. Sair do evento apaga a de 2 h e deixa a de 24 h da base. Criador que cancela a própria inscrição continua com a de 2 h. Mudar a data do rolê troca o horário | DELETE da participação e da inscrição; PUT do rolê com outra `dataHoraSaida` |
| **L6** | Body antigo `{ roleId, userId, titulo }` sem `antecedencia` responde 200 e não chama o FCM | `POST /lembretes/enviar` com o payload da SPEC 020 |

No emulator o FCM não sai (`FUNCTIONS_EMULATOR`). O handler e a agenda local provam a decisão. O card no aparelho pede functions publicadas.

---

## 7. Arquivos

| Arquivo | Ação |
|---------|------|
| `functions/src/types/lembrete.ts` | Payload com `alvo`, `antecedencia` |
| `functions/src/lib/lembretes.ts` | Agenda e cancela 24 h e 2 h; apaga a task de 1 h |
| `functions/src/lib/envio-lembrete.ts` | **Novo** — decide se o handler envia |
| `functions/src/lib/notificacoes.ts` | Copy; fan-out do aviso de 24 h |
| `functions/src/lib/story-local.ts` | Primeira foto do evento vai para quem tem token |
| `functions/src/repositories/interfaces/dispositivo.repository.ts` | `listarUids` |
| `functions/src/repositories/firestore/firestore-dispositivo.repository.ts` | Uids distintos da coleção `dispositivos` |
| `functions/src/routes/lembretes.ts` | Lê o payload novo; 1 h descontinuada |
| `functions/src/routes/eventos.ts` | No `POST`, agenda o aviso geral e a de 2 h do criador |
| `functions/src/routes/inscricao-evento.ts` | 2 h no 201; cancela a de 2 h no DELETE, menos a do criador |
| `functions/src/routes/roles.ts` | Cancelar passa a `dataHoraSaida` antiga; agendar cria as duas |
| `functions/src/routes/aprovacoes.ts` | Aceite continua chamando `agendarLembrete` (agora as duas) |
| `functions/src/routes/participacao.ts` | DELETE apaga as duas tasks e a legada de 1 h |
