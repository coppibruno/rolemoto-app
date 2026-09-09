/**
 * Tela de Primeiro Acesso — Completar Perfil.
 *
 * Exibida após o primeiro login quando o usuário ainda não possui
 * documento na coleção `users` do Firestore. Coleta nome, apelido,
 * moto, pilotagem e foto para criar o perfil.
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { criarPerfilPrimeiroAcesso } from "@/lib/firestore";
import { uploadFotoPerfil } from "@/lib/storage";
import type { Pilotagem } from "@/types/user";
import styles from "./primeiro-acesso.module.css";

const PILOTAGEM_OPCOES: {
  valor: Pilotagem;
  emoji: string;
  titulo: string;
  descricao: string;
}[] = [
  {
    valor: "agressiva",
    emoji: "🔥",
    titulo: "Agressiva",
    descricao: "Gosta de acelerar e curvas fortes",
  },
  {
    valor: "moderada",
    emoji: "⚡",
    titulo: "Moderada",
    descricao: "Equilíbrio entre velocidade e conforto",
  },
  {
    valor: "tranquila",
    emoji: "🌿",
    titulo: "Tranquila",
    descricao: "Passeio relax, curtindo a paisagem",
  },
];

const MAX_FOTO_BYTES = 2 * 1024 * 1024; // 2 MB
const TIPOS_FOTO_ACEITOS = ["image/jpeg", "image/png"];

const PrimeiroAcessoPage = () => {
  const { firebaseUser, usuario, loading, recarregarPerfil } = useAuth();
  const router = useRouter();
  const fotoInputRef = useRef<HTMLInputElement>(null);

  // Campos do formulário
  const [nome, setNome] = useState("");
  const [apelido, setApelido] = useState("");
  const [moto, setMoto] = useState("");
  const [pilotagem, setPilotagem] = useState<Pilotagem | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string | null>(null);

  // Estado de UI
  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [fotoErro, setFotoErro] = useState<string | null>(null);
  const [tentouSubmit, setTentouSubmit] = useState(false);

  // Pré-preencher campos com dados do Google
  useEffect(() => {
    console.log('chega aqui4');
    if (firebaseUser) {
      if (firebaseUser.displayName) {
        setNome(firebaseUser.displayName);
      }
      if (firebaseUser.photoURL) {
        setFotoPreviewUrl(firebaseUser.photoURL);
      }
    }
  }, [firebaseUser]);

  // Proteção de rota
  useEffect(() => {
    console.log('chega aqui1');
    if (!loading && !firebaseUser) {
      console.log('chega aqui2');
      router.replace("/login");
    }
    if (!loading && firebaseUser && usuario) {
      console.log('chega aqui3');
      router.replace("/");
    }
  }, [loading, firebaseUser, usuario, router]);

  // Limpar ObjectURL ao desmontar
  useEffect(() => {
    console.log('chega aqui55');
    return () => {
      if (fotoFile && fotoPreviewUrl && fotoPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(fotoPreviewUrl);
      }
    };
  }, [fotoFile, fotoPreviewUrl]);

  if (loading || !firebaseUser || usuario) {
    return (
      <main className={styles.loadingContainer}>
        <div className={styles.spinnerPagina} />
      </main>
    );
  }

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFotoErro(null);

    if (!TIPOS_FOTO_ACEITOS.includes(file.type)) {
      setFotoErro("Formato inválido. Use JPG ou PNG.");
      return;
    }

    if (file.size > MAX_FOTO_BYTES) {
      setFotoErro("A foto deve ter no máximo 2MB.");
      return;
    }

    // Revogar URL anterior se era um blob
    if (fotoPreviewUrl && fotoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(fotoPreviewUrl);
    }

    setFotoFile(file);
    setFotoPreviewUrl(URL.createObjectURL(file));
  };

  const nomeValido = nome.trim().length >= 2;
  const apelidoValido = apelido.trim().length >= 2;
  const motoValida = moto.trim().length >= 2;
  const pilotagemValida = pilotagem !== null;
  const formularioValido = nomeValido && apelidoValido && motoValida && pilotagemValida;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTentouSubmit(true);
    setErroGeral(null);

    if (!formularioValido || !firebaseUser) return;

    setSalvando(true);

    try {
      let fotoUrl = "";

      if (fotoFile) {
        fotoUrl = await uploadFotoPerfil(firebaseUser.uid, fotoFile);
      } else if (firebaseUser.photoURL) {
        fotoUrl = firebaseUser.photoURL;
      }

      await criarPerfilPrimeiroAcesso(firebaseUser.uid, {
        nome: nome.trim(),
        apelido: apelido.trim(),
        moto: moto.trim(),
        pilotagem: pilotagem!,
        fotoUrl,
      });

      await recarregarPerfil();
      router.replace("/");
    } catch (error) {
      console.error("Erro ao criar perfil:", error);
      setErroGeral("Erro ao salvar o perfil. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <main className={styles.container}>
      
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logoIcon}>🏍️</div>
          <h1 className={styles.titulo}>Rolemoto</h1>
          <p className={styles.subtitulo}>Complete seu perfil</p>
        </div>

        {/* Foto de perfil */}
        <div className={styles.fotoContainer}>
          <div
            className={styles.fotoWrapper}
            onClick={() => fotoInputRef.current?.click()}
          >
            {fotoPreviewUrl ? (
              <img
                src={fotoPreviewUrl}
                alt="Foto de perfil"
                className={styles.fotoPreview}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={styles.fotoPlaceholder}>👤</div>
            )}
            <div className={styles.fotoCameraOverlay}>📷</div>
          </div>
          <input
            ref={fotoInputRef}
            type="file"
            accept="image/jpeg, image/png"
            className={styles.fotoInput}
            onChange={handleFotoChange}
            disabled={salvando}
          />
          <span className={styles.fotoLabel}>Toque para trocar a foto</span>
          {fotoErro && <span className={styles.fotoErro}>{fotoErro}</span>}
        </div>

        {/* Formulário */}
        <form className={styles.formulario} onSubmit={handleSubmit}>
          {/* Nome */}
          <div className={styles.campo}>
            <label htmlFor="nome" className={styles.label}>
              Nome
            </label>
            <input
              id="nome"
              type="text"
              className={`${styles.input} ${tentouSubmit && !nomeValido ? styles.inputErro : ""}`}
              placeholder="Seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={salvando}
              autoComplete="name"
            />
            {tentouSubmit && !nomeValido && (
              <span className={styles.erroInline}>Mínimo 2 caracteres</span>
            )}
          </div>

          {/* Apelido */}
          <div className={styles.campo}>
            <label htmlFor="apelido" className={styles.label}>
              Apelido
            </label>
            <input
              id="apelido"
              type="text"
              className={`${styles.input} ${tentouSubmit && !apelidoValido ? styles.inputErro : ""}`}
              placeholder="Como querem te chamar nos rolês"
              value={apelido}
              onChange={(e) => setApelido(e.target.value)}
              disabled={salvando}
            />
            {tentouSubmit && !apelidoValido && (
              <span className={styles.erroInline}>Mínimo 2 caracteres</span>
            )}
          </div>

          {/* Moto */}
          <div className={styles.campo}>
            <label htmlFor="moto" className={styles.label}>
              Moto
            </label>
            <input
              id="moto"
              type="text"
              className={`${styles.input} ${tentouSubmit && !motoValida ? styles.inputErro : ""}`}
              placeholder="Ex: CB 300, Ninja 650, Biz 125"
              value={moto}
              onChange={(e) => setMoto(e.target.value)}
              disabled={salvando}
            />
            {tentouSubmit && !motoValida && (
              <span className={styles.erroInline}>Mínimo 2 caracteres</span>
            )}
          </div>

          {/* Pilotagem */}
          <div>
            <span className={styles.pilotagemLabel}>Pilotagem</span>
            <div className={styles.pilotagemContainer}>
              {PILOTAGEM_OPCOES.map((opcao) => (
                <button
                  key={opcao.valor}
                  type="button"
                  className={`${styles.pilotagemCard} ${
                    pilotagem === opcao.valor ? styles.pilotagemCardSelecionado : ""
                  }`}
                  onClick={() => setPilotagem(opcao.valor)}
                  disabled={salvando}
                >
                  <span className={styles.pilotagemEmoji}>{opcao.emoji}</span>
                  <span className={styles.pilotagemTitulo}>{opcao.titulo}</span>
                  <span className={styles.pilotagemDescricao}>
                    {opcao.descricao}
                  </span>
                </button>
              ))}
            </div>
            {tentouSubmit && !pilotagemValida && (
              <span className={styles.pilotagemErro}>
                Selecione seu estilo de pilotagem
              </span>
            )}
          </div>

          {/* Botão salvar */}
          <button
            type="submit"
            className={styles.botaoSalvar}
            disabled={salvando}
          >
            {salvando ? (
              <>
                <div className={styles.spinnerBotao} />
                Salvando...
              </>
            ) : (
              "Salvar e Entrar"
            )}
          </button>
        </form>

        {/* Erro geral */}
        {erroGeral && (
          <div className={styles.erroGeral}>
            <span>⚠️</span> {erroGeral}
          </div>
        )}
      </div>
    </main>
  );
};

export default PrimeiroAcessoPage;
