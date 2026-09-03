import React, { useState, useEffect } from 'react';
import {
  Save,
  Check,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Loader2,
  Key,
  Building,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { DEFAULT_CONTENT_PRODUCER, DEFAULT_CONTENT_PROPAGATOR } from '../aigc/metadata';
import {
  siliconFlowProvider,
  zhipuProvider,
  pollinationsProvider,
  ProviderId,
  PROVIDERS_META,
} from '../providers';

export const Settings: React.FC = () => {
  // Provider Keys
  const [siliconFlowKey, setSiliconFlowKey] = useState('');
  const [zhipuKey, setZhipuKey] = useState('');
  const [pollinationsKey, setPollinationsKey] = useState('');
  const [preferredProvider, setPreferredProvider] = useState<ProviderId>('free_public');

  // Metadata Org
  const [contentProducer, setContentProducer] = useState(DEFAULT_CONTENT_PRODUCER);
  const [contentPropagator, setContentPropagator] = useState(DEFAULT_CONTENT_PROPAGATOR);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Test states for each provider
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { status: 'success' | 'error'; message: string }>>({});

  useEffect(() => {
    setSiliconFlowKey(localStorage.getItem('bc_siliconflow_api_key') || '');
    setZhipuKey(localStorage.getItem('bc_zhipu_api_key') || '');
    setPollinationsKey(localStorage.getItem('bc_pollinations_api_key') || '');
    setPreferredProvider((localStorage.getItem('bc_preferred_provider') as ProviderId) || 'free_public');

    setContentProducer(localStorage.getItem('bc_content_producer') || DEFAULT_CONTENT_PRODUCER);
    setContentPropagator(localStorage.getItem('bc_content_propagator') || DEFAULT_CONTENT_PROPAGATOR);
  }, []);

  const handleSave = () => {
    localStorage.setItem('bc_siliconflow_api_key', siliconFlowKey.trim());
    localStorage.setItem('bc_zhipu_api_key', zhipuKey.trim());
    localStorage.setItem('bc_pollinations_api_key', pollinationsKey.trim());
    localStorage.setItem('bc_preferred_provider', preferredProvider);

    localStorage.setItem('bc_content_producer', contentProducer.trim() || DEFAULT_CONTENT_PRODUCER);
    localStorage.setItem('bc_content_propagator', contentPropagator.trim() || DEFAULT_CONTENT_PROPAGATOR);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    setContentProducer(DEFAULT_CONTENT_PRODUCER);
    setContentPropagator(DEFAULT_CONTENT_PROPAGATOR);
    setPreferredProvider('free_public');
    localStorage.setItem('bc_content_producer', DEFAULT_CONTENT_PRODUCER);
    localStorage.setItem('bc_content_propagator', DEFAULT_CONTENT_PROPAGATOR);
    localStorage.setItem('bc_preferred_provider', 'free_public');

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const testSiliconFlow = async () => {
    setTestingProvider('siliconflow');
    const res = await siliconFlowProvider.testConnection(siliconFlowKey);
    setTestResults((prev) => ({
      ...prev,
      siliconflow: { status: res.success ? 'success' : 'error', message: res.message },
    }));
    setTestingProvider(null);
  };

  const testZhipu = async () => {
    setTestingProvider('zhipu');
    const res = await zhipuProvider.testConnection(zhipuKey);
    setTestResults((prev) => ({
      ...prev,
      zhipu: { status: res.success ? 'success' : 'error', message: res.message },
    }));
    setTestingProvider(null);
  };

  const testPollinations = async () => {
    setTestingProvider('pollinations');
    const res = await pollinationsProvider.testConnection(pollinationsKey);
    setTestResults((prev) => ({
      ...prev,
      pollinations: { status: res.success ? 'success' : 'error', message: res.message },
    }));
    setTestingProvider(null);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">接口与系统设置</h1>
        <p className="text-sm text-zinc-500 mt-1">
          管理国内外免费 AI 接口密钥、默认生成服务商及 AIGC 合规元数据主体。
        </p>
      </div>

      {/* 1. Free Provider Management Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-600" />
          <span>免费接口连接池管理</span>
        </h2>

        {/* 1.1 纯免密公共通道 */}
        <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-xs bg-gradient-to-r from-white to-emerald-50/30">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-900">开箱即用免密通道 (Free Public)</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                  ⚡ 永久免Key·全员可用
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                内置免密语言生成接口、Flux/Turbo 免密生图与浏览器端高保真 AIGC 语音合成引擎。
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>状态正常·随时可用</span>
            </div>
          </div>
        </div>

        {/* 1.2 硅基流动 SiliconFlow (国内首选) */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-900">硅基流动 (SiliconFlow)</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                  🇨🇳 国内高速·官方多款模型永久免费
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                官方将 Qwen 2.5 7B、GLM-4 9B、书生·浦语等模型设为永久 0 算力免费。新用户注册即赠送 14 元算力。
              </p>
            </div>
            <a
              href="https://cloud.siliconflow.cn/account/ak"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 shrink-0 underline"
            >
              免费获取 Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="password"
                value={siliconFlowKey}
                onChange={(e) => setSiliconFlowKey(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx (输入在 SiliconFlow 免费领取的密钥)"
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={testSiliconFlow}
              disabled={testingProvider === 'siliconflow' || !siliconFlowKey.trim()}
              className="px-3 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 rounded-md transition-colors shrink-0 flex items-center gap-1"
            >
              {testingProvider === 'siliconflow' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> 测试中
                </>
              ) : (
                '测试连接'
              )}
            </button>
          </div>

          {testResults.siliconflow && (
            <div
              className={`p-2.5 rounded-md text-xs flex items-center gap-2 ${
                testResults.siliconflow.status === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testResults.siliconflow.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testResults.siliconflow.message}</span>
            </div>
          )}
        </div>

        {/* 1.3 智谱 AI BigModel */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-900">智谱 AI (BigModel)</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                  🇨🇳 国内头部·GLM-4-Flash 官方全员永久免费
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                GLM-4-Flash 官方宣布永久免费面向个人和企业开放；新注册即送 2500 万 Token 测试额度。
              </p>
            </div>
            <a
              href="https://open.bigmodel.cn/usercenter/apikeys"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 shrink-0 underline"
            >
              免费获取 Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="password"
                value={zhipuKey}
                onChange={(e) => setZhipuKey(e.target.value)}
                placeholder="智谱 API Key (例如：xxxxxx.xxxxxx)"
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={testZhipu}
              disabled={testingProvider === 'zhipu' || !zhipuKey.trim()}
              className="px-3 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 rounded-md transition-colors shrink-0 flex items-center gap-1"
            >
              {testingProvider === 'zhipu' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> 测试中
                </>
              ) : (
                '测试连接'
              )}
            </button>
          </div>

          {testResults.zhipu && (
            <div
              className={`p-2.5 rounded-md text-xs flex items-center gap-2 ${
                testResults.zhipu.status === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testResults.zhipu.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testResults.zhipu.message}</span>
            </div>
          )}
        </div>

        {/* 1.4 Pollinations AI */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-900">Pollinations AI (全球开源聚合)</span>
                <span className="text-[10px] bg-zinc-100 text-zinc-700 font-semibold px-2 py-0.5 rounded-full">
                  🌐 支持 30+ 款免费开源模型
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                登录 enter.pollinations.ai 可获取带有免费 Pollen 算力的个人 API Key。
              </p>
            </div>
            <a
              href="https://enter.pollinations.ai/keys"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 shrink-0 underline"
            >
              获取 API Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={pollinationsKey}
                onChange={(e) => setPollinationsKey(e.target.value)}
                placeholder="输入 Pollinations API Key (留空使用基础免费通道)"
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={testPollinations}
              disabled={testingProvider === 'pollinations'}
              className="px-3 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors shrink-0 flex items-center gap-1"
            >
              {testingProvider === 'pollinations' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> 测试中
                </>
              ) : (
                '测试连接'
              )}
            </button>
          </div>

          {testResults.pollinations && (
            <div
              className={`p-2.5 rounded-md text-xs flex items-center gap-2 ${
                testResults.pollinations.status === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testResults.pollinations.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testResults.pollinations.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Metadata Organization Settings */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-5">
        <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <Building className="w-4 h-4 text-blue-600" />
          <span>AIGC 合规服务主体设置</span>
        </h2>

        {/* ContentProducer */}
        <div>
          <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
            生成合成服务提供者 (ContentProducer)
          </label>
          <input
            type="text"
            value={contentProducer}
            onChange={(e) => setContentProducer(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-[11px] text-zinc-400 mt-1">
            默认主体：广州奔云人工智能科技有限公司，将严格写入 AIGC 隐式元数据。
          </p>
        </div>

        {/* ContentPropagator */}
        <div>
          <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
            内容传播服务提供者 (ContentPropagator)
          </label>
          <input
            type="text"
            value={contentPropagator}
            onChange={(e) => setContentPropagator(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-[11px] text-zinc-400 mt-1">
            默认主体：广州奔云人工智能科技有限公司，将严格写入 AIGC 隐式元数据。
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
          <button
            onClick={handleResetDefaults}
            className="px-3 py-2 text-xs text-zinc-500 hover:text-zinc-700 transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢复默认主体</span>
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-xs flex items-center gap-1.5"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>所有设置已保存</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>保存所有设置</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
