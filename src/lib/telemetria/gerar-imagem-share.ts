import {
  formatarConclusaoTelemetria,
  formatarDistancia,
  formatarDuracao,
  formatarVelocidade,
  labelPontoTelemetria,
} from "@/lib/telemetria/formatar-telemetria";
import {
  TAMANHO_TILE,
  centroPixelDosPontos,
  latLngParaPixelGlobal,
  urlTileMesmaOrigem,
  zoomParaEnquadrar,
  type PontoLatLng,
} from "@/lib/mapa-tiles";
import { decodificarPolyline } from "@/lib/telemetria/tracado";
import type { PontoTelemetria } from "@/types/role-telemetria";

const LARGURA = 1080;
const ALTURA = 1920;
const MARGEM = 72;
const ESCALA_MAPA = 1.5;
const TIMEOUT_TILE_MS = 5000;

const COR = {
  fundo: "#121316",
  cartao: "#1b1b1f",
  metrica: "#1f1f23",
  mapa: "#0a0b0e",
  texto: "#e3e2e6",
  muted: "#e2bfb0",
  laranja: "#ff6b00",
  pessego: "#ffb693",
  ciano: "#00daf3",
  linha: "#f97316",
};

export type DadosImagemTelemetria = {
  titulo: string;
  apelido: string;
  encerradoEm: string;
  distanciaKm: number;
  tempoSegundos: number;
  velocidadeMaxKmh: number;
  velocidadeMediaKmh: number;
  pontoInicio: PontoTelemetria;
  pontoFim: PontoTelemetria;
  tracado?: string;
};

export const nomeArquivoShareTelemetria = (titulo: string): string => {
  const base = titulo
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "telemetria"}.png`;
};

const fonte = (peso: number, tamanho: number, familia: "barlow" | "jakarta") => {
  const nome = familia === "barlow" ? "Barlow Condensed" : "Plus Jakarta Sans";
  return `${peso} ${tamanho}px "${nome}", sans-serif`;
};

const ellipsize = (
  ctx: CanvasRenderingContext2D,
  texto: string,
  max: number,
): string => {
  if (ctx.measureText(texto).width <= max) return texto;
  let corte = texto;
  while (corte.length > 1 && ctx.measureText(`${corte}…`).width > max) {
    corte = corte.slice(0, -1);
  }
  return `${corte}…`;
};

const quebrar = (
  ctx: CanvasRenderingContext2D,
  texto: string,
  max: number,
  maxLinhas: number,
): string[] => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let atual = "";

  for (const palavra of palavras) {
    const teste = atual ? `${atual} ${palavra}` : palavra;
    if (ctx.measureText(teste).width <= max) {
      atual = teste;
      continue;
    }
    if (atual) linhas.push(atual);
    atual =
      ctx.measureText(palavra).width <= max ? palavra : ellipsize(ctx, palavra, max);
  }
  if (atual) linhas.push(atual);
  if (linhas.length <= maxLinhas) return linhas;
  const cabeca = linhas.slice(0, maxLinhas - 1);
  const resto = linhas.slice(maxLinhas - 1).join(" ");
  return [...cabeca, ellipsize(ctx, resto, max)];
};

const preencherCaixa = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  const raio = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + raio, y);
  ctx.arcTo(x + w, y, x + w, y + h, raio);
  ctx.arcTo(x + w, y + h, x, y + h, raio);
  ctx.arcTo(x, y + h, x, y, raio);
  ctx.arcTo(x, y, x + w, y, raio);
  ctx.closePath();
  ctx.fill();
};

const recortarFundoPreto = (img: HTMLImageElement): HTMLCanvasElement => {
  const quadro = document.createElement("canvas");
  quadro.width = img.naturalWidth;
  quadro.height = img.naturalHeight;
  const g = quadro.getContext("2d", { willReadFrequently: true });
  if (!g) return quadro;
  g.drawImage(img, 0, 0);
  const pixels = g.getImageData(0, 0, quadro.width, quadro.height);
  const data = pixels.data;
  const w = quadro.width;
  const h = quadro.height;
  const visto = new Uint8Array(w * h);
  const fundo = (i: number) => {
    const o = i * 4;
    return data[o] < 30 && data[o + 1] < 30 && data[o + 2] < 30;
  };
  const pilha = [0, w - 1, (h - 1) * w, (h - 1) * w + (w - 1)];
  while (pilha.length > 0) {
    const i = pilha.pop();
    if (i === undefined || i < 0 || i >= w * h || visto[i] || !fundo(i)) continue;
    visto[i] = 1;
    data[i * 4 + 3] = 0;
    const x = i % w;
    if (x > 0) pilha.push(i - 1);
    if (x < w - 1) pilha.push(i + 1);
    if (i >= w) pilha.push(i - w);
    if (i < w * (h - 1)) pilha.push(i + w);
  }
  g.putImageData(pixels, 0, 0);
  return quadro;
};

const carregarLogo = (): Promise<HTMLCanvasElement | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(recortarFundoPreto(img));
    img.onerror = () => resolve(null);
    img.src = "/logo-rolemoto.jpeg";
  });

const carregarTile = (src: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const img = new Image();
    const timer = window.setTimeout(() => resolve(null), TIMEOUT_TILE_MS);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    img.src = src;
  });

type Area = { x: number; y: number; w: number; h: number };

const desenharPino = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cor: string,
  letra: string,
) => {
  ctx.beginPath();
  ctx.fillStyle = cor;
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
  ctx.fillStyle = "#121316";
  ctx.font = fonte(800, 22, "barlow");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letra, cx, cy + 1);
  ctx.textAlign = "left";
};

const desenharMapa = async (
  ctx: CanvasRenderingContext2D,
  area: Area,
  inicio: PontoTelemetria,
  fim: PontoTelemetria,
  trajeto: PontoLatLng[],
) => {
  const w = area.w / ESCALA_MAPA;
  const h = area.h / ESCALA_MAPA;
  const temTrajeto = trajeto.length >= 2;
  const pontos: PontoLatLng[] = temTrajeto ? [inicio, fim, ...trajeto] : [inicio, fim];
  const zoom = zoomParaEnquadrar(pontos, w, h, 56);
  const centro = centroPixelDosPontos(pontos, zoom);
  const origemX = centro.x - w / 2;
  const origemY = centro.y - h / 2;
  const maxTile = 2 ** zoom - 1;

  const tiles: Array<{ x: number; y: number; src: string }> = [];
  for (let ty = Math.floor(origemY / TAMANHO_TILE); ty <= Math.floor((origemY + h) / TAMANHO_TILE); ty += 1) {
    if (ty < 0 || ty > maxTile) continue;
    for (let tx = Math.floor(origemX / TAMANHO_TILE); tx <= Math.floor((origemX + w) / TAMANHO_TILE); tx += 1) {
      tiles.push({
        x: area.x + (tx * TAMANHO_TILE - origemX) * ESCALA_MAPA,
        y: area.y + (ty * TAMANHO_TILE - origemY) * ESCALA_MAPA,
        src: urlTileMesmaOrigem(zoom, tx, ty),
      });
    }
  }
  const imagens = await Promise.all(tiles.map((t) => carregarTile(t.src)));

  ctx.save();
  ctx.beginPath();
  ctx.rect(area.x, area.y, area.w, area.h);
  ctx.clip();

  const lado = TAMANHO_TILE * ESCALA_MAPA;
  imagens.forEach((img, i) => {
    if (img) ctx.drawImage(img, tiles[i].x, tiles[i].y, lado, lado);
  });
  if (imagens.some(Boolean)) {
    ctx.fillStyle = "rgba(18, 19, 22, 0.12)";
    ctx.fillRect(area.x, area.y, area.w, area.h);
  }

  const paraArea = (p: PontoLatLng) => {
    const g = latLngParaPixelGlobal(p.lat, p.lng, zoom);
    return {
      x: area.x + (g.x - origemX) * ESCALA_MAPA,
      y: area.y + (g.y - origemY) * ESCALA_MAPA,
    };
  };
  const a = paraArea(inicio);
  const b = paraArea(fim);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (temTrajeto) {
    const caminho = trajeto.map(paraArea);
    const tracar = () => {
      ctx.beginPath();
      ctx.moveTo(caminho[0].x, caminho[0].y);
      for (const p of caminho.slice(1)) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    };
    ctx.strokeStyle = "rgba(18, 19, 22, 0.55)";
    ctx.lineWidth = 13;
    tracar();
    ctx.strokeStyle = COR.linha;
    ctx.lineWidth = 7;
    tracar();
  } else {
    ctx.strokeStyle = COR.linha;
    ctx.lineWidth = 7;
    ctx.setLineDash([16, 12]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  desenharPino(ctx, a.x, a.y, COR.ciano, "A");
  desenharPino(ctx, b.x, b.y, COR.laranja, "B");

  if (imagens.some(Boolean)) {
    ctx.font = fonte(500, 18, "jakarta");
    const credito = "© OpenStreetMap";
    const larguraCredito = ctx.measureText(credito).width + 16;
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillRect(area.x + area.w - larguraCredito, area.y + area.h - 28, larguraCredito, 28);
    ctx.fillStyle = "#333333";
    ctx.textBaseline = "middle";
    ctx.fillText(credito, area.x + area.w - larguraCredito + 8, area.y + area.h - 14);
  }
  ctx.restore();
};

const prepararFontes = async () => {
  if (!document.fonts?.load) return;
  await Promise.all([
    document.fonts.load(fonte(800, 72, "barlow")),
    document.fonts.load(fonte(700, 28, "barlow")),
    document.fonts.load(fonte(600, 28, "jakarta")),
    document.fonts.load(fonte(500, 30, "jakarta")),
    document.fonts.load(fonte(400, 26, "jakarta")),
  ]);
};

const valorMetrica = (bruto: string) => bruto.replace(/\s*(km\/h|km)$/i, "");

const desenharMetrica = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rotulo: string,
  valor: string,
  unidade: string,
) => {
  ctx.fillStyle = COR.metrica;
  preencherCaixa(ctx, x, y, w, h, 20);

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = COR.muted;
  ctx.font = fonte(700, 26, "barlow");
  ctx.fillText(rotulo, x + 28, y + 28);

  const unidadeExtra = unidade ? 12 : 0;
  let tamanho = 68;
  let larguraUnidade = 0;
  if (unidade) {
    ctx.font = fonte(700, 26, "barlow");
    larguraUnidade = ctx.measureText(unidade).width + unidadeExtra;
  }
  while (tamanho > 36) {
    ctx.font = fonte(800, tamanho, "barlow");
    if (ctx.measureText(valor).width + larguraUnidade <= w - 56) break;
    tamanho -= 2;
  }

  const baseline = y + h - 48;
  ctx.textBaseline = "alphabetic";
  ctx.font = fonte(800, tamanho, "barlow");
  ctx.fillStyle = COR.texto;
  ctx.fillText(valor, x + 28, baseline);
  if (unidade) {
    const larguraValor = ctx.measureText(valor).width;
    ctx.font = fonte(700, 26, "barlow");
    ctx.fillStyle = COR.laranja;
    ctx.fillText(unidade, x + 28 + larguraValor + unidadeExtra, baseline);
  }
};

const desenharPonto = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  max: number,
  cor: string,
  rotulo: string,
  nome: string,
) => {
  ctx.beginPath();
  ctx.fillStyle = cor;
  ctx.arc(x + 14, y + 14, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#121316";
  ctx.font = fonte(800, 18, "barlow");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(rotulo, x + 14, y + 15);

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = cor;
  ctx.font = fonte(700, 22, "barlow");
  ctx.fillText(rotulo === "A" ? "PARTIDA" : "DESTINO", x + 40, y);

  ctx.fillStyle = COR.texto;
  ctx.font = fonte(600, 26, "jakarta");
  ctx.fillText(ellipsize(ctx, nome, max - 40), x + 40, y + 30);
};

export const gerarImagemShareTelemetria = async (
  dados: DadosImagemTelemetria,
): Promise<Blob> => {
  await prepararFontes();
  const logo = await carregarLogo();

  const canvas = document.createElement("canvas");
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");

  ctx.fillStyle = COR.fundo;
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  const brilho = ctx.createRadialGradient(LARGURA / 2, 80, 20, LARGURA / 2, 80, 640);
  brilho.addColorStop(0, "rgba(255, 107, 0, 0.32)");
  brilho.addColorStop(1, "rgba(255, 107, 0, 0)");
  ctx.fillStyle = brilho;
  ctx.fillRect(0, 0, LARGURA, 720);

  ctx.fillStyle = COR.laranja;
  ctx.fillRect(0, 0, LARGURA, 12);

  let y = 200;
  const larguraUtil = LARGURA - MARGEM * 2;

  if (logo) {
    const alturaLogo = 78;
    const larguraLogo = Math.min(
      larguraUtil,
      (logo.width / logo.height) * alturaLogo,
    );
    ctx.drawImage(logo, MARGEM, y, larguraLogo, alturaLogo);
    y += alturaLogo + 36;
  }

  ctx.font = fonte(700, 26, "barlow");
  const selo = "TELEMETRIA GRAVADA";
  const larguraSelo = ctx.measureText(selo).width + 36;
  ctx.fillStyle = "rgba(255, 107, 0, 0.2)";
  preencherCaixa(ctx, MARGEM, y, larguraSelo, 48, 8);
  ctx.fillStyle = COR.pessego;
  ctx.textBaseline = "middle";
  ctx.fillText(selo, MARGEM + 18, y + 24);
  y += 72;

  ctx.fillStyle = COR.texto;
  ctx.font = fonte(800, 72, "barlow");
  ctx.textBaseline = "top";
  const titulo = (dados.titulo || "Rolê").toUpperCase();
  const linhas = quebrar(ctx, titulo, larguraUtil, 2);
  for (const linha of linhas) {
    ctx.fillText(linha, MARGEM, y);
    y += 78;
  }

  ctx.fillStyle = COR.muted;
  ctx.font = fonte(500, 30, "jakarta");
  const subtitulo = dados.apelido.trim()
    ? `${formatarConclusaoTelemetria(dados.encerradoEm)} · ${dados.apelido.trim()}`
    : formatarConclusaoTelemetria(dados.encerradoEm);
  ctx.fillText(ellipsize(ctx, subtitulo, larguraUtil), MARGEM, y + 8);
  y += 72;

  const metricas = [
    {
      rotulo: "DISTÂNCIA",
      valor: valorMetrica(formatarDistancia(dados.distanciaKm)),
      unidade: "KM",
    },
    {
      rotulo: "TEMPO TOTAL",
      valor: formatarDuracao(dados.tempoSegundos),
      unidade: "",
    },
    {
      rotulo: "VEL. MÁX",
      valor: valorMetrica(formatarVelocidade(dados.velocidadeMaxKmh)),
      unidade: "KM/H",
    },
    {
      rotulo: "VEL. MÉDIA",
      valor: valorMetrica(formatarVelocidade(dados.velocidadeMediaKmh)),
      unidade: "KM/H",
    },
  ];

  const gap = 16;
  const cardW = (larguraUtil - gap) / 2;
  const cardH = 210;
  metricas.forEach((item, i) => {
    const col = i % 2;
    const lin = Math.floor(i / 2);
    desenharMetrica(
      ctx,
      MARGEM + col * (cardW + gap),
      y + lin * (cardH + gap),
      cardW,
      cardH,
      item.rotulo,
      item.valor,
      item.unidade,
    );
  });
  y += cardH * 2 + gap + 28;

  const alturaCabecalhoMapa = 72;
  const alturaAreaMapa = 460;
  const mapaH = alturaCabecalhoMapa + alturaAreaMapa + 116;
  ctx.fillStyle = COR.mapa;
  preencherCaixa(ctx, MARGEM, y, larguraUtil, mapaH, 24);

  ctx.fillStyle = COR.pessego;
  ctx.font = fonte(700, 24, "barlow");
  ctx.textBaseline = "top";
  ctx.fillText(
    `TRAÇADO GPS · ${formatarDistancia(dados.distanciaKm).toUpperCase()}`,
    MARGEM + 28,
    y + 26,
  );

  await desenharMapa(
    ctx,
    { x: MARGEM, y: y + alturaCabecalhoMapa, w: larguraUtil, h: alturaAreaMapa },
    dados.pontoInicio,
    dados.pontoFim,
    decodificarPolyline(dados.tracado ?? ""),
  );

  const yPontos = y + alturaCabecalhoMapa + alturaAreaMapa + 32;
  const colW = (larguraUtil - 56) / 2;
  desenharPonto(
    ctx,
    MARGEM + 28,
    yPontos,
    colW,
    COR.ciano,
    "A",
    labelPontoTelemetria(dados.pontoInicio),
  );
  desenharPonto(
    ctx,
    MARGEM + 28 + colW,
    yPontos,
    colW,
    COR.laranja,
    "B",
    labelPontoTelemetria(dados.pontoFim),
  );

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = COR.muted;
  ctx.font = fonte(600, 26, "jakarta");
  ctx.fillText("Rolê Moto", LARGURA / 2, y + mapaH + 40);
  ctx.font = fonte(400, 22, "jakarta");
  ctx.fillStyle = "rgba(226, 191, 176, 0.7)";
  ctx.fillText("www.rolemoto.com.br", LARGURA / 2, y + mapaH + 76);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((resultado) => resolve(resultado), "image/png");
  });
  if (!blob) throw new Error("Não foi possível gerar a imagem");
  return blob;
};
