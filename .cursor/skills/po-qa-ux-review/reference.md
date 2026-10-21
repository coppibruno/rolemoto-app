# Referência — Jornadas e checklist Rolemoto

Usar sob demanda durante o review. Não precisa cobrir tudo se o escopo for uma tela.

## Conta de acesso (QA / review)

Use esta conta para entrar no sistema durante revisões PO/QA:

| Campo | Valor |
|-------|--------|
| E-mail | `useradmingoogle@gmail.com` |
| Senha | `User@admin2026` |

Login: e-mail/senha na tela `/login` (não é o fluxo Google, apesar do endereço).

## Mapa de jornadas

| ID | Jornada | Rotas / superfície | Happy path |
|----|---------|--------------------|------------|
| J1 | Entrar | `/login`, Google / e-mail | Login → feed ou primeiro acesso |
| J2 | Completar perfil | `/primeiro-acesso` | Nome, moto, ritmo (foto opcional) → home |
| J3 | Descobrir rolê | `/` aba Rolês | Raio + filtros → card → detalhe |
| J4 | Pedir vaga | detalhe rolê | Solicitar → estado pendente claro |
| J5 | Aprovar piloto | `/aprovacoes` (líder) | Aceitar/recusar com feedback |
| J6 | Criar rolê | `/criar-role` | Form + mapa + publicar |
| J7 | Eventos | `/` aba Eventos, detalhe, inscrição | Ver → inscrever → ingresso se pago |
| J8 | Locais | `/` aba Locais, favoritar, avaliar | Ver → ♥ → avaliar |
| J9 | Garagem | `/meus-roles` | Abas Rolês / Eventos / Locais |
| J10 | Perfil | `/perfil`, `/perfil/[uid]` | Editar próprio; ler público |
| J11 | Telemetria | `/gravar-role`, `/telemetria/[id]` | Iniciar → tela off → finalizar → resumo |
| J12 | Excluir conta | perfil + `/excluir-conta` | Confirmar → conta apagada / instruções |

## Checklist por área

### Auth e onboarding (J1–J2)
- [ ] Erro de senha/Google legível (sem código cru)
- [ ] Loading no botão impede double-submit
- [ ] Primeiro acesso: obrigatórios claros; cidade opcional não parece bug
- [ ] Foto: preview, falha de upload, tamanho

### Feed (J3, J7, J8)
- [ ] Abas Rolês / Eventos / Locais com contagem coerente
- [ ] Raio (25/50/100/sem limite) óbvio e persistente na sessão
- [ ] Busca unificada não “some” com filtro
- [ ] Empty state com próximo passo (ajustar raio / criar)
- [ ] Card: data, lugar, ritmo/tipo legíveis em 1 olhar
- [ ] Distância / ★ / favorito sem poluir CTA

### Rolê comboio (J4–J6)
- [ ] Pedir vaga vs já pediu vs aceito vs criador — estados distintos
- [ ] Fila de aprovação: quem é, moto, ações claras
- [ ] Criar/editar: mapa usável no celular; validação antes do submit
- [ ] Cancelar rolê: confirm + consequência clara

### Eventos e locais (J7–J8)
- [ ] Piloto comum não vê CTA de criar evento/local (só admin no `+`)
- [ ] Inscrição imediata vs ingresso pago (modal com link)
- [ ] Avaliar só quando faz sentido (evento encerrado / local)
- [ ] Favorito: feedback visual imediato

### Garagem e perfil (J9–J10)
- [ ] Abas e pills não confundem “feitos” vs “inscritos” vs “favoritos”
- [ ] CTAs Avaliar / Ver relato corretos
- [ ] Perfil público: só leitura; histórico faz sentido

### Telemetria (J11) — alta reclamação típica
- [ ] Antes de iniciar: precisa app nativo? copy clara na PWA
- [ ] Permissão GPS: quando / por quê / o que fazer se negar
- [ ] Gravando: status óbvio (mesmo com tela off no nativo)
- [ ] Finalizar: métricas + falha de rede explicada
- [ ] Compartilhar: funciona Android e fallback iOS/web

### Shell / navegação global
- [ ] Dock: Home, criações (`+`), perfil — sem sobrepor conteúdo
- [ ] Header: voltar, título, ações sem squeeze
- [ ] Toast/modal: uma camada; dismissível
- [ ] Landscape / teclado: CTA ainda alcançável

### Loja / Capacitor
- [ ] Deep link (`/eventos/`, `/locais/`, `/roles/`, etc.) abre tela certa
- [ ] Push: permissão e card fazem sentido
- [ ] Exclusão de conta descoberta no perfil

## Como priorizar reclamações

1. Agrupe por jornada (J1–J12), não por “tela bonita”.
2. Conte quantos relatos batem no mesmo achado.
3. P0/P1 primeiro; P3 só se sobrar tempo.
4. Prefira correção mínima que desbloqueia o happy path.

## Fontes no repo

| Tipo | Onde |
|------|------|
| Spec funcional | `docs/specs/*.md` |
| Mock visual | `designs/*/DESIGN.md` |
| Mobile / GPS / loja | `docs/mobile.md` |
| Rotas app | `src/app/(app)/`, `src/app/(auth)/` |
