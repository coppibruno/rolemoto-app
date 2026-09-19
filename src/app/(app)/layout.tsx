import { MenuInferior } from "@/components/menu-inferior/MenuInferior";
import { BannerInstalarApp } from "@/components/pwa/BannerInstalarApp";
import { GuardaApp } from "./components/GuardaApp";
import { GuardaFeedbackPendente } from "./components/GuardaFeedbackPendente";
import { ToastPush } from "./components/ToastPush";
import { AvisoSessaoTelemetria } from "@/app/(app)/roles/[id]/telemetria/components/AvisoSessaoTelemetria";
import styles from "./app.module.css";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <GuardaApp>
      <GuardaFeedbackPendente>
        <div className={styles.shell}>
          <div className={styles.conteudo}>{children}</div>
          <BannerInstalarApp />
          <AvisoSessaoTelemetria />
          <ToastPush />
          <MenuInferior />
        </div>
      </GuardaFeedbackPendente>
    </GuardaApp>
  );
};

export default AppLayout;
