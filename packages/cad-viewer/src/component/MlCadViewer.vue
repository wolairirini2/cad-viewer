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
              <el-button icon="Promotion" type="success">
                导出审查报告
              </el-button>
            </div>
          </div>
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
          <!-- Tabs切换 -->
          <div class="panel-tabs">
            <!-- 违规项表格 -->
            <div class="violation-table">
              <el-table
                :data="pagedData"
                height="100%"
                style="width: 100%"
                empty-text="未发现违规项"
                @row-click="handleRowClick"
                border
                stripe
              >
                <el-table-column
                  prop="risk_level"
                  label="风险等级"
                  width="90"
                  align="center"
                >
                  <template #default="{ row }">
                    <el-tag
                      :type="getRiskTagType(row.risk_level)"
                      effect="plain"
                    >
                      {{ getRiskText(row.risk_level) }}
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
                    <span style="color: #558ee2">{{ row.title }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  prop="description"
                  label="问题描述"
                  min-width="150"
                  show-overflow-tooltip
                />
                <el-table-column
                  prop="suggestion"
                  label="处理建议"
                  min-width="150"
                  show-overflow-tooltip
                >
                  <template #default="{ row }">
                    <div v-if="Array.isArray(row.suggestion)">
                      <!-- ✅ 修改：判断是否为数组 -->
                      <div v-if="row.suggestion.length === 1">
                        {{ row.suggestion[0] }}
                      </div>
                      <div v-else>
                        <div
                          v-for="(item, index) in row.suggestion"
                          :key="index"
                          class="suggestion-item"
                        >
                          {{ Number(index) + 1 }}. {{ item }}
                        </div>
                      </div>
                    </div>
                    <div v-else>
                      {{ row.suggestion }}
                    </div>
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
                      v-if="row.geometry_ref?.file_id"
                      type="primary"
                      size="small"
                      @click.stop="handleLocateClick(row.geometry_ref)"
                      :loading="locating[row.violation_id]"
                      :disabled="!row.geometry_ref?.extents"
                      plain
                      icon="location"
                    >
                      定位
                    </el-button>
                    <el-tooltip v-else content="无几何信息" placement="top">
                      <el-button size="small" disabled>定位</el-button>
                    </el-tooltip>
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
    :title="selectedViolation?.title || '违规详情'"
    width="600px"
    class="violation-detail-dialog-wrapper"
    :style="{ maxHeight: '85vh' }"
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
            size="small"
          >
            {{ getRiskText(selectedViolation.risk_level) }}
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
  List,
  WarnTriangleFilled,
  InfoFilled,
  WarningFilled
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
            id: '1.3',
            title: '核查设计分界点',
            content: '设计分界点应定义明确，责任边界无模糊或遗漏',
            violations: [
              {
                title: '设计分界点定义不完整',
                risk_level: 'medium',
                suggestion: [
                  '补充通信系统分界：明确变电所至110kV斜桥变的光缆建设责任，以及110kV斜桥变光路分支板安装责任',
                  '明确远动系统分界：变电所综合自动化系统与张家港市调调度端接口的责任划分',
                  '补充站用电系统分界：明确站用电与厂区电源的接入点及责任',
                  '补充消防系统分界：明确消防给水系统与厂区消防管网的连接点',
                  '补充给排水系统分界：明确上下水系统与厂区管网的连接点及责任'
                ],
                description:
                  '设计说明中仅定义了110kV进线和10kV出线的分界点，但未明确其他重要界面的分界，如：1. 通信系统（光纤通道）的分界点；2. 远动系统与调度端的分界；3. 站用电系统与厂区电源的分界；4. 消防系统与厂区消防管网的分界；5. 给排水系统与厂区管网的分界。这些界面的责任边界存在模糊和遗漏。',
                geometry_ref: {
                  extents: null,
                  file_id: 'a5243ea6-c846-4dda-85e8-122c9cb0b3bf',
                  handles: null
                }
              },
              {
                title: '责任边界表述模糊',
                risk_level: 'medium',
                suggestion: [
                  "明确'线路专业'的具体责任单位，如是设计院内部专业分工应注明，如是外部单位应明确单位名称",
                  "明确'用户'的具体定义，建议改为'由建设单位负责'或'由厂区管理单位负责'",
                  "补充说明'接口补贴费'包含的具体工作内容、设备范围和责任分界点"
                ],
                description:
                  "1. '110kV线路以进线终端电缆头(不含,列入线路专业)为界'表述中'线路专业'未明确是设计院内部专业分工还是外部单位责任；2. '10kV电缆敷设、进所道路均以变电所外墙为界，所外部分由用户自理'中'用户'定义不明确，未说明是建设单位还是厂区管理单位；3. '本工程列入市调通信系统接口补贴费'和'本工程列入市调调度、远动系统接口补贴费'未明确费用包含的具体工作范围和责任界面。",
                geometry_ref: {
                  extents: null,
                  file_id: 'a5243ea6-c846-4dda-85e8-122c9cb0b3bf',
                  handles: null
                }
              },
              {
                title: '分界点物理位置描述不精确',
                risk_level: 'medium',
                suggestion: [
                  "补充110kV进线终端电缆头的具体安装位置描述，如'安装在110kV GIS柜电缆终端套管处'",
                  "明确10kV开关柜内终端电缆头的具体位置，如'安装在10kV开关柜电缆室电缆终端处'",
                  '建议在设计图纸中增加分界点位置示意图，或在说明书中用文字详细描述各分界点的物理位置'
                ],
                description:
                  "1. 110kV进线分界点仅描述为'进线终端电缆头'，未说明具体安装位置（如GIS柜内、电缆竖井等）；2. 10kV出线分界点描述为'开关柜内终端电缆头'，未明确是开关柜的哪个具体位置（如电缆室、出线套管等）；3. 未提供分界点的示意图或详细位置描述。",
                geometry_ref: {
                  extents: null,
                  file_id: 'a5243ea6-c846-4dda-85e8-122c9cb0b3bf',
                  handles: null
                }
              },
              {
                title: '系统接口责任未明确',
                risk_level: 'medium',
                suggestion: [
                  '明确变电所至110kV斜桥变光缆的建设责任单位（设计、施工、采购）',
                  '明确110kV斜桥变光路分支板的安装责任单位及费用承担方',
                  '明确调度端接口的具体分界点，如通信规约转换器、通信服务器等设备的分界',
                  '补充与厂区其他系统的接口责任说明'
                ],
                description:
                  "1. 系统通信部分提到'本期建设变电所至110kV斜桥变普通光纤（8芯）约3.5km，110kV斜桥变增加光路分支板一块'，但未明确这段光缆的建设责任和光路分支板的安装责任；2. 系统远动部分提到'局端由张家港市调提供调度端的接口要求'，但未明确接口设备的具体分界；3. 未说明与厂区其他系统（如厂区监控系统、生产管理系统）的接口责任。",
                geometry_ref: {
                  extents: null,
                  file_id: 'a5243ea6-c846-4dda-85e8-122c9cb0b3bf',
                  handles: null
                }
              }
            ]
          },
          {
            id: '1.4',
            title: '核查建所必要性及负荷审查',
            content: '核查建所必要性及负荷审查',
            violations: []
          },
          {
            id: '2.1',
            title: '核查配电装置选择的合理性',
            content: '核查配电装置选择的合理性',
            violations: []
          },
          {
            id: '3.1',
            title: '短路电流审查',
            content: '短路电流审查',
            violations: []
          }
        ],
        category: '设计说明审查'
      },
      {
        code: 'DESIGN-SPEC-001',
        name: '工程设计说明编制规范',
        type: '行业标准',
        articles: [
          {
            id: '1.3',
            title: '核查设计分界点',
            content: '设计分界点应定义明确，责任边界无模糊或遗漏',
            violations: [
              {
                title: '设计分界点定义不完整',
                risk_level: 'medium',
                suggestion: [
                  '补充通信系统分界：明确变电所至110kV斜桥变的光缆建设责任，以及110kV斜桥变光路分支板安装责任',
                  '明确远动系统分界：变电所综合自动化系统与张家港市调调度端接口的责任划分',
                  '补充站用电系统分界：明确站用电与厂区电源的接入点及责任',
                  '补充消防系统分界：明确消防给水系统与厂区消防管网的连接点',
                  '补充给排水系统分界：明确上下水系统与厂区管网的连接点及责任'
                ],
                description:
                  '设计说明中仅定义了110kV进线和10kV出线的分界点，但未明确其他重要界面的分界，如：1. 通信系统（光纤通道）的分界点；2. 远动系统与调度端的分界；3. 站用电系统与厂区电源的分界；4. 消防系统与厂区消防管网的分界；5. 给排水系统与厂区管网的分界。这些界面的责任边界存在模糊和遗漏。',
                geometry_ref: {
                  extents: null,
                  file_id: 'a5243ea6-c846-4dda-85e8-122c9cb0b3bf',
                  handles: null
                }
              },
              {
                title: '责任边界表述模糊',
                risk_level: 'medium',
                suggestion: [
                  "明确'线路专业'的具体责任单位，如是设计院内部专业分工应注明，如是外部单位应明确单位名称",
                  "明确'用户'的具体定义，建议改为'由建设单位负责'或'由厂区管理单位负责'",
                  "补充说明'接口补贴费'包含的具体工作内容、设备范围和责任分界点"
                ],
                description:
                  "1. '110kV线路以进线终端电缆头(不含,列入线路专业)为界'表述中'线路专业'未明确是设计院内部专业分工还是外部单位责任；2. '10kV电缆敷设、进所道路均以变电所外墙为界，所外部分由用户自理'中'用户'定义不明确，未说明是建设单位还是厂区管理单位；3. '本工程列入市调通信系统接口补贴费'和'本工程列入市调调度、远动系统接口补贴费'未明确费用包含的具体工作范围和责任界面。",
                geometry_ref: {
                  extents: null,
                  file_id: 'a5243ea6-c846-4dda-85e8-122c9cb0b3bf',
                  handles: null
                }
              },
              {
                title: '分界点物理位置描述不精确',
                risk_level: 'medium',
                suggestion: [
                  "补充110kV进线终端电缆头的具体安装位置描述，如'安装在110kV GIS柜电缆终端套管处'",
                  "明确10kV开关柜内终端电缆头的具体位置，如'安装在10kV开关柜电缆室电缆终端处'",
                  '建议在设计图纸中增加分界点位置示意图，或在说明书中用文字详细描述各分界点的物理位置'
                ],
                description:
                  "1. 110kV进线分界点仅描述为'进线终端电缆头'，未说明具体安装位置（如GIS柜内、电缆竖井等）；2. 10kV出线分界点描述为'开关柜内终端电缆头'，未明确是开关柜的哪个具体位置（如电缆室、出线套管等）；3. 未提供分界点的示意图或详细位置描述。",
                geometry_ref: {
                  extents: null,
                  file_id: 'a5243ea6-c846-4dda-85e8-122c9cb0b3bf',
                  handles: null
                }
              },
              {
                title: '系统接口责任未明确',
                risk_level: 'medium',
                suggestion: [
                  '明确变电所至110kV斜桥变光缆的建设责任单位（设计、施工、采购）',
                  '明确110kV斜桥变光路分支板的安装责任单位及费用承担方',
                  '明确调度端接口的具体分界点，如通信规约转换器、通信服务器等设备的分界',
                  '补充与厂区其他系统的接口责任说明'
                ],
                description:
                  "1. 系统通信部分提到'本期建设变电所至110kV斜桥变普通光纤（8芯）约3.5km，110kV斜桥变增加光路分支板一块'，但未明确这段光缆的建设责任和光路分支板的安装责任；2. 系统远动部分提到'局端由张家港市调提供调度端的接口要求'，但未明确接口设备的具体分界；3. 未说明与厂区其他系统（如厂区监控系统、生产管理系统）的接口责任。",
                geometry_ref: {
                  extents: null,
                  file_id: 'a5243ea6-c846-4dda-85e8-122c9cb0b3bf',
                  handles: null
                }
              }
            ]
          },
          {
            id: '1.4',
            title: '核查建所必要性及负荷审查',
            content: '核查建所必要性及负荷审查',
            violations: []
          },
          {
            id: '2.1',
            title: '核查配电装置选择的合理性',
            content: '核查配电装置选择的合理性',
            violations: []
          },
          {
            id: '3.1',
            title: '短路电流审查',
            content: '短路电流审查',
            violations: []
          }
        ],
        category: '设计说明审查'
      },
      {
        code: 'DESIGN-SPEC-001',
        name: '工程设计说明编制规范',
        type: '行业标准',
        articles: [
          {
            id: '1.3',
            title: '核查设计分界点',
            content: '设计分界点应定义明确，责任边界无模糊或遗漏',
            violations: [
              {
                title: '设计分界点定义不完整',
                risk_level: 'medium',
                suggestion: [
                  '补充通信系统分界：明确变电所至110kV斜桥变的光缆建设责任，以及110kV斜桥变光路分支板安装责任',
                  '明确远动系统分界：变电所综合自动化系统与张家港市调调度端接口的责任划分',
                  '补充站用电系统分界：明确站用电与厂区电源的接入点及责任',
                  '补充消防系统分界：明确消防给水系统与厂区消防管网的连接点',
                  '补充给排水系统分界：明确上下水系统与厂区管网的连接点及责任'
                ],
                description:
                  '设计说明中仅定义了110kV进线和10kV出线的分界点，但未明确其他重要界面的分界，如：1. 通信系统（光纤通道）的分界点；2. 远动系统与调度端的分界；3. 站用电系统与厂区电源的分界；4. 消防系统与厂区消防管网的分界；5. 给排水系统与厂区管网的分界。这些界面的责任边界存在模糊和遗漏。',
                geometry_ref: {
                  extents: null,
                  file_id: 'a5243ea6-c846-4dda-85e8-122c9cb0b3bf',
                  handles: null
                }
              },
              {
                title: '责任边界表述模糊',
                risk_level: 'medium',
                suggestion: [
                  "明确'线路专业'的具体责任单位，如是设计院内部专业分工应注明，如是外部单位应明确单位名称",
                  "明确'用户'的具体定义，建议改为'由建设单位负责'或'由厂区管理单位负责'",
                  "补充说明'接口补贴费'包含的具体工作内容、设备范围和责任分界点"
                ],
                description:
                  "1. '110kV线路以进线终端电缆头(不含,列入线路专业)为界'表述中'线路专业'未明确是设计院内部专业分工还是外部单位责任；2. '10kV电缆敷设、进所道路均以变电所外墙为界，所外部分由用户自理'中'用户'定义不明确，未说明是建设单位还是厂区管理单位；3. '本工程列入市调通信系统接口补贴费'和'本工程列入市调调度、远动系统接口补贴费'未明确费用包含的具体工作范围和责任界面。",
                geometry_ref: {
                  extents: null,
                  file_id: 'a5243ea6-c846-4dda-85e8-122c9cb0b3bf',
                  handles: null
                }
              },
              {
                title: '分界点物理位置描述不精确',
                risk_level: 'medium',
                suggestion: [
                  "补充110kV进线终端电缆头的具体安装位置描述，如'安装在110kV GIS柜电缆终端套管处'",
                  "明确10kV开关柜内终端电缆头的具体位置，如'安装在10kV开关柜电缆室电缆终端处'",
                  '建议在设计图纸中增加分界点位置示意图，或在说明书中用文字详细描述各分界点的物理位置'
                ],
                description:
                  "1. 110kV进线分界点仅描述为'进线终端电缆头'，未说明具体安装位置（如GIS柜内、电缆竖井等）；2. 10kV出线分界点描述为'开关柜内终端电缆头'，未明确是开关柜的哪个具体位置（如电缆室、出线套管等）；3. 未提供分界点的示意图或详细位置描述。",
                geometry_ref: {
                  extents: null,
                  file_id: 'a5243ea6-c846-4dda-85e8-122c9cb0b3bf',
                  handles: null
                }
              },
              {
                title: '系统接口责任未明确',
                risk_level: 'medium',
                suggestion: [
                  '明确变电所至110kV斜桥变光缆的建设责任单位（设计、施工、采购）',
                  '明确110kV斜桥变光路分支板的安装责任单位及费用承担方',
                  '明确调度端接口的具体分界点，如通信规约转换器、通信服务器等设备的分界',
                  '补充与厂区其他系统的接口责任说明'
                ],
                description:
                  "1. 系统通信部分提到'本期建设变电所至110kV斜桥变普通光纤（8芯）约3.5km，110kV斜桥变增加光路分支板一块'，但未明确这段光缆的建设责任和光路分支板的安装责任；2. 系统远动部分提到'局端由张家港市调提供调度端的接口要求'，但未明确接口设备的具体分界；3. 未说明与厂区其他系统（如厂区监控系统、生产管理系统）的接口责任。",
                geometry_ref: {
                  extents: null,
                  file_id: 'a5243ea6-c846-4dda-85e8-122c9cb0b3bf',
                  handles: null
                }
              }
            ]
          },
          {
            id: '1.4',
            title: '核查建所必要性及负荷审查',
            content: '核查建所必要性及负荷审查',
            violations: []
          },
          {
            id: '2.1',
            title: '核查配电装置选择的合理性',
            content: '核查配电装置选择的合理性',
            violations: []
          },
          {
            id: '3.1',
            title: '短路电流审查',
            content: '短路电流审查',
            violations: []
          }
        ],
        category: '设计说明审查'
      },
      {
        code: 'DESIGN-SPEC-001',
        name: '工程设计说明编制规范',
        type: '行业标准',
        articles: [
          {
            id: '1.3',
            title: '核查设计分界点',
            content: '设计分界点应定义明确，责任边界无模糊或遗漏',
            violations: [
              {
                title: '设计分界点定义不完整',
                risk_level: 'medium',
                suggestion: [
                  '补充通信系统分界：明确变电所至110kV斜桥变的光缆建设责任，以及110kV斜桥变光路分支板安装责任',
                  '明确远动系统分界：变电所综合自动化系统与张家港市调调度端接口的责任划分',
                  '补充站用电系统分界：明确站用电与厂区电源的接入点及责任',
                  '补充消防系统分界：明确消防给水系统与厂区消防管网的连接点',
                  '补充给排水系统分界：明确上下水系统与厂区管网的连接点及责任'
                ],
                description:
                  '设计说明中仅定义了110kV进线和10kV出线的分界点，但未明确其他重要界面的分界，如：1. 通信系统（光纤通道）的分界点；2. 远动系统与调度端的分界；3. 站用电系统与厂区电源的分界；4. 消防系统与厂区消防管网的分界；5. 给排水系统与厂区管网的分界。这些界面的责任边界存在模糊和遗漏。',
                geometry_ref: {
                  extents: null,
                  file_id: 'a5243ea6-c846-4dda-85e8-122c9cb0b3bf',
                  handles: null
                }
              },
              {
                title: '责任边界表述模糊',
                risk_level: 'medium',
                suggestion: [
                  "明确'线路专业'的具体责任单位，如是设计院内部专业分工应注明，如是外部单位应明确单位名称",
                  "明确'用户'的具体定义，建议改为'由建设单位负责'或'由厂区管理单位负责'",
                  "补充说明'接口补贴费'包含的具体工作内容、设备范围和责任分界点"
                ],
                description:
                  "1. '110kV线路以进线终端电缆头(不含,列入线路专业)为界'表述中'线路专业'未明确是设计院内部专业分工还是外部单位责任；2. '10kV电缆敷设、进所道路均以变电所外墙为界，所外部分由用户自理'中'用户'定义不明确，未说明是建设单位还是厂区管理单位；3. '本工程列入市调通信系统接口补贴费'和'本工程列入市调调度、远动系统接口补贴费'未明确费用包含的具体工作范围和责任界面。",
                geometry_ref: {
                  extents: null,
                  file_id: 'a5243ea6-c846-4dda-85e8-122c9cb0b3bf',
                  handles: null
                }
              },
              {
                title: '分界点物理位置描述不精确',
                risk_level: 'medium',
                suggestion: [
                  "补充110kV进线终端电缆头的具体安装位置描述，如'安装在110kV GIS柜电缆终端套管处'",
                  "明确10kV开关柜内终端电缆头的具体位置，如'安装在10kV开关柜电缆室电缆终端处'",
                  '建议在设计图纸中增加分界点位置示意图，或在说明书中用文字详细描述各分界点的物理位置'
                ],
                description:
                  "1. 110kV进线分界点仅描述为'进线终端电缆头'，未说明具体安装位置（如GIS柜内、电缆竖井等）；2. 10kV出线分界点描述为'开关柜内终端电缆头'，未明确是开关柜的哪个具体位置（如电缆室、出线套管等）；3. 未提供分界点的示意图或详细位置描述。",
                geometry_ref: {
                  extents: null,
                  file_id: 'a5243ea6-c846-4dda-85e8-122c9cb0b3bf',
                  handles: null
                }
              },
              {
                title: '系统接口责任未明确',
                risk_level: 'medium',
                suggestion: [
                  '明确变电所至110kV斜桥变光缆的建设责任单位（设计、施工、采购）',
                  '明确110kV斜桥变光路分支板的安装责任单位及费用承担方',
                  '明确调度端接口的具体分界点，如通信规约转换器、通信服务器等设备的分界',
                  '补充与厂区其他系统的接口责任说明'
                ],
                description:
                  "1. 系统通信部分提到'本期建设变电所至110kV斜桥变普通光纤（8芯）约3.5km，110kV斜桥变增加光路分支板一块'，但未明确这段光缆的建设责任和光路分支板的安装责任；2. 系统远动部分提到'局端由张家港市调提供调度端的接口要求'，但未明确接口设备的具体分界；3. 未说明与厂区其他系统（如厂区监控系统、生产管理系统）的接口责任。",
                geometry_ref: {
                  extents: null,
                  file_id: 'a5243ea6-c846-4dda-85e8-122c9cb0b3bf',
                  handles: null
                }
              }
            ]
          },
          {
            id: '1.4',
            title: '核查建所必要性及负荷审查',
            content: '核查建所必要性及负荷审查',
            violations: []
          },
          {
            id: '2.1',
            title: '核查配电装置选择的合理性',
            content: '核查配电装置选择的合理性',
            violations: []
          },
          {
            id: '3.1',
            title: '短路电流审查',
            content: '短路电流审查',
            violations: []
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
          articleTitle: article.title
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
      return '重大'
    case 'medium':
      return '一般'
    case 'low':
      return '轻微'
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
const pageSize = ref(10)
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
    :deep(th.el-table__cell) {
      color: #100;
      font-weight: 500;
      font-size: 16px;
      border-bottom: 1px solid var(--color-gray-200);
    }
  }
}

/* 标题区域 */
.panel-header {
  padding: 8px 10px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
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
  color: var(--color-primary);
}

.stat-value.risk-high {
  color: #ff4d4f;
}

.stat-value.risk-medium {
  color: #faad14;
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
  font-weight: 500;
  color: #262626;
}

.detail-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  line-height: 1.5;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  width: 80px;
  font-weight: bold;
  color: #595959;
  margin-right: 12px;
  flex-shrink: 0;
}

.detail-content {
  line-height: 1.6;
  color: #595959;
  text-align: justify;
}

.detail-content.suggestion {
  color: var(--color-primary);
  padding: 12px;
  border-radius: 4px;
  border-left: 3px solid var(--color-primary);
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
  border-left: 3px solid #52c41a;
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
  font-size: 12px;
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
    &:nth-child(1).active {
      background: var(--color-primary);
      border-color: var(--color-primary-dark);
    }

    &:nth-child(2).active {
      background: var(--color-danger);
      border-color: var(--color-danger-dark);
    }

    &:nth-child(3).active {
      background: var(--color-warning);
      border-color: var(--color-warning-dark);
    }

    &:nth-child(4).active {
      background: var(--color-success);
      border-color: var(--color-success-dark);
    }

    // 图标样式
    .el-icon {
      font-size: 16px;
    }
  }
}

// 数量徽章样式
.filter-count {
  background: rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 6px;
  min-width: 20px;
  text-align: center;
}

// 问题描述内容样式 - 修复版
.description-content {
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
</style>
