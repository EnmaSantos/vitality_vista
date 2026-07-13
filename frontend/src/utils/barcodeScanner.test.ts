import { describe, expect, it } from 'vitest';
import { BarcodeFormat } from '@zxing/library';
import {
  getCameraErrorMessage,
  isSupportedBarcodeInput,
  normalizeBarcodeInput,
} from './barcodeScanner';

describe('barcodeScanner helpers', () => {
  it('accepts only supported product barcode lengths', () => {
    expect(isSupportedBarcodeInput('12345670')).toBe(true);
    expect(isSupportedBarcodeInput('036000291452')).toBe(true);
    expect(isSupportedBarcodeInput('4006381333931')).toBe(true);
    expect(isSupportedBarcodeInput('123456789')).toBe(false);
  });

  it('normalizes UPC-A and EAN-8 values to GTIN-13', () => {
    expect(normalizeBarcodeInput('036000291452')).toBe('0036000291452');
    expect(normalizeBarcodeInput('12345670')).toBe('0000012345670');
  });

  it('expands a detected UPC-E value before GTIN-13 normalization', () => {
    expect(normalizeBarcodeInput('04252614', BarcodeFormat.UPC_E)).toBe('0042100005264');
  });

  it('gives a useful fallback when live camera scanning is unsupported', () => {
    expect(getCameraErrorMessage(new DOMException('', 'NotSupportedError')))
      .toBe('Camera scanning is not supported in this browser. Upload a barcode photo instead.');
  });
});
