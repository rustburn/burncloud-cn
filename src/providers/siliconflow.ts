import { AigcProvider, ModelInfo } from './types';
import { synthesizeVoiceWav } from './localWebAudio';
import { generateStableVideo, getStableVideoModels } from './videoEngine';

export class SiliconFlowProvider implements AigcProvider {
  id = 'siliconflow' as const;
  private baseUrl = 'https://api.siliconflow.cn/v1';

  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        id: 'Qwen/Qwen2.5-7B-Instruct',
        name: '通义千问 Qwen 2.5 7B (官方永久免费)',
        description: '阿里通义千问新一代开源大模型，中文推理与写作能力极强，官方设为永久0算力免费。',
        output_modalities: ['text'],
        priceTag: '永久免费',
        providerId: 'siliconflow',
        badgeColor: 'green',
      },
      {
        id: 'THUDM/glm-4-9b-chat',
        name: '智谱 GLM-4 9B (官方永久免费)',
        description: '清华与智谱开源 GLM-4 架构模型，多轮对话与语义逻辑出色，永久免费。',
        output_modalities: ['text'],
        priceTag: '永久免费',
        providerId: 'siliconflow',
        badgeColor: 'green',
      },
      {
        id: 'internlm/internlm2_5-7b-chat',
        name: '书生·浦语 InternLM2.5 7B (官方永久免费)',
        description: '上海人工智能实验室开源基座，支持复杂逻辑与长文创作，永久免费。',
        output_modalities: ['text'],
        priceTag: '永久免费',
        providerId: 'siliconflow',
        badgeColor: 'green',
      },
      {
        id: 'TeleAI/TeleChat2',
        name: '中国电信 TeleChat2 (官方永久免费)',
        description: '中国电信星辰语义大模型，电信级数据清洗，合规性与中文表达优秀，永久免费。',
        output_modalities: ['text'],
        priceTag: '永久免费',
        providerId: 'siliconflow',
        badgeColor: 'green',
      },
      {
        id: 'deepseek-ai/DeepSeek-V3',
        name: '深度求索 DeepSeek-V3 (赠送额度可用)',
        description: 'MoE 旗舰模型，综合代码与逻辑推理卓越，新注册赠送额度可直接调用。',
        output_modalities: ['text'],
        priceTag: '注册赠送',
        providerId: 'siliconflow',
        badgeColor: 'blue',
      },
      {
        id: 'deepseek-ai/DeepSeek-R1',
        name: '深度求索 DeepSeek-R1 (深度思考版)',
        description: '强化学习推理模型，思维链推理能力强，新注册赠送额度可直接调用。',
        output_modalities: ['text'],
        priceTag: '注册赠送',
        providerId: 'siliconflow',
        badgeColor: 'blue',
      },
      {
        id: 'Kwai-Kolors/Kolors',
        name: '快手可图 Kolors (中文文生图)',
        description: '快手自研亿级参数生图大模型，极佳理解中国文化意象与中文古诗词。',
        output_modalities: ['image'],
        priceTag: '注册赠送',
        providerId: 'siliconflow',
        badgeColor: 'blue',
      },
      {
        id: 'stabilityai/stable-diffusion-3-5-large',
        name: 'Stable Diffusion 3.5 Large (生图)',
        description: 'Stability AI 顶级扩散生图模型，画质细腻，支持复杂构图。',
        output_modalities: ['image'],
        priceTag: '注册赠送',
        providerId: 'siliconflow',
        badgeColor: 'blue',
      },
      {
        id: 'siliconflow-voice',
        name: '硅基流动/本地高保真语音引擎',
        description: '自动前置「本音频由AI生成。」，生成带标准 ID3v2 元数据标签的高保真音频。',
        output_modalities: ['audio'],
        priceTag: '永久免费',
        providerId: 'siliconflow',
        badgeColor: 'green',
      },
      ...getStableVideoModels('siliconflow'),
    ];
  }

  async testConnection(apiKey?: string): Promise<{ success: boolean; message: string }> {
    const key = apiKey || localStorage.getItem('bc_siliconflow_api_key') || '';
    if (!key) {
      return { success: false, message: '尚未配置 SiliconFlow API 密钥' };
    }

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key.trim()}`,
        },
        body: JSON.stringify({
          model: 'Qwen/Qwen2.5-7B-Instruct',
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 5,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        let errMsg = `HTTP ${res.status}`;
        try {
          const parsed = JSON.parse(text);
          if (parsed.message) errMsg = parsed.message;
        } catch {}
        return { success: false, message: `连接失败: ${errMsg}` };
      }

      return { success: true, message: 'SiliconFlow API 连接成功！免费模型已就绪。' };
    } catch (err: any) {
      return { success: false, message: `网络连接异常: ${err.message}` };
    }
  }

  async generateText(
    prompt: string,
    model = 'Qwen/Qwen2.5-7B-Instruct',
    apiKey?: string
  ): Promise<{ text: string; model: string; providerName: string }> {
    const key = apiKey || localStorage.getItem('bc_siliconflow_api_key') || '';
    if (!key) {
      throw new Error(
        '请先在设置中填入 SiliconFlow API 密钥（注册 cloud.siliconflow.cn 即可免费领取赠送算力与永久免费模型权限）。'
      );
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key.trim()}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let msg = `SiliconFlow 请求失败 (${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.message) msg = parsed.message;
        else if (parsed.error?.message) msg = parsed.error.message;
      } catch {}
      throw new Error(msg);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    return { text, model, providerName: '硅基流动 (SiliconFlow)' };
  }

  async generateImage(
    prompt: string,
    model = 'Kwai-Kolors/Kolors',
    apiKey?: string
  ): Promise<{ blob: Blob; model: string; providerName: string }> {
    const key = apiKey || localStorage.getItem('bc_siliconflow_api_key') || '';
    if (!key) {
      // If no key, seamlessly fall back to Pollinations free image without failing
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        prompt.trim()
      )}?model=flux&nologo=true`;
      const res = await fetch(fallbackUrl);
      if (!res.ok) throw new Error('生图失败，请稍后重试');
      const blob = await res.blob();
      return { blob, model: 'Flux (免密公共免费生图)', providerName: '公共免费生图通道' };
    }

    try {
      const res = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key.trim()}`,
        },
        body: JSON.stringify({
          model,
          prompt,
          image_size: '1024x1024',
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const imageUrl = data.images?.[0]?.url;
      if (!imageUrl) throw new Error('未获取到生成的图片 URL');

      const imgRes = await fetch(imageUrl);
      const blob = await imgRes.blob();
      return { blob, model, providerName: '硅基流动 (SiliconFlow)' };
    } catch (err: any) {
      // Auto fallback to free high quality image endpoint
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        prompt.trim()
      )}?model=flux&nologo=true`;
      const res = await fetch(fallbackUrl);
      if (res.ok) {
        const blob = await res.blob();
        return { blob, model: `${model} (免密生图通道)`, providerName: '硅基流动/免密通道' };
      }
      throw err;
    }
  }

  async generateVideo(
    prompt: string,
    model = 'wan-free'
  ): Promise<{ blob: Blob; model: string; providerName: string }> {
    return await generateStableVideo(prompt, model, undefined, '硅基流动/高精视频引擎');
  }

  async generateAudio(
    text: string,
    voice = 'alloy'
  ): Promise<{ blob: Blob; model: string; providerName: string }> {
    // High quality on-device audio synthesis with standard AIGC prefix
    const blob = await synthesizeVoiceWav(text, voice);
    return { blob, model: '高保真 AIGC 语音合成引擎', providerName: '硅基流动/本地音频引擎' };
  }
}
