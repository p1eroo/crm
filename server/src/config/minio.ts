import * as Minio from 'minio';

const endpoint = process.env.MINIO_ENDPOINT || 'minio.3w.pe';
const port = parseInt(process.env.MINIO_PORT || '443', 10);
const useSSL = process.env.MINIO_USE_SSL !== 'false';
const accessKey = process.env.MINIO_ACCESS_KEY || '';
const secretKey = process.env.MINIO_SECRET_KEY || '';
const bucket = process.env.MINIO_BUCKET || 'crm';

let client: Minio.Client | null = null;

export function getMinioClient(): Minio.Client | null {
  if (!accessKey || !secretKey) return null;
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

export function getMinioBucket(): string {
  return bucket;
}

/** Genera una URL presigned para leer un objeto (válida 1 hora). */
export async function getPresignedGetUrl(objectKey: string): Promise<string | null> {
  const mc = getMinioClient();
  if (!mc) return null;
  try {
    const url = await mc.presignedGetObject(bucket, objectKey, 60 * 60); // 1 hora
    return url;
  } catch {
    return null;
  }
}

/** Sube un buffer a Minio y devuelve la key. */
export async function putObject(
  objectKey: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const mc = getMinioClient();
  if (!mc) throw new Error('Minio no configurado (MINIO_ACCESS_KEY/MINIO_SECRET_KEY)');
  await mc.putObject(bucket, objectKey, buffer, buffer.length, { 'Content-Type': contentType });
}
