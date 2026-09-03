import { AigcMetadata } from './metadata';

export const VIDEO_AIGC_UUID = 'BCAIGC-META-0001';

/**
 * Injects an ISO BMFF `uuid` box with AIGC JSON metadata into an MP4/video buffer.
 */
export function injectMp4Metadata(videoBytes: Uint8Array, jsonStr: string): Uint8Array {
  const encoder = new TextEncoder();
  const payload = encoder.encode(jsonStr);
  const uuidBytes = encoder.encode(VIDEO_AIGC_UUID);

  const boxLength = 4 + 4 + 16 + payload.length;
  const boxHeader = new Uint8Array(8);
  const dv = new DataView(boxHeader.buffer);
  dv.setUint32(0, boxLength, false);
  boxHeader.set(encoder.encode('uuid'), 4);

  const fullBox = new Uint8Array(8 + 16 + payload.length);
  fullBox.set(boxHeader, 0);
  fullBox.set(uuidBytes, 8);
  fullBox.set(payload, 24);

  // Append box to the file (standard ISO BMFF containers support top-level boxes)
  const result = new Uint8Array(videoBytes.length + fullBox.length);
  result.set(videoBytes, 0);
  result.set(fullBox, videoBytes.length);

  return result;
}

/**
 * Extracts AIGC metadata from an MP4 buffer by parsing ISO BMFF boxes or scanning payload.
 */
export function extractMp4Metadata(videoBytes: Uint8Array): string | null {
  const decoder = new TextDecoder('utf-8');
  let offset = 0;
  const dv = new DataView(videoBytes.buffer, videoBytes.byteOffset, videoBytes.byteLength);

  while (offset + 8 <= videoBytes.length) {
    const size = dv.getUint32(offset, false);
    if (size < 8 || size > videoBytes.length - offset) break;

    const type = String.fromCharCode(
      videoBytes[offset + 4],
      videoBytes[offset + 5],
      videoBytes[offset + 6],
      videoBytes[offset + 7]
    );

    if (type === 'uuid' && size >= 24) {
      const uuid = decoder.decode(videoBytes.subarray(offset + 8, offset + 24));
      if (uuid === VIDEO_AIGC_UUID) {
        return decoder.decode(videoBytes.subarray(offset + 24, offset + size));
      }
    }

    offset += size;
  }

  // Fallback: search for {"AIGC":{ in the binary buffer
  const sampleText = decoder.decode(videoBytes.subarray(0, Math.min(videoBytes.length, 65536)));
  if (sampleText.includes('{"AIGC":{')) {
    const startIdx = sampleText.indexOf('{"AIGC":{');
    let depth = 0;
    for (let i = startIdx; i < sampleText.length; i++) {
      if (sampleText[i] === '{') depth++;
      else if (sampleText[i] === '}') {
        depth--;
        if (depth === 0) return sampleText.substring(startIdx, i + 1);
      }
    }
  }

  // Also check the tail of the file where appended boxes reside
  if (videoBytes.length > 65536) {
    const tailSlice = videoBytes.subarray(videoBytes.length - 65536);
    const tailText = decoder.decode(tailSlice);
    if (tailText.includes('{"AIGC":{')) {
      const startIdx = tailText.indexOf('{"AIGC":{');
      let depth = 0;
      for (let i = startIdx; i < tailText.length; i++) {
        if (tailText[i] === '{') depth++;
        else if (tailText[i] === '}') {
          depth--;
          if (depth === 0) return tailText.substring(startIdx, i + 1);
        }
      }
    }
  }

  return null;
}

export interface ProcessedVideo {
  blob: Blob;
  videoUrl: string;
  metadata: AigcMetadata;
  model: string;
  provider: string;
  timestamp: string;
}

/**
 * Truly burns the explicit "AI生成" watermark into the video frames using HTML5 Canvas + MediaRecorder,
 * and embeds the AIGC metadata box into the final MP4 file.
 */
export async function processVideo(
  rawVideoBlob: Blob,
  metadata: AigcMetadata,
  model: string,
  onProgress?: (percent: number) => void,
  provider = 'Pollinations'
): Promise<ProcessedVideo> {
  const timestamp = new Date().toISOString();

  // Create video element
  const videoUrl = URL.createObjectURL(rawVideoBlob);
  const video = document.createElement('video');
  video.src = videoUrl;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Failed to load raw video for watermark burn-in'));
  });

  const width = video.videoWidth || 1280;
  const height = video.videoHeight || 720;
  const duration = video.duration || 3;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas 2d context for video');

  // Calculate watermark sizing
  // Rule: min(videoWidth, videoHeight) * 0.05
  const minDim = Math.min(width, height);
  const fontSize = Math.max(18, Math.round(minDim * 0.05));
  const padX = Math.round(fontSize * 0.5);
  const padY = Math.round(fontSize * 0.28);
  const margin = Math.round(fontSize * 0.4);

  const stream = canvas.captureStream(30);

  let mimeType = 'video/mp4';
  if (!MediaRecorder.isTypeSupported('video/mp4')) {
    mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=h264')
      ? 'video/webm;codecs=h264'
      : 'video/webm';
  }

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 4000000,
  });

  const recordedChunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) recordedChunks.push(e.data);
  };

  const recordingPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(recordedChunks, { type: mimeType }));
    };
  });

  recorder.start(100);
  await video.play();

  // Draw frame loop
  await new Promise<void>((resolve) => {
    const drawFrame = () => {
      if (video.ended || video.paused) {
        resolve();
        return;
      }

      ctx.drawImage(video, 0, 0, width, height);

      // Explicit Label: Display from second 0 for at least 2.5s (or throughout if under 5s)
      const shouldShowLabel = video.currentTime <= 3.0 || duration <= 5.0;
      if (shouldShowLabel) {
        ctx.save();
        ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textBaseline = 'middle';
        const text = 'AI生成';
        const textWidth = ctx.measureText(text).width;

        const boxWidth = textWidth + padX * 2;
        const boxHeight = fontSize + padY * 2;
        const boxX = width - boxWidth - margin;
        const boxY = height - boxHeight - margin;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
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

        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, boxX + padX, boxY + boxHeight / 2);
        ctx.restore();
      }

      if (onProgress && duration > 0) {
        const p = Math.min(99, Math.round((video.currentTime / duration) * 100));
        onProgress(p);
      }

      requestAnimationFrame(drawFrame);
    };

    video.onended = () => resolve();
    drawFrame();
  });

  recorder.stop();
  const recordedBlob = await recordingPromise;
  URL.revokeObjectURL(videoUrl);

  // Inject ISO BMFF / MP4 AIGC metadata
  const arrayBuffer = await recordedBlob.arrayBuffer();
  const rawBytes = new Uint8Array(arrayBuffer);
  const jsonStr = JSON.stringify(metadata);
  const finalBytes = injectMp4Metadata(rawBytes, jsonStr);

  const finalBlob = new Blob([finalBytes], { type: 'video/mp4' });
  const finalUrl = URL.createObjectURL(finalBlob);

  if (onProgress) onProgress(100);

  return {
    blob: finalBlob,
    videoUrl: finalUrl,
    metadata,
    model,
    provider,
    timestamp,
  };
}

export function downloadVideoFile(blob: Blob, produceId: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${produceId}.mp4`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
