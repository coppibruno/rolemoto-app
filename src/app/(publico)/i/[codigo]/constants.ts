export const URL_PLAY_STORE =
  "https://play.google.com/store/apps/details?id=br.com.rolemoto.app";
export const URL_APP_STORE =
  process.env.NEXT_PUBLIC_URL_APP_STORE ??
  "https://apps.apple.com/br/app/rol%C3%AA-moto/id6823710414";

export const COPY_LINK_INEXISTENTE = "Este link não existe.";

export const COPY_CODIGO_HINT =
  "No cadastro, cole este código em “Código de indicação”. Sem ele a indicação não conta.";

export const PONTOS_AFILIADO: { icone: string; texto: string }[] = [
  { icone: "two_wheeler", texto: "Ache rolês de moto perto de você e peça vaga no comboio." },
  { icone: "route", texto: "Crie o seu rolê com saída, paradas e destino." },
  { icone: "local_cafe", texto: "Moto points, cafés e eventos da região num só lugar." },
  { icone: "speed", texto: "Grave o passeio e compare com quem você segue." },
];
