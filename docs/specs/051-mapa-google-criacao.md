# SPEC 051 — Google Maps na criação de rolê, evento e local

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-10-30  
> **Origem:** o mapa da criação é Leaflet + tile do OpenStreetMap; enquanto o app não tem uso, trocar o basemap pelo Google e avisar antes de sair da faixa grátis  
> **Padrões:** Next.js 15 App Router — skill `nextjs-patterns`; visual — skill `desenvolvimento-design`  
> **Backend:** Cloud Function `api` — reserva de cota antes de carregar o mapa  
> **Coleção:** `config` (doc `mapasGoogle`)  
> **Depende de:** SPEC 032 (mapa de seleção e recorte Sul), SPEC 019 (link “Abrir no Maps” permanece)  
> **QA:** IDs **GM1**–**GM3**, um PR por ID

É possível. O pin da criação já passa por um único componente (`MapaSelecaoLocal`), usado em `/criar-role`, `/criar-evento` e `/criar-local`. A busca de endereço continua no Nominatim. O Google não informa à aplicação quanto ainda cabe na faixa grátis; o app conta por conta própria, de propósito um pouco à frente da fatura. Esse número é informação administrativa: não aparece na tela de nenhum piloto.

---

## 1. Objetivo

Na criação de rolê, evento e local, o mapa interativo passa a ser o Google Maps. Toque, arraste e o recorte SC/PR/RS permanecem. A busca de endereço não muda.

O app conta cada carregamento. O piloto não vê cota, limite nem frase sobre o Google. A partir de 8.000 no mês, a function registra um aviso administrativo. Em 10.000, o restante do mês volta ao mapa livre, em silêncio, para a faixa grátis não virar cobrança.

| ID | Entrega | Camada |
|----|---------|--------|
| **GM1** | Contador mensal e a regra de bloqueio | Back (lib pura + repositório) |
| **GM2** | Mapa Google no mesmo contrato do mapa atual, com volta ao Leaflet | Front |
| **GM3** | Registro administrativo ao entrar na faixa e ao estourar | Back (log da function) |

---

## 2. Recorte

### 2.1 O que entra

- Maps JavaScript API só no mapa de seleção da criação (`MapaSelecaoLocalClient`).
- Mesmo contrato: `lat`, `lng`, `vooId`, `onMoverPonto`, `desabilitado`, hints. Toque no mapa, pin arrastável, voo ao escolher sugestão ou GPS, recusa de ponto fora do Sul.
- Chave de browser só com a Maps JavaScript API, restrita por referrer.
- Doc `config/mapasGoogle` com o mês (`America/Sao_Paulo`) e a quantidade de cargas.
- `POST /mapas/carga` reserva uma carga antes de injetar o script do Google.
- Em 10.000, Leaflet até o mês seguinte, sem texto na tela explicando o motivo.
- Registro administrativo (log da function) uma vez ao cruzar 8.000 e uma vez ao gravar 10.000. O doc `config/mapasGoogle` no console é a outra via. Nenhuma das duas chega na UI, nem para quem tem `admin`.
- Sem a chave, ou se a reserva falhar, o mapa livre segue e a criação não quebra.

### 2.2 O que não entra

| Item | Motivo |
|------|--------|
| Trocar o Nominatim por Geocoding ou Autocomplete | Outro produto, outro preço. A busca de endereço desta spec não muda |
| Reusar `PLACES_API_KEY` no browser | Essa chave fica na function e alimenta a Text Search da SPEC 050 (bem mais cara) |
| Tile do Google dentro do Leaflet | O contrato do Google não permite |
| Embed (`iframe`) no lugar do mapa | É grátis e ilimitado, e não devolve o pin para o formulário |
| `MapaEstatico` (ficha de evento, ficha de local, telemetria) | Cada abertura de ficha queimaria a cota. Continua OpenStreetMap |
| `BotaoAbrirMaps` / rota no app do Google | Já é link, sem chave e sem cota (SPEC 019) |
| Rota, Street View, Places no pin | Fora do basemap |
| Consultar a fatura do Google Cloud | Exige Billing API e conta de serviço. O contador nosso basta para o log e para parar |

### 2.3 Decisões travadas

| Decisão | Escolha |
|---------|---------|
| Produto | Maps JavaScript API, SKU **Dynamic Maps**. Sem Map ID |
| Faixa grátis | 10.000 carregamentos de mapa por mês na conta de faturamento. Pan, zoom e arraste não contam de novo |
| Depois da faixa | US$ 7 a cada 1.000, até 100.000. Esta spec não entra nessa faixa: ao chegar em 10.000 o app para de carregar o Google |
| O que conta | Uma reserva por vez que o componente do mapa Google monta. Reabrir o mapa conta de novo. Dois mapas abertos no criar rolê (partida e destino) são duas cargas |
| Quando reservar | Antes de injetar o script. Carga que falha no script ainda consome o contador. É de propósito: o app cai no mapa livre um pouco antes da fatura, não depois |
| Mês | `YYYY-MM` em `America/Sao_Paulo`. Virou o mês, a próxima reserva zera o doc e conta 1 |
| Aviso administrativo | A reserva que grava `cargas == 8.000` emite um log. A que grava `cargas == 10.000` emite outro. As cargas seguintes da faixa e as recusas depois do teto não logam de novo |
| Bloqueio | `cargas >= 10.000` → resposta pede Leaflet e não incrementa. A tela não explica |
| Quem consome | Qualquer autenticado na tela de criação, inclusive o piloto |
| Quem é informado | Ninguém no app. Console Firebase: doc `config/mapasGoogle` e o log da function |
| Chave | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` no app. Ausente → Leaflet, sem chamar `POST /mapas/carga` |
| Places | `PLACES_API_KEY` continua só na function. A chave nova não habilita Places, Geocoding nem Routes |
| Dependência npm | Nenhuma. O script `maps.googleapis.com` é carregado uma vez e compartilhado entre os dois mapas do rolê |
| Estilo | JSON escuro no cliente, sem Map ID, para acompanhar o cockpit. Logo e atribuição do Google ficam visíveis; a dica do pin não cobre essa faixa |

---

## 3. Por que o controle não lê a cota do Google

A Maps JavaScript API cobra quando o mapa é criado na página. Não há um campo de “quanto falta dos 10.000”. Ler isso exigiria a API de faturamento do Cloud, com outra credencial e outro atraso.

O contador em `config/mapasGoogle` aproxima essa cobrança:

- reserva antes do script, então não fica atrás da fatura;
- transação no Firestore, então dois pilotos no limite não passam os dois;
- não conta pan, zoom nem reverse geocode (esse continua no Nominatim, de graça).

O número do doc não é a fatura. É o gatilho para o log administrativo e para parar de carregar o Google. O client recebe só o provedor do mapa.

---

## 4. GM1 — Cota

### 4.1 Regra pura

Arquivo sugerido: `functions/src/lib/mapas-google/cota.ts`. Sem Firestore. Coberto por teste.

```ts
export const LIMITE_MAPAS_GOOGLE = 10_000;
export const AVISO_MAPAS_GOOGLE = 8_000;

export type ProvedorMapa = "google" | "osm";

export const decidirCotaMapa = (cargas: number): { provedor: ProvedorMapa } => {
  if (cargas >= LIMITE_MAPAS_GOOGLE) return { provedor: "osm" };
  return { provedor: "google" };
};

export const marcoAdministrativo = (
  cargas: number,
): "faixa" | "limite" | null => {
  if (cargas === AVISO_MAPAS_GOOGLE) return "faixa";
  if (cargas === LIMITE_MAPAS_GOOGLE) return "limite";
  return null;
};
```

`marcoAdministrativo` só dispara no exato 8.000 e no exato 10.000, para o log sair uma vez por mês em cada corte. Não vai no JSON.

### 4.2 Persistência

Doc único `config/mapasGoogle`:

```
{
  periodo: "2026-10",   // America/Sao_Paulo
  cargas: number,
  updatedAt: timestamp
}
```

Interface em `repositories/interfaces/`, implementação Firestore, factory em `repositories/index.ts`. A rota não fala com o Firestore.

`reservar()`:

1. Transação no doc.
2. Se `periodo` não é o mês corrente, grava o mês novo e `cargas = 0` antes de decidir.
3. Se `cargas >= 10.000`, não incrementa e devolve `provedor: "osm"`.
4. Senão incrementa 1 e devolve `decidirCotaMapa` em cima do valor novo.
5. Se `marcoAdministrativo(cargas)` não for `null`, a function emite o log desse marco. Falha de log não desfaz a reserva.

### 4.3 HTTP

`POST /mapas/carga` — `autenticar`. Sem corpo.

```json
{ "provedor": "google" }
```

No teto:

```json
{ "provedor": "osm" }
```

`periodo`, `cargas` e `limite` ficam no doc e no log. Não saem na resposta: o browser do piloto não precisa deles.

`401` sem Bearer. Não há rota pública. Não há GET: quem não vai desenhar o Google não precisa consultar.

---

## 5. GM2 — Mapa na criação

### 5.1 Onde monta

| Tela | Hoje | Carga |
|------|------|--------|
| `/criar-role` | O mapa só monta quando a pessoa abre partida ou destino | 1 por mapa aberto. Fechar e abrir de novo conta outra |
| `/criar-evento` | O mapa já entra com o formulário | 1 por visita à tela |
| `/criar-local` | Igual ao evento | 1 por visita à tela |

Os três continuam assim. Não antecipar o mapa do rolê só por abrir o formulário.

### 5.2 Cliente

`MapaSelecaoLocalClient` decide:

1. Sem `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` → `MapaSelecaoLocal` (Leaflet), sem POST.
2. Com chave → `POST /mapas/carga`.
3. `provedor: "google"` → componente novo com o script do Google.
4. `provedor: "osm"`, rede falhou ou a API não respondeu 200 → Leaflet. Não carregar o Google sem reserva.

O Leaflet atual permanece no repositório. Ele é o mapa do mês estourado e o mapa de quem desenvolve sem chave.

Comportamento do mapa Google, igual ao atual:

- Sem ponto: centro em Blumenau (`CENTRO_SUL_DEFAULT`), zoom da região; se o GPS estiver no Sul, aproxima.
- Com ponto: pin, zoom local, `vooId` só voa em busca ou GPS — não briga com o arraste.
- Toque e fim de arraste chamam `onMoverPonto`. Se voltar `false`, o pin volta à coordenada anterior.
- `desabilitado` trava arraste, toque e zoom por gesto.

Dois mapas no criar rolê compartilham o script. O segundo não injeta a tag de novo.

### 5.3 Chave (passo manual, fora do código)

No projeto Google Cloud ligado ao Firebase (`rolemoto-bc47f`), com conta de faturamento (a faixa grátis também exige isso):

1. Ativar só **Maps JavaScript API**.
2. Criar uma chave de browser.
3. Restringir a API a Maps JavaScript API.
4. Restringir o referrer aos origins do app (`localhost:3000`, o host de produção e, se o WebView do Capacitor não usar esse host, o origin dele).
5. Colocar o valor em `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (`.env.example` documenta o nome, sem valor).

Essa chave não substitui `PLACES_API_KEY`.

---

## 6. GM3 — Registro administrativo

Nenhuma tela de criação mostra número, faixa ou frase sobre a cota. O mapa troca de provedor e o formulário segue. Admin logado no app também não vê isso: criar evento e local consome a cota como qualquer piloto.

O log sai na function, uma vez por marco por mês:

| Marco | Quando | Mensagem |
|-------|--------|----------|
| Faixa | a reserva que grava `cargas == 8.000` | `Mapas Google: 8000 de 10000 cargas no período {periodo}.` |
| Limite | a reserva que grava `cargas == 10.000` | `Mapas Google: limite de 10000 no período {periodo}. Próximas cargas usam o mapa livre.` |

Cargas 8.001–9.999 e as recusas com o doc já em 10.000 não logam de novo. No mês seguinte o doc zera e os dois marcos podem sair outra vez. Quem opera lê o log da function ou o doc `config/mapasGoogle` no console.

---

## 7. Checklist de aceite

### GM1

- [ ] 7.999 reserva Google. A resposta é só `{ "provedor": "google" }`.
- [ ] 8.000 reserva Google e é o único ponto em que o marco `faixa` aparece.
- [ ] A carga que grava 10.000 devolve `osm`. Com o doc já em 10.000, a próxima não incrementa e também devolve `osm`.
- [ ] 8.001 não repete o marco `faixa`. Recusa depois do teto não repete o marco `limite`.
- [ ] Duas reservas simultâneas no limite não passam de 10.000.
- [ ] Mês novo zera e a primeira reserva fica em 1.
- [ ] Teste da função pura cobre provedor e os dois marcos, sem rede.

### GM2

- [ ] Com chave e cota livre, criar rolê, evento e local abrem o Google. Toque, arraste, sugestão e GPS atualizam o formulário. Ponto fora do Sul não gruda.
- [ ] Sem chave, os três formulários seguem no Leaflet e não chamam `/mapas/carga`.
- [ ] Se o POST falhar, o formulário abre no Leaflet e ainda dá para publicar.
- [ ] Abrir partida e destino no rolê gera duas cargas. Fechar e abrir de novo gera outra.
- [ ] Ficha de evento, ficha de local e telemetria continuam no mapa estático atual. “Abrir no Maps” não pede chave.

### GM3

- [ ] Criar rolê, evento e local não mostram número, faixa ou frase sobre cota — inclusive com admin logado.
- [ ] A carga 8.000 emite o log da faixa uma vez. As seguintes, até 9.999, não emitem.
- [ ] A carga que grava 10.000 emite o log de limite uma vez. O mapa visível passa a ser o livre, sem texto. As recusas seguintes não logam de novo.

---

## 8. Ordem

1. **GM1** — regra, doc e `POST /mapas/carga`  
2. **GM2** — script, pin e fallback  
3. **GM3** — os dois logs, sem UI

A chave do console pode existir antes do GM2. Sem ela, GM2 entrega o fallback e o app continua publicável.

---

## 9. Fora / follow-ups

- Geocoding ou Autocomplete do Google no campo de endereço, se o Nominatim continuar falhando em nome fantasia (SPEC 032, G3).
- Trocar o `MapaEstatico` por Static Maps (outra faixa: 10.000 grátis, depois US$ 2 / 1.000). Não misturar com esta cota.
- E-mail ao admin no lugar do log, se o console deixar de ser suficiente quando houver uso real de pilotos.
