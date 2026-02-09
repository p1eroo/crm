// Paleta de colores para avatares (rosa pastel, amarillo-naranja, naranja, lavanda, teal, etc.)
export const AVATAR_COLORS = [
  '#e8a8b8', // rosa pastel suave
  '#e8b84c', // amarillo-naranja brillante
  '#e89450', // naranja claro
  '#b8a0e0', // lavanda pastel
  '#50b8b0', // teal / menta vibrante
  '#70a8d8', // azul cielo suave
  '#d890a8', // rosa coral pastel
  '#88c878', // verde menta
  '#d8a858', // ámbar / dorado
  '#a890d8', // violeta pastel
];

/**
 * Obtiene un color de la paleta de avatares basado en un string (nombre, username, etc.)
 * @param str - String para generar el hash y seleccionar el color
 * @returns Color hexadecimal de la paleta
 */
export const getAvatarColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

/**
 * Obtiene el color de fondo y texto para un avatar basado en un string
 * @param str - String para generar el hash y seleccionar el color
 * @returns Objeto con bg (color de fondo) y color (color del texto, siempre blanco)
 */
export const getAvatarColors = (str: string): { bg: string; color: string } => {
  return {
    bg: getAvatarColor(str),
    color: '#fff',
  };
};
