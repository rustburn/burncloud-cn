import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  XCircle,
  FileSearch,
  Loader2,
  FileCode,
  FileImage,
  FileVideo,
  FileAudio,
  File,
} from 'lucide-react';
import { verifyFile, VerificationResult } from '../aigc/verify';
import { MetadataViewer } from '../components/MetadataViewer';

export const Verify: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsVerifying(true);
    setResult(null);

    try {
      const res = await verifyFile(file);
      setResult(res);
    } catch (err: any) {
      setResult({
        verified: false,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || '未知文件',
        error: err.message || '文件解析失败',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const getFileIcon = (type: string) => {
    if (type.includes('文本') || type.includes('HTML')) return <FileCode className="w-6 h-6 text-blue-600" />;
    if (type.includes('图像') || type.includes('PNG') || type.includes('JPEG')) return <FileImage className="w-6 h-6 text-emerald-600" />;
    if (type.includes('视频') || type.includes('MP4')) return <FileVideo className="w-6 h-6 text-purple-600" />;
    if (type.includes('音频') || type.includes('MP3')) return <FileAudio className="w-6 h-6 text-amber-600" />;
    return <File className="w-6 h-6 text-zinc-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">文件验证</h1>
        <p className="text-sm text-zinc-500 mt-1">
          真实解析上传的文本、图像、音视频文件字节，提取其携带的 AIGC 隐式元数据标识。
        </p>
      </div>

      {/* Upload Drag & Drop Area */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors bg-white ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50'
            : 'border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".html,.htm,.jpg,.jpeg,.png,.mp4,.mp3"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-3 bg-blue-50 rounded-full text-blue-600">
            {isVerifying ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              {isVerifying ? '正在深度解析文件元数据……' : '点击上传或将文件拖入此区域'}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              支持格式：.html, .png, .jpg, .jpeg, .mp4, .mp3
            </p>
          </div>
        </div>
      </div>

      {/* Verification Results Display */}
      {result && (
        <div className="space-y-4">
          {/* File Card Header */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                {getFileIcon(result.fileType)}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 break-all">{result.fileName}</h3>
                <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                  <span>类型：{result.fileType}</span>
                  <span>•</span>
                  <span>大小：{formatFileSize(result.fileSize)}</span>
                  {result.detectedFormat && (
                    <>
                      <span>•</span>
                      <span>识别容器：{result.detectedFormat}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Status Pill */}
            <div>
              {result.verified ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>检测到 AIGC 标识</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>未检测到 AIGC 标识</span>
                </div>
              )}
            </div>
          </div>

          {/* Details breakdown if verified */}
          {result.verified && result.metadata && (
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                  <FileSearch className="w-4 h-4 text-blue-600" />
                  <span>解析字段详情</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <span className="text-zinc-500 block mb-1">生成合成标签</span>
                    <span className="font-mono font-medium text-zinc-900 text-sm">
                      {result.metadata.AIGC.Label} (人工智能生成合成内容)
                    </span>
                  </div>

                  <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <span className="text-zinc-500 block mb-1">内容制作编号</span>
                    <span className="font-mono font-medium text-zinc-900 break-all text-sm">
                      {result.metadata.AIGC.ProduceID}
                    </span>
                  </div>

                  <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <span className="text-zinc-500 block mb-1">生成合成服务提供者</span>
                    <span className="font-medium text-zinc-900 text-sm">
                      {result.metadata.AIGC.ContentProducer}
                    </span>
                  </div>

                  <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <span className="text-zinc-500 block mb-1">内容传播服务提供者</span>
                    <span className="font-medium text-zinc-900 text-sm">
                      {result.metadata.AIGC.ContentPropagator}
                    </span>
                  </div>

                  <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg md:col-span-2">
                    <span className="text-zinc-500 block mb-1">内容传播编号</span>
                    <span className="font-mono font-medium text-zinc-900 break-all text-sm">
                      {result.metadata.AIGC.PropagateID}
                    </span>
                  </div>
                </div>
              </div>

              {/* Full Original JSON */}
              <MetadataViewer
                metadata={result.metadata}
                title="原始 AIGC Metadata (JSON 结构)"
              />
            </div>
          )}

          {/* Failure prompt */}
          {!result.verified && (
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs text-xs text-zinc-600 space-y-2">
              <p className="font-semibold text-zinc-800">未检测到有效元数据说明：</p>
              <p>{result.error || '上传的文件中未包含按照 BurnCloud AIGC 规范注入的 AIGC 元数据。'}</p>
              <p className="text-zinc-400">
                请先在「生成」页面中生成任意文本、图片、视频或音频并下载，再将其重新上传到本页面进行验证。
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
