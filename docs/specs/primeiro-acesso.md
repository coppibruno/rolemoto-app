# SPEC — Primeiro Acesso (Completar Perfil)

> **Status:** Proposta  
> **Autor:** Assistente IA  
> **Data:** 2026-09-08

---

## 1. Objetivo

Após o primeiro login (Google ou email/senha), o usuário **ainda não possui perfil no Firestore**. Esta tela coleta as informações necessárias para criar o documento na coleção `users`, permitindo que o usuário personalize dados que possam ter vindo do provedor social.

---

## 2. Viabilidade com Firebase

### ✅ O que o Firebase Auth já fornece (login via Google)

| Dado | Propriedade do `FirebaseUser` | Disponível? |
|------|-------------------------------|-------------|
| Nome completo | `displayName` | ✅ Sim |
| Email | `email` | ✅ Sim |
| Foto de perfil | `photoURL` | ✅ Sim |
| UID único | `uid` | ✅ Sim |

### ✅ O que armazenamos no Firestore (coleção `users`)

Os campos adicionais (apelido, moto, pilotagem) **não existem no Firebase Auth** — são dados de negócio que vão direto para o Firestore. Isso é o padrão recomendado: Firebase Auth cuida da identidade, Firestore cuida do perfil enriquecido.

### ✅ Upload de foto customizada

O Firebase Storage já está configurado no projeto (`src/lib/storage.ts`). Se o usuário quiser trocar a foto do Google por uma própria, fazemos upload para o Storage e salvamos a URL no Firestore.

---

## 3. Fluxo do Usuário

```
Login (Google ou Email)
  │
  ▼
AuthProvider detecta firebaseUser
  │
  ▼
Busca perfil no Firestore (buscarUsuario)
  │
  ├── Perfil existe? → Vai para o Feed (/)
  │
  └── Perfil NÃO existe? → Redireciona para /primeiro-acesso
        │
        ▼
  Tela "Completar Perfil"
  (campos pré-preenchidos se Google)
        │
        ▼
  Usuário preenche/ajusta e salva
        │
        ▼
  Cria documento no Firestore
        │
        ▼
  Redireciona para o Feed (/)
```

---

## 4. Campos do Formulário

| # | Campo | Tipo | Obrigatório | Pré-preenchido (Google) | Regras |
|---|-------|------|-------------|------------------------|--------|
| 1 | **Foto** | Imagem (preview circular) | Não | ✅ `firebaseUser.photoURL` | Aceita JPG/PNG, máx 2MB. Se não trocar, usa a do Google ou um placeholder. |
| 2 | **Nome** | Texto | ✅ Sim | ✅ `firebaseUser.displayName` | Mín. 2 caracteres. Editável. |
| 3 | **Apelido** | Texto | ✅ Sim | ❌ Vazio | Mín. 2 caracteres. É o nome exibido publicamente no app. |
| 4 | **Moto** | Texto | ✅ Sim | ❌ Vazio | Ex: "CB 300", "Ninja 650", "Biz 125". Texto livre. |
| 5 | **Pilotagem** | Seleção única | ✅ Sim | ❌ Nenhuma | Opções: `agressiva`, `moderada`, `tranquila`. |

### Detalhamento dos campos

#### 4.1 Foto
- Exibe preview circular no topo do formulário.
- Se login via Google: mostra a foto do Google com um botão/ícone de câmera para trocar.
- Se login via email: mostra um placeholder com ícone de câmera.
- Ao clicar, abre seletor de arquivo (aceita `image/jpeg, image/png`).
- Limite de 2MB. Se exceder, exibe erro inline.
- Upload vai para Firebase Storage em `avatars/{uid}.jpg`.

#### 4.2 Nome
- Se login via Google: pré-preenche com `firebaseUser.displayName`.
- Se login via email: campo vazio.
- O usuário pode alterar livremente.
- Validação: mínimo 2 caracteres.

#### 4.3 Apelido
- Sempre vazio (não vem do Google).
- É o nome público que aparece no app (cards de rolê, perfil, etc.).
- Validação: mínimo 2 caracteres.
- Futuro: pode ter verificação de unicidade.

#### 4.4 Moto
- Campo de texto livre.
- Exemplos exibidos como placeholder: "Ex: CB 300, Ninja 650, Biz 125".
- Validação: mínimo 2 caracteres.

#### 4.5 Pilotagem
- Seleção visual com 3 cards/botões:
  - 🔥 **Agressiva** — "Gosta de acelerar e curvas fortes"
  - ⚡ **Moderada** — "Equilíbrio entre velocidade e conforto"
  - 🌿 **Tranquila** — "Passeio relax, curtindo a paisagem"
- Apenas uma opção pode ser selecionada.
- Estilo: cards com ícone, título e descrição curta. O selecionado fica destacado.

---

## 5. Alterações no Modelo de Dados

### 5.1 Tipo `Usuario` (antes)

```typescript
interface Usuario {
  uid: string;
  apelido: string;
  moto: string;
  cidade: string;
  fotoUrl: string;
  createdAt: Timestamp;
}
```

### 5.2 Tipo `Usuario` (proposta)

```typescript
type Pilotagem = 'agressiva' | 'moderada' | 'tranquila';

interface Usuario {
  uid: string;
  nome: string;          // NOVO — nome completo (editável)
  apelido: string;
  moto: string;
  pilotagem: Pilotagem;  // NOVO — estilo de pilotagem
  fotoUrl: string;
  cidade: string;        // mantém — pode ser preenchido depois ou na criação de rolê
  createdAt: Timestamp;
}
```

### 5.3 Tipo do formulário

```typescript
type PrimeiroAcessoForm = {
  nome: string;
  apelido: string;
  moto: string;
  pilotagem: Pilotagem;
  foto?: File;           // arquivo se o usuário trocar a foto
};
```

### 5.4 Mudanças na coleção `users` (Firestore)

| Campo | Antes | Depois |
|-------|-------|--------|
| `nome` | ❌ Não existia | ✅ Adicionado |
| `pilotagem` | ❌ Não existia | ✅ Adicionado (`'agressiva' \| 'moderada' \| 'tranquila'`) |
| `cidade` | ✅ Obrigatório | ✅ Mantido (opcional no primeiro acesso, preenchido depois) |

---

## 6. Implementação Técnica

### 6.1 Nova rota

```
src/app/(auth)/primeiro-acesso/page.tsx
```

- **Client Component** (usa hooks, formulários, upload).
- Protegida: só acessível se `firebaseUser` existe e `usuario` é `null`.
- Se o usuário já tem perfil, redireciona para `/`.

### 6.2 Redirecionamento automático

No `src/app/page.tsx` (Home), alterar a lógica:

```
Se loading → mostra spinner
Se !firebaseUser → redireciona para /login
Se firebaseUser && !usuario → redireciona para /primeiro-acesso  ← NOVO
Se firebaseUser && usuario → mostra feed
```

### 6.3 Upload de foto

```typescript
// Fluxo do upload
1. Usuário seleciona arquivo
2. Valida tipo (jpg/png) e tamanho (< 2MB)
3. Exibe preview local (URL.createObjectURL)
4. No submit: faz upload para Storage em `avatars/{uid}.jpg`
5. Obtém downloadURL
6. Salva URL no campo `fotoUrl` do Firestore
```

Se o usuário **não** trocar a foto (usa a do Google), salva diretamente `firebaseUser.photoURL` no campo `fotoUrl`.

### 6.4 Função de criação do perfil

```typescript
// Em src/lib/firestore.ts
export const criarPerfilPrimeiroAcesso = async (
  uid: string,
  dados: {
    nome: string;
    apelido: string;
    moto: string;
    pilotagem: Pilotagem;
    fotoUrl: string;
  }
) => {
  await setDoc(doc(db, "users", uid), {
    ...dados,
    cidade: "",         // preenchido depois
    createdAt: serverTimestamp(),
  });
};
```

### 6.5 Atualizar AuthProvider

Após criar o perfil com sucesso:

```typescript
await criarPerfilPrimeiroAcesso(firebaseUser.uid, dados);
await recarregarPerfil();  // já existe no AuthProvider
router.replace("/");
```

---

## 7. Design / UX

### Layout geral
- **Mobile-first**, tela única com scroll vertical.
- Fundo com gradiente escuro (consistente com as telas de login e home).
- Card centralizado com padding generoso.

### Hierarquia visual
```
┌─────────────────────────┐
│      🏍️ Rolemoto        │
│  "Complete seu perfil"   │
│                          │
│      ┌──────────┐        │
│      │  📷 Foto │        │
│      │ (circle) │        │
│      └──────────┘        │
│    [Trocar foto]         │
│                          │
│  Nome: [______________]  │
│                          │
│  Apelido: [___________]  │
│                          │
│  Moto: [______________]  │
│                          │
│  Pilotagem:              │
│  ┌────┐ ┌────┐ ┌────┐   │
│  │ 🔥 │ │ ⚡ │ │ 🌿 │   │
│  │Agre│ │Mode│ │Tran│   │
│  └────┘ └────┘ └────┘   │
│                          │
│  [   Salvar e Entrar   ] │
│                          │
└─────────────────────────┘
```

### Feedback
- Botão "Salvar e Entrar" desabilitado até todos os campos obrigatórios serem preenchidos.
- Spinner no botão durante o salvamento.
- Mensagens de erro inline por campo + toast/banner para erros de rede.

---

## 8. Casos Especiais

| Cenário | Comportamento |
|---------|--------------|
| Login via Google | Pré-preenche nome e foto. Campos editáveis. |
| Login via email | Nome e foto vazios. Foto usa placeholder. |
| Usuário acessa `/primeiro-acesso` com perfil já existente | Redireciona para `/`. |
| Usuário acessa o app sem perfil e tenta ir para `/` | Redireciona para `/primeiro-acesso`. |
| Upload de foto falha | Exibe erro, permite tentar novamente. Se desistir, usa foto do Google ou placeholder. |
| Google não retorna `displayName` (raro) | Campo nome fica vazio. |
| Google não retorna `photoURL` (raro) | Exibe placeholder. |

---

## 9. Critérios de Aceite

- [ ] Após primeiro login (Google ou email), usuário é redirecionado para `/primeiro-acesso`.
- [ ] Campos nome e foto são pré-preenchidos com dados do Google (quando disponíveis).
- [ ] Todos os campos obrigatórios (nome, apelido, moto, pilotagem) são validados.
- [ ] Upload de foto funciona e salva no Firebase Storage.
- [ ] Documento é criado na coleção `users` do Firestore com todos os campos.
- [ ] Após salvar, usuário é redirecionado para o feed (`/`).
- [ ] Se o perfil já existe, a tela de primeiro acesso não é acessível.
- [ ] Layout responsivo e funcional em telas mobile (360px+).

---

## 10. Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| `src/types/user.ts` | Adicionar `nome`, `Pilotagem`, atualizar `UsuarioForm` |
| `src/lib/firestore.ts` | Adicionar `criarPerfilPrimeiroAcesso` |
| `src/app/(auth)/primeiro-acesso/page.tsx` | **NOVO** — Tela do formulário |
| `src/app/(auth)/primeiro-acesso/primeiro-acesso.module.css` | **NOVO** — Estilos |
| `src/app/page.tsx` | Adicionar redirecionamento para `/primeiro-acesso` |
| `src/app/(auth)/login/page.tsx` | Alterar redirect pós-login (ir para `/` que decide o destino) |
| `.cursor/rules/tech-stack.mdc` | Atualizar schema da coleção `users` |

---

## 11. Fora do Escopo (Futuro)

- Verificação de unicidade do apelido.
- Crop/redimensionamento de imagem no browser.
- Campo de cidade com autocomplete por geolocalização.
- Edição do perfil após o primeiro acesso (tela "Meu Perfil").
- Validação de moto com lista pré-definida de modelos.
