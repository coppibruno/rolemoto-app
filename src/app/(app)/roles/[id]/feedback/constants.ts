import type { NotaFeedback, TagFeedback } from "@/types/usuario-role-feedback";

export type ErroTelaFeedback = {
  titulo: string;
  corpo: string;
  podeTentar: boolean;
};

export const DURACAO_ENVIADO_MS = 1100;
export const LIMITE_COMENTARIO = 280;

export const TITULO_PAGINA = "Como foi esta rota?";
export const KICKER_PAGINA = "Avaliação de Rota";
export const SUBTITULO_PAGINA =
  "Sua avaliação fica neste comboio. O organizador e os pilotos confirmados veem a nota, os destaques e o relato.";

export const LABEL_NOTA = "Avaliação Geral da Rota e Trajeto";
export const LABEL_TAGS = "Destaques do Trajeto (Múltipla escolha)";
export const LABEL_RELATO = "Relato do Piloto";
export const HINT_OPCIONAL = "Opcional";
export const PLACEHOLDER_RELATO =
  "Escreva um comentário construtivo... Dicas sobre asfalto, paradas ou condução do comboio.";

export const AVISO_COMBOIO_TITULO = "Visível para o comboio";
export const AVISO_COMBOIO_CORPO =
  "O organizador e os pilotos confirmados veem seu @apelido, a nota e o relato.";
export const AVISO_LOCK = "Só quem confirmou neste rolê";
export const AVISO_FEED =
  "Sua nota e os destaques ficam neste rolê para o comboio consultar depois. Não publicamos média no feed nesta versão.";

export const CTA_SALVAR = "Salvar Avaliação da Rota";
export const CTA_ENVIANDO = "Gravando...";
export const CTA_ENVIADO = "Avaliação Enviada!";
export const CTA_PULAR = "Pular por enquanto";
export const CTA_VOLTAR = "Voltar ao Feed de Rolês";

export const TITULO_LISTA = "Relatos do comboio";
export const SELO_SEU_RELATO = "Seu relato";

export const VAZIO_LISTA_TITULO = "Nenhum relato ainda";
export const VAZIO_LISTA_CORPO =
  "Quando o comboio avaliar, os cards aparecem aqui.";

export const ERRO_NAO_ENCONTRADO: ErroTelaFeedback = {
  titulo: "Rolê não encontrado",
  corpo: "Esse comboio não existe mais.",
  podeTentar: false,
};

export const ERRO_FORA_COMBOIO: ErroTelaFeedback = {
  titulo: "Fora do comboio",
  corpo: "Só quem teve a vaga confirmada avalia e lê os relatos.",
  podeTentar: false,
};

export const ERRO_AINDA_GRADE: ErroTelaFeedback = {
  titulo: "Ainda na grade",
  corpo: "A avaliação abre depois da hora de saída.",
  podeTentar: false,
};

export const ERRO_CARREGAR: ErroTelaFeedback = {
  titulo: "Não deu para carregar",
  corpo: "Tentar de novo.",
  podeTentar: true,
};

export const ERRO_SALVAR = "Não foi possível salvar a avaliação.";

type MetaNota = {
  titulo: string;
  subtitulo: string;
  tom: "vazio" | "erro" | "alerta" | "bom" | "epico";
};

export const META_NOTA_VAZIA: MetaNota = {
  titulo: "Toque nas estrelas",
  subtitulo: "Diga como foi a pista e o comboio.",
  tom: "vazio",
};

export const META_NOTA: Record<NotaFeedback, MetaNota> = {
  1: {
    titulo: "Desorganizado e Perigoso",
    subtitulo: "Houve falhas graves de ritmo, segurança ou rota.",
    tom: "erro",
  },
  2: {
    titulo: "Abaixo do Esperado",
    subtitulo: "O comboio se perdeu ou houve desatenção com pilotos.",
    tom: "alerta",
  },
  3: {
    titulo: "Rolê Regular",
    subtitulo: "Foi legal, mas com pontos claros de melhoria.",
    tom: "alerta",
  },
  4: {
    titulo: "Muito Bom! Comboio Firme",
    subtitulo: "Boa liderança, ritmo constante e trajeto agradável.",
    tom: "bom",
  },
  5: {
    titulo: "Experiência Épica!",
    subtitulo: "Pista limpa, comboio coeso e liderança impecável.",
    tom: "epico",
  },
};

export const TAGS_UI: {
  id: TagFeedback;
  label: string;
  icone: string;
}[] = [
  { id: "asfalto_tapete", label: "Asfalto tapete", icone: "layers" },
  { id: "mirantes_incriveis", label: "Mirantes incríveis", icone: "landscape" },
  { id: "pouco_trafego", label: "Pouco tráfego", icone: "traffic" },
  {
    id: "visual_cinematografico",
    label: "Visual cinematográfico",
    icone: "movie",
  },
  { id: "boas_curvas", label: "Boas Curvas", icone: "turn_sharp_right" },
  {
    id: "parada_bem_estruturada",
    label: "Parada bem estruturada",
    icone: "storefront",
  },
];

export const LABEL_TAG: Record<TagFeedback, string> = {
  asfalto_tapete: "Asfalto tapete",
  mirantes_incriveis: "Mirantes incríveis",
  pouco_trafego: "Pouco tráfego",
  visual_cinematografico: "Visual cinematográfico",
  boas_curvas: "Boas Curvas",
  parada_bem_estruturada: "Parada bem estruturada",
};

export const ariaEstrela = (n: NotaFeedback): string =>
  n === 1 ? "1 estrela" : `${n} estrelas`;
