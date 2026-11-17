export type EventoPassadoAdmin = {
  id: string;
  titulo: string;
  dataHoraAbertura: string;
  dataHoraEncerramento: string | null;
  localNome: string;
  fotoCapaUrl: string;
  cancelada: boolean;
  fotografoId: string | null;
  totalAlbuns: number;
};
