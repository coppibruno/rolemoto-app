# SPEC 029 — Telemetria do Rolê (GPS + Capacitor)

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-18  
> **Referência visual:** tokens do cockpit (`globals.css`); sem mock Stitch dedicado nesta versão — UI mínima alinhada ao detalhe do rolê / Meus Rolês  
> **Padrões:** Next.js 15 App Router + **Capacitor** (shell nativo Android/iOS) para GPS em background; Client Components só onde há sensor / permissão / sessão ativa  
> **Backend:** Cloud Function `api` (Express) — `POST|GET /roles/:id/telemetria`  
> **Coleção Firestore:** `userstelemetria` (**nova**)  
> **Depende de:** SPEC 001 (shell), SPEC 005 (`usersrole` + aceite), SPEC 012 (PWA — continua existindo; telemetria **só no app Capacitor**), SPEC 017 (Meus Rolês / detalhe)  
> **Estende:** experiência do rolê confirmado; **não** substitui SPEC 010 (feedback qualitativo) nem SPEC 019 (Abrir no Maps)

---

## 1. Objetivo

Permitir que o piloto **grave a telemetria do rolê** com o celular no bolso e a **tela desligada**, e ao final veja quatro números derivados do GPS:

| Métrica | Unidade | Como calcular |
|---------|---------|---------------|
| Velocidade máxima | km/h | Maior velocidade instantânea válida no trajeto |
| Velocidade média | km/h | `distanciaKm / (tempoMovimentoHoras)` — ver §6.2 |
| Tempo | duração | `encerradoEm − iniciadoEm` (e opcionalmente tempo em movimento) |
| Distância | km | Soma Haversine entre pontos consecutivos filtrados |

Fluxo de produto:

```
Detalhe do rolê (confirmado)
  → Iniciar gravação
  → Permissão de localização “Sempre” / background
  → Piloto desliga a tela / guarda o celular
  → Ao chegar, reabre o app
  → Finalizar gravação
  → Tela de resumo (máx · média · tempo · km)
  → Persistência no Firestore via API
```

Esta spec é **full stack + nativo**:

| Camada | Responsabilidade |
|--------|------------------|
| Capacitor (Android/iOS) | Serviço nativo de GPS em background; sessão sobrevive a tela off e kill do WebView |
| Front (Next.js no WebView) | CTAs Iniciar/Finalizar, estados, resumo, POST do resumo |
| Back (Functions) | Validar elegibilidade, persistir resumo, devolver leitura |
| PWA / browser | **Não** grava com tela off — CTA explica “disponível no app Rolemoto” |

`usuarioId` **nunca** vem do body. Timestamps de início/fim da sessão vêm do **device** (ISO) e o servidor grava `createdAt` / `updatedAt` próprios. Não misturar com `usersrolefeedback` (SPEC 010).

---

## 2. Recorte e princípios

### 2.1 O que entra

- Integração **Capacitor** (projeto `android/` + `ios/`) apontando ao build mobile do app.
- Plugin de **background geolocation** (ver §8) — não usar só `navigator.geolocation` / `@capacitor/geolocation` em foreground.
- CTA **Iniciar gravação** / **Finalizar** no detalhe do rolê (e indicação em Meus Rolês se houver sessão ativa).
- Acumuladores locais durante a gravação: distância, máx, timestamps; **não** é obrigatório persistir a polyline no MVP.
- Coleção `userstelemetria` com **um doc por** `{usuarioId}_{roleId}` (uma telemetria definitiva por piloto por rolê).
- Endpoints `POST /roles/:id/telemetria` e `GET /roles/:id/telemetria` (própria).
- Tela / sheet de **resumo** após finalizar.
- Guarda: só app Capacitor; só piloto com `usersrole.aceito === true` (criador conta como elegível se tiver vínculo aceito **ou** for `criadorId` — ver §6.1).
- Seção **Como testar** (§11) — device real é obrigatório para background.

### 2.2 O que **não** entra (MVP)

| Item | Motivo |
|------|--------|
| Mapa embutido / polyline do trajeto | Fase 2; MVP só os 4 números |
| Tracking em PWA com tela off | iOS/Android não garantem; produto assume Capacitor |
| App 100% nativo (Swift/Kotlin UI) | Capacitor reaproveita o front |
| Telemetria de **evento** ou **local** | Só rolê (`roles`) |
| Sync ao vivo entre pilotos / ranking de velocidade | Fora |
| Navegação turn-by-turn | SPEC 019 cobre Abrir no Maps |
| PATCH / várias gravações por rolê | Uma telemetria definitiva; regravar = fora (ou DELETE+POST em spec futura) |
| Velocidade via OBD / ECU Kawasaki | Só GPS do celular |
| Histórico agregado “km totais da vida” no perfil | Pode vir depois; doc por rolê basta |
| Notificação push “finalize sua gravação” | Fora |
| Alterar Security Rules do client | Continua deny-all; escrita só via Functions |

### 2.3 Princípios

1. **Nativo segura o GPS; web só orquestra.** Com tela off o JS pode morrer — a sessão vive no plugin.
2. **Resumo no device, persistência na API.** O POST envia só os 4 indicadores + timestamps; não manda milhares de pontos no MVP.
3. **Elegibilidade no servidor.** Mesmo que o app grave localmente, o POST só aceita se o uid está no comboio.
4. **Honestidade de UX.** Copy: “Mantenha a permissão Sempre / localização em segundo plano”; Android mostra notificação persistente obrigatória.
5. **Uma sessão ativa por aparelho.** Iniciar outro rolê com gravação aberta → bloquear ou pedir para finalizar a atual.

### 2.4 Relação com outras specs

| Spec | Papel |
|------|--------|
| **005 / 007** | Quem está `aceito` no `usersrole` pode gravar |
| **010** | Feedback textual/estrelas do rolê — independente da telemetria |
| **012** | PWA continua; telemetria background **não** depende dela |
| **017** | Entrada pelo detalhe / cards da garagem |
| **019** | Maps deep link — sem conflito; mapa da trilha = fase 2 desta linha |
| **028** | Mock citava “Ver Telemetria” — esta spec **entrega** o dado real; card da garagem pode mostrar selo “Telemetria” depois do POST |

---

## 3. Referência de Design

Sem pasta `designs/` dedicada nesta proposta. Reusar cockpit:

- Superfície `#121316`, `primary-container` `#ff6b00`, tipografia Barlow Condensed (títulos/CTA) + Plus Jakarta Sans (corpo).
- CTAs altura ≥ 48–56px (`touch-min` / `touch-target`).
- Durante gravação: pill/badge **GRAVANDO** com pulso discreto (1 motion) + cronômetro.
- Resumo: 4 células em grid 2×2 (`telemetry-num` + `badge-label`), sem card-fest: um bloco único de resultado.
- Notificação Android (sistema): título **Rolemoto**, texto **Registrando seu rolê** — não customizar demais.

Copy sugerida:

| Momento | Texto |
|---------|--------|
| CTA idle | **Iniciar gravação** |
| CTA ativo | **Finalizar gravação** |
| Sem Capacitor (PWA/web) | Telemetria com tela desligada só no app Rolemoto (Android/iOS). |
| Permissão negada | Precisamos da localização **sempre** para medir o rolê com a tela off. |
| Já existe telemetria | Ver resumo (sem novo Iniciar) |
| Sessão órfã ao abrir app | Você tem uma gravação em andamento neste rolê. |

---

## 4. Fluxo do usuário

### 4.1 Feliz (Capacitor + tela off)

```
Piloto confirmado abre /roles/[id]
  → toca Iniciar gravação
  → SO pede permissão (When in use → depois Always / background)
  → plugin inicia tracking + notificação (Android)
  → UI: estado GRAVANDO (pode minimizar / apagar tela)
  → … horas depois …
  → reabre o app (cold start ok)
  → UI detecta sessão nativa ativa → mostra Finalizar
  → toca Finalizar
  → plugin para; app lê agregados
  → POST /roles/:id/telemetria
  → tela de resumo (máx, média, tempo, km)
```

### 4.2 Cold start com sessão ativa

```
App morto pelo SO, tracking nativo ainda rodando
  → piloto abre o app
  → bootstrap pergunta ao plugin: getSession()?
  → se roleId bate com a rota ou há sessão global → UI “em andamento”
  → Finalizar segue o mesmo POST
```

### 4.3 Web / PWA

```
Mesmo CTA visível OU oculto
  → se Capacitor.isNativePlatform() === false
  → botão disabled + texto §3 (ou esconder e link “Baixe o app”)
  → sem watchPosition “de mentira” que some com tela off
```

### 4.4 Erros

| Situação | Comportamento |
|----------|----------------|
| Sem aceite no rolê | 403 no POST; CTA nem aparece (ou disabled) |
| Permissão só “enquanto usa” | Não inicia background; explicar que precisa Sempre |
| GPS sem fix por muito tempo | Continua sessão; distância não cresce; ao final métricas podem ser baixas — ok |
| POST falha (offline) | Manter resumo local + CTA **Tentar salvar de novo**; não perder agregados |
| Já existe doc telemetria | POST → 409; UI só GET resumo |

---

## 5. Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│  UI Next (WebView Capacitor)                            │
│  Iniciar / Finalizar / Resumo / POST via useFunctions   │
└──────────────────────────┬──────────────────────────────┘
                           │ JS bridge
┌──────────────────────────▼──────────────────────────────┐
│  Plugin Background Geolocation (nativo)                 │
│  - watch com tela off                                   │
│  - acumula distanciaKm, velocidadeMax, t0, lastPoint    │
│  - persiste sessão em storage nativo                    │
└──────────────────────────┬──────────────────────────────┘
                           │ ao Finalizar: agregados
┌──────────────────────────▼──────────────────────────────┐
│  POST /roles/:id/telemetria  (Bearer)                   │
│  → userstelemetria/{uid}_{roleId}                       │
└─────────────────────────────────────────────────────────┘
```

### 5.1 Next.js + Capacitor

O App Router com SSR **não** empacota direto no Capacitor. Nesta spec:

| Opção | Descrição | Preferência MVP |
|-------|-----------|-----------------|
| **A** | `output: 'export'` (ou build mobile separado) → `webDir` do Capacitor = `out/` | Preferida se as telas do rolê forem estáticas o bastante |
| **B** | Capacitor carrega URL remota (Hosted / App Hosting) em WebView + plugins nativos | Ok para iterar rápido; exige HTTPS e cuidado com auth |

**Decisão de implementação:** escolher A ou B no kickoff e documentar no README mobile. A API continua sendo a function `api` (emulator em dev, prod em release). Firebase Auth no WebView (persistência local) como hoje.

Não criar segundo backend.

### 5.2 Detecção de plataforma

```ts
import { Capacitor } from "@capacitor/core";

export const podeGravarTelemetriaNativa = (): boolean =>
  Capacitor.isNativePlatform();
```

Toda lógica de start/stop atrás de um adapter `telemetriaGpsAdapter` (web stub vs nativo).

---

## 6. Contrato dos Dados

### 6.1 Elegibilidade

Pode iniciar / POST se **todas** forem verdadeiras:

1. Autenticado (Bearer).
2. Rolê existe.
3. `usuarioId === roles.criadorId` **ou** existe `usersrole` com `usuarioId` + `roleId` e `aceito === true`.
4. Ainda **não** existe `userstelemetria` para o par (no POST).
5. Plataforma nativa Capacitor (enforçado no client; servidor não precisa detectar Capacitor).

Pendentes / recusados **não** gravam.

### 6.2 Tipos (front + functions)

```ts
/** Documento persistido — sem polyline no MVP. */
export type TelemetriaRole = {
  id: string; // `{usuarioId}_{roleId}`
  usuarioId: string;
  roleId: string;
  velocidadeMaxKmh: number; // >= 0; 1 casa decimal
  velocidadeMediaKmh: number; // >= 0; 1 casa decimal
  distanciaKm: number; // >= 0; 2 casas decimais
  tempoSegundos: number; // inteiro >= 0 (parede: fim − início)
  tempoMovimentoSegundos: number; // inteiro >= 0; <= tempoSegundos
  iniciadoEm: string; // ISO do device
  encerradoEm: string; // ISO do device
  createdAt: string; // ISO servidor
  updatedAt: string;
};

export type TelemetriaRoleCreate = {
  velocidadeMaxKmh: number;
  velocidadeMediaKmh: number;
  distanciaKm: number;
  tempoSegundos: number;
  tempoMovimentoSegundos: number;
  iniciadoEm: string;
  encerradoEm: string;
};

/** Estado local da sessão (plugin / adapter) — não vai inteiro à API. */
export type SessaoTelemetriaLocal = {
  roleId: string;
  iniciadoEm: string;
  distanciaKm: number;
  velocidadeMaxKmh: number;
  ultimo: { lat: number; lng: number; t: number } | null;
  tempoMovimentoSegundos: number;
};
```

Arquivos: `src/types/telemetria-role.ts` + `functions/src/types/telemetria-role.ts`.

### 6.3 Regras de cálculo (device)

| Campo | Regra |
|-------|--------|
| Ponto aceito | `accuracy` ≤ 50 m (descarta pior); delta tempo ≥ 1 s |
| Salto absurdo | Se Haversine implica > 200 km/h entre pontos, **ignorar** o ponto novo |
| `distanciaKm` | Soma Haversine pontos aceitos |
| `velocidadeMaxKmh` | `max(coords.speed * 3.6)` quando `speed` ≥ 0; senão estimar por delta distância/tempo entre pontos |
| Parado | Se velocidade estimada < 3 km/h por ≥ 10 s, **não** soma em `tempoMovimentoSegundos` nem distância (micro-ruído) |
| `velocidadeMediaKmh` | Se `tempoMovimentoSegundos > 0`: `(distanciaKm / (tempoMovimentoSegundos / 3600))`; senão `0` |
| `tempoSegundos` | `floor((encerradoEm − iniciadoEm) / 1000)` |
| Arredondamento no POST | máx/média 1 casa; km 2 casas; tempos inteiros |

Reusar a ideia de `haversineKm` de `functions/src/lib/geo.ts` num util **shared no client** do adapter (copiar fórmula; não importar functions no app).

### 6.4 Documento Firestore `userstelemetria/{id}`

```
{
  id: string,                 // `{usuarioId}_{roleId}`
  usuarioId: string,
  roleId: string,
  velocidadeMaxKmh: number,
  velocidadeMediaKmh: number,
  distanciaKm: number,
  tempoSegundos: number,
  tempoMovimentoSegundos: number,
  iniciadoEm: timestamp,      // convertido do ISO do body
  encerradoEm: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

Mapper: Timestamp ↔ ISO em `repositories/firestore/mapper.ts` (padrão do projeto).

**Não gravar:** array de pontos, `somaNotas`, velocidade “média de parede” sem documentar.

Índices: leitura por id composto basta; listagem futura por `usuarioId` pode precisar de índice simples.

---

## 7. Backend

### 7.1 Repositório

```
functions/src/repositories/interfaces/telemetria-role.repository.ts
functions/src/repositories/firestore/telemetria-role.firestore.ts
```

Export em `repositories/index.ts`. Rotas **sem** `firestore.collection` direto.

Métodos mínimos: `buscarPorId(id)`, `criar(dados)`.

### 7.2 Rotas

Montar em `roles` router existente **ou** `app.use` com path sob `/roles/:id/telemetria`.

| Método | Path | Auth | Comportamento |
|--------|------|------|----------------|
| `POST` | `/roles/:id/telemetria` | `autenticar` | Cria doc; 409 se já existe; 403 se inelegível; 404 se rolê não existe |
| `GET` | `/roles/:id/telemetria` | `autenticar` | Própria telemetria do uid; 404 se não houver |

Sem listagem pública de telemetrias de outros pilotos no MVP (privacidade). Fase 2: líder ver médias do comboio = outra spec.

### 7.3 Validação POST

- `roleId` da URL; `usuarioId` = `req.usuario.uid`.
- Body: todos os campos de `TelemetriaRoleCreate` presentes.
- Números finitos, ≥ 0; `tempoMovimentoSegundos ≤ tempoSegundos`.
- `encerradoEm` > `iniciadoEm`; duração ≤ 24 h (guarda contra lixo).
- `distanciaKm` ≤ 2000 (guarda).
- `velocidadeMaxKmh` ≤ 350 (guarda GPS louco).
- Elegibilidade §6.1.
- Idempotência: se doc existe → **409** `{ erro: "telemetria_ja_existe" }` (não sobrescrever).

Resposta **201** com `TelemetriaRole` (ISO). GET **200** ou **404**.

### 7.4 Autorização

Não usar `isAdmin` para gravar. Qualquer elegível grava a **própria**. Admin não edita telemetria alheia nesta spec.

---

## 8. Capacitor e plugins

### 8.1 Pacotes (direção)

| Pacote | Uso |
|--------|-----|
| `@capacitor/core` / `cli` / `android` / `ios` | Shell |
| Plugin **background geolocation** | Tracking tela off — preferir solução madura (ex. Transistorsoft comercial **ou** community mantida com foreground service). Avaliar licença no kickoff. |
| `@capacitor/app` | Cold start / `appStateChange` para reancorar UI à sessão |

**Não** depender só de `@capacitor/geolocation` (foreground) para o requisito “tela desligada”.

### 8.2 Android

- `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`.
- `ACCESS_BACKGROUND_LOCATION` (Android 10+) — pedir **depois** da permissão foreground, com tela educativa.
- Foreground service + notificação persistente enquanto grava.
- `targetSdk` alinhado ao Capacitor atual.

### 8.3 iOS

- `NSLocationWhenInUseUsageDescription` + `NSLocationAlwaysAndWhenInUseUsageDescription` (texto §3).
- Background Modes: **Location updates**.
- Pedido Always após When In Use; se o usuário ficar só em When In Use, **não** prometer tela off.

### 8.4 Adapter no front

```
src/lib/telemetria/
├── telemetria-gps.adapter.ts      # interface start/stop/getSession
├── telemetria-gps.web.ts          # stub: throws / unsupported
├── telemetria-gps.native.ts       # bridge do plugin
└── calcular-metricas.ts           # haversine + filtros (testável sem device)
```

Testes unitários em `calcular-metricas.ts` com fixtures de pontos (sem GPS real).

---

## 9. Front (Next.js)

### 9.1 Onde entram os CTAs

| Superfície | Comportamento |
|------------|----------------|
| Detalhe do rolê `/roles/[id]` | Primário: Iniciar / Finalizar / Ver resumo |
| Meus Rolês (opcional MVP+) | Badge “Gravando” se sessão ativa; deep link para o detalhe |

### 9.2 Estrutura sugerida

```
src/app/(app)/roles/[id]/
├── components/
│   ├── BotaoTelemetriaRole.tsx
│   ├── PainelGravacaoAtiva.tsx
│   ├── ResumoTelemetriaRole.tsx      # grid 4 métricas
│   └── ...
├── hooks/
│   ├── useTelemetriaRole.ts          # start/stop + POST/GET
│   └── useSessaoTelemetriaNativa.ts  # sync plugin ↔ UI
└── services/
    └── telemetria-role.service.ts
```

Seguir skill `nextjs-patterns`: page Server quando possível; client só no painel de telemetria.

### 9.3 Service

```ts
export const telemetriaRoleService = {
  buscarMinha: (roleId: string) =>
    api.get<TelemetriaRole>(`/roles/${roleId}/telemetria`),
  publicar: (roleId: string, dados: TelemetriaRoleCreate) =>
    api.post<TelemetriaRole>(`/roles/${roleId}/telemetria`, dados),
};
```

Bearer via `useFunctions` / `src/lib/api.ts` — sem Firestore no client.

### 9.4 Formatação na UI

| Campo | Exibição |
|-------|----------|
| Velocidades | `92,5 km/h` (pt-BR) |
| Distância | `48,32 km` |
| Tempo | `2h 14min` (omitir horas se < 1h → `47min 03s`) |

---

## 10. Fora do escopo (fase 2 explícita)

- Polyline + mapa Leaflet/Mapbox do trajeto.
- Upload de pontos amostrados (Storage ou subcoleção).
- Comparar telemetria entre pilotos do mesmo rolê.
- Regravar / apagar telemetria.
- Widget na tela de bloqueio.
- Apple Watch / Wear OS.

---

## 11. Como testar

Background GPS **não** se valida só no emulador Chrome do Next. Plano em camadas:

### 11.1 Camada A — unitário (CI / laptop)

**O quê:** `calcular-metricas.ts` com arrays de `{ lat, lng, t, speed }`.

**Casos:**

- Distância ~ conhecida (ida e volta no mesmo ponto ≈ 0).
- Ponto com `accuracy` 200 m descartado.
- Salto teleporte descartado.
- Máxima pega o pico de `speed`.
- Média usa só `tempoMovimentoSegundos`.
- Sessão parada 30 min no farol: distância estável, tempo de parede cresce, tempo em movimento não.

**Como:** `npm test` (Vitest/Jest — o que o repo já usar; se não houver runner, adicionar só para este módulo).

### 11.2 Camada B — API (emulator Functions)

**O quê:** elegibilidade e persistência, sem GPS.

```bash
# terminal 1
cd functions && npm run build:watch
# terminal 2
npm run emulators
```

Com token de um usuário **aceito** no rolê:

1. `POST /roles/:id/telemetria` com body válido → 201.
2. Repetir POST → 409.
3. `GET` → 200 com os mesmos números.
4. Usuário sem `usersrole` aceito → 403.
5. Rolê inexistente → 404.
6. Body com `velocidadeMaxKmh: 9999` → 400.

Postman/Insomnia ou script `curl` com Bearer do Auth emulator / token de staging.

### 11.3 Camada C — Capacitor em device real (obrigatório)

Emuladores ajudam no compile; **tela off + moto/carro** só em aparelho físico.

| Passo | Android | iOS |
|-------|---------|-----|
| 1 | `npx cap sync android` → Android Studio → Run no celular | `npx cap sync ios` → Xcode → device |
| 2 | Aceitar localização → depois **Permitir sempre** | When In Use → depois **Sempre** / Precise On |
| 3 | Abrir rolê de teste (aceito) → Iniciar | Idem |
| 4 | Confirmar notificação “Registrando seu rolê” | Confirmar seta de GPS na status bar |
| 5 | **Apagar a tela**, guardar o bolso, andar 5–15 min (a pé ou carro) | Idem |
| 6 | Reabrir app (sem force-stop se possível) → deve mostrar Gravando | Idem |
| 7 | Finalizar → conferir km ≈ trajeto real (Maps) e tempo ≈ relógio | Idem |
| 8 | Force-stop do app **durante** gravação (Android) e reabrir — sessão deve recuperar ou falhar de forma explícita (documentar comportamento do plugin escolhido) | No iOS, matar app pelo switcher e reabrir |

**Checklist de aceite em campo:**

- [ ] Tela off ≥ 10 min: distância > 0 ao finalizar.
- [ ] Máxima ≥ média (salvo trajeto quase constante).
- [ ] Tempo de parede ≈ tempo real (± 1 min).
- [ ] Sem notificação Android → falha de foreground service (bug).
- [ ] Negar “Sempre”: app **não** inicia gravação background (mensagem clara).
- [ ] PWA no Chrome: CTA não finge que grava com tela off.

### 11.4 Camada D — simulação sem sair da mesa

- Android: **Fake GPS** / app de rota mock (dev only) enquanto a tela apaga com Power.
- iOS Simulator: Location → City Run / Freeway Drive **com app em background**; validar compile + sessão, mas **não** considerar aceite final (GPS simulado ≠ device).
- Xcode → Debug → Simulate Background Location Updates (se o plugin documentar).

### 11.5 O que **não** conta como teste desta spec

- Só `getCurrentPosition` no browser desktop.
- Emulator Firebase sem Capacitor.
- Medir velocidade “no farol” sem deslocamento (média ~0 é esperado).

### 11.6 Staging / TestFlight / Play internal

Antes de produção:

1. Internal testing track (Play) + TestFlight (iOS).
2. Justificativa de background location nas fichas das lojas (texto alinhado ao §3).
3. Gravacão real em rolê curto de QA (≥ 20 min, > 5 km).

---

## 12. Critérios de Aceite

### Produto / UX

- [ ] Piloto aceito no rolê vê **Iniciar gravação** no detalhe (Capacitor).
- [ ] Em PWA/web, não há gravação background silenciosa; copy explica o app.
- [ ] Iniciar pede permissões corretas; sem “Sempre”, não promete tela off.
- [ ] Com gravação ativa, Android mostra notificação persistente.
- [ ] Após tela off e retorno, dá para **Finalizar** e ver os 4 números.
- [ ] Resumo exibe máx, média, tempo e distância formatados pt-BR.
- [ ] Se já existe telemetria, UI mostra resumo (GET) sem segundo Iniciar.

### Dados / API

- [ ] Coleção `userstelemetria` com id `{usuarioId}_{roleId}`.
- [ ] `POST` autentica, valida elegibilidade, guarda ISO→Timestamp.
- [ ] `POST` duplicado → 409; inelegível → 403.
- [ ] `GET` devolve só a telemetria do uid autenticado.
- [ ] Rotas usam repositório; sem Firestore direto na route.
- [ ] Client não grava Firestore; só `useFunctions`.

### Nativo

- [ ] Projeto Capacitor Android + iOS no repo (ou pasta `mobile/` documentada).
- [ ] Plugin de background geolocation integrado via adapter.
- [ ] Sessão sobrevive a tela off no **device real** (checklist §11.3).
- [ ] Cold start recupera sessão ativa ou encerra com mensagem explícita.

### Qualidade

- [ ] Testes unitários de `calcular-metricas` com fixtures.
- [ ] Sem polyline / mapa no MVP.
- [ ] Sem endpoints `onCall` / `httpsCallable`.

---

## 13. Ordem de implementação sugerida

1. Tipos + repositório + `POST`/`GET` + testes de API no emulator (**Camada B**).
2. `calcular-metricas` + testes unitários (**Camada A**).
3. UI do detalhe do rolê (estados + POST) com adapter **web stub**.
4. Scaffold Capacitor + plugin background + adapter nativo.
5. Permissões iOS/Android + notificação.
6. QA em device real (**Camada C**) → ajustar filtros de ruído.
7. TestFlight / Play internal (**Camada D** de loja).

---

## 14. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| iOS nega Always | UX educativa em 2 passos; métricas só com permissão adequada |
| OEM Android mata serviço | Plugin com foreground service; QA em Xiaomi/Samsung |
| Next export × SSR | Decidir §5.1 cedo; não misturar duas strategies |
| GPS impreciso | Filtros §6.3; copy “estimativa por GPS” no resumo |
| Rejeição nas lojas | Justificativa + UI óbvia de gravação de rolê |
| Plugin community abandonado | Preferir opção com manutenção / licença clara no kickoff |

---

## 15. Checklist de arquivos (previsto)

| Path | Ação |
|------|------|
| `docs/specs/029-telemetria-role-capacitor.md` | Esta spec |
| `functions/src/types/telemetria-role.ts` | Novo |
| `functions/src/repositories/interfaces/telemetria-role.repository.ts` | Novo |
| `functions/src/repositories/firestore/telemetria-role.firestore.ts` | Novo |
| `functions/src/repositories/index.ts` | Alterar — factory |
| `functions/src/routes/roles.ts` (ou router dedicado) | Alterar — endpoints |
| `src/types/telemetria-role.ts` | Novo |
| `src/lib/telemetria/*` | Novo — adapter + métricas |
| `src/app/(app)/roles/[id]/…` | Alterar — CTAs + resumo |
| `android/` `ios/` + `capacitor.config.ts` | Novo — shell Capacitor |
| README mobile (raiz ou `docs/`) | Novo — build, sync, teste em device |

---

## 16. Resumo executivo

Entregar telemetria de rolê (**máx, média, tempo, km**) com **gravação iniciada no app, tela desligada, finalização ao reabrir**, usando **Capacitor + GPS background** em Android e iOS, persistindo só o resumo em `userstelemetria` via API Express. PWA não substitui o app nativo para este requisito. Mapa do trajeto fica para fase 2.

**Teste que importa:** device físico, permissão Sempre, tela off ≥ 10 minutos, depois Finalizar e conferir os quatro números — unitário e emulator só cobrem cálculo e API.
