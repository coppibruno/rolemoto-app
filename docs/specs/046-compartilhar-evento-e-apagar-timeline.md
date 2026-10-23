# SPEC 046 — Compartilhar evento (igual rolê) + apagar da timeline

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-10-22  
> **Origem:** share de evento sem imagem/dados/WhatsApp; sem exclusão no histórico  
> **Referência visual:** `designs/compartilhar-role/` (mesmo padrão de convite) + histórico em `designs/perfil/`  
> **Padrões:** Next.js 15 App Router — Server Components por padrão; skill `nextjs-patterns`  
> **Backend:** Cloud Function `api` — `GET /publico/eventos/:id`; `POST /perfil/historico/ocultar`; `DELETE /telemetria/:id`  
> **Coleções:** `eventos` + `usersevento` (leitura pública sanitizada); `usershistoricooculto` (**nova**); `rolestelemetria` (DELETE do dono)  
> **Depende de:** SPEC 015 (convite `/r/{id}` + Web Share + WhatsApp + OG), SPEC 008 / 025 (histórico), SPEC 026 (inscrição), SPEC 030 / 031 (share autenticado), SPEC 036 (share no perfil)  
> **QA:** IDs **P1**, **P2**

---

## 1. Objetivo

Dois entregáveis no mesmo ciclo:

| ID | Entrega |
|----|---------|
| **P1** | Compartilhar evento **igual o rolê**: link público com **imagem** (capa no preview do WhatsApp), **dados** (título, data, local) e fallback **WhatsApp** |
| **P2** | No próprio histórico (`/perfil`), **apagar da timeline** rolês, eventos e telemetrias |

Hoje o share do evento (`useCompartilharEvento`) manda só `🏍️ {titulo} — cola no Rolê Moto` + URL autenticada `/eventos/{id}`. Sem landing pública o crawler do WhatsApp não vê capa nem data. O fallback WhatsApp só entra depois do clipboard falhar.

A timeline lista rolês, eventos e gravados, mas **não tem** ação de remover.

---

## 2. IDs de teste

| ID | Área | Severidade | Sintoma | Critério de aceite | Como testar |
|----|------|------------|---------|--------------------|-------------|
| **P1** | Share evento | Alta | Share sem imagem/dados/WhatsApp | Texto com título + data + local + `/e/{id}`; OG com capa; WhatsApp no fallback | Detalhe, feed e landing `/e/{id}` |
| **P2** | Timeline | Alta | Sem apagar no histórico | Ícone lixeira + confirm; some do próprio e do perfil público | `/perfil` abas + filtro Gravados |

---

## 3. P1 — Compartilhar evento igual o rolê

### 3.1 Recorte

Espelhar a SPEC 015 **no recorte de evento** (destino fixo, inscrição imediata — sem fila):

| Camada | Responsabilidade |
|--------|------------------|
| Front | Landing pública `/e/{id}` (fora de `(app)`), `generateMetadata` (OG), Web Share + WhatsApp + clipboard, botão no card do feed e no detalhe autenticado |
| Back | `GET /publico/eventos/:id` **sem** Bearer, DTO sanitizado (sem lat/lng, sem `inscrito`, sem PII extra) |

**Não** se cria coleção nova neste ID. A inscrição continua `POST /eventos/:id/inscricao` (SPEC 026) **depois** do login.

### 3.2 O que entra

- Rota pública `/e/{id}` — sem dock, sem `GuardaApp`.
- Header: logo + pill **Convite aberto** + share + Entrar (deslogado); logado reusa `CabecalhoDetalhe`.
- Hero com capa (`fotoCapaUrl`), badges de **tipo** e **acesso**, faixa de data (abertura + encerramento se houver).
- Título + status (aberto / já encerrou).
- Card do organizador (reuso do convite de rolê).
- Ficha: quando, local (nome + endereço), acesso.
- Pilotos inscritos (até 4 destaques, sem uid/nome).
- Footer: **Participar do evento** → `/eventos/{id}` (login / primeiro acesso com `?next=`).
- Texto de share:

```
🏍️ {titulo}
📅 {periodo formatado — mesmo critério da faixa do hero}
📍 {local.nome ou endereco}

Abre o convite:
{origin}/e/{id}
```

Ordem do share (igual `useCompartilharConvite`):

1. `navigator.share({ title, text, url })`
2. `https://wa.me/?text={textoCompletoComUrl}`
3. `clipboard.writeText(url)` + toast “Link copiado”

### 3.3 O que **não** entra

| Item | Motivo |
|------|--------|
| Slug `/e/moto-rock-fest` | Id do documento basta |
| QR, Mini App, App Links | Fora da 015 |
| POST de inscrição na landing | Continua no detalhe autenticado (026) |
| Banner WhatsApp gigante separado | Share no header, como o rolê hoje |
| Lotes, preço, “oficial da irmandade” | Sem campo |
| Mudar o contrato de `GET /eventos/:id` | Endpoint autenticado intacto |

### 3.4 DTO público

```ts
export type EventoPublico = {
  id: string;
  titulo: string;
  tipo: TipoEvento;
  fotoCapaUrl: string;
  dataHoraAbertura: string;
  dataHoraEncerramento: string | null;
  acesso: AcessoEvento;
  localNome: string;
  localEndereco: string;
  informacoes: string;
  criador: CriadorPublico; // mesmo shape do rolê
  participantes: {
    confirmados: number;
    destaques: ParticipanteDestaque[]; // até 4, sem uid
  };
};
```

Sem `lat` / `lng`, sem `linkIngresso` no DTO (o detalhe autenticado já mostra o ingresso). Sem `inscrito` / `avaliado`. Evento passado continua **200** — a UI desabilita o CTA.

### 3.5 Backend

```
GET /publico/eventos/:id     sem autenticar
```

1. `eventoRepository.buscarPorId` → 404 se null.
2. Criador via `usuarioRepository.buscarPorId` (fallbacks iguais à 015).
3. `usuarioEventoRepository.contarPorEvento` + `listarDestaquesDoEvento(id, 4)`.
4. `buscarPorIds` dos inscritos → iniciais no router.

Rate limit igual ao de `/publico/roles`. Listar no health.

### 3.6 Front — superfícies de share

| Superfície | URL compartilhada | Texto |
|------------|-------------------|-------|
| Landing `/e/{id}` | `/e/{id}` | Completo (dados + URL) |
| Detalhe `/eventos/{id}` | `/e/{id}` | Completo (precisa data + local, não só título) |
| `EventoCard` do feed | `/e/{id}` | Completo |

`EventoCard` ganha o mesmo ícone `share` do `BotaoCompartilharRole` (≥ 48px). Clique no card **continua** indo a `/eventos/{id}` (inscrição, stories, avaliar ficam no detalhe).

`?next=` ganha `/e/{id}` na allowlist (`destinoSeguro`). **Entrar** no header volta ao convite. **Participar** deslogado usa `next=/eventos/{id}`.

CTA encerrado: disabled + “Este evento já encerrou”. Organizador logado: label **Ver evento** → `/eventos/{id}` (não há tela de gerenciar como no rolê).

### 3.7 Arquitetura Next.js

```
src/app/(publico)/e/[id]/
├── page.tsx                    # Server — metadata + fetch
├── not-found.tsx
├── constants.ts
├── services/evento-publico.service.ts
├── hooks/useCompartilharConviteEvento.ts
├── hooks/useCtaConviteEvento.ts
└── components/…                # tela, hero, ficha, rodapé (~80 linhas)
src/lib/convite-evento.ts       # url + texto
src/types/evento-publico.ts
```

Reusar CSS do convite de rolê (mesmos tokens) e `CardOrganizador` / `GradePilotos` / `CabecalhoPublico` (caminho do convite parametrizado). `page.tsx` Server; Client só em header/footer/share/CTA.

`obterEventoPublico` com `cache()` + `revalidate: 60`.

---

## 4. P2 — Apagar da timeline

### 4.1 Recorte

Só no **próprio** `/perfil` (histórico). Perfil público **não** ganha lixeira.

| Tipo | O que acontece | Por quê |
|------|----------------|---------|
| Rolê (aguardando / participei / criados) | **Oculta** no histórico próprio e público | Não cancela pedido nem apaga o comboio dos outros |
| Evento (inscrito) | **Oculta** no histórico próprio e público | Não cancela a inscrição; o encontro continua |
| Telemetria (filtro Gravados) | **Apaga** o documento `rolestelemetria` | O piloto é o dono do passeio; sem undo |

“Apagar da timeline” ≠ cancelar rolê (já existe em gerenciar) ≠ cancelar inscrição (já existe no detalhe do evento).

### 4.2 UX

- Ícone `delete` à direita do card (mesmo slot visual do clonar, ≥ 48px). No card **Criados**, clonar **e** lixeira cabem lado a lado.
- `window.confirm` (padrão já usado no app):
  - Rolê / evento: `Remover “{titulo}” do seu histórico? O rolê/evento continua existindo.`
  - Telemetria: `Apagar o passeio “{titulo}”? Essa ação não pode ser desfeita.`
- Sucesso: o card some na hora (lista local) e as badges/contagens batem no próximo GET.
- Falha: toast “Não foi possível remover” + o card permanece.
- Loading no botão (disabled) para não double-tap.

Não entra: desfazer, hard-delete de rolê/evento, lixeira no perfil alheio, lixeira na garagem (`/meus-roles`).

### 4.3 Coleção `usershistoricooculto`

```
{
  id: "{usuarioId}_{tipo}_{alvoId}",  // ex. uid_role_abc
  usuarioId: string,
  tipo: "role" | "evento",
  alvoId: string,
  createdAt: timestamp
}
```

Um doc por par. Idempotente. Client deny-all — só a function escreve.

### 4.4 Backend

```
POST /perfil/historico/ocultar
  body: { tipo: "role" | "evento", id: string }
  204 (idempotente) | 400 tipo/id inválido | 401

DELETE /telemetria/:id
  dono do token === usuarioId
  204 | 404 se não existe ou não é o dono | 401
```

`GET /perfil/historico` e `GET /usuarios/:uid/historico` **filtram** os ocultos do dono do histórico **antes** de montar as listas — `contagens` já nascem sem esses itens.

`listarPorUsuario` em `usershistoricooculto` **sem** `orderBy` (evita índice novo).

`RoleTelemetriaRepository.excluir(id)` — apaga o doc. Listas (`GET /telemetria`, `GET /usuarios/:uid/telemetria`) deixam de devolver o passeio.

Não expor `oculto` no DTO do card. Não aceitar `tipo: "telemetria"` no POST de ocultar (telemetria é DELETE real).

### 4.5 Front

```
src/app/(app)/perfil/components/BotaoApagarHistorico.tsx
src/app/(app)/perfil/hooks/useApagarHistorico.ts
```

`historicoService.ocultar({ tipo, id })` → `POST /perfil/historico/ocultar`  
`telemetriaService.excluir(id)` → `DELETE /telemetria/:id`

O hook remove o item da lista em memória e ajusta `contagens` (−1 na aba ativa). Telemetria some do array `telemetrias`.

---

## 5. Fora do escopo

- Share de local com landing pública `/l/{id}`.
- Gerar card canvas (padrão telemetria) — a imagem do evento é a **capa via OG**, como no rolê.
- Soft-delete com undo / “itens ocultos”.
- Apagar rolê ou evento de verdade a partir da timeline.
- Lixeira na garagem ou no perfil público.
- Alterar Security Rules (client continua deny-all).

---

## 6. Critérios de aceite

### P1

- [ ] `https://{host}/e/{id}` abre sem login e sem dock.
- [ ] WhatsApp mostra preview com título, data+local e imagem de capa (`generateMetadata`).
- [ ] Share na landing, no detalhe e no card do feed usa o texto com dados + `/e/{id}`; fallback WhatsApp **antes** de copiar o link.
- [ ] Visitante deslogado toca Participar → login → `/eventos/{id}`.
- [ ] Evento encerrado: página visível, CTA disabled.
- [ ] Evento inexistente: `not-found` amigável.
- [ ] DTO público sem lat/lng, sem `inscrito`, sem uid dos destaques.
- [ ] `GET /eventos/:id` autenticado não muda.

### P2

- [ ] Cada card do histórico próprio tem lixeira (≥ 48px) com confirm.
- [ ] Rolê/evento ocultos somem do próprio histórico e do perfil público; o comboio/encontro continua no feed.
- [ ] Telemetria é apagada de verdade (404 no detalhe; some do filtro Gravados e do perfil público).
- [ ] Perfil alheio não mostra lixeira.
- [ ] Contagens das abas diminuem após remover.
- [ ] Persistência só via repositórios.

---

## 7. Arquivos impactados (resumo)

| Arquivo | Ação |
|---------|------|
| `docs/specs/046-…` | Esta spec |
| `src/app/(publico)/e/[id]/**` | **NOVO** — landing + metadata |
| `src/lib/convite-evento.ts` | **NOVO** |
| `src/lib/destino-pos-auth.ts` | Allowlist `/e/:id` |
| `src/app/(app)/eventos/[id]/hooks/useCompartilharEvento.ts` | Texto + URL públicos |
| `src/app/(app)/feed/components/BotaoCompartilharEvento.tsx` | **NOVO** |
| `src/app/(app)/feed/components/EventoCard.tsx` | Ícone share |
| `src/app/(app)/perfil/components/BotaoApagarHistorico.tsx` | **NOVO** |
| `functions/src/routes/eventos-publico.ts` | **NOVO** |
| `functions/src/routes/historico.ts` | `POST /historico/ocultar` |
| `functions/src/routes/telemetria.ts` | `DELETE /:id` |
| `functions/src/repositories/**/historico-oculto*` | **NOVO** |
| `functions/src/lib/carregar-historico.ts` | Filtra ocultos |

---

## 8. Relação com o código atual

| Hoje | Nesta spec |
|------|------------|
| Share evento = título curto + `/eventos/{id}` | Texto com data/local + `/e/{id}` + OG da capa + WhatsApp primeiro |
| Sem landing pública de evento (031 recusou) | `/e/{id}` — agora o share precisa de crawler, como a 015 |
| Timeline só leitura | Lixeira: ocultar rolê/evento; apagar telemetria |
| `DELETE /telemetria/sessao/:id` (sessão ao vivo) | + `DELETE /telemetria/:id` do passeio salvo |
