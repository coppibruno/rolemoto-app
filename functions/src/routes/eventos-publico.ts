import {Router, Request, Response} from "express";
import {responderErro} from "../middleware/errors";
import {rateLimit} from "../middleware/rate-limit";
import {apelidoExibicao} from "../lib/apelido";
import {param} from "../lib/params";
import {
  eventoRepository,
  usuarioEventoRepository,
  usuarioRepository,
} from "../repositories";
import type {
  CriadorPublico,
  EventoPublico,
  ParticipanteDestaque,
} from "../types/evento-publico";
import type {Usuario} from "../types/usuario";

/**
 * Leitura pública do convite de evento — sem Bearer, sem lat/lng, sem inscrição.
 *
 * GET /publico/eventos/:id
 */
export const eventosPublicoRouter = Router();

eventosPublicoRouter.use(rateLimit({nome: "publico-eventos", max: 60}));

const LIMITE_DESTAQUES = 4;

const iniciaisDe = (nome: string, apelido: string): string => {
  const fonte = nome.trim() || apelido.trim() || "P";
  const tokens = fonte.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
  }
  const unico = tokens[0];
  if (unico.length >= 2) {
    return unico.slice(0, 2).toUpperCase();
  }
  return `${unico[0]}${unico[0]}`.toUpperCase();
};

const criadorPublico = (
  criadorId: string,
  usuario: Usuario | null,
): CriadorPublico => ({
  uid: criadorId,
  nome: usuario?.nome ?? "",
  apelido: apelidoExibicao(usuario),
  fotoUrl: usuario?.fotoUrl ?? "",
  moto: usuario?.moto ?? "",
});

const destaquesDe = (
  vinculos: {usuarioId: string}[],
  usuarios: Usuario[],
): ParticipanteDestaque[] => {
  const porId = new Map(usuarios.map((u) => [u.uid, u]));
  const destaques: ParticipanteDestaque[] = [];
  for (const vinculo of vinculos) {
    const usuario = porId.get(vinculo.usuarioId);
    if (!usuario) continue;
    destaques.push({
      iniciais: iniciaisDe(usuario.nome, usuario.apelido),
      fotoUrl: usuario.fotoUrl || "",
      moto: usuario.moto || "",
    });
  }
  return destaques;
};

eventosPublicoRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = param(req, "id");
    const evento = await eventoRepository.buscarPorId(id);
    if (!evento) {
      res.status(404).json({erro: "Evento não encontrado"});
      return;
    }

    const [criadorDoc, confirmados, vinculos] = await Promise.all([
      usuarioRepository.buscarPorId(evento.criadorId),
      usuarioEventoRepository.contarPorEvento(evento.id),
      usuarioEventoRepository.listarDestaquesDoEvento(
        evento.id,
        LIMITE_DESTAQUES,
      ),
    ]);

    const usuariosDestaque = await usuarioRepository.buscarPorIds(
      vinculos.map((v) => v.usuarioId),
    );

    const dto: EventoPublico = {
      id: evento.id,
      titulo: evento.titulo,
      tipo: evento.tipo,
      fotoCapaUrl: evento.fotoCapaUrl,
      dataHoraAbertura: evento.dataHoraAbertura,
      dataHoraEncerramento: evento.dataHoraEncerramento,
      acesso: evento.acesso,
      localNome: evento.local.nome ?? "",
      localEndereco: evento.local.endereco,
      informacoes: evento.informacoes,
      criador: criadorPublico(evento.criadorId, criadorDoc),
      participantes: {
        confirmados,
        destaques: destaquesDe(vinculos, usuariosDestaque),
      },
    };

    res.json(dto);
  } catch (error) {
    responderErro(res, error);
  }
});
