# Backlog pós-MVP — índice de specs e IDs de QA

> **Data:** 2026-09-21  
> **Uso:** um cenário de teste / PR por **ID** (não precisa fechar a spec inteira de uma vez).

## Ordem sugerida

1. F2, C1 → 2. E1 → 3. N1 → 4. F1 → 5. A1 → A2 → 6. P1 → P2 → 7. L1 → L2 → 8. G2 → G3 → G1

## Mapa

| Spec | Arquivo | IDs | Resumo |
|------|---------|-----|--------|
| **032** | [032-mapa-geocoding-sul.md](./032-mapa-geocoding-sul.md) | G1, G2, G3 | Mapa no criar rolê; só SC/PR/RS; busca inteligente |
| **033** | [033-capa-role-opcional.md](./033-capa-role-opcional.md) | C1 | Foto de capa opcional |
| **034** | [034-notificacao-cancelamento-role.md](./034-notificacao-cancelamento-role.md) | N1, N1b | Push ao cancelar rolê (bugfix) |
| **035** | [035-detalhe-lider-aprovacoes.md](./035-detalhe-lider-aprovacoes.md) | L1, L2 | Detalhe do líder + Meus Rolês vs fila |
| **036** | [036-perfil-publico-layout-share.md](./036-perfil-publico-layout-share.md) | P1, P2 | Layout perfil público + compartilhar |
| **037** | [037-avaliacoes-link-e-edicao.md](./037-avaliacoes-link-e-edicao.md) | A1, A2 | ★ → listagem; editar avaliação |
| **038** | [038-feed-fila-e-proximos.md](./038-feed-fila-e-proximos.md) | F1, F2 | Ocultar fila no feed; próximos sem teto 30d |
| **039** | [039-excluir-conta-auth.md](./039-excluir-conta-auth.md) | E1 | Apagar Auth + perfil |

## Como testar separado

1. Criar card no Notion/Jira por **ID** (ex. `F2 — próximos rolês sem teto`).
2. Copiar a linha “Critério de aceite / Como testar” da tabela da spec.
3. Marcar Done só quando o checklist daquele ID passar.
4. Evitar misturar IDs de domínios diferentes no mesmo PR (ex. G1 + A2).

## Specs antigas que estas revisam

| Nova | Relação |
|------|---------|
| 032 | Estende / revoga “sem mapa” da **019** |
| 033 | Revoga capa obrigatória da **004** |
| 034 | Bugfix da **021** §6.3 + **013** |
| 035 | Estende **007** + **017** |
| 036 | Fecha gaps da **025** |
| 037 | Revoga “sem PATCH” da **027** |
| 038 | Ajusta **003** / **024** + `quando.ts` |
| 039 | Estende **006** (passa a apagar Auth) |
