import { deflateSync } from 'zlib';

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export const PNG_SIGNATURE: number[] = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const crcTable: number[] = Array.from({ length: 256 }, (_, n) => {
  let c: number = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

function crc32(buffer: Buffer): number {
  let crc: number = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const length: Buffer = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData: Buffer = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc: Buffer = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

/** Encodes an opaque RGB PNG of the given size; `pixelAt` decides the color of every pixel (zlib only, no deps) */
export function createPng(width: number, height: number, pixelAt: (w: number, h: number) => Rgb): Buffer {
  const stride: number = 1 + width * 4;
  const raw: Buffer = Buffer.alloc(height * stride);
  for (let h = 0; h < height; h++) {
    raw[h * stride] = 0; // filter: none
    for (let w = 0; w < width; w++) {
      const { r, g, b }: Rgb = pixelAt(w, h);
      raw.set([r, g, b, 255], h * stride + 1 + w * 4);
    }
  }
  const header: Buffer = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 6, 0, 0, 0], 8); // 8 bit, RGBA, deflate, no filter, no interlace
  return Buffer.concat([
    Buffer.from(PNG_SIGNATURE),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

export function createSolidPng(width: number, height: number, color: Rgb): Buffer {
  return createPng(width, height, () => color);
}

/** Reads width and height from a PNG's IHDR chunk and checks the signature */
export function readPngSize(bytes: Buffer | Uint8Array): { width: number; height: number } {
  const buffer: Buffer = Buffer.from(bytes);
  if (!PNG_SIGNATURE.every((byte, index) => buffer[index] === byte)) {
    throw new Error('Not a PNG file');
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}
