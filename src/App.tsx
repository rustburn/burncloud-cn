import { useState } from 'react';
import {
  Sparkles,
  FileCheck,
  GitFork,
  Settings as SettingsIcon,
  Shield,
  Menu,
  X,
  ExternalLink,
  Cpu,
  Globe,
  BookOpen,
  Share2,
} from 'lucide-react';
import { Generate } from './pages/Generate';
import { Verify } from './pages/Verify';
import { Flow } from './pages/Flow';
import { Settings } from './pages/Settings';

export type ActivePage = 'generate' | 'verify' | 'flow' | 'settings';

interface PublicPlatformLink {
  title: string;
  url: string;
  tag?: string;
  tagColor?: string;
  description: string;
}

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('generate');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'generate' as const, label: '生成', icon: Sparkles },
    { id: 'verify' as const, label: '文件验证', icon: FileCheck },
    { id: 'flow' as const, label: '算法流程', icon: GitFork },
    { id: 'settings' as const, label: '设置', icon: SettingsIcon },
  ];

  const computePlatforms: PublicPlatformLink[] = [
    {
      title: '硅基流动 SiliconFlow',
      url: 'https://cloud.siliconflow.cn/',
      tag: '国内免费',
      tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
      description: '多款国产开源大模型永久免费',
    },
    {
      title: '智谱 AI 开放平台',
      url: 'https://open.bigmodel.cn/',
      tag: 'GLM免费',
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'GLM-4-Flash 全员永久免费',
    },
    {
      title: '魔搭社区 ModelScope',
      url: 'https://modelscope.cn/',
      tag: '开源生态',
      tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
      description: '阿里达摩院 AI 开源模型生态',
    },
    {
      title: '阿里云百炼平台',
      url: 'https://bailian.console.aliyun.com/',
      tag: '通义千问',
      tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
      description: 'Qwen 全系列大模型应用平台',
    },
    {
      title: 'Pollinations AI',
      url: 'https://pollinations.ai/',
      tag: '全球免Key',
      tagColor: 'bg-zinc-100 text-zinc-700 border-zinc-200',
      description: '全球开源模型与免密生图路由',
    },
  ];

  const standardPlatforms: PublicPlatformLink[] = [
    {
      title: 'TC260 网安标委',
      url: 'https://www.tc260.org.cn/',
      tag: '国家标准',
      tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
      description: '生成式人工智能内容标识规范',
    },
    {
      title: '互联网算法备案系统',
      url: 'https://beian.cac.gov.cn/',
      tag: '合规备案',
      tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
      description: '国家网信办算法与深度合成备案',
    },
    {
      title: 'Hugging Face',
      url: 'https://huggingface.co/',
      tag: '开源社区',
      tagColor: 'bg-zinc-100 text-zinc-700 border-zinc-200',
      description: '全球开源 AI 模型与权重仓库',
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-zinc-200 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-zinc-900">
            BurnCloud AIGC
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Left Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-zinc-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:w-64 shrink-0 flex flex-col h-screen sticky top-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-zinc-200 flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-zinc-900 block leading-tight">
              BurnCloud AIGC
            </span>
            <span className="text-[11px] text-zinc-400 block leading-tight mt-0.5">
              内置 AIGC 标识系统
            </span>
          </div>
        </div>

        {/* Scrollable Navigation and Public Links */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {/* Main Navigation */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              系统功能
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActivePage(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-blue-600' : 'text-zinc-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Section 2: Public AI & Compute Platforms */}
          <div>
            <div className="flex items-center justify-between px-2 pb-1.5">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Cpu className="w-3 h-3 text-zinc-400" />
                <span>公共算力与平台</span>
              </span>
            </div>
            <div className="space-y-1">
              {computePlatforms.map((platform) => (
                <a
                  key={platform.title}
                  href={platform.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-zinc-100 transition-colors border border-transparent hover:border-zinc-200"
                  title={platform.description}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="text-zinc-700 group-hover:text-zinc-900 font-medium truncate text-[11px] flex items-center gap-1">
                      <span>{platform.title}</span>
                      <ExternalLink className="w-2.5 h-2.5 text-zinc-300 group-hover:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">
                      {platform.description}
                    </div>
                  </div>
                  {platform.tag && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-medium border shrink-0 ${
                        platform.tagColor || 'bg-zinc-100 text-zinc-600 border-zinc-200'
                      }`}
                    >
                      {platform.tag}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Section 3: Standards & Communities */}
          <div>
            <div className="flex items-center justify-between px-2 pb-1.5">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-zinc-400" />
                <span>合规规范与社区</span>
              </span>
            </div>
            <div className="space-y-1">
              {standardPlatforms.map((platform) => (
                <a
                  key={platform.title}
                  href={platform.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-zinc-100 transition-colors border border-transparent hover:border-zinc-200"
                  title={platform.description}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="text-zinc-700 group-hover:text-zinc-900 font-medium truncate text-[11px] flex items-center gap-1">
                      <span>{platform.title}</span>
                      <ExternalLink className="w-2.5 h-2.5 text-zinc-300 group-hover:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">
                      {platform.description}
                    </div>
                  </div>
                  {platform.tag && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-medium border shrink-0 ${
                        platform.tagColor || 'bg-zinc-100 text-zinc-600 border-zinc-200'
                      }`}
                    >
                      {platform.tag}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-zinc-200 text-[10px] text-zinc-400 space-y-0.5 bg-zinc-50 shrink-0">
          <div className="flex items-center justify-between font-medium text-zinc-600">
            <span>BurnCloud AIGC v1.2</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <p className="text-zinc-400 text-[10px] leading-tight">
            符合国家《生成式人工智能服务管理暂行办法》及标识规范要求
          </p>
        </div>
      </aside>

      {/* Overlay on mobile */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/20 z-10 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
        {activePage === 'generate' && (
          <Generate onNavigateToSettings={() => setActivePage('settings')} />
        )}
        {activePage === 'verify' && <Verify />}
        {activePage === 'flow' && <Flow />}
        {activePage === 'settings' && <Settings />}
      </main>
    </div>
  );
}
