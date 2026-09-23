# App nativo Rolemoto (Capacitor)

Telemetria do rolê com **tela desligada** (SPEC 029). O Next.js continua sendo o app; Android/iOS são um WebView + plugins nativos de GPS.

## Decisão §5.1 — opção B (URL remota)

O App Router usa SSR, Serwist e rewrites — **não** empacota com `output: 'export'`. O Capacitor carrega o site em HTTPS no WebView:

| Build | `CAPACITOR_SERVER_URL` |
| ----- | ---------------------- |
| Loja / QA | `https://www.rolemoto.com.br` (default em `capacitor.config.ts`; o apex redireciona e abriria o Chrome) |
| Device + Next local (Android) | `http://<IP-da-LAN>:3000` |
| Device + Next local (iOS) | túnel **HTTPS** (ngrok) — ATS bloqueia HTTP |

Depois de mudar o env:

```bash
npx cap sync
```

Auth no Capacitor: e-mail/senha pelo Firebase JS no WebView; **Google** usa Sign-In nativo (`@capacitor-firebase/authentication` → `signInWithCredential`) — ver SPEC 040. Web/PWA continua popup/redirect (SPEC 012). A API continua sendo a function `api`.

Push híbrido (SPEC 042): no APK/loja o token FCM vem de `@capacitor/push-notifications` (`plataforma: android|ios`); no Chrome/PWA continua VAPID + service worker (`plataforma: web`). A mesma coleção `dispositivos` e o mesmo `notificacoes.ts` enviam os dois formatos. Canal Android `rolemoto_push` (avisos de rolê) — distinto da notificação persistente da telemetria Capgo. Emulator de Functions **não** dispara FCM; QA de card nativo exige Functions deployadas.

Plugin de GPS: `@capgo/background-geolocation` (foreground service + notificação). Com a opção Capgo **`url`**, cada ponto é POSTado **nativamente** para `POST /telemetria/sessao/:id/ponto` (agrega no Firestore mesmo com WebView congelado). Preferências: `networkFallback: true`, `distanceFilter: 5`, accuracy máx. 100 m (aceita fix de rede com tela off). Preferences no device guardam espelho local; no Finalizar o app lê os agregados do servidor. Detalhe: [SPEC 041](./specs/041-telemetria-tela-off-capgo-url.md).

**Pré-requisito Google no APK:** app Android `br.com.rolemoto.app` no Firebase + SHA-1 (debug e release/Play) + `google-services.json` em `android/app/`. No iOS: `GoogleService-Info.plist` + URL scheme `REVERSED_CLIENT_ID`.

---

## Pré-requisitos

- Node 22, repo com `npm install` (`npx cap` 8 exige Node ≥ 22; `nvm use 22`)
- **Android:** Android Studio (SDK 35+), celular com USB debug **ou** emulador (emulador não vale como aceite de tela off)
- **iOS:** macOS + Xcode + conta Apple Developer; cabo no iPhone
- Um rolê em que o usuário de teste está **aceito** (ou é o criador)

---

## Camada A — unitário (laptop)

```bash
npm test
```

Cobre `src/lib/telemetria/calcular-metricas.ts` (accuracy, teleporte, máxima, parado no farol). **Não** substitui o teste em moto/carro.

---

## Camada B — API (emulator)

```bash
# terminal 1
cd functions && npm run build:watch
# terminal 2
npm run emulators
```

Token Bearer de um usuário aceito no rolê. Base: `http://127.0.0.1:5001/rolemoto-bc47f/us-central1/api`

```bash
# 201
curl -sS -X POST "$API/roles/$ROLE_ID/telemetria" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "velocidadeMaxKmh": 92.5,
    "velocidadeMediaKmh": 48.1,
    "distanciaKm": 12.34,
    "tempoSegundos": 1800,
    "tempoMovimentoSegundos": 1500,
    "iniciadoEm": "2026-09-18T12:00:00.000Z",
    "encerradoEm": "2026-09-18T12:30:00.000Z"
  }'

# 409 na repetição · GET 200 · usuário sem aceite → 403
# rolê inexistente → 404 · velocidadeMaxKmh 9999 → 400
```

---

## Camada C — device real (obrigatório)

### 1. Subir o front

```bash
npm run dev
```

No celular, o `localhost` da máquina **não** é o localhost do aparelho.

**Android (mesma Wi-Fi):** o Next já publica a Network URL. Exemplo com `192.168.1.15`:

```bash
# .env.local precisa apontar a API ao IP da LAN (127.0.0.1 no celular é o aparelho)
# NEXT_PUBLIC_FUNCTIONS_URL=http://192.168.1.15:5001/rolemoto-bc47f/us-central1/api

nvm use 22
CAPACITOR_SERVER_URL=http://192.168.1.15:3000 npx cap sync android
npx cap open android
```

Reinicie `npm run dev` e `npm run emulators` depois de mudar o `.env.local` ou o `host: 0.0.0.0` no `firebase.json`.

> **Tela off em LAN:** o POST nativo Capgo usa `NEXT_PUBLIC_FUNCTIONS_URL`. Sem a function alcançável no aparelho, **Iniciar** falha de propósito (SPEC 041). Em build de loja use API HTTPS de produção.

No Android Studio: Run no aparelho. Marque USB debugging.

**iOS:** use ngrok (HTTPS) apontando à porta 3000, depois:

```bash
CAPACITOR_SERVER_URL=https://xxxx.ngrok-free.app npx cap sync ios
npx cap open ios
```

No Xcode: selecione o iPhone → Signing (seu Team) → Run.

Para **apontar à API de produção** no device, não defina `NEXT_PUBLIC_FUNCTIONS_URL` de emulator no `.env.local` (ou use um `.env` de staging). Emulador `127.0.0.1:5001` no celular não alcança o PC sem túnel.

Build de loja: **não** passe `CAPACITOR_SERVER_URL` HTTP; o default é o site de produção.

### 2. Permissões

| Android | iOS |
| ------- | --- |
| Localização → **Permitir o tempo todo** (depois de “enquanto usa”) | When In Use → **Sempre** + Precise On |
| Notificações ligadas (Android 13+) | Background Modes: Location (já no `Info.plist`) |

Sem “Sempre”, o app **não** inicia a gravação background — a UI explica.

**Internet no Iniciar:** a sessão ao vivo (POST nativo Capgo) exige rede no momento de **Iniciar gravação**. Sem API alcançável, o app mostra erro e não começa. Com tela off, dados móveis (ou Wi‑Fi) precisam estar ok para os POSTs nativos; Capgo não reenvia pontos perdidos offline.

### 3. Roteiro de campo

1. Login no app nativo → rolê confirmado (`/roles/:id/participar`) → **Iniciar gravação**.
2. Aceitar o texto educativo e as permissões.
3. Android: notificação persistente **Rolemoto / Registrando seu rolê**. iOS: seta de GPS na status bar.
4. **Apagar a tela**, bolso, andar 10–15 min (a pé ou carro).
5. Reabrir (cold start ok) → deve mostrar **GRAVANDO** + **Finalizar gravação**.
6. Finalizar → conferir os 4 números (máx, média, tempo, km) ≈ Maps / relógio.
7. Force-stop (Android) ou matar no switcher (iOS) **durante** a gravação e reabrir: a sessão deve voltar do storage nativo, ou a UI deixa claro que acabou. Com FGS no Android o processo costuma viver; no iOS, matar o app pelo switcher **pode** encerrar o GPS (limitação do SO).

**Aceite:**

- [ ] Tela off ≥ 10 min → distância > 0 (functions de produção ou emulator acessível na LAN)
- [ ] Máxima ≥ média (salvo ritmo constante)
- [ ] Tempo de parede ≈ relógio (± 1 min)
- [ ] Notificação Android visível o tempo todo
- [ ] Negar “Sempre” → não inicia + mensagem clara
- [ ] Sem rede no Iniciar → não inicia + mensagem clara
- [ ] Chrome PWA: botão disabled + copy do app, sem fingir tela off

### 4. Mesa (não conta como aceite)

- Android: app Fake GPS + Power para apagar a tela
- iOS Simulator: Features → Location → Freeway Drive, app em background

---

## Enviar para a loja

Faça o aceite de campo **antes**. A Play e a App Store exigem justificativa de localização em background.

### Justificativa (cole nas fichas)

> O Rolemoto grava a telemetria do rolê de moto (velocidade máxima, média, tempo e distância) com o celular no bolso e a tela desligada. Pedimos localização **sempre** / em segundo plano só enquanto o piloto toca em “Iniciar gravação” até “Finalizar”. Não rastreamos o usuário fora dessa sessão e não enviamos a polyline a outros pilotos.

Textos nativos (Info.plist / tela educativa) batem com isso.

### Google Play — teste interno → produção

1. `CAPACITOR_SERVER_URL` **não** definido (ou igual a `https://rolemoto.com.br`).
2. `npx cap sync android`
3. Android Studio → Build → Generate Signed App Bundle (**.aab**)
4. [Play Console](https://play.google.com/console) → app Rolemoto (pacote `br.com.rolemoto.app`)
   - Se for o primeiro upload: crie o app, política de privacidade, classificação, conteúdo
   - **Release** → Teste interno → criar release → upload do `.aab`
5. Formulário **Permissões de localização em segundo plano**:
   - Vídeo curto: Iniciar → tela off → Finalizar → resumo
   - Texto da justificativa acima
   - Declaração de uso principal: “navegação / fitness / tracking iniciado pelo usuário”
6. Testers internos (e-mail Gmail) instalam pelo link de teste
7. Depois do aceite: promover para produção (revisão pode levar dias por causa do GPS background)

Assinatura: use o keystore da organização; **não** commite `.jks` / `.keystore`.

### Apple — TestFlight → App Store

1. Mac: `npx cap sync ios` → Xcode → Signing & Capabilities (Team pago)
2. Product → Archive → Distribute App → **App Store Connect**
3. [App Store Connect](https://appstoreconnect.apple.com) → app Rolemoto (`br.com.rolemoto.app`)
4. TestFlight: adicionar testers internos; no iPhone, app TestFlight
5. Review notes: colar a justificativa + usuário de demo (piloto aceito num rolê de QA)
6. Preencher **App Privacy**: Location — Precise, usado para tracking de percurso iniciado pelo usuário; não usado para ads
7. Submeter para revisão (background location costuma pedir o vídeo / notas claras)

### Checklist loja

- [ ] Privacy policy no ar (mesmo domínio do app) mencionando GPS só durante a gravação
- [ ] Conta de QA com rolê aceito e data próxima
- [ ] Ícones / splash já no projeto nativo (launcher Capacitor)
- [ ] Build aponta ao **site de produção**, não ao IP da LAN
- [ ] Functions de produção já têm `POST|GET /roles/:id/telemetria` deployadas

```bash
npx -y firebase-tools@latest deploy --only functions
```
