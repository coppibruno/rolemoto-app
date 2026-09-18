import type { NotaAvaliacao } from "@/types/avaliacao-experiencia";

export type ErroTelaAvaliar = {
  titulo: string;
  corpo: string;
  podeTentar: boolean;
};

export const DURACAO_ENVIADO_MS = 1100;
export const LIMITE_COMENTARIO = 500;
export const LIMITE_FOTOS = 4;

export const TITULO_PAGINA = "Avaliar Experiência";
export const KICKER_PAGINA = "Feedback da Irmandade";

export const LABEL_NOTA = "Nota geral da experiência";
export const LABEL_RELATO = "Relato do piloto";
export const LABEL_FOTOS = "Fotos da visita";
export const LABEL_FOTOS_LIMITE = "Até 4 fotos";
export const LABEL_RECOMENDA = "Recomendo para Comboios";
export const HINT_RECOMENDA =
  "Destaca este ponto nos mapas de rotas da comunidade.";
export const HINT_RELATO =
  "Dica: detalhes sobre asfalto e piso molhado ajudam outros irmãos de estrada!";
export const PLACEHOLDER_RELATO =
  "Conte como foi sua parada: asfalto da entrada, qualidade da gasolina, calibrador, segurança...";

export const CTA_PUBLICAR = "Publicar Avaliação";
export const CTA_PUBLICANDO = "Publicando...";
export const CTA_CANCELAR = "Cancelar";
export const CTA_VOLTAR_FEED = "Voltar ao Feed";
export const CTA_ANEXAR = "Anexar";

export const TITULO_LISTA = "Avaliações da irmandade";
export const SELO_SEU_RELATO = "Seu relato";
export const BADGE_OFICIAL = "Oficial";

export const VAZIO_LISTA_TITULO = "Nenhuma avaliação ainda";
export const VAZIO_LISTA_CORPO = "Seja o primeiro a publicar um relato.";

export const ERRO_NAO_ENCONTRADO: ErroTelaAvaliar = {
  titulo: "Não encontrado",
  corpo: "Esse local/evento não existe mais.",
  podeTentar: false,
};

export const ERRO_SEM_INSCRICAO: ErroTelaAvaliar = {
  titulo: "Fora da lista",
  corpo: "Só quem se inscreveu avalia o evento.",
  podeTentar: false,
};

export const ERRO_AINDA_GRADE: ErroTelaAvaliar = {
  titulo: "Ainda na grade",
  corpo: "A avaliação abre depois do encerramento.",
  podeTentar: false,
};

export const ERRO_CARREGAR: ErroTelaAvaliar = {
  titulo: "Não deu para carregar",
  corpo: "Tentar de novo.",
  podeTentar: true,
};

export const ERRO_SALVAR = "Não foi possível publicar a avaliação.";

type MetaNota = {
  label: string;
  tom: "vazio" | "erro" | "alerta" | "bom" | "epico";
};

export const META_NOTA_VAZIA: MetaNota = {
  label: "Toque nas estrelas",
  tom: "vazio",
};

export const META_NOTA: Record<NotaAvaliacao, MetaNota> = {
  1: { label: "Ruim para a irmandade", tom: "erro" },
  2: { label: "Abaixo do esperado", tom: "alerta" },
  3: { label: "Experiência regular", tom: "alerta" },
  4: { label: "Bom para motos & paradas", tom: "bom" },
  5: { label: "Excelente para Motos & Comboios", tom: "epico" },
};

export const LABELS_CATEGORIA_ALVO = {
  posto: "Posto",
  bar_moto_point: "Bar & Moto Point",
  restaurante_estrada: "Restaurante Estrada",
  oficina: "Oficina",
  mirante: "Mirante",
} as const;

export const LABELS_TIPO_EVENTO_ALVO = {
  moto_point_semanal: "Moto Point Semanal",
  track_day: "Track Day",
  cafe_pilotos: "Café dos Pilotos",
  exposicao_custom: "Exposição & Custom",
} as const;

export const ariaEstrela = (n: NotaAvaliacao): string =>
  n === 1 ? "1 estrela" : `${n} estrelas`;
