import { Capacitor, registerPlugin } from "@capacitor/core";

type CompartilharImagemPlugin = {
  compartilhar: (opcoes: { base64: string; nome: string; texto: string }) => Promise<void>;
  salvar: (opcoes: { base64: string; nome: string }) => Promise<{ salvo: boolean }>;
};

const NOME_PLUGIN = "CompartilharImagem";

const plugin = registerPlugin<CompartilharImagemPlugin>(NOME_PLUGIN);

export const appNativo = (): boolean => Capacitor.isNativePlatform();

/** APK anterior ao versionCode 4 não tem o plugin. */
export const imagemNativaDisponivel = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.isPluginAvailable(NOME_PLUGIN);

const paraBase64 = (arquivo: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(leitor.error);
    leitor.readAsDataURL(arquivo);
  });

export const compartilharImagemNativa = async (arquivo: File, texto: string) => {
  const base64 = await paraBase64(arquivo);
  await plugin.compartilhar({ base64, nome: arquivo.name, texto });
};

export const salvarImagemNativa = async (arquivo: File): Promise<boolean> => {
  const base64 = await paraBase64(arquivo);
  const { salvo } = await plugin.salvar({ base64, nome: arquivo.name });
  return salvo === true;
};
