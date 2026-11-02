const baixadas = new Set<string>();
const emVoo = new Set<string>();

export const fotoStoryPronta = (url: string) => baixadas.has(url);

export const registrarFotoStory = (url: string) => {
  if (url) baixadas.add(url);
};

export const precarregarFotoStory = (url: string) => {
  if (!url || baixadas.has(url) || emVoo.has(url)) return;
  emVoo.add(url);
  const img = new Image();
  img.decoding = "async";
  const concluir = () => {
    if (img.naturalWidth > 0) baixadas.add(url);
    emVoo.delete(url);
  };
  img.onerror = () => {
    emVoo.delete(url);
  };
  img.onload = concluir;
  img.src = url;
  if (img.complete) concluir();
};
