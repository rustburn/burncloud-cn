export type ProviderId = 'free_public' | 'siliconflow' | 'zhipu' | 'pollinations';

export interface ModelPricing {
  currency?: string;
  promptTextTokens?: string;
  completionTextTokens?: string;
  promptImageTokens?: string;
  completionImageTokens?: string;
  completionAudioTokens?: string;
  completionVideoSeconds?: string;
  [key: string]: any;
}

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  input_modalities?: string[];
  output_modalities: ('text' | 'image' | 'video' | 'audio')[];
  supported_endpoints?: string[];
  pricing?: ModelPricing | null;
  priceTag: '永久免费' | '免Key直连' | '注册赠送' | '免费' | '付费';
  providerId: ProviderId;
  badgeColor?: 'green' | 'blue' | 'amber';
}

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  shortName: string;
  region: '国内' | '全球' | '本地';
  tagline: string;
  description: string;
  requiresKey: boolean;
  freePolicy: string;
  keyUrl?: string;
  keyStorageKey: string;
  supportedModalities: ('text' | 'image' | 'video' | 'audio')[];
}

export interface AigcProvider {
  id: ProviderId;
  generateText(prompt: string, model?: string, apiKey?: string): Promise<{ text: string; model: string; providerName: string }>;
  generateImage(prompt: string, model?: string, apiKey?: string): Promise<{ blob: Blob; model: string; providerName: string }>;
  generateVideo(prompt: string, model?: string, apiKey?: string): Promise<{ blob: Blob; model: string; providerName: string }>;
  generateAudio(text: string, voice?: string, model?: string, apiKey?: string): Promise<{ blob: Blob; model: string; providerName: string }>;
  listModels(): Promise<ModelInfo[]>;
  testConnection?(apiKey?: string): Promise<{ success: boolean; message: string }>;
}
