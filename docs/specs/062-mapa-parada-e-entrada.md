# SPEC 062 — Mapa que não derruba o app, entrada no rolê aberto, parada em um passo e rota no Maps

> **Status:** Proposta
> **Autor:** Assistente IA
> **Data:** 2026-11-15
> **Origem:** o mapa offline falhou e impediu o app de carregar; o criador não é avisado quando alguém entra num rolê aberto; adicionar parada pede dois toques; abrir no Maps não leva as paradas nem o percurso da estrada
> **Padrões:** Next.js 15 App Router — skill `nextjs-patterns`; visual — skill `desenvolvimento-design`
> **Backend:** Cloud Function `api` — só **NE**, em `POST /roles/:id/participacao`
> **Coleções:** nenhuma nova. O push usa `dispositivos`, que já existe
> **Depende de:** SPEC 013 e 042 (push), SPEC 019 (abrir no Maps), SPEC 051 (mapa online), SPEC 060 (paradas e pacote), SPEC 061 (rolê aberto)
> **QA:** IDs abaixo, um PR por ID. **MO** e **RM** editam a tela do mapa; o segundo faz rebase

Quatro frentes. Nenhuma espera a outra. **PA** e **NE** não compartilham arquivo com ninguém. **MO** e **RM** se encontram em `TelaMapaViagem.tsx`: um isola o desenho do pacote, o outro troca o link.

| Pedido | ID | Nesta spec |
|--------|-----|------------|
| Mapa offline derrubou a carga do app | **MO1** | Sim. O pacote deixa de poder impedir o Rolemoto de abrir |
| Aviso quando alguém entra num rolê aberto | **NE1** | Sim. Push novo para o criador |
| Botão de adicionar parada | **PA1** | Sim. O ponto escolhido já entra na lista |
| Paradas e percurso real no Maps | **RM1** | Sim. O link leva cada parada e a rota de carro |

---

## 1. Como paralelizar

1. Abrir um branch por ID.
2. **PA** mexe no cartão de paradas do criar, editar e clonar.
3. **NE** mexe no `POST /participacao` e no catálogo de push.
4. **MO** cerca o desenho do pacote na tela `/roles/[id]/mapa`.
5. **RM** troca a URL de **Abrir no Maps** nessa mesma tela. Se **MO** ainda não mergeou, o rebase é só o link.

---

## MO — O mapa offline não impede o app

A SPEC 060 grava um pacote no celular e, quando ele existe, a tela do mapa troca o mapa online pelo MapLibre lendo `mapa.pmtiles`. Esse desenho entra no carregamento da rota. Se o arquivo, o protocolo ou o desenho falha, a tela não aparece. No WebView, uma falha nesse ponto é o app que não carrega.

A mesma spec previa uma página local em `server.errorPath` para quando o site não abre. Essa porta **não** está no `capacitor.config.ts` e `public/mapa-viagem/` não existe. Esta frente não liga essa porta. O aplicativo instalado continua abrindo `https://www.rolemoto.com.br`.

### MO1 — Falha do pacote fica na tela do mapa

| | |
|--|--|
| Camada | Front, só a tela `/roles/[id]/mapa` |
| Endpoint novo | Nenhum |

- A abertura do app, com ou sem rede, com ou sem pacote no disco, continua sendo o site. Nenhum arquivo em `Directory.Data/mapas/` é lido antes disso.
- MapLibre e o protocolo `pmtiles` carregam só dentro da tela do mapa, depois que o shell já está na tela. Uma falha desse pedaço não entra no JS do feed, do perfil nem do criar rolê.
- Pacote ausente, ilegível ou que o desenho recusa: a tela mostra o mapa online da SPEC 051 (saída, paradas, destino e a posição, como já faz sem pacote) e a frase “Não foi possível abrir o mapa salvo neste celular.” Os botões de baixar, atualizar e apagar continuam.
- A falha não recarrega o WebView, não troca a URL do Capacitor e não navega para outra rota.
- Baixar e falhar continua como na SPEC 060: mensagem na tela, pacote anterior intacto se a gravação não terminou.
- `server.errorPath` permanece desligado.

### Fora do MO

| Item | Motivo |
|------|--------|
| Página local quando o site não abre | A porta da SPEC 060, se ligada errada, substitui o app. Fica fora até ter um caminho que falha aberto |
| Novo formato de pacote, outro zoom ou outro corredor | O arquivo da SPEC 060 permanece |
| Mapa offline de evento ou local | Continua só o rolê |

---

## NE — Aviso de entrada no rolê aberto

A SPEC 061 grava a entrada no rolê aberto já aceita e **não** manda `pedido_vaga` nem `aceite_vaga`. O criador não fica sabendo. `pedido_vaga` não serve aqui: o texto fala em solicitar vaga e o toque abre `/aprovacoes`, onde o rolê aberto não aparece.

### NE1 — Push para o criador

| | |
|--|--|
| Camada | Back |
| Rota | `POST /roles/:id/participacao`, a mesma |

Tipo novo: `entrada_role`.

| | |
|--|--|
| Quem recebe | `criadorId`, uma vez, no vínculo novo |
| `title` | Um piloto entrou no rolê |
| `body` | `{titulo}` do rolê |
| Toque abre | `/roles/{id}/gerenciar` |

- Só no 201 de rolê aberto. Repetir o POST devolve o vínculo que já existe e não manda outro push.
- Rolê fechado continua `pedido_vaga`. Nada muda no aceite, na recusa, no lembrete nem na saída (`DELETE`).
- Recusado continua 409, sem push. Organizador continua 403, sem push. Rolê que já saiu continua 400, sem push.
- Falha do FCM não desfaz o 201.
- Sem tela nova. O toast com o app aberto e o card nativo usam o `title` e a `url` que o envio já carrega.

### Fora do NE

| Item | Motivo |
|------|--------|
| Avisar quem entrou | Ele acabou de tocar em Entrar e vê o estado de confirmado |
| Nome de quem entrou no texto | O corpo segue o título do rolê, como o pedido de vaga |
| Push ao sair do rolê aberto | A saída continua silenciosa |
| Reabrir a fila para o rolê aberto | A SPEC 061 permanece: confirmado, sem Aceitar e sem Recusar |

---

## PA — Adicionar parada em um passo

No criar, no editar e no clonar, **Adicionar parada** só abre o seletor. A parada só entra na lista depois de **Incluir parada**. São dois toques, e o segundo é que parece a ação de verdade: **Adicionar parada** está no botão de contorno, **Incluir parada** é o botão laranja.

### PA1 — O ponto escolhido já é a parada

| | |
|--|--|
| Camada | Front |
| Onde | Cartão Paradas em `/criar-role`, inclusive `?editar=` e `?origem=` |

- **Adicionar parada** é o botão primário do cartão: fundo laranja, ícone `add_location_alt`, rótulo “Adicionar parada”, altura mínima de 48px, largura do cartão.
- O toque abre o mesmo seletor de ponto da partida (busca, mapa e GPS).
- Assim que o ponto é válido — linha da busca, toque no mapa ou GPS — a parada entra no fim da lista e o seletor fecha. Não existe **Incluir parada**.
- **Cancelar** só fecha o seletor enquanto não há ponto. Não pede confirmação.
- A linha nova aparece na hora, com o número, o nome (ou o endereço) e remover. Remover continua o X direto, sem diálogo. Subir e descer permanecem.
- Ponto fora do Sul mostra o erro que a partida já mostra e não entra na lista. O seletor fica aberto.
- Na nona, o botão some e a linha continua “Até 8 paradas”.
- Publicar manda o array na ordem da tela, como hoje.

### Fora do PA

| Item | Motivo |
|------|--------|
| Parada sem coordenada | A API recusa. O ponto válido é o que entra |
| Arrastar para reordenar | Continua subir e descer |
| Mudar o teto de 8 | SPEC 060 |

---

## RM — Paradas e percurso no Maps

**Abrir no Maps** na tela `/roles/[id]/mapa` usa `urlViagemMaps`: origem, destino, `waypoints` na query e `travelmode=driving`. No aplicativo do Maps no celular, essa query perde as paradas e o traço que sobra é a reta entre a saída e o destino. Sem parada, `urlRotaMaps` ainda nem manda o modo carro.

O mapa de consulta dentro do Rolemoto continua a reta da SPEC 060. A estrada é desenhada pelo Maps, no link.

**Ver partida** e **Ver destino** no feed, na ficha e no convite continuam abrindo um ponto só.

### RM1 — O link leva cada parada, de carro

| | |
|--|--|
| Camada | Front |
| Onde | **Abrir no Maps** em `/roles/[id]/mapa` |

A URL lista cada ponto no caminho, nesta ordem: saída, paradas, destino. O modo carro vai no próprio caminho, não só num parâmetro que o app descarta.

```
https://www.google.com/maps/dir/{lat},{lng}/{lat},{lng}/…/data=!3e0
```

`!3e0` é o modo carro. Cada `{lat},{lng}` é um ponto com coordenada finita. O link abre fora do WebView.

- Com paradas, o Maps mostra cada uma como parada da rota, na ordem do rolê, e o traço segue a estrada.
- Sem parada, a URL é saída e destino no mesmo formato, também de carro. Não volta a reta.
- Ponto sem coordenada: o link não é montado com um miolo vazio. Cai na rota de carro dos pontos que têm coordenada; se saída ou destino não tiver, permanece o comportamento atual de abrir o destino.
- O teste da função confere a ordem dos pares e a presença de `!3e0`. Não chama a rede.

### Fora do RM

| Item | Motivo |
|------|--------|
| Reta do mapa dentro do app virar a estrada | Consulta da SPEC 060. A estrada é o Maps |
| `dir_action=navigate` | O link mostra a rota. Não começa a navegação por voz |
| Trocar Ver partida e Ver destino | Continuam um pino só, SPEC 019 |
| Directions API no mapa embutido | Cota e desenho de fora desta frente |

---

## 2. IDs de teste

| ID | Área | Critério de aceite |
|----|------|--------------------|
| **MO1** | Tela do mapa | App abre o site com pacote no disco e sem rede no pacote. Arquivo ilegível mostra o mapa online e a frase do pacote salvo. O feed abre. `capacitor.config.ts` segue sem `errorPath` |
| **NE1** | API | 201 em rolê aberto chama o push `entrada_role` para o criador, com o título do rolê e a url `/roles/{id}/gerenciar`. O segundo POST não chama. Rolê fechado continua `pedido_vaga` e não chama `entrada_role`. Falha do envio ainda responde 201 |
| **PA1** | Formulário | Escolher o ponto na busca, no mapa ou no GPS coloca a parada na lista e fecha o seletor, sem **Incluir parada**. Cancelar antes do ponto não adiciona. O X tira a linha sem diálogo. A nona não entra. O botão **Adicionar parada** é o primário do cartão |
| **RM1** | Link | Com duas paradas, a URL contém saída, as duas e o destino nessa ordem, e `!3e0`. Sem parada, saída e destino também levam `!3e0`. No celular, o Maps mostra as paradas e o traço da estrada |
