import type { ConquistaPerfil } from "./conquista";
import type { RoleFixadoResumo } from "./role";
import type { SeloPublico } from "./selo";

export type Pilotagem = "agressiva" | "moderada" | "tranquila";

export type TipoMoto = "trail" | "speed" | "custom";

export interface Usuario {
  uid: string;
  nome: string;
  apelido: string;
  moto: string;
  /** Legado sem campo → null até o próximo save. */
  tipoMoto: TipoMoto | null;
  pilotagem: Pilotagem;
  fotoUrl: string;
  cidade: string;
  garupaFrequente: boolean;
  admin: boolean;
  selos: SeloPublico[];
  /** `GET /perfil` — com a velocidade de cada conquista. */
  conquistas?: ConquistaPerfil[];
  seguindo: number;
  seguidores: number;
  /** Docs em `userspostfoto` deste uid. */
  totalFotos?: number;
  createdAt: string;
  /** `GET /perfil` — pontos em que esta conta cuida do balcão. */
  locaisComoDono?: { id: string; nome: string }[];
  /** `GET /perfil` — os rolês que esta conta fixou. */
  rolesFixados?: RoleFixadoResumo[];
}

export type UsuarioForm = Omit<
  Usuario,
  | "uid"
  | "createdAt"
  | "admin"
  | "selos"
  | "conquistas"
  | "seguindo"
  | "seguidores"
  | "locaisComoDono"
  | "rolesFixados"
>;

export type ErrosPrimeiroAcesso = {
  nome?: string;
  moto?: string;
  foto?: string;
  pilotagem?: string;
};

/** Body do POST /perfil — apelido, tipo, garupa e cidade completam depois no perfil. */
export type UsuarioPrimeiroAcesso = {
  nome: string;
  moto: string;
  pilotagem: Pilotagem;
  fotoUrl: string;
  /** Link de afiliado guardado na página `/i/{codigo}`. */
  codigoAfiliado?: string;
};

/** Payload de edição de perfil. */
export type UsuarioEdicao = {
  nome: string;
  apelido: string;
  fotoUrl: string;
  pilotagem: Pilotagem;
  moto: string;
  tipoMoto: TipoMoto | null;
  garupaFrequente: boolean;
  cidade: string;
};
