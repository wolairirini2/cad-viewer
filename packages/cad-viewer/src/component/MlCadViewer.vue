<template>
  <div ref="viewerRoot" class="ml-cad-viewer-wrapper">
    <!-- 新增Flex容器，包裹CAD区域和侧边栏 -->
    <div class="content-container">
      <!-- 左侧，包含canvas和UI层 -->
      <div class="cad-container">
        <!-- 根据文件类型自动选择查看器 -->
        <!-- CAD文件 -->
        <div v-show="fileType === 'cad'" class="cad-area">
          <canvas
            v-show="currentFileId"
            ref="canvasRef"
            class="ml-cad-canvas"
          ></canvas>
        </div>

        <!-- PDF文件 -->
        <div v-if="fileType === 'pdf'" class="preview-area">
          <div class="preview-toolbar">
            <el-button-group>
              <el-button size="small" @click="pdfPage > 1 && pdfPage--">
                <el-icon><ArrowLeft /></el-icon>上一页
              </el-button>
              <span class="page-info">{{ pdfPage }} / {{ pdfPages }}</span>
              <el-button size="small" @click="pdfPage < pdfPages && pdfPage++">
                下一页<el-icon><ArrowRight /></el-icon>
              </el-button>
            </el-button-group>
          </div>
          <VuePdfEmbed
            :source="previewUrl"
            :page="pdfPage"
            @loaded="onPdfLoaded"
            class="preview-iframe"
          />
        </div>

        <!-- Word文档（使用docx-preview渲染） -->
        <div v-else-if="fileType === 'docx'" class="preview-area">
          <MlWordViewer
            :src="
              wordPreviewUrl
                ? wordPreviewUrl.replace(
                    'http://192.168.3.184:9000',
                    '/storage'
                  )
                : previewUrl
                  ? previewUrl.replace('http://192.168.3.184:9000', '/storage')
                  : ''
            "
            :highlight-text="highlightText"
          />
        </div>
        <!-- Office文档 -->
        <div v-else-if="fileType === 'office'" class="preview-area">
          <iframe
            :src="officeViewerUrl"
            frameborder="0"
            class="preview-iframe"
            @load="handlePreviewLoad"
          ></iframe>
          <div class="preview-hint">
            文档预览由 Microsoft Office Online 提供
          </div>
        </div>

        <!-- 图片文件 -->
        <div v-else-if="fileType === 'image'" class="preview-area">
          <img :src="previewUrl" class="preview-image" alt="预览图片" />
        </div>

        <!-- CAD UI层（仅在CAD模式下显示） -->
        <div v-if="fileType === 'cad' && editorRef" class="ui-overlay">
          <el-config-provider :locale="elementPlusLocale">
            <header>
              <ml-main-menu />
            </header>
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

      <!-- 右侧：审查报告侧边栏 -->
      <div
        v-if="props.showRegulationPanel"
        class="regulation-panel"
        :class="{ collapsed: isPanelCollapsed }"
      >
        <!-- 折叠/展开按钮 - 改为小图标按钮 -->
        <el-button
          class="panel-toggle-btn"
          :class="{ collapsed: isPanelCollapsed }"
          :icon="isPanelCollapsed ? ArrowRight : ArrowLeft"
          circle
          size="small"
          @click="togglePanel"
          :title="isPanelCollapsed ? '展开报告' : '收起报告'"
        />

        <!-- 侧边栏内容 -->
        <div class="panel-content" v-if="!isPanelCollapsed">
          <!-- 标题 -->
          <div class="panel-header">
            <h3>{{ projectName }}审查报告</h3>
            <div class="panel-actions">
              <el-icon
                @click="goBack"
                style="
                  font-size: 20px;
                  color: var(--color-gray-500);
                  cursor: pointer;
                "
                ><Back
              /></el-icon>
            </div>
          </div>
          <div class="panel-actions">
            <!-- 风险等级筛选 - 改为 el-radio-group -->
            <div class="violation-filters">
              <div
                class="filter-item"
                :class="{ active: filterRisk === null }"
                @click="filterRisk = null"
              >
                <el-icon><List /></el-icon>
                <span>全部审查</span>
                <span class="filter-count">{{ totalViolations }}</span>
              </div>

              <div
                class="filter-item"
                :class="{ active: filterRisk === 'high' }"
                @click="filterRisk = 'high'"
              >
                <el-icon><WarnTriangleFilled /></el-icon>
                <span>重大问题</span>
                <span class="filter-count">{{ riskCounts.high }}</span>
              </div>

              <div
                class="filter-item"
                :class="{ active: filterRisk === 'medium' }"
                @click="filterRisk = 'medium'"
              >
                <el-icon><WarningFilled /></el-icon>
                <span>一般问题</span>
                <span class="filter-count">{{ riskCounts.medium }}</span>
              </div>

              <div
                class="filter-item"
                :class="{ active: filterRisk === 'low' }"
                @click="filterRisk = 'low'"
              >
                <el-icon><InfoFilled /></el-icon>
                <span>轻微问题</span>
                <span class="filter-count">{{ riskCounts.low }}</span>
              </div>
            </div>
            <div>
              <el-button
                icon="Stamp"
                type="primary"
                @click="handleExport"
                :disabled="selection.length === 0"
                style="padding-top: 10px"
              >
                批量发送
              </el-button>
              <el-button
                icon="Promotion"
                type="success"
                @click="handleExport"
                :disabled="selection.length === 0"
                style="padding-top: 10px"
              >
                导出报告
              </el-button>
            </div>
          </div>
          <!-- 违规项表格 -->
          <div class="panel-tabs">
            <div class="violation-table">
              <el-table
                :data="pagedData"
                height="100%"
                style="width: 100%"
                empty-text="未发现违规项"
                @row-click="handleRowClick"
                @selection-change="handleSelectionChange"
                border
                stripe
              >
                <el-table-column type="selection" width="45" align="center" />
                <el-table-column
                  prop="risk_level"
                  label="风险等级"
                  width="80"
                  align="center"
                >
                  <template #default="{ row }">
                    <el-tooltip>
                      <el-icon
                        style="font-size: 20px; margin-top: 8px"
                        :style="{
                          color: getRiskColor(row.risk_level)
                        }"
                      >
                        <component :is="getRiskIcon(row.risk_level)" />
                      </el-icon>
                      <template #content>
                        {{ getRiskText(row.risk_level) }}
                      </template>
                    </el-tooltip>
                  </template>
                </el-table-column>
                <el-table-column
                  prop="category"
                  label="问题来源"
                  width="90"
                  align="center"
                >
                  <template #default="{ row }">
                    <el-tag
                      :type="getFileCategoryTagType(row.category)"
                      size="small"
                    >
                      {{ row.category }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column
                  prop="title"
                  label="审查内容"
                  min-width="200"
                  show-overflow-tooltip
                >
                  <template #default="{ row }">
                    <span
                      style="color: var(--color-primary-dark); font-weight: 700"
                      >{{ row.articleTitle }}</span
                    >
                  </template>
                </el-table-column>
                <el-table-column
                  prop="description"
                  label="问题描述"
                  min-width="150"
                  show-overflow-tooltip
                  align="center"
                >
                  <template #default="{ row }">
                    {{ row.description || '审查已通过' }}
                  </template>
                </el-table-column>
                <el-table-column
                  prop="suggestion"
                  label="处理建议"
                  min-width="150"
                  show-overflow-tooltip
                  align="center"
                >
                  <template #default="{ row }">
                    {{ row.suggestion ? row.suggestion.join() : '无' }}
                  </template>
                </el-table-column>
                <el-table-column
                  label="操作"
                  width="100"
                  fixed="right"
                  align="center"
                >
                  <template #default="{ row }">
                    <el-button
                      type="info"
                      size="small"
                      @click.stop="handleLocateClick(row.geometry_ref, row)"
                      :loading="locating[row.violation_id]"
                      :disabled="
                        !row.geometry_ref?.extents && row.risk_level === 0
                      "
                      plain
                    >
                      定位
                    </el-button>
                    <el-button
                      size="small"
                      style="margin-left: 4px"
                      type="info"
                      plain
                      :disabled="row.risk_level === 0"
                      @click.stop=""
                      >发送</el-button
                    >
                  </template>
                </el-table-column>
              </el-table>
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :total="sortedViolations.length"
                layout="total,sizes, prev, pager, next, "
                style="padding: 8px; justify-content: center"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 修改后的详情对话框 -->
  <el-dialog
    v-model="showViolationDetail"
    title="审查内容详情"
    width="800px"
    class="violation-detail-dialog-wrapper"
    :style="{ maxHeight: '85vh' }"
    draggable
  >
    <div v-if="selectedViolation" class="violation-detail-dialog">
      <!-- 基本信息 -->
      <div class="detail-section">
        <div class="detail-row">
          <span class="detail-label">检查内容:</span>
          <span>{{ selectedViolation.articleTitle }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">风险等级:</span>
          <el-tag
            :type="getRiskTagType(selectedViolation.risk_level)"
            style="font-weight: bold"
          >
            {{ getRiskText(selectedViolation.risk_level) }}
          </el-tag>
        </div>
        <div class="detail-row">
          <span class="detail-label">问题来源:</span>
          <el-tag
            :type="getFileCategoryTagType(selectedViolation.category)"
            style="font-weight: bold"
          >
            {{ selectedViolation.category }}
          </el-tag>
        </div>
      </div>

      <!-- 合并显示所有 violations 的问题描述 -->
      <div class="detail-section">
        <h4>问题描述</h4>
        <div class="detail-content description-content">
          <div v-if="selectedViolation.allViolations.length > 0">
            <div
              v-for="(violation, index) in selectedViolation.allViolations"
              :key="'desc-' + index"
            >
              <div v-if="violation.description">
                <div class="description-item">
                  <span class="item-number">{{ index + 1 }}.</span>
                  <span
                    class="item-content"
                    v-html="formatDescription(violation.description)"
                  ></span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="description-text">审查已通过</div>
        </div>
      </div>

      <!-- 合并显示所有 violations 的修改建议 -->
      <div class="detail-section" v-if="hasSuggestions">
        <h4>修改建议</h4>
        <div class="detail-content suggestion">
          <ol class="suggestion-ol">
            <li
              v-for="(violation, index) in selectedViolation.allViolations"
              :key="'sug-' + index"
            >
              <template
                v-if="violation.suggestion && violation.suggestion.length > 0"
              >
                <div style="margin-top: 6px">
                  <span v-for="(item, idx) in violation.suggestion" :key="idx">
                    {{ item }}
                  </span>
                </div>
              </template>
            </li>
          </ol>
        </div>
      </div>

      <!-- 相关规范条文 -->
      <div class="detail-section">
        <h4>相关规范条文</h4>
        <div class="related-article">
          <div class="article-content">
            {{
              getArticleContent(selectedViolation.articleId)?.origin ||
              '未找到条文信息'
            }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="showViolationDetail = false"
          >关闭</el-button
        >
      </div>
    </template>
  </el-dialog>

  <!-- 新增：审查规范详情弹窗（仅用于 risk_level 为 0 的条目） -->
  <el-dialog
    v-model="showPassedDetail"
    title="审查规范详情"
    width="800px"
    class="violation-detail-dialog-wrapper"
    :style="{ maxHeight: '85vh' }"
    draggable
  >
    <div v-if="selectedViolation" class="violation-detail-dialog">
      <!-- 基本信息 -->
      <div class="detail-section">
        <div class="detail-row">
          <span class="detail-label">检查内容:</span>
          <span>{{ selectedViolation.articleTitle }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">问题来源:</span>
          <el-tag
            :type="getFileCategoryTagType(selectedViolation.category)"
            style="font-weight: bold"
          >
            {{ selectedViolation.category }}
          </el-tag>
        </div>
      </div>

      <!-- 几何信息 -->
      <div v-if="selectedViolation.geometry_ref" class="detail-section">
        <h4>图纸位置</h4>
        <div class="violation-geometry">
          <div
            v-if="selectedViolation.geometry_ref.extents"
            class="geometry-info"
          >
            <span>坐标范围：</span>
            <span>
              ({{
                selectedViolation.geometry_ref.extents.min_point.x.toFixed(2)
              }},
              {{
                selectedViolation.geometry_ref.extents.min_point.y.toFixed(2)
              }}) - ({{
                selectedViolation.geometry_ref.extents.max_point.x.toFixed(2)
              }},
              {{
                selectedViolation.geometry_ref.extents.max_point.y.toFixed(2)
              }})
            </span>
          </div>
          <div v-else class="geometry-info">
            <span>坐标范围：</span>
            <span>未提供</span>
          </div>
          <el-button
            type="primary"
            size="small"
            @click="locateInDrawing(selectedViolation.geometry_ref)"
            :disabled="!selectedViolation.geometry_ref.extents"
          >
            定位
          </el-button>
        </div>
      </div>

      <!-- 相关条目 -->
      <div class="detail-section">
        <h4>相关规范条文</h4>
        <div class="related-article">
          <div class="article-title">
            {{
              getArticleContent(selectedViolation.articleId)?.origin ||
              '未找到条文信息'
            }}
          </div>
          <div class="article-content">
            {{ getArticleContent(selectedViolation.articleId)?.content || '' }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="showPassedDetail = false"
          >关闭</el-button
        >
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { AcApDocManager, eventBus } from '@mlightcad/cad-simple-viewer'
import { AcDbOpenDatabaseOptions } from '@mlightcad/data-model'
import { useDark, useToggle } from '@vueuse/core'
import {
  ElMessage,
  ElButton,
  ElTag,
  ElIcon,
  ElTable,
  ElTableColumn,
  ElTooltip
} from 'element-plus'
import { computed, onMounted, ref, watch, nextTick, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ArrowRight,
  ArrowLeft,
  WarnTriangleFilled,
  InfoFilled,
  WarningFilled,
  List,
  Back
} from '@element-plus/icons-vue'

import { initializeCadViewer, store } from '../app'
import { useLocale, useNotificationCenter } from '../composable'
import { LocaleProp } from '../locale'
import { MlDialogManager, MlFileReader } from './common'
import { MlEntityInfo, MlMainMenu, MlToolBars } from './layout'
import { MlNotificationCenter } from './notification'
import { MlPaletteManager } from './palette'
import { MlStatusBar } from './statusBar'
import { AcGeBox2d } from '@mlightcad/data-model'
import VuePdfEmbed from 'vue-pdf-embed'
import { ElMessageBox } from 'element-plus'
import ExcelJS from 'exceljs'
import MlWordViewer from './MlWordViewer.vue'

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

  /** 审查报告数据，如果提供则使用此数据而不是静态数据 */
  reviewReportData?: any
  currentFileId?: string | null
  /** 新增：文档预览URL，如果提供则显示iframe预览器 */
  previewUrl?: string
  /** 文件名，用于判断文件类型 */
  fileName?: string
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
  showRegulationPanel: true,
  reviewReportData: undefined,
  currentFileId: undefined,
  previewUrl: undefined, // 新增默认值
  fileName: '',
  projectName: ''
})

// Word文档查看相关
const wordPreviewUrl = ref<string>('')
const highlightText = ref<string>('')
const highlightedIds = ref<string[]>([]) // 记录通过 highlight() 高亮的实体ID

const projectName = computed(() => decodeURIComponent(props.projectName))

// PDF分页控制
const pdfPage = ref(1)
const pdfPages = ref(0)
// 替换原有的 fileType 计算属性
const fileType = computed(() => {
  if (props.url || props.localFile) return 'cad'
  if (!props.previewUrl) return null

  const fileExt =
    (props.fileName || props.previewUrl)
      .toLowerCase()
      .split('.')
      .pop()
      ?.split('?')[0] || ''

  // PDF
  if (fileExt === 'pdf') return 'pdf'

  // Word文档 - 使用docx-preview渲染
  if (fileExt === 'docx') return 'docx'

  // 其他Office文档
  if (['doc', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExt)) {
    return 'office'
  }

  // 图片
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(fileExt)) {
    return 'image'
  }

  return 'unsupported'
})
// Office在线查看器URL（使用Microsoft Office Web Viewer）
const officeViewerUrl = computed(() => {
  if (fileType.value !== 'office') return ''

  // 使用Microsoft Office在线查看器（支持跨域，无需额外配置）
  const encodedUrl = encodeURIComponent(props.previewUrl ?? '')
  console.log('officeViewerUrl:', encodedUrl)
  // return `/proxy?url=${encodedUrl}`
  return props.previewUrl
})

// PDF加载完成
const onPdfLoaded = (pdf: any) => {
  pdfPages.value = pdf.numPages
  ElMessage.success('PDF加载成功')
}

// 预览加载完成处理
const handlePreviewLoad = () => {
  console.log('预览文档加载完成:', props.previewUrl)
}

// 修改watch，监听previewUrl变化
watch(
  () => props.previewUrl,
  newPreviewUrl => {
    if (newPreviewUrl) {
      // 预览模式，清空CAD相关设置
      // cadUrl.value = ''
      // 可以在这里添加清理CAD资源的逻辑
      cleanupCadResources()
    }
  }
)
// 添加清理CAD资源的函数
const cleanupCadResources = () => {
  // 清理CAD查看器相关资源
  if (editorRef.value) {
    // 这里可以根据需要清理CAD资源
    // 例如：清除选择集、停止渲染等
  }
  // 清理定位信息
  currentLocateInfo.value = {}
}

// 监听文件类型变化
watch(fileType, (newType, oldType) => {
  if (newType !== 'cad' && oldType === 'cad') {
    cleanupCadResources()
  }

  // 重置PDF页码
  if (newType === 'pdf') {
    pdfPage.value = 1
  }
})

const emit = defineEmits<{
  switchDrawing: [fileId: string]
}>()
const locating = ref<Record<string, boolean>>({}) // 定位加载状态

// 在响应式变量部分添加一个跟踪当前定位状态的变量
const currentLocateInfo = ref<{
  fileId?: string
  geometryRef?: any
  highlightText?: string
  rowId?: string
}>({})

// 修改定位函数，添加重复定位检测
const handleLocateClick = async (geometry: any, row: any) => {
  // 设计说明类型：切换到Word预览并高亮
  if (row.category === '设计说明') {
    if (!geometry.chapter) {
      ElMessage.warning('无法获取关键词')
      return
    }
    const keyword = geometry.chapter
    const targetFileId = geometry.file_id

    if (!targetFileId) {
      ElMessage.warning('无法获取文件信息')
      return
    }

    // 检查是否是重复定位
    const isSameLocation =
      currentLocateInfo.value.rowId === row.violation_id &&
      currentLocateInfo.value.highlightText === keyword &&
      currentLocateInfo.value.fileId === targetFileId

    if (isSameLocation) {
      ElMessage.info('已在当前问题位置')
      // 添加闪烁效果
      const wordViewerElement = document.querySelector(
        '.preview-area .docx-highlight'
      )
      if (wordViewerElement) {
        wordViewerElement.animate(
          [
            { backgroundColor: 'var(--color-warning)' },
            { backgroundColor: 'var(--color-primary)' },
            { backgroundColor: 'var(--color-warning)' }
          ],
          { duration: 500, iterations: 2 }
        )
      }
      return
    }

    // 清理CAD资源
    cleanupCadResources()

    // 关键修复：如果文件不同，通知父组件切换文件
    if (props.currentFileId !== targetFileId) {
      await emit('switchDrawing', targetFileId)
      // 等待文件加载完成
      await new Promise(resolve => setTimeout(resolve, 800))
    }

    // 更新当前定位信息
    currentLocateInfo.value = {
      fileId: targetFileId,
      geometryRef: geometry,
      highlightText: keyword,
      rowId: row.violation_id
    }

    // 触发高亮
    highlightText.value = ''
    await nextTick()
    highlightText.value = keyword

    ElMessage.success(`正在定位问题位置...`)
    return
  }

  // CAD图纸定位逻辑（保持不变）
  if (!geometry?.file_id) {
    ElMessage.warning('无法获取图纸信息')
    return
  }

  // if (!geometry?.extents) {
  //   ElMessage.warning('无法获取几何信息')
  //   return
  // }

  try {
    if (geometry.violation_id) {
      locating.value[geometry.violation_id] = true
    }

    const isSameLocation =
      currentLocateInfo.value.rowId === row.violation_id &&
      currentLocateInfo.value.fileId === geometry.file_id &&
      JSON.stringify(currentLocateInfo.value.geometryRef?.extents) ===
        JSON.stringify(geometry.extents)

    if (isSameLocation) {
      ElMessage.info('已在当前问题位置')
      return
    }

    if (props.currentFileId !== geometry.file_id) {
      await emit('switchDrawing', geometry.file_id)
      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    currentLocateInfo.value = {
      fileId: geometry.file_id,
      geometryRef: geometry,
      highlightText: row.title,
      rowId: row.violation_id
    }

    await locateInDrawing(geometry)
  } catch (error) {
    console.error('定位失败:', error)
    ElMessage.error('定位失败，请稍后重试')
  } finally {
    if (geometry.violation_id) {
      locating.value[geometry.violation_id] = false
    }
  }
}

const { t } = useI18n()
const { elementPlusLocale } = useLocale(props.locale)
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
const filterRisk = ref<null | 'high' | 'medium' | 'low'>(null)

// 修改reportData，优先使用props传入的数据
const reportData = computed(() => {
  if (props.reviewReportData) {
    return props.reviewReportData
  }
  // 返回空数据
  return {
    rules: [
      {
        code: 'DESIGN-SPEC-001',
        name: '工程设计说明编制规范',
        type: '行业标准',
        articles: [
          {
            id: '0',
            title: '设计依据规范性检查',
            origin: 'Q/GDW 10166-2025',
            content:
              '核对设计依据部分所用到的国家、企业、行业、公司的标准、规程、规范是否为有效文件，避免使用过时或有冲突的版本',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '补充具体标准名称及版本号，如《35kV~110kV变电站设计规范》（GB 50059）、《电力工程电缆设计规范》（GB 50217）等'
                ],
                description:
                  "设计依据未明确列出具体引用的国家、行业标准名称及版本号，仅以'现行标准'概括，可能导致规范适用性存疑",
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充说明SZ20-25000/110-NX2型号是否满足GB/T 1094.1-2013《电力变压器 第1部分：总则》等标准技术要求'
                ],
                description: '主变压器型号参数未说明是否符合国家变压器标准要求',
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'low',
                suggestion: [
                  '在设计说明中增加设备选型与GB 7251《低压成套开关设备和控制设备》等标准的符合性声明'
                ],
                description: '设备招标结果未体现与行业标准的关联性说明',
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '1',
            title: '设计范围是否清晰明确',
            origin: 'Q/GDW 10166-2025',
            content:
              '核对设计范围是否清晰明确，涵盖系统设计、电气一次、电气二次、土建、消防、通信、远动等全部必要内容',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '在设计范围中补充电气二次系统设计内容，明确包括继电保护配置、自动装置设计、监控系统方案等'
                ],
                description:
                  '设计范围未明确涵盖电气二次系统设计内容，如继电保护、自动装置、监控系统等',
                geometry_ref: {
                  chapter:
                    '1. 设计内容\n\n本工程施工图设计内容包括电力变压器及各级电压配电装置安装、无功补偿并联电容器装置安装、全站防雷接地以及全站一次电缆敷设及防火封堵设计。\n\n2. 设计范围\n\n本变电站设计与线路设计分界为：110kV配电装置以110kV进线电缆头（不含）为界，10kV配电装置以出线电缆头（不含）为界。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充土建设计内容，明确包括建筑结构设计、基础工程设计、排水系统设计等专业内容'
                ],
                description:
                  '土建设计内容描述不完整，未明确建筑结构、基础设计、排水系统等必要内容',
                geometry_ref: {
                  chapter:
                    '1. 设计内容\n\n本工程施工图设计内容包括电力变压器及各级电压配电装置安装、无功补偿并联电容器装置安装、全站防雷接地以及全站一次电缆敷设及防火封堵设计。\n\n2. 设计范围\n\n本变电站设计与线路设计分界为：110kV配电装置以110kV进线电缆头（不含）为界，10kV配电装置以出线电缆头（不含）为界。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在设计范围中增加通信系统设计和远动系统设计内容，明确包括通信网络规划、远动装置配置等'
                ],
                description:
                  '通信和远动系统设计未在设计范围中体现，缺少相关专业设计内容',
                geometry_ref: {
                  chapter:
                    '1. 设计内容\n\n本工程施工图设计内容包括电力变压器及各级电压配电装置安装、无功补偿并联电容器装置安装、全站防雷接地以及全站一次电缆敷设及防火封堵设计。\n\n2. 设计范围\n\n本变电站设计与线路设计分界为：110kV配电装置以110kV进线电缆头（不含）为界，10kV配电装置以出线电缆头（不含）为界。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '完善消防设计内容，补充消防设施配置方案、消防通道布置、火灾报警系统设计等具体要求'
                ],
                description:
                  '消防系统设计描述过于简略，未明确消防设施配置、消防通道设计等关键内容',
                geometry_ref: {
                  chapter:
                    '1. 设计内容\n\n本工程施工图设计内容包括电力变压器及各级电压配电装置安装、无功补偿并联电容器装置安装、全站防雷接地以及全站一次电缆敷设及防火封堵设计。\n\n2. 设计范围\n\n本变电站设计与线路设计分界为：110kV配电装置以110kV进线电缆头（不含）为界，10kV配电装置以出线电缆头（不含）为界。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '2',
            title: '核查设计分界点',
            origin: 'Q/GDW 10166-2025',
            content: '设计分界点应定义明确，责任边界无模糊或遗漏',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '在设计说明中补充说明110kV/10kV电缆头的安装责任单位（如线路设计方或施工方）',
                  '明确电缆头连接方式及验收标准'
                ],
                description:
                  '设计分界点未明确电缆头的安装责任归属，可能导致施工阶段责任不清',
                geometry_ref: {
                  chapter:
                    '1. 设计内容\n\n本工程施工图设计内容包括电力变压器及各级电压配电装置安装、无功补偿并联电容器装置安装、全站防雷接地以及全站一次电缆敷设及防火封堵设计。\n\n2. 设计范围\n\n本变电站设计与线路设计分界为：110kV配电装置以110kV进线电缆头（不含）为界，10kV配电装置以出线电缆头（不含）为界。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充T接点的施工责任划分（如由线路设计方负责接线施工）',
                  '明确T接点与变电站侧的连接方式及验收要求'
                ],
                description:
                  'T接点处理责任边界未明确，可能影响与现有线路的协调施工',
                geometry_ref: {
                  chapter:
                    '1. 设计内容\n\n本工程施工图设计内容包括电力变压器及各级电压配电装置安装、无功补偿并联电容器装置安装、全站防雷接地以及全站一次电缆敷设及防火封堵设计。\n\n2. 设计范围\n\n本变电站设计与线路设计分界为：110kV配电装置以110kV进线电缆头（不含）为界，10kV配电装置以出线电缆头（不含）为界。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'low',
                suggestion: [
                  '在设计说明中明确电缆敷设范围需延伸至分界点（电缆头）',
                  '补充电缆敷设路径与分界点的衔接要求'
                ],
                description:
                  '电缆敷设范围未与分界点明确关联，可能造成施工范围遗漏',
                geometry_ref: {
                  chapter:
                    '1. 设计内容\n\n本工程施工图设计内容包括电力变压器及各级电压配电装置安装、无功补偿并联电容器装置安装、全站防雷接地以及全站一次电缆敷设及防火封堵设计。\n\n2. 设计范围\n\n本变电站设计与线路设计分界为：110kV配电装置以110kV进线电缆头（不含）为界，10kV配电装置以出线电缆头（不含）为界。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充电缆头处接地装置的设计要求（如接地极规格、埋设深度）',
                  '明确分界点两侧接地系统的连接方式'
                ],
                description: '防雷接地设计未明确分界点处的接地处理要求',
                geometry_ref: {
                  chapter:
                    '1. 设计内容\n\n本工程施工图设计内容包括电力变压器及各级电压配电装置安装、无功补偿并联电容器装置安装、全站防雷接地以及全站一次电缆敷设及防火封堵设计。\n\n2. 设计范围\n\n本变电站设计与线路设计分界为：110kV配电装置以110kV进线电缆头（不含）为界，10kV配电装置以出线电缆头（不含）为界。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '3',
            title: '审查选址合理性',
            origin: 'Q/GDW 10166-2025',
            content:
              '变电站要尽量远离居民区等对噪声敏感的建筑物，应做到节约占地、技术先进、整齐美观、投资优化，布置方案应统筹考虑近期规模及远期规划的合理衔接',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '补充选址地理位置信息',
                  '提供与最近居民区的直线距离和方位数据'
                ],
                description:
                  '设计说明未明确变电站选址的具体地理位置及与周边居民区的距离，无法验证是否符合远离居民区的要求',
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'low',
                suggestion: [
                  '在设计说明中补充远景10kV出线数量规划',
                  '明确当前出线通道的可扩展性设计'
                ],
                description:
                  '远景规划中未明确10kV出线数量的扩展方案，可能影响后期设备布置和通道预留',
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充高压与低压设备之间的隔离距离要求',
                  '增加电缆沟分层布置方案'
                ],
                description:
                  '平面布置未说明110kV进线与10kV出线之间的安全隔离措施，存在电磁干扰风险',
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'low',
                suggestion: [
                  '补充接入点地理位置信息',
                  '提供线路路径优化方案及投资对比分析'
                ],
                description:
                  '未提及变电站与上级电网T接点延太733线的接入距离和路径优化方案',
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '4',
            title: '负荷审查',
            origin: 'GB/T 15544.1-2023',
            content:
              '检查本期投运的设备能够满足目前的用电负荷需求，且具备一定的余量。',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '补充项目地理位置信息',
                  '根据《供配电系统设计规范》第3.0.2条要求，结合供电可靠性需求确定负荷等级'
                ],
                description:
                  '设计说明中未明确项目选址信息，导致无法评估外部供电条件和负荷等级划分的合理性',
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '补充负荷统计表及功率因数取值依据',
                  '提供负荷同时系数和需求系数的计算过程'
                ],
                description:
                  '未提供具体负荷计算参数，无法验证视在功率计算结果的准确性',
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在电气一次接线图中补充LGJ-120/20导线的载流量参数',
                  '注明导线载流量的取值依据（如GB 50217相关条款）'
                ],
                description:
                  '导线载流量参数未在设计说明中明确标注，影响线路容量校验',
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '补充本期负荷的有功功率和无功功率计算过程',
                  '提供变压器容量与负荷需求的对比分析'
                ],
                description:
                  '变压器容量与负荷需求的匹配关系未进行说明，无法验证容量选择的合理性',
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '5',
            title: 'GIS选取合理性',
            origin: 'DL/T 5352-2018',
            content: '审查是否应该使用GIS',
            violations: []
          },
          {
            id: '6',
            title: '审查主变装置选型的合理性',
            origin: 'GB/T 6451-2023',
            content: '审查主变装置选型的合理性',
            violations: [
              {
                risk_level: 'high',
                suggestion: [
                  '根据负荷中心直接降压需求，应选用双绕组变压器而非自耦变压器',
                  '自耦变压器适用于电压差异较小的场合（如110kV至110kV降压），而本项目110kV至10.5kV差异较大，需重新评估选型'
                ],
                description:
                  '主变选型为自耦变压器，但电压等级差异较大，未合理匹配绕组类型',
                geometry_ref: {
                  chapter:
                    '1. 主变压器的选型\n\n（1）#1主变采用SZ20-25000/110-NX2型一体式双圈自冷有载调压变压器，厂家为江苏华鹏变压器有限公司。\n\n容量：25MVA/25MVA；\n\n电压比：110±8×1.25%/10.5kV；\n\n短路阻抗电压：UK=10.5%；\n\n联结组别：YN ,d11；\n\n冷却方式：自冷\n\n有载调压开关：CVⅢ-350Y/72.5-10193W,17级\n\n附套管电流互感器:\n\n高压侧 LRB-110，200-400-600/5A，5P30，20VA，每相1只\n\nLRB-110，200-400-600/5A，5P30，20VA，每相1只\n\nLR-110，200-400-600/5A，0.5，30VA，每相1只\n\nLR-110，200-400-600/5A，0.5，20VA，仅B相\n\n8） 轨    距：标准轨距，2040mm\n\n9）变压器满足《GB20052-2020电力变压器能效限定值及能效等级》二级能效相关技术要求。\n\n2. 110kV设备的选择\n\n110kV配电装置选用GIS全封闭组合电器，厂家为上海思源高压开关有限公司，三相共箱，额定电流2000A，开断电流40kA；动稳定电流100kA；热稳定电流40kA/3s，配电缆终端筒2000A。\n\n110kV进线计量电压互器选用：(110√3)/(0.1/√3)/(0.1/√3) /0.1kV，0.2/0.5/3P，10/50/100VA，带电显示器。\n\n计量电流互感器选用变比为150-250/5A（本期150/5），0.2S，15VA。\n\n110kV保护电流互感器：300-600/5A，5P30/5P30/5P30/0.5/0.2S。\n\n110kV避雷器选用氧化锌避雷器，标称放电电流10kA，额定电压102kV, 雷电冲击残压266kV，并配置在线监测装置。\n\n3.主变中性点设备\n\n主变中性点设备厂家为大连新安越电力设备有限公司，型号BZFZ-110；配中性点隔离开关：GW13-72.5/630A，附CJ6B电动操作机构；零序CT：LZW-10 100-300/5A 5P30/5P30 20VA；避雷器：Y1.5W-72/186，附在线监测仪；放电间隙90-150mm范围可调；中性点间隙CT：LZW-10 100-300/5A 5P30/5P30 20VA，支架配套。\n\n4. 10kV设备选择\n\n1）10kV开关柜厂家为江阴市富仁电气有限公司，KYN28A-12型金属铠装中置手车式开关柜，额定电压10kV。主母线额定电流2000A，热稳定电流31.5kA/4s，爬电比距20mm/kV，防护等级IP4X。\n\n柜内真空断路器CV1-12。主变进线柜额定电流2000A，开断电流31.5kA；出线柜、电容器柜、接地变柜额定电流1250A，开断电流25kA。\n\n柜内电流互感器采用户内环氧树脂浇注式电流互感器。主变进线CT型号LZZBJ9-10E3 2000/5A 5P30/5P30/5P30/0.5/0.2S 30/30/30/30/30VA。出线回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。电容器回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。消谐回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。\n\n10kV开关柜内电压互感器选用户内多绕组环氧树脂浇注式电压互感器。10kV母设柜PT为JDZX9-10G2 ///kV  0.2/0.5（3P）/3P 30/50/100VA。\n\n10kV柜内避雷器选用复合外套金属氧化物避雷器，型号HY5WZ-17/45，母设柜内避雷器附在线监测仪，其余避雷器附计数器。\n\n2）10kV电容器组厂家为靖江市普瑞电力科技有限公司，户内框架式布置，电容器采用PRFC10-2400/400AK(5%)，额定电压：10kV，单台容量：400kvar，配串联电抗器：CKSC-120/10-5%。\n\n3）10kV滤波补偿成套装置厂家为靖江市普瑞电力科技有限公司，户内布置，1#滤波补偿成套装置(12000kvar)内包含：1#滤波支路(5次)容量为4800kvar，滤波支路(7次)容量为3600kvar，滤波支路(11次)容量为3600kvar。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在设计说明中明确主变为三相变压器型号（如SZ20系列通常为三相，需核对厂家参数）',
                  '若确为三相变压器，需补充说明符合优先选用三相变压器的规范要求'
                ],
                description:
                  '未明确主变是否为三相变压器，存在选型优先级偏差风险',
                geometry_ref: {
                  chapter:
                    '1. 主变压器的选型\n\n（1）#1主变采用SZ20-25000/110-NX2型一体式双圈自冷有载调压变压器，厂家为江苏华鹏变压器有限公司。\n\n容量：25MVA/25MVA；\n\n电压比：110±8×1.25%/10.5kV；\n\n短路阻抗电压：UK=10.5%；\n\n联结组别：YN ,d11；\n\n冷却方式：自冷\n\n有载调压开关：CVⅢ-350Y/72.5-10193W,17级\n\n附套管电流互感器:\n\n高压侧 LRB-110，200-400-600/5A，5P30，20VA，每相1只\n\nLRB-110，200-400-600/5A，5P30，20VA，每相1只\n\nLR-110，200-400-600/5A，0.5，30VA，每相1只\n\nLR-110，200-400-600/5A，0.5，20VA，仅B相\n\n8） 轨    距：标准轨距，2040mm\n\n9）变压器满足《GB20052-2020电力变压器能效限定值及能效等级》二级能效相关技术要求。\n\n2. 110kV设备的选择\n\n110kV配电装置选用GIS全封闭组合电器，厂家为上海思源高压开关有限公司，三相共箱，额定电流2000A，开断电流40kA；动稳定电流100kA；热稳定电流40kA/3s，配电缆终端筒2000A。\n\n110kV进线计量电压互器选用：(110√3)/(0.1/√3)/(0.1/√3) /0.1kV，0.2/0.5/3P，10/50/100VA，带电显示器。\n\n计量电流互感器选用变比为150-250/5A（本期150/5），0.2S，15VA。\n\n110kV保护电流互感器：300-600/5A，5P30/5P30/5P30/0.5/0.2S。\n\n110kV避雷器选用氧化锌避雷器，标称放电电流10kA，额定电压102kV, 雷电冲击残压266kV，并配置在线监测装置。\n\n3.主变中性点设备\n\n主变中性点设备厂家为大连新安越电力设备有限公司，型号BZFZ-110；配中性点隔离开关：GW13-72.5/630A，附CJ6B电动操作机构；零序CT：LZW-10 100-300/5A 5P30/5P30 20VA；避雷器：Y1.5W-72/186，附在线监测仪；放电间隙90-150mm范围可调；中性点间隙CT：LZW-10 100-300/5A 5P30/5P30 20VA，支架配套。\n\n4. 10kV设备选择\n\n1）10kV开关柜厂家为江阴市富仁电气有限公司，KYN28A-12型金属铠装中置手车式开关柜，额定电压10kV。主母线额定电流2000A，热稳定电流31.5kA/4s，爬电比距20mm/kV，防护等级IP4X。\n\n柜内真空断路器CV1-12。主变进线柜额定电流2000A，开断电流31.5kA；出线柜、电容器柜、接地变柜额定电流1250A，开断电流25kA。\n\n柜内电流互感器采用户内环氧树脂浇注式电流互感器。主变进线CT型号LZZBJ9-10E3 2000/5A 5P30/5P30/5P30/0.5/0.2S 30/30/30/30/30VA。出线回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。电容器回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。消谐回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。\n\n10kV开关柜内电压互感器选用户内多绕组环氧树脂浇注式电压互感器。10kV母设柜PT为JDZX9-10G2 ///kV  0.2/0.5（3P）/3P 30/50/100VA。\n\n10kV柜内避雷器选用复合外套金属氧化物避雷器，型号HY5WZ-17/45，母设柜内避雷器附在线监测仪，其余避雷器附计数器。\n\n2）10kV电容器组厂家为靖江市普瑞电力科技有限公司，户内框架式布置，电容器采用PRFC10-2400/400AK(5%)，额定电压：10kV，单台容量：400kvar，配串联电抗器：CKSC-120/10-5%。\n\n3）10kV滤波补偿成套装置厂家为靖江市普瑞电力科技有限公司，户内布置，1#滤波补偿成套装置(12000kvar)内包含：1#滤波支路(5次)容量为4800kvar，滤波支路(7次)容量为3600kvar，滤波支路(11次)容量为3600kvar。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '7',
            title: '110kV有效接地系统审查',
            origin: 'GB/T 50064-2014',
            content: '110kV有效接地系统审查',
            violations: [
              {
                risk_level: 'high',
                suggestion: [
                  '根据系统电压等级调整10kV接地方式，采用有效接地系统（如经消弧线圈或直接接地）',
                  '重新校核系统零序与正序电抗比、零序电阻与正序电抗比参数'
                ],
                description: '10kV系统未采用有效接地方式，可能违反相关规范要求',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充说明主变中性点在正常运行时的接地方式（是否通过隔离开关直接接地）',
                  '明确放电间隙在系统失地时的保护逻辑'
                ],
                description:
                  '主变压器中性点接地方式描述不明确，未明确说明是否在正常运行时直接接地',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充主变压器中性点绝缘等级参数',
                  '根据绝缘等级验证避雷器（Y1.5W-72/186）和放电间隙（90-150mm）的配置是否符合规范要求'
                ],
                description:
                  '未明确主变压器中性点绝缘等级是否按线电压设计，影响避雷器配置合理性',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '8',
            title: '10kV中性点经消弧圈接地系统审查',
            origin: 'DL/T 5222-2021',
            content: '10kV中性点经消弧圈接地系统审查',
            violations: [
              {
                risk_level: 'high',
                suggestion: [
                  '在设计说明中明确主变压器中性点接地方式为消弧圈接地或不接地',
                  '补充消弧圈设备选型及参数配置说明'
                ],
                description:
                  '主变压器中性点接地方式未明确采用消弧圈或不接地方式，设计说明中仅提及放电间隙和避雷器，不符合中性点经消弧圈接地系统的要求',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充消弧圈调节范围与系统电容电流（18.9A）的匹配性计算',
                  '明确消弧圈型号及补偿度参数'
                ],
                description:
                  '10kV系统电容电流补偿范围未与消弧圈调节能力匹配，设计参数未体现消弧圈选型依据',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '根据GB 50060-2008规范要求，补充中性点接地方式选择依据',
                  '明确不同电压等级对应的接地方式技术参数'
                ],
                description:
                  '接地系统设计未明确中性点接地方式与系统电压等级的对应关系，存在接地方式选择错误风险',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '9',
            title: '无功补偿审查',
            origin: 'DL/T 5242-2010',
            content: '无功补偿审查',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '补充无功补偿装置的容量计算依据，明确补偿功率因数目标值（如0.95以上）',
                  '根据10kV出线回路数（本期9回/远景14回）制定分组方案，建议采用4-6组分级投切'
                ],
                description:
                  '设计说明未明确无功补偿装置的配置容量及分组原则，可能导致补偿效果不足或设备过载',
                geometry_ref: {
                  chapter:
                    '1. 设计内容\n\n本工程施工图设计内容包括电力变压器及各级电压配电装置安装、无功补偿并联电容器装置安装、全站防雷接地以及全站一次电缆敷设及防火封堵设计。\n\n2. 设计范围\n\n本变电站设计与线路设计分界为：110kV配电装置以110kV进线电缆头（不含）为界，10kV配电装置以出线电缆头（不含）为界。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '在设备选型中明确电容器装置的绝缘等级应满足GB 50227对不接地系统的要求',
                  '增加电容器装置的过电压保护措施，配置氧化锌避雷器'
                ],
                description:
                  '未说明电容器装置与10kV不接地系统的适配性，存在绝缘不达标风险',
                geometry_ref: {
                  chapter:
                    '1. 设计内容\n\n本工程施工图设计内容包括电力变压器及各级电压配电装置安装、无功补偿并联电容器装置安装、全站防雷接地以及全站一次电缆敷设及防火封堵设计。\n\n2. 设计范围\n\n本变电站设计与线路设计分界为：110kV配电装置以110kV进线电缆头（不含）为界，10kV配电装置以出线电缆头（不含）为界。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '补充谐波源负荷调查数据，明确滤波器调谐频率（建议5-7次谐波）',
                  '配置动态无功补偿装置（SVG）作为补充，避免固定式电容器与谐波频率共振'
                ],
                description:
                  '未体现滤波补偿装置的谐波治理方案，可能引发系统谐振或设备损坏',
                geometry_ref: {
                  chapter:
                    '1. 设计内容\n\n本工程施工图设计内容包括电力变压器及各级电压配电装置安装、无功补偿并联电容器装置安装、全站防雷接地以及全站一次电缆敷设及防火封堵设计。\n\n2. 设计范围\n\n本变电站设计与线路设计分界为：110kV配电装置以110kV进线电缆头（不含）为界，10kV配电装置以出线电缆头（不含）为界。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在10kV母线侧安装集中补偿装置，优先采用星形接线方式',
                  '对重要负荷出线回路配置就地补偿装置，补偿容量建议取该回路视在功率的30%-50%'
                ],
                description:
                  '未明确电容器装置的安装位置及接线方式，影响系统电压调节效果',
                geometry_ref: {
                  chapter:
                    '1. 设计内容\n\n本工程施工图设计内容包括电力变压器及各级电压配电装置安装、无功补偿并联电容器装置安装、全站防雷接地以及全站一次电缆敷设及防火封堵设计。\n\n2. 设计范围\n\n本变电站设计与线路设计分界为：110kV配电装置以110kV进线电缆头（不含）为界，10kV配电装置以出线电缆头（不含）为界。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '10',
            title: '通道组织与可靠性审查',
            origin: 'DL/T 5003-2017',
            content: '通道组织与可靠性审查',
            violations: [
              {
                risk_level: 'high',
                suggestion: [
                  '补充通信通道的物理介质类型（如光纤、无线等）',
                  '明确主备通道的配置方式及自动切换机制',
                  '在设计说明中量化通道带宽参数并验证是否满足2Mbit/s标准'
                ],
                description:
                  '设计说明未明确系统通信和远动通道的具体配置方案，包括通道类型、冗余措施及带宽参数',
                geometry_ref: {
                  chapter: '',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '增加通道传输距离与信号衰减的校验计算',
                  '提供误码率、通道恢复时间等可靠性指标的计算过程'
                ],
                description: '未提供通道可靠性计算依据及传输距离校验数据',
                geometry_ref: {
                  chapter: '',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充通信设备的UPS供电配置要求',
                  '明确通信机房的防雷等级及接地措施'
                ],
                description: '未说明通信设备的供电保障方案及防雷保护措施',
                geometry_ref: {
                  chapter: '',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '11',
            title: '审查变电站监控系统架构是否合理',
            origin: 'DL/T 5149-2020',
            content: '审查变电站监控系统架构是否合理',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '补充监控系统架构说明，明确站控层和间隔层设备配置',
                  '说明采用以太网作为连接方式'
                ],
                description:
                  '监控系统架构设计未明确站控层和间隔层的组成及网络连接方式',
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '增加站控层人机界面功能描述',
                  '明确与调度中心通信的协议和通道配置'
                ],
                description: '未说明站控层人机界面功能及与调度中心通信方式',
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充间隔层设备监测控制功能的详细说明',
                  '明确与站控层的通信协议'
                ],
                description: '未规定间隔层设备监测控制的具体实现方式',
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '增加对MMS和GOOSE协议的支持说明',
                  '明确网络传输速率不低于100Mbit/s'
                ],
                description: '监控系统网络协议和传输速率要求未体现',
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充网络拓扑结构说明，采用星型拓扑',
                  '明确双网独立配置的交换机端口数量'
                ],
                description: '网络拓扑结构和设备配置要求未明确',
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '列出模拟量采集的电流、电压、功率等信号',
                  '明确开关量采集的断路器、隔离开关位置信号'
                ],
                description: '模拟量和开关量采集信号未具体说明',
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '说明监控系统设备从站内时间同步系统获取对时信号',
                  '明确对时信号的传输方式和精度要求'
                ],
                description: '时间同步信号来源未明确',
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '12',
            title: '审查变电站监控的各项性能指标',
            origin: 'DL/T 5149-2020',
            content: '审查变电站监控的各项性能指标',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '在监控系统设计中增加越死区传送时间的优化措施，如采用IEC61850-10标准的采样值传输机制'
                ],
                description:
                  '设计说明未明确监控系统模拟量越死区传送时间的具体实现方案，可能影响站控层数据传输时效性',
                geometry_ref: {
                  chapter:
                    '1. 设计内容\n\n本工程施工图设计内容包括电力变压器及各级电压配电装置安装、无功补偿并联电容器装置安装、全站防雷接地以及全站一次电缆敷设及防火封堵设计。\n\n2. 设计范围\n\n本变电站设计与线路设计分界为：110kV配电装置以110kV进线电缆头（不含）为界，10kV配电装置以出线电缆头（不含）为界。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在设备选型技术规范中明确要求控制继电器响应时间≤1s，增加控制回路时序测试要求'
                ],
                description:
                  '控制执行命令响应时间指标未与具体控制设备参数关联，存在理论指标与实际性能不符风险',
                geometry_ref: {
                  chapter:
                    '1. 设计内容\n\n本工程施工图设计内容包括电力变压器及各级电压配电装置安装、无功补偿并联电容器装置安装、全站防雷接地以及全站一次电缆敷设及防火封堵设计。\n\n2. 设计范围\n\n本变电站设计与线路设计分界为：110kV配电装置以110kV进线电缆头（不含）为界，10kV配电装置以出线电缆头（不含）为界。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '补充双机系统冗余配置要求，包括双服务器、双网络通道、双电源等具体实现方案'
                ],
                description:
                  '双机系统可用率指标未规定冗余配置具体要求，可能影响系统可靠性',
                geometry_ref: {
                  chapter:
                    '1. 设计内容\n\n本工程施工图设计内容包括电力变压器及各级电压配电装置安装、无功补偿并联电容器装置安装、全站防雷接地以及全站一次电缆敷设及防火封堵设计。\n\n2. 设计范围\n\n本变电站设计与线路设计分界为：110kV配电装置以110kV进线电缆头（不含）为界，10kV配电装置以出线电缆头（不含）为界。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在监控系统设计中增加IEEE 1588精确时间协议实施方案，配置主时钟源和对时精度校验机制'
                ],
                description: '测控装置对时误差指标未明确同步方式和精度保障措施',
                geometry_ref: {
                  chapter:
                    '1. 设计内容\n\n本工程施工图设计内容包括电力变压器及各级电压配电装置安装、无功补偿并联电容器装置安装、全站防雷接地以及全站一次电缆敷设及防火封堵设计。\n\n2. 设计范围\n\n本变电站设计与线路设计分界为：110kV配电装置以110kV进线电缆头（不含）为界，10kV配电装置以出线电缆头（不含）为界。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在通信系统设计中增加网络带宽计算和设备选型要求，确保100Mbit/s以上带宽配置'
                ],
                description: '网络负荷率指标未与具体网络带宽和设备性能参数关联',
                geometry_ref: {
                  chapter:
                    '1. 设计内容\n\n本工程施工图设计内容包括电力变压器及各级电压配电装置安装、无功补偿并联电容器装置安装、全站防雷接地以及全站一次电缆敷设及防火封堵设计。\n\n2. 设计范围\n\n本变电站设计与线路设计分界为：110kV配电装置以110kV进线电缆头（不含）为界，10kV配电装置以出线电缆头（不含）为界。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '13',
            title: '审查避雷带（接闪带）材料规格尺寸与敷设位置是否符合要求',
            origin: 'GB 50057-2010',
            content: '审查避雷带（接闪带）材料规格尺寸与敷设位置是否符合要求',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '补充项目所在地土壤氯化物含量检测报告',
                  '若存在高氯化物土壤，建议将热镀锌扁钢升级为不锈钢材质或增加防腐涂层'
                ],
                description:
                  '避雷带材料规格未明确是否符合腐蚀环境要求，未说明是否考虑高氯化物土壤条件',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在设计图纸中用红色线型标注避雷带具体敷设路径',
                  '补充说明避雷带与屋面女儿墙、突出屋面金属物的连接方式'
                ],
                description:
                  '避雷带敷设位置描述不具体，未明确是否沿屋檐边垂直面或外墙外表面等易受雷击部位敷设',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '根据GB 50057-2010附录B规定，补充说明网格尺寸是否满足第二类防雷建筑物≤10m×10m要求'
                ],
                description: '未明确避雷带网格尺寸是否符合防雷分类要求',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '14',
            title:
              '审查引下线材料规格尺寸、数量、连接方式是否满足防雷引下线的机械强度、热稳定性及"多点分散泄流"原则',
            origin: 'GB/T 50064-2014',
            content:
              '审查引下线材料规格尺寸、数量、连接方式是否满足防雷引下线的机械强度、热稳定性及"多点分散泄流"原则',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '补充说明是否利用结构钢筋作为自然引下线',
                  '若未利用结构钢筋，需明确专设引下线的设置位置和数量'
                ],
                description:
                  '设计说明未明确引下线是否利用结构钢筋或钢结构柱作为自然引下线，也未说明是否设置专设引下线',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充说明引下线材料规格（如圆钢直径或扁钢截面积）',
                  '确保材料规格符合规范要求'
                ],
                description:
                  '未明确引下线的材料规格是否符合GB 50057-2010中关于引下线的材料要求',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在设计说明中补充焊接搭接长度的具体数值',
                  '确保焊接质量符合规范要求'
                ],
                description: '未明确引下线焊接搭接长度是否满足≥200mm的要求',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '根据防雷分类确定引下线数量和间距要求',
                  '补充说明引下线沿建筑外轮廓的均匀分布情况'
                ],
                description: '未明确引下线数量和分布是否符合防雷分类要求',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充说明引下线的布置方式是否实现多点分散泄流',
                  '确保引下线均匀分布并连接至主接地网'
                ],
                description: '未明确是否满足多点分散泄流原则',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '15',
            title: '审查接地网完整性（如是否围绕主建筑物敷设，无接地死区）',
            origin: 'GB/T 50065-2011',
            content: '审查接地网完整性（如是否围绕主建筑物敷设，无接地死区）',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '补充接地网平面布置图，明确标注主建筑物轮廓与接地网的覆盖关系',
                  "在设计说明中增加'接地网沿主建筑物外围连续敷设，确保建筑物四周边缘无遗漏'的明确表述"
                ],
                description:
                  '接地网设计未明确说明是否完全围绕主建筑物敷设，存在潜在接地死区风险',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充说明建筑物基础下方接地网的敷设深度应达到基础底板以下0.5m',
                  '增加对建筑物内部接地支线的敷设要求，确保覆盖所有可能的接地需求点'
                ],
                description: '未明确建筑物下方接地网的敷设深度与结构要求',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '16',
            title: '审查接地网设计的安装敷设合理性',
            origin: 'GB 50169-2016',
            content: '审查接地网设计的安装敷设合理性',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '补充说明是否利用建筑物基础、金属管道等自然接地极，若可利用应优先采用'
                ],
                description:
                  '接地网设计未明确是否利用自然接地极，可能影响接地效果和经济性',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在设计说明中补充要求避雷带接地引下线与主接地网连接处采用两根独立导线连接'
                ],
                description:
                  '避雷带接地引下线与主接地网连接处未明确采用两根导线连接',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'low',
                suggestion: [
                  '补充说明角部圆弧半径的具体数值，确保不小于均压带间距的1/2'
                ],
                description:
                  '接地网角部圆弧半径未明确是否满足均压带间距的1/2要求',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '核查当地冻土层深度，若存在冻土层则调整埋深至冻土层以下'
                ],
                description: '建筑物下方接地体埋深0.2m可能未满足冻土层埋设要求',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'low',
                suggestion: [
                  '补充说明均压带间距的具体数值，建议采用5m等间距布置'
                ],
                description: '均压带间距未明确是否符合规范要求',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充说明防雷集中接地与避雷器集中接地应独立设置，避免共用'
                ],
                description: '未明确防雷集中接地与避雷器集中接地是否共用',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '17',
            title:
              '审查接地网材料规格尺寸是否满足短路电流热效应校验与材料最小尺寸要求',
            origin: 'GB/T 50065-2011',
            content:
              '审查接地网材料规格尺寸是否满足短路电流热效应校验与材料最小尺寸要求',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '根据GB/T 50065-2011热稳定公式A ≥ Ig / C × √te，明确单相接地故障电流Ig和等效持续时间te的具体数值',
                  '校验-60×8热镀锌扁钢（截面积480mm²）和∠63×63×6热镀锌角钢（截面积63×63×6/2=1190.7mm²）是否满足热稳定系数C=70的计算要求'
                ],
                description:
                  '接地网材料规格未明确热镀锌扁钢和角钢的截面积是否满足短路电流热效应校验要求，需根据GB/T 50065-2011热稳定公式进行校验',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充热镀锌层厚度要求（一般不小于65μm）',
                  '明确接地材料在腐蚀环境下的使用寿命校验'
                ],
                description:
                  '设计说明未明确接地网材料的热镀锌层厚度是否符合GB/T 50065-2011对腐蚀防护的要求',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '18',
            title: '审查接地网的几何参数是否符合要求',
            origin: 'GB 50169-2016',
            content: '审查接地网的几何参数是否符合要求',
            violations: [
              {
                risk_level: 'high',
                suggestion: [
                  '将建筑物下方垂直接地极顶部埋深调整为不小于0.8m',
                  '重新设计接地网布局以满足规范要求'
                ],
                description:
                  '建筑物下方垂直接地极顶部埋深不足，未达到规范要求的最小埋设深度',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充接地线沿墙敷设时的离地距离（250mm~300mm）和间隙（10mm~15mm）要求',
                  '在施工图说明中增加相关参数'
                ],
                description: '接地线沿墙敷设时未明确离地距离和间隙要求',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充明敷接地线应涂绿色和黄色相间条纹的标识要求',
                  '在施工图说明中增加相关标识规范'
                ],
                description: '明敷接地线未明确标识要求',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充扁钢搭接长度应为其宽度2倍（120mm）且不少于3个棱边焊接的要求',
                  '在施工图说明中增加焊接工艺规范'
                ],
                description: '接地体焊接未明确搭接焊缝长度和棱边焊接要求',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '19',
            title: '审查避雷器安装布置位置是否符合要求',
            origin: 'GB/T 50064-2014',
            content: '审查避雷器安装布置位置是否符合要求',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '补充电缆进线段与架空线路连接处的避雷器装设方案',
                  '根据GB/T 50064-2014要求，若电缆段与架空线路存在连接点，应在该位置装设MOA'
                ],
                description:
                  '设计说明未明确电缆进线段与架空线路连接处是否装设避雷器，可能遗漏雷电侵入波保护措施',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在设计说明中补充避雷器与变压器套管的相对位置关系',
                  '确保避雷器安装在变压器套管附近，符合规范要求的电气距离'
                ],
                description:
                  '主变压器110kV侧避雷器安装位置未明确是否靠近变压器套管',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '核查GIS母线分段情况，补充每段母线避雷器装设方案',
                  '根据GB/T 50064-2014要求，GIS变电站应在线路出口处装设避雷器'
                ],
                description: '110kV GIS母线未明确是否在每段母线上装设避雷器',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '补充雷电侵入波保护计算书',
                  '根据计算结果明确避雷器装设位置和参数'
                ],
                description:
                  '设计说明未提供雷电侵入波保护计算结论作为避雷器装设依据',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充电缆末端至变压器的电气距离计算数据',
                  '若距离超过规范限值，应在电缆末端装设MOA'
                ],
                description: '电缆末端至变压器的电气距离未明确是否符合规范要求',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '20',
            title: '审查接地电阻设计值是否符合要求',
            origin: 'GB/T 50065-2011',
            content: '审查接地电阻设计值是否符合要求',
            violations: []
          },
          {
            id: '21',
            title: '审查污秽等级比距配置是否正确',
            origin: 'GB/T 26218.1-2019',
            content: '审查污秽等级比距配置是否正确',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '补充项目所在地的污区分布图信息',
                  '根据GB/T 26218.1-2019规范要求，结合现场环境条件明确污秽等级判定依据',
                  '在设计说明中明确标注变电站所在区域的污秽等级'
                ],
                description:
                  '设计说明未明确说明污秽等级的判定依据及具体等级，可能导致爬电比距配置缺乏针对性',
                geometry_ref: {
                  chapter:
                    '第1册  YB11844S-D101  总的部分\n\n第2册  YB11844S-D102  110kV屋内配电装置\n\n第3册  YB11844S-D103  主变压器及各电压进出线安装\n\n第4册  YB11844S-D104  10kV屋内配电装置\n\n第5册  YB11844S-D105  10kV并联电容器组装置\n\n第6册  YB11844S-D106  10kV站用电装置\n\n第7册  YB11844S-D107  10kV滤波补偿装置\n\n第8册  YB11844S-D108  变电站电力电缆敷设\n\n第9册  YB11844S-D109  全站接地',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充GIS设备的爬电距离参数数据',
                  '根据设备最高工作电压（126kV）和污秽等级，重新核算爬电比距是否符合GB/T 26218.1-2019要求'
                ],
                description:
                  '未提供GIS设备的爬电距离参数，无法验证是否满足污秽等级对应的爬电比距要求',
                geometry_ref: {
                  chapter:
                    '第1册  YB11844S-D101  总的部分\n\n第2册  YB11844S-D102  110kV屋内配电装置\n\n第3册  YB11844S-D103  主变压器及各电压进出线安装\n\n第4册  YB11844S-D104  10kV屋内配电装置\n\n第5册  YB11844S-D105  10kV并联电容器组装置\n\n第6册  YB11844S-D106  10kV站用电装置\n\n第7册  YB11844S-D107  10kV滤波补偿装置\n\n第8册  YB11844S-D108  变电站电力电缆敷设\n\n第9册  YB11844S-D109  全站接地',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'low',
                suggestion: [
                  '明确户内设备的防污闪设计标准',
                  '根据《国家电网公司污区分布图》说明户内设备的污秽等级判定原则',
                  '在设计说明中增加户内外设备防污闪设计的差异化说明'
                ],
                description:
                  '未说明户内设备是否需要执行户外设备的污秽等级标准，存在规范适用性争议',
                geometry_ref: {
                  chapter:
                    '第1册  YB11844S-D101  总的部分\n\n第2册  YB11844S-D102  110kV屋内配电装置\n\n第3册  YB11844S-D103  主变压器及各电压进出线安装\n\n第4册  YB11844S-D104  10kV屋内配电装置\n\n第5册  YB11844S-D105  10kV并联电容器组装置\n\n第6册  YB11844S-D106  10kV站用电装置\n\n第7册  YB11844S-D107  10kV滤波补偿装置\n\n第8册  YB11844S-D108  变电站电力电缆敷设\n\n第9册  YB11844S-D109  全站接地',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '22',
            title: '审查金属氧化物避雷器至主变压器间的最大电气距离',
            origin: 'DL/T 620-1997',
            content: '审查金属氧化物避雷器至主变压器间的最大电气距离',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '根据DL/T 620标准，补充避雷器与主变间最大电气距离的计算依据及具体数值',
                  '在设计说明中明确避雷器安装位置与主变的间距应小于55米（参照110kV进线1.0km对应数值）'
                ],
                description:
                  '避雷器至主变压器的最大电气距离未明确说明，可能影响雷电冲击波保护效果',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'low',
                suggestion: [
                  '补充避雷器接地装置与主变外壳、地网的连接方式说明',
                  '明确接地线材质、截面积及连接点数量要求'
                ],
                description: '避雷器接地未明确与主变外壳三点联合接地的实施方式',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '23',
            title: '审查沿接地体的长度是否满足要求',
            origin: 'TB 10758-2018',
            content: '审查沿接地体的长度是否满足要求',
            violations: [
              {
                risk_level: 'high',
                suggestion: [
                  '在接地网设计图纸中明确标注避雷针接地线连接点与变压器/35kV设备连接点的坐标位置',
                  '通过延长接地极长度或调整接地网布局确保两点间水平距离≥15m',
                  '在设计说明中补充接地网关键节点间距的计算过程'
                ],
                description:
                  '避雷针接地线与主接地网的地下连接点未明确与变压器或35kV设备连接点的间距，未满足沿接地极长度不小于15米的要求',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充接地线与接地网的焊接工艺要求（如搭接长度≥100mm）',
                  '明确连接点处是否设置集中接地装置（如接地模块或降阻剂）'
                ],
                description:
                  '未说明避雷针接地线与主接地网的连接方式是否满足规范要求',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '24',
            title: '审查金属氧化物避雷器至主变压器间的最大电气距离',
            origin: 'DL/T 620-1997',
            content: '审查金属氧化物避雷器至主变压器间的最大电气距离',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '补充避雷器与主变压器间的最大电气距离设计参数',
                  '根据DL/T 620规范要求，确保避雷器与变压器间距离不超过规范允许的最大值'
                ],
                description:
                  '设计说明未明确金属氧化物避雷器与主变压器间的最大电气距离，可能影响雷电过电压保护效果',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在设计说明中明确避雷器接地端、低压绕组中性点与变压器外壳的三点联合接地方式',
                  '确保接地电阻满足≤4Ω的要求'
                ],
                description:
                  '避雷器接地方式未明确说明是否采用三点联合接地，可能影响接地可靠性',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '核对Y1.5W-72/186型避雷器的额定电压与主变中性点过电压水平的匹配性',
                  '验证HY5WZ-17/45型避雷器的保护水平是否满足10kV系统要求'
                ],
                description:
                  '避雷器选型参数未与系统电压等级进行匹配验证，可能影响保护效果',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '25',
            title: '审查独立接地体的地中距离是否满足要求',
            origin: 'DL 5009.1-2014',
            content: '审查独立接地体的地中距离是否满足要求',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '补充独立避雷针的布置图及接地装置参数说明',
                  '明确接地电阻值及与主接地网、道路、建筑物出入口的水平距离'
                ],
                description:
                  '设计说明未明确独立避雷针的设置及接地装置参数，导致无法验证接地电阻和距离要求是否满足',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在接地设计中补充独立避雷针接地装置与主接地网的连接方式',
                  '明确是否采用隔离措施（如沥青层或砾石层）'
                ],
                description:
                  '未说明防雷接地与主接地网的连接方式及隔离措施，可能影响接地电阻和安全距离要求',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '26',
            title: '审查电缆敷设型号选择、敷设方案是否符合规范',
            origin: 'GB 50217-2018',
            content: '审查电缆敷设型号选择、敷设方案是否符合规范',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '补充电缆选型说明，明确10kV电缆采用三芯统包型交联聚乙烯绝缘铜芯电缆',
                  '说明电缆敷设方式对应的铠装要求（如电缆沟/隧道内敷设时是否采用铠装）'
                ],
                description:
                  '设计说明未明确电缆导体材料、绝缘类型及铠装要求，导致无法验证是否符合规范要求',
                geometry_ref: {
                  chapter:
                    '1.电缆敷设时，请留适当余量。\n\n2.10kV开关柜就位时，为使电缆能顺利进入柜下洞口，请尽量减小柜体安装误差。\n\n3.在进行设备安装之前，应仔细复核到货设备的安装孔尺寸，如发现与安装图不符，应及时与设计单位联系，以便妥善处理。\n\n4.10kV配电装置的设计图纸中，仅标明进线母线的相序，柜内母线布置和相序根据国标及实际情况确定；设计在图纸中仅标明主母线的规格，柜内其它母线的选型由制造厂根据导线载流要求和实际工作条件确定。\n\n5.在作设备引线时，设备线夹可按实际设备端子及走线方向加以调整，在满足电气安全距离和设备端子允许拉力的条件下，力求过渡自然。导线裸露端应用铝包带缠紧扎牢，以免胀裂。此外，钢芯铝绞线不宜沿地面拖拉，以免增加电晕。\n\n6.设备安装中用的钢材均采用热镀锌钢材，焊接拼装件宜先焊接成形后再镀锌，对某些不宜镀锌的铁件，应在设备安装后刷水性富锌漆两道，罩面漆一道。\n\n7.在接地施工中，接地网与电缆沟交叉处不应被截断，也不得接入电缆沟内，应将接地扁钢从电缆沟以下穿越连通，其预埋敷设工作应早作安排。接地网交叉处应做好绝缘及防腐处理。防雷集中接地与避雷器集中接地不应共用。\n\n8.动力、照明在土建施工中应详细阅读相关卷册说明，注意做好各箱、盒、灯具及管线的预埋敷设工作，各动力箱、照明箱、接线箱、控制箱应按远景规模的进出线管一次敷设到位。施工中电、土专业人员应做好配合工作。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充10kV馈线电缆截面规格说明，按规范要求选用300mm²铜芯电缆（干线）或400mm²铜芯电缆（大负荷场景）'
                ],
                description:
                  '未明确10kV电缆截面规格，可能影响供电能力和安全运行',
                geometry_ref: {
                  chapter:
                    '1.电缆敷设时，请留适当余量。\n\n2.10kV开关柜就位时，为使电缆能顺利进入柜下洞口，请尽量减小柜体安装误差。\n\n3.在进行设备安装之前，应仔细复核到货设备的安装孔尺寸，如发现与安装图不符，应及时与设计单位联系，以便妥善处理。\n\n4.10kV配电装置的设计图纸中，仅标明进线母线的相序，柜内母线布置和相序根据国标及实际情况确定；设计在图纸中仅标明主母线的规格，柜内其它母线的选型由制造厂根据导线载流要求和实际工作条件确定。\n\n5.在作设备引线时，设备线夹可按实际设备端子及走线方向加以调整，在满足电气安全距离和设备端子允许拉力的条件下，力求过渡自然。导线裸露端应用铝包带缠紧扎牢，以免胀裂。此外，钢芯铝绞线不宜沿地面拖拉，以免增加电晕。\n\n6.设备安装中用的钢材均采用热镀锌钢材，焊接拼装件宜先焊接成形后再镀锌，对某些不宜镀锌的铁件，应在设备安装后刷水性富锌漆两道，罩面漆一道。\n\n7.在接地施工中，接地网与电缆沟交叉处不应被截断，也不得接入电缆沟内，应将接地扁钢从电缆沟以下穿越连通，其预埋敷设工作应早作安排。接地网交叉处应做好绝缘及防腐处理。防雷集中接地与避雷器集中接地不应共用。\n\n8.动力、照明在土建施工中应详细阅读相关卷册说明，注意做好各箱、盒、灯具及管线的预埋敷设工作，各动力箱、照明箱、接线箱、控制箱应按远景规模的进出线管一次敷设到位。施工中电、土专业人员应做好配合工作。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'low',
                suggestion: [
                  '补充电缆敷设环境温度说明，若存在60℃以上高温环境应选用耐热型电缆，100℃以上应选用矿物绝缘电缆'
                ],
                description:
                  '未说明电缆敷设环境温度对应的绝缘材料选择，可能影响电缆性能',
                geometry_ref: {
                  chapter:
                    '1.电缆敷设时，请留适当余量。\n\n2.10kV开关柜就位时，为使电缆能顺利进入柜下洞口，请尽量减小柜体安装误差。\n\n3.在进行设备安装之前，应仔细复核到货设备的安装孔尺寸，如发现与安装图不符，应及时与设计单位联系，以便妥善处理。\n\n4.10kV配电装置的设计图纸中，仅标明进线母线的相序，柜内母线布置和相序根据国标及实际情况确定；设计在图纸中仅标明主母线的规格，柜内其它母线的选型由制造厂根据导线载流要求和实际工作条件确定。\n\n5.在作设备引线时，设备线夹可按实际设备端子及走线方向加以调整，在满足电气安全距离和设备端子允许拉力的条件下，力求过渡自然。导线裸露端应用铝包带缠紧扎牢，以免胀裂。此外，钢芯铝绞线不宜沿地面拖拉，以免增加电晕。\n\n6.设备安装中用的钢材均采用热镀锌钢材，焊接拼装件宜先焊接成形后再镀锌，对某些不宜镀锌的铁件，应在设备安装后刷水性富锌漆两道，罩面漆一道。\n\n7.在接地施工中，接地网与电缆沟交叉处不应被截断，也不得接入电缆沟内，应将接地扁钢从电缆沟以下穿越连通，其预埋敷设工作应早作安排。接地网交叉处应做好绝缘及防腐处理。防雷集中接地与避雷器集中接地不应共用。\n\n8.动力、照明在土建施工中应详细阅读相关卷册说明，注意做好各箱、盒、灯具及管线的预埋敷设工作，各动力箱、照明箱、接线箱、控制箱应按远景规模的进出线管一次敷设到位。施工中电、土专业人员应做好配合工作。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '27',
            title: '审查最小允许转弯半径是否符合规范',
            origin: 'DL 5190.4-2019',
            content: '审查最小允许转弯半径是否符合规范',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '补充电缆结构参数说明，明确是否含铠装层、铜带屏蔽或阻燃特性',
                  '根据电缆类型分别标注对应的最小弯曲半径要求'
                ],
                description:
                  '设计说明未明确电缆铠装层或屏蔽结构类型，导致无法准确判断最小弯曲半径要求',
                geometry_ref: {
                  chapter: '',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在电缆敷设章节单独说明110kV电缆的弯曲半径要求',
                  '对10kV电缆明确是否属于现场总线通信电缆并标注对应倍数'
                ],
                description:
                  '未区分不同电压等级电缆的弯曲半径要求，可能造成110kV与10kV电缆的施工规范混淆',
                geometry_ref: {
                  chapter: '',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'low',
                suggestion: [
                  '在通信系统设计中明确光缆敷设方式',
                  '针对不同敷设方式标注15倍（静态）和20倍（动态）的弯曲半径要求'
                ],
                description:
                  '未说明光缆敷设方式（静态/动态）及对应弯曲半径要求',
                geometry_ref: {
                  chapter: '',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '28',
            title: '审查阻火措施或隔热及阻火保护措施是否落实',
            origin: 'GB 50217-2018',
            content: '审查阻火措施或隔热及阻火保护措施是否落实',
            violations: [
              {
                risk_level: 'high',
                suggestion: [
                  '补充电缆选型表中各类电缆的阻燃等级参数',
                  '在电缆敷设章节增加同通道敷设电缆的防火隔离措施说明（如穿阻燃管、设置防火隔板）'
                ],
                description:
                  '未明确说明电缆阻燃等级是否达到C级要求，缺少对同通道敷设的低压电缆、控制电缆、通讯光缆的阻燃等级及防火隔离措施的具体描述',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充有机堵料的耐火极限型式试验报告',
                  '在施工图设计说明中增加封堵材料的规格参数及检测标准'
                ],
                description:
                  '未提供电缆孔洞封堵材料的耐火极限检测报告，无法验证是否满足不低于1.00h的耐火要求',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '在设备材料清册中增加电缆的防爆认证信息',
                  "补充防爆电缆的'Ex'标识示意图及合格证核查表"
                ],
                description:
                  "未明确爆炸危险区域电缆的防爆认证信息，缺少'Ex'标识及防爆产品合格证的核查记录",
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充防火分隔设置间距的计算依据',
                  '增加防火分隔施工质量验收标准（如阻火墙连续性、密封性要求）'
                ],
                description:
                  '防火分隔设置未明确具体间距参数，缺少电力舱/电缆沟防火分隔的施工验收标准',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '29',
            title:
              '检查所有保护配置方案是否满足可靠性、选择性、灵敏性和速动性的基本要求',
            origin: 'GB/T 14285-2023',
            content:
              '检查所有保护配置方案是否满足可靠性、选择性、灵敏性和速动性的基本要求',
            violations: [
              {
                risk_level: 'high',
                suggestion: [
                  '补充继电保护配置表，明确各电压等级线路、变压器的保护类型（如差动、距离、零序等）',
                  '提供保护动作逻辑图及定值整定计算书，说明灵敏度校验结果',
                  '增加保护装置动作时间配合关系表，验证速动性与选择性'
                ],
                description:
                  '设计说明未明确继电保护配置方案，缺少保护类型、动作逻辑及定值整定依据，无法验证可靠性、选择性、灵敏性和速动性要求',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在110kV线路保护中增加零序电流保护配置，设置合理动作定值',
                  '校验零序保护灵敏度，确保在最小故障电流下可靠动作'
                ],
                description:
                  '110kV系统中性点保护间隙接地方式未配置零序电流保护，可能无法及时切除单相接地故障',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在10kV系统中配置绝缘监测装置或零序电流互感器',
                  '采用消弧线圈接地方式并配置过电压保护装置'
                ],
                description:
                  '10kV系统未采用接地变+消弧线圈或零序电流保护，可能无法检测单相接地故障',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '补充主变压器差动保护配置说明，明确CT变比与保护范围',
                  '校验差动保护灵敏系数，确保满足GB/T 14285要求'
                ],
                description:
                  '主变压器保护配置未明确差动保护范围及CT变比，可能影响保护动作可靠性',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '30',
            title:
              '检查主变压器是否配置主保护（如纵差保护）、后备保护（如复合电压闭锁过流保护）、非电量保护（如瓦斯保护、温度保护）及中性点相关保护（如间隙保护、零序保护）',
            origin: 'GB/T 14285-2023',
            content:
              '检查主变压器是否配置主保护（如纵差保护）、后备保护（如复合电压闭锁过流保护）、非电量保护（如瓦斯保护、温度保护）及中性点相关保护（如间隙保护、零序保护）',
            violations: [
              {
                risk_level: 'high',
                suggestion: [
                  '在主变压器保护配置说明中补充纵差保护配置情况',
                  '核查电流互感器选型是否满足纵差保护要求（如LRB-110/LR-110是否具备差动保护功能）'
                ],
                description:
                  '主变压器保护配置未明确说明是否配置纵差保护，该保护是主变压器的核心主保护之一',
                geometry_ref: {
                  chapter:
                    '1. 主变压器的选型\n\n（1）#1主变采用SZ20-25000/110-NX2型一体式双圈自冷有载调压变压器，厂家为江苏华鹏变压器有限公司。\n\n容量：25MVA/25MVA；\n\n电压比：110±8×1.25%/10.5kV；\n\n短路阻抗电压：UK=10.5%；\n\n联结组别：YN ,d11；\n\n冷却方式：自冷\n\n有载调压开关：CVⅢ-350Y/72.5-10193W,17级\n\n附套管电流互感器:\n\n高压侧 LRB-110，200-400-600/5A，5P30，20VA，每相1只\n\nLRB-110，200-400-600/5A，5P30，20VA，每相1只\n\nLR-110，200-400-600/5A，0.5，30VA，每相1只\n\nLR-110，200-400-600/5A，0.5，20VA，仅B相\n\n8） 轨    距：标准轨距，2040mm\n\n9）变压器满足《GB20052-2020电力变压器能效限定值及能效等级》二级能效相关技术要求。\n\n2. 110kV设备的选择\n\n110kV配电装置选用GIS全封闭组合电器，厂家为上海思源高压开关有限公司，三相共箱，额定电流2000A，开断电流40kA；动稳定电流100kA；热稳定电流40kA/3s，配电缆终端筒2000A。\n\n110kV进线计量电压互器选用：(110√3)/(0.1/√3)/(0.1/√3) /0.1kV，0.2/0.5/3P，10/50/100VA，带电显示器。\n\n计量电流互感器选用变比为150-250/5A（本期150/5），0.2S，15VA。\n\n110kV保护电流互感器：300-600/5A，5P30/5P30/5P30/0.5/0.2S。\n\n110kV避雷器选用氧化锌避雷器，标称放电电流10kA，额定电压102kV, 雷电冲击残压266kV，并配置在线监测装置。\n\n3.主变中性点设备\n\n主变中性点设备厂家为大连新安越电力设备有限公司，型号BZFZ-110；配中性点隔离开关：GW13-72.5/630A，附CJ6B电动操作机构；零序CT：LZW-10 100-300/5A 5P30/5P30 20VA；避雷器：Y1.5W-72/186，附在线监测仪；放电间隙90-150mm范围可调；中性点间隙CT：LZW-10 100-300/5A 5P30/5P30 20VA，支架配套。\n\n4. 10kV设备选择\n\n1）10kV开关柜厂家为江阴市富仁电气有限公司，KYN28A-12型金属铠装中置手车式开关柜，额定电压10kV。主母线额定电流2000A，热稳定电流31.5kA/4s，爬电比距20mm/kV，防护等级IP4X。\n\n柜内真空断路器CV1-12。主变进线柜额定电流2000A，开断电流31.5kA；出线柜、电容器柜、接地变柜额定电流1250A，开断电流25kA。\n\n柜内电流互感器采用户内环氧树脂浇注式电流互感器。主变进线CT型号LZZBJ9-10E3 2000/5A 5P30/5P30/5P30/0.5/0.2S 30/30/30/30/30VA。出线回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。电容器回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。消谐回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。\n\n10kV开关柜内电压互感器选用户内多绕组环氧树脂浇注式电压互感器。10kV母设柜PT为JDZX9-10G2 ///kV  0.2/0.5（3P）/3P 30/50/100VA。\n\n10kV柜内避雷器选用复合外套金属氧化物避雷器，型号HY5WZ-17/45，母设柜内避雷器附在线监测仪，其余避雷器附计数器。\n\n2）10kV电容器组厂家为靖江市普瑞电力科技有限公司，户内框架式布置，电容器采用PRFC10-2400/400AK(5%)，额定电压：10kV，单台容量：400kvar，配串联电抗器：CKSC-120/10-5%。\n\n3）10kV滤波补偿成套装置厂家为靖江市普瑞电力科技有限公司，户内布置，1#滤波补偿成套装置(12000kvar)内包含：1#滤波支路(5次)容量为4800kvar，滤波支路(7次)容量为3600kvar，滤波支路(11次)容量为3600kvar。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '补充复合电压闭锁过流保护配置说明',
                  '核查电压互感器选型及保护装置是否具备复合电压闭锁功能'
                ],
                description:
                  '未明确配置复合电压闭锁过流保护，该保护是主变压器的重要后备保护',
                geometry_ref: {
                  chapter:
                    '1. 主变压器的选型\n\n（1）#1主变采用SZ20-25000/110-NX2型一体式双圈自冷有载调压变压器，厂家为江苏华鹏变压器有限公司。\n\n容量：25MVA/25MVA；\n\n电压比：110±8×1.25%/10.5kV；\n\n短路阻抗电压：UK=10.5%；\n\n联结组别：YN ,d11；\n\n冷却方式：自冷\n\n有载调压开关：CVⅢ-350Y/72.5-10193W,17级\n\n附套管电流互感器:\n\n高压侧 LRB-110，200-400-600/5A，5P30，20VA，每相1只\n\nLRB-110，200-400-600/5A，5P30，20VA，每相1只\n\nLR-110，200-400-600/5A，0.5，30VA，每相1只\n\nLR-110，200-400-600/5A，0.5，20VA，仅B相\n\n8） 轨    距：标准轨距，2040mm\n\n9）变压器满足《GB20052-2020电力变压器能效限定值及能效等级》二级能效相关技术要求。\n\n2. 110kV设备的选择\n\n110kV配电装置选用GIS全封闭组合电器，厂家为上海思源高压开关有限公司，三相共箱，额定电流2000A，开断电流40kA；动稳定电流100kA；热稳定电流40kA/3s，配电缆终端筒2000A。\n\n110kV进线计量电压互器选用：(110√3)/(0.1/√3)/(0.1/√3) /0.1kV，0.2/0.5/3P，10/50/100VA，带电显示器。\n\n计量电流互感器选用变比为150-250/5A（本期150/5），0.2S，15VA。\n\n110kV保护电流互感器：300-600/5A，5P30/5P30/5P30/0.5/0.2S。\n\n110kV避雷器选用氧化锌避雷器，标称放电电流10kA，额定电压102kV, 雷电冲击残压266kV，并配置在线监测装置。\n\n3.主变中性点设备\n\n主变中性点设备厂家为大连新安越电力设备有限公司，型号BZFZ-110；配中性点隔离开关：GW13-72.5/630A，附CJ6B电动操作机构；零序CT：LZW-10 100-300/5A 5P30/5P30 20VA；避雷器：Y1.5W-72/186，附在线监测仪；放电间隙90-150mm范围可调；中性点间隙CT：LZW-10 100-300/5A 5P30/5P30 20VA，支架配套。\n\n4. 10kV设备选择\n\n1）10kV开关柜厂家为江阴市富仁电气有限公司，KYN28A-12型金属铠装中置手车式开关柜，额定电压10kV。主母线额定电流2000A，热稳定电流31.5kA/4s，爬电比距20mm/kV，防护等级IP4X。\n\n柜内真空断路器CV1-12。主变进线柜额定电流2000A，开断电流31.5kA；出线柜、电容器柜、接地变柜额定电流1250A，开断电流25kA。\n\n柜内电流互感器采用户内环氧树脂浇注式电流互感器。主变进线CT型号LZZBJ9-10E3 2000/5A 5P30/5P30/5P30/0.5/0.2S 30/30/30/30/30VA。出线回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。电容器回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。消谐回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。\n\n10kV开关柜内电压互感器选用户内多绕组环氧树脂浇注式电压互感器。10kV母设柜PT为JDZX9-10G2 ///kV  0.2/0.5（3P）/3P 30/50/100VA。\n\n10kV柜内避雷器选用复合外套金属氧化物避雷器，型号HY5WZ-17/45，母设柜内避雷器附在线监测仪，其余避雷器附计数器。\n\n2）10kV电容器组厂家为靖江市普瑞电力科技有限公司，户内框架式布置，电容器采用PRFC10-2400/400AK(5%)，额定电压：10kV，单台容量：400kvar，配串联电抗器：CKSC-120/10-5%。\n\n3）10kV滤波补偿成套装置厂家为靖江市普瑞电力科技有限公司，户内布置，1#滤波补偿成套装置(12000kvar)内包含：1#滤波支路(5次)容量为4800kvar，滤波支路(7次)容量为3600kvar，滤波支路(11次)容量为3600kvar。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '补充瓦斯保护配置说明',
                  '核查是否配置瓦斯继电器及相关保护回路'
                ],
                description:
                  '未明确配置瓦斯保护，该保护是主变压器非电量保护的关键组成部分',
                geometry_ref: {
                  chapter:
                    '1. 主变压器的选型\n\n（1）#1主变采用SZ20-25000/110-NX2型一体式双圈自冷有载调压变压器，厂家为江苏华鹏变压器有限公司。\n\n容量：25MVA/25MVA；\n\n电压比：110±8×1.25%/10.5kV；\n\n短路阻抗电压：UK=10.5%；\n\n联结组别：YN ,d11；\n\n冷却方式：自冷\n\n有载调压开关：CVⅢ-350Y/72.5-10193W,17级\n\n附套管电流互感器:\n\n高压侧 LRB-110，200-400-600/5A，5P30，20VA，每相1只\n\nLRB-110，200-400-600/5A，5P30，20VA，每相1只\n\nLR-110，200-400-600/5A，0.5，30VA，每相1只\n\nLR-110，200-400-600/5A，0.5，20VA，仅B相\n\n8） 轨    距：标准轨距，2040mm\n\n9）变压器满足《GB20052-2020电力变压器能效限定值及能效等级》二级能效相关技术要求。\n\n2. 110kV设备的选择\n\n110kV配电装置选用GIS全封闭组合电器，厂家为上海思源高压开关有限公司，三相共箱，额定电流2000A，开断电流40kA；动稳定电流100kA；热稳定电流40kA/3s，配电缆终端筒2000A。\n\n110kV进线计量电压互器选用：(110√3)/(0.1/√3)/(0.1/√3) /0.1kV，0.2/0.5/3P，10/50/100VA，带电显示器。\n\n计量电流互感器选用变比为150-250/5A（本期150/5），0.2S，15VA。\n\n110kV保护电流互感器：300-600/5A，5P30/5P30/5P30/0.5/0.2S。\n\n110kV避雷器选用氧化锌避雷器，标称放电电流10kA，额定电压102kV, 雷电冲击残压266kV，并配置在线监测装置。\n\n3.主变中性点设备\n\n主变中性点设备厂家为大连新安越电力设备有限公司，型号BZFZ-110；配中性点隔离开关：GW13-72.5/630A，附CJ6B电动操作机构；零序CT：LZW-10 100-300/5A 5P30/5P30 20VA；避雷器：Y1.5W-72/186，附在线监测仪；放电间隙90-150mm范围可调；中性点间隙CT：LZW-10 100-300/5A 5P30/5P30 20VA，支架配套。\n\n4. 10kV设备选择\n\n1）10kV开关柜厂家为江阴市富仁电气有限公司，KYN28A-12型金属铠装中置手车式开关柜，额定电压10kV。主母线额定电流2000A，热稳定电流31.5kA/4s，爬电比距20mm/kV，防护等级IP4X。\n\n柜内真空断路器CV1-12。主变进线柜额定电流2000A，开断电流31.5kA；出线柜、电容器柜、接地变柜额定电流1250A，开断电流25kA。\n\n柜内电流互感器采用户内环氧树脂浇注式电流互感器。主变进线CT型号LZZBJ9-10E3 2000/5A 5P30/5P30/5P30/0.5/0.2S 30/30/30/30/30VA。出线回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。电容器回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。消谐回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。\n\n10kV开关柜内电压互感器选用户内多绕组环氧树脂浇注式电压互感器。10kV母设柜PT为JDZX9-10G2 ///kV  0.2/0.5（3P）/3P 30/50/100VA。\n\n10kV柜内避雷器选用复合外套金属氧化物避雷器，型号HY5WZ-17/45，母设柜内避雷器附在线监测仪，其余避雷器附计数器。\n\n2）10kV电容器组厂家为靖江市普瑞电力科技有限公司，户内框架式布置，电容器采用PRFC10-2400/400AK(5%)，额定电压：10kV，单台容量：400kvar，配串联电抗器：CKSC-120/10-5%。\n\n3）10kV滤波补偿成套装置厂家为靖江市普瑞电力科技有限公司，户内布置，1#滤波补偿成套装置(12000kvar)内包含：1#滤波支路(5次)容量为4800kvar，滤波支路(7次)容量为3600kvar，滤波支路(11次)容量为3600kvar。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充中性点间隙保护与零序保护的配合逻辑说明',
                  '核查零序CT（LZW-10）是否与间隙保护装置有效配合'
                ],
                description:
                  '中性点保护配置未明确说明间隙保护和零序保护的配合方式',
                geometry_ref: {
                  chapter:
                    '1. 主变压器的选型\n\n（1）#1主变采用SZ20-25000/110-NX2型一体式双圈自冷有载调压变压器，厂家为江苏华鹏变压器有限公司。\n\n容量：25MVA/25MVA；\n\n电压比：110±8×1.25%/10.5kV；\n\n短路阻抗电压：UK=10.5%；\n\n联结组别：YN ,d11；\n\n冷却方式：自冷\n\n有载调压开关：CVⅢ-350Y/72.5-10193W,17级\n\n附套管电流互感器:\n\n高压侧 LRB-110，200-400-600/5A，5P30，20VA，每相1只\n\nLRB-110，200-400-600/5A，5P30，20VA，每相1只\n\nLR-110，200-400-600/5A，0.5，30VA，每相1只\n\nLR-110，200-400-600/5A，0.5，20VA，仅B相\n\n8） 轨    距：标准轨距，2040mm\n\n9）变压器满足《GB20052-2020电力变压器能效限定值及能效等级》二级能效相关技术要求。\n\n2. 110kV设备的选择\n\n110kV配电装置选用GIS全封闭组合电器，厂家为上海思源高压开关有限公司，三相共箱，额定电流2000A，开断电流40kA；动稳定电流100kA；热稳定电流40kA/3s，配电缆终端筒2000A。\n\n110kV进线计量电压互器选用：(110√3)/(0.1/√3)/(0.1/√3) /0.1kV，0.2/0.5/3P，10/50/100VA，带电显示器。\n\n计量电流互感器选用变比为150-250/5A（本期150/5），0.2S，15VA。\n\n110kV保护电流互感器：300-600/5A，5P30/5P30/5P30/0.5/0.2S。\n\n110kV避雷器选用氧化锌避雷器，标称放电电流10kA，额定电压102kV, 雷电冲击残压266kV，并配置在线监测装置。\n\n3.主变中性点设备\n\n主变中性点设备厂家为大连新安越电力设备有限公司，型号BZFZ-110；配中性点隔离开关：GW13-72.5/630A，附CJ6B电动操作机构；零序CT：LZW-10 100-300/5A 5P30/5P30 20VA；避雷器：Y1.5W-72/186，附在线监测仪；放电间隙90-150mm范围可调；中性点间隙CT：LZW-10 100-300/5A 5P30/5P30 20VA，支架配套。\n\n4. 10kV设备选择\n\n1）10kV开关柜厂家为江阴市富仁电气有限公司，KYN28A-12型金属铠装中置手车式开关柜，额定电压10kV。主母线额定电流2000A，热稳定电流31.5kA/4s，爬电比距20mm/kV，防护等级IP4X。\n\n柜内真空断路器CV1-12。主变进线柜额定电流2000A，开断电流31.5kA；出线柜、电容器柜、接地变柜额定电流1250A，开断电流25kA。\n\n柜内电流互感器采用户内环氧树脂浇注式电流互感器。主变进线CT型号LZZBJ9-10E3 2000/5A 5P30/5P30/5P30/0.5/0.2S 30/30/30/30/30VA。出线回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。电容器回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。消谐回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。\n\n10kV开关柜内电压互感器选用户内多绕组环氧树脂浇注式电压互感器。10kV母设柜PT为JDZX9-10G2 ///kV  0.2/0.5（3P）/3P 30/50/100VA。\n\n10kV柜内避雷器选用复合外套金属氧化物避雷器，型号HY5WZ-17/45，母设柜内避雷器附在线监测仪，其余避雷器附计数器。\n\n2）10kV电容器组厂家为靖江市普瑞电力科技有限公司，户内框架式布置，电容器采用PRFC10-2400/400AK(5%)，额定电压：10kV，单台容量：400kvar，配串联电抗器：CKSC-120/10-5%。\n\n3）10kV滤波补偿成套装置厂家为靖江市普瑞电力科技有限公司，户内布置，1#滤波补偿成套装置(12000kvar)内包含：1#滤波支路(5次)容量为4800kvar，滤波支路(7次)容量为3600kvar，滤波支路(11次)容量为3600kvar。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '31',
            title:
              '检查差动保护各侧电流互感器（CT）变比、特性是否匹配，差动回路是否在保护屏一点可靠接地',
            origin: 'DL/T 866-2015',
            content:
              '检查差动保护各侧电流互感器（CT）变比、特性是否匹配，差动回路是否在保护屏一点可靠接地',
            violations: [
              {
                risk_level: 'high',
                suggestion: [
                  '补充主变各侧CT变比与差动保护整定值的匹配性计算',
                  '明确各侧CTいろんな实际变比是否在差动保护允许的4倍范围内'
                ],
                description:
                  '电流互感器变比配置未明确说明是否满足差动保护各侧变比一致性要求',
                geometry_ref: {
                  chapter:
                    '第1册  YB11844S-D101  总的部分\n\n第2册  YB11844S-D102  110kV屋内配电装置\n\n第3册  YB11844S-D103  主变压器及各电压进出线安装\n\n第4册  YB11844S-D104  10kV屋内配电装置\n\n第5册  YB11844S-D105  10kV并联电容器组装置\n\n第6册  YB11844S-D106  10kV站用电装置\n\n第7册  YB11844S-D107  10kV滤波补偿装置\n\n第8册  YB11844S-D108  变电站电力电缆敷设\n\n第9册  YB11844S-D109  全站接地',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '在二次设计说明中明确差动电流回路接地位置',
                  '要求施工图中差动回路仅在保护屏一点接地并标注接地符号'
                ],
                description:
                  '差动回路接地方式未明确说明是否实现保护屏一点可靠接地',
                geometry_ref: {
                  chapter:
                    '第1册  YB11844S-D101  总的部分\n\n第2册  YB11844S-D102  110kV屋内配电装置\n\n第3册  YB11844S-D103  主变压器及各电压进出线安装\n\n第4册  YB11844S-D104  10kV屋内配电装置\n\n第5册  YB11844S-D105  10kV并联电容器组装置\n\n第6册  YB11844S-D106  10kV站用电装置\n\n第7册  YB11844S-D107  10kV滤波补偿装置\n\n第8册  YB11844S-D108  变电站电力电缆敷设\n\n第9册  YB11844S-D109  全站接地',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充CT的准确限值系数（如5P30）与保护装置动作电流的配合关系',
                  '明确CT二次负载是否满足10%误差曲线要求'
                ],
                description: '电流互感器特性参数未明确说明是否满足保护要求',
                geometry_ref: {
                  chapter:
                    '第1册  YB11844S-D101  总的部分\n\n第2册  YB11844S-D102  110kV屋内配电装置\n\n第3册  YB11844S-D103  主变压器及各电压进出线安装\n\n第4册  YB11844S-D104  10kV屋内配电装置\n\n第5册  YB11844S-D105  10kV并联电容器组装置\n\n第6册  YB11844S-D106  10kV站用电装置\n\n第7册  YB11844S-D107  10kV滤波补偿装置\n\n第8册  YB11844S-D108  变电站电力电缆敷设\n\n第9册  YB11844S-D109  全站接地',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '32',
            title:
              '检查线路保护是否配置反映相间和接地故障的保护（如电流速断、过电流、零序保护）',
            origin: 'GB/T 14285-2023',
            content:
              '检查线路保护是否配置反映相间和接地故障的保护（如电流速断、过电流、零序保护）',
            violations: [
              {
                risk_level: 'high',
                suggestion: [
                  '补充110kV线路保护配置说明，明确配置阶段式电流保护、距离保护或纵联保护',
                  '针对中性点保护间隙接地系统，增加零序电流保护或接地距离保护配置说明'
                ],
                description:
                  '设计说明中未明确110kV线路保护配置，未体现相间故障和接地故障的保护措施（如电流速断、过电流、零序保护等）',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充10kV线路保护配置说明，根据系统不接地特性配置接地距离保护或绝缘监测装置',
                  '明确是否采用零序电流保护并说明其适用性'
                ],
                description:
                  '10kV线路保护配置未明确说明，未体现接地故障保护措施',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '33',
            title:
              '对于电缆出线或小电流接地系统，检查是否配置零序方向保护或小电流接地选线功能',
            origin: 'GB/T 14285-2023',
            content:
              '对于电缆出线或小电流接地系统，检查是否配置零序方向保护或小电流接地选线功能',
            violations: [
              {
                risk_level: 'high',
                suggestion: [
                  '在10kV系统配置小电流接地选线装置或具备该功能的配电自动化终端',
                  '在保护配置表中补充零序电流保护相关参数'
                ],
                description:
                  '10kV小电流接地系统未配置零序方向保护或小电流接地选线功能，违反小电流接地系统保护配置要求',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '补充110kV系统零序电流保护配置方案',
                  '明确保护装置动作定值及整定原则'
                ],
                description:
                  '110kV中性点保护间隙接地系统未明确零序电流保护配置，存在接地故障无法及时切除风险',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在电缆线路设计中增加接地故障定位装置配置要求',
                  '明确电缆终端与保护装置的配合方案'
                ],
                description:
                  '电缆出线系统未说明接地故障定位措施，不符合电缆线路保护完整性要求',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '34',
            title:
              '检查是否配置自动重合闸、备用电源自动投入（BZT）装置，逻辑是否合理',
            origin: 'GB/T 14285-2023',
            content:
              '检查是否配置自动重合闸、备用电源自动投入（BZT）装置，逻辑是否合理',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '根据GB/T 14285要求，若110kV进线存在架空段（混合线路）且无备用电源，应配置自动重合闸装置',
                  '需核实延太733线是否包含架空段，若存在混合线路特性应补充配置'
                ],
                description:
                  '110kV电缆进线未配置自动重合闸装置，未考虑混合线路的特殊性',
                geometry_ref: {
                  chapter:
                    '1.10kV开关室、电容器室、站用变室照明采用LED日光灯，二次设备室的照明采用格栅顶灯。主变压器室的照明采用防爆、防震型超强投光灯。110kV GIS室的照明采用LED防震型超强投光灯。\n\n2.道路及巡视照明采用低位LED日光灯或投光灯。\n\n3.照明电源分正常和事故照明两个系统，正常运行时，由站用电屏提供正常交流照明，事故照明箱内直流断路器断开。当一般照明箱失电时，检修人员根据需要合上相应的事故照明开关，以提供事故时照明。\n\n4.各配电室、电缆隧道设置集中电源集中控制型应急照明疏散系统。\n\n5.检修动力：屋内各配电室装设动力检修箱，作为检修时动力电源。\n\n6.其他动力：室内设备用房按规范设置排风机及空调设备，电缆隧道内设置潜水泵。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '根据GB/T 14285对I类负荷的要求，若存在重要负荷应配置BZT装置',
                  '建议在站用电系统或10kV母线配置备用电源切换装置',
                  '需核实用户负荷等级，若存在I类负荷应补充BZT配置'
                ],
                description:
                  '未配置备用电源自动投入（BZT）装置，未满足重要负荷供电可靠性要求',
                geometry_ref: {
                  chapter:
                    '1.10kV开关室、电容器室、站用变室照明采用LED日光灯，二次设备室的照明采用格栅顶灯。主变压器室的照明采用防爆、防震型超强投光灯。110kV GIS室的照明采用LED防震型超强投光灯。\n\n2.道路及巡视照明采用低位LED日光灯或投光灯。\n\n3.照明电源分正常和事故照明两个系统，正常运行时，由站用电屏提供正常交流照明，事故照明箱内直流断路器断开。当一般照明箱失电时，检修人员根据需要合上相应的事故照明开关，以提供事故时照明。\n\n4.各配电室、电缆隧道设置集中电源集中控制型应急照明疏散系统。\n\n5.检修动力：屋内各配电室装设动力检修箱，作为检修时动力电源。\n\n6.其他动力：室内设备用房按规范设置排风机及空调设备，电缆隧道内设置潜水泵。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '根据GB/T 14285对35MVA及以下变压器的配置要求，若低压侧无电源应配置自动重合闸',
                  '建议在主变压器高压侧配置自动重合闸装置',
                  '需确认10kV系统是否确实无电源接入'
                ],
                description:
                  '主变压器未配置自动重合闸装置，未满足低压侧无电源的变压器配置要求',
                geometry_ref: {
                  chapter:
                    '1.10kV开关室、电容器室、站用变室照明采用LED日光灯，二次设备室的照明采用格栅顶灯。主变压器室的照明采用防爆、防震型超强投光灯。110kV GIS室的照明采用LED防震型超强投光灯。\n\n2.道路及巡视照明采用低位LED日光灯或投光灯。\n\n3.照明电源分正常和事故照明两个系统，正常运行时，由站用电屏提供正常交流照明，事故照明箱内直流断路器断开。当一般照明箱失电时，检修人员根据需要合上相应的事故照明开关，以提供事故时照明。\n\n4.各配电室、电缆隧道设置集中电源集中控制型应急照明疏散系统。\n\n5.检修动力：屋内各配电室装设动力检修箱，作为检修时动力电源。\n\n6.其他动力：室内设备用房按规范设置排风机及空调设备，电缆隧道内设置潜水泵。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '35',
            title:
              '检查母线是否配置保护（如差动保护或简易保护），分段开关是否配置充电保护或过流保护',
            origin: 'GB/T 14285-2023',
            content:
              '检查母线是否配置保护（如差动保护或简易保护），分段开关是否配置充电保护或过流保护',
            violations: [
              {
                risk_level: 'high',
                suggestion: [
                  '补充110kV母线保护配置说明，根据GB/T 14285要求，若为单母线接线且属于重要用户，应配置专用母线保护或简易保护方案'
                ],
                description:
                  '设计说明未明确110kV母线保护配置方案，未体现是否采用差动保护或简易保护措施',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '根据GB/T 14285第5.1.3条要求，补充母联（分段）开关保护配置说明，应配置具有两段时限过流和零序过流功能的充电保护'
                ],
                description:
                  '未说明母联（分段）开关保护配置，未体现是否配置充电保护或过流保护功能',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '根据GB/T 14285第5.1.1条要求，补充110kV线路保护配置说明，应配置光纤电流差动保护作为主保护'
                ],
                description:
                  '未明确110kV线路保护配置方案，未体现是否配置光纤电流差动保护',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '36',
            title:
              '检查电容器、电抗器、站用变保护是否配置速断、过流、过压、欠压、不平衡（电压或电流）等保护',
            origin: 'GB/T 14285-2023',
            content:
              '检查电容器、电抗器、站用变保护是否配置速断、过流、过压、欠压、不平衡（电压或电流）等保护',
            violations: [
              {
                risk_level: 'high',
                suggestion: [
                  '补充电容器保护配置说明，明确配置速断保护（动作电流和时间整定值）、过流保护（动作电流和时间整定值）、低电压保护（动作电压和时间整定值）',
                  '核查电气一次施工图第5册（10kV并联电容器组装置）的保护配置逻辑'
                ],
                description:
                  '电容器保护配置缺失，未明确配置速断、过流、低电压等必要保护措施',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '补充电抗器保护配置说明，明确配置速断保护（动作电流和时间整定值）、过流保护（动作电流和时间整定值）、过压保护（动作电压和时间整定值）',
                  '核查电抗器设备参数是否包含保护功能配置信息'
                ],
                description:
                  '电抗器保护配置不完整，未明确配置速断、过流、过压等保护措施',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '补充站用变保护配置说明，明确配置速断保护（动作电流和时间整定值）、过流保护（动作电流和时间整定值）、过压保护（动作电压和时间整定值）',
                  '核查电气一次施工图第6册（10kV站用电装置）的保护配置逻辑'
                ],
                description:
                  '站用变保护配置未明确，未体现速断、过流、过压等基本保护措施',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充电容器组不平衡保护配置说明，明确配置不平衡电流保护（动作值和时间整定值）',
                  '核查电容器柜保护装置是否具备不平衡电流检测功能'
                ],
                description:
                  '未明确电容器组不平衡保护配置，可能影响电容器组运行安全',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充电容器组低电压保护配置说明，明确动作电压值（一般为额定电压的0.8-0.9倍）和动作时间整定值',
                  '核查母设柜PT（JDZX9-10G2）是否接入低电压保护回路'
                ],
                description:
                  '电容器组低电压保护配置信息缺失，可能无法有效防止过电压损坏设备',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '37',
            title:
              '检查网络架构是否为分层分布式结构，站控层、间隔层网络是否独立或冗余配置。系统容量和接口是否满足远景要求',
            origin: 'DL/T 5149-2020',
            content:
              '检查网络架构是否为分层分布式结构，站控层、间隔层网络是否独立或冗余配置。系统容量和接口是否满足远景要求',
            violations: [
              {
                risk_level: 'high',
                suggestion: [
                  '补充监控系统网络架构设计说明，明确采用分层分布式结构（至少两层架构）',
                  '在设计说明中增加过程层网络冗余双网配置方案'
                ],
                description:
                  '设计说明中未明确计算机监控系统的网络架构及分层分布式结构设计',
                geometry_ref: {
                  chapter:
                    '（一）电气主接线\n\n1．本变电站本期及远景设计规模为1台主变压器。型号为SZ20-25000/110，电压比为110±8×1.25%/10.5kV，接线方式为YN,d11。\n\n2．110kV进线远景1回，本期1回，电缆进线，T接110kV延太733线，线变组接线方式，110kV配电装置采用GIS全封闭式组合电器。\n\n3．10kV本期9回，远景14回，采用单母线接线，电缆出线。\n\n4．主变压器110kV侧中性点采用保护间隙方式，也可经隔离开关接地。10kV系统采用不接地方式。\n\n5．本期10kV母线配置1组户内框架式电容器组，容量为1×2400kvar。\n\n6．本期10kV母线配置1组消谐滤波补偿装置，容量为1×12000kvar。\n\n（二）电气平面布置\n\n根据变电站地理位置，各级电压等级进出线方向，进行电气总平面布置。110kV线路由变电站的东侧电缆进入；10kV出线由变电站南、西两侧出线。\n\n变电站全户内布置，主体为一幢一层建筑。本变电站为新建全户内变电站，配电装置楼长29米，宽21米。110kV配置装置室位于东北侧，变压器室位于北侧，10kV配电装置室位于南侧。10kV消谐补偿成套装置室位于西侧，10kV电容器室位于东北侧。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '明确站控层与间隔层网络是否采用独立配置或冗余双网方案',
                  '在监控系统设计章节增加网络拓扑图及链路冗余说明'
                ],
                description: '未提供站控层与间隔层网络的独立性或冗余配置信息',
                geometry_ref: {
                  chapter:
                    '（一）电气主接线\n\n1．本变电站本期及远景设计规模为1台主变压器。型号为SZ20-25000/110，电压比为110±8×1.25%/10.5kV，接线方式为YN,d11。\n\n2．110kV进线远景1回，本期1回，电缆进线，T接110kV延太733线，线变组接线方式，110kV配电装置采用GIS全封闭式组合电器。\n\n3．10kV本期9回，远景14回，采用单母线接线，电缆出线。\n\n4．主变压器110kV侧中性点采用保护间隙方式，也可经隔离开关接地。10kV系统采用不接地方式。\n\n5．本期10kV母线配置1组户内框架式电容器组，容量为1×2400kvar。\n\n6．本期10kV母线配置1组消谐滤波补偿装置，容量为1×12000kvar。\n\n（二）电气平面布置\n\n根据变电站地理位置，各级电压等级进出线方向，进行电气总平面布置。110kV线路由变电站的东侧电缆进入；10kV出线由变电站南、西两侧出线。\n\n变电站全户内布置，主体为一幢一层建筑。本变电站为新建全户内变电站，配电装置楼长29米，宽21米。110kV配置装置室位于东北侧，变压器室位于北侧，10kV配电装置室位于南侧。10kV消谐补偿成套装置室位于西侧，10kV电容器室位于东北侧。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充系统容量按远景14回10kV出线的配置方案',
                  '明确监控系统接口数量及类型满足远景扩展需求'
                ],
                description: '系统容量和接口配置未体现远景规划要求',
                geometry_ref: {
                  chapter:
                    '（一）电气主接线\n\n1．本变电站本期及远景设计规模为1台主变压器。型号为SZ20-25000/110，电压比为110±8×1.25%/10.5kV，接线方式为YN,d11。\n\n2．110kV进线远景1回，本期1回，电缆进线，T接110kV延太733线，线变组接线方式，110kV配电装置采用GIS全封闭式组合电器。\n\n3．10kV本期9回，远景14回，采用单母线接线，电缆出线。\n\n4．主变压器110kV侧中性点采用保护间隙方式，也可经隔离开关接地。10kV系统采用不接地方式。\n\n5．本期10kV母线配置1组户内框架式电容器组，容量为1×2400kvar。\n\n6．本期10kV母线配置1组消谐滤波补偿装置，容量为1×12000kvar。\n\n（二）电气平面布置\n\n根据变电站地理位置，各级电压等级进出线方向，进行电气总平面布置。110kV线路由变电站的东侧电缆进入；10kV出线由变电站南、西两侧出线。\n\n变电站全户内布置，主体为一幢一层建筑。本变电站为新建全户内变电站，配电装置楼长29米，宽21米。110kV配置装置室位于东北侧，变压器室位于北侧，10kV配电装置室位于南侧。10kV消谐补偿成套装置室位于西侧，10kV电容器室位于东北侧。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '增加服务器、网络设备、通信接口等关键设备的冗余配置说明',
                  '明确关键节点的双机热备和链路冗余措施'
                ],
                description: '未说明监控系统硬件冗余配置方案',
                geometry_ref: {
                  chapter:
                    '（一）电气主接线\n\n1．本变电站本期及远景设计规模为1台主变压器。型号为SZ20-25000/110，电压比为110±8×1.25%/10.5kV，接线方式为YN,d11。\n\n2．110kV进线远景1回，本期1回，电缆进线，T接110kV延太733线，线变组接线方式，110kV配电装置采用GIS全封闭式组合电器。\n\n3．10kV本期9回，远景14回，采用单母线接线，电缆出线。\n\n4．主变压器110kV侧中性点采用保护间隙方式，也可经隔离开关接地。10kV系统采用不接地方式。\n\n5．本期10kV母线配置1组户内框架式电容器组，容量为1×2400kvar。\n\n6．本期10kV母线配置1组消谐滤波补偿装置，容量为1×12000kvar。\n\n（二）电气平面布置\n\n根据变电站地理位置，各级电压等级进出线方向，进行电气总平面布置。110kV线路由变电站的东侧电缆进入；10kV出线由变电站南、西两侧出线。\n\n变电站全户内布置，主体为一幢一层建筑。本变电站为新建全户内变电站，配电装置楼长29米，宽21米。110kV配置装置室位于东北侧，变压器室位于北侧，10kV配电装置室位于南侧。10kV消谐补偿成套装置室位于西侧，10kV电容器室位于东北侧。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '38',
            title:
              '检查是否具备事件顺序记录（SOE）、事故追忆、无功电压自动控制（VQC）、防误闭锁、操作票、GPS对时等功能',
            origin: 'DL/T 5149-2020',
            content:
              '检查是否具备事件顺序记录（SOE）、事故追忆、无功电压自动控制（VQC）、防误闭锁、操作票、GPS对时等功能',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '在自动化系统设计中增加SOE功能模块配置要求',
                  '明确保护测控装置的事件记录分辨率和存储容量'
                ],
                description:
                  '设计说明中未明确是否配置事件顺序记录（SOE）功能，可能影响故障分析和事故追溯',
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '在无功补偿装置设计中增加VQC系统配置要求',
                  '明确VQC装置与SCADA系统的通信接口标准'
                ],
                description:
                  '无功电压自动控制（VQC）功能未在设计说明中体现，可能影响电压质量与无功优化',
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '补充电气闭锁和机械闭锁的配置方案',
                  '明确防误闭锁系统与监控系统的联动逻辑'
                ],
                description:
                  '防误闭锁系统设计要求未在设计说明中明确，可能增加误操作风险',
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在自动化系统设计中增加GPS对时装置配置要求',
                  '明确时间同步精度指标（如±1μs）'
                ],
                description:
                  'GPS对时系统配置未在设计说明中提及，可能影响系统时间同步精度',
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在SCADA系统设计中增加事故追忆功能模块',
                  '明确历史数据存储周期和调取方式'
                ],
                description:
                  '事故追忆功能未在设计说明中明确，可能影响事故分析完整性',
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在变电站自动化系统设计中增加操作票管理模块',
                  '明确与五防系统的集成方案'
                ],
                description:
                  '操作票系统配置要求未在设计说明中体现，可能影响操作规范性',
                geometry_ref: {
                  chapter:
                    '本工程根据以下文件进行施工设计：\n\n1.江阴东华铝材科技有限公司新上25000kVA工程初步设计及评审意见。\n\n2.本变电站有关设备的招标结果。\n\n3.现行国家和电力行业有关110kV变电站设计的标准、规程、规范及国家有关安全、环保等强制性标准。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '39',
            title:
              '检查是否具备完整的遥测、遥信、遥控、遥调功能，信息采集范围是否全面',
            origin: 'DL/T 5003-2017',
            content:
              '检查是否具备完整的遥测、遥信、遥控、遥调功能，信息采集范围是否全面',
            violations: [
              {
                risk_level: 'high',
                suggestion: [
                  '补充自动化系统设计章节，明确四遥功能的具体实现方式',
                  '在设备配置表中增加测控装置、远动终端等自动化设备的型号和数量'
                ],
                description:
                  '设计说明中未明确自动化系统功能配置，缺少遥测、遥信、遥控、遥调等基本功能的实现方案',
                geometry_ref: {
                  chapter:
                    '第1册  YB11844S-D101  总的部分\n\n第2册  YB11844S-D102  110kV屋内配电装置\n\n第3册  YB11844S-D103  主变压器及各电压进出线安装\n\n第4册  YB11844S-D104  10kV屋内配电装置\n\n第5册  YB11844S-D105  10kV并联电容器组装置\n\n第6册  YB11844S-D106  10kV站用电装置\n\n第7册  YB11844S-D107  10kV滤波补偿装置\n\n第8册  YB11844S-D108  变电站电力电缆敷设\n\n第9册  YB11844S-D109  全站接地',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '补充设备监测点配置表，明确变压器油温、负荷率等关键参数的采集要求',
                  '增加对110kV线路保护动作信号、10kV母线电压等重要信号的采集方案'
                ],
                description:
                  '信息采集范围未覆盖关键设备状态参数，缺少对变压器、断路器等核心设备的监测方案',
                geometry_ref: {
                  chapter:
                    '第1册  YB11844S-D101  总的部分\n\n第2册  YB11844S-D102  110kV屋内配电装置\n\n第3册  YB11844S-D103  主变压器及各电压进出线安装\n\n第4册  YB11844S-D104  10kV屋内配电装置\n\n第5册  YB11844S-D105  10kV并联电容器组装置\n\n第6册  YB11844S-D106  10kV站用电装置\n\n第7册  YB11844S-D107  10kV滤波补偿装置\n\n第8册  YB11844S-D108  变电站电力电缆敷设\n\n第9册  YB11844S-D109  全站接地',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充通信系统设计内容，明确采用光纤或无线专网等通信方式',
                  '规定信息传输的实时性、可靠性指标及通信协议类型'
                ],
                description:
                  '未说明自动化系统与调度中心的通信方式及信息传输要求',
                geometry_ref: {
                  chapter:
                    '第1册  YB11844S-D101  总的部分\n\n第2册  YB11844S-D102  110kV屋内配电装置\n\n第3册  YB11844S-D103  主变压器及各电压进出线安装\n\n第4册  YB11844S-D104  10kV屋内配电装置\n\n第5册  YB11844S-D105  10kV并联电容器组装置\n\n第6册  YB11844S-D106  10kV站用电装置\n\n第7册  YB11844S-D107  10kV滤波补偿装置\n\n第8册  YB11844S-D108  变电站电力电缆敷设\n\n第9册  YB11844S-D109  全站接地',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '40',
            title:
              '核对系统平均无故障时间（MTBF）、模拟量精度、SOE分辨率、画面刷新时间、控制命令响应时间等关键指标',
            origin: 'DL/T 5149-2020',
            content:
              '核对系统平均无故障时间（MTBF）、模拟量精度、SOE分辨率、画面刷新时间、控制命令响应时间等关键指标',
            violations: [
              {
                risk_level: 'high',
                suggestion: [
                  '补充系统MTBF计算依据，建议根据设备制造商提供的可靠性数据进行统计计算',
                  '参考DL/T 5392-2021《变电站自动化系统设计规范》中关于系统可靠性的要求'
                ],
                description:
                  '设计说明中未明确系统平均无故障时间（MTBF）的具体数值，缺乏系统可靠性量化依据',
                geometry_ref: {
                  chapter:
                    '1.10kV开关室、电容器室、站用变室照明采用LED日光灯，二次设备室的照明采用格栅顶灯。主变压器室的照明采用防爆、防震型超强投光灯。110kV GIS室的照明采用LED防震型超强投光灯。\n\n2.道路及巡视照明采用低位LED日光灯或投光灯。\n\n3.照明电源分正常和事故照明两个系统，正常运行时，由站用电屏提供正常交流照明，事故照明箱内直流断路器断开。当一般照明箱失电时，检修人员根据需要合上相应的事故照明开关，以提供事故时照明。\n\n4.各配电室、电缆隧道设置集中电源集中控制型应急照明疏散系统。\n\n5.检修动力：屋内各配电室装设动力检修箱，作为检修时动力电源。\n\n6.其他动力：室内设备用房按规范设置排风机及空调设备，电缆隧道内设置潜水泵。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '补充电流/电压互感器精度等级与测量系统精度的对应关系',
                  '根据GB/T 14285-2016《继电保护和安全自动装置技术规程》明确模拟量输入精度要求'
                ],
                description:
                  '未提供模拟量精度的具体指标，无法验证测量系统的准确性',
                geometry_ref: {
                  chapter:
                    '1.10kV开关室、电容器室、站用变室照明采用LED日光灯，二次设备室的照明采用格栅顶灯。主变压器室的照明采用防爆、防震型超强投光灯。110kV GIS室的照明采用LED防震型超强投光灯。\n\n2.道路及巡视照明采用低位LED日光灯或投光灯。\n\n3.照明电源分正常和事故照明两个系统，正常运行时，由站用电屏提供正常交流照明，事故照明箱内直流断路器断开。当一般照明箱失电时，检修人员根据需要合上相应的事故照明开关，以提供事故时照明。\n\n4.各配电室、电缆隧道设置集中电源集中控制型应急照明疏散系统。\n\n5.检修动力：屋内各配电室装设动力检修箱，作为检修时动力电源。\n\n6.其他动力：室内设备用房按规范设置排风机及空调设备，电缆隧道内设置潜水泵。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在自动化系统设计中明确SOE分辨率要求（建议≤1ms）',
                  '参考DL/T 721-2013《事件顺序记录装置技术条件》'
                ],
                description:
                  '事件顺序记录（SOE）分辨率未在设计中明确，影响故障分析精度',
                geometry_ref: {
                  chapter:
                    '1.10kV开关室、电容器室、站用变室照明采用LED日光灯，二次设备室的照明采用格栅顶灯。主变压器室的照明采用防爆、防震型超强投光灯。110kV GIS室的照明采用LED防震型超强投光灯。\n\n2.道路及巡视照明采用低位LED日光灯或投光灯。\n\n3.照明电源分正常和事故照明两个系统，正常运行时，由站用电屏提供正常交流照明，事故照明箱内直流断路器断开。当一般照明箱失电时，检修人员根据需要合上相应的事故照明开关，以提供事故时照明。\n\n4.各配电室、电缆隧道设置集中电源集中控制型应急照明疏散系统。\n\n5.检修动力：屋内各配电室装设动力检修箱，作为检修时动力电源。\n\n6.其他动力：室内设备用房按规范设置排风机及空调设备，电缆隧道内设置潜水泵。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在监控系统设计中规定画面刷新时间（建议≤2秒）',
                  '符合DL/T 5149-2002《变电站设计技术规程》相关要求'
                ],
                description:
                  '画面刷新时间指标缺失，无法保证监控系统的实时性要求',
                geometry_ref: {
                  chapter:
                    '1.10kV开关室、电容器室、站用变室照明采用LED日光灯，二次设备室的照明采用格栅顶灯。主变压器室的照明采用防爆、防震型超强投光灯。110kV GIS室的照明采用LED防震型超强投光灯。\n\n2.道路及巡视照明采用低位LED日光灯或投光灯。\n\n3.照明电源分正常和事故照明两个系统，正常运行时，由站用电屏提供正常交流照明，事故照明箱内直流断路器断开。当一般照明箱失电时，检修人员根据需要合上相应的事故照明开关，以提供事故时照明。\n\n4.各配电室、电缆隧道设置集中电源集中控制型应急照明疏散系统。\n\n5.检修动力：屋内各配电室装设动力检修箱，作为检修时动力电源。\n\n6.其他动力：室内设备用房按规范设置排风机及空调设备，电缆隧道内设置潜水泵。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在自动化系统设计中增加控制命令响应时间指标（建议≤500ms）',
                  '参考DL/T 5003-2018《变电站自动化系统技术规范》'
                ],
                description:
                  '控制命令响应时间未作明确规定，可能影响系统控制性能',
                geometry_ref: {
                  chapter:
                    '1.10kV开关室、电容器室、站用变室照明采用LED日光灯，二次设备室的照明采用格栅顶灯。主变压器室的照明采用防爆、防震型超强投光灯。110kV GIS室的照明采用LED防震型超强投光灯。\n\n2.道路及巡视照明采用低位LED日光灯或投光灯。\n\n3.照明电源分正常和事故照明两个系统，正常运行时，由站用电屏提供正常交流照明，事故照明箱内直流断路器断开。当一般照明箱失电时，检修人员根据需要合上相应的事故照明开关，以提供事故时照明。\n\n4.各配电室、电缆隧道设置集中电源集中控制型应急照明疏散系统。\n\n5.检修动力：屋内各配电室装设动力检修箱，作为检修时动力电源。\n\n6.其他动力：室内设备用房按规范设置排风机及空调设备，电缆隧道内设置潜水泵。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '41',
            title:
              '核查CT二次额定电流（1A或5A）、PT二次电压、直流操作电压（DC110V/220V）等是否统一、合理',
            origin:
              '\n            1.DL/T 5446-2012 《电力系统调度自动化工程可行性研究报告内容深度规定》；\n            2.DL/T 5044-2014 《电力工程直流电源系统设计技术规程》\n            3.GB/T 50065-2011 《交流电气装置的接地设计规范》\n            4.DL/T 572-2021 《电力变压器运行规程》',
            content:
              '核查CT二次额定电流（1A或5A）、PT二次电压、直流操作电压（DC110V/220V）等是否统一、合理',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '在设计说明中明确全站直流操作电压标准（建议采用110V或220V），并说明选择依据',
                  '核查直流供电距离是否符合规范要求（110V供电距离不超过250m）'
                ],
                description:
                  '直流操作电压未明确统一标准，可能导致设备兼容性问题',
                geometry_ref: {
                  chapter:
                    '第1册  YB11844S-D101  总的部分\n\n第2册  YB11844S-D102  110kV屋内配电装置\n\n第3册  YB11844S-D103  主变压器及各电压进出线安装\n\n第4册  YB11844S-D104  10kV屋内配电装置\n\n第5册  YB11844S-D105  10kV并联电容器组装置\n\n第6册  YB11844S-D106  10kV站用电装置\n\n第7册  YB11844S-D107  10kV滤波补偿装置\n\n第8册  YB11844S-D108  变电站电力电缆敷设\n\n第9册  YB11844S-D109  全站接地',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在设计说明中明确各电压等级PT二次电压标准（如100V/100√3V）',
                  '核查不同电压等级PT的二次电压是否保持一致'
                ],
                description:
                  'PT二次电压未明确统一标准，可能影响计量和保护系统的准确性',
                geometry_ref: {
                  chapter:
                    '第1册  YB11844S-D101  总的部分\n\n第2册  YB11844S-D102  110kV屋内配电装置\n\n第3册  YB11844S-D103  主变压器及各电压进出线安装\n\n第4册  YB11844S-D104  10kV屋内配电装置\n\n第5册  YB11844S-D105  10kV并联电容器组装置\n\n第6册  YB11844S-D106  10kV站用电装置\n\n第7册  YB11844S-D107  10kV滤波补偿装置\n\n第8册  YB11844S-D108  变电站电力电缆敷设\n\n第9册  YB11844S-D109  全站接地',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '42',
            title:
              '检查电流回路导线截面是否不小于4mm²，电压回路不小于2.5mm²。控制电缆是否为屏蔽铠装电缆',
            origin: 'DL/T 5136-2012',
            content:
              '检查电流回路导线截面是否不小于4mm²，电压回路不小于2.5mm²。控制电缆是否为屏蔽铠装电缆',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '在电缆选型表或施工说明中补充电流回路和电压回路的导线截面参数',
                  '核查DL/T 5136和GB 50217对不同回路的截面要求并补充说明'
                ],
                description:
                  '设计说明未明确电流回路导线截面是否满足不小于4mm²、电压回路不小于2.5mm²的要求',
                geometry_ref: {
                  chapter:
                    '1.电缆敷设时，请留适当余量。\n\n2.10kV开关柜就位时，为使电缆能顺利进入柜下洞口，请尽量减小柜体安装误差。\n\n3.在进行设备安装之前，应仔细复核到货设备的安装孔尺寸，如发现与安装图不符，应及时与设计单位联系，以便妥善处理。\n\n4.10kV配电装置的设计图纸中，仅标明进线母线的相序，柜内母线布置和相序根据国标及实际情况确定；设计在图纸中仅标明主母线的规格，柜内其它母线的选型由制造厂根据导线载流要求和实际工作条件确定。\n\n5.在作设备引线时，设备线夹可按实际设备端子及走线方向加以调整，在满足电气安全距离和设备端子允许拉力的条件下，力求过渡自然。导线裸露端应用铝包带缠紧扎牢，以免胀裂。此外，钢芯铝绞线不宜沿地面拖拉，以免增加电晕。\n\n6.设备安装中用的钢材均采用热镀锌钢材，焊接拼装件宜先焊接成形后再镀锌，对某些不宜镀锌的铁件，应在设备安装后刷水性富锌漆两道，罩面漆一道。\n\n7.在接地施工中，接地网与电缆沟交叉处不应被截断，也不得接入电缆沟内，应将接地扁钢从电缆沟以下穿越连通，其预埋敷设工作应早作安排。接地网交叉处应做好绝缘及防腐处理。防雷集中接地与避雷器集中接地不应共用。\n\n8.动力、照明在土建施工中应详细阅读相关卷册说明，注意做好各箱、盒、灯具及管线的预埋敷设工作，各动力箱、照明箱、接线箱、控制箱应按远景规模的进出线管一次敷设到位。施工中电、土专业人员应做好配合工作。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在电缆敷设章节补充控制电缆的屏蔽铠装要求',
                  '核查GB 50217关于控制电缆屏蔽和铠装的规范要求并补充说明'
                ],
                description: '未明确控制电缆是否采用屏蔽铠装型式',
                geometry_ref: {
                  chapter:
                    '1.电缆敷设时，请留适当余量。\n\n2.10kV开关柜就位时，为使电缆能顺利进入柜下洞口，请尽量减小柜体安装误差。\n\n3.在进行设备安装之前，应仔细复核到货设备的安装孔尺寸，如发现与安装图不符，应及时与设计单位联系，以便妥善处理。\n\n4.10kV配电装置的设计图纸中，仅标明进线母线的相序，柜内母线布置和相序根据国标及实际情况确定；设计在图纸中仅标明主母线的规格，柜内其它母线的选型由制造厂根据导线载流要求和实际工作条件确定。\n\n5.在作设备引线时，设备线夹可按实际设备端子及走线方向加以调整，在满足电气安全距离和设备端子允许拉力的条件下，力求过渡自然。导线裸露端应用铝包带缠紧扎牢，以免胀裂。此外，钢芯铝绞线不宜沿地面拖拉，以免增加电晕。\n\n6.设备安装中用的钢材均采用热镀锌钢材，焊接拼装件宜先焊接成形后再镀锌，对某些不宜镀锌的铁件，应在设备安装后刷水性富锌漆两道，罩面漆一道。\n\n7.在接地施工中，接地网与电缆沟交叉处不应被截断，也不得接入电缆沟内，应将接地扁钢从电缆沟以下穿越连通，其预埋敷设工作应早作安排。接地网交叉处应做好绝缘及防腐处理。防雷集中接地与避雷器集中接地不应共用。\n\n8.动力、照明在土建施工中应详细阅读相关卷册说明，注意做好各箱、盒、灯具及管线的预埋敷设工作，各动力箱、照明箱、接线箱、控制箱应按远景规模的进出线管一次敷设到位。施工中电、土专业人员应做好配合工作。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'low',
                suggestion: [
                  '补充备用芯线必须使用芯帽套好的说明',
                  '明确屏蔽层接地应使用不小于4mm²多股铜质软导线连接至接地铜排'
                ],
                description: '未说明备用芯线的处理方式是否符合屏蔽层接地要求',
                geometry_ref: {
                  chapter:
                    '1.电缆敷设时，请留适当余量。\n\n2.10kV开关柜就位时，为使电缆能顺利进入柜下洞口，请尽量减小柜体安装误差。\n\n3.在进行设备安装之前，应仔细复核到货设备的安装孔尺寸，如发现与安装图不符，应及时与设计单位联系，以便妥善处理。\n\n4.10kV配电装置的设计图纸中，仅标明进线母线的相序，柜内母线布置和相序根据国标及实际情况确定；设计在图纸中仅标明主母线的规格，柜内其它母线的选型由制造厂根据导线载流要求和实际工作条件确定。\n\n5.在作设备引线时，设备线夹可按实际设备端子及走线方向加以调整，在满足电气安全距离和设备端子允许拉力的条件下，力求过渡自然。导线裸露端应用铝包带缠紧扎牢，以免胀裂。此外，钢芯铝绞线不宜沿地面拖拉，以免增加电晕。\n\n6.设备安装中用的钢材均采用热镀锌钢材，焊接拼装件宜先焊接成形后再镀锌，对某些不宜镀锌的铁件，应在设备安装后刷水性富锌漆两道，罩面漆一道。\n\n7.在接地施工中，接地网与电缆沟交叉处不应被截断，也不得接入电缆沟内，应将接地扁钢从电缆沟以下穿越连通，其预埋敷设工作应早作安排。接地网交叉处应做好绝缘及防腐处理。防雷集中接地与避雷器集中接地不应共用。\n\n8.动力、照明在土建施工中应详细阅读相关卷册说明，注意做好各箱、盒、灯具及管线的预埋敷设工作，各动力箱、照明箱、接线箱、控制箱应按远景规模的进出线管一次敷设到位。施工中电、土专业人员应做好配合工作。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '43',
            title:
              '检查是否设置独立的二次等电位接地网（铜排），并与主接地网单点可靠连接。保护屏、柜体、电缆屏蔽层接地是否规范',
            origin: 'GB/T 50065-2011',
            content:
              '检查是否设置独立的二次等电位接地网（铜排），并与主接地网单点可靠连接。保护屏、柜体、电缆屏蔽层接地是否规范',
            violations: [
              {
                risk_level: 'high',
                suggestion: [
                  '在设计说明中补充二次等电位接地网的设置要求，明确在保护室屏柜下层电缆室敷设截面积不小于100mm²的铜排',
                  '说明铜排首尾相连形成等电位地网，并与主地网单点连接的具体实施方式'
                ],
                description:
                  '设计说明未明确设置独立的二次等电位接地网，未说明接地铜排的敷设位置和连接方式',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充继电保护屏柜下应设置100mm²接地铜排的要求',
                  '明确接地铜排与主接地网的连接点位置及连接方式'
                ],
                description:
                  '保护屏、柜体的接地规范未具体说明接地铜排规格及连接要求',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在设计说明中增加控制电缆屏蔽层两端接地的具体实施要求',
                  '补充电缆敷设路径应远离干扰源的设计要求'
                ],
                description: '控制电缆屏蔽层的接地要求未明确实施细节',
                geometry_ref: {
                  chapter:
                    '1. 直击雷保护\n\n本工程为全户内变电站，钢筋混凝土结构，在屋顶装设避雷带，将其焊接成网状接地，避雷带接地引下线与主接地网连接，并在连接处加装集中接地装置，详见建筑电气卷册。\n\n2.过电压保护\n\n为防止线路侵入的雷电波过电压，在110kV进线、主变中性点、主变低压侧和10kV母设柜、电容器柜、出线柜分别安装避雷器；10kV并联电容器装设氧化锌避雷器保护。\n\n3.接地\n\n全所主接地网采用网格布置，以水平接地体为主，垂直接地体为辅。水平接地体及接地引上采用-60×8的热镀锌扁钢，垂直接地极采用∠63×63×6热镀锌角钢，间距不小于5m，接地体焊接应满足规程要求，焊后镀锌层被破坏，应涂环氧富锌漆。水平接地体埋深均为1.0m，垂直接地极顶部埋深均为0.8m（建筑物下方的水平接地体、垂直接地极顶部埋深为建筑物基础底板以下0.2m）。接地网外围四拐角部分做成圆弧状，施工中接地体与基础相触时，可适当移位敷设。接地网边缘外1米范围内铺设20mm厚沥青地面(路面)或碎石。变电站接地电阻不应大于0.378Ω。施工完成应实测接地电阻值，如不满足要求，应采取措施，如扩大接地网面积，增设垂直接地体等。\n\n室内沿墙的接地环网采用-60×8热镀锌扁钢暗敷，并留出室内检修接地端子。由主接地网引至室内接地网采用-60×8热镀锌扁钢，敷设于相应的框架柱内，主网与柱中接地线及钢筋可靠焊接，各层引出点处需按接地体连接要求引出至各层室内接地网。\n\n所有电力设备外壳、金属构、支架及预埋铁件等均应按《电气装置安装工程接地装置施工及验收规范》和《交流电气装置的接地》的要求进行接地，接地引线采用-60×8镀锌扁钢。\n\n二次回路的接地按照相关技术规定执行，详见二次施工图设计。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '44',
            title:
              '检查强电、弱电电缆是否分层、分开敷设。保护装置电源入口、通信接口等是否采取防浪涌、防雷措施',
            origin: 'GB 50217-2018',
            content:
              '检查强电、弱电电缆是否分层、分开敷设。保护装置电源入口、通信接口等是否采取防浪涌、防雷措施',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '在电缆敷设章节补充强弱电电缆分层布置要求，电力电缆与控制电缆间距不小于0.5m',
                  '明确110kV电缆与10kV电缆分设不同通道的施工要求'
                ],
                description:
                  '设计说明未明确强电与弱电电缆的分层或分开敷设方案，存在电磁干扰风险',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '在过电压保护章节补充电源入口处安装SPD（电涌保护器）的要求',
                  '明确通信接口处配置信号避雷器的施工标准'
                ],
                description: '未说明保护装置电源入口和通信接口的防浪涌保护措施',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '补充阻火墙两侧电缆通道的防火封堵要求',
                  '明确不同电压等级电缆支架间的防火隔离措施'
                ],
                description: '电缆防火措施未体现强弱电电缆的物理隔离要求',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '45',
            title:
              '检查直流系统接线方式（单母分段、双母等）、蓄电池组数及容量、充电模块数量（N+1配置）是否满足全站事故放电时间要求',
            origin: 'DL/T 5044',
            content:
              '检查直流系统接线方式（单母分段、双母等）、蓄电池组数及容量、充电模块数量（N+1配置）是否满足全站事故放电时间要求',
            violations: [
              {
                risk_level: 'high',
                suggestion: [
                  '补充直流系统设计说明，明确蓄电池组数量（1组或2组）、接线方式（单母线或单母线分段）、充电模块数量及容量配置',
                  '根据变电站类型（有人/无人值班）校核事故放电时间是否满足1小时或2小时要求'
                ],
                description:
                  '设计说明中未明确直流系统接线方式、蓄电池组数量及容量、充电模块数量等关键参数，无法验证是否符合全站事故放电时间要求',
                geometry_ref: {
                  chapter:
                    '1.10kV开关室、电容器室、站用变室照明采用LED日光灯，二次设备室的照明采用格栅顶灯。主变压器室的照明采用防爆、防震型超强投光灯。110kV GIS室的照明采用LED防震型超强投光灯。\n\n2.道路及巡视照明采用低位LED日光灯或投光灯。\n\n3.照明电源分正常和事故照明两个系统，正常运行时，由站用电屏提供正常交流照明，事故照明箱内直流断路器断开。当一般照明箱失电时，检修人员根据需要合上相应的事故照明开关，以提供事故时照明。\n\n4.各配电室、电缆隧道设置集中电源集中控制型应急照明疏散系统。\n\n5.检修动力：屋内各配电室装设动力检修箱，作为检修时动力电源。\n\n6.其他动力：室内设备用房按规范设置排风机及空调设备，电缆隧道内设置潜水泵。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '根据充电模块基本数量（6个及以下配置1个备用，7个及以上配置2个备用）补充备用模块配置方案',
                  '在设计说明中明确充电装置冗余配置要求'
                ],
                description:
                  '未说明直流系统是否配置备用充电模块，可能导致充电装置故障时无法满足负荷需求',
                geometry_ref: {
                  chapter:
                    '1.10kV开关室、电容器室、站用变室照明采用LED日光灯，二次设备室的照明采用格栅顶灯。主变压器室的照明采用防爆、防震型超强投光灯。110kV GIS室的照明采用LED防震型超强投光灯。\n\n2.道路及巡视照明采用低位LED日光灯或投光灯。\n\n3.照明电源分正常和事故照明两个系统，正常运行时，由站用电屏提供正常交流照明，事故照明箱内直流断路器断开。当一般照明箱失电时，检修人员根据需要合上相应的事故照明开关，以提供事故时照明。\n\n4.各配电室、电缆隧道设置集中电源集中控制型应急照明疏散系统。\n\n5.检修动力：屋内各配电室装设动力检修箱，作为检修时动力电源。\n\n6.其他动力：室内设备用房按规范设置排风机及空调设备，电缆隧道内设置潜水泵。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '46',
            title: '核对蓄电池容量计算',
            origin: 'DL/T 5044',
            content: '核对蓄电池容量计算',
            violations: [
              {
                risk_level: 'high',
                suggestion: [
                  '补充蓄电池容量计算所需的阶梯负荷数据',
                  '明确不同放电时间对应的放电电流值',
                  '提供容量换算系数Kc的取值依据'
                ],
                description:
                  '设计资料中未提供蓄电池容量计算所需的负荷曲线、放电时间、容量换算系数Kc等关键参数，无法验证计算过程',
                geometry_ref: {
                  chapter:
                    '第1册  YB11844S-D101  总的部分\n\n第2册  YB11844S-D102  110kV屋内配电装置\n\n第3册  YB11844S-D103  主变压器及各电压进出线安装\n\n第4册  YB11844S-D104  10kV屋内配电装置\n\n第5册  YB11844S-D105  10kV并联电容器组装置\n\n第6册  YB11844S-D106  10kV站用电装置\n\n第7册  YB11844S-D107  10kV滤波补偿装置\n\n第8册  YB11844S-D108  变电站电力电缆敷设\n\n第9册  YB11844S-D109  全站接地',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '核对计算公式是否包含放电时间、放电电流、温度修正系数、可靠系数1.40等要素',
                  '补充计算过程的详细推导步骤'
                ],
                description:
                  '未见蓄电池容量计算公式与DL/T 5044规范要求的阶梯负荷计算法的对应关系验证',
                geometry_ref: {
                  chapter:
                    '第1册  YB11844S-D101  总的部分\n\n第2册  YB11844S-D102  110kV屋内配电装置\n\n第3册  YB11844S-D103  主变压器及各电压进出线安装\n\n第4册  YB11844S-D104  10kV屋内配电装置\n\n第5册  YB11844S-D105  10kV并联电容器组装置\n\n第6册  YB11844S-D106  10kV站用电装置\n\n第7册  YB11844S-D107  10kV滤波补偿装置\n\n第8册  YB11844S-D108  变电站电力电缆敷设\n\n第9册  YB11844S-D109  全站接地',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '在设计说明中补充可靠系数1.40的取值依据（如DL/T 5044规范要求）',
                  '说明可靠系数的适用场景及计算影响'
                ],
                description:
                  '未明确蓄电池容量计算中可靠系数1.40的取值依据及适用条件',
                geometry_ref: {
                  chapter:
                    '第1册  YB11844S-D101  总的部分\n\n第2册  YB11844S-D102  110kV屋内配电装置\n\n第3册  YB11844S-D103  主变压器及各电压进出线安装\n\n第4册  YB11844S-D104  10kV屋内配电装置\n\n第5册  YB11844S-D105  10kV并联电容器组装置\n\n第6册  YB11844S-D106  10kV站用电装置\n\n第7册  YB11844S-D107  10kV滤波补偿装置\n\n第8册  YB11844S-D108  变电站电力电缆敷设\n\n第9册  YB11844S-D109  全站接地',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '47',
            title: '检查是否采用辐射状供电，是否配置绝缘监测、电池巡检装置',
            origin: 'DL/T 5044',
            content: '检查是否采用辐射状供电，是否配置绝缘监测、电池巡检装置',
            violations: [
              {
                risk_level: 'high',
                suggestion: [
                  '在直流电源系统设计说明中明确采用集中辐射或分层辐射供电方式',
                  '提供直流馈线网络接线图并标注供电路径'
                ],
                description:
                  '直流电源系统未明确采用辐射状供电方式，可能影响系统可靠性',
                geometry_ref: {
                  chapter:
                    '1.10kV开关室、电容器室、站用变室照明采用LED日光灯，二次设备室的照明采用格栅顶灯。主变压器室的照明采用防爆、防震型超强投光灯。110kV GIS室的照明采用LED防震型超强投光灯。\n\n2.道路及巡视照明采用低位LED日光灯或投光灯。\n\n3.照明电源分正常和事故照明两个系统，正常运行时，由站用电屏提供正常交流照明，事故照明箱内直流断路器断开。当一般照明箱失电时，检修人员根据需要合上相应的事故照明开关，以提供事故时照明。\n\n4.各配电室、电缆隧道设置集中电源集中控制型应急照明疏散系统。\n\n5.检修动力：屋内各配电室装设动力检修箱，作为检修时动力电源。\n\n6.其他动力：室内设备用房按规范设置排风机及空调设备，电缆隧道内设置潜水泵。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '在直流系统设计中增加绝缘监测装置配置要求',
                  '明确绝缘监测装置精度不低于1.5级的技术参数'
                ],
                description: '未配置蓄电池绝缘监测装置，无法及时发现接地故障',
                geometry_ref: {
                  chapter:
                    '1.10kV开关室、电容器室、站用变室照明采用LED日光灯，二次设备室的照明采用格栅顶灯。主变压器室的照明采用防爆、防震型超强投光灯。110kV GIS室的照明采用LED防震型超强投光灯。\n\n2.道路及巡视照明采用低位LED日光灯或投光灯。\n\n3.照明电源分正常和事故照明两个系统，正常运行时，由站用电屏提供正常交流照明，事故照明箱内直流断路器断开。当一般照明箱失电时，检修人员根据需要合上相应的事故照明开关，以提供事故时照明。\n\n4.各配电室、电缆隧道设置集中电源集中控制型应急照明疏散系统。\n\n5.检修动力：屋内各配电室装设动力检修箱，作为检修时动力电源。\n\n6.其他动力：室内设备用房按规范设置排风机及空调设备，电缆隧道内设置潜水泵。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '补充电池巡检装置配置方案',
                  '要求巡检装置具备单体电压和温度监测功能',
                  '规定数据上传至直流监控装置的通信协议'
                ],
                description:
                  '未配置电池巡检装置，无法实现对蓄电池状态的实时监控',
                geometry_ref: {
                  chapter:
                    '1.10kV开关室、电容器室、站用变室照明采用LED日光灯，二次设备室的照明采用格栅顶灯。主变压器室的照明采用防爆、防震型超强投光灯。110kV GIS室的照明采用LED防震型超强投光灯。\n\n2.道路及巡视照明采用低位LED日光灯或投光灯。\n\n3.照明电源分正常和事故照明两个系统，正常运行时，由站用电屏提供正常交流照明，事故照明箱内直流断路器断开。当一般照明箱失电时，检修人员根据需要合上相应的事故照明开关，以提供事故时照明。\n\n4.各配电室、电缆隧道设置集中电源集中控制型应急照明疏散系统。\n\n5.检修动力：屋内各配电室装设动力检修箱，作为检修时动力电源。\n\n6.其他动力：室内设备用房按规范设置排风机及空调设备，电缆隧道内设置潜水泵。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '48',
            title:
              '检查是否为在线式UPS，容量是否满足监控、火灾报警等重要负荷需求，后备时间是否足够',
            origin: 'DL/T 1074',
            content:
              '检查是否为在线式UPS，容量是否满足监控、火灾报警等重要负荷需求，后备时间是否足够',
            violations: [
              {
                risk_level: 'high',
                suggestion: [
                  '补充UPS系统配置说明，明确在线式UPS的选型及容量计算依据',
                  '在电气一次设计中增加UPS供电回路及应急电源接入方案'
                ],
                description:
                  '设计说明中未明确配置UPS或应急电源，未满足特别重要负荷的供电连续性要求',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: [
                  '在设计说明中补充UPS持续供电时间≥30分钟、切换时间0秒的技术参数',
                  '增加UPS系统与柴油发电机的切换逻辑说明'
                ],
                description:
                  '未明确UPS后备时间及切换时间指标，不符合应急电源配置规范要求',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '提供监控系统和火灾报警系统最大计算负荷数据',
                  '按1.3倍负荷需求核算UPS容量并形成计算书'
                ],
                description:
                  '未明确监控系统、火灾报警系统等关键负荷的UPS容量计算依据',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '49',
            title:
              '检查关口计量点设置是否合理，电能表、互感器准确度等级（如0.2S级CT，0.5S级电能表）是否符合规程要求',
            origin: 'DL/T 448-2016',
            content:
              '检查关口计量点设置是否合理，电能表、互感器准确度等级（如0.2S级CT，0.5S级电能表）是否符合规程要求',
            violations: [
              {
                risk_level: 'medium',
                suggestion: [
                  '将主变压器高压侧套管电流互感器的准确度等级由0.5级更换为0.5S级',
                  '核查主变压器计量用途是否属于考核用电，若属于III类计量装置则必须满足0.5S级要求'
                ],
                description:
                  '主变压器高压侧套管电流互感器部分选用0.5级，未达到III类电能计量装置对电流互感器0.5S级的要求',
                geometry_ref: {
                  chapter:
                    '1. 主变压器的选型\n\n（1）#1主变采用SZ20-25000/110-NX2型一体式双圈自冷有载调压变压器，厂家为江苏华鹏变压器有限公司。\n\n容量：25MVA/25MVA；\n\n电压比：110±8×1.25%/10.5kV；\n\n短路阻抗电压：UK=10.5%；\n\n联结组别：YN ,d11；\n\n冷却方式：自冷\n\n有载调压开关：CVⅢ-350Y/72.5-10193W,17级\n\n附套管电流互感器:\n\n高压侧 LRB-110，200-400-600/5A，5P30，20VA，每相1只\n\nLRB-110，200-400-600/5A，5P30，20VA，每相1只\n\nLR-110，200-400-600/5A，0.5，30VA，每相1只\n\nLR-110，200-400-600/5A，0.5，20VA，仅B相\n\n8） 轨    距：标准轨距，2040mm\n\n9）变压器满足《GB20052-2020电力变压器能效限定值及能效等级》二级能效相关技术要求。\n\n2. 110kV设备的选择\n\n110kV配电装置选用GIS全封闭组合电器，厂家为上海思源高压开关有限公司，三相共箱，额定电流2000A，开断电流40kA；动稳定电流100kA；热稳定电流40kA/3s，配电缆终端筒2000A。\n\n110kV进线计量电压互器选用：(110√3)/(0.1/√3)/(0.1/√3) /0.1kV，0.2/0.5/3P，10/50/100VA，带电显示器。\n\n计量电流互感器选用变比为150-250/5A（本期150/5），0.2S，15VA。\n\n110kV保护电流互感器：300-600/5A，5P30/5P30/5P30/0.5/0.2S。\n\n110kV避雷器选用氧化锌避雷器，标称放电电流10kA，额定电压102kV, 雷电冲击残压266kV，并配置在线监测装置。\n\n3.主变中性点设备\n\n主变中性点设备厂家为大连新安越电力设备有限公司，型号BZFZ-110；配中性点隔离开关：GW13-72.5/630A，附CJ6B电动操作机构；零序CT：LZW-10 100-300/5A 5P30/5P30 20VA；避雷器：Y1.5W-72/186，附在线监测仪；放电间隙90-150mm范围可调；中性点间隙CT：LZW-10 100-300/5A 5P30/5P30 20VA，支架配套。\n\n4. 10kV设备选择\n\n1）10kV开关柜厂家为江阴市富仁电气有限公司，KYN28A-12型金属铠装中置手车式开关柜，额定电压10kV。主母线额定电流2000A，热稳定电流31.5kA/4s，爬电比距20mm/kV，防护等级IP4X。\n\n柜内真空断路器CV1-12。主变进线柜额定电流2000A，开断电流31.5kA；出线柜、电容器柜、接地变柜额定电流1250A，开断电流25kA。\n\n柜内电流互感器采用户内环氧树脂浇注式电流互感器。主变进线CT型号LZZBJ9-10E3 2000/5A 5P30/5P30/5P30/0.5/0.2S 30/30/30/30/30VA。出线回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。电容器回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。消谐回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。\n\n10kV开关柜内电压互感器选用户内多绕组环氧树脂浇注式电压互感器。10kV母设柜PT为JDZX9-10G2 ///kV  0.2/0.5（3P）/3P 30/50/100VA。\n\n10kV柜内避雷器选用复合外套金属氧化物避雷器，型号HY5WZ-17/45，母设柜内避雷器附在线监测仪，其余避雷器附计数器。\n\n2）10kV电容器组厂家为靖江市普瑞电力科技有限公司，户内框架式布置，电容器采用PRFC10-2400/400AK(5%)，额定电压：10kV，单台容量：400kvar，配串联电抗器：CKSC-120/10-5%。\n\n3）10kV滤波补偿成套装置厂家为靖江市普瑞电力科技有限公司，户内布置，1#滤波补偿成套装置(12000kvar)内包含：1#滤波支路(5次)容量为4800kvar，滤波支路(7次)容量为3600kvar，滤波支路(11次)容量为3600kvar。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '将10kV母线电压互感器准确度等级由0.2级调整为0.5级',
                  '确认10kV母线计量是否属于贸易结算或考核用电，若属于III类计量装置则必须满足0.5级要求'
                ],
                description:
                  '10kV母线电压互感器选用0.2级，超出III类电能计量装置对电压互感器0.5级的要求',
                geometry_ref: {
                  chapter:
                    '1. 主变压器的选型\n\n（1）#1主变采用SZ20-25000/110-NX2型一体式双圈自冷有载调压变压器，厂家为江苏华鹏变压器有限公司。\n\n容量：25MVA/25MVA；\n\n电压比：110±8×1.25%/10.5kV；\n\n短路阻抗电压：UK=10.5%；\n\n联结组别：YN ,d11；\n\n冷却方式：自冷\n\n有载调压开关：CVⅢ-350Y/72.5-10193W,17级\n\n附套管电流互感器:\n\n高压侧 LRB-110，200-400-600/5A，5P30，20VA，每相1只\n\nLRB-110，200-400-600/5A，5P30，20VA，每相1只\n\nLR-110，200-400-600/5A，0.5，30VA，每相1只\n\nLR-110，200-400-600/5A，0.5，20VA，仅B相\n\n8） 轨    距：标准轨距，2040mm\n\n9）变压器满足《GB20052-2020电力变压器能效限定值及能效等级》二级能效相关技术要求。\n\n2. 110kV设备的选择\n\n110kV配电装置选用GIS全封闭组合电器，厂家为上海思源高压开关有限公司，三相共箱，额定电流2000A，开断电流40kA；动稳定电流100kA；热稳定电流40kA/3s，配电缆终端筒2000A。\n\n110kV进线计量电压互器选用：(110√3)/(0.1/√3)/(0.1/√3) /0.1kV，0.2/0.5/3P，10/50/100VA，带电显示器。\n\n计量电流互感器选用变比为150-250/5A（本期150/5），0.2S，15VA。\n\n110kV保护电流互感器：300-600/5A，5P30/5P30/5P30/0.5/0.2S。\n\n110kV避雷器选用氧化锌避雷器，标称放电电流10kA，额定电压102kV, 雷电冲击残压266kV，并配置在线监测装置。\n\n3.主变中性点设备\n\n主变中性点设备厂家为大连新安越电力设备有限公司，型号BZFZ-110；配中性点隔离开关：GW13-72.5/630A，附CJ6B电动操作机构；零序CT：LZW-10 100-300/5A 5P30/5P30 20VA；避雷器：Y1.5W-72/186，附在线监测仪；放电间隙90-150mm范围可调；中性点间隙CT：LZW-10 100-300/5A 5P30/5P30 20VA，支架配套。\n\n4. 10kV设备选择\n\n1）10kV开关柜厂家为江阴市富仁电气有限公司，KYN28A-12型金属铠装中置手车式开关柜，额定电压10kV。主母线额定电流2000A，热稳定电流31.5kA/4s，爬电比距20mm/kV，防护等级IP4X。\n\n柜内真空断路器CV1-12。主变进线柜额定电流2000A，开断电流31.5kA；出线柜、电容器柜、接地变柜额定电流1250A，开断电流25kA。\n\n柜内电流互感器采用户内环氧树脂浇注式电流互感器。主变进线CT型号LZZBJ9-10E3 2000/5A 5P30/5P30/5P30/0.5/0.2S 30/30/30/30/30VA。出线回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。电容器回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。消谐回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。\n\n10kV开关柜内电压互感器选用户内多绕组环氧树脂浇注式电压互感器。10kV母设柜PT为JDZX9-10G2 ///kV  0.2/0.5（3P）/3P 30/50/100VA。\n\n10kV柜内避雷器选用复合外套金属氧化物避雷器，型号HY5WZ-17/45，母设柜内避雷器附在线监测仪，其余避雷器附计数器。\n\n2）10kV电容器组厂家为靖江市普瑞电力科技有限公司，户内框架式布置，电容器采用PRFC10-2400/400AK(5%)，额定电压：10kV，单台容量：400kvar，配串联电抗器：CKSC-120/10-5%。\n\n3）10kV滤波补偿成套装置厂家为靖江市普瑞电力科技有限公司，户内布置，1#滤波补偿成套装置(12000kvar)内包含：1#滤波支路(5次)容量为4800kvar，滤波支路(7次)容量为3600kvar，滤波支路(11次)容量为3600kvar。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'medium',
                suggestion: [
                  '将10kV出线电压互感器准确度等级由0.2级调整为0.5级',
                  '核实10kV出线计量是否属于贸易结算或考核用电，若属于III类计量装置则必须满足0.5级要求'
                ],
                description:
                  '10kV出线电压互感器选用0.2级，超出III类电能计量装置对电压互感器0.5级的要求',
                geometry_ref: {
                  chapter:
                    '1. 主变压器的选型\n\n（1）#1主变采用SZ20-25000/110-NX2型一体式双圈自冷有载调压变压器，厂家为江苏华鹏变压器有限公司。\n\n容量：25MVA/25MVA；\n\n电压比：110±8×1.25%/10.5kV；\n\n短路阻抗电压：UK=10.5%；\n\n联结组别：YN ,d11；\n\n冷却方式：自冷\n\n有载调压开关：CVⅢ-350Y/72.5-10193W,17级\n\n附套管电流互感器:\n\n高压侧 LRB-110，200-400-600/5A，5P30，20VA，每相1只\n\nLRB-110，200-400-600/5A，5P30，20VA，每相1只\n\nLR-110，200-400-600/5A，0.5，30VA，每相1只\n\nLR-110，200-400-600/5A，0.5，20VA，仅B相\n\n8） 轨    距：标准轨距，2040mm\n\n9）变压器满足《GB20052-2020电力变压器能效限定值及能效等级》二级能效相关技术要求。\n\n2. 110kV设备的选择\n\n110kV配电装置选用GIS全封闭组合电器，厂家为上海思源高压开关有限公司，三相共箱，额定电流2000A，开断电流40kA；动稳定电流100kA；热稳定电流40kA/3s，配电缆终端筒2000A。\n\n110kV进线计量电压互器选用：(110√3)/(0.1/√3)/(0.1/√3) /0.1kV，0.2/0.5/3P，10/50/100VA，带电显示器。\n\n计量电流互感器选用变比为150-250/5A（本期150/5），0.2S，15VA。\n\n110kV保护电流互感器：300-600/5A，5P30/5P30/5P30/0.5/0.2S。\n\n110kV避雷器选用氧化锌避雷器，标称放电电流10kA，额定电压102kV, 雷电冲击残压266kV，并配置在线监测装置。\n\n3.主变中性点设备\n\n主变中性点设备厂家为大连新安越电力设备有限公司，型号BZFZ-110；配中性点隔离开关：GW13-72.5/630A，附CJ6B电动操作机构；零序CT：LZW-10 100-300/5A 5P30/5P30 20VA；避雷器：Y1.5W-72/186，附在线监测仪；放电间隙90-150mm范围可调；中性点间隙CT：LZW-10 100-300/5A 5P30/5P30 20VA，支架配套。\n\n4. 10kV设备选择\n\n1）10kV开关柜厂家为江阴市富仁电气有限公司，KYN28A-12型金属铠装中置手车式开关柜，额定电压10kV。主母线额定电流2000A，热稳定电流31.5kA/4s，爬电比距20mm/kV，防护等级IP4X。\n\n柜内真空断路器CV1-12。主变进线柜额定电流2000A，开断电流31.5kA；出线柜、电容器柜、接地变柜额定电流1250A，开断电流25kA。\n\n柜内电流互感器采用户内环氧树脂浇注式电流互感器。主变进线CT型号LZZBJ9-10E3 2000/5A 5P30/5P30/5P30/0.5/0.2S 30/30/30/30/30VA。出线回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。电容器回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。消谐回路LZZBJ9-10C5 600/5A 5P30/0.5/0.2S 30/30/30VA。\n\n10kV开关柜内电压互感器选用户内多绕组环氧树脂浇注式电压互感器。10kV母设柜PT为JDZX9-10G2 ///kV  0.2/0.5（3P）/3P 30/50/100VA。\n\n10kV柜内避雷器选用复合外套金属氧化物避雷器，型号HY5WZ-17/45，母设柜内避雷器附在线监测仪，其余避雷器附计数器。\n\n2）10kV电容器组厂家为靖江市普瑞电力科技有限公司，户内框架式布置，电容器采用PRFC10-2400/400AK(5%)，额定电压：10kV，单台容量：400kvar，配串联电抗器：CKSC-120/10-5%。\n\n3）10kV滤波补偿成套装置厂家为靖江市普瑞电力科技有限公司，户内布置，1#滤波补偿成套装置(12000kvar)内包含：1#滤波支路(5次)容量为4800kvar，滤波支路(7次)容量为3600kvar，滤波支路(11次)容量为3600kvar。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '50',
            title:
              '检查计量用CT、PT绕组是否独立，二次回路是否专用，端子盒是否可铅封',
            origin: 'DL/T 448-2016',
            content:
              '检查计量用CT、PT绕组是否独立，二次回路是否专用，端子盒是否可铅封',
            violations: [
              {
                risk_level: 'high',
                suggestion: ['请检查文档格式或联系技术支持'],
                description: '审查过程中发生错误: SoftTimeLimitExceeded()',
                geometry_ref: {
                  chapter:
                    '第1册  YB11844S-D101  总的部分\n\n第2册  YB11844S-D102  110kV屋内配电装置\n\n第3册  YB11844S-D103  主变压器及各电压进出线安装\n\n第4册  YB11844S-D104  10kV屋内配电装置\n\n第5册  YB11844S-D105  10kV并联电容器组装置\n\n第6册  YB11844S-D106  10kV站用电装置\n\n第7册  YB11844S-D107  10kV滤波补偿装置\n\n第8册  YB11844S-D108  变电站电力电缆敷设\n\n第9册  YB11844S-D109  全站接地',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          },
          {
            id: '51',
            title: '短路电流审查',
            origin: 'GB/T 15544.1-2023',
            content: '短路电流审查',
            violations: [
              {
                risk_level: 'high',
                suggestion: ['检查设计说明中的计算参数是否正确'],
                description:
                  '高压侧母线计算值与设计说明差异过大：计算值0.13kA与设计值20.00kA差异99.4%',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              },
              {
                risk_level: 'high',
                suggestion: ['检查设计说明中的计算参数是否正确'],
                description:
                  '低压侧母线计算值与设计说明差异过大：计算值1.31kA与设计值10.00kA差异86.9%',
                geometry_ref: {
                  chapter:
                    '本工程在电缆沟、电缆隧道接口附近设置阻火墙，并用有机堵料封堵进入GIS室、开关柜及电容器电缆开孔，为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料。',
                  extents: null,
                  file_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b',
                  handles: null
                }
              }
            ]
          }
        ],
        category: '设计说明'
      },
      {
        code: 'EQUIP-COMP-001',
        name: '设备清册与主接线图一致性规范',
        type: '企业标准',
        articles: [
          {
            id: 'equipment_consistency',
            title: '设备一致性检查',
            origin: '设备材料清册应与电气主接线图保持一致',
            content:
              '设备清册与主接线图应在设备数量、规格参数、设备存在性上一致',
            violations: []
          }
        ],
        category: '设备一致性审查'
      }
    ],
    discipline_id: 'bd3f9e35-6875-4a16-80c2-7a1452243a3b'
  }
})

const isDark = useDark({
  selector: viewerRoot,
  attribute: 'class',
  valueDark: 'ml-theme-dark',
  valueLight: 'ml-theme-light'
})

const toggleDark = useToggle(isDark)

/**
 * 解码文件名中的URL编码和HTML实体编码
 * @param fileName 可能包含编码的文件名
 * @returns 解码后的文件名
 */
const decodeFileName = (fileName: string): string => {
  if (!fileName) return ''

  try {
    // 第一步：解码HTML实体（如 &#x7535;）
    const txt = document.createElement('textarea')
    txt.innerHTML = fileName
    let decoded = txt.value

    // 第二步：解码URL编码（如 %E7%94%B5）
    // 尝试解码，如果失败则返回原字符串
    try {
      decoded = decodeURIComponent(decoded)
    } catch (e) {
      // 如果decodeURIComponent失败，说明不是URL编码，保留原值
    }

    return decoded
  } catch (error) {
    console.warn('文件名解码失败:', error)
    return fileName
  }
}

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
    const options: AcDbOpenDatabaseOptions = {}

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

// 计算各风险等级的违规项数
const riskCounts = computed(() => {
  const counts = { high: 0, medium: 0, low: 0 }
  reportData.value.rules.forEach((rule: any) => {
    rule.articles.forEach((article: any) => {
      ;[article.violations[0] || []].forEach((violation: any) => {
        if (violation.risk_level === 'high') counts.high++
        else if (violation.risk_level === 'medium') counts.medium++
        else if (violation.risk_level === 'low') counts.low++
      })
    })
  })
  return counts
})

// 计算总违规项数
const totalViolations = computed(() => {
  let count = 0
  reportData.value.rules.forEach((rule: any) => {
    rule.articles.forEach(() => {
      count += 1
    })
  })
  return count
})

// 扁平化的违规项列表（用于表格展示）- 修改：只显示每个 article 的第一条 violation
const flattenedViolations = computed(() => {
  const violations: any[] = []
  reportData.value.rules.forEach((rule: any) => {
    rule.articles.forEach((article: any) => {
      if (article.violations && article.violations.length > 0) {
        // 只取第一个 violation 用于表格显示，但保留所有 violations 用于详情
        const firstViolation = article.violations[0]
        violations.push({
          ...firstViolation,
          ruleName: rule.name,
          ruleCode: rule.code,
          articleId: article.id,
          articleTitle: article.title,
          category: rule.category?.slice(0, 4),
          allViolations: article.violations, // 保存所有 violations 用于详情弹窗
          origin: article.origin
        })
      } else {
        // 处理没有 violations 的情况（risk_level 为 0）
        violations.push({
          ruleName: rule.name,
          ruleCode: rule.code,
          articleId: article.id,
          articleTitle: article.title,
          category: rule.category?.slice(0, 4),
          risk_level: 0,
          allViolations: [],// 空数组
          origin: article.origin
        })
      }
    })
  })
  return violations
})

// 排序后的违规项列表（重大 > 一般 > 轻微）
const sortedViolations = computed(() => {
  const riskOrder = { high: 3, medium: 2, low: 1, 0: 0 }
  return flattenedViolations.value
    .filter(violation => {
      if (filterRisk.value === null) return true
      return violation.risk_level === filterRisk.value
    })
    .sort((a, b) => {
      return (
        riskOrder[b.risk_level as keyof typeof riskOrder] -
        riskOrder[a.risk_level as keyof typeof riskOrder]
      )
    })
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

    // 获取canvas元素
    const canvas = canvasRef.value

    // 修正鼠标事件的函数
    const fixMouseCoordinates = (event: MouseEvent) => {
      // 获取canvas相对于视口的精确位置
      const rect = canvas.getBoundingClientRect()

      // 创建一个新事件，替换clientX/clientY为相对于canvas的坐标
      // 这会影响eventBus和内部鼠标位置计算
      Object.defineProperty(event, 'clientX', {
        value: event.clientX - rect.left,
        writable: false
      })
      Object.defineProperty(event, 'clientY', {
        value: event.clientY - rect.top,
        writable: false
      })

      // 同时修正pageX/pageY（某些CAD操作可能使用）
      Object.defineProperty(event, 'pageX', {
        value: event.pageX - rect.left,
        writable: false
      })
      Object.defineProperty(event, 'pageY', {
        value: event.pageY - rect.top,
        writable: false
      })

      return event
    }

    // 拦截所有鼠标事件（捕获阶段）
    const eventsToIntercept = [
      'mousedown',
      'mousemove',
      'mouseup',
      'click',
      'dblclick',
      'wheel',
      'contextmenu'
    ]

    eventsToIntercept.forEach(eventType => {
      canvas.addEventListener(
        eventType,
        (e: Event) => {
          // 只处理鼠标事件
          if (e instanceof MouseEvent) {
            fixMouseCoordinates(e)
          }
        },
        { capture: true, passive: false }
      )
    })

    // 强制首次更新尺寸和偏移
    nextTick(() => {
      if (AcApDocManager.instance.curView) {
        AcApDocManager.instance.curView.updateSize()
      }
    })
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

  // 清理Word预览状态
  wordPreviewUrl.value = ''
  highlightText.value = ''
  currentLocateInfo.value = {}
  // ✅ 清除高亮
  clearAllHighlights()
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
  console.log('找不到字体', params)
  const message = t('main.message.fontsNotFound', {
    fonts: params.fonts.join(', ')
  })
  warning(t('main.notification.title.fontsNotFound', message))
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
  if (fileType.value == 'cad') {
    const view = AcApDocManager.instance.curView as any
    view.updateSize()
  }
  isPanelCollapsed.value = !isPanelCollapsed.value
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
      return '重大问题'
    case 'medium':
      return '一般问题'
    case 'low':
      return '轻微问题'
    default:
      return level
  }
}

// 修改 locateInDrawing 函数
const locateInDrawing = (geometry: any) => {
  try {
    if (!geometry?.extents) {
      ElMessage.warning('无法获取几何信息')
      return
    }

    console.log('开始定位，准备清除之前的高亮...')

    // ✅ 清除所有高亮（关键步骤）
    clearAllHighlights()

    // 提取坐标范围
    const { min_point, max_point } = geometry.extents
    const box = new AcGeBox2d(
      { x: min_point.x, y: min_point.y },
      { x: max_point.x, y: max_point.y }
    )

    // 高亮新实体
    if (geometry.handles && geometry.handles.length > 0) {
      highlightEntitiesByHandles(geometry.handles)
    }

    // 定位到违规区域
    const view = AcApDocManager.instance.curView
    view.zoomTo(box, 0.5)

    ElMessage.success({
      message: `已定位到违规区域 (${min_point.x.toFixed(2)}, ${min_point.y.toFixed(2)})`,
      duration: 2000
    })
  } catch (error) {
    console.error('定位失败:', error)
    ElMessage.error('定位失败，请稍后重试')
  }
}

// 修改 highlightEntitiesByHandles 函数，增加ID记录
const highlightEntitiesByHandles = (handles: string[]) => {
  try {
    const docManager = AcApDocManager.instance
    const view = docManager.curView
    const ids: string[] = []

    handles.forEach(handle => {
      const num = parseInt(handle, 16).toString(10)
      ids.push(num)
    })

    // 高亮新实体
    view.highlight(ids)

    // ✅ 记录到我们的维护列表中（支持多次高亮）
    highlightedIds.value = [...highlightedIds.value, ...ids]

    console.log('高亮ids:', ids, '当前维护列表:', highlightedIds.value)
  } catch (error) {
    console.error('高亮实体失败:', error)
  }
}

/**
 * 清除所有高亮（包括点击高亮和程序高亮）
 */
const clearAllHighlights = () => {
  try {
    const view = AcApDocManager.instance.curView

    // 1. 获取点击高亮的ID（来自 selectionSet）
    const clickedIds = view.selectionSet?.ids || []

    // 2. 合并所有高亮ID（去重）
    const allHighlightedIds = [
      ...new Set([...clickedIds, ...highlightedIds.value])
    ]

    if (allHighlightedIds.length > 0) {
      view.unhighlight(allHighlightedIds)
      console.log(`已清除 ${allHighlightedIds.length} 个高亮实体`, {
        点击高亮: clickedIds,
        程序高亮: highlightedIds.value
      })
    }

    // 3. 清空我们维护的列表
    highlightedIds.value = []

    // 4. 清空选择集（如果API支持）
    // if (view.selectionSet && view.clearSelection) {
    //   view.clearSelection()
    // }
  } catch (error) {
    console.error('清除高亮失败:', error)
  }
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

// 在响应式变量部分添加
const showViolationDetail = ref(false)
const selectedViolation = ref<any>(null)
const showPassedDetail = ref(false)

// 修改行点击处理函数
const handleRowClick = (row: any) => {
  selectedViolation.value = row

  // 更新定位信息
  if (row.violation_id !== currentLocateInfo.value.rowId) {
    currentLocateInfo.value = {}
  }

  if (row.risk_level === 0) {
    showPassedDetail.value = true
  } else {
    showViolationDetail.value = true
  }
}
// 根据articleId获取条文内容
const getArticleContent = (articleId: string) => {
  for (const rule of reportData.value.rules) {
    for (const article of rule.articles) {
      if (article.id === articleId) {
        return article
      }
    }
  }
  return null
}

// 分页相关状态
const currentPage = ref(1)
const pageSize = ref(20)
// 分页数据
const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedViolations.value.slice(start, end)
})

// 监听筛选变化，重置页码
watch(filterRisk, () => {
  currentPage.value = 1
})

// 格式化描述文本 - 修复重复渲染问题
const formatDescription = (description: string): string => {
  return description
  if (!description || typeof description !== 'string') return ''

  try {
    // 匹配数字条目：数字+点/顿号+内容+分号/句号
    const regex = /(\d+)[.、]\s*([^；。]+?)(?:；|。|$)/g
    const matches = [...description.matchAll(regex)]

    // 无匹配项时返回原文
    if (matches.length === 0) {
      return `<div class="description-text">${description}</div>`
    }

    let formatted = ''

    // 1. 添加前缀文本（第一个匹配项之前的内容）
    const firstMatchIndex = matches[0].index!
    if (firstMatchIndex > 0) {
      const prefixText = description.substring(0, firstMatchIndex).trim()
      if (prefixText) {
        formatted += `<div class="description-text prefix">${prefixText}</div>`
      }
    }

    // 2. 逐个处理匹配项，格式化为条目
    matches.forEach(match => {
      const num = match[1]
      const content = match[2]
      const separator = match[0].endsWith('；') ? '；' : '。'

      formatted +=
        `<div class="description-item" style="text-indent: 2em;">` +
        `<span class="item-number">${num}.</span>` +
        `<span class="item-content">${content}${separator}</span>` +
        `</div>`
    })

    // 3. 添加后缀文本（最后一个匹配项之后的内容）
    const lastMatch = matches[matches.length - 1]
    const lastIndex = lastMatch.index! + lastMatch[0].length
    if (lastIndex < description.length) {
      const suffixText = description.substring(lastIndex).trim()
      if (suffixText) {
        formatted += `<div class="description-text suffix">${suffixText}</div>`
      }
    }

    return formatted
  } catch (error) {
    console.error('格式化描述失败:', error)
    return `<div class="description-text">${description}</div>`
  }
}

// 获取风险等级对应的图标组件
const getRiskIcon = (level: string) => {
  switch (level) {
    case 'high':
      return WarnTriangleFilled
    case 'medium':
      return WarningFilled
    case 'low':
      return InfoFilled
    default:
      return WarningFilled
  }
}

// 获取风险等级对应的颜色
const getRiskColor = (level: string) => {
  switch (level) {
    case 'high':
      return 'var(--color-danger)'
    case 'medium':
      return 'var(--color-warning)'
    case 'low':
      return 'var(--color-success)'
    default:
      return 'var(--color-gray-500)'
  }
}

// 表格选择状态
const selection = ref<any[]>([])

// 处理表格选择变化
const handleSelectionChange = (val: any[]) => {
  selection.value = val
}

// 完整的 exportReport 函数
// 添加格式化函数
const formatTextForExcel = (text: string | string[]): string => {
  if (!text) return ''

  // 如果是数组（处理建议）
  if (Array.isArray(text)) {
    return text.map((item, index) => `${index + 1}. ${item}`).join('\n')
  }

  // 如果是字符串（问题描述）
  if (typeof text === 'string') {
    // 匹配数字条目：数字+点/顿号+内容+分号/句号
    const regex = /(\d+)[.、]\s*([^；。]+?)(?:；|。|$)/g
    const matches = [...text.matchAll(regex)]

    if (matches.length > 0) {
      let formatted = ''

      // 添加前缀文本
      const firstMatchIndex = matches[0].index!
      if (firstMatchIndex > 0) {
        const prefixText = text.substring(0, firstMatchIndex).trim()
        if (prefixText) formatted += `${prefixText}\n\n`
      }

      // 格式化数字条目
      matches.forEach(match => {
        const num = match[1]
        const content = match[2]
        const separator = match[0].endsWith('；') ? '；' : '。'
        formatted += `${num}. ${content}${separator}\n`
      })

      return formatted.trim()
    }
  }

  return String(text)
}
// 修改 exportReport 函数
const exportReport = async () => {
  // 获取原始数据（已筛选排序）
  const rawData =
    selection.value.length > 0 ? selection.value : sortedViolations.value

  if (rawData.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  // 按 articleId 分组，合并数据
  const groupedData = rawData.reduce(
    (acc, item) => {
      const key = item.articleId
      if (!acc[key]) {
        // 首次遇到该 articleId，初始化
        acc[key] = {
          ...item, // 保留基本信息
          allViolations: [] // 初始化违规数组
        }
      }
      // 合并所有 violations
      if (item.allViolations && item.allViolations.length > 0) {
        acc[key].allViolations.push(...item.allViolations)
      }
      return acc
    },
    {} as Record<string, any>
  )

  // 将分组对象转换为数组，并合并描述和建议
  const dataToExport = Object.values(groupedData).map((group: any) => {
    // 合并所有问题描述
    const descriptions = group.allViolations
      .filter((v: any) => v.description)
      .map((v: any, index: number) => `${index + 1}. ${v.description}`)

    // 合并所有处理建议
    const suggestions: string[] = []
    group.allViolations.forEach((v: any, vIndex: number) => {
      if (v.suggestion && v.suggestion.length > 0) {
        suggestions.push(`${vIndex + 1}. ${v.suggestion.join(' ')}`)
      }
    })
    return {
      risk_level: group.risk_level,
      category: group.category,
      articleTitle: group.articleTitle,
      description: descriptions.join('\n') || '审查已通过',
      suggestion: suggestions.join('\n') || '无',
      ruleName: group.ruleName,
      ruleCode: group.ruleCode,
      articleId: group.articleId,
      origin: group.origin
    }
  })

  try {
    // 显示加载状态
    const loading = ElMessage({
      message: '正在生成报告...',
      type: 'info',
      duration: 0
    })

    // 创建工作簿
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'AI审图系统'
    workbook.lastModifiedBy = 'AI审图系统'
    workbook.created = new Date()
    workbook.modified = new Date()

    // ===== 定义样式 =====
    const createBorders = (isHeader = false) => ({
      top: {
        style: 'thin',
        color: { argb: isHeader ? 'FF000000' : 'FFD9D9D9' }
      },
      left: {
        style: 'thin',
        color: { argb: isHeader ? 'FF000000' : 'FFD9D9D9' }
      },
      bottom: {
        style: 'thin',
        color: { argb: isHeader ? 'FF000000' : 'FFD9D9D9' }
      },
      right: {
        style: 'thin',
        color: { argb: isHeader ? 'FF000000' : 'FFD9D9D9' }
      }
    })

    const cellStyle = {
      font: { size: 10, name: 'Microsoft YaHei' },
      alignment: {
        vertical: 'middle',
        horizontal: 'left',
        wrapText: true,
        shrinkToFit: false
      },
      border: createBorders(false)
    }

    const centerCellStyle = {
      ...cellStyle,
      alignment: { ...cellStyle.alignment, horizontal: 'center' }
    }

    const stripeStyle = {
      ...cellStyle,
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }
    }
    const stripeCenterStyle = {
      ...centerCellStyle,
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }
    }

    const headerStyle = {
      font: {
        bold: true,
        size: 11,
        color: { argb: 'FFFFFFFF' },
        name: 'Microsoft YaHei'
      },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2C3E50' }
      },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      border: createBorders(true)
    }

    // ===== 创建主工作表 =====
    const mainSheet = workbook.addWorksheet(
      `${projectName.value || '项目'}_审查报告`,
      {
        views: [{ showGridLines: true }]
      }
    )

    mainSheet.columns = [
      { header: '序号', key: 'index', width: 8 },
      { header: '风险等级', key: 'riskLevel', width: 15 },
      { header: '问题来源', key: 'category', width: 15 },
      { header: '审查内容', key: 'articleTitle', width: 40 },
      { header: '问题描述', key: 'description', width: 50 },
      { header: '处理建议', key: 'suggestion', width: 60 },
      { header: '相关规范', key: 'origin', width: 12 }
    ]

    // 添加数据
    dataToExport.forEach((item, index) => {
      const row = mainSheet.addRow({
        index: index + 1,
        riskLevel: getRiskText(item.risk_level),
        category: item.category,
        articleTitle: item.articleTitle,
        description: item.description,
        suggestion: item.suggestion,
        origin: item.origin
      })

      // 应用样式
      const isEvenRow = mainSheet.rowCount % 2 === 0
      const needCenterCols = [1, 2, 3, 7]

      row.eachCell((cell: any, colNumber: number) => {
        cell.style = isEvenRow
          ? needCenterCols.includes(colNumber)
            ? stripeCenterStyle
            : stripeStyle
          : needCenterCols.includes(colNumber)
            ? centerCellStyle
            : cellStyle
      })

      // 动态调整行高
      const descLines = (item.description.match(/\n/g) || []).length + 1
      const sugLines = (item.suggestion.match(/\n/g) || []).length + 1
      const maxLines = Math.max(descLines, sugLines)
      row.height = Math.max(18, Math.min(maxLines * 14, 80)) // 限制最大高度
    })

    // 设置表头样式
    mainSheet.getRow(1).eachCell((cell: any) => {
      cell.style = headerStyle
    })
    mainSheet.getRow(1).height = 25

    // ===== 按风险等级创建分表 =====
    const riskLevels = [
      { level: 'high', name: '重大问题', color: 'FFDC3545' },
      { level: 'medium', name: '一般问题', color: 'FFD17706' },
      { level: 'low', name: '轻微问题', color: 'FF28A745' }
    ]

    for (const { level, name, color } of riskLevels) {
      const levelData = dataToExport.filter(item => item.risk_level === level)

      if (levelData.length > 0) {
        const levelSheet = workbook.addWorksheet(
          `${projectName.value || '项目'}_${name}`,
          {
            views: [{ showGridLines: true }]
          }
        )

        levelSheet.columns = mainSheet.columns

        levelData.forEach((item, index) => {
          const row = levelSheet.addRow({
            index: index + 1,
            riskLevel: getRiskText(item.risk_level),
            category: item.category,
            articleTitle: item.articleTitle,
            description: item.description,
            suggestion: item.suggestion,
            origin: item.origin
          })

          const isEvenRow = levelSheet.rowCount % 2 === 0
          const needCenterCols = [1, 2, 3, 7]

          row.eachCell((cell: any, colNumber: number) => {
            cell.style = isEvenRow
              ? needCenterCols.includes(colNumber)
                ? stripeCenterStyle
                : stripeStyle
              : needCenterCols.includes(colNumber)
                ? centerCellStyle
                : cellStyle
          })

          const descLines = (item.description.match(/\n/g) || []).length + 1
          const sugLines = (item.suggestion.match(/\n/g) || []).length + 1
          const maxLines = Math.max(descLines, sugLines)
          row.height = Math.max(18, Math.min(maxLines * 14, 80))
        })

        // 设置带颜色的表头
        levelSheet.getRow(1).eachCell((cell: any) => {
          cell.style = {
            ...headerStyle,
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: color }
            }
          }
        })
        levelSheet.getRow(1).height = 25
      }
    }

    // ===== 导出文件 =====
    const timestamp = new Date()
      .toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      .replace(/[/:]/g, '-')

    const fileName = `${projectName.value || '项目'}_审查报告_${timestamp}.xlsx`
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    link.click()
    URL.revokeObjectURL(link.href)

    loading.close()
    ElMessage.success({ message: `报告已导出：${fileName}`, duration: 3000 })
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请稍后重试')
  }
}
// 导出前确认
const handleExport = () => {
  if (selection.value.length > 0) {
    ElMessageBox.confirm(
      `当前已选中 ${selection.value.length} 条记录，是否只导出选中的记录？`,
      '导出确认',
      {
        confirmButtonText: '导出选中项',
        cancelButtonText: '导出全部',
        type: 'info',
        distinguishCancelAndClose: true
      }
    )
      .then(() => {
        exportReport()
      })
      .catch(action => {
        if (action === 'cancel') {
          selection.value = [] // 清空选择
          exportReport()
        }
      })
  } else {
    exportReport()
  }
}
type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

const getFileCategoryTagType = (category: string): TagType => {
  const map: Record<string, TagType> = {
    设计说明: 'primary',
    设计图纸: 'danger'
  }
  return map[category] || 'info'
}
const goBack = () => {
  window.history.back()
}

// 判断是否有有效的建议
const hasSuggestions = computed(() => {
  if (!selectedViolation.value?.allViolations) return false

  return selectedViolation.value.allViolations.some(
    (violation: any) => violation.suggestion && violation.suggestion.length > 0
  )
})
</script>

<style scoped lang="scss">
/* 主包装器，使用flex布局 */
.ml-cad-viewer-wrapper {
  width: 100%;
  height: 100%;
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
  overflow: hidden; /* 防止内容溢出 */
}

/* CAD区域 - 占据整个容器 */
.cad-area {
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
  box-sizing: border-box;
  padding: 0 6px;
  width: 50%;
  background: #ffffff;
  border-left: 1px solid #e8e8e8;
  display: flex;
  transition: all 0.3s ease;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
  flex-shrink: 0; /* 防止侧边栏被压缩 */
  position: relative;
}

.regulation-panel.collapsed {
  width: 0;
  border-left: none;
  overflow: visible; /* 确保按钮可见 */
}

/* 折叠按钮 - 改为小图标按钮 */
.panel-toggle-btn {
  position: absolute;
  left: -18px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 101;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  background-color: #ffffff;
  border: 1px solid #e8e8e8;
  transition: all 0.3s ease;
}

.panel-toggle-btn:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transform: translateY(-50%) scale(1.1);
}

/* 当侧边栏收起时，调整按钮位置 */
.panel-toggle-btn.collapsed {
  left: -12px; /* 当侧边栏收起时，按钮显示在CAD区域右侧 */
  top: 50%;
  transform: translateY(-50%) rotate(180deg); /* 旋转图标方向 */
}
/* 侧边栏内容 */
.panel-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  width: 100%;

  .el-table {
    --el-table-header-bg-color: #eceef2;
    :deep(.el-table__cell) {
      padding: 6px 0;
    }
    :deep(th.el-table__cell) {
      color: rgb(52, 73, 94);
      font-weight: 700;
      font-size: 13px;
      border-bottom: 1px solid var(--color-gray-200);
      // font-family: Arial, 'Microsoft YaHei', sans-serif;
    }
    /* 缩小操作栏内边距，保持按钮在一行 */
    :deep(td:last-child .cell) {
      padding: 0 4px !important; /* 减小单元格内边距 */
      display: flex;
      justify-content: center;
      gap: 0px; /* 按钮间距 */
    }
  }
  /* ---------- 表格内边框 ---------- */
  :deep(.el-table) {
    border-right: 1px solid #e8e8e8;
    border-bottom: 1px solid #e8e8e8;
    font-size: 13px;
  }

  /* 表头、表体、表尾统一加右边框与下边框 */
  :deep(.el-table th.el-table__cell),
  :deep(.el-table td.el-table__cell) {
    border-right: 1px solid #e8e8e8;
    border-bottom: 1px solid #e8e8e8;
  }

  /* 去掉最右侧一列的右边框，防止重复 */
  :deep(.el-table th:last-child),
  :deep(.el-table td:last-child) {
    border-right: none;
  }
}

/* 标题区域 */
.panel-header {
  padding: 12px 10px;
  background: #fafafa;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #262626;
}

// 操作按钮
.panel-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 10px;
}

/* 违规项表格 */
.violation-table {
  flex: 1;
  overflow: hidden;
  padding: 0;
  box-sizing: border-box;
  padding-top: 10px;
  display: flex;
  flex-direction: column;
}

:deep(.el-table) {
  flex: 1;
}

:deep(.el-table__body-wrapper) {
  overflow-y: auto;
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
  color: var(--color-primary);
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
  font-size: 14px;
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

/* Tabs区域 */
.panel-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

:deep(.el-tabs) {
  flex: 1;
  display: flex;
  flex-direction: column;
}
:deep(.el-tabs__header) {
  margin-bottom: 0;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

:deep(.el-tab-pane) {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 违规详情对话框样式 */
/* 弹窗整体容器 */
:global(.violation-detail-dialog-wrapper) {
  max-height: 85vh !important;
  display: flex !important;
  flex-direction: column !important;
  margin-top: 5vh !important; /* 使弹窗垂直居中 */
  padding-bottom: 10px;
}

/* 弹窗主体内容区域 - 关键：设置可滚动 */
:global(.violation-detail-dialog-wrapper .el-dialog__body) {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;
  max-height: calc(85vh - 120px); /* 减去header和footer的高度 */
}
.violation-detail-dialog {
  max-height: none; /* 移除之前的限制 */
  overflow: visible; /* 改为由dialog body控制滚动 */
}
.violation-detail-dialog::-webkit-scrollbar {
  width: 6px;
}

.violation-detail-dialog::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.violation-detail-dialog::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}

.detail-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #f0f0f0;
}

.detail-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: bold;
  color: #262626;
}

.detail-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  line-height: 1.5;
  .el-tag--warning.el-tag--dark {
    background-color: var(--color-warning);
  }
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-weight: bold;
  color: #595959;
  margin-right: 12px;
  flex-shrink: 0;
}

.detail-content {
  line-height: 1.6;
  color: #595959;
  text-align: justify;
  font-size: 14px;
}

.detail-content.suggestion {
  color: var(--color-primary-dark);
  padding: 12px;
  border-radius: 4px;
  border-left: 3px solid var(--color-primary-dark);
}

.geometry-info {
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
}

.coordinate {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.coordinate:last-child {
  margin-bottom: 0;
}

.coordinate-label {
  width: 80px;
  font-weight: 500;
  color: #595959;
  margin-right: 12px;
  flex-shrink: 0;
}

.coordinate-value {
  font-family: monospace;
  color: #8c8c8c;
}

.related-article {
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
  border-left: 2px solid var(--color-success-dark);
}

.article-title {
  font-weight: 500;
  color: #262626;
  margin-bottom: 8px;
}

.article-content {
  font-size: 14px;
  color: #595959;
  line-height: 1.5;
}

/* 建议列表样式 */
.suggestion-item {
  // font-size: 12px;
  line-height: 1.4;
  margin-top: 2px;
}

/* 规范详情中的建议列表 */
.suggestion-list {
  margin: 8px 0;
  padding-left: 20px;
}

.suggestion-list li {
  font-size: 13px;
  color: var(--color-primary);
  line-height: 1.5;
  margin-bottom: 4px;
}

.suggestion-title {
  font-weight: 500;
  color: var(--color-primary);
}

/* 详情对话框中的有序列表 */
.suggestion-ol {
  margin: 0;
  padding-left: 20px;
}

.suggestion-ol li {
  margin-bottom: 8px;
  line-height: 1.6;
  font-size: 14px;
}
.suggestion-ol li > strong {
  display: block;
  margin-bottom: 6px;
  color: var(--color-primary-dark);
}

/* 新增预览相关样式 */
.preview-area {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: white;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #f5f5f5;
}

.preview-toolbar {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-info {
  padding: 0 12px;
  font-size: 14px;
  color: #606266;
}

.preview-hint {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #909399;
  background: rgba(255, 255, 255, 0.8);
  padding: 4px 12px;
  border-radius: 12px;
}

.unsupported {
  display: flex;
  align-items: center;
  justify-content: center;
}

// 筛选标签容器
.violation-filters {
  padding: 12px 0;
  background: var(--color-white);
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--color-gray-200);

  // 筛选标签项 - 基础样式
  .filter-item {
    height: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--color-gray-100);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: var(--transition-normal);
    font-size: 14px;
    color: var(--color-gray-700);
    gap: 6px;
    white-space: nowrap;
    border: 1px solid transparent;
    padding: 0 12px;
    user-select: none;

    // 悬停效果
    &:hover {
      background: var(--color-gray-200);
      color: var(--color-gray-900);
      border-color: var(--color-primary-light);
      transform: translateY(-1px);
      box-shadow: var(--shadow-xs);
    }

    // 激活状态 - 通用样式
    &.active {
      color: var(--color-white) !important;
      font-weight: 500;
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);

      .filter-count {
        background: rgba(255, 255, 255, 0.2);
      }
    }

    // 按位置设置不同激活颜色
    &:nth-child(1) {
      .el-icon {
        color: var(--color-gray-400);
      }
      &.active {
        background: var(--color-gray-400);
        border-color: var(--color-gray-400);
        .el-icon {
          color: var(--color-white);
        }
      }
    }

    &:nth-child(2) {
      .el-icon {
        color: var(--color-danger);
      }
      &.active {
        background: var(--color-danger);
        border-color: var(--color-danger-dark);
        .el-icon {
          color: var(--color-white);
        }
      }
    }

    &:nth-child(3) {
      .el-icon {
        color: var(--color-warning);
      }
      &.active {
        background: var(--color-warning);
        border-color: var(--color-warning-dark);
        .el-icon {
          color: var(--color-white);
        }
      }
    }

    &:nth-child(4) {
      .el-icon {
        color: var(--color-success);
      }
      &.active {
        background: var(--color-success);
        border-color: var(--color-success-dark);
        .el-icon {
          color: var(--color-white);
        }
      }
    }

    // 图标样式
    .el-icon {
      font-size: 18px;
    }
  }
}
/* 数量徽章样式 */
.filter-count {
  background: rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  padding: 1px 4px;
  min-width: 18px;
  text-align: center;
  margin-left: 4px;
  margin-top: 2px;
}

// 问题描述内容样式 - 修复版
.description-content {
  text-indent: 2em;
  // 数字条目 - 使用flex布局确保对齐
  .description-item {
    display: flex;
    margin-bottom: 8px;
    line-height: 1.6;

    // 数字部分（固定宽度，右对齐）
    .item-number {
      flex-shrink: 0;
      text-align: right;
      padding-right: 8px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    // 内容部分（自动填充剩余空间）
    .item-content {
      text-indent: 0;
      flex: 1;
      padding-left: 0; // 取消内容缩进
    }

    &:first-child {
      margin-top: 8px;
    }

    &:last-child {
      margin-bottom: 12px;
    }
  }

  // 普通文本段落 - 使用padding-left模拟缩进
  .description-text {
    padding-left: 36px; // 与条目内容左对齐（28px数字宽+8px间距）
    margin: 8px 0;
    line-height: 1.6;

    &.prefix {
      margin-top: 0;
      margin-bottom: 12px;
    }

    &.suffix {
      margin-top: 12px;
      margin-bottom: 0;
    }
  }
}

.el-tag {
  width: 60px;
  padding: 10px 0px;
  font-size: 11px;
  font-weight: 600;
  &.el-tag--light {
    &.el-tag--danger {
      color: var(--color-danger-dark);
      border-color: var(--color-danger-dark);
    }
    &.el-tag--primary {
      border-color: var(--color-primary-dark);
      color: var(--color-primary-dark);
    }
    &.el-tag--warning {
      border-color: var(--color-warning);
      color: var(--color-warning);
    }
  }
}

/* 新增：详情中多个 violation 的分组样式 */
.violation-detail-group {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--color-gray-200);

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }
}

/* 调整 h4 样式 */
.violation-detail-group h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: bold;
  color: #262626;
  background: var(--color-gray-100);
  padding: 8px 12px;
  border-radius: 4px;
}
</style>
