/**
 * Utilidades para manejar fechas en zona horaria de Perú (America/Lima, UTC-5)
 */

/**
 * Convierte una fecha a la zona horaria de Perú
 * @param date - Fecha a convertir (string, Date, o null/undefined)
 * @returns Date en zona horaria de Perú o null
 */
export const toPeruTime = (date: string | Date | null | undefined): Date | null => {
  if (!date) return null;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return null;
  
  // Convertir a hora de Perú (UTC-5)
  // Obtener la fecha en UTC y ajustar a hora de Perú
  const utcTime = dateObj.getTime();
  const peruOffset = -5 * 60 * 60 * 1000; // UTC-5 en milisegundos
  const peruTime = new Date(utcTime + peruOffset);
  
  return peruTime;
};

/**
 * Formatea una fecha en formato corto (DD/MM/YYYY) en hora de Perú
 * @param dateString - Fecha en formato string o Date
 * @returns String formateado o string vacío si no hay fecha
 */
export const formatDatePeru = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '';
  
  let date: Date;
  if (typeof dateString === 'string') {
    // Si es un string en formato YYYY-MM-DD, parsearlo como fecha local para evitar problemas de UTC
    const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      const year = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1; // Los meses en Date son 0-11
      const day = parseInt(dateMatch[3], 10);
      date = new Date(year, month, day);
    } else {
      date = new Date(dateString);
    }
  } else {
    date = dateString;
  }
  
  if (isNaN(date.getTime())) return '';
  
  // Formatear directamente sin conversiones de zona horaria
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Formatea una fecha con hora en formato largo (DD/MM/YYYY HH:MM) en hora de Perú
 * @param dateString - Fecha en formato string o Date
 * @returns String formateado o string vacío si no hay fecha
 */
export const formatDateTimePeru = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '';
  
  // Usar toLocaleString con zona horaria de Perú
  return date.toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formatea una fecha para input type="date" (YYYY-MM-DD) en hora de Perú
 * @param dateString - Fecha en formato string o Date
 * @returns String en formato YYYY-MM-DD o string vacío si no hay fecha
 */
export const formatDateInputPeru = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '';
  
  // Obtener la fecha en hora de Perú
  const peruDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Lima' }));
  
  const year = peruDate.getFullYear();
  const month = String(peruDate.getMonth() + 1).padStart(2, '0');
  const day = String(peruDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Crea una fecha en hora de Perú a partir de año, mes y día
 * @param year - Año
 * @param month - Mes (1-12)
 * @param day - Día
 * @returns Date en hora de Perú
 */
export const createDatePeru = (year: number, month: number, day: number): Date => {
  // Crear una fecha string en formato ISO para la zona horaria de Perú
  // Usar medianoche (00:00:00) en hora de Perú
  const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00-05:00`;
  return new Date(dateString);
};

/**
 * Obtiene la fecha actual en hora de Perú
 * @returns Date actual en hora de Perú
 */
export const getCurrentDatePeru = (): Date => {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
};

