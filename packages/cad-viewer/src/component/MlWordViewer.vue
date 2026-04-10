<template>
  <div ref="viewerContainer" class="word-viewer"></div>
  <div v-if="loading" class="loading-overlay">
    <el-icon class="is-loading"><Loading /></el-icon>
    <span>正在加载文档...</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { renderAsync } from 'docx-preview'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'

const props = defineProps<{
  src: any
  highlightText?: string
}>()

const viewerContainer = ref<HTMLElement>()
const loading = ref(false)

// 渲染文档
const renderDocument = async () => {
  if (!props.src || !viewerContainer.value) return

  loading.value = true
  try {
    viewerContainer.value.innerHTML = ''
    const response = await fetch(props.src)
    const blob = await response.blob()

    await renderAsync(blob, viewerContainer.value, null as any, {
      className: 'docx-preview',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      breakPages: true,
      ignoreFonts: false,
      debug: false,
      experimental: true,
      trimXmlDeclaration: true,
      ignoreLastRenderedPageBreak: false,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true
    })

    if (props.highlightText) {
      await nextTick()
      setTimeout(() => highlightAndScroll(props.highlightText!), 300)
    }
  } catch (error) {
    console.error('Word文档渲染失败:', error)
    ElMessage.error('文档加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 文本清理：保留中文字符、字母、数字，用于模糊匹配
const extractKeyChars = (text: string): string => {
  return text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '')
}

// 获取所有文本节点
const getAllTextNodes = (container: HTMLElement): Text[] => {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    node => {
      const parent = node.parentElement
      if (parent && ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT
      }
      return node.textContent?.trim().length
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT
    }
  )

  const nodes: Text[] = []
  let node: Node | null
  while ((node = walker.nextNode())) {
    nodes.push(node as Text)
  }
  return nodes
}

// 查找文本起始位置（返回节点和偏移量）
const findTextStart = (
  textNodes: Text[],
  searchText: string
): { node: Text; offset: number } | null => {
  // 取搜索文本的前100个字符作为定位锚点
  const anchor = searchText
    .substring(0, Math.min(100, searchText.length))
    .trim()
  const keyAnchor = extractKeyChars(anchor)

  if (!keyAnchor) return null

  // 构建文本映射
  let fullText = ''
  const ranges: Array<{ node: Text; start: number; text: string }> = []

  for (const node of textNodes) {
    const text = node.textContent || ''
    ranges.push({ node, start: fullText.length, text })
    fullText += text
  }

  // 先尝试精确匹配锚点
  let index = fullText.indexOf(anchor)

  // 如果失败，尝试清理后的模糊匹配
  if (index === -1) {
    const cleanFullText = extractKeyChars(fullText)
    const cleanAnchor = extractKeyChars(anchor)
    index = cleanFullText.indexOf(cleanAnchor)

    if (index !== -1) {
      // 将清理后的索引映射回原始文本索引（近似）
      index = mapCleanIndexToOriginal(fullText, index)
    }
  }

  if (index === -1) return null

  // 映射到具体节点
  for (const range of ranges) {
    if (index >= range.start && index < range.start + range.text.length) {
      return {
        node: range.node,
        offset: index - range.start
      }
    }
  }

  return null
}

// 查找文本结束位置（从后往前找）
const findTextEnd = (
  textNodes: Text[],
  searchText: string
): { node: Text; offset: number } | null => {
  // 取搜索文本的后100个字符作为定位锚点
  const anchor = searchText
    .substring(Math.max(0, searchText.length - 100))
    .trim()
  const keyAnchor = extractKeyChars(anchor)

  if (!keyAnchor) return null

  let fullText = ''
  const ranges: Array<{ node: Text; start: number; text: string }> = []

  for (const node of textNodes) {
    const text = node.textContent || ''
    ranges.push({ node, start: fullText.length, text })
    fullText += text
  }

  // 先尝试精确匹配（从后往前）
  let index = fullText.lastIndexOf(anchor)

  // 如果失败，尝试清理后的模糊匹配
  if (index === -1) {
    const cleanFullText = extractKeyChars(fullText)
    const cleanAnchor = extractKeyChars(anchor)
    index = cleanFullText.lastIndexOf(cleanAnchor)

    if (index !== -1) {
      index = mapCleanIndexToOriginal(fullText, index + cleanAnchor.length)
    } else {
      return null
    }
  } else {
    index = index + anchor.length
  }

  // 映射到具体节点
  for (const range of ranges) {
    if (index > range.start && index <= range.start + range.text.length) {
      return {
        node: range.node,
        offset: index - range.start
      }
    }
  }

  return null
}

// 将清理后的文本索引映射回原始文本索引
const mapCleanIndexToOriginal = (
  originalText: string,
  cleanIndex: number
): number => {
  let cleanCount = 0
  for (let i = 0; i < originalText.length; i++) {
    if (/[\u4e00-\u9fa5a-zA-Z0-9]/.test(originalText[i])) {
      if (cleanCount === cleanIndex) return i
      cleanCount++
    }
  }
  return originalText.length
}

// 高亮指定范围内的所有内容（包括中间的所有节点）
const highlightRange = (
  startInfo: { node: Text; offset: number },
  endInfo: { node: Text; offset: number }
): HTMLElement | null => {
  const { node: startNode, offset: startOffset } = startInfo
  const { node: endNode, offset: endOffset } = endInfo

  // 收集所有需要高亮的文本节点
  const nodesToProcess: Array<{
    node: Text
    type: 'start' | 'middle' | 'end'
    startOffset?: number
    endOffset?: number
  }> = []

  if (startNode === endNode) {
    // 同一个节点内
    nodesToProcess.push({
      node: startNode,
      type: 'start',
      startOffset,
      endOffset
    })
  } else {
    // 跨节点：先收集起始节点
    nodesToProcess.push({
      node: startNode,
      type: 'start',
      startOffset
    })

    // 遍历收集中间节点
    let current: Node | null = startNode
    let found = false
    let safetyCounter = 0 // 防止无限循环

    while (current && !found && safetyCounter < 1000) {
      safetyCounter++
      let next = getNextTextNode(current)

      while (next && next !== endNode) {
        nodesToProcess.push({
          node: next,
          type: 'middle'
        })
        next = getNextTextNode(next)
      }

      if (next === endNode) {
        nodesToProcess.push({
          node: endNode,
          type: 'end',
          endOffset
        })
        found = true
      }

      current = next
    }
  }

  // 从后往前处理，避免节点替换影响遍历
  let firstHighlightEl: HTMLElement | null = null

  for (let i = nodesToProcess.length - 1; i >= 0; i--) {
    const { node, type, startOffset: sOff, endOffset: eOff } = nodesToProcess[i]

    // 检查节点是否仍在DOM中（可能被之前的替换操作移除）
    if (!node.parentNode) continue

    const text = node.textContent || ''
    let highlightEl: HTMLElement | null = null

    if (type === 'start') {
      // 起始节点：高亮从startOffset到末尾
      const before = text.substring(0, sOff!)
      const match = text.substring(sOff!)

      const fragment = document.createDocumentFragment()
      if (before) fragment.appendChild(document.createTextNode(before))

      highlightEl = document.createElement('mark')
      highlightEl.className = 'docx-highlight'
      highlightEl.textContent = match
      fragment.appendChild(highlightEl)

      node.parentNode?.replaceChild(fragment, node)
    } else if (type === 'end') {
      // 结束节点：高亮从开头到endOffset
      const match = text.substring(0, eOff!)
      const after = text.substring(eOff!)

      const fragment = document.createDocumentFragment()
      highlightEl = document.createElement('mark')
      highlightEl.className = 'docx-highlight'
      highlightEl.textContent = match
      fragment.appendChild(highlightEl)

      if (after) fragment.appendChild(document.createTextNode(after))
      node.parentNode?.replaceChild(fragment, node)
    } else {
      // 中间节点：全部高亮
      highlightEl = document.createElement('mark')
      highlightEl.className = 'docx-highlight'
      highlightEl.textContent = text
      node.parentNode?.replaceChild(highlightEl, node)
    }

    if (i === 0) firstHighlightEl = highlightEl
  }

  return firstHighlightEl
}

// 获取下一个文本节点（跨标签遍历）
const getNextTextNode = (node: Node): Text | null => {
  // 先尝试nextSibling
  let next: Node | null = node.nextSibling

  while (!next && node.parentNode) {
    node = node.parentNode
    next = node.nextSibling
  }

  // 如果nextSibling是元素，深入查找其第一个文本子节点
  while (next && next.nodeType === Node.ELEMENT_NODE) {
    const walker = document.createTreeWalker(next, NodeFilter.SHOW_TEXT, null)
    const firstText = walker.nextNode() as Text
    if (firstText && firstText.textContent?.trim()) {
      return firstText
    }
    next = next.nextSibling
  }

  // 如果是文本节点直接返回
  if (next && next.nodeType === Node.TEXT_NODE) {
    return next as Text
  }

  // 继续向上查找
  if (next) {
    return getNextTextNode(next)
  }

  return null
}

// 移除高亮 - 修复：确保能清除所有高亮
const removeHighlights = () => {
  if (!viewerContainer.value) return

  // 使用 viewerContainer 作为范围，避免影响外部DOM
  const highlights = viewerContainer.value.querySelectorAll(
    'mark.docx-highlight'
  )

  if (highlights.length === 0) return

  console.log(`清除 ${highlights.length} 个高亮标记`)

  highlights.forEach(highlight => {
    const parent = highlight.parentNode
    if (parent) {
      // 创建文本节点替换高亮标记
      const text = highlight.textContent || ''
      parent.replaceChild(document.createTextNode(text), highlight)
    }
  })

  // 合并相邻的文本节点，清理DOM
  viewerContainer.value.normalize()
}

// 主高亮函数：先找首尾，再高亮中间
// 修复：每次调用都清除之前的高亮，不管是否是相同文本
const highlightAndScroll = (text: string) => {
  if (!viewerContainer.value) return

  // 关键修复：每次高亮前都清除之前的高亮，不管text是否相同
  removeHighlights()

  // 如果text为空，只清除不高亮
  if (!text) return

  const textNodes = getAllTextNodes(viewerContainer.value)
  if (textNodes.length === 0) return

  // 分别查找起始和结束位置
  const startInfo = findTextStart(textNodes, text)
  const endInfo = findTextEnd(textNodes, text)

  if (!startInfo) {
    console.warn('未找到起始位置')
    ElMessage.warning('未找到要定位的内容')
    return
  }

  // 如果找不到结束位置，就高亮从起始位置开始的500个字符
  if (
    !endInfo ||
    (startInfo.node === endInfo.node && startInfo.offset >= endInfo.offset)
  ) {
    console.log('未找到结束位置，使用备用方案高亮前500字符')
    const text = startInfo.node.textContent || ''
    const endOffset = Math.min(startInfo.offset + 500, text.length)

    const highlightEl = highlightRange(startInfo, {
      node: startInfo.node,
      offset: endOffset
    })

    if (highlightEl) {
      scrollToHighlight(highlightEl)
    }
    return
  }

  // 正常情况：高亮从起始到结束的完整范围
  const highlightEl = highlightRange(startInfo, endInfo)

  if (highlightEl) {
    scrollToHighlight(highlightEl)
  }
}

// 滚动到高亮位置并添加动画
const scrollToHighlight = (element: HTMLElement) => {
  setTimeout(() => {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })

    // 添加闪烁动画
    element.animate?.(
      [
        { backgroundColor: '#edf50b' },
        { backgroundColor: '#ff9500' },
        { backgroundColor: '#edf50b' }
      ],
      { duration: 800, iterations: 2 }
    )
  }, 100)
}

// 监听src变化，重新渲染
watch(() => props.src, renderDocument)

// 监听highlightText变化 - 修复：处理空字符串情况
watch(
  () => props.highlightText,
  async newText => {
    // 注意：这里要处理 undefined 和空字符串的情况
    if (newText === undefined) return

    if (viewerContainer.value?.hasChildNodes()) {
      await nextTick()
      // 延迟执行，确保DOM已更新
      setTimeout(() => highlightAndScroll(newText), 100)
    }
  }
)

onMounted(() => {
  renderDocument()
})
</script>

<style scoped lang="scss">
.word-viewer {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background: white;
  position: relative;
}
:deep(.docx-preview-wrapper) {
  align-items: flex-start!important;
}

:deep(.docx-preview) {
  padding: 20px;
}

:deep(mark.docx-highlight) {
  background-color: #edf50b;
  color: #000;
  padding: 2px 0;
  border-radius: 2px;
  font-weight: bold;
  display: inline;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}

/* 加载动画遮罩 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 100;
}

.loading-overlay .el-icon {
  font-size: 32px;
  margin-bottom: 12px;
  color: var(--color-primary);
}

.loading-overlay span {
  color: var(--color-gray-700);
  font-size: 14px;
}
</style>
