import React, { useState } from 'react';
import { Download, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { AigcMetadata } from '../aigc/metadata';
import { MetadataViewer } from './MetadataViewer';
import { downloadHtmlFile } from '../aigc/text';
import { downloadImageFile } from '../aigc/image';
import { downloadVideoFile } from '../aigc/video';
import { downloadAudioFile } from '../aigc/audio';

export type OutputType = 'HTML 文本' | 'PNG 图像' | 'MP4 视频' | 'MP3 音频';

export interface ResultData {
  modality: 'text' | 'image' | 'video' | 'audio';
  provider: string;
  model: string;
  metadata: AigcMetadata;
  timestamp: string;
  outputType: OutputType;
  // Content payloads
  rawText?: string;
  htmlContent?: string;
  imageBlob?: Blob;
  imageDataUrl?: string;
  videoBlob?: Blob;
  videoUrl?: string;
  audioBlob?: Blob;
  audioUrl?: string;
}

interface ResultViewerProps {
  data: ResultData;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({ data }) => {
  const [showMetadata, setShowMetadata] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const handleDownload = () => {
    const produceId = data.metadata.AIGC.ProduceID;
    if (data.modality === 'text' && data.htmlContent) {
      downloadHtmlFile(data.htmlContent, produceId);
    } else if (data.modality === 'image' && data.imageBlob) {
      downloadImageFile(data.imageBlob, produceId);
    } else if (data.modality === 'video' && data.videoBlob) {
      downloadVideoFile(data.videoBlob, produceId);
    } else if (data.modality === 'audio' && data.audioBlob) {
      downloadAudioFile(data.audioBlob, produceId);
    }
  };

  const handleCopyText = () => {
    if (data.rawText) {
      navigator.clipboard.writeText(data.rawText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex flex-col space-y-6">
      {/* Top Explicit Badge */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded">
            AI生成
          </span>
          <span className="text-xs text-zinc-500 font-medium">已自动嵌入显式标识与 AIGC 元数据</span>
        </div>
        <span className="text-xs font-mono text-zinc-400">
          {new Date(data.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {/* Actual Content */}
      <div className="min-h-[220px] flex items-center justify-center bg-zinc-50/70 border border-zinc-100 rounded-lg p-4 overflow-hidden">
        {data.modality === 'text' && (
          <div className="w-full text-left">
            <div className="mb-2">
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                [AI生成]
              </span>
            </div>
            <div className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto pr-2">
              {data.rawText}
            </div>
          </div>
        )}

        {data.modality === 'image' && data.imageDataUrl && (
          <div className="relative group max-h-[460px] flex justify-center">
            <img
              src={data.imageDataUrl}
              alt="BurnCloud AIGC 生成图片"
              className="max-h-[440px] w-auto object-contain rounded border border-zinc-200 shadow-xs"
            />
          </div>
        )}

        {data.modality === 'video' && data.videoUrl && (
          <div className="w-full max-w-xl">
            <video
              src={data.videoUrl}
              controls
              autoPlay
              muted
              playsInline
              className="w-full max-h-[400px] bg-black rounded border border-zinc-300"
            />
          </div>
        )}

        {data.modality === 'audio' && data.audioUrl && (
          <div className="w-full max-w-md py-6 px-4 bg-white border border-zinc-200 rounded-lg flex flex-col items-center space-y-4">
            <div className="text-xs text-zinc-600 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-full">
              语音开头已包含：“本音频由AI生成。”
            </div>
            <audio src={data.audioUrl} controls className="w-full" />
          </div>
        )}
      </div>

      {/* Technical Information */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 text-xs">
        <h4 className="font-semibold text-zinc-900 mb-2.5">技术信息</h4>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-zinc-600">
          <div className="flex">
            <dt className="w-24 font-medium text-zinc-500">Provider：</dt>
            <dd className="font-medium text-zinc-900">{data.provider}</dd>
          </div>
          <div className="flex">
            <dt className="w-24 font-medium text-zinc-500">Model：</dt>
            <dd className="font-medium text-zinc-900 font-mono">{data.model}</dd>
          </div>
          <div className="flex sm:col-span-2">
            <dt className="w-24 shrink-0 font-medium text-zinc-500">ProduceID：</dt>
            <dd className="font-mono text-zinc-900 break-all">{data.metadata.AIGC.ProduceID}</dd>
          </div>
          <div className="flex">
            <dt className="w-24 font-medium text-zinc-500">输出类型：</dt>
            <dd className="font-medium text-zinc-900">{data.outputType}</dd>
          </div>
          <div className="flex">
            <dt className="w-24 font-medium text-zinc-500">生成时间：</dt>
            <dd className="text-zinc-700">{data.timestamp}</dd>
          </div>
        </dl>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          {data.modality === 'text' && (
            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors"
            >
              {copiedText ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-zinc-500" />
                  <span>复制正文</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors"
          >
            {showMetadata ? (
              <>
                <EyeOff className="w-4 h-4 text-zinc-500" />
                <span>收起 AIGC Metadata</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-zinc-500" />
                <span>查看 AIGC Metadata</span>
              </>
            )}
          </button>
        </div>

        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>下载 ({data.outputType.split(' ')[0]})</span>
        </button>
      </div>

      {/* Collapsible Metadata Viewer */}
      {showMetadata && (
        <div className="pt-2">
          <MetadataViewer metadata={data.metadata} />
        </div>
      )}
    </div>
  );
};
