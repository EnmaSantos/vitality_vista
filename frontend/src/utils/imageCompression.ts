export interface CompressedFoodImage {
  base64: string;
  mimeType: string;
  originalBytes: number;
  compressedBytes: number;
  width: number;
  height: number;
}

const TARGET_JSON_BYTES = 950_000;
const MAX_DIMENSIONS = [512, 384, 256];
const QUALITY_STEPS = [0.82, 0.74, 0.66, 0.58, 0.55];
const OUTPUT_MIME_TYPE = 'image/jpeg';

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read compressed image.'));
    reader.readAsDataURL(blob);
  });
}

function getBase64FromDataUrl(dataUrl: string): string {
  return dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
}

function estimateFatSecretPayloadBytes(base64: string) {
  return JSON.stringify({
    image_b64: base64,
    include_food_data: true,
    region: 'US',
    language: 'en',
  }).length;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Image conversion failed.'));
      }
    }, OUTPUT_MIME_TYPE, quality);
  });
}

async function loadImageBitmap(file: File): Promise<ImageBitmap> {
  if ('createImageBitmap' in window) {
    return await createImageBitmap(file);
  }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Unable to load selected image.'));
    };
    img.src = url;
  });

  return await createImageBitmap(image);
}

export async function compressFoodImageForFatSecret(file: File): Promise<CompressedFoodImage> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPG, PNG, or WebP image.');
  }

  const bitmap = await loadImageBitmap(file);

  try {
    for (const maxDimension of MAX_DIMENSIONS) {
      const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Image conversion is not supported in this browser.');
      }

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);

      for (const quality of QUALITY_STEPS) {
        const blob = await canvasToBlob(canvas, quality);
        const dataUrl = await blobToDataUrl(blob);
        const base64 = getBase64FromDataUrl(dataUrl);

        if (estimateFatSecretPayloadBytes(base64) <= TARGET_JSON_BYTES) {
          return {
            base64,
            mimeType: OUTPUT_MIME_TYPE,
            originalBytes: file.size,
            compressedBytes: blob.size,
            width,
            height,
          };
        }
      }
    }
  } finally {
    bitmap.close?.();
  }

  throw new Error('Image could not be compressed below the FatSecret upload limit.');
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
