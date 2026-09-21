# SPEC 034 — Notificação ao cancelar rolê (bugfix)

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-21  
> **Origem:** backlog — líder cancelou com confirmados; confirmados não foram notificados  
> **Padrões:** Cloud Function `api` + FCM (SPEC 013)  
> **Backend:** `DELETE /roles/:id` + `notificarCancelamentoRole`  
> **Depende de:** SPEC 013 (push), SPEC 021 §6.3 (cancelamento + push aos aceitos — **já especificado**), SPEC 017 (Meus Rolês)  
> **QA:** ID **N1** (e **N1b** diagnóstico)

---

## 1. Objetivo

Garantir que, ao **cancelar/excluir** um rolê, todo piloto **confirmado** (`usersrole.aceito === true`) receba push **Rolê cancelado**.

A SPEC 021 e o código atual **já** chamam `notificarCancelamentoRole` após listar confirmados. O relato de campo indica falha ponta a ponta — esta spec é **bugfix + hardening**, não feature nova.

| ID | Entrega |
|----|---------|
| **N1** | Confirmados recebem FCM ao cancelar; pendentes não |
| **N1b** | Diagnóstico: logs + causas conhecidas documentadas e mitigadas |

---

## 2. IDs de teste

| ID | Área | Severidade | Sintoma | Critério de aceite | Como testar |
|----|------|------------|---------|--------------------|-------------|
| **N1** | Push | Alta | Cancelou e ninguém avisou | Device do confirmado (permission granted + token em `dispositivos`) recebe title/body da 021 | 2 contas: A líder, B aceito; A cancela; B recebe |
| **N1b** | Observabilidade | Média | Falha silenciosa | Log estrutura: roleId, uids notificados, tokens encontrados, erros FCM; request DELETE ainda 204 | Emulator/prod logs no cancelamento |

---

## 3. Baseline do código (não reinventar)

Em `DELETE /roles/:id` (já implementado):

1. Autorizar dono/admin.
2. `listarConfirmadosDoRole`.
3. Cancelar lembretes (020).
4. `Promise.all` → `notificarCancelamentoRole(uid, id, titulo)` para cada aceito ≠ criador.
5. Remover `usersrole` do roleId + documento `roles`.
6. `204`.

Copy (021 / `notificacoes.ts`):

| Campo | Valor |
|-------|--------|
| title | Rolê cancelado |
| body | `{titulo} foi cancelado pelo organizador.` |
| url | `/meus-roles` |
| tipo | `cancelamento_role` |

Pendentes **não** recebem push (ainda não estavam no comboio) — manter.

---

## 4. Hipóteses de falha (investigar nesta entrega)

| # | Hipótese | Mitigação |
|---|----------|-----------|
| 1 | Piloto sem token em `dispositivos` / permissão denied | Registrar token no shell (013); no cancelamento logar “0 tokens” |
| 2 | `enviar` engole erro e DELETE segue 204 | Manter 204 (não falhar domínio), mas **log warn** com uid + código FCM |
| 3 | Só notifica `aceito: true` e o teste usou pendente | Documentar no QA; copy do modal de cancelar: “pilotos **confirmados** serão notificados” |
| 4 | Token stale / webpush | Limpar tokens inválidos no `enviar` (já pode existir — reforçar) |
| 5 | Cancelamento pela UI não chama `DELETE` | Verificar Meus Rolês / detalhe usam o endpoint certo |
| 6 | Emulator Auth/FCM sem credencial real | Teste N1 em ambiente com FCM configurado |

---

## 5. Hardening mínimo

1. Antes do `Promise.all`, log info: `{ roleId, confirmados: n, aNotificar: uids[] }`.
2. Em `notificarCancelamentoRole` / `enviar`: se zero tokens, log warn explícito (não silencioso).
3. Confirmar que a UI de cancelar usa o mesmo `DELETE` (não só remove local).
4. Opcional UX: toast no líder “X piloto(s) serão notificados” com base no count de aceitos (já pode existir no confirm).

**Não** exigir `usersrole.notificar === true` para cancelamento — o rolê sumiu; o aceite já implica interesse. (Se o código atual filtrar por `notificar`, **remover** esse filtro para cancelamento.)

---

## 6. Checklist

- [ ] N1 passa com dois devices reais (ou Chrome + permissão).
- [ ] Pendente não recebe; confirmado recebe.
- [ ] DELETE continua 204 mesmo se FCM falhar.
- [ ] Logs permitem auditar “quem deveria ter sido notificado”.
- [ ] Modal/copy fala em confirmados, não em toda a fila.

---

## 7. Fora de escopo

- Notificar pendentes.
- Central de notificações in-app.
- E-mail / WhatsApp.
- Soft-delete do rolê (continua hard delete da 021).
