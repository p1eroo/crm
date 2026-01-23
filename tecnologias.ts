/**
 * 🚀 STACK TECNOLÓGICO COMPLETO - CRM Monterrico
 * 
 * Este archivo contiene un catálogo completo y organizado de todas las tecnologías
 * utilizadas y disponibles en el proyecto CRM Monterrico.
 * 
 * @author CRM Monterrico Team
 * @version 2.0.0
 * @created 2026-01-23
 */

// ============================================================================
// 📋 TIPOS Y INTERFACES
// ============================================================================

export interface Tecnologia {
  nombre: string;
  version?: string;
  categoria: string;
  descripcion?: string;
  icono?: string;
  estado: 'activa' | 'en-desarrollo' | 'planificada' | 'experimental';
  url?: string;
}

export interface CategoriaTecnologia {
  nombre: string;
  icono: string;
  color: string;
  tecnologias: Tecnologia[];
}

// ============================================================================
// 🎨 CONFIGURACIÓN DE CATEGORÍAS
// ============================================================================

export const categoriasConfig = {
  frontend: { icono: '⚛️', color: '#61DAFB', nombre: 'Frontend' },
  backend: { icono: '🖥️', color: '#339933', nombre: 'Backend' },
  database: { icono: '🗄️', color: '#336791', nombre: 'Base de Datos' },
  cloud: { icono: '☁️', color: '#4285F4', nombre: 'Cloud & APIs' },
  devops: { icono: '🔧', color: '#2496ED', nombre: 'DevOps & Tools' },
  seguridad: { icono: '🔒', color: '#FF6B6B', nombre: 'Seguridad' },
  uiux: { icono: '🎨', color: '#9C27B0', nombre: 'UI/UX' },
  testing: { icono: '🧪', color: '#FFA726', nombre: 'Testing' },
  arquitectura: { icono: '🏗️', color: '#607D8B', nombre: 'Arquitectura' },
  performance: { icono: '⚡', color: '#FFD700', nombre: 'Performance' },
  integracion: { icono: '🔗', color: '#00BCD4', nombre: 'Integración' },
  futuro: { icono: '🚀', color: '#E91E63', nombre: 'Tecnologías Futuras' }
};

// ============================================================================
// 💎 TECNOLOGÍAS POR CATEGORÍA
// ============================================================================

export const tecnologiasPorCategoria: Record<string, Tecnologia[]> = {
  frontend: [
    {
      nombre: 'React',
      version: '19.2.0',
      categoria: 'frontend',
      descripcion: 'Biblioteca JavaScript para construir interfaces de usuario',
      icono: '⚛️',
      estado: 'activa',
      url: 'https://react.dev'
    },
    {
      nombre: 'React Router DOM',
      version: '7.9.5',
      categoria: 'frontend',
      descripcion: 'Enrutamiento declarativo para aplicaciones React',
      icono: '🧭',
      estado: 'activa'
    },
    {
      nombre: 'TypeScript',
      version: '5.3.3',
      categoria: 'frontend',
      descripcion: 'Superset tipado de JavaScript que compila a JavaScript',
      icono: '📘',
      estado: 'activa',
      url: 'https://www.typescriptlang.org'
    },
    {
      nombre: 'Material-UI (MUI)',
      version: '7.3.5',
      categoria: 'frontend',
      descripcion: 'Framework de componentes React siguiendo Material Design',
      icono: '🎨',
      estado: 'activa',
      url: 'https://mui.com'
    },
    {
      nombre: 'Emotion',
      categoria: 'frontend',
      descripcion: 'Biblioteca CSS-in-JS de alto rendimiento',
      icono: '💅',
      estado: 'activa'
    },
    {
      nombre: 'Quill.js',
      version: '2.0.3',
      categoria: 'frontend',
      descripcion: 'Editor de texto enriquecido potente y personalizable',
      icono: '✍️',
      estado: 'activa'
    },
    {
      nombre: 'Recharts',
      version: '3.4.1',
      categoria: 'frontend',
      descripcion: 'Biblioteca de gráficos para React basada en D3.js',
      icono: '📊',
      estado: 'activa'
    },
    {
      nombre: 'Axios',
      version: '1.13.2',
      categoria: 'frontend',
      descripcion: 'Cliente HTTP basado en Promesas para navegador y Node.js',
      icono: '🌐',
      estado: 'activa'
    },
    {
      nombre: 'Lucide React',
      version: '0.562.0',
      categoria: 'frontend',
      descripcion: 'Biblioteca de iconos moderna y hermosa',
      icono: '✨',
      estado: 'activa'
    },
    {
      nombre: 'FontAwesome',
      categoria: 'frontend',
      descripcion: 'Conjunto de iconos vectoriales y herramientas',
      icono: '🎯',
      estado: 'activa'
    },
    {
      nombre: 'HugeIcons',
      categoria: 'frontend',
      descripcion: 'Colección masiva de iconos gratuitos',
      icono: '🎪',
      estado: 'activa'
    },
    {
      nombre: 'date-fns',
      version: '4.1.0',
      categoria: 'frontend',
      descripcion: 'Utilidades modernas de JavaScript para fechas',
      icono: '📅',
      estado: 'activa'
    },
    {
      nombre: 'XLSX',
      version: '0.18.5',
      categoria: 'frontend',
      descripcion: 'Parser y escritor de archivos Excel',
      icono: '📑',
      estado: 'activa'
    }
  ],

  backend: [
    {
      nombre: 'Node.js',
      categoria: 'backend',
      descripcion: 'Entorno de ejecución JavaScript del lado del servidor',
      icono: '🟢',
      estado: 'activa',
      url: 'https://nodejs.org'
    },
    {
      nombre: 'Express.js',
      version: '4.18.2',
      categoria: 'backend',
      descripcion: 'Framework web rápido, minimalista y flexible para Node.js',
      icono: '🚂',
      estado: 'activa',
      url: 'https://expressjs.com'
    },
    {
      nombre: 'TypeScript Backend',
      version: '5.3.3',
      categoria: 'backend',
      descripcion: 'TypeScript para desarrollo backend con tipado fuerte',
      icono: '📘',
      estado: 'activa'
    },
    {
      nombre: 'Sequelize ORM',
      version: '6.35.0',
      categoria: 'backend',
      descripcion: 'ORM basado en Promesas para Node.js',
      icono: '🗃️',
      estado: 'activa',
      url: 'https://sequelize.org'
    },
    {
      nombre: 'JWT',
      version: '9.0.2',
      categoria: 'backend',
      descripcion: 'JSON Web Tokens para autenticación y autorización',
      icono: '🎫',
      estado: 'activa'
    },
    {
      nombre: 'Bcrypt.js',
      version: '2.4.3',
      categoria: 'backend',
      descripcion: 'Biblioteca para hashing de contraseñas',
      icono: '🔐',
      estado: 'activa'
    },
    {
      nombre: 'Express Validator',
      version: '7.0.1',
      categoria: 'backend',
      descripcion: 'Middleware de validación para Express',
      icono: '✅',
      estado: 'activa'
    },
    {
      nombre: 'Express Rate Limiter',
      version: '8.2.1',
      categoria: 'backend',
      descripcion: 'Middleware de limitación de velocidad para Express',
      icono: '⏱️',
      estado: 'activa'
    },
    {
      nombre: 'Multer',
      version: '1.4.5',
      categoria: 'backend',
      descripcion: 'Middleware para manejo de multipart/form-data',
      icono: '📤',
      estado: 'activa'
    },
    {
      nombre: 'Nodemailer',
      version: '6.9.7',
      categoria: 'backend',
      descripcion: 'Módulo para enviar correos electrónicos desde Node.js',
      icono: '📧',
      estado: 'activa'
    }
  ],

  database: [
    {
      nombre: 'PostgreSQL',
      version: '8.11.3',
      categoria: 'database',
      descripcion: 'Sistema de gestión de bases de datos relacionales avanzado',
      icono: '🐘',
      estado: 'activa',
      url: 'https://www.postgresql.org'
    },
    {
      nombre: 'Sequelize Migrations',
      categoria: 'database',
      descripcion: 'Sistema de migraciones para control de versiones de esquema',
      icono: '🔄',
      estado: 'activa'
    },
    {
      nombre: 'Database Schema Design',
      categoria: 'database',
      descripcion: 'Diseño y modelado de esquemas de base de datos',
      icono: '📐',
      estado: 'activa'
    },
    {
      nombre: 'SQL Queries',
      categoria: 'database',
      descripcion: 'Consultas SQL optimizadas y estructuradas',
      icono: '🔍',
      estado: 'activa'
    },
    {
      nombre: 'Database Indexing',
      categoria: 'database',
      descripcion: 'Estrategias de indexación para optimización',
      icono: '📇',
      estado: 'activa'
    }
  ],

  cloud: [
    {
      nombre: 'Google APIs',
      version: '166.0.0',
      categoria: 'cloud',
      descripcion: 'Integración con servicios de Google',
      icono: '🔵',
      estado: 'activa',
      url: 'https://developers.google.com'
    },
    {
      nombre: 'Google OAuth 2.0',
      categoria: 'cloud',
      descripcion: 'Autenticación OAuth con Google',
      icono: '🔑',
      estado: 'activa'
    },
    {
      nombre: 'Google Calendar Integration',
      categoria: 'cloud',
      descripcion: 'Sincronización con Google Calendar',
      icono: '📅',
      estado: 'activa'
    },
    {
      nombre: 'RESTful APIs',
      categoria: 'cloud',
      descripcion: 'Arquitectura de API REST',
      icono: '🌐',
      estado: 'activa'
    },
    {
      nombre: 'GraphQL',
      categoria: 'cloud',
      descripcion: 'Lenguaje de consulta para APIs',
      icono: '🔷',
      estado: 'planificada',
      url: 'https://graphql.org'
    },
    {
      nombre: 'WebSockets',
      categoria: 'cloud',
      descripcion: 'Comunicación bidireccional en tiempo real',
      icono: '🔌',
      estado: 'planificada'
    },
    {
      nombre: 'Server-Sent Events',
      categoria: 'cloud',
      descripcion: 'Streaming de datos del servidor al cliente',
      icono: '📡',
      estado: 'planificada'
    }
  ],

  devops: [
    {
      nombre: 'Git & GitHub',
      categoria: 'devops',
      descripcion: 'Control de versiones distribuido',
      icono: '📦',
      estado: 'activa',
      url: 'https://github.com'
    },
    {
      nombre: 'npm',
      categoria: 'devops',
      descripcion: 'Gestor de paquetes de Node.js',
      icono: '📦',
      estado: 'activa'
    },
    {
      nombre: 'Concurrently',
      version: '8.2.2',
      categoria: 'devops',
      descripcion: 'Ejecutar múltiples comandos simultáneamente',
      icono: '⚡',
      estado: 'activa'
    },
    {
      nombre: 'ts-node-dev',
      version: '2.0.0',
      categoria: 'devops',
      descripcion: 'Desarrollo TypeScript con recarga automática',
      icono: '🔄',
      estado: 'activa'
    },
    {
      nombre: 'Docker',
      categoria: 'devops',
      descripcion: 'Plataforma de contenedores',
      icono: '🐳',
      estado: 'planificada',
      url: 'https://www.docker.com'
    },
    {
      nombre: 'Kubernetes',
      categoria: 'devops',
      descripcion: 'Orquestación de contenedores',
      icono: '☸️',
      estado: 'planificada',
      url: 'https://kubernetes.io'
    },
    {
      nombre: 'CI/CD Pipelines',
      categoria: 'devops',
      descripcion: 'Integración y despliegue continuo',
      icono: '🚀',
      estado: 'planificada'
    }
  ],

  seguridad: [
    {
      nombre: 'JWT Authentication',
      categoria: 'seguridad',
      descripcion: 'Autenticación basada en tokens JWT',
      icono: '🎫',
      estado: 'activa'
    },
    {
      nombre: 'Password Encryption',
      categoria: 'seguridad',
      descripcion: 'Encriptación de contraseñas con Bcrypt',
      icono: '🔐',
      estado: 'activa'
    },
    {
      nombre: 'Rate Limiting',
      categoria: 'seguridad',
      descripcion: 'Limitación de velocidad para prevenir abusos',
      icono: '⏱️',
      estado: 'activa'
    },
    {
      nombre: 'CORS Configuration',
      categoria: 'seguridad',
      descripcion: 'Configuración de políticas de origen cruzado',
      icono: '🛡️',
      estado: 'activa'
    },
    {
      nombre: 'Input Validation',
      categoria: 'seguridad',
      descripcion: 'Validación de entrada para prevenir inyecciones',
      icono: '✅',
      estado: 'activa'
    },
    {
      nombre: 'SQL Injection Prevention',
      categoria: 'seguridad',
      descripcion: 'Prevención de inyección SQL',
      icono: '🛡️',
      estado: 'activa'
    },
    {
      nombre: 'XSS Protection',
      categoria: 'seguridad',
      descripcion: 'Protección contra Cross-Site Scripting',
      icono: '🔒',
      estado: 'activa'
    },
    {
      nombre: 'CSRF Protection',
      categoria: 'seguridad',
      descripcion: 'Protección contra Cross-Site Request Forgery',
      icono: '🛡️',
      estado: 'activa'
    }
  ],

  uiux: [
    {
      nombre: 'Responsive Design',
      categoria: 'uiux',
      descripcion: 'Diseño adaptable a diferentes dispositivos',
      icono: '📱',
      estado: 'activa'
    },
    {
      nombre: 'Dark Mode Support',
      categoria: 'uiux',
      descripcion: 'Soporte para modo oscuro',
      icono: '🌙',
      estado: 'activa'
    },
    {
      nombre: 'Material Design',
      categoria: 'uiux',
      descripcion: 'Sistema de diseño de Google',
      icono: '🎨',
      estado: 'activa'
    },
    {
      nombre: 'Component-Based Architecture',
      categoria: 'uiux',
      descripcion: 'Arquitectura basada en componentes reutilizables',
      icono: '🧩',
      estado: 'activa'
    },
    {
      nombre: 'Custom Hooks',
      categoria: 'uiux',
      descripcion: 'Hooks personalizados de React',
      icono: '🪝',
      estado: 'activa'
    },
    {
      nombre: 'State Management',
      categoria: 'uiux',
      descripcion: 'Gestión de estado de la aplicación',
      icono: '🗂️',
      estado: 'activa'
    },
    {
      nombre: 'Form Handling',
      categoria: 'uiux',
      descripcion: 'Manejo avanzado de formularios',
      icono: '📝',
      estado: 'activa'
    },
    {
      nombre: 'Data Tables',
      categoria: 'uiux',
      descripcion: 'Tablas de datos interactivas y avanzadas',
      icono: '📊',
      estado: 'activa'
    },
    {
      nombre: 'Rich Text Editing',
      categoria: 'uiux',
      descripcion: 'Edición de texto enriquecido',
      icono: '✍️',
      estado: 'activa'
    },
    {
      nombre: 'File Upload/Download',
      categoria: 'uiux',
      descripcion: 'Carga y descarga de archivos',
      icono: '📎',
      estado: 'activa'
    },
    {
      nombre: 'Excel Export',
      categoria: 'uiux',
      descripcion: 'Exportación de datos a Excel',
      icono: '📑',
      estado: 'activa'
    }
  ],

  testing: [
    {
      nombre: 'Jest',
      categoria: 'testing',
      descripcion: 'Framework de testing de JavaScript',
      icono: '🧪',
      estado: 'activa',
      url: 'https://jestjs.io'
    },
    {
      nombre: 'React Testing Library',
      version: '16.3.0',
      categoria: 'testing',
      descripcion: 'Utilidades simples y completas para testing de React',
      icono: '🔬',
      estado: 'activa'
    },
    {
      nombre: 'Playwright',
      version: '1.56.1',
      categoria: 'testing',
      descripcion: 'Testing end-to-end para aplicaciones web',
      icono: '🎭',
      estado: 'activa',
      url: 'https://playwright.dev'
    },
    {
      nombre: 'Unit Testing',
      categoria: 'testing',
      descripcion: 'Pruebas unitarias de componentes',
      icono: '🔬',
      estado: 'activa'
    },
    {
      nombre: 'Integration Testing',
      categoria: 'testing',
      descripcion: 'Pruebas de integración',
      icono: '🔗',
      estado: 'activa'
    },
    {
      nombre: 'E2E Testing',
      categoria: 'testing',
      descripcion: 'Pruebas end-to-end',
      icono: '🎯',
      estado: 'activa'
    }
  ],

  arquitectura: [
    {
      nombre: 'MVC Architecture',
      categoria: 'arquitectura',
      descripcion: 'Patrón Modelo-Vista-Controlador',
      icono: '🏛️',
      estado: 'activa'
    },
    {
      nombre: 'REST API Design',
      categoria: 'arquitectura',
      descripcion: 'Diseño de API RESTful',
      icono: '🌐',
      estado: 'activa'
    },
    {
      nombre: 'Middleware Pattern',
      categoria: 'arquitectura',
      descripcion: 'Patrón de middleware para Express',
      icono: '🔀',
      estado: 'activa'
    },
    {
      nombre: 'Service Layer Pattern',
      categoria: 'arquitectura',
      descripcion: 'Capa de servicios para lógica de negocio',
      icono: '⚙️',
      estado: 'activa'
    },
    {
      nombre: 'Repository Pattern',
      categoria: 'arquitectura',
      descripcion: 'Patrón de repositorio para acceso a datos',
      icono: '📚',
      estado: 'activa'
    },
    {
      nombre: 'Dependency Injection',
      categoria: 'arquitectura',
      descripcion: 'Inyección de dependencias',
      icono: '💉',
      estado: 'activa'
    },
    {
      nombre: 'Separation of Concerns',
      categoria: 'arquitectura',
      descripcion: 'Separación de responsabilidades',
      icono: '📦',
      estado: 'activa'
    },
    {
      nombre: 'Microservices Architecture',
      categoria: 'arquitectura',
      descripcion: 'Arquitectura de microservicios',
      icono: '🔷',
      estado: 'planificada'
    }
  ],

  performance: [
    {
      nombre: 'Code Splitting',
      categoria: 'performance',
      descripcion: 'División de código para carga optimizada',
      icono: '✂️',
      estado: 'activa'
    },
    {
      nombre: 'Lazy Loading',
      categoria: 'performance',
      descripcion: 'Carga diferida de componentes',
      icono: '⏳',
      estado: 'activa'
    },
    {
      nombre: 'Memoization',
      categoria: 'performance',
      descripcion: 'Memorización para optimización',
      icono: '💾',
      estado: 'activa'
    },
    {
      nombre: 'Debouncing',
      categoria: 'performance',
      descripcion: 'Debounce para optimizar eventos',
      icono: '⏱️',
      estado: 'activa'
    },
    {
      nombre: 'Throttling',
      categoria: 'performance',
      descripcion: 'Throttle para limitar ejecuciones',
      icono: '🚦',
      estado: 'activa'
    },
    {
      nombre: 'Caching Strategies',
      categoria: 'performance',
      descripcion: 'Estrategias de caché',
      icono: '💾',
      estado: 'activa'
    },
    {
      nombre: 'Database Query Optimization',
      categoria: 'performance',
      descripcion: 'Optimización de consultas de base de datos',
      icono: '⚡',
      estado: 'activa'
    },
    {
      nombre: 'Bundle Optimization',
      categoria: 'performance',
      descripcion: 'Optimización de bundles de producción',
      icono: '📦',
      estado: 'activa'
    }
  ],

  integracion: [
    {
      nombre: 'OAuth 2.0',
      categoria: 'integracion',
      descripcion: 'Protocolo de autorización OAuth 2.0',
      icono: '🔑',
      estado: 'activa'
    },
    {
      nombre: 'OpenID Connect',
      categoria: 'integracion',
      descripcion: 'Capa de identidad sobre OAuth 2.0',
      icono: '🆔',
      estado: 'planificada'
    },
    {
      nombre: 'Third-party API Integration',
      categoria: 'integracion',
      descripcion: 'Integración con APIs de terceros',
      icono: '🔗',
      estado: 'activa'
    },
    {
      nombre: 'Webhook Support',
      categoria: 'integracion',
      descripcion: 'Soporte para webhooks',
      icono: '🪝',
      estado: 'planificada'
    },
    {
      nombre: 'API Gateway',
      categoria: 'integracion',
      descripcion: 'Puerta de enlace de API',
      icono: '🚪',
      estado: 'planificada'
    }
  ],

  futuro: [
    {
      nombre: 'WebAssembly (WASM)',
      categoria: 'futuro',
      descripcion: 'Código binario ejecutable en navegadores',
      icono: '⚡',
      estado: 'experimental',
      url: 'https://webassembly.org'
    },
    {
      nombre: 'Web Components',
      categoria: 'futuro',
      descripcion: 'Componentes web estándar',
      icono: '🧩',
      estado: 'experimental'
    },
    {
      nombre: 'Machine Learning Integration',
      categoria: 'futuro',
      descripcion: 'Integración de aprendizaje automático',
      icono: '🤖',
      estado: 'planificada'
    },
    {
      nombre: 'AI/ML APIs',
      categoria: 'futuro',
      descripcion: 'APIs de inteligencia artificial',
      icono: '🧠',
      estado: 'planificada'
    },
    {
      nombre: 'Blockchain Integration',
      categoria: 'futuro',
      descripcion: 'Integración con blockchain',
      icono: '⛓️',
      estado: 'experimental'
    },
    {
      nombre: 'Edge Computing',
      categoria: 'futuro',
      descripcion: 'Computación en el borde',
      icono: '🌐',
      estado: 'planificada'
    },
    {
      nombre: 'Quantum Computing',
      categoria: 'futuro',
      descripcion: 'Computación cuántica (futuro)',
      icono: '⚛️',
      estado: 'experimental'
    }
  ]
};

// ============================================================================
// 📊 FUNCIONES UTILITARIAS
// ============================================================================

/**
 * Obtiene todas las tecnologías en un arreglo plano
 */
export function obtenerTodasLasTecnologias(): Tecnologia[] {
  return Object.values(tecnologiasPorCategoria).flat();
}

/**
 * Obtiene tecnologías por categoría
 */
export function obtenerTecnologiasPorCategoria(categoria: string): Tecnologia[] {
  return tecnologiasPorCategoria[categoria] || [];
}

/**
 * Busca tecnologías por nombre
 */
export function buscarTecnologia(termino: string): Tecnologia[] {
  const todas = obtenerTodasLasTecnologias();
  const busqueda = termino.toLowerCase();
  return todas.filter(tech => 
    tech.nombre.toLowerCase().includes(busqueda) ||
    tech.descripcion?.toLowerCase().includes(busqueda) ||
    tech.categoria.toLowerCase().includes(busqueda)
  );
}

/**
 * Obtiene tecnologías por estado
 */
export function obtenerTecnologiasPorEstado(estado: Tecnologia['estado']): Tecnologia[] {
  return obtenerTodasLasTecnologias().filter(tech => tech.estado === estado);
}

/**
 * Obtiene estadísticas del stack tecnológico
 */
export function obtenerEstadisticas() {
  const todas = obtenerTodasLasTecnologias();
  const porEstado = todas.reduce((acc, tech) => {
    acc[tech.estado] = (acc[tech.estado] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const porCategoria = Object.keys(tecnologiasPorCategoria).reduce((acc, cat) => {
    acc[cat] = tecnologiasPorCategoria[cat].length;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: todas.length,
    porEstado,
    porCategoria,
    conVersion: todas.filter(t => t.version).length,
    conURL: todas.filter(t => t.url).length
  };
}

/**
 * Genera un resumen formateado del stack
 */
export function generarResumen(): string {
  const stats = obtenerEstadisticas();
  const categorias = Object.keys(tecnologiasPorCategoria);
  
  let resumen = `\n🚀 STACK TECNOLÓGICO CRM MONTERRICO\n`;
  resumen += `${'='.repeat(50)}\n\n`;
  resumen += `📊 Estadísticas:\n`;
  resumen += `   Total de tecnologías: ${stats.total}\n`;
  resumen += `   Activas: ${stats.porEstado['activa'] || 0}\n`;
  resumen += `   En desarrollo: ${stats.porEstado['en-desarrollo'] || 0}\n`;
  resumen += `   Planificadas: ${stats.porEstado['planificada'] || 0}\n`;
  resumen += `   Experimentales: ${stats.porEstado['experimental'] || 0}\n\n`;
  
  resumen += `📁 Categorías (${categorias.length}):\n`;
  categorias.forEach(cat => {
    const config = categoriasConfig[cat as keyof typeof categoriasConfig];
    const count = stats.porCategoria[cat] || 0;
    resumen += `   ${config.icono} ${config.nombre}: ${count} tecnologías\n`;
  });
  
  return resumen;
}

// ============================================================================
// 📦 EXPORTACIONES
// ============================================================================

// Arreglo plano de todas las tecnologías (compatibilidad con versión anterior)
export const tecnologias: string[] = obtenerTodasLasTecnologias().map(t => 
  t.version ? `${t.nombre} ${t.version}` : t.nombre
);

// Exportar por defecto
export default {
  tecnologias,
  tecnologiasPorCategoria,
  categoriasConfig,
  obtenerTodasLasTecnologias,
  obtenerTecnologiasPorCategoria,
  buscarTecnologia,
  obtenerTecnologiasPorEstado,
  obtenerEstadisticas,
  generarResumen
};

// ============================================================================
// 🎯 EJEMPLO DE USO
// ============================================================================

if (require.main === module) {
  console.log(generarResumen());
  console.log('\n✨ Tecnologías activas:');
  obtenerTecnologiasPorEstado('activa').slice(0, 10).forEach(tech => {
    console.log(`   ${tech.icono} ${tech.nombre}${tech.version ? ` v${tech.version}` : ''}`);
  });
}
