/**
 * Configuración para FontAwesome Light Icons
 * 
 * Para usar íconos de FontAwesome Light, necesitas tener FontAwesome Kit configurado.
 * 
 * Opción 1: Si tienes FontAwesome Kit:
 * 1. Obtén tu código de Kit desde https://fontawesome.com/kits
 * 2. Descomenta y ajusta la siguiente línea con tu código:
 *    import { byPrefixAndName } from '@awesome.me/kit-TU_KIT_CODE/icons';
 * 3. Exporta byPrefixAndName desde este archivo
 * 
 * Opción 2: Si tienes FontAwesome Pro instalado localmente:
 * 1. Instala el paquete: npm install @fortawesome/pro-light-svg-icons
 * 2. Importa y configura los íconos aquí
 * 
 * Opción 3: Si no tienes FontAwesome Light, el código usará íconos alternativos
 * de los paquetes gratuitos disponibles.
 */

// Intentar importar byPrefixAndName si está disponible
let byPrefixAndName: any = null;

try {
  // Opción 1: Si tienes FontAwesome Kit, descomenta y ajusta:
  // import { byPrefixAndName } from '@awesome.me/kit-TU_KIT_CODE/icons';
  
  // Opción 2: Si tienes FontAwesome Pro Light instalado:
  // import { fal } from '@fortawesome/pro-light-svg-icons';
  // byPrefixAndName = { fal };
  
  // Opción 3: Acceder desde window si está disponible globalmente
  if (typeof window !== 'undefined' && (window as any).byPrefixAndName) {
    byPrefixAndName = (window as any).byPrefixAndName;
  }
} catch (e) {
  // Si no está disponible, byPrefixAndName será null
  // El código usará íconos alternativos automáticamente
}

export default byPrefixAndName;
