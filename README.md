# Rolemoto App

PWA gratuito para motociclistas encontrarem e organizarem **rolês** (passeios de moto).

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Auth:** Firebase Authentication (Google e email/senha)
- **API:** Firebase Cloud Functions (Express, uma function `api`)
- **Banco:** Cloud Firestore — acessado pelas functions via **repositórios**, não pelas rotas

---

## Pré-requisitos

- Node.js 22
- Conta Firebase no projeto `rolemoto-bc47f`
- Arquivo `.env.local` (copie de `.env.example`)

```bash
npm install
cd functions && npm install && cd ..
```

---

## Rodar o frontend

```bash
npm run dev
```

Abre em [http://localhost:3000](http://localhost:3000).

---

## Instalar no celular (PWA)

O Rolemoto é um PWA: o piloto abre o site no celular e usa **Adicionar à tela inicial** — sem Play Store nem App Store.

- **Android (Chrome):** o prompt nativo aparece no login ou em Perfil → Adicionar à tela inicial.
- **iOS (Safari):** Compartilhar → Adicionar à Tela de Início. O app ensina esses 3 toques; o Safari não instala sozinho.

O service worker **só registra em produção** (`npm run build && npm start` ou deploy). `npm run dev` deixa o SW desligado para não atrapalhar o HMR.

Instalação e a página `/offline` exigem **HTTPS** no mesmo origin do app. `localhost` e o emulator não provam o aceite no iPhone.

### Notificações push

Dois avisos nativos: pedido de vaga (para o organizador) e aceite (para o piloto). Recusa não notifica.

- A chave **VAPID** (`NEXT_PUBLIC_FIREBASE_VAPID_KEY`) sai do Firebase Console → Project settings → Cloud Messaging → Web Push certificates. Sem ela o app não registra o token.
- Push exige **HTTPS** (ou `localhost`). No **iOS**, Web Push só funciona depois de instalar o PWA (Safari → Adicionar à Tela de Início). No Android Chrome, chega mesmo em aba.
- O service worker da SPEC 012 (`src/app/sw.ts`) também trata o push em background. Não há um segundo SW.
- O envio FCM acontece nas Cloud Functions (`POST /roles/:id/participacao` e `PATCH /aprovacoes/:id`). Não há emulator de FCM — o send vai para o FCM de verdade. Tokens de `localhost` e de produção são origins diferentes.
- Logout tenta `DELETE /dispositivos` antes do `signOut`, para o próximo usuário no mesmo browser não receber push alheio.
- Opcional nas functions: `APP_ORIGIN` (ex. `https://seu-dominio`) para o clique nativo do Chrome (`webpush.fcmOptions.link`) e para o `continueUrl` do e-mail de redefinir senha. Sem ela, o service worker abre o deep link e o reset depende só da action URL do console.
- Nas functions (`functions/.env`, ver `functions/.env.example`): `WEB_API_KEY` — a mesma Web API key do app (`NEXT_PUBLIC_FIREBASE_API_KEY`). Sem ela o `POST /auth/recuperar-senha` não consegue disparar o e-mail nativo do Auth.

### Segurança (produção)

1. **Firestore rules:** deny-all no client (`firestore.rules`). Dados só via Cloud Functions (Admin SDK). Deploy: `firebase deploy --only firestore:rules` **depois** do frontend que usa `GET /perfil` (não lê Firestore direto).
2. **CORS:** a function `api` só aceita origins do PWA (`cors.json` + `APP_ORIGIN`).
3. **Lembretes:** `POST /lembretes/enviar` exige OIDC do Cloud Tasks. Configure `FUNCTIONS_BASE_URL` em produção se a URL da API não for o default.
4. **App Check (reCAPTCHA v3):**
   - Console → App Check → registrar o app web → copiar a site key para `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
   - Em dev, o console do browser imprime um debug token — registre em App Check → Manage debug tokens
   - Nas functions, só ligue `APP_CHECK_ENFORCE=true` **depois** da site key no frontend; senão a API responde 401
5. **Rate limit:** in-memory por instância (resolver 10/min, recuperar-senha 5/min, público 60/min, autenticado 120/min).

### Redefinir senha (console Firebase)

O e-mail de reset é o template nativo do Firebase Auth. Para o link abrir `/redefinir-senha` no app (e não a UI `__/auth/action`):

1. Authentication → Templates → **Password reset** → Customize action URL: `{APP_ORIGIN}/redefinir-senha`
2. Authentication → Settings → **Authorized domains**: domínio de produção + `localhost`
3. Template em português, se ainda não estiver

No emulator de Auth (`npm run emulators:all`) o e-mail aparece na UI `http://127.0.0.1:4000` (aba Auth).

---

## Rodar o backend (Cloud Functions) local

O backend **não** sobe com `npm run dev`. Use o Emulator Suite.

### 1. Compilar TypeScript em watch (terminal 1)

```bash
cd functions
npm run build:watch
```

O emulator só recarrega o JavaScript em `functions/lib/`. Sem o `tsc -w`, mudanças em `.ts` não entram.

### 2. Subir o emulator (terminal 2)

Functions + Storage (fotos). Auth e Firestore de **produção**:

```bash
npm run emulators
```

Functions + Firestore + Auth + Storage 100% locais:

```bash
npm run emulators:all
```

UI do emulator: [http://127.0.0.1:4000](http://127.0.0.1:4000)

### URLs da API

| Ambiente | Base                                                        |
| -------- | ----------------------------------------------------------- |
| Local    | `http://127.0.0.1:5001/rolemoto-bc47f/us-central1/api`      |
| Produção | `https://us-central1-rolemoto-bc47f.cloudfunctions.net/api` |

Health check (sem auth): `GET /`

Recursos autenticados: `/roles`, `/meus-roles`, `/perfil`, `/aprovacoes`, `/dispositivos`

Público (sem Bearer): `POST /auth/resolver`, `POST /auth/recuperar-senha`

O frontend em `NODE_ENV=development` já aponta para o emulator. Para forçar outra URL:

```
NEXT_PUBLIC_FUNCTIONS_URL=http://127.0.0.1:5001/rolemoto-bc47f/us-central1/api
NEXT_PUBLIC_STORAGE_EMULATOR_HOST=127.0.0.1:9199
```

O upload de fotos no localhost usa o **Storage emulator** (porta 9199). Sem ele, o SDK tenta o bucket de produção e o browser bloqueia por CORS.

Para o bucket de produção (`rolemoto-bc47f.firebasestorage.app`), o projeto precisa do plano Blaze. Depois de criar o bucket no console:

```bash
gcloud auth login
gcloud config set project rolemoto-bc47f
npm run storage:cors
```

Isso aplica o `cors.json` (localhost:3000 e o Hosting do Firebase).

### Credenciais do Admin SDK no emulator

Para `verifyIdToken` e acesso ao Firestore de produção a partir do emulator, faça login no Firebase CLI:

```bash
npx -y firebase-tools@latest login
npx -y firebase-tools@latest use rolemoto-bc47f
```

Se APIs do Google falharem localmente, defina `GOOGLE_APPLICATION_CREDENTIALS` apontando para uma service account JSON.

---

## Arquitetura da API

Uma function HTTP (`api`) com Express. Rotas **não** chamam Firestore. Elas usam interfaces de repositório; a implementação Firestore fica isolada e pode ser trocada no futuro.

```
functions/src/
├── index.ts                          # Express + export da function `api`
├── lib/firebase-admin.ts             # Único initializeApp do Admin SDK
├── middleware/
│   ├── auth.ts                       # Bearer token → req.usuario
│   ├── authorize.ts                  # admin / dono do recurso
│   └── errors.ts
├── routes/                           # HTTP: valida, autoriza, chama repositório
│   ├── roles.ts
│   └── perfil.ts
├── repositories/
│   ├── index.ts                      # Factory (troque a impl. aqui)
│   ├── interfaces/                   # Contratos (sem Firebase)
│   └── firestore/                    # Único lugar que fala com Firestore
└── types/                            # Domínio em ISO string, sem Timestamp
```

**Regra:** `firebase-admin/firestore` só entra em `lib/firebase-admin.ts` e em `repositories/firestore/`.

---

## Criar um novo endpoint

1. Se for recurso novo, crie o tipo em `functions/src/types/`.
2. Crie a **interface** em `repositories/interfaces/` (`buscarPorId`, `criar`, `atualizar`, `remover`…).
3. Implemente em `repositories/firestore/` usando `firestore` de `lib/firebase-admin`.
4. Exporte a instância em `repositories/index.ts`.
5. Crie o router em `routes/` e aplique `autenticar`.
6. Registre no `index.ts`: `app.use("/meu-recurso", meuRouter)`.

Exemplo mínimo:

```ts
import { Router } from "express";
import { autenticar } from "../middleware/auth";
import { meuRepository } from "../repositories";

export const meuRouter = Router();
meuRouter.use(autenticar);

meuRouter.get("/", async (req, res) => {
  const item = await meuRepository.buscarPorId(req.usuario!.uid);
  res.json(item);
});
```

Não crie uma Cloud Function nova por rota. Tudo entra na function `api` (menos cold start, menos custo).

---

## Autenticação do usuário

O cliente envia o ID token do Firebase Auth:

```
Authorization: Bearer <idToken>
```

O middleware `autenticar` chama `adminAuth.verifyIdToken` e preenche:

```ts
req.usuario = { uid, email, claims };
```

Rotas protegidas:

```ts
router.use(autenticar);
const uid = req.usuario!.uid;
```

`GET /` (health) fica público. O Admin SDK **ignora** as Security Rules do Firestore — a checagem de identidade tem que acontecer na function.

---

## Autorização (roles / dono)

Duas camadas, em `middleware/authorize.ts`:

| Helper                              | Quando usar                                |
| ----------------------------------- | ------------------------------------------ |
| `isAdmin(usuario)`                  | Custom claim `admin: true` no token        |
| `isDonoOuAdmin(usuario, criadorId)` | PUT/DELETE de rolê (só o criador ou admin) |

Perfil: o uid **sempre** vem do token, nunca do body/params.

Para promover um admin (uma vez, via script ou console):

```ts
await adminAuth.setCustomUserClaims(uid, { admin: true });
```

O usuário precisa sair e entrar de novo (ou `getIdToken(true)`) para o claim ir no token.

---

## Acesso ao banco

Nas rotas:

```ts
import { roleRepository } from "../repositories";

const roles = await roleRepository.listar();
```

Na implementação Firestore (único lugar com coleções):

```ts
await firestore.collection("roles").doc(id).get();
```

Tipos de domínio usam `string` ISO para datas. O mapper em `repositories/firestore/mapper.ts` converte `Timestamp` ↔ ISO.

Para outro banco no futuro: nova pasta `repositories/postgres/` (por exemplo) e troca das instâncias em `repositories/index.ts`. Rotas e middleware não mudam.

---

## Acessar pelo frontend (Next.js)

Não use `httpsCallable`. O backend é HTTP (`onRequest`).

```tsx
"use client";
import { useFunctions } from "@/hooks/useFunctions";

const Lista = () => {
  const { get, post, put, del, loading, erro } = useFunctions();

  const carregar = async () => {
    const roles = await get<Role[]>("/roles");
    const perfil = await post("/perfil", {
      nome: "Ana",
      apelido: "Ana",
      moto: "CG",
      pilotagem: "tranquila",
    });
    await put(`/roles/${id}`, { categoria: "moderado" });
    await del(`/roles/${id}`);
  };
};
```

O hook chama `src/lib/api.ts`, que:

1. Pega `auth.currentUser.getIdToken()`
2. Faz `fetch` em `functionsApiUrl` + caminho
3. Envia `Authorization: Bearer <token>`

O usuário precisa estar logado (`AuthProvider`). Sem token a API responde `401`.

Chamada sem o hook (em Client Component):

```ts
import { api } from "@/lib/api";
const perfil = await api<Usuario>("/perfil");
```

`api` usa `auth.currentUser`, então só funciona no **client** (ou onde o Auth SDK estiver hidratado).

O `AuthProvider` ainda lê o perfil via `src/lib/firestore.ts` (SDK client). Fluxos novos devem passar pela API (`/perfil`, `/roles`) para concentrar regras no backend.

---

## Deploy das functions

```bash
npx -y firebase-tools@latest deploy --only functions
```

O `predeploy` em `firebase.json` roda lint + `tsc` em `functions/`.

---

## Scripts

| Script                                | O quê                                                |
| ------------------------------------- | ---------------------------------------------------- |
| `npm run dev`                         | Next.js                                              |
| `npm run emulators`                   | Function `api` + Storage locais (portas 5001 e 9199) |
| `npm run emulators:all`               | Functions + Firestore + Auth + Storage locais        |
| `npm run storage:cors`                | Aplica `cors.json` no bucket de produção             |
| `cd functions && npm run build:watch` | Recompila o backend a cada save                      |
| `cd functions && npm run deploy`      | Publica as functions                                 |
