// Paleta de colores Taxi Monterrico
export const taxiMonterricoColors = {
  // Verdes
  green: '#2E7D32',        // Verde vibrante principal
  greenLight: '#4CAF50',   // Verde claro
  greenDark: '#1B5E20',    // Verde oscuro
  greenEmerald: '#10B981', // Verde esmeralda (usado en gradientes y efectos)
  teal: '#0d9394',         // Teal/verde azulado (usado en avatares)
  
  // Naranjas/Amarillos
  orange: '#FFA726',       // Naranja/Amarillo dorado principal
  orangeLight: '#FFB74D',  // Naranja claro
  orangeDark: '#FF9800',   // Naranja oscuro
  
  // Grises y neutros
  white: '#FFFFFF',
  gray: '#757575',
  grayLight: '#E0E0E0',
  grayDark: '#424242',
  grayVeryLight: '#F5F5F5',
  grayBackground: '#FAFAFA',
  
  // Estados
  success: '#2E7D32',
  warning: '#FFA726',
  error: '#D32F2F',
  info: '#2E7D32',
  
  // Colores de fondo para estados (Material Design)
  successLight: '#E8F5E9',  // Verde claro para fondos
  errorLight: '#FFEBEE',   // Rojo claro para fondos
  errorDark: '#C62828',    // Rojo oscuro para texto
  warningLight: '#FFF9C4', // Amarillo claro para fondos
  warningMedium: '#FFF3E0', // Naranja claro para fondos
  warningDark: '#E65100',   // Naranja oscuro para texto
  infoLight: '#E3F2FD',    // Azul claro para fondos
  amberLight: '#FEF3C7',   // Ámbar claro para fondos
  amberDark: '#92400E',    // Ámbar oscuro para texto
  redLight: '#FEE2E2',     // Rojo muy claro para fondos
  redDark: '#991B1B',      // Rojo oscuro alternativo
};

// Función helper para convertir color hex a rgba con opacidad
export const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

