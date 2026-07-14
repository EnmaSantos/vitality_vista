import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startBarcodeCamera } from './barcodeScanner';

const scannerMocks = vi.hoisted(() => ({
  decodeFromVideoElement: vi.fn(),
  stop: vi.fn(),
}));

vi.mock('@zxing/browser', () => ({
  BrowserMultiFormatOneDReader: class BrowserMultiFormatOneDReader {
    decodeFromVideoElement = scannerMocks.decodeFromVideoElement;
  },
}));

const createVideoElement = (hasFrame: boolean): HTMLVideoElement => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  setAttribute: vi.fn(),
  removeAttribute: vi.fn(),
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  load: vi.fn(),
  autoplay: false,
  muted: false,
  playsInline: false,
  ended: false,
  paused: !hasFrame,
  readyState: hasFrame ? 2 : 0,
  videoWidth: hasFrame ? 1280 : 0,
  videoHeight: hasFrame ? 720 : 0,
  srcObject: null,
} as unknown as HTMLVideoElement);

describe('live barcode camera', () => {
  const trackStop = vi.fn();
  const stream = {
    getTracks: () => [{ stop: trackStop }],
  } as unknown as MediaStream;

  beforeEach(() => {
    scannerMocks.decodeFromVideoElement.mockResolvedValue({ stop: scannerMocks.stop });
    vi.stubGlobal('HTMLMediaElement', { HAVE_CURRENT_DATA: 2 });
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(stream),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('starts scanning only after a real camera frame is available', async () => {
    const videoElement = createVideoElement(true);

    const controls = await startBarcodeCamera(
      videoElement,
      vi.fn(),
      vi.fn(),
    );

    expect(videoElement.srcObject).toBe(stream);
    expect(scannerMocks.decodeFromVideoElement).toHaveBeenCalledWith(
      videoElement,
      expect.any(Function),
    );

    controls.stop();

    expect(scannerMocks.stop).toHaveBeenCalledOnce();
    expect(trackStop).toHaveBeenCalledOnce();
    expect(videoElement.srcObject).toBeNull();
  });

  it('fails visibly and releases the camera when no preview frame arrives', async () => {
    vi.useFakeTimers();
    const videoElement = createVideoElement(false);
    const startPromise = startBarcodeCamera(
      videoElement,
      vi.fn(),
      vi.fn(),
    );
    const rejection = expect(startPromise).rejects.toMatchObject({
      name: 'CameraPreviewError',
    });

    await vi.advanceTimersByTimeAsync(8000);

    await rejection;
    expect(scannerMocks.decodeFromVideoElement).not.toHaveBeenCalled();
    expect(trackStop).toHaveBeenCalledOnce();
    expect(videoElement.srcObject).toBeNull();
  });

  it('cancels camera startup and releases the stream when the dialog closes', async () => {
    const videoElement = createVideoElement(false);
    const abortController = new AbortController();
    const startPromise = startBarcodeCamera(
      videoElement,
      vi.fn(),
      vi.fn(),
      abortController.signal,
    );
    const rejection = expect(startPromise).rejects.toMatchObject({
      name: 'AbortError',
    });

    await Promise.resolve();
    abortController.abort();

    await rejection;
    expect(scannerMocks.decodeFromVideoElement).not.toHaveBeenCalled();
    expect(trackStop).toHaveBeenCalledOnce();
    expect(videoElement.srcObject).toBeNull();
  });
});
