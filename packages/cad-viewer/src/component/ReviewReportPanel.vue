<template>
  <div class="regulation-panel" :class="{ collapsed: isCollapsed }">
    <el-button
      class="panel-toggle-btn"
      :class="{ collapsed: isCollapsed }"
      :icon="isCollapsed ? ArrowRight : ArrowLeft"
      circle
      size="small"
      @click="togglePanel"
      :title="isCollapsed ? '展开报告' : '收起报告'"
    />

    <div class="panel-content" v-if="!isCollapsed">
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
              width="100"
              fixed="right"
              align="center"
            >
              <template #default="{ row }">
                <el-button
                  type="info"
                  size="small"
                  @click.stop="handleLocate(row)"
                  :loading="locating[row.violation_id]"
                  :disabled="!row.geometry_ref?.extents && row.risk_level === 0"
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
  Back
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ExcelJS from 'exceljs'

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
}>()

const isCollapsed = ref(false)
const currentFilter = ref<null | 'high' | 'medium' | 'low'>(null)
const currentPage = ref(1)
const pageSize = ref(20)
const selection = ref<any[]>([])
const locating = ref<Record<string, boolean>>({})

const riskCounts = computed(() => {
  const counts = { high: 0, medium: 0, low: 0 }
  props.reportData?.rules?.forEach((rule: any) => {
    rule.articles?.forEach((article: any) => {
      const v = article.violations?.[0]
      if (v?.risk_level === 'high') counts.high++
      else if (v?.risk_level === 'medium') counts.medium++
      else if (v?.risk_level === 'low') counts.low++
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
      const firstV = article.violations?.[0]
      violations.push({
        ...(firstV || {}),
        ruleName: rule.name,
        ruleCode: rule.code,
        articleId: article.id,
        articleTitle: article.title,
        category: rule.category?.slice(0, 4),
        allViolations: article.violations || [],
        origin: article.origin,
        risk_level: firstV?.risk_level || 0
      })
    })
  })
  return violations
})

const sortedViolations = computed(() => {
  const riskOrder = { high: 3, medium: 2, low: 1, 0: 0 }
  return flattenedViolations.value
    .filter(
      v => currentFilter.value === null || v.risk_level === currentFilter.value
    )
    .sort(
      (a, b) =>
        riskOrder[b.risk_level as keyof typeof riskOrder] -
        riskOrder[a.risk_level as keyof typeof riskOrder]
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

const goBack = () => {
  window.history.back()
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
      return WarningFilled
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
      return level
  }
}

const getCategoryType = (category: string) => {
  const map: Record<string, any> = { 设计说明: 'primary', 设计图纸: 'danger' }
  return map[category] || 'info'
}

const handleRowClick = (row: any) => {
  emit('rowClick', row)
}

const handleSelectionChange = (val: any[]) => {
  selection.value = val
}

const handleLocate = (row: any) => {
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

  const dataToExport = Object.values(groupedData).map((group: any) => {
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
      { level: 'low', name: '轻微问题', color: 'FF28A745' }
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
</script>

<style scoped lang="scss">
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
