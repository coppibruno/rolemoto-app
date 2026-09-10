# SPEC 006 — Excluir Conta

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-09  
> **Referência visual:** `designs/perfil/` (botão) e `designs/modal-excluir-conta/` (`DESIGN.md`, `code.html`, `screen.png`)  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade  
> **Backend:** Cloud Function `api` (Express) — `DELETE /perfil`  
> **Depende de:** SPEC 001 (shell autenticado + `/perfil`) e SPEC 002 (tela de edição + `BotaoSair`)

---

## 1. Objetivo

Permitir que o piloto autenticado **encerre a própria conta** a partir do Cockpit (`/perfil`).

O fluxo é destrutivo e irreversível no produto: o documento `users/{uid}` some do Firestore e a sessão é encerrada. Sem confirmação no modal, nada é apagado.

Esta spec é **full stack**:

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | Botão no perfil, modal do mock, `DELETE /perfil`, `logout()` após sucesso |
| Back (Functions) | Token válido, uid só do token, apagar `users/{uid}` via repositório |

O uid **nunca** vem da URL nem do body. Só o dono do token apaga o próprio documento.

`Sair da conta` (SPEC 002) **não** muda: continua sendo só logout, sem chamar `DELETE`.

---

## 2. Referência de Design

Replicar o visual de `designs/perfil/code.html` (CTA) e `designs/modal-excluir-conta/` (`code.html` + `screen.png`). Não inventar outro layout. Tokens em `DESIGN.md` / `globals.css`.

### O que entra nesta spec (do mock)

- Botão **Excluir Conta** abaixo de **Sair da conta** (ícone `delete_forever`, texto `--error`).
- Overlay com blur sobre o perfil.
- Cartão de confirmação: ícone `warning`, título **Excluir Conta?**, badge **Ação Irreversível**.
- Texto de consequência permanente.
- Faixa com ícone `shield` e a pergunta do mock.
- CTA destrutivo **Sim, Excluir Minha Conta**.
- Link **Cancelar e Manter Conta**.

### O que o mock mostra e **não** entra

| Elemento do mock | Motivo |
|------------------|--------|
| Sino de notificações no header | SPEC 001 / 002 já deixaram fora |
| Telemetria e Histórico de Pistas | Fora da SPEC 002; o blur do fundo usa a tela **real** de `/perfil` |
| Apagar Auth, Storage, rolês e solicitações | Pedido desta spec: apagar o usuário **no banco** (`users`) e deslogar |

O copy do modal fala em “histórico, motos e reputação”. Nesta spec o efeito real é: **sumir o perfil em `users` + logout**. O texto do mock permanece (fidelidade visual). Cascade fica para spec futura.

Menu inferior já existe. Esta tela **não** reimplementa o dock.

### Comportamento visual (do mock)

- Botão trigger: largura total, `label-md` uppercase, cor `--error`, ícone `delete_forever` 16px, `min-height` `touch-min` (48px), `mt` ~4px após o sair. Hover/active: opacidade. Sem fundo.
- Overlay: `position: fixed; inset: 0`, fundo `color-mix` de `--background` a ~80%, `backdrop-filter: blur(12px)`, padding 16px, flex centralizado.
- Z-index do overlay: **acima do header** (`40`) e **abaixo ou igual ao dock** (`50`), como no HTML do mock (nav continua visível).
- Cartão: `max-width: 24rem` (sm), `rounded-xl`, fundo `--surface-container`, borda `1px solid color-mix(in srgb, var(--error) 30%, transparent)`, padding `--card-padding-lg` (20px), coluna com gap 16px.
- Ícone de alerta: círculo 40px, fundo `error-container` a 30%, ícone `warning` em `--error`.
- Título: `headline-sm`, uppercase, `--error`.
- Badge: `badge-label` ~10px, uppercase, `--on-surface-variant`.
- Corpo: Plus Jakarta Sans ~14px, `--on-surface`.
- Faixa shield: fundo `--surface-container-low`, borda `outline-variant` a 40%, ícone `shield` em `--error`.
- CTA confirmar: largura total, altura ~48–52px, fundo `--error` (`#FFB4AB`), texto `--on-error` (`#690005`), Barlow Condensed uppercase, ícone `delete_forever`.
- Cancelar: texto `--on-surface-variant`, uppercase, `label-md`, sem fundo.

---

## 3. Fluxo do Usuário

```
Grupo (app) — já autenticado e com perfil (GuardaApp)
  │
  ▼
Menu → Perfil  →  /perfil
  │
  ├── Sair da conta     → logout()              (SPEC 002 — inalterado)
  └── Excluir Conta     → abre modal
        │
        ├── Cancelar / Esc / clique no overlay
        │     → fecha o modal, nada é apagado
        └── Sim, Excluir Minha Conta
              │
              ├── DELETE /perfil   (Bearer do token)
              │     │
              │     ├── 204 → logout() → GuardaApp manda para /login
              │     ├── 401 → token inválido (GuardaApp / login)
              │     ├── 404 → perfil já não existe → logout() mesmo assim
              │     └── 500 → modal permanece; mensagem de erro
              └── Enquanto excluindo: botões disabled; overlay não fecha
```

- Sem o modal confirmado, **não** chama a API.
- Logout só depois do `204` (ou `404` tratado como conta já inexistente). Falha de rede **não** desloga.
- Se o DELETE passar e o logout falhar, o `GuardaApp` veria `usuario === null` (doc sumiu) e mandaria para `/primeiro-acesso`. Por isso o hook **sempre** chama `logout()` após sucesso — evita recriar perfil sem querer.
- Relogar com a mesma conta Google/email: Auth ainda existe → cai no **primeiro acesso** (documento `users` sumiu). Isso é o comportamento desta spec.

---

## 4. Arquitetura Next.js

Seguir a skill: página orquestradora, componentes ~80 linhas, lógica em hooks, API em service. `"use client"` só no que tem estado, clique, modal ou `useAuth`.

`page.tsx` **não muda** de Server Component. A exclusão vive nos filhos Client da feature `perfil`.

### 4.1 Por que não criar rota `/excluir-conta`

O mock é um **diálogo sobre o perfil**, não uma página. Confirmação, foco e overlay pertencem a `/perfil`.

### 4.2 Estrutura por feature (acréscimos)

```
src/app/(app)/perfil/
├── page.tsx                         # inalterado (Server)
├── components/
│   ├── TelaPerfil.tsx               # inalterado
│   ├── FormularioPerfil.tsx         # Alterar — monta BotaoExcluirConta
│   ├── BotaoSair.tsx                # inalterado
│   ├── BotaoExcluirConta.tsx        # NOVO — trigger + orquestra modal
│   └── ModalExcluirConta.tsx        # NOVO — só o diálogo
├── hooks/
│   └── useExcluirConta.ts           # NOVO — aberto, excluindo, erro, confirmar
├── services/
│   └── perfil.service.ts            # Alterar — método excluir()
└── perfil.module.css                # Alterar — botão + overlay + cartão
```

`FormularioPerfil` já está no limite de ~80 linhas. **Não** colocar JSX do modal nem `fetch` nele — só o `BotaoExcluirConta` nas ações, após `BotaoSair`.

### 4.3 Responsabilidades

| Peça | Tipo | Faz |
|------|------|-----|
| `FormularioPerfil` | Client | Inclui o botão nas ações; desabilita enquanto `salvando` |
| `BotaoExcluirConta` | Client | Renderiza o trigger; usa o hook; monta o modal se `aberto` |
| `ModalExcluirConta` | Client | Markup do mock; `role="dialog"`; sem `fetch` |
| `useExcluirConta` | Hook | `aberto`, `excluindo`, `erro`, `abrir`, `fechar`, `confirmar` |
| `perfil.service` | Service | `excluir()` → `DELETE /perfil` via `api` |

**Não misturar** no mesmo arquivo: JSX do modal + `DELETE` + `logout()`.

**Não** usar `deleteDoc` em `src/lib/firestore.ts`. Persistência só na function.

### 4.4 Foco e teclado (reuso)

O feed já tem `useFocoModal` (Esc, trap de Tab, devolve o foco). Esta spec é o **segundo uso real**.

Extrair para `src/hooks/useFocoModal.ts` e apontar o feed para o mesmo hook. **Não** importar de `feed/hooks` para o perfil.

Enquanto `excluindo === true`, Esc **não** fecha (passar um `fechar` no-op ou guardar no hook).

---

## 5. Contrato Front

```ts
export const perfilService = {
  atualizar: (dados: UsuarioEdicao) =>
    api<Usuario>("/perfil", {
      method: "PUT",
      body: JSON.stringify(dados),
    }),

  excluir: () =>
    api<void>("/perfil", {
      method: "DELETE",
    }),
};
```

Sem body. O `api` já trata **204** (`undefined`) e já manda o Bearer.

### 5.1 Hook (esqueleto)

```ts
const confirmar = async () => {
  if (excluindo) return;
  setExcluindo(true);
  setErro(null);
  try {
    await perfilService.excluir();
    await logout();
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      await logout();
      return;
    }
    setErro(mensagemDaApiOuGenerica);
  } finally {
    setExcluindo(false);
  }
};
```

Mensagem genérica: “Não foi possível excluir a conta. Tente de novo.”

### 5.2 Tokens CSS

Reusar variáveis em `perfil.module.css`. Sem hex solto no TSX.

| Token | Uso |
|-------|-----|
| `--error` | Texto do trigger, título, ícones, borda do cartão, fundo do CTA |
| `--on-error` | Texto/ícone do CTA confirmar |
| `--error-container` | Fundo do círculo de alerta (com alpha) |
| `--surface-container` | Fundo do cartão |
| `--surface-container-low` | Faixa do shield |
| `--background` | Overlay (com alpha) |
| `--on-surface` / `--on-surface-variant` | Corpo e cancelar |
| `--outline-variant` | Borda da faixa shield |
| `--gutter-md` / `--touch-min` / `--card-padding-lg` | Espaçamento e toque |

Tipografia: Barlow Condensed no título e no CTA; Plus Jakarta Sans no corpo. Ícones: Material Symbols Outlined (`warning`, `shield`, `delete_forever`).

### 5.3 Acessibilidade

- Trigger: `type="button"` (não submete o form de edição).
- Modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` no título, `aria-describedby` no parágrafo de consequência.
- Foco inicial no **Cancelar** (ação segura), não no CTA destrutivo.
- Esc fecha (se não estiver excluindo).
- Trap de Tab dentro do cartão (`useFocoModal`).
- Erro da API: `role="alert"` no modal.
- CTA confirmar e cancelar: área de toque ≥ 48px.
- `disabled` em ambos enquanto `excluindo`; texto do confirmar vira “Excluindo…”.
- Overlay: clique fora do cartão fecha **somente** se não estiver excluindo (`stopPropagation` no cartão).
- `document.body` com `overflow: hidden` enquanto o modal estiver aberto.

---

## 6. Implementação Front

### 6.1 Onde entra no form

```tsx
<div className={styles.acoes}>
  {/* Salvar + BotaoSair — já existem */}
  <BotaoExcluirConta desabilitado={form.salvando} />
</div>
```

O modal pode usar portal (`createPortal(..., document.body)`) para o overlay cobrir o viewport. Se ficar `fixed` no CSS, portal é opcional.

### 6.2 Header e dock

Não alterar `CabecalhoPerfil` nem `MenuInferior`. Overlay não precisa esconder o dock.

### 6.3 Relação com salvar / sair

| Ação | Enquanto `salvando` | Enquanto `excluindo` |
|------|---------------------|----------------------|
| Salvar | disabled | form continua, mas o modal trava o resto |
| Sair da conta | disabled | disabled (prop do trigger; modal aberto) |
| Excluir | trigger disabled | CTA disabled |

Não misturar os dois fluxos.

---

## 7. Backend — `DELETE /perfil`

A rota **já existe** em `functions/src/routes/perfil.ts`:

- `perfilRouter.use(autenticar)`
- `uid` de `req.usuario.uid`
- `usuarioRepository.remover(uid)` → `false` vira 404; `true` vira **204**

Esta spec **fecha o contrato**. Não criar outro path (`/users/:uid`, `/conta`, etc.). Não usar `onCall`.

### 7.1 Auth e autorização

1. Bearer obrigatório — **401** `{ erro: "Token ausente" }` / `{ erro: "Token inválido ou expirado" }`.
2. `uid` **somente** do token. Ignorar query, params e body.
3. Documento inexistente → **404** `{ erro: "Perfil não encontrado" }`.
4. Não há `DELETE /perfil/:uid`. Não dá para apagar outro piloto.

O Admin SDK ignora Security Rules: a function é a autorização.

### 7.2 O que o repositório faz

`FirestoreUsuarioRepository.remover`:

1. Lê `users/{uid}`.
2. Se não existe → `false`.
3. Se existe → `delete()` → `true`.

A rota **não** acessa `firestore.collection`. Sem mudança de contrato se o handler atual já estiver assim.

### 7.3 Handler (contrato)

```
DELETE /perfil
Headers: Authorization: Bearer <idToken>
Body: (vazio)

204 → documento users/{uid} removido
401 → token
404 → perfil não encontrado
500 → erro interno (responderErro)
```

Sem JSON no 204.

### 7.4 O que não muda nesta spec

- `GET` / `POST` / `PUT /perfil`.
- Firebase Auth (`adminAuth.deleteUser` **não** entra).
- Arquivos no Storage (`avatars/{uid}.jpg` podem ficar órfãos).
- Coleções `roles` e `solicitacoes` (rolês criados pelo piloto permanecem).
- Factory em `repositories/index.ts`.

Se no futuro o produto exigir cascade + apagar o usuário do Auth, isso é **outra spec**.

---

## 8. Wireframe

```
┌─────────────────────────────────┐
│  [logo]  PERFIL                 │  header (SPEC 002)
│          COCKPIT                │
├─────────────────────────────────┤
│         cartão + form           │
│  [ 💾 SALVAR ALTERAÇÕES ]       │
│       ↩ Sair da conta           │
│       🗑 Excluir Conta          │  ← NOVO (texto --error)
└─────────────────────────────────┘
│  🏍️        ( + )        👤     │  dock visível
└─────────────────────────────────┘

           overlay (blur)
    ┌───────────────────────────┐
    │  ⚠  EXCLUIR CONTA?        │
    │     AÇÃO IRREVERSÍVEL     │
    │                           │
    │  Esta ação é permanente…  │
    │                           │
    │  ┌─────────────────────┐  │
    │  │ 🛡 Tem certeza de   │  │
    │  │   que deseja        │  │
    │  │   acelerar para     │  │
    │  │   fora da           │  │
    │  │   comunidade?       │  │
    │  └─────────────────────┘  │
    │                           │
    │  [🗑 SIM, EXCLUIR MINHA   │
    │      CONTA]               │
    │  Cancelar e manter conta  │
    └───────────────────────────┘
```

---

## 9. Fora do Escopo

- Apagar o usuário no **Firebase Authentication**.
- Apagar foto no Storage.
- Apagar ou transferir rolês criados (`roles` onde `criadorId === uid`).
- Apagar solicitações (`solicitacoes` do uid).
- Remover o uid de `participantes[]` em rolês de terceiros.
- Tela própria `/excluir-conta`.
- Digitar senha / apelido de novo para confirmar (o mock não pede).
- Soft-delete / período de graça.
- Alterar o copy do modal para refletir o cascade incompleto.
- Mudar `Sair da conta`.
- Menu inferior, guarda de rota e tokens globais.

---

## 10. Critérios de Aceite

### Front

- [ ] `/perfil` ganha o botão **Excluir Conta** abaixo de **Sair da conta**, no visual do mock.
- [ ] Clique abre o modal de `designs/modal-excluir-conta/` (ícone, título, copy, faixa, CTAs).
- [ ] Cancelar, Esc e clique no overlay fecham o modal **sem** chamar a API.
- [ ] Confirmar chama `DELETE /perfil` (Bearer) e, no 204, `logout()` → `/login`.
- [ ] 404 no DELETE também desloga.
- [ ] Falha 500/rede: modal aberto, erro visível, sessão intacta.
- [ ] Enquanto exclui: CTAs disabled; não fecha com Esc/overlay.
- [ ] Trigger não submete o form de edição (`type="button"`).
- [ ] `page.tsx` continua Server; Client só no botão/modal/hook.
- [ ] Componentes < ~80 linhas; `DELETE` só no service; logout só no hook.
- [ ] Sem `deleteDoc` nesta feature.
- [ ] Dialog acessível (`role="dialog"`, foco, `aria-*`).
- [ ] Toque ≥ 48px; usável a partir de 360px.

### Back

- [ ] `DELETE /perfil` exige Bearer válido.
- [ ] Só apaga `users/{uid}` do token.
- [ ] 204 se removeu; 404 se o doc não existia; 401 se o token falhar.
- [ ] Body/params não escolhem outro uid.
- [ ] Persistência só em `FirestoreUsuarioRepository.remover`.
- [ ] Auth, Storage, `roles` e `solicitacoes` intactos nesta spec.

### Integração

- [ ] Depois do logout, `/perfil` não permanece visível (GuardaApp → `/login`).
- [ ] Relogar com a mesma conta abre o **primeiro acesso** (sem documento `users`).
- [ ] `Sair da conta` continua **sem** apagar o perfil.

---

## 11. Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| `src/app/(app)/perfil/components/FormularioPerfil.tsx` | **Alterar** — inclui `BotaoExcluirConta` |
| `src/app/(app)/perfil/components/BotaoExcluirConta.tsx` | **NOVO** |
| `src/app/(app)/perfil/components/ModalExcluirConta.tsx` | **NOVO** |
| `src/app/(app)/perfil/hooks/useExcluirConta.ts` | **NOVO** |
| `src/app/(app)/perfil/services/perfil.service.ts` | **Alterar** — `excluir()` |
| `src/app/(app)/perfil/perfil.module.css` | **Alterar** — trigger + overlay + cartão |
| `src/hooks/useFocoModal.ts` | **NOVO** (extraído) |
| `src/app/(app)/feed/hooks/useFocoModal.ts` | **Alterar** — reexport ou apontar para `src/hooks` |
| `src/app/(app)/feed/components/SeletorLocalizacao.tsx` | **Alterar** — import do hook extraído |
| `functions/src/routes/perfil.ts` | Revisar contrato; mudança só se o 204/404/uid divergir |
| `functions/src/repositories/firestore/firestore-usuario.repository.ts` | Sem mudança de contrato (`remover` já apaga o doc) |

Não alterar `MenuInferior`, `GuardaApp`, `BotaoSair` nem o `PUT /perfil`.

---

## 12. Checklist da skill Next.js

- [ ] `page.tsx` sem `"use client"` (só orquestra).
- [ ] `"use client"` só em `BotaoExcluirConta`, `ModalExcluirConta` e o hook.
- [ ] Estado/API/logout em `useExcluirConta`.
- [ ] `DELETE` isolado em `perfil.service.ts`.
- [ ] Um componente = uma coisa (botão vs diálogo).
- [ ] Sem abstração genérica “Dialog” da aplicação — só este modal + o hook de foco já justificado.
- [ ] CSS Modules + tokens de `globals.css`.
- [ ] Sem `console.log` de debug.

---

## 13. Relação com o código atual

| Hoje | Nesta spec |
|------|------------|
| `DELETE /perfil` na function, sem UI | Botão + modal + `perfilService.excluir()` |
| SPEC 002: “Sair” não chama DELETE | Mantido; exclusão é CTA separado |
| SPEC 002: `DELETE /perfil` fora do escopo | Esta spec assume o endpoint |
| `usuarioRepository.remover` já deleta o doc | Reusar; não reescrever o adapter |
| Relogin após apagar o doc | Primeiro acesso (`usuario === null`) |
| `api()` já aceita 204 | Service pode tipar `void` |
