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
        v-show="fileType !== 'cad'"
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
        @goBack="goBack"
      />
    </div>
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
    <!-- 添加批注 - 子菜单 -->
    <div class="menu-item" @click="startTextAnnotation">
      <el-icon><Document /></el-icon>
      <span>添加文本</span>
    </div>
    <div
      class="menu-item"
      @click="(showTextSizeDialog = true) && (showAnnotationMenu = false)"
    >
      <el-icon><Document /></el-icon>
      <span>设置文本字号</span>
    </div>
    <div class="menu-item" @click="startCloudAnnotation">
      <el-icon><CircleCheck /></el-icon>
      <span>添加云线</span>
    </div>
    <div class="menu-item" @click="startArrowAnnotation">
      <el-icon><TopRight /></el-icon>
      <span>添加箭头</span>
    </div>
    <template v-if="annotations.length > 0">
      <div class="menu-divider"></div>

      <!-- 显示/隐藏批注 -->
      <div class="menu-item" @click="toggleAnnotationsVisibility">
        <el-icon>
          <View v-if="annotationsVisible" />
          <Hide v-else />
        </el-icon>
        <span>{{ annotationsVisible ? '隐藏批注' : '显示批注' }}</span>
      </div>

      <div class="menu-item annotation-count">
        <span>当前: {{ annotations.length }} 个</span>
      </div>
    </template>
  </div>

  <!-- 简化的字体大小选择弹窗 -->
  <el-dialog
    v-model="showTextSizeDialog"
    title="选择批注文字大小"
    width="360px"
    :close-on-click-modal="true"
    :show-close="true"
    align-center
  >
    <div class="text-size-grid">
      <div
        v-for="option in TEXT_SIZE_OPTIONS"
        :key="option.value"
        class="size-card"
        :class="{ active: selectedTextSize === option.value }"
        @click="selectTextSize(option.value)"
      >
        <div
          class="size-icon"
          :style="{ transform: `scale(${getScale(option.value)})` }"
        >
          A
        </div>
        <div class="size-name">{{ option.label }}</div>
        <div class="size-value">{{ option.value }}px</div>
      </div>
    </div>
  </el-dialog>
  <!-- 文本输入弹窗 -->
  <el-dialog
    v-model="showTextInputDialog"
    title="输入批注文字"
    width="400px"
    :close-on-click-modal="false"
    class="text-input-dialog"
  >
    <el-input
      v-model="annotationText"
      type="textarea"
      :rows="3"
      placeholder="请输入批注内容..."
      maxlength="200"
      show-word-limit
      autofocus
      @keyup.enter.ctrl="confirmTextInput"
    />
    <template #footer>
      <el-button @click="showTextInputDialog = false">取消</el-button>
      <el-button type="primary" @click="confirmTextInput">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {
  AcApDocManager,
  AcApOpenDatabaseOptions,
  AcEdOpenMode,
  eventBus,
  AcEdBaseView,
  type AnnotationData,
  type AnnotationType,
  AcApAnnotationCmd,
  toggleAnnotationLayer,
  isAnnotationLayerVisible,
  ANNOTATION_LAYER_NAME,
  TEXT_SIZE_OPTIONS,
  DEFAULT_TEXT_SIZE,
  ensureAnnotationLayer,
  AcEdPromptPointOptions,
  screenPixelToWorldHeight,
  AcApLocateCmd // 新增导入
} from '@mlightcad/cad-simple-viewer'
import {
  AcDbLayerTableRecord,
  AcCmColor,
  AcDbMText,
  AcGiMTextAttachmentPoint,
  AcGeBox2d
} from '@mlightcad/data-model'
import { useDark, useToggle } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

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

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'destroy'): void
  (e: 'switchDrawing', fileId: string): void
  (e: 'annotation-added', data: AnnotationData): void
  (e: 'annotation-save-requested', data: AnnotationData[]): void // 请求保存
  (e: 'annotation-clear-requested'): void // 请求清除
  (e: 'annotation-deleted', id: string): void // 删除批注
  (e: 'back'): void
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

/**
 * 处理行点击事件
 */
const handleRowClick = (row: any) => {
  console.log('handleRowClick', row)
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
  console.log('handleCadLocate', row)

  if (!geometry?.file_id) {
    ElMessage.warning('无法获取图纸信息')
    return
  }
  // 如果切换图纸，先清除旧方框
  if (props.currentFileId !== geometry.file_id) {
    AcApLocateCmd.clearLocateBox() // 使用 AcApLocateCmd 的方法

    emit('switchDrawing', geometry.file_id)
    await new Promise(r => setTimeout(r, 3000))
  }
  await locateInCad(geometry, row.noWriteRect)
  currentLocateInfo.value = {
    fileId: geometry.file_id,
    rowId: row.violation_id
  }
}

/**
 * 在 CAD 中执行定位 - 使用 AcApLocateCmd 指令
 */
const locateInCad = async (geometry: any, noWriteRect: boolean = false) => {
  if (!geometry?.extents) return

  const view = AcApDocManager.instance.curView

  // 移动到定位
  const box = new AcGeBox2d(
    { x: geometry.extents.min_point.x, y: geometry.extents.min_point.y },
    { x: geometry.extents.max_point.x, y: geometry.extents.max_point.y }
  )
  if (noWriteRect) {
    // return
    console.log('noWriteRect')
    const box2 = new AcGeBox2d(
      { x: geometry.extents.min_point.x, y: geometry.extents.min_point.y },
      {
        x: geometry.extents.max_point.x - 224200,
        y: geometry.extents.max_point.y
      }
    )
    view.zoomTo(box2, 1)
    return
  } else {
    view.zoomTo(box, 2)
  }

  // 如果有 all_extents（多区域），则使用它
  const extentsToUse = geometry.all_extents || [geometry.extents]

  // 支持多区域定位
  const success = await AcApLocateCmd.locate(extentsToUse)

  if (success) {
    ElMessage.success(`已定位到 ${extentsToUse.length} 个区域`)
  }
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

/**
 * 处理实体被删除事件
 * 检查是否是批注实体，如果是则从数据中移除
 */
const handleEntityErased = (entity: any) => {
  console.log('[handleEntityErased] 实体被删除: ', entity[0].objectId)
  const erasedId = entity[0].objectId
  if (!erasedId) return

  // 查找对应的批注
  const index = annotations.value.findIndex(ann => ann.objectId === erasedId)

  if (index !== -1) {
    const ann = annotations.value[index]
    console.log(
      `[handleEntityErased] 批注被删除: ${ann.id}, 类型: ${ann.annotationType}`
    )

    // 从数组中移除
    annotations.value.splice(index, 1)

    // 触发删除事件通知父组件
    emit('annotation-deleted', ann.id)

    emitSaveAnnotations()
  }
}

const handleClearLocateBox = () => {
  AcApLocateCmd.clearLocateBox()
}
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
    containerRef.value.addEventListener('click', handleClearLocateBox)
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

  // 监听实体删除事件，处理批注删除
  const db = AcApDocManager.instance.curDocument?.database
  if (db) {
    db.events.entityErased.addEventListener((args: { entity: any }) => {
      handleEntityErased(args.entity)
    })
  }

  annotationsVisible.value = true
})

// Destroy the CAD viewer when the component is unmounted
onUnmounted(() => {
  // 清理事件监听
  document.removeEventListener('click', handleClickOutside)
  containerRef.value?.removeEventListener('click', handleClearLocateBox)
  // ==================== 旧版本新增功能：清理高亮 ====================
  highlightText.value = ''
  currentLocateInfo.value = {}
  // 清除临时定位方框
  AcApLocateCmd.clearLocateBox() // 使用 AcApLocateCmd 的方法

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

// ==================== 批注功能 ====================
const annotations = ref<AnnotationData[]>([])
const showAnnotationMenu = ref(false)
const showAddSubmenu = ref(false) // 控制子菜单显示
const annotationMenuPosition = ref({ x: 0, y: 0 })

// 关键修改：使用 ref 存储可见性状态，而不是 computed
const annotationsVisible = ref(true)

// 文本批注优化
const showTextSizeDialog = ref(false)
const showTextInputDialog = ref(false)
const selectedTextSize = ref(DEFAULT_TEXT_SIZE)
const annotationText = ref('')
const pendingAnnotationPosition = ref<{ x: number; y: number } | null>(null)

/**
 * 选择字体大小
 */
const selectTextSize = (size: number) => {
  selectedTextSize.value = size

  showTextSizeDialog.value = false
  annotationText.value = ''
}

/**
 * 切换批注显示/隐藏 - 通过控制图层实现
 */
const toggleAnnotationsVisibility = () => {
  showAnnotationMenu.value = false

  const newState = toggleAnnotationLayer()
  // newState: true=隐藏, false=显示
  // 关键：手动更新 Vue 的响应式状态
  annotationsVisible.value = !newState // toggleAnnotationLayer 返回的是 isOff 状态

  if (newState) {
    ElMessage.success('已隐藏批注图层')
  } else {
    ElMessage.success('已显示批注图层')
  }
}

/**
 * 开始文本批注
 */
const startTextAnnotation = async () => {
  showAnnotationMenu.value = false

  // 获取位置
  const position = await getAnnotationPosition()
  if (!position) return

  pendingAnnotationPosition.value = position

  // 显示字体大小选择（默认选中"中"）
  // selectedTextSize.value = DEFAULT_TEXT_SIZE
  // showTextSizeDialog.value = true
  showTextInputDialog.value = true
}
/**
 * 获取批注位置
 */
const getAnnotationPosition = (): Promise<{ x: number; y: number } | null> => {
  return new Promise(resolve => {
    const pointPrompt = new AcEdPromptPointOptions('指定文本位置:')

    AcApDocManager.instance.editor
      .getPoint(pointPrompt)
      .then((position: any) => {
        resolve({ x: position.x, y: position.y })
      })
      .catch(() => {
        resolve(null)
      })
  })
}

/**
 * 确认文本输入并创建批注
 */
const confirmTextInput = () => {
  if (!annotationText.value.trim()) {
    ElMessage.warning('请输入批注内容')
    return
  }

  if (!pendingAnnotationPosition.value) {
    return
  }

  const view = AcApDocManager.instance.curView

  // 关键：将屏幕像素转换为图纸单位
  const worldHeight = screenPixelToWorldHeight(
    view,
    selectedTextSize.value,
    pendingAnnotationPosition.value
  )

  // 创建批注实体
  createTextAnnotation(
    pendingAnnotationPosition.value,
    annotationText.value.trim(),
    worldHeight
  )

  showTextInputDialog.value = false
  pendingAnnotationPosition.value = null
  annotationText.value = ''
}
/**
 * 创建文本批注实体
 */
const createTextAnnotation = (
  position: { x: number; y: number },
  text: string,
  height: number
) => {
  const db = AcApDocManager.instance.curDocument.database

  ensureAnnotationLayer()

  const mtext = new AcDbMText()
  mtext.location = { x: position.x, y: position.y, z: 0 }
  mtext.contents = text
  mtext.height = height
  mtext.width = height * 25
  mtext.attachmentPoint = AcGiMTextAttachmentPoint.TopLeft
  mtext.styleName = 'Standard'
  mtext.layer = ANNOTATION_LAYER_NAME

  const color = new AcCmColor()
  color.setRGB(255, 0, 0)
  mtext.color = color

  db.tables.blockTable.modelSpace.appendEntity(mtext)

  // 添加到批注列表
  const annotationData: AnnotationData = {
    id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'annotation',
    annotationType: 'text',
    text: text,
    textPosition: { x: position.x, y: position.y, z: 0 },
    textHeight: height,
    createdAt: new Date().toISOString(),
    objectId: mtext.objectId
  }

  annotations.value.push(annotationData)
  emit('annotation-added', annotationData)

  ElMessage.success('文本批注添加成功')

  // 触发保存
  emitSaveAnnotations()
}

/**
 * 开始云线批注
 */
const startCloudAnnotation = async () => {
  showAddSubmenu.value = false
  showAnnotationMenu.value = false
  await addAnnotation('cloud')
  emitSaveAnnotations()
}

/**
 * 开始箭头批注
 */
const startArrowAnnotation = async () => {
  showAddSubmenu.value = false
  showAnnotationMenu.value = false
  await addAnnotation('arrow')
  emitSaveAnnotations()
}

/**
 * 添加批注 - 自动创建/使用批注图层
 */
const addAnnotation = async (
  type: AnnotationType
): Promise<AnnotationData | undefined> => {
  try {
    const cmd = new AcApAnnotationCmd()
    cmd.setAnnotationType(type)
    await cmd.execute(AcApDocManager.instance.context)

    const data = AcApAnnotationCmd.getLastAnnotationData()
    if (data) {
      annotations.value.push(data)
      emit('annotation-added', data)

      const typeNames = { text: '文本', cloud: '云线', arrow: '箭头' }
      ElMessage.success(`${typeNames[type]}批注添加成功`)
      return data
    }
  } catch (error) {
    console.error('添加批注失败:', error)
    ElMessage.error('批注添加失败')
  }
  return undefined
}

/**
 * 触发保存批注事件 - 通知父组件调用 API
 */
const emitSaveAnnotations = () => {
  console.log('触发保存批注事件')
  // if (annotations.value.length === 0) {
  //   ElMessage.warning('没有需要保存的批注')
  //   return
  // }

  // 去重并清除实体ID
  const uniqueMap = new Map<string, AnnotationData>()
  annotations.value.forEach(ann => {
    if (!uniqueMap.has(ann.id)) {
      // 清除会话相关的实体ID
      const cleanAnn = {
        ...ann,
        objectId: undefined
      }
      uniqueMap.set(ann.id, cleanAnn)
    }
  })

  const data = Array.from(uniqueMap.values())
  emit('annotation-save-requested', data)
}

/**
 * 加载批注数据并渲染 - 使用批注图层
 */
const loadAnnotations = (data: AnnotationData[]): void => {
  // 清除旧显示
  clearAnnotationDisplay()

  // 深拷贝并清除无效ID
  annotations.value = data.map(ann => ({
    ...ann,
    objectId: undefined
  }))

  // 确保批注图层存在（但不强制打开，保持用户设置的可见性）
  const view = AcApDocManager.instance.curView
  const db = AcApDocManager.instance.curDocument?.database
  if (!db) return

  // 检查图层是否存在，不存在则创建（保持关闭状态，如果之前是关闭的）
  const layerTable = db.tables.layerTable
  let layer = layerTable.getAt(ANNOTATION_LAYER_NAME)
  if (!layer) {
    layer = new AcDbLayerTableRecord()
    layer.name = ANNOTATION_LAYER_NAME
    layer.isFrozen = false
    layer.isOff = false // 默认创建时打开
    layer.color = new AcCmColor()
    layer.color.setRGB(255, 0, 0)
    layerTable.add(layer)
    view.addLayer(layer)
  }

  renderAnnotations()
}

/**
 * 仅清除显示，不通知父组件（用于重新渲染前）
 */
const clearAnnotationDisplay = (): void => {
  const db = AcApDocManager.instance.curDocument?.database
  if (!db) return

  annotations.value.forEach(ann => {
    deleteAnnotationEntities(ann, db)
  })
}

/**
 * 渲染所有批注到图纸
 */
const renderAnnotations = (): void => {
  const view = AcApDocManager.instance.curView as AcEdBaseView
  const db = AcApDocManager.instance.curDocument?.database
  if (!db || !view) return

  annotations.value.forEach(ann => {
    const result = AcApAnnotationCmd.renderAnnotationToDb(ann, view, db)
    if (result.success) {
      ann.objectId = result.objectId // 统一使用 objectId
    }
  })
}
/**
 * 删除指定批注的实体
 */
const deleteAnnotationEntities = (ann: AnnotationData, db: any): void => {
  try {
    // 统一使用 objectId 删除
    if (ann.objectId) {
      db.tables.blockTable.modelSpace.removeEntity(ann.objectId)
    }
  } catch (e) {
    // 实体可能已不存在，忽略错误
  }
}

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
}
// 计算缩放比例用于预览
const getScale = (size: number) => {
  // 基础大小 16 对应 scale 1，越大显示越大
  return Math.max(0.8, Math.min(size / 16, 16))
}

// 点击其他地方关闭右键菜单
const handleClickOutside = (event: MouseEvent) => {
  // 关闭右键菜单
  const menu = document.querySelector('.annotation-context-menu')
  if (menu && !menu.contains(event.target as Node)) {
    showAnnotationMenu.value = false
  }
}

const goBack = () => {
  emit('back')
}

// 暴露方法给父组件
defineExpose({
  addAnnotation,
  loadAnnotations,
  // 可以暴露图层控制方法给父组件
  toggleAnnotationLayer,
  isAnnotationLayerVisible
})
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
  position: relative;
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

/* 子菜单样式 */
.annotation-context-menu .menu-item.has-submenu {
  position: relative;
}

.annotation-context-menu .submenu-arrow {
  margin-left: auto;
  font-size: 12px;
}

.annotation-context-menu .submenu {
  position: absolute;
  left: 100%;
  top: 0;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 4px 0;
  min-width: 120px;
  z-index: 3001;
}

.annotation-context-menu .menu-divider {
  height: 1px;
  background-color: #e4e7ed;
  margin: 4px 0;
}

/* 深色主题 */
.ml-theme-dark .annotation-context-menu .submenu {
  background: #2b2b2b;
  border-color: #444;
}

.ml-theme-dark .annotation-context-menu .menu-divider {
  background-color: #444;
}

/* 简化的字体大小选择网格 */
.text-size-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 8px;
}

.size-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fff;
}

.size-card:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
  transform: translateY(-2px);
}

.size-card.active {
  border-color: #409eff;
  background-color: #ecf5ff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.size-icon {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
  transition: transform 0.2s;
}

.size-card.active .size-icon {
  color: #409eff;
}

.size-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.size-value {
  font-size: 12px;
  color: #909399;
}

/* 深色主题 */
.ml-theme-dark .size-card {
  background: #2b2b2b;
  border-color: #444;
}

.ml-theme-dark .size-card:hover {
  background-color: #3a3a3a;
  border-color: #409eff;
}

.ml-theme-dark .size-card.active {
  background-color: #1a3a5c;
}

.ml-theme-dark .size-icon,
.ml-theme-dark .size-name {
  color: #d0d0d0;
}

.ml-theme-dark .size-card.active .size-icon,
.ml-theme-dark .size-card.active .size-name {
  color: #409eff;
}
</style>
