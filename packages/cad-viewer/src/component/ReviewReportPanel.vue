<template>
  <div
    class="regulation-panel"
    :class="{
      collapsed: isCollapsed,
      fullscreen: isFullscreen,
      isdetail: currentView !== 'list'
    }"
  >
    <el-button
      class="panel-toggle-btn"
      :class="{ collapsed: isCollapsed }"
      :icon="isCollapsed ? ArrowLeft : ArrowRight"
      circle
      size="small"
      @click="togglePanel"
      :title="isCollapsed ? '展开报告' : '收起报告'"
    />

    <div class="panel-main-content" v-if="!isCollapsed">
      <!-- 列表视图 -->
      <div v-if="currentView === 'list'" class="list-view">
        <!-- 标题 -->
        <div class="panel-header">
          <h3>{{ projectName }}审查报告</h3>
          <div class="panel-actions">
            <!-- 全屏切换按钮 -->
            <el-icon
              @click="toggleFullscreen"
              style="
                font-size: 20px;
                color: var(--color-gray-500);
                cursor: pointer;
                margin-right: 12px;
              "
              :title="isFullscreen ? '退出全屏' : '全屏显示'"
            >
              <component :is="isFullscreen ? Crop : FullScreen" />
            </el-icon>
            <el-icon
              @click="goBack"
              style="
                font-size: 20px;
                color: var(--color-gray-500);
                cursor: pointer;
              "
              title="返回"
              ><Back
            /></el-icon>
          </div>
        </div>

        <div class="panel-actions">
          <!-- 风险等级筛选 - 改为 el-radio-group -->
          <div class="violation-filters">
            <div
              class="filter-item"
              :class="{ active: currentFilter === null }"
              @click="currentFilter = null"
            >
              <el-icon><List /></el-icon>
              <span>全部审查</span>
              <span class="filter-count">{{ totalViolations }}</span>
            </div>

            <div
              class="filter-item"
              :class="{ active: currentFilter === 'high' }"
              @click="currentFilter = 'high'"
            >
              <el-icon><WarnTriangleFilled /></el-icon>
              <span>重大问题</span>
              <span class="filter-count">{{ riskCounts.high }}</span>
            </div>

            <div
              class="filter-item"
              :class="{ active: currentFilter === 'medium' }"
              @click="currentFilter = 'medium'"
            >
              <el-icon><WarningFilled /></el-icon>
              <span>一般问题</span>
              <span class="filter-count">{{ riskCounts.medium }}</span>
            </div>

            <div
              class="filter-item"
              :class="{ active: currentFilter === 'low' }"
              @click="currentFilter = 'low'"
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
              @click="handleBatchSend"
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
                  <el-tag :type="getCategoryType(row.category)" size="small">
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
                width="180"
                fixed="right"
                align="center"
              >
                <template #default="{ row }">
                  <el-button
                    type="info"
                    size="small"
                    @click.stop="handleLocate(row)"
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

                  <!-- 点踩按钮 -->
                  <el-button
                    size="small"
                    style="margin-left: 4px; padding: 0 10px"
                    type="info"
                    plain
                    :disabled="row.risk_level === 0"
                    @click.stop="openFeedbackDialog(row)"
                    title="反馈问题"
                  >
                    反馈
                  </el-button>
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

      <!-- 详情视图 -->
      <div v-else class="detail-view">
        <div class="detail-view-header">
          <span class="detail-title">{{
            selectedDetailRow?.articleTitle
          }}</span>

          <el-button icon="ArrowLeft" @click="handleBackToList"
            >返回列表</el-button
          >
          <el-button
            v-if="selectedDetailRow.category === '设计说明'"
            icon="Location"
            @click="handleLocate(selectedDetailRow)"
            >定位</el-button
          >
          <!-- 全屏切换按钮 -->
          <el-icon
            @click="toggleFullscreen"
            style="
              font-size: 20px;
              color: var(--color-gray-500);
              cursor: pointer;
              margin-left: 12px;
            "
            :title="isFullscreen ? '退出全屏' : '全屏显示'"
          >
            <component :is="isFullscreen ? Crop : FullScreen" />
          </el-icon>
        </div>
        <div class="detail-view-body">
          <!-- 根据详情类型动态渲染对应组件 -->
          <ViolationDetailDialog
            v-if="detailType === 'violation'"
            :data="selectedDetailRow"
            @locate="handleLocateFromDetail"
          />
          <PassedDetailDialog
            v-else
            :data="selectedDetailRow"
            @locate="handleLocateFromDetail"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- 在文件末尾，</template> 标签之前，添加反馈弹窗 -->
  <el-dialog
    v-model="feedbackDialogVisible"
    title="AI审查结果反馈"
    width="600px"
    :close-on-click-modal="false"
    draggable
  >
    <div style="margin-bottom: 20px">
      请帮助我们改进审查结果。您认为此条"<span
        style="color: var(--color-primary); font-weight: bold"
        >{{ currentFeedbackRow?.articleTitle }}</span
      >"的审查存在什么问题？
    </div>
    <el-radio-group
      v-model="feedbackOption"
      size="large"
      style="display: flex; gap: 16px"
    >
      <el-radio-button label="误报" size="large" />
      <el-radio-button label="描述不准确" size="large" />
      <el-radio-button label="规则理解错误" size="large" />
      <el-radio-button label="漏报其他问题" size="large" />
      <el-radio-button label="其他" size="large" />
    </el-radio-group>
    <div style="margin-top: 24px">
      <div
        style="
          margin-bottom: 8px;
          font-size: 14px;
          color: var(--color-gray-700);
        "
      >
        补充说明 (可选)：
      </div>
      <el-input
        v-model="feedbackComment"
        type="textarea"
        :rows="7"
        placeholder="请详细描述您遇到的问题或建议..."
        maxlength="500"
        show-word-limit
      />
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="feedbackDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="submitFeedback"
          :loading="isSubmittingFeedback"
        >
          提交反馈
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  ArrowRight,
  ArrowLeft,
  WarnTriangleFilled,
  WarningFilled,
  InfoFilled,
  List,
  Back,
  FullScreen,
  Crop,
  CircleCheckFilled
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ExcelJS from 'exceljs'

import ViolationDetailDialog from './ViolationDetailDialog.vue'
import PassedDetailDialog from './PassedDetailDialog.vue'

interface Props {
  reportData: any
  projectName: string
  currentFileId?: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  rowClick: [row: any]
  locate: [row: any]
  switchDrawing: [fileId: string]
  fullscreenChange: [isFullscreen: boolean] // 新增：全屏状态变化事件
  goBack: []
}>()

const isCollapsed = ref(false)
const currentFilter = ref<null | 'high' | 'medium' | 'low'>(null)
const currentPage = ref(1)
const pageSize = ref(20)
const selection = ref<any[]>([])
const locating = ref<Record<string, boolean>>({})
const isFullscreen = ref(false) // 新增：全屏状态

// 风险等级权重映射
const riskWeightMap: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
  pass: 0,
  '0': 0
}

// 获取最高风险等级的 violation
const getHighestRiskViolation = (violations: any[]) => {
  if (!violations || violations.length === 0) return null
  if (violations.length === 1) return violations[0]

  return violations.reduce((highest, current) => {
    const highestWeight = riskWeightMap[highest.risk_level] ?? 0
    const currentWeight = riskWeightMap[current.risk_level] ?? 0
    return currentWeight > highestWeight ? current : highest
  })
}

const riskCounts = computed(() => {
  const counts = { high: 0, medium: 0, low: 0 }
  props.reportData?.rules?.forEach((rule: any) => {
    rule.articles?.forEach((article: any) => {
      const violations = article.violations || []
      const highestRiskV = getHighestRiskViolation(violations)
      if (highestRiskV?.risk_level === 'high') counts.high++
      else if (highestRiskV?.risk_level === 'medium') counts.medium++
      else if (highestRiskV?.risk_level === 'low') counts.low++
    })
  })
  return counts
})

const totalViolations = computed(() => {
  let count = 0
  props.reportData?.rules?.forEach((rule: any) => {
    count += rule.articles?.length || 0
  })
  return count
})

const flattenedViolations = computed(() => {
  const violations: any[] = []
  props.reportData?.rules?.forEach((rule: any) => {
    rule.articles?.forEach((article: any) => {
      const allViolations = article.violations || []
      // 取风险等级最高的 violation 作为代表
      const highestRiskV = getHighestRiskViolation(allViolations)

      violations.push({
        ...(highestRiskV || {}),
        ruleName: rule.name,
        ruleCode: rule.code,
        articleId: article.id,
        articleTitle: article.title,
        category: rule.category?.slice(0, 4),
        allViolations: allViolations, // 保留所有 violations 用于详情展示
        origin: article.origin,
        risk_level: highestRiskV?.risk_level || 0,
        // 使用最高风险等级的描述和建议
        description: highestRiskV?.description || '',
        suggestion: highestRiskV?.suggestion || []
      })
    })
  })
  return violations
})

const sortedViolations = computed(() => {
  return flattenedViolations.value
    .filter(
      v => currentFilter.value === null || v.risk_level === currentFilter.value
    )
    .sort(
      (a, b) =>
        (riskWeightMap[b.risk_level] ?? 0) - (riskWeightMap[a.risk_level] ?? 0)
    )
})

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedViolations.value.slice(start, start + pageSize.value)
})

watch(currentFilter, () => {
  currentPage.value = 1
})

const togglePanel = () => {
  isCollapsed.value = !isCollapsed.value
}

// 新增：全屏切换方法
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  emit('fullscreenChange', isFullscreen.value)
}
const goBack = () => {
  emit('goBack')
}

const getRiskIcon = (level: string) => {
  switch (level) {
    case 'high':
      return WarnTriangleFilled
    case 'medium':
      return WarningFilled
    case 'low':
      return InfoFilled
    default:
      return CircleCheckFilled
  }
}

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

const getRiskText = (level: string) => {
  switch (level) {
    case 'high':
      return '重大问题'
    case 'medium':
      return '一般问题'
    case 'low':
      return '轻微问题'
    default:
      return '审查通过'
  }
}

const getCategoryType = (category: string) => {
  const map: Record<string, any> = { 设计说明: 'primary', 设计图纸: 'danger' }
  return map[category] || 'info'
}

const handleRowClick = (row: any) => {
  selectedDetailRow.value = row
  // 根据风险等级判断详情类型
  detailType.value = row.risk_level === 0 ? 'passed' : 'violation'
  // 切换至详情视图
  currentView.value = 'detail'
}

const handleSelectionChange = (val: any[]) => {
  selection.value = val
}

const handleLocate = (row: any) => {
  emit('locate', { ...row, noWriteRect: true })
}

const handleLocateFromDetail = (row: any) => {
  emit('locate', row)
}

const handleBatchSend = () => {
  console.log('批量发送:', selection.value)
}
const exportReport = async () => {
  const rawData =
    selection.value.length > 0 ? selection.value : sortedViolations.value

  if (rawData.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  const groupedData = rawData.reduce(
    (acc, item) => {
      const key = item.articleId
      if (!acc[key]) {
        acc[key] = { ...item, allViolations: [] }
      }
      if (item.allViolations?.length) {
        acc[key].allViolations.push(...item.allViolations)
      }
      return acc
    },
    {} as Record<string, any>
  )
  const riskOrder = { high: 3, medium: 2, low: 1, 0: 0 }

  const dataToExport = Object.values(groupedData)
    .map((group: any) => {
      const descriptions = group.allViolations
        .filter((v: any) => v.description)
        .map((v: any, index: number) => `${index + 1}. ${v.description}`)

      const suggestions: string[] = []
      group.allViolations.forEach((v: any, vIndex: number) => {
        if (v.suggestion?.length) {
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
    .sort(
      (a, b) =>
        riskOrder[b.risk_level as keyof typeof riskOrder] -
        riskOrder[a.risk_level as keyof typeof riskOrder]
    )

  try {
    const loading = ElMessage({
      message: '正在生成报告...',
      type: 'info',
      duration: 0
    })
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'AI审图系统'
    workbook.created = new Date()

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

    const mainSheet = workbook.addWorksheet(
      `${props.projectName || '项目'}_审查报告`,
      { views: [{ showGridLines: true }] }
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

      const descLines = (item.description.match(/\n/g) || []).length + 1
      const sugLines = (item.suggestion.match(/\n/g) || []).length + 1
      row.height = Math.max(
        18,
        Math.min(Math.max(descLines, sugLines) * 14, 80)
      )
    })

    mainSheet.getRow(1).eachCell((cell: any) => {
      cell.style = headerStyle
    })
    mainSheet.getRow(1).height = 25

    const riskLevels = [
      { level: 'high', name: '重大问题', color: 'FFDC3545' },
      { level: 'medium', name: '一般问题', color: 'FFD17706' },
      { level: 'low', name: '轻微问题', color: 'FF28A745' },
      { level: 0, name: '审查完成', color: 'FF17A2B8' }
    ]

    for (const { level, name, color } of riskLevels) {
      const levelData = dataToExport.filter(item => item.risk_level === level)
      if (levelData.length > 0) {
        const sheet = workbook.addWorksheet(
          `${props.projectName || '项目'}_${name}`,
          { views: [{ showGridLines: true }] }
        )
        sheet.columns = mainSheet.columns
        levelData.forEach((item, index) => {
          const row = sheet.addRow({
            index: index + 1,
            riskLevel: getRiskText(item.risk_level),
            category: item.category,
            articleTitle: item.articleTitle,
            description: item.description,
            suggestion: item.suggestion,
            origin: item.origin
          })
          const isEvenRow = sheet.rowCount % 2 === 0
          row.eachCell((cell: any, colNumber: number) => {
            cell.style = isEvenRow
              ? [1, 2, 3, 7].includes(colNumber)
                ? stripeCenterStyle
                : stripeStyle
              : [1, 2, 3, 7].includes(colNumber)
                ? centerCellStyle
                : cellStyle
          })
          const descLines = (item.description.match(/\n/g) || []).length + 1
          const sugLines = (item.suggestion.match(/\n/g) || []).length + 1
          row.height = Math.max(
            18,
            Math.min(Math.max(descLines, sugLines) * 14, 80)
          )
        })
        sheet.getRow(1).eachCell((cell: any) => {
          cell.style = {
            ...headerStyle,
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: color }
            }
          }
        })
        sheet.getRow(1).height = 25
      }
    }

    const timestamp = new Date()
      .toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      .replace(/[/:]/g, '-')

    const fileName = `${props.projectName || '项目'}_审查报告_${timestamp}.xlsx`
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
          selection.value = []
          exportReport()
        }
      })
  } else {
    exportReport()
  }
}

// 反馈相关状态
const feedbackDialogVisible = ref(false)
const currentFeedbackRow = ref<any>(null)
const feedbackOption = ref('')
const feedbackComment = ref('')
const isSubmittingFeedback = ref(false)
// 打开反馈弹窗
const openFeedbackDialog = (row: any) => {
  currentFeedbackRow.value = row
  feedbackOption.value = ''
  feedbackComment.value = ''
  feedbackDialogVisible.value = true
}

// 提交点踩的详细反馈
const submitFeedback = async () => {
  if (!feedbackOption.value) {
    ElMessage.warning('请选择一个反馈选项')
    return
  }

  isSubmittingFeedback.value = true
  try {
    // 更新当前行的反馈状态
    if (currentFeedbackRow.value) {
      currentFeedbackRow.value.userFeedback = 'dislike'
    }

    // 模拟API调用
    console.log('提交详细反馈:', {
      row: currentFeedbackRow.value,
      option: feedbackOption.value,
      comment: feedbackComment.value
    })

    // 在实际应用中，替换为真实的API调用
    // await apiSubmitFeedback({
    //   violationId: currentFeedbackRow.value.violation_id,
    //   feedbackType: 'dislike',
    //   option: feedbackOption.value,
    //   comment: feedbackComment.value
    // })

    ElMessage.success('反馈提交成功，感谢您的意见！')
    feedbackDialogVisible.value = false
  } catch (error) {
    console.error('提交反馈失败:', error)
    ElMessage.error('反馈提交失败，请重试')
  } finally {
    isSubmittingFeedback.value = false
  }
}

const currentView = ref<'list' | 'detail'>('list') // 当前视图模式
const selectedDetailRow = ref<any>(null) // 当前选中的详情数据
const detailType = ref<'violation' | 'passed'>('violation') // 当前详情类型

// 返回列表
const handleBackToList = () => {
  currentView.value = 'list'
  selectedDetailRow.value = null
}
</script>

<style scoped lang="scss">
/* 审查报告侧边栏 */
.regulation-panel {
  box-sizing: border-box;
  padding: 0 6px;
  width: 60%;
  background: #ffffff;
  border-left: 1px solid #e8e8e8;
  display: flex;
  transition: all 0.3s ease;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
  flex-shrink: 0; /* 防止侧边栏被压缩 */
  position: relative;
}

.regulation-panel.isdetail {
  width: 50%;
}
.regulation-panel.collapsed {
  width: 0;
  border-left: none;
  overflow: visible; /* 确保按钮可见 */
}
.regulation-panel.fullscreen {
  width: 100%;
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
  transform: translateY(-50%); /* 旋转图标方向 */
}

/* 侧边栏内容 */
.panel-main-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  width: 100%;
  .list-view,
  .detail-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .detail-view-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-light);
    flex-shrink: 0;
    .detail-title {
      margin-left: 12px;
      font-weight: 600;
      font-size: 16px;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .detail-view-body {
    flex: 1;
    overflow: hidden;
  }

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
      background-color: #eceef2 !important;
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
  flex-wrap: wrap;
  border-bottom: 1px solid var(--color-gray-200);
  padding-bottom: 10px;
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

// 筛选标签容器
.violation-filters {
  padding: 12px 0;
  background: var(--color-white);
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;

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
