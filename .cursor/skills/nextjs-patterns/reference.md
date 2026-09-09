# Referência — Exemplos Práticos de Refatoração

## Exemplo: Página "Primeiro Acesso" (antes vs depois)

### ❌ Antes — tudo em um arquivo (336 linhas)

Um único `page.tsx` com:
- Constantes de configuração
- Lógica de formulário (7 estados + validação)
- Lógica de upload de foto
- Proteção de rota
- Chamadas diretas a Firestore e Storage
- Todo o JSX de UI

### ✅ Depois — separado por responsabilidade

```
src/app/(auth)/primeiro-acesso/
├── page.tsx                          # ~25 linhas — orquestrador
├── components/
│   ├── FormularioPerfil.tsx           # ~60 linhas — UI do form
│   ├── SeletorPilotagem.tsx           # ~35 linhas — cards de pilotagem
│   └── FotoPerfil.tsx                 # ~40 linhas — upload + preview
├── hooks/
│   ├── useFormularioPerfil.ts         # ~50 linhas — estado do form
│   ├── useFotoPerfil.ts              # ~40 linhas — lógica de foto
│   └── useProtecaoRota.ts            # ~20 linhas — redirect se logado
└── primeiro-acesso.module.css
```

---

### page.tsx — Orquestrador fino

```tsx
"use client";
import { useAuth } from "@/hooks/useAuth";
import { useProtecaoRota } from "./hooks/useProtecaoRota";
import { FormularioPerfil } from "./components/FormularioPerfil";
import styles from "./primeiro-acesso.module.css";

const PrimeiroAcessoPage = () => {
  const { firebaseUser, loading, usuario } = useAuth();
  const { pronto } = useProtecaoRota({ firebaseUser, loading, usuario });

  if (!pronto) {
    return (
      <main className={styles.loadingContainer}>
        <div className={styles.spinnerPagina} />
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <FormularioPerfil firebaseUser={firebaseUser!} />
    </main>
  );
};

export default PrimeiroAcessoPage;
```

---

### hooks/useProtecaoRota.ts

```tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import type { Usuario } from "@/types/user";

interface Props {
  firebaseUser: User | null;
  loading: boolean;
  usuario: Usuario | null;
}

export const useProtecaoRota = ({ firebaseUser, loading, usuario }: Props) => {
  const router = useRouter();
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!firebaseUser) {
      router.replace("/login");
    } else if (usuario) {
      router.replace("/");
    } else {
      setPronto(true);
    }
  }, [loading, firebaseUser, usuario, router]);

  return { pronto };
};
```

---

### hooks/useFotoPerfil.ts

```tsx
import { useState, useRef, useEffect } from "react";

const MAX_BYTES = 2 * 1024 * 1024;
const TIPOS_ACEITOS = ["image/jpeg", "image/png"];

export const useFotoPerfil = (fotoInicial?: string | null) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(fotoInicial ?? null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const selecionarFoto = (file: File) => {
    setErro(null);

    if (!TIPOS_ACEITOS.includes(file.type)) {
      setErro("Formato inválido. Use JPG ou PNG.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setErro("A foto deve ter no máximo 2MB.");
      return;
    }

    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setArquivo(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const abrirSeletor = () => inputRef.current?.click();

  return { inputRef, arquivo, previewUrl, erro, selecionarFoto, abrirSeletor };
};
```

---

### hooks/useFormularioPerfil.ts

```tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { perfilService } from "@/services/perfil.service";
import { uploadFotoPerfil } from "@/lib/storage";
import type { Pilotagem } from "@/types/user";
import type { User } from "firebase/auth";

export const useFormularioPerfil = (firebaseUser: User) => {
  const router = useRouter();
  const { recarregarPerfil } = useAuth();

  const [nome, setNome] = useState(firebaseUser.displayName ?? "");
  const [apelido, setApelido] = useState("");
  const [moto, setMoto] = useState("");
  const [pilotagem, setPilotagem] = useState<Pilotagem | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tentouSubmit, setTentouSubmit] = useState(false);

  const validacao = {
    nome: nome.trim().length >= 2,
    apelido: apelido.trim().length >= 2,
    moto: moto.trim().length >= 2,
    pilotagem: pilotagem !== null,
  };
  const valido = Object.values(validacao).every(Boolean);

  const salvar = async (fotoArquivo: File | null) => {
    setTentouSubmit(true);
    setErro(null);
    if (!valido) return;

    setSalvando(true);
    try {
      let fotoUrl = firebaseUser.photoURL ?? "";
      if (fotoArquivo) {
        fotoUrl = await uploadFotoPerfil(firebaseUser.uid, fotoArquivo);
      }

      await perfilService.criarPrimeiroAcesso(firebaseUser.uid, {
        nome: nome.trim(),
        apelido: apelido.trim(),
        moto: moto.trim(),
        pilotagem: pilotagem!,
        fotoUrl,
      });

      await recarregarPerfil();
      router.replace("/");
    } catch {
      setErro("Erro ao salvar o perfil. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  return {
    campos: { nome, setNome, apelido, setApelido, moto, setMoto, pilotagem, setPilotagem },
    validacao,
    tentouSubmit,
    salvando,
    erro,
    salvar,
  };
};
```

---

### components/SeletorPilotagem.tsx

```tsx
import type { Pilotagem } from "@/types/user";
import styles from "../primeiro-acesso.module.css";

const OPCOES: { valor: Pilotagem; emoji: string; titulo: string; descricao: string }[] = [
  { valor: "agressiva", emoji: "🔥", titulo: "Agressiva", descricao: "Gosta de acelerar e curvas fortes" },
  { valor: "moderada", emoji: "⚡", titulo: "Moderada", descricao: "Equilíbrio entre velocidade e conforto" },
  { valor: "tranquila", emoji: "🌿", titulo: "Tranquila", descricao: "Passeio relax, curtindo a paisagem" },
];

interface Props {
  valor: Pilotagem | null;
  onChange: (p: Pilotagem) => void;
  erro?: boolean;
  disabled?: boolean;
}

export const SeletorPilotagem = ({ valor, onChange, erro, disabled }: Props) => (
  <div>
    <span className={styles.pilotagemLabel}>Pilotagem</span>
    <div className={styles.pilotagemContainer}>
      {OPCOES.map((op) => (
        <button
          key={op.valor}
          type="button"
          className={`${styles.pilotagemCard} ${valor === op.valor ? styles.pilotagemCardSelecionado : ""}`}
          onClick={() => onChange(op.valor)}
          disabled={disabled}
        >
          <span className={styles.pilotagemEmoji}>{op.emoji}</span>
          <span className={styles.pilotagemTitulo}>{op.titulo}</span>
          <span className={styles.pilotagemDescricao}>{op.descricao}</span>
        </button>
      ))}
    </div>
    {erro && <span className={styles.pilotagemErro}>Selecione seu estilo de pilotagem</span>}
  </div>
);
```

---

## Padrão de Service

### Estrutura

```
src/services/
├── perfil.service.ts       # CRUD de usuários
├── roles.service.ts        # CRUD de rolês
└── solicitacoes.service.ts # CRUD de solicitações
```

### Exemplo: roles.service.ts

```tsx
import { collection, doc, getDoc, getDocs, addDoc, query, orderBy, where, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Role, RoleForm } from "@/types/role";

export const rolesService = {
  buscar: async (id: string): Promise<Role | null> => {
    const snap = await getDoc(doc(db, "roles", id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Role : null;
  },

  listar: async (): Promise<Role[]> => {
    const q = query(collection(db, "roles"), orderBy("dataHoraSaida", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Role);
  },

  criar: async (dados: RoleForm): Promise<string> => {
    const ref = await addDoc(collection(db, "roles"), {
      ...dados,
      participantes: [dados.criadorId],
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  listarPorCriador: async (uid: string): Promise<Role[]> => {
    const q = query(collection(db, "roles"), where("criadorId", "==", uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Role);
  },
};
```

---

## Quando criar Client vs Server Component

| Cenário | Tipo | Motivo |
|---|---|---|
| Listagem de rolês | Server | Só exibe dados |
| Card de rolê | Server | Só exibe dados |
| Botão "Participar" | Client | `onClick` + estado |
| Formulário de criação | Client | `useState` + `onSubmit` |
| Filtros de busca | Client | `useState` + interatividade |
| Layout/Header | Server | Estrutura estática |
| Menu mobile (hamburger) | Client | Toggle de visibilidade |
| Página de detalhes | Server | Fetch + exibição |
