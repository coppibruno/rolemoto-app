# SPEC 059 — Vitrine de parceria no local

> **Status:** Proposta
> **Autor:** Assistente IA
> **Data:** 2026-11-11
> **Origem:** o dono do local publica o que o piloto mostra no caixa
> **Referência visual:** `designs/parceria-local/code.html`
> **Padrões:** Next.js 15 App Router — skill `nextjs-patterns`; visual — skill `desenvolvimento-design`
> **Backend:** Cloud Function `api` — ofertas e dono no `locaisRouter`
> **Coleções:** `ofertaslocal` (**nova**), `usersofertacupom` (**nova**). Campo interno `donoId` em `locais`. Lê `users` e `userslocalcheckin`
> **Depende de:** SPEC 023 (local), SPEC 024 (feed de locais), SPEC 031 (detalhe), SPEC 044 (check-in), SPEC 053 (busca de piloto e `apelidoExibicao`), SPEC 006 / 039 (apagar conta)
> **QA:** IDs **VP1**–**VP8**, um PR por ID

O piloto acha a oferta no raio e mostra a própria tela no caixa. O dono escreve o que vale, o código e a regra. O caixa aplica o que está escrito. O app não confirma a venda.

---

## 1. Objetivo

Um local oficial que já existe no catálogo ganha uma vitrine. O admin vincula a conta de quem cuida do ponto. Essa conta publica até cinco ofertas. Quem está no app vê o selo **Parceiro** e, no detalhe, abre o cupom com o próprio nome, a moto, o código e a regra.

| ID | Entrega | Camada |
|----|---------|--------|
| **VP1** | Vigência, rótulo e validação da oferta, com teste e sem rede | Back (lib pura) |
| **VP2** | Coleção e CRUD da oferta | Back |
| **VP3** | Vínculo do dono, atalho no próprio perfil e limpeza ao apagar a conta | Back |
| **VP4** | `ofertaVigente` na listagem e no detalhe; leitura das ofertas | Back |
| **VP5** | Abertura do cupom e números do balcão | Back |
| **VP6** | Selo e faixa no card | Front |
| **VP7** | Bloco de ofertas e folha do cupom | Front |
| **VP8** | Balcão, formulário, vínculo no detalhe e atalho no perfil | Front |

---

## 2. Recorte

### 2.1 O que entra

- Admin vincula, troca ou solta a conta dona de um local que já existe.
- Dono (e admin, para suporte) cria, edita, pausa e apaga ofertas daquele local.
- Oferta com tipo preço, percentual ou brinde, código escolhido pelo dono, regra em texto, teto diário opcional e janela de dia e hora.
- Card da aba Locais e do catálogo `/locais` com selo **Parceiro** e faixa da oferta que está no ar.
- Detalhe do local com a lista de ofertas ativas e a folha do cupom.
- Balcão em `/locais/[id]/balcao` com a lista e a semana: cupons abertos e check-ins.
- Atalho no próprio perfil quando a conta é dona de algum ponto.

### 2.2 O que não entra

| Item do desenho / desejo | Motivo |
|--------------------------|--------|
| Fila **Agora no caixa** e botão **Confirmar** | O caixa não usa o app. A tela do piloto é o cupom |
| Código novo a cada uso (`7K4M`) e validade em minutos | O código é o que o dono combinou com o caixa |
| **Restam 12** | Sem confirmação de venda não há saldo |
| Ticket médio e “passaram no caixa” | O app não vê o pagamento |
| Nota de comissão | Sem cobrança |
| **Avisar quem favoritou** | Push fica para uma spec seguinte |
| Dono editar ficha, foto ou horário do ponto | A ficha continua da SPEC 023, só admin |
| Piloto se declarar dono | O vínculo nasce no admin |
| Oferta no `GET /publico/locais/:id` | O convite público não vira cupom |
| Reordenar o feed para subir parceiro | A aba Locais continua por distância |

### 2.3 Desvios conscientes do mock

| Mock | Nesta spec | Por quê |
|------|------------|---------|
| Código de 4 letras gerado na hora | Código de 4 a 8 caracteres, escrito pelo dono | O caixa já conhece o código |
| “Vale até 16:42 · o caixa confirma” | Janela da oferta (dia e faixa de hora) e a regra | Quem aplica a regra é o estabelecimento |
| “restam 12” na faixa | “até 17h” e, se houver teto, “até 20 por dia” | O teto é aviso, não contador |
| Balcão com visitas para confirmar | Lista de ofertas e dois números da semana | Dá para medir abertura de cupom e check-in |
| Toggle de aviso e frase de comissão | Fora do formulário | Fora desta versão |

### 2.4 Decisões travadas

| Decisão | Escolha |
|---------|---------|
| Quem publica | A conta em `locais.donoId`. Admin também, para suporte |
| Quem vincula | Só admin. A conta já existe. Um local, um dono. Uma conta pode ter vários locais |
| Soltar o dono | `donoId` volta a `null` e as ofertas daquele local pausam |
| Trocar o dono | As ofertas permanecem como estão |
| Cupom | A folha mostra nome de exibição, moto, oferta, código e regra. O código só aparece com a oferta no ar |
| Contagem | Uma abertura por piloto, por oferta, por dia. Repetir no mesmo dia devolve o mesmo cupom |
| Semana do balcão | Segunda 00:00 em `America/Sao_Paulo` até agora |
| Cliente | Firestore continua deny-all. O client só fala com a function |
| `donoId` | Campo interno. Não sai em `GET /locais` nem no perfil público |

### 2.5 Caminho

1. O admin abre o detalhe do local, busca o piloto e vincula a conta.
2. O dono abre o balcão, publica a oferta e combina o código com o caixa.
3. O piloto vê a faixa no card, abre o detalhe e mostra a folha no caixa.
4. O caixa lê o código e a regra e aplica o desconto. Nada volta para o app.

---

## 3. Dados

### 3.1 `locais.donoId`

```
donoId: string | null
```

Documentos antigos sem o campo são lidos como `null`. O mapper não coloca o campo no JSON de listagem, detalhe público nem `GET /publico/locais/:id`.

Índice simples em `donoId` (o automático do Firestore) para achar os pontos da conta.

### 3.2 Coleção `ofertaslocal`

Id auto. No máximo 5 documentos por `localId`, contando pausadas.

```
{
  id: string,
  localId: string,
  titulo: string,             // 1..60, trim
  tipo: "preco" | "percentual" | "brinde",
  valor: number | null,       // preço > 0 e ≤ 99999.99, até 2 casas; percentual inteiro 1..100; brinde = null
  codigo: string,             // 4..8, A–Z e 0–9, gravado em maiúsculas
  regra: string,              // 1..280, trim
  tetoDia: number | null,     // inteiro 1..999, ou null. Só texto para o caixa
  dias: number[],             // 0..6, sem repetir. [] = todos os dias
  horaInicio: string | null,  // "HH:mm" ou null
  horaFim: string | null,     // os dois preenchidos, ou os dois null (o dia todo)
  ativa: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

`localId` vem do path. Timestamps só no servidor. O código é único no local, entre ativas e pausadas, sem distinguir maiúsculas.

Os dois horários nulos valem o dia inteiro. Os dois preenchidos exigem `horaFim` maior que `horaInicio`. Faixa que vira a noite fica fora.

### 3.3 Coleção `usersofertacupom`

Id `{usuarioId}_{ofertaId}_{ymd}`. `ymd` é a data em `America/Sao_Paulo` (`YYYY-MM-DD`).

```
{
  id: string,
  usuarioId: string,    // uid do token
  ofertaId: string,
  localId: string,
  createdAt: timestamp
}
```

Um doc por piloto, oferta e dia. Abrir de novo no mesmo dia não grava outro.

Índice composto: `localId` ASC + `createdAt` DESC.

### 3.4 Check-ins da semana

A contagem lê `userslocalcheckin` (SPEC 044). Índice novo: `localId` ASC + `createdAt` DESC. A contagem é de documentos, não de pilotos distintos.

### 3.5 Vigência

Lib pura em `functions/src/lib/oferta-local.ts`. Sem Firestore. VP1 cobre este módulo.

Uma oferta está **vigente** quando `ativa` e o relógio de `America/Sao_Paulo` cai num dia de `dias` (ou em qualquer dia, se `dias` é `[]`) e dentro da faixa. Faixa nula vale de 00:00 a 23:59.

Se várias estiverem vigentes, a do card é a de `updatedAt` mais recente.

O rótulo:

| Tipo | Rótulo |
|------|--------|
| `preco` | `R$ 32` ou `R$ 32,50` (pt-BR, sem centavos quando o valor é inteiro) |
| `percentual` | `10%` |
| `brinde` | `BRINDE` |

---

## 4. Contrato HTTP

Tudo autenticado, no `locaisRouter`, no mesmo rate limit. Uid só do token. Router novo `functions/src/routes/oferta-local.ts`, montado como o de check-in.

Quem é **dono** é `local.donoId === uid`. Quem é **admin** é `users.admin === true`, a mesma regra de `exigirAdmin`.

### 4.1 `PUT /locais/:id/dono`

Só admin. Body: `{ uid: string | null }`.

| Status | Quando | `erro` |
|--------|--------|--------|
| 200 | Vinculou, trocou, repetiu o mesmo uid ou soltou | — |
| 400 | `uid` ausente ou de outro tipo | `uid é obrigatório` |
| 404 | Local inexistente | `Local não encontrado` |
| 404 | `uid` string e a conta não existe | `Piloto não encontrado` |
| 403 | Token sem admin | `Sem permissão` |
| 401 | Sem Bearer | `Não autenticado` |

Resposta 200: `{ donoId: string | null }`.

`uid: null` também pausa todas as ofertas daquele local (`ativa: false`). Trocar por outro uid não pausa.

### 4.2 `POST /locais/:id/ofertas`

Dono ou admin. Body:

```
{
  titulo: string,
  tipo: "preco" | "percentual" | "brinde",
  valor: number | null,
  codigo: string,
  regra: string,
  tetoDia: number | null,
  dias: number[],
  horaInicio: string | null,
  horaFim: string | null
}
```

Nasce `ativa: true`.

| Status | Quando | `erro` |
|--------|--------|--------|
| 201 | Criou | — |
| 400 | Campo inválido | a mensagem da lib (seção 4.6) |
| 404 | Local inexistente | `Local não encontrado` |
| 403 | Não é dono nem admin | `Sem permissão` |
| 409 | Já há 5 ofertas neste local | `Este local já tem 5 ofertas` |
| 409 | Código já usado neste local | `Já existe uma oferta com esse código neste local` |

Resposta 201: a oferta no shape do dono (seção 4.7), com `vigente` calculado.

### 4.3 `PUT /locais/:id/ofertas/:ofertaId`

Dono ou admin. O body é o mesmo do POST, mais `ativa: boolean`. Não muda `localId`. Vale o mesmo 400, 403, 404 e o 409 de código (ignorando a própria oferta). Não esbarra no teto de 5.

404 se a oferta não existe ou pertence a outro local: `Oferta não encontrada`.

### 4.4 `PATCH /locais/:id/ofertas/:ofertaId`

Dono ou admin. Body: `{ ativa: boolean }`. Só muda a pausa. 400 se `ativa` não for boolean: `ativa é obrigatória`.

### 4.5 `DELETE /locais/:id/ofertas/:ofertaId`

Dono ou admin. 204. Os docs de `usersofertacupom` ficam, para a semana do balcão continuar verdadeira. 404 se a oferta não é deste local.

### 4.6 Mensagens da validação

A lib devolve a primeira falha:

| Caso | `erro` |
|------|--------|
| Título vazio ou com mais de 60 | `Dê um nome de até 60 caracteres` |
| `tipo` fora dos três | `tipo inválido` |
| Preço ausente, ≤ 0, acima de 99999.99 ou com mais de 2 casas | `Informe o preço` |
| Percentual fora de 1..100 ou com casa decimal | `Informe o percentual de 1 a 100` |
| Brinde com valor | `Brinde não leva valor` |
| Código fora de `^[A-Z0-9]{4,8}$` depois de tirar espaço e pôr em maiúsculas | `O código tem de 4 a 8 letras ou números` |
| Regra vazia ou com mais de 280 | `Escreva a regra em até 280 caracteres` |
| `tetoDia` presente e fora de 1..999 inteiro | `O teto por dia é de 1 a 999` |
| `dias` com número fora de 0..6 ou repetido | `Dia inválido` |
| Só um dos horários preenchido | `Informe início e fim, ou deixe os dois vazios` |
| Hora fora de `HH:mm` | `Horário inválido` |
| `horaFim` menor ou igual a `horaInicio` | `O fim precisa ser depois do início` |

### 4.7 Shape da oferta

```
{
  id: string,
  titulo: string,
  tipo: "preco" | "percentual" | "brinde",
  valor: number | null,
  rotulo: string,
  codigo: string | null,
  regra: string,
  tetoDia: number | null,
  dias: number[],
  horaInicio: string | null,
  horaFim: string | null,
  ativa: boolean,
  vigente: boolean
}
```

`codigo` é `null` para quem não é dono nem admin quando `vigente` é false. Dono e admin recebem o código sempre. Piloto não recebe ofertas com `ativa: false`.

### 4.8 `GET /locais/:id/ofertas`

Qualquer autenticado. Lista as que ele pode ver (seção 4.7), `updatedAt` desc. Local inexistente: 404.

### 4.9 `POST /locais/:id/ofertas/:ofertaId/cupom`

Qualquer autenticado. Sem body.

| Status | Quando | `erro` |
|--------|--------|--------|
| 200 | Oferta vigente. Grava o doc do dia, ou devolve o que já existe | — |
| 404 | Oferta pausada, de outro local ou inexistente | `Oferta não encontrada` |
| 409 | Ativa, mas fora da janela | `Essa oferta não está no ar agora` |
| 404 | Local inexistente | `Local não encontrado` |

Fora da janela não grava `usersofertacupom`.

Resposta 200:

```
{
  ofertaId: string,
  titulo: string,
  rotulo: string,
  regra: string,
  tetoDia: number | null,
  dias: number[],
  horaInicio: string | null,
  horaFim: string | null,
  codigo: string,
  piloto: { nome: string, moto: string },
  novo: boolean
}
```

`piloto.nome` usa `apelidoExibicao` de `functions/src/lib/apelido.ts`. `moto` é a do perfil; string vazia se não houver. `novo` é true só na primeira abertura daquele dia.

### 4.10 `GET /locais/:id/balcao`

Dono ou admin.

```
{
  local: { id: string, nome: string },
  semana: { cuponsAbertos: number, checkins: number },
  ofertas: OfertaDono[]
}
```

`OfertaDono` é o shape da seção 4.7 com `codigo` sempre string. `cuponsAbertos` conta `usersofertacupom` do local desde a segunda 00:00. `checkins` conta `userslocalcheckin` no mesmo intervalo. 403 para piloto comum.

### 4.11 Listagem e detalhe

`GET /locais` (aba Locais e catálogo) ganha, em cada item:

```
ofertaVigente: {
  id: string,
  titulo: string,
  rotulo: string,
  tetoDia: number | null,
  dias: number[],
  horaInicio: string | null,
  horaFim: string | null
} | null
```

Sem `codigo`. `null` quando nenhuma oferta está vigente. A ordem continua `distanciaKm` ascendente.

`GET /locais/:id` ganha o mesmo `ofertaVigente` e `souDono: boolean`.

Se o token é admin, o detalhe inclui também `dono: { uid: string, nome: string } | null`. `nome` é `apelidoExibicao`. Para quem não é admin, a chave `dono` não vai no JSON.

`GET /feed/contagens` não muda.

### 4.12 `GET /perfil`

Campo extra, só nesta rota (não em `GET /usuarios/:uid`):

```
locaisComoDono: { id: string, nome: string }[]
```

`[]` quando a conta não é dona de nenhum local. Ordem por nome.

### 4.13 `DELETE /perfil`

No mesmo bloco das outras limpezas, depois de apagar o Auth: locais com `donoId` igual ao uid voltam a `donoId: null` e as ofertas desses locais pausam. Falha nessa limpeza não impede o 204, no mesmo padrão de seguir e convite.

---

## 5. Front

Visual alinhado a `designs/parceria-local/code.html` e aos tokens do app. Client Component só onde há toque, busca ou folha.

### 5.1 Card

Em `src/app/(app)/feed/components/LocalCard.tsx` e no card do catálogo `src/app/(app)/locais/components/LocalCard.tsx`:

- Com `ofertaVigente`: selo **Parceiro** e faixa com título, rótulo e a janela curta.
- Janela curta: se há `horaFim`, “até 17h”; se há `tetoDia`, “até 20 por dia”; se a faixa é o dia todo e não há teto, “hoje”.
- Sem oferta vigente, o card fica como está.

### 5.2 Detalhe `/locais/[id]`

- Sem oferta ativa, nenhum bloco novo.
- Com oferta ativa: seção **Ofertas pelo app**. Cada linha mostra título, rótulo e a janela (“Quarta · 14:00–17:00”, “Todo dia”, “Seg–sex · o dia todo”).
- Linha vigente abre a folha. Linha fora da janela não abre folha e não chama o POST; o texto da janela basta.
- A folha chama `POST .../cupom`. Enquanto espera, a folha mostra o título sem o código. No 200, mostra o código em destaque, `piloto.nome`, `piloto.moto` (a linha da moto some se vier vazia), a regra e o teto quando existir.
- 409: a folha fecha e a lista é buscada de novo.
- **Estou aqui** continua o bloco da SPEC 044.

Se `souDono` ou o perfil logado é admin: link **Balcão** para `/locais/[id]/balcao`.

Se o perfil logado é admin: bloco **Dono do balcão**. Busca com `GET /usuarios/busca` (a mesma da SPEC 053, a partir de 2 letras). Escolher uma linha chama o PUT. **Soltar** manda `{ uid: null }` e pede confirmação. O bloco mostra o `dono.nome` atual, ou “Ninguém” quando `dono` é null.

### 5.3 Formulário

`/locais/[id]/ofertas/nova` e `/locais/[id]/ofertas/[ofertaId]`.

- Segmento **Preço** | **Percentual** | **Brinde**.
- Campos: o que é, o valor (some no brinde), código, regra, teto por dia (opcional), dias e a faixa de hora (opcional).
- **Publicar oferta** no criar. **Salvar** no editar.
- 409 de código ou de teto aparece no campo correspondente.
- Quem não é dono nem admin cai no detalhe do local.

### 5.4 Balcão `/locais/[id]/balcao`

- Título **Balcão** e o nome do local.
- Semana: **abriram o cupom** e **marcaram presença**, com zero quando for o caso.
- Lista de todas as ofertas, pausadas inclusive. Cada uma pausa e volta pelo PATCH, edita e apaga.
- `+` abre a nova oferta.
- Vazio: “Nenhuma oferta ainda” e o mesmo CTA.
- Piloto sem vínculo cai no detalhe do local.

### 5.5 Perfil

Se `locaisComoDono` tem itens, uma faixa **Meus pontos** no próprio perfil. Cada linha abre o balcão daquele local. Some quando o array vem vazio. Não aparece no perfil de outra pessoa.

---

## 6. IDs de teste

| ID | Área | Critério de aceite |
|----|------|--------------------|
| **VP1** | Lib | Preço, percentual, brinde, código, janela e rótulo. Fora do horário, `vigente` é false. Entre duas vigentes, a de `updatedAt` maior fica no card |
| **VP2** | CRUD | Dono cria. O sexto POST responde 409. Código repetido responde 409. Piloto recebe 403. Pausa some da leitura do piloto e continua na do dono |
| **VP3** | Dono | Admin vincula e solta. Soltar pausa as ofertas. Piloto não vincula. `GET /perfil` lista o ponto; `GET /usuarios/:uid` não traz `locaisComoDono`. Apagar a conta solta e pausa |
| **VP4** | Leitura | `GET /locais` traz `ofertaVigente` sem código. Fora da janela o campo é null. A distância continua decidindo a ordem. Detalhe de admin traz `dono`; o do piloto não tem a chave |
| **VP5** | Cupom | POST vigente grava um doc e devolve código, nome e moto. O segundo POST no mesmo dia responde `novo: false` e não duplica. Fora da janela: 409 e nenhum doc. Balcão conta cupons e check-ins da semana; piloto recebe 403 |
| **VP6** | Card | Oferta no ar mostra **Parceiro** e a faixa na aba Locais e no catálogo. Sem oferta vigente, o card não muda |
| **VP7** | Folha | Toque na oferta vigente abre a folha com código, nome, moto e regra. Fora da janela a linha não chama o POST |
| **VP8** | Dono | Admin vincula pela busca. Dono publica, pausa e vê os dois números. O perfil próprio abre o balcão |

---

## 7. Fora desta entrega

Confirmação da venda no caixa, código que nasce na hora e expira em minutos, comissão e o aviso para quem favoritou. A coleção de ofertas e o balcão permanecem o lugar desses passos.
