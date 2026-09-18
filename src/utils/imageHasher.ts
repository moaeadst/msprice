/**
 * Perceptual Image Hasher & Visual Similarity Matcher
 * Implements perceptual grayscale luminance hashing + quadrant color profiling,
 * based on the Android ImageHasher architecture.
 */

const SAMPLE_SIZE = 16; // 16x16 = 256 bits luminance grid

export class ImageHasher {
  /**
   * Generates a perceptual visual hash from an HTMLImageElement, HTMLCanvasElement, or HTMLVideoElement
   */
  static generateFromCanvas(source: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): string {
    const canvas = document.createElement('canvas');
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return '';

    ctx.drawImage(source, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const imgData = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const data = imgData.data;

    // 1. Grayscale luminance calculation
    const grays: number[] = [];
    let sumGray = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // ITU-R BT.601 formula
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      grays.push(gray);
      sumGray += gray;
    }

    const avgGray = sumGray / grays.length;
    // Luminance bit string (256 bits)
    let lumBits = '';
    for (let i = 0; i < grays.length; i++) {
      lumBits += grays[i] >= avgGray ? '1' : '0';
    }

    // 2. Quadrant color profiling (4 quadrants: TL, TR, BL, BR)
    const half = SAMPLE_SIZE / 2;
    const quadrants = [
      { sx: 0, sy: 0 },
      { sx: half, sy: 0 },
      { sx: 0, sy: half },
      { sx: half, sy: half },
    ];

    let colorSignature = '';
    for (const q of quadrants) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let y = q.sy; y < q.sy + half; y++) {
        for (let x = q.sx; x < q.sx + half; x++) {
          const idx = (y * SAMPLE_SIZE + x) * 4;
          rSum += data[idx];
          gSum += data[idx + 1];
          bSum += data[idx + 2];
          count++;
        }
      }
      const rAvg = Math.floor((rSum / count) / 16).toString(16);
      const gAvg = Math.floor((gSum / count) / 16).toString(16);
      const bAvg = Math.floor((bSum / count) / 16).toString(16);
      colorSignature += `${rAvg}${gAvg}${bAvg}`;
    }

    return `${lumBits}_${colorSignature}`;
  }

  /**
   * Generates a hash from an image URL, base64 data string, or Blob
   */
  static async generateFromUrl(src: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const hash = this.generateFromCanvas(img);
          resolve(hash);
        } catch {
          resolve('');
        }
      };
      img.onerror = () => resolve('');
      img.src = src;
    });
  }

  /**
   * Calculates similarity percentage (0 - 100%) between two visual hashes
   */
  static similarity(h1: string, h2: string): number {
    if (!h1 || !h2) return 0;
    if (h1 === h2) return 100;

    const [bits1, col1] = h1.split('_');
    const [bits2, col2] = h2.split('_');

    if (!bits1 || !bits2) return 0;

    // Bit comparison (luminance structural similarity)
    const minBitsLen = Math.min(bits1.length, bits2.length);
    let matchedBits = 0;
    for (let i = 0; i < minBitsLen; i++) {
      if (bits1[i] === bits2[i]) matchedBits++;
    }
    const bitScore = (matchedBits / minBitsLen) * 100;

    // Color comparison
    let colorScore = 0;
    if (col1 && col2) {
      const minColLen = Math.min(col1.length, col2.length);
      let diff = 0;
      for (let i = 0; i < minColLen; i++) {
        const v1 = parseInt(col1[i], 16) || 0;
        const v2 = parseInt(col2[i], 16) || 0;
        diff += Math.abs(v1 - v2);
      }
      // Maximum possible difference per hex digit is 15
      const maxDiff = minColLen * 15;
      colorScore = Math.max(0, 100 - (diff / maxDiff) * 100);
    } else {
      colorScore = bitScore;
    }

    // Weighted score: 65% luminance structure + 35% color distribution
    const combinedScore = Math.round(bitScore * 0.65 + colorScore * 0.35);
    return Math.min(100, Math.max(0, combinedScore));
  }

  /**
   * Checks if two hashes are similar beyond threshold (default 75%)
   */
  static isSimilar(h1: string, h2: string, threshold = 75): boolean {
    return this.similarity(h1, h2) >= threshold;
  }
}
