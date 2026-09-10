/** Token FCM de um aparelho. Datas em ISO. */
export type Dispositivo = {
  token: string;
  uid: string;
  createdAt: string;
  updatedAt: string;
};

export type DispositivoCreate = {
  token: string;
};
