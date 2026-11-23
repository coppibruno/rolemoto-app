import { Suspense } from "react";
import { TelaMeusRoles } from "./components/TelaMeusRoles";

const MeusRolesPage = () => {
  return (
    <main>
      <Suspense>
        <TelaMeusRoles />
      </Suspense>
    </main>
  );
};

export default MeusRolesPage;
