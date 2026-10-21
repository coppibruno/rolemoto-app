"use client";

import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Pilotagem, TipoMoto, Usuario } from "@/types/user";
import { CIDADE_MAX, CIDADE_MIN } from "../constants";
import { perfilService } from "../services/perfil.service";
import { useFotoPerfil } from "./useFotoPerfil";

export type ErrosEdicaoPerfil = {
  nome?: string;
  apelido?: string;
  moto?: string;
  tipoMoto?: string;
  cidade?: string;
  foto?: string;
  pilotagem?: string;
};

const validar = (campos: {
  nome: string;
  apelido: string;
  moto: string;
  cidade: string;
  pilotagem: Pilotagem | null;
}): ErrosEdicaoPerfil => {
  const erros: ErrosEdicaoPerfil = {};
  const nome = campos.nome.trim();
  const apelido = campos.apelido.trim().replace(/^@+/, "");
  const moto = campos.moto.trim();
  const cidade = campos.cidade.trim();

  if (!nome) erros.nome = "Informe o nome";
  else if (nome.length < 2) erros.nome = "Mínimo 2 caracteres";

  if (apelido.length === 1) erros.apelido = "Mínimo 2 caracteres";

  if (!moto) erros.moto = "Informe a moto";
  else if (moto.length < 2) erros.moto = "Mínimo 2 caracteres";

  if (cidade && cidade.length < CIDADE_MIN) erros.cidade = "Mínimo 2 caracteres";
  else if (cidade.length > CIDADE_MAX) erros.cidade = "Máximo 80 caracteres";

  if (!campos.pilotagem) {
    erros.pilotagem = "Selecione o ritmo de pilotagem";
  }

  return erros;
};

export const useFormularioPerfil = (usuario: Usuario, onSalvo: () => void) => {
  const { firebaseUser, recarregarPerfil } = useAuth();
  const foto = useFotoPerfil(usuario.fotoUrl);

  const [nome, setNome] = useState(usuario.nome);
  const [apelido, setApelido] = useState(usuario.apelido);
  const [moto, setMoto] = useState(usuario.moto ?? "");
  const [tipoMoto, setTipoMoto] = useState<TipoMoto | null>(
    usuario.tipoMoto ?? null,
  );
  const [cidade, setCidade] = useState(usuario.cidade ?? "");
  const [garupaFrequente, setGarupaFrequente] = useState(
    Boolean(usuario.garupaFrequente),
  );
  const [pilotagem, setPilotagem] = useState<Pilotagem | null>(
    usuario.pilotagem,
  );
  const [erros, setErros] = useState<ErrosEdicaoPerfil>({});
  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    setErroGeral(null);

    const errosAtuais = validar({
      nome,
      apelido,
      moto,
      cidade,
      pilotagem,
    });
    setErros(errosAtuais);

    if (Object.keys(errosAtuais).length > 0) return;
    if (!firebaseUser || !pilotagem) return;

    setSalvando(true);
    try {
      const fotoUrl = await foto.enviar(firebaseUser.uid, usuario.fotoUrl);
      await perfilService.atualizar({
        nome: nome.trim(),
        apelido: apelido.trim().replace(/^@+/, ""),
        fotoUrl,
        pilotagem,
        moto: moto.trim(),
        tipoMoto,
        garupaFrequente,
        cidade: cidade.trim(),
      });
      await recarregarPerfil();
      foto.limparArquivo();
      setErros({});
      onSalvo();
    } catch (erro) {
      console.error(erro);
      const mensagem =
        erro instanceof ApiError
          ? erro.message
          : "Erro ao salvar o perfil. Tente novamente.";
      setErroGeral(mensagem);
    } finally {
      setSalvando(false);
    }
  };

  return {
    nome,
    setNome,
    apelido,
    setApelido,
    moto,
    setMoto,
    tipoMoto,
    setTipoMoto,
    cidade,
    setCidade,
    garupaFrequente,
    setGarupaFrequente,
    pilotagem,
    setPilotagem,
    foto,
    erros,
    salvando,
    erroGeral,
    salvar,
  };
};
