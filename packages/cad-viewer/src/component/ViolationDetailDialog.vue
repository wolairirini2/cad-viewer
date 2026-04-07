<template>
  <div v-if="data" class="violation-detail-dialog">
    <!-- 基本信息 -->
    <div class="detail-section">
      <div class="detail-row">
        <span class="detail-label">检查内容:</span>
        <span>{{ data.articleTitle }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">风险等级:</span>
        <el-tag
          :type="getRiskTagType(data.risk_level)"
          style="font-weight: bold"
        >
          {{ getRiskText(data.risk_level) }}
        </el-tag>
      </div>
      <div class="detail-row">
        <span class="detail-label">问题来源:</span>
        <el-tag
          :type="getCategoryType(data.category)"
          style="font-weight: bold"
        >
          {{ data.category }}
        </el-tag>
      </div>
    </div>

    <!-- 设备材料清册和电气主接线图对比 -->
    <div
      class="detail-section compare-table"
      v-if="reviewTrace?.comparison_groups"
    >
      <h4>设备材料清册和电气主接线图对比</h4>
      <el-table
        :data="flattenedData"
        :span-method="objectSpanMethod"
        border
        stripe
        style="width: 100%"
        height="100%"
      >
        <!-- 设备名称列 -->
        <el-table-column
          prop="equipment_name"
          label="设备名称"
          min-width="100"
          align="center"
        />

        <!-- 清册型号列 - 使用自定义 tooltip -->
        <el-table-column label="清册型号" min-width="200">
          <template #default="{ row }">
            <el-tooltip
              :content="row.equipment_list_model"
              placement="top"
              :disabled="!isOverflow(row.equipment_list_model, 200)"
            >
              <div class="multiline-text ellipsis-text">
                {{ row.equipment_list_model || '无' }}
              </div>
            </el-tooltip>
          </template>
        </el-table-column>

        <!-- 图纸型号列 - 使用自定义 tooltip -->
        <el-table-column label="图纸型号" min-width="200">
          <template #default="{ row }">
            <el-tooltip
              :content="row.diagram_model"
              placement="top"
              :disabled="!isOverflow(row.diagram_model, 200)"
            >
              <div class="multiline-text ellipsis-text">
                {{ row.diagram_model || '无' }}
              </div>
            </el-tooltip>
          </template>
        </el-table-column>

        <!-- 清册数量列 -->
        <el-table-column
          prop="equipment_list_count"
          label="清册数量"
          width="80"
          align="center"
        />

        <!-- 图纸数量列 -->
        <el-table-column
          prop="diagram_count"
          label="图纸数量"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            {{ row.diagram_count || 0 }}
          </template>
        </el-table-column>

        <!-- 结果列 -->
        <el-table-column prop="result" label="结果" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getResultType(row.result)"
              size="small"
              effect="light"
            >
              {{ row.result }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              :disabled="
                !row.diagram_world_bboxes ||
                row.diagram_world_bboxes?.length == 0
              "
              type="info"
              plain
              size="small"
              @click="handleLocate(row)"
            >
              定位
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template v-else>
      <!-- 违规项列表表格 -->
      <div class="detail-section" v-if="allViolationsList.length > 0">
        <h4>问题列表</h4>
        <div class="violation-list-table">
          <el-table
            ref="violationTableRef"
            :data="allViolationsList"
            highlight-current-row
            @current-change="handleCurrentChange"
            border
            stripe
            size="small"
          >
            <el-table-column
              type="index"
              label="序号"
              width="50"
              align="center"
            />
            <el-table-column
              prop="risk_level"
              label="风险等级"
              width="90"
              align="center"
              :show-overflow-tooltip="false"
            >
              <template #default="{ row }">
                <el-tag :type="getRiskTagType(row.risk_level)" size="small">
                  {{ getRiskText(row.risk_level) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="description"
              label="问题描述"
              min-width="200"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                <span v-if="row.description">{{ row.description }}</span>
                <span v-else style="color: #999">-</span>
              </template>
            </el-table-column>
            <el-table-column
              label="操作"
              width="80"
              align="center"
              fixed="right"
            >
              <template #default="{ row }">
                <el-button
                  :disabled="!row.geometry_ref?.extents && row.risk_level === 0"
                  type="info"
                  plain
                  size="small"
                  @click.stop="handleWordLocate(row)"
                >
                  定位
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 选中条目的详细信息 -->
      <div v-if="selectedViolation" class="selected-detail-section">
        <!-- 提取参数 -->
        <div
          class="detail-section"
          v-if="selectedViolationReviewTrace?.extracted_parameters"
        >
          <h4>提取参数</h4>
          <div class="detail-content">
            <el-descriptions :column="2" size="small" border>
              <el-descriptions-item
                v-for="(label, key) in selectedExtractedParamsMap"
                :key="key"
                :label="label"
              >
                {{
                  formatValue(
                    selectedViolationReviewTrace.extracted_parameters[key],
                    key
                  )
                }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>

        <!-- 计算公式 -->
        <div class="detail-section" v-if="selectedCalculationSteps.length">
          <div class="section-header">
            <h4>计算过程</h4>
            <el-button
              v-if="selectedCalculationSteps.length > MAX_COLLAPSED_STEPS"
              type="text"
              size="small"
              @click="toggleCalculationSteps"
              class="toggle-btn"
            >
              {{ isCalculationStepsExpanded ? '折叠' : '展开' }}
              <el-icon :class="{ 'rotate-icon': isCalculationStepsExpanded }">
                <ArrowDown />
              </el-icon>
            </el-button>
          </div>
          <div
            class="detail-content formula-content"
            :class="{ collapsed: !isCalculationStepsExpanded }"
          >
            <div
              v-for="(step, index) in displayCalculationSteps"
              :key="index"
              class="formula-step"
            >
              <div class="formula-step-title">
                <span class="step-number">({{ getStepNumber(index) }})</span>
                {{ step.title }}
              </div>
              <div
                class="formula-latex"
                v-html="renderFormula(step.formula)"
              ></div>
            </div>

            <!-- 折叠时的提示 -->
            <div
              v-if="
                !isCalculationStepsExpanded &&
                selectedCalculationSteps.length > MAX_COLLAPSED_STEPS
              "
              class="collapse-hint"
            >
              <span class="hint-text"
                >还有
                {{ selectedCalculationSteps.length - MAX_COLLAPSED_STEPS }}
                个计算步骤</span
              >
              <el-button
                type="text"
                size="small"
                @click="expandCalculationSteps"
                class="expand-btn"
              >
                点击展开查看全部
              </el-button>
            </div>
          </div>
        </div>

        <!-- 计算结果 -->
        <div
          class="detail-section"
          v-if="
            selectedViolationReviewTrace?.calculation_result
              ?.calculation_data_map
          "
        >
          <h4>计算结果</h4>
          <div class="detail-content">
            <!-- 主要计算结果 -->
            <el-descriptions
              :column="2"
              size="small"
              border
              class="calc-result-main"
            >
              <el-descriptions-item
                v-for="(label, key) in selectedCalculationDataMap"
                :key="key"
                :label="label"
              >
                {{
                  formatCalcDetail(
                    selectedViolationReviewTrace.calculation_result
                      .calculation_data?.[key],
                    2
                  )
                }}
              </el-descriptions-item>
            </el-descriptions>
            <template
              v-if="
                selectedViolationReviewTrace?.calculation_result
                  ?.calculation_details_map
              "
            >
            </template>
            <!-- 详细计算过程 -->
            <div class="calc-details-title">详细计算参数</div>
            <el-descriptions :column="2" size="small" border>
              <el-descriptions-item
                v-for="(label, key) in selectedCalculationDetailsMap"
                :key="key"
                :label="label"
              >
                {{
                  formatCalcDetail(
                    selectedViolationReviewTrace.calculation_result
                      .calculation_details?.[key]
                  )
                }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>

        <!-- 修改建议 - 仅显示选中条目的 -->
        <div
          class="detail-section"
          v-if="selectedViolation?.suggestion?.length"
        >
          <h4>修改建议</h4>
          <div class="detail-content suggestion">
            <ol class="suggestion-ol">
              <li
                v-for="(sug, index) in selectedViolation.suggestion"
                :key="index"
              >
                {{ sug }}
              </li>
            </ol>
          </div>
        </div>

        <!-- 相关规范条文 - 使用 article 级别的 origin -->
        <div class="detail-section" v-if="data.origin">
          <h4>相关规范条文</h4>
          <div class="related-article">
            <div class="article-content">
              {{ data.origin || '未找到条文信息' }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { ArrowDown } from '@element-plus/icons-vue'

interface Props {
  data: any
}

interface CalculationStep {
  title: string
  formula: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'locate', violation: any): void
}>()

// 表格引用
const violationTableRef = ref<any>(null)

// 当前选中的 violation
const selectedViolation = ref<any>(null)

// 折叠/展开状态
const isCalculationStepsExpanded = ref(false)
const MAX_COLLAPSED_STEPS = 3 // 折叠时显示的最大步骤数

// 切换折叠/展开状态
const toggleCalculationSteps = () => {
  isCalculationStepsExpanded.value = !isCalculationStepsExpanded.value
}

// 直接展开
const expandCalculationSteps = () => {
  isCalculationStepsExpanded.value = true
}

// 根据折叠状态显示的计算步骤
const displayCalculationSteps = computed(() => {
  if (
    isCalculationStepsExpanded.value ||
    selectedCalculationSteps.value.length <= MAX_COLLAPSED_STEPS
  ) {
    return selectedCalculationSteps.value
  }
  return selectedCalculationSteps.value.slice(0, MAX_COLLAPSED_STEPS)
})

// 获取步骤编号（考虑折叠状态）
const getStepNumber = (index: number) => {
  if (isCalculationStepsExpanded.value) {
    return index + 1
  }
  // 折叠时，如果步骤数超过最大折叠步骤数，显示实际编号
  if (selectedCalculationSteps.value.length > MAX_COLLAPSED_STEPS) {
    return index + 1
  }
  return index + 1
}

// 所有 violations 列表（用于表格显示）
const allViolationsList = computed(() => {
  return props.data?.allViolations || []
})

// 监听数据变化，默认选中第一个
watch(
  () => props.data?.allViolations,
  newVal => {
    if (newVal && newVal.length > 0) {
      nextTick(() => {
        selectedViolation.value = newVal[0]
        violationTableRef.value?.setCurrentRow(newVal[0])
      })
    } else {
      selectedViolation.value = null
    }
  },
  { immediate: true }
)

// 处理表格行变化
const handleCurrentChange = (row: any) => {
  if (row) {
    selectedViolation.value = row
  }
}

// 获取选中条目的 review_trace
const selectedViolationReviewTrace = computed(() => {
  return selectedViolation.value?.review_trace || null
})

// 获取选中条目的 param_key_map
const selectedParamKeyMap = computed(() => {
  return selectedViolation.value?.param_key_map || null
})

// 选中条目的提取参数映射表
const selectedExtractedParamsMap = computed(() => {
  let result: { [key: string]: string } = {}
  if (selectedParamKeyMap.value?.extracted_parameters_map) {
    result = selectedParamKeyMap.value.extracted_parameters_map
    if (Object.keys(result).length % 2 !== 0) {
      result[''] = ''
    }
  }
  return result
})

// 选中条目的计算数据映射表
const selectedCalculationDataMap = computed(() => {
  let result: { [key: string]: string } = {}
  if (selectedParamKeyMap.value?.calculation_data_map) {
    result = selectedParamKeyMap.value.calculation_data_map
    if (Object.keys(result).length % 2 !== 0) {
      result[''] = ''
    }
  }
  return result
})

// 选中条目的计算详情映射表
const selectedCalculationDetailsMap = computed(() => {
  let result: { [key: string]: string } = {}
  if (selectedParamKeyMap.value?.calculation_details_map) {
    result = selectedParamKeyMap.value.calculation_details_map
    if (Object.keys(result).length % 2 !== 0) {
      result[''] = ''
    }
  }
  return result
})

// 选中条目的计算步骤列表
const selectedCalculationSteps = computed<CalculationStep[]>(() => {
  return (
    selectedViolationReviewTrace.value?.calculation_result?.calculation_steps ||
    []
  )
})

// 渲染 LaTeX 公式
const renderFormula = (formula: string): string => {
  try {
    // 移除 $$ 包裹符号并清理
    const cleanFormula = formula.replace(/^\$\$|\$\$/g, '').trim()

    if (!cleanFormula) return ''

    return katex.renderToString(cleanFormula, {
      throwOnError: false,
      displayMode: true,
      strict: false
    })
  } catch (error) {
    console.warn('KaTeX 渲染失败:', error)
    // 失败时返回原始文本（移除 $$）
    return formula.replace(/^\$\$|\$\$/g, '').trim()
  }
}

// 格式化提取参数的值（现在只返回纯数值，单位已在名称中）
const formatValue = (value: any, key: string | number): string => {
  if (value === undefined || value === null) return ''
  if (
    selectedViolationReviewTrace.value?.defaults_applied &&
    selectedViolationReviewTrace.value.defaults_applied[key]
  ) {
    return `${value.toString()} (根据工程经验取典型值)`
  }
  return value.toString()
}

// 格式化计算详情数值
const formatCalcDetail = (
  value: number | undefined,
  fixed: number = 4
): string => {
  if (value === undefined || value === null) return ''
  if (typeof value === 'number') {
    // 保留4位小数，去除末尾的0
    return value.toFixed(fixed).replace(/\.?0+$/, '')
  }
  if (typeof value === 'boolean') {
    return value ? '是' : '否'
  }
  return value
}
const handleWordLocate = (row: any) => {
  emit('locate', { ...row, category: '设计说明' })
  console.log('handleWordLocate', { ...row, category: '设计说明' })
}
// 处理定位点击
const handleLocate = (rowOrViolation: any) => {
  const diagramWorldBboxes = rowOrViolation.diagram_world_bboxes
  const extents = rowOrViolation.extents || rowOrViolation.geometry_ref?.extents

  if (!diagramWorldBboxes || diagramWorldBboxes.length === 0) {
    // 如果没有 diagram_world_bboxes，尝试使用 geometry_ref.extents
    if (extents) {
      emit('locate', rowOrViolation)
    }
    return
  }

  // 将多组 bbox 转换为 extents 数组
  const extentsArray = diagramWorldBboxes.map((bbox: number[]) => ({
    min_point: { x: bbox[0], y: bbox[1] },
    max_point: { x: bbox[2], y: bbox[3] }
  }))

  // 构建定位数据对象
  const locateData = {
    geometry_ref: {
      file_id:
        rowOrViolation.geometry_ref?.file_id ||
        props.data?.allViolations?.[0]?.geometry_ref?.file_id,
      extents, // 用于缩放定位
      all_extents: extentsArray // 所有区域用于绘制多个方框
    }
  }

  emit('locate', locateData)
}

const getRiskTagType = (level: string) => {
  const map: Record<string, any> = {
    high: 'danger',
    medium: 'warning',
    low: 'success'
  }
  return map[level] || 'info'
}

const getRiskText = (level: string) => {
  const map: Record<string, string> = {
    high: '重大问题',
    medium: '一般问题',
    low: '轻微问题',
    pass: '审查通过'
  }
  return map[level] || level
}

const getCategoryType = (category: string) => {
  const map: Record<string, any> = { 设计说明: 'primary', 设计图纸: 'danger' }
  return map[category] || 'info'
}

// 获取第一条violation的review_trace（用于设备对比表）
const reviewTrace = computed(() => {
  if (!props.data?.allViolations?.length) return null
  return props.data.allViolations[0]?.review_trace || null
})

// 类型定义
interface ComparisonItem {
  result: string
  diagram_count: number
  diagram_model: string
  model_matched: boolean
  equipment_name: string
  diagram_world_bboxes: number[][]
  equipment_list_count: number
  equipment_list_model: string
}

interface ComparisonGroup {
  items: ComparisonItem[]
  equipment_name: string
}

interface FlattenedRow extends ComparisonItem {
  _groupIndex: number
  _rowIndex: number
}

const comparisonGroups = computed<ComparisonGroup[]>(() => {
  if (!props.data?.allViolations?.length) return null
  return props.data.allViolations[0]?.review_trace.comparison_groups || null
})

// 将嵌套数据扁平化
const flattenedData = computed<FlattenedRow[]>(() => {
  const result: FlattenedRow[] = []
  comparisonGroups.value.forEach((group, groupIndex) => {
    group.items.forEach((item, itemIndex) => {
      result.push({
        ...item,
        equipment_name: group.equipment_name, // 使用分组的equipment_name
        _groupIndex: groupIndex,
        _rowIndex: itemIndex
      })
    })
  })

  return result
})

// 计算合并单元格
const spanMap = computed(() => {
  const map = new Map<number, { rowspan: number; colspan: number }>()

  let currentRow = 0
  comparisonGroups.value.forEach(group => {
    const rowCount = group.items.length
    // 该组的设备名称列需要合并
    map.set(currentRow, { rowspan: rowCount, colspan: 1 })
    // 该组的其他行需要隐藏设备名称列
    for (let i = 1; i < rowCount; i++) {
      map.set(currentRow + i, { rowspan: 0, colspan: 0 })
    }
    currentRow += rowCount
  })

  return map
})

// 合并单元格方法
const objectSpanMethod = ({
  rowIndex,
  columnIndex
}: {
  row: FlattenedRow
  column: any
  rowIndex: number
  columnIndex: number
}) => {
  // 只有第一列（设备名称）需要合并
  if (columnIndex === 0) {
    return spanMap.value.get(rowIndex) || { rowspan: 1, colspan: 1 }
  }
  return { rowspan: 1, colspan: 1 }
}

// 根据结果获取标签类型
const getResultType = (result: string): string => {
  const typeMap: Record<string, string> = {
    数量不一致: 'warning',
    图纸缺失: 'danger',
    清册缺失: 'danger',
    型号不匹配: 'danger',
    匹配: 'success',
    一致: 'success'
  }
  return typeMap[result] || 'info'
}

// 判断文本是否溢出
const isOverflow = (text: string, maxWidth: number): boolean => {
  if (!text) return false
  // 创建一个临时元素来测量文本宽度
  const span = document.createElement('span')
  span.style.cssText = `
    position: absolute;
    visibility: hidden;
    white-space: nowrap;
    font-size: 13px;
    font-family: inherit;
  `
  span.textContent = text
  document.body.appendChild(span)
  const width = span.offsetWidth
  document.body.removeChild(span)
  return width > maxWidth
}
</script>

<style scoped lang="scss">
.violation-detail-dialog {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.detail-section {
  padding-bottom: 16px;
  border-bottom: 1px dashed #f0f0f0;
  h4 {
    margin: 12px 0;
  }
  .violation-list-table {
    :deep(.el-table__row) {
      cursor: pointer;
    }
  }
}

.detail-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.selected-detail-section {
}

.compare-table {
  flex: 1;
  overflow: hidden;
  padding-bottom: 100px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.toggle-btn {
  color: #409eff;
  font-size: 13px;
  padding: 2px 6px;
}

.toggle-btn:hover {
  background-color: rgba(64, 158, 255, 0.1);
}

.toggle-btn .el-icon {
  margin-left: 4px;
  transition: transform 0.3s ease;
}

.rotate-icon {
  transform: rotate(180deg);
}

.detail-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  line-height: 1.5;
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
  font-size: 14px;
  /* 提取参数内容区域样式 */
  :deep(.el-descriptions__label) {
    word-break: break-all;
    white-space: nowrap;
  }

  :deep(.el-descriptions__content) {
    width: 50%;
  }
}

.detail-content.suggestion {
  color: var(--color-primary-dark);
  padding: 12px;
  border-radius: 4px;
  border-left: 3px solid var(--color-primary-dark);
  background: #f5f5f5;
}

.suggestion-ol {
  margin: 0;
  padding-left: 20px;
}

.suggestion-ol li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.related-article {
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
  border-left: 2px solid var(--color-success-dark);
}

.article-content {
  font-size: 14px;
  color: #595959;
  line-height: 1.5;
}

/* 新增样式：提取参数和计算结果 */
:deep(.el-descriptions) {
  margin-top: 8px;
}

:deep(.el-descriptions__label) {
  width: 140px;
  min-width: 140px;
  background-color: #f5f7fa !important;
  font-weight: 600;
  color: #606266;
}

:deep(.el-descriptions__content) {
  color: #303133;
  font-weight: 500;
}

.highlight-value {
  color: #409eff;
  font-weight: bold;
  font-size: 16px;
}

.calc-result-main {
  margin-bottom: 16px;
  background-color: #ecf5ff;
  border-radius: 4px;
}

.calc-result-main :deep(.el-descriptions__label) {
  background-color: #d9ecff !important;
  color: #409eff;
  font-weight: 700;
}

.calc-result-main :deep(.el-descriptions__content) {
  background-color: #ecf5ff;
}

.calc-details-title {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin: 16px 0 8px 0;
  padding-left: 8px;
  border-left: 3px solid #909399;
}

/* 计算公式样式 (新增) */
.formula-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: initial;
  transition: max-height 0.3s ease;
  padding-right: 4px;
}

.formula-content.collapsed {
  /* max-height: 300px; */
  overflow-y: hidden;
  position: relative;
}

.formula-step {
  border-radius: 6px;
  padding: 0 16px;
  display: flex;
}

.formula-step-title {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-number {
  font-weight: 700;
  min-width: 20px;
}

.formula-latex {
  flex: 1;
  font-size: 14px;
  overflow-x: auto;
  padding: 8px;
  background: #ffffff;
  border-radius: 4px;
}

/* KaTeX 公式左对齐 */
.formula-latex :deep(.katex-display > .katex) {
  text-align: left;
}
/* KaTeX 渲染后的样式微调 */
.formula-latex :deep(.katex) {
  font-size: 1.1em;
}

.formula-latex :deep(.katex-display) {
  margin: 0;
}

.formula-latex :deep(.katex-html) {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 20px;
}

/* 折叠提示区域 */
.collapse-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.8),
    rgba(245, 247, 250, 0.95)
  );
  border-radius: 4px;
  margin-top: 8px;
  position: relative;
}

.collapse-hint::before {
  content: '';
  position: absolute;
  top: -20px;
  left: 0;
  right: 0;
  height: 20px;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(245, 247, 250, 0.95)
  );
}

.hint-text {
  color: #909399;
  font-size: 13px;
  margin-bottom: 8px;
}

.expand-btn {
  color: #409eff;
  font-weight: 500;
}

.expand-btn:hover {
  color: #66b1ff;
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

/* 高亮选中行样式 */
:deep(.el-table__body tr.current-row > td) {
  background-color: #ecf5ff !important;
}

.ellipsis-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
</style>
