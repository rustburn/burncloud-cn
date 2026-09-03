import { AigcProvider, ModelInfo } from './types';
import { synthesizeVoiceWav } from './localWebAudio';

export class PollinationsProvider implements AigcProvider {
  id = 'pollinations' as const;
  private baseUrl = 'https://gen.pollinations.ai';
  private cachedModels: ModelInfo[] | null = null;

  async testConnection(apiKey?: string): Promise<{ success: boolean; message: string }> {
    const key = apiKey || localStorage.getItem('bc_pollinations_api_key') || '';
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (key.trim()) {
        headers['Authorization'] = `Bearer ${key.trim()}`;
      }

      const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'openai',
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
        return { success: false, message: `测试失败: ${errMsg}` };
      }

      return { success: true, message: 'Pollinations API 可用！' };
    } catch (err: any) {
      return { success: false, message: `网络异常: ${err.message}` };
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    if (this.cachedModels) {
      return this.cachedModels;
    }

    try {
      const res = await fetch(`${this.baseUrl}/v1/models`, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const raw = await res.json();
      const list: any[] = Array.isArray(raw) ? raw : raw.data || [];

      const models: ModelInfo[] = list.map((item) => {
        const pricing = item.pricing;
        let priceTag: ModelInfo['priceTag'] = '付费';
        let badgeColor: ModelInfo['badgeColor'] = undefined;

        if (pricing && typeof pricing === 'object') {
          const numericValues = Object.entries(pricing)
            .filter(([k]) => k !== 'currency')
            .map(([, v]) => parseFloat(String(v)))
            .filter((n) => !isNaN(n));

          if (numericValues.length > 0) {
            const allZero = numericValues.every((v) => v === 0);
            priceTag = allZero ? '免费' : '付费';
            if (allZero) badgeColor = 'green';
          }
        }

        if (item.id && item.id.toLowerCase().includes('free')) {
          priceTag = '免费';
          badgeColor = 'green';
        }

        return {
          id: item.id,
          name: item.name || item.id,
          description: item.description,
          input_modalities: item.input_modalities || ['text'],
          output_modalities: (item.output_modalities || ['text']) as any,
          supported_endpoints: item.supported_endpoints || [],
          pricing: item.pricing || null,
          priceTag,
          providerId: 'pollinations',
          badgeColor,
        };
      });

      // Sort free models to top
      models.sort((a, b) => {
        if (a.priceTag === '免费' && b.priceTag !== '免费') return -1;
        if (a.priceTag !== '免费' && b.priceTag === '免费') return 1;
        return 0;
      });

      this.cachedModels = models;
      return models;
    } catch (err) {
      console.warn('Failed to fetch Pollinations models list:', err);
      return [
        {
          id: 'openai',
          name: 'OpenAI (GPT-4o)',
          output_modalities: ['text'],
          priceTag: '付费',
          providerId: 'pollinations',
        },
        {
          id: 'flux',
          name: 'Flux 基础视觉模型',
          output_modalities: ['image'],
          priceTag: '免费',
          providerId: 'pollinations',
          badgeColor: 'green',
        },
      ];
    }
  }

  selectDefaultModel(models: ModelInfo[], modality: 'text' | 'image' | 'video' | 'audio'): string {
    const filtered = models.filter((m) => m.output_modalities?.includes(modality));
    if (filtered.length === 0) {
      if (modality === 'text') return 'openai';
      if (modality === 'image') return 'flux';
      if (modality === 'video') return 'happyhorse-1.1';
      if (modality === 'audio') return 'kokoro';
      return '';
    }

    const freeModels = filtered.filter((m) => m.priceTag === '免费' || m.priceTag === '永久免费');
    if (freeModels.length > 0) {
      return freeModels[0].id;
    }

    const preferred: Record<string, string[]> = {
      text: ['openai', 'openai-fast', 'google/gemini-2.5-flash-lite'],
      image: ['flux', 'turbo', 'zimage'],
      video: ['happyhorse-1.1', 'seedance-2.0-fast', 'wan-3.0'],
      audio: ['kokoro', 'grok-tts', 'elevenlabs'],
    };

    for (const pref of preferred[modality] || []) {
      const match = filtered.find((m) => m.id === pref || m.id.toLowerCase().includes(pref));
      if (match) return match.id;
    }

    return filtered[0].id;
  }

  async generateText(
    prompt: string,
    model = 'openai',
    apiKey?: string
  ): Promise<{ text: string; model: string; providerName: string }> {
    const key = apiKey || localStorage.getItem('bc_pollinations_api_key') || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (key.trim()) {
      headers['Authorization'] = `Bearer ${key.trim()}`;
    }

    const payload = {
      model,
      messages: [{ role: 'user', content: prompt }],
    };

    const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.text();
      let msg = `Text generation failed (HTTP ${res.status})`;
      try {
        const parsed = JSON.parse(errBody);
        if (parsed.error?.message) msg = parsed.error.message;
      } catch {}
      throw new Error(msg);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    return { text, model, providerName: 'Pollinations AI' };
  }

  async generateImage(
    prompt: string,
    model = 'flux',
    apiKey?: string
  ): Promise<{ blob: Blob; model: string; providerName: string }> {
    const key = apiKey || localStorage.getItem('bc_pollinations_api_key') || '';
    const encodedPrompt = encodeURIComponent(prompt.trim());
    let url = `${this.baseUrl}/image/${encodedPrompt}?model=${encodeURIComponent(model)}&nologo=true`;

    if (key.trim()) {
      url += `&key=${encodeURIComponent(key.trim())}`;
    }

    const res = await fetch(url);
    if (!res.ok) {
      const errBody = await res.text();
      let msg = `Image generation failed (HTTP ${res.status})`;
      try {
        const parsed = JSON.parse(errBody);
        if (parsed.error?.message) msg = parsed.error.message;
      } catch {}
      throw new Error(msg);
    }

    const blob = await res.blob();
    return { blob, model, providerName: 'Pollinations AI' };
  }

  async generateVideo(
    prompt: string,
    model = 'happyhorse-1.1',
    apiKey?: string
  ): Promise<{ blob: Blob; model: string; providerName: string }> {
    const key = apiKey || localStorage.getItem('bc_pollinations_api_key') || '';
    const encodedPrompt = encodeURIComponent(prompt.trim());
    let url = `${this.baseUrl}/video/${encodedPrompt}?model=${encodeURIComponent(model)}`;

    if (key.trim()) {
      url += `&key=${encodeURIComponent(key.trim())}`;
    }

    const res = await fetch(url);
    if (!res.ok) {
      const errBody = await res.text();
      let msg = `Video generation failed (HTTP ${res.status})`;
      try {
        const parsed = JSON.parse(errBody);
        if (parsed.error?.message) msg = parsed.error.message;
      } catch {}
      throw new Error(msg);
    }

    const blob = await res.blob();
    return { blob, model, providerName: 'Pollinations AI' };
  }

  async generateAudio(
    text: string,
    voice = 'alloy',
    model = 'kokoro',
    apiKey?: string
  ): Promise<{ blob: Blob; model: string; providerName: string }> {
    const key = apiKey || localStorage.getItem('bc_pollinations_api_key') || '';
    if (!key.trim()) {
      // Fall back to high-fidelity local voice engine so user never gets 401
      const blob = await synthesizeVoiceWav(text, voice);
      return { blob, model: '内置高保真语音引擎 (免Key)', providerName: '本地音频合成引擎' };
    }

    try {
      const payload = { model, input: text, voice };
      const res = await fetch(`${this.baseUrl}/v1/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key.trim()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const blob = await res.blob();
      return { blob, model, providerName: 'Pollinations AI' };
    } catch {
      // Graceful fallback
      const blob = await synthesizeVoiceWav(text, voice);
      return { blob, model: '高保真语音合成 (自动降级免Key)', providerName: '本地音频合成引擎' };
    }
  }
}
