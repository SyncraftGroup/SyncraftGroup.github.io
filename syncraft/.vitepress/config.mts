import { defineConfig } from 'vitepress'
import type { Plugin } from 'vite'
import mermaidPlugin from '@vitepress-plugin/mermaid'

/**
 * `@vitepress-plugin/mermaid` only understands its own `:::mermaid` container.
 * Rewrite fenced ```mermaid blocks into that container so both syntaxes render
 * (existing pages keep working without being edited).
 *
 * The rewrite runs before the mermaid plugin and before VitePress turns the
 * markdown into Vue, and deliberately uses column 0 for the container because
 * the plugin matches the marker with `startsWith`.
 */
function mermaidFences(): Plugin {
  const openFence = /^[ \t]*(`{3,}|~{3,})[ \t]*([A-Za-z0-9_+-]*)[^\n]*$/

  /** A closing fence is the same character, repeated at least as often. */
  const isClosing = (line: string, marker: string) => {
    const text = line.trim()
    return text.length >= marker.length && text === marker[0].repeat(text.length)
  }

  return {
    name: 'syncraft:mermaid-fences',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('.md')) return null

      const lines = code.split('\n')
      const out: string[] = []
      let changed = false

      for (let i = 0; i < lines.length; i++) {
        const open = lines[i].match(openFence)
        if (!open) {
          out.push(lines[i])
          continue
        }

        const marker = open[1]
        const lang = open[2]

        // Collect the whole block; nested fences inside code samples are body
        // because they use a shorter marker than the enclosing fence.
        const body: string[] = []
        let j = i + 1
        while (j < lines.length && !isClosing(lines[j], marker)) {
          body.push(lines[j])
          j++
        }

        if (lang === 'mermaid') {
          // The plugin escapes `<`/`>` and drops blank lines itself.
          out.push(':::mermaid', ...body, ':::')
          changed = true
        } else {
          out.push(lines[i], ...body)
          if (j < lines.length) out.push(lines[j])
        }

        i = j
      }

      return changed ? { code: out.join('\n'), map: null } : null
    }
  }
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/syncraft/",
  vite: {
    plugins: [
      // mermaidFences(),
      mermaidPlugin(),
    ],
  },
  title: "Syncraft Launcher Docs",
  description: "The official documents of Syncraft.",
  head: [
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/syncraft/favicon.ico' }]
  ],
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
          { text: '多服务器', link: '/quick-start/multi-server' },
          { text: '配置文件', link: '/quick-start/config-file' },
        ]
      },
      {
        text: '使用功能',
        collapsed: false,
        items: [
          { text: '歇一歇', link: '/features/' },
          { text: '文件同步', link: '/features/file-sync' },
          { text: '同步机制详解', link: '/features/sync-internals' },
          { text: '账号管理', link: '/features/account' },
          { text: '指令脚本', link: '/features/scripts' },
        ]
      },
      {
        text: '操作示例',
        collapsed: false,
        items: [
          { text: '自定义邮件模板', link: '/examples/email-template' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/SyncraftGroup/syncraft-server' }
    ]
  }
})
