"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { seguirService } from "@/app/(app)/seguir/services/seguir.service";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import { eventoAceitaConvite } from "@/lib/evento-aberto";
import type { ResultadoConvite } from "@/types/convite-evento";
import type { EventoDetalhe } from "@/types/evento";
import type { LinhaPiloto } from "@/types/seguir";
import { eventoDetalheService } from "../../services/evento-detalhe.service";
import { conviteEventoService } from "../services/convite-evento.service";

const TETO = 20;

export type ChipConvite = "seguindo" | "seguidores";
export type ModoLista = "chip" | "curto" | "busca";
export type FaseLista = "ociosa" | "carregando" | "ok" | "vazio" | "erro";

const termoDaBusca = (valor: string) => valor.trim().replace(/\s+/g, " ");

const unir = (atual: Set<string>, novos: string[]) => {
  if (novos.every((uid) => atual.has(uid))) return atual;
  const proximo = new Set(atual);
  for (const uid of novos) proximo.add(uid);
  return proximo;
};

export const useConvidarEvento = (eventoId: string) => {
  const { usuario, loading: authLoading } = useAuth();
  const meuUid = usuario?.uid ?? "";
  const [evento, setEvento] = useState<EventoDetalhe | null>(null);
  const [faseEvento, setFaseEvento] = useState<"carregando" | "ok" | "erro">("carregando");
  const [mensagemEvento, setMensagemEvento] = useState("Não deu para carregar agora");
  const [texto, setTexto] = useState("");
  const [chip, setChip] = useState<ChipConvite>("seguindo");
  const [itens, setItens] = useState<LinhaPiloto[]>([]);
  const [faseLista, setFaseLista] = useState<FaseLista>("ociosa");
  const [inscritos, setInscritos] = useState<Set<string>>(() => new Set());
  const [convidados, setConvidados] = useState<Set<string>>(() => new Set());
  const [marcados, setMarcados] = useState<Set<string>>(() => new Set());
  const [avisoTeto, setAvisoTeto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoConvite | null>(null);
  const [tentativaEvento, setTentativaEvento] = useState(0);
  const [tentativaLista, setTentativaLista] = useState(0);
  const pedido = useRef(0);

  const termo = termoDaBusca(texto);
  const modo: ModoLista = termo.length === 0 ? "chip" : termo.length < 2 ? "curto" : "busca";
  const aberto = evento ? eventoAceitaConvite(evento) : false;

  useEffect(() => {
    let cancelado = false;
    setFaseEvento("carregando");
    eventoDetalheService
      .buscar(eventoId)
      .then((dados) => {
        if (cancelado) return;
        setEvento(dados);
        setFaseEvento("ok");
      })
      .catch((erro: unknown) => {
        if (cancelado) return;
        setEvento(null);
        setMensagemEvento(
          erro instanceof ApiError && erro.status === 404
            ? "Evento não encontrado"
            : "Não deu para carregar agora",
        );
        setFaseEvento("erro");
      });
    return () => {
      cancelado = true;
    };
  }, [eventoId, tentativaEvento]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!aberto || !meuUid || resultado) return;
    const id = pedido.current + 1;
    pedido.current = id;
    if (modo === "curto") {
      setItens([]);
      setFaseLista("ociosa");
      return;
    }

    setFaseLista("carregando");
    if (modo === "busca") setItens([]);

    const buscar = async () => {
      try {
        const pagina =
          modo === "busca"
            ? await seguirService.busca(termo)
            : await seguirService.listar(meuUid, chip, null);
        if (id !== pedido.current) return;
        const pessoas = pagina.itens.filter((pessoa) => pessoa.uid !== meuUid);
        setItens(pessoas);
        setFaseLista(pessoas.length === 0 ? "vazio" : "ok");
      } catch {
        if (id !== pedido.current) return;
        setItens([]);
        setFaseLista("erro");
      }
    };

    if (modo === "chip") {
      void buscar();
      return;
    }
    const timer = window.setTimeout(() => {
      void buscar();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [aberto, meuUid, resultado, modo, termo, chip, tentativaLista]);

  useEffect(() => {
    if (!aberto || resultado || itens.length === 0) return;
    let cancelado = false;
    const uids = itens.map((pessoa) => pessoa.uid);
    conviteEventoService
      .situacao(eventoId, uids)
      .then((resp) => {
        if (cancelado) return;
        setInscritos((atual) => unir(atual, resp.inscritos));
        setConvidados((atual) => unir(atual, resp.convidados));
      })
      .catch(() => {
        if (!cancelado) setFaseLista("erro");
      });
    return () => {
      cancelado = true;
    };
  }, [aberto, resultado, itens, eventoId]);

  useEffect(() => {
    setMarcados((atual) => {
      const proximo = new Set(
        [...atual].filter((uid) => !inscritos.has(uid) && !convidados.has(uid)),
      );
      return proximo.size === atual.size ? atual : proximo;
    });
  }, [inscritos, convidados]);

  const alternar = (uid: string) => {
    if (enviando || resultado) return;
    if (inscritos.has(uid) || convidados.has(uid)) return;
    if (marcados.has(uid)) {
      setMarcados((atual) => {
        const proximo = new Set(atual);
        proximo.delete(uid);
        return proximo;
      });
      setAvisoTeto(false);
      return;
    }
    if (marcados.size >= TETO) {
      setAvisoTeto(true);
      return;
    }
    setMarcados((atual) => {
      if (atual.has(uid) || atual.size >= TETO) return atual;
      const proximo = new Set(atual);
      proximo.add(uid);
      return proximo;
    });
  };

  const confirmar = useCallback(async () => {
    if (enviando || marcados.size === 0) return;
    const uids = [...marcados];
    setEnviando(true);
    setToast(null);
    try {
      const resp = await conviteEventoService.enviar(eventoId, uids);
      setResultado(resp);
      setMarcados(new Set());
      setAvisoTeto(false);
    } catch {
      setToast("Não deu para convidar agora");
    } finally {
      setEnviando(false);
    }
  }, [enviando, marcados, eventoId]);

  const tentarEvento = () => setTentativaEvento((atual) => atual + 1);
  const tentarLista = () => setTentativaLista((atual) => atual + 1);

  const textoVazio =
    modo === "busca"
      ? "Nenhum piloto com esse nome"
      : chip === "seguidores"
        ? "Ninguém te segue ainda"
        : "Você ainda não segue ninguém";

  return {
    authLoading,
    evento,
    faseEvento,
    mensagemEvento,
    aberto,
    texto,
    setTexto,
    chip,
    setChip,
    modo,
    itens,
    faseLista,
    inscritos,
    convidados,
    marcados,
    avisoTeto,
    enviando,
    toast,
    resultado,
    textoVazio,
    alternar,
    confirmar,
    tentarEvento,
    tentarLista,
  };
};
