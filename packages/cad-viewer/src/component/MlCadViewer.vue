<template>
  <div ref="viewerRoot" class="ml-cad-viewer-wrapper">
    <div class="content-container">
      <!-- CAD 查看器 -->
      <div class="cad-container" v-show="fileType === 'cad'">
        <!-- Canvas element for CAD rendering - positioned as background -->
        <div
          ref="containerRef"
          class="ml-cad-container"
          @contextmenu.prevent="handleContextMenu"
        ></div>

        <!-- Main CAD viewer container with complete UI layout -->
        <div v-if="editorRef" class="ml-cad-viewer-container ui-overlay">
          <!-- Element Plus configuration provider for internationalization -->
          <el-config-provider :locale="elementPlusLocale">
            <!-- Header section with main menu and language selector -->
            <header>
              <ml-main-menu />
              <ml-language-selector :current-locale="effectiveLocale" />
            </header>

            <!-- Main content area with CAD viewing tools and controls -->
            <main>
              <!-- Display current filename at the top center -->
              <div v-if="features.isShowFileName" class="ml-file-name">
                {{ decodeFileName(store.fileName) }}
              </div>

              <!-- Toolbar with common CAD operations (zoom, pan, select, etc.) -->
              <ml-tool-bars />

              <!-- Layer manager palette and entity properties palette for controlling entity visibility and properties -->
              <ml-palette-manager :editor="editor" />

              <!-- Dialog manager for modal dialogs and settings -->
              <ml-dialog-manager />
            </main>

            <!-- Footer section with command line and status information -->
            <footer>
              <!-- Status bar with progress, settings, and theme controls -->
              <ml-status-bar
                :is-dark="isDark"
                :toggle-dark="toggleDark"
                @toggle-notification-center="toggleNotificationCenter"
              />
            </footer>

            <!-- Hidden components for file handling and entity information -->
            <!-- File reader for local file uploads -->
            <ml-file-reader @file-read="handleFileRead" />

            <!-- Entity info panel for displaying object properties -->
            <ml-entity-info />

            <!-- Notification center -->
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

  <!-- 右键批注菜单 -->
  <div
    v-if="showAnnotationMenu"
    class="annotation-context-menu"
    :style="{
      left: annotationMenuPosition.x + 'px',
      top: annotationMenuPosition.y + 'px'
    }"
  >
    <div class="menu-item" @click="startAnnotation">
      <el-icon><EditPen /></el-icon>
      <span>添加文字批注</span>
    </div>
  </div>

  <!-- 批注输入对话框 -->
  <el-dialog
    v-model="showAnnotationDialog"
    title="添加批注"
    width="400px"
    :close-on-click-modal="false"
    @closed="cancelAnnotation"
  >
    <el-input
      v-model="annotationText"
      type="textarea"
      :rows="4"
      placeholder="请输入批注内容..."
      maxlength="500"
      show-word-limit
    />
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="cancelAnnotation">取消</el-button>
        <el-button
          type="primary"
          @click="confirmAnnotation"
          :disabled="!annotationText.trim()"
        >
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {
  AcApDocManager,
  AcApOpenDatabaseOptions,
  AcEdOpenMode,
  eventBus,
  AcApAnnotationCmd
} from '@mlightcad/cad-simple-viewer'
import { AcGeBox2d, AcGePoint3dLike } from '@mlightcad/data-model'
import { useDark, useToggle } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { EditPen } from '@element-plus/icons-vue'

import { initializeCadViewer, store } from '../app'
import { useLocale, useNotificationCenter, useSettings } from '../composable'
import { LocaleProp } from '../locale'
import { MlDialogManager, MlFileReader } from './common'
import {
  MlEntityInfo,
  MlLanguageSelector,
  MlMainMenu,
  MlToolBars
} from './layout'
import { MlNotificationCenter } from './notification'
import { MlPaletteManager } from './palette'
import { MlStatusBar } from './statusBar'

// 导入旧版本新增的功能组件
import PreviewArea from './PreviewArea.vue'
import ReviewReportPanel from './ReviewReportPanel.vue'
import ViolationDetailDialog from './ViolationDetailDialog.vue'
import PassedDetailDialog from './PassedDetailDialog.vue'

const emit = defineEmits<{
  /**
   * Fired after CAD viewer is fully created and ready to use
   */
  (e: 'create'): void

  /**
   * Fired right before CAD viewer is destroyed
   */
  (e: 'destroy'): void

  /**
   * Fired when need to switch drawing file
   */
  (e: 'switchDrawing', fileId: string): void
}>()

// Define component props with their purposes
interface Props {
  /** Language locale for internationalization ('en', 'zh', or 'default') */
  locale?: LocaleProp
  /** Optional URL to automatically load a CAD file on component mount */
  url?: string
  /** Optional local File object to automatically load a CAD file on component mount */
  localFile?: File
  /** Background color as 24-bit hexadecimal RGB number (e.g., 0x000000) */
  background?: number
  /** Base URL for loading fonts, templates, and example files (e.g., 'https://example.com/cad-data/') */
  baseUrl?: string
  /**
   * The flag whether to use main thread or webwork to render drawing.
   * - true: use main thread
   * - false: use web worker
   */
  useMainThreadDraw?: boolean
  /** Initial theme of the viewer */
  theme?: 'light' | 'dark'
  /**
   * Access mode for opening CAD files.
   * - Read (0): Read-only access
   * - Review (4): Review access, compatible with Read
   * - Write (8): Full read/write access, compatible with Review and Read
   */
  mode?: AcEdOpenMode
  /** Whether to show regulation panel */
  showRegulationPanel?: boolean
  /** Review report data */
  reviewReportData?: any
  /** Current file ID */
  currentFileId?: string | null
  /** Preview URL for non-CAD files */
  previewUrl?: string
  /** File name */
  fileName?: string
  /** Project name */
  projectName?: string
}

const props = withDefaults(defineProps<Props>(), {
  locale: 'default',
  url: undefined,
  localFile: undefined,
  background: undefined,
  baseUrl: undefined,
  useMainThreadDraw: false,
  theme: 'light',
  mode: AcEdOpenMode.Write,
  showRegulationPanel: true
})

const { t } = useI18n()
const { effectiveLocale, elementPlusLocale } = useLocale(props.locale)
const { info, warning, error, success } = useNotificationCenter()

// Canvas element reference
const containerRef = ref<HTMLDivElement>()

// Referenence to the root element used to switch theme
const viewerRoot = ref<HTMLElement | null>(null)

// Editor reference that gets updated after initialization
const editorRef = ref<AcApDocManager | null>(null)

// Computed property to ensure proper typing
const editor = computed(() => editorRef.value as AcApDocManager)

// Notification center visibility
const showNotificationCenter = ref(false)

const isDark = useDark({
  selector: viewerRoot,
  attribute: 'class',
  valueDark: 'ml-theme-dark',
  valueLight: 'ml-theme-light'
})

const toggleDark = useToggle(isDark)

const features = useSettings()

// ==================== 旧版本新增功能：文件类型判断 ====================
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

// ==================== 旧版本新增功能：定位相关 ====================
const highlightText = ref('')
const currentLocateInfo = ref<{ fileId?: string; rowId?: string }>({})

// ==================== 旧版本新增功能：详情弹窗 ====================
const showViolationDetail = ref(false)
const showPassedDetail = ref(false)
const selectedViolation = ref<any>(null)

// ==================== 旧版本新增功能：计算属性 ====================
const projectName = computed(() => decodeURIComponent(props.projectName || ''))
const reportData = computed(() => props.reviewReportData)

/**
 * Handles file read events from the file reader component
 * Opens the file content using the document manager
 *
 * This function is called when a user selects a local file through:
 * - The main menu "Open" option (triggers file dialog)
 * - Drag and drop functionality (if implemented)
 * - Any other local file selection method
 *
 * @param fileName - Name of the uploaded file
 * @param fileContent - File content as string (DXF) or ArrayBuffer (DWG)
 */
const handleFileRead = async (fileName: string, fileContent: ArrayBuffer) => {
  const options: AcApOpenDatabaseOptions = {
    minimumChunkSize: 1000,
    mode: props.mode
  }
  const success = await AcApDocManager.instance.openDocument(
    fileName,
    fileContent,
    options
  )
  if (!success) {
    throw new Error('Failed to open file')
  }
  store.fileName = AcApDocManager.instance.curDocument.docTitle
}

/**
 * Fetches and opens a CAD file from a remote URL
 * Used when the url prop is provided to automatically load files
 *
 * @param url - Remote URL to the CAD file
 */
const openFileFromUrl = async (url: string) => {
  try {
    const options: AcApOpenDatabaseOptions = {
      minimumChunkSize: 1000,
      mode: props.mode
    }
    await AcApDocManager.instance.openUrl(url, options)
    store.fileName = AcApDocManager.instance.curDocument.docTitle
  } catch (error) {
    console.error('Failed to open file from URL:', error)
    ElMessage({
      message: t('main.message.failedToOpenFile', { fileName: url }),
      grouping: true,
      type: 'error',
      showClose: true
    })
  }
}

/**
 * Opens a local CAD file from a File object
 * Used when the localFile prop is provided to automatically load files
 *
 * @param file - Local File object containing the CAD file
 */
const openLocalFile = async (file: File) => {
  try {
    const reader = new FileReader()
    reader.readAsArrayBuffer(file)

    // Wait for file reading to complete
    const fileContent = await new Promise<ArrayBuffer>((resolve, reject) => {
      reader.onload = event => {
        const result = event.target?.result
        if (result) {
          resolve(result as ArrayBuffer)
        } else {
          reject(new Error('Failed to read file content'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
    })

    // Open the file using the document manager
    const options: AcApOpenDatabaseOptions = {
      minimumChunkSize: 1000,
      mode: props.mode
    }
    const success = await AcApDocManager.instance.openDocument(
      file.name,
      fileContent,
      options
    )
    if (!success) {
      throw new Error('Failed to open local file')
    }
    store.fileName = AcApDocManager.instance.curDocument.docTitle
  } catch {
    ElMessage({
      message: t('main.message.failedToOpenFile', { fileName: file.name }),
      grouping: true,
      type: 'error',
      showClose: true
    })
  }
}

// ==================== 旧版本新增功能：工具方法 ====================
/**
 * 解码文件名（处理 HTML 实体和 URL 编码）
 */
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

// ==================== 旧版本新增功能：事件处理 ====================
/**
 * 处理行点击事件
 */
const handleRowClick = (row: any) => {
  selectedViolation.value = row
  currentLocateInfo.value = {}
  if (row.risk_level === 0) {
    showPassedDetail.value = true
  } else {
    showViolationDetail.value = true
  }
}

/**
 * 处理定位请求
 */
const handleLocate = async (row: any) => {
  if (row.category === '设计说明') {
    await handleWordLocate(row)
  } else {
    await handleCadLocate(row)
  }
}

/**
 * Word 文档定位
 */
const handleWordLocate = async (row: any) => {
  const geometry = row.geometry_ref
  if (!geometry?.chapter) {
    ElMessage.warning('无法获取关键词')
    return
  }

  const targetFileId = geometry.file_id
  if (props.currentFileId !== targetFileId) {
    emit('switchDrawing', targetFileId)
    await new Promise(r => setTimeout(r, 800))
  }

  highlightText.value = ''
  await nextTick()
  highlightText.value = geometry.chapter
  currentLocateInfo.value = { fileId: targetFileId, rowId: row.violation_id }
}

/**
 * CAD 定位
 */
const handleCadLocate = async (row: any) => {
  const geometry = row.geometry_ref
  if (!geometry?.file_id) {
    ElMessage.warning('无法获取图纸信息')
    return
  }

  if (props.currentFileId !== geometry.file_id) {
    emit('switchDrawing', geometry.file_id)
    await new Promise(r => setTimeout(r, 3000))
  }

  locateInCad(geometry)
  currentLocateInfo.value = {
    fileId: geometry.file_id,
    rowId: row.violation_id
  }
}

/**
 * 在 CAD 中执行定位
 */
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

/**
 * 处理切换图纸
 */
const handleSwitchDrawing = (fileId: string) => {
  emit('switchDrawing', fileId)
}

// Watch for URL changes and automatically open new files
// This allows dynamic loading of different CAD files without component remounting
watch(
  () => props.url,
  async newUrl => {
    if (newUrl) {
      openFileFromUrl(newUrl)
    }
  }
)

// Watch for local file changes and automatically open new files
// This allows dynamic loading of different local CAD files without component remounting
watch(
  () => props.localFile,
  async newFile => {
    if (newFile) {
      openLocalFile(newFile)
    }
  }
)

// Watch for background color changes and apply to the view
watch(
  () => props.background,
  newBg => {
    if (newBg != null) {
      AcApDocManager.instance.curView.backgroundColor = newBg
    }
  }
)

// Watch for theme changes and apply to the view
watch(
  () => props.theme,
  newTheme => {
    isDark.value = newTheme === 'dark' ? true : false
  }
)

// Component lifecycle: Initialize and load initial file if URL or localFile is provided
onMounted(async () => {
  // Initialize the CAD viewer with the internal canvas
  if (containerRef.value) {
    initializeCadViewer({
      container: containerRef.value,
      baseUrl: props.baseUrl,
      autoResize: true,
      useMainThreadDraw: props.useMainThreadDraw
    })

    // 添加点击事件监听（用于关闭菜单）
    document.addEventListener('click', handleClickOutside)
    // Set the editor reference after initialization
    editorRef.value = AcApDocManager.instance
  }

  // If URL prop is provided, automatically load the file on mount
  if (props.url) {
    openFileFromUrl(props.url)
  }
  // If localFile prop is provided, automatically load the file on mount
  else if (props.localFile) {
    openLocalFile(props.localFile)
  }

  // Apply initial background color if provided
  if (props.background != null) {
    AcApDocManager.instance.curView.backgroundColor = props.background
  }

  // Set initial theme from props
  if (props.theme === 'dark') {
    isDark.value = true
  } else {
    isDark.value = false
  }

  // FINAL STEP: viewer is now ready
  emit('create')
})

// Destroy the CAD viewer when the component is unmounted
onUnmounted(() => {
  // 清理事件监听
  document.removeEventListener('click', handleClickOutside)
  // ==================== 旧版本新增功能：清理高亮 ====================
  highlightText.value = ''
  currentLocateInfo.value = {}
  // 清除高亮
  try {
    const view = AcApDocManager.instance.curView
    const ids = view.selectionSet?.ids || []
    if (ids.length) view.unhighlight(ids)
  } catch {}

  // Notify consumers first
  emit('destroy')

  AcApDocManager.instance.destroy()
})

// Set up global event listeners for various CAD operations and notifications
// These events are emitted by the underlying CAD engine and other components

// Handle general messages from the CAD system (info, warnings, errors)
eventBus.on('message', params => {
  // Show both ElMessage and notification center
  ElMessage({
    message: params.message,
    grouping: true,
    type: params.type,
    showClose: true
  })

  // Also add to notification center
  switch (params.type) {
    case 'success':
      success('System Message', params.message)
      break
    case 'warning':
      warning('System Warning', params.message)
      break
    case 'error':
      error('System Error', params.message)
      break
    default:
      info('System Info', params.message)
      break
  }
})

// Handle failure that fonts can't be loaded from remote font repository
eventBus.on('fonts-not-loaded', params => {
  const fonts = params.fonts.map(font => font.fontName).join(', ')
  const message = t('main.message.fontsNotLoaded', { fonts })
  error(t('main.notification.title.fontNotFound'), message)
})

// Handle failure that fonts can't be found in remote font repository
eventBus.on('fonts-not-found', params => {
  const message = t('main.message.fontsNotFound', {
    fonts: params.fonts.join(', ')
  })
  warning(t('main.notification.title.fontNotFound'), message)
})

// Handle failures when trying to get available fonts from the system
eventBus.on('failed-to-get-avaiable-fonts', params => {
  ElMessage({
    message: t('main.message.failedToGetAvaiableFonts', { url: params.url }),
    grouping: true,
    type: 'error',
    showClose: true
  })
})

// Handle file opening failures with user-friendly error messages
eventBus.on('failed-to-open-file', params => {
  const message = t('main.message.failedToOpenFile', {
    fileName: params.fileName
  })
  ElMessage({
    message,
    grouping: true,
    type: 'error',
    showClose: true
  })
  error('File Opening Failed', message)
})

// Toggle notification center visibility
const toggleNotificationCenter = () => {
  showNotificationCenter.value = !showNotificationCenter.value
}

// Close notification center
const closeNotificationCenter = () => {
  showNotificationCenter.value = false
}

// ==================== 批注功能相关 ====================
const showAnnotationMenu = ref(false)
const annotationMenuPosition = ref({ x: 0, y: 0 })
const showAnnotationDialog = ref(false)
const annotationText = ref('')
const pendingAnnotationPoint = ref<AcGePoint3dLike | null>(null)

/**
 * 处理CAD容器的右键点击事件
 */
const handleContextMenu = (event: MouseEvent) => {
  // 获取容器位置
  const rect = containerRef.value?.getBoundingClientRect()
  if (!rect) return

  // 计算相对于容器的位置
  annotationMenuPosition.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }

  // 显示自定义右键菜单
  showAnnotationMenu.value = true

  // 转换屏幕坐标为CAD世界坐标
  const screenX = event.clientX - rect.left
  const screenY = event.clientY - rect.top

  // 使用CAD视图将屏幕坐标转换为世界坐标
  try {
    const view = AcApDocManager.instance.curView
    if (view && typeof view.screenToWorld === 'function') {
      const worldPoint = view.screenToWorld({ x: screenX, y: screenY })
      pendingAnnotationPoint.value = { ...worldPoint, z: 0 }
    } else {
      // 如果 view 没有 screenToWorld 方法，尝试使用 editor 的转换方法
      // 或者暂时存储屏幕坐标，在命令执行时再转换
      pendingAnnotationPoint.value = { x: screenX, y: screenY, z: 0 }
    }
  } catch (error) {
    console.warn('Failed to convert screen to world coordinates:', error)
    pendingAnnotationPoint.value = { x: screenX, y: screenY, z: 0 }
  }
}

/**
 * 开始添加批注
 */
const startAnnotation = () => {
  showAnnotationMenu.value = false
  showAnnotationDialog.value = true
  annotationText.value = ''
}

/**
 * 取消批注
 */
const cancelAnnotation = () => {
  showAnnotationDialog.value = false
  annotationText.value = ''
  pendingAnnotationPoint.value = null
}
/**
 * 确认添加批注
 */
const confirmAnnotation = async () => {
  if (!annotationText.value.trim()) {
    ElMessage.warning('请输入批注内容')
    return
  }

  if (!pendingAnnotationPoint.value) {
    ElMessage.error('无法获取插入点坐标')
    return
  }

  try {
    const cmd = new AcApAnnotationCmd(annotationText.value.trim())
    cmd.setInsertionPoint(pendingAnnotationPoint.value)
    await cmd.execute(AcApDocManager.instance.context)

    ElMessage.success('批注添加成功')
    showAnnotationDialog.value = false
    annotationText.value = ''
    pendingAnnotationPoint.value = null
  } catch (error) {
    console.error('Failed to add annotation:', error)
    ElMessage.error('批注添加失败: ' + (error as Error).message)
  }
}

// 点击其他地方关闭右键菜单
const handleClickOutside = (event: MouseEvent) => {
  const menu = document.querySelector('.annotation-context-menu')
  if (menu && !menu.contains(event.target as Node)) {
    showAnnotationMenu.value = false
  }
}
</script>

<!-- Component-specific styles -->
<style>
/* Container element styling */
.ml-cad-container {
  position: absolute;
  top: 0px;
  left: 0px;
  height: calc(
    100vh - var(--ml-status-bar-height)
  ); /* Adjusts for menu and status bar */
  width: 100%;
  display: block;
  outline: none;
  z-index: 1; /* Canvas above background but below UI */
  pointer-events: auto; /* Ensure container can receive mouse events */
}

/* Main CAD viewer container styling */
.ml-cad-viewer-container {
  position: relative;
  width: 100vw;
  z-index: 2;
  pointer-events: auto;
}

/* Position the filename display at the top center of the viewer */
.ml-file-name {
  position: absolute;
  top: 0;
  left: 50%;
  color: var(--el-text-color-regular);
  transform: translateX(-50%);
  text-align: center;
  width: 100%;
  margin-top: 20px;
  pointer-events: none; /* Allow mouse events to pass through to container */
  z-index: 1; /* Ensure it's above canvas but doesn't block events */
}

/* ==================== 旧版本新增样式 ==================== */
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

.ui-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
}

.ui-overlay > * {
  pointer-events: auto;
}

.el-overlay-dialog {
  overflow: hidden;
}
.violation-detail-dialog-wrapper {
  margin-top: 5vh;
}

/* 批注右键菜单样式 */
.annotation-context-menu {
  position: absolute;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 3000;
  padding: 4px 0;
  min-width: 160px;
  user-select: none;
}

.annotation-context-menu .menu-item {
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
  transition: background-color 0.2s;
}

.annotation-context-menu .menu-item:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.annotation-context-menu .menu-item .el-icon {
  font-size: 16px;
}

/* 深色主题适配 */
.ml-theme-dark .annotation-context-menu {
  background: #2b2b2b;
  border-color: #444;
}

.ml-theme-dark .annotation-context-menu .menu-item {
  color: #d0d0d0;
}

.ml-theme-dark .annotation-context-menu .menu-item:hover {
  background-color: #3a3a3a;
  color: #409eff;
}
</style>
