export type PlataformaDispositivo = "web" | "android" | "ios";

export type Dispositivo = {
  token: string;
  uid: string;
  plataforma: PlataformaDispositivo;
  createdAt: string;
  updatedAt: string;
};
