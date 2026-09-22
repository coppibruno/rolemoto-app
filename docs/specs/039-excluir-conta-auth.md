# SPEC 039 — Exclusão de conta completa (Auth + dados)

> **Status:** Implementada  
> **Autor:** Assistente IA  
> **Data:** 2026-09-21  
> **Origem:** backlog — excluir conta só zera `users`; Auth permanece e o login cai em `/primeiro-acesso`  
> **Padrões:** Next.js 15 + Cloud Function `api` + Firebase Admin Auth  
> **Backend:** `DELETE /perfil`  
> **Depende de:** SPEC 006 (excluir conta — **estende** o que foi deixado de fora: Auth), SPEC 011 (primeiro acesso), SPEC 013 (`dispositivos`)  
> **QA:** ID **E1**

---

## 1. Objetivo

Ao confirmar **Excluir minha conta**, o piloto deixa de existir de verdade no produto:

1. Remove perfil Firestore (`users/{uid}`) — já feito.
2. Remove tokens FCM (`dispositivos`) — já tentado.
3. **`adminAuth.deleteUser(uid)`** — **novo** (SPEC 006 tinha excluído de propósito).
4. Front: `logout` / sessão inválida → `/login` (não `/primeiro-acesso` com uid fantasma).

| ID | Entrega |
|----|---------|
| **E1** | Conta Auth apagada; novo login com mesmo e-mail/Google é cadastro novo, não onboarding órfão |

---

## 2. ID de teste

| ID | Área | Severidade | Sintoma | Critério de aceite | Como testar |
|----|------|------------|---------|--------------------|-------------|
| **E1** | Conta | Crítica | Após “excluir”, login → `/primeiro-acesso` com uid antigo | `DELETE /perfil` 204; Auth user some; login de novo cria **novo** uid ou fluxo de cadastro limpo; sem doc `users` velho | Excluir → tentar mesmo e-mail/senha ou Google |

---

## 3. Por que quebra hoje

SPEC 006 § “O que o mock mostra e não entra”:

> Apagar Auth, Storage, rolês e solicitações — Pedido desta spec: apagar o usuário **no banco** (`users`) e deslogar

Efeito: Firebase Auth mantém o uid → GuardaApp vê sessão válida sem `users/{uid}` → manda para **primeiro acesso** (011). Os dados “zerados” são só o documento de perfil.

---

## 4. Contrato `DELETE /perfil`

Ordem sugerida (mesma request, Bearer válido):

1. `uid` só do token.
2. Remover `dispositivos` do uid (já).
3. Remover `users/{uid}` (já).
4. **`await adminAuth.deleteUser(uid)`**.
5. `204`.

Se `deleteUser` falhar depois de apagar Firestore:

- Log error.
- Preferir **500** com mensagem genérica para o client **não** achar que terminou — ou compensar: não apagar Firestore antes do Auth (ordem inversa).

**Ordem recomendada (mais segura):**

1. Listar o que precisa limpar (opcional).
2. `adminAuth.deleteUser(uid)` **primeiro** (invalida sessão em outros devices).
3. Remover `users`, `dispositivos`, e o que mais couber nesta spec.

Se Auth já não existir (`user-not-found`): tratar como sucesso parcial e seguir limpando Firestore (idempotência).

### 4.1 Cascata nesta entrega (mínimo)

| Recurso | Nesta spec? |
|---------|-------------|
| `users/{uid}` | Sim |
| `dispositivos` do uid | Sim |
| Firebase Auth user | **Sim (novo)** |
| Storage (foto perfil / capas) | Desejável: apagar prefixo `users/{uid}/` se existir; senão follow-up |
| `usersrole`, `usersevento`, feedbacks, favoritos | Follow-up (órfãos); **não** bloquear E1 |
| Rolês que criou | Follow-up (ou soft — fora) |

Documentar órfãos como dívida: não reabrir SPEC 006 inteira.

---

## 5. Front

Após `204`:

1. `signOut()` / `logout()` local.
2. `router.replace('/login')`.
3. Toast opcional: “Conta excluída”.

Não navegar para `/primeiro-acesso`.

Tratar 401/500: manter modal aberto + erro; não mentir sucesso.

Providers:

- E-mail/senha: próximo `createUser` / login falha até novo cadastro.
- Google: próximo login cria **novo** uid no Auth (Firebase) — onboarding 011 do zero.

---

## 6. Checklist

- [x] `DELETE /perfil` remove usuário do Auth (Admin SDK).
- [x] Sessão atual encerra; refresh não volta autenticado.
- [x] Login com mesmas credenciais não reabre perfil antigo (uid/doc sumiram).
- [x] Fluxo feliz cai em `/login`, nunca em primeiro-acesso com dados fantasmas.
- [x] Idempotência: segundo DELETE (token já inválido) → 401.

---

## 7. Segurança / copy

- Modal da 006 permanece; reforçar copy se necessário: “Não será possível entrar de novo com esta conta.”
- Rate limit do DELETE (já autenticado) mantido.
- Nunca aceitar `uid` no body.

---

## 8. Fora de escopo

- GDPR export completo.
- Anonimizar posts / transferir rolês a outro líder.
- Soft-delete com período de graça.
- Apagar todo Storage histórico de avaliações nesta entrega (pode ser 039.1).
