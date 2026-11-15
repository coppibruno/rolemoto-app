# SPEC 060 — Mapa da viagem no celular e paradas do rolê

> **Status:** Proposta
> **Autor:** Assistente IA
> **Data:** 2026-11-13
> **Origem:** no interior, sem sinal, o piloto quer abrir o mapa do rolê que já preparou; no caminho, o rolê tem paradas até o destino
> **Padrões:** Next.js 15 App Router — skill `nextjs-patterns`; visual — skill `desenvolvimento-design`
> **Backend:** Cloud Function `api` — campo `paradas` em `POST|PUT /roles` e nas leituras
> **Coleção:** `roles` (campo novo `paradas`). O arquivo do mapa fica no celular, não no Firestore
> **Depende de:** SPEC 003 (feed e `distanciaRotaKm`), SPEC 004 (criar), SPEC 009 (clonar), SPEC 015 (convite público), SPEC 017 (Meus Rolês), SPEC 019 (Abrir no Maps), SPEC 021 (editar rolê futuro), SPEC 032 (recorte Sul), SPEC 051 (mapa de leitura online), `docs/mobile.md` (WebView na URL remota)
> **QA:** IDs **MV1**–**MV6**, um PR por ID

O rolê continua nascendo online. Quem vai baixar o mapa no próprio celular, em casa. Sem sinal, o aplicativo instalado abre só essa consulta. O feed, o perfil e o resto do Rolemoto seguem pedindo internet.

---

## 1. Objetivo

Dois acréscimos no mesmo rolê:

1. **Paradas** entre a saída e o destino, na ordem em que o comboio passa. São do rolê: todo mundo vê a mesma sequência.
2. **Mapa da viagem** na ficha. Com internet, dá para ver e baixar. Sem internet, o app instalado mostra os mapas já gravados neste celular, com a posição pelo GPS.

| ID | Entrega | Camada |
|----|---------|--------|
| **MV1** | Paradas, cadeia de distância, corredor e hash do pacote | Back (lib pura) |
| **MV2** | Campo no rolê, nas leituras e no modelo de clone | Back |
| **MV3** | Paradas no criar, editar e clonar | Front |
| **MV4** | Tela do mapa com internet, linha no feed, Meus Rolês e convite | Front |
| **MV5** | Baixar, atualizar e apagar o pacote no aplicativo instalado | App nativo |
| **MV6** | Porta sem internet: lista, mapa e tentar de novo | App nativo |

---

## 2. Recorte

### 2.1 O que entra

- Até 8 paradas no criar, no editar e no clonar. Cada uma usa o mesmo ponto do mapa da partida (nome, endereço, lat, lng) e o recorte Sul.
- Ordem editável por subir e descer. A sequência do plano é saída, paradas, destino.
- `distanciaRotaKm` passa a somar essa cadeia. O card do feed ganha a linha “3 paradas” quando houver alguma.
- Tela `/roles/[id]/mapa` para quem já pode abrir o rolê. Pinos na ordem, traço reto entre eles, lista com a distância a partir do GPS.
- No aplicativo instalado, criador e confirmado baixam o corredor neste celular. O botão mostra o tamanho antes. Dá para atualizar e apagar.
- Se a saída, uma parada ou o destino mudou desde o download, o pacote fica desatualizado e o botão pede **Atualizar**.
- Sem rede, ao abrir o app do zero, uma página local explica o limite e mostra os mapas baixados. **Tentar abrir o Rolemoto** carrega o site de novo.
- **Abrir no Maps** leva a saída, as paradas e o destino, nessa ordem.

### 2.2 O que não entra

| Item | Motivo |
|------|--------|
| Navegação com seta e voz | O mapa é consulta. A seta continua no Google Maps, pelo link |
| Cache de tile do Google | O contrato não permite guardar o mapa do Google para usar sem rede |
| `tile.openstreetmap.org` em massa | A política de uso não permite baixar a região |
| Empacotar o Next inteiro (`output: 'export'`) | O app do dia a dia continua na URL remota. Só a porta sem internet viaja no binário |
| Download no navegador ou na PWA | O arquivo precisa do armazenamento do app instalado. A tela online existe nos dois |
| Pacote compartilhado no Storage | Cada celular baixa o seu. O criador baixar não enche o telefone de quem vai junto |
| Parada particular, invisível para o grupo | A parada é do rolê |
| Arrastar para reordenar | Subir e descer, no mesmo padrão de toque de 48px |
| Gravar o passeio dentro desta tela | Continua em `/gravar-role` |
| Aviso de rolê cancelado dentro do mapa já baixado | Sem rede o celular não fica sabendo. O arquivo permanece até a pessoa apagar |
| Mapa offline de evento ou local | Esta spec é o rolê |

### 2.3 Decisões travadas

| Decisão | Escolha |
|---------|---------|
| Quem edita paradas | O criador, no criar e no editar. Rolê que já saiu continua sem `PUT` (SPEC 021) |
| Quem vê a lista | Quem já vê o rolê: feed (só a contagem), ficha, convite público, mapa |
| Quem baixa | Criador ou participação aceita, no aplicativo instalado |
| Teto | 8 paradas. Zero é válido. Documento antigo sem o campo lê `[]` |
| Ordem | A ordem do array é a ordem da viagem |
| Traço no mapa | Linha reta entre um ponto e o seguinte. É a ordem do plano, não o desenho da estrada |
| Corredor | 20 km para cada lado de cada trecho. O retângulo de cada perna entra no pacote |
| Zooms do pacote | 9 a 14 |
| Tamanho | O botão mostra a estimativa. Acima de 40 MB, pede confirmação. Se a gravação passar de 120 MB, apaga o parcial e avisa que o trecho é longo demais |
| Basemap do pacote | Vetor OpenStreetMap num PMTiles do Sul hospedado pelo projeto. Atribuição visível |
| Antes de baixar | A tela online usa o mapa de leitura que o app já tem (SPEC 051). Depois de baixar, a mesma tela lê o arquivo local |
| Onde o arquivo mora | `Directory.Data/mapas/{roleId}/` no app instalado. Não vai para o Firestore |
| Desatualizado | Hash dos pontos (saída, paradas, destino). Mudou a coordenada, o nome não muda o hash |
| Porta sem internet | `server.errorPath` no Capacitor. Se o WebView não chamar essa página no erro de rede, o cliente nativo carrega o mesmo HTML |
| Página local | HTML, CSS e JS do mapa offline dentro de `public/mapa-viagem/`. Sem CDN na hora de abrir. Atualizar essa página pede versão nova na loja. O pacote de cada rolê, não |
| Um mapa só | Abre direto, com o título do rolê |
| Vários | Lista com título e data. O toque abre o mapa |
| Nenhum | O texto do vazio, sem lista |
| GPS | Pedido na tela do mapa. Sem permissão, a lista mostra a ordem do plano e não a distância até a pessoa |
| Postos e cidades | Gravados no `meta.json` na hora do download. Falha nessa lista não cancela o mapa |
| Site fora, com internet | A mesma página aparece. **Tentar abrir o Rolemoto** é a saída |

### 2.4 Caminho

1. O criador publica o rolê com partida, as paradas que quiser e o destino.
2. Quem está confirmado abre **Mapa da viagem**, olha o plano e, no app instalado, toca em **Baixar mapa desta viagem**.
3. No interior, fecha o app. Sem sinal, abre de novo. A página local mostra o mapa, a posição, as paradas, os postos e as cidades que entraram no arquivo.
4. Com sinal de novo, a abertura seguinte cai no site, como hoje.

---

## 3. Dados

### 3.1 `roles.paradas`

```
paradas: Localizacao[]
```

Mesmo formato de `localSaida` e `destinoFinal`: `lat`, `lng`, `endereco`, `nome`. `nome` pode ser `""`. No máximo 8. A ordem do array é a ordem da viagem.

Documento antigo sem o campo é lido como `[]`.

Não há coleção nova.

### 3.2 Distância da rota

`distanciaRotaKm` soma a cadeia saída → paradas → destino (haversine) e arredonda uma vez no final. Sem paradas, o número continua o de uma perna só.

### 3.3 Hash e corredor

Lib pura, coberta por teste, sem Firestore e sem rede.

```ts
export const MAX_PARADAS = 8;
export const MARGEM_CORREDOR_KM = 20;
export const ZOOM_PACOTE_MIN = 9;
export const ZOOM_PACOTE_MAX = 14;
export const AVISO_BYTES = 40 * 1024 * 1024;
export const TETO_BYTES = 120 * 1024 * 1024;

export const hashPontosViagem = (pontos: { lat: number; lng: number }[]): string => {
  // lat e lng com 5 casas, unidos por "|", na ordem recebida
};

export const cadeiaViagem = (
  saida: Coord,
  paradas: Coord[],
  destino: Coord,
): Coord[] => [saida, ...paradas, destino];
```

`corredorDaViagem` devolve o retângulo que cobre cada perna dilatada em 20 km (1° de latitude ≈ 111 km; a longitude usa o cosseno da latitude do ponto). Serve para estimar tiles e para o download.

`estimarTiles` conta os tiles XYZ dos zooms 9 a 14 nesse retângulo. A estimativa de bytes usa 8 KB por tile. É teto de aviso, não a fatura.

### 3.4 Pacote no celular

```
Directory.Data/mapas/{roleId}/meta.json
Directory.Data/mapas/{roleId}/mapa.pmtiles
```

`meta.json`:

```
{
  roleId: string,
  titulo: string,
  dataHoraSaida: string,
  pontos: Localizacao[],       // saída, paradas, destino
  pontosHash: string,
  baixadoEm: string,           // ISO
  bytes: number,
  postos: { nome: string, lat: number, lng: number }[],
  cidades: { nome: string, lat: number, lng: number }[],
  atribuicao: "© OpenStreetMap"
}
```

Postos: no máximo 80, nome ou “Posto”. Cidades: no máximo 40, `place` cidade ou vila. Os dois vêm de uma consulta à base aberta na hora do download (Overpass no retângulo do corredor, timeout 20 s). Lista vazia é um pacote válido.

O `mapa.pmtiles` é o recorte do arquivo do Sul (`NEXT_PUBLIC_MAPA_OFFLINE_PMTILES_URL`) nos tiles do corredor, zooms 9–14. Sem essa URL no build, o botão de baixar não aparece. O mapa online permanece o da SPEC 051.

Gravação atômica: escreve em `mapas/{roleId}.tmp` e só então substitui a pasta. Estourar 120 MB apaga o temporário e não mexe no pacote anterior.

---

## 4. API

Cliente continua deny-all no Firestore. O pacote não tem endpoint: o celular lê o PMTiles do Sul e grava o recorte.

### 4.1 `POST /roles` e `PUT /roles/:id`

O body ganha `paradas`. Ausente equivale a `[]`.

Cada item passa pelo mesmo `parseLocalizacao` da partida e por `pontoEstaNoSul`. Fora do Sul ou acima de 8: 400, com a mesma família de erro dos outros pontos. O `PUT` segue a regra atual: só o criador, e 409 se o rolê já saiu.

`GET /roles/:id/modelo` inclui `paradas` para o clonar e para o editar pré-preencherem.

### 4.2 Leituras

| Rota | `paradas` |
|------|-----------|
| `GET /roles/:id` | Array completo |
| `GET /roles/:id/modelo` | Array completo |
| `GET /publico/roles/:id` | Array completo (`nome`, `endereco`, `lat`, `lng`) |
| `GET /roles` (feed) | Não manda o array. Manda `totalParadas: number` |
| `GET /meus-roles` | Não manda o array. O estado “neste celular” é lido no aparelho |

`distanciaRotaKm` nessas rotas usa a cadeia.

---

## 5. Front online

Visual do cockpit já usado no criar rolê e na ficha. Sem mock novo. Client Component onde há mapa, GPS, lista reordenável ou arquivo no aparelho.

### 5.1 Criar, editar e clonar

Em `/criar-role` (criar, `?editar=`, `?origem=`), a ordem dos cartões de lugar fica **Partida**, **Paradas**, **Destino**.

- **Adicionar parada** abre o mesmo seletor de ponto da partida.
- Cada linha: nome (ou o endereço, se o nome estiver vazio), subir, descer, remover. A primeira não sobe. A última não desce.
- Na nona tentativa, o botão some e a linha diz “Até 8 paradas”.
- Ponto fora do Sul usa o erro que a partida já mostra.
- Clonar e editar trazem as paradas do modelo. Publicar manda o array na ordem da tela.

### 5.2 Feed

No `RoleCard`, se `totalParadas > 0`, uma linha “1 parada” ou “3 paradas”. O quilômetro da capa continua `distanciaRotaKm`, agora pela cadeia.

### 5.3 Ficha e garagem

Na ficha de participar e no gerenciar, bloco **Paradas** quando o array não está vazio, na ordem, com o nome de cada ponto. Link **Mapa da viagem** para `/roles/[id]/mapa`.

Em **Meus Rolês**, no card de rolê futuro em que a pessoa é organizador ou está com vaga assegurada:

| Onde | Linha |
|------|--------|
| Navegador | **Ver mapa** |
| App instalado, sem arquivo | **Baixar mapa neste celular** |
| App instalado, hash igual | **Mapa neste celular** |
| App instalado, hash diferente | **Atualizar mapa neste celular** |

A linha abre a mesma tela. Rolê que já saiu não mostra a linha.

### 5.4 Convite público

`/r/[id]` lista as paradas entre a saída e o destino, só leitura. Sem botão de baixar.

### 5.5 Tela `/roles/[id]/mapa`

Quem não consegue abrir o rolê cai na ficha que já existe (o mesmo 404 / 403 de `GET /roles/:id`).

- Título do rolê e a data da saída.
- Mapa com pinos: saída, 1…n, destino, e o traço reto na ordem. Com GPS, o ponto da pessoa.
- Lista na mesma ordem. Com GPS, cada linha ganha a distância em linha reta até a pessoa (“12 km”). Postos e cidades do `meta.json` entram nessa lista, também pela distância, quando o pacote existe. Sem pacote, a lista é só o plano do rolê.
- **Abrir no Maps** usa a rota com `waypoints` na ordem das paradas (`travelmode=driving`). Sem parada, a URL continua a de origem e destino.
- Sem permissão de GPS: “A posição fica disponível quando o aplicativo puder usar o GPS.” A ordem do plano permanece.

Estados do botão, só no app instalado, e só para criador ou confirmado:

| Estado | Rótulo |
|--------|--------|
| Sem arquivo | **Baixar mapa desta viagem** e o tamanho estimado |
| Gravando | **Baixando…** com a fração |
| Hash igual | **Mapa neste celular** e **Apagar deste celular** |
| Hash diferente | Faixa “A rota mudou” e **Atualizar** |
| Acima de 40 MB | Confirmação com o tamanho antes de começar |
| Acima de 120 MB na gravação | “Este trecho é longo demais para baixar neste celular.” O pacote anterior, se havia, continua |
| Sem `NEXT_PUBLIC_MAPA_OFFLINE_PMTILES_URL` | Sem botão de baixar. O mapa online permanece |

No navegador, no lugar do botão: “O mapa offline fica no aplicativo Rolemoto instalado.”

Quem ainda não foi aceito vê o mapa e a lista, sem o botão de baixar.

Apagar pede confirmação e remove a pasta do rolê.

Enquanto não há pacote, o mapa é o `MapaLeitura` atual. Com pacote, MapLibre lê `mapa.pmtiles` no aparelho, com estilo escuro e a atribuição OpenStreetMap visível. Pan e zoom não pedem rede.

---

## 6. Porta sem internet

O Capacitor continua carregando `https://www.rolemoto.com.br` quando o site abre. Quando a carga do site falha, o WebView mostra `public/mapa-viagem/index.html`, embarcado no binário (`webDir: "public"`, `server.errorPath`).

A página não tem feed, perfil nem dock. Três blocos, nesta ordem:

1. **Sem internet.** O Rolemoto precisa de sinal para o feed, os rolês, o perfil e o resto do app. Sem internet, esta tela mostra só os mapas que você baixou neste celular. A sua posição vem do GPS.
2. Os mapas da pasta `mapas/`. Um só abre direto, com o título. Vários: título e data de saída; o toque abre. Nenhum: “Nenhum mapa neste celular. Quando a internet voltar, abra o rolê e toque em Baixar mapa desta viagem.”
3. **Tentar abrir o Rolemoto.** Recarrega a URL do site configurada no Capacitor.

O mapa dessa página é o mesmo arquivo: pinos, traço, posição, postos e cidades do `meta.json`. Bibliotecas de mapa vêm da pasta `public/mapa-viagem/`, não de um CDN.

QA deste ID é em aparelho, com o app fechado e sem rede. Simulador sem cold start não fecha o ID.

---

## 7. IDs de teste

| ID | Área | Critério de aceite |
|----|------|--------------------|
| **MV1** | Lib | 0 a 8 paradas. A nona é inválida. A distância sem parada permanece a de uma perna. Com duas paradas, a soma segue a ordem, não o atalho saída→destino. O hash muda quando uma coordenada muda e não muda quando só o nome muda. O corredor de uma perna norte–sul cobre a margem de 20 km |
| **MV2** | API | POST e PUT gravam `paradas`. Documento antigo volta `[]`. Ponto fora do Sul responde 400. Feed traz `totalParadas` e a distância da cadeia, sem o array. Detalhe, modelo e convite público trazem a lista. `PUT` de rolê que já saiu continua 409 |
| **MV3** | Formulário | Dá para incluir, subir, descer e remover. A nona não entra. Editar e clonar pré-preenchem. Publicar manda a ordem da tela |
| **MV4** | Telas online | O card mostra “3 paradas”. A ficha lista os pontos e abre `/roles/[id]/mapa`. Meus Rolês futuro, no navegador, mostra **Ver mapa**. O convite lista as paradas. **Abrir no Maps** inclui os waypoints |
| **MV5** | Pacote | No app instalado, confirmado baixa, vê o tamanho e reabre a tela lendo o arquivo. Criador idem. Quem só pediu participação não vê o botão. Mudar uma parada pede **Atualizar**. Apagar remove a pasta. No navegador, o texto aponta para o app instalado e nada é gravado |
| **MV6** | Sem rede | App fechado, sem rede, abre a página local. Um mapa abre direto. Dois mapas mostram a lista. Zero mapas mostra o vazio. **Tentar abrir o Rolemoto** volta ao site quando o sinal existe. O GPS aparece no mapa baixado |

---

## 8. Fora desta entrega

- Gerar ou atualizar o PMTiles do Sul. A URL é pré-requisito de configuração. Sem ela, MV5 esconde o botão e o resto da spec vale.
- Curva a curva, trânsito e Street View.
- Levar cancelamento ou edição para um pacote já aberto offline.
- Mapa offline no navegador.
