/**
 * Completa a galeria dos locais que já estão em produção e vieram da Places.
 * A capa atual continua sendo a primeira foto. Sem --aplicar, nada é gravado.
 *
 *   cd functions
 *   npm run fotos:locais -- --limite 3
 *   npm run fotos:locais -- --limite 3 --aplicar
 *   npm run fotos:locais -- --aplicar
 */
import {existsSync, readFileSync} from "fs";
import {resolve} from "path";
import {FieldValue} from "firebase-admin/firestore";
import {
  baixarFotoPlaces,
  buscarFotosDoLugar,
} from "../lib/sugestoes-local/foto-places";
import {
  escolherFotosExtras,
  galeriaAtual,
  idFotoPlaces,
  LIMITE_FOTOS_GALERIA,
} from "../lib/sugestoes-local/galeria-places";
import {
  caminhoFotoExtra,
  salvarFotoExtra,
  urlFotoExistente,
} from "../lib/sugestoes-local/salvar-foto-fachada";

const PAUSA_LUGAR_MS = 500;
const PAUSA_FOTO_MS = 300;

const carregarEnvLocal = (): void => {
  const caminho = resolve(__dirname, "../../.env");
  if (!existsSync(caminho)) {
    return;
  }
  for (const linha of readFileSync(caminho, "utf8").split("\n")) {
    const limpa = linha.trim();
    if (!limpa || limpa.startsWith("#")) {
      continue;
    }
    const eq = limpa.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const chave = limpa.slice(0, eq).trim();
    let valor = limpa.slice(eq + 1).trim();
    const aspas = valor.startsWith("\"") || valor.startsWith("'");
    if (aspas && valor.endsWith(valor[0])) {
      valor = valor.slice(1, -1);
    }
    if (process.env[chave] === undefined) {
      process.env[chave] = valor;
    }
  }
};

const lerLimite = (args: string[]): number | null => {
  const idx = args.indexOf("--limite");
  const bruto = idx >= 0 ?
    args[idx + 1] :
    args.find((item) => item.startsWith("--limite="))?.slice("--limite=".length);
  if (bruto === undefined) {
    return null;
  }
  const limite = Number(bruto);
  if (!Number.isInteger(limite) || limite < 1) {
    throw new Error("--limite precisa ser um inteiro maior que zero");
  }
  return limite;
};

const pausa = (ms: number): Promise<void> =>
  new Promise((resolver) => {
    setTimeout(resolver, ms);
  });

const emuladorLigado = (): boolean =>
  Boolean(
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.FIREBASE_STORAGE_EMULATOR_HOST,
  );

const urlDaFoto = async (
  chave: string,
  placeId: string,
  recurso: string,
): Promise<string | null> => {
  const fotoId = idFotoPlaces(recurso);
  if (!fotoId) {
    return null;
  }
  const caminho = caminhoFotoExtra(placeId, fotoId);
  const existente = await urlFotoExistente(caminho);
  if (existente) {
    return existente;
  }
  const arquivo = await baixarFotoPlaces(chave, recurso);
  if (!arquivo) {
    return null;
  }
  const url = await salvarFotoExtra(
    placeId,
    fotoId,
    arquivo.bytes,
    arquivo.contentType,
  );
  await pausa(PAUSA_FOTO_MS);
  return url;
};

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const aplicar = args.includes("--aplicar");
  const limite = lerLimite(args);
  carregarEnvLocal();

  if (emuladorLigado()) {
    console.error(
      "Emulador ligado. Feche FIRESTORE_EMULATOR_HOST e " +
      "FIREBASE_STORAGE_EMULATOR_HOST para falar com produção.",
    );
    process.exit(1);
  }

  const chave = (process.env.PLACES_API_KEY ?? "").trim();
  if (!chave) {
    console.error("PLACES_API_KEY ausente. Use functions/.env ou exporte no shell.");
    process.exit(1);
  }

  process.env.GCLOUD_PROJECT ??= "rolemoto-bc47f";
  process.env.GOOGLE_CLOUD_PROJECT ??= "rolemoto-bc47f";

  const {firestore} = await import("../lib/firebase-admin.js");
  const snap = await firestore.collection("locais").get();
  const docs = [...snap.docs].sort((a, b) =>
    String(a.get("nome") ?? "").localeCompare(String(b.get("nome") ?? ""), "pt"),
  );
  let lidos = 0;
  let semPlace = 0;
  let cheios = 0;
  let consultados = 0;
  let semExtra = 0;
  let fotosNovas = 0;
  let atualizados = 0;
  let erros = 0;
  let parouNoLimite = false;

  console.log(aplicar ? "Gravando em produção." : "Simulação. Nada será gravado.");
  console.log(
    "Cada local consultado gasta uma chamada Place Details. " +
    "O download das fotos só ocorre com --aplicar.",
  );

  for (const doc of docs) {
    lidos += 1;
    const data = doc.data();
    const placeId = typeof data.googlePlaceId === "string" ?
      data.googlePlaceId.trim() :
      "";
    if (!placeId) {
      semPlace += 1;
      continue;
    }
    const galeria = galeriaAtual(String(data.fotoFachadaUrl ?? ""), data.fotosUrls);
    if (galeria.length >= LIMITE_FOTOS_GALERIA) {
      cheios += 1;
      continue;
    }
    if (limite !== null && consultados >= limite) {
      parouNoLimite = true;
      continue;
    }

    consultados += 1;
    const nome = String(data.nome ?? doc.id);
    let fotos: Awaited<ReturnType<typeof buscarFotosDoLugar>>;
    let recursoCapa = "";
    try {
      const sugestao = await firestore.collection("sugestoesLocal").doc(placeId).get();
      recursoCapa = sugestao.exists ? String(sugestao.get("fotoRecurso") ?? "") : "";
      fotos = await buscarFotosDoLugar(chave, placeId);
    } catch (error) {
      erros += 1;
      const detalhe = error instanceof Error ? error.message : String(error);
      console.warn(`Falhou na Places: ${nome} (${detalhe})`);
      await pausa(PAUSA_LUGAR_MS);
      continue;
    }
    await pausa(PAUSA_LUGAR_MS);
    if (!fotos) {
      erros += 1;
      console.warn(`Falhou na Places: ${nome}`);
      continue;
    }

    const extras = escolherFotosExtras({placeId, galeria, fotos, recursoCapa});
    if (extras.length === 0) {
      semExtra += 1;
      console.log(`${nome}: nada a acrescentar (${galeria.length} foto(s))`);
      continue;
    }

    console.log(
      `${nome}: +${extras.length}, galeria fica com ${galeria.length + extras.length}`,
    );
    if (!aplicar) {
      fotosNovas += extras.length;
      continue;
    }

    try {
      const novas: string[] = [];
      for (const recurso of extras) {
        const url = await urlDaFoto(chave, placeId, recurso);
        if (url) {
          novas.push(url);
        } else {
          console.warn(`Não baixou uma foto de ${nome}`);
        }
      }
      if (novas.length === 0) {
        erros += 1;
        continue;
      }
      const completa = [...galeria, ...novas].slice(0, LIMITE_FOTOS_GALERIA);
      await doc.ref.update({
        fotosUrls: completa,
        fotoFachadaUrl: completa[0] ?? "",
        updatedAt: FieldValue.serverTimestamp(),
      });
      fotosNovas += novas.length;
      atualizados += 1;
    } catch (error) {
      erros += 1;
      const detalhe = error instanceof Error ? error.message : String(error);
      console.warn(`Erro ao gravar ${nome}: ${detalhe}`);
    }
  }

  console.log("---");
  console.log(`Lidos: ${lidos}`);
  console.log(`Sem Place (cadastro manual): ${semPlace}`);
  console.log(`Galeria já cheia: ${cheios}`);
  console.log(`Consultados: ${consultados}`);
  console.log(`Sem foto extra: ${semExtra}`);
  console.log(`Fotos ${aplicar ? "gravadas" : "previstas"}: ${fotosNovas}`);
  console.log(`Locais atualizados: ${atualizados}`);
  console.log(`Erros: ${erros}`);
  if (parouNoLimite) {
    console.log(
      `Parou no limite de ${limite} locais. Rode de novo sem --limite para o resto.`,
    );
  } else if (!aplicar && fotosNovas > 0) {
    console.log("Para gravar: npm run fotos:locais -- --aplicar");
  }

  if (erros > 0) {
    process.exitCode = 1;
  }
};

main().catch((error: unknown) => {
  const mensagem = error instanceof Error ? error.message : String(error);
  console.error(mensagem);
  process.exit(1);
});
