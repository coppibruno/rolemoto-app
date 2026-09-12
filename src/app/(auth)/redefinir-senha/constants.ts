export const MIN_SENHA = 8;

export const COPY = {
  titulo: "Criar Nova Senha",
  subtitulo:
    "Defina sua nova credencial de acesso para acelerar de volta no Rolê Moto com segurança.",
  pill: "Pit Stop de Segurança",
  chipEmail: "Redefinindo para:",
  ctaIdle: "Redefinir Senha e Entrar",
  ctaEnviando: "Atualizando chave de acesso...",
  ctaExito: "Senha Redefinida!",
  microcopy: "Criptografia de ponta a ponta ativa na sua sessão.",
  linkInvalido:
    "Este link expirou ou já foi usado. Peça um novo em Esqueceu a senha?",
  irAoLogin: "Ir ao login",
  voltarLogin: "Voltar ao login",
  erroGenerico:
    "Não foi possível redefinir a senha. Tente de novo ou peça outro link.",
  senhaFraca: "A senha deve ter no mínimo 8 caracteres.",
  hintMinimo: "mín. 8 caracteres",
  labelNova: "Nova Senha",
  labelConfirmar: "Confirmar Nova Senha",
  placeholderNova: "Digite sua nova senha",
  placeholderConfirmar: "Repita a nova senha",
} as const;

export const COPY_PILL = {
  aguardando: "Aguardando confirmação de senha",
  coincidem: "As senhas coincidem perfeitamente",
  curtas: "Senhas iguais, mas precisa ter no mínimo 8 caracteres",
  diferentes: "As senhas ainda não coincidem",
} as const;

export type EstadoConferencia = "aguardando" | "coincidem" | "curtas" | "diferentes";
