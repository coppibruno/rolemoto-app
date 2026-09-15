import {Router, Request, Response} from "express";
import {responderErro} from "../middleware/errors";
import {rateLimit} from "../middleware/rate-limit";
import {param} from "../lib/params";
import {distanciaRotaKm} from "../lib/geo";
import {
  roleRepository,
  usuarioRepository,
  usuarioRoleRepository,
} from "../repositories";
import type {
  CriadorPublico,
  ParticipanteDestaque,
  RolePublico,
} from "../types/role-publico";
import type {Usuario} from "../types/usuario";

/**
 * Leitura pública do convite — sem Bearer, sem lat/lng, sem participação.
 *
 * GET /publico/roles/:id
 */
export const rolesPublicoRouter = Router();

rolesPublicoRouter.use(rateLimit({nome: "publico-roles", max: 60}));

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
  apelido: usuario?.apelido || "piloto",
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

rolesPublicoRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = param(req, "id");
    const role = await roleRepository.buscarPorId(id);
    if (!role) {
      res.status(404).json({erro: "Rolê não encontrado"});
      return;
    }

    const [criadorDoc, confirmados, vinculos] = await Promise.all([
      usuarioRepository.buscarPorId(role.criadorId),
      usuarioRoleRepository.contarConfirmados(role.id),
      usuarioRoleRepository.listarConfirmadosDoRole(role.id, LIMITE_DESTAQUES),
    ]);

    const usuariosDestaque = await usuarioRepository.buscarPorIds(
      vinculos.map((v) => v.usuarioId),
    );

    const dto: RolePublico = {
      id: role.id,
      titulo: role.titulo,
      descricao: role.descricao,
      fotoCapaUrl: role.fotoCapaUrl,
      ritmo: role.ritmo,
      dataHoraSaida: role.dataHoraSaida,
      localSaidaEndereco: role.localSaida.endereco,
      destinoFinalEndereco: role.destinoFinal.endereco,
      localSaidaNome: role.localSaida.nome ?? "",
      destinoFinalNome: role.destinoFinal.nome ?? "",
      localSaidaLat: role.localSaida.lat,
      localSaidaLng: role.localSaida.lng,
      destinoFinalLat: role.destinoFinal.lat,
      destinoFinalLng: role.destinoFinal.lng,
      distanciaKm: distanciaRotaKm(role.localSaida, role.destinoFinal),
      criador: criadorPublico(role.criadorId, criadorDoc),
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
