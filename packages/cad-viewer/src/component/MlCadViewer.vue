<template>
  <div ref="viewerRoot" class="ml-cad-viewer-wrapper">
    <div class="content-container">
      <!-- CAD 查看器 -->
      <div class="cad-container" v-show="fileType === 'cad'">
        <div class="cad-area">
          <canvas
            v-show="currentFileId"
            ref="canvasRef"
            class="ml-cad-canvas"
          ></canvas>
        </div>
        <div v-if="editorRef" class="ui-overlay">
          <el-config-provider :locale="elementPlusLocale">
            <header><ml-main-menu /></header>
            <main>
              <div class="ml-file-name">
                {{ decodeFileName(store.fileName) }}
              </div>
              <ml-tool-bars />
              <ml-palette-manager :editor="editor" />
              <ml-dialog-manager />
            </main>
            <footer>
              <ml-status-bar
                :is-dark="isDark"
                :toggle-dark="toggleDark"
                @toggle-notification-center="toggleNotificationCenter"
              />
            </footer>
            <ml-file-reader @file-read="handleFileRead" />
            <ml-entity-info />
            <ml-notification-center
              v-if="showNotificationCenter"
              @close="closeNotificationCenter"
            />
          </el-config-provider>
        </div>
      </div>

      <!-- 其他文件预览 -->
      <PreviewArea
        v-if="fileType && fileType !== 'cad'"
        :preview-url="previewUrl || ''"
        :file-name="fileName || ''"
        :highlight-text="highlightText"
      />

      <!-- 审查报告面板 -->
      <ReviewReportPanel
        v-if="showRegulationPanel"
        :report-data="reportData"
        :project-name="projectName"
        :current-file-id="currentFileId"
        @row-click="handleRowClick"
        @locate="handleLocate"
        @switch-drawing="handleSwitchDrawing"
      />
    </div>

    <!-- 详情弹窗 -->
    <ViolationDetailDialog
      v-model="showViolationDetail"
      :data="selectedViolation"
      @locate="handleLocate"
    />
    <PassedDetailDialog
      v-model="showPassedDetail"
      :data="selectedViolation"
      @locate="locateInCad"
    />
  </div>
</template>

<script setup lang="ts">
import { AcApDocManager, eventBus } from '@mlightcad/cad-simple-viewer'
import { AcDbOpenDatabaseOptions, AcGeBox2d } from '@mlightcad/data-model'
import { useDark, useToggle } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref, watch, nextTick, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

import { initializeCadViewer, store } from '../app'
import { useLocale, useNotificationCenter } from '../composable'
import { LocaleProp } from '../locale'
import { MlDialogManager, MlFileReader } from './common'
import { MlEntityInfo, MlMainMenu, MlToolBars } from './layout'
import { MlNotificationCenter } from './notification'
import { MlPaletteManager } from './palette'
import { MlStatusBar } from './statusBar'

import PreviewArea from './PreviewArea.vue'
import ReviewReportPanel from './ReviewReportPanel.vue'
import ViolationDetailDialog from './ViolationDetailDialog.vue'
import PassedDetailDialog from './PassedDetailDialog.vue'

interface Props {
  locale?: LocaleProp
  url?: string
  localFile?: File
  background?: number
  baseUrl?: string
  useMainThreadDraw?: boolean
  theme?: 'light' | 'dark'
  showRegulationPanel?: boolean
  reviewReportData?: any
  currentFileId?: string | null
  previewUrl?: string
  fileName?: string
  projectName?: string
}

const props = withDefaults(defineProps<Props>(), {
  locale: 'default',
  theme: 'light',
  showRegulationPanel: true
})

const emit = defineEmits<{ switchDrawing: [fileId: string] }>()

// CAD 相关
const canvasRef = ref<HTMLCanvasElement>()
const viewerRoot = ref<HTMLElement | null>(null)
const editorRef = ref<AcApDocManager | null>(null)
const editor = computed(() => editorRef.value as AcApDocManager)
const showNotificationCenter = ref(false)
const { t } = useI18n()
const { elementPlusLocale } = useLocale(props.locale)
const { info, warning, error } = useNotificationCenter()

const isDark = useDark({
  selector: viewerRoot,
  attribute: 'class',
  valueDark: 'ml-theme-dark',
  valueLight: 'ml-theme-light'
})
const toggleDark = useToggle(isDark)

// 文件类型判断
const fileType = computed(() => {
  if (props.url || props.localFile) return 'cad'
  if (!props.previewUrl) return null

  const ext =
    (props.fileName || props.previewUrl)
      .toLowerCase()
      .split('.')
      .pop()
      ?.split('?')[0] || ''
  if (ext === 'pdf') return 'pdf'
  if (ext === 'docx') return 'docx'
  if (['doc', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'office'
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(ext)) return 'image'
  return 'unsupported'
})

// 定位相关
const highlightText = ref('')
const currentLocateInfo = ref<{ fileId?: string; rowId?: string }>({})
let resizeObserver: ResizeObserver | null = null

// 详情弹窗
const showViolationDetail = ref(false)
const showPassedDetail = ref(false)
const selectedViolation = ref<any>(null)

const projectName = computed(() => decodeURIComponent(props.projectName || ''))
const reportData = computed(() => props.reviewReportData)

// 方法：解码文件名
const decodeFileName = (fileName: string): string => {
  if (!fileName) return ''
  try {
    const txt = document.createElement('textarea')
    txt.innerHTML = fileName
    let decoded = txt.value
    try {
      decoded = decodeURIComponent(decoded)
    } catch {}
    return decoded
  } catch {
    return fileName
  }
}

// 方法：文件处理
const handleFileRead = async (fileName: string, fileContent: ArrayBuffer) => {
  const options: AcDbOpenDatabaseOptions = { minimumChunkSize: 1000 }
  await AcApDocManager.instance.openDocument(fileName, fileContent, options)
  store.fileName = AcApDocManager.instance.curDocument.docTitle
}

const openFileFromUrl = async (url: string) => {
  try {
    await AcApDocManager.instance.openUrl(url, {})
    store.fileName = AcApDocManager.instance.curDocument.docTitle
  } catch (err) {
    ElMessage.error(t('main.message.failedToOpenFile', { fileName: url }))
  }
}

const openLocalFile = async (file: File) => {
  try {
    const reader = new FileReader()
    reader.readAsArrayBuffer(file)
    const content = await new Promise<ArrayBuffer>((resolve, reject) => {
      reader.onload = e =>
        e.target?.result ? resolve(e.target.result as ArrayBuffer) : reject()
      reader.onerror = () => reject()
    })
    await AcApDocManager.instance.openDocument(file.name, content, {
      minimumChunkSize: 1000
    })
    store.fileName = AcApDocManager.instance.curDocument.docTitle
  } catch {
    ElMessage.error(t('main.message.failedToOpenFile', { fileName: file.name }))
  }
}

// 方法：行点击
const handleRowClick = (row: any) => {
  selectedViolation.value = row
  currentLocateInfo.value = {}
  if (row.risk_level === 0) {
    showPassedDetail.value = true
  } else {
    showViolationDetail.value = true
  }
}

// 方法：定位处理
const handleLocate = async (row: any) => {
  if (row.category === '设计说明') {
    await handleWordLocate(row)
  } else {
    await handleCadLocate(row)
  }
}

const handleWordLocate = async (row: any) => {
  const geometry = row.geometry_ref
  if (!geometry?.chapter) {
    ElMessage.warning('无法获取关键词')
    return
  }

  const targetFileId = geometry.file_id
  if (props.currentFileId !== targetFileId) {
    await emit('switchDrawing', targetFileId)
    await new Promise(r => setTimeout(r, 800))
  }

  highlightText.value = ''
  await nextTick()
  highlightText.value = geometry.chapter
  currentLocateInfo.value = { fileId: targetFileId, rowId: row.violation_id }
}

const handleCadLocate = async (row: any) => {
  const geometry = row.geometry_ref
  if (!geometry?.file_id) {
    ElMessage.warning('无法获取图纸信息')
    return
  }

  if (props.currentFileId !== geometry.file_id) {
    await emit('switchDrawing', geometry.file_id)
    await new Promise(r => setTimeout(r, 3000))
  }

  locateInCad(geometry)
  currentLocateInfo.value = {
    fileId: geometry.file_id,
    rowId: row.violation_id
  }
}

const locateInCad = (geometry: any) => {
  if (!geometry?.extents) return

  const { min_point, max_point } = geometry.extents
  const box = new AcGeBox2d(
    { x: min_point.x, y: min_point.y },
    { x: max_point.x, y: max_point.y }
  )

  if (geometry.handles?.length) {
    const ids = geometry.handles.map((h: string) =>
      parseInt(h, 16).toString(10)
    )
    AcApDocManager.instance.curView.highlight(ids)
  }

  AcApDocManager.instance.curView.zoomTo(box, 0.5)
  ElMessage.success(`已定位到违规区域`)
}

const handleSwitchDrawing = (fileId: string) => emit('switchDrawing', fileId)

// 生命周期
onMounted(() => {
  if (!canvasRef.value) return

  initializeCadViewer({
    canvas: canvasRef.value,
    baseUrl: props.baseUrl,
    useMainThreadDraw: props.useMainThreadDraw
  })

  const view = AcApDocManager.instance.curView as any
  if (view.setCalculateSizeCallback) {
    view.setCalculateSizeCallback(() => {
      const container = document.querySelector('.cad-container') as HTMLElement
      return container
        ? { width: container.clientWidth, height: container.clientHeight }
        : { width: window.innerWidth, height: window.innerHeight - 30 }
    })
    view.updateSize?.()
  }

  // ResizeObserver
  const container = document.querySelector('.cad-container')
  if (container && view.updateSize) {
    resizeObserver = new ResizeObserver(() => {
      clearTimeout((window as any).__cadResizeTimer)
      ;(window as any).__cadResizeTimer = setTimeout(
        () => view.updateSize(),
        100
      )
    })
    resizeObserver.observe(container)
  }

  // 鼠标事件修正
  const canvas = canvasRef.value
  const fixMouse = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect()
    Object.defineProperty(e, 'clientX', {
      value: e.clientX - rect.left,
      writable: false
    })
    Object.defineProperty(e, 'clientY', {
      value: e.clientY - rect.top,
      writable: false
    })
  }

  ;[
    'mousedown',
    'mousemove',
    'mouseup',
    'click',
    'dblclick',
    'wheel',
    'contextmenu'
  ].forEach(type => {
    canvas.addEventListener(
      type,
      (e: Event) => {
        if (e instanceof MouseEvent) fixMouse(e)
      },
      { capture: true }
    )
  })

  editorRef.value = AcApDocManager.instance

  if (props.url) openFileFromUrl(props.url)
  else if (props.localFile) openLocalFile(props.localFile)

  if (props.background != null)
    AcApDocManager.instance.curView.backgroundColor = props.background
  if (props.theme === 'dark') isDark.value = true

  // EventBus
  eventBus.on('message', params => {
    ElMessage({
      message: params.message,
      grouping: true,
      type: params.type,
      showClose: true
    })
    if (params.type === 'error') error('System Error', params.message)
    else if (params.type === 'warning')
      warning('System Warning', params.message)
    else info('System Info', params.message)
  })
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  highlightText.value = ''
  currentLocateInfo.value = {}
  // 清除高亮
  try {
    const view = AcApDocManager.instance.curView
    const ids = view.selectionSet?.ids || []
    if (ids.length) view.unhighlight(ids)
  } catch {}
})

watch(
  () => props.url,
  newUrl => {
    if (newUrl) openFileFromUrl(newUrl)
  }
)
watch(
  () => props.localFile,
  newFile => {
    if (newFile) openLocalFile(newFile)
  }
)
watch(
  () => props.background,
  newBg => {
    if (newBg != null) AcApDocManager.instance.curView.backgroundColor = newBg
  }
)
watch(
  () => props.theme,
  newTheme => {
    isDark.value = newTheme === 'dark'
  }
)

const toggleNotificationCenter = () => {
  showNotificationCenter.value = !showNotificationCenter.value
}
const closeNotificationCenter = () => {
  showNotificationCenter.value = false
}
</script>

<style scoped lang="scss">
.ml-cad-viewer-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.content-container {
  display: flex;
  width: 100%;
  height: 100%;
}

.cad-container {
  flex: 1;
  display: flex;
  position: relative;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.cad-area {
  width: 100%;
  height: 100%;
}

.ml-cad-canvas {
  display: block;
  width: 100%;
  height: 100%;
  outline: none;
  background: #1e1e1e;
}

.ui-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}

.ml-file-name {
  position: absolute;
  top: 0;
  left: 50%;
  color: var(--el-text-color-regular);
  transform: translateX(-50%);
  text-align: center;
  width: 100%;
  margin-top: 20px;
  pointer-events: none;
  z-index: 1;
}
</style>
