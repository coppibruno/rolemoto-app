import type { Metadata } from "next";
import Link from "next/link";
import { SecaoPolitica } from "../privacidade/components/SecaoPolitica";
import { DATA_ATUALIZACAO, EMAIL_CONTATO } from "../privacidade/constants";
import styles from "../privacidade/privacidade.module.css";

export const metadata: Metadata = {
  title: "Excluir conta · Rolê Moto",
  description:
    "Como solicitar a exclusão da sua conta e dos seus dados no app Rolê Moto.",
};

const ASSUNTO_EMAIL = "Exclusão de conta e dados - Rolê Moto";

const ExcluirContaPage = () => {
  const mailto = `mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent(ASSUNTO_EMAIL)}`;

  return (
    <main className={styles.tela}>
      <header className={styles.cabecalho}>
        <Link href="/" className={styles.marca}>
          ROLÊ<span className={styles.marcaMoto}>MOTO</span>
        </Link>
        <h1 className={styles.titulo}>Excluir conta e dados</h1>
        <p className={styles.atualizacao}>Última atualização: {DATA_ATUALIZACAO}</p>
      </header>

      <SecaoPolitica id="pelo-app" titulo="Pelo app (imediato)">
        <ol>
          <li>Abra o app <strong>Rolê Moto</strong> e entre na sua conta;</li>
          <li>Abra o menu e toque em <strong>Perfil</strong>;</li>
          <li>Role até o fim da tela;</li>
          <li>Toque em <strong>Excluir conta</strong> e confirme.</li>
        </ol>
        <p>
          A conta de acesso, os dados de perfil (apelido, moto, foto, cidade e
          preferências) e os tokens de notificação do dispositivo são apagados na
          hora.
        </p>
      </SecaoPolitica>

      <SecaoPolitica id="por-email" titulo="Por e-mail (exclusão completa)">
        <p>
          Para apagar também o conteúdo que você publicou, ou se não conseguir
          acessar o app, envie um e-mail para{" "}
          <a href={mailto}>{EMAIL_CONTATO}</a> a partir do endereço cadastrado na
          conta, com o assunto &quot;{ASSUNTO_EMAIL}&quot;.
        </p>
        <p>
          Atendemos em até <strong>30 dias</strong> e confirmamos por e-mail quando
          a exclusão for concluída.
        </p>
      </SecaoPolitica>

      <SecaoPolitica id="dados" titulo="O que é apagado">
        <ul>
          <li>Conta de acesso (e-mail, nome e vínculo com o login Google);</li>
          <li>Dados de perfil e foto;</li>
          <li>Tokens de notificação push;</li>
          <li>
            Na exclusão completa por e-mail: rolês criados, solicitações e
            inscrições, locais favoritos, avaliações e suas fotos, e passeios
            gravados (traçado, distância e velocidades).
          </li>
        </ul>
      </SecaoPolitica>

      <SecaoPolitica id="retidos" titulo="O que pode ser mantido">
        <ul>
          <li>
            Se você excluir só pelo app, o conteúdo publicado pode permanecer sem
            vínculo com seu perfil até que você peça a exclusão completa;
          </li>
          <li>
            Registros técnicos de erro são mantidos pelo provedor de monitoramento
            por até 90 dias e depois descartados automaticamente;
          </li>
          <li>Dados que a lei nos obrigue a guardar, pelo prazo legal.</li>
        </ul>
        <p>
          Mais detalhes na <Link href="/privacidade">Política de Privacidade</Link>.
        </p>
      </SecaoPolitica>
    </main>
  );
};

export default ExcluirContaPage;
