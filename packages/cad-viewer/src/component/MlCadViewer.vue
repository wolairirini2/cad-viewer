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
                <span>全部问题</span>
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
                  label="违规问题"
                  min-width="200"
                  show-overflow-tooltip
                >
                  <template #default="{ row }">
                    <span
                      style="color: var(--color-primary-dark); font-weight: 700"
                      >{{ row.title || row.articleTitle }}</span
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

  <!-- 添加违规详情对话框 -->
  <el-dialog
    v-model="showViolationDetail"
    :title="'违规问题详情'"
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

      <!-- 详细描述 -->
      <div class="detail-section">
        <h4>问题描述</h4>
        <div
          class="detail-content description-content"
          v-html="formatDescription(selectedViolation.description)"
        ></div>
      </div>

      <!-- 修改建议 -->
      <div class="detail-section">
        <h4>修改建议</h4>
        <div
          v-if="
            Array.isArray(selectedViolation.suggestion) &&
            selectedViolation.suggestion.length > 0
          "
          class="detail-content suggestion"
        >
          <ol class="suggestion-ol">
            <li
              v-for="(item, index) in selectedViolation.suggestion"
              :key="index"
            >
              {{ item }}
            </li>
          </ol>
        </div>
        <div v-else class="detail-content suggestion">
          {{ selectedViolation.suggestion }}
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
            <!-- ✅ 新增：检查extents -->
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
            @click.stop="
              handleLocateClick(
                selectedViolation.geometry_ref,
                selectedViolation
              )
            "
            :disabled="
              !selectedViolation.geometry_ref?.extents &&
              selectedViolation.risk_level === 0
            "
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
              getArticleContent(selectedViolation.articleId)?.title ||
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
              getArticleContent(selectedViolation.articleId)?.title ||
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

  if (!geometry?.extents) {
    ElMessage.warning('无法获取几何信息')
    return
  }

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
      await new Promise(resolve => setTimeout(resolve, 2000))
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
        code: 'EQUIP-COMP-001',
        name: '设备清册与主接线图一致性规范',
        type: '企业标准',
        articles: [
          {
            id: 'equipment_consistency',
            title: '设备一致性检查',
            content:
              '设备清册与主接线图应在设备数量、规格参数、设备存在性上一致',
            violations: [
              {
                title: '数量不一致',
                risk_level: 'medium',
                suggestion: [
                  '请检查主接线图中电力变压器的标注数量',
                  '如清册数量正确，请在主接线图中删除3台'
                ],
                description:
                  "设备清册中'电力变压器'数量为2，主接线图中找到5处。",
                geometry_ref: {
                  chapter: null,
                  extents: {
                    max_point: {
                      x: -191263.8487640288,
                      y: -148261.9242404943
                    },
                    min_point: {
                      x: -192003.7783722929,
                      y: -148457.4648572067
                    }
                  },
                  file_id: 'd372aedb-6c37-460b-97fe-2e95a3bf099e',
                  handles: ['1010F5', '101102', '101104', '10111A', '1010BF']
                }
              },
              {
                title: '数量不一致',
                risk_level: 'medium',
                suggestion: [
                  '请检查主接线图中中性点隔离开关的标注数量',
                  '如清册数量正确，请在主接线图中删除16台'
                ],
                description:
                  "设备清册中'中性点隔离开关'数量为2，主接线图中找到18处。",
                geometry_ref: {
                  chapter: null,
                  extents: {
                    max_point: {
                      x: -191522.1778335525,
                      y: -147955.0857898176
                    },
                    min_point: {
                      x: -191976.574422797,
                      y: -148090.4402612335
                    }
                  },
                  file_id: 'd372aedb-6c37-460b-97fe-2e95a3bf099e',
                  handles: [
                    'FE7EE',
                    '1016DC',
                    'FE775',
                    '1016CC',
                    'FE9AF',
                    'FE9B9',
                    'FE76B',
                    '1016C3',
                    'FEC66',
                    'FEAEB',
                    'FED2B',
                    'FED51',
                    'FEC4E',
                    'FEDA2',
                    'FEC71',
                    'FEAF6',
                    'FED36',
                    'FED5C'
                  ]
                }
              },
              {
                title: '设备缺失',
                risk_level: 'medium',
                suggestion: [
                  '请在主接线图中补充放电间隙的标注',
                  '如该设备不在主接线图范围内，请在设备清册中说明'
                ],
                description:
                  "设备清册中有'放电间隙'（数量：2），但主接线图中未找到对应设备。",
                geometry_ref: {
                  chapter: null,
                  extents: null,
                  file_id: 'd372aedb-6c37-460b-97fe-2e95a3bf099e',
                  handles: null
                }
              },
              {
                title: '数量不一致',
                risk_level: 'medium',
                suggestion: [
                  '请检查主接线图中主变端子箱的标注数量',
                  '如清册数量正确，请在主接线图中删除3台'
                ],
                description:
                  "设备清册中'主变端子箱'数量为2，主接线图中找到5处。",
                geometry_ref: {
                  chapter: null,
                  extents: {
                    max_point: {
                      x: -191263.8487640288,
                      y: -148261.9242404943
                    },
                    min_point: {
                      x: -192003.7783722929,
                      y: -148457.4648572067
                    }
                  },
                  file_id: 'd372aedb-6c37-460b-97fe-2e95a3bf099e',
                  handles: ['1010F5', '101102', '101104', '10111A', '1010BF']
                }
              },
              {
                title: '设备缺失',
                risk_level: 'medium',
                suggestion: [
                  '请在主接线图中补充支柱绝缘子的标注',
                  '如该设备不在主接线图范围内，请在设备清册中说明'
                ],
                description:
                  "设备清册中有'支柱绝缘子'（数量：30），但主接线图中未找到对应设备。",
                geometry_ref: {
                  chapter: null,
                  extents: null,
                  file_id: 'd372aedb-6c37-460b-97fe-2e95a3bf099e',
                  handles: null
                }
              },
              {
                title: '设备缺失',
                risk_level: 'medium',
                suggestion: [
                  '请在主接线图中补充钢芯铝绞线的标注',
                  '如该设备不在主接线图范围内，请在设备清册中说明'
                ],
                description:
                  "设备清册中有'钢芯铝绞线'（数量：40），但主接线图中未找到对应设备。",
                geometry_ref: {
                  chapter: null,
                  extents: null,
                  file_id: 'd372aedb-6c37-460b-97fe-2e95a3bf099e',
                  handles: null
                }
              },
              {
                title: '设备缺失',
                risk_level: 'medium',
                suggestion: [
                  '请在主接线图中补充铜排的标注',
                  '如该设备不在主接线图范围内，请在设备清册中说明'
                ],
                description:
                  "设备清册中有'铜排'（数量：100），但主接线图中未找到对应设备。",
                geometry_ref: {
                  chapter: null,
                  extents: null,
                  file_id: 'd372aedb-6c37-460b-97fe-2e95a3bf099e',
                  handles: null
                }
              },
              {
                title: '设备缺失',
                risk_level: 'medium',
                suggestion: [
                  '请在主接线图中补充热缩套的标注',
                  '如该设备不在主接线图范围内，请在设备清册中说明'
                ],
                description:
                  "设备清册中有'热缩套'（数量：100），但主接线图中未找到对应设备。",
                geometry_ref: {
                  chapter: null,
                  extents: null,
                  file_id: 'd372aedb-6c37-460b-97fe-2e95a3bf099e',
                  handles: null
                }
              }
            ]
          }
        ],
        category: '设备一致性审查'
      }
    ],
    discipline_id: '27aaf0a9-a389-4ef8-96be-da843ed77fcd'
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
      article.violations.forEach((violation: any) => {
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
    rule.articles.forEach((article: any) => {
      count += article.violations.length
    })
  })
  return count
})

// 扁平化的违规项列表（用于表格展示）
const flattenedViolations = computed(() => {
  const violations: any[] = []
  reportData.value.rules.forEach((rule: any) => {
    rule.articles.forEach((article: any) => {
      article.violations.forEach((violation: any) => {
        violations.push({
          ...violation,
          ruleName: rule.name,
          ruleCode: rule.code,
          articleId: article.id,
          articleTitle: article.title,
          category: rule.category?.slice(0, 4) // 添加问题来源
        })
      })

      if (!article.violations.length) {
        violations.push({
          ruleName: rule.name,
          ruleCode: rule.code,
          articleId: article.id,
          articleTitle: article.title,
          category: rule.category?.slice(0, 4), // 添加问题来源
          risk_level: 0
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

// 修改行点击处理函数（替换原有的 handleRowClick）
const handleRowClick = (row: any) => {
  selectedViolation.value = row

  // 更新定位信息，但不清除，因为用户可能只是查看详情
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

const exportReport = async () => {
  const dataToExport =
    selection.value.length > 0 ? selection.value : sortedViolations.value

  if (dataToExport.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  try {
    // 显示加载状态
    const loading = ElMessage({
      message: '正在生成报告...',
      type: 'info',
      duration: 0
    })

    // 创建工作簿
    const workbook = new ExcelJS.Workbook()

    // 设置文档属性
    workbook.creator = 'AI审图系统'
    workbook.lastModifiedBy = 'AI审图系统'
    workbook.created = new Date()
    workbook.modified = new Date()

    // ===== 定义通用样式函数 =====
    const createExcelBorders = (isHeader = true) => {
      const color = isHeader ? 'FF000000' : 'FFD9D9D9'
      return {
        top: { style: 'thin', color: { argb: color } },
        left: { style: 'thin', color: { argb: color } },
        bottom: { style: 'thin', color: { argb: color } },
        right: { style: 'thin', color: { argb: color } }
      }
    }

    // 更新后的单元格样式（支持换行）
    const cellStyle = {
      font: { size: 10 },
      alignment: {
        vertical: 'middle',
        wrapText: true, // 关键：允许换行
        horizontal: 'left', // 左对齐
        shrinkToFit: false
      },
      border: createExcelBorders(false)
    }

    // 居中列样式
    const centerCellStyle = {
      ...cellStyle,
      alignment: {
        ...cellStyle.alignment,
        horizontal: 'center'
      }
    }

    // 条纹行样式（偶数行）
    const stripeRowStyle = {
      ...cellStyle,
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }
    }

    // 居中列的条纹样式
    const stripeCenterRowStyle = {
      ...centerCellStyle,
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }
    }

    // 表头样式
    const headerStyle = {
      font: {
        bold: true,
        size: 11,
        color: { argb: 'FFFFFFFF' },
        name: 'Microsoft YaHei' // 添加：微软雅黑字体
      },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2C3E50' }
      },
      alignment: {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
      },
      border: createExcelBorders(true)
    }

    // 定义表头
    const headers = [
      { header: '序号', key: 'index', width: 8 },
      { header: '风险等级', key: 'riskLevel', width: 18 },
      { header: '问题来源', key: 'category', width: 18 },
      { header: '违规问题', key: 'title', width: 40 },
      { header: '问题描述', key: 'description', width: 50 },
      { header: '处理建议', key: 'suggestion', width: 60 },
      { header: '相关规范', key: 'articleTitle', width: 30 }
    ]

    // ===== 创建主工作表（包含所有数据）=====
    const mainWorksheet = workbook.addWorksheet(
      `${projectName.value || '项目'}_全部问题`,
      {
        views: [{ showGridLines: true }]
      }
    )

    mainWorksheet.columns = headers

    // 添加主表数据（使用新的格式化函数）
    dataToExport.forEach((item, index) => {
      const rowData = {
        index: index + 1,
        riskLevel: getRiskText(item.risk_level),
        category: item.category,
        title: item.title,
        description: formatTextForExcel(item.description), // 格式化描述
        suggestion: formatTextForExcel(item.suggestion), // 格式化建议
        articleTitle: item.articleTitle || '',
        articleId: item.articleId || '',
        locationStatus: item.geometry_ref?.extents ? '可定位' : '无几何信息'
      }

      const row = mainWorksheet.addRow(rowData)

      // 应用样式
      const isEvenRow = mainWorksheet.rowCount % 2 === 0
      const needCenterCols = [1, 2, 3, 7, 8, 9]

      row.eachCell((cell: any, colNumber) => {
        if (isEvenRow) {
          cell.style = needCenterCols.includes(colNumber)
            ? stripeCenterRowStyle
            : stripeRowStyle
        } else {
          cell.style = needCenterCols.includes(colNumber)
            ? centerCellStyle
            : cellStyle
        }
      })

      // 动态设置行高（考虑换行）
      const descriptionLines =
        (rowData.description?.match(/\n/g) || []).length + 1
      const suggestionLines =
        (rowData.suggestion?.match(/\n/g) || []).length + 1
      const contentLength = Math.max(
        rowData.description?.length || 0,
        rowData.suggestion?.length || 0
      )

      let rowHeight = Math.max(18, descriptionLines * 14, suggestionLines * 14)
      if (contentLength > 200) {
        rowHeight = Math.max(rowHeight, 60)
      } else if (contentLength > 100) {
        rowHeight = Math.max(rowHeight, 22 + Math.floor(contentLength / 50) * 8)
      }

      row.height = rowHeight
    })

    // 应用表头样式
    mainWorksheet.getRow(1).eachCell((cell: any) => {
      cell.style = headerStyle
    })
    mainWorksheet.getRow(1).height = 25

    // ===== 按风险等级创建额外的工作表 =====
    const riskLevels = [
      { level: 'high', name: '重大问题', color: 'FFDC3545' },
      { level: 'medium', name: '一般问题', color: 'FFD17706' },
      { level: 'low', name: '轻微问题', color: 'FF28A745' }
    ]

    for (const { level, name, color } of riskLevels) {
      const levelData = dataToExport.filter(
        (item: any) => item.risk_level === level
      )

      if (levelData.length > 0) {
        const levelWorksheet = workbook.addWorksheet(
          `${projectName.value || '项目'}_${name}`,
          { views: [{ showGridLines: true }] }
        )

        levelWorksheet.columns = headers

        // 添加该等级的数据（同样使用格式化函数）
        levelData.forEach((item: any, index: number) => {
          const rowData = {
            index: index + 1,
            riskLevel: getRiskText(item.risk_level),
            category: item.category,
            title: item.title,
            description: formatTextForExcel(item.description),
            suggestion: formatTextForExcel(item.suggestion),
            articleTitle: item.articleTitle || '',
            articleId: item.articleId || '',
            locationStatus: item.geometry_ref?.extents ? '可定位' : '无几何信息'
          }

          const row = levelWorksheet.addRow(rowData)

          // 应用样式
          const isEvenRow = levelWorksheet.rowCount % 2 === 0
          const needCenterCols = [1, 2, 3, 7, 8, 9]

          row.eachCell((cell: any, colNumber) => {
            if (isEvenRow) {
              cell.style = needCenterCols.includes(colNumber)
                ? stripeCenterRowStyle
                : stripeRowStyle
            } else {
              cell.style = needCenterCols.includes(colNumber)
                ? centerCellStyle
                : cellStyle
            }
          })

          // 动态设置行高
          const descriptionLines =
            (rowData.description?.match(/\n/g) || []).length + 1
          const suggestionLines =
            (rowData.suggestion?.match(/\n/g) || []).length + 1
          const contentLength = Math.max(
            rowData.description?.length || 0,
            rowData.suggestion?.length || 0
          )

          let rowHeight = Math.max(
            18,
            descriptionLines * 14,
            suggestionLines * 14
          )
          if (contentLength > 200) {
            rowHeight = Math.max(rowHeight, 60)
          } else if (contentLength > 100) {
            rowHeight = Math.max(
              rowHeight,
              22 + Math.floor(contentLength / 50) * 8
            )
          }

          row.height = rowHeight
        })

        // 应用带颜色的表头样式
        levelWorksheet.getRow(1).eachCell((cell: any) => {
          const levelHeaderStyle = {
            ...headerStyle,
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: color }
            }
          }
          cell.style = levelHeaderStyle
        })
        levelWorksheet.getRow(1).height = 25
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

    ElMessage.success({
      message: `报告已导出：${fileName}`,
      duration: 3000
    })
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

// 批注列表
const annotations = ref<
  Array<{
    id: string
    position: { x: number; y: number } // 世界坐标
    text: string
    createdAt: number
  }>
>([])

// 当前正在编辑的批注
const editingAnnotation = ref<string | null>(null)
const annotationInputRef = ref<HTMLDivElement | null>(null)

// 临时批注位置（右键点击时的坐标）
const tempAnnotationPos = ref<{
  x: number
  y: number
  screenX: number
  screenY: number
} | null>(null)

/**
 * 将屏幕坐标转换为CAD世界坐标
 */
const screenToWorld = (screenX: number, screenY: number): { x: number; y: number } => {
  const view = AcApDocManager.instance.curView
  if (!view) return { x: 0, y: 0 }
  // 使用CAD查看器的坐标转换方法
  return view.screenToWorld(screenX, screenY)
}
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
  font-weight: bold;
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
      width: 28px; // 固定宽度，确保所有数字对齐
      text-align: right;
      padding-right: 8px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    // 内容部分（自动填充剩余空间）
    .item-content {
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
</style>
