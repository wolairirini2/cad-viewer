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
  console.log('正在渲染文档...', props.src)

  if (!props.src || !viewerContainer.value) return

  loading.value = true // 🔄 显示加载动画

  try {
    viewerContainer.value.innerHTML = ''
    const response = await fetch(props.src)
    const blob = await response.blob()
    console.log('文档加载成功', blob)

    await renderAsync(blob, viewerContainer.value, null as any, {
      className: 'docx-preview',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      breakPages: true,
      ignoreFonts: false,
      debug: false,
      // 新增配置
      experimental: true, // 启用实验性功能，改善样式保真度
      trimXmlDeclaration: true,
      ignoreLastRenderedPageBreak: false,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true
    })
    if (props.highlightText) {
      setTimeout(() => highlightAndScroll(props.highlightText!), 500)
    }
  } catch (error) {
    console.error('Word文档渲染失败:', error)
    ElMessage.error('文档加载失败，请稍后重试')
  } finally {
    loading.value = false // ✅ 隐藏加载动画
  }
}
// 文本规范化处理
const normalizeText = (text: string): string => {
  return text.replace(/\s+/g, ' ').trim()
}

// 将文本分割成可匹配的段落
const splitTextToSegments = (text: string): string[] => {
  const paragraphs = text.split(/\n\s*\n/)
  return paragraphs.map(p => normalizeText(p)).filter(p => p.length > 0)
}

// 查找从第一段到最后一段的完整匹配区域 - 流式匹配最终版
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

  const firstSegment = segments[0]
  const lastSegment = segments[segments.length - 1]

  // 情况1：只有一个段落（首尾相同）
  if (firstSegment === lastSegment) {
    for (let i = 0; i < textNodes.length; i++) {
      const nodeText = normalizeText(textNodes[i].textContent || '')
      const index = nodeText.indexOf(firstSegment)
      
      if (index !== -1) {
        return {
          startNode: textNodes[i],
          endNode: textNodes[i],
          startOffset: index,
          endOffset: index + firstSegment.length
        }
      }
    }
    return null
  }

  // 情况2：多个段落需要跨节点匹配

  // 步骤2.1：构建节点位置映射表
  const nodeMap = textNodes.map((node, index) => ({
    node,
    index,
    text: normalizeText(node.textContent || ''),
    startPos: 0, // 在拼接文本中的起始位置
    endPos: 0    // 在拼接文本中的结束位置
  }))

  // 计算每个节点在虚拟拼接文本中的位置
  let currentPos = 0
  nodeMap.forEach(item => {
    item.startPos = currentPos
    item.endPos = currentPos + item.text.length
    currentPos = item.endPos
  })

  // 步骤2.2：将所有文本拼接成一个完整文本
  const fullText = nodeMap.map(item => item.text).join('')
  
  // 步骤2.3：在完整文本中搜索首尾位置
  const firstGlobalStart = fullText.indexOf(firstSegment)
  const lastGlobalStart = fullText.lastIndexOf(lastSegment)
  
  if (firstGlobalStart === -1 || lastGlobalStart === -1) return null
  
  // 确保尾段在首段之后
  if (lastGlobalStart <= firstGlobalStart) return null

  const lastGlobalEnd = lastGlobalStart + lastSegment.length

  // 步骤2.4：将全局位置映射回节点和偏移量
  let startNode: Text | null = null
  let endNode: Text | null = null
  let startOffset = 0
  let endOffset = 0

  for (const item of nodeMap) {
    // 映射startNode（首段开始位置）
    if (!startNode && firstGlobalStart >= item.startPos && firstGlobalStart < item.endPos) {
      startNode = item.node
      startOffset = firstGlobalStart - item.startPos
    }
    
    // 映射endNode（尾段结束位置）
    if (lastGlobalEnd > item.startPos && lastGlobalEnd <= item.endPos) {
      endNode = item.node
      endOffset = lastGlobalEnd - item.startPos
    }
  }

  // 必须找到两个端点
  if (!startNode || !endNode) return null

  return {
    startNode,
    endNode,
    startOffset,
    endOffset
  }
}
// 在highlightAndScroll函数中，修改匹配项的处理逻辑
const highlightAndScroll = (text: string) => {
  if (!viewerContainer.value || !text) return

  removeHighlights()

  // 将搜索文本分割成段落
  const segments = splitTextToSegments(text)
  if (segments.length === 0) return

  console.log('搜索段落:', segments)

  // 收集所有文本节点
  const walker = document.createTreeWalker(
    viewerContainer.value,
    NodeFilter.SHOW_TEXT,
    null
  )

  const textNodes: Text[] = []
  let node: Node | null

  while ((node = walker.nextNode())) {
    const parent = node.parentNode as HTMLElement
    // 过滤掉script、style等标签的文本
    if (parent && !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.nodeName)) {
      const textContent = node.textContent || ''
      // 只包含非空文本节点
      if (textContent.trim().length > 0) {
        textNodes.push(node as Text)
      }
    }
  }

  console.log('文本节点数量:', textNodes.length)

  // 查找匹配区域
  let match = findMatchingRegion(textNodes, segments)

  console.log('找到匹配项:', match)

  if (!match) {
    ElMessage.warning('未找到要定位的内容')
    return
  }

  // 高亮匹配区域
  const highlight = highlightRegion(match, true)

  // 滚动到匹配项
  if (highlight) {
    setTimeout(() => {
      highlight.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })

      // 闪烁动画
      highlight.animate(
        [
          { backgroundColor: 'var(--color-warning)' },
          { backgroundColor: 'var(--color-danger)' },
          { backgroundColor: 'var(--color-warning)' }
        ],
        {
          duration: 1000,
          iterations: 3
        }
      )
    }, 100)
  }
}
// 高亮指定区域 - 修复版
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
    // 如果开始和结束是同一个节点
    if (startNode === endNode) {
      return highlightSingleNode(startNode, startOffset, endOffset, isPrimary)
    } else {
      // 跨多个节点，需要分别处理
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

// 高亮单个节点
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

// 高亮跨多个节点的区域
const highlightMultipleNodes = (
  startNode: Text,
  endNode: Text,
  startOffset: number,
  endOffset: number,
  isPrimary: boolean
): HTMLElement | null => {
  // 收集所有需要高亮的节点
  const nodesToHighlight: Array<{
    node: Text
    fullHighlight: boolean
    startOffset?: number
    endOffset?: number
  }> = []

  // 使用TreeWalker找到两个节点之间的所有文本节点
  const walker = document.createTreeWalker(
    viewerContainer.value!,
    NodeFilter.SHOW_TEXT,
    null
  )

  let currentNode: Node | null = null
  let foundStart = false
  let foundEnd = false

  // 遍历找到所有需要高亮的节点
  while ((currentNode = walker.nextNode()) && !foundEnd) {
    const textNode = currentNode as Text

    if (textNode === startNode) {
      foundStart = true
      // 开始节点：从startOffset到末尾
      nodesToHighlight.push({
        node: textNode,
        fullHighlight: false,
        startOffset: startOffset,
        endOffset: undefined // 到末尾
      })
    } else if (textNode === endNode) {
      foundEnd = true
      // 结束节点：从开始到endOffset
      nodesToHighlight.push({
        node: textNode,
        fullHighlight: false,
        startOffset: 0,
        endOffset: endOffset
      })
    } else if (foundStart) {
      // 中间节点：完全高亮
      nodesToHighlight.push({
        node: textNode,
        fullHighlight: true
      })
    }
  }

  // 从后往前处理节点，避免DOM操作影响后续节点引用
  let firstHighlight: HTMLElement | null = null

  for (let i = nodesToHighlight.length - 1; i >= 0; i--) {
    const {
      node,
      fullHighlight,
      startOffset: offsetStart,
      endOffset: offsetEnd
    } = nodesToHighlight[i]

    if (fullHighlight) {
      // 完全高亮整个节点
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
      // 部分高亮节点
      const text = node.textContent || ''
      const endPos = offsetEnd !== undefined ? offsetEnd : text.length

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

// 移除高亮
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
  background-color: var(--color-warning);
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
