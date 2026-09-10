import {ePedidoAceito} from "./historico";
import type {Role} from "../types/role";
import type {Usuario} from "../types/usuario";
import type {UsuarioRole} from "../types/usuario-role";
import type {
  AutorFeedback,
  TagFeedback,
  UsuarioRoleFeedback,
  UsuarioRoleFeedbackDoc,
} from "../types/usuario-role-feedback";

export const TAGS_FEEDBACK = [
  "asfalto_tapete",
  "mirantes_incriveis",
  "pouco_trafego",
  "visual_cinematografico",
  "boas_curvas",
  "parada_bem_estruturada",
] as const;

export type FeedbackBodyValidado = {
  nota: number;
  tags: TagFeedback[];
  comentario: string;
};

const isTag = (valor: unknown): valor is TagFeedback =>
  typeof valor === "string" &&
  (TAGS_FEEDBACK as readonly string[]).includes(valor);

export const saidaPassou = (iso: string): boolean =>
  Date.parse(iso) <= Date.now();

export const eDoComboio = (
  uid: string,
  role: Role,
  pedido: UsuarioRole | null,
): boolean => {
  if (role.criadorId === uid) {
    return true;
  }
  return Boolean(pedido && ePedidoAceito(pedido));
};

export const validarBodyFeedback = (
  body: Record<string, unknown>,
): {ok: true; dados: FeedbackBodyValidado} | {ok: false; erro: string} => {
  const nota = body.nota;
  if (
    typeof nota !== "number" ||
    !Number.isInteger(nota) ||
    nota < 1 ||
    nota > 5
  ) {
    return {ok: false, erro: "nota é obrigatória"};
  }

  let tags: TagFeedback[] = [];
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.length > 6) {
      return {ok: false, erro: "tags inválidas"};
    }
    const unicos = new Set<string>();
    for (const tag of body.tags) {
      if (!isTag(tag) || unicos.has(tag)) {
        return {ok: false, erro: "tags inválidas"};
      }
      unicos.add(tag);
      tags = [...tags, tag];
    }
  }

  const comentarioBruto = body.comentario;
  if (
    comentarioBruto !== undefined &&
    comentarioBruto !== null &&
    typeof comentarioBruto !== "string"
  ) {
    return {ok: false, erro: "comentario inválido"};
  }
  const comentario =
    typeof comentarioBruto === "string" ? comentarioBruto.trim() : "";
  if (comentario.length > 280) {
    return {ok: false, erro: "comentario excede 280 caracteres"};
  }

  return {ok: true, dados: {nota, tags, comentario}};
};

export const escolherPendente = (
  pedidosAceitos: UsuarioRole[],
  rolesPorId: Map<string, Role>,
  idsComFeedback: Set<string>,
): {id: string; titulo: string; dataHoraSaida: string} | null => {
  const candidatos: Role[] = [];
  for (const pedido of pedidosAceitos) {
    const role = rolesPorId.get(pedido.roleId);
    if (!role) {
      continue;
    }
    if (!saidaPassou(role.dataHoraSaida)) {
      continue;
    }
    if (idsComFeedback.has(role.id)) {
      continue;
    }
    candidatos.push(role);
  }

  candidatos.sort(
    (a, b) => Date.parse(b.dataHoraSaida) - Date.parse(a.dataHoraSaida),
  );
  const escolhido = candidatos[0];
  if (!escolhido) {
    return null;
  }
  return {
    id: escolhido.id,
    titulo: escolhido.titulo,
    dataHoraSaida: escolhido.dataHoraSaida,
  };
};

export const fallbackAutor = (uid: string): AutorFeedback => ({
  uid,
  nome: "Piloto",
  apelido: "piloto",
  fotoUrl: "",
});

export const hidratarFeedback = (
  doc: UsuarioRoleFeedbackDoc,
  usuario: Usuario | undefined,
): UsuarioRoleFeedback => ({
  ...doc,
  autor: usuario ?
    {
      uid: usuario.uid,
      nome: usuario.nome,
      apelido: usuario.apelido,
      fotoUrl: usuario.fotoUrl,
    } :
    fallbackAutor(doc.usuarioId),
});
