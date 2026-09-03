import { AigcMetadata } from './metadata';

export const AUDIO_EXPLICIT_PREFIX = '本音频由AI生成。';

function encodeSynchsafe(size: number): Uint8Array {
  const res = new Uint8Array(4);
  res[0] = (size >> 21) & 0x7f;
  res[1] = (size >> 14) & 0x7f;
  res[2] = (size >> 7) & 0x7f;
  res[3] = size & 0x7f;
  return res;
}

function decodeSynchsafe(buf: Uint8Array, offset: number): number {
  return (
    ((buf[offset] & 0x7f) << 21) |
    ((buf[offset + 1] & 0x7f) << 14) |
    ((buf[offset + 2] & 0x7f) << 7) |
    (buf[offset + 3] & 0x7f)
  );
}

/**
 * Injects an ID3v2.3 TXXX frame with key and JSON string into an MP3 buffer.
 */
export function injectId3Txxx(mp3Bytes: Uint8Array, key: string, jsonStr: string): Uint8Array {
  const encoder = new TextEncoder();
  const descBytes = encoder.encode(key);
  const valueBytes = encoder.encode(jsonStr);

  // Frame data: [encoding: 1 byte (0x03=utf8)] + [description] + [0x00] + [value]
  const frameData = new Uint8Array(1 + descBytes.length + 1 + valueBytes.length);
  frameData[0] = 3; // UTF-8
  frameData.set(descBytes, 1);
  frameData[1 + descBytes.length] = 0; // null separator
  frameData.set(valueBytes, 1 + descBytes.length + 1);

  // Frame Header: [ID: 4 bytes] + [Size: 4 bytes] + [Flags: 2 bytes]
  const frameHeader = new Uint8Array(10);
  const frameId = encoder.encode('TXXX');
  frameHeader.set(frameId, 0);

  const dv = new DataView(frameHeader.buffer);
  dv.setUint32(4, frameData.length, false);
  dv.setUint16(8, 0, false);

  const fullFrame = new Uint8Array(10 + frameData.length);
  fullFrame.set(frameHeader, 0);
  fullFrame.set(frameData, 10);

  // Tag Header: [ID3: 3 bytes] + [version: 2 bytes] + [flags: 1 byte] + [size: 4 synchsafe bytes]
  const tagHeader = new Uint8Array(10);
  tagHeader.set(encoder.encode('ID3'), 0);
  tagHeader[3] = 3; // v2.3
  tagHeader[4] = 0;
  tagHeader[5] = 0;
  tagHeader.set(encodeSynchsafe(fullFrame.length), 6);

  // Check if original MP3 already starts with an ID3 tag
  let startOffset = 0;
  if (
    mp3Bytes.length > 10 &&
    mp3Bytes[0] === 0x49 &&
    mp3Bytes[1] === 0x44 &&
    mp3Bytes[2] === 0x33
  ) {
    const existingSize = decodeSynchsafe(mp3Bytes, 6);
    startOffset = 10 + existingSize;
  }

  const rawAudioSlice = mp3Bytes.subarray(startOffset);
  const result = new Uint8Array(tagHeader.length + fullFrame.length + rawAudioSlice.length);
  result.set(tagHeader, 0);
  result.set(fullFrame, tagHeader.length);
  result.set(rawAudioSlice, tagHeader.length + fullFrame.length);

  return result;
}

/**
 * Extracts ID3v2 TXXX frame from MP3 bytes.
 */
export function extractId3Txxx(mp3Bytes: Uint8Array, targetKey = 'AIGC'): string | null {
  const decoder = new TextDecoder('utf-8');

  // Check ID3 header
  if (
    mp3Bytes.length > 10 &&
    mp3Bytes[0] === 0x49 &&
    mp3Bytes[1] === 0x44 &&
    mp3Bytes[2] === 0x33
  ) {
    const tagSize = decodeSynchsafe(mp3Bytes, 6);
    let offset = 10;
    const maxOffset = Math.min(mp3Bytes.length, 10 + tagSize);
    const dv = new DataView(mp3Bytes.buffer, mp3Bytes.byteOffset, mp3Bytes.byteLength);

    while (offset + 10 <= maxOffset) {
      const frameId = String.fromCharCode(
        mp3Bytes[offset],
        mp3Bytes[offset + 1],
        mp3Bytes[offset + 2],
        mp3Bytes[offset + 3]
      );

      if (!/^[A-Z0-9]{4}$/.test(frameId)) break;

      const frameSize = dv.getUint32(offset + 4, false);
      const frameData = mp3Bytes.subarray(offset + 10, offset + 10 + frameSize);

      if (frameId === 'TXXX') {
        const rest = frameData.subarray(1); // skip encoding byte
        let nullIdx = -1;
        for (let i = 0; i < rest.length; i++) {
          if (rest[i] === 0) {
            nullIdx = i;
            break;
          }
        }
        if (nullIdx !== -1) {
          const desc = decoder.decode(rest.subarray(0, nullIdx));
          if (desc === targetKey) {
            return decoder.decode(rest.subarray(nullIdx + 1));
          }
        }
      }

      offset += 10 + frameSize;
    }
  }

  // Fallback: search for {"AIGC":{ in the binary buffer if tag header had irregular flags
  const textBuffer = decoder.decode(mp3Bytes.subarray(0, Math.min(mp3Bytes.length, 8192)));
  if (textBuffer.includes('{"AIGC":{')) {
    const startIdx = textBuffer.indexOf('{"AIGC":{');
    let depth = 0;
    let endIdx = -1;
    for (let i = startIdx; i < textBuffer.length; i++) {
      if (textBuffer[i] === '{') depth++;
      else if (textBuffer[i] === '}') {
        depth--;
        if (depth === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }
    if (endIdx !== -1) {
      return textBuffer.substring(startIdx, endIdx);
    }
  }

  return null;
}

export interface ProcessedAudio {
  blob: Blob;
  audioUrl: string;
  metadata: AigcMetadata;
  model: string;
  provider: string;
  voice: string;
  timestamp: string;
  fullInputText: string;
}

/**
 * Prepares the explicit text and attaches ID3v2 AIGC metadata to the resulting MP3 audio.
 */
export async function processAudio(
  rawAudioBlob: Blob,
  metadata: AigcMetadata,
  model: string,
  voice: string,
  fullInputText: string,
  provider = 'Pollinations'
): Promise<ProcessedAudio> {
  const timestamp = new Date().toISOString();
  const arrayBuffer = await rawAudioBlob.arrayBuffer();
  const rawBytes = new Uint8Array(arrayBuffer);

  const jsonStr = JSON.stringify(metadata);
  const finalBytes = injectId3Txxx(rawBytes, 'AIGC', jsonStr);

  const finalBlob = new Blob([finalBytes], { type: 'audio/mp3' });
  const audioUrl = URL.createObjectURL(finalBlob);

  return {
    blob: finalBlob,
    audioUrl,
    metadata,
    model,
    provider,
    voice,
    timestamp,
    fullInputText,
  };
}

export function downloadAudioFile(blob: Blob, produceId: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${produceId}.mp3`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
