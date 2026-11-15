const PEDACO = 0x8000;

export const bytesParaBase64 = (bytes: Uint8Array): string => {
  let binario = "";
  for (let i = 0; i < bytes.length; i += PEDACO) {
    binario += String.fromCharCode(...bytes.subarray(i, i + PEDACO));
  }
  return btoa(binario);
};

export const base64ParaBytes = (texto: string): Uint8Array => {
  const binario = atob(texto);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
};
