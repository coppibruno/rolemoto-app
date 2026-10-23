---
name: desenvolvimento-design
description: >-
  Implementa UI alinhada ao design system do Rolemoto (tokens CSS, CSS Modules,
  mobile-first, dark cockpit) e valida o lint e o tsc que o predeploy do
  Firebase executa em functions/ antes do deploy. Use ao criar ou alterar
  telas, componentes, CSS, estilos, ou código em functions/.
---

# Desenvolvimento alinhado ao design

UI nova segue o design system já implementado. Mudança em `functions/` só está pronta depois do mesmo lint e do mesmo `tsc` que o Firebase roda no deploy.

Arquitetura de pastas, hooks e services: skill `nextjs-patterns`. Aqui é visual + portão de deploy.

## UI

1. Se a tela existir em `designs/<pasta>/DESIGN.md`, leia o mock antes de inventar layout.
2. Cor, ritmo e medida vêm de `var(--*)` em `src/app/globals.css`. Significado dos tokens: `.cursor/rules/design-system.mdc`. Não copie hex. Não instale Tailwind nem crie pasta `pages/` na raiz.
3. Estilo no CSS Module da feature (`*.module.css`), um componente por arquivo, arrow function, nome de domínio em português.
4. Mobile primeiro: conteúdo até `560px` centrado, gutter `var(--gutter-md)` (16px), alvo de toque `var(--touch-min)` (48px) e CTA `var(--touch-target)` (56px). Barra fixa respeita `env(safe-area-inset-bottom)`.
5. Dark only. Texto corrido herda Plus Jakarta Sans do `body`. Título, badge, número e CTA usam `"Barlow Condensed", sans-serif`. Ícone: `<span className="material-symbols-outlined" aria-hidden>nome</span>`.

### Receitas

CTA primário (laranja, texto escuro, glow):

```css
.cta {
  min-height: var(--touch-target);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  background: var(--primary-container);
  color: var(--on-primary-container);
  font-family: "Barlow Condensed", sans-serif;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  box-shadow: 0 4px 16px rgba(255, 107, 0, 0.35);
}
```

| Peça | Como |
|---|---|
| Card | fundo `var(--surface-container-low)`, `border-radius: 1.5rem`, padding `var(--card-padding-md)` |
| Secundário | fundo `var(--surface-container-high)`, texto `var(--on-surface)` |
| Input | fundo `var(--surface-container-lowest)`, texto `var(--on-surface)`, placeholder `var(--outline)` |
| Link | `var(--primary-container)`; hover `var(--primary)` |
| Ritmo | `var(--ritmo-agressiva)`, `var(--ritmo-moderada)`, `var(--ritmo-tranquila)`; fundo ~15% |
| Erro | texto `var(--error)`, fundo `var(--error-container)` |
| Telemetria / GPS | `var(--tertiary)` |
| Foco visível | `outline: 2px solid var(--primary-container)` |

Chip de filtro: altura 32px, pill, fundo `#22252B` (sem token). Inativo: `var(--outline)`. Ativo: borda e texto `var(--primary-container)`.

## Functions — lint do deploy

`firebase.json` → `functions.predeploy` roda, nesta ordem, com `RESOURCE_DIR=functions`:

```bash
npm --prefix "$RESOURCE_DIR" run lint   # eslint --ext .js,.ts .
npm --prefix "$RESOURCE_DIR" run build  # tsc
```

O deploy aborta se um dos dois falhar. O `npm run lint` da raiz é o Next e **não** entra nesse predeploy.

Ao editar qualquer arquivo em `functions/`, antes de encerrar:

```bash
cd functions && npm run lint && npm run build
```

Corrija e rode de novo. Não desligue regra para passar. Não edite `functions/lib/` (saída do `tsc`, ignorada pelo ESLint).

Regras que mais derrubam o deploy: [reference.md](reference.md).
