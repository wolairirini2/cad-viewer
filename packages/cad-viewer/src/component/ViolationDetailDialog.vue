<template>
  <el-dialog
    v-model="visible"
    title="审查内容详情"
    width="900px"
    class="violation-detail-dialog-wrapper"
    :style="{ maxHeight: '85vh' }"
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
        <h4>计算过程</h4>
        <div class="detail-content formula-content">
          <div
            v-for="(step, index) in calculationSteps"
            :key="index"
            class="formula-step"
          >
            <div class="formula-step-title">
              <span class="step-number">{{ index + 1 }}.</span>
              {{ step.title }}
            </div>
            <div
              class="formula-latex"
              v-html="renderFormula(step.formula)"
            ></div>
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
            <el-descriptions-item label="高压侧母线短路电流">
              <span class="highlight-value">{{
                reviewTrace.calculation_result.hv_bus_Isc_ka?.toFixed(2)
              }}</span>
              kA
            </el-descriptions-item>
            <el-descriptions-item label="低压侧母线短路电流">
              <span class="highlight-value">{{
                reviewTrace.calculation_result.lv_bus_Isc_ka?.toFixed(2)
              }}</span>
              kA
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

      <!-- 问题描述 -->
      <div class="detail-section" v-if="descriptions.length">
        <h4>问题描述</h4>
        <div class="detail-content description-content">
          <div
            v-for="(desc, index) in descriptions"
            :key="index"
            class="description-item"
          >
            <span class="item-number">{{ index + 1 }}.</span>
            <span class="item-content" v-html="desc"></span>
          </div>
        </div>
      </div>

      <!-- 修改建议 -->
      <div class="detail-section" v-if="suggestions.length">
        <h4>修改建议</h4>
        <div class="detail-content suggestion">
          <ol class="suggestion-ol">
            <li v-for="(sug, index) in suggestions" :key="index">{{ sug }}</li>
          </ol>
        </div>
      </div>

      <!-- 相关规范条文 -->
      <div class="detail-section">
        <h4>相关规范条文</h4>
        <div class="related-article">
          <div class="article-content">
            {{ data.origin || '未找到条文信息' }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button type="primary" @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'

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
}>()

const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

// 提取参数映射表
const extractedParamsMap = {
  system_short_circuit_capacity_mva: '系统短路容量',
  base_capacity_mva: '基准容量',
  hv_base_voltage_kv: '高压侧基准电压',
  lv_base_voltage_kv: '低压侧基准电压',
  overhead_line_length_km: '架空线长度',
  overhead_line_unit_reactance_ohm_per_km: '架空线单位电抗',
  cable_length_km: '电缆长度',
  cable_unit_reactance_ohm_per_km: '电缆单位电抗',
  transformer_capacity_mva: '变压器容量',
  transformer_impedance_percent: '变压器短路阻抗百分比'
}

// 计算详情映射表
const calculationDetailsMap = {
  Zj_hv: '高压侧基准阻抗',
  Ij_hv: '高压侧基准电流',
  Zj_lv: '低压侧基准阻抗',
  Ij_lv: '低压侧基准电流',
  X_sys_star: '系统标幺电抗',
  X_line_star: '线路标幺电抗',
  X_line_ohm: '线路有名电抗',
  X_transformer_star: '变压器标幺电抗',
  X_total_hv_star: '高压侧总电抗',
  X_total_lv_star: '低压侧总电抗'
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

// 格式化提取参数的值和单位
const formatValue = (value: any, key: string): string => {
  if (value === undefined || value === null) return '-'

  // 根据字段添加单位
  if (key.includes('capacity') || key.includes('mva')) {
    return `${value} MVA`
  } else if (key.includes('voltage') || key.includes('kv')) {
    return `${value} kV`
  } else if (key.includes('length') || key.includes('km')) {
    return `${value} km`
  } else if (key.includes('reactance') && key.includes('ohm')) {
    if (key.includes('unit')) {
      return `${value} Ω/km`
    }
    return `${value} Ω`
  } else if (key.includes('percent')) {
    return `${value}%`
  }

  return value.toString()
}

// 格式化计算详情数值
const formatCalcDetail = (value: number | undefined): string => {
  if (value === undefined || value === null) return '-'
  // 保留4位小数，去除末尾的0
  return value.toFixed(4).replace(/\.?0+$/, '')
}

const descriptions = computed(() => {
  if (!props.data?.allViolations) return []
  return props.data.allViolations
    .filter((v: any) => v.description)
    .map((v: any) => v.description)
})

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
</script>

<style scoped>
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
}

.formula-step {
  border-radius: 6px;
  padding: 12px 16px;
  border-left: 3px solid #409eff;
  display: flex;
}

.formula-step-title {
  font-size: 14px;  
  font-weight: 600;
  color: #262626;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-number {
  color: #409eff;
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
</style>
