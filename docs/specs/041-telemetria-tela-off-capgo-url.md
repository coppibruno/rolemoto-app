# SPEC 041 — Telemetria com tela off (Capgo native POST)

> **Status:** Implementado  
> **Autor:** Assistente IA  
> **Data:** 2026-09-22  
> **Origem:** APK — notificação e “Permitir o tempo todo” OK; km/velocidade não avançavam com tela desligada  
> **Padrões:** Capacitor 8 + `@capgo/background-geolocation` + Cloud Functions  
> **Depende de:** SPEC 030 (gravação standalone), SPEC 029 (intenção nativa)  
> **QA:** ID **T1**

---

## 1. Problema

O adapter nativo agregava métricas **só no callback JavaScript** (`aplicarPonto` → Preferences). Com a tela off o WebView congela: o foreground service e a notificação continuam, mas o JS não recebe pontos → distância/velocidade/tempo de movimento ficam congelados.

A SPEC 029/030 pediam: *nativo segura o GPS; web só orquestra*. A entrega anterior não cumpria isso.

## 2. Solução

Usar a opção Capgo **`url`** (desde 8.2): cada fix é POSTado **do código nativo** (paralelo ao callback JS), com `START_STICKY` no Android.

| Camada | Papel |
|--------|--------|
| Capgo FGS | GPS + notificação + POST nativo |
| `POST /telemetria/sessao/:id/ponto` | Agrega no Firestore (`telemetriasessao`) com a mesma lógica de `calcular-metricas` |
| Header `X-Rolemoto-Sessao-Token` | Segredo de sessão (não JWT Firebase — JWT expira ~1 h com tela off) |
| Front ao Finalizar | `GET /telemetria/sessao/:id` → mescla com Preferences local → resumo → `DELETE` sessão → `POST /telemetria` como antes |

Callback JS permanece para UI com tela ligada; **fonte da verdade no Finalizar** é o servidor (se tiver mais distância).

## 3. API

| Método | Rota | Auth | Notas |
|--------|------|------|--------|
| `POST` | `/telemetria/sessao` | Bearer | Cria sessão; encerra outras do mesmo uid; `{ id, token, iniciadoEm }` |
| `POST` | `/telemetria/sessao/:id/ponto` | `X-Rolemoto-Sessao-Token` | Body = Location Capgo + `source: "native"`; **204** |
| `GET` | `/telemetria/sessao/:id` | Bearer (dono) | Agregados ao vivo |
| `DELETE` | `/telemetria/sessao/:id` | Bearer (dono) | Limpa após Finalizar |

Coleção Firestore: `telemetriasessao` (efêmera; max 24 h).

Rate limit do ponto: 600/min por IP+sessão.

## 4. Limitações (honestas)

- Capgo **não** enfileira POSTs offline — sem rede, pontos nativos podem se perder (callback JS também não roda com tela off).
- Iniciar gravação nativa **exige internet** (abrir sessão remota).
- iOS: matar o app pelo switcher ainda pode encerrar o GPS (limitação do SO).

## 5. QA — T1

| ID | Critério | Como testar |
|----|----------|-------------|
| **T1** | Tela off ≥ 10 min com dados móveis → distância > 0 ao Finalizar | Device real; Sempre + notificação; Iniciar → apagar tela → andar → Finalizar |

Checklist:

- [ ] Notificação “Rolemoto / Registrando seu rolê” visível com tela off
- [ ] Após 10+ min, Finalizar mostra km ≈ trajeto
- [ ] Sem internet no Iniciar → mensagem clara (não inicia)
- [ ] PWA inalterada (sem fingir tela off)

## 6. Arquivos

| Arquivo | Ação |
|---------|------|
| `functions/src/routes/telemetria.ts` | Sessão + ponto |
| `functions/src/lib/telemetria-sessao.ts` | Token + ingestão |
| `functions/src/lib/calcular-metricas-telemetria.ts` | Espelho do front |
| `functions/src/repositories/firestore/firestore-telemetria-sessao.repository.ts` | Persistência |
| `src/lib/telemetria/telemetria-gps.native.ts` | Capgo `url` + merge |
| `docs/mobile.md` | Roteiro atualizado |

## 7. Deploy

```bash
npx -y firebase-tools@latest deploy --only functions
# front em produção (URL remota do Capacitor) + novo APK após sync se houver mudança nativa
```

Não há mudança de plugin nativo além das opções `url`/`headers` já suportadas pelo Capgo 8.4.x — `npx cap sync` recomendado após release do front.
