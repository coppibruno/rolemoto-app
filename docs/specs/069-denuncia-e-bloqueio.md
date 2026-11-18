# SPEC 069 — Denúncia e bloqueio (Guideline 1.2 / App Store)

> **Status:** Implementada  

> **Autor:** Assistente IA  
> **Data:** 2026-11-18  
> **Origem:** rejeição App Store Connect — Guideline **2.1 Information Needed** + exigência de UGC da **1.2 Safety** (reportar conteúdo ofensivo e bloquear usuário abusivo). Specs 045 / 049 / 057 / 053 deixaram denúncia e bloquear de fora  
> **Padrões:** Next.js 15 App Router — skill `nextjs-patterns`; visual — skill `desenvolvimento-design`  
> **Backend:** Cloud Function `api` — rotas em `moderacaoRouter` (novo); limpeza no `DELETE /perfil`  
> **Coleções:** `usersbloqueio` (**nova**), `usersdenuncia` (**nova**)  
> **Depende de:** SPEC 025 / 036 (perfil público), SPEC 053 (seguir), SPEC 057 (fotos + comentários), SPEC 045 / 049 (stories), SPEC 063 (feed amigos + comentários de atividade), SPEC 039 (`DELETE /perfil`), SPEC 061 (DM — se existir no branch)  
> **QA:** IDs **MB1**–**MB7**, um PR por ID  
> **Contato de moderação (já público):** `contato@rolemoto.com.br` (`src/app/(publico)/privacidade/constants.ts`)

O piloto denuncia conteúdo ou perfil ofensivo e bloqueia outro piloto. A Apple precisa ver isso no vídeo da review. Moderação humana usa o e-mail já publicado e os docs no Firestore — sem painel admin nesta leva.

---

## 1. Objetivo

| ID | Entrega | Camada |
|----|---------|--------|
| **MB1** | Tipos, motivos, normalização do doc de denúncia/bloqueio — lib pura com teste | Back (lib) |
| **MB2** | Coleção `usersbloqueio` + repositório (criar, apagar, listar, `existe`, limpar no `DELETE /perfil`) | Back |
| **MB3** | Coleção `usersdenuncia` + repositório (criar, dedupe 24 h, limpar no `DELETE /perfil`) | Back |
| **MB4** | Rotas: `POST|DELETE /usuarios/:uid/bloqueio`, `GET /bloqueios`, `POST /denuncias` | Back |
| **MB5** | Efeito do bloqueio nas leituras sociais (perfil, seguir, feed amigos, DMs se existirem) | Back |
| **MB6** | Menu overflow: Denunciar / Bloquear no perfil, post, comentário e story | Front |
| **MB7** | Sheet de denúncia + confirmação de bloqueio + lista **Bloqueados** no próprio perfil | Front |

---

## 2. Recorte

### 2.1 O que entra

- **Bloquear** / **Desbloquear** outro piloto (um sentido: eu bloqueio você).
- **Denunciar** perfil, foto de perfil (`post`), comentário de foto, story, item/comentário do feed de amigos (`atividade` / `comentario_atividade`).
- Motivos fixos (chips) + texto opcional.
- Toast de confirmação imediato (“Recebemos sua denúncia”).
- Lista **Bloqueados** em `/perfil/bloqueados` (só o dono).
- Contato de moderação já na política de privacidade; Notes da App Review apontam o mesmo e-mail.
- Ao excluir a conta: saem bloqueios e denúncias em que o uid é autor **ou** alvo.

### 2.2 O que não entra

| Item | Motivo |
|------|--------|
| Painel admin web / fila com status `em_analise` editável na UI | Moderação via Firestore + e-mail nesta leva |
| Filtro automático de palavrão / ML | Apple pede mecanismo humano + report; filtro automático é fase 2 |
| Ban automático ao atingir N denúncias | Decisão humana; evita falso positivo |
| Denunciar rolê, evento, local, avaliação ★, oferta | UGC crítico da review é social (foto, story, comentário, perfil) |
| Conta privada / “só seguidores” | Continua fora (SPEC 053) |
| Remover seguidor sem bloquear | Bloquear já corta o vínculo dos dois lados |
| Push ao ser bloqueado ou denunciado | Privacidade do denunciante; bloqueio é silencioso |
| Ocultar conteúdo alheio sem bloquear (“Não tenho interesse”) | Um gesto só: bloquear |
| Mock Stitch dedicado | Reusa tokens do cockpit + sheet já usado em overflow de evento |

### 2.3 Decisões travadas

| Decisão | Escolha |
|---------|---------|
| Modelo do bloqueio | Um sentido. Eu bloqueio A; A ainda pode me ver **até** eu aparecer nas superfícies dela — mas **nenhum dos dois** interage com o outro (seguir, DM, comentar no conteúdo um do outro). Leituras: quem bloqueou **não vê** o bloqueado no feed/stories/busca; o bloqueado que abrir o perfil de quem bloqueou recebe 404 (ou estado “indisponível”) |
| Quem denuncia | Qualquer autenticado, **exceto** o autor do alvo |
| Dedupe denúncia | Mesmo `(denuncianteId, alvoTipo, alvoId)` em janela de **24 h** → 200 `{ novo: false }` sem segundo doc |
| Motivos | Enum fechado (§3.3). Texto livre opcional, trim, máx. **280** |
| Confirmação denúncia | Sheet: motivo obrigatório → **Enviar**. Sem segundo modal |
| Confirmação bloqueio | Modal Layer 2: “Bloquear {apelido}? Vocês não vão se ver no feed nem conversar.” **Cancelar** / **Bloquear** |
| Após bloquear | Se existir `usersseguir` nos dois sentidos, apaga e corrige contadores (mesmo espírito do `DELETE` seguir). Se existir DM (SPEC 061), a thread some da lista dos dois e `POST` mensagem entre o par retorna 403 |
| Onde mora o menu | `more_vert` no header do perfil alheio; overflow no post / comentário / player de story |
| Cliente | Firestore deny-all. Só a function escreve |
| Review Apple | Conta demo + Notes explicam o caminho: perfil alheio → ⋮ → Denunciar / Bloquear |

### 2.4 Pontos abertos — fechar na discussão

| # | Pergunta | Proposta default |
|---|----------|------------------|
| **A** | Bloqueado vê o perfil de quem bloqueou? | **404** genérico (“Perfil indisponível”) — evita “você me bloqueou” |
| **B** | Denúncia de avaliação / rolê entra depois? | **Fora** desta SPEC |
| **C** | Admin marca denúncia como resolvida via API? | **Não** nesta leva; campo `status` nasce `aberta` e só muda no console Firestore |
| **D** | Feed Explorar (rolês/eventos/locais) filtra criador bloqueado? | **Sim** para cards cujo `criadorId` está bloqueado (nos dois sentidos do par) |

---

## 3. Dados

### 3.1 Coleção `usersbloqueio`

Id `{bloqueadorId}_{bloqueadoId}`. Um doc por par.

```
{
  id: string,              // {bloqueadorId}_{bloqueadoId}
  bloqueadorId: string,    // uid do token
  bloqueadoId: string,     // uid do path
  createdAt: timestamp
}
```

`bloqueadorId` e `bloqueadoId` vêm do token e do path, nunca do body. Timestamp só no servidor.

### 3.2 Coleção `usersdenuncia`

Id auto.

```
{
  id: string,
  denuncianteId: string,
  alvoTipo: "perfil" | "post" | "comentario_post" | "story" | "atividade" | "comentario_atividade",
  alvoId: string,
  acusadoId: string,       // autor do conteúdo / uid do perfil; denormalizado para moderação
  motivo: MotivoDenuncia,
  detalhes: string,        // "" ok; máx 280
  status: "aberta" | "resolvida",  // default aberta; resolvida só no console nesta leva
  createdAt: timestamp
}
```

Índice para dedupe / rate: `denuncianteId` ASC + `alvoTipo` ASC + `alvoId` ASC + `createdAt` DESC.

Índice de moderação: `status` ASC + `createdAt` DESC (consulta no console).

### 3.3 Motivos

```
MotivoDenuncia =
  | "spam"
  | "assedio"
  | "odio"
  | "nudez"
  | "violencia"
  | "outro"
```

| Valor | Rótulo UI |
|-------|-----------|
| `spam` | Spam ou golpe |
| `assedio` | Assédio ou bullying |
| `odio` | Discurso de ódio |
| `nudez` | Nudez ou conteúdo sexual |
| `violencia` | Violência ou ameaça |
| `outro` | Outro |

Se `outro`, `detalhes` é **obrigatório** (após trim, ≥ 3 chars).

### 3.4 Índices (`firestore.indexes.json`)

`usersbloqueio`:

- `bloqueadorId` ASC + `createdAt` DESC — lista Bloqueados
- `bloqueadoId` ASC + `createdAt` DESC — limpeza / “quem me bloqueou” interno

`usersdenuncia`:

- `denuncianteId` + `alvoTipo` + `alvoId` + `createdAt` DESC
- `status` + `createdAt` DESC

---

## 4. API

Auth Bearer em todas. Uid do denunciante/bloqueador **sempre** do token.

### 4.1 `POST /usuarios/:uid/bloqueio`

| Caso | Resposta |
|------|----------|
| `:uid` == token | 400 `{ erro: "não dá para bloquear a si mesmo" }` |
| Perfil alvo inexistente | 404 |
| Doc já existe | 200 `{ bloqueado: true, novo: false }` |
| Cria | 200 `{ bloqueado: true, novo: true }` |

Na mesma transação (ou passo atômico o mais próximo):

1. Upsert `usersbloqueio`.
2. Se existir `usersseguir` `{token}_{uid}` ou `{uid}_{token}`, apaga e ajusta contadores (`max(0, n - 1)`).
3. (Se DM existir) marca o par como bloqueado / impede novas mensagens — ver MB5.

Sem push.

### 4.2 `DELETE /usuarios/:uid/bloqueio`

| Caso | Resposta |
|------|----------|
| Doc não existe | 200 `{ bloqueado: false }` |
| Doc existe | 200 `{ bloqueado: false }` — apaga |

Não recria seguir automaticamente.

### 4.3 `GET /bloqueios`

Só o token. Página 30, `createdAt` desc, cursor = id do vínculo.

```
{
  itens: { uid, nome, apelido, fotoUrl, bloqueadoEm }[],
  proximoCursor: string | null
}
```

Linha cujo `users` sumiu é omitida; o cursor ainda avança pelo id do vínculo.

### 4.4 `POST /denuncias`

Body:

```
{
  alvoTipo: MotivoDenuncia["alvoTipo"],
  alvoId: string,
  motivo: MotivoDenuncia,
  detalhes?: string
}
```

| Caso | Resposta |
|------|----------|
| Body inválido / motivo fora do enum | 400 |
| `outro` sem detalhes ≥ 3 | 400 `{ erro: "conte o que aconteceu" }` |
| Alvo inexistente | 404 |
| Autor denunciando a si | 400 `{ erro: "não dá para denunciar o próprio conteúdo" }` |
| Dedupe 24 h | 200 `{ novo: false }` |
| Cria | 201 `{ novo: true, id }` |

Servidor resolve `acusadoId` a partir do alvo (perfil → uid; post → `usuarioId`; etc.). Cliente **não** manda `acusadoId`.

Sem push ao acusado. Sem e-mail automático nesta leva (moderação olha Firestore / e-mail manual).

### 4.5 Helpers internos (MB5)

`parBloqueado(uidA, uidB): Promise<boolean>` — true se existe `{A}_{B}` **ou** `{B}_{A}`.

Usar em:

| Superfície | Comportamento se par bloqueado |
|------------|--------------------------------|
| `GET /usuarios/:uid` | 404 (ponto A) |
| `POST /usuarios/:uid/seguir` | 403 `{ erro: "não é possível seguir" }` |
| `GET /feed/amigos` | Omite atividades cujo `autorId` está no par |
| `GET /stories/pessoas` / reel | Omite o autor bloqueado |
| `GET /usuarios/busca` | Omite o uid do par |
| `POST` comentário (post ou atividade) se o autor do alvo está no par | 403 |
| DM `POST` mensagem (SPEC 061) | 403 |
| Feed Explorar (ponto D) | Omite item cujo `criadorId` está no par |

Carregar o set de bloqueios do token **uma vez** por request (dois queries: sou bloqueador + sou bloqueado) e filtrar em memória. Não vazar “você está bloqueado” na mensagem de erro — texto neutro.

---

## 5. Excluir conta

No `DELETE /perfil`, além do que já existe:

1. Apagar `usersbloqueio` onde `bloqueadorId == uid` **ou** `bloqueadoId == uid` (lotes de 100).
2. Apagar `usersdenuncia` onde `denuncianteId == uid` **ou** `acusadoId == uid` (lotes de 100).

Falha → log warn e segue 204 (mesmo espírito de stories/dispositivos).

---

## 6. Front

Sem mock novo. CSS Modules + tokens do cockpit. Toque mínimo `--touch-min`.

### 6.1 Menu overflow (componente único)

`MenuModeracao` — itens conforme contexto:

| Contexto | Itens |
|----------|-------|
| Perfil alheio | **Denunciar perfil**, **Bloquear** / **Desbloquear** |
| Post (foto) | **Denunciar foto**, **Bloquear autor** |
| Comentário | **Denunciar comentário**, **Bloquear autor** |
| Story (player) | **Denunciar story**, **Bloquear autor** |
| Atividade (feed amigos) | **Denunciar**, **Bloquear autor** |

Não aparece no próprio conteúdo / próprio perfil.

### 6.2 Sheet denúncia

1. Título: **Denunciar**.
2. Chips dos 6 motivos (um obrigatório).
3. Campo **Detalhes** (opcional; obrigatório se `outro`).
4. CTA **Enviar** → `POST /denuncias` → toast **Recebemos sua denúncia. Vamos analisar.**
5. Erro → toast curto e mantém o sheet aberto.

### 6.3 Modal bloqueio

- Título: **Bloquear {apelidoExibicao}?**
- Corpo: **Vocês não vão se ver no feed, stories nem conversas. Dá para desbloquear depois em Perfil → Bloqueados.**
- **Cancelar** / **Bloquear**
- Sucesso → toast **Bloqueado.** Se estiver no perfil alheio, `router.replace("/")` (ou volta).

Desbloquear: na lista ou no menu do perfil (se ainda acessível só via lista) → confirmação curta → `DELETE`.

### 6.4 `/perfil/bloqueados`

Só o próprio uid (rota irmã de `/perfil`, não de `[uid]`).

- Header: Voltar → `/perfil`, título **Bloqueados**.
- Lista com avatar, nome, `@apelido`, botão **Desbloquear**.
- Vazio: **Ninguém bloqueado**.
- Entrada: link/texto em `/perfil` abaixo das ações secundárias (junto de Sair / Excluir), rótulo **Bloqueados**.

### 6.5 Perfil alheio

No header de `/perfil/[uid]`, `more_vert` abre o menu (§6.1). `GET` 404 → tela **Perfil indisponível** + Voltar (não dizer “bloqueado”).

---

## 7. App Review (Notes)

Texto sugerido (colar em **App Review Information → Notes**):

```
UGC moderation (Guideline 1.2):
- Report: open any other pilot’s profile → ⋮ → “Denunciar perfil”.
  Same menu on photos, comments and stories.
- Block: ⋮ → “Bloquear”. Manage list at Profile → Bloqueados.
- Contact for escalation: contato@rolemoto.com.br
- Account deletion: Profile → Excluir conta
Demo account: <email> / <senha>
```

O vídeo da review deve mostrar: login → abrir perfil alheio → denunciar → bloquear → (opcional) desbloquear → excluir conta.

---

## 8. Arquivos (previsto)

| Arquivo | Ação |
|---------|------|
| `docs/specs/069-denuncia-e-bloqueio.md` | Esta spec |
| `functions/src/types/moderacao.ts` | **NOVO** — tipos |
| `functions/src/lib/moderacao.ts` | **NOVO** — validação, dedupe, `parBloqueado` |
| `functions/src/repositories/interfaces/bloqueio.repository.ts` | **NOVO** |
| `functions/src/repositories/interfaces/denuncia.repository.ts` | **NOVO** |
| `functions/src/repositories/firestore/firestore-bloqueio.repository.ts` | **NOVO** |
| `functions/src/repositories/firestore/firestore-denuncia.repository.ts` | **NOVO** |
| `functions/src/routes/moderacao.ts` | **NOVO** — router |
| `functions/src/index.ts` | `app.use` do router |
| `functions/src/routes/perfil.ts` | Limpeza no `DELETE` |
| `functions/src/routes/usuarios.ts` (e feed/stories/seguir) | Filtro `parBloqueado` |
| `firestore.indexes.json` | Índices §3.4 |
| `src/types/moderacao.ts` | **NOVO** |
| `src/app/(app)/moderacao/...` | Sheet, menu, hooks |
| `src/app/(app)/perfil/bloqueados/page.tsx` | **NOVO** |
| `.cursor/rules/tech-stack.mdc` | Documentar coleções |

---

## 9. Critérios de aceite (QA)

| ID | Caso | Esperado |
|----|------|----------|
| **MB1** | Motivo inválido / `outro` sem texto | 400 |
| **MB2** | Bloquear duas vezes | Segunda resposta `novo: false`; um doc só |
| **MB3** | Bloquear quem eu sigo | Vínculos dos dois lados somem; contadores corretos |
| **MB4** | Denunciar o mesmo post 2× em 1 h | Segunda `novo: false` |
| **MB5** | Feed amigos com autor bloqueado | Item não aparece |
| **MB6** | Menu no próprio post | Sem Denunciar/Bloquear |
| **MB7** | Lista Bloqueados → Desbloquear → seguir de novo | Seguir funciona; bloqueio sumiu |
| **E2E review** | Fluxo do §7 no device físico | Gravável para a Apple |

---

## 10. Relação com outras specs

| Spec | Relação |
|------|---------|
| 045 / 049 / 057 | Tirar “Denúncia” de “fora do escopo” — esta SPEC cobre |
| 053 | Bloquear remove seguir; “bloquear” sai da tabela de exclusões da 053 |
| 061 | DM respeita `parBloqueado` |
| 063 | Feed amigos filtra autor bloqueado |
| 006 / 039 | `DELETE /perfil` limpa as duas coleções |
| Privacidade | E-mail de contato já satisfaz “published contact information” da 1.2 |

---

## 11. Ordem sugerida de PRs

1. **MB1** lib + testes  
2. **MB2** + **MB3** repositórios  
3. **MB4** rotas HTTP  
4. **MB5** filtros nas leituras existentes  
5. **MB6** + **MB7** UI  
6. Atualizar Notes + gravar vídeo da review  
