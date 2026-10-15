import type { Metadata } from "next";
import Link from "next/link";
import { SecaoPolitica } from "./components/SecaoPolitica";
import { DATA_ATUALIZACAO, EMAIL_CONTATO } from "./constants";
import styles from "./privacidade.module.css";

export const metadata: Metadata = {
  title: "Política de Privacidade · Rolê Moto",
  description:
    "Como o Rolê Moto coleta, usa, compartilha e protege os dados dos motociclistas e do dispositivo.",
};

const PrivacidadePage = () => {
  const mailto = `mailto:${EMAIL_CONTATO}`;

  return (
    <main className={styles.tela}>
      <header className={styles.cabecalho}>
        <Link href="/" className={styles.marca}>
          ROLÊ<span className={styles.marcaMoto}>MOTO</span>
        </Link>
        <h1 className={styles.titulo}>Política de Privacidade</h1>
        <p className={styles.atualizacao}>Última atualização: {DATA_ATUALIZACAO}</p>
      </header>

      <SecaoPolitica id="introducao" titulo="1. Quem somos">
        <p>
          O <strong>Rolê Moto</strong> é um aplicativo gratuito (web/PWA, Android e
          iOS) para motociclistas encontrarem, organizarem e registrarem passeios
          de moto, eventos e locais. Esta política explica quais dados coletamos,
          por que coletamos, com quem compartilhamos e como você pode controlá-los,
          em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018
          — LGPD).
        </p>
        <p>
          Ao usar o app, você declara ter lido esta política. Dúvidas podem ser
          enviadas para <a href={mailto}>{EMAIL_CONTATO}</a>.
        </p>
      </SecaoPolitica>

      <SecaoPolitica id="dados-coletados" titulo="2. Dados que coletamos">
        <p>
          <strong>Dados de conta.</strong> Ao entrar com Google ou com e-mail e
          senha, recebemos do Firebase Authentication seu identificador de usuário,
          nome, e-mail e, no caso do Google, a foto da conta. Não temos acesso à sua
          senha.
        </p>
        <p>
          <strong>Dados de perfil.</strong> Informações que você mesmo preenche:
          apelido, moto, tipo de moto, ritmo de pilotagem, foto, se costuma levar
          garupa e, opcionalmente, sua cidade.
        </p>
        <p>
          <strong>Conteúdo que você cria.</strong> Rolês (título, descrição, data,
          ponto de saída, destino, ritmo e foto de capa), solicitações de
          participação, inscrições em eventos, locais favoritos, avaliações (nota,
          comentário, fotos e recomendação) e relatos de rolês.
        </p>
        <p>
          <strong>Localização do dispositivo.</strong> Usamos a localização
          aproximada e precisa para:
        </p>
        <ul>
          <li>
            mostrar rolês, eventos e locais dentro do raio escolhido no feed
            (somente enquanto o app está aberto);
          </li>
          <li>escolher pontos no mapa ao criar rolês, eventos ou locais;</li>
          <li>
            <strong>gravar um passeio</strong> na tela &quot;Gravar meu rolê&quot;.
            Somente quando você inicia uma gravação, o app coleta a localização
            inclusive <strong>em segundo plano</strong> (com a tela desligada ou
            outro app aberto), para registrar o traçado, a distância, a duração e
            as velocidades máxima e média do passeio. Durante a gravação, uma
            notificação permanente fica visível. A coleta para assim que você
            encerra a gravação.
          </li>
        </ul>
        <p>
          Não rastreamos sua localização fora dessas situações e não a usamos para
          publicidade.
        </p>
        <p>
          <strong>Fotos e arquivos.</strong> Acessamos a câmera ou a galeria apenas
          quando você escolhe uma imagem para enviar (foto de perfil, capa de rolê
          ou fotos de avaliação). Só a imagem selecionada é enviada.
        </p>
        <p>
          <strong>Notificações.</strong> Se você permitir, guardamos o token de
          notificação push do dispositivo para avisar sobre solicitações,
          aprovações, lembretes e novidades dos seus rolês e eventos.
        </p>
        <p>
          <strong>Dados técnicos e de diagnóstico.</strong> Para corrigir falhas,
          coletamos relatórios de erro com informações do dispositivo, sistema
          operacional, navegador, endereço IP e as ações que levaram ao erro. Em
          uma pequena amostra de sessões e quando ocorre um erro, podemos registrar
          uma reprodução anônima da navegação na tela (sem conteúdo digitado em
          campos de senha).
        </p>
      </SecaoPolitica>

      <SecaoPolitica id="finalidades" titulo="3. Como usamos os dados">
        <ul>
          <li>Criar e manter sua conta e autenticar seu acesso;</li>
          <li>
            Exibir seu perfil e seus rolês para a comunidade e permitir que outros
            pilotos encontrem e participem dos passeios;
          </li>
          <li>Mostrar conteúdo próximo de você no feed;</li>
          <li>Registrar e exibir as estatísticas dos passeios que você grava;</li>
          <li>Enviar notificações relacionadas ao uso do app;</li>
          <li>Garantir a segurança, prevenir abusos e corrigir erros;</li>
          <li>Cumprir obrigações legais.</li>
        </ul>
        <p>
          As bases legais são a execução do serviço que você solicitou, o seu
          consentimento (localização, notificações, câmera e galeria, que podem ser
          revogados nas configurações do dispositivo), o legítimo interesse
          (segurança e diagnóstico) e o cumprimento de obrigação legal.
        </p>
      </SecaoPolitica>

      <SecaoPolitica id="visibilidade" titulo="4. O que fica visível para outros">
        <ul>
          <li>
            Seu apelido, foto, moto, tipo de moto, ritmo, cidade e histórico de
            rolês, eventos e passeios gravados aparecem no seu perfil público para
            outros usuários logados;
          </li>
          <li>
            Rolês que você cria, incluindo pontos de saída e destino, ficam
            visíveis no feed. O link de convite de um rolê pode ser aberto por
            qualquer pessoa, mesmo sem conta, e mostra os pilotos participantes;
          </li>
          <li>Avaliações de eventos e locais são exibidas com seu apelido e foto;</li>
          <li>
            Passeios gravados mostram traçado, distância e velocidades. Evite
            iniciar ou encerrar uma gravação na porta de casa se não quiser expor
            esse endereço.
          </li>
        </ul>
        <p>Seu e-mail nunca é exibido para outros usuários.</p>
      </SecaoPolitica>

      <SecaoPolitica id="compartilhamento" titulo="5. Compartilhamento">
        <p>
          <strong>Não vendemos nem alugamos seus dados</strong> e não exibimos
          anúncios. Compartilhamos dados apenas com prestadores que operam o app em
          nosso nome:
        </p>
        <ul>
          <li>
            <strong>Google Firebase</strong> (autenticação, banco de dados,
            armazenamento de fotos, funções de servidor e notificações push);
          </li>
          <li>
            <strong>Sentry</strong> (monitoramento de erros e desempenho);
          </li>
          <li>
            <strong>OpenStreetMap</strong> (imagens dos mapas, requisitadas pelo
            nosso servidor) e <strong>Google Fonts</strong> (fontes do app);
          </li>
          <li>Provedor de hospedagem do site e do app.</li>
        </ul>
        <p>
          Alguns desses serviços podem armazenar dados fora do Brasil, com
          salvaguardas adequadas conforme a LGPD. Também podemos divulgar dados
          quando exigido por lei ou ordem judicial.
        </p>
      </SecaoPolitica>

      <SecaoPolitica id="seguranca" titulo="6. Segurança">
        <p>
          Os dados trafegam por conexão criptografada (HTTPS). O banco de dados
          não aceita acesso direto do aplicativo: toda leitura e escrita passa pelo
          nosso servidor, que verifica sua identidade e suas permissões. Nenhum
          sistema é 100% seguro, mas adotamos medidas razoáveis para proteger suas
          informações.
        </p>
      </SecaoPolitica>

      <SecaoPolitica id="retencao" titulo="7. Retenção e exclusão de dados">
        <p>
          Mantemos seus dados enquanto sua conta estiver ativa. Você pode{" "}
          <strong>excluir sua conta a qualquer momento</strong> em{" "}
          <strong>Perfil → Excluir conta</strong>. A exclusão remove
          imediatamente sua conta de acesso, seus dados de perfil e os tokens de
          notificação do dispositivo.
        </p>
        <p>
          Conteúdos que você publicou (rolês, avaliações, fotos e passeios
          gravados) podem permanecer sem vínculo com seu perfil. Para apagá-los
          também, solicite pelo e-mail <a href={mailto}>{EMAIL_CONTATO}</a>{" "}
          — atendemos em até 30 dias. Registros de erro são mantidos por tempo
          limitado pelo provedor de monitoramento.
        </p>
        <p>
          Se não conseguir acessar o app, solicite a exclusão completa pelo mesmo
          e-mail, a partir do endereço cadastrado na conta.
        </p>
      </SecaoPolitica>

      <SecaoPolitica id="direitos" titulo="8. Seus direitos">
        <p>Conforme a LGPD, você pode solicitar a qualquer momento:</p>
        <ul>
          <li>confirmação e acesso aos seus dados;</li>
          <li>correção de dados incompletos ou desatualizados;</li>
          <li>anonimização, bloqueio ou eliminação de dados;</li>
          <li>portabilidade dos dados;</li>
          <li>informação sobre com quem compartilhamos seus dados;</li>
          <li>revogação do consentimento.</li>
        </ul>
        <p>
          Boa parte disso pode ser feita no próprio app (editar perfil, desativar
          permissões nas configurações do dispositivo, excluir conta). Para o
          restante, escreva para <a href={mailto}>{EMAIL_CONTATO}</a>.
        </p>
      </SecaoPolitica>

      <SecaoPolitica id="menores" titulo="9. Menores de idade">
        <p>
          O Rolê Moto é destinado a maiores de 18 anos. Não coletamos
          intencionalmente dados de menores. Se identificarmos uma conta de menor,
          ela será removida.
        </p>
      </SecaoPolitica>

      <SecaoPolitica id="alteracoes" titulo="10. Alterações nesta política">
        <p>
          Podemos atualizar esta política para refletir mudanças no app ou na
          legislação. A data no topo indica a última revisão. Mudanças relevantes
          serão comunicadas no app.
        </p>
      </SecaoPolitica>

      <SecaoPolitica id="contato" titulo="11. Contato">
        <p>
          Encarregado pelo tratamento de dados (DPO): equipe Rolê Moto —{" "}
          <a href={mailto}>{EMAIL_CONTATO}</a>.
        </p>
      </SecaoPolitica>
    </main>
  );
};

export default PrivacidadePage;
