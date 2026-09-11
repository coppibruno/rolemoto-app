# SPEC 014 — Ajustes dos bugs do checkup E2E

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-10  
> **Origem:** checkup E2E em Chromium 390×844 (`localhost:3000` + emulator das functions)  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade  
> **Backend:** Cloud Function `api` (Express) — **B2** (`POST /auth/resolver`, sem Bearer) e **B6** (`GET /roles`)  
> **Depende de:** SPEC 002 (perfil), SPEC 003 (feed + `distanciaKm`), SPEC 005 (sheet de participar), SPEC 007 (fila), SPEC 011 (primeiro acesso), SPEC 012 (PWA)

---

## 1. Objetivo

Fechar os **defeitos confirmados no checkup E2E** — fluxos que a UI promete e não cumpre, ou que cumprem a API e escondem o resultado do piloto.

Esta spec **não** abre feature nova (mapa, unicidade de apelido, cidade no perfil, login social extra). Cada item reabre um recorte já existente e o deixa utilizável.

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | Recuperar senha, login por e-mail **ou** apelido, nome do Google, CTA PWA, sheet de participar, **duas** distâncias no card, overflow mobile, chaves das sugestões, moto/garupa no perfil |
| Back (Functions) | Resolver apelido → e-mail no login; no feed enviar km até a partida **e** km da rota |

Sem mock Stitch novo. Reusar tokens, sheets e toasts já existentes.

---

## 2. Origem e recorte

Rodada em 2026-09-10, viewport **390×844**, Auth/Firestore de produção, functions no emulator.

### 2.1 O que esta spec corrige

| ID | Área | Severidade | Sintoma no E2E |
|----|------|------------|----------------|
| **B1** | Login | Alta | **Esqueceu a senha?** não abre fluxo |
| **B2** | Login | Alta | Campo **E-mail ou Apelido** promete os dois; apelido devolve `Email inválido.` |
| **B3** | Primeiro acesso | Alta | Nome do Google **não dá para apagar** |
| **B4** | PWA | Alta | **Adicionar à tela inicial** no Chrome não faz nada |
| **B5** | Participar | Alta | Pedido é gravado; a tela do piloto fica **vazia** |
| **B6** | Feed | Alta | Um único badge KM: ou some a partida, ou some o comprimento da rota |
| **B7** | Perfil | Média | Moto e garupa do onboarding **não editam** |
| **B8** | Criar rolê | Média | Warning React: **duas children com a mesma key** nas sugestões |
| **B9** | Mobile | Média | Placeholders e chips **cortados** em 390px |

### 2.2 O que passou e **não** reabre

Cadastro e-mail/senha (senha fraca, senhas diferentes), erro de campos vazios, erro de credencial inválida, onboarding por e-mail, GPS, chips de filtro, publicar rolê, **Aceitar** na fila (toast incluso), salvar nome/apelido/ritmo/foto no perfil.

### 2.3 Fora desta spec

| Item | Motivo |
|------|--------|
| Login Google OAuth ponta a ponta | Exige conta real; o defeito do nome é o **B3** |
| Recusar na fila | Botão e `confirm` já existem (SPEC 007); só não houve segundo pedido no run |
| Campo **cidade** | SPEC 002 deixou fora; continua fora |
| Unicidade forçada de apelido no `POST /perfil` | SPEC 011 já recortou; o resolver do B2 usa o **primeiro** documento com aquele apelido |
| Filtro por cilindrada | SPEC 003 deixou fora |
| Esconder o FAB no meio do formulário de criar rolê | Dock fixo é o shell (SPEC 001); o padding-bottom do `conteudo` já reserva o CTA final |

---

## 3. Fluxos corrigidos

```
Login
  ├── Esqueceu a senha?  →  sheet pede e-mail (ou apelido)  →  Firebase reset
  ├── E-mail ou Apelido + senha  →  se não for e-mail, POST /auth/resolver  →  signInWithEmailAndPassword
  └── Adicionar à tela inicial
        ├── Android com beforeinstallprompt → prompt nativo
        ├── iOS → sheet Safari (já ok)
        └── Sem prompt e não-iOS → não mostrar CTA morto

Primeiro acesso (Google)
  └── Nome Completo pré-preenche 1 vez; apagar permanece vazio

Feed
  └── Card mostra os dois: km até a partida  e  km da rota (partida → destino)

Participar
  └── POST grava  +  sheet visível acima do dock

Perfil
  └── Editar moto e garupa (os mesmos campos do onboarding)
```

---

## 4. Ajustes

### B1 — Recuperar senha

**Hoje:** `FormularioLogin` renderiza `<button type="button">Esqueceu a senha?</button>` **sem** `onClick`. Não existe `sendPasswordResetEmail` em `src/lib/auth.ts`.

**Ajuste:**

- Clique abre um sheet (mesmo padrão `SheetInstalarIos` / `useFocoModal`).
- Campo identificador: e-mail **ou** apelido (pré-preenche o valor do login).
- Se parecer e-mail → `sendPasswordResetEmail` direto.
- Se for apelido → mesmo `POST /auth/resolver` do B2, depois `sendPasswordResetEmail` no e-mail resolvido.
- Sucesso: a mesma mensagem genérica, **exista ou não** a conta — não enumerar usuários.
- Erro de formato (identificador vazio): “Preencha o e-mail ou o apelido.”
- Sem Cloud Function extra além da do B2.

Copy:

| Estado | Texto |
|--------|--------|
| Título do sheet | Recuperar senha |
| Corpo | Enviamos um link para o e-mail da conta, se ele existir. |
| Sucesso | Se esse e-mail estiver cadastrado, você recebe o link em instantes. |
| CTA | Enviar link |

Arquivos: `src/lib/auth.ts`, `src/app/(auth)/login/components/FormularioLogin.tsx`, `src/app/(auth)/login/hooks/useLoginForm.ts` (ou hook `useRecuperarSenha`), novo `SheetRecuperarSenha.tsx`, `erros-firebase.ts` se faltar código.

### B2 — Login com e-mail **ou** apelido

**Hoje:** label **E-mail ou Apelido**, hint `@piloto`, placeholder `ghost_rider ou piloto@…`. `loginComEmail` manda o texto cru ao `signInWithEmailAndPassword`. Apelido → `auth/invalid-email` → **Email inválido.**

A UI **permanece**. O que muda é o fluxo: apelido vira o e-mail da conta **antes** do Firebase Auth.

**Ajuste:**

1. Trim; tira `@` inicial do apelido (`ghost_rider` e `@ghost_rider` são o mesmo).
2. Se o valor contém `@` (parece e-mail) → trata como e-mail, **não** chama a API. O input de login permanece `type="text"` por causa do apelido.
3. Senão → `POST /auth/resolver` `{ "identificador": "ghost_rider" }` **sem Bearer**.
4. 200 `{ "email": "…" }` → `signInWithEmailAndPassword(email, senha)` no client.
5. 404 / 400 / falha de rede → a **mesma** copy de credencial inválida já usada (`Email ou senha incorretos.`). Não dizer “apelido não existe”.

Modo **cadastro** continua só e-mail (`type="email"`, placeholder `seu@email.com`). Apelido nasce no primeiro acesso.

A rota **não** usa `autenticar` (o piloto ainda não tem token). Exceção documentada: é o único endpoint público além do health `GET /`.

Persistência: `usuarioRepository.buscarPorApelido(apelido)` (interface + adapter Firestore). A rota **não** chama `firestore.collection`. Com o `uid`, o e-mail sai de `adminAuth.getUser(uid)` — o documento `users` **não** guarda e-mail.

Se dois documentos tiverem o mesmo apelido (unicidade ainda não é enforced na SPEC 011), devolver 404 genérico — não escolher um no chute. Índice Firestore em `users.apelido` se a query exigir.

Cliente: `useLoginForm` + `src/lib/auth.ts` (ou um `authIdentificador.service.ts` fino com `api` **sem** token — o cliente HTTP atual manda Bearer se houver user; no login não há).

### B3 — Nome do Google editável

**Hoje** (`useFormularioPrimeiroAcesso`):

```ts
const [nome, setNome] = useState(firebaseUser?.displayName ?? "");

useEffect(() => {
  if (firebaseUser?.displayName && !nome) {
    setNome(firebaseUser.displayName);
  }
}, [firebaseUser, nome]);
```

Apagar o campo deixa `nome === ""` (falsy) e o efeito **recoloca** o `displayName`. `autocomplete="name"` no input reforça o autofill.

**Ajuste:**

- Pré-preencher **uma vez** (estado inicial + efeito que só roda se ainda não hidratou do Auth).
- Não voltar a escrever no campo quando o piloto apaga.
- `autoComplete="off"` no nome do onboarding (o valor inicial já veio do Google). Apelido e moto sem `name`.

Arquivo principal: `src/app/(auth)/primeiro-acesso/hooks/useFormularioPrimeiroAcesso.ts`. `SecaoDadosPiloto.tsx` só se mudar `autoComplete`.

### B4 — CTA PWA sem prompt nativo

**Hoje:** `mostrarCtaLogin = pronto && !eStandalone && !dispensado`. `instalar()` com evento nativo chama `prompt()`; no iOS abre o sheet; **senão retorna sem feedback**. SPEC 012 §4 já pedia: no desktop Chrome sem evento, **esconder o CTA**.

**Ajuste (fechar a 012):**

```ts
mostrarCtaLogin: pronto && !eStandalone && !dispensado && (podePromptNativo || eIos);
```

- Login: sem prompt e sem iOS → **não renderizar** badge/botão/“Agora não”.
- Perfil: `mostrarItemPerfil` igual — não deixar **Adicionar à tela inicial** morto no desktop. Se quiser o item no perfil desktop, o clique abre o **mesmo sheet do iOS** com copy adaptada (“No Chrome do celular: menu → Instalar app”). Preferir esconder; um sheet desktop é opcional.
- iOS permanece como está (E2E ok).

Arquivo: `src/hooks/useInstalacaoPwa.ts`. `CtaInstalarApp` / `BotaoInstalarApp` só se a condição do hook já filtrar.

### B5 — Sheet de participar visível

**Hoje:** `POST /roles/:id/participacao` grava (o líder vê o card na fila). No viewport 390×844 a tela do piloto mostrou só o header Cockpit + capa embaçada. Overlay `z-index: 35`, sheet `45`, dock `50` (`menu-inferior.module.css` e `app.module.css`).

O fundo do detalhe é `aria-hidden`. Se o sheet não empilha acima do dock, o piloto não vê confirmação e acha que falhou — o pedido **já foi** enviado (comportamento da SPEC 005, mantido).

**Ajuste:**

- Overlay + `sheetWrap` **acima do dock**: `z-index` ≥ **60** (o seletor de localização do feed já usa 60).
- `bottom` do sheet continua `calc(80px + env(safe-area-inset-bottom))` para não invadir o FAB.
- `useFocoModal` **não** pode disparar `onFechar` no mount. O sheet da SPEC 005 não tem `data-foco-inicial`; o primeiro focável não pode ser um controle que navegue embora.
- Overlay com `aria-hidden` não esconde o `role="dialog"` do sheet (o dialog fica **irmão**, não filho do overlay — já é assim; não inverter).
- Estado de carregamento até `detalhe` + `estado` existirem; não pintar só o fundo desfocado.

Arquivos: `confirmacao-role.module.css`, `OverlayConfirmacao.tsx`, `TelaConfirmacaoRole.tsx` / `useConfirmacaoParticipacao.ts` se o estado vazio for corrida de render.

### B6 — Duas distâncias no feed: partida **e** rota

**Hoje:** `paraFeedItem` usa só `distanciaRotaKm(localSaida, destinoFinal)`. O card tem **um** badge (`route` + `140 KM`). No E2E, um rolê saindo na Praça da Sé com o piloto em São Paulo apareceu como 140 km — que é Campos do Jordão, não o ponto de encontro.

As duas grandezas importam:

| Grandeza | Pergunta do piloto | Cálculo |
|----------|--------------------|---------|
| Até a partida | “Quão longe está a **saída**?” | Haversine(`lat`/`lng` da query → `localSaida`) |
| Rota | “Quantos km tem o **rolê**?” | Haversine(`localSaida` → `destinoFinal`) |

O filtro de raio **já** usa a primeira. O badge único só mostrava a segunda.

**Ajuste no `GET /roles` — `RoleFeedItem`:**

```ts
export type RoleFeedItem = Role & {
  distanciaPartidaKm: number; // até a saída, a partir do ponto do piloto
  distanciaRotaKm: number;    // comprimento partida → destino
  criador: RoleCriadorResumo;
};
```

```ts
const distanciaPartidaKm = Math.round(
  haversineKm(query.lat, query.lng, role.localSaida.lat, role.localSaida.lng),
);
const rotaKm = distanciaRotaKm(role.localSaida, role.destinoFinal);
return { ...role, distanciaPartidaKm, distanciaRotaKm: rotaKm, criador };
```

Remover `distanciaKm` do **item de feed** (era ambíguo). Detalhe / histórico / feedback **não** mudam nesta spec: continuam com o km da rota no copy “km totais” (SPEC 005 / 008 / 010).

**Ajuste no card (`CapaRole`):** dois badges à direita, mesma família visual do badge atual, compactos para 390px:

| Badge | Ícone | Texto visível | `aria-label` |
|-------|--------|---------------|--------------|
| Partida | `near_me` | `{n} km` | `{n} quilômetros até a partida` |
| Rota | `route` | `{n} km` | `{n} quilômetros de rota` |

Empilhar na vertical no canto superior direito (`badgeDir` vira coluna, gap 4px) para não brigar com o chip de ritmo à esquerda. Sem inventar mapa.

Arquivos: `functions/src/routes/roles.ts`, `functions/src/types/role.ts`, `src/types/role.ts`, `CapaRole.tsx` + `feed.module.css`, `RoleCard.tsx`.

### B7 — Moto e garupa no perfil

SPEC 002 recortou moto/cidade. SPEC 011 coleta moto + `garupaFrequente` e o rodapé diz que o perfil edita *nome, apelido, foto e ritmo*. A fila (SPEC 007) **mostra a moto**. O piloto não consegue corrigir um typo.

**Ajuste (estende 002, não inventa cidade):**

- Seção **Garagem** no `/perfil`, reusando o bloco do onboarding (modelo/cilindrada/ano + toggle garupa).
- Validação igual à SPEC 011 (`moto` trim, mínimo 2).
- `PUT /perfil` passa a aceitar `moto` e `garupaFrequente` **obrigatórios** (o documento já tem os campos).
- Tipos `UsuarioEdicao` no front e na function.

Não adicionar segunda moto, crop, nem cidade.

Arquivos: `src/app/(app)/perfil/**`, `src/types/user.ts`, `functions/src/types/usuario.ts`, `functions/src/routes/perfil.ts` (`validarUsuarioEdicao`), repositório só se o update já for `Partial` — persistir os dois campos.

### B8 — Key estável nas sugestões de endereço

**Hoje:** `key={`${item.lat}-${item.lng}-${item.label}`}` em `SugestoesEndereco` (criar rolê) e lista equivalente do feed. Nominatim devolveu duas linhas iguais para Campos do Jordão → *Encountered two children with the same key*. Next mostrou **1 Issue** na publicação.

**Ajuste:** `key={`${item.lat}-${item.lng}-${index}`}` ou incluir `osm_id` se o mapper passar a trazer. Deduplicar lat/lng/label iguais antes de renderizar.

Arquivos: `criar-role/components/SugestoesEndereco.tsx`, `feed/components/SeletorLocalizacao.tsx` (mesmo padrão).

### B9 — Overflow no mobile 390px

**Hoje:** placeholders e chips cortam (*motogrup*, *Sem limi*, *Restaurante do La*, *piloto@rolemoto.co*). Chips já têm `overflow-x: auto`; o último item some sem pista de scroll. Inputs não usam ellipsis no placeholder.

**Ajuste (mínimo):**

- Placeholder da busca do feed mais curto, ou `text-overflow: ellipsis` no input.
- Login: o placeholder **E-mail ou Apelido** permanece (B2); ellipsis no input para não cortar `ghost_rider ou piloto@…`.
- Criar rolê: placeholders de partida/destino menores **ou** ellipsis no input.
- Chips (feed e fila): fade/máscara à direita **ou** padding-right no scroller para o último chip não colar na borda. Não quebrar em duas linhas (o mock é uma faixa).

Sem redesenhar os filtros.

---

## 5. Arquitetura Next.js

Sem tela nova de rota. Sheets no login (B1, B4). Perfil ganha campos, não página. Participar só empilha o sheet que já existe.

Quebrar componente se passar de ~80 linhas (sheet de senha ≠ formulário de login). `"use client"` só nos hooks/sheets. `GET /roles` e o resolver de apelido usam `api()` no client; no login **não há** `currentUser`, e o helper já omite o Bearer — não inventar segundo cliente HTTP.

`POST /auth/resolver` é a **única** rota sem `autenticar`. Registrar em `index.ts` **antes** de qualquer router autenticado, sem middleware de token.

Não acessar Firestore na rota. B2 busca apelido **só** via `usuarioRepository`. B6 calcula as duas distâncias na route de `GET /roles` (já lista via repositório).

---

## 6. Contrato da API

### 6.1 Paths

`PUT /perfil`, `GET /roles`, participação e aprovações permanecem. **Novo:** `POST /auth/resolver` (público).

Health `GET /` inclui `"/auth/resolver"` na lista de rotas.

### 6.2 `POST /auth/resolver` (B2) — sem `Authorization`

Body:

```ts
{ identificador: string } // apelido, com ou sem @
```

Não enviar senha. Não aceitar e-mail neste endpoint (o client já pulou a API).

| Status | Body | Quando |
|--------|------|--------|
| 200 | `{ "email": string }` | Um único `users` com aquele apelido e o Auth tem e-mail |
| 400 | `{ "erro": "identificador inválido" }` | vazio, só `@`, ou parece e-mail |
| 404 | `{ "erro": "não encontrado" }` | zero ou **mais de um** documento; uid sem e-mail no Auth |

O front **não** mostra esses `erro` ao piloto — mapeia 400/404 para “Email ou senha incorretos.”

### 6.3 `PUT /perfil` (B7)

Body:

```ts
{
  nome: string;
  apelido: string;
  fotoUrl: string;
  pilotagem: "agressiva" | "moderada" | "tranquila";
  moto: string;              // NOVO nesta spec (já existe no documento)
  garupaFrequente: boolean;  // NOVO nesta spec
}
```

400 se `moto` trim `< 2` ou `garupaFrequente` não for boolean. 200 devolve `Usuario` completo. `cidade` inalterada.

### 6.4 `GET /roles` (B6)

Query igual à SPEC 003 (`lat`, `lng`, `raioKm`, `quando`, `data`, `ritmo`, `q`).

Cada item:

```ts
{
  // ...Role
  distanciaPartidaKm: number; // ponto da query → localSaida
  distanciaRotaKm: number;    // localSaida → destinoFinal
  criador: { uid, apelido, fotoUrl }
}
```

Não enviar `distanciaKm` no feed (nome velho). Raio continua filtrando por `localSaida`.

---

## 7. Auth (B1 + B2)

Reset de senha (B1), depois de ter o e-mail:

```ts
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebase";

export const enviarResetSenha = (email: string) =>
  sendPasswordResetEmail(auth, email);
```

Login (B2): `signInWithEmailAndPassword` **só** com o e-mail (digitado ou resolvido). Sem custom token, sem `httpsCallable`.

`adminAuth.getUser` na function do resolver: o e-mail mora no Auth, não no Firestore.

---

## 8. Critérios de aceite

### Login / PWA / onboarding

- [ ] **Esqueceu a senha?** abre sheet, envia reset (e-mail ou apelido resolvido), mostra copy genérica de sucesso.
- [ ] Login com e-mail + senha continua igual.
- [ ] Login com apelido (`ghost_rider` ou `@ghost_rider`) + senha correta entra no app.
- [ ] Apelido inexistente ou senha errada: **Email ou senha incorretos.** — nunca “Email inválido.” só porque não tinha `@`.
- [ ] Cadastro continua só com e-mail.
- [ ] Primeiro acesso com conta Google: apagar o nome deixa o campo vazio; concluir exige nome ≥ 2 (já existente).
- [ ] Chrome desktop sem `beforeinstallprompt`: CTA de instalar **ausente** no login.
- [ ] iOS: CTA continua abrindo o sheet Safari (regressão da SPEC 012).

### Feed / rolê / fila

- [ ] Card do feed mostra **os dois** km: até a partida (ícone `near_me`) e da rota (ícone `route`).
- [ ] Com piloto em SP e saída na Sé, o km de partida é da ordem de **unidades**, não ~140; o km de rota pode ser ~140 se o destino for Campos do Jordão.
- [ ] Filtro de raio continua usando só a partida.
- [ ] Detalhe/participar ainda pode mostrar km da **rota** (“km totais”).
- [ ] `/roles/:id/participar` após o POST mostra o sheet (aguardando/confirmado/recusado) **acima** do dock.
- [ ] Aceitar na fila continua como a SPEC 007 (sem regressão).
- [ ] Sugestões de endereço com lat/lng repetidos não geram warning de key no console.

### Perfil

- [ ] Dá para alterar moto e garupa e persistir no `PUT`.
- [ ] Fila do líder reflete a moto nova no próximo pedido.
- [ ] Nome, apelido, foto e ritmo continuam obrigatórios.

### Mobile

- [ ] Em 390px, placeholders do login e da busca do feed não cortam no meio da palavra (ellipsis ou copy mais curta).
- [ ] Último chip de raio/fila alcançável com scroll horizontal.

---

## 9. Arquivos impactados

| Arquivo | Ação |
|---------|------|
| `src/lib/auth.ts` | **Alterar** — `enviarResetSenha` |
| `src/app/(auth)/login/components/FormularioLogin.tsx` | **Alterar** — B1 (CTA reset); label/placeholder do B2 **permanecem** |
| `src/app/(auth)/login/hooks/useLoginForm.ts` | **Alterar** — B1 + resolver apelido antes do `signIn` |
| `src/app/(auth)/login/components/SheetRecuperarSenha.tsx` | **NOVO** |
| `src/app/(auth)/login/utils/erros-firebase.ts` | **Alterar** — se faltar código |
| `src/app/(auth)/login/services/identificador.service.ts` | **NOVO** — `POST /auth/resolver` via `api()`, sem exigir user |
| `functions/src/routes/auth.ts` | **NOVO** — `POST /resolver`, sem `autenticar` |
| `functions/src/index.ts` | **Alterar** — `app.use("/auth", authRouter)` + health |
| `functions/src/repositories/interfaces/usuario.repository.ts` | **Alterar** — `buscarPorApelido` |
| `functions/src/repositories/firestore/firestore-usuario.repository.ts` | **Alterar** — query `apelido ==` |
| `firestore.indexes.json` | **Alterar** — se a query de apelido exigir índice |
| `src/app/(auth)/primeiro-acesso/hooks/useFormularioPrimeiroAcesso.ts` | **Alterar** — B3 |
| `src/app/(auth)/primeiro-acesso/components/SecaoDadosPiloto.tsx` | **Alterar** — `autoComplete` |
| `src/hooks/useInstalacaoPwa.ts` | **Alterar** — B4 |
| `src/app/(app)/roles/[id]/participar/confirmacao-role.module.css` | **Alterar** — z-index B5 |
| `src/app/(app)/roles/[id]/participar/components/OverlayConfirmacao.tsx` | **Alterar** — se o foco fechar o sheet |
| `functions/src/routes/roles.ts` | **Alterar** — B6 `paraFeedItem` (duas distâncias) |
| `functions/src/types/role.ts` | **Alterar** — `RoleFeedItem` |
| `src/types/role.ts` | **Alterar** — `RoleFeedItem` |
| `src/app/(app)/feed/components/CapaRole.tsx` | **Alterar** — dois badges |
| `src/app/(app)/feed/feed.module.css` | **Alterar** — coluna `badgeDir` |
| `src/app/(app)/perfil/**` | **Alterar** — B7 campos + hook + service |
| `src/types/user.ts` | **Alterar** — `UsuarioEdicao` |
| `functions/src/types/usuario.ts` | **Alterar** — `UsuarioEdicao` |
| `functions/src/routes/perfil.ts` | **Alterar** — `validarUsuarioEdicao` |
| `src/app/(app)/criar-role/components/SugestoesEndereco.tsx` | **Alterar** — B8 |
| `src/app/(app)/feed/components/SeletorLocalizacao.tsx` | **Alterar** — B8 |
| `src/app/(app)/feed/components/CampoBusca.tsx` + CSS | **Alterar** — B9 |
| `src/app/(auth)/login/login.module.css` | **Alterar** — B9 ellipsis no identificador |
| `docs/specs/002-edicao-perfil.md` | Não reescrever; esta spec **estende** o recorte de moto/garupa |
| `docs/specs/003-feed.md` | Não reescrever; B6 **soma** km da rota ao aceite “km até a partida” |
| `docs/specs/012-pwa.md` | Não reescrever; B4 cumpre o “esconder CTA sem evento” |

Rotas HTTP novas: **`POST /auth/resolver`** (público).

---

## 10. Checklist da skill Next.js

- [ ] Sem `"use client"` em `page.tsx`.
- [ ] Sheet de senha e hook de reset separados do formulário de login.
- [ ] Componentes ~80 linhas; CSS Modules + tokens; sem Tailwind do Stitch.
- [ ] Toque ≥ 48px; usável a 390px; sheet de participar acima do dock; dois badges de km ainda tocáveis/legíveis.
- [ ] Persistência só via repositório; B2 não usa `firestore.collection` na rota; B6 não acessa Firestore além do `listar` já existente.

---

## 11. Ordem sugerida de implementação

1. **B2** — repositório + `POST /auth/resolver` + `useLoginForm` (desbloqueia apelido).  
2. **B1** — sheet de reset reusa o resolver.  
3. **B3 + B4** — onboarding Google + PWA.  
4. **B5** — sheet de participar.  
5. **B6** — duas distâncias na function + dois badges no card.  
6. **B8 + B9** — polish.  
7. **B7** — estende contrato do `PUT /perfil`.

Não misturar B7 com o resto num único PR se o time fatiar entregas; o checkup trata os sintomas como um pacote, a ordem acima desbloqueia o piloto primeiro.
