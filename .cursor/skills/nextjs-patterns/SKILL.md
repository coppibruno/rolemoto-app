---
name: nextjs-patterns
description: >-
  Padrões de arquitetura Next.js 15 (App Router): componentes pequenos e focados,
  SSR por padrão, separação de responsabilidades com custom hooks e services,
  organização por feature, cache e código limpo sem over-engineering.
  Use sempre que criar ou modificar componentes, páginas, hooks ou services.
---

# Next.js Patterns — Código Limpo e Focado

## Princípio Central

> Escreva o mínimo necessário. Componentes pequenos, código legível por humanos,
> sem gerar 300 linhas para resolver algo que cabe em 40.

---

## 1. SSR por Padrão

Todo componente é Server Component **a menos que precise de interatividade**.

Só adicione `"use client"` quando o componente usar:
- `useState`, `useEffect`, `useRef`, `useContext`
- Event handlers (`onClick`, `onChange`, `onSubmit`)
- APIs do browser (`window`, `navigator`, `localStorage`)
- Hooks de terceiros que exigem client

```tsx
// ✅ Server Component (padrão) — sem diretiva
const ListaRoles = async () => {
  const roles = await listarRoles();
  return <ul>{roles.map(r => <RoleCard key={r.id} role={r} />)}</ul>;
};

// ✅ Client Component — só quando necessário
"use client";
const BotaoCurtir = () => {
  const [curtiu, setCurtiu] = useState(false);
  return <button onClick={() => setCurtiu(!curtiu)}>❤️</button>;
};
```

**Regra**: se o componente só exibe dados, é Server Component.

---

## 2. Componentes Pequenos e Focados

**Limite: ~80 linhas por componente.** Se passar disso, quebre.

Um componente faz **uma coisa**:
- Exibe um card → `RoleCard`
- Exibe um formulário → `FormularioPerfil`
- Exibe uma lista → `ListaRoles`

**Não misture**: lógica de formulário + validação + chamada API + UI no mesmo arquivo.

### Composição em páginas

A `page.tsx` é um orquestrador fino — monta os componentes, não implementa lógica:

```tsx
// app/(app)/roles/page.tsx — Server Component
import { ListaRoles } from "./components/ListaRoles";
import { FiltrosRoles } from "./components/FiltrosRoles";

const RolesPage = async () => {
  return (
    <main>
      <h1>Rolês disponíveis</h1>
      <FiltrosRoles />
      <ListaRoles />
    </main>
  );
};

export default RolesPage;
```

---

## 3. Separação de Responsabilidades

### Estrutura por feature

```
src/app/(app)/roles/
├── page.tsx                    # Orquestrador (Server Component)
├── components/
│   ├── ListaRoles.tsx          # Exibe a lista
│   ├── RoleCard.tsx            # Card individual
│   └── FiltrosRoles.tsx        # Filtros (Client Component)
├── hooks/
│   └── useFiltrosRoles.ts      # Lógica de estado dos filtros
└── services/
    └── roles.service.ts        # Chamadas de dados
```

### Custom hooks — toda lógica de estado

Extraia lógica de estado/efeitos para hooks. O componente só renderiza.

```tsx
// hooks/useFormularioPerfil.ts
export const useFormularioPerfil = () => {
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const salvar = async (dados: PerfilForm) => {
    setSalvando(true);
    try {
      await perfilService.criar(dados);
    } catch {
      setErro("Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  };

  return { nome, setNome, salvando, erro, salvar };
};
```

```tsx
// components/FormularioPerfil.tsx
"use client";
const FormularioPerfil = () => {
  const { nome, setNome, salvando, erro, salvar } = useFormularioPerfil();

  return (
    <form onSubmit={(e) => { e.preventDefault(); salvar({ nome }); }}>
      <input value={nome} onChange={(e) => setNome(e.target.value)} />
      <button disabled={salvando}>Salvar</button>
      {erro && <p>{erro}</p>}
    </form>
  );
};
```

### Services — acesso a dados isolado

Services encapsulam chamadas a Firestore, APIs externas, Storage.
Nunca chame `doc()`, `getDoc()`, `setDoc()` diretamente de um componente ou hook.

```tsx
// services/perfil.service.ts
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Usuario, PerfilForm } from "@/types/user";

export const perfilService = {
  buscar: async (uid: string): Promise<Usuario | null> => {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? { uid: snap.id, ...snap.data() } as Usuario : null;
  },

  criar: async (uid: string, dados: PerfilForm) => {
    await setDoc(doc(db, "users", uid), {
      ...dados,
      createdAt: serverTimestamp(),
    });
  },
};
```

---

## 4. Cache e Revalidação

### `fetch` com cache nativo (quando usar REST/API routes)

```tsx
// Em Server Components
const dados = await fetch("https://api.exemplo.com/roles", {
  next: { revalidate: 60 },    // revalida a cada 60s
});

// Dados estáticos que nunca mudam
const config = await fetch("/api/config", {
  cache: "force-cache",
});

// Dados que devem ser sempre frescos
const perfil = await fetch(`/api/user/${id}`, {
  cache: "no-store",
});
```

### `unstable_cache` para funções Firestore

```tsx
import { unstable_cache } from "next/cache";

const listarRolesCache = unstable_cache(
  async () => rolesService.listar(),
  ["roles-lista"],
  { revalidate: 30 }
);
```

### Revalidação sob demanda

```tsx
// Em Server Actions ou Route Handlers
import { revalidatePath, revalidateTag } from "next/cache";

revalidatePath("/roles");          // revalida a página
revalidateTag("roles-lista");      // revalida pelo tag
```

---

## 5. O Que NÃO Fazer

| ❌ Anti-pattern | ✅ Fazer isso |
|---|---|
| Página com 300+ linhas | Quebrar em componentes de ~80 linhas |
| `"use client"` em tudo | SSR por padrão, client só com interatividade |
| Lógica de estado no componente | Extrair para custom hook |
| `getDoc()`/`setDoc()` no componente | Usar service |
| Fetch sem cache | Definir estratégia de cache explícita |
| Um `useEffect` com 5 responsabilidades | Um hook por responsabilidade |
| Comentários óbvios (`// seta o nome`) | Código autoexplicativo, comentar só o porquê |
| Gerar componente genérico "pra futuro" | Só abstrair quando tiver 2+ usos reais |

---

## 6. Checklist Rápido

Antes de entregar qualquer código, verifique:

- [ ] Componente tem menos de ~80 linhas?
- [ ] `"use client"` é realmente necessário?
- [ ] Lógica de estado está em um hook separado?
- [ ] Acesso a dados está em um service?
- [ ] Cache está definido para fetches/queries?
- [ ] Página (`page.tsx`) é só um orquestrador?
- [ ] Nenhum `console.log` de debug ficou no código?

Para exemplos detalhados de refatoração, veja [reference.md](reference.md).
