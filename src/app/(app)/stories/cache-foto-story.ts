const decodificadas = new Set<string>();
const emVoo = new Set<string>();

export const fotoStoryPronta = (url: string) => decodificadas.has(url);

export const registrarFotoStory = (url: string) => {
  if (url) decodificadas.add(url);
};

export const precarregarFotoStory = (url: string) => {
  if (!url || decodificadas.has(url) || emVoo.has(url)) return;
  emVoo.add(url);
  const img = new Image();
  img.decoding = "async";
  let fechou = false;
  const concluir = () => {
    if (fechou) return;
    if (img.naturalWidth === 0) {
      emVoo.delete(url);
      return;
    }
    fechou = true;
    void img
      .decode()
      .then(() => {
        decodificadas.add(url);
      })
      .catch(() => undefined)
      .finally(() => {
        emVoo.delete(url);
      });
  };
  img.onerror = () => {
    emVoo.delete(url);
  };
  img.onload = concluir;
  img.src = url;
  if (img.complete) concluir();
};
