import React, { useState, useEffect } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Video,
  Volume2,
  Sparkles,
  Loader2,
  AlertCircle,
  Settings as SettingsIcon,
  ExternalLink,
  ShieldCheck,
  Check,
  Zap,
} from 'lucide-react';
import {
  getProvider,
  PROVIDERS_META,
  ProviderId,
  ModelInfo,
  getDefaultProviderId,
} from '../providers';
import { generateAigcMetadata } from '../aigc/metadata';
import { processText } from '../aigc/text';
import { processImage } from '../aigc/image';
import { processVideo } from '../aigc/video';
import { processAudio, AUDIO_EXPLICIT_PREFIX } from '../aigc/audio';
import { ResultViewer, ResultData } from '../components/ResultViewer';

interface GenerateProps {
  onNavigateToSettings: () => void;
}

export type ModalityTab = 'text' | 'image' | 'video' | 'audio';

export const Generate: React.FC<GenerateProps> = ({ onNavigateToSettings }) => {
  const [activeTab, setActiveTab] = useState<ModalityTab>('text');

  // Provider state
  const [selectedProviderId, setSelectedProviderId] = useState<ProviderId>(getDefaultProviderId());
  const [providerKeyInput, setProviderKeyInput] = useState('');
  const [keySavedMessage, setKeySavedMessage] = useState(false);

  // Input states
  const [textPrompt, setTextPrompt] = useState('介绍广州的春天。');
  const [imagePrompt, setImagePrompt] = useState('一只橘猫坐在广州塔旁边，夕阳，摄影风格。');
  const [videoPrompt, setVideoPrompt] = useState('一只橘猫在草地奔跑，电影摄影风格。');
  const [audioInput, setAudioInput] = useState('欢迎使用 BurnCloud AIGC。');
  const [audioVoice, setAudioVoice] = useState('alloy');

  // Models state
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);

  // Selected model per tab
  const [selectedModel, setSelectedModel] = useState('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Result state
  const [resultData, setResultData] = useState<ResultData | null>(null);

  const activeProviderMeta = PROVIDERS_META.find((p) => p.id === selectedProviderId) || PROVIDERS_META[0];

  // Check if current provider has key configured
  const getProviderKey = (pId: ProviderId): string => {
    if (pId === 'siliconflow') return localStorage.getItem('bc_siliconflow_api_key') || '';
    if (pId === 'zhipu') return localStorage.getItem('bc_zhipu_api_key') || '';
    if (pId === 'pollinations') return localStorage.getItem('bc_pollinations_api_key') || '';
    return '';
  };

  const currentProviderKey = getProviderKey(selectedProviderId);

  // Load models whenever selectedProviderId or activeTab changes
  useEffect(() => {
    let mounted = true;
    setLoadingModels(true);
    setErrorMessage(null);

    const provider = getProvider(selectedProviderId);
    provider
      .listModels()
      .then((models) => {
        if (!mounted) return;
        setAvailableModels(models);

        // Filter for current tab
        const filtered = models.filter((m) => m.output_modalities.includes(activeTab));
        if (filtered.length > 0) {
          // Prioritize permanently free models
          const free = filtered.find(
            (m) => m.priceTag === '永久免费' || m.priceTag === '免Key直连' || m.priceTag === '免费'
          );
          setSelectedModel(free ? free.id : filtered[0].id);
        } else {
          setSelectedModel('');
        }
      })
      .catch((err) => {
        console.error('Failed to load models:', err);
      })
      .finally(() => {
        if (mounted) setLoadingModels(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedProviderId, activeTab]);

  // Sync inline key input with current provider
  useEffect(() => {
    setProviderKeyInput(getProviderKey(selectedProviderId));
  }, [selectedProviderId]);

  // Timer while generating
  useEffect(() => {
    let timer: any = null;
    if (isGenerating) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isGenerating]);

  const handleSaveInlineKey = () => {
    if (selectedProviderId === 'siliconflow') {
      localStorage.setItem('bc_siliconflow_api_key', providerKeyInput.trim());
    } else if (selectedProviderId === 'zhipu') {
      localStorage.setItem('bc_zhipu_api_key', providerKeyInput.trim());
    } else if (selectedProviderId === 'pollinations') {
      localStorage.setItem('bc_pollinations_api_key', providerKeyInput.trim());
    }

    setKeySavedMessage(true);
    setTimeout(() => setKeySavedMessage(false), 2000);
  };

  // Filter models for current active tab
  const currentTabModels = availableModels.filter((m) =>
    m.output_modalities.includes(activeTab)
  );

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    setResultData(null);
    setGeneratingStatus('正在连接所选 AI 接口……');

    const producer =
      localStorage.getItem('bc_content_producer') || '广州奔云人工智能科技有限公司';
    const propagator =
      localStorage.getItem('bc_content_propagator') || '广州奔云人工智能科技有限公司';
    const metadata = generateAigcMetadata(producer, propagator);

    const provider = getProvider(selectedProviderId);
    const keyToUse = getProviderKey(selectedProviderId);

    try {
      if (activeTab === 'text') {
        setGeneratingStatus(`正在通过 [${activeProviderMeta.shortName}] 生成文本……`);
        const { text, model, providerName } = await provider.generateText(
          textPrompt,
          selectedModel || undefined,
          keyToUse
        );

        setGeneratingStatus('正在注入 AIGC 标准显式标识与 HTML 隐式元数据……');
        const processed = processText(text, metadata, model);

        setResultData({
          modality: 'text',
          provider: providerName,
          model: processed.model,
          metadata: processed.metadata,
          timestamp: processed.timestamp,
          outputType: 'HTML 文本',
          rawText: processed.rawText,
          htmlContent: processed.htmlContent,
        });
      } else if (activeTab === 'image') {
        setGeneratingStatus(`正在通过 [${activeProviderMeta.shortName}] 生成图片……`);
        const { blob, model, providerName } = await provider.generateImage(
          imagePrompt,
          selectedModel || undefined,
          keyToUse
        );

        setGeneratingStatus('正在合成右下角「AI生成」显式标识并写入 PNG 隐式元数据……');
        const processed = await processImage(blob, metadata, model);

        setResultData({
          modality: 'image',
          provider: providerName,
          model: processed.model,
          metadata: processed.metadata,
          timestamp: processed.timestamp,
          outputType: 'PNG 图像',
          imageBlob: processed.blob,
          imageDataUrl: processed.dataUrl,
        });
      } else if (activeTab === 'video') {
        setGeneratingStatus(`正在通过 [${activeProviderMeta.shortName}] 生成短视频……`);
        const { blob, model, providerName } = await provider.generateVideo(
          videoPrompt,
          selectedModel || undefined,
          keyToUse
        );

        setGeneratingStatus('视频已生成，正在烧录「AI生成」显式标识与 MP4 元数据……');
        const processed = await processVideo(blob, metadata, model, (progress) => {
          setGeneratingStatus(`正在烧录画面与写入元数据 (${progress}%)……`);
        });

        setResultData({
          modality: 'video',
          provider: providerName,
          model: processed.model,
          metadata: processed.metadata,
          timestamp: processed.timestamp,
          outputType: 'MP4 视频',
          videoBlob: processed.blob,
          videoUrl: processed.videoUrl,
        });
      } else if (activeTab === 'audio') {
        // Explicit Label: automatically prepend "本音频由AI生成。"
        const fullAudioPrompt = `${AUDIO_EXPLICIT_PREFIX}${audioInput.trim()}`;
        setGeneratingStatus(`正在通过 [${activeProviderMeta.shortName}] 合成语音……`);

        const { blob, model, providerName } = await provider.generateAudio(
          fullAudioPrompt,
          audioVoice,
          selectedModel || undefined,
          keyToUse
        );

        setGeneratingStatus('正在写入 ID3v2 隐式元数据标签……');
        const processed = await processAudio(
          blob,
          metadata,
          model,
          audioVoice,
          fullAudioPrompt
        );

        setResultData({
          modality: 'audio',
          provider: providerName,
          model: processed.model,
          metadata: processed.metadata,
          timestamp: processed.timestamp,
          outputType: 'MP3 音频',
          audioBlob: processed.blob,
          audioUrl: processed.audioUrl,
        });
      }
    } catch (err: any) {
      console.error('Generation failed:', err);
      setErrorMessage(err.message || '生成失败，请检查网络连接或接口密钥配置。');
    } finally {
      setIsGenerating(false);
      setGeneratingStatus('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">AIGC 内容生成</h1>
        <p className="text-sm text-zinc-500 mt-1">
          接入国内与国际主流免费接口，一键生成文本、图像、音视频，全流程自动注入显式标识与隐式元数据。
        </p>
      </div>

      {/* Provider Selector Cards */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-zinc-900">选择服务商 / 接口通道</span>
          </div>
          <span className="text-[11px] text-zinc-400">
            支持国内永久免费模型与免Key直连
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PROVIDERS_META.map((provider) => {
            const isSelected = selectedProviderId === provider.id;
            const hasKey = !provider.requiresKey || !!getProviderKey(provider.id);

            return (
              <button
                key={provider.id}
                onClick={() => {
                  setSelectedProviderId(provider.id);
                  localStorage.setItem('bc_preferred_provider', provider.id);
                }}
                className={`text-left p-3 rounded-lg border transition-all relative ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-900">
                    {provider.shortName}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      provider.id === 'free_public'
                        ? 'bg-emerald-100 text-emerald-800'
                        : provider.region === '国内'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    {provider.region === '国内' ? '🇨🇳 国内免费' : provider.id === 'free_public' ? '⚡ 免Key' : '🌐 全球'}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-600 font-medium line-clamp-1">
                  {provider.tagline}
                </div>
                <div className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1">
                  {hasKey ? (
                    <span className="text-emerald-600 flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" /> 已就绪
                    </span>
                  ) : (
                    <span className="text-amber-600">待配免费Key</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick inline Key input if the provider requires a key and user hasn't set one */}
        {activeProviderMeta.requiresKey && !currentProviderKey && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>使用「{activeProviderMeta.name}」需配置免费 API 密钥</span>
              </div>
              {activeProviderMeta.keyUrl && (
                <a
                  href={activeProviderMeta.keyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-medium underline"
                >
                  免费领取 Key (官方)
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              {activeProviderMeta.freePolicy}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="password"
                value={providerKeyInput}
                onChange={(e) => setProviderKeyInput(e.target.value)}
                placeholder={`在此快速粘贴 ${activeProviderMeta.shortName} API Key`}
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
              <button
                onClick={handleSaveInlineKey}
                disabled={!providerKeyInput.trim()}
                className="px-3 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded transition-colors shrink-0 flex items-center gap-1"
              >
                {keySavedMessage ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> 已保存
                  </>
                ) : (
                  '保存并立即使用'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => {
            setActiveTab('text');
            setErrorMessage(null);
          }}
          className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'text'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>文本生成</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('image');
            setErrorMessage(null);
          }}
          className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'image'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>图片生成</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('video');
            setErrorMessage(null);
          }}
          className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'video'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>视频生成</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('audio');
            setErrorMessage(null);
          }}
          className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'audio'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>音频生成</span>
        </button>
      </div>

      {/* Main Content Area: Left Input, Right Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-5">
          {/* Model Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-700">选择模型</label>
              {loadingModels && (
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> 加载模型中...
                </span>
              )}
            </div>

            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            >
              {currentTabModels.length > 0 ? (
                currentTabModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.id} [{m.priceTag}]
                  </option>
                ))
              ) : (
                <option value="">当前通道暂无对应模态模型</option>
              )}
            </select>

            <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
              <span>提供商：{activeProviderMeta.name}</span>
              <span className="text-emerald-600 font-medium">
                {currentTabModels.find((m) => m.id === selectedModel)?.priceTag || '可用'}
              </span>
            </div>
          </div>

          {/* Tab Specific Inputs */}
          {activeTab === 'text' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                输入提示词 (Prompt)
              </label>
              <textarea
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                rows={5}
                placeholder="例如：介绍广州的春天。"
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
              />
            </div>
          )}

          {activeTab === 'image' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                图像描述 (Prompt)
              </label>
              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                rows={5}
                placeholder="例如：一只橘猫坐在广州塔旁边，夕阳，摄影风格。"
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
              />
              <p className="text-[11px] text-zinc-400 mt-1.5">
                自动在右下角以不低于最短边 5% 的高度烧录「AI生成」标识，并写入 AIGC Metadata。
              </p>
            </div>
          )}

          {activeTab === 'video' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                视频场景描述 (Prompt)
              </label>
              <textarea
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                rows={5}
                placeholder="例如：一只橘猫在草地奔跑，电影摄影风格。"
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
              />
              <p className="text-[11px] text-zinc-400 mt-1.5">
                视频生成需要短时间渲染。生成后将自动烧录「AI生成」标识并写入 MP4 元数据。
              </p>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  语音文本内容
                </label>
                <textarea
                  value={audioInput}
                  onChange={(e) => setAudioInput(e.target.value)}
                  rows={4}
                  placeholder="例如：欢迎使用 BurnCloud AIGC。"
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  声音音色 (Voice)
                </label>
                <select
                  value={audioVoice}
                  onChange={(e) => setAudioVoice(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="alloy">alloy (自然中性)</option>
                  <option value="echo">echo (温和清晰)</option>
                  <option value="fable">fable (叙事沉稳)</option>
                  <option value="onyx">onyx (深沉稳重)</option>
                  <option value="nova">nova (活泼明亮)</option>
                  <option value="shimmer">shimmer (清脆悠扬)</option>
                </select>
              </div>

              {/* Explicit Audio Notice */}
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-md text-xs text-zinc-600">
                <span className="font-semibold text-zinc-900 block mb-0.5">显式标识规范：</span>
                系统会自动在发送给语音合成的文本开头添加“{AUDIO_EXPLICIT_PREFIX}”语音标识，输出可播放的音频并注入 ID3v2 元数据。
              </div>
            </div>
          )}

          {/* Error Message with link to settings */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-normal">{errorMessage}</div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => setSelectedProviderId('free_public')}
                  className="inline-flex items-center gap-1 font-semibold text-rose-900 hover:underline"
                >
                  ⚡ 一键切换为免密免费通道
                </button>
                <button
                  onClick={onNavigateToSettings}
                  className="inline-flex items-center gap-1 text-zinc-600 hover:underline"
                >
                  <SettingsIcon className="w-3 h-3" /> 前往设置配置密钥
                </button>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium text-sm rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{generatingStatus || '处理中...'} ({elapsedSeconds}s)</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>开始生成并添加 AIGC 标识</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Output Viewer */}
        <div className="lg:col-span-7">
          {resultData ? (
            <ResultViewer data={resultData} />
          ) : (
            <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-xl p-12 text-center text-zinc-400 flex flex-col items-center justify-center min-h-[380px]">
              <Sparkles className="w-10 h-10 text-zinc-300 mb-3" />
              <div className="text-sm font-medium text-zinc-600">等待生成内容</div>
              <div className="text-xs text-zinc-400 mt-1 max-w-sm">
                在左侧选择通道并输入提示词，点击「开始生成」。系统将调用选定的 AI 模型并严格遵循规范添加标识。
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
