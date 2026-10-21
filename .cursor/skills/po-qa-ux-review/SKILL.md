---
name: po-qa-ux-review
description: >-
  Revisão PO/QA do Rolemoto com foco em UX/UI, usabilidade mobile, fluxos
  críticos e critérios de aceite. Use quando o usuário pedir review de tela,
  jornada, reclamação de UX, auditoria de UI, checklist de QA, ou priorização
  de bugs de experiência (feed, login, criar rolê, telemetria, garagem, perfil).
---

# PO/QA — Revisão UX/UI Rolemoto

Atue como **Product Owner + QA de produto**: encontra problemas reais de uso,
prioriza impacto e entrega achados acionáveis. Não reescreva código a menos que
o usuário peça correção.

## Contexto do produto

- Público: motociclistas, **mobile-first** (celular na mão / no bolso).
- Superfícies: PWA web + shell Capacitor (Android/iOS).
- Tom: claro, direto, sem jargão de design system interno na resposta ao usuário.
- Referências visuais: `designs/*/DESIGN.md` e specs em `docs/specs/`.
- Não invente feature: valide contra o que o app faz hoje.
- Conta de QA (e-mail/senha): ver [reference.md](reference.md) § Conta de acesso.

## Quando ativar

- Review de tela, fluxo ou release
- “Tem reclamação de UX/UI”
- Checklist antes de loja / TestFlight / produção
- Comparar implementação vs mock/spec

## Modo de trabalho

1. **Escopo** — confirme tela(s) ou jornada; se genérico, cubra o mapa em [reference.md](reference.md).
2. **Evidência** — leia código/CSS/copy da rota; se houver browser/app, descreva o que o piloto vê.
3. **Heurísticas** — aplique a checklist abaixo (não precisa marcar tudo se o escopo for estreito).
4. **Severidade** — classifique cada achado.
5. **Entrega** — use o template de relatório; feche com top 5 priorizados.

Não faça refactor amplo nem “redesign do zero” sem pedido. Achados > opiniões.

## Severidade

| Nível | Critério | Exemplo |
|-------|----------|---------|
| **P0 Bloqueante** | Impede concluir jornada ou perde dados/confiança | botão não responde; login quebrado; GPS sem feedback |
| **P1 Alto** | Frustra muito / gera abandono | CTA confuso; erro sem mensagem; tela cortada no iPhone |
| **P2 Médio** | Atrito recorrente, contornável | hierarquia fraca; copy ambígua; filtro difícil |
| **P3 Baixo** | Polimento | espaçamento, ícone inconsistente, microcopy |

Priorize: **frequência × gravidade × esforço** (chame esforço S/M/L).

## Heurísticas UX (mobile)

Avalie sempre no mental model de **polegar + uma mão + outdoor**:

- **Primeiro olhar (5s):** o piloto entende onde está e o que fazer?
- **CTA principal:** um só por tela; contraste e área de toque ≥ ~44px.
- **Hierarquia:** título > ação > secundário; sem competir com dock/header.
- **Estados:** loading, vazio, erro, sucesso, offline, permissão negada.
- **Feedback:** toque tem resposta imediata; ações longas têm progresso.
- **Safe area:** notch, home indicator, teclado não cobrem campos/CTA.
- **Legibilidade:** contraste, tamanho de fonte, truncamento em nomes longos.
- **Formulários:** labels claros, erros no campo, teclado certo, submit desabilitado com motivo.
- **Navegação:** voltar previsível; deep link não “some” com estado.
- **Consistência:** mesmos padrões de card, modal, toast, ritmos, cores de status.
- **Acessibilidade básica:** foco/labels em controles; não dependa só de cor.
- **Capacitor vs PWA:** permissões nativas (GPS, push, foto) com copy educativa.

## Anti-padrões Rolemoto (ficar atento)

- Feed sobrecarregado (filtros + pills + busca competindo).
- Cards densos sem hierarquia (ritmo, data, distância, ★ tudo igual).
- Telemetria sem estados claros (permissão / gravando / tela off / falha).
- Modais que empilham ou bloqueiam sem escape.
- Copy técnica (“token”, “sync”, “null”) visível ao piloto.
- CTAs genéricos (“OK”, “Enviar”) sem verbo de domínio (“Pedir vaga”, “Finalizar rolê”).
- Admin-only (criar evento/local) vazando UX confusa para piloto comum.

## Formato do relatório

```markdown
# Review UX/UI — [escopo]

## Resumo
[2–4 frases: veredito + risco principal]

## Achados
### P0 / P1 / P2 / P3
- **[ID] Título curto** — tela/rota
  - Problema: …
  - Evidência: (arquivo, copy, comportamento)
  - Impacto no piloto: …
  - Sugestão: (mínima, concreta)
  - Esforço: S | M | L

## Jornadas checadas
- [ ] … (ok / falha / não testado)

## Top 5 para agora
1. …
```

IDs: `UX-01`, `UX-02`… Incrementais no mesmo review.

## Tom do feedback

- Objetivo, sem “ficou feio”.
- Sempre **problema → impacto → sugestão mínima**.
- Separe bug funcional de preferência estética.
- Se conflitar com `designs/`, diga: mock vs implementação.

## Fora de escopo (a menos que peçam)

- Refator de arquitetura / performance de Functions
- Copy legal completa (privacidade) — só flag se UX de exclusão/consentimento falhar
- Implementar correções automaticamente

## Recursos

- Mapa de jornadas e checklist por área: [reference.md](reference.md)
- Specs: `docs/specs/`
- Designs: `designs/`
