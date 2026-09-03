import { AigcMetadata } from './metadata';

// CRC32 Lookup Table
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c;
}

function calculateCrc32(data: Uint8Array): number {
  let crc = 0 ^ -1;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

/**
 * Injects a tEXt chunk into a PNG buffer right after IHDR.
 */
export function injectPngMetadata(pngBytes: Uint8Array, key: string, jsonStr: string): Uint8Array {
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(key);
  const textBytes = encoder.encode(jsonStr);

  // tEXt chunk data: key + 0x00 + text
  const chunkData = new Uint8Array(keyBytes.length + 1 + textBytes.length);
  chunkData.set(keyBytes, 0);
  chunkData[keyBytes.length] = 0;
  chunkData.set(textBytes, keyBytes.length + 1);

  // Chunk Type: "tEXt" = 0x74, 0x45, 0x58, 0x74
  const chunkType = new Uint8Array([0x74, 0x45, 0x58, 0x74]);

  // CRC input: chunkType + chunkData
  const crcInput = new Uint8Array(chunkType.length + chunkData.length);
  crcInput.set(chunkType, 0);
  crcInput.set(chunkData, chunkType.length);
  const crc = calculateCrc32(crcInput);

  // Build full chunk: [length: 4][type: 4][data: N][crc: 4]
  const fullChunk = new Uint8Array(4 + 4 + chunkData.length + 4);
  const dv = new DataView(fullChunk.buffer);
  dv.setUint32(0, chunkData.length, false);
  fullChunk.set(chunkType, 4);
  fullChunk.set(chunkData, 8);
  dv.setUint32(8 + chunkData.length, crc, false);

  // Insert chunk after IHDR (8 bytes signature + 4 length + 4 "IHDR" + 13 data + 4 crc = 33 bytes)
  const ihdrEndOffset = 33;
  const result = new Uint8Array(pngBytes.length + fullChunk.length);
  result.set(pngBytes.subarray(0, ihdrEndOffset), 0);
  result.set(fullChunk, ihdrEndOffset);
  result.set(pngBytes.subarray(ihdrEndOffset), ihdrEndOffset + fullChunk.length);

  return result;
}

/**
 * Extracts metadata from a PNG Uint8Array.
 */
export function extractPngMetadata(pngBytes: Uint8Array, targetKey = 'AIGC'): string | null {
  const decoder = new TextDecoder('utf-8');
  let offset = 8; // skip 8-byte PNG signature
  const dv = new DataView(pngBytes.buffer, pngBytes.byteOffset, pngBytes.byteLength);

  while (offset + 12 <= pngBytes.length) {
    const length = dv.getUint32(offset, false);
    const type = String.fromCharCode(
      pngBytes[offset + 4],
      pngBytes[offset + 5],
      pngBytes[offset + 6],
      pngBytes[offset + 7]
    );

    if (type === 'tEXt' || type === 'iTXt') {
      const chunkData = pngBytes.subarray(offset + 8, offset + 8 + length);
      let nullIdx = -1;
      for (let i = 0; i < chunkData.length; i++) {
        if (chunkData[i] === 0) {
          nullIdx = i;
          break;
        }
      }

      if (nullIdx !== -1) {
        const key = decoder.decode(chunkData.subarray(0, nullIdx));
        if (key === targetKey || key.includes(targetKey)) {
          if (type === 'tEXt') {
            return decoder.decode(chunkData.subarray(nullIdx + 1));
          } else {
            // iTXt: skip compression flags (2 bytes) and language tags (null-terminated strings)
            let textOffset = nullIdx + 3; // skip null + comp flag + comp method
            while (textOffset < chunkData.length && chunkData[textOffset] !== 0) textOffset++;
            textOffset++; // skip lang tag null
            while (textOffset < chunkData.length && chunkData[textOffset] !== 0) textOffset++;
            textOffset++; // skip translated key null
            return decoder.decode(chunkData.subarray(textOffset));
          }
        }
      }
    }

    offset += 12 + length;
  }

  return null;
}

/**
 * Injects XMP metadata into a JPEG Uint8Array.
 */
export function injectJpegMetadata(jpegBytes: Uint8Array, jsonStr: string): Uint8Array {
  if (jpegBytes[0] !== 0xff || jpegBytes[1] !== 0xd8) {
    return jpegBytes; // Not a valid JPEG
  }

  const xmpHeader = 'http://ns.adobe.com/xap/1.0/\0';
  const xmpPayload = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:aigc="http://burncloud.com/aigc/" aigc:AIGC="${jsonStr.replace(/"/g, '&quot;')}"/></rdf:RDF></x:xmpmeta><?xpacket end="w"?>`;

  const encoder = new TextEncoder();
  const headerBytes = encoder.encode(xmpHeader);
  const payloadBytes = encoder.encode(xmpPayload);

  const totalPayloadLength = headerBytes.length + payloadBytes.length;
  const segmentLength = totalPayloadLength + 2;

  const segmentHeader = new Uint8Array([
    0xff,
    0xe1,
    (segmentLength >> 8) & 0xff,
    segmentLength & 0xff,
  ]);

  const fullSegment = new Uint8Array(4 + totalPayloadLength);
  fullSegment.set(segmentHeader, 0);
  fullSegment.set(headerBytes, 4);
  fullSegment.set(payloadBytes, 4 + headerBytes.length);

  const result = new Uint8Array(jpegBytes.length + fullSegment.length);
  result.set(jpegBytes.subarray(0, 2), 0);
  result.set(fullSegment, 2);
  result.set(jpegBytes.subarray(2), 2 + fullSegment.length);

  return result;
}

export function extractJpegMetadata(jpegBytes: Uint8Array): string | null {
  const decoder = new TextDecoder('utf-8');
  let offset = 2;

  while (offset < jpegBytes.length - 4) {
    if (jpegBytes[offset] !== 0xff) break;
    const marker = jpegBytes[offset + 1];
    if (marker === 0xd9 || marker === 0xda) break; // EOI or SOS

    const length = (jpegBytes[offset + 2] << 8) | jpegBytes[offset + 3];
    const segmentData = jpegBytes.subarray(offset + 4, offset + 2 + length);
    const text = decoder.decode(segmentData);

    if (text.includes('aigc:AIGC=')) {
      const match = text.match(/aigc:AIGC="([^"]+)"/);
      if (match) {
        return match[1].replace(/&quot;/g, '"');
      }
    }

    if (text.includes('"AIGC":{')) {
      const startIdx = text.indexOf('{"AIGC":{');
      if (startIdx !== -1) {
        let depth = 0;
        let endIdx = -1;
        for (let i = startIdx; i < text.length; i++) {
          if (text[i] === '{') depth++;
          else if (text[i] === '}') {
            depth--;
            if (depth === 0) {
              endIdx = i + 1;
              break;
            }
          }
        }
        if (endIdx !== -1) {
          return text.substring(startIdx, endIdx);
        }
      }
    }

    offset += 2 + length;
  }

  return null;
}

export interface ProcessedImage {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  metadata: AigcMetadata;
  model: string;
  provider: string;
  timestamp: string;
}

/**
 * Truly draws the explicit "AI生成" watermark onto an HTML Canvas
 * and embeds the implicit AIGC metadata into the image bytes.
 */
export async function processImage(
  rawBlob: Blob,
  metadata: AigcMetadata,
  model: string,
  provider = 'Pollinations'
): Promise<ProcessedImage> {
  const timestamp = new Date().toISOString();

  // 1. Load image into an HTMLImageElement
  const imgUrl = URL.createObjectURL(rawBlob);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = (e) => reject(new Error('Failed to load raw image for processing'));
    el.src = imgUrl;
  });

  const width = img.naturalWidth || img.width || 1024;
  const height = img.naturalHeight || img.height || 1024;

  // 2. Setup Canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not supported');

  // Draw base image
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(imgUrl);

  // 3. Draw explicit watermark:
  // Rule: fontSize >= min(width, height) * 0.05
  const minDim = Math.min(width, height);
  const fontSize = Math.max(16, Math.round(minDim * 0.05));
  const padX = Math.round(fontSize * 0.5);
  const padY = Math.round(fontSize * 0.28);
  const margin = Math.round(fontSize * 0.4);

  ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textBaseline = 'middle';
  const text = 'AI生成';
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;

  const boxWidth = textWidth + padX * 2;
  const boxHeight = fontSize + padY * 2;
  const boxX = width - boxWidth - margin;
  const boxY = height - boxHeight - margin;

  // Semi-transparent dark background
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  const radius = Math.max(4, Math.round(fontSize * 0.18));
  ctx.beginPath();
  ctx.moveTo(boxX + radius, boxY);
  ctx.lineTo(boxX + boxWidth - radius, boxY);
  ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius);
  ctx.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
  ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight);
  ctx.lineTo(boxX + radius, boxY + boxHeight);
  ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
  ctx.lineTo(boxX, boxY + radius);
  ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
  ctx.closePath();
  ctx.fill();

  // Crisp white text
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, boxX + padX, boxY + boxHeight / 2);
  ctx.restore();

  // 4. Export to PNG Blob (lossless and ideal for iTXt/tEXt metadata)
  const renderedBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/png');
  });

  // 5. Inject AIGC metadata into the PNG bytes
  const arrayBuffer = await renderedBlob.arrayBuffer();
  const rawBytes = new Uint8Array(arrayBuffer);
  const jsonStr = JSON.stringify(metadata);
  const finalBytes = injectPngMetadata(rawBytes, 'AIGC', jsonStr);

  const finalBlob = new Blob([finalBytes], { type: 'image/png' });
  const dataUrl = URL.createObjectURL(finalBlob);

  return {
    blob: finalBlob,
    dataUrl,
    width,
    height,
    metadata,
    model,
    provider,
    timestamp,
  };
}

export function downloadImageFile(blob: Blob, produceId: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${produceId}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
