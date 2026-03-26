<template>
  <el-dialog
    v-model="visible"
    title="审查内容详情"
    width="1100px"
    class="violation-detail-dialog-wrapper"
    draggable
  >
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

      <!-- 提取参数 -->
      <div class="detail-section" v-if="reviewTrace?.extracted_parameters">
        <h4>提取参数</h4>
        <div class="detail-content">
          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item
              v-for="(label, key) in extractedParamsMap"
              :key="key"
              :label="label"
            >
              {{ formatValue(reviewTrace.extracted_parameters[key], key) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <!-- 计算公式 (新增) -->
      <div class="detail-section" v-if="calculationSteps.length">
        <div class="section-header">
          <h4>计算过程</h4>
          <el-button
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
              calculationSteps.length > MAX_COLLAPSED_STEPS
            "
            class="collapse-hint"
          >
            <span class="hint-text"
              >还有
              {{ calculationSteps.length - MAX_COLLAPSED_STEPS }}
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
      <div class="detail-section" v-if="reviewTrace?.calculation_result">
        <h4>计算结果</h4>
        <div class="detail-content">
          <!-- 主要计算结果 -->
          <el-descriptions
            :column="2"
            size="small"
            border
            class="calc-result-main"
          >
            <el-descriptions-item label="高压侧母线短路电流(kA)">
              <span class="highlight-value">{{
                reviewTrace.calculation_result.hv_bus_Isc_ka?.toFixed(2)
              }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="低压侧母线短路电流(kA)">
              <span class="highlight-value">{{
                reviewTrace.calculation_result.lv_bus_Isc_ka?.toFixed(2)
              }}</span>
            </el-descriptions-item>
          </el-descriptions>

          <!-- 详细计算过程 -->
          <div class="calc-details-title">详细计算参数</div>
          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item
              v-for="(label, key) in calculationDetailsMap"
              :key="key"
              :label="label"
            >
              {{
                formatCalcDetail(
                  reviewTrace.calculation_result.calculation_details?.[key]
                )
              }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <!-- 设备材料清册和电气主接线图对比 -->
      <div class="detail-section" v-if="reviewTrace?.comparison_groups">
        <h4>设备材料清册和电气主接线图对比</h4>
        <el-table
          :data="flattenedData"
          :span-method="objectSpanMethod"
          border
          stripe
          style="width: 100%"
        >
          <!-- 设备名称列 -->
          <el-table-column
            prop="equipment_name"
            label="设备名称"
            min-width="140"
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
                  {{ row.equipment_list_model }}
                </div>
              </el-tooltip>
            </template>
          </el-table-column>

          <!-- 图纸型号列 - 使用自定义 tooltip -->
          <el-table-column label="图纸型号" min-width="200">
            <template #default="{ row }">
              <el-tooltip
                :content="row.diagram_model || '-'"
                placement="top"
                :disabled="!isOverflow(row.diagram_model, 200)"
              >
                <div class="multiline-text ellipsis-text">
                  {{ row.diagram_model || '-' }}
                </div>
              </el-tooltip>
            </template>
          </el-table-column>

          <!-- 型号匹配列 -->
          <el-table-column
            prop="model_matched"
            label="型号匹配"
            width="100"
            align="center"
          >
            <template #default="{ row }">
              <el-tag
                :type="row.model_matched ? 'success' : 'danger'"
                size="small"
              >
                {{ row.model_matched ? '匹配' : '不匹配' }}
              </el-tag>
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
          <el-table-column
            prop="result"
            label="结果"
            width="120"
            align="center"
          >
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
          <el-table-column
            label="操作"
            width="100"
            align="center"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button
                v-if="
                  row.diagram_world_bboxes &&
                  row.diagram_world_bboxes.length > 0
                "
                type="info"
                plain
                size="small"
                @click="handleLocate(row)"
              >
                定位
              </el-button>
              <span v-else class="no-action">-</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <!-- 文档专有详情 -->
      <template v-else>
        <!-- 问题描述 -->
        <div class="detail-section" v-if="descriptions.length">
          <h4>问题描述</h4>
          <div class="detail-content description-content">
            <div
              v-for="(desc, index) in descriptions"
              :key="index"
              class="description-item"
            >
              <span class="item-number">{{ +index + 1 }}.</span>
              <span class="item-content" v-html="desc.text"></span>
              <el-button
                v-if="data.category == '设备材料'"
                type="text"
                @click="handleLocate(desc.violation)"
                icon="Location"
              >
              </el-button>
            </div>
          </div>
        </div>

        <!-- 修改建议 -->
        <div class="detail-section" v-if="suggestions.length">
          <h4>修改建议</h4>
          <div class="detail-content suggestion">
            <ol class="suggestion-ol">
              <li v-for="(sug, index) in suggestions" :key="index">
                {{ sug }}
              </li>
            </ol>
          </div>
        </div>

        <!-- 相关规范条文 -->
        <div class="detail-section" v-if="data.origin">
          <h4>相关规范条文</h4>
          <div class="related-article">
            <div class="article-content">
              {{ data.origin || '未找到条文信息' }}
            </div>
          </div>
        </div>
      </template>
    </div>

    <template #footer>
      <el-button type="primary" @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { ArrowDown } from '@element-plus/icons-vue'

interface Props {
  modelValue: boolean
  data: any
}

interface CalculationStep {
  title: string
  formula: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'locate', violation: any): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

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
    calculationSteps.value.length <= MAX_COLLAPSED_STEPS
  ) {
    return calculationSteps.value
  }
  return calculationSteps.value.slice(0, MAX_COLLAPSED_STEPS)
})

// 获取步骤编号（考虑折叠状态）
const getStepNumber = (index: number) => {
  if (isCalculationStepsExpanded.value) {
    return index + 1
  }
  // 折叠时，如果步骤数超过最大折叠步骤数，显示实际编号
  if (calculationSteps.value.length > MAX_COLLAPSED_STEPS) {
    return index + 1
  }
  return index + 1
}

// 提取参数映射表
const extractedParamsMap = {
  upstream_short_circuit_capacity_mva: '上级系统短路容量 (MVA)',
  upstream_main_transformer_capacity_mva: '上级系统主变容量 (MVA)',
  upstream_main_transformer_impedance_percent: '上级系统主变短路阻抗百分比 (%)',
  base_capacity_mva: '基准容量 (MVA)',
  hv_base_voltage_kv: '高压侧基准电压 (kV)',
  lv_base_voltage_kv: '低压侧基准电压 (kV)',
  overhead_line_length_km: '架空线长度 (km)',
  overhead_line_unit_reactance_ohm_per_km: '架空线单位电抗 (Ω/km)',
  cable_length_km: '电缆长度 (km)',
  cable_unit_reactance_ohm_per_km: '电缆单位电抗 (Ω/km)',
  transformer_capacity_mva: '变压器容量 (MVA)',
  transformer_impedance_percent: '变压器短路阻抗百分比 (%)'
}

// 计算详情映射表
const calculationDetailsMap = {
  Zj_hv: '高压侧基准电抗 (Ω)',
  Ij_hv: '高压侧基准电流 (kA)',
  Zj_lv: '低压侧基准电抗 (Ω)',
  Ij_lv: '低压侧基准电流 (kA)',
  X_sys_star: '系统标幺电抗',
  X_line_star: '线路标幺电抗',
  X_line_ohm: '线路有名电抗 (Ω)',
  X_transformer_star: '变压器标幺电抗',
  X_total_hv_star: '高压侧总标幺电抗',
  X_total_lv_star: '低压侧总标幺电抗'
}

// 获取第一条violation的review_trace（所有条目一致）
const reviewTrace = computed(() => {
  if (!props.data?.allViolations?.length) return null
  return props.data.allViolations[0]?.review_trace || null
})

// 计算步骤列表
const calculationSteps = computed<CalculationStep[]>(() => {
  return reviewTrace.value?.calculation_result?.calculation_steps || []
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
const formatValue = (value: any, key: string): string => {
  if (value === undefined || value === null) return '-'
  if (
    reviewTrace.value.defaults_applied &&
    reviewTrace.value.defaults_applied[key]
  ) {
    return `${value.toString()} (根据工程经验取典型值)`
  }
  return value.toString()
}

// 格式化计算详情数值
const formatCalcDetail = (value: number | undefined): string => {
  if (value === undefined || value === null) return '-'
  // 保留4位小数，去除末尾的0
  return value.toFixed(4).replace(/\.?0+$/, '')
}

// 处理定位点击
const handleLocate = (rowOrViolation: any) => {
  const diagramWorldBboxes = rowOrViolation.diagram_world_bboxes

  if (!diagramWorldBboxes || diagramWorldBboxes.length === 0) return

  // 将多组 bbox 转换为 extents 数组
  const extentsArray = diagramWorldBboxes.map((bbox: number[]) => ({
    min_point: { x: bbox[0], y: bbox[1] },
    max_point: { x: bbox[2], y: bbox[3] }
  }))

  // 构建定位数据对象
  const locateData = {
    geometry_ref: {
      file_id: props.data?.allViolations?.[0]?.geometry_ref?.file_id,
      extents: extentsArray[0], // 第一个用于缩放定位
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
    low: '轻微问题'
  }
  return map[level] || level
}

const getCategoryType = (category: string) => {
  const map: Record<string, any> = { 设计说明: 'primary', 设计图纸: 'danger' }
  return map[category] || 'info'
}

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
    型号不匹配: 'danger',
    匹配成功: 'success',
    一致: 'success'
  }
  return typeMap[result] || 'info'
}

const suggestions = computed(() => {
  if (!props.data?.allViolations) return []
  const result: string[] = []
  props.data.allViolations.forEach((v: any) => {
    if (v.suggestion?.length) {
      result.push(...v.suggestion)
    }
  })
  return result
})

// 修改 descriptions 计算属性，保留完整的 violation 数据
const descriptions = computed(() => {
  if (!props.data?.allViolations) return []
  return props.data.allViolations
    .filter((v: any) => v.description)
    .map((v: any) => ({
      text: v.description,
      violation: v
    }))
})

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
  max-height: calc(85vh - 120px);
  overflow-y: auto;
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

.description-item {
  display: flex;
  margin-bottom: 8px;
  line-height: 1.6;
}

.item-number {
  flex-shrink: 0;
  font-weight: 500;
  margin-right: 8px;
}

.item-content {
  flex: 1;
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
  padding: 4px 0;
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

.ellipsis-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
</style>
