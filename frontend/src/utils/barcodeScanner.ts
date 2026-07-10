import {
  BrowserMultiFormatOneDReader,
  IScannerControls,
} from '@zxing/browser';
import {
  BarcodeFormat,
  ChecksumException,
  DecodeHintType,
  FormatException,
  NotFoundException,
  Result,
  ZXingStringBuilder,
} from '@zxing/library';

export type BarcodeScannerControls = IScannerControls;

export interface ScannedBarcode {
  text: string;
  format: BarcodeFormat;
}

const SUPPORTED_PRODUCT_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
];

const MAX_IMAGE_DIMENSION = 2200;
const IMAGE_ROTATIONS = [0, 90] as const;

// @zxing/library 0.21.3 has a bad appendChars loop condition that never
// advances for UPC-E conversion. Override that small utility until the
// upstream package ships the corrected loop.
ZXingStringBuilder.prototype.appendChars = function appendChars(
  characters: string[],
  offset: number,
  length: number,
): ZXingStringBuilder {
  const end = offset + length;
  for (let index = offset; index < end; index += 1) {
    this.append(characters[index]);
  }
  return this;
};

const createReader = () => {
  const hints = new Map<DecodeHintType, unknown>();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, SUPPORTED_PRODUCT_FORMATS);
  hints.set(DecodeHintType.TRY_HARDER, true);

  return new BrowserMultiFormatOneDReader(hints, {
    delayBetweenScanAttempts: 200,
    delayBetweenScanSuccess: 500,
    tryPlayVideoTimeout: 5000,
  });
};

const toScannedBarcode = (result: Result): ScannedBarcode => ({
  text: result.getText(),
  format: result.getBarcodeFormat(),
});

export const isSupportedBarcodeInput = (value: string): boolean =>
  /^(?:\d{8}|\d{12}|\d{13})$/.test(value.trim());

/**
 * UPC-E contains a number-system digit, six compressed payload digits, and a
 * check digit. FatSecret expects UPC-E values expanded to UPC-A before they
 * are padded to GTIN-13.
 */
export const expandUpceToUpca = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 8 || !['0', '1'].includes(digits[0])) {
    return digits;
  }

  const numberSystem = digits[0];
  const payload = digits.slice(1, 7);
  const checkDigit = digits[7];
  const lastPayloadDigit = payload[5];
  let upcaBody: string;

  if (['0', '1', '2'].includes(lastPayloadDigit)) {
    upcaBody = `${numberSystem}${payload.slice(0, 2)}${lastPayloadDigit}0000${payload.slice(2, 5)}`;
  } else if (lastPayloadDigit === '3') {
    upcaBody = `${numberSystem}${payload.slice(0, 3)}00000${payload.slice(3, 5)}`;
  } else if (lastPayloadDigit === '4') {
    upcaBody = `${numberSystem}${payload.slice(0, 4)}00000${payload[4]}`;
  } else {
    upcaBody = `${numberSystem}${payload.slice(0, 5)}0000${lastPayloadDigit}`;
  }

  return `${upcaBody}${checkDigit}`;
};

export const normalizeBarcodeInput = (
  value: string,
  format?: BarcodeFormat,
): string => {
  let digits = value.replace(/\D/g, '');

  if (format === BarcodeFormat.UPC_E) {
    digits = expandUpceToUpca(digits);
  }

  if (![8, 12, 13].includes(digits.length)) return digits;
  return digits.length === 13 ? digits : digits.padStart(13, '0');
};

export const getCameraErrorMessage = (error: unknown): string => {
  const errorName = error && typeof error === 'object' && 'name' in error
    ? String((error as { name?: unknown }).name)
    : '';

  if (errorName === 'NotAllowedError' || errorName === 'SecurityError') {
    return 'Camera access was denied. Allow camera permission for this site and try again.';
  }
  if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
    return 'No camera was found on this device.';
  }
  if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
    return 'The camera is already in use by another app. Close it there and try again.';
  }
  if (errorName === 'OverconstrainedError') {
    return 'This camera cannot use the requested scan settings. Try another camera or scan a photo.';
  }

  return 'Could not start the camera. Camera scanning requires a secure HTTPS connection and browser permission.';
};

const isExpectedDecodeMiss = (error: unknown): boolean =>
  error instanceof NotFoundException
  || error instanceof ChecksumException
  || error instanceof FormatException;

export const startBarcodeCamera = async (
  videoElement: HTMLVideoElement,
  onDetected: (barcode: ScannedBarcode, controls: IScannerControls) => void,
  onFatalError: (error: unknown) => void,
): Promise<IScannerControls> => {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new DOMException('Camera access is not supported in this browser.', 'NotSupportedError');
  }

  const reader = createReader();
  return reader.decodeFromConstraints(
    {
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    },
    videoElement,
    (result, error, controls) => {
      if (result) {
        onDetected(toScannedBarcode(result), controls);
      } else if (error && !isExpectedDecodeMiss(error)) {
        onFatalError(error);
      }
    },
  );
};

const loadImage = (file: File): Promise<{ image: HTMLImageElement; objectUrl: string }> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve({ image, objectUrl });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('That image format could not be opened. Try a JPEG or PNG photo.'));
    };
    image.src = objectUrl;
  });

const drawImageToCanvas = (
  image: HTMLImageElement,
  rotation: typeof IMAGE_ROTATIONS[number],
): HTMLCanvasElement => {
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const sourceWidth = Math.max(1, Math.round(image.naturalWidth * scale));
  const sourceHeight = Math.max(1, Math.round(image.naturalHeight * scale));
  const swapsDimensions = rotation === 90;
  const canvas = document.createElement('canvas');
  canvas.width = swapsDimensions ? sourceHeight : sourceWidth;
  canvas.height = swapsDimensions ? sourceWidth : sourceHeight;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('This browser could not prepare the barcode image.');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  if (rotation === 90) {
    context.translate(canvas.width, 0);
    context.rotate(Math.PI / 2);
  }

  context.drawImage(image, 0, 0, sourceWidth, sourceHeight);
  return canvas;
};

const invertCanvas = (canvas: HTMLCanvasElement): void => {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < imageData.data.length; index += 4) {
    imageData.data[index] = 255 - imageData.data[index];
    imageData.data[index + 1] = 255 - imageData.data[index + 1];
    imageData.data[index + 2] = 255 - imageData.data[index + 2];
  }
  context.putImageData(imageData, 0, 0);
};

export const scanBarcodeImage = async (file: File): Promise<ScannedBarcode> => {
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error('Choose an image file that contains a product barcode.');
  }

  const reader = createReader();
  const { image, objectUrl } = await loadImage(file);

  try {
    for (const rotation of IMAGE_ROTATIONS) {
      const canvas = drawImageToCanvas(image, rotation);

      try {
        return toScannedBarcode(reader.decodeFromCanvas(canvas));
      } catch (error) {
        if (!isExpectedDecodeMiss(error)) throw error;
      }

      invertCanvas(canvas);
      try {
        return toScannedBarcode(reader.decodeFromCanvas(canvas));
      } catch (error) {
        if (!isExpectedDecodeMiss(error)) throw error;
      }
    }
  } finally {
    image.src = '';
    URL.revokeObjectURL(objectUrl);
  }

  throw new Error('No product barcode was found. Use a close, well-lit photo with the full barcode in focus.');
};
