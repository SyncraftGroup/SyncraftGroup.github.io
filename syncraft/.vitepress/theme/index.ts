import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import Mermaid from './Mermaid.vue'
import './mermaid.css'

/**
 * The mermaid plugin registers its own fixed-theme component under the
 * `mermaid` name when it patches the client entry. VitePress runs a theme's
 * `enhanceApp` after that injection, so registering here overrides it with the
 * theme-aware renderer (see `Mermaid.vue`).
 */
const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('mermaid', Mermaid)
  },
}

export default theme
