import { AigcMetadata } from './metadata';

export interface ProcessedText {
  rawText: string;
  formattedText: string;
  htmlContent: string;
  metadata: AigcMetadata;
  model: string;
  provider: string;
  timestamp: string;
}

export function processText(
  rawText: string,
  metadata: AigcMetadata,
  model: string,
  provider = 'Pollinations'
): ProcessedText {
  const timestamp = new Date().toISOString();
  const formattedText = `[AI生成]\n\n${rawText.trim()}`;

  // Escape HTML characters for safe embedding
  const escapedText = rawText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Metadata JSON string for the meta tag
  const metaJsonString = JSON.stringify(metadata);

  const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BurnCloud AIGC - 生成文本</title>
  <meta name="AIGC" content='${metaJsonString}' />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.7;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 24px;
      color: #18181b;
      background-color: #ffffff;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      font-size: 13px;
      font-weight: 600;
      color: #ffffff;
      background-color: #2563eb;
      border-radius: 4px;
      margin-bottom: 24px;
      letter-spacing: 0.05em;
    }
    .content {
      font-size: 16px;
      white-space: pre-wrap;
      word-break: break-word;
      padding: 24px;
      background-color: #fafafa;
      border: 1px solid #e4e4e7;
      border-radius: 8px;
    }
    .meta-box {
      margin-top: 32px;
      padding: 16px;
      font-size: 13px;
      color: #71717a;
      background-color: #f4f4f5;
      border: 1px solid #e4e4e7;
      border-radius: 6px;
    }
    .meta-box dt {
      font-weight: 600;
      color: #27272a;
      display: inline-block;
      width: 140px;
    }
    .meta-box dd {
      display: inline-block;
      margin: 0;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="badge">AI生成</div>
  <div class="content">${escapedText}</div>
  <div class="meta-box">
    <div><dt>Provider:</dt><dd>${provider}</dd></div>
    <div><dt>Model:</dt><dd>${model}</dd></div>
    <div><dt>ProduceID:</dt><dd>${metadata.AIGC.ProduceID}</dd></div>
    <div><dt>生成时间:</dt><dd>${timestamp}</dd></div>
    <div><dt>ContentProducer:</dt><dd>${metadata.AIGC.ContentProducer}</dd></div>
  </div>
</body>
</html>`;

  return {
    rawText,
    formattedText,
    htmlContent,
    metadata,
    model,
    provider,
    timestamp,
  };
}

export function downloadHtmlFile(htmlContent: string, produceId: string): void {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${produceId}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
