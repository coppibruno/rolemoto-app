import { MenuInferior } from "@/components/menu-inferior/MenuInferior";
import { GuardaApp } from "./components/GuardaApp";
import { GuardaFeedbackPendente } from "./components/GuardaFeedbackPendente";
import styles from "./app.module.css";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <GuardaApp>
      <GuardaFeedbackPendente>
        <div className={styles.shell}>
          <div className={styles.conteudo}>{children}</div>
          <MenuInferior />
        </div>
      </GuardaFeedbackPendente>
    </GuardaApp>
  );
};

export default AppLayout;
