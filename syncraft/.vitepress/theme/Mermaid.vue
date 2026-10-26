<script setup lang="ts">
import mermaid from 'mermaid'
import { nextTick, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'

/**
 * Drop-in replacement for `@vitepress-plugin/mermaid`'s component.
 *
 * The plugin initialises mermaid once at build time with a fixed theme, which
 * cannot follow VitePress' light/dark switch (and the `invert()` workaround
 * produced muddy colours). Here the diagram is rendered with the site's own
 * palette, read from the VitePress CSS variables at runtime, and re-rendered
 * whenever `isDark` changes.
 *
 * The markdown transform still produces `<mermaid id="..."><pre>source</pre>
 * </mermaid>`, and `.vitepress/theme/index.ts` registers this component under
 * the same name, so pages do not change.
 */
const props = defineProps<{ id: string }>()

const { isDark } = useData()

const container = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)

/** Guards against a stale render overwriting a newer one (per instance). */
let renderToken = 0

/** Read a VitePress colour token, falling back when it is not defined. */
function cssVar(name: string, fallback: string) {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  // Custom properties may resolve to an unresolved `var(...)` in some engines;
  // mermaid would blank such values, so prefer the fallback.
  return value && !value.includes('var(') ? value : fallback
}

function themeVariables() {
  const bg = cssVar('--vp-c-bg', '#ffffff')
  const bgAlt = cssVar('--vp-c-bg-alt', '#f6f6f7')
  const bgSoft = cssVar('--vp-c-bg-soft', '#f6f6f7')
  const text1 = cssVar('--vp-c-text-1', '#3c3c43')
  const text2 = cssVar('--vp-c-text-2', '#67676c')
  const noteSoft = cssVar('--vp-c-yellow-soft', bgSoft)
  const brand = cssVar('--vp-c-brand-1', '#3451b2')

  // Shapes use the "soft" surface with brand-blue outlines, text uses the normal
  // body text colour and wires use the secondary text colour, so the frame is
  // what carries the accent and the connectors stay quiet.
  return {
    background: bg,
    primaryColor: bgSoft,
    primaryTextColor: text1,
    primaryBorderColor: brand,
    secondaryColor: bgSoft,
    secondaryTextColor: text1,
    secondaryBorderColor: brand,
    tertiaryColor: bgAlt,
    tertiaryTextColor: text1,
    tertiaryBorderColor: brand,
    mainBkg: bgSoft,
    nodeBkg: bgSoft,
    nodeBorder: brand,
    nodeTextColor: text1,
    clusterBkg: bgAlt,
    clusterBorder: brand,
    defaultLinkColor: text2,
    lineColor: text2,
    textColor: text1,
    titleColor: text1,
    edgeLabelBackground: bg,
    arrowheadColor: text2,
    fontFamily: cssVar('--vp-font-family-base', 'sans-serif'),
    fontSize: '15px',

    // Sequence diagrams
    actorBkg: bgSoft,
    actorBorder: brand,
    actorTextColor: text1,
    actorLineColor: text2,
    signalColor: text2,
    signalTextColor: text1,
    labelBoxBkgColor: bgSoft,
    labelBoxBorderColor: brand,
    labelTextColor: text1,
    loopTextColor: text1,
    activationBkgColor: bgAlt,
    activationBorderColor: brand,
    sequenceNumberColor: bg,

    // Notes / class / ER
    noteBkgColor: noteSoft,
    noteTextColor: text1,
    noteBorderColor: brand,
    classText: text1,
    relationColor: text2,
    relationLabelBackground: bg,
    relationLabelColor: text1,

    // Gantt
    sectionBkgColor: bgAlt,
    altSectionBkgColor: bgSoft,
    sectionBkgColor2: bgSoft,
    taskBkgColor: bgSoft,
    taskBorderColor: brand,
    taskTextColor: text1,
    taskTextDarkColor: text1,
    taskTextLightColor: text1,
    taskTextOutsideColor: text1,
    activeTaskBkgColor: bgAlt,
    activeTaskBorderColor: brand,
    doneTaskBkgColor: bgAlt,
    doneTaskBorderColor: brand,
    critBkgColor: bgSoft,
    critBorderColor: cssVar('--vp-c-red-1', text1),
    gridColor: text2,
    todayLineColor: brand,

    // Pie / XY charts
    pie1: cssVar('--vp-c-brand-1', '#3451b2'),
    pie2: cssVar('--vp-c-green-1', '#18794e'),
    pie3: cssVar('--vp-c-yellow-1', '#915930'),
    pie4: cssVar('--vp-c-red-1', '#b8272c'),
    pie5: cssVar('--vp-c-purple-1', '#6f42c1'),
    pie6: cssVar('--vp-c-indigo-1', '#3451b2'),
    pie7: cssVar('--vp-c-gray-1', '#8e8e93'),
    pie8: cssVar('--vp-c-green-2', '#18794e'),
    pie9: cssVar('--vp-c-yellow-2', '#915930'),
    pie10: cssVar('--vp-c-red-2', '#b8272c'),
    pie11: cssVar('--vp-c-purple-2', '#6f42c1'),
    pie12: cssVar('--vp-c-gray-2', '#8e8e93'),
    pieSectionTextColor: bg,
    pieStrokeColor: bg,
    pieOuterStrokeColor: bg,
    pieTitleTextColor: text1,
    pieLegendTextColor: text1,
  }
}

async function render() {
  const source = content.value?.querySelector('pre')?.textContent?.trim()
  if (!source || !container.value) return

  const token = ++renderToken
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'base',
    themeVariables: themeVariables(),
  })

  try {
    // The id must be unique across *all* diagrams on the page: mermaid creates
    // and removes temporary nodes by id, so two diagrams sharing one id delete
    // each other's markup. `props.id` is generated per container at build time,
    // the suffix keeps re-renders (theme switch) distinct.
    const { svg } = await mermaid.render(
      `${props.id}-r${token}`,
      source
    )
    if (token === renderToken && container.value) container.value.innerHTML = svg
  } catch (error) {
    if (token !== renderToken || !container.value) return
    // Keep the source visible instead of leaving an empty box.
    container.value.textContent = source
    console.error('[mermaid]', error)
  }
}

onMounted(async () => {
  // `isDark` sets the `.dark` class on <html>; read the palette afterwards.
  await nextTick()
  void render()
})

watch(
  isDark,
  async () => {
    await nextTick()
    void render()
  },
  { flush: 'post' }
)
</script>

<template>
  <div ref="container" class="vp-mermaid-container" />
  <div ref="content" style="display: none">
    <slot />
  </div>
</template>
