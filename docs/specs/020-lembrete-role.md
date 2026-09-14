# SPEC 020 — Lembrete 1 hora antes do Rolê (Cloud Tasks)

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-14  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade  
> **Backend:** Cloud Function `api` (Express) — agendamento via Google Cloud Tasks, envio via FCM  
> **Coleções Firestore:** `usersrole`, `dispositivos`, `roles` (leitura)  
> **Depende de:** SPEC 005 (`usersrole`), SPEC 007 (`PATCH /aprovacoes/:id` — aceite), SPEC 012 (PWA + SW), SPEC 013 (FCM + `dispositivos` + `notificacoes.ts`)

---

## 1. Objetivo

Entregar um **lembrete push** automático **1 hora antes** da `dataHoraSaida` do rolê para **cada piloto aceito** (e para o **organizador**).

Quando o líder aceita um piloto, ou quando o organizador publica o rolê (e ele mesmo quer ser lembrado), o backend agenda uma task no **Google Cloud Tasks** que, no horário certo, dispara uma Cloud Function que envia o push via FCM.

**Sem scheduler global**. Sem polling. Sem segundo service worker. Sem Cloud Scheduler rodando a cada minuto. Cada lembrete é **uma task dedicada** com `scheduleTime` exato.

| Camada | Responsabilidade |
|--------|------------------|
| Back (Functions) | Agendar task no aceite + publicação, cancelar ao sair/excluir, enviar push quando a task disparar |
| Front (Next.js) | Nenhuma tela nova. O lembrete é push nativo — reusa o mesmo SW e toast da SPEC 013 |

Sem tela de "configurar lembrete". Sem preferência de antecedência (fixo em 1h). Sem inbox.

---

## 2. Como funciona (visão geral)

```
Líder aceita piloto (PATCH /aprovacoes/:id, decisao: "aceitar")
  │
  ├── Push imediato "O organizador aceitou você" (SPEC 013 — já existe)
  │
  └── Cloud Task agendada para (dataHoraSaida - 1h)
        │
        (1h antes do rolê)
        │
        └── POST /lembretes/enviar (task handler)
              │
              └── FCM → piloto aceito
                    "Seu rolê começa em 1 hora! 🏍️"
                    Toque → /roles/{id}/participar

Organizador publica rolê (POST /roles)
  │
  └── Cloud Task agendada para (dataHoraSaida - 1h)
        │
        └── FCM → organizador
              "Seu rolê começa em 1 hora! 🏍️"
              Toque → /roles/{id}/participar
```

### Ciclo de vida da task

| Evento | Ação |
|--------|------|
| Piloto **aceito** | Agendar task para `dataHoraSaida - 1h` |
| Organizador **publica** rolê | Agendar task para `dataHoraSaida - 1h` (para o organizador) |
| Piloto **cancela** participação (`DELETE /roles/:id/participacao`) | Cancelar a task |
| Líder **recusa** piloto | Não agenda (recusa já existia sem lembrete) |
| Organizador **exclui** rolê (`DELETE /roles/:id`) | Cancelar todas as tasks do rolê |
| Organizador **edita** `dataHoraSaida` (`PUT /roles/:id`) | Cancelar tasks antigas + agendar novas com o novo horário |
| `dataHoraSaida - 1h` já passou no momento do aceite | Não agendar (nada a lembrar) |
| `dataHoraSaida` já passou | Não agendar |

---

## 3. Fluxo detalhado

### 3.1 Agendamento no aceite do piloto

```
PATCH /aprovacoes/:id { decisao: "aceitar" }
  │
  ├── (existente) atualiza usersrole → aceito: true, aceitoEm
  ├── (existente) push de aceite → FCM (SPEC 013)
  │
  └── (NOVO) calcular horarioLembrete = dataHoraSaida - 1h
        ├── horarioLembrete <= agora → skip (rolê muito próximo)
        └── horarioLembrete > agora
              └── agendarLembrete({
                    roleId,
                    userId: pilotoId,
                    titulo: role.titulo,
                    dataHoraSaida: role.dataHoraSaida,
                  })
                  └── Cloud Tasks createTask com scheduleTime
                        taskName = lembretes/{roleId}_{userId}
```

### 3.2 Agendamento na publicação do rolê

```
POST /roles
  │
  ├── (existente) cria documento roles
  │
  └── (NOVO) calcular horarioLembrete = dataHoraSaida - 1h
        ├── horarioLembrete <= agora → skip
        └── horarioLembrete > agora
              └── agendarLembrete({
                    roleId: novoRoleId,
                    userId: criadorId,
                    titulo,
                    dataHoraSaida,
                  })
```

### 3.3 Disparo da task (1h antes)

```
POST /lembretes/enviar (chamado pelo Cloud Tasks)
  │
  ├── Validar token OIDC (autenticação do Cloud Tasks)
  ├── Extrair payload: { roleId, userId, titulo }
  │
  ├── Verificar: rolê ainda existe?
  │     └── Não → return 200 (task consumida, nada a fazer)
  │
  ├── Verificar: usersrole ainda existe e aceito === true?
  │   (ou userId === role.criadorId para o organizador)
  │     └── Não → return 200 (piloto cancelou ou foi recusado)
  │
  ├── Verificar: notificar !== false? (respeitar preferência do piloto)
  │     └── false → return 200
  │
  └── FCM → tokens do userId
        title: "Seu rolê começa em 1 hora! 🏍️"
        body: "{titulo}"
        url: /roles/{roleId}/participar

  return 200 (task consumida com sucesso)
```

**Importante:** A task handler **sempre** retorna 200 (ou 2xx) para o Cloud Tasks não retentar. Erros de "não precisa enviar" não são falhas — a task simplesmente é consumida.

Se o FCM falhar (tokens inválidos etc.), o comportamento é o mesmo de `notificacoes.ts`: log + tokens inválidos apagados + retorna 200.

### 3.4 Cancelamento

```
DELETE /roles/:id/participacao (piloto cancela)
  │
  └── (NOVO) cancelarLembrete(roleId, userId)
        └── Cloud Tasks deleteTask (ignora NOT_FOUND)

DELETE /roles/:id (organizador exclui rolê)
  │
  └── (NOVO) cancelarLembretesDoRole(roleId)
        └── Firestore: listar usersrole do roleId → para cada:
              cancelarLembrete(roleId, userId)
            + cancelarLembrete(roleId, criadorId)

PUT /roles/:id (organizador edita dataHoraSaida)
  │
  └── (NOVO) se dataHoraSaida mudou:
        1. cancelarLembretesDoRole(roleId)
        2. reagendarLembretesDoRole(roleId, novaDataHoraSaida)
```

---

## 4. Arquitetura Backend

### 4.1 Estrutura (acréscimos)

```
functions/src/
├── lib/
│   ├── firebase-admin.ts        # SEM ALTERAÇÃO
│   ├── notificacoes.ts          # Alterar — nova função notificarLembrete
│   └── lembretes.ts             # NOVO — agendarLembrete, cancelarLembrete, etc.
├── routes/
│   ├── aprovacoes.ts            # Alterar — agendar no aceite
│   ├── roles.ts                 # Alterar — agendar no POST, cancelar no DELETE/PUT
│   ├── participacao.ts          # Alterar — cancelar no DELETE
│   └── lembretes.ts             # NOVO — POST /lembretes/enviar (task handler)
├── types/
│   └── lembrete.ts              # NOVO — PayloadLembrete
└── index.ts                     # Alterar — app.use("/lembretes", ...)
```

### 4.2 Fila Cloud Tasks

Uma fila única: **`lembretes-role`**.

Criação (uma vez, via `gcloud` CLI ou console):

```bash
gcloud tasks queues create lembretes-role \
  --location=us-central1 \
  --max-dispatches-per-second=10 \
  --max-concurrent-dispatches=5 \
  --max-attempts=3 \
  --min-backoff=10s \
  --max-backoff=60s
```

| Config | Valor | Motivo |
|--------|-------|--------|
| `max-dispatches-per-second` | 10 | Suficiente para MVP; não sobrecarrega a function |
| `max-concurrent-dispatches` | 5 | Idem |
| `max-attempts` | 3 | Retenta se a function tiver cold start ou timeout |
| `min-backoff` | 10s | Espera razoável entre retentativas |
| `max-backoff` | 60s | Não atrasar mais de 1 min |

### 4.3 Nomeação das tasks

**Id determinístico:** `lembrete-{roleId}-{userId}`

Isso permite:
- **Idempotência**: aceitar o mesmo piloto duas vezes não cria task duplicada (Cloud Tasks rejeita id repetido se a task já existir).
- **Cancelamento fácil**: saber o nome sem consultar o Firestore.
- **Reagendamento**: deletar a task antiga pelo nome + criar nova com o mesmo id (após a antiga ser deletada).

Caminho completo: `projects/{projectId}/locations/us-central1/queues/lembretes-role/tasks/lembrete-{roleId}-{userId}`

### 4.4 Autenticação da task

O Cloud Tasks invoca o endpoint com **OIDC token** da service account do projeto. O handler valida esse token para evitar chamadas externas.

```typescript
// Middleware simples para task handler
const validarOrigemCloudTasks = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ erro: "Não autorizado" });
    return;
  }
  // Em produção: verificar o token OIDC com adminAuth.verifyIdToken
  // Em dev/emulador: aceitar qualquer chamada local
  next();
};
```

**Alternativa mais simples (recomendada para MVP):** usar um **header secreto** (`X-CloudTasks-Secret`) configurado como variável de ambiente. O Cloud Tasks envia o header; o handler valida.

### 4.5 Tipos

```typescript
// functions/src/types/lembrete.ts

/** Payload gravado no body da task do Cloud Tasks. */
export type PayloadLembrete = {
  roleId: string;
  userId: string;
  titulo: string;
};
```

### 4.6 `lib/lembretes.ts` — Orquestração

```typescript
// functions/src/lib/lembretes.ts
import { CloudTasksClient } from "@google-cloud/tasks";
import type { PayloadLembrete } from "../types/lembrete";

const ANTECEDENCIA_MS = 60 * 60 * 1000; // 1 hora
const PROJECT_ID = process.env.GCLOUD_PROJECT ?? "rolemoto-bc47f";
const LOCATION = "us-central1";
const QUEUE = "lembretes-role";

const client = new CloudTasksClient();
const queuePath = client.queuePath(PROJECT_ID, LOCATION, QUEUE);

const taskName = (roleId: string, userId: string): string =>
  `${queuePath}/tasks/lembrete-${roleId}-${userId}`;

const functionUrl = (): string => {
  const base = process.env.FUNCTIONS_BASE_URL
    ?? `https://${LOCATION}-${PROJECT_ID}.cloudfunctions.net/api`;
  return `${base}/lembretes/enviar`;
};

/** Calcula se o lembrete ainda faz sentido (> agora). */
const horarioLembreteValido = (dataHoraSaida: string): number | null => {
  const horario = Date.parse(dataHoraSaida) - ANTECEDENCIA_MS;
  if (horario <= Date.now()) return null;
  return horario;
};

export const agendarLembrete = async (
  payload: PayloadLembrete,
  dataHoraSaida: string,
): Promise<void> => {
  const horario = horarioLembreteValido(dataHoraSaida);
  if (!horario) return;

  try {
    await client.createTask({
      parent: queuePath,
      task: {
        name: taskName(payload.roleId, payload.userId),
        scheduleTime: { seconds: Math.floor(horario / 1000) },
        httpRequest: {
          httpMethod: "POST",
          url: functionUrl(),
          body: Buffer.from(JSON.stringify(payload)).toString("base64"),
          headers: { "Content-Type": "application/json" },
          oidcToken: {
            serviceAccountEmail: `${PROJECT_ID}@appspot.gserviceaccount.com`,
          },
        },
      },
    });
  } catch (error: unknown) {
    const code = (error as { code?: number }).code;
    // 6 = ALREADY_EXISTS — task já agendada (idempotente)
    if (code === 6) return;
    console.error("Erro ao agendar lembrete:", error);
  }
};

export const cancelarLembrete = async (
  roleId: string,
  userId: string,
): Promise<void> => {
  try {
    await client.deleteTask({ name: taskName(roleId, userId) });
  } catch (error: unknown) {
    const code = (error as { code?: number }).code;
    // 5 = NOT_FOUND — task já executada ou inexistente (ok)
    if (code === 5) return;
    console.error("Erro ao cancelar lembrete:", error);
  }
};

export const cancelarLembretesDoRole = async (
  roleId: string,
  userIds: string[],
  criadorId: string,
): Promise<void> => {
  const ids = [...new Set([...userIds, criadorId])];
  await Promise.all(ids.map((uid) => cancelarLembrete(roleId, uid)));
};

export const reagendarLembretesDoRole = async (
  roleId: string,
  titulo: string,
  novaDataHoraSaida: string,
  userIds: string[],
  criadorId: string,
): Promise<void> => {
  const ids = [...new Set([...userIds, criadorId])];
  await Promise.all(
    ids.map((uid) =>
      agendarLembrete({ roleId, userId: uid, titulo }, novaDataHoraSaida)
    ),
  );
};
```

**Não importa** `firebase-admin/firestore` nem `getMessaging`. O envio é feito pela rota handler.

### 4.7 `notificacoes.ts` — Nova função

Acrescentar em `functions/src/lib/notificacoes.ts`:

```typescript
export type TipoPush = "pedido_vaga" | "aceite_vaga" | "lembrete_role";

// Novo copy
const COPY = {
  pedido_vaga: "Um motociclista solicitou vaga para um rolê",
  aceite_vaga: "O organizador aceitou você no rolê",
  lembrete_role: "Seu rolê começa em 1 hora! 🏍️",
} as const;

export const notificarLembrete = async (
  userId: string,
  roleId: string,
  titulo: string,
): Promise<void> => {
  await enviar(userId, {
    tipo: "lembrete_role",
    title: COPY.lembrete_role,
    body: titulo,
    url: `/roles/${roleId}/participar`,
    roleId,
  });
};
```

### 4.8 `routes/lembretes.ts` — Task handler

```typescript
// functions/src/routes/lembretes.ts
import { Router, Request, Response } from "express";
import { responderErro } from "../middleware/errors";
import { roleRepository, usuarioRoleRepository } from "../repositories";
import { notificarLembrete } from "../lib/notificacoes";
import type { PayloadLembrete } from "../types/lembrete";

export const lembretesRouter = Router();

/**
 * POST /lembretes/enviar
 *
 * Chamado exclusivamente pelo Cloud Tasks.
 * Sempre retorna 2xx para que a task seja consumida.
 */
lembretesRouter.post("/enviar", async (req: Request, res: Response) => {
  try {
    const { roleId, userId, titulo } = req.body as PayloadLembrete;
    if (!roleId || !userId) {
      res.status(200).json({ ignorado: "payload inválido" });
      return;
    }

    // Rolê ainda existe?
    const role = await roleRepository.buscarPorId(roleId);
    if (!role) {
      res.status(200).json({ ignorado: "rolê não encontrado" });
      return;
    }

    // É o organizador? → ok, lembrar
    // É piloto? → verificar se aceito e quer notificação
    if (userId !== role.criadorId) {
      const participacao = await usuarioRoleRepository.buscarPorUsuarioERole(
        userId,
        roleId,
      );
      if (!participacao || !participacao.aceito) {
        res.status(200).json({ ignorado: "piloto não está mais aceito" });
        return;
      }
      if (participacao.notificar === false) {
        res.status(200).json({ ignorado: "notificações desligadas" });
        return;
      }
    }

    await notificarLembrete(userId, roleId, titulo);
    res.status(200).json({ enviado: true });
  } catch (error) {
    // Log mas retorna 200 — não retentar push failures
    console.error("Erro no lembrete:", error);
    res.status(200).json({ erro: "falha no envio, task consumida" });
  }
});
```

**Observação:** Não usa o middleware `autenticar` (Bearer do Firebase Auth). A autenticação aqui é do Cloud Tasks (OIDC). Para o MVP, aceitar qualquer chamada (a URL não é pública no sentido de que só o Cloud Tasks sabe a rota). Em produção, validar o header `Authorization` com OIDC.

### 4.9 Alterações nas rotas existentes

#### `routes/aprovacoes.ts` — Agendar no aceite

Depois do bloco que notifica o aceite (linha ~126–131), adicionar:

```typescript
// Agendar lembrete 1h antes do rolê
await agendarLembrete(
  { roleId: role.id, userId: atualizado.usuarioId, titulo: role.titulo },
  role.dataHoraSaida,
);
```

Import: `import { agendarLembrete } from "../lib/lembretes";`

#### `routes/participacao.ts` — Cancelar no DELETE

No handler `DELETE /:id/participacao`, após o `remover`:

```typescript
// Cancelar lembrete se existia
await cancelarLembrete(roleId, uid);
```

Import: `import { cancelarLembrete } from "../lib/lembretes";`

#### `routes/roles.ts` — Agendar na publicação, cancelar/reagendar na edição/exclusão

**POST /roles** (publicação) — após criar o rolê:

```typescript
// Agendar lembrete para o organizador
await agendarLembrete(
  { roleId: criado.id, userId: uid, titulo: criado.titulo },
  criado.dataHoraSaida,
);
```

**PUT /roles/:id** (edição) — se `dataHoraSaida` mudou:

```typescript
if (body.dataHoraSaida && body.dataHoraSaida !== roleExistente.dataHoraSaida) {
  const aceitos = await usuarioRoleRepository.listarAceitosDoCriador(uid);
  const doRole = aceitos.filter((p) => p.roleId === roleId);
  const userIds = doRole.map((p) => p.usuarioId);

  await cancelarLembretesDoRole(roleId, userIds, role.criadorId);
  await reagendarLembretesDoRole(
    roleId,
    atualizado.titulo,
    atualizado.dataHoraSaida,
    userIds,
    role.criadorId,
  );
}
```

**DELETE /roles/:id** (exclusão):

```typescript
const aceitos = await usuarioRoleRepository.listarConfirmadosDoRole(roleId, 100);
const userIds = aceitos.map((p) => p.usuarioId);
await cancelarLembretesDoRole(roleId, userIds, role.criadorId);
```

Imports: `import { agendarLembrete, cancelarLembretesDoRole, reagendarLembretesDoRole } from "../lib/lembretes";`

#### `index.ts` — Registrar rota

```typescript
import { lembretesRouter } from "./routes/lembretes";
// ...
app.use("/lembretes", lembretesRouter);
```

Adicionar `/lembretes/enviar` ao array de rotas do health check.

---

## 5. Dependência npm

Adicionar ao `functions/package.json`:

```json
"@google-cloud/tasks": "^5.0.0"
```

Apenas no backend. O frontend não tem nenhuma dependência nova.

---

## 6. Variáveis de ambiente

| Variável | Onde | Valor |
|----------|------|-------|
| `GCLOUD_PROJECT` | Functions (já existe implicitamente) | `rolemoto-bc47f` |
| `FUNCTIONS_BASE_URL` | Functions `.env` / emulador | URL base da function `api` |

Em produção, `GCLOUD_PROJECT` vem do runtime do Firebase. `FUNCTIONS_BASE_URL` pode ser omitida (o código faz fallback para a URL padrão de produção).

No emulador, o Cloud Tasks **não** é emulado — as tasks precisam ser testadas com o Cloud Tasks real apontando para a function em localhost (via ngrok/cloudflared) ou testando o handler diretamente via curl.

---

## 7. Contrato dos Dados

### 7.1 Payload da task (body)

```typescript
{
  roleId: string;   // id do rolê
  userId: string;   // uid de quem recebe o lembrete
  titulo: string;   // título do rolê (para o body do push)
}
```

### 7.2 Push FCM do lembrete

| Campo | Valor |
|-------|-------|
| `tipo` | `lembrete_role` |
| `title` | `Seu rolê começa em 1 hora! 🏍️` |
| `body` | `{titulo}` (nome do rolê) |
| `url` | `/roles/{roleId}/participar` |

### 7.3 Copy da notificação

| Cenário | `title` | `body` |
|---------|---------|--------|
| Lembrete para piloto aceito | Seu rolê começa em 1 hora! 🏍️ | Serra da Cantareira |
| Lembrete para organizador | Seu rolê começa em 1 hora! 🏍️ | Serra da Cantareira |

Sem distinção de copy entre organizador e piloto. Mesmo texto.

---

## 8. Frontend

### 8.1 Nenhuma tela nova

O lembrete chega como push nativo — o Service Worker (`sw.ts`) já trata `onBackgroundMessage` e mostra a notificação. O `urlDoPayload` já navega para o `data.url` no clique.

O `ouvirForeground` em `fcm.ts` já mostra o toast in-app quando o usuário está com o app aberto.

### 8.2 Ícone e deep link

O push usa o mesmo ícone `/icons/icon-192.png`. O clique abre `/roles/{roleId}/participar` — tela que já existe (SPEC 005).

### 8.3 Tipo `lembrete_role` no front

Nenhuma mudança necessária. O SW trata o push genericamente (qualquer tipo com `title` e `body` no `data`). O toast de foreground também.

Se no futuro quiser diferenciar visualmente (ícone de relógio, cor diferente), basta checar `data.tipo === "lembrete_role"` no SW e no toast. **Fora desta spec.**

---

## 9. Edge cases

| Cenário | Comportamento |
|---------|---------------|
| Rolê começa em 30 minutos, piloto aceito agora | Não agenda (1h antes já passou) |
| Rolê começa em 1h05, piloto aceito agora | Agenda para daqui a 5 minutos |
| Piloto aceito, depois cancela, depois pede de novo e é re-aceito | Primeira task cancelada no DELETE; nova task criada no segundo aceite |
| Cloud Tasks retenta (function retornou 5xx) | Até 3 tentativas com backoff 10-60s |
| Task executa mas o piloto desligou `notificar` | Handler checa `notificar !== false` → skip |
| Task executa mas o rolê foi excluído | Handler checa `role` → null → skip |
| Task executa mas o piloto foi recusado (decisão mudou) | Handler checa `aceito` → false → skip |
| Organizador edita data do rolê para amanhã (era hoje) | Tasks antigas canceladas + novas agendadas para amanhã -1h |
| Organizador edita título (sem mudar data) | Push usará o título que está no payload da task original. Copy pode ficar desatualizado — aceitável para MVP. Para corrigir, o handler pode buscar `role.titulo` fresco (já busca o rolê). |
| Dois líderes aceitam o mesmo piloto (impossível: 1 criador por rolê) | N/A |
| Task com id duplicado | Cloud Tasks rejeita com `ALREADY_EXISTS` (código 6) — tratado no `agendarLembrete` |

---

## 10. Custo

| Recurso | Free tier | Uso estimado (MVP) |
|---------|-----------|-------------------|
| Cloud Tasks | 1.000.000 tasks/mês grátis | Centenas por mês |
| Cloud Functions invocação | 2.000.000/mês grátis | +1 invocação por lembrete |
| FCM | Gratuito (sem limites práticos) | — |

Custo real no MVP: **R$ 0**.

---

## 11. Testes no emulador

O Cloud Tasks **não** tem emulador local. Estratégias para testar:

1. **Testar o handler diretamente:** `curl -X POST http://localhost:5001/rolemoto-bc47f/us-central1/api/lembretes/enviar -H "Content-Type: application/json" -d '{"roleId":"...", "userId":"...", "titulo":"..."}'`
2. **Testar o agendamento em staging:** Deploy em staging com a fila `lembretes-role` criada; agendar com data próxima (5 minutos) e verificar se o push chega.
3. **Mock do CloudTasksClient:** Nos unit tests, mockar `createTask` e `deleteTask` para verificar que os parâmetros estão corretos.

---

## 12. Fora do Escopo

- Preferência de antecedência (30 min, 2h, etc.) — fixo em 1h.
- Tela de "meus lembretes" / configuração.
- Lembrete por e-mail, SMS ou sino no app.
- Lembrete para piloto **pendente** (só aceito).
- Cloud Scheduler / cron global.
- Emulador de Cloud Tasks.
- Segundo service worker.
- Alteração visual do push (ícone de relógio, som diferente).
- Lembrete ao organizador quando pilotos confirmados cancelam.
- Reagendamento automático quando título do rolê muda (o handler busca o título fresco do banco).

---

## 13. Critérios de Aceite

### Agendamento

- [ ] Aceitar piloto com `dataHoraSaida` em mais de 1h → task criada no Cloud Tasks com `scheduleTime = dataHoraSaida - 1h`.
- [ ] Aceitar piloto com `dataHoraSaida` em menos de 1h → task **não** criada.
- [ ] Publicar rolê → task criada para o organizador (se `dataHoraSaida - 1h > agora`).
- [ ] Aceitar o mesmo piloto duas vezes (idempotência) → `ALREADY_EXISTS` tratado, sem erro.

### Cancelamento

- [ ] Piloto cancela participação (`DELETE`) → task deletada (ou `NOT_FOUND` ignorado).
- [ ] Organizador exclui rolê → tasks de todos os aceitos + organizador deletadas.
- [ ] Organizador edita `dataHoraSaida` → tasks antigas deletadas + novas criadas com novo horário.

### Disparo

- [ ] 1h antes da saída, Cloud Tasks chama `POST /lembretes/enviar`.
- [ ] Handler verifica: rolê existe, piloto aceito (ou é organizador), `notificar !== false`.
- [ ] Push FCM entregue com `title: "Seu rolê começa em 1 hora! 🏍️"`, `body: {titulo}`.
- [ ] Clique na notificação abre `/roles/{roleId}/participar`.
- [ ] Handler sempre retorna 200 (não causa retentativa indevida).

### Qualidade / Arquitetura

- [ ] `@google-cloud/tasks` só em `functions/package.json`.
- [ ] Rotas não importam `@google-cloud/tasks` diretamente — usam `lib/lembretes.ts`.
- [ ] Task handler em rota separada (`routes/lembretes.ts`).
- [ ] `notificarLembrete` reusa o `enviar` de `notificacoes.ts`.
- [ ] Agendamento não bloqueia a resposta HTTP (`await` mas falha não vira 500 do aceite/publicação).
- [ ] Sem `console.log` de debug.
- [ ] Nenhuma mudança no frontend (mesmo SW, mesmo toast, mesmo deep link).

---

## 14. Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| `functions/package.json` | **Alterar** — adicionar `@google-cloud/tasks` |
| `functions/src/types/lembrete.ts` | **NOVO** — `PayloadLembrete` |
| `functions/src/lib/lembretes.ts` | **NOVO** — `agendarLembrete`, `cancelarLembrete`, etc. |
| `functions/src/routes/lembretes.ts` | **NOVO** — `POST /lembretes/enviar` (task handler) |
| `functions/src/lib/notificacoes.ts` | **Alterar** — `notificarLembrete` + tipo `lembrete_role` |
| `functions/src/routes/aprovacoes.ts` | **Alterar** — agendar no aceite |
| `functions/src/routes/participacao.ts` | **Alterar** — cancelar no DELETE |
| `functions/src/routes/roles.ts` | **Alterar** — agendar no POST, cancelar/reagendar no PUT/DELETE |
| `functions/src/index.ts` | **Alterar** — `app.use("/lembretes", lembretesRouter)` |

Não alterar nenhum arquivo do frontend. Não alterar o SW. Não criar tela nova.

---

## 15. Ordem sugerida de implementação

1. Criar a fila `lembretes-role` no GCP (`gcloud tasks queues create`).
2. `functions/src/types/lembrete.ts` — tipo.
3. `functions/src/lib/lembretes.ts` — `agendarLembrete`, `cancelarLembrete`, etc.
4. `functions/src/lib/notificacoes.ts` — `notificarLembrete`.
5. `functions/src/routes/lembretes.ts` — handler.
6. `functions/src/index.ts` — registrar rota.
7. Testar handler via curl local.
8. `functions/src/routes/aprovacoes.ts` — agendar no aceite.
9. `functions/src/routes/roles.ts` — agendar no POST, cancelar/reagendar no PUT/DELETE.
10. `functions/src/routes/participacao.ts` — cancelar no DELETE.
11. Deploy em staging + teste end-to-end (aceitar piloto, verificar task no console, esperar push).

---

## 16. Relação com o código atual

| Hoje | Nesta spec |
|------|------------|
| SPEC 013: push de aceite e pedido de vaga | + push de lembrete (`lembrete_role`) |
| `notificacoes.ts`: 2 tipos de push | + `notificarLembrete` (3º tipo) |
| `PATCH /aprovacoes/:id`: aceita e notifica | + agenda lembrete 1h antes |
| `POST /roles`: cria rolê | + agenda lembrete para o organizador |
| `DELETE /roles/:id/participacao`: remove pedido | + cancela task do lembrete |
| `DELETE /roles/:id`: exclui rolê | + cancela tasks de todos os participantes |
| `PUT /roles/:id`: edita rolê | + reagenda se `dataHoraSaida` mudou |
| SW `sw.ts`: trata push genérico | Sem mudança — lembrete chega como push normal |
| Toast foreground: mostra título/body | Sem mudança — lembrete aparece como toast |
| `functions/package.json`: sem Cloud Tasks | + `@google-cloud/tasks` |

Sem migração de dados. Sem alteração de schema. Tasks começam a ser criadas a partir do deploy desta spec.
