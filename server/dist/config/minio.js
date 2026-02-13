"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMinioClient = getMinioClient;
exports.getMinioBucket = getMinioBucket;
exports.getPresignedGetUrl = getPresignedGetUrl;
exports.putObject = putObject;
const Minio = __importStar(require("minio"));
const endpoint = process.env.MINIO_ENDPOINT || 'minio.3w.pe';
const port = parseInt(process.env.MINIO_PORT || '443', 10);
const useSSL = process.env.MINIO_USE_SSL !== 'false';
const accessKey = process.env.MINIO_ACCESS_KEY || '';
const secretKey = process.env.MINIO_SECRET_KEY || '';
const bucket = process.env.MINIO_BUCKET || 'crm';
let client = null;
function getMinioClient() {
    if (!accessKey || !secretKey)
        return null;
    if (!client) {
        client = new Minio.Client({
            endPoint: endpoint,
            port,
            useSSL,
            accessKey,
            secretKey,
        });
    }
    return client;
}
function getMinioBucket() {
    return bucket;
}
/** Genera una URL presigned para leer un objeto (válida 1 hora). */
async function getPresignedGetUrl(objectKey) {
    const mc = getMinioClient();
    if (!mc)
        return null;
    try {
        const url = await mc.presignedGetObject(bucket, objectKey, 60 * 60); // 1 hora
        return url;
    }
    catch {
        return null;
    }
}
/** Sube un buffer a Minio y devuelve la key. */
async function putObject(objectKey, buffer, contentType) {
    const mc = getMinioClient();
    if (!mc)
        throw new Error('Minio no configurado (MINIO_ACCESS_KEY/MINIO_SECRET_KEY)');
    await mc.putObject(bucket, objectKey, buffer, buffer.length, { 'Content-Type': contentType });
}
