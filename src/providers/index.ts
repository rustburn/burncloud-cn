import { AigcProvider, ProviderId, ProviderMeta } from './types';
import { FreePublicProvider } from './freePublic';
import { SiliconFlowProvider } from './siliconflow';
import { ZhipuProvider } from './zhipu';
import { PollinationsProvider } from './pollinations';

export * from './types';
export * from './localWebAudio';

export const freePublicProvider = new FreePublicProvider();
export const siliconFlowProvider = new SiliconFlowProvider();
export const zhipuProvider = new ZhipuProvider();
export const pollinationsProvider = new PollinationsProvider();

export const PROVIDERS_META: ProviderMeta[] = [
  {
    id: 'free_public',
    name: '开箱即用免密免费通道',
    shortName: '免密直连',
    region: '本地',
    tagline: '100% 免 API Key，零配置，即开即用',
    description: '无需注册或填写任何密钥。提供免密语言生成、Flux/Turbo 免密生图与浏览器端高保真 AIGC 语音合成。',
    requiresKey: false,
    freePolicy: '永久完全免费，无需 Key，无请求次数门槛限制。',
    keyStorageKey: '',
    supportedModalities: ['text', 'image', 'video', 'audio'],
  },
  {
    id: 'siliconflow',
    name: '硅基流动 (SiliconFlow)',
    shortName: '硅基流动',
    region: '国内',
    tagline: '国内首选·多款国产顶尖大模型永久免费',
    description: '国内高速大模型云平台，官方将 Qwen 2.5 7B、GLM-4 9B、书生·浦语等模型设为永久0算力免费，新注册即送 14 元算力。',
    requiresKey: true,
    freePolicy: '官方永久免费：Qwen2.5-7B、GLM-4-9B、TeleChat2 等 0 费用；新注册额外赠送 14 元算力额度。',
    keyUrl: 'https://cloud.siliconflow.cn/account/ak',
    keyStorageKey: 'bc_siliconflow_api_key',
    supportedModalities: ['text', 'image', 'audio'],
  },
  {
    id: 'zhipu',
    name: '智谱 AI (BigModel)',
    shortName: '智谱 AI',
    region: '国内',
    tagline: '国内头部·GLM-4-Flash 官方全员永久免费',
    description: '清华与智谱团队打造，官方宣布 GLM-4-Flash 个人及企业开发者全员永久免费调用，注册赠送 2500 万 Token。',
    requiresKey: true,
    freePolicy: '官方永久免费：GLM-4-Flash 全员免费开放，无限调用；新用户注册再送 2500 万 Token。',
    keyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    keyStorageKey: 'bc_zhipu_api_key',
    supportedModalities: ['text', 'image', 'audio'],
  },
  {
    id: 'pollinations',
    name: 'Pollinations AI (全球聚合)',
    shortName: 'Pollinations',
    region: '全球',
    tagline: '支持 30+ 社区与开源免费模型',
    description: '开源 AI 聚合路由器，支持 Flux、Turbo、社区 :free 模型与免 Key 生图。',
    requiresKey: false,
    freePolicy: '免Key支持基础生图；注册 enter.pollinations.ai 赠送免费 Pollen 算力与免费模型。',
    keyUrl: 'https://enter.pollinations.ai/keys',
    keyStorageKey: 'bc_pollinations_api_key',
    supportedModalities: ['text', 'image', 'video', 'audio'],
  },
];

export const providersRegistry: Record<ProviderId, AigcProvider> = {
  free_public: freePublicProvider,
  siliconflow: siliconFlowProvider,
  zhipu: zhipuProvider,
  pollinations: pollinationsProvider,
};

export function getProvider(id: ProviderId): AigcProvider {
  return providersRegistry[id] || freePublicProvider;
}

export function getDefaultProviderId(): ProviderId {
  const stored = localStorage.getItem('bc_preferred_provider') as ProviderId;
  if (stored && providersRegistry[stored]) {
    return stored;
  }
  return 'free_public'; // Default to 100% keyless free so user never experiences friction!
}
