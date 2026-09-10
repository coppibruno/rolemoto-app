# SPEC 011 — Primeiro Acesso (Refactor)

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-09  
> **Referência visual:** `designs/primeiro-acesso-novo/` (`DESIGN.md`, `code.html`, `screen.png`)  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade  
> **Backend:** Cloud Function `api` (Express) — fecha o contrato de `POST /perfil`  
> **Coleção Firestore:** `users` (mesmo documento do primeiro acesso original)  
> **Depende de:** SPEC Primeiro Acesso (fluxo de guarda + campos base), SPEC 001 (telas `(auth)` sem dock), SPEC 002 (`PUT /perfil` + foto no Storage)  
> **Substitui visualmente:** `docs/specs/primeiro-acesso.md` e a UI atual de `src/app/(auth)/primeiro-acesso/`

---

## 1. Objetivo

A tela `/primeiro-acesso` **já existe** e já cria o documento `users` depois do primeiro login. Esta spec **não inventa o fluxo**: refatora o **design** para o mock novo e migra a **persistência** do `setDoc` no client para a Cloud Function.

Hoje a página é um Client Component único (~336 linhas) com estado, validação, upload, guarda de rota e Firestore no mesmo arquivo. A skill Next.js do repositório usa exatamente essa tela como anti-pattern. O destino é a mesma rota, quebrada por feature, alinhada ao cockpit do design system.

Esta spec é **full stack**:

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | UI do mock novo, validação, upload da foto no Storage, `POST /perfil`, guarda de rota |
| Back (Functions) | Token válido, uid só do token, validação do body (inclui `garupaFrequente`), 409 se o perfil já existe |

O uid **nunca** vem do body. Quem já tem `users/{uid}` **não** recria o documento.

---

## 2. Referência de Design

Replicar o visual de `designs/primeiro-acesso-novo/` (`code.html` + `screen.png`). Não inventar outro layout. Tokens em `DESIGN.md` / `globals.css`. **Não** copiar o HTML do Stitch (Tailwind CDN) — CSS Modules + tokens.

A tela vive no grupo `(auth)`: **sem** header Cockpit do feed, **sem** dock (SPEC 001). Coluna única, gutter 16px, **max-width 560px**, `pt-safe` / `pb-safe`.

### O que entra nesta spec (do mock)

- Faixa de progresso: kicker **Passo 1 de 1 • Onboarding** + percentual + trilha.
- Título **Monte Seu Perfil de Piloto** (ícone `two_wheeler`) + subtítulo.
- Card **Mostre sua cara no comboio**: avatar 96px com glow, botão câmera, CTA **Adicionar Foto de Perfil**.
- Card **Dados do Piloto**: Nome Completo; Apelido nas Pistas (prefixo `@`, hint “Identificador Único”).
- Card **Garagem Principal**: badge **Moto Titular**; campo **Modelo • Cilindrada • Ano**; toggle **Possui Garupa Frequente?** (Não / Sim).
- **Ritmo de Pilotagem Habitual**: 3 cards verticais com rádio, faixas de velocidade e badge **Recomendado** em Moderada.
- CTA **Concluir e Acessar os Rolês** (`double_arrow`).
- Microcopy de rodapé (edição posterior no perfil).

### O que o mock mostra e **não** entra

| Elemento do mock | Motivo |
|------------------|--------|
| Percentual estático **90% CONCLUÍDO** | Telemetria falsa; a barra reflete campos preenchidos (ver desvio) |
| Foto / nome / apelido / moto já preenchidos no HTML | Dados de exemplo do Stitch; o app pré-preenche só o que vier do Auth |
| Moderada já selecionada no HTML estático | O piloto precisa escolher; senão o POST sai com ritmo sem toque |
| Garupa **Sim** já ativo no HTML | Não assumir garupa; default **Não** |
| Copy “ajuda o algoritmo a sugerir comboios” | Não há motor de matching nesta versão |
| Copy “ajusta o cálculo de paradas e autonomia” | Não há cálculo de autonomia; o boolean só é persistido |
| Copy “adicionar novas motos a qualquer momento” | SPEC 002 não edita moto/garagem; uma moto (`moto`) continua texto único |
| Comentário HTML de preview de mapa / telemetria de rota | Bloco vazio no mock |
| Unicidade real do apelido (“Identificador Único”) | Continua fora de escopo (mesmo recorte da spec original) |
| Menu inferior / header Cockpit / sino | Tela `(auth)` |

### Desvios conscientes do mock (necessários)

O HTML é um onboarding estático de um piloto fictício. No app a tela é **guarda + formulário real + POST**.

| Mock | Nesta spec | Por quê |
|------|------------|---------|
| 90% fixo | Percentual = campos obrigatórios preenchidos / 4 | Barra honesta |
| Moderada pré-selecionada | Nenhuma até o toque; CTA **disabled** enquanto inválido | Evita gravar ritmo sem escolha |
| Garupa = Sim | Default **Não** (`false`) | Não assumir passageiro |
| “algoritmo” / “autonomia do grupo” | Copy honesta (ver §2.1) | Não mentir na UI |
| “adicionar novas motos no perfil” | *Você poderá editar nome, apelido, foto e ritmo no seu perfil.* | Perfil (SPEC 002) não tem garagem |
| Submit sempre clicável | CTA disabled até o form válido | Igual ao primeiro acesso atual |
| `setDoc` implícito | `POST /perfil` | Dívida da SPEC 002; Admin SDK + uid do token |
| Página monolítica | Feature folder (skill Next.js) | A skill cita esta tela como o exemplo a quebrar |

Não adicionar mapa, segunda moto, crop de imagem, nem unicidade de apelido.

### 2.1 Copy que substitui o mock

| Zona do mock | Nesta spec |
|--------------|------------|
| Subtítulo do ritmo (*algoritmo*) | *Isso ajuda líderes e comboios a conhecerem seu estilo antes de acelerar juntos.* |
| Hint da garupa (*cálculo de paradas*) | *Os líderes consideram isso na logística do comboio.* |
| Rodapé (*novas motos*) | *Você poderá editar nome, apelido, foto e ritmo a qualquer momento no seu perfil.* |
| Hint “Identificador Único” | **Mantém o visual.** Não valida unicidade; é só rótulo. |

### Comportamento visual (do mock)

- Conteúdo em coluna, `px-margin-mobile`, `max-w-[560px]`, `gap` entre cards ~24px (`gap-6` no form).
- Kicker: `badge-label` uppercase `primary`; pulso 8px `primary-container`. Percentual: `telemetry-num` / `secondary-container`.
- Trilha: altura 6px (`h-1.5`), `surface-container-highest`; fill `primary-container` + glow `0 0 12px rgba(255,107,0,0.6)`.
- Título: `headline-lg` uppercase Barlow Condensed; ícone `two_wheeler` 26px `primary-container`.
- Subtítulo: `body-md` `on-surface-variant`.
- Cards: `surface-container-low`, `rounded-xl`, padding `card-padding-md`.
- Avatar: 96px (`w-24 h-24`), círculo, glow `0 0 20px rgba(255,107,0,0.25)`. Câmera: 32px, `primary-container`, canto inferior direito.
- CTA secundário da foto: pill, `surface-container-high`, `label-md` `primary`, ícone `add_a_photo`.
- Inputs: `surface-container`, ícone à esquerda (`person` / `motorcycle`), foco `surface-container-high`. Apelido: `@` em `primary-container` (Barlow Condensed) à esquerda; ícone `sports_motorsports` à direita.
- Badge **Moto Titular**: `badge-label`, `surface-container-highest`, texto `secondary`.
- Toggle garupa: segmento, ativo = `primary-container` + `on-primary-container`; inativo = `on-surface-variant`.
- Card de ritmo inativo: `surface-container-low`. Ativo: `surface-container` + glow `0 0 16px rgba(255,107,0,0.18)` + rádio preenchido.
- Badge **Recomendado**: canto superior direito, `primary-container`, `badge-label`.
- CTA: altura ~54px, `primary-container`, glow `0 4px 18px rgba(255,107,0,0.38)`, `headline-md` uppercase.
- Sucesso do CTA (após 201): fundo `#00E676`, texto `surface`, ícone `check_circle` — usar token `--ritmo-tranquila` no CSS Module, sem hex no TSX.

### Ritmo (cards do mock — valores de domínio)

Ordem visual: **Tranquila → Moderada → Agressiva**. Valores iguais ao tipo `Pilotagem` já usado no app.

| Valor | Ícone | Label | Telemetria | Cor da telemetria / ícone |
|-------|-------|-------|------------|---------------------------|
| `tranquila` | `photo_camera_front` | Tranquila | Até 90 km/h | `--ritmo-tranquila` (`#00E676`) |
| `moderada` | `alt_route` | Moderada | 120 a 160 km/h | `--primary` / `--primary-container` |
| `agressiva` | `sports_score` | Agressiva / Esportiva | Ritmo de Pista • Serra | ritmo agressivo `#FF334B` |

Descrições (body-sm):

| Valor | Texto |
|-------|--------|
| `tranquila` | Passeio contemplativo, foco total em segurança, fotos, apreciação de paisagem e paradas para café. |
| `moderada` | Ritmo constante, fluidez técnica em curvas, ultrapassagens seguras e conscientes em rodovias. |
| `agressiva` | Acelerações fortes, inclinação rápida em curvas e pilotagem técnica dinâmica para condutores experientes. |

Se `--ritmo-agressiva` / `--ritmo-moderada` ainda não existirem em `globals.css`, **criar** os tokens (`#FF334B` e `#FFB300`) — já estão no design system. Não soltar hex no TSX.

**Não** reutilizar o grid 3 colunas de `SeletorPilotagem` do perfil (SPEC 002): o mock desta tela é lista vertical com rádio e parágrafo.

---

## 3. Fluxo do Usuário

O fluxo de guarda **não muda** (spec original + SPEC 001):

```
Login (Google ou email)
  │
  ▼
AuthProvider: firebaseUser + buscarUsuario
  │
  ├── Sem token → /login
  ├── Token + perfil existe → grupo (app) /
  └── Token + perfil NÃO existe → /primeiro-acesso
        │
        ▼
  Tela "Monte Seu Perfil de Piloto"
  (nome/foto pré-preenchidos se o provedor trouxer)
        │
        ├── Inválido → erros inline (não chama API)
        └── Válido
              │
              ├── Se arquivo novo → upload Storage (avatars/{uid}.jpg)
              └── POST /perfil  { nome, apelido, moto, pilotagem, fotoUrl, garupaFrequente }
                    │
                    ├── 201 → CTA “Ligando o Motor…” → “BEM-VINDO AO ASFALTO!”
                    │         recarregarPerfil() + replace("/")
                    ├── 409 → perfil já existia; recarregarPerfil() + replace("/")
                    ├── 400 → mensagem da API no form; permanece
                    └── 401 → /login (guarda)
```

- Sem dock. Sem toast separado: o **próprio CTA** muda de estado (como o `<script>` do mock).
- `cidade` continua `""` na criação (preenchido depois / fora desta spec).
- Foto do Google conta como preview; se o piloto não trocar, `fotoUrl` = `firebaseUser.photoURL`. Se não houver nenhuma, `fotoUrl` = `""` (foto **não** bloqueia o primeiro acesso).

### Como o piloto chega aqui

| Origem | Comportamento |
|--------|----------------|
| Primeiro login | Guarda `(app)` / home manda para `/primeiro-acesso` |
| URL direta sem token | `replace("/login")` |
| URL direta com perfil já criado | `replace("/")` |
| `POST` 409 (corrida de abas) | Trata como sucesso e entra no app |

---

## 4. Arquitetura Next.js

Seguir a skill: página orquestradora, componentes ~80 linhas, lógica em hooks, API em service. `"use client"` só no que tem estado, submit, file picker ou `useAuth`.

O perfil **não** pode ser Server Action com fetch no servidor: a rule do projeto exige Bearer no client (`auth.currentUser`).

### 4.1 Por que a page é Server Component

`(auth)/primeiro-acesso` só monta a tela. Interatividade e guarda ficam no Client filho — o mesmo recorte de `/perfil` e `/roles/:id/feedback`.

```tsx
// src/app/(auth)/primeiro-acesso/page.tsx — Server Component
import { TelaPrimeiroAcesso } from "./components/TelaPrimeiroAcesso";

const PrimeiroAcessoPage = () => {
  return (
    <main>
      <TelaPrimeiroAcesso />
    </main>
  );
};

export default PrimeiroAcessoPage;
```

Hoje `page.tsx` é `"use client"` com tudo dentro. Esta spec **substitui** esse arquivo.

### 4.2 Estrutura por feature

```
src/app/(auth)/primeiro-acesso/
├── page.tsx                              # Server — orquestrador
├── components/
│   ├── TelaPrimeiroAcesso.tsx            # Client — guarda + composição
│   ├── CabecalhoOnboarding.tsx           # Kicker, barra, título
│   ├── BlocoFotoPerfil.tsx               # Avatar, câmera, CTA arquivo
│   ├── FormularioPrimeiroAcesso.tsx      # <form> + seções + CTA
│   ├── CampoTexto.tsx                    # Label, ícone, input, erro
│   ├── SecaoDadosPiloto.tsx              # Nome + apelido
│   ├── SecaoGaragem.tsx                  # Moto + toggle garupa
│   ├── ToggleGarupa.tsx                  # Não / Sim
│   ├── SeletorRitmoHabitual.tsx          # Lista vertical
│   ├── CardRitmo.tsx                     # Um card de pace
│   └── BotaoConcluir.tsx                 # CTA + estados loading/sucesso
├── hooks/
│   ├── useProtecaoRotaPrimeiroAcesso.ts  # login / já tem perfil
│   ├── useFormularioPrimeiroAcesso.ts    # estado, validação, submit
│   └── useFotoPrimeiroAcesso.ts          # File, preview, upload
├── services/
│   └── perfil.service.ts                 # POST /perfil (api)
├── constants.ts                          # Copy, opções de ritmo, limites de foto
└── primeiro-acesso.module.css            # Reescrever (tokens do mock)
```

**Não** importar componentes de `src/app/(app)/perfil/` (acopla `(auth)` em `(app)`). Hooks de foto/form são da feature, mesmo padrão da SPEC 002.

**Não** misturar no mesmo arquivo: JSX do form + regras de validação + `fetch` + Storage.

**Não** usar `criarPerfilPrimeiroAcesso` / `setDoc` nesta tela. Persistência só pela function.

### 4.3 Responsabilidades

| Peça | Tipo | Faz |
|------|------|-----|
| `page.tsx` | Server | Só monta `TelaPrimeiroAcesso` |
| `TelaPrimeiroAcesso` | Client | `useAuth` + guarda; monta header + form |
| `useProtecaoRotaPrimeiroAcesso` | Hook | `!firebaseUser` → `/login`; `usuario` → `/` |
| `FormularioPrimeiroAcesso` | Client | Markup; chama o hook |
| `useFormularioPrimeiroAcesso` | Hook | Campos, `erros`, `salvando`, `salvar`, progresso |
| `useFotoPrimeiroAcesso` | Hook | JPG/PNG 2MB, ObjectURL, `uploadFotoPerfil` |
| `perfil.service` | Service | `criar(payload)` → `POST /perfil` |
| `CabecalhoOnboarding` | UI | Passo + barra + título |
| `SeletorRitmoHabitual` / `CardRitmo` | UI | Radiogroup vertical |
| `BotaoConcluir` | UI | Idle / salvando / sucesso |

### 4.4 Item ativo no menu

Não se aplica. Dock **ausente**.

---

## 5. Contrato dos Dados (front)

```ts
export type PrimeiroAcessoForm = {
  nome: string;
  apelido: string;
  moto: string;
  garupaFrequente: boolean;
  photoFile: File | null;
  fotoUrlAtual: string; // Google, blob de preview ou ""
  pilotagem: Pilotagem | null;
};

export type ErrosPrimeiroAcesso = {
  nome?: string;
  apelido?: string;
  moto?: string;
  foto?: string;
  pilotagem?: string;
};

/** Body do POST /perfil após upload (se houver). */
export type UsuarioPrimeiroAcesso = {
  nome: string;
  apelido: string;
  moto: string;
  pilotagem: Pilotagem;
  fotoUrl: string;
  garupaFrequente: boolean;
};
```

Estender `Usuario` (front `src/types/user.ts` e back `functions/src/types/usuario.ts`):

```ts
export interface Usuario {
  uid: string;
  nome: string;
  apelido: string;
  moto: string;
  pilotagem: Pilotagem;
  fotoUrl: string;
  cidade: string;
  garupaFrequente: boolean; // NOVO — ausente no doc antigo ⇒ false
  createdAt: string;        // back; o client Auth ainda pode receber Timestamp
}
```

`UsuarioCreate` no back passa a incluir `garupaFrequente`. `UsuarioEdicao` (PUT, SPEC 002) **não** ganha moto/garupa nesta spec.

### 5.1 Regras do form

Validar no submit (`tentouSubmit`). Erro **no campo**. Bordas `--error`.

| Campo | Obrigatório | Regra | Mensagem |
|-------|-------------|-------|----------|
| Nome | Sim | `trim().length >= 2` | “Informe o nome” / “Mínimo 2 caracteres” |
| Apelido | Sim | `trim()`, sem `@` inicial; `length >= 2` | “Informe o apelido” / “Mínimo 2 caracteres” |
| Moto | Sim | `trim().length >= 2` | “Informe a moto” / “Mínimo 2 caracteres” |
| Garupa | Sim (com default) | `boolean` | Sem erro de vazio — default `false` |
| Pilotagem | Sim | um de `agressiva` \| `moderada` \| `tranquila` | “Selecione o ritmo de pilotagem” |
| Foto | Não | Se houver arquivo: JPG/PNG, máx. 2MB | “Formato inválido. Use JPG ou PNG.” / “A foto deve ter no máximo 2MB.” |

Apelido: o `@` é **prefixo visual**. No valor gravado, `trim()` e `replace(/^@+/, "")`.

Não validar unicidade de apelido.

### 5.2 Progresso da barra

Campos que contam (4): `nome`, `apelido`, `moto`, `pilotagem`.

```
percentual = round( (preenchidos / 4) * 100 )
```

Foto e garupa **não** entram na conta (foto opcional; garupa já nasce `false`).

Kicker **Passo 1 de 1 • Onboarding** é fixo. Texto à direita: `{percentual}% CONCLUÍDO`.

### 5.3 Foto: Storage vs API

1. Arquivo novo → `uploadFotoPerfil(uid, file)` → URL.
2. Sem arquivo, com `firebaseUser.photoURL` → essa URL.
3. Sem os dois → `""`.
4. POST recebe só `fotoUrl` (string). A function **não** recebe multipart.

Câmera e botão **Adicionar Foto de Perfil** abrem o **mesmo** `input[type=file]`. Se já existe preview, o rótulo do botão vira **Trocar foto de perfil**.

### 5.4 Estados do CTA

| Estado | Label | Visual |
|--------|-------|--------|
| Idle (inválido) | Concluir e Acessar os Rolês | `disabled` |
| Idle (válido) | Concluir e Acessar os Rolês + `double_arrow` | `primary-container` |
| Enviando | Ligando o Motor… + `progress_activity` | disabled |
| 201 | BEM-VINDO AO ASFALTO! + `check_circle` | fundo `--ritmo-tranquila` ~1100 ms, depois redirect |
| Erro de API | Volta ao idle válido | `erroGeral` abaixo do form |

Tempos do mock: spinner imediato; sucesso após ~800 ms **somente se o POST já tiver respondido 201**. Se o POST demorar mais, permanece em “Ligando o Motor…”. Não fingir sucesso.

---

## 6. Implementação Front

### 6.1 Service

```ts
// src/app/(auth)/primeiro-acesso/services/perfil.service.ts
import { api } from "@/lib/api";
import type { Usuario } from "@/types/user";
import type { UsuarioPrimeiroAcesso } from "@/types/user";

export const perfilPrimeiroAcessoService = {
  criar: (dados: UsuarioPrimeiroAcesso) =>
    api<Usuario>("/perfil", {
      method: "POST",
      body: JSON.stringify(dados),
    }),
};
```

Usar `api` (Bearer automático). Tratar `ApiError` (400/401/409). Um único `salvando` no hook do form.

Não adicionar `criar` em `(app)/perfil/services` — evita `(auth)` importar `(app)`.

### 6.2 Hook do formulário (esqueleto)

```ts
const salvar = async () => {
  setTentouSubmit(true);
  const erros = validar(campos);
  if (Object.keys(erros).length > 0) {
    setErros(erros);
    return;
  }

  setSalvando(true);
  try {
    const fotoUrl = arquivoNovo
      ? await uploadFotoPerfil(uid, arquivoNovo)
      : fotoUrlAtual; // Google ou ""

    await perfilPrimeiroAcessoService.criar({
      nome: nome.trim(),
      apelido: apelido.trim().replace(/^@+/, ""),
      moto: moto.trim(),
      pilotagem,
      fotoUrl,
      garupaFrequente,
    });

    setSucesso(true);
    await recarregarPerfil();
    // após ~1100 ms do estado sucesso:
    router.replace("/");
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) {
      await recarregarPerfil();
      router.replace("/");
      return;
    }
    setErroGeral(mensagemDaApiOuGenerica);
  } finally {
    setSalvando(false);
  }
};
```

Pré-preenchimento: `useEffect` com `firebaseUser.displayName` e `photoURL` (como hoje). Sem `console.log`.

### 6.3 Guarda de rota

Mesma regra atual, extraída:

1. `loading` → spinner de página (já existe no CSS).
2. Sem `firebaseUser` → `replace("/login")`.
3. Com `usuario` → `replace("/")`.
4. Só então renderiza o form.

`GuardaApp` do grupo `(app)` continua mandando quem não tem perfil para `/primeiro-acesso`. Não alterar esse hook, só garantir que o contrato do documento criado continue fazendo `buscarUsuario` / `GET` futuro encontrar o perfil.

`AuthProvider` **continua** lendo via `buscarUsuario` (client). Fora desta spec migrar o provider para `GET /perfil`. Ajustar `buscarUsuario` apenas para defaultar `garupaFrequente: Boolean(data.garupaFrequente)` quando o campo faltar (docs antigos).

### 6.4 Tokens CSS

Reescrever `primeiro-acesso.module.css`. Sem hex solto no TSX.

| Token | Uso |
|-------|-----|
| `--surface` / `--surface-container-low` / `-high` / `-highest` | Página, cards, pills, trilha |
| `--primary` / `--primary-container` | Kicker, ícones de seção, câmera, CTA, rádio ativo |
| `--secondary` / `--secondary-container` | Badge moto / percentual |
| `--on-surface` / `--on-surface-variant` / `--outline` | Título, body, hints |
| `--error` | Borda e texto de erro |
| `--ritmo-tranquila` / `--ritmo-agressiva` | Cards de pace + CTA sucesso |
| `--gutter-md` / `--touch-min` / `--touch-target` | Espaçamento e toque |

Tipografia: Barlow Condensed em títulos/CTA/badges; Plus Jakarta Sans no body. Ícones: Material Symbols Outlined.

Padding: `env(safe-area-inset-top/bottom)`. Sem padding extra de dock.

### 6.5 Acessibilidade

- `label` associado a cada input (`htmlFor`).
- Foto: `aria-label="Trocar foto de perfil"` no botão câmera; `alt` com o nome (ou “Foto de perfil”).
- Garupa: `role="radiogroup"` `aria-label="Possui garupa frequente"`; cada segmento `aria-checked`.
- Ritmo: `role="radiogroup"` `aria-label="Ritmo de pilotagem habitual"`; cada card `role="radio"` `aria-checked`.
- Erros: `aria-invalid` + `aria-describedby`.
- Barra: `role="progressbar"` `aria-valuenow={percentual}` `aria-valuemin={0}` `aria-valuemax={100}` `aria-label="Progresso do perfil"`.
- CTA: texto visível; `disabled` enquanto inválido, `salvando` ou sucesso.
- Área de toque ≥ 48px; CTA ~54–56px; usável a partir de 360px.
- Foco inicial: campo Nome (já pré-preenchido no Google) ou o primeiro vazio.

### 6.6 O que some da UI atual

| Atual | Novo |
|-------|------|
| Logo 🏍️ + “Rolemoto” / “Complete seu perfil” | Onboarding + “Monte Seu Perfil de Piloto” |
| Emojis 🔥⚡🌿 em grid 3 colunas | Cards verticais Material Symbols |
| Label “Moto” / placeholder CB 300 | “Modelo • Cilindrada • Ano” / Honda CB 650R 2022 |
| “Salvar e Entrar” | “Concluir e Acessar os Rolês” + estados do motor |
| `criarPerfilPrimeiroAcesso` | `POST /perfil` |

---

## 7. Backend — `POST /perfil`

A rota **já existe** em `functions/src/routes/perfil.ts`, mas o POST atual:

- exige `nome`, `apelido`, `moto`, `pilotagem` com check raso (`if (!body.nome)`);
- **não** valida enum de `pilotagem` nem `trim().length`;
- **não** conhece `garupaFrequente`;
- aceita `fotoUrl` vazio (mantém);
- já usa `autenticar` e 409 se o doc existe.

Esta spec **fecha o contrato** do POST (espelho do que a SPEC 002 fez no PUT). Não criar outro path. Não usar `onCall`.

### 7.1 Auth e autorização

1. `perfilRouter.use(autenticar)` — já exige `Authorization: Bearer <idToken>`.
2. Token inválido/expirado → **401**.
3. Sem Bearer → **401**.
4. `uid` **somente** de `req.usuario.uid`. Ignorar `uid` / `id` no body.
5. Documento `users/{uid}` já existe → **409** `{ erro: "Perfil já existe" }`.
6. Não há `POST /perfil/:uid`.

O Admin SDK ignora Security Rules: a function é a autorização.

### 7.2 Body e validação

```ts
// functions/src/types/usuario.ts
export type UsuarioPrimeiroAcesso = {
  nome: string;
  apelido: string;
  moto: string;
  pilotagem: Pilotagem;
  fotoUrl: string;
  garupaFrequente: boolean;
};
```

`Usuario` e `UsuarioCreate` incluem `garupaFrequente: boolean`.

Validar **antes** do repositório (helper em `functions/src/lib/` ou na própria rota, no estilo do PUT):

| Campo | Regra |
|-------|--------|
| `nome` | string, `trim().length >= 2` |
| `apelido` | string, `trim()`, strip `@` inicial, `length >= 2` |
| `moto` | string, `trim().length >= 2` |
| `pilotagem` | exatamente `agressiva` \| `moderada` \| `tranquila` |
| `fotoUrl` | string (pode `""`) |
| `garupaFrequente` | boolean estrito (`true` / `false`; não aceitar `"sim"` / `1`) |

Falha → **400** com mensagem específica (`"nome é obrigatório"`, `"pilotagem inválida"`, `"garupaFrequente é obrigatório"`).

Campos extras (`cidade`, `uid`, `createdAt`) **não** são persistidos do body. A rota monta:

```ts
usuarioRepository.criar(uid, {
  nome,
  apelido,
  moto,
  pilotagem,
  fotoUrl,
  cidade: "",
  garupaFrequente,
});
```

### 7.3 Handler (contrato)

```
POST /perfil
Headers: Authorization: Bearer <idToken>
Content-Type: application/json

Body:
{
  "nome": "Rodrigo Silveira",
  "apelido": "rodrigo_r1",
  "moto": "Yamaha YZF-R7 2023",
  "pilotagem": "moderada",
  "fotoUrl": "https://...",
  "garupaFrequente": false
}

201 → Usuario completo (inclui garupaFrequente, cidade "", createdAt ISO)
400 → validação
401 → token
409 → perfil já existe
500 → erro interno (responderErro)
```

### 7.4 Mapper / docs antigos

Em `firestore-usuario.repository.ts` (`toUsuario`):

```ts
garupaFrequente: Boolean(data.garupaFrequente),
```

Perfis criados antes desta spec leem `false`. Sem migração em lote.

`GET /perfil` e `PUT /perfil` passam a devolver o campo. O PUT **não** atualiza `garupaFrequente` nem `moto` (SPEC 002 intacta).

### 7.5 Repositório

`criar` já faz `set` do payload + `createdAt`. Desde que a rota envie `garupaFrequente`, não precisa de método novo.

Não acessar `firestore.collection` na rota.

### 7.6 Índices

Nenhuma query nova. **Não** alterar `firestore.indexes.json`.

### 7.7 O que não muda

- Function HTTP única `api`.
- `GET /perfil`, `PUT /perfil`, `DELETE /perfil`, `GET /perfil/historico`.
- Factory em `repositories/index.ts`.
- Coleção `users` (não criar `garagem` / subcoleção de motos).
- Sem FCM, sem unicidade de apelido.

Health em `GET /` já lista `/perfil`.

---

## 8. Wireframe

```
┌─────────────────────────────────┐
│  ● PASSO 1 DE 1 • ONBOARDING    │  75% CONCLUÍDO
│  [████████████░░░░]             │
│                                 │
│  🏍️  MONTE SEU PERFIL DE PILOTO │
│  Configure sua identidade…      │
│                                 │
│  ┌───────────────────────────┐  │
│  │      ╭─────╮ 📷           │  │  Mostre sua cara no comboio
│  │      │foto │              │  │
│  │      ╰─────╯              │  │
│  │  [ 📷 Adicionar Foto… ]   │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🪪 DADOS DO PILOTO        │  │
│  │ Nome Completo             │  │
│  │ [👤 ................]     │  │
│  │ Apelido nas Pistas  único │  │
│  │ [@  ................  🪖] │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🏠 GARAGEM     MOTO TITULAR│  │
│  │ Modelo • Cilindrada • Ano │  │
│  │ [🏍️ ................]     │  │
│  │ Garupa frequente? [Não|Sim]│  │
│  └───────────────────────────┘  │
│                                 │
│  ⚡ RITMO DE PILOTAGEM  (um)    │
│  ┌───────────────────────────┐  │
│  │ Tranquila     ○  até 90   │  │
│  ├───────────────────────────┤  │
│  │ Moderada ●  RECOMENDADO   │  │
│  ├───────────────────────────┤  │
│  │ Agressiva     ○  pista    │  │
│  └───────────────────────────┘  │
│                                 │
│  [ CONCLUIR E ACESSAR OS ROLÊS → ]
│  🔒 Poderá editar no perfil     │
└─────────────────────────────────┘
```

Sem dock. Estado de erro: input com borda `--error` e texto abaixo. Ritmo sem seleção: mensagem sob a lista.

---

## 9. Fora do Escopo

- Unicidade de apelido (o rótulo “Identificador Único” é só visual).
- Crop / compressão avançada da foto (só JPG/PNG 2MB).
- Campo cidade, geolocalização, mapa.
- Várias motos / subcoleção de garagem.
- Editar `moto` ou `garupaFrequente` em `/perfil` (SPEC 002).
- Algoritmo de matching de comboio / cálculo de autonomia.
- Pré-selecionar Moderada ou Garupa Sim.
- Menu inferior, sino, header Cockpit.
- Migrar `AuthProvider` de `buscarUsuario` (client) para `GET /perfil`.
- Facebook / outros provedores além do que o Auth já entrega (`displayName`, `photoURL`).
- Alterar Security Rules (continuam `auth != null`; a escrita oficial passa a ser a function).

---

## 10. Critérios de Aceite

### Front

- [ ] `/primeiro-acesso` segue o mock novo (progresso, foto, dados, garagem, ritmo vertical, CTA).
- [ ] `page.tsx` Server; Client só onde há interatividade / `useAuth`.
- [ ] Componentes < ~80 linhas; validação no hook; POST no service.
- [ ] Sem `setDoc` / `criarPerfilPrimeiroAcesso` nesta feature.
- [ ] Sem `console.log` de debug (os atuais da página saem).
- [ ] Nome e foto pré-preenchidos com Google quando existirem.
- [ ] Obrigatórios: nome, apelido, moto, pilotagem. Garupa default `false`. Foto opcional.
- [ ] Submit inválido: erro por campo, sem chamar a API. CTA disabled.
- [ ] Foto: JPG/PNG, máx. 2MB; erro inline se o arquivo for inválido.
- [ ] Barra de progresso reflete 0–100% dos 4 campos obrigatórios (não 90% fixo).
- [ ] POST 201: CTA “Ligando o Motor…” → “BEM-VINDO AO ASFALTO!” → feed (`/`).
- [ ] 409: entra no app (perfil já existia).
- [ ] Sem perfil + token → permanece; sem token → `/login`; com perfil → `/`.
- [ ] Sem dock. Sem copy de algoritmo / autonomia / várias motos.
- [ ] Toque ≥ 48px; usável a partir de 360px.

### Back

- [ ] `POST /perfil` exige Bearer; uid só do token.
- [ ] 201 cria `users/{uid}` com `garupaFrequente` e `cidade: ""`.
- [ ] 409 se o perfil já existe; não overwrite.
- [ ] 400 se nome/apelido/moto/pilotagem/garupa inválidos; `fotoUrl` pode ser `""`.
- [ ] Body não grava outro uid nem campos extras.
- [ ] `GET /perfil` devolve `garupaFrequente` (default `false` em docs antigos).
- [ ] `PUT /perfil` **não** passa a exigir moto/garupa.
- [ ] Persistência só em `FirestoreUsuarioRepository`.

### Integração

- [ ] Depois do 201, `recarregarPerfil()` encontra o doc e a guarda do `(app)` libera o feed.
- [ ] Login email (sem foto/nome) ainda consegue concluir o onboarding.
- [ ] Aprovações / feed que leem `usuario.moto` e `pilotagem` continuam iguais; `garupaFrequente` não precisa aparecer nessas UIs nesta spec.

---

## 11. Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| `src/app/(auth)/primeiro-acesso/page.tsx` | **Alterar** — orquestrador Server |
| `src/app/(auth)/primeiro-acesso/components/*` | **NOVO** — UI da feature |
| `src/app/(auth)/primeiro-acesso/hooks/*` | **NOVO** |
| `src/app/(auth)/primeiro-acesso/services/perfil.service.ts` | **NOVO** — POST |
| `src/app/(auth)/primeiro-acesso/constants.ts` | **NOVO** |
| `src/app/(auth)/primeiro-acesso/primeiro-acesso.module.css` | **Alterar** — visual do mock |
| `src/types/user.ts` | **Alterar** — `garupaFrequente`, payload do POST |
| `src/lib/firestore.ts` | **Alterar** — default `garupaFrequente` em `buscarUsuario`; deixar de usar `criarPerfilPrimeiroAcesso` (remover se ficar órfão) |
| `src/lib/storage.ts` | Reusar `uploadFotoPerfil` |
| `src/app/globals.css` | **Alterar** — tokens `--ritmo-agressiva` / `--ritmo-moderada` se ainda faltarem |
| `functions/src/types/usuario.ts` | **Alterar** — `garupaFrequente`, `UsuarioPrimeiroAcesso` |
| `functions/src/routes/perfil.ts` | **Alterar** — validação fechada do POST |
| `functions/src/repositories/firestore/firestore-usuario.repository.ts` | **Alterar** — mapear `garupaFrequente` |

Não alterar `MenuInferior`, `GuardaApp`, nem a UI de `/perfil` (SPEC 002).

---

## 12. Checklist da skill Next.js

- [ ] `page.tsx` sem `"use client"` (só orquestra).
- [ ] `"use client"` só em `TelaPrimeiroAcesso` e filhos interativos.
- [ ] Estado/validação/submit em `useFormularioPrimeiroAcesso` (+ foto + guarda).
- [ ] POST isolado no service (sem Firestore no componente).
- [ ] Um componente = uma coisa (header, foto, campo, toggle, card de ritmo, CTA).
- [ ] Sem abstração genérica “pra futuro” (várias motos, matching, unicidade).
- [ ] CSS Modules + tokens de `globals.css`.
- [ ] Sem `console.log` de debug.

---

## 13. Relação com o código atual

| Hoje | Nesta spec |
|------|------------|
| `page.tsx` Client ~336 linhas, emojis, “Salvar e Entrar” | Feature folder + mock cockpit |
| `criarPerfilPrimeiroAcesso` → `setDoc` no browser | `POST /perfil` |
| POST `/perfil` raso, sem `garupaFrequente` | Contrato fechado + boolean |
| Foto opcional (Google ou vazio) | **Mantém** |
| Sem campo de garupa | `garupaFrequente` no `users` |
| SPEC 002: “trocar primeiro acesso para POST = dívida” | Esta spec **paga** essa dívida |
| SPEC 002 perfil: nome/foto/apelido/ritmo | Intacto; moto/garupa só no onboarding |
| `docs/specs/primeiro-acesso.md` | Continua como histórico do fluxo; o visual e a escrita passam a ser esta SPEC 011 |

Não migrar documentos fictícios. Perfis antigos sem `garupaFrequente` leem `false`. O primeiro piloto que passar pelo onboarding novo grava o campo de verdade.
