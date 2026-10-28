import {Router, Request, Response} from "express";
import {responderErro} from "../middleware/errors";
import {rateLimit} from "../middleware/rate-limit";
import {param} from "../lib/params";
import {localRepository} from "../repositories";
import type {LocalPublico} from "../types/local-publico";

/**
 * Leitura pública do convite de local — sem Bearer, sem lat/lng.
 *
 * GET /publico/locais/:id
 */
export const locaisPublicoRouter = Router();

locaisPublicoRouter.use(rateLimit({nome: "publico-locais", max: 60}));

locaisPublicoRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = param(req, "id");
    const local = await localRepository.buscarPorId(id);
    if (!local) {
      res.status(404).json({erro: "Local não encontrado"});
      return;
    }

    const dto: LocalPublico = {
      id: local.id,
      nome: local.nome,
      endereco: local.endereco,
      categoria: local.categoria,
      facilidades: local.facilidades,
      aberto24h: local.aberto24h,
      horarios: local.horarios,
      fotoFachadaUrl: local.fotoFachadaUrl,
      notaMedia: local.notaMedia,
      totalAvaliacoes: local.totalAvaliacoes,
      recomendacoesComboio: local.recomendacoesComboio,
    };

    res.json(dto);
  } catch (error) {
    responderErro(res, error);
  }
});
