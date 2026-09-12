"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { destinoSeguro, urlLoginComNext } from "@/lib/destino-pos-auth";
import { useAuth } from "@/hooks/useAuth";
import type { ErrosPrimeiroAcesso, Pilotagem } from "@/types/user";
import {
  COPY,
  DELAY_MOTOR_MS,
  DELAY_SUCESSO_MS,
  normalizarApelido,
} from "../constants";
import { perfilPrimeiroAcessoService } from "../services/perfil.service";
import { useFotoPrimeiroAcesso } from "./useFotoPrimeiroAcesso";

const esperar = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const validar = (campos: {
  nome: string;
  apelido: string;
  moto: string;
  pilotagem: Pilotagem | null;
}): ErrosPrimeiroAcesso => {
  const erros: ErrosPrimeiroAcesso = {};
  const nome = campos.nome.trim();
  const apelido = normalizarApelido(campos.apelido);
  const moto = campos.moto.trim();

  if (!nome) erros.nome = "Informe o nome";
  else if (nome.length < 2) erros.nome = "Mínimo 2 caracteres";

  if (!apelido) erros.apelido = "Informe o apelido";
  else if (apelido.length < 2) erros.apelido = "Mínimo 2 caracteres";

  if (!moto) erros.moto = "Informe a moto";
  else if (moto.length < 2) erros.moto = "Mínimo 2 caracteres";

  if (!campos.pilotagem) {
    erros.pilotagem = "Selecione o ritmo de pilotagem";
  }

  return erros;
};

export const useFormularioPrimeiroAcesso = (next: string | null) => {
  const { firebaseUser, recarregarPerfil } = useAuth();
  const router = useRouter();
  const foto = useFotoPrimeiroAcesso(firebaseUser?.photoURL ?? "");

  const [nome, setNome] = useState(firebaseUser?.displayName ?? "");
  const [apelido, setApelidoEstado] = useState("");
  const [moto, setMoto] = useState("");
  const [garupaFrequente, setGarupaFrequente] = useState(false);
  const [pilotagem, setPilotagem] = useState<Pilotagem | null>(null);
  const [erros, setErros] = useState<ErrosPrimeiroAcesso>({});
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const nomeHidratado = useRef(Boolean(firebaseUser?.displayName));

  const setApelido = (valor: string) => {
    setApelidoEstado(valor.replace(/^@+/, ""));
  };

  useEffect(() => {
    if (nomeHidratado.current || !firebaseUser) return;
    nomeHidratado.current = true;
    if (firebaseUser.displayName) {
      setNome(firebaseUser.displayName);
    }
  }, [firebaseUser]);

  useEffect(() => {
    const id = nome.trim().length >= 2 ? "apelido" : "nome-completo";
    document.getElementById(id)?.focus();
  }, []);

  const preenchidos = [
    nome.trim().length >= 2,
    normalizarApelido(apelido).length >= 2,
    moto.trim().length >= 2,
    pilotagem !== null,
  ].filter(Boolean).length;

  const percentual = Math.round((preenchidos / 4) * 100);
  const valido = preenchidos === 4 && !foto.erro;

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    setErroGeral(null);

    const errosAtuais = validar({ nome, apelido, moto, pilotagem });
    if (foto.erro) errosAtuais.foto = foto.erro;
    setErros(errosAtuais);

    if (Object.keys(errosAtuais).length > 0 || !firebaseUser || !pilotagem) {
      return;
    }

    setSalvando(true);
    const inicio = Date.now();

    try {
      const fotoUrl = await foto.enviar(
        firebaseUser.uid,
        firebaseUser.photoURL ?? "",
      );

      await perfilPrimeiroAcessoService.criar({
        nome: nome.trim(),
        apelido: normalizarApelido(apelido),
        moto: moto.trim(),
        pilotagem,
        fotoUrl,
        garupaFrequente,
      });

      const decorrido = Date.now() - inicio;
      if (decorrido < DELAY_MOTOR_MS) {
        await esperar(DELAY_MOTOR_MS - decorrido);
      }

      setSucesso(true);
      await esperar(DELAY_SUCESSO_MS);
      await recarregarPerfil();
      router.replace(destinoSeguro(next));
    } catch (erro) {
      console.error(erro);
      if (erro instanceof ApiError && erro.status === 409) {
        await recarregarPerfil();
        router.replace(destinoSeguro(next));
        return;
      }
      if (erro instanceof ApiError && erro.status === 401) {
        router.replace(urlLoginComNext(destinoSeguro(next)));
        return;
      }
      setErroGeral(erro instanceof ApiError ? erro.message : COPY.erroGenerico);
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
    garupaFrequente,
    setGarupaFrequente,
    pilotagem,
    setPilotagem,
    foto,
    erros,
    salvando,
    sucesso,
    erroGeral,
    percentual,
    valido,
    salvar,
  };
};
