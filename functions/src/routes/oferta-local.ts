import {Router, Request, Response} from "express";
import {apelidoExibicao} from "../lib/apelido";
import {papelNoLocal, soltarDono} from "../lib/dono-local";
import {log} from "../lib/log";
import {
  LIMITE_OFERTAS_POR_LOCAL,
  inicioSemanaSaoPaulo,
  ofertaVigente,
  paraOfertaCliente,
  rotuloOferta,
  validarOferta,
} from "../lib/oferta-local";
import {param} from "../lib/params";
import {ymdSaoPaulo} from "../lib/quando";
import {responderErro} from "../middleware/errors";
import {
  localRepository,
  ofertaLocalRepository,
  usuarioLocalCheckinRepository,
  usuarioOfertaCupomRepository,
  usuarioRepository,
} from "../repositories";
import type {Local} from "../types/local";
import type {BalcaoLocal, CupomOferta, OfertaLocal} from "../types/oferta-local";

/**
 * Vitrine de parceria do local (SPEC 059).
 *
 * PUT    /locais/:id/dono                      (admin)
 * GET    /locais/:id/ofertas
 * POST   /locais/:id/ofertas                   (dono ou admin)
 * PUT|PATCH|DELETE /locais/:id/ofertas/:ofertaId (dono ou admin)
 * POST   /locais/:id/ofertas/:ofertaId/cupom
 * GET    /locais/:id/balcao                    (dono ou admin)
 */
export const ofertaLocalRouter = Router();

type Contexto = {uid: string; local: Local; donoId: string | null};

const ERRO_SEM_PERMISSAO = "Sem permissão";
const ERRO_OFERTA_AUSENTE = "Oferta não encontrada";
const ERRO_CODIGO_EM_USO = "Já existe uma oferta com esse código neste local";

const carregarLocal = async (req: Request, res: Response): Promise<Contexto | null> => {
  const uid = req.usuario?.uid;
  if (!uid) {
    res.status(401).json({erro: "Não autenticado"});
    return null;
  }
  const achado = await localRepository.buscarComDono(param(req, "id"));
  if (!achado) {
    res.status(404).json({erro: "Local não encontrado"});
    return null;
  }
  return {uid, ...achado};
};

/** Contexto só para o dono do local ou admin; responde 403 para os outros. */
const carregarComoGestor = async (req: Request, res: Response): Promise<Contexto | null> => {
  const ctx = await carregarLocal(req, res);
  if (!ctx) {
    return null;
  }
  const papel = await papelNoLocal(ctx.uid, ctx.donoId);
  if (!papel.dono && !papel.admin) {
    res.status(403).json({erro: ERRO_SEM_PERMISSAO});
    return null;
  }
  return ctx;
};

const ofertaDoLocal = async (
  req: Request,
  res: Response,
  localId: string,
): Promise<OfertaLocal | null> => {
  const oferta = await ofertaLocalRepository.buscarPorId(param(req, "ofertaId"));
  if (!oferta || oferta.localId !== localId) {
    res.status(404).json({erro: ERRO_OFERTA_AUSENTE});
    return null;
  }
  return oferta;
};

ofertaLocalRouter.put("/:id/dono", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
    const perfil = await usuarioRepository.buscarPorId(uid);
    if (perfil?.admin !== true) {
      res.status(403).json({erro: ERRO_SEM_PERMISSAO});
      return;
    }
    const novo = (req.body as {uid?: unknown} | undefined)?.uid;
    if (novo !== null && (typeof novo !== "string" || !novo.trim())) {
      res.status(400).json({erro: "uid é obrigatório"});
      return;
    }
    const localId = param(req, "id");
    const achado = await localRepository.buscarComDono(localId);
    if (!achado) {
      res.status(404).json({erro: "Local não encontrado"});
      return;
    }
    if (novo === null) {
      await soltarDono(localId);
      log.info("OfertaLocal", "Dono solto", {localId, adminId: uid});
      res.json({donoId: null});
      return;
    }
    const donoId = novo.trim();
    if (!(await usuarioRepository.buscarPorId(donoId))) {
      res.status(404).json({erro: "Piloto não encontrado"});
      return;
    }
    if (achado.donoId !== donoId) {
      await localRepository.definirDono(localId, donoId);
    }
    log.info("OfertaLocal", "Dono vinculado", {localId, donoId, adminId: uid});
    res.json({donoId});
  } catch (error) {
    responderErro(res, error);
  }
});

ofertaLocalRouter.get("/:id/ofertas", async (req: Request, res: Response) => {
  try {
    const ctx = await carregarLocal(req, res);
    if (!ctx) {
      return;
    }
    const papel = await papelNoLocal(ctx.uid, ctx.donoId);
    const gestor = papel.dono || papel.admin;
    const agora = new Date();
    const ofertas = await ofertaLocalRepository.listarPorLocal(ctx.local.id);
    res.json(
      ofertas
        .filter((oferta) => gestor || oferta.ativa)
        .map((oferta) => paraOfertaCliente(oferta, agora, gestor)),
    );
  } catch (error) {
    responderErro(res, error);
  }
});

ofertaLocalRouter.post("/:id/ofertas", async (req: Request, res: Response) => {
  try {
    const ctx = await carregarComoGestor(req, res);
    if (!ctx) {
      return;
    }
    const validado = validarOferta(req.body);
    if (!validado.ok) {
      res.status(400).json({erro: validado.erro});
      return;
    }
    const resultado = await ofertaLocalRepository.criar(
      ctx.local.id,
      validado.dados,
      LIMITE_OFERTAS_POR_LOCAL,
    );
    if (resultado.tipo === "teto") {
      res.status(409).json({erro: `Este local já tem ${LIMITE_OFERTAS_POR_LOCAL} ofertas`});
      return;
    }
    if (resultado.tipo === "codigo") {
      res.status(409).json({erro: ERRO_CODIGO_EM_USO});
      return;
    }
    log.info("OfertaLocal", "Oferta criada", {
      localId: ctx.local.id,
      ofertaId: resultado.oferta.id,
      uid: ctx.uid,
    });
    res.status(201).json(paraOfertaCliente(resultado.oferta, new Date(), true));
  } catch (error) {
    responderErro(res, error);
  }
});

ofertaLocalRouter.put("/:id/ofertas/:ofertaId", async (req: Request, res: Response) => {
  try {
    const ctx = await carregarComoGestor(req, res);
    if (!ctx) {
      return;
    }
    const validado = validarOferta(req.body);
    if (!validado.ok) {
      res.status(400).json({erro: validado.erro});
      return;
    }
    const ativa = (req.body as {ativa?: unknown}).ativa;
    if (typeof ativa !== "boolean") {
      res.status(400).json({erro: "ativa é obrigatória"});
      return;
    }
    const resultado = await ofertaLocalRepository.atualizar(
      param(req, "ofertaId"),
      ctx.local.id,
      {...validado.dados, ativa},
    );
    if (resultado.tipo === "ausente") {
      res.status(404).json({erro: ERRO_OFERTA_AUSENTE});
      return;
    }
    if (resultado.tipo === "codigo") {
      res.status(409).json({erro: ERRO_CODIGO_EM_USO});
      return;
    }
    res.json(paraOfertaCliente(resultado.oferta, new Date(), true));
  } catch (error) {
    responderErro(res, error);
  }
});

ofertaLocalRouter.patch("/:id/ofertas/:ofertaId", async (req: Request, res: Response) => {
  try {
    const ctx = await carregarComoGestor(req, res);
    if (!ctx) {
      return;
    }
    const ativa = (req.body as {ativa?: unknown} | undefined)?.ativa;
    if (typeof ativa !== "boolean") {
      res.status(400).json({erro: "ativa é obrigatória"});
      return;
    }
    const oferta = await ofertaDoLocal(req, res, ctx.local.id);
    if (!oferta) {
      return;
    }
    const atualizada = await ofertaLocalRepository.definirAtiva(oferta.id, ativa);
    if (!atualizada) {
      res.status(404).json({erro: ERRO_OFERTA_AUSENTE});
      return;
    }
    res.json(paraOfertaCliente(atualizada, new Date(), true));
  } catch (error) {
    responderErro(res, error);
  }
});

ofertaLocalRouter.delete("/:id/ofertas/:ofertaId", async (req: Request, res: Response) => {
  try {
    const ctx = await carregarComoGestor(req, res);
    if (!ctx) {
      return;
    }
    const oferta = await ofertaDoLocal(req, res, ctx.local.id);
    if (!oferta) {
      return;
    }
    await ofertaLocalRepository.remover(oferta.id);
    log.info("OfertaLocal", "Oferta apagada", {localId: ctx.local.id, ofertaId: oferta.id});
    res.status(204).send();
  } catch (error) {
    responderErro(res, error);
  }
});

ofertaLocalRouter.post(
  "/:id/ofertas/:ofertaId/cupom",
  async (req: Request, res: Response) => {
    try {
      const ctx = await carregarLocal(req, res);
      if (!ctx) {
        return;
      }
      const oferta = await ofertaDoLocal(req, res, ctx.local.id);
      if (!oferta) {
        return;
      }
      if (!oferta.ativa) {
        res.status(404).json({erro: ERRO_OFERTA_AUSENTE});
        return;
      }
      const agora = new Date();
      if (!ofertaVigente(oferta, agora)) {
        res.status(409).json({erro: "Essa oferta não está no ar agora"});
        return;
      }
      const [{novo}, perfil] = await Promise.all([
        usuarioOfertaCupomRepository.abrir({
          usuarioId: ctx.uid,
          ofertaId: oferta.id,
          localId: ctx.local.id,
          ymd: ymdSaoPaulo(agora),
        }),
        usuarioRepository.buscarPorId(ctx.uid),
      ]);
      const cupom: CupomOferta = {
        ofertaId: oferta.id,
        titulo: oferta.titulo,
        rotulo: rotuloOferta(oferta.tipo, oferta.valor),
        regra: oferta.regra,
        tetoDia: oferta.tetoDia,
        dias: oferta.dias,
        horaInicio: oferta.horaInicio,
        horaFim: oferta.horaFim,
        codigo: oferta.codigo,
        piloto: {nome: apelidoExibicao(perfil), moto: perfil?.moto.trim() ?? ""},
        novo,
      };
      res.json(cupom);
    } catch (error) {
      responderErro(res, error);
    }
  },
);

ofertaLocalRouter.get("/:id/balcao", async (req: Request, res: Response) => {
  try {
    const ctx = await carregarComoGestor(req, res);
    if (!ctx) {
      return;
    }
    const agora = new Date();
    const desde = inicioSemanaSaoPaulo(agora);
    const [ofertas, cuponsAbertos, checkins] = await Promise.all([
      ofertaLocalRepository.listarPorLocal(ctx.local.id),
      usuarioOfertaCupomRepository.contarPorLocalDesde(ctx.local.id, desde),
      usuarioLocalCheckinRepository.contarPorLocalDesde(ctx.local.id, desde),
    ]);
    const balcao: BalcaoLocal = {
      local: {id: ctx.local.id, nome: ctx.local.nome},
      semana: {cuponsAbertos, checkins},
      ofertas: ofertas.map((oferta) => paraOfertaCliente(oferta, agora, true)),
    };
    res.json(balcao);
  } catch (error) {
    responderErro(res, error);
  }
});
