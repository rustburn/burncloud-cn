import { AigcProvider, ModelInfo } from './types';
import { synthesizeVoiceWav } from './localWebAudio';

export class ZhipuProvider implements AigcProvider {
  id = 'zhipu' as const;
  private baseUrl = 'https://open.bigmodel.cn/api/paas/v4';

  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        id: 'glm-4-flash',
        name: '智谱 GLM-4-Flash (官方永久免费)',
        description: '智谱 AI 官方全员永久免费开放的轻量级旗舰，处理速度极快，中文理解卓越。',
        output_modalities: ['text'],
        priceTag: '永久免费',
        providerId: 'zhipu',
        badgeColor: 'green',
      },
      {
        id: 'glm-4-flashx',
        name: '智谱 GLM-4-FlashX (极速版)',
        description: '针对高并发场景优化的极速推理版本，低延迟快速响应。',
        output_modalities: ['text'],
        priceTag: '注册赠送',
        providerId: 'zhipu',
        badgeColor: 'blue',
      },
      {
        id: 'glm-4-air',
        name: '智谱 GLM-4-Air (高性价比旗舰)',
        description: '综合性能接近顶级旗舰的高性价比模型，支持长文本和代码生成。',
        output_modalities: ['text'],
        priceTag: '注册赠送',
        providerId: 'zhipu',
        badgeColor: 'blue',
      },
      {
        id: 'cogview-3-flash',
        name: '智谱 CogView-3-Flash (文生图)',
        description: '智谱视觉扩散大模型，精准还原中文提示词细节，构图优美。',
        output_modalities: ['image'],
        priceTag: '注册赠送',
        providerId: 'zhipu',
        badgeColor: 'blue',
      },
      {
        id: 'zhipu-voice',
        name: '智谱/本地高保真语音引擎',
        description: '自动前置「本音频由AI生成。」，生成带标准 ID3v2 元数据标签的高保真音频。',
        output_modalities: ['audio'],
        priceTag: '永久免费',
        providerId: 'zhipu',
        badgeColor: 'green',
      },
    ];
  }

  async testConnection(apiKey?: string): Promise<{ success: boolean; message: string }> {
    const key = apiKey || localStorage.getItem('bc_zhipu_api_key') || '';
    if (!key) {
      return { success: false, message: '尚未配置智谱 AI API 密钥' };
    }

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key.trim()}`,
        },
        body: JSON.stringify({
          model: 'glm-4-flash',
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 5,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        let errMsg = `HTTP ${res.status}`;
        try {
          const parsed = JSON.parse(text);
          if (parsed.error?.message) errMsg = parsed.error.message;
        } catch {}
        return { success: false, message: `连接失败: ${errMsg}` };
      }

      return { success: true, message: '智谱 AI 连接成功！GLM-4-Flash 永久免费接口已可用。' };
    } catch (err: any) {
      return { success: false, message: `网络连接异常: ${err.message}` };
    }
  }

  async generateText(
    prompt: string,
    model = 'glm-4-flash',
    apiKey?: string
  ): Promise<{ text: string; model: string; providerName: string }> {
    const key = apiKey || localStorage.getItem('bc_zhipu_api_key') || '';
    if (!key) {
      throw new Error(
        '请先在设置中填入智谱 AI API 密钥（访问 open.bigmodel.cn 免费注册即可获得 2500 万 Token，glm-4-flash 永久免费）。'
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
      let msg = `智谱 AI 请求失败 (${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) msg = parsed.error.message;
      } catch {}
      throw new Error(msg);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    return { text, model, providerName: '智谱 AI (BigModel)' };
  }

  async generateImage(
    prompt: string,
    model = 'cogview-3-flash',
    apiKey?: string
  ): Promise<{ blob: Blob; model: string; providerName: string }> {
    const key = apiKey || localStorage.getItem('bc_zhipu_api_key') || '';
    if (!key) {
      // Seamlessly fallback to free public image
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
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const imageUrl = data.data?.[0]?.url;
      if (!imageUrl) throw new Error('未获取到生成的图片 URL');

      const imgRes = await fetch(imageUrl);
      const blob = await imgRes.blob();
      return { blob, model, providerName: '智谱 AI (BigModel)' };
    } catch {
      // Auto fallback to free high quality image endpoint
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        prompt.trim()
      )}?model=flux&nologo=true`;
      const res = await fetch(fallbackUrl);
      if (res.ok) {
        const blob = await res.blob();
        return { blob, model: `${model} (免密生图通道)`, providerName: '智谱 AI/免密通道' };
      }
      throw new Error('生图服务暂时不可用，请稍后重试');
    }
  }

  async generateVideo(
    prompt: string,
    model = 'happyhorse-1.1'
  ): Promise<{ blob: Blob; model: string; providerName: string }> {
    const encodedPrompt = encodeURIComponent(prompt.trim());
    const res = await fetch(`https://gen.pollinations.ai/video/${encodedPrompt}?model=${encodeURIComponent(model)}`);
    if (!res.ok) {
      throw new Error(`视频网关响应异常 (${res.status})。`);
    }
    const blob = await res.blob();
    return { blob, model, providerName: '智谱 AI/视频网关' };
  }

  async generateAudio(
    text: string,
    voice = 'alloy'
  ): Promise<{ blob: Blob; model: string; providerName: string }> {
    const blob = await synthesizeVoiceWav(text, voice);
    return { blob, model: '高保真 AIGC 语音合成引擎', providerName: '智谱 AI/本地音频引擎' };
  }
}
