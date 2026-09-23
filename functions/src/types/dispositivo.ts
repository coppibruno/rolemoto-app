/** Token FCM de um aparelho. Datas em ISO. */
export type PlataformaDispositivo = "web" | "android" | "ios";

export const PLATAFORMAS_DISPOSITIVO: readonly PlataformaDispositivo[] = [
  "web",
  "android",
  "ios",
];

export const ehPlataformaDispositivo = (
  value: unknown,
): value is PlataformaDispositivo =>
  typeof value === "string" &&
  (PLATAFORMAS_DISPOSITIVO as readonly string[]).includes(value);

export type Dispositivo = {
  token: string;
  uid: string;
  plataforma: PlataformaDispositivo;
  createdAt: string;
  updatedAt: string;
};

export type DispositivoCreate = {
  token: string;
  /** Default `"web"` se omitido — docs antigos sem campo continuam válidos. */
  plataforma?: PlataformaDispositivo;
};
