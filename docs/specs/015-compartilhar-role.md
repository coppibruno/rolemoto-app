# SPEC 015 — Compartilhar Rolê (página pública de convite)

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-11  
> **Referência visual:** `designs/compartilhar-role/` (`code.html`, `screen.png`)  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade  
> **Backend:** Cloud Function `api` (Express) — leitura pública em `GET /publico/roles/:id`  
> **Coleção Firestore:** `roles` + `usersrole` (vínculo já existente, SPEC 005) + `users` (resumo do organizador e destaques)  
> **Depende de:** SPEC 001 (login / primeiro acesso), SPEC 003 (schema `roles` + feed), SPEC 004 (rolê publicado), SPEC 005 (`usersrole` + `/roles/:id/participar`), SPEC 011 (perfil obrigatório antes do app)

---

## 1. Objetivo

Permitir que qualquer pessoa — **logada ou não** — abra um **link de convite** e veja o rolê. O organizador (ou um piloto) compartilha `/r/{id}`; o visitante entende a saída e toca **Participar do Rolê**.

Se **não** estiver autenticado, o app leva ao login (e ao primeiro acesso, se ainda não tiver perfil), **registra o pedido de vaga** e mostra a **confirmação já existente** da SPEC 005 (`/roles/:id/participar`). Se já estiver autenticado, o mesmo CTA vai direto para essa confirmação.

Esta spec é **full stack**:

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | Página pública no visual do mock, OG tags para preview no WhatsApp, Web Share, botão de compartilhar no feed, `?next=` no login / primeiro acesso |
| Back (Functions) | `GET /publico/roles/:id` **sem** Bearer, DTO sanitizado (sem lat/lng, sem `minhaParticipacao`, sem PII extra) |

**Não** se cria coleção nova. O pedido de vaga continua `POST /roles/:id/participacao` (autenticado, SPEC 005). O que nasce aqui é a **vitrine pública** e o **retorno ao fluxo de participação** depois do login.

---

## 2. Referência de Design

Replicar o visual de `designs/compartilhar-role/` (`code.html` + `screen.png`). Não inventar outro layout. Tokens em `globals.css`. **Não** copiar o HTML do Stitch (Tailwind CDN + Inter) — CSS Modules + tipografia já do app (Barlow Condensed + Plus Jakarta Sans).

A tela **não** vive no grupo `(app)`: sem `GuardaApp`, sem `MenuInferior`. É uma landing de convite, mobile-first, coluna única.

### O que entra nesta spec (do mock)

- Header sticky público: logo **ROLÊMOTO** + pill **Convite aberto** + **Entrar**.
- Hero: capa do rolê, badges sobre a foto, faixa de data/hora.
- Título do rolê + status **Vagas abertas para novos participantes**.
- Card do organizador: avatar, nome, `@apelido`, moto, pill **Organizador**.
- Banner verde de convite (WhatsApp como canal principal no Brasil) + CTA **Compartilhar Convite com Pilotos**.
- **Ficha técnica do comboio:** ponto de encontro, destino, nível & requisitos (ritmo).
- Bloco de formação: avatares sobrepostos dos confirmados + motos.
- Footer sticky: CTA gigante **Participar do Rolê**, links **Entrar** / **Cadastre-se**, microcopy de aprovação do organizador.

### O que o mock mostra e **não** entra

| Elemento do mock | Motivo |
|------------------|--------|
| Badge **Subida de Serra** | Não existe categoria de terreno no schema `roles` |
| Barra de ocupação `73%` / teto de vagas | SPECs 003–007 não têm `limiteVagas` |
| **Ver lista completa** de pilotos | Sem tela de roster; PII desnecessária no convite |
| Selo verificado no avatar do líder | Sem verificação de piloto |
| Cilindrada mínima 300cc, Cardo Canal 4 | Campos inexistentes |
| Destino com título + subtítulo separados | Só existe `destinoFinal.endereco` |
| Fonte Inter / Tailwind CDN | App já tem tokens e CSS Modules |
| Menu inferior / header Cockpit / sino | Página pública; dock é da SPEC 001 |
| Mapa da rota | Mock não tem mapa interativo; ficha é textual |

### Desvios conscientes do mock (necessários)

O HTML é uma landing estática de um rolê fictício. No app os dados vêm da API pública, o visitante pode estar logado, e **Participar** precisa autenticar antes do POST.

| Mock | Nesta spec | Por quê |
|------|------------|---------|
| Página isolada, sem URL | Rota pública `/r/{id}` | Link curto para WhatsApp / Web Share |
| Pedido de vaga no `#solicitar-entrada` | CTA leva a login ou a `/roles/:id/participar` | SPEC 005 já grava `usersrole` e mostra o sheet |
| `12/15` implícito na barra | `{N} confirmados` + avatares, **sem** barra de teto | Sem limite de vagas |
| Badge de categoria de serra | Só **km totais** + **ritmo** sobre a capa | Únicos dados reais |
| Requisitos com cilindrada / Cardo | Só o ritmo com a faixa de velocidade já usada no app | Não inventar regra |
| Check de “líder verificado” | Omitir | Sem dado |
| “Cadastre-se” como âncora `#signup` | `/login?next=...&modo=cadastro` | Cadastro já existe na tela de login |
| Header sempre **Entrar** | Se autenticado: avatar → `/` (ou `/perfil`) | Visitante logado não precisa “entrar” de novo |
| Progress bar sempre visível | Esconder se `confirmados === 0`; copy “Seja o primeiro piloto” | Lista real pode estar vazia |

Não adicionar chat, mapa, limite de vagas, nem lista completa de participantes.

### Comportamento visual (do mock)

- Conteúdo em coluna única, gutter 16px, **max-width 560px** (padrão do app; o mock usa `max-w-md` — seguir 560 para não destoar das outras telas).
- Fundo `surface` (`#121316`).
- Header fixo, `pt-safe`, blur, borda `outline-variant` / `--surface-container-highest`.
- Logo: **ROLÊ** em `on-surface` + **MOTO** em `primary-container`. Pill **Convite aberto**: `badge-label`, `primary-container` em fundo translúcido.
- Hero capa: altura ~256px (`h-64`), `object-fit: cover`, gradientes escuros para legibilidade.
- Badges sobre a foto: `11px` uppercase Barlow, fundo preto/70, borda. Ritmo usa cor semântica (`--ritmo-tranquila` / `--secondary-container` / `--error`).
- Faixa de data: `surface-container` / blur, ícone `calendar_month` em `primary-container`.
- Título: Barlow Condensed, uppercase, ~`headline-lg` / 24px+.
- Card organizador e ficha: `surface-container`, `rounded-xl`, borda sutil, `divide-y` na ficha.
- Banner WhatsApp: borda/accent esmeralda (`#34d399` / `#059669` — **exceção consciente**: canal da marca WhatsApp, não existe token; isolar no CSS Module, sem hex solto no TSX).
- CTA footer: `primary-container`, Barlow Condensed uppercase, `text-lg`, glow laranja, altura confortável (≥ 56px), `pb-safe`.
- Footer `fixed` na base; o `main` precisa de `padding-bottom` equivalente (~140px) para o conteúdo não ficar atrás do CTA.

### Ritmo nos badges

Mesmos valores de `RitmoRole`. Na capa, label curta; na ficha, label composta (igual SPEC 005):

| Valor | Capa | Ficha (Nível & Requisitos) |
|-------|------|----------------------------|
| `tranquila` | Ritmo Tranquilo | Tranquila (abaixo de 90 km/h) |
| `moderada` | Ritmo Moderado | Moderada (90-120 km/h) |
| `agressiva` | Ritmo Agressivo | Agressiva (track / ritmo forte) |

---

## 3. Fluxo do Usuário

```
Qualquer visitante (com ou sem sessão)
  │
  ├── Feed autenticado → [Compartilhar]  →  Web Share / WhatsApp / clipboard
  │                         URL = {origin}/r/{id}
  │
  └── Abre /r/{id}
        │
        ▼
      GET /publico/roles/:id   (sem Bearer; SSR + generateMetadata)
        │
        ├── 404 → EstadoErro “Rolê não encontrado”
        └── 200 → landing do mock
              │
              ├── [Entrar] / [Já tem conta?]
              │     → /login?next=/r/{id}
              ├── [Cadastre-se em 1 min]
              │     → /login?next=/r/{id}&modo=cadastro
              ├── [Compartilhar convite] → Web Share (fallback WhatsApp / copiar)
              └── [PARTICIPAR DO ROLÊ]
                    │
                    ├── dataHoraSaida já passou → CTA disabled, copy “Este rolê já aconteceu”
                    ├── autenticado + perfil + sou o criador
                    │     → /aprovacoes?role={id}
                    ├── autenticado + perfil
                    │     → /roles/{id}/participar     (SPEC 005: POST idempotente + sheet)
                    ├── autenticado, sem perfil
                    │     → /primeiro-acesso?next=/roles/{id}/participar
                    └── não autenticado
                          → /login?next=/roles/{id}/participar

Login (?next=…)
  │
  ├── já logado (useLoginRedirect) → destinoSeguro(next)
  ├── sucesso Google / email
  │     ├── tem perfil  → destinoSeguro(next)
  │     └── sem perfil  → /primeiro-acesso?next={mesmo next}
  └── cancelou → permanece no login

Primeiro acesso (?next=…)
  │
  └── POST /perfil 201 → destinoSeguro(next)
        └── se next é /roles/{id}/participar → sheet SPEC 005 (pedido gravado)
```

- Abrir `/r/{id}` **nunca** cria `usersrole`. Só o fluxo autenticado de `/roles/:id/participar` grava o pedido.
- Visitante logado que toca **Participar** não vê outro formulário na landing: cai no sheet da SPEC 005 (aguardando / confirmado / recusado / organizador).
- **Entrar** no header volta ao **convite** (`next=/r/{id}`), não ao feed: a pessoa ainda pode ler e então participar.
- **Participar** deslogado usa `next=/roles/{id}/participar` para, depois do login, **registrar e confirmar** sem um toque extra na landing.
- `next` inválido (open redirect) cai em `/`. Ver §6.4.
- Voltar do sheet da SPEC 005 continua indo ao feed (`/`), como hoje.

### Texto do compartilhamento

```
🏍️ {titulo}
📅 {data formatada — mesmo critério da faixa do hero}
📍 {localSaida.endereco}

Abre o convite:
{origin}/r/{id}
```

`navigator.share({ title, text, url })` quando existir. Senão, nesta ordem:

1. `https://wa.me/?text={encodeURIComponent(textoCompletoComUrl)}`
2. `clipboard.writeText(url)` + toast curto “Link copiado”

---

## 4. Arquitetura Next.js

Seguir a skill: página orquestradora, componentes ~80 linhas, lógica em hooks, API em service. `"use client"` só no que tem `useAuth`, clique, Web Share ou `useSearchParams`.

A landing **pode** (e deve) ser Server Component: o GET público **não** exige `auth.currentUser`. Isso destrava `generateMetadata` para o preview do WhatsApp (crawler sem JS).

A participação **continua** no client autenticado (Bearer), na rota que já existe.

### 4.1 Por que a rota não fica em `(app)`

`(app)/layout` envolve `GuardaApp` + dock. Visitante anônimo seria chutado para `/login` antes de ver o convite. A URL pública fica **fora** desse grupo.

```tsx
// src/app/(publico)/r/[id]/page.tsx — Server Component
import { notFound } from "next/navigation";
import { obterRolePublico } from "./services/role-publico.service";
import { TelaConviteRole } from "./components/TelaConviteRole";

type Props = { params: Promise<{ id: string }> };

const ConviteRolePage = async ({ params }: Props) => {
  const { id } = await params;
  const role = await obterRolePublico(id);
  if (!role) notFound();

  return (
    <main>
      <TelaConviteRole role={role} />
    </main>
  );
};

export default ConviteRolePage;
```

Next.js 15: `params` é `Promise`. Não usar `params.id` síncrono.

`TelaConviteRole` pode ser Server e receber ilhas Client (header, footer, botão compartilhar). Se o header/footer precisarem de `useAuth`, esses blocos é que levam `"use client"` — não a page.

### 4.2 Open Graph (WhatsApp / redes)

```tsx
// generateMetadata no mesmo page.tsx
export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { id } = await params;
  const role = await obterRolePublico(id);
  if (!role) return { title: "Rolê não encontrado · Rolê Moto" };

  const descricao = `${formatarFaixaHero(role.dataHoraSaida)} · ${role.localSaidaEndereco}`;

  return {
    title: `${role.titulo} · Rolê Moto`,
    description: descricao,
    openGraph: {
      title: role.titulo,
      description: descricao,
      url: `/r/${id}`,
      images: role.fotoCapaUrl ? [{ url: role.fotoCapaUrl }] : undefined,
      locale: "pt_BR",
      type: "website",
    },
  };
};
```

Usar `cache()` do React em `obterRolePublico` para page + metadata não baterem duas vezes na function.

Fetch do Server Component:

```ts
fetch(`${functionsApiUrl}/publico/roles/${id}`, {
  next: { revalidate: 60, tags: [`role-publico-${id}`] },
});
```

Contagem de confirmados pode atrasar até 60s — aceitável num convite. **Não** usar `api()` do client (ele tenta Bearer e hoje tem `console.log`).

### 4.3 Estrutura por feature

```
src/app/(publico)/r/[id]/
├── page.tsx                              # Server — metadata + orquestrador
├── not-found.tsx                         # Rolê inexistente
├── components/
│   ├── TelaConviteRole.tsx               # Composição (Server ou Client fino)
│   ├── CabecalhoPublico.tsx              # Client — Entrar vs avatar
│   ├── HeroCapaRole.tsx                  # Capa, badges, faixa de data
│   ├── TituloConvite.tsx                 # Título + pulso “vagas abertas”
│   ├── CardOrganizador.tsx
│   ├── BannerCompartilhar.tsx            # Client — Web Share
│   ├── FichaTecnicaComboio.tsx
│   ├── ItemFicha.tsx                     # Ícone + label + textos
│   ├── GradePilotos.tsx                  # Avatares + motos
│   ├── RodapeConversao.tsx               # Client — CTA Participar / Entrar
│   ├── BotaoParticiparConvite.tsx
│   └── EstadoRoleEncerrado.tsx           # CTA disabled
├── hooks/
│   ├── useCompartilharConvite.ts         # Share / WhatsApp / clipboard
│   └── useCtaConvite.ts                  # Decide next + destino do CTA
├── services/
│   └── role-publico.service.ts           # GET público (server-safe)
├── constants.ts                          # Copy do banner, labels de ritmo
└── convite-role.module.css

src/lib/destino-pos-auth.ts               # NOVO — sanitiza ?next=
src/lib/convite.ts                        # NOVO — urlConvite, textoConvite (client)

src/app/(app)/feed/components/
└── BotaoCompartilharRole.tsx             # NOVO — ícone no card do feed
```

Reusar `formatarHora` de `feed/formatar-horario.ts`. A faixa do hero é **mais rica** que `formatarHorarioSaida` (dia + mês por extenso) — extrair `formatarFaixaHero` no feature (ou no mesmo arquivo de horário, se ficar genérico o bastante). **Não** copiar o service de participação nem chamar Firestore no client.

### 4.4 Responsabilidades

| Peça | Tipo | Faz |
|------|------|-----|
| `page.tsx` | Server | `params`, metadata, fetch, `notFound` |
| `TelaConviteRole` | UI | Empilha seções |
| `CabecalhoPublico` | Client | `useAuth`: Entrar vs avatar |
| `RodapeConversao` / `useCtaConvite` | Client | Monta `/login?next=` ou vai a participar / aprovações |
| `useCompartilharConvite` | Hook | Web Share + fallbacks |
| `role-publico.service` | Service | `GET /publico/roles/:id` sem Bearer |
| `destino-pos-auth` | Lib | Allowlist de `next` (anti open-redirect) |
| `BotaoCompartilharRole` | Client | Mesmo hook, no feed |

**Não misturar** no mesmo arquivo: JSX da ficha + Web Share + decisão de login.

**Não** usar `getDoc` em `src/lib/firestore.ts` para montar o convite. Persistência e leitura de domínio só pela function.

### 4.5 Item ativo no menu

A landing **não tem** dock. Nenhuma mudança em `useItemMenuAtivo`. Quem participa cai em `/roles/:id/participar`, que já marca Rolês (SPEC 005).

---

## 5. Contrato dos Dados (front)

DTO **só** do convite — não reusar `RoleDetalhe` (tem `minhaParticipacao`, lat/lng, timestamps internos).

```ts
// src/types/role-publico.ts
import type { RitmoRole } from "./role";

export type CriadorPublico = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
  moto: string;
};

export type ParticipanteDestaque = {
  iniciais: string;
  fotoUrl: string;
  moto: string;
};

export type RolePublico = {
  id: string;
  titulo: string;
  descricao: string;
  fotoCapaUrl: string;
  ritmo: RitmoRole;
  dataHoraSaida: string; // ISO
  localSaidaEndereco: string;
  destinoFinalEndereco: string;
  distanciaKm: number;
  criador: CriadorPublico;
  participantes: {
    confirmados: number;
    destaques: ParticipanteDestaque[]; // até 4
  };
};
```

Regras de privacidade do DTO:

- **Sem** `lat` / `lng` (endereço textual basta para o convite).
- **Sem** `minhaParticipacao`, e-mail, `cidade`, `garupaFrequente`, `pilotagem` de terceiros.
- Destaques: **sem** `uid` e **sem** nome completo — iniciais + foto + moto, só quem tem `aceito: true`.
- `criador.uid` entra para o CTA do organizador no client. Não é segredo (já está no feed autenticado).

### Iniciais

A partir de `nome` (fallback `apelido`): primeira letra dos dois primeiros tokens, uppercase. `"Rodrigo Silveira"` → `RS`. `"Ana"` → `AN` (duas primeiras letras) se só houver um token.

### Copy da ficha / status

| Zona | Conteúdo |
|------|----------|
| Status sob o título (futuro) | Pulso verde + “Vagas abertas para novos participantes” |
| Status sob o título (passado) | Sem pulso + “Este rolê já aconteceu” |
| Ponto de encontro | `localSaidaEndereco` + “Saída pontual às {HH:mm}h” |
| Destino | `destinoFinalEndereco` (um único parágrafo) |
| Nível | Label composta do ritmo; **sem** cilindrada/Cardo |
| Banner | Copy do mock (WhatsApp como canal) |
| Microcopy do footer | “Necessário aprovação do organizador para garantir a vaga no rolê” |
| `descricao` | Se `trim()` não for vazio, um parágrafo abaixo do título; senão omitir |

---

## 6. Implementação Front

### 6.1 Service público (server-safe)

```ts
// src/app/(publico)/r/[id]/services/role-publico.service.ts
import { cache } from "react";
import { functionsApiUrl } from "@/lib/firebase";
import type { RolePublico } from "@/types/role-publico";

export const obterRolePublico = cache(
  async (id: string): Promise<RolePublico | null> => {
    const res = await fetch(`${functionsApiUrl}/publico/roles/${id}`, {
      next: { revalidate: 60, tags: [`role-publico-${id}`] },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Falha ao carregar o convite");
    return res.json() as Promise<RolePublico>;
  },
);
```

Sem `Authorization`. Sem `api()` do client.

### 6.2 CTA Participar (`useCtaConvite`)

| Estado | Ação do botão |
|--------|----------------|
| Rolê no passado | `disabled`; subtítulo “Este rolê já aconteceu” |
| Loading de auth | CTA visível, `disabled` até `loading === false` (evita flash de login) |
| Sem `firebaseUser` | `router.push(/login?next=/roles/{id}/participar)` |
| Com user, sem `usuario` (perfil) | `router.push(/primeiro-acesso?next=/roles/{id}/participar)` |
| `firebaseUser.uid === criador.uid` | `router.push(/aprovacoes?role={id})` — label **Gerenciar rolê** |
| Autenticado com perfil | `router.push(/roles/{id}/participar)` |

Não disparar POST na landing. O POST permanece no mount da SPEC 005.

Subtítulo do CTA (logado, não-criador, futuro): manter “Solicitar entrada no comboio”. Organizador: omitir o subtítulo de solicitação.

### 6.3 Header público

- Deslogado: botão **Entrar** → `/login?next=/r/{id}` (volta ao convite).
- Logado com foto: avatar 32px → `/`.
- Logado sem foto: ícone `account_circle` → `/`.
- Logo **não** precisa ir ao feed se o visitante for anônimo (pode ser `<span>`). Se logado, logo → `/`.

### 6.4 `?next=` — destino após auth

Hoje login, Google, cadastro, `useLoginRedirect`, `useProtecaoRotaApp` e primeiro acesso **sempre** mandam para `/` ou `/login` **sem** origem. Isso quebra o convite (e qualquer deep link).

Criar `src/lib/destino-pos-auth.ts`:

```ts
const NEXT_SEGURO = [
  /^\/$/,
  /^\/r\/[A-Za-z0-9_-]+$/,
  /^\/roles\/[A-Za-z0-9_-]+\/participar$/,
];

export const destinoSeguro = (bruto: string | null | undefined): string => {
  if (!bruto) return "/";
  let valor = bruto;
  try {
    valor = decodeURIComponent(bruto);
  } catch {
    return "/";
  }
  if (!valor.startsWith("/") || valor.startsWith("//") || valor.includes("://")) {
    return "/";
  }
  const path = valor.split("?")[0];
  return NEXT_SEGURO.some((re) => re.test(path)) ? valor : "/";
};

export const urlLoginComNext = (next: string, modoCadastro = false): string => {
  const params = new URLSearchParams({ next: destinoSeguro(next) });
  if (modoCadastro) params.set("modo", "cadastro");
  return `/login?${params.toString()}`;
};
```

Só caminhos relativos da allowlist. Nada de `https://evil.com`.

Ajustes pontuais (mesma spec — senão o fluxo de “participar deslogado” não fecha):

| Hoje | Nesta spec |
|------|------------|
| `useLoginRedirect` → sempre `/` | `destinoSeguro(searchParams.next)` se já autenticado **e** tem perfil; se autenticado sem perfil → `/primeiro-acesso?next=` |
| `useLoginForm` / `BotaoGoogle` → `replace("/")` | `destinoSeguro(next)` ou primeiro acesso com o mesmo `next` |
| `useProtecaoRotaApp` → `/login` nu | `/login?next={pathname}` quando a rota atual for allowlist (ex. `/roles/:id/participar`) |
| `useProtecaoRotaPrimeiroAcesso` → `/` se já tem perfil | `destinoSeguro(next)` |
| `useFormularioPrimeiroAcesso` sucesso → `/` | `destinoSeguro(next)` |

`signInWithRedirect` (iOS / PWA) volta para a **mesma** URL `/login?next=...`. Persistir `next` na query é suficiente; **não** precisa `sessionStorage` nesta spec.

`modo=cadastro` só abre o formulário já existente em modo cadastro (`useLoginForm`). Default continua login.

### 6.5 Compartilhar no feed

`RoleCard` ganha um controle discreto (ícone `share`, ≥ 48px de toque) que reusa `useCompartilharConvite`. Qualquer piloto autenticado pode divulgar o convite — não só o organizador.

Não mudar o mock do feed além desse ícone (desvio necessário: sem ele o primeiro link nunca sai do app).

Não alterar o toast de **Publicar Rolê** (SPEC 004 continua redirecionando ao feed). O card recém-criado já traz o botão.

### 6.6 Tokens CSS

CSS Module `convite-role.module.css`. Sem hex de marca Rolemoto no TSX.

| Token | Uso |
|-------|------|
| `--surface` / `--surface-container` / `-low` / `-high` / `-lowest` | Página, cards, faixa, footer |
| `--primary` / `--primary-container` | Logo MOTO, pill, CTA, ícones de ficha |
| `--on-surface` / `--on-surface-variant` | Título / corpo |
| `--secondary-container` / `--error` / `--ritmo-tranquila` | Badge de ritmo |
| `--gutter-md` / `--touch-min` / `--touch-target` | Espaçamento e toque |
| Esmeralda do banner (módulo) | Só o bloco WhatsApp |

Ícones: Material Symbols Outlined. Ícone do WhatsApp: SVG do mock (não há glyph no Material).

### 6.7 Acessibilidade

- Título `h1` = título do rolê.
- Capa: `alt` descritivo curto (`Capa do rolê {titulo}`).
- CTA: texto visível “Participar do Rolê”; `disabled` + `aria-disabled` se encerrado.
- Compartilhar: `aria-label="Compartilhar convite do rolê"`.
- Avatares: `title` / `aria-label` com a moto (sem nome). `+N` anunciado (“mais N pilotos”).
- Área de toque ≥ 48px; CTA 56px+.
- Usável a partir de 360px.

### 6.8 `not-found`

Página simples no mesmo visual (fundo `surface`, logo, “Rolê não encontrado”, link Entrar / ir ao início). Sem stack trace.

---

## 7. Backend — `GET /publico/roles/:id`

Não usar `onCall`. Rota **sem** `firestore.collection` direto. Factory em `repositories/index.ts`.

**Não** reutilizar `GET /roles/:id` autenticado: ele exige Bearer, devolve lat/lng e `minhaParticipacao`. Um endpoint público dedicado evita vazamento e não quebra o detalhe autenticado.

### 7.1 Montagem no Express

Router **sem** `autenticar`, registrado **antes** / à parte de `rolesRouter`:

```
app.use("/publico/roles", rolesPublicoRouter);
```

```
GET /publico/roles/:id
```

Listar no health (`functions/src/index.ts`).

CORS já está em `onRequest({ cors: true })` — o fetch do Server Component Next **não** depende de CORS; o crawler do WhatsApp também não.

### 7.2 Auth

Nenhuma. Sem Bearer, sem `req.usuario`. Token presente é **ignorado** (não misturar `minhaParticipacao` neste DTO).

Admin SDK ignora Security Rules: a function autoriza o que vaza. Por isso o DTO é o menor possível.

### 7.3 Repositório

Estender `UsuarioRoleRepository`:

```ts
listarConfirmadosDoRole(roleId: string, limite: number): Promise<UsuarioRole[]>;
```

Implementação Firestore:

```
usersrole
  .where("roleId", "==", roleId)
  .where("aceito", "==", true)
  .limit(limite)   // 4 nesta spec
```

Índice **já existe** (`roleId` + `aceito`). Sem `orderBy` extra nesta spec (ordem não é produto; 4 destaques bastam).

`contarConfirmados` já existe — reusar.

`usuarioRepository.buscarPorId` / `buscarPorIds` já existem para hidratar criador e destaques.

### 7.4 Montagem do DTO

1. `roleRepository.buscarPorId(id)` → 404 `{ erro: "Rolê não encontrado" }` se null.
2. `distanciaKm` = `distanciaRotaKm(localSaida, destinoFinal)` (já em `lib/geo.ts`).
3. Criador: `usuarioRepository.buscarPorId(criadorId)` com fallback `nome: ""`, `apelido: "piloto"`, `fotoUrl: ""`, `moto: ""`.
4. `contarConfirmados(roleId)` + `listarConfirmadosDoRole(roleId, 4)`.
5. `buscarPorIds` dos `usuarioId` dos destaques. Montar `iniciais` no **router** (não gravar no Firestore).
6. Resposta **200** `RolePublico`.

Não devolver `localSaida.lat/lng` nem `destinoFinal.lat/lng`. Não devolver `createdAt` / `updatedAt` / `criadorId` solto (o uid vai só em `criador.uid`).

Rolê **passado** continua **200** — a UI desabilita o CTA. 404 só se o documento não existe.

### 7.5 Tipos de domínio (Functions)

```ts
// functions/src/types/role-publico.ts
export type RolePublico = { /* mesmo shape do front */ };
```

Não inflar `types/role.ts` com o DTO público.

### 7.6 O que não muda

- `GET /roles` (feed) autenticado.
- `GET /roles/:id` autenticado (`RoleDetalhe`).
- `POST /roles/:id/participacao` e demais verbos da SPEC 005.
- Documento `roles` **não** ganha `slug`, `publico`, `limiteVagas` nem array `participantes`.
- Sem cache CDN extra além do `revalidate: 60` do Next.

### 7.7 Índices

Nenhum índice novo. `roleId` + `aceito` já cobre count + listagem limitada.

---

## 8. Wireframe

```
┌─────────────────────────────────┐
│ ⚡ ROLÊMOTO  CONVITE ABERTO  Entrar │  header sticky público
├─────────────────────────────────┤
│ ░░░░░ capa ░░░░░                │
│ [120 KM] [Ritmo Moderado]       │
│ 📅 Domingo, 24 de novembro      │
│    • Encontro às 06:30h         │
├─────────────────────────────────┤
│ SUBIDA DA SERRA DE CAMPOS…      │
│ ● Vagas abertas para novos…     │
│ ┌─────────────────────────────┐ │
│ │ 👤 Nome  (@apelido)  ORGANIZ.│ │
│ │    Yamaha YZF-R7            │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 💬 Convite via WhatsApp     │ │
│ │ [Compartilhar Convite     ] │ │
│ └─────────────────────────────┘ │
│ FICHA TÉCNICA DO COMBOIO        │
│  📍 Ponto de encontro           │
│  🏁 Destino                     │
│  ⚠ Ritmo / requisitos           │
│ Pilotos na formação  MB GK +N   │
│ Motos: S1000RR, ZX-6R, …        │
├─────────────────────────────────┤
│ [   PARTICIPAR DO ROLÊ        ] │  footer sticky
│ Já tem conta? Entrar · Cadastre │
│ 🛡 Aprovação do organizador     │
└─────────────────────────────────┘
```

Sem dock.

---

## 9. Fora do Escopo

- Tela nova de confirmação (reusa SPEC 005).
- Aceite/recusa pelo líder (SPEC 007).
- Push ao organizador no pedido (SPEC 013 já cobre o POST autenticado).
- Slug amigável (`/r/subida-da-serra`); id do documento basta.
- QR code, Mini App do WhatsApp, App Links / Universal Links nativos.
- Limite de vagas, waitlist, categoria de moto, mapa.
- Lista completa / perfis públicos dos confirmados.
- Preview autenticado diferente (mesma landing para todos).
- Desindexar no Google (`noindex`) — convite é público; não bloquear o crawler do WhatsApp.
- Página de “meus convites”.
- Alterar o toast de publicar rolê (SPEC 004).

---

## 10. Critérios de Aceite

### Front

- [ ] `https://{host}/r/{id}` abre **sem** login e **sem** dock, alinhado ao mock (hero, organizador, banner, ficha, footer).
- [ ] WhatsApp (e outras redes) mostram preview com título, descrição (data + ponto) e imagem de capa (`generateMetadata`).
- [ ] Visitante deslogado toca **Participar** → login → (primeiro acesso se preciso) → `/roles/{id}/participar` com pedido criado e sheet da SPEC 005.
- [ ] **Entrar** no header volta a `/r/{id}` depois do login (não joga no feed).
- [ ] **Cadastre-se em 1 min** abre `/login?next=/r/{id}&modo=cadastro` (volta ao convite depois da conta). **Participar** deslogado usa `next=/roles/{id}/participar` (login → pedido + sheet, sem segundo toque na landing).
- [ ] Visitante **logado** toca Participar e cai no sheet, sem passar pelo login.
- [ ] Organizador logado vê **Gerenciar rolê** → `/aprovacoes?role={id}`.
- [ ] Rolê passado: página visível, CTA disabled, copy de encerrado; **não** chama POST.
- [ ] Rolê inexistente: `not-found` amigável.
- [ ] Compartilhar na landing e no card do feed usa Web Share, com fallback WhatsApp e copiar link `{origin}/r/{id}`.
- [ ] Sem barra `/15`; avatares só de `aceito: true`; `+N` = `confirmados - destaques.length` quando > 0.
- [ ] Sem badge de serra, sem Cardo, sem cilindrada, sem selo verificado.
- [ ] `page.tsx` Server; Client só onde há interatividade / auth.
- [ ] Componentes < ~80 linhas; fetch público no service; sem Firestore no client.
- [ ] Toque ≥ 48px; usável a partir de 360px; footer acima da safe area.
- [ ] `?next=` fora da allowlist é ignorado (vai a `/`).

### Back

- [ ] `GET /publico/roles/:id` **não** exige Bearer; 200 com `RolePublico`; 404 se não existe.
- [ ] Resposta **não** contém lat/lng, `minhaParticipacao`, e-mail, uid dos destaques.
- [ ] `distanciaKm` é Haversine partida → destino (inteiro).
- [ ] Criador traz `nome`, `apelido`, `fotoUrl`, `moto` (fallbacks seguros).
- [ ] Destaques: no máximo 4 confirmados (`aceito: true`); `confirmados` bate com `contarConfirmados`.
- [ ] Persistência só via repositórios; router novo sem `autenticar`.
- [ ] `GET /roles/:id` autenticado **não** muda o contrato.

---

## 11. Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| `src/app/(publico)/r/[id]/**` | **NOVO** — page, metadata, UI, hooks, service, CSS |
| `src/types/role-publico.ts` | **NOVO** |
| `src/lib/destino-pos-auth.ts` | **NOVO** — sanitiza `next` |
| `src/lib/convite.ts` | **NOVO** — URL + texto de share (uso no client) |
| `src/app/(app)/feed/components/RoleCard.tsx` | **Alterar** — ícone compartilhar |
| `src/app/(app)/feed/components/BotaoCompartilharRole.tsx` | **NOVO** |
| `src/app/(auth)/login/hooks/useLoginRedirect.ts` | **Alterar** — honrar `next` |
| `src/app/(auth)/login/hooks/useLoginForm.ts` | **Alterar** — honrar `next` + `modo` |
| `src/app/(auth)/login/components/BotaoGoogle.tsx` | **Alterar** — honrar `next` |
| `src/app/(auth)/login/page.tsx` | **Alterar** — passar `searchParams` / modo |
| `src/app/(app)/hooks/useProtecaoRotaApp.ts` | **Alterar** — login com `next` da rota atual se allowlist |
| `src/app/(auth)/primeiro-acesso/hooks/useProtecaoRotaPrimeiroAcesso.ts` | **Alterar** — honrar `next` |
| `src/app/(auth)/primeiro-acesso/hooks/useFormularioPrimeiroAcesso.ts` | **Alterar** — redirect de sucesso com `next` |
| `functions/src/routes/roles-publico.ts` | **NOVO** |
| `functions/src/types/role-publico.ts` | **NOVO** |
| `functions/src/index.ts` | **Alterar** — `app.use("/publico/roles", …)` + health |
| `functions/src/repositories/interfaces/usuario-role.repository.ts` | **Alterar** — `listarConfirmadosDoRole` |
| `functions/src/repositories/firestore/firestore-usuario-role.repository.ts` | **Alterar** — query limitada |

Não alterar visualmente `MenuInferior`. Não voltar `participantes[]` para `roles`. Não afrouxar `POST /participacao` (continua autenticado).

---

## 12. Checklist da skill Next.js

- [ ] `page.tsx` sem `"use client"` (SSR + `generateMetadata` + `params`).
- [ ] `"use client"` só em header/footer/share/CTA (auth, clique, Web Share).
- [ ] Fetch público no service com `revalidate` explícito; `cache()` para deduplicar metadata.
- [ ] Lógica de share e de destino do CTA em hooks, não no JSX da ficha.
- [ ] Um componente = uma coisa (hero, card líder, ficha, grade, rodapé).
- [ ] Sem abstração genérica “pra futuro” (QR, slug, mapa, roster completo).
- [ ] CSS Modules + tokens de `globals.css` (esmeralda só no módulo do banner).
- [ ] Sem `console.log` de debug (há vários no login atual — **não** espalhar; limpar só se o arquivo já for tocado por `next`).

---

## 13. Relação com o código atual

| Hoje | Nesta spec |
|------|------------|
| Toda rota útil está em `(app)` + `GuardaApp` | `(publico)/r/[id]` abre anônimo |
| `GET /roles/:id` exige Bearer e devolve detalhe interno | `GET /publico/roles/:id` sanitizado, sem token |
| Login / Google / primeiro acesso → sempre `/` | `?next=` na allowlist (`/r/:id`, `/roles/:id/participar`) |
| Pedido de vaga só a partir do feed logado | Convite WhatsApp → login → mesmo POST + sheet SPEC 005 |
| Feed sem ação de divulgar | Ícone compartilhar no `RoleCard` |
| Sem OG por rolê | `generateMetadata` com capa e data |
| `listarConfirmados` só como **count** | Count + até 4 docs para avatares |

Coleção `usersrole` e o sheet `/roles/:id/participar` **não** são reescritos. Esta spec só os alcança depois da autenticação.

O organizador continua aprovando pela SPEC 007; o visitante do convite vê o aviso de que a vaga depende dessa aprovação.
