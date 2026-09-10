# SPEC 001 — Menu Inferior (Navegação Autenticada)

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-09  
> **Referência visual:** `designs/feed/` (`DESIGN.md`, `code.html`, `screen.png`)  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade

---

## 1. Objetivo

Criar o **menu inferior persistente** (mobile-first) nas telas autenticadas, com **3 destinos**:

| Posição | Ação | Destino |
|---------|------|---------|
| Esquerda | **Rolês** — volta para a listagem | `/` |
| Centro | **Incluir (`+`)** — criar um rolê | `/criar-role` |
| Direita | **Perfil** — editar perfil | `/perfil` |

O menu é a navegação principal do app após o login. Login e primeiro acesso **não** exibem o menu.

Esta spec cobre o **shell de navegação** e rotas-destino (placeholders). O feed completo, o formulário de criar rolê e a tela de edição de perfil ficam em specs futuras.

---

## 2. Referência de Design

O mock do feed (`designs/feed/code.html` + `screen.png`) já define o dock inferior. Replicar esse visual, não inventar outro.

### Comportamento visual (do mock)

- Barra **fixa** na base da viewport (`position: fixed; bottom: 0`).
- Fundo `surface-container-lowest` com blur (`backdrop-filter`) e sombra para cima.
- Largura máxima do conteúdo interno: **560px**, centralizado.
- Altura da barra: **80px** (`h-20`) + `env(safe-area-inset-bottom)` (PWA / iPhone).
- Três colunas iguais (`flex: 1`).
- Botão **`+` elevado** (`translateY` negativo), circular, laranja `#FF6B00`, glow laranja.
- Item ativo: ícone + label em `primary-container` (`#FF6B00`).
- Item inativo: `on-surface-variant` (`#E2BFB0`).

### Ícones (Material Symbols Outlined — já importados em `globals.css`)

| Item | Ícone | Label |
|------|-------|-------|
| Listagem | `two_wheeler` | ROLÊS |
| Incluir | `add` | (sem label — só `aria-label`) |
| Perfil | `account_circle` | PERFIL |

---

## 3. Fluxo do Usuário

```
Login / Primeiro acesso
  │
  ▼
Grupo (app) — layout com MenuInferior
  │
  ├── [Rolês]     →  /              listagem (feed)
  ├── [  +  ]     →  /criar-role    incluir rolê
  └── [Perfil]    →  /perfil        editar perfil
```

- Em **qualquer** tela autenticada, o botão **Rolês** leva de volta à listagem (`/`).
- Em **qualquer** tela autenticada, o **`+`** abre a criação de rolê.
- Em **qualquer** tela autenticada, **Perfil** abre a edição do perfil.
- Telas `(auth)` (`/login`, `/primeiro-acesso`) **não** renderizam o menu.

### Estado ativo

| Rota atual | Rolês | `+` | Perfil |
|------------|-------|-----|--------|
| `/` | ativo (laranja) | glow padrão | inativo |
| `/criar-role` | inativo | glow reforçado | inativo |
| `/perfil` | inativo | glow padrão | ativo (laranja) |

O `+` **não** troca de cor como os laterais: continua laranja. No destino `/criar-role`, só aumenta o glow para indicar contexto.

---

## 4. Arquitetura Next.js

Seguir a skill de padrões: página/layout como orquestrador fino, componentes pequenos (~80 linhas), `"use client"` só no que navega.

### 4.1 Route groups

Hoje a home autenticada está em `src/app/page.tsx`, o que impede um layout só para o app logado. Mover a rota `/` para o grupo `(app)`:

```
src/app/
├── layout.tsx                    # Root — AuthProvider (já existe)
├── (auth)/                       # SEM menu
│   ├── login/
│   └── primeiro-acesso/
└── (app)/                        # COM menu
    ├── layout.tsx                # Server Component — MenuInferior + padding
    ├── page.tsx                  # Destino Rolês (placeholder da listagem)
    ├── criar-role/
    │   └── page.tsx              # Destino Incluir (placeholder)
    └── perfil/
        └── page.tsx              # Destino Perfil (placeholder)
```

Grupos `(auth)` e `(app)` **não** alteram a URL. `(app)/page.tsx` continua sendo `/`.

### 4.2 Por que o menu vive no layout

`MenuInferior` é compartilhado por todas as rotas autenticadas. Colocar no `(app)/layout.tsx` evita repetir o componente em cada `page.tsx` e mantém o dock visível na troca de rota (App Router não desmonta o layout).

O layout permanece **Server Component**. Só o menu é Client (precisa de `usePathname` para o estado ativo).

### 4.3 Estrutura do componente (feature compartilhada)

O menu não pertence a uma tela — fica em `src/components/`, não dentro de uma rota.

```
src/components/menu-inferior/
├── MenuInferior.tsx              # Client — <nav> + composição
├── ItemMenu.tsx                  # Link lateral (ícone + label)
├── BotaoIncluir.tsx              # FAB central (+)
├── itens-menu.ts                 # Constantes das 3 opções
├── hooks/
│   └── useItemMenuAtivo.ts       # pathname → item ativo
└── menu-inferior.module.css
```

### 4.4 Responsabilidades

| Peça | Tipo | Faz |
|------|------|-----|
| `(app)/layout.tsx` | Server | Envolve `children` + `MenuInferior`; reserva espaço inferior |
| `MenuInferior` | Client | Monta os 3 itens; aplica classe do item ativo |
| `ItemMenu` | Client (via pai) | Um `Link` com ícone + label |
| `BotaoIncluir` | Client (via pai) | `Link` circular com `+` |
| `useItemMenuAtivo` | Hook | Compara `usePathname()` com os `href` |
| `page.tsx` de cada rota | Server (placeholder) | Só o conteúdo da tela — **não** implementa o menu |

**Não misturar** no mesmo arquivo: markup do nav + CSS + regra de rota ativa + proteção de auth.

---

## 5. Contrato dos Itens

```ts
// src/components/menu-inferior/itens-menu.ts
export type ItemMenuConfig = {
  href: "/" | "/criar-role" | "/perfil";
  label: string;
  icone: "two_wheeler" | "add" | "account_circle";
  ariaLabel: string;
  tipo: "lateral" | "fab";
};

export const ITENS_MENU: readonly ItemMenuConfig[] = [
  {
    href: "/",
    label: "Rolês",
    icone: "two_wheeler",
    ariaLabel: "Listagem de rolês",
    tipo: "lateral",
  },
  {
    href: "/criar-role",
    label: "Incluir",
    icone: "add",
    ariaLabel: "Incluir rolê",
    tipo: "fab",
  },
  {
    href: "/perfil",
    label: "Perfil",
    icone: "account_circle",
    ariaLabel: "Editar perfil",
    tipo: "lateral",
  },
];
```

Match de rota ativa: `pathname === href`. `/` só casa com a listagem — não marcar Rolês ativo em `/perfil`.

---

## 6. Implementação Técnica

### 6.1 Layout autenticado

```tsx
// src/app/(app)/layout.tsx — Server Component (sem "use client")
import { MenuInferior } from "@/components/menu-inferior/MenuInferior";
import styles from "./app.module.css";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={styles.shell}>
      <div className={styles.conteudo}>{children}</div>
      <MenuInferior />
    </div>
  );
};

export default AppLayout;
```

O conteúdo precisa de `padding-bottom` ≥ altura da barra + safe-area (~96px) para o feed não ficar atrás do menu (no mock: `pb-24` no `<main>`).

### 6.2 MenuInferior (Client)

```tsx
"use client";

import { ItemMenu } from "./ItemMenu";
import { BotaoIncluir } from "./BotaoIncluir";
import { ITENS_MENU } from "./itens-menu";
import { useItemMenuAtivo } from "./hooks/useItemMenuAtivo";
import styles from "./menu-inferior.module.css";

export const MenuInferior = () => {
  const { estaAtivo } = useItemMenuAtivo();
  const [roles, incluir, perfil] = ITENS_MENU;

  return (
    <nav className={styles.nav} aria-label="Navegação principal">
      <div className={styles.inner}>
        <ItemMenu item={roles} ativo={estaAtivo(roles.href)} />
        <BotaoIncluir item={incluir} destacado={estaAtivo(incluir.href)} />
        <ItemMenu item={perfil} ativo={estaAtivo(perfil.href)} />
      </div>
    </nav>
  );
};
```

Usar `next/link` (`<Link>`), não `<a href>` cru nem `router.push` em `onClick`.

### 6.3 Hook de item ativo

```tsx
"use client";

import { usePathname } from "next/navigation";
import type { ItemMenuConfig } from "../itens-menu";

export const useItemMenuAtivo = () => {
  const pathname = usePathname();

  const estaAtivo = (href: ItemMenuConfig["href"]) => pathname === href;

  return { estaAtivo };
};
```

`"use client"` aqui é necessário: `usePathname` é API de Client Component.

### 6.4 Tokens CSS (já em `globals.css`)

Reusar variáveis; não hardcodar hex no componente.

| Token | Uso no menu |
|-------|-------------|
| `--surface-container-lowest` | Fundo da barra |
| `--primary-container` (`#ff6b00`) | Item ativo + fundo do `+` |
| `--on-surface-variant` | Item inativo |
| `--on-surface` | Hover do item inativo |
| `--surface` | Ícone `+` (contraste no laranja) |

Tipografia do label: **Plus Jakarta Sans**, 12px / 600 / uppercase / `letter-spacing: 0.02em` (`label-md` do DESIGN.md). Ícones: Material Symbols, ~24px laterais, ~32px no `+`.

### 6.5 Medidas e toque (DESIGN.md)

| Token | Valor | Uso |
|-------|-------|-----|
| `touch-min` | 48px | Área mínima dos laterais |
| `touch-target` | 56px | Diâmetro do `+` |
| `gutter-md` | 16px | Padding horizontal interno |
| Altura da barra | 80px | Sem contar safe-area |
| Max width | 560px | Mesmo cockpit do feed |

O `+` sobe ~20px (`-translate-y-5` no mock) para ficar acima da barra, com glow `0 0 20px rgba(255, 107, 0, 0.5)`.

### 6.6 Safe area (PWA)

```css
.nav {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

O `viewport` do app deve permitir `viewport-fit=cover` (já no HTML do mock) para o inset existir no iOS.

### 6.7 Acessibilidade

- `<nav aria-label="Navegação principal">`.
- Item da rota atual: `aria-current="page"` no `Link`.
- FAB: `aria-label="Incluir rolê"` (não tem texto visível).
- Área de toque ≥ 48×48px (luvas / uso no guidão — DESIGN.md).
- Não depender só da cor para o ativo: `aria-current` + classe visual.

### 6.8 Proteção de rota (layout)

O grupo `(app)` só faz sentido logado **e** com perfil. Extrair a lógica hoje em `src/app/page.tsx` para um hook no layout autenticado (padrão do primeiro acesso):

```
Se loading → spinner
Se !firebaseUser → /login
Se firebaseUser && !usuario → /primeiro-acesso
Se firebaseUser && usuario → children + menu
```

O hook precisa de `"use client"`. Opções:

1. **Client wrapper** fino (`GuardaApp`) no layout Server, que envolve `children` + menu.
2. Manter o redirect nas pages (pior: duplica).

Preferir (1): um `GuardaApp` em `src/app/(app)/components/GuardaApp.tsx` (~40 linhas) + `useProtecaoRotaApp`. O layout Server só orquestra.

---

## 7. Placeholders das rotas

As telas de destino **não** são o feed/formulário/perfil finais. Servem para validar a navegação.

| Rota | Conteúdo mínimo |
|------|-----------------|
| `/` | Título “Rolês” + texto curto (listagem virá em spec do feed) |
| `/criar-role` | Título “Incluir rolê” + texto curto (formulário em spec futura) |
| `/perfil` | Título “Perfil” + texto curto (edição em spec futura) |

Cada `page.tsx` é Server Component orquestrador — sem `"use client"` se só renderiza texto/layout estático.

---

## 8. Wireframe

```
┌─────────────────────────────────┐
│                                 │
│         conteúdo da tela        │
│         (padding-bottom)        │
│                                 │
├─────────────────────────────────┤
│                                 │
│   🏍️          ╭───╮        👤  │
│  ROLÊS        │ + │      PERFIL │
│  (laranja     ╰───╯      (cinza │
│   se ativo)   laranja     se inativo)
│                                 │
│      ░░ safe-area (home bar) ░░ │
└─────────────────────────────────┘
         max-width 560px
```

No feed (`/`): Rolês laranja, Perfil cinza.  
No perfil: Perfil laranja, Rolês cinza.  
O `+` permanece laranja e elevado nos três destinos.

---

## 9. Fora do Escopo

- Implementar o feed de rolês (cards, filtros, mapa) — só o destino `/`.
- Formulário de criação de rolê — só o destino `/criar-role`.
- Formulário de edição de perfil — só o destino `/perfil`.
- Logout no menu (continua fora; perfil futuro pode ter a ação).
- Badge de notificações no header (existe no mock do feed, não neste menu).
- Menu em desktop/tablet diferente: o dock vale até 560px; em telas maiores o mesmo dock centralizado (como o mock). Sem sidebar nesta spec.
- Animação de troca de rota além do `active:scale` já previsto no mock.

---

## 10. Critérios de Aceite

- [ ] Menu inferior visível em `/`, `/criar-role` e `/perfil`.
- [ ] Menu **ausente** em `/login` e `/primeiro-acesso`.
- [ ] Botão esquerdo (ícone moto + “Rolês”) navega para `/`.
- [ ] Botão central (`+`) navega para `/criar-role`.
- [ ] Botão direito (ícone perfil + “Perfil”) navega para `/perfil`.
- [ ] Item da rota atual fica laranja (`#FF6B00`); o outro lateral fica `on-surface-variant`.
- [ ] Visual alinhado ao mock `designs/feed/`: barra fixa, blur, FAB elevado com glow, labels uppercase.
- [ ] Área de toque ≥ 48px; FAB 56px.
- [ ] Conteúdo da página não fica escondido atrás da barra (padding-bottom + safe-area).
- [ ] `aria-current="page"` no item ativo; FAB com `aria-label`.
- [ ] Layout `(app)` é Server Component; só o menu (e a guarda de auth) são Client.
- [ ] Componentes do menu < ~80 linhas cada; constantes fora do JSX.
- [ ] Navegação via `next/link` (sem `httpsCallable` / sem lógica de dados no menu).
- [ ] Layout responsivo e usável a partir de 360px.

---

## 11. Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| `src/app/page.tsx` | **Mover** para `src/app/(app)/page.tsx` (evita conflito de rota `/`) |
| `src/app/(app)/layout.tsx` | **NOVO** — shell Server + `MenuInferior` |
| `src/app/(app)/app.module.css` | **NOVO** — padding do conteúdo / shell |
| `src/app/(app)/components/GuardaApp.tsx` | **NOVO** — Client wrapper de proteção |
| `src/app/(app)/hooks/useProtecaoRotaApp.ts` | **NOVO** — redirect login / primeiro-acesso |
| `src/app/(app)/criar-role/page.tsx` | **NOVO** — placeholder Incluir |
| `src/app/(app)/perfil/page.tsx` | **NOVO** — placeholder Perfil |
| `src/components/menu-inferior/MenuInferior.tsx` | **NOVO** |
| `src/components/menu-inferior/ItemMenu.tsx` | **NOVO** |
| `src/components/menu-inferior/BotaoIncluir.tsx` | **NOVO** |
| `src/components/menu-inferior/itens-menu.ts` | **NOVO** |
| `src/components/menu-inferior/hooks/useItemMenuAtivo.ts` | **NOVO** |
| `src/components/menu-inferior/menu-inferior.module.css` | **NOVO** |
| `src/app/layout.tsx` | Sem mudança de estrutura (AuthProvider permanece no root) |

Redirects atuais de `/login` e `/primeiro-acesso` para `/` **continuam válidos**: `/` passa a ser a listagem dentro de `(app)`.

---

## 12. Checklist da skill Next.js

- [ ] Nenhum `"use client"` no layout ou nas pages placeholder (só menu + guarda).
- [ ] `page.tsx` / `layout.tsx` só orquestram.
- [ ] Lógica de pathname extraída para `useItemMenuAtivo`.
- [ ] Menu sem acesso a Firestore / Functions (não precisa de service).
- [ ] Sem componente genérico “pra futuro” além dos 3 itens reais.
- [ ] CSS Modules + tokens de `globals.css` (mesmo padrão de login / primeiro-acesso).
