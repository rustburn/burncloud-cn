import React, { useState } from 'react';
import { Copy, Check, ShieldCheck } from 'lucide-react';
import { AigcMetadata } from '../aigc/metadata';

interface MetadataViewerProps {
  metadata: AigcMetadata;
  title?: string;
}

export const MetadataViewer: React.FC<MetadataViewerProps> = ({
  metadata,
  title = 'AIGC 文件元数据 (隐式标识)',
}) => {
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(metadata, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const aigc = metadata.AIGC;

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-5 text-sm">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200">
        <div className="flex items-center gap-2 font-medium text-zinc-900">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>{title}</span>
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded hover:bg-zinc-100 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600">已复制</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-zinc-500" />
              <span>复制 JSON</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-xs">
        <div className="bg-white p-3 rounded border border-zinc-200">
          <span className="text-zinc-500 block mb-1">生成合成标签 (Label)</span>
          <span className="font-mono font-medium text-zinc-900">{aigc.Label} (人工智能生成内容)</span>
        </div>
        <div className="bg-white p-3 rounded border border-zinc-200">
          <span className="text-zinc-500 block mb-1">内容制作编号 (ProduceID)</span>
          <span className="font-mono font-medium text-zinc-900 break-all">{aigc.ProduceID}</span>
        </div>
        <div className="bg-white p-3 rounded border border-zinc-200">
          <span className="text-zinc-500 block mb-1">内容制作服务者 (ContentProducer)</span>
          <span className="font-medium text-zinc-900">{aigc.ContentProducer}</span>
        </div>
        <div className="bg-white p-3 rounded border border-zinc-200">
          <span className="text-zinc-500 block mb-1">内容传播服务者 (ContentPropagator)</span>
          <span className="font-medium text-zinc-900">{aigc.ContentPropagator}</span>
        </div>
      </div>

      <div className="relative">
        <pre className="bg-zinc-900 text-zinc-100 p-3.5 rounded font-mono text-xs overflow-x-auto leading-relaxed">
          {jsonString}
        </pre>
      </div>
    </div>
  );
};
