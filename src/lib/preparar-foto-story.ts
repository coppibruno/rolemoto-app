const LADO_MAX = 1280;
const QUALIDADE = 0.84;

const quadro = (
  origem: CanvasImageSource,
  largura: number,
  altura: number,
  espelhar: boolean,
): HTMLCanvasElement | null => {
  const escala = Math.min(1, LADO_MAX / Math.max(largura, altura));
  const w = Math.max(1, Math.round(largura * escala));
  const h = Math.max(1, Math.round(altura * escala));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  if (espelhar) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(origem, 0, 0, w, h);
  return canvas;
};

const paraArquivo = (canvas: HTMLCanvasElement): Promise<File | null> =>
  new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob ? new File([blob], `story-${Date.now()}.jpg`, { type: "image/jpeg" }) : null);
    }, "image/jpeg", QUALIDADE);
  });

/** Reduz a foto e aplica a orientação da câmera, para o story abrir rápido. */
export const prepararFotoStory = async (arquivo: File): Promise<File> => {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(arquivo, {
      imageOrientation: "from-image",
    } as ImageBitmapOptions);
  } catch {
    try {
      bitmap = await createImageBitmap(arquivo);
    } catch {
      return arquivo;
    }
  }
  const canvas = quadro(bitmap, bitmap.width, bitmap.height, false);
  bitmap.close();
  if (!canvas) return arquivo;
  return (await paraArquivo(canvas)) ?? arquivo;
};

/** Congela o quadro inteiro da câmera, sem cortar as bordas. */
export const arquivoDoVideo = async (
  video: HTMLVideoElement,
  espelhar: boolean,
): Promise<File> => {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error("video vazio");
  }
  const canvas = quadro(video, video.videoWidth, video.videoHeight, espelhar);
  if (!canvas) throw new Error("canvas");
  const arquivo = await paraArquivo(canvas);
  if (!arquivo) throw new Error("blob");
  return arquivo;
};
