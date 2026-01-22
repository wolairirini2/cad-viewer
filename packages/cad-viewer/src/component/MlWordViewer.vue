<template>
  <div ref="viewerContainer" class="word-viewer"></div>
  <div v-if="loading" class="loading-overlay">
    <el-icon class="is-loading"><Loading /></el-icon>
    <span>正在加载文档...</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { renderAsync } from 'docx-preview'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'

const props = defineProps<{
  src: any // 文档URL
  highlightText?: string // 要高亮的文本
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
      setTimeout(() => highlightAndScroll(props.highlightText!), 300)
    }
  } catch (error) {
    console.error('Word文档渲染失败:', error)
    ElMessage.error('文档加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 🔥 智能文本规范化（核心修复）
const normalizeText = (text: string): string => {
  return (
    text
      // 统一各种空格（包括不间断空格\u00A0、全角空格\u3000等）
      .replace(/[\s\u00A0\u1680\u180e\u2000-\u2009\u202f\u205f\u3000]+/g, ' ')
      // 移除零宽度字符和不可见符号
      .replace(/[\u200b-\u200d\ufeff]/g, '')
      // 统一各种引号
      .replace(/[""'']/g, '"')
      // 统一各种连字符和破折号
      .replace(/[-‑‒–—]/g, '-')
      // 统一各种省略号
      .replace(/[…]/g, '...')
      // 移除文档渲染插入的特殊标记符号
      .replace(/[·.:：：]{2,}/g, '') // 移除连续的.、:、·等
      .trim()
  )
}

// 🔥 改进：保留序号标记，不移除（重要特征）
const splitTextToSegments = (text: string): string[] => {
  const paragraphs = text.split(/\n\s*\n/)
  return paragraphs.map(p => normalizeText(p)).filter(p => p.length > 0)
  // 不再移除序号标记！保留 (1), (2) 等重要特征
}

// 在文档中搜索匹配的文本区域（增强版）
const findMatchInDocument = (
  textNodes: Text[],
  searchText: string
): {
  startNode: Text
  endNode: Text
  startOffset: number
  endOffset: number
} | null => {
  // 1. 构建完整文档文本和节点映射
  let fullText = ''
  const nodeRanges: Array<{
    node: Text
    start: number
    end: number
    rawText: string
  }> = []

  textNodes.forEach(node => {
    const rawText = node.textContent || ''
    const normalized = normalizeText(rawText)
    const start = fullText.length
    fullText += normalized
    const end = fullText.length
    nodeRanges.push({ node, start, end, rawText })
  })

  // 2. 规范化搜索文本
  const normalizedSearch = normalizeText(searchText)

  // 3. 精确搜索，同时考虑字符可能被跨节点分割的情况
  let matchStart = -1

  // 先尝试直接匹配
  matchStart = fullText.indexOf(normalizedSearch)

  // 如果精确搜索失败，尝试特殊字符分割情况（如 "TFT-LCD" 可能渲染为 "TFT-LC" 和 "D"）
  if (matchStart === -1 && normalizedSearch.includes('-')) {
    console.log('⚠️ 精确匹配失败，尝试处理连字符分割情况...')

    // 移除连字符后再匹配
    const searchWithoutHyphen = normalizedSearch.replace(/-/g, '')
    const docWithoutHyphen = fullText.replace(/-/g, '')

    const hyphenMatchStart = docWithoutHyphen.indexOf(searchWithoutHyphen)

    if (hyphenMatchStart !== -1) {
      // 找到无连字符版本，尝试在原文本中定位近似位置
      // 寻找主要关键词（最长的词）
      const keywords = normalizedSearch.split(/\s+/).filter(w => w.length > 3)
      keywords.sort((a, b) => b.length - a.length)

      if (keywords.length > 0) {
        for (const keyword of keywords) {
          const keywordMatch = fullText.indexOf(keyword.replace(/-/g, ''))
          if (keywordMatch !== -1) {
            matchStart = Math.max(0, keywordMatch - 10) // 往前扩展一点
            break
          }
        }
      }
    }
  }

  // 4. 如果仍然找不到，尝试关键词模糊匹配
  if (matchStart === -1) {
    console.log('⚠️ 仍无法匹配，尝试关键词模糊搜索...')
    const keywords = normalizedSearch.split(/\s+/).filter(w => w.length > 3)
    keywords.sort((a, b) => b.length - a.length)

    if (keywords.length > 0) {
      const primaryKeyword = keywords[0]
      matchStart = fullText.indexOf(primaryKeyword)

      if (matchStart === -1) {
        // 仍然找不到，返回null
        return null
      }

      console.log('✅ 模糊匹配到关键词:', primaryKeyword, '位置:', matchStart)
      // 只高亮匹配到的关键词部分
      const matchEnd = matchStart + primaryKeyword.length

      // 辅助函数：将文本范围映射到DOM节点
      const mapRangeToNodes = (
        nodeRanges: Array<{
          node: Text
          start: number
          end: number
          rawText: string
        }>,
        matchStart: number,
        matchEnd: number
      ): {
        startNode: Text
        endNode: Text
        startOffset: number
        endOffset: number
      } | null => {
        let startNode: Text | null = null
        let endNode: Text | null = null
        let startOffset = 0
        let endOffset = 0

        for (const range of nodeRanges) {
          // 起始位置
          if (
            !startNode &&
            matchStart >= range.start &&
            matchStart < range.end
          ) {
            startNode = range.node
            const keywordStartInRaw = matchStart - range.start
            // 尝试在原始文本中找到关键词
            const snippet = normalizedSearch.substring(0, 20)
            const idxInRaw = range.rawText.indexOf(snippet)
            if (idxInRaw !== -1) {
              startOffset = idxInRaw
            } else {
              startOffset = Math.min(keywordStartInRaw, range.rawText.length)
            }
          }

          // 结束位置
          if (matchEnd > range.start && matchEnd <= range.end) {
            endNode = range.node
            const keywordEndInRaw = matchEnd - range.start
            endOffset = Math.min(keywordEndInRaw, range.rawText.length)
          }

          if (startNode && endNode) break
        }

        if (!startNode || !endNode) return null

        return { startNode, endNode, startOffset, endOffset }
      }
      return mapRangeToNodes(nodeRanges, matchStart, matchEnd)
    }

    return null
  }

  // 5. 精确匹配成功，映射到DOM节点
  const matchEnd = matchStart + normalizedSearch.length
  console.log('✅ 精确匹配成功，位置:', matchStart, '-', matchEnd)

  // 辅助函数：将文本范围映射到DOM节点
  const mapRangeToNodes = (
    nodeRanges: Array<{
      node: Text
      start: number
      end: number
      rawText: string
    }>,
    matchStart: number,
    matchEnd: number
  ): {
    startNode: Text
    endNode: Text
    startOffset: number
    endOffset: number
  } | null => {
    let startNode: Text | null = null
    let endNode: Text | null = null
    let startOffset = 0
    let endOffset = 0

    for (const range of nodeRanges) {
      // 起始位置
      if (!startNode && matchStart >= range.start && matchStart < range.end) {
        startNode = range.node
        const keywordStartInRaw = matchStart - range.start
        // 尝试在原始文本中找到关键词
        const snippet = normalizedSearch.substring(0, 20)
        const idxInRaw = range.rawText.indexOf(snippet)
        if (idxInRaw !== -1) {
          startOffset = idxInRaw
        } else {
          startOffset = Math.min(keywordStartInRaw, range.rawText.length)
        }
      }

      // 结束位置
      if (matchEnd > range.start && matchEnd <= range.end) {
        endNode = range.node
        const keywordEndInRaw = matchEnd - range.start
        endOffset = Math.min(keywordEndInRaw, range.rawText.length)
      }

      if (startNode && endNode) break
    }

    if (!startNode || !endNode) return null

    return { startNode, endNode, startOffset, endOffset }
  }

  return mapRangeToNodes(nodeRanges, matchStart, matchEnd)
}

// 修改：将多段落匹配改为逐个段落精确匹配
const findMatchingRegion = (
  textNodes: Text[],
  segments: string[]
): {
  startNode: Text
  endNode: Text
  startOffset: number
  endOffset: number
} | null => {
  if (segments.length === 0) return null

  // 🔥 修改：对于多个编号项（如(1)到(4)），只匹配第一个找到的段落
  // 这样可以避免跨段落匹配的复杂性
  for (const segment of segments) {
    if (segment.trim()) {
      const match = findMatchInDocument(textNodes, segment)
      if (match) {
        console.log('✅ 找到匹配段落:', segment.substring(0, 50))
        return match
      }
    }
  }

  return null
}
// 高亮区域（保持不变）
const highlightRegion = (
  region: {
    startNode: Text
    endNode: Text
    startOffset: number
    endOffset: number
  },
  isPrimary: boolean
): HTMLElement | null => {
  const { startNode, endNode, startOffset, endOffset } = region

  try {
    if (startNode === endNode) {
      return highlightSingleNode(startNode, startOffset, endOffset, isPrimary)
    } else {
      return highlightMultipleNodes(
        startNode,
        endNode,
        startOffset,
        endOffset,
        isPrimary
      )
    }
  } catch (error) {
    console.error('高亮区域失败:', error)
    return null
  }
}

// 高亮单个节点（保持不变）
const highlightSingleNode = (
  textNode: Text,
  startOffset: number,
  endOffset: number,
  isPrimary: boolean
): HTMLElement | null => {
  const text = textNode.textContent || ''
  const beforeText = text.substring(0, startOffset)
  const matchText = text.substring(startOffset, endOffset)
  const afterText = text.substring(endOffset)

  const highlight = document.createElement('mark')
  highlight.className = 'docx-highlight'
  if (isPrimary) {
    highlight.classList.add('primary-highlight')
  }
  highlight.textContent = matchText

  const fragment = document.createDocumentFragment()
  if (beforeText) fragment.appendChild(document.createTextNode(beforeText))
  fragment.appendChild(highlight)
  if (afterText) fragment.appendChild(document.createTextNode(afterText))

  textNode.parentNode?.replaceChild(fragment, textNode)
  return highlight
}

// 高亮多个节点（保持不变）
const highlightMultipleNodes = (
  startNode: Text,
  endNode: Text,
  startOffset: number,
  endOffset: number,
  isPrimary: boolean
): HTMLElement | null => {
  const nodesToHighlight: Array<{
    node: Text
    fullHighlight: boolean
    startOffset?: number
    endOffset?: number
  }> = []

  const walker = document.createTreeWalker(
    viewerContainer.value!,
    NodeFilter.SHOW_TEXT,
    null
  )

  let currentNode: Node | null = null
  let foundStart = false
  let foundEnd = false

  while ((currentNode = walker.nextNode()) && !foundEnd) {
    const textNode = currentNode as Text

    if (textNode === startNode) {
      foundStart = true
      nodesToHighlight.push({
        node: textNode,
        fullHighlight: false,
        startOffset: startOffset,
        endOffset: undefined
      })
    } else if (textNode === endNode) {
      foundEnd = true
      nodesToHighlight.push({
        node: textNode,
        fullHighlight: false,
        startOffset: 0,
        endOffset: endOffset
      })
    } else if (foundStart) {
      nodesToHighlight.push({
        node: textNode,
        fullHighlight: true
      })
    }
  }

  let firstHighlight: HTMLElement | null = null

  for (let i = nodesToHighlight.length - 1; i >= 0; i--) {
    const {
      node,
      fullHighlight,
      startOffset: offsetStart,
      endOffset: offsetEnd
    } = nodesToHighlight[i]

    if (fullHighlight) {
      const highlight = document.createElement('mark')
      highlight.className = 'docx-highlight'
      if (isPrimary) {
        highlight.classList.add('primary-highlight')
      }
      highlight.textContent = node.textContent || ''

      node.parentNode?.replaceChild(highlight, node)

      if (i === 0) {
        firstHighlight = highlight
      }
    } else if (offsetStart !== undefined) {
      const textLen = (node.textContent || '').length
      const endPos = offsetEnd !== undefined ? offsetEnd : textLen

      const highlight = highlightSingleNode(
        node,
        offsetStart,
        endPos,
        isPrimary
      )

      if (i === 0 && highlight) {
        firstHighlight = highlight
      }
    }
  }

  return firstHighlight
}

// 移除高亮（保持不变）
const removeHighlights = () => {
  if (!viewerContainer.value) return

  const highlights = viewerContainer.value.querySelectorAll(
    'mark.docx-highlight'
  )
  highlights.forEach(highlight => {
    const parent = highlight.parentNode
    if (parent) {
      parent.replaceChild(
        document.createTextNode(highlight.textContent || ''),
        highlight
      )
      parent.normalize()
    }
  })
}

// 主高亮和滚动函数（保持不变）
const highlightAndScroll = (text: string) => {
  if (!viewerContainer.value || !text) return

  removeHighlights()

  const segments = splitTextToSegments(text)
  if (segments.length === 0) return

  const walker = document.createTreeWalker(
    viewerContainer.value,
    NodeFilter.SHOW_TEXT,
    null
  )

  const textNodes: Text[] = []
  let node: Node | null

  while ((node = walker.nextNode())) {
    const parent = node.parentNode as HTMLElement
    if (parent && !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.nodeName)) {
      const textContent = node.textContent || ''
      if (textContent.trim().length > 0) {
        textNodes.push(node as Text)
      }
    }
  }

  const match = findMatchingRegion(textNodes, segments)

  if (!match) {
    ElMessage.warning('未找到要定位的内容')
    return
  }

  const highlight = highlightRegion(match, true)

  if (highlight) {
    setTimeout(() => {
      highlight.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })

      // highlight.animate(
      //   [
      //     { backgroundColor: 'var(--color-warning)' },
      //     { backgroundColor: 'var(--color-danger)' },
      //     { backgroundColor: 'var(--color-warning)' }
      //   ],
      //   {
      //     duration: 1000,
      //     iterations: 3
      //   }
      // )
    }, 100)
  }
}

watch(() => props.src, renderDocument)

watch(
  () => props.highlightText,
  newText => {
    if (newText && viewerContainer.value?.hasChildNodes()) {
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
  position: relative; /* 确保loading overlay定位正确 */
}

:deep(.docx-preview) {
  padding: 20px;
}

:deep(mark.docx-highlight) {
  // background-color: var(--color-warning);
  background-color: #edf50b;
  color: var(--color-text-primary);
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: bold;
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
