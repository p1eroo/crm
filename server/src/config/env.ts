import dotenv from 'dotenv';
import path from 'path';

// Determinar el entorno (development, production, test, etc.)
// Si NODE_ENV no está definido, solo se carga .env (sin archivos específicos)
const env = process.env.NODE_ENV || '';
const hasExplicitEnv = !!process.env.NODE_ENV;

// Cargar el archivo .env correspondiente al entorno
// dotenv carga archivos en este orden de prioridad:
// 1. .env.{NODE_ENV}.local (más específico, ignorado por git)
// 2. .env.local (ignorado por git)
// 3. .env.{NODE_ENV}
// 4. .env (base, valores por defecto)
const envFile = env ? `.env.${env}` : '';
const envLocalFile = env ? `.env.${env}.local` : '';
const baseEnvFile = `.env`;

// Cargar archivos en orden de prioridad (los últimos sobrescriben a los primeros)
// IMPORTANTE: El orden es crítico - primero se carga el base, luego el específico del entorno
// Esto asegura que .env.production sobrescriba .env

// 1. Primero cargar .env base (valores por defecto)
const baseResult = dotenv.config({ path: path.resolve(process.cwd(), baseEnvFile) });

// 2. Luego cargar .env.{NODE_ENV} si existe (esto sobrescribe .env)
// Solo cargar archivo específico del entorno si NODE_ENV está explícitamente definido
const envResult = hasExplicitEnv && envFile 
  ? dotenv.config({ path: path.resolve(process.cwd(), envFile), override: true })
  : { error: null };

// 3. Finalmente cargar .env.{NODE_ENV}.local si existe (esto sobrescribe todo)
const localResult = hasExplicitEnv && envLocalFile
  ? dotenv.config({ path: path.resolve(process.cwd(), envLocalFile), override: true })
  : { error: null };

// Exportar información del entorno
export const isDevelopment = env === 'development';
export const isProduction = env === 'production';
export const isTest = env === 'test';
export const currentEnv = env || 'base';

// Mostrar qué archivos se cargaron
const loadedFiles: string[] = [];
if (!baseResult.error) loadedFiles.push(baseEnvFile);
if (!envResult.error && hasExplicitEnv) loadedFiles.push(envFile);
if (!localResult.error && hasExplicitEnv) loadedFiles.push(envLocalFile);

console.log(`📦 Entorno: ${env || 'base (solo .env)'}`);
if (loadedFiles.length > 0) {
  console.log(`📄 Archivos .env cargados: ${loadedFiles.join(', ')}`);
}

