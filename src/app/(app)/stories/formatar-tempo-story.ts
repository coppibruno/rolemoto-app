export const tempoRelativoStory = (iso: string, agora = Date.now()): string => {
  const diff = Math.max(0, agora - Date.parse(iso));
  const minutos = Math.floor(diff / 60000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  return `há ${horas} h`;
};
