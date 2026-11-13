import { BannerAbrirAppIosCliente } from "./BannerAbrirAppIosCliente";

/** Só aparece depois do Team ID: o esquema `rolemoto://` entra no binário novo do iOS. */
export const BannerAbrirAppIos = () => {
  if (!process.env.APPLE_TEAM_ID?.trim()) return null;
  return <BannerAbrirAppIosCliente />;
};
