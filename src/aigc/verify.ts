import { AigcMetadata } from './metadata';
import { extractPngMetadata, extractJpegMetadata } from './image';
import { extractId3Txxx } from './audio';
import { extractMp4Metadata } from './video';

export interface VerificationResult {
  verified: boolean;
  fileName: string;
  fileSize: number;
  fileType: string;
  metadata?: AigcMetadata;
  error?: string;
  detectedFormat?: string;
}

export async function verifyFile(file: File): Promise<VerificationResult> {
  const fileName = file.name;
  const fileSize = file.size;
  const lowerName = fileName.toLowerCase();

  try {
    // 1. HTML Verification
    if (lowerName.endsWith('.html') || lowerName.endsWith('.htm') || file.type === 'text/html') {
      const text = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const metaTag = doc.querySelector('meta[name="AIGC"]') || doc.querySelector('meta[name="aigc"]');

      if (metaTag) {
        const content = metaTag.getAttribute('content');
        if (content) {
          const parsed = JSON.parse(content);
          if (isValidAigcMetadata(parsed)) {
            return {
              verified: true,
              fileName,
              fileSize,
              fileType: 'HTML 文本',
              detectedFormat: 'HTML <meta name="AIGC">',
              metadata: parsed,
            };
          }
        }
      }

      // Check for JSON embedded in HTML
      const jsonMatch = text.match(/\{"AIGC":\s*\{[\s\S]*?\}\s*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (isValidAigcMetadata(parsed)) {
          return {
            verified: true,
            fileName,
            fileSize,
            fileType: 'HTML 文本',
            detectedFormat: 'HTML Embedded Metadata',
            metadata: parsed,
          };
        }
      }

      return {
        verified: false,
        fileName,
        fileSize,
        fileType: 'HTML 文本',
        error: '未在 HTML 文件头部检测到合规的 AIGC 标识元数据',
      };
    }

    // Binary files: PNG, JPG, MP3, MP4
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // 2. PNG Verification
    if (lowerName.endsWith('.png') || file.type === 'image/png') {
      const metaStr = extractPngMetadata(bytes, 'AIGC');
      if (metaStr) {
        try {
          const parsed = JSON.parse(metaStr);
          if (isValidAigcMetadata(parsed)) {
            return {
              verified: true,
              fileName,
              fileSize,
              fileType: 'PNG 图像',
              detectedFormat: 'PNG iTXt/tEXt Metadata',
              metadata: parsed,
            };
          }
        } catch {}
      }
    }

    // 3. JPEG Verification
    if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || file.type === 'image/jpeg') {
      const metaStr = extractJpegMetadata(bytes);
      if (metaStr) {
        try {
          const parsed = JSON.parse(metaStr);
          if (isValidAigcMetadata(parsed)) {
            return {
              verified: true,
              fileName,
              fileSize,
              fileType: 'JPEG 图像',
              detectedFormat: 'JPEG XMP Metadata',
              metadata: parsed,
            };
          }
        } catch {}
      }
    }

    // 4. MP3 Audio Verification
    if (lowerName.endsWith('.mp3') || file.type === 'audio/mpeg' || file.type === 'audio/mp3') {
      const metaStr = extractId3Txxx(bytes, 'AIGC');
      if (metaStr) {
        try {
          const parsed = JSON.parse(metaStr);
          if (isValidAigcMetadata(parsed)) {
            return {
              verified: true,
              fileName,
              fileSize,
              fileType: 'MP3 音频',
              detectedFormat: 'ID3v2 TXXX Metadata',
              metadata: parsed,
            };
          }
        } catch {}
      }
    }

    // 5. MP4 Video Verification
    if (
      lowerName.endsWith('.mp4') ||
      lowerName.endsWith('.webm') ||
      file.type.startsWith('video/')
    ) {
      const metaStr = extractMp4Metadata(bytes);
      if (metaStr) {
        try {
          const parsed = JSON.parse(metaStr);
          if (isValidAigcMetadata(parsed)) {
            return {
              verified: true,
              fileName,
              fileSize,
              fileType: 'MP4 视频',
              detectedFormat: 'ISO BMFF uuid Box Metadata',
              metadata: parsed,
            };
          }
        } catch {}
      }
    }

    // Universal Binary Fallback Search:
    // If format wrapper was modified by some tools, inspect binary UTF-8 stream for AIGC JSON signature
    const decoder = new TextDecoder('utf-8', { fatal: false });
    // Scan head and tail of file
    const headSlice = bytes.subarray(0, Math.min(bytes.length, 131072));
    const headText = decoder.decode(headSlice);
    const parsedHead = findAndParseAigcJson(headText);
    if (parsedHead) {
      return {
        verified: true,
        fileName,
        fileSize,
        fileType: getFormatLabel(lowerName, file.type),
        detectedFormat: 'Binary Embedded AIGC Metadata',
        metadata: parsedHead,
      };
    }

    if (bytes.length > 131072) {
      const tailSlice = bytes.subarray(bytes.length - 131072);
      const tailText = decoder.decode(tailSlice);
      const parsedTail = findAndParseAigcJson(tailText);
      if (parsedTail) {
        return {
          verified: true,
          fileName,
          fileSize,
          fileType: getFormatLabel(lowerName, file.type),
          detectedFormat: 'Binary Embedded AIGC Metadata',
          metadata: parsedTail,
        };
      }
    }

    return {
      verified: false,
      fileName,
      fileSize,
      fileType: getFormatLabel(lowerName, file.type),
      error: '该文件中未检测到合规的 AIGC 隐式元数据标识',
    };
  } catch (err: any) {
    return {
      verified: false,
      fileName,
      fileSize,
      fileType: getFormatLabel(lowerName, file.type),
      error: err.message || '文件解析异常',
    };
  }
}

function isValidAigcMetadata(obj: any): obj is AigcMetadata {
  return Boolean(
    obj &&
      typeof obj === 'object' &&
      obj.AIGC &&
      typeof obj.AIGC === 'object' &&
      obj.AIGC.Label === '1' &&
      typeof obj.AIGC.ProduceID === 'string'
  );
}

function findAndParseAigcJson(text: string): AigcMetadata | null {
  const startPattern = '{"AIGC":{';
  const startIdx = text.indexOf(startPattern);
  if (startIdx === -1) return null;

  let depth = 0;
  for (let i = startIdx; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) {
        const candidate = text.substring(startIdx, i + 1);
        try {
          const parsed = JSON.parse(candidate);
          if (isValidAigcMetadata(parsed)) return parsed;
        } catch {}
      }
    }
  }

  return null;
}

function getFormatLabel(fileName: string, mime: string): string {
  if (fileName.endsWith('.png')) return 'PNG 图像';
  if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) return 'JPEG 图像';
  if (fileName.endsWith('.mp3')) return 'MP3 音频';
  if (fileName.endsWith('.mp4')) return 'MP4 视频';
  if (fileName.endsWith('.html') || fileName.endsWith('.htm')) return 'HTML 文本';
  return mime || '未知格式';
}
