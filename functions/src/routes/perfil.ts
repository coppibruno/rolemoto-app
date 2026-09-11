import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {responderErro} from "../middleware/errors";
import {dispositivoRepository, usuarioRepository} from "../repositories";
import {historicoRouter} from "./historico";
import type {
  Pilotagem,
  UsuarioEdicao,
  UsuarioPrimeiroAcesso,
} from "../types/usuario";

const PILOTAGENS_VALIDAS: Pilotagem[] = ["agressiva", "moderada", "tranquila"];
const ERRO_CAMPOS_OBRIGATORIOS =
  "nome, apelido, fotoUrl, pilotagem, moto e garupaFrequente são obrigatórios";

type ResultadoEdicao =
  | {ok: true; dados: UsuarioEdicao}
  | {ok: false; erro: string};

type ResultadoPrimeiroAcesso =
  | {ok: true; dados: UsuarioPrimeiroAcesso}
  | {ok: false; erro: string};

const validarUsuarioEdicao = (body: unknown): ResultadoEdicao => {
  if (!body || typeof body !== "object") {
    return {ok: false, erro: ERRO_CAMPOS_OBRIGATORIOS};
  }

  const bruto = body as Record<string, unknown>;
  const nome = typeof bruto.nome === "string" ? bruto.nome.trim() : "";
  const apelido = typeof bruto.apelido === "string" ? bruto.apelido.trim() : "";
  const fotoUrl = typeof bruto.fotoUrl === "string" ? bruto.fotoUrl.trim() : "";
  const moto = typeof bruto.moto === "string" ? bruto.moto.trim() : "";
  const pilotagem = bruto.pilotagem;

  if (nome.length < 2 || apelido.length < 2 || fotoUrl.length === 0) {
    return {ok: false, erro: ERRO_CAMPOS_OBRIGATORIOS};
  }

  if (moto.length < 2) {
    return {ok: false, erro: "moto é obrigatório"};
  }

  if (typeof bruto.garupaFrequente !== "boolean") {
    return {ok: false, erro: "garupaFrequente é obrigatório"};
  }

  if (typeof pilotagem !== "string" || !pilotagem) {
    return {ok: false, erro: ERRO_CAMPOS_OBRIGATORIOS};
  }

  if (!PILOTAGENS_VALIDAS.includes(pilotagem as Pilotagem)) {
    return {ok: false, erro: "pilotagem inválida"};
  }

  return {
    ok: true,
    dados: {
      nome,
      apelido,
      fotoUrl,
      pilotagem: pilotagem as Pilotagem,
      moto,
      garupaFrequente: bruto.garupaFrequente,
    },
  };
};

const validarUsuarioPrimeiroAcesso = (
  body: unknown,
): ResultadoPrimeiroAcesso => {
  if (!body || typeof body !== "object") {
    return {ok: false, erro: "nome é obrigatório"};
  }

  const bruto = body as Record<string, unknown>;
  const nome = typeof bruto.nome === "string" ? bruto.nome.trim() : "";
  const apelido =
    typeof bruto.apelido === "string" ?
      bruto.apelido.trim().replace(/^@+/, "") :
      "";
  const moto = typeof bruto.moto === "string" ? bruto.moto.trim() : "";
  const fotoUrl = typeof bruto.fotoUrl === "string" ? bruto.fotoUrl : "";
  const pilotagem = bruto.pilotagem;

  if (nome.length < 2) {
    return {ok: false, erro: "nome é obrigatório"};
  }
  if (apelido.length < 2) {
    return {ok: false, erro: "apelido é obrigatório"};
  }
  if (moto.length < 2) {
    return {ok: false, erro: "moto é obrigatório"};
  }
  if (bruto.fotoUrl !== undefined && typeof bruto.fotoUrl !== "string") {
    return {ok: false, erro: "fotoUrl inválido"};
  }
  if (typeof bruto.garupaFrequente !== "boolean") {
    return {ok: false, erro: "garupaFrequente é obrigatório"};
  }
  if (typeof pilotagem !== "string" || !pilotagem) {
    return {ok: false, erro: "pilotagem é obrigatória"};
  }
  if (!PILOTAGENS_VALIDAS.includes(pilotagem as Pilotagem)) {
    return {ok: false, erro: "pilotagem inválida"};
  }

  return {
    ok: true,
    dados: {
      nome,
      apelido,
      moto,
      fotoUrl,
      pilotagem: pilotagem as Pilotagem,
      garupaFrequente: bruto.garupaFrequente,
    },
  };
};

/**
 * REST de perfil do usuário autenticado (sempre o próprio uid).
 *
 * GET    /perfil
 * GET    /perfil/historico
 * POST   /perfil
 * PUT    /perfil
 * DELETE /perfil
 */
export const perfilRouter = Router();

perfilRouter.use(autenticar);
perfilRouter.use(historicoRouter);

perfilRouter.get("/", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const perfil = await usuarioRepository.buscarPorId(uid);
    if (!perfil) {
      res.status(404).json({erro: "Perfil não encontrado"});
      return;
    }
    res.json(perfil);
  } catch (error) {
    responderErro(res, error);
  }
});

perfilRouter.post("/", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const existente = await usuarioRepository.buscarPorId(uid);
    if (existente) {
      res.status(409).json({erro: "Perfil já existe"});
      return;
    }

    const resultado = validarUsuarioPrimeiroAcesso(req.body);
    if (!resultado.ok) {
      res.status(400).json({erro: resultado.erro});
      return;
    }

    const criado = await usuarioRepository.criar(uid, {
      nome: resultado.dados.nome,
      apelido: resultado.dados.apelido,
      moto: resultado.dados.moto,
      pilotagem: resultado.dados.pilotagem,
      fotoUrl: resultado.dados.fotoUrl,
      cidade: "",
      garupaFrequente: resultado.dados.garupaFrequente,
    });
    res.status(201).json(criado);
  } catch (error) {
    responderErro(res, error);
  }
});

perfilRouter.put("/", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const resultado = validarUsuarioEdicao(req.body);
    if (!resultado.ok) {
      res.status(400).json({erro: resultado.erro});
      return;
    }

    const atualizado = await usuarioRepository.atualizar(uid, resultado.dados);
    if (!atualizado) {
      res.status(404).json({erro: "Perfil não encontrado"});
      return;
    }
    res.json(atualizado);
  } catch (error) {
    responderErro(res, error);
  }
});

perfilRouter.delete("/", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    try {
      await dispositivoRepository.removerPorUid(uid);
    } catch (error) {
      console.error(error);
    }

    const removido = await usuarioRepository.remover(uid);
    if (!removido) {
      res.status(404).json({erro: "Perfil não encontrado"});
      return;
    }
    res.status(204).send();
  } catch (error) {
    responderErro(res, error);
  }
});
