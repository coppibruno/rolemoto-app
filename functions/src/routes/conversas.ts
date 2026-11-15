import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {apelidoExibicao} from "../lib/apelido";
import {
  ERRO_PARA_SI,
  ERRO_REACAO,
  ERRO_REACAO_SEM_STORY,
  ERRO_STORY_RESPOSTA,
  idConversa,
  outroDaConversa,
  reacaoDe,
  resumoReacao,
  storyValidaParaResposta,
  textoMensagem,
  trechoMensagem,
} from "../lib/conversa";
import {erroDe, log} from "../lib/log";
import {notificarMensagem} from "../lib/notificacoes";
import {param} from "../lib/params";
import {
  conversaRepository,
  storyLocalRepository,
  usuarioRepository,
} from "../repositories";
import type {
  ConversaItem,
  Mensagem,
  MensagemPublica,
  PessoaConversa,
  StoryDaMensagem,
} from "../types/conversa";
import {REACOES_STORY} from "../types/conversa";
import type {Usuario} from "../types/usuario";

/**
 * Mensagem direta entre dois pilotos (SPEC 061 CH). Sem leitura ao vivo.
 *
 * GET  /conversas
 * GET  /conversas/nao-lidas
 * GET  /conversas/:id/mensagens (sem cursor marca a conversa como lida)
 * POST /conversas (`reacao` + `storyId` = reação ao story)
 */
export const conversasRouter = Router();

conversasRouter.use(autenticar);
conversasRouter.use(rateLimitAutenticado);

const cursorDaQuery = (req: Request): string | null => {
  const valor = req.query.cursor;
  if (typeof valor !== "string") {
    return null;
  }
  return valor.trim() || null;
};

const paraPessoa = (uid: string, usuario: Usuario | null | undefined): PessoaConversa => ({
  uid,
  nome: usuario?.nome ?? "",
  apelido: apelidoExibicao(usuario ?? null),
  fotoUrl: usuario?.fotoUrl ?? "",
});

const storiesDasMensagens = async (
  mensagens: Mensagem[],
): Promise<Map<string, StoryDaMensagem>> => {
  const ids = [...new Set(mensagens.flatMap((m) => m.storyId ? [m.storyId] : []))];
  const agora = Date.now();
  const pares = await Promise.all(ids.map(async (id) => {
    const story = await storyLocalRepository.buscarPorId(id);
    const ativa = story !== null && Date.parse(story.expiresAt) > agora;
    return [id, {ativa, fotoUrl: ativa && story ? story.fotoUrl : null}] as const;
  }));
  return new Map(pares);
};

const publicar = (
  mensagem: Mensagem,
  stories: Map<string, StoryDaMensagem>,
): MensagemPublica => ({
  ...mensagem,
  story: mensagem.storyId ?
    stories.get(mensagem.storyId) ?? {ativa: false, fotoUrl: null} :
    null,
});

conversasRouter.get("/", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
    const pagina = await conversaRepository.listarDoUsuario(uid, cursorDaQuery(req));
    if (!pagina.ok) {
      res.status(400).json({erro: "cursor inválido"});
      return;
    }
    const outros = pagina.itens.map((conversa) =>
      conversa.participantes.find((p) => p !== uid) ?? "",
    );
    const usuarios = await usuarioRepository.buscarPorIds(outros);
    const porUid = new Map(usuarios.map((u) => [u.uid, u]));
    const itens: ConversaItem[] = pagina.itens.map((conversa, i) => ({
      id: conversa.id,
      outro: paraPessoa(outros[i], porUid.get(outros[i])),
      ultimaMensagemTexto: trechoMensagem(conversa.ultimaMensagemTexto),
      ultimaMensagemEm: conversa.ultimaMensagemEm,
      ultimaMensagemAutorId: conversa.ultimaMensagemAutorId,
      naoLida: conversa.naoLidaPor.includes(uid),
    }));
    res.json({itens, proximoCursor: pagina.proximoCursor});
  } catch (error) {
    responderErro(res, error);
  }
});

conversasRouter.get("/nao-lidas", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
    res.json({total: await conversaRepository.contarNaoLidas(uid)});
  } catch (error) {
    responderErro(res, error);
  }
});

conversasRouter.get("/:id/mensagens", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
    const conversaId = param(req, "id");
    const outroUid = outroDaConversa(conversaId, uid);
    const outro = outroUid ? await usuarioRepository.buscarPorId(outroUid) : null;
    if (!outroUid || !outro) {
      res.status(404).json({erro: "Conversa não encontrada"});
      return;
    }
    const cursor = cursorDaQuery(req);
    const pagina = await conversaRepository.listarMensagens(conversaId, cursor);
    if (!pagina.ok) {
      res.status(400).json({erro: "cursor inválido"});
      return;
    }
    // Abrir a página mais recente é ler a conversa.
    if (!cursor) {
      await conversaRepository.marcarLida(conversaId, uid).catch((error) => {
        log.warn("Conversa", "Falha ao marcar lida", {conversaId, ...erroDe(error)});
      });
    }
    const stories = await storiesDasMensagens(pagina.itens);
    res.json({
      conversaId,
      outro: paraPessoa(outroUid, outro),
      itens: pagina.itens.map((m) => publicar(m, stories)),
      proximoCursor: pagina.proximoCursor,
    });
  } catch (error) {
    responderErro(res, error);
  }
});

conversasRouter.post("/", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
    const body = (req.body ?? {}) as Record<string, unknown>;
    const destinatarioId = typeof body.destinatarioId === "string" ?
      body.destinatarioId.trim() :
      "";
    if (!destinatarioId || destinatarioId.includes("/")) {
      res.status(400).json({erro: "destinatarioId inválido"});
      return;
    }
    if (destinatarioId === uid) {
      res.status(400).json({erro: ERRO_PARA_SI});
      return;
    }
    const temReacao = body.reacao !== undefined && body.reacao !== null;
    const reacao = temReacao ? reacaoDe(body.reacao) : null;
    if (temReacao && !reacao) {
      res.status(400).json({erro: ERRO_REACAO});
      return;
    }
    // Reação manda o emoji como texto; o corpo do cliente é ignorado.
    const texto = reacao ?
      {ok: true as const, valor: REACOES_STORY[reacao]} :
      textoMensagem(body.texto);
    if (!texto.ok) {
      res.status(400).json({erro: texto.erro});
      return;
    }
    const storyIdBruto = body.storyId;
    if (
      storyIdBruto !== undefined &&
      storyIdBruto !== null &&
      (typeof storyIdBruto !== "string" || storyIdBruto.includes("/"))
    ) {
      res.status(400).json({erro: ERRO_STORY_RESPOSTA});
      return;
    }
    const storyId = typeof storyIdBruto === "string" && storyIdBruto.trim() ?
      storyIdBruto.trim() :
      null;
    if (reacao && !storyId) {
      res.status(400).json({erro: ERRO_REACAO_SEM_STORY});
      return;
    }
    const resumo = reacao ? resumoReacao(reacao) : texto.valor;

    const [destinatario, eu] = await Promise.all([
      usuarioRepository.buscarPorId(destinatarioId),
      usuarioRepository.buscarPorId(uid),
    ]);
    if (!destinatario) {
      res.status(404).json({erro: "Perfil não encontrado"});
      return;
    }
    let storyFotoUrl: string | null = null;
    if (storyId) {
      const story = await storyLocalRepository.buscarPorId(storyId);
      if (!storyValidaParaResposta(story, destinatarioId)) {
        res.status(400).json({erro: ERRO_STORY_RESPOSTA});
        return;
      }
      storyFotoUrl = story?.fotoUrl ?? null;
    }

    const conversaId = idConversa(uid, destinatarioId);
    const participantes: [string, string] = uid < destinatarioId ?
      [uid, destinatarioId] :
      [destinatarioId, uid];
    const mensagem = await conversaRepository.enviar({
      conversaId,
      participantes,
      autorId: uid,
      texto: texto.valor,
      storyId,
      reacao,
      resumo,
    });
    log.info("Conversa", "Mensagem enviada", {
      conversaId,
      autorId: uid,
      resposta: storyId !== null,
      reacao,
    });
    try {
      await notificarMensagem(
        destinatarioId,
        conversaId,
        apelidoExibicao(eu),
        trechoMensagem(resumo),
      );
    } catch (error) {
      log.warn("Conversa", "Push de mensagem não enviado", {conversaId, ...erroDe(error)});
    }
    const resposta: MensagemPublica = {
      ...mensagem,
      story: storyId ? {ativa: true, fotoUrl: storyFotoUrl} : null,
    };
    res.status(201).json({conversaId, mensagem: resposta});
  } catch (error) {
    responderErro(res, error);
  }
});
