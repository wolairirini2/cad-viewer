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
      debug: false
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

// 高亮文本并滚动
const highlightAndScroll = (text: string) => {
  if (!viewerContainer.value || !text) return

  removeHighlights()

  const walker = document.createTreeWalker(
    viewerContainer.value,
    NodeFilter.SHOW_TEXT,
    null
  )

  const textNodes: Text[] = []
  let node: Node | null

  while ((node = walker.nextNode())) {
    textNodes.push(node as Text)
  }

  let firstHighlight: HTMLElement | null = null

  for (const textNode of textNodes) {
    const nodeText = textNode.textContent || ''
    const index = nodeText.indexOf(text)

    if (index !== -1) {
      const parent = textNode.parentNode
      if (
        !parent ||
        parent.nodeName === 'SCRIPT' ||
        parent.nodeName === 'STYLE'
      )
        continue

      const beforeText = nodeText.substring(0, index)
      const matchText = nodeText.substring(index, index + text.length)
      const afterText = nodeText.substring(index + text.length)

      const highlight = document.createElement('mark')
      highlight.className = 'docx-highlight'
      highlight.textContent = matchText

      const fragment = document.createDocumentFragment()
      if (beforeText) fragment.appendChild(document.createTextNode(beforeText))
      fragment.appendChild(highlight)
      if (afterText) fragment.appendChild(document.createTextNode(afterText))

      parent.replaceChild(fragment, textNode)

      if (!firstHighlight) firstHighlight = highlight
    }
  }

  if (firstHighlight) {
    setTimeout(() => {
      firstHighlight!.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })

      // 闪烁动画
      firstHighlight!.animate(
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
  } else {
    ElMessage.warning('未找到要定位的内容')
  }
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
