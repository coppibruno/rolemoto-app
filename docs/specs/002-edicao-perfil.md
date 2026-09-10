# SPEC 002 — Edição de Perfil

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-09  
> **Referência visual:** `designs/perfil/` (`DESIGN.md`, `code.html`, `screen.png`)  
> **Padrões:** Next.js 15 App Router — Server Components por padrão, Client só com interatividade  
> **Backend:** Cloud Function `api` (Express) — `PUT /perfil`  
> **Depende de:** SPEC 001 (shell autenticado + rota `/perfil`) e SPEC Primeiro Acesso (documento em `users`)

---

## 1. Objetivo

Substituir o placeholder de `/perfil` pela **tela de edição do perfil do piloto autenticado**.

O usuário altera **nome, foto, apelido e ritmo de pilotagem**. Os quatro campos são **obrigatórios**. Sem preenchimento, o formulário sinaliza o erro no campo. Com sucesso, o Firestore é atualizado e o app **notifica** o piloto.

Esta spec é **full stack**:

| Camada | Responsabilidade |
|--------|------------------|
| Front (Next.js) | UI do mock, validação, upload da foto no Storage, `PUT /perfil`, toast |
| Back (Functions) | Token válido, perfil existente, uid do token, persistência só via repositório |

O uid **nunca** vem do body. Só o dono do token edita o próprio documento.

---

## 2. Referência de Design

Replicar o visual de `designs/perfil/` (`code.html` + `screen.png`). Não inventar outro layout. Tokens em `DESIGN.md` / `globals.css`.

### O que entra nesta spec (do mock)

- Header sticky: logo + **Perfil / Cockpit**.
- Cartão de identidade: avatar circular com glow, botão câmera, nome e `@apelido`.
- Seção **Dados do Piloto**: Nome Completo, Apelido, Ritmo de Pilotagem.
- CTA **Salvar Alterações** (laranja, uppercase, ícone `save`).
- Link **Sair da conta**.
- Toast de sucesso (barra âmbar, `check_circle`).

### O que o mock mostra e **não** entra

| Elemento do mock | Motivo |
|------------------|--------|
| Sino de notificações | SPEC 001 deixou fora; sem backend de push |
| Telemetria (rolês concluídos / km) | Sem agregação ainda |
| **Histórico de Pistas** (tabs Participados / Criados) | Spec futura do histórico |
| Badge `ID #8849-BR` | ID fictício do mock |
| Campo moto / cidade | Fora do pedido desta edição |

Menu inferior já existe (SPEC 001). Esta tela **não** reimplementa o dock.

### Comportamento visual (do mock)

- Conteúdo em coluna única, gutter 16px, **max-width 560px** (já no shell `(app)`).
- Cartão de identidade: `surface-container`, glow laranja no topo, avatar 96px com anel gradiente.
- Botão câmera: 32px, `primary-container`, ícone `photo_camera`, `aria-label="Trocar foto de perfil"`.
- Inputs: altura `touch-min` (48px), fundo `surface-container-low`, ícone à esquerda (`person` / `alternate_email`), focus `primary-container`.
- Label uppercase `label-md`; hint **obrigatório** em laranja no Nome (e o mesmo critério visual de erro nos demais campos obrigatórios).
- Apelido: hint “visível no comboio”.
- Pilotagem: grid 3 colunas, cards 80px. Selecionado: fundo `#FF6B00`, glow, texto `on-primary`. Inativo: `surface-container-low`.
- Botão salvar: altura ~52px, `primary-container`, glow `0 4px 14px rgba(255, 107, 0, 0.35)`, Barlow Condensed uppercase.
- Toast: `secondary-container` / `on-secondary-container`.

### Pilotagem (cards do mock — valores de domínio)

| Valor | Ícone | Label | Subtítulo |
|-------|-------|-------|-----------|
| `tranquila` | `spa` | Tranquila | Abaixo de 90 km/h |
| `moderada` | `two_wheeler` | Moderada | Fluida & Constante |
| `agressiva` | `sports_score` | Agressiva | Esportivo / Pista |

Valores iguais ao tipo `Pilotagem` já usado no primeiro acesso.

---

## 3. Fluxo do Usuário

```
Grupo (app) — já autenticado e com perfil (GuardaApp)
  │
  ▼
Menu → Perfil  →  /perfil
  │
  ▼
Tela carrega dados de useAuth.usuario
  (nome, apelido, fotoUrl, pilotagem)
  │
  ├── Altera campos
  ├── Troca foto (opcional se já houver foto)
  └── Toca Salvar
        │
        ├── Inválido → erros inline (não chama API)
        └── Válido
              │
              ├── Se arquivo novo → upload Storage (avatars/{uid}.jpg)
              └── PUT /perfil  { nome, apelido, fotoUrl, pilotagem }
                    │
                    ├── 200 → recarregarPerfil() + toast de sucesso
                    ├── 400 → erros de campo / mensagem da API
                    ├── 401 → token inválido (GuardaApp / login)
                    └── 404 → perfil inexistente (não deveria ocorrer no (app))
```

- Pré-preenchimento: documento já criado no primeiro acesso.
- Foto existente conta como preenchida. Só erro de foto se não houver `fotoUrl` **e** nenhum arquivo novo.
- Logout: `useAuth().logout()` → `/login` (GuardaApp). Sem chamar `DELETE /perfil`.

---

## 4. Arquitetura Next.js

Seguir a skill: página orquestradora, componentes ~80 linhas, lógica em hooks, API em service. `"use client"` só no que tem estado, submit, file picker ou `useAuth`.

### 4.1 Por que a page pode ser Server Component

`(app)/layout` já protege a rota. `/perfil` só monta a tela. Interatividade fica nos filhos Client.

```tsx
// src/app/(app)/perfil/page.tsx — Server Component
import { TelaPerfil } from "./components/TelaPerfil";

const PerfilPage = () => {
  return (
    <main>
      <TelaPerfil />
    </main>
  );
};

export default PerfilPage;
```

`TelaPerfil` é Client: lê `usuario` do contexto e monta cartão + formulário.

### 4.2 Estrutura por feature

```
src/app/(app)/perfil/
├── page.tsx                         # Server — orquestrador
├── components/
│   ├── TelaPerfil.tsx               # Client — composição
│   ├── CabecalhoPerfil.tsx          # Logo + título Cockpit
│   ├── CartaoIdentidade.tsx         # Avatar, nome, @apelido
│   ├── FotoPerfil.tsx               # Preview + input file + erro
│   ├── FormularioPerfil.tsx         # <form> + campos + CTA
│   ├── CampoTexto.tsx               # Label, ícone, input, erro
│   ├── SeletorPilotagem.tsx         # 3 cards
│   ├── ToastSucesso.tsx             # Feedback pós-PUT
│   └── BotaoSair.tsx                # Logout
├── hooks/
│   ├── useFormularioPerfil.ts       # Estado, validação, submit
│   └── useFotoPerfil.ts             # File, preview, upload
├── constants.ts                     # Opções de pilotagem (ícone/label)
├── services/
│   └── perfil.service.ts            # PUT /perfil (api), sem Firestore
└── perfil.module.css
```

### 4.3 Responsabilidades

| Peça | Tipo | Faz |
|------|------|-----|
| `page.tsx` | Server | Só monta `TelaPerfil` |
| `TelaPerfil` | Client | Lê `usuario`; passa dados ao form |
| `FormularioPerfil` | Client | Markup do form; chama o hook |
| `useFormularioPerfil` | Hook | Campos, `erros`, `salvando`, `salvar` |
| `useFotoPerfil` | Hook | Validação JPG/PNG 2MB, ObjectURL, `uploadFotoPerfil` |
| `perfil.service` | Service | `atualizar({ nome, apelido, fotoUrl, pilotagem })` via `api` |
| `CampoTexto` / `SeletorPilotagem` / `FotoPerfil` | UI | Um bloco visual cada |
| `ToastSucesso` | UI | Mensagem; some ~3,5s (como o mock) |
| `BotaoSair` | Client | `logout()` |

**Não misturar** no mesmo arquivo: JSX do form + regras de validação + `fetch` + upload Storage.

**Não** usar `atualizarUsuario` / `updateDoc` em `src/lib/firestore.ts` nesta tela. Persistência de edição passa pela function.

---

## 5. Contrato dos Campos (front)

```ts
export type EdicaoPerfilForm = {
  nome: string;
  apelido: string;
  photoFile: File | null;   // só se o usuário escolheu arquivo novo
  fotoUrlAtual: string;     // URL já salva (ou preview blob)
  pilotagem: Pilotagem | null;
};

export type ErrosEdicaoPerfil = {
  nome?: string;
  apelido?: string;
  foto?: string;
  pilotagem?: string;
};
```

Body enviado à API (após upload, se houver):

```ts
export type UsuarioEdicao = {
  nome: string;
  apelido: string;
  fotoUrl: string;
  pilotagem: Pilotagem;
};
```

### Regras de validação (cliente)

Validar no submit (`tentouSubmit`). Mostrar erro **no campo**. Bordas com `--error`.

| Campo | Obrigatório | Regra | Mensagem |
|-------|-------------|-------|----------|
| Nome | Sim | `trim().length >= 2` | “Informe o nome” / “Mínimo 2 caracteres” |
| Apelido | Sim | `trim().length >= 2` | “Informe o apelido” / “Mínimo 2 caracteres” |
| Foto | Sim | `fotoUrlAtual` não vazio **ou** arquivo novo válido | “Inclua uma foto de perfil” |
| Pilotagem | Sim | um de `agressiva` \| `moderada` \| `tranquila` | “Selecione o ritmo de pilotagem” |

Foto (arquivo novo), iguais ao primeiro acesso:

- Tipos: `image/jpeg`, `image/png`.
- Máx. 2 MB.
- Erro inline no bloco da foto, sem submit.

Não validar unicidade de apelido nesta spec.

### Foto: Storage vs API

1. Arquivo novo → `uploadFotoPerfil(uid, file)` → URL.
2. Sem arquivo novo → reenviar `usuario.fotoUrl`.
3. PUT recebe só `fotoUrl` (string). A function **não** recebe multipart.

---

## 6. Implementação Front

### 6.1 Service

```ts
// src/app/(app)/perfil/services/perfil.service.ts
import { api } from "@/lib/api";
import type { Usuario, UsuarioEdicao } from "@/types/user";

export const perfilService = {
  atualizar: (dados: UsuarioEdicao) =>
    api<Usuario>("/perfil", {
      method: "PUT",
      body: JSON.stringify(dados),
    }),
};
```

Usar `api` (Bearer automático). O hook trata `ApiError` (400/401/404). Não é obrigatório `useFunctions` se o service já encapsula o `put` — evitar loading duplicado (hook do form + hook HTTP). Preferir **um** `salvando` em `useFormularioPerfil`.

### 6.2 Hook do formulário (esqueleto)

```ts
// fluxo do salvar (conceitual)
const salvar = async () => {
  setTentouSubmit(true);
  const erros = validar(campos);
  if (Object.keys(erros).length > 0) {
    setErros(erros);
    return;
  }

  setSalvando(true);
  try {
    const fotoUrl = arquivoNovo
      ? await uploadFotoPerfil(uid, arquivoNovo)
      : usuario.fotoUrl;

    const atualizado = await perfilService.atualizar({
      nome: nome.trim(),
      apelido: apelido.trim(),
      fotoUrl,
      pilotagem,
    });

    await recarregarPerfil();
    setSucesso(true); // ToastSucesso
  } catch (e) {
    setErroGeral(mensagemDaApiOuGenerica);
  } finally {
    setSalvando(false);
  }
};
```

Após 200, o cartão de identidade e o header devem refletir nome/apelido/foto novos (`recarregarPerfil`).

### 6.3 Tokens CSS

Reusar variáveis; CSS Modules em `perfil.module.css`. Sem hex solto no TSX.

| Token | Uso |
|-------|-----|
| `--surface` / `--surface-container` | Fundo da página / cartão |
| `--surface-container-low` | Inputs e cards inativos |
| `--primary-container` | Câmera, hint obrigatório, card ativo, CTA |
| `--on-surface` / `--on-surface-variant` | Texto / labels |
| `--error` / `--error-container` | Borda e texto de erro |
| `--secondary-container` | Toast de sucesso |
| `--gutter-md` / `--touch-min` | Espaçamento e altura de toque |

Tipografia: Barlow Condensed nos títulos/CTA; Plus Jakarta Sans no body. Ícones: Material Symbols Outlined.

### 6.4 Acessibilidade

- `label` associado a cada input (`htmlFor`).
- Foto: `aria-label="Trocar foto de perfil"`; `alt` com o nome do piloto.
- Pilotagem: `role="radiogroup"` + `aria-checked` (ou `aria-pressed`) no card ativo.
- Erros: `aria-invalid` + `aria-describedby` apontando à mensagem.
- Toast: `role="status"` (não só cor).
- Área de toque ≥ 48px; CTA 56px de altura útil.
- `disabled` em inputs e botões enquanto `salvando`.

### 6.5 Header e logout

Header **sem** ação de notificações (ícone omitido ou `disabled` sem handler). Avatar do header, se existir, usa `fotoUrl` atual.

**Sair da conta:** chama `logout()`, não apaga o documento `users`.

---

## 7. Backend — `PUT /perfil`

A rota **já existe** em `functions/src/routes/perfil.ts`, mas o PUT atual:

- aceita `UsuarioUpdate` (`Partial` de todos os campos, inclusive `moto` / `cidade`);
- **não** exige os quatro campos desta spec;
- já usa `autenticar` e `buscarPorId` via `atualizar` (404 se não existe).

Esta spec **fecha o contrato** do PUT. Não criar outro path. Não usar `onCall`.

### 7.1 Auth e autorização

1. `perfilRouter.use(autenticar)` — já exige `Authorization: Bearer <idToken>`.
2. Token inválido/expirado → **401** `{ erro: "Token inválido ou expirado" }`.
3. Sem Bearer → **401** `{ erro: "Token ausente" }`.
4. `uid` **somente** de `req.usuario.uid`. Ignorar `uid` / `id` no body.
5. Documento `users/{uid}` inexistente → **404** `{ erro: "Perfil não encontrado" }`.
6. Não há PUT `/perfil/:uid`. Não dá para editar outro piloto.

O Admin SDK ignora Security Rules: a function é a autorização.

### 7.2 Body e validação

```ts
// functions/src/types/usuario.ts — acréscimo
export type UsuarioEdicao = {
  nome: string;
  apelido: string;
  fotoUrl: string;
  pilotagem: Pilotagem;
};
```

Manter `UsuarioUpdate` para outros usos futuros, se necessário. O PUT desta spec usa **`UsuarioEdicao`** (quatro campos obrigatórios).

Validar **antes** do repositório:

| Campo | Regra |
|-------|--------|
| `nome` | string, `trim().length >= 2` |
| `apelido` | string, `trim().length >= 2` |
| `fotoUrl` | string não vazia após trim |
| `pilotagem` | exatamente `agressiva` \| `moderada` \| `tranquila` |

Falha → **400** `{ erro: "nome, apelido, fotoUrl e pilotagem são obrigatórios" }` (ou mensagem específica: pilotagem inválida).

Campos extras (`moto`, `cidade`, `uid`, `createdAt`) **não** são persistidos. Montar o payload só com os quatro campos trimados.

`moto` e `cidade` permanecem como estão no Firestore.

### 7.3 Handler (contrato)

```
PUT /perfil
Headers: Authorization: Bearer <idToken>
Content-Type: application/json

Body:
{
  "nome": "Rodrigo Silveira",
  "apelido": "rodrigo_r1",
  "fotoUrl": "https://...",
  "pilotagem": "moderada"
}

200 → Usuario completo (uid, nome, apelido, moto, pilotagem, fotoUrl, cidade, createdAt ISO)
400 → validação
401 → token
404 → perfil não encontrado
500 → erro interno (responderErro)
```

`usuarioRepository.atualizar(uid, dados)` já retorna `null` se o doc não existe e faz `update` só nos campos enviados. A rota deve passar **apenas** o objeto validado.

### 7.4 O que não muda

- `GET /perfil` e `POST /perfil` (primeiro acesso via client Firestore hoje — fora desta spec).
- `DELETE /perfil`.
- Factory em `repositories/index.ts`.
- Rotas **sem** `firestore.collection` direto.

---

## 8. Wireframe

```
┌─────────────────────────────────┐
│  [logo]  PERFIL                 │  header sticky
│          COCKPIT                │
├─────────────────────────────────┤
│         ╭─────╮  📷             │  cartão identidade
│         │foto │                 │
│         ╰─────╯                 │
│      NOME COMPLETO              │
│      @apelido                   │
├─────────────────────────────────┤
│  ▎ DADOS DO PILOTO              │
│                                 │
│  NOME COMPLETO     obrigatório  │
│  [👤  ................]         │
│  (erro inline se vazio)         │
│                                 │
│  APELIDO     visível no comboio │
│  [@   ................]         │
│                                 │
│  RITMO DE PILOTAGEM             │
│  [Tranquila][Moderada][Agress.] │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 💾  SALVAR ALTERAÇÕES   │    │
│  └─────────────────────────┘    │
│       ↩ Sair da conta           │
│                                 │
│  [✓ Perfil atualizado...]       │  toast (após 200)
└─────────────────────────────────┘
│  🏍️        ( + )        👤     │  menu (SPEC 001)
└─────────────────────────────────┘
```

Estado de erro: input com borda `--error` e texto abaixo. Pilotagem sem seleção: mensagem sob o grid. Foto ausente: texto sob o avatar.

---

## 9. Fora do Escopo

- Histórico de rolês participados / criados.
- Contadores de rolês e km.
- Notificações no header.
- Editar moto, cidade, email ou senha.
- Unicidade de apelido.
- Recorte/compressão avançada da foto (só JPG/PNG 2MB).
- `DELETE /perfil` (encerrar conta).
- Trocar o fluxo de primeiro acesso para `POST /perfil` (dívida existente; não misturar).
- Menu inferior, guarda de rota e tokens globais (já na SPEC 001).

---

## 10. Critérios de Aceite

### Front

- [ ] `/perfil` deixa de ser placeholder e segue o mock `designs/perfil/` (cartão, form, CTA, toast, sair).
- [ ] Campos editáveis: nome, foto, apelido, pilotagem. Todos obrigatórios.
- [ ] Formulário abre preenchido com o perfil atual.
- [ ] Submit inválido: erro **por campo**, sem chamar a API.
- [ ] Foto: JPG/PNG, máx. 2MB; erro inline se inválida ou ausente.
- [ ] Sucesso: dados persistidos, `recarregarPerfil()`, toast visível (~3,5s).
- [ ] Falha da API: mensagem geral, sem toast de sucesso.
- [ ] Sair da conta encerra a sessão e cai no login.
- [ ] Menu Inferior permanece; item Perfil ativo.
- [ ] Sem histórico nem stats fictícios.
- [ ] `page.tsx` Server; Client só onde há interatividade.
- [ ] Componentes < ~80 linhas; validação no hook; PUT no service.
- [ ] Sem `updateDoc` / `atualizarUsuario` nesta feature.
- [ ] Toque ≥ 48px; usável a partir de 360px; padding acima do dock.

### Back

- [ ] `PUT /perfil` exige Bearer válido.
- [ ] Só atualiza `users/{uid}` do token.
- [ ] 404 se o usuário não existe no Firestore.
- [ ] 400 se faltar ou for inválido nome, apelido, fotoUrl ou pilotagem.
- [ ] 200 devolve o `Usuario` atualizado; `moto`/`cidade` inalterados.
- [ ] Body não altera outro uid nem grava campos extras.
- [ ] Persistência só em `FirestoreUsuarioRepository`.

---

## 11. Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| `src/app/(app)/perfil/page.tsx` | **Alterar** — orquestrador Server |
| `src/app/(app)/perfil/components/*` | **NOVO** — UI da feature |
| `src/app/(app)/perfil/hooks/useFormularioPerfil.ts` | **NOVO** |
| `src/app/(app)/perfil/hooks/useFotoPerfil.ts` | **NOVO** |
| `src/app/(app)/perfil/services/perfil.service.ts` | **NOVO** |
| `src/app/(app)/perfil/constants.ts` | **NOVO** — cards de pilotagem |
| `src/app/(app)/perfil/perfil.module.css` | **NOVO** |
| `src/types/user.ts` | **Alterar** — tipo `UsuarioEdicao` |
| `src/lib/storage.ts` | Reusar `uploadFotoPerfil` |
| `functions/src/types/usuario.ts` | **Alterar** — `UsuarioEdicao` |
| `functions/src/routes/perfil.ts` | **Alterar** — validação obrigatória no PUT |
| `functions/src/repositories/firestore/firestore-usuario.repository.ts` | Sem mudança de contrato, se a rota já enviar só os 4 campos |

Não alterar `MenuInferior` nem `GuardaApp`.

---

## 12. Checklist da skill Next.js

- [ ] `page.tsx` sem `"use client"` (só orquestra).
- [ ] `"use client"` só em TelaPerfil e filhos interativos.
- [ ] Estado/validação/submit em `useFormularioPerfil` (+ `useFotoPerfil`).
- [ ] PUT isolado em `perfil.service.ts` (sem Firestore no componente).
- [ ] Um componente = uma coisa (campo, seletor, toast, foto).
- [ ] Sem abstração genérica “pra futuro” (histórico, stats).
- [ ] CSS Modules + tokens de `globals.css`.
- [ ] Sem `console.log` de debug.

---

## 13. Relação com o código atual

| Hoje | Nesta spec |
|------|------------|
| `perfil/page.tsx` placeholder | Tela completa |
| `PUT /perfil` parcial, sem obrigatórios | PUT com `UsuarioEdicao` |
| Primeiro acesso grava Firestore no client | Edição **só** via function |
| Foto opcional no primeiro acesso | Foto **obrigatória** na edição |
| `UsuarioUpdate = Partial<UsuarioCreate>` | PUT não usa Partial para esses 4 campos |
