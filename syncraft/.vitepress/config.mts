import { defineConfig } from 'vitepress'
import mermaidPlugin from '@vitepress-plugin/mermaid'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/syncraft/",
  vite: {
    plugins: [
      mermaidPlugin(),
    ],
  },
  title: "Syncraft Launcher Docs",
  description: "The official documents of Syncraft.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Docs', link: '/intro/' }
    ],

    sidebar: [
      {
        text: '简介',
        collapsed: false,
        items: [
          { text: '设计理念', link: '/intro/' },
          { text: '讲故事', link: '/intro/story' },
          { text: '技术栈', link: '/intro/tech-stack' },
        ]
      },
      {
        text: '快速开始',
        collapsed: false,
        items: [
          { text: '概览', link: '/quick-start/' },
          { text: '环境检查', link: '/quick-start/environment' },
          { text: '安装', link: '/quick-start/installation' },
          { text: '配置文件', link: '/quick-start/config-file' },
        ]
      },
      {
        text: '使用功能',
        collapsed: false,
        items: [
          { text: '歇一歇', link: '/features/' },
          { text: '文件同步', link: '/features/file-sync' },
          { text: '账号管理', link: '/features/account' },
          { text: '指令脚本', link: '/features/scripts' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/SyncraftGroup/syncraft-server' }
    ]
  }
})
