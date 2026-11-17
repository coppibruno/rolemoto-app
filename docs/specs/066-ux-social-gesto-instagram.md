# SPEC 066 — UX social no gesto do Instagram

> **Status:** Implementada  
> **Autor:** Assistente IA  
> **Data:** 2026-11-16  
> **Origem:** review PO/QA em produção (conta QA). Superfícies sociais (stories, feed, foto, perfil, Conhecer) precisam parecer Instagram sem abandonar o cockpit do Rolemoto  
> **Padrões:** Next.js 15 App Router — skill `nextjs-patterns`; visual — skill `desenvolvimento-design`  
> **Backend:** Cloud Function `api` — só o que já existe + contagem de fotos no perfil (se faltar). Sem coleção nova  
> **Depende de:** SPEC 049 (stories / anel), SPEC 057 (grade e post), SPEC 063 (Início / curtida), SPEC 064 (Conhecer), SPEC 003 / 024 (Explorar empty), SPEC 001 (dock)  
> **QA:** IDs **IG1**–**IG9**, um PR por ID (ou agrupar front pequeno em um PR se o revisor preferir)

O app já tem bolinha, curtida, grade e DM. O piloto ainda encontra anel sem foto, detalhe de foto “de formulário”, Conhecer roubando o primeiro olhar e empty state mentindo sobre o raio. Esta spec fecha esses buracos com o mínimo de produto.

---

## 1. Objetivo

| ID | Entrega | Camada | Achado |
|----|---------|--------|--------|
| **IG1** | Anel só com story vivo; player vazio não marca visto nem “Rever” | Front (+ ajuste fino na listagem se preciso) | UX-01 |
| **IG2** | Detalhe da foto no gesto Instagram (autor no topo, ícones, sem dock) | Front | UX-02 |
| **IG3** | Double-tap like na foto do feed e no detalhe | Front | UX-05 |
| **IG4** | Faixa **Conhecer** compacta (carrossel) e menos altura no Início | Front | UX-03 |
| **IG5** | Um ponto de entrada para “Seu story”; “Nova foto” só no `+` / perfil | Front | UX-04 |
| **IG6** | Perfil próprio: grade mais cedo; contagem de posts no cartão | Front (+ back se API não tiver total) | UX-07 |
| **IG7** | Empty do Explorar contextual (não pedir “aumente o raio” com SEM LIMITE) | Front | UX-06 |
| **IG8** | Card de evento: 1 CTA primário; convidar/share no overflow | Front | UX-08 |
| **IG9** | Dock: `aria-label` **Perfil** (não “Editar perfil”) | Front | UX-09 |

---

## 2. Recorte

### 2.1 O que entra

- Corrigir anel / visto / empty do player de stories de pessoa.
- Layout do post (`/perfil/[uid]/fotos/[postId]`) alinhado ao gesto Instagram.
- Double-tap para curtir (foto no Início e no detalhe).
- Encolher a faixa Conhecer do Início (SPEC 064 permanece; só muda apresentação).
- Limpar entrada duplicada de story / nova foto no topo do Início.
- Hierarquia do perfil próprio: cartão → Editar → abas/grade; resto (aparência, afiliado, sair) abaixo ou em overflow.
- Contador **N fotos** (ou **N posts**) ao lado de seguindo/seguidores.
- Copy dos empty states do Explorar conforme raio e filtros.
- Densidade do card de evento no Explorar.
- Label a11y do item Perfil no dock.

### 2.2 O que não entra

| Item | Motivo |
|------|--------|
| Redesign visual “clonar Instagram” (ícones thin, brand, tipografia) | Fora do review; tokens do Rolemoto ficam |
| Algoritmo de feed, Reels, Stories com música | Fora do produto |
| Lista de quem curtiu, push de curtida, resposta em fio | Já fora na SPEC 063 / 057 |
| Trocar a lógica de sugestão (faixas, raio 50 km, dispensa) | SPEC 064; aqui só UI da faixa |
| Novo endpoint de stories | Preferir front + comportamento da listagem atual |
| Apagar conta QA / limpar follows | Operação de QA, não produto |
| Telemetria / GPS nativo | Outra jornada |
| Desktop wide layout (coluna à esquerda) | Mobile-first; polish desktop fica para outra spec |

### 2.3 Decisões travadas

| Decisão | Escolha |
|---------|---------|
| Tom | Gesto Instagram **dentro** do visual Rolemoto (laranja, Barlow, dark cockpit) |
| Anel colorido | Só se `GET` da pessoa / listagem garantir ≥ 1 story com `expiresAt` > agora |
| Player vazio | Fecha sozinho ou mostra empty **sem** chamar `visto`; faixa remove a bolinha ou mantém sem anel “novo” |
| Double-tap | Só em mídia de **foto** (card `foto` no Início e detalhe do post). Telemetria / mapa não entram |
| Curtida double-tap | Mesma API de curtida já usada (atividade ou post). Se já curtido, anima de novo e **não** descurte |
| Conhecer no Início | Carrossel horizontal: avatar + nome + SEGUIR; altura ≈ 1 linha de stories + padding. **Ver mais** e dismiss da faixa permanecem |
| Entrada de story | Bolinha **Seu story** (com `+` se sem story ativo). Some o atalho solto **Nova foto** da faixa do Início |
| Nova foto | Continua no menu `+` e no CTA da aba Fotos do perfil |
| Perfil próprio | Ordem: identidade → seguindo/seguidores/**fotos** → Editar perfil → abas (Fotos/Histórico). Aparência, complete perfil, afiliado, sair/excluir **abaixo** da grade ou atrás de “Mais” |
| Contagem de posts | Número de docs em `userspostfoto` daquele uid. Se o perfil já puder derivar da 1ª página, ok no front; senão campo no `GET /perfil` e `GET /usuarios/:uid` |
| Empty Explorar | Se raio = sem limite e lista vazia: não falar em aumentar raio. Sugerir criar no `+` ou mudar data/ritmo |
| Card evento | Primário: **Inscreva-se** / **Comprar ingresso** / estado inscrito. Secundários: menu ⋮ ou ícones (compartilhar, convidar) |
| Dock | `ariaLabel: "Perfil"`; rótulo visual **PERFIL** |

---

## 3. Detalhe por ID

### 3.1 IG1 — Anel e player de story

**Hoje (produção):** bolinha com anel “novo” → player “Nenhuma foto nas últimas 24 h” → ao fechar, rótulo vira “Rever stories…”.

**Comportamento alvo:**

1. A faixa só inclui pessoa com pelo menos uma story não expirada (já é a intenção da SPEC 049; garantir no client e, se a API puder devolver fantasma, filtrar).
2. Se o player abrir e a lista vier vazia (corrida de expiração):
   - não chama `POST …/visto`;
   - fecha o player (ou empty com **Fechar**);
   - remove a bolinha da faixa **ou** atualiza para não pintar anel novo;
   - `onMudou` / refresh da faixa.
3. “Rever” / anel neutro só depois de ter exibido ≥ 1 frame de foto.

Arquivos típicos: `PlayerStories.tsx`, `useReelStories.ts`, `useFaixaStories` / carrossel do Início, `pessoas-story.ts`.

Teste: unitário no mapeamento anel/rótulo se a lógica for pura; QA manual SP3 da 049 + este caso fantasma.

### 3.2 IG2 — Detalhe da foto

Rota: `/perfil/[uid]/fotos/[postId]`.

| Antes | Depois |
|-------|--------|
| Título “FOTO” + foto + autor embaixo | Barra sticky: voltar · avatar+apelido · (opcional share) |
| Curtir = botão largo | Linha de ícones: ♥ · 💬 (foco no campo) · encaminhar story (ícone, não CTA cheio) |
| “Adicionar ao story” em botão full-width | Ícone / item de menu; copy curta se precisar de texto |
| Dock visível | `esconderDock` / padding sem dock nesta rota (padrão de outras telas full-bleed) |
| Comentários ok | Mantém lista + campo; layout abaixo das ações |

Não mudar contrato de API nem regras de quem comenta / encaminha (SPEC 057).

### 3.3 IG3 — Double-tap like

- No card de foto do Início (`CorpoFoto` / equivalente): double-tap na imagem → curtir + overlay de coração ~600 ms.
- No detalhe do post: mesmo gesto na foto.
- Single tap no card do feed continua abrindo o post (não confundir com double-tap: limiar ~300 ms ou detecção de segundo toque).
- Acessibilidade: botão ♥ permanece; double-tap é atalho.

### 3.4 IG4 — Conhecer compacto

SPEC 064: faixa com 3 pessoas entre stories e feed. Esta spec só muda **apresentação**:

- De lista vertical (3 linhas SEGUIR) para **carrossel horizontal** (cards estreitos: foto, nome truncado, motivo em 1 linha se couber, SEGUIR).
- Altura alvo: ≤ ~140 px de conteúdo (sem contar dismiss).
- **Agora não** / fechar faixa e **Ver mais** → `/pilotos` inalterados.

### 3.5 IG5 — Entrada única de story

No Início:

- Mantém bolinha **Seu story** (SPEC 049).
- Remove o botão/atalho **Nova foto** que hoje aparece na faixa ao lado das bolinhas (se existir como item separado).
- Header do app: se o anel do próprio piloto no topo abrir story, ok; não duplicar CTA de publicar foto ali.

Publicar foto permanente: menu `+` → **Nova foto** e CTA na aba Fotos.

### 3.6 IG6 — Perfil e contagem

**Layout (`/perfil`):**

1. Cartão de identidade (foto, nome, apelido, ritmo, moto, cidade).
2. Linha de métricas: **fotos** · **seguindo** · **seguidores** (ordem fixa; toque em seguindo/seguidores como hoje).
3. **Editar perfil** (e Seguindo/Mensagem no público ficam na 025/036).
4. Abas Fotos / Histórico + grade.
5. Abaixo: Aparência, Complete seu perfil, Links de afiliado, Sair, Excluir.

**API (se necessário):**

- `GET /perfil` e `GET /usuarios/:uid` passam a incluir `totalFotos: number` (count de `userspostfoto` daquele uid).
- Alternativa aceitável no MVP desta spec: se a grade já carrega a 1ª página e há cursor, mostrar a contagem só quando a lista couber numa página — **preferir** total no servidor para não mentir.

Sem índice novo se o count for agregado na leitura do perfil (contar docs do uid; se custo preocupar, denormalizar `totalFotos` no `users` nos POST/DELETE de post — só se o PR de back for barato).

### 3.7 IG7 — Empty Explorar

Em `src/app/(app)/feed/constants.ts` (e UI que monta a mensagem):

| Condição | Copy (sentido) |
|----------|----------------|
| Raio finito + vazio | Pode sugerir aumentar o raio / mudar data / ritmo |
| Raio **sem limite** + vazio em Rolês | Não mencionar raio. Ex.: “Nenhum rolê com esses filtros. Mude a data ou o ritmo, ou organize um no +.” |
| Eventos / Locais análogo | Mesma regra: sem “aumente o raio” se já é sem limite |

### 3.8 IG8 — Card de evento

No Explorar (e só se o mesmo componente for o do feed de eventos):

- Uma ação primária laranja (inscrição / ingresso / inscrito).
- Compartilhar e Convidar amigo: ícone no canto ou menu ⋮ — não dois botões full-width empilhados.
- Não mudar fluxo SPEC 026 / 054.

### 3.9 IG9 — Dock

`src/components/menu-inferior/itens-menu.ts`: `ariaLabel: "Perfil"`. Rótulo visual permanece **PERFIL**.

---

## 4. Fora de ordem / dependências internas

Ordem sugerida de PRs:

1. **IG1** (bug) + **IG9** (1 linha)  
2. **IG7** (copy)  
3. **IG3** + **IG2** (gesto foto)  
4. **IG4** + **IG5** (topo do Início)  
5. **IG6** (perfil; back se precisar)  
6. **IG8** (card evento)

Nada bloqueia deploy parcial: cada ID é valor sozinho.

---

## 5. Critérios de aceite (QA)

| ID | Critério |
|----|----------|
| **IG1** | Com story expirado entre listagem e abertura: player não deixa anel em “Rever”; bolinha some ou fica sem estado “novo”. Com story real: anel e replay da 049 continuam |
| **IG2** | Detalhe: autor acima ou na barra; ♥/ações em ícones; dock ausente; comentários e encaminhar story funcionam |
| **IG3** | Double-tap curte foto no Início e no detalhe; segundo double-tap não remove curtida; ♥ continua acessível |
| **IG4** | No Início, Conhecer é carrossel baixo; feed dos amigos aparece sem rolar um card inteiro de 3 SEGUIR |
| **IG5** | Não há atalho “Nova foto” solto na faixa de stories; **Seu story** e `+` / perfil publicam |
| **IG6** | Em `/perfil`, grade/abas vêm logo após Editar; métrica de fotos coerente com a grade |
| **IG7** | Com SEM LIMITE e 0 rolês, empty **não** diz “Aumente o raio” |
| **IG8** | Card de evento: um CTA primário visível; convidar/share não empatam em largura com o primário |
| **IG9** | Leitor de tela anuncia “Perfil” no quinto item do dock |

---

## 6. Referência do review

| Achado | Severidade | ID |
|--------|------------|-----|
| Anel de story vazio | P1 | IG1 |
| Detalhe da foto | P1 | IG2 |
| Conhecer alto | P1 | IG4 |
| Entradas de story | P2 | IG5 |
| Double-tap | P2 | IG3 |
| Empty Explorar | P2 | IG7 |
| Perfil / grade | P2 | IG6 |
| Card evento denso | P2 | IG8 |
| Dock a11y | P3 | IG9 |

Review feito em 2026-11-16 em `https://www.rolemoto.com.br` com a conta QA. Stories públicos da conta de teste foram apagados após o teste; follows de QA permaneceram para o feed.

---

## 7. Não fazer

- Não reescrever SPEC 049 / 057 / 063 / 064 — esta spec **ajusta gesto e hierarquia**.
- Não inventar endpoint de “feed Discovery” Instagram.
- Não mudar cor primária nem tipografia global.
- Não exigir Capacitor para IG1–IG9 (tudo PWA).
