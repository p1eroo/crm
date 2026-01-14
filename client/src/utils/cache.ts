// Sistema de caché híbrido (memoria + sessionStorage) para evitar peticiones duplicadas

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const STORAGE_PREFIX = 'crm_cache_';
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB máximo en sessionStorage

class HybridCache {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutos por defecto
  private useStorage: boolean;

  constructor() {
    // Verificar si sessionStorage está disponible
    this.useStorage = typeof window !== 'undefined' && typeof Storage !== 'undefined';
    
    // Limpiar entradas expiradas del sessionStorage al iniciar
    if (this.useStorage) {
      this.cleanExpiredStorage();
    }
  }

  /**
   * Obtiene un valor del caché (primero memoria, luego sessionStorage)
   */
  get<T>(key: string): T | null {
    // 1. Intentar desde memoria (más rápido)
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry) {
      if (Date.now() > memoryEntry.expiresAt) {
        this.memoryCache.delete(key);
      } else {
        return memoryEntry.data as T;
      }
    }

    // 2. Intentar desde sessionStorage si está disponible
    if (this.useStorage) {
      try {
        const storageKey = STORAGE_PREFIX + key;
        const stored = sessionStorage.getItem(storageKey);
        
        if (stored) {
          const entry: CacheEntry<T> = JSON.parse(stored);
          
          // Verificar si ha expirado
          if (Date.now() > entry.expiresAt) {
            sessionStorage.removeItem(storageKey);
            return null;
          }
          
          // Cargar también en memoria para acceso rápido
          this.memoryCache.set(key, entry);
          return entry.data;
        }
      } catch (error) {
        console.warn('Error reading from sessionStorage:', error);
      }
    }

    return null;
  }

  /**
   * Guarda un valor en el caché (memoria + sessionStorage)
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt,
    };

    // Guardar en memoria (siempre)
    this.memoryCache.set(key, entry);

    // Guardar en sessionStorage si está disponible y los datos no son muy grandes
    if (this.useStorage) {
      try {
        const storageKey = STORAGE_PREFIX + key;
        const serialized = JSON.stringify(entry);
        
        // Solo guardar si no excede el límite de tamaño
        if (serialized.length < MAX_STORAGE_SIZE) {
          sessionStorage.setItem(storageKey, serialized);
        }
      } catch (error: any) {
        // Si sessionStorage está lleno, intentar limpiar entradas expiradas
        if (error.name === 'QuotaExceededError') {
          this.cleanExpiredStorage();
          try {
            const storageKey = STORAGE_PREFIX + key;
            const serialized = JSON.stringify(entry);
            if (serialized.length < MAX_STORAGE_SIZE) {
              sessionStorage.setItem(storageKey, serialized);
            }
          } catch (retryError) {
            console.warn('Could not store in sessionStorage after cleanup:', retryError);
          }
        } else {
          console.warn('Error writing to sessionStorage:', error);
        }
      }
    }
  }

  /**
   * Elimina una entrada específica del caché
   */
  delete(key: string): void {
    this.memoryCache.delete(key);
    
    if (this.useStorage) {
      try {
        sessionStorage.removeItem(STORAGE_PREFIX + key);
      } catch (error) {
        console.warn('Error deleting from sessionStorage:', error);
      }
    }
  }

  /**
   * Limpia todas las entradas expiradas del caché
   */
  cleanExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    // Limpiar memoria
    this.memoryCache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.memoryCache.delete(key);
    });

    // Limpiar sessionStorage
    this.cleanExpiredStorage();
  }

  /**
   * Limpia entradas expiradas del sessionStorage
   */
  private cleanExpiredStorage(): void {
    if (!this.useStorage) return;

    try {
      const now = Date.now();
      const keysToDelete: string[] = [];

      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          try {
            const stored = sessionStorage.getItem(key);
            if (stored) {
              const entry: CacheEntry<any> = JSON.parse(stored);
              if (now > entry.expiresAt) {
                keysToDelete.push(key);
              }
            }
          } catch (error) {
            // Si hay error al parsear, eliminar la entrada corrupta
            keysToDelete.push(key);
          }
        }
      }

      keysToDelete.forEach(key => {
        sessionStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Error cleaning expired storage:', error);
    }
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    this.memoryCache.clear();
    
    if (this.useStorage) {
      try {
        const keysToDelete: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith(STORAGE_PREFIX)) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach(key => {
          sessionStorage.removeItem(key);
        });
      } catch (error) {
        console.warn('Error clearing sessionStorage:', error);
      }
    }
  }

  /**
   * Obtiene el tamaño actual del caché
   */
  size(): number {
    return this.memoryCache.size;
  }
}

// Instancia singleton del caché híbrido
export const cache = new HybridCache();

// Limpiar entradas expiradas cada minuto
if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.cleanExpired();
  }, 60 * 1000);
}

// Generar clave de caché basada en la URL y parámetros
export const getCacheKey = (url: string, params?: any): string => {
  const paramsStr = params ? JSON.stringify(params) : '';
  return `${url}${paramsStr}`;
};
