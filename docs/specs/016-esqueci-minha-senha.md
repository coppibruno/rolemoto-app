# SPEC 016 — Esqueci minha senha (redefinir no app)

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-12  
> **Referência visual:** `designs/redefinir-senha-2/` (`DESIGN.md`, `code.html`, `screen.png`)  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade  
> **Backend:** Cloud Function `api` (Express) — `POST /auth/recuperar-senha` (público, sem Bearer)  
> **Auth:** Firebase Authentication (email/senha). A senha **não** passa pela nossa API.  
> **Coleção Firestore:** nenhuma nova. Apelido continua em `users`; e-mail só no Auth.  
> **Depende de:** SPEC 001 (login / primeiro acesso), SPEC 012 (PWA / Auth emulator), SPEC 014 B1+B2 (sheet “Esqueceu a senha?” + `POST /auth/resolver`)

---

## 1. Objetivo

Fechar o fluxo de **esqueci minha senha** dentro do Rolê Moto.

Hoje o sheet do login (SPEC 014) já pede e-mail/apelido e dispara `sendPasswordResetEmail` **sem** `actionCodeSettings`. O piloto cai na **página hospedada do Firebase** (`__/auth/action`), redefine lá e não volta ao app de forma previsível.

Nesta spec o e-mail leva a uma **tela nossa** (`/redefinir-senha`), no visual de `designs/redefinir-senha-2/`. Depois de gravar a senha nova, a pessoa vai ao **login** e entra de novo — **sem** sessão automática e **sem** cair no feed.

Esta spec é **full stack**:

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | Sheet do login chama a function (não mais o SDK de e-mail). Página pública `/redefinir-senha` no visual do mock. Valida o `oobCode`, aplica a senha via SDK do Auth, redireciona a `/login`. |
| Back (Functions) | `POST /auth/recuperar-senha` **sem** Bearer: resolve e-mail/apelido, dispara o e-mail de reset do Firebase com continue URL do app. Sempre 204 (não enumerar contas). |
| Firebase Auth | Dono da senha e do `oobCode`. Template padrão de e-mail. Action URL customizada para o app. |

**Não** se cria coleção, SMTP próprio nem tela nova de “pedir o e-mail” — o sheet do login permanece.

---

## 2. Referência de Design

Replicar o visual de `designs/redefinir-senha-2/` (`code.html` + `screen.png`). Não inventar outro layout. Tokens em `DESIGN.md` / `globals.css`. **Não** copiar o HTML do Stitch (Tailwind CDN + Inter) — CSS Modules + tipografia já do app (Barlow Condensed + Plus Jakarta Sans).

A tela **não** vive no grupo `(app)`: sem `GuardaApp`, sem `MenuInferior`. É uma página do fluxo de auth, mobile-first, coluna única, **max-width 560px**.

O mock cobre **só** “Criar Nova Senha” (o destino do link). O pedido do link continua o sheet já existente em `/login`.

### O que entra nesta spec (do mock)

- Header sticky: voltar, marca **ROLÊMOTO** (`two_wheeler` + wordmark), avatar decorativo `person`.
- Chip **Voltar ao login** (seta + texto).
- Card hero: ícone `lock_reset` (FILL), pill **Pit Stop de Segurança** (pulso laranja), título **Criar Nova Senha**, subtítulo do mock.
- Chip do e-mail mascarado: `verified_user` + “Redefinindo para: **{email mascarado}**”.
- Campo **Nova Senha** (hint “mín. 8 caracteres”, ícone `key`, toggle de visibilidade).
- Campo **Confirmar Nova Senha** (ícone `lock_clock`, toggle próprio).
- Pill de conferência (estados do mock: aguardando / coincidem / mín. 8 / não coincidem).
- CTA laranja **Redefinir Senha e Entrar** + seta.
- Microcopy com `shield`: “Criptografia de ponta a ponta ativa na sua sessão.” (fidelidade visual; ver desvio).

### O que o mock mostra e **não** entra

| Elemento do mock | Motivo |
|------------------|--------|
| Medidor de força em 4 barras (`updateStrengthMeter`) | Sumiu do HTML visível e **não** aparece no `screen.png` |
| `requestNewLink()` / bento auxiliar | Bloco vazio no HTML; sem UI |
| `alert()` de sucesso / “acelerando para a garagem” | Produto manda ao **login**, não ao feed |
| Auto-login após o submit | Pedido explícito: redefinir → login → a pessoa entra |
| Fonte Inter / Tailwind CDN | App já tem tokens e CSS Modules |
| `history.back()` | O link veio do e-mail; voltar pode sair do app. Os dois “voltar” vão a `/login` |
| Avatar `person` como atalho de perfil | Página anônima; o círculo é **decorativo** (`aria-hidden`), sem `href` |

### Desvios conscientes do mock (necessários)

O HTML é um protótipo estático com e-mail fictício e JS de vitrine. No app o `oobCode` vem da query, o e-mail sai do Auth e o destino pós-sucesso é o login.

| Mock | Nesta spec | Por quê |
|------|------------|---------|
| CTA “Redefinir Senha e Entrar” → “garagem principal” | Mesmo rótulo visual; depois do êxito → `/login?senhaRedefinida=1` **sem** `signIn` | Pedido do produto: a pessoa faz o login |
| E-mail aberto `rodrigo***@email.com` hardcoded | `verifyPasswordResetCode` + máscara no client | Não vazar o endereço completo (ombro / print) |
| Força da senha em JS | Omitir | Fora do `screen.png` |
| Mín. 8 no hint; cadastro atual pede 6 | Esta tela exige **8**; cadastro **não** muda | Fidelidade ao mock nesta feature |
| “Criptografia de ponta a ponta” | Manter o texto | Igual SPEC 006: copy do mock, efeito real é TLS + Auth |
| Link inválido / expirado inexistente | Estado próprio no mesmo visual (card + voltar ao login) | E-mail velho / `oobCode` ausente |
| Sem pedido de e-mail | Sheet do login (SPEC 014) | Já existe; não redesenhar |

Não adicionar medidor de força, captcha, “digite a senha antiga” nem troca de senha logado no perfil.

### Comportamento visual (do mock)

- Conteúdo em coluna única, gutter 16px, **max-width 560px**.
- Fundo `surface` (`#121316`).
- Header fixo, `pt-safe`, blur, altura 64px, conteúdo alinhado ao mesmo max-width.
- Voltar do header: 48×48 (`touch-min`), ícone `arrow_back` 24px.
- Marca: `two_wheeler` em `primary-container` + **ROLÊ** `on-surface` + **MOTO** `primary-container`, Barlow `headline-sm` uppercase.
- Avatar header: círculo 32px, fundo `primary`, ícone `person` `on-primary` — sem clique.
- Chip “Voltar ao login”: `surface-container-low`, `body-sm`, ícone 18px, área de toque ≥ 48px de altura.
- Card hero: `surface-container-low`, `rounded-xl`, padding `--card-padding-lg`, glow laranja absoluto (`primary-container` ~15%, blur) só no CSS Module.
- Badge do ícone: 56×56, `surface-container-high`, `lock_reset` 28px `primary-container`.
- Pill “Pit Stop de Segurança”: `badge-label`, fundo `surface-container-highest`, ponto `primary-container` com pulso, texto `secondary`.
- Título: Barlow Condensed, uppercase, `display-hero-mobile` (36/40).
- Subtítulo: Plus Jakarta `body-md`, `on-surface-variant`.
- Chip do e-mail: `surface-container`, `body-sm`, `verified_user` em `primary`.
- Labels: `headline-sm` uppercase. Hint “mín. 8 caracteres”: `label-md`, `on-surface-variant`, lowercase.
- Inputs: altura `touch-target` (56px), fundo `surface-container-low`, ícone à esquerda, toggle 48×48 à direita. `autocomplete="new-password"`.
- Pill de match: `surface-container` (aguardando) / `surface-container-high` (demais). Cores: `on-surface-variant` / `tertiary` / `secondary` / `error`.
- CTA: largura total, 56px, `primary-container`, Barlow uppercase, glow laranja, ícone `arrow_forward`.
- Microcopy `shield` em `secondary`, texto `body-sm` `on-surface-variant`.
- Enquanto envia: CTA disabled, ícone `progress_activity`, texto “Atualizando chave de acesso...”.
- Êxito breve (~600–800 ms, opcional): CTA em `tertiary` / `on-tertiary`, “Senha Redefinida!” — **depois** `replace` no login. Não ficar nessa tela.

### Conferência das senhas (do mock)

| Situação | Ícone | Copy | Cor do texto |
|----------|-------|------|----------------|
| Confirmação vazia | `radio_button_unchecked` | Aguardando confirmação de senha | `on-surface-variant` |
| Iguais e ≥ 8 | `check_circle` FILL | As senhas coincidem perfeitamente | `tertiary` |
| Iguais e &lt; 8 | `check_circle` FILL | Senhas iguais, mas precisa ter no mínimo 8 caracteres | `secondary` |
| Diferentes | `cancel` FILL | As senhas ainda não coincidem | `error` |

CTA só habilita com iguais **e** ≥ 8. Submit com inválido não chama o Auth.

---

## 3. Fluxo do Usuário

```
/login (modo login, não cadastro)
  │
  └── [Esqueceu a senha?]  →  sheet SPEC 014 (inalterado visualmente)
        │
        ├── identificador vazio → “Preencha o e-mail ou o apelido.”
        └── Enviar link
              │
              └── POST /auth/recuperar-senha  { identificador }   (sem Bearer)
                    │
                    └── 204 sempre (formato ok) + copy genérica de sucesso
                          │
                          └── e-mail do Firebase (se a conta existir e tiver e-mail)
                                link → {origin}/redefinir-senha?mode=resetPassword&oobCode=…&apiKey=…&lang=pt

Abre /redefinir-senha
  │
  ├── sem oobCode / mode ≠ resetPassword / código inválido ou expirado
  │     → EstadoLinkInvalido  (“Este link expirou ou já foi usado”)
  │           └── [Voltar ao login] → /login
  │
  └── oobCode válido
        │
        ▼
      verifyPasswordResetCode → e-mail mascarado no chip
        │
        └── formulário do mock
              │
              ├── [Voltar] / [Voltar ao login] → /login   (não consome o código)
              └── [Redefinir Senha e Entrar]
                    │
                    ├── client: senhas ≠ ou < 8 → pill; sem request
                    └── confirmPasswordReset(oobCode, novaSenha)
                          │
                          ├── ok → signOut se houver sessão residual
                          │         → /login?senhaRedefinida=1
                          │              └── banner “Senha redefinida. Entre com a nova senha.”
                          └── erro Auth → mensagem no form; código pode ter sido consumido
                                          (aí o estado vira link inválido)

Login (?senhaRedefinida=1)
  │
  └── formulário de login (não cadastro). A pessoa digita a senha nova.
```

- Abrir `/redefinir-senha` **nunca** cria sessão.
- `confirmPasswordReset` **não** autentica. Não chamar `signInWithEmailAndPassword` após o êxito.
- Se o piloto já estava logado noutro tab e abre o link: a página é pública; no êxito faz `signOut` e manda ao login — a senha antiga deixa de valer.
- Conta **só Google** (sem provider `password`): o POST responde 204 e **não** manda e-mail. Mesma copy do sheet. O piloto continua entrando com o Google.
- Conta inexistente / apelido sem e-mail: 204, sem e-mail. Não enumerar.
- `next` do convite (SPEC 015) **não** entra neste fluxo. Depois da senha nova a pessoa está no login “limpo”. Se precisar do convite, entra e o `GuardaApp` / deep link já existentes resolvem.

### Texto do e-mail

Template **padrão** do Firebase Auth (redefinir senha), em pt-BR se o projeto já estiver assim. Sem SMTP, SendGrid nem HTML nosso nesta spec.

O que muda é o **destino do clique**: a action URL do console + `continueUrl` apontam para `/redefinir-senha` (ver §7.5).

---

## 4. Arquitetura Next.js

Seguir a skill: página orquestradora, componentes ~80 linhas, lógica em hooks, API em service. `"use client"` só no que tem estado, clique, `useSearchParams` ou SDK do Auth.

A page **pode** ser Server Component: lê `searchParams` e passa `oobCode` / `mode` para a ilha Client. Não precisa de `generateMetadata` rico (não é preview de WhatsApp). Title simples: “Criar nova senha · Rolê Moto”.

Validar o código e gravar a senha é **client**: `verifyPasswordResetCode` / `confirmPasswordReset` exigem o Auth SDK (igual login). Sem `getDoc`. Sem mandar a senha nova para a function.

### 4.1 Por que a rota não fica em `(app)`

`(app)/layout` envolve `GuardaApp` + dock. Sem sessão o piloto seria chutado para `/login` antes de ver o form. A URL fica em `(auth)`, ao lado de `/login` e `/primeiro-acesso`.

```tsx
// src/app/(auth)/redefinir-senha/page.tsx — Server Component
import type { Metadata } from "next";
import { TelaRedefinirSenha } from "./components/TelaRedefinirSenha";

export const metadata: Metadata = {
  title: "Criar nova senha · Rolê Moto",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ oobCode?: string; mode?: string }> };

const RedefinirSenhaPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const oobCode = typeof params.oobCode === "string" ? params.oobCode : "";
  const mode = typeof params.mode === "string" ? params.mode : "";

  return (
    <main>
      <TelaRedefinirSenha oobCode={oobCode} mode={mode} />
    </main>
  );
};

export default RedefinirSenhaPage;
```

Next.js 15: `searchParams` é `Promise`. Não usar `searchParams.oobCode` síncrono.

`noindex`: o link tem segredo de uso único na query; crawler não deve indexar.

### 4.2 Estrutura por feature

```
src/app/(auth)/redefinir-senha/
├── page.tsx                              # Server — metadata + orquestrador
├── components/
│   ├── TelaRedefinirSenha.tsx            # Client fino — estados (loading / inválido / form)
│   ├── CabecalhoRedefinirSenha.tsx       # Header + chip voltar (só Link)
│   ├── CardHeroRedefinir.tsx             # lock_reset, pill, título, chip do e-mail
│   ├── FormularioNovaSenha.tsx           # Campos + pill + CTA (sem fetch)
│   ├── CampoSenha.tsx                    # Input + ícone + toggle
│   ├── PillConferenciaSenha.tsx          # Só o indicador de match
│   └── EstadoLinkInvalido.tsx            # Código ausente / expirado
├── hooks/
│   └── useRedefinirSenha.ts              # Verifica oob, submit, redirect
├── services/
│   └── redefinir-senha.service.ts        # verify + confirm (SDK Auth)
├── constants.ts                          # Copy, mín. 8
└── redefinir-senha.module.css

src/lib/auth.ts                           # Alterar — remover enviarResetSenha
src/lib/mascarar-email.ts                 # NOVO — máscara do chip

src/app/(auth)/login/
├── hooks/useRecuperarSenha.ts            # Alterar — POST /auth/recuperar-senha
├── services/recuperar-senha.service.ts   # NOVO — chama a function
├── components/TelaLogin.tsx              # Alterar — banner senhaRedefinida
└── page.tsx                              # Alterar — ler ?senhaRedefinida=
```

O sheet (`SheetRecuperarSenha`) **não** muda de markup. Só o hook deixa de chamar `resolverEmailDaConta` + `enviarResetSenha`.

**Não** reusar o JSX do login para os campos desta tela — o mock é outro (hero, duas senhas, pill). `CampoSenha` nasce aqui; se no futuro o login quiser o mesmo toggle, aí extrai (2º uso real).

### 4.3 Responsabilidades

| Peça | Tipo | Faz |
|------|------|-----|
| `page.tsx` | Server | `searchParams`, metadata, `noindex` |
| `TelaRedefinirSenha` | Client | Escolhe loading / inválido / form |
| `CabecalhoRedefinirSenha` | UI | Links para `/login` |
| `FormularioNovaSenha` | Client | Renderiza; chama o hook |
| `useRedefinirSenha` | Hook | `verify` no mount, `confirm` no submit, `signOut` + `replace` |
| `redefinir-senha.service` | Service | Só SDK Auth (`verifyPasswordResetCode`, `confirmPasswordReset`) |
| `recuperar-senha.service` | Service | `POST /auth/recuperar-senha` via `api()` (sem Bearer no login) |
| `mascarar-email` | Lib | Chip do hero |

**Não misturar** no mesmo arquivo: JSX do hero + `confirmPasswordReset` + `POST` do sheet.

**Não** usar `updatePassword` (exige usuário logado). **Não** mandar a senha nova para `/auth/*`.

### 4.4 Item ativo no menu

A tela **não tem** dock. Nenhuma mudança em `useItemMenuAtivo`.

---

## 5. Contrato dos Dados (front)

Nenhum DTO de Firestore. A function de pedido não devolve e-mail.

```ts
// pedido (sheet)
POST /auth/recuperar-senha
Body: { identificador: string }  // e-mail ou apelido (com ou sem @)
Resposta: 204 (vazio)

// tela /redefinir-senha — só query do Firebase
?mode=resetPassword&oobCode={code}&apiKey={key}&lang=pt
```

`apiKey` e `lang` são ruído do Firebase. O front **ignora** — o SDK já tem a config do app. Não reenviar `apiKey` para a nossa API.

### Máscara do e-mail

```ts
// src/lib/mascarar-email.ts
export const mascararEmail = (email: string): string => {
  const [local, dominio] = email.split("@");
  if (!local || !dominio) return "***";
  const visivel = local.slice(0, 3);
  return `${visivel}***@${dominio}`;
};
// "rodrigo@email.com" → "rod***@email.com"
```

O mock mostra `rodrigo***@…` (quase o local inteiro). Aqui máscara **mais curta** de propósito: a pessoa já sabe o e-mail; o chip é contexto, não vazamento no ombro.

### Copy

| Zona | Texto |
|------|--------|
| Sheet (inalterado) | Título / corpo / sucesso / CTA da SPEC 014 |
| Hero título | Criar Nova Senha |
| Hero subtítulo | Defina sua nova credencial de acesso para acelerar de volta no Rolê Moto com segurança. |
| Pill | Pit Stop de Segurança |
| Chip e-mail | Redefinindo para: **{máscara}** |
| CTA idle | Redefinir Senha e Entrar |
| CTA enviando | Atualizando chave de acesso... |
| CTA êxito (breve) | Senha Redefinida! |
| Microcopy | Criptografia de ponta a ponta ativa na sua sessão. |
| Link inválido | Este link expirou ou já foi usado. Peça um novo em Esqueceu a senha? |
| Banner no login | Senha redefinida. Entre com a nova senha. |
| Erro genérico do confirm | Não foi possível redefinir a senha. Tente de novo ou peça outro link. |
| `auth/weak-password` | A senha deve ter no mínimo 8 caracteres. |

---

## 6. Implementação Front

### 6.1 Pedido do link (`useRecuperarSenha`)

Hoje: `resolverEmailDaConta` (pode 404) + `sendPasswordResetEmail` no client.

Nesta spec o sheet chama **só** a function. A function resolve apelido e dispara o e-mail. O client não precisa mais saber se o apelido existe.

```ts
// src/app/(auth)/login/services/recuperar-senha.service.ts
import { api } from "@/lib/api";

export const solicitarResetSenha = (identificador: string) =>
  api<void>("/auth/recuperar-senha", {
    method: "POST",
    body: JSON.stringify({ identificador }),
  });
```

`api()` já trata 204 e, no login, não há `currentUser` — não manda Bearer. Token residual (tab velha) é **ignorado** na function (rota sem `autenticar`).

Hook: identificador vazio → erro de formato (não chama API). Qualquer resposta da API / rede → `sucesso === true` + copy genérica (igual hoje). Só o 400 de identificador vazio no back não deve acontecer se o front validar antes; se vier, tratar como formato.

Remover `enviarResetSenha` de `src/lib/auth.ts`. O sheet **não** usa mais `POST /auth/resolver` — esse endpoint continua para o **login** com apelido (SPEC 014 B2).

### 6.2 Service da tela (Auth SDK)

```ts
// src/app/(auth)/redefinir-senha/services/redefinir-senha.service.ts
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase";

export const verificarCodigoReset = (oobCode: string): Promise<string> =>
  verifyPasswordResetCode(auth, oobCode); // e-mail

export const confirmarNovaSenha = (oobCode: string, senha: string): Promise<void> =>
  confirmPasswordReset(auth, oobCode, senha);
```

Sem `actionCodeSettings` aqui. Sem `httpsCallable`.

### 6.3 Hook (`useRedefinirSenha`)

1. Mount: se `mode` e `oobCode` ok → `verificarCodigoReset`; senão estado `invalido`.
2. `auth/expired-action-code`, `auth/invalid-action-code` → `invalido`.
3. Submit: `confirmarNovaSenha` → `logout()` (best-effort; se não houver user, `signOut` é barato) → `router.replace("/login?senhaRedefinida=1")`.
4. Usar `logout()` de `src/lib/auth.ts` (já tenta limpar FCM). Não deixar ID token velho no `AuthProvider`.

Não persistir a senha em `sessionStorage`. Não logar e-mail nem `oobCode`.

### 6.4 Banner no login

`page.tsx` do login já lê `next` e `modo`. Acrescentar `senhaRedefinida`.

`TelaLogin` mostra um alerta discreto acima do card (tokens `secondary` / `surface-container`, ícone `check_circle`) quando a flag vier. Fechar some só na sessão da página (estado local). Não guardar em cookie.

`useLoginRedirect` **não** consome essa flag. Se o user ainda estiver autenticado, o redirect atual (feed / primeiro acesso) prevalece — o `signOut` do êxito deveria ter evitado isso.

### 6.5 Tokens CSS

CSS Module `redefinir-senha.module.css`. Sem hex de marca no TSX. Glow laranja só no módulo (como o banner WhatsApp da SPEC 015).

| Token | Uso |
|-------|------|
| `--surface` / `--surface-container` / `-low` / `-high` / `-highest` | Página, card, inputs, pills |
| `--primary` / `--primary-container` / `--on-primary` / `--on-primary-container` | Marca MOTO, CTA, ícones, avatar |
| `--on-surface` / `--on-surface-variant` | Título / corpo / hint |
| `--secondary` / `--tertiary` / `--error` | Pill de match + ponto da badge |
| `--gutter-md` / `--touch-min` / `--touch-target` / `--card-padding-lg` | Espaço e toque |

Ícones: Material Symbols Outlined (`arrow_back`, `two_wheeler`, `person`, `lock_reset`, `verified_user`, `key`, `lock_clock`, `visibility` / `visibility_off`, `arrow_forward`, `shield`, `radio_button_unchecked`, `check_circle`, `cancel`, `progress_activity`).

### 6.6 Acessibilidade

- Título `h1` = **Criar Nova Senha**.
- Voltar do header: `aria-label="Voltar para o login"`.
- Avatar header: `aria-hidden`.
- Toggles: `aria-label` “Mostrar senha” / “Ocultar senha” (e o equivalente da confirmação).
- Pill de match: `aria-live="polite"`.
- Erro da API / Auth: `role="alert"`.
- Banner do login: `role="status"`.
- CTA: `disabled` + `aria-disabled` enquanto inválido ou enviando.
- Inputs: `autoComplete="new-password"`; labels associadas via `htmlFor`.
- Área de toque ≥ 48px; CTA 56px.
- Usável a partir de 360px.
- Foco inicial no campo nova senha quando o código for válido; no link “Voltar ao login” quando inválido.

### 6.7 PWA / e-mail no celular

O clique no e-mail abre o browser (HTTPS de produção). **Não** configurar App Links / Universal Links nesta spec. A página funciona em aba e em standalone se o origin for o do PWA.

O service worker **não** intercepta `/redefinir-senha` de um jeito especial. Se o SW servir shell offline sem query, o `oobCode` some — tratar como link inválido e apontar ao login. Não cachear esta rota como documento offline (a SPEC 012 já é conservadora com documentos).

---

## 7. Backend — `POST /auth/recuperar-senha`

Não usar `onCall`. Rota **sem** `firestore.collection` direto. Sem Bearer.

O e-mail de reset é do **Firebase Auth** (template nativo). A function só **dispara** o envio com a continue URL do app. Sem Nodemailer, SendGrid ou coleção de tokens nossos.

A senha nova **não** entra neste endpoint (nem em nenhum outro). Quem consome o `oobCode` é o client SDK.

### 7.1 Montagem no Express

Mesmo `authRouter` (já público):

```
POST /auth/recuperar-senha
```

```
app.use("/auth", authRouter);
```

Listar no health (`functions/src/index.ts`): `/auth/recuperar-senha` ao lado de `/auth/resolver`.

CORS já está em `onRequest({ cors: true })`.

### 7.2 Auth

Nenhuma. Sem `autenticar`. Token presente é ignorado.

Admin SDK ignora Security Rules. A autorização aqui é: **não revelar se a conta existe** + **não criar oobCode para quem não tem e-mail**.

### 7.3 Contrato

```
POST /auth/recuperar-senha
Headers: Content-Type: application/json
Body: { "identificador": "ghost_rider" | "@ghost_rider" | "piloto@email.com" }

204  → pedido aceito (e-mail pode ou não ter saído)
400  → identificador ausente / não-string / só espaços   { erro: "identificador inválido" }
500  → erro interno (responderErro)
```

Sem JSON no 204. Sem devolver e-mail, uid ou o link.

Identificador que “parece e-mail” (`includes("@")`) **não** passa por `buscarPorApelido`. Apelido: trim + tira `@` inicial (igual `/auth/resolver`).

### 7.4 Resolução e envio

Reusar a lógica já existente no resolver — extrair helper no mesmo módulo (ou `functions/src/lib/identificador.ts`) para não duplicar `pareceEmail` / `normalizarApelido`.

```
1. Normalizar identificador.
2. Se vazio → 400.
3. Resolver e-mail:
     - parece e-mail → usar o valor (lowercase trim)
     - senão → usuarioRepository.buscarPorApelido
         · 0 ou >1 docs → parar (204)
         · 1 doc → adminAuth.getUser(uid); sem email → 204
4. Se parece e-mail: adminAuth.getUserByEmail(email)
     · auth/user-not-found → 204
5. Se o user Auth não tem e-mail → 204.
6. Se providerData NÃO contém providerId === "password"
     → 204 (conta só Google / só federada; não manda reset)
7. Disparar o e-mail de PASSWORD_RESET (ver §7.5).
8. 204.
```

Passo 6 evita criar senha de e-mail para quem só entra com Google. O sheet continua genérico.

Dois apelidos iguais: mesmo critério do resolver (204, não escolher um).

A rota **não** acessa `firestore.collection`. `buscarPorApelido` já existe.

### 7.5 Como o Firebase envia o e-mail

O Admin SDK tem `generatePasswordResetLink` (devolve URL, **não** envia). Enviar o template nativo a partir do servidor é o REST Identity Toolkit:

```
POST {AUTH_ORIGIN}/v1/accounts:sendOobCode?key={WEB_API_KEY}
{
  "requestType": "PASSWORD_RESET",
  "email": "piloto@email.com",
  "continueUrl": "{APP_ORIGIN}/redefinir-senha",
  "canHandleCodeInApp": true
}
```

| Ambiente | `AUTH_ORIGIN` |
|----------|----------------|
| Produção | `https://identitytoolkit.googleapis.com` |
| Emulator (`FIREBASE_AUTH_EMULATOR_HOST`) | `http://{host}/identitytoolkit.googleapis.com` (mesmo padrão do client SDK) |

`WEB_API_KEY`: a mesma Web API key do app (`NEXT_PUBLIC_FIREBASE_API_KEY`). Nas functions: `process.env.FIREBASE_WEB_API_KEY` (ou o nome que o projeto já usar). **Não** commitar. Documentar em `functions/.env` local e no README.

`APP_ORIGIN`: **já existe** em `functions/src/lib/notificacoes.ts` (`process.env.APP_ORIGIN`). Extrair `origemApp()` para `functions/src/lib/origem.ts` e reusar nos dois. Sem origin, ainda assim dispara o `sendOobCode` **sem** `continueUrl` e depende só da action URL do console — em prod o env deve estar setado (já é pedido da SPEC 013).

`generatePasswordResetLink` **não** entra no fluxo feliz: geraria um `oobCode` e o `sendOobCode` geraria **outro**. Um dos links morreria. Só REST `sendOobCode`.

Falhas do Identity Toolkit (rede, key): 500. **Não** 204 mentiroso se o disparo quebrou depois de achar o user — senão o piloto “recebe” sucesso e nada chega. Conta inexistente continua 204 **antes** do send.

### 7.6 Console Firebase (obrigatório para o link abrir o app)

Sem isto o e-mail continua mandando para `https://{authDomain}/__/auth/action` (UI do Firebase).

1. Authentication → Templates → **Password reset** → Customize action URL:
   `{APP_ORIGIN}/redefinir-senha`  
   Ex.: `https://<dominio-de-prod>/redefinir-senha`
2. Authentication → Settings → **Authorized domains**: domínio de prod + `localhost` (já deve existir para o Google).
3. Template em **português** se ainda não estiver.

O link no e-mail fica na forma:

```
https://{host}/redefinir-senha?mode=resetPassword&oobCode=…&apiKey=…&lang=pt
```

Em **local com Auth de produção** (`npm run emulators` padrão do README): o e-mail é **real**. Usar conta de teste.  
Em **Auth emulator**: o e-mail aparece na UI `http://127.0.0.1:4000` (aba Auth). Abrir o link do outbox.

### 7.7 O que não muda

- `POST /auth/resolver` (login por apelido).
- `GET /roles`, perfil, participação.
- Documento `users` (sem campo de token de reset).
- Cadastro e-mail/senha (mínimo 6 do Firebase).
- Google Sign-In.

### 7.8 Índices

Nenhum. `buscarPorApelido` já é usado.

---

## 8. Wireframe

```
┌─────────────────────────────────┐
│  ←    🏍 ROLÊMOTO           👤  │  header sticky (avatar decorativo)
├─────────────────────────────────┤
│  ← Voltar ao login              │
│ ┌─────────────────────────────┐ │
│ │ 🔒  ● Pit Stop de Segurança │ │
│ │     CRIAR NOVA SENHA        │ │
│ │     Defina sua nova cred…   │ │
│ │  🛡 Redefinindo para: rod***│ │
│ └─────────────────────────────┘ │
│  NOVA SENHA          mín. 8     │
│  🔑  ••••••••              👁   │
│  CONFIRMAR NOVA SENHA           │
│  🔒  ••••••••              👁   │
│  ○ Aguardando confirmação…      │
│  [  REDEFINIR SENHA E ENTRAR → ]│
│     🛡 Criptografia de ponta…   │
└─────────────────────────────────┘

Link inválido (mesmo casco):
┌─────────────────────────────────┐
│  ←    🏍 ROLÊMOTO           👤  │
│  ← Voltar ao login              │
│  Este link expirou ou já foi    │
│  usado. Peça um novo em         │
│  Esqueceu a senha?              │
│  [  IR AO LOGIN  → ]            │
└─────────────────────────────────┘
```

Sem dock.

---

## 9. Fora do Escopo

- SMTP / e-mail HTML próprio / Extension Trigger Email.
- Medidor de força da senha.
- Auto-login após redefinir.
- Trocar senha **logado** no perfil (SPEC 002 deixou e-mail/senha fora).
- Redefinir conta só-Google (eles usam o botão Google).
- Verificar e-mail (`mode=verifyEmail`) e recuperar e-mail (`recoverEmail`) — se caírem nesta URL, estado inválido.
- Rate limit próprio além do que o Auth já aplica.
- Captcha / App Check.
- App Links / Universal Links / abrir o PWA a partir do e-mail.
- Alterar o mínimo de 6 do **cadastro**.
- Invalidar sessões ativas em todos os aparelhos além do `signOut` local (Firebase já revê refresh tokens em troca de senha; não implementar revoke extra).
- Página `/esqueci-senha` de pedido (o sheet basta).
- Traduzir o template do Firebase além do que o console já permite.

---

## 10. Critérios de Aceite

### Front

- [ ] `/redefinir-senha` abre **sem** login e **sem** dock, alinhado ao mock (header, chip voltar, hero, dois campos, pill, CTA, microcopy).
- [ ] `oobCode` válido mostra o e-mail **mascarado** (3 primeiras do local + `***@domínio`).
- [ ] Senhas diferentes ou &lt; 8: pill do mock; CTA disabled; **não** chama o Auth.
- [ ] Toggles de visibilidade independentes nos dois campos.
- [ ] Êxito: **não** autentica; `replace` em `/login?senhaRedefinida=1`; banner visível.
- [ ] Código ausente, `mode` errado, expirado ou já usado: estado inválido + caminho ao login.
- [ ] Voltar (header e chip) vai a `/login`, não `history.back()`.
- [ ] Avatar do header não navega.
- [ ] Sem barras de força.
- [ ] `page.tsx` Server; Client só no form / hook / estados.
- [ ] Componentes &lt; ~80 linhas; senha nova só no service do Auth; pedido do link só no service do sheet.
- [ ] Sem `sendPasswordResetEmail` no client.
- [ ] Sheet do login: mesma UI; sucesso genérico exista ou não a conta.
- [ ] Toque ≥ 48px; usável a partir de 360px; header acima da safe area.
- [ ] `noindex` na page.

### Back

- [ ] `POST /auth/recuperar-senha` **não** exige Bearer; 204 com identificador válido; 400 se vazio.
- [ ] Resposta **não** contém e-mail, uid nem o link.
- [ ] Apelido (`ghost_rider` / `@ghost_rider`) resolve via repositório + `getUser`, igual o resolver.
- [ ] E-mail inexistente, apelido ambíguo/inexistente e conta só-Google → 204 **sem** envio.
- [ ] Conta email/senha existente → `sendOobCode` PASSWORD_RESET com `continueUrl` `{APP_ORIGIN}/redefinir-senha` quando o env existir.
- [ ] Falha no disparo (Identity Toolkit) → 500, não 204.
- [ ] Persistência só via `usuarioRepository` (apelido). Router sem `autenticar`.
- [ ] `POST /auth/resolver` **não** muda o contrato.

### Integração / console

- [ ] Action URL do template Password reset aponta para `/redefinir-senha` no domínio de prod.
- [ ] Clique no e-mail abre o form do app (não a UI `__/auth/action` do Firebase).
- [ ] Depois de redefinir, login com a senha **antiga** falha; com a **nova** entra.
- [ ] Emulator Auth: link visível na UI :4000 e abre o form local.

---

## 11. Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| `src/app/(auth)/redefinir-senha/**` | **NOVO** — page, UI, hook, service, CSS |
| `src/lib/mascarar-email.ts` | **NOVO** |
| `src/lib/auth.ts` | **Alterar** — remover `enviarResetSenha` |
| `src/app/(auth)/login/hooks/useRecuperarSenha.ts` | **Alterar** — POST da function |
| `src/app/(auth)/login/services/recuperar-senha.service.ts` | **NOVO** |
| `src/app/(auth)/login/page.tsx` | **Alterar** — `senhaRedefinida` |
| `src/app/(auth)/login/components/TelaLogin.tsx` | **Alterar** — banner |
| `src/app/(auth)/login/login.module.css` | **Alterar** — banner (pouco) |
| `functions/src/routes/auth.ts` | **Alterar** — `POST /recuperar-senha` + helper de identificador |
| `functions/src/lib/origem.ts` | **NOVO** — extrair `origemApp` de notificações |
| `functions/src/lib/notificacoes.ts` | **Alterar** — importar `origemApp` |
| `functions/src/lib/enviar-oob-reset.ts` | **NOVO** — `sendOobCode` (prod / emulator) |
| `functions/src/index.ts` | **Alterar** — health |
| `README.md` / `functions` env | **Alterar** — `FIREBASE_WEB_API_KEY`, action URL do console |

Não alterar `MenuInferior`, `GuardaApp`, `POST /auth/resolver` (contrato) nem o cadastro.

`SheetRecuperarSenha.tsx` e o markup do sheet **não** precisam mudar.

---

## 12. Checklist da skill Next.js

- [ ] `page.tsx` sem `"use client"` (`searchParams` + metadata).
- [ ] `"use client"` só na tela/form/hook (Auth SDK, estado, clique).
- [ ] Pedido do e-mail no service do login; verify/confirm no service da feature.
- [ ] Lógica de estado em `useRedefinirSenha` / `useRecuperarSenha`, não no JSX do hero.
- [ ] Um componente = uma coisa (header, hero, campo, pill, estado inválido).
- [ ] Sem abstração genérica “FormAuth” / “InputDS” para um único uso.
- [ ] CSS Modules + tokens de `globals.css` (glow só no módulo).
- [ ] Sem `console.log` de debug (não espalhar os do `loginComGoogle`).

---

## 13. Relação com o código atual

| Hoje | Nesta spec |
|------|------------|
| Sheet → `resolver` + `sendPasswordResetEmail` sem continue URL | Sheet → `POST /auth/recuperar-senha`; Firebase envia com URL do app |
| Piloto redefine em `__/auth/action` (UI Google) | Piloto redefine em `/redefinir-senha` (mock) |
| Destino pós-reset indefinido | Sempre `/login?senhaRedefinida=1`, sem sessão |
| `enviarResetSenha` em `src/lib/auth.ts` | Removido |
| `POST /auth/resolver` público | Continua **só** para login por apelido |
| Conta Google no sheet também dispara reset | Só-Google: 204 silencioso, sem e-mail |
| Cadastro mín. 6 | Inalterado; reset desta tela mín. 8 |
| `APP_ORIGIN` só no push | Mesmo env no `continueUrl` do reset |

O sheet “Recuperar senha” da SPEC 014 **permanece** o único jeito de pedir o link. Esta spec troca o motor por trás do “Enviar link” e entrega a pista de pouso do e-mail.
