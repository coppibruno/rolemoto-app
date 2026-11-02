/** Limite de upload de fotos (perfil, capa de rolê, flyer de evento e fachada). */
export const MAX_FOTO_MB = 10;
export const MAX_FOTO_BYTES = MAX_FOTO_MB * 1024 * 1024;
export const TIPOS_FOTO_ACEITOS = ["image/jpeg", "image/png"];
export const ERRO_FOTO_GRANDE = `A foto deve ter no máximo ${MAX_FOTO_MB}MB.`;
