import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  Video,
  Volume2,
  ArrowRight,
  Cpu,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';

export const Flow: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">算法流程与接口架构</h1>
        <p className="text-sm text-zinc-500 mt-1">
          BurnCloud AIGC 的多源免费接口拓扑架构、分模态生成链路与国家标准合规标识处理全流程。
        </p>
      </div>

      {/* Main Architecture Flowchart */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-6">
        <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>核心生成与标识处理总流程</span>
        </h2>

        {/* Step Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
          {/* Node 1 */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-center">
            <span className="text-[11px] font-semibold text-zinc-400 block mb-1">步骤 1</span>
            <div className="text-xs font-semibold text-zinc-900">用户输入</div>
            <div className="text-[11px] text-zinc-500 mt-1">提示词 / 文本 / 模态参数</div>
          </div>

          <div className="hidden md:flex justify-center text-zinc-400">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Node 2 */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-center">
            <span className="text-[11px] font-semibold text-zinc-400 block mb-1">步骤 2</span>
            <div className="text-xs font-semibold text-zinc-900">输入预处理</div>
            <div className="text-[11px] text-zinc-500 mt-1">模态格式化 / 强制语音前缀</div>
          </div>

          <div className="hidden md:flex justify-center text-zinc-400">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Node 3: Third Party Free Cluster */}
          <div className="p-4 bg-blue-50 border-2 border-blue-600 rounded-lg text-center relative shadow-xs">
            <span className="inline-block bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
              免费接口集群
            </span>
            <div className="text-xs font-bold text-blue-950 flex items-center justify-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              <span>多路 AI 接口路由</span>
            </div>
            <div className="text-[10px] text-blue-700 mt-1">
              硅基流动 · 智谱AI · 免密公共
            </div>
          </div>

          <div className="hidden md:flex justify-center text-zinc-400">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Node 4 */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-center md:col-start-1 md:row-start-2">
            <span className="text-[11px] font-semibold text-zinc-400 block mb-1">步骤 3</span>
            <div className="text-xs font-semibold text-zinc-900">原始生成内容</div>
            <div className="text-[11px] text-zinc-500 mt-1">接收原始音视文本流/数据</div>
          </div>

          <div className="hidden md:flex justify-center text-zinc-400 md:col-start-2 md:row-start-2">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Node 5 */}
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-center md:col-start-3 md:col-span-2 md:row-start-2">
            <span className="text-[11px] font-semibold text-emerald-700 block mb-1">步骤 4</span>
            <div className="text-xs font-bold text-emerald-950 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>AIGC 规范标识处理</span>
            </div>
            <div className="text-[11px] text-emerald-800 mt-1">
              显式视觉/语音水印 + AIGC 元数据隐式注入
            </div>
          </div>

          <div className="hidden md:flex justify-center text-zinc-400 md:col-start-5 md:row-start-2">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Node 6 */}
          <div className="p-4 bg-zinc-900 text-white rounded-lg text-center md:col-start-6 md:row-start-2 shadow-xs">
            <span className="text-[11px] font-semibold text-zinc-400 block mb-1">最终步骤</span>
            <div className="text-xs font-semibold">带标文件与交付</div>
            <div className="text-[11px] text-zinc-300 mt-1">带标内容下载与验标解析</div>
          </div>
        </div>
      </div>

      {/* Free Providers Matrix */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-600" />
          <span>已接入的免费接口矩阵与策略</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900">开箱即用免密通道</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">免Key</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              无需任何注册或配置。支持免密语言推理、Flux/Turbo 免密扩散生图、以及浏览器原生高保真 AIGC 语音合成。
            </p>
          </div>

          <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900">硅基流动 SiliconFlow</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">🇨🇳 国内永久免费</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              国内机房直连，极低延迟。官方提供 Qwen 2.5 7B、GLM-4 9B、书生·浦语等模型永久 0 算力免费，注册送 14 元算力。
            </p>
          </div>

          <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900">智谱 AI BigModel</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">🇨🇳 国内永久免费</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              官方宣布旗舰轻量模型 GLM-4-Flash 向全员永久免费开放，响应极快、中文理解顶尖，注册送 2500 万 Token。
            </p>
          </div>
        </div>
      </div>

      {/* Four Modality Detail Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900">分模态算法与合规处理</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* TEXT */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="font-semibold text-xs text-zinc-900">TEXT (文本)</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">
                .html
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-2 px-3 bg-zinc-50 rounded-lg border border-zinc-100">
              <span className="text-zinc-600">
                <span className="font-semibold text-zinc-800">输入：</span>文本
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-blue-700 font-medium">Qwen/GLM/免密</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-600">
                <span className="font-semibold text-zinc-800">输出：</span>HTML
              </span>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              正文顶部与底部输出清晰的 <span className="font-mono text-zinc-700 font-medium">[AI生成]</span> 显式标识，下载时导出为 HTML 并在 <span className="font-mono text-zinc-700">&lt;head&gt;</span> 中写入完整 AIGC 隐式元数据。
            </p>
          </div>

          {/* IMAGE */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <span className="font-semibold text-xs text-zinc-900">IMAGE (图像)</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">
                .png
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-2 px-3 bg-zinc-50 rounded-lg border border-zinc-100">
              <span className="text-zinc-600">
                <span className="font-semibold text-zinc-800">输入：</span>提示词
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-blue-700 font-medium">Flux/Kolors</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-600">
                <span className="font-semibold text-zinc-800">输出：</span>PNG
              </span>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              自动在图像右下角绘制不低于最短边 5% 高度的「AI生成」文字半透明徽标；底层向 PNG 二进制注入标准 <span className="font-mono text-zinc-700">tEXt (AIGC)</span> 块。
            </p>
          </div>

          {/* VIDEO */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                  <Video className="w-4 h-4" />
                </div>
                <span className="font-semibold text-xs text-zinc-900">VIDEO (视频)</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">
                .mp4
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-2 px-3 bg-zinc-50 rounded-lg border border-zinc-100">
              <span className="text-zinc-600">
                <span className="font-semibold text-zinc-800">输入：</span>场景提示
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-blue-700 font-medium">视频引擎</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-600">
                <span className="font-semibold text-zinc-800">输出：</span>MP4
              </span>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              利用 Canvas 逐帧解帧烧录「AI生成」右上角显式角标，并使用 MediaRecorder 与 MP4 元数据注入器写入合规标准。
            </p>
          </div>

          {/* AUDIO */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                  <Volume2 className="w-4 h-4" />
                </div>
                <span className="font-semibold text-xs text-zinc-900">AUDIO (音频)</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">
                .mp3 / .wav
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-2 px-3 bg-zinc-50 rounded-lg border border-zinc-100">
              <span className="text-zinc-600">
                <span className="font-semibold text-zinc-800">输入：</span>朗读文本
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-blue-700 font-medium">语音引擎</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-600">
                <span className="font-semibold text-zinc-800">输出：</span>MP3/WAV
              </span>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              在发送合成前自动在开头强制添加“本音频由AI生成。”语音显式标识，输出文件并注入标准 ID3v2 TXXX AIGC 隐式元数据。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
