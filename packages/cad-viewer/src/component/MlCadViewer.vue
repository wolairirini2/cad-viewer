<template>
  <div ref="viewerRoot" class="ml-cad-viewer-wrapper">
    <!-- 新增Flex容器，包裹CAD区域和侧边栏 -->
    <div class="content-container">
      <!-- 主容器，包含canvas和UI层 -->
      <div class="cad-container">
        <!-- Canvas现在和UI层在同一层级 -->
        <div class="cad-area">
          <canvas ref="canvasRef" class="ml-cad-canvas"></canvas>
        </div>

        <!-- UI层覆盖在canvas上 -->
        <div v-if="editorRef" class="ui-overlay">
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
              <div class="ml-file-name">{{ store.fileName }}</div>

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

      <!-- 右侧：审查报告侧边栏 -->
      <div
        v-if="props.showRegulationPanel"
        class="regulation-panel"
        :class="{ collapsed: isPanelCollapsed }"
      >
        <!-- 折叠/展开按钮 -->
        <div class="panel-toggle" @click="togglePanel">
          <span class="toggle-icon">{{ isPanelCollapsed ? '◀' : '▶' }}</span>
          <span class="toggle-label" v-if="isPanelCollapsed">报告</span>
        </div>

        <!-- 侧边栏内容 -->
        <div class="panel-content" v-if="!isPanelCollapsed">
          <!-- 标题和统计 -->
          <div class="panel-header">
            <h3>AI审查报告</h3>
            <div class="report-stats">
              <span class="stat-item">
                <span class="stat-value">{{ totalViolations }}</span>
                <span class="stat-label">违规项</span>
              </span>
              <span class="stat-item">
                <span class="stat-value">{{ reportData.rules.length }}</span>
                <span class="stat-label">规范</span>
              </span>
            </div>
          </div>

          <!-- 搜索和筛选 -->
          <div class="panel-filters">
            <el-input
              v-model="searchText"
              placeholder="搜索规范或条目..."
              clearable
              size="small"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <div class="filter-buttons">
              <el-button
                :type="filterRisk === null ? 'primary' : 'default'"
                size="small"
                @click="filterRisk = null"
              >
                全部
              </el-button>
              <el-button
                :type="filterRisk === 'high' ? 'danger' : 'default'"
                size="small"
                @click="filterRisk = 'high'"
              >
                高风险
              </el-button>
              <el-button
                :type="filterRisk === 'medium' ? 'warning' : 'default'"
                size="small"
                @click="filterRisk = 'medium'"
              >
                中风险
              </el-button>
            </div>
          </div>

          <!-- 规范列表 -->
          <div class="regulation-list">
            <div
              v-for="rule in filteredRules"
              :key="rule.code"
              class="rule-panel"
            >
              <!-- 规范标题 -->
              <div class="rule-header" @click="toggleRule(rule.code)">
                <div class="rule-info">
                  <div class="rule-name">{{ rule.name }}</div>
                  <div class="rule-code">{{ rule.code }}</div>
                  <div class="rule-category">{{ rule.category }}</div>
                </div>
                <div class="rule-meta">
                  <span class="violation-count">
                    {{ getRuleViolationCount(rule) }} 项违规
                  </span>
                  <el-icon :class="rule.expanded ? 'expanded' : ''">
                    <ArrowDown />
                  </el-icon>
                </div>
              </div>

              <!-- 规范内容（可折叠） -->
              <div class="rule-content" v-if="rule.expanded">
                <div
                  v-for="article in rule.articles"
                  :key="article.id"
                  class="article-panel"
                >
                  <!-- 条目标题 -->
                  <div
                    class="article-header"
                    @click="toggleArticle(article.id)"
                  >
                    <div class="article-info">
                      <div class="article-title">{{ article.title }}</div>
                      <div class="article-id">条目 {{ article.id }}</div>
                    </div>
                    <el-icon :class="article.expanded ? 'expanded' : ''">
                      <ArrowDown />
                    </el-icon>
                  </div>

                  <!-- 条目内容（可折叠） -->
                  <div class="article-content" v-if="article.expanded">
                    <div class="article-description">
                      {{ article.content }}
                    </div>

                    <!-- 违规项列表 -->
                    <div
                      v-for="(violation, index) in getFilteredViolations(
                        article
                      )"
                      :key="index"
                      class="violation-item"
                    >
                      <div class="violation-header">
                        <div class="violation-title">{{ violation.title }}</div>
                        <el-tag
                          :type="getRiskTagType(violation.risk_level)"
                          size="small"
                        >
                          {{ getRiskText(violation.risk_level) }}
                        </el-tag>
                      </div>

                      <div class="violation-description">
                        {{ violation.description }}
                      </div>

                      <div class="violation-suggestion">
                        <strong>建议：</strong>{{ violation.suggestion }}
                      </div>

                      <!-- 几何信息 -->
                      <div
                        v-if="violation.geometry_ref"
                        class="violation-geometry"
                      >
                        <div class="geometry-info">
                          <span>坐标范围：</span>
                          <span>
                            ({{ violation.geometry_ref.extents.min_point.x }},
                            {{ violation.geometry_ref.extents.min_point.y }}) -
                            ({{ violation.geometry_ref.extents.max_point.x }},
                            {{ violation.geometry_ref.extents.max_point.y }})
                          </span>
                        </div>
                        <el-button
                          type="primary"
                          size="small"
                          @click="locateInDrawing(violation.geometry_ref)"
                        >
                          定位到图纸
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 无结果提示 -->
            <div v-if="filteredRules.length === 0" class="no-results">
              <el-empty description="未找到匹配的规范" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AcApDocManager, eventBus } from '@mlightcad/cad-simple-viewer'
import { AcDbOpenDatabaseOptions } from '@mlightcad/data-model'
import { useDark, useToggle } from '@vueuse/core'
import {
  ElMessage,
  ElInput,
  ElButton,
  ElTag,
  ElIcon,
  ElEmpty
} from 'element-plus'
import { computed, onMounted, ref, watch, nextTick, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, ArrowDown } from '@element-plus/icons-vue'

import { initializeCadViewer, store } from '../app'
import { useLocale, useNotificationCenter } from '../composable'
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
  /** 是否显示审查报告侧边栏 */
  showRegulationPanel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  locale: 'default',
  url: undefined,
  localFile: undefined,
  background: undefined,
  baseUrl: undefined,
  useMainThreadDraw: false,
  theme: 'dark',
  showRegulationPanel: true
})

const { t } = useI18n()
const { effectiveLocale, elementPlusLocale } = useLocale(props.locale)
const { info, warning, error, success } = useNotificationCenter()

// Canvas element reference
const canvasRef = ref<HTMLCanvasElement>()

// Referenence to the root element used to switch theme
const viewerRoot = ref<HTMLElement | null>(null)

// Editor reference that gets updated after initialization
const editorRef = ref<AcApDocManager | null>(null)

// Computed property to ensure proper typing
const editor = computed(() => editorRef.value as AcApDocManager)

// Notification center visibility
const showNotificationCenter = ref(false)

// 审查报告相关状态
const isPanelCollapsed = ref(false)
const searchText = ref('')
const filterRisk = ref<null | 'high' | 'medium'>(null)

// 审查报告数据
const reportData = ref({
  success: true,
  message: 'CAD防火审查完成，发现3个规范违规项',
  project_id: '项目1',
  rules: [
    {
      type: '国标',
      category: '建筑防火',
      name: '建筑设计防火规范',
      code: 'GB 50016-2014(2022)',
      expanded: true,
      articles: [
        {
          id: '3.3.1',
          title: '厂房的防火分区面积',
          content: '一般防火分区面积不能超过2000m2',
          expanded: true,
          violations: [
            {
              title: '防火分区超限',
              risk_level: 'high',
              description:
                '该防火分区实际面积4500㎡，超出规范允许的4000㎡，超出12.5%。火灾蔓延风险增加，不符合甲类厂房防火要求',
              suggestion: '调整防火分区边界，将面积控制在4000㎡以内',
              geometry_ref: {
                handles: ['1A2B3C', '2D3E4F'],
                extents: {
                  min_point: { x: 12450.5, y: 8765.2 },
                  max_point: { x: 13789.3, y: 9876.7 }
                }
              }
            }
          ]
        },
        {
          id: '3.7.1',
          title: '疏散距离要求',
          content: '厂房内任一点至最近安全出口的直线距离不应大于60m',
          expanded: true,
          violations: [
            {
              title: '疏散距离超标',
              risk_level: 'medium',
              description:
                '发现2处疏散路径长度超过规范要求，最大疏散距离75m，超出规范限制25%',
              suggestion:
                '增加安全出口或调整工作区域布局，确保疏散距离控制在60m以内',
              geometry_ref: {
                handles: ['5G6H7I', '8J9K0L'],
                extents: {
                  min_point: { x: 11200.0, y: 7500.0 },
                  max_point: { x: 14500.0, y: 9200.0 }
                }
              }
            }
          ]
        },
        {
          id: '3.8.2',
          title: '安全出口设置要求',
          content:
            '每个防火分区应至少设置2个安全出口，且安全出口间距不应小于5m',
          expanded: true,
          violations: [
            {
              title: '安全出口数量不足',
              risk_level: 'high',
              description:
                '防火分区A仅设置1个安全出口，不满足规范要求的至少2个安全出口。紧急情况下疏散风险极高',
              suggestion:
                '在防火分区A增设至少1个安全出口，确保满足双向疏散要求',
              geometry_ref: {
                handles: ['9M0N1O'],
                extents: {
                  min_point: { x: 12800.0, y: 8100.0 },
                  max_point: { x: 13200.0, y: 8500.0 }
                }
              }
            },
            {
              title: '安全出口间距不足',
              risk_level: 'medium',
              description:
                '防火分区B的两个安全出口间距仅3.2m，不满足规范要求的最小5m间距',
              suggestion: '调整安全出口位置，确保两个安全出口间距不小于5m',
              geometry_ref: {
                handles: ['2P3Q4R', '5S6T7U'],
                extents: {
                  min_point: { x: 15000.0, y: 7800.0 },
                  max_point: { x: 15800.0, y: 8600.0 }
                }
              }
            }
          ]
        }
      ]
    },
    {
      type: '国标',
      category: '消防设施',
      name: '消防给水及消火栓系统技术规范',
      code: 'GB 50974-2014',
      expanded: false,
      articles: [
        {
          id: '7.4.1',
          title: '室内消火栓设置',
          content:
            '室内消火栓应保证同一防火分区内的任何部位都能有两支水枪的充实水柱同时到达',
          expanded: false,
          violations: [
            {
              title: '消火栓保护范围不足',
              risk_level: 'medium',
              description:
                '防火分区C东北角区域超出消火栓保护范围，无法保证两支水枪同时到达',
              suggestion: '在该区域增设室内消火栓，确保全覆盖保护',
              geometry_ref: {
                handles: ['8V9W0X'],
                extents: {
                  min_point: { x: 13500.0, y: 9000.0 },
                  max_point: { x: 14200.0, y: 9800.0 }
                }
              }
            }
          ]
        }
      ]
    }
  ]
})

const isDark = useDark({
  selector: viewerRoot,
  attribute: 'class',
  valueDark: 'ml-theme-dark',
  valueLight: 'ml-theme-light'
})

const toggleDark = useToggle(isDark)

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
  const options: AcDbOpenDatabaseOptions = { minimumChunkSize: 1000 }
  await AcApDocManager.instance.openDocument(fileName, fileContent, options)
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
    const options: AcDbOpenDatabaseOptions = { minimumChunkSize: 1000 }
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
    const options: AcDbOpenDatabaseOptions = { minimumChunkSize: 1000 }
    await AcApDocManager.instance.openDocument(file.name, fileContent, options)
    store.fileName = AcApDocManager.instance.curDocument.docTitle
  } catch (error) {
    console.error('Failed to open local file:', error)
    ElMessage({
      message: t('main.message.failedToOpenFile', { fileName: file.name }),
      grouping: true,
      type: 'error',
      showClose: true
    })
  }
}

// 计算总违规项数
const totalViolations = computed(() => {
  let count = 0
  reportData.value.rules.forEach(rule => {
    rule.articles.forEach(article => {
      count += article.violations.length
    })
  })
  return count
})

// 过滤后的规则
const filteredRules = computed(() => {
  if (!searchText.value && filterRisk.value === null) {
    return reportData.value.rules
  }

  return reportData.value.rules
    .map(rule => {
      // 深拷贝规则以避免修改原始数据
      const filteredRule = { ...rule }
      filteredRule.articles = rule.articles
        .map(article => {
          const filteredArticle = { ...article }

          // 如果有关键词搜索，检查是否匹配
          if (searchText.value) {
            const searchLower = searchText.value.toLowerCase()
            const matchesSearch =
              rule.name.toLowerCase().includes(searchLower) ||
              rule.code.toLowerCase().includes(searchLower) ||
              article.title.toLowerCase().includes(searchLower) ||
              article.content.toLowerCase().includes(searchLower) ||
              article.violations.some(
                v =>
                  v.title.toLowerCase().includes(searchLower) ||
                  v.description.toLowerCase().includes(searchLower)
              )

            if (!matchesSearch) {
              filteredArticle.violations = []
            }
          }

          // 如果按风险等级过滤
          if (filterRisk.value) {
            filteredArticle.violations = filteredArticle.violations.filter(
              v => v.risk_level === filterRisk.value
            )
          }

          return filteredArticle
        })
        .filter(article => article.violations.length > 0)

      return filteredRule.articles.length > 0 ? filteredRule : null
    })
    .filter(Boolean) as any[]
})

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
let resizeObserver: ResizeObserver | null = null

// Component lifecycle: Initialize and load initial file if URL or localFile is provided
onMounted(async () => {
  // Initialize the CAD viewer with the internal canvas
  // Initialize the CAD viewer with the internal canvas
  if (canvasRef.value) {
    initializeCadViewer({
      canvas: canvasRef.value,
      baseUrl: props.baseUrl,
      useMainThreadDraw: props.useMainThreadDraw
    })

    // 设置自定义尺寸计算回调
    const view = AcApDocManager.instance.curView as any
    if (view.setCalculateSizeCallback) {
      view.setCalculateSizeCallback(() => {
        const cadContainer = document.querySelector(
          '.cad-container'
        ) as HTMLElement
        if (cadContainer) {
          return {
            width: cadContainer.clientWidth,
            height: cadContainer.clientHeight
          }
        }
        return {
          width: window.innerWidth,
          height: window.innerHeight - 30
        }
      })

      // 立即更新尺寸
      if (view.updateSize) {
        view.updateSize()
      }
    }

    // 使用ResizeObserver监听容器尺寸变化
    const cadContainer = document.querySelector('.cad-container')
    if (cadContainer && view.updateSize) {
      resizeObserver = new ResizeObserver(() => {
        // 防抖处理，避免频繁更新
        clearTimeout((window as any).__cadResizeTimer)
        ;(window as any).__cadResizeTimer = setTimeout(() => {
          view.updateSize()
        }, 100)
      })

      resizeObserver.observe(cadContainer)
    }

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
})

// 清理ResizeObserver
onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
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
  warning(t('main.notification.title.fontNotFound', message))
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

// 切换侧边栏展开/收起
const togglePanel = () => {
  isPanelCollapsed.value = !isPanelCollapsed.value
}

// 切换规范展开/收起
const toggleRule = (code: string) => {
  const rule = reportData.value.rules.find(r => r.code === code)
  if (rule) {
    rule.expanded = !rule.expanded
  }
}

// 切换条目展开/收起
const toggleArticle = (id: string) => {
  for (const rule of reportData.value.rules) {
    const article = rule.articles.find(a => a.id === id)
    if (article) {
      article.expanded = !article.expanded
      break
    }
  }
}

// 获取规则下的违规项总数
const getRuleViolationCount = (rule: any) => {
  return rule.articles.reduce((total: number, article: any) => {
    return total + article.violations.length
  }, 0)
}

// 获取过滤后的违规项
const getFilteredViolations = (article: any) => {
  let violations = article.violations

  if (filterRisk.value) {
    violations = violations.filter(
      (v: any) => v.risk_level === filterRisk.value
    )
  }

  return violations
}

// 获取风险标签类型
const getRiskTagType = (level: string) => {
  switch (level) {
    case 'high':
      return 'danger'
    case 'medium':
      return 'warning'
    case 'low':
      return 'success'
    default:
      return 'info'
  }
}

// 获取风险文本
const getRiskText = (level: string) => {
  switch (level) {
    case 'high':
      return '高风险'
    case 'medium':
      return '中风险'
    case 'low':
      return '低风险'
    default:
      return level
  }
}

// 定位到图纸（暂时不实现功能）
const locateInDrawing = (geometry: any) => {
  ElMessage({
    message: `定位到坐标: (${geometry.extents.min_point.x}, ${geometry.extents.min_point.y})`,
    type: 'info'
  })
  // TODO: 后续实现与CAD查看器的交互
  console.log('定位到几何体:', geometry)
}

// 在onMounted或watch中添加：
watch(
  () => isPanelCollapsed.value,
  () => {
    // 等待DOM更新完成
    nextTick(() => {
      // 触发resize事件，让CAD查看器重新计算尺寸
      if (editorRef.value) {
        // 方法1：触发窗口resize事件
        window.dispatchEvent(new Event('resize'))

        // 方法2：如果CAD查看器有resize方法，直接调用
        // if (editorRef.value.curView && typeof editorRef.value.curView.resize === 'function') {
        //   editorRef.value.curView.resize();
        // }

        // 方法3：重新设置canvas尺寸
        // if (canvasRef.value) {
        //   const canvas = canvasRef.value
        //   const container = canvas.parentElement
        //   if (container) {
        //     canvas.width = container.clientWidth
        //     canvas.height = container.clientHeight
        //   }
        // }
      }
    })
  },
  { immediate: true }
)
</script>

<style scoped>
/* 主包装器，使用flex布局 */
.ml-cad-viewer-wrapper {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
/* Flex容器 - 核心：让子元素（CAD和侧边栏）在同一层横向排列 */
.content-container {
  display: flex; /* 启用Flex布局 */
  width: 100%;
  height: 100%;
}

/* CAD容器 - 使用flex:1自适应宽度 */
.cad-container {
  flex: 1;
  display: flex;
  position: relative; /* 相对定位，作为canvas和UI层的容器 */
  min-width: 0; /* 防止flex项目溢出 */
  height: 100%;
  background: #1e1e1e; /* CAD背景色 */
  overflow: hidden; /* 防止内容溢出 */
}
/* CAD区域 - 占据整个容器 */
.cad-area {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}
/* Canvas元素 - 改为块级元素，填充CAD容器 */
.ml-cad-canvas {
  display: block;
  width: 100%;
  height: 100%;
  outline: none;
  pointer-events: auto;
  background: #1e1e1e;
}

/* UI覆盖层 - 绝对定位在canvas上方 */
.ui-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none; /* 允许事件穿透到canvas */
}

/* UI层内的元素可以接收事件 */
.ui-overlay > * {
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
  pointer-events: none;
  z-index: 1;
}

/* 审查报告侧边栏 */
.regulation-panel {
  width: 480px;
  background: #ffffff;
  border-left: 1px solid #e8e8e8;
  display: flex;
  transition: all 0.3s ease;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
  flex-shrink: 0; /* 防止侧边栏被压缩 */
  height: 100%;
}

.regulation-panel.collapsed {
  width: 48px;
}

/* 折叠按钮 */
.panel-toggle {
  width: 48px;
  background: #ffffff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.panel-toggle:hover {
  background: #f5f5f5;
}

.toggle-icon {
  font-size: 12px;
  color: #666;
}

.toggle-label {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
  writing-mode: vertical-lr;
  text-align: center;
}

/* 侧边栏内容 */
.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  min-width: 432px; /* 480px - 48px折叠按钮宽度 */
}

/* 标题区域 */
.panel-header {
  padding: 16px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.panel-header h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 500;
  color: #262626;
}

.report-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1890ff;
}

.stat-label {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
}

/* 筛选区域 */
.panel-filters {
  padding: 16px;
  background: #ffffff;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.filter-buttons {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

/* 规范列表 */
.regulation-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f5f5f5;
}

/* 规范面板 */
.rule-panel {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  margin-bottom: 12px;
  background: white;
  overflow: hidden;
}

.rule-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.2s ease;
  user-select: none;
}

.rule-header:hover {
  background: #fafafa;
}

.rule-info {
  flex: 1;
  min-width: 0;
}

.rule-name {
  font-size: 15px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rule-code {
  font-size: 12px;
  color: #8c8c8c;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  margin-right: 8px;
}

.rule-category {
  font-size: 12px;
  color: #666;
  display: inline-block;
}

.rule-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.violation-count {
  font-size: 12px;
  color: #ff4d4f;
  font-weight: 500;
  white-space: nowrap;
}

.el-icon {
  transition: transform 0.3s ease;
}

.el-icon.expanded {
  transform: rotate(180deg);
}

/* 条目面板 */
.article-panel {
  border-top: 1px solid #f0f0f0;
}

.article-header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background: #fafafa;
  transition: all 0.2s ease;
  user-select: none;
}

.article-header:hover {
  background: #f0f0f0;
}

.article-info {
  flex: 1;
  min-width: 0;
}

.article-title {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.article-id {
  font-size: 12px;
  color: #8c8c8c;
}

/* 条目内容 */
.article-content {
  padding: 16px;
  background: #ffffff;
}

.article-description {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #f0f0f0;
}

/* 违规项 */
.violation-item {
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  margin-bottom: 12px;
  background: #fafafa;
}

.violation-item:last-child {
  margin-bottom: 0;
}

.violation-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.violation-title {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  flex: 1;
  margin-right: 12px;
}

.violation-description {
  font-size: 13px;
  color: #595959;
  line-height: 1.5;
  margin-bottom: 8px;
}

.violation-suggestion {
  font-size: 13px;
  color: #1890ff;
  line-height: 1.5;
  margin-bottom: 12px;
  padding: 8px;
  background: #e6f7ff;
  border-radius: 4px;
}

.violation-geometry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px dashed #e8e8e8;
}

.geometry-info {
  font-size: 12px;
  color: #8c8c8c;
  flex: 1;
  margin-right: 12px;
}

.geometry-info span:first-child {
  color: #666;
  font-weight: 500;
}

/* 无结果提示 */
.no-results {
  text-align: center;
  padding: 40px 20px;
}

/* 滚动条样式 */
.regulation-list::-webkit-scrollbar {
  width: 6px;
}

.regulation-list::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.regulation-list::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}

.regulation-list::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .regulation-panel:not(.collapsed) {
    width: 400px;
  }

  .panel-content {
    min-width: 352px; /* 400px - 48px折叠按钮宽度 */
  }
}
</style>
