<template>
  <div ref="viewerRoot" class="ml-cad-viewer-wrapper">
    <!-- 新增Flex容器，包裹CAD区域和侧边栏 -->
    <div class="content-container">
      <!-- 左侧，包含canvas和UI层 -->
      <div class="cad-container">
        <!-- 根据文件类型自动选择查看器 -->
        <template v-if="fileType">
          <!-- CAD文件 -->
          <div v-if="fileType === 'cad'" class="cad-area">
            <canvas
              v-if="currentFileId"
              ref="canvasRef"
              class="ml-cad-canvas"
            ></canvas>
            <el-empty v-else style="height: 100%; width: 100%" />
          </div>

          <!-- PDF文件 -->
          <div v-else-if="fileType === 'pdf'" class="preview-area">
            <div class="preview-toolbar">
              <el-button-group>
                <el-button size="small" @click="pdfPage > 1 && pdfPage--">
                  <el-icon><ArrowLeft /></el-icon>上一页
                </el-button>
                <span class="page-info">{{ pdfPage }} / {{ pdfPages }}</span>
                <el-button
                  size="small"
                  @click="pdfPage < pdfPages && pdfPage++"
                >
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

          <!-- 不支持的格式 -->
          <div v-else class="preview-area unsupported">
            <el-empty description="不支持的文件格式">
              <template #default>
                <el-button type="primary" @click="downloadFile">
                  下载文件
                </el-button>
              </template>
            </el-empty>
          </div>
        </template>

        <!-- 无文件 -->
        <el-empty
          v-else
          style="height: 100%; width: 100%"
          description="暂无文件"
        />

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
                      >{{ row.title }}</span
                    >
                  </template>
                </el-table-column>
                <el-table-column
                  prop="description"
                  label="问题描述"
                  min-width="150"
                  show-overflow-tooltip
                  align="center"
                />
                <el-table-column
                  prop="suggestion"
                  label="处理建议"
                  min-width="150"
                  show-overflow-tooltip
                  align="center"
                >
                </el-table-column>
                <el-table-column
                  label="操作"
                  width="100"
                  fixed="right"
                  align="center"
                >
                  <template #default="{ row }">
                    <el-button
                      v-if="row.geometry_ref?.file_id"
                      type="info"
                      size="small"
                      @click.stop="handleLocateClick(row.geometry_ref)"
                      :loading="locating[row.violation_id]"
                      :disabled="!row.geometry_ref?.extents"
                      plain
                    >
                      定位
                    </el-button>
                    <el-tooltip v-else content="无几何信息" placement="top">
                      <el-button size="small" disabled type="primary"
                        >定位</el-button
                      >
                    </el-tooltip>
                    <el-button
                      size="small"
                      style="margin-left: 4px"
                      type="info"
                      plain
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
        <el-button type="primary" @click="showViolationDetail = false"
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
  ElEmpty,
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

const projectName = computed(() => decodeURIComponent(props.projectName))

// PDF分页控制
const pdfPage = ref(1)
const pdfPages = ref(0)
// 文件类型判断
const fileType = computed(() => {
  if (!props.previewUrl && props.url) return 'cad'
  if (!props.previewUrl) return null

  const fileExt =
    (props.fileName || props.previewUrl)
      .toLowerCase()
      .split('.')
      .pop()
      ?.split('?')[0] || ''

  // PDF
  if (fileExt === 'pdf') return 'pdf'

  // Office文档
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExt)) {
    return 'office'
  }

  // 图片
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(fileExt)) {
    return 'image'
  }

  // 其他
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

// 下载不支持的文件
const downloadFile = () => {
  window.open(props.previewUrl, '_blank')
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

// 修改定位函数，添加file_id校验
const handleLocateClick = async (geometry: any) => {
  if (!geometry?.file_id) {
    ElMessage.warning('无法获取图纸信息')
    return
  }

  if (!geometry?.extents) {
    // ✅ 新增：检查extents是否为null
    ElMessage.warning('无法获取几何信息')
    return
  }

  try {
    // 设置加载状态
    if (geometry.violation_id) {
      locating.value[geometry.violation_id] = true
    }

    // 检查是否需要切换图纸
    if (props.currentFileId !== geometry.file_id) {
      ElMessage.info('正在切换图纸...')
      await emit('switchDrawing', geometry.file_id)

      // 等待图纸加载完成（简单延迟，实际可用事件监听）
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // 执行定位
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
            id: '1.4',
            title: '核查建所必要性及负荷审查',
            content: '核查建所必要性及负荷审查',
            violations: [
              {
                title: '核查建所必要性及负荷审查',
                risk_level: 'medium',
                suggestion: [
                  '补充详细的建所必要性论证报告，包括负荷预测、增长率分析、供电可靠性分析等。',
                  '提供负荷计算书，包括本期和远景负荷的计算过程和结果。'
                ],
                description:
                  '设计说明中仅提及“核查建所必要性及负荷审查”，但未提供任何核查结果或依据。这违反了规范条目1.4的要求，需要提供详细的必要性论证和负荷计算结果。',
                geometry_ref: {
                  extents: null,
                  file_id: 'c8f50371-a428-435f-a2d9-35d6048f1670',
                  handles: null
                }
              },
              {
                title: '110kV进线方式',
                risk_level: 'medium',
                suggestion: [
                  '提供延太730线的详细信息，包括其设计规范、运行经验、安全可靠性等。',
                  '提供电缆进线的详细设计，包括电缆的型号、规格、敷设方式、保护措施等。',
                  '提供与相关部门的协调和审批文件。'
                ],
                description:
                  '110kV进线采用电缆进线，T接110kV延太733线，未明确该延太733线是否符合规范要求，以及是否经过了必要的协调和审批。电缆进线需要考虑电缆的敷设条件、安全距离、防火保护等。',
                geometry_ref: {
                  extents: null,
                  file_id: 'c8f50371-a428-435f-a2d9-35d6048f1670',
                  handles: null
                }
              },
              {
                title: '110kV侧中性点接地方式',
                risk_level: 'medium',
                suggestion: [
                  '提供110kV侧中性点保护间隙的阻抗值计算结果，并进行验证。',
                  '提供110kV侧中性点接地保护系统的设计说明，包括保护继电器的整定值、动作特性等。',
                  '提供相关试验报告，验证保护系统的协调性和可靠性。'
                ],
                description:
                  '110kV侧中性点采用保护间隙方式，这在某些情况下是允许的，但需要满足特定的条件，例如保护间隙的阻抗值、保护系统的协调性等。设计说明中未提及这些条件是否满足。',
                geometry_ref: {
                  extents: null,
                  file_id: 'c8f50371-a428-435f-a2d9-35d6048f1670',
                  handles: null
                }
              },
              {
                title: '10kV系统接地方式',
                risk_level: 'medium',
                suggestion: [
                  '提供10kV系统不接地方式的可行性研究报告，包括对电网稳定性和可靠性的影响分析。',
                  '提供电网公司的审核意见，确认不接地方式的可行性。'
                ],
                description:
                  '10kV系统采用不接地方式，这在某些情况下是允许的，但需要满足特定的条件，例如电网的稳定性和可靠性。设计说明中未提及这些条件是否满足，以及是否经过了电网公司的审核。',
                geometry_ref: {
                  extents: null,
                  file_id: 'c8f50371-a428-435f-a2d9-35d6048f1670',
                  handles: null
                }
              },
              {
                title: '消谐滤波补偿装置容量',
                risk_level: 'medium',
                suggestion: [
                  '提供消谐滤波补偿装置容量的计算书，包括谐波分析、补偿效果评估等。',
                  '提供谐波分析报告，确定谐波的含量和频率。'
                ],
                description:
                  '10kV消谐滤波补偿装置容量为1×12000kvar，相对于10kV母线容量，该补偿容量是否合理？是否考虑了谐波的实际情况？设计说明中未提供相关计算依据。',
                geometry_ref: {
                  extents: null,
                  file_id: 'c8f50371-a428-435f-a2d9-35d6048f1670',
                  handles: null
                }
              },
              {
                title: '户内变电站布局',
                risk_level: 'medium',
                suggestion: [
                  '提供详细的户内变电站布局图，标明各设备之间的安全距离。',
                  '提供通风和消防系统的设计说明，确保各设备的安全。',
                  '进行人流疏散模拟，确保人员的安全。'
                ],
                description:
                  '户内变电站配电装置楼长29米，宽21米，110kV配置装置室位于东北侧，变压器室位于北侧，10kV配电装置室位于南侧，10kV消谐补偿成套装置室位于西侧，10kV电容器室位于东北侧。需要考虑各设备之间的安全距离、通风、消防等因素。东北侧同时布置10kV电容器室和消谐补偿装置室，是否会影响通风和消防？',
                geometry_ref: {
                  extents: null,
                  file_id: 'c8f50371-a428-435f-a2d9-35d6048f1670',
                  handles: null
                }
              }
            ]
          },
          {
            id: '2.1',
            title: '核查配电装置选择的合理性',
            content: '核查配电装置选择的合理性',
            violations: [
              {
                title: '2.1 核查配电装置选择的合理性',
                risk_level: 'medium',
                suggestion: [
                  '在设计说明中增加配电装置选择的合理性核查章节，详细描述核查过程、依据和结论，包括负荷计算、电压降分析、短路计算、保护协调等。',
                  '提供配电装置选型的技术计算书和论证报告，作为附件。'
                ],
                description:
                  '设计说明中未体现配电装置选择的合理性核查过程和结果，仅列出了设备选型清单，缺乏必要的论证和依据。',
                geometry_ref: {
                  extents: null,
                  file_id: 'c8f50371-a428-435f-a2d9-35d6048f1670',
                  handles: null
                }
              },
              {
                title: '四、主要设备选型 - 主变压器',
                risk_level: 'medium',
                suggestion: [
                  '在主变压器选型说明中，增加能效等级选择的依据和计算过程，例如，说明为什么选择二级能效，并提供相关的能效计算结果。'
                ],
                description:
                  '虽然主变压器满足《GB20052-2020》二级能效要求，但设计说明中未体现能效等级选择的依据和计算过程。仅仅提及满足即可。',
                geometry_ref: {
                  extents: null,
                  file_id: 'c8f50371-a428-435f-a2d9-35d6048f1670',
                  handles: null
                }
              },
              {
                title: '五、过电压保护与接地 - 接地电阻',
                risk_level: 'medium',
                suggestion: [
                  '在设计说明中明确施工完成后实测接地电阻值的记录和处理措施，包括实测值的记录方式、处理流程、以及采取的纠正措施。'
                ],
                description:
                  '虽然设计说明中提到接地电阻不应大于0.378Ω，但未提及施工完成后实测接地电阻值的记录和处理措施。如果实测值不满足要求，需要采取措施，但未在设计说明中体现。',
                geometry_ref: {
                  extents: null,
                  file_id: 'c8f50371-a428-435f-a2d9-35d6048f1670',
                  handles: null
                }
              },
              {
                title: '七、电缆设施及防火 - 防火封堵材料',
                risk_level: 'medium',
                suggestion: [
                  '在设计说明中明确防火涂料的类型、性能指标（如耐火极限、热释放率等）和施工要求，并提供相关的技术规范和标准。'
                ],
                description:
                  '设计说明中提到“为防止火灾扩大，在阻火墙两侧1.5m及户外电缆隧道进入户内1m范围内的电缆涂防火涂料”，但未明确防火涂料的类型、性能指标和施工要求。',
                geometry_ref: {
                  extents: null,
                  file_id: 'c8f50371-a428-435f-a2d9-35d6048f1670',
                  handles: null
                }
              },
              {
                title: '三、电气主接线和平面布置 - 母线接线',
                risk_level: 'medium',
                suggestion: [
                  '在设计说明中详细说明选择不接地方式的理由，包括对系统运行的安全性、可靠性和电能质量的影响，并提供相关的分析和论证。'
                ],
                description:
                  '设计说明中提到“10kV系统采用不接地方式”，但未说明选择不接地方式的理由和对系统运行的影响。需要进行详细的分析和论证。',
                geometry_ref: {
                  extents: null,
                  file_id: 'c8f50371-a428-435f-a2d9-35d6048f1670',
                  handles: null
                }
              },
              {
                title: '六、照明与动力 - 事故照明',
                risk_level: 'medium',
                suggestion: [
                  '在设计说明中明确检修人员判断是否需要合上事故照明开关的标准，并考虑增加事故照明系统的自动切换机制，以提高安全性。'
                ],
                description:
                  '设计说明中提到“当一般照明箱失电时，检修人员根据需要合上相应的事故照明开关”，但未明确检修人员如何判断是否需要合上事故照明开关，以及事故照明系统的自动切换机制。',
                geometry_ref: {
                  extents: null,
                  file_id: 'c8f50371-a428-435f-a2d9-35d6048f1670',
                  handles: null
                }
              }
            ]
          },
          {
            id: '3.1',
            title: '短路电流审查',
            content: '短路电流审查',
            violations: [
              {
                title: '编号: 3.1 短路电流审查',
                risk_level: 'medium',
                suggestion: [
                  '在设计说明中增加短路电流审查的具体内容，包括计算方法、计算结果、设备选型依据等。',
                  '确保短路电流计算符合相关规范要求，并对设备选型进行验证。'
                ],
                description:
                  '设计说明中缺少短路电流审查的具体内容和结果。规范要求进行短路电流审查，但设计说明仅提及了审查本身，没有提供任何审查结果或分析。',
                geometry_ref: {
                  extents: null,
                  file_id: 'c8f50371-a428-435f-a2d9-35d6048f1670',
                  handles: null
                }
              },
              {
                title: '全局项目参数',
                risk_level: 'medium',
                suggestion: [
                  '在设计说明中明确列出所有全局项目参数，例如电压等级、频率、阻抗等。',
                  '确保所有设计文件和计算都基于相同的全局参数。'
                ],
                description:
                  '设计说明中没有提供全局项目参数信息。全局参数对于设计的一致性和可追溯性至关重要。',
                geometry_ref: {
                  extents: null,
                  file_id: 'c8f50371-a428-435f-a2d9-35d6048f1670',
                  handles: null
                }
              },
              {
                title: '设计内容及范围 - 设计内容',
                risk_level: 'medium',
                suggestion: [
                  '在设计内容中详细说明电容器组的控制方式（例如：自动控制、手动控制），以及相关的保护措施（例如：过电压保护、过电流保护）。'
                ],
                description:
                  '设计内容中提到“无功补偿并联电容器装置安装”，但没有明确说明电容器组的控制方式和保护措施。',
                geometry_ref: {
                  extents: null,
                  file_id: 'c8f50371-a428-435f-a2d9-35d6048f1670',
                  handles: null
                }
              },
              {
                title: '电气主接线和平面布置 - 电气主接线 - 110kV进线',
                risk_level: 'medium',
                suggestion: [
                  '避免使用过于具体的项目信息，例如线路名称。使用更通用的描述，例如“采用电缆进线”。',
                  '补充说明进线电缆的规格（例如：截面积、绝缘等级）和敷设方式（例如：电缆沟、隧道）。'
                ],
                description:
                  '描述中提到“T接110kV延太733线”，这部分信息过于具体，可能与特定项目相关，缺乏通用性。此外，需要说明进线电缆的规格和敷设方式。',
                geometry_ref: {
                  extents: null,
                  file_id: 'c8f50371-a428-435f-a2d9-35d6048f1670',
                  handles: null
                }
              },
              {
                title: '电气主接线和平面布置 - 电气主接线 - 10kV母线',
                risk_level: 'medium',
                suggestion: [
                  '说明是否考虑了10kV母线的冗余性或备用电源。如果采用单母线接线，需要明确说明其适用条件和风险。',
                  '如果需要提高可靠性，可以考虑采用双母线接线或备用电源。'
                ],
                description:
                  '描述中提到“采用单母线接线”，但没有说明是否考虑了冗余性或备用电源。在重要变电站，单母线接线通常需要考虑备用电源或冗余母线。',
                geometry_ref: {
                  extents: null,
                  file_id: 'c8f50371-a428-435f-a2d9-35d6048f1670',
                  handles: null
                }
              },
              {
                title: '电气主接线和平面布置 - 电气平面布置',
                risk_level: 'medium',
                suggestion: [
                  '在平面布置图中明确标示设备之间的最小安全距离，以及检修通道的宽度。',
                  '确保平面布置符合安全规范和维护要求。'
                ],
                description:
                  '平面布置中没有提及设备之间的距离要求，以及安全通道的设置。这可能影响设备的维护和检修。',
                geometry_ref: {
                  extents: null,
                  file_id: 'c8f50371-a428-435f-a2d9-35d6048f1670',
                  handles: null
                }
              },
              {
                title: '过电压保护与接地 - 接地',
                risk_level: 'medium',
                suggestion: [
                  '补充说明接地电阻的测量方法和频率，例如采用膜片法或三极法测量，频率为10kHz。'
                ],
                description:
                  '虽然提到接地电阻不应大于0.378Ω，但没有说明接地电阻的测量方法和频率。',
                geometry_ref: {
                  extents: null,
                  file_id: 'c8f50371-a428-435f-a2d9-35d6048f1670',
                  handles: null
                }
              },
              {
                title: '电缆设施及防火',
                risk_level: 'medium',
                suggestion: [
                  '明确防火涂料的类型（例如：有机防火涂料、无机防火涂料）和性能指标（例如：耐火极限、热释放率）。'
                ],
                description:
                  '虽然提到阻火墙和防火封堵，但没有说明防火涂料的类型和性能指标。',
                geometry_ref: {
                  extents: null,
                  file_id: 'c8f50371-a428-435f-a2d9-35d6048f1670',
                  handles: null
                }
              }
            ]
          }
        ],
        category: '设计说明审查'
      }
    ]
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
    })
  })
  return violations
})

// 排序后的违规项列表（重大 > 一般 > 轻微）
const sortedViolations = computed(() => {
  const riskOrder = { high: 3, medium: 2, low: 1 }
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
  const view = AcApDocManager.instance.curView as any
  view.updateSize()
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

// 定位到图纸 - 实际实现
const locateInDrawing = (geometry: any) => {
  try {
    if (!geometry?.extents) {
      ElMessage.warning('无法获取几何信息')
      return
    }

    // 提取坐标范围
    const { min_point, max_point } = geometry.extents

    // 创建边界框
    const box = new AcGeBox2d(
      { x: min_point.x, y: min_point.y },
      { x: max_point.x, y: max_point.y }
    )

    // 获取CAD查看器实例
    const docManager = AcApDocManager.instance

    if (!docManager || !docManager.curView) {
      ElMessage.warning('CAD查看器未初始化')
      return
    }

    // 清除当前选择
    // docManager.editor.selectionSet.clear()

    // 高亮相关实体（如果有句柄信息）
    if (geometry.handles && geometry.handles.length > 0) {
      try {
        // 尝试通过句柄获取对象ID并高亮显示
        highlightEntitiesByHandles(geometry.handles)
      } catch (error) {
        console.warn('高亮实体失败:', error)
      }
    }

    // 定位到违规区域
    docManager.curView.zoomTo(box, 1.5) // 1.5倍边距，让区域更明显

    // 可选：添加临时标注
    // addTemporaryMark(box)

    ElMessage.success({
      message: `已定位到违规区域 (${min_point.x.toFixed(2)}, ${min_point.y.toFixed(2)})`,
      duration: 2000
    })
  } catch (error) {
    console.error('定位失败:', error)
    ElMessage.error('定位失败，请稍后重试')
  }
}

// 通过句柄高亮实体
const highlightEntitiesByHandles = (handles: string[]) => {
  try {
    const docManager = AcApDocManager.instance
    const database = docManager.curDocument?.database

    if (!database) return

    const objectIds: any[] = []

    // 遍历句柄，获取对象ID
    handles.forEach(handle => {
      try {
        // 这里需要根据你的CAD库API来获取对象ID
        // 假设有一个方法可以根据句柄获取对象ID
        // const objectId = database.getObjectIdFromHandle?.(handle)
        // if (objectId) {
        //   objectIds.push(objectId)
        // }
      } catch (error) {
        console.warn(`句柄 ${handle} 获取失败:`, error)
      }
    })

    if (objectIds.length > 0) {
      // 高亮显示这些实体
      docManager.curView.highlight(objectIds)

      // 也可以添加到选择集
      // docManager.editor.selectionSet.add(objectIds);
    }
  } catch (error) {
    console.error('高亮实体失败:', error)
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

// 添加行点击处理函数
const handleRowClick = (row: any) => {
  selectedViolation.value = row
  showViolationDetail.value = true
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
      font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
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
      { header: '风险等级', key: 'riskLevel', width: 12 },
      { header: '问题来源', key: 'category', width: 12 },
      { header: '违规问题', key: 'title', width: 40 },
      { header: '问题描述', key: 'description', width: 50 },
      { header: '处理建议', key: 'suggestion', width: 60 },
      { header: '相关规范', key: 'articleTitle', width: 30 },
      { header: '条文编号', key: 'articleId', width: 15 },
      { header: '定位状态', key: 'locationStatus', width: 12 }
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
      { level: 'medium', name: '一般问题', color: 'FFFFB84D' },
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
