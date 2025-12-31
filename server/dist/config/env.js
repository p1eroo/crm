"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.currentEnv = exports.isTest = exports.isProduction = exports.isDevelopment = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
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
const baseResult = dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), baseEnvFile) });
// 2. Luego cargar .env.{NODE_ENV} si existe (esto sobrescribe .env)
// Solo cargar archivo específico del entorno si NODE_ENV está explícitamente definido
const envResult = hasExplicitEnv && envFile
    ? dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), envFile), override: true })
    : { error: null };
// 3. Finalmente cargar .env.{NODE_ENV}.local si existe (esto sobrescribe todo)
const localResult = hasExplicitEnv && envLocalFile
    ? dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), envLocalFile), override: true })
    : { error: null };
// Exportar información del entorno
exports.isDevelopment = env === 'development';
exports.isProduction = env === 'production';
exports.isTest = env === 'test';
exports.currentEnv = env || 'base';
// Mostrar qué archivos se cargaron
const loadedFiles = [];
if (!baseResult.error)
    loadedFiles.push(baseEnvFile);
if (!envResult.error && hasExplicitEnv)
    loadedFiles.push(envFile);
if (!localResult.error && hasExplicitEnv)
    loadedFiles.push(envLocalFile);
console.log(`📦 Entorno: ${env || 'base (solo .env)'}`);
if (loadedFiles.length > 0) {
    console.log(`📄 Archivos .env cargados: ${loadedFiles.join(', ')}`);
}
